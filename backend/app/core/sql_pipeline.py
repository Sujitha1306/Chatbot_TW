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

    SUMMARY_SYSTEM = """You are an analytics assistant for hospital operations.
Write a clear, concise 2-3 sentence summary of query results for a non-technical user.
Use plain language. Mention specific numbers. No markdown."""

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

Return this JSON exactly:
{{
  "data_domain": "porter|asset|both",
  "chart_type": "bar|line|pie|scatter|table|auto",
  "needs_tat": true|false,
  "time_scope": "specific_date|last_month|last_week|this_year|all_time|none",
  "aggregation": "count|sum|avg|min|max|none",
  "group_by_hint": "column name or empty string"
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
            }

    # ── Call 2: SQL generation ────────────────────────────────────────────
    def generate_sql(self, question: str, intent: dict, history: str = "") -> str:
        prompt = f"""Generate a ClickHouse SQL query to answer this question.

SCHEMA:
{self.schema}

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

Suggest 3 natural follow-up questions a hospital analyst would ask next.
Return ONLY a JSON array of 3 strings. Example: ["q1", "q2", "q3"]"""
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

    # ── Main pipeline ─────────────────────────────────────────────────────
    def run(
        self,
        question: str,
        history: str = "",
    ) -> tuple[str, dict, pd.DataFrame, bool, str]:
        """
        Returns: (sql, intent, dataframe, success, error_message)
        Never raises — always returns a tuple.
        """
        intent = self.classify_intent(question, history)
        sql    = self.generate_sql(question, intent, history)

        df, success, error = self.db.execute_query_with_error(sql)

        if not success and error:
            logger.warning("SQL failed, attempting self-correction. Error: %s", error)
            sql = self.fix_sql(sql, error)
            df, success, error = self.db.execute_query_with_error(sql)
            if not success:
                logger.error("Self-correction also failed. Error: %s", error)

        return sql, intent, df, success, (error or "")
