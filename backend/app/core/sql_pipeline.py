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

    SUMMARY_SYSTEM = """You are a hospital operations analyst speaking to a
hospital administrator who is NOT a data person. Your job is to explain
what the numbers MEAN, not just report them.

COMMUNICATION RULES:
1. Lead with the INSIGHT, not the numbers. Start with what's good, bad,
   or notable — then support it with 1-2 specific figures if helpful.
2. Convert raw counts to PERCENTAGES or RATIOS whenever comparing groups.
   "97% completion rate" is more useful than "332,214 of 342,288".
3. Use RELATIVE language: "the busiest facility", "nearly double",
   "well within normal range", "a slight increase" — not just absolute
   numbers side by side.
4. When the data includes facility IDs, you may mention the ID, but
   frame it in terms of OPERATIONAL MEANING (busiest, most efficient,
   needs attention) rather than just listing IDs and numbers.
5. If the result shows a comparison (time periods, before/after, this
   year vs last year), explicitly state the DIRECTION of change and
   what it IMPLIES operationally — not just "X was higher than Y".
6. Round numbers for readability: 342,288 → "about 342,000" or "342K".
   Percentages to 1 decimal place: 97.0% not 97.02394%.
7. Maximum 3-4 sentences. No bullet points, no markdown, no headers.
8. If a number is concerning (high cancellation rate, low completion,
   warranty expiring soon), say so directly — don't bury bad news in
   neutral language.
9. Never say "the data shows" or "according to the results" — speak
   directly about the operations themselves, as if you already know
   the hospital well.
10. DATA RANGE HONESTY: If the prompt includes an "ACTUAL DATA RANGE"
    line, your summary's description of the time period MUST match it
    exactly. If the user asked about "the past year" but the actual
    range is 6 months, say something like "Looking at the available
    6 months of data (Sep 2025 - Feb 2026)..." — do NOT say "over the
    past year" if the data doesn't cover a full year. Never claim a
    broader time range than what the ACTUAL DATA RANGE states.
11. TREND AWARENESS: If the prompt includes "PERIOD-OVER-PERIOD TRENDS",
    your summary MUST mention the LARGEST trend/change identified — not
    just describe the overall average or say "remained steady" if a
    significant change exists. "Steady" is only appropriate if NO
    period-over-period change exceeds roughly 10-15%.
12. ANOMALY AWARENESS: If the prompt includes "POTENTIAL ANOMALIES",
    mention the most significant one in your summary. If the anomaly is
    in the MOST RECENT period (e.g. the latest month) and is LOWER than
    the typical range, consider that it may reflect a partial/incomplete
    reporting period rather than a genuine operational drop — phrase
    this as a possibility ("...which may reflect incomplete data for
    this period") rather than a certainty either way.

EXAMPLES OF GOOD vs BAD:

BAD:  "Facility 0009 had 342,288 total requests and 332,214 completed
       requests, while Facility 0206 had 252,690 total and 243,691
       completed."

GOOD: "Facility 0009 is your busiest location by a wide margin, and it's
       keeping pace well — completing 97% of requests. Facility 0206,
       your second-busiest, runs at a similar 96% completion rate. Both
       are performing strongly."

BAD:  "There were 1,200 porters last year and 950 porters this year.
       Average TAT was 14.2 minutes last year and 9.8 minutes this year."

GOOD: "Your porter team is about 20% smaller than last year, but they're
       getting jobs done faster than ever — average completion time
       dropped from about 14 minutes to under 10. The smaller team is
       outperforming the larger one, likely due to improved routing or
       experience."
"""

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

CATEGORY "data_question": The user is asking about hospital operations
data — porter requests, assets, facilities, performance, trends,
comparisons, counts, etc. ANYTHING that would require querying a
database. This includes vague/broad questions like "how are we doing"
or "show me an overview" — these still need data.

CATEGORY "conversational": Greetings (hi, hello, hey), thanks/closings
(thanks, bye, that's helpful), or meta-questions about the ASSISTANT
ITSELF ("what can you do", "what data do you have access to", "how does
this work", "who are you").

Return JSON:
{{
  "category": "data_question" | "conversational",
  "reply": "If category is conversational, a brief friendly response
            (1-2 sentences). If data_question, this can be empty string."
}}

GUIDANCE FOR CONVERSATIONAL REPLIES:
- Greetings → warm, brief, mention you can help with porter/asset
  analytics. E.g. "Hi! I can help you explore porter requests, asset
  status, facility performance, and more — what would you like to know?"
- Thanks/closing → brief acknowledgment, no need to re-offer help every time
- "What can you do" → 2-3 sentence overview: porter request analytics
  (volumes, completion rates, TAT), asset management (status, warranty,
  maintenance), facility-level breakdowns and comparisons
- Keep ALL replies SHORT (1-3 sentences) — this is a chat interface,
  not a place for long explanations

EXAMPLES:
- "thanks, can you also show this by month" -> data_question (the
  "thanks" is incidental; "show this by month" is the actual request)
- "thanks!" (standalone, after a data response) -> conversational"""

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

QUESTION: {question}
CONVERSATION CONTEXT: {history or "none"}
{facility_note}

Think through this step by step and return JSON with these fields:

{{
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
  "requested_metrics": ["column-name-like strings explicitly named in the question, or empty list"]
}}

Think carefully — this plan will be used DIRECTLY to write SQL. A vague
or generic plan produces a vague or generic (and likely wrong) query."""

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.PLANNER_SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.0,
            max_tokens=600,
        )
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"^```json\s*", "", raw, flags=re.IGNORECASE)
        raw = re.sub(r"\s*```$", "", raw)

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
        prompt = f"""This ClickHouse SQL failed. Fix it.

ORIGINAL SQL:
{sql}

ERROR MESSAGE:
{error}

SCHEMA RULES:
{self.schema}

Return ONLY the corrected SQL, nothing else."""
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

        sample = df.head(10).to_dict("records")
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

    # ── Orchestration ─────────────────────────────────────────────────────
    def run(self, question: str, history: str = "", facility_id: str | None = None) -> tuple:
        """
        Runs the full pipeline.
        Returns: (sql, plan_dict, dataframe, success_bool, error_string)
        """
        logger.info("Pipeline started for question: %s", question)

        plan = self.plan_analysis(question, history, facility_id)
        logger.info("Plan generated: %s", plan)

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
                logger.error("Self-correction also failed. Error: %s", error)

        return sql, plan, df, success, (error or "")
