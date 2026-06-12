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
    Call 3: Self-correction (only on SQL execution error, 800 tokens)
    """

    INTENT_SYSTEM = "Classify database query intent. Return ONLY valid JSON. No preamble, no markdown."

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

    # ── Call 1: Intent ────────────────────────────────────────────────────
    def classify_intent(self, question: str, history: str = "") -> dict:
        prompt = f"""Classify this hospital analytics query.

QUESTION: {question}
RECENT CONTEXT: {history or "none"}

COMPARISON DETECTION:
Set "comparison": true if the question asks to compare across MULTIPLE
time periods, groups, or categories — including implicitly. Examples:
- "year wise comparison" → true
- "compare this month to last month" → true
- "how has performance changed" → true
- "porter trends over time" → true
- "year on year" / "month on month" / "vs last year" → true
- "show porter performance" (single period, no comparison word) → false
- "total requests today" → false

If comparison=true, set "time_scope" to "comparison" regardless of
whether a specific period was mentioned.

Return this JSON exactly:
{{
  "data_domain": "porter|asset|both",
  "chart_type": "bar|line|pie|scatter|table|auto",
  "needs_tat": true|false,
  "time_scope": "specific_date|last_month|last_week|this_year|all_time|comparison|none",
  "aggregation": "count|sum|avg|min|max|none",
  "group_by_hint": "column name or empty string",
  "comparison": true|false
}}"""
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.INTENT_SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.0,
            max_tokens=200,
        )
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"^```json\s*", "", raw, flags=re.IGNORECASE)
        raw = re.sub(r"\s*```$", "", raw)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("Intent parse failed, using defaults. Raw: %s", raw)
            return {
                "data_domain": "porter", "chart_type": "bar",
                "needs_tat": False, "time_scope": "none",
                "aggregation": "count", "group_by_hint": "",
                "comparison": False,
            }

    # ── Call 2: SQL generation ────────────────────────────────────────────
    def generate_sql(self, question: str, intent: dict, history: str = "", facility_id: str | None = None) -> str:
        facility_constraint = ""
        if facility_id:
            facility_constraint = f"""
MANDATORY FILTER: This query MUST include a WHERE clause filtering
facility_id = '{facility_id}' (as a string, with quotes). This applies
to BOTH fact_porter_request and mysql_asset tables — whichever is used.
If the query already has a WHERE clause, add this as an additional
AND condition. If using GROUP BY across facilities, this filter still
applies — the result will only ever show data for THIS facility."""

        comparison_rule = ""
        if intent.get("comparison") or intent.get("time_scope") in ("year_over_year", "comparison", "all_time"):
            comparison_rule = """
COMPARISON QUERY — CRITICAL RULE:
This question asks for a COMPARISON across multiple time periods
(years, months, etc.). Your SQL MUST:
- NOT filter WHERE to a single year/month/period
- GROUP BY the period column (e.g. toYear(scheduled_time)) so the
  result contains ONE ROW PER PERIOD
- If no date range is specified, default to the last 2-3 periods:
  e.g. WHERE toYear(scheduled_time) >= toYear(today()) - 2
  (this still allows 3 rows in the result, one per year)
- ORDER BY the period column so periods appear chronologically
- NEVER produce a query that returns only 1 row when the question
  asks for a comparison — that means no comparison is possible
"""

        prompt = f"""Generate a ClickHouse SQL query to answer this question.

SCHEMA:
{self.schema}
{facility_constraint}
{comparison_rule}

QUESTION: {question}
INTENT: domain={intent.get('data_domain')}, needs_tat={intent.get('needs_tat')}, time_scope={intent.get('time_scope')}, group_by_hint={intent.get('group_by_hint')}
CONVERSATION CONTEXT: {history or "none"}

Requirements:
- Use ONLY tables and columns defined in the schema
- Apply ALL ClickHouse SQL rules from the schema
- Default LIMIT 500 unless question asks for all records
- If TAT needed: round(dateDiff('second',scheduled_time,completed_time)/60.0,2) AS tat_minutes
  with WHERE isNotNull(completed_time)
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
        return fixed.strip()

    # ── Data Gap Detection ────────────────────────────────────────────────
    def check_data_coverage(self, df: pd.DataFrame, intent: dict) -> dict:
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
        table = "fact_porter_request" if intent.get("data_domain") != "asset" else "mysql_asset"
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
    def generate_summary(self, question: str, df: pd.DataFrame, intent: dict) -> str:
        if df is None or df.empty:
            return "The query returned no results for the specified criteria."

        sample = df.head(10).to_dict("records")
        prompt = f"""QUESTION: {question}
DOMAIN: {intent.get('data_domain', 'porter')}
TOTAL ROWS: {len(df)}
SAMPLE DATA (first 10 rows): {json.dumps(sample, default=str)}

Write a 2–3 sentence plain-language summary of these results for a hospital manager."""

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.SUMMARY_SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.3,
            max_tokens=300,
        )
        return resp.choices[0].message.content.strip()

    # ── Follow-up suggestions ─────────────────────────────────────────────
    def generate_followups(self, question: str, intent: dict) -> list[str]:
        prompt = f"""Question: "{question}"
Domain: {intent.get('data_domain')}

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
        Returns: (sql, intent_dict, dataframe, success_bool, error_string)
        """
        logger.info("Pipeline started for question: %s", question)

        intent = self.classify_intent(question, history)
        logger.info("Intent classified: %s", intent)

        sql = self.generate_sql(question, intent, history, facility_id)

        df, success, error = self.db.execute_query_with_error(sql)

        # Safety net: comparison queries that return 1 row are wrong
        if success and intent.get("comparison") and len(df) <= 1:
            logger.warning("Comparison query returned %d row(s), regenerating: %s", len(df), question)
            sql = self.fix_sql(
                sql,
                "This query was supposed to compare multiple time periods but "
                "returned only 1 row. Remove any WHERE filter that restricts to "
                "a single year/month/period, and ensure GROUP BY produces one "
                "row per period (e.g. multiple years)."
            )
            df, success, error = self.db.execute_query_with_error(sql)

        if not success and error:
            logger.warning("SQL failed, attempting self-correction. Error: %s", error)
            sql = self.fix_sql(sql, error)
            df, success, error = self.db.execute_query_with_error(sql)
            if not success:
                logger.error("Self-correction also failed. Error: %s", error)

        return sql, intent, df, success, (error or "")
