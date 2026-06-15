from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import asyncio
import json
import logging
from backend.app.core.chatbot import TrackerWaveChatbot
from backend.app.api.deps import require_api_key
from backend.app.db.conversation_store import _store, Message
from backend.app.core.formatter import build_chart_spec

router = APIRouter(prefix="/chat", tags=["chat"])


from typing import Optional

class QueryRequest(BaseModel):
    question: str
    session_id: Optional[str] = "default"
    chart_type: str = "auto"
    row_limit: int = 100
    facility_id: Optional[str] = None


class QueryResponse(BaseModel):
    success: bool
    summary: str
    sql: str
    row_count: int
    data_domain: str
    from_cache: bool = False


_chatbot: TrackerWaveChatbot | None = None

def get_chatbot() -> TrackerWaveChatbot:
    global _chatbot
    if _chatbot is None:
        _chatbot = TrackerWaveChatbot()
    return _chatbot


@router.post("/query", response_model=QueryResponse)
def query(req: QueryRequest, _=Depends(require_api_key)):
    bot = get_chatbot()
    result = bot.process_query(
        user_question=req.question,
        row_limit=req.row_limit,
        chart_type_override=req.chart_type if req.chart_type != "auto" else None,
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Query failed"))
    return QueryResponse(
        success=result["success"],
        summary=result.get("summary", ""),
        sql=result.get("sql", ""),
        row_count=result.get("row_count", 0),
        data_domain=result.get("data_domain", "porter"),
        from_cache=result.get("from_cache", False),
    )


@router.post("/stream")
async def stream_query(req: QueryRequest, _=Depends(require_api_key)):
    """
    SSE streaming endpoint. Sends JSON events as they complete.
    Consumed via fetch + ReadableStream on the frontend.
    """
    pipeline = get_pipeline()
    
    # Optional auth user info from deps (if Phase 3 JWT used, req.session_id isn't strictly secure, but okay for MVP)
    user_id = getattr(req, "user_id", "default")
    
    # Use a local variable - don't mutate req
    session_id = req.session_id
    if session_id in ("default", None) or session_id not in _store._store[user_id]:
        passed_id = session_id if session_id not in ("default", None) else None
        conv = _store.create(user_id, req.question, passed_id)
        session_id = conv.id
        
    _store.add_message(user_id, session_id, Message(role="user", content=req.question))

    async def event_generator():
        try:
            # ── Stage 0: Routing — does this need data? ──
            routing = pipeline.route_message(req.question, history=_store.get_recent_context(user_id, session_id))

            if not routing["needs_data"]:
                # Short-circuit — respond directly, skip the entire SQL pipeline
                yield _sse({"event": "session", "id": session_id})
                yield _sse({"event": "conversational"})  # NEW event type — frontend shows this differently (no chart/table panels)
                yield _sse({"event": "summary_start"})

                # Stream the conversational reply token-by-token for consistency
                # with the normal flow (or just send it as one token — simpler)
                yield _sse({"event": "token", "text": routing["response"]})
                yield _sse({"event": "done"})

                _store.add_message(user_id, session_id, Message(
                    role="assistant",
                    content=routing["response"],
                    sql="", row_count=0, domain="conversational",
                ))
                return  # ← STOP HERE, do not proceed to intent/SQL/etc.

            # ── Event 0: session id (for new conversations) ──
            yield _sse({"event": "session", "id": session_id})

            # ── Event 1: plan analysis (fast, ~0.5s) ──
            plan = pipeline.plan_analysis(req.question, history=_store.get_recent_context(user_id, session_id), facility_id=req.facility_id)
            yield _sse({"event": "intent", "domain": plan.get("data_domain", "porter"), "chart_type": plan.get("chart_type_hint", "auto")})

            # ── Event 2: SQL generated (~2–4s) ──
            sql = pipeline.generate_sql(req.question, plan, facility_id=req.facility_id, history=_store.get_recent_context(user_id, session_id))
            yield _sse({"event": "sql", "sql": sql})

            # ── Event 3: Query executed ──
            df, success, error_msg = pipeline.db.execute_query_with_error(sql)

            if success and plan.get("comparison_needed") and len(df) <= 1:
                sql = pipeline.fix_sql(
                    sql,
                    "This was planned as a comparison "
                    f"({plan.get('comparison_basis', '')}) but returned only 1 row. "
                    "Adjust GROUP BY / remove over-restrictive WHERE filters so "
                    "multiple rows are returned, one per item being compared."
                )
                df, success, error_msg = pipeline.db.execute_query_with_error(sql)
                yield _sse({"event": "sql_corrected", "sql": sql})

            if not success:
                # Self-correct once
                sql = pipeline.fix_sql(sql, error_msg)
                df, success, error_msg = pipeline.db.execute_query_with_error(sql)
                yield _sse({"event": "sql_corrected", "sql": sql})

            if not success:
                _store.add_message(user_id, session_id, Message(
                    role="assistant", 
                    content=f"Query failed: {error_msg}", 
                    sql=sql, 
                    row_count=0, 
                    domain=plan.get("data_domain", "porter"),
                ))
                yield _sse({"event": "error", "message": f"Query failed: {error_msg}", "sql": sql})
                return

            # ── Event 4: Data ready ──
            # Build chart spec BEFORE data payload so synthetic columns (_period) are sent
            chart_spec, df = build_chart_spec(df, plan)
            
            import numpy as np
            import pandas as pd
            data_payload = df.head(500).replace({np.nan: None, pd.NaT: None}).to_dict("records")
            yield _sse({
                "event": "data",
                "rows": data_payload,
                "row_count": len(df),
                "columns": list(df.columns),
            })

            # ── Event 5: Summary streamed token by token ──
            yield _sse({"event": "summary_start"})
            coverage = pipeline.check_data_coverage(df, plan)
            
            from backend.app.core.facility_lookup import get_facility_lookup
            facility_name = None
            if req.facility_id:
                fac = get_facility_lookup().get(req.facility_id)
                facility_name = fac["facility_name"] if fac else None

            summary_prompt = _build_summary_prompt(req.question, df, plan, coverage, facility_name)

            stream = pipeline.client.chat.completions.create(
                model=pipeline.model,
                messages=[
                    {"role": "system", "content": pipeline.SUMMARY_SYSTEM},
                    {"role": "user",   "content": summary_prompt},
                ],
                stream=True,
                temperature=0.0,
                max_tokens=300,
            )
            full_summary = ""
            for chunk in stream:
                if len(chunk.choices) > 0:
                    token = chunk.choices[0].delta.content or ""
                    if token:
                        full_summary += token
                        yield _sse({"event": "token", "text": token})
                        await asyncio.sleep(0)   # yield control to event loop

            # ── Event 6: Chart spec ──
            yield _sse({"event": "chart", "spec": chart_spec})

            # ── Event 7: Follow-up suggestions ──
            followups = pipeline.generate_followups(req.question, plan)
            yield _sse({"event": "followups", "suggestions": followups})

            # ── Event 8: Done ──
            yield _sse({"event": "done"})
            
            # Save assistant response to history
            _store.add_message(user_id, session_id, Message(
                role="assistant", 
                content=full_summary, 
                sql=sql, 
                row_count=len(df), 
                domain=plan.get("data_domain", "porter"),
                data=data_payload,
                chartSpec=chart_spec
            ))

        except Exception as e:
            import traceback
            logging.error("Stream error: %s\n%s", e, traceback.format_exc())
            yield _sse({"event": "error", "message": "An unexpected error occurred while generating the summary."})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _sse(payload: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(payload, default=str)}\n\n"


def _describe_actual_range(df, plan: dict) -> str:
    """Compute the ACTUAL date/period range covered by the result,
    independent of what the user's question implied."""
    import pandas as pd

    # Look for period-like columns
    period_cols = [c for c in df.columns if c in ("_period", "month", "year", "request_year", "period")]
    if not period_cols:
        return ""

    if "_period" in df.columns:
        periods = df["_period"].tolist()
        if len(periods) >= 2:
            return f"ACTUAL DATA RANGE: This result covers {periods[0]} through {periods[-1]} ({len(periods)} periods)."
    elif "year" in df.columns and "month" in df.columns:
        MONTH_NAMES = {1:"Jan",2:"Feb",3:"Mar",4:"Apr",5:"May",6:"Jun",7:"Jul",8:"Aug",9:"Sep",10:"Oct",11:"Nov",12:"Dec"}
        first = df.iloc[0]
        last = df.iloc[-1]
        return (f"ACTUAL DATA RANGE: This result covers "
                f"{MONTH_NAMES.get(int(first['month']), first['month'])} {int(first['year'])} through "
                f"{MONTH_NAMES.get(int(last['month']), last['month'])} {int(last['year'])} "
                f"({len(df)} periods).")
    elif "request_year" in df.columns or "year" in df.columns:
        col = "request_year" if "request_year" in df.columns else "year"
        years = sorted(df[col].unique())
        return f"ACTUAL DATA RANGE: This result covers {len(years)} year(s): {', '.join(str(int(y)) for y in years)}."

    return ""


def _compute_period_trends(df, measure_cols: list) -> str:
    """For time-series results with 3+ rows, compute period-over-period
    % change for each measure and highlight the largest swings."""
    if len(df) < 3:
        return ""

    period_cols = [c for c in df.columns if c in ("_period", "month", "year", "request_year")]
    if not period_cols:
        return ""

    lines = []
    for col in measure_cols[:3]:  # cap to avoid prompt bloat
        values = df[col].tolist()
        changes = []
        for i in range(1, len(values)):
            prev, curr = values[i-1], values[i]
            if prev == 0:
                continue
            pct_change = (curr - prev) / prev * 100
            changes.append((i, pct_change))

        if not changes:
            continue

        # Find the largest absolute change
        largest = max(changes, key=lambda x: abs(x[1]))
        idx, pct = largest
        period_label = df.iloc[idx].get("_period", f"period {idx+1}")
        prev_label = df.iloc[idx-1].get("_period", f"period {idx}")
        direction = "increased" if pct > 0 else "decreased"

        lines.append(
            f"  {col}: largest change is {direction} by {abs(pct):.1f}% "
            f"from {prev_label} to {period_label} "
            f"({values[idx-1]:,.1f} → {values[idx]:,.1f})"
        )

        # Also flag if this single change is much bigger than others
        # (signals a potential anomaly, feeds into 9.2.3)
        other_changes = [abs(c[1]) for c in changes if c[0] != idx]
        if other_changes and abs(pct) > 2 * (sum(other_changes) / len(other_changes)):
            lines.append(f"    ⚠ This change is unusually large compared to other period-to-period changes — worth flagging as a possible anomaly.")

    if not lines:
        return ""
    return "PERIOD-OVER-PERIOD TRENDS (pre-computed):\n" + "\n".join(lines)


def _detect_outliers(df, measure_cols: list) -> str:
    """Flag rows where a measure is >1.5x IQR from the rest — classic
    box-plot outlier detection, applied per measure column."""
    if len(df) < 4:  # need enough rows for meaningful IQR
        return ""

    period_col = "_period" if "_period" in df.columns else None
    lines = []

    for col in measure_cols[:3]:
        values = df[col]
        q1, q3 = values.quantile(0.25), values.quantile(0.75)
        iqr = q3 - q1
        if iqr == 0:
            continue
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        outlier_mask = (values < lower_bound) | (values > upper_bound)
        if outlier_mask.any():
            for idx in df[outlier_mask].index:
                label = df.loc[idx, period_col] if period_col else f"row {idx}"
                direction = "lower" if values[idx] < lower_bound else "higher"
                lines.append(
                    f"  {label}: {col} = {values[idx]:,.1f} is notably {direction} "
                    f"than the typical range ({lower_bound:,.1f} to {upper_bound:,.1f})"
                )

    if not lines:
        return ""
    return ("POTENTIAL ANOMALIES (statistical outliers detected):\n" + "\n".join(lines) +
            "\n\nNote: an unusually low value in the MOST RECENT period may indicate "
            "incomplete/partial data for that period rather than an operational issue.")


def _build_summary_prompt(question: str, df, plan: dict, coverage: dict = None, facility_name: str | None = None) -> str:
    import pandas as pd
    
    coverage = coverage or {}
    
    facility_context = ""
    if facility_name:
        facility_context = f"\nNOTE: This data is filtered to {facility_name} only. Frame your summary around this specific hospital, not hospitals in general.\n"

    if df.empty or (len(df) == 1 and not df.select_dtypes(include="number").empty and df.select_dtypes(include="number").fillna(0).sum(axis=1).iloc[0] == 0):
        if coverage.get("has_data_gap"):
            return f"""QUESTION: {question}
{facility_context}

The query returned no results. IMPORTANT CONTEXT: {coverage['note']}

Write a 2-3 sentence response that:
1. States clearly that NO DATA was found for the requested time period
2. Notes the data gap explained above — do NOT say "everything is fine"
   or "no issues" — instead say something like "there's no recorded
   data for this period yet, so this can't be confirmed either way"
3. Suggests the user try a different time range or check with their
   data team if this is unexpected

Do NOT interpret this as a positive result (e.g. "no problems!").
An absence of data is NOT the same as a confirmed zero."""
        else:
            return f"""QUESTION: {question}
{facility_context}

The query returned a genuine zero/empty result — there IS data for this
period, but the specific thing asked about (e.g. assets under
maintenance, cancelled requests) has a count of zero.

Write a 2-3 sentence response confirming this is a real zero (e.g.
"Currently, zero assets are under maintenance — all equipment is
available."). This IS good news and can be stated positively, since
we've confirmed data exists for this period and the count is genuinely 0."""

    stats_lines = []
    numeric_cols = df.select_dtypes(include="number").columns.tolist()

    # Pre-compute aggregates so the LLM doesn't do unreliable math
    for col in numeric_cols[:5]:  # cap to avoid prompt bloat
        total = df[col].sum()
        mean  = df[col].mean()
        stats_lines.append(f"  {col}: sum={total:,.1f}, avg={mean:,.2f}, min={df[col].min():,.1f}, max={df[col].max():,.1f}")

    # If there's a categorical column with a numeric column, compute
    # percentage breakdowns — this is what lets the LLM say "97%"
    categorical_cols = df.select_dtypes(include="object").columns.tolist()
    pct_breakdown = ""
    if categorical_cols and numeric_cols:
        cat_col, num_col = categorical_cols[0], numeric_cols[0]
        if df[num_col].sum() > 0:
            grouped = df.groupby(cat_col)[num_col].sum().sort_values(ascending=False)
            total = grouped.sum()
            top5 = grouped.head(5)
            pct_lines = [f"  {idx}: {val:,.0f} ({val/total*100:.1f}% of total)" for idx, val in top5.items()]
            pct_breakdown = "PERCENTAGE BREAKDOWN (top 5 by " + num_col + "):\n" + "\n".join(pct_lines)

    import numpy as np
    import pandas as pd
    sample = df.head(5).replace({np.nan: None, pd.NaT: None}).to_dict("records")

    comparison_hint = ""
    if plan.get("comparison_needed") or plan.get("grouping") not in ["unspecified", "", "none", "no grouping - single summary row"]:
        comparison_hint = "\nIMPORTANT: The user asked for a COMPARISON or BREAKDOWN. Do NOT just summarize the overall total. Make sure to point out the differences, top categories, or trends across the grouped periods/items."

    plan_context = f"""
ANALYTICAL CONTEXT: This query was planned to answer: {plan.get('calculation_plan', '')}
Make sure your summary directly addresses this — if the plan was about
identifying PEAK values or BEST/WORST performers, your summary's main
point should be WHICH value is peak/best/worst, not just a general
description of the data."""

    measure_cols = [c for c in df.select_dtypes(include="number").columns
                     if c not in ("year", "month", "_period_sort")]

    actual_range = _describe_actual_range(df, plan)
    trends       = _compute_period_trends(df, measure_cols)
    anomalies    = _detect_outliers(df, measure_cols)

    extra_context = "\n\n".join(filter(None, [actual_range, trends, anomalies]))

    return f"""QUESTION: {question}
DOMAIN: {plan.get('data_domain', 'porter')}
TOTAL ROWS: {len(df)}
{facility_context}

{extra_context}
{plan_context}

PRE-COMPUTED STATISTICS (use these for accuracy — do not recalculate):
{chr(10).join(stats_lines) if stats_lines else "  (no numeric columns)"}

{pct_breakdown}

SAMPLE ROWS (for context only, first 5):
{json.dumps(sample, default=str)}

{comparison_hint}
Write your response following ALL the COMMUNICATION RULES in your system prompt,
including DATA RANGE HONESTY, TREND AWARENESS, and ANOMALY AWARENESS where applicable."""


_pipeline = None
def get_pipeline():
    global _pipeline
    if _pipeline is None:
        from backend.app.core.sql_pipeline import SQLGenerationPipeline
        _pipeline = SQLGenerationPipeline()
    return _pipeline
