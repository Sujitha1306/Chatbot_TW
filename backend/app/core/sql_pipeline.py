import json
import logging
import re
from openai import AzureOpenAI
import pandas as pd

from backend.config.settings import settings
from backend.config.schema import DatabaseSchema
from backend.app.db.clickhouse import ClickHouseConnection

logger = logging.getLogger(__name__)


class SQLGenerationPipeline:
    """
    Two-call LLM pipeline for schema-grounded SQL generation.
    Call 1: Intent classification (fast, cheap, 200 tokens)
    Call 2: SQL generation (schema-grounded, accurate, 800 tokens)
    """

    ROUTER_SYSTEM = """You are a message router for a hospital operations
analytics chatbot. Classify the user's message into ONE category.
Return ONLY valid JSON, no markdown."""

    PLANNER_SYSTEM = """You are a senior data analyst planning how to answer
a hospital operations question. You will be given the database schema
and a question. Think through HOW to answer it, then output your plan
as JSON.

Your plan should be SPECIFIC to THIS question — do not force it into
generic categories. If the question requires a calculation or grouping
that isn't a standard "total/average/percentage", DESCRIBE that
calculation explicitly in your plan so the SQL writer can implement it."""

    SQL_SYSTEM = """You are a ClickHouse SQL expert for a hospital analytics platform.
Generate ONLY the SQL query. No explanation. No markdown fences. No preamble.
The SQL must be syntactically valid ClickHouse SQL."""

    CROSS_CONV_SYSTEM = """You detect whether a message references a PAST,
DIFFERENT conversation (not the current one). Return ONLY valid JSON."""

    SUMMARY_SYSTEM = """You are a helpful hospital operations analyst. Your goal is to explain data clearly and concisely to an administrator.

Guidelines:
1. Provide the main insight first. Highlight what is notable, then provide a few supporting numbers.
2. Please convert counts to percentages or ratios where it helps clarify comparisons.
3. Use relative language to provide context (e.g., "the busiest facility").
4. If the data includes a facility ID, focus on its operational meaning rather than just listing the ID.
5. For comparisons, describe the direction of change.
6. Round numbers for readability (e.g., "about 342,000" instead of 342,288).
7. Keep responses brief, around 3-4 sentences, using plain text paragraphs.
8. If a metric suggests an operational concern, state it clearly.
9. Speak directly about the operations rather than referencing "the data" or "the query".
10. Ensure any mentioned time periods align exactly with the provided actual data range.
11. Mention significant trends if they exceed typical fluctuations.
12. If an anomaly is noted, especially in the most recent period, gently suggest it might be due to incomplete recent reporting.

Please follow these guidelines to provide a natural, analytical summary."""

    def __init__(self):
        self.client = AzureOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
        )
        self.model = settings.azure_openai_deployment
        self.schema = DatabaseSchema.get_llm_schema_prompt()
        self.db = ClickHouseConnection()

    # ── Call 0: Route Message ─────────────────────────────────────────────
    def route_message(self, message: str, history: str = "") -> dict:
        """
        Returns: {"needs_data": bool, "response": str | None, "reason": str}

        If needs_data=False, "response" contains a ready-to-send reply.
        If needs_data=True, "response" is None — proceed to plan_analysis().
        """
        prompt = f"""USER MESSAGE: {message}
RECENT CONTEXT: {history or "none"}

Classify this message:

CATEGORY "data_question": Anything that requires checking data to
answer correctly — this now EXPLICITLY INCLUDES:
- Hospital operations data (porter requests, assets, facilities, performance)
- ANYTHING asking the assistant to recall information about the USER
  or about PRIOR CONVERSATION CONTENT — e.g. "do you remember my name",
  "what did I tell you earlier", "have I asked about this before",
  "what's my name", "do you know anything about me"
  These require an ACTUAL memory check (current conversation history
  or past conversation search) before answering — NEVER answer these
  directly from this router with an assumption about what memory
  contains or doesn't contain.

CATEGORY "conversational": ONLY true chitchat with NO checkable
factual content (except statements sharing personal details):
- Greetings (hi, hello, hey) with no question attached
- Thanks/closings (thanks, bye, that's helpful)
- STATEMENTS sharing personal information ("my name is tw", "I am a manager")
  — you do not need to "look these up", you just acknowledge them.
- GENERIC capability questions with NO personal/memory component:
  "what can you do", "what data do you have access to", "how does
  this work" — these ask about the ASSISTANT'S GENERAL CAPABILITIES,
  not about specific remembered facts.

CRITICAL DISTINCTION — these look similar but are DIFFERENT categories:
- "what can you do" → conversational (general capability question)
- "do you remember my name" → data_question (requires an actual memory
  check — this is NOT the same as a general capability question, even
  though both use "do you" phrasing)
- "how does this work" → conversational (general, about the product)
- "do you remember what I asked before" → data_question (requires
  checking actual conversation history)

When in doubt between these two categories, choose "data_question" —
it is ALWAYS safer to check memory and find nothing than to assume
nothing exists and answer confidently wrong.

Return JSON:
{{
  "category": "data_question" | "conversational",
  "reply": "If category is conversational, a brief friendly response.
            If data_question, empty string — this will be handled by
            the memory/data pipeline, not by you."
}}"""

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.ROUTER_SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.0,
            max_tokens=150,
        )
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"^```json\s*", "", raw, flags=re.IGNORECASE)
        raw = re.sub(r"\s*```$", "", raw)

        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            # Fail-safe: if routing itself fails, assume it's a data question
            # (safer to attempt SQL and let downstream error-handling deal
            # with it, than to silently swallow a real question)
            return {"needs_data": True, "response": None, "reason": "router_parse_failed"}

        needs_data = result.get("category") != "conversational"
        return {
            "needs_data": needs_data,
            "response": None if needs_data else result.get("reply", "Hello! How can I help with your operations data today?"),
            "reason": result.get("category", "unknown"),
        }

    # ── Call 1: Plan Analysis ─────────────────────────────────────────────
    def plan_analysis(self, question: str, history: str = "", facility_id: str | None = None) -> dict:
        facility_note = f"\nNOTE: Results will be filtered to facility_id='{facility_id}'." if facility_id else ""

        prompt = f"""SCHEMA:
{self.schema}

CONVERSATION HISTORY (most recent turns):
{history or "none — this is the first message in the conversation"}

CURRENT QUESTION: {question}
{facility_note}

STEP 1 — RESOLVE IMPLICIT REFERENCES:
Before planning the query, check if the CURRENT QUESTION contains
pronouns, implicit scope, or references that depend on the
CONVERSATION HISTORY to fully understand. Examples:
- "their performance" → WHO is "their"? Check history for the subject
  (porters, a specific facility, a department) established in the
  previous turn.
- "what about last month" → "what about" implies repeating the SAME
  metric/analysis from the previous turn, just for a different time
  period.
- "show that as a chart" → "that" refers to the previous turn's result.
- "and for facility 0009?" → implies repeating the previous analysis,
  scoped to a new facility.

Write out your resolution explicitly as "resolved_question" — a
SELF-CONTAINED rephrasing of the current question with all references
filled in from history. If there are NO implicit references (the
question is fully self-contained), resolved_question should just
restate the question as-is.

If you CANNOT confidently resolve an implicit reference (e.g. no
relevant prior context exists), set:
  "resolved_question": <original question, unchanged>
  "had_implicit_reference": true
  "potential_pitfalls": "Question contains an unresolved reference ('their', 'that', etc.) with no clear prior context — the SQL writer should ask for clarification rather than guessing, OR default to the most general reasonable interpretation."

STEP 2 — Continue with the full analytical plan using the
RESOLVED question as your basis (not the original, potentially
ambiguous one).

Think through this step by step and return JSON with these fields:

{{
  "resolved_question": "the question with all implicit references filled in",
  "had_implicit_reference": true|false,
  "relevant_tables": ["table names this question needs"],

  "relevant_columns": ["specific columns needed, with brief reason for each"],

  "calculation_plan": "Plain-English description of EXACTLY what to
    compute. Be specific about any non-obvious derived values. Examples:
    - 'Extract hour-of-day from scheduled_time using toHour(). For each
      hour (0-23), count total requests and compute completion rate
      (completed/total). Identify the hour with highest request count
      (peak load) and the hour with highest completion rate among
      high-volume hours (best allocation efficiency).'
    - 'Group by facility_id. For each facility compute total requests,
      completed requests, and completion_rate = completed/total * 100.'
    - 'No calculation needed — this is a simple greeting.'",

  "grouping": "What the result should be grouped BY (e.g. 'hour of day
    (0-23)', 'facility_id', 'month', 'no grouping - single summary row',
    'department AND month')",

  "expected_row_shape": "Describe what each row of the result represents
    and roughly how many rows to expect. E.g. '24 rows, one per hour of
    day' or '1 row, overall summary' or '6 rows, one per month' or
    '~10 rows, one per department'",

  "comparison_needed": true|false,
  "comparison_basis": "If comparison_needed, what's being compared
    (e.g. 'this month vs last month', 'across facilities', 'across
    hours of the day to find peak vs off-peak')",

  "visualization_suggestion": "What chart type and axes would best show
    this result, and WHY. E.g. 'Bar chart with hour-of-day (0-23) on
    X-axis and request_count on Y-axis, to visually identify peak hours
    at a glance. A second series for completion_rate would show
    allocation efficiency alongside volume.'",

  "potential_pitfalls": "Any ClickHouse-specific concerns for THIS
    query — e.g. 'must use toHour() not HOUR()', 'avoid correlated
    subquery for the efficiency comparison, use conditional aggregation
    instead', or 'none'",

  "data_domain": "porter|asset|both",
  "chart_type_hint": "bar|line|pie|scatter|table|auto",
  "requested_metrics": ["column-name-like strings explicitly named in the question, or empty list"],

  "requires_multiple_queries": true|false,
  "sub_queries": [
    {{
      "purpose": "what this specific query answers",
      "domain": "porter|asset",
      "calculation_plan": "specific calculation for THIS sub-query"
    }}
  ]
}}

MULTI-QUERY DETECTION:
Set "requires_multiple_queries": true when the question asks about
BOTH porter operations AND asset/cost topics TOGETHER, where the two
topics don't share a natural row-level relationship (i.e. joining them
would cause incorrect duplication or require an artificial join key).

Examples:
- "Productivity and cost optimization insights" → true. Sub-query 1
  (porter domain): completion rate, avg TAT. Sub-query 2 (asset
  domain): active asset costs, maintenance costs. (No shared dimension)
- "Compare porter and asset performance" → true. Sub-query 1: porter
  completion/TAT metrics. Sub-query 2: asset active/maintenance rates.
- "Show porter performance by facility" → false (single domain, single query)
- "Show assets and their warranty status" → false (single domain — both
  parts are about mysql_asset, no porter/asset split needed)
- "Compare the number of active critical assets with the number of completed porter requests by facility" → false. They share a natural aggregation dimension (facility_id), so they CAN and SHOULD be combined in ONE query using a FULL OUTER JOIN or UNION ALL with aggregation.
- "How many requests use which assets" → false IF there's a genuine
  row-level relationship via asset_category in fact_porter_request
  matching mysql_asset's category — only set true when NO valid join
  key exists or when combining would cause fan-out/double-counting


Think carefully — this plan will be used DIRECTLY to write SQL. A vague
or generic plan produces a vague or generic (and likely wrong) query.

IMPORTANT: Output VALID JSON ONLY. Do NOT include // or /* */ comments anywhere inside the JSON."""

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.PLANNER_SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.0,
            max_tokens=1500,
        )
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"^```json\s*", "", raw, flags=re.IGNORECASE)
        raw = re.sub(r"\s*```$", "", raw)
        
        # Strip single-line comments (// ...) that the LLM sometimes adds
        raw = re.sub(r"(?m)^\s*//.*$", "", raw)

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("Plan parse failed, raw: %s", raw[:300])
            return {
                "relevant_tables": [], "relevant_columns": [],
                "calculation_plan": f"Answer the question directly: {question}",
                "grouping": "unspecified", "expected_row_shape": "unspecified",
                "comparison_needed": False, "comparison_basis": "",
                "visualization_suggestion": "table",
                "potential_pitfalls": "none",
                "data_domain": "porter",
                "chart_type_hint": "auto",
                "requested_metrics": []
            }

    def resolve_memory_scope(self, message: str, current_history: str, has_current_history: bool) -> dict:
        """
        ONE decision point for whether this message needs:
        - no memory at all (fresh question)
        - CURRENT conversation context (Phase 11.4's job)
        - OTHER conversation search (Phase 13's job)

        Priority rule: if the current conversation's own history could
        plausibly answer the reference, ALWAYS prefer that — only fall
        back to cross-conversation search if the current conversation
        genuinely has no relevant prior context for the reference being made.
        """
        prompt = f"""MESSAGE: {message}

DOES THE CURRENT CONVERSATION HAVE PRIOR CONTEXT?: {"Yes" if has_current_history else "No — this is the first message"}

CURRENT CONVERSATION HISTORY (if any):
{current_history or "none"}

Determine where the answer to any implicit reference in this message
should come from. Think in this STRICT priority order:

PRIORITY 1 — "current_conversation": The message references something
("that", "the same X", "their performance", "what about last month",
"individual breakdown") that is ALREADY ESTABLISHED in the CURRENT
CONVERSATION HISTORY shown above. This takes priority over EVERYTHING
ELSE — if the current conversation could plausibly contain the answer,
choose this, even if the message ALSO sounds like it could reference
a "previous chat".

PRIORITY 2 — "other_conversation": The message explicitly OR implicitly references
a DIFFERENT, SEPARATE conversation or past knowledge about the user ("in my previous chat",
"what's my name", "do you know who I am", "did we discuss this before") AND the current
conversation's history does NOT already contain relevant context for it.

PRIORITY 3 — "none": Fresh question, no reference to resolve at all.

CRITICAL: Only choose "other_conversation" when you are CONFIDENT the
current conversation's history (shown above) does NOT already answer
the implicit reference. If in doubt, prefer "current_conversation" —
checking the current context first is always safe; jumping to a cross-
conversation search when the answer was already nearby is the bug we're
fixing.

Return JSON:
{{
  "scope": "current_conversation" | "other_conversation" | "none",
  "reasoning": "brief explanation of why",
  "search_terms": ["keyword1", "keyword2"] // ONLY required if scope is "other_conversation"
}}

If scope is "other_conversation", extract 2-4 SHORT keywords from the message that would help
find a RELEVANT past conversation (e.g. "warranty", "facility 1027",
"porter performance"). Omit generic words like "checked", "before", "chat"."""

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "system", "content": "You route conversational memory requests precisely."},
                       {"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=150,
        )
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"^```json\s*", "", raw, flags=re.IGNORECASE)
        raw = re.sub(r"\s*```$", "", raw)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Fail-safe: prefer current_conversation (cheaper, safer,
            # already-loaded context) over a cross-conversation search
            return {"scope": "current_conversation", "reasoning": "parse_failed_fallback"}

    def generate_cross_conversation_summary(self, question: str, matches: list[dict]) -> str:
        context_parts = []
        for m in matches:
            snippet_text = "\n".join(f"  {msg['role']}: {msg['content']}" for msg in m["relevant_messages"])
            context_parts.append(f"[Source: \"{m['title']}\"]\n{snippet_text}")

        prompt = f"""QUESTION: {question}

RELEVANT PAST CONVERSATIONS FOUND (for your reference only — do not
quote these source labels in your response):
{chr(10).join(context_parts)}

Write a natural, direct response that:
1. Answers the question DIRECTLY, as if you simply remember this —
   like a colleague who recalls a previous discussion naturally, not
   like a search engine citing results.
2. Does NOT say things like "based on the conversation titled...",
   "in a previous conversation called...", "according to the chat
   where...", or otherwise name/quote the source conversation's title
   within your response. The UI already shows a separate clickable
   reference below your response — you do not need to cite the source
   in your own words.
3. Sounds warm and conversational where appropriate (e.g. for personal
   questions like someone's name, a brief friendly acknowledgment is
   fine), but stays concise (2-3 sentences) for data/analytical questions.
4. Uses ONLY information from the snippets above — never invents
   details not present in them.
5. If the past conversations don't fully answer the question, says so
   honestly and directly (e.g. "I don't see a breakdown by individual
   porter in what we discussed before — would you like me to pull that
   now?") rather than a generic refusal.

EXAMPLES OF GOOD vs BAD:

BAD:  "Based on the conversation titled 'Hi there! My name is Alex...',
       you introduced yourself as Alex."
GOOD: "Your name is Alex! Good to be working with you again."

BAD:  "According to the chat where you asked about porter performance
       for Feb 2026, no individual breakdown was mentioned."
GOOD: "I don't see an individual porter breakdown in what we covered
       before for Feb 2026 — want me to pull that for you now?"

BAD:  "In a previous conversation, warranty status was checked across
       108 assets."
GOOD: "Yes — warranty status has already been checked across 108
       assets at several facilities, with one site standing out at
       nearly 1,900 assets checked."

Before concluding that information isn't available, CAREFULLY check
EVERY message shown above — including assistant responses, which often
contain the actual data/breakdown the user is asking about, even if the
ORIGINAL QUESTION in that past conversation was phrased differently
than what's being asked now. Do not conclude "not available" just
because no message is an exact phrase match — look at the SUBSTANCE of
what was discussed."""

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You answer naturally using remembered context, never citing sources by name in your own prose."},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.3,
            max_tokens=300,
        )
        return resp.choices[0].message.content.strip()

    # ── Call 2: SQL generation ────────────────────────────────────────────
    def generate_sql(self, question: str, plan: dict, history: str = "", facility_id: str | None = None) -> str:
        facility_constraint = ""
        if facility_id:
            facility_constraint = f"""
MANDATORY FILTER: This query MUST include a WHERE clause filtering
facility_id = '{facility_id}' (as a string, with quotes). This applies
to BOTH fact_porter_request and mysql_asset tables — whichever is used.
If the query already has a WHERE clause, add this as an additional
AND condition. If using GROUP BY across facilities, this filter still
applies — the result will only ever show data for THIS facility."""

        comparison_note = ""
        if plan.get("comparison_needed"):
            comparison_note = f"""
THIS IS A COMPARISON: {plan.get('comparison_basis', '')}
Ensure your GROUP BY produces MULTIPLE rows (one per thing being
compared) — do NOT filter to a single period/group if the comparison
requires multiple."""

        prompt = f"""Generate a ClickHouse SQL query to answer this question.

SCHEMA:
{self.schema}
{facility_constraint}

QUESTION: {question}

ANALYTICAL PLAN (follow this closely):
- Relevant tables: {', '.join(plan.get('relevant_tables', []))}
- Relevant columns: {'; '.join(plan.get('relevant_columns', []))}
- Calculation: {plan.get('calculation_plan', '')}
- Grouping: {plan.get('grouping', '')}
- Expected result shape: {plan.get('expected_row_shape', '')}
{comparison_note}
- Known pitfalls for this query: {plan.get('potential_pitfalls', 'none')}

CONVERSATION CONTEXT: {history or "none"}

Requirements:
- Implement the CALCULATION exactly as described in the plan
- The GROUP BY should match the plan's grouping description
- Use ONLY tables/columns from the schema
- Apply ALL ClickHouse SQL rules from the schema (including rules #1-12:
  date functions, conditional aggregates, sanity bounds on dates, etc.)
- Default LIMIT 500 unless the expected row shape implies fewer
  (e.g. "24 rows" or "1 row" — in those cases LIMIT 500 is harmless but
  the GROUP BY should naturally produce that row count)
- Return ONLY the SQL, nothing else"""

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.SQL_SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.0,
            max_tokens=800,
        )
        sql = resp.choices[0].message.content.strip()
        sql = re.sub(r"^```sql\s*", "", sql, flags=re.IGNORECASE)
        sql = re.sub(r"\s*```$", "", sql)
        sql = sql.replace("INTERIAL", "INTERVAL")  # Prevent common LLM hallucination
        return sql.strip()

    # ── Call 3: Self-correction (on error only) ───────────────────────────
    def fix_sql(self, sql: str, error: str) -> str:
        prompt = f"""This ClickHouse SQL failed. Fix the ROOT CAUSE, not just
the symptom.

ORIGINAL SQL:
{sql}

ERROR MESSAGE:
{error}

SCHEMA:
{self.schema}

COMMON ROOT CAUSES AND CORRECT FIXES:
- "Missing columns: 'X'" / "Unknown identifier" → X likely belongs to
  the OTHER table, or doesn't exist at all. Look up which table X
  ACTUALLY belongs to in the schema. If X belongs to a table not
  currently in the FROM/JOIN clause, either (a) add the correct JOIN if
  the query genuinely needs both tables, or (b) if the original query
  only needed ONE domain, remove the column and use the correct
  table's equivalent column instead.
  DO NOT fix this by selecting NULL or a placeholder for the missing
  column — this hides the real problem and produces a meaningless result.
- "Incorrect number of arguments for function X" → You used the wrong
  function signature. Check the schema's CLICKHOUSE SQL RULES section
  for the correct function and argument count (e.g. makeDate for
  constructing dates, not toDate with 3 args).
- "Syntax error" → Check for MySQL-style syntax that ClickHouse doesn't
  support (e.g. DATE_SUB, DATEDIFF, backticks) — replace with the
  ClickHouse equivalents listed in the schema.
- "Column 'X' is not under aggregate function and not in GROUP BY" →
  You included a non-aggregated column in the SELECT clause but forgot
  to add it to the GROUP BY clause. Add all non-aggregated SELECT columns
  to the GROUP BY clause.

Return ONLY the corrected SQL — but make sure the fix addresses the
ACTUAL cause, producing a query that will give a MEANINGFUL, CORRECT
result, not just one that merely avoids the error."""
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.SQL_SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.0,
            max_tokens=800,
        )
        fixed = resp.choices[0].message.content.strip()
        fixed = re.sub(r"^```sql\s*", "", fixed, flags=re.IGNORECASE)
        fixed = re.sub(r"\s*```$", "", fixed)
        fixed = fixed.replace("INTERIAL", "INTERVAL")  # Prevent common LLM hallucination
        return fixed.strip()

    # ── Data Gap Detection ────────────────────────────────────────────────
    def check_data_coverage(self, df: pd.DataFrame, plan: dict) -> dict:
        """
        Returns metadata about whether the result's emptiness/zero-ness is
        due to a genuine zero or a lack of data for the requested period.
        """
        coverage = {"has_data_gap": False, "note": ""}

        # Check if df is empty or all-zero/NaN
        is_empty = False
        if df.empty:
            is_empty = True
        elif len(df) == 1:
            num_cols = df.select_dtypes(include="number")
            if not num_cols.empty and num_cols.fillna(0).sum(axis=1).iloc[0] == 0:
                is_empty = True

        if not is_empty:
            return coverage  # data exists, no gap concern

        # Result is empty or all-zero — always check max date since intent time_scope can be unreliable
        table = "fact_porter_request" if plan.get("data_domain") != "asset" else "mysql_asset"
        date_col = "scheduled_time" if table == "fact_porter_request" else "commissioned_on"

        try:
            check_df, ok, _ = self.db.execute_query_with_error(
                f"SELECT max({date_col}) AS latest FROM ovitag_dw.{table} "
                f"WHERE {date_col} <= now() + INTERVAL 1 DAY"
            )
            if ok and not check_df.empty:
                latest = check_df.iloc[0]["latest"]
                coverage["has_data_gap"] = True
                coverage["note"] = f"The most recent data available in the system is from {latest}. If the question asks for a recent time period (like today or this month), there may be no data recorded yet."
        except Exception:
            pass

        return coverage

    # ── Summary generation ────────────────────────────────────────────────
    def generate_summary(self, question: str, df: pd.DataFrame, plan: dict) -> str:
        if df is None or df.empty:
            return "The query returned no results for the specified criteria."

        import numpy as np
        sample = df.head(10).replace({np.nan: None, pd.NaT: None, pd.NA: None}).to_dict("records")
        prompt = f"""QUESTION: {question}
DOMAIN: {plan.get('data_domain', 'porter')}
TOTAL ROWS: {len(df)}
SAMPLE DATA (first 10 rows): {json.dumps(sample, default=str)}

Write a 2–3 sentence plain-language summary of these results for a hospital manager."""

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.SUMMARY_SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.0,
            max_tokens=300,
        )
        return resp.choices[0].message.content.strip()

    # ── Follow-up suggestions ─────────────────────────────────────────────
    def generate_followups(self, question: str, plan: dict) -> list[str]:
        prompt = f"""Question: "{question}"
Domain: {plan.get('data_domain')}

Suggest 3 natural follow-up questions a hospital administrator would
ask next, in their own words (not technical/SQL phrasing).
Good: "How does this compare to last month?"
Bad: "Show GROUP BY facility_id with date filter"
Return ONLY a JSON array of 3 strings."""
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Return only a JSON array of 3 strings."},
                    {"role": "user",   "content": prompt},
                ],
                temperature=0.5,
                max_tokens=150,
            )
            raw = resp.choices[0].message.content.strip()
            raw = re.sub(r"^```json?\s*", "", raw, flags=re.IGNORECASE)
            raw = re.sub(r"\s*```$", "", raw)
            return json.loads(raw)
        except Exception:
            return ["Show breakdown by facility", "Compare to last month", "Export this data"]

    def run_multi(self, question: str, plan: dict, history: str = "", facility_id: str | None = None) -> dict:
        """
        Executes each sub-query independently (NO cross-domain JOIN).
        Returns a dict with results keyed by sub-query purpose, for the
        summary stage to synthesize.
        """
        results = []
        for sub in plan.get("sub_queries", []):
            sub_plan = {
                **plan,
                "calculation_plan": sub["calculation_plan"],
                "relevant_tables": [sub["domain"] == "porter" and "fact_porter_request" or "mysql_asset"],
            }
            sql = self.generate_sql(question, sub_plan, history, facility_id)
            df, success, error = self.db.execute_query_with_error(sql)

            if not success and error:
                sql = self.fix_sql(sql, error)
                df, success, error = self.db.execute_query_with_error(sql)

            results.append({
                "purpose": sub["purpose"],
                "domain": sub["domain"],
                "sql": sql,
                "data": df,
                "success": success,
                "error": error,
            })

        return {"sub_results": results, "is_multi": True}

    def _package_multi_result(self, question: str, plan: dict, multi_result: dict) -> dict:
        """
        Packages multi-query results into a shape chat.py can use:
        - Combined "display" DataFrame (for the Data Table panel — show
          both result sets, clearly labeled)
        - A synthesis-ready context string for generate_summary()
        """
        sub_results = multi_result["sub_results"]

        # Build a combined display structure
        display_sections = []
        synthesis_context_parts = []

        for sub in sub_results:
            if sub["success"] and not sub["data"].empty:
                # Replace NaNs to avoid JSON serialization errors
                import numpy as np
                cleaned_df = sub["data"].replace({np.nan: None, pd.NaT: None, pd.NA: None})
                display_sections.append({"label": sub["purpose"], "data": cleaned_df.to_dict("records")})
                synthesis_context_parts.append(
                    f"--- {sub['purpose']} ({sub['domain']} domain) ---\n"
                    f"{sub['data'].head(10).to_json(orient='records')}"
                )
            else:
                synthesis_context_parts.append(f"--- {sub['purpose']} ---\nNo data available: {sub.get('error', 'empty result')}")

        return {
            "is_multi": True,
            "sub_results": sub_results,
            "display_sections": display_sections,
            "synthesis_context": "\n\n".join(synthesis_context_parts),
            "all_success": all(s["success"] for s in sub_results),
            "combined_sql": "\n\n-- ===== NEXT QUERY ===== --\n\n".join(s["sql"] for s in sub_results),
        }

    def generate_synthesis_summary(self, question: str, packaged: dict, plan: dict) -> str:
        prompt = f"""QUESTION: {question}

This question required looking at MULTIPLE separate data sources, since
they don't share a direct row-level relationship. Here is the ACTUAL
data from each:

{packaged['synthesis_context']}

Write a 3-4 sentence summary that:
1. Synthesizes insight ACROSS both data sources — connect them
   meaningfully (e.g. "porter efficiency is improving while asset
   maintenance costs are rising" type connections), but ONLY based on
   the actual numbers shown above
2. Does NOT invent metrics, numbers, or relationships not present in
   the data above
3. If one part has no data, says so honestly rather than guessing
4. Follows the same plain-language, percentage-based communication
   style as your other responses (no raw number dumps)

Do not hallucinate connections between the two datasets that aren't
supported by the actual numbers — if they're simply two separate facts
worth knowing, present them as such rather than forcing an artificial
correlation."""

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.SUMMARY_SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.2,
            max_tokens=350,
        )
        return resp.choices[0].message.content.strip()

    # ── Orchestration ─────────────────────────────────────────────────────
    def run(self, question: str, history: str = "", facility_id: str | None = None):
        """
        Runs the full pipeline.
        Returns: (sql, plan_dict, dataframe, success_bool, error_string)
        """
        logger.info("Pipeline started for question: %s", question)

        plan = self.plan_analysis(question, history, facility_id)
        logger.info("Plan generated: %s", plan)

        if plan.get("requires_multiple_queries") and plan.get("sub_queries"):
            multi_result = self.run_multi(question, plan, history, facility_id)
            return self._package_multi_result(question, plan, multi_result)

        sql = self.generate_sql(question, plan, history, facility_id)

        df, success, error = self.db.execute_query_with_error(sql)

        # Safety net: comparison plans returning 1 row (from 8.1 Addendum #1)
        if success and plan.get("comparison_needed") and len(df) <= 1:
            logger.warning("Comparison query returned %d row(s), regenerating: %s", len(df), question)
            sql = self.fix_sql(
                sql,
                "This was planned as a comparison "
                f"({plan.get('comparison_basis', '')}) but returned only 1 row. "
                "Adjust GROUP BY / remove over-restrictive WHERE filters so "
                "multiple rows are returned, one per item being compared."
            )
            df, success, error = self.db.execute_query_with_error(sql)

        if not success and error:
            logger.warning("SQL failed, attempting self-correction. Error: %s", error)
            sql = self.fix_sql(sql, error)
            df, success, error = self.db.execute_query_with_error(sql)
            if not success:
                logger.error(
                    "SQL failed after self-correction. Original error context "
                    "preserved for debugging.\nQuestion: %s\nFinal SQL: %s\nError: %s",
                    question, sql, error
                )

        return sql, plan, df, success, (error or "")
