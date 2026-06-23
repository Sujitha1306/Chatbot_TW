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
Generate ONLY ONE SINGLE SQL query. No explanation. No markdown fences. No preamble.
The SQL must be syntactically valid ClickHouse SQL.
CRITICAL: NEVER generate multiple queries separated by a semicolon (;). The driver only supports ONE statement at a time. If you need to combine unrelated data, use UNION ALL with EXACTLY matching column names and types (pad missing columns with NULL AS column_name)."""

    CROSS_CONV_SYSTEM = """You detect whether a message references a PAST,
DIFFERENT conversation (not the current one). Return ONLY valid JSON."""

    SUMMARY_SYSTEM = """You are a hospital operations analyst summarizing
query results for a hospital administrator. Your job is to describe
what the DATA SHOWS — not to explain why it happened or recommend
what to do about it.

=== HARD RULES — NEVER VIOLATE THESE ===

RULE 1 — DATA GROUNDING (most important):
Only mention numbers, metrics, or entities that appear in the
PRE-COMPUTED STATS block or SAMPLE ROWS provided in the prompt.
If a number is not in those sections, do NOT mention it — not even
as an estimate, approximation, or comparison. This means:
- Do NOT mention "the average" unless avg is in the stats block
- Do NOT mention "low-volume porters" unless volume columns are returned
- Do NOT mention "other facilities" unless they are in the result rows
- Do NOT mention data quality issues unless explicitly flagged
  in the prompt as an anomaly

RULE 2 — NO CAUSAL ATTRIBUTION:
The data shows WHAT happened, not WHY. Never use words like:
"suggests", "indicates a problem", "capacity issue", "staffing
challenge", "bottleneck", "operational delay", "inefficiency",
"centralized distribution", or any other causal or diagnostic
language — UNLESS that exact phrase appears in the data itself
(e.g. a comments column).

Instead of: "This suggests a staffing problem"
Write:       "Porter 2882 handled 53,162 requests, compared to a
              median of 340 — a significant workload concentration"

Instead of: "This indicates a capacity issue at this facility"
Write:       "Facility 0039 completed 48% of requests — the lowest
              completion rate in this result"

RULE 3 — SCOPE HONESTY:
Never claim to know something this data cannot show. If a question
requires information not in the available tables (root causes,
benchmark comparisons, cost optimization, external factors), state
this clearly and briefly before the data summary.
Example: "Cost benchmarks aren't available in this system's data,
but here's what the asset records do show: ..."

=== COMMUNICATION STYLE (from earlier phases, unchanged) ===

4. Use percentages and relative language — not raw number dumps
5. Lead with the most important finding first
6. Plain language for hospital administrators — no technical jargon
7. Round numbers for readability (342K not 342,288)
8. State the actual data range covered — never overstate the time period
9. Mention significant trends/anomalies when present
10. If the primary metric produces a tie, surface the best secondary
    differentiator already in the data (Phase 20)
11. DATA RANGE HONESTY: match the time period stated to actual data
12. ANOMALY AWARENESS: flag outliers, note if they may be partial data
13. TIE-AWARE RANKING: surface secondary differentiators; use exact
    computed numbers, never recalculate

=== STRUCTURE — REQUIRED IN YOUR OUTPUT ===

Structure your response as plain paragraphs. 
First, state the facts (what the data directly shows — numbers and patterns from this specific query result only).
Then, state your observations (reasonable inferences from the pattern — things that follow logically from the data but aren't directly measured).

Do NOT use literal section headers like "**FACTS:**" or "**OBSERVATIONS:**".
Do NOT include a "RECOMMENDATIONS" or "SUGGESTIONS" section in
your output — that is handled separately by a different system.
Your output should be 2-4 short, clear sentences in total.

EXAMPLE OF GOOD OUTPUT:

Question: Which porter performed best by completion rate?

All 235 porters at this facility achieved a 100% completion rate, so this metric does not differentiate performance. Porter 2882 handled the highest request volume at 53,162 completed tasks — nearly 10x the median porter's 5,640. Porter 2882's volume is an outlier compared to the rest of the team. If workload distribution matters operationally, this concentration is the most notable pattern in this result.

EXAMPLE OF BAD OUTPUT (shows what NOT to do):

"This suggests a staffing imbalance at the facility, indicating that
resource allocation may need review. The data points to potential
burnout risk for porter 2882 due to high workload concentration,
which could impact service quality if left unaddressed."

(Bad because: "staffing imbalance", "burnout risk", "impact service
quality" are all causal claims the data cannot support)"""

    SUGGESTIONS_SYSTEM = """You are a hospital operations advisor.
You have been given a data summary from a hospital analytics system.
Based on this summary, generate 2-3 brief operational suggestions or
questions worth investigating further.

CRITICAL RULES:
1. These are SUGGESTIONS, not facts. They are explicitly labelled as
   speculative/inferential — the user knows this. You may use phrases
   like "It may be worth investigating", "Consider reviewing",
   "One question this raises is..."
2. Keep each suggestion to 1 sentence. Use plain language.
3. Do NOT repeat what the data already showed — add something
   the data SUGGESTS but doesn't prove.
4. If the data is too limited to support even speculative suggestions,
   return an empty list: []"""

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

    def _build_facility_filter_note(self, filters: dict | None) -> str:
        if not filters:
            return ""
        
        from backend.app.core.facility_lookup import get_facility_lookup
        lookup = get_facility_lookup()
        all_facs = lookup.list_all()

        if filters.get("facility_id"):
            valid_ids = [f["facility_id"] for f in all_facs if f["facility_id"] == filters["facility_id"] or f["facility_name"] == filters["facility_id"]]
            if valid_ids:
                if len(valid_ids) == 1:
                    return f"\nNOTE: Results will be filtered to facility_id='{valid_ids[0]}'."
                id_list = ", ".join([f"'{fid}'" for fid in valid_ids])
                return f"\nNOTE: Results will be filtered to facility_id IN ({id_list})."
        

        
        valid_ids = []
        if filters.get("region_id"):
            valid_ids = [f["facility_id"] for f in all_facs if f["region_id"] == filters["region_id"] or f["region_name"] == filters["region_id"]]
        elif filters.get("customer_id"):
            valid_ids = [f["facility_id"] for f in all_facs if f["customer_id"] == filters["customer_id"]]
            
        if valid_ids:
            id_list = ", ".join([f"'{fid}'" for fid in valid_ids])
            return f"\nNOTE: Results will be filtered to facility_id IN ({id_list})."
        
        return ""

    def _build_facility_mandatory_filter(self, filters: dict | None) -> str:
        if not filters:
            return ""
        
        from backend.app.core.facility_lookup import get_facility_lookup
        lookup = get_facility_lookup()
        all_facs = lookup.list_all()

        if filters.get("facility_id"):
            valid_ids = [f["facility_id"] for f in all_facs if f["facility_id"] == filters["facility_id"] or f["facility_name"] == filters["facility_id"]]
            if valid_ids:
                if len(valid_ids) == 1:
                    return f"""
MANDATORY FILTER: This query MUST include a WHERE clause filtering
facility_id = '{valid_ids[0]}' (as a string, with quotes). This applies
to BOTH fact_porter_request and mysql_asset tables — whichever is used.
If the query already has a WHERE clause, add this as an additional
AND condition. If using GROUP BY across facilities, this filter still
applies — the result will only ever show data for THIS facility."""
                
                id_list = ", ".join([f"'{fid}'" for fid in valid_ids])
                return f"""
MANDATORY FILTER: This query MUST include a WHERE clause filtering
facility_id IN ({id_list}). This applies
to BOTH fact_porter_request and mysql_asset tables — whichever is used.
If the query already has a WHERE clause, add this as an additional
AND condition."""


        
        valid_ids = []
        if filters.get("region_id"):
            valid_ids = [f["facility_id"] for f in all_facs if f["region_id"] == filters["region_id"] or f["region_name"] == filters["region_id"]]
        elif filters.get("customer_id"):
            valid_ids = [f["facility_id"] for f in all_facs if f["customer_id"] == filters["customer_id"]]
            
        if valid_ids:
            id_list = ", ".join([f"'{fid}'" for fid in valid_ids])
            return f"""
MANDATORY FILTER: This query MUST include a WHERE clause filtering
facility_id IN ({id_list}). This applies
to BOTH fact_porter_request and mysql_asset tables — whichever is used.
If the query already has a WHERE clause, add this as an additional
AND condition."""

        return ""

    # ── Call 1: Plan Analysis ─────────────────────────────────────────────
    def plan_analysis(self, question: str, history: str = "", filters: dict | None = None) -> dict:
        facility_note = self._build_facility_filter_note(filters)

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
  "response_format": "ranking | comparison | trend | overview | single_stat | limitation",

  "requires_multiple_queries": true|false,
  "sub_queries": [
    {{
      "purpose": "what this specific query answers",
      "domain": "porter|asset",
      "calculation_plan": "specific calculation for THIS sub-query"
    }}
  ]
}}

BEYOND-SCHEMA DETECTION:
Before planning any query, assess whether the question can be
answered with data that actually exists in the schema. The available
schema has:
- Porter request records: counts, timing (TAT), status, facility,
  porter ID, request category, scheduled/completed timestamps
- Asset records: name, status, criticality, cost, warranty dates,
  facility
- Facility dimension: name, region, customer

If the question primarily requires data NOT in this schema, set
"response_format": "limitation" and describe what IS available.

Questions that CANNOT be answered from this schema (examples — not exhaustive):
- "Cost optimization insights" → financial analysis, budgets, and ROI
  data don't exist; only raw asset_cost values per asset are available
- "Root cause analysis" → causes of delays/failures aren't logged;
  only the outcomes (status codes, TAT) are available
- "Benchmark comparisons" → industry benchmarks don't exist in the
  data; only internal comparative data between facilities/periods
- "Productivity improvement indicators" → subjective productivity
  metrics don't exist; only request counts and TAT are proxies
- "Patient satisfaction" → no patient feedback data in the schema
- "Staff performance reviews" → no qualitative performance data

If the question CAN be PARTIALLY answered, set response_format:
"limitation" AND describe what partial data IS available and will be
queried, so the user gets something useful rather than a refusal.

RESPONSE FORMAT DETECTION:
- "ranking": question asks who/what is best/worst/top/bottom/highest/lowest
- "comparison": question compares two or more periods, groups, or entities
- "trend": question asks about change over time (month-over-month, year-over-year, how has X changed)
- "overview": broad summary question with no specific ranking/comparison intent ("show porter performance", "give me an overview", "how are we doing")
- "single_stat": question asks for exactly one number ("what is the TAT", "how many requests today", "total assets")
- "limitation": question requires data not available in the schema (cost optimization, root cause, benchmark, external factors)

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
            seed=42,
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
    def generate_sql(self, question: str, plan: dict, history: str = "", filters: dict | None = None) -> str:
        facility_constraint = self._build_facility_mandatory_filter(filters)

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
- For ranking or "who is highest/lowest" questions, ALWAYS use LIMIT 5 or LIMIT 10, NEVER LIMIT 1, so the user can see comparative context.
- If the question asks about specific entities (e.g. "which porter", "which asset"), ALWAYS filter out NULLs and empty strings for that entity ID (e.g. WHERE porter_user_id IS NOT NULL AND porter_user_id != '').
- Default LIMIT 500 for general queries unless specified otherwise.
- Return ONLY the SQL, nothing else"""

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.SQL_SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.0,
            seed=42,
            max_tokens=800,
        )
        sql = resp.choices[0].message.content.strip()
        sql = re.sub(r"^```sql\s*", "", sql, flags=re.IGNORECASE)
        sql = re.sub(r"\s*```$", "", sql)
        sql = sql.replace("INTERIAL", "INTERVAL")  # Prevent common LLM hallucination
        sql = re.sub(r"isNotNull\s*\(\s*([a-zA-Z0-9_.]+)\s*\)", r"\1 IS NOT NULL", sql, flags=re.IGNORECASE)
        sql = re.sub(r"isNull\s*\(\s*([a-zA-Z0-9_.]+)\s*\)", r"\1 IS NULL", sql, flags=re.IGNORECASE)
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
- "Different number of columns in UNION ALL elements" →
  You must ensure every SELECT in a UNION ALL returns the EXACT SAME number 
  of columns, in the EXACT SAME order, with compatible types. If one SELECT 
  has a column that the other doesn't need, use `NULL AS column_name` in 
  the other SELECT. Make absolutely sure the column counts and aliases match perfectly.

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
            seed=42,
            max_tokens=800,
        )
        fixed = resp.choices[0].message.content.strip()
        fixed = re.sub(r"^```sql\s*", "", fixed, flags=re.IGNORECASE)
        fixed = re.sub(r"\s*```$", "", fixed)
        fixed = fixed.replace("INTERIAL", "INTERVAL")  # Prevent common LLM hallucination
        fixed = re.sub(r"isNotNull\s*\(\s*([a-zA-Z0-9_.]+)\s*\)", r"\1 IS NOT NULL", fixed, flags=re.IGNORECASE)
        fixed = re.sub(r"isNull\s*\(\s*([a-zA-Z0-9_.]+)\s*\)", r"\1 IS NULL", fixed, flags=re.IGNORECASE)
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
            temperature=0.1,
            seed=42,
            max_tokens=400,
        )
        return resp.choices[0].message.content.strip()

    # ── Suggestions generation ─────────────────────────────────────────────
    def generate_suggestions(self, question: str, facts_summary: str, plan: dict) -> list[str]:
        """
        Generates 2-3 brief, clearly-speculative suggestions based on the
        grounded summary. These are shown in a SEPARATE, COLLAPSIBLE UI
        panel, NEVER in the main summary text.
        """
        if plan.get("response_format") == "limitation":
            return []

        prompt = f"""ORIGINAL QUESTION: {question}

DATA SUMMARY (what the data actually showed):
{facts_summary}

Generate 2-3 brief suggestions worth investigating further, given
this data. Return ONLY a JSON array of strings, no other text:
["suggestion 1", "suggestion 2", "suggestion 3"]"""

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.SUGGESTIONS_SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.3,
            max_tokens=200,
        )
        raw = resp.choices[0].message.content.strip()
        import re
        import json
        raw = re.sub(r"^```json\s*", "", raw, flags=re.IGNORECASE)
        raw = re.sub(r"\s*```$", "", raw)
        try:
            result = json.loads(raw)
            return result if isinstance(result, list) else []
        except json.JSONDecodeError:
            return []

    # ── Limitation Response ───────────────────────────────────────────────
    def generate_limitation_response(self, question: str, plan: dict) -> str:
        """
        Generates an honest, helpful response for questions that require
        data not available in the schema. Explains the gap and redirects
        to what IS available.
        """
        what_is_available = plan.get("calculation_plan", "")
        prompt = f"""QUESTION: {question}

This question requires data not available in this system's schema.
Write a very brief, punchy response (MAXIMUM 2 sentences) that:
1. Acknowledges what data IS NOT available (no apologies)
2. States what related data IS available and suggests a follow-up query

WHAT IS AVAILABLE (from the analytical plan):
{what_is_available or "general porter request counts and asset details"}

Keep it under 30 words total. Be direct.
Suggest a specific follow-up question the user could ask that WOULD be answerable."""

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You explain data limitations honestly and helpfully."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=200,
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

    def run_multi(self, question: str, plan: dict, history: str = "", filters: dict | None = None) -> dict:
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
            sql = self.generate_sql(question, sub_plan, history, filters)
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
                from backend.app.core.display_resolution import _resolve_display_names
                display_data = _resolve_display_names(sub["data"])
                
                # Replace NaNs to avoid JSON serialization errors
                import numpy as np
                cleaned_df = display_data.replace({np.nan: None, pd.NaT: None, pd.NA: None})
                display_sections.append({"label": sub["purpose"], "data": cleaned_df.to_dict("records")})
                synthesis_context_parts.append(
                    f"--- {sub['purpose']} ({sub['domain']} domain) ---\n"
                    f"{display_data.head(10).to_json(orient='records')}"
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
    def run(self, question: str, history: str = "", filters: dict | None = None):
        """
        Runs the full pipeline.
        Returns: (sql, plan_dict, dataframe, success_bool, error_string)
        """
        logger.info("Pipeline started for question: %s", question)

        plan = self.plan_analysis(question, history, filters)
        logger.info("Plan generated: %s", plan)

        if plan.get("requires_multiple_queries") and plan.get("sub_queries"):
            multi_result = self.run_multi(question, plan, history, filters)
            return self._package_multi_result(question, plan, multi_result)

        sql = self.generate_sql(question, plan, history, filters)

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
