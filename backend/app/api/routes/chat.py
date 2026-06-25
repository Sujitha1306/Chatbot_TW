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
    user_id: str = "default"
    session_id: Optional[str] = "default"
    chart_type: str = "auto"
    row_limit: int = 100
    filters: Optional[dict] = None


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
    if session_id in ("default", None) or not _store.session_exists(user_id, session_id):
        passed_id = session_id if session_id not in ("default", None) else None
        conv = _store.create(user_id, req.question, passed_id)
        session_id = conv.id
        
    _store.add_message(user_id, session_id, Message(role="user", content=req.question))

    async def event_generator():
        try:
            messages = _store.get_messages(user_id, session_id)
            # Exclude the message we just added to get the true prior history
            prior_messages = messages[:-1] if messages else []
            has_history = len(prior_messages) > 0
            
            current_history = _store.get_recent_context(user_id, session_id)

            # ── NEW: Resolve memory scope ──
            # Pass only the prior history to the memory resolver, otherwise it thinks the current question is prior context
            prior_history_text = "\n".join([f"{m.role.upper()}: {m.content[:200]}" for m in prior_messages[-(3 * 2):]])
            try:
                memory_scope = await asyncio.to_thread(
                    pipeline.resolve_memory_scope, req.question, prior_history_text, has_history
                )
            except Exception as e:
                logging.warning(f"resolve_memory_scope failed, defaulting to current_conversation: {e}")
                memory_scope = {"scope": "current_conversation", "reasoning": "exception_fallback"}

            if memory_scope.get("scope") == "other_conversation":
                search_terms = memory_scope.get("search_terms", [])
                past_matches = _store.search_past_conversations(
                    user_id=user_id,
                    search_terms=search_terms,
                    exclude_conv_id=session_id,
                )

                yield _sse({"event": "session", "id": session_id})

                if not past_matches:
                    response_text = "I checked your past conversations but didn't find anything matching that — could you tell me more about what you're looking for?"
                else:
                    response_text = await asyncio.to_thread(
                        pipeline.generate_cross_conversation_summary, req.question, past_matches
                    )

                if past_matches:
                    yield _sse({"event": "cross_conversation_results", "matches": [
                        {"conversation_id": m["conversation_id"], "title": m["title"]} for m in past_matches
                    ]})
                
                # Stream the response
                for word in response_text.split(" "):
                    yield _sse({"event": "token", "text": word + " "})
                    await asyncio.sleep(0.01)
                
                yield _sse({"event": "done"})

                _store.add_message(user_id, session_id, Message(
                    role="assistant", 
                    content=response_text, 
                    domain="cross_conversation",
                    crossConversationRefs=[
                        {"conversation_id": m["conversation_id"], "title": m["title"]} for m in past_matches
                    ]
                ))
                return  # ← stop here, do not proceed to plan_analysis/SQL

            # ── Stage 0: Routing — does this need data? ──
            try:
                routing = await asyncio.to_thread(
                    pipeline.route_message, req.question, history=current_history
                )
            except Exception as e:
                logging.warning(f"route_message failed, defaulting to data_question: {e}")
                routing = {"needs_data": True, "response": None, "reason": "router_exception_fallback"}

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
            plan = await asyncio.to_thread(
                pipeline.plan_analysis, req.question, history=current_history, filters=req.filters
            )
            yield _sse({"event": "intent", "domain": plan.get("data_domain", "porter"), "chart_type": plan.get("chart_type_hint", "auto")})

            # ── Event 1.5: Limitation Detection ──
            if plan.get("response_format") == "limitation":
                limitation_response = await asyncio.to_thread(
                    pipeline.generate_limitation_response, req.question, plan
                )
                yield _sse({"event": "summary_start"})
                yield _sse({"event": "token", "text": limitation_response})
                
                # We can also generate followups here
                followups = await asyncio.to_thread(
                    pipeline.generate_followups, req.question, plan
                )
                if followups:
                    yield _sse({"event": "followups", "suggestions": followups})
                    
                yield _sse({"event": "done"})
                _store.add_message(user_id, session_id, Message(
                    role="assistant", content=limitation_response,
                    domain="conversational", sql="", row_count=0,
                ))
                return


            if plan.get("had_implicit_reference") and not current_history.strip():
                yield _sse({"event": "token", "text": "I want to make sure I understand — could you clarify what you're referring to? For example, are you asking about individual porters, a specific facility, or something else?"})
                yield _sse({"event": "done"})
                return

            effective_question = plan.get("resolved_question", req.question)

            if plan.get("requires_multiple_queries") and plan.get("sub_queries"):
                multi_result = pipeline.run_multi(effective_question, plan, history=current_history, filters=req.filters)
                packaged = pipeline._package_multi_result(effective_question, plan, multi_result)

                yield _sse({"event": "sql", "sql": packaged["combined_sql"]})
                yield _sse({
                    "event": "multi_data",
                    "sections": packaged["display_sections"],
                    "row_count": sum(len(s["data"]) for s in packaged["sub_results"])
                })

                yield _sse({"event": "summary_start"})
                summary = await asyncio.to_thread(
                    pipeline.generate_synthesis_summary, effective_question, packaged, plan
                )
                # Stream the summary quickly to the user
                for word in summary.split(" "):
                    yield _sse({"event": "token", "text": word + " "})
                    await asyncio.sleep(0.01)

                # ── Follow-ups and Suggestions ──
                followups = await asyncio.to_thread(
                    pipeline.generate_followups, effective_question, plan
                )
                yield _sse({"event": "followups", "suggestions": followups})
                
                suggestions = await asyncio.to_thread(
                    pipeline.generate_suggestions, effective_question, summary, plan
                )
                if suggestions:
                    suggestion_text = "\n\n💡 Suggestions:\n" + "\n".join(f"• {s}" for s in suggestions)
                    
                    summary += suggestion_text
                    for word in suggestion_text.split(" "):
                        yield _sse({"event": "token", "text": word + " "})
                        await asyncio.sleep(0.01)

                yield _sse({"event": "done"})

                _store.add_message(user_id, session_id, Message(
                    role="assistant",
                    content=summary,
                    sql=packaged["combined_sql"],
                    row_count=sum(len(s["data"]) for s in packaged["sub_results"]),
                    domain="both",
                    filters=req.filters,
                    displaySections=packaged["display_sections"]
                ))
                return

            # ── Event 2: SQL generated (~2–4s) ──
            sql = await asyncio.to_thread(
                pipeline.generate_sql, effective_question, plan, filters=req.filters, history=_store.get_recent_context(user_id, session_id)
            )
            yield _sse({"event": "sql", "sql": sql})

            # ── Event 3: Query executed ──
            if not sql.strip():
                import pandas as pd
                df = pd.DataFrame([{"Result": "No relevant data for this question."}])
                success = True
                error_msg = ""
            else:
                df, success, error_msg = pipeline.db.execute_query_with_error(sql)

            if success and plan.get("comparison_needed") and len(df) <= 1:
                sql = await asyncio.to_thread(
                    pipeline.fix_sql,
                    sql,
                    "This was planned as a comparison "
                    f"({plan.get('comparison_basis', '')}) but returned only 1 row. "
                    "Adjust GROUP BY / remove over-restrictive WHERE filters so "
                    "multiple rows are returned, one per item being compared."
                )
                df, success, error_msg = await asyncio.to_thread(pipeline.db.execute_query_with_error, sql)
                yield _sse({"event": "sql_corrected", "sql": sql})

            if not success:
                # Self-correct once
                sql = await asyncio.to_thread(pipeline.fix_sql, sql, error_msg)
                df, success, error_msg = await asyncio.to_thread(pipeline.db.execute_query_with_error, sql)
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
            chart_spec, df = await asyncio.to_thread(build_chart_spec, df, plan)
            
            import numpy as np
            import pandas as pd
            from backend.app.core.display_resolution import _resolve_display_names
            
            display_payload_df = await asyncio.to_thread(_resolve_display_names, df.head(500))
            data_payload = display_payload_df.replace({np.nan: None, pd.NaT: None}).to_dict("records")
            yield _sse({
                "event": "data",
                "rows": data_payload,
                "row_count": len(df),
                "columns": list(display_payload_df.columns),
            })

            # ── Event 5: Summary streamed token by token ──
            yield _sse({"event": "summary_start"})
            coverage = await asyncio.to_thread(pipeline.check_data_coverage, df, plan)
            
            from backend.app.core.facility_lookup import get_facility_lookup
            facility_name = None
            if req.filters and req.filters.get("facility_id"):
                fac = get_facility_lookup().get(req.filters.get("facility_id"))
                facility_name = fac["facility_name"] if fac else None
            elif req.filters and req.filters.get("customer_id"):
                cid = req.filters.get("customer_id")
                from backend.app.core.facility_lookup import get_facility_lookup
                cname = get_facility_lookup().resolve_customer(cid)
                facility_name = f"Customer {cname}"

            summary_prompt = _build_summary_prompt(effective_question, df, plan, coverage, facility_name)
            prompt_logger = logging.getLogger("prompt_debugger")
            prompt_logger.error("=== SUMMARY SYSTEM PROMPT ===\n%s", pipeline.SUMMARY_SYSTEM)
            prompt_logger.error("=== SUMMARY USER PROMPT ===\n%s", summary_prompt)

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
            followups = await asyncio.to_thread(pipeline.generate_followups, effective_question, plan)
            yield _sse({"event": "followups", "suggestions": followups})

            # ── Event 7.5: Suggestions ──
            suggestions = await asyncio.to_thread(pipeline.generate_suggestions, effective_question, full_summary, plan)
            if suggestions:
                suggestion_text = "\n\n💡 Suggestions:\n" + "\n".join(f"• {s}" for s in suggestions)
                
                full_summary += suggestion_text
                
                for word in suggestion_text.split(" "):
                    yield _sse({"event": "token", "text": word + " "})
                    await asyncio.sleep(0.01)

            # ── Event 8: Done ──
            yield _sse({"event": "done"})
            
            # Save assistant response to history
            _store.add_message(user_id, session_id, Message(
                role="assistant", 
                content=full_summary, 
                sql=sql, 
                row_count=len(df), 
                domain=plan.get("data_domain", "porter"),
                filters=req.filters,
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
        import pandas as pd
        for i in range(1, len(values)):
            prev, curr = values[i-1], values[i]
            if pd.isna(prev) or prev == 0 or pd.isna(curr):
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
            lines.append(f"    ⚠ This change is unusually large compared to other period-to-period changes — please flag as a possible anomaly.")

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

    id_cols = [c for c in df.columns if c.endswith("_id") or c in ("name", "category", "porter_name", "facility_name")]

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
                if period_col:
                    label = f"period {df.loc[idx, period_col]}"
                elif id_cols:
                    label = f"entity ({id_cols[0]} = {df.loc[idx, id_cols[0]]})"
                else:
                    label = f"row {idx}"
                    
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


def _detect_tie_and_secondary_signal(df, plan: dict) -> str:
    """
    If the question implies ranking/finding a 'best' or 'top' entity,
    and the PRIMARY requested metric is tied (or nearly tied) across
    most rows, look for a natural secondary differentiator already
    present in the result set and surface the standout.
    """
    requested = plan.get("requested_metrics", [])
    primary_metric = requested[0] if requested else None
    if not primary_metric or primary_metric not in df.columns:
        return ""

    # Is this a "find the best/top" type question? Check the plan's
    # own calculation_plan text for ranking language — same technique
    # used elsewhere in this project to detect intent semantically
    # rather than via keyword-matching the raw question.
    calc_text = plan.get("calculation_plan", "").lower()
    is_ranking_question = any(kw in calc_text for kw in ["best", "top", "highest", "rank", "perform"])
    if not is_ranking_question or len(df) < 5:
        return ""

    # Tie detection: does the primary metric have very low variance,
    # or is one value shared by most/all rows?
    value_counts = df[primary_metric].value_counts()
    most_common_value = value_counts.index[0]
    most_common_share = value_counts.iloc[0] / len(df)

    if most_common_share < 0.5:
        return ""  # not a meaningful tie — primary metric already differentiates fine

    # A tie exists. Look for a secondary numeric column already in the
    # result set to use as a natural tiebreaker.
    numeric_cols = [c for c in df.select_dtypes(include="number").columns if c != primary_metric]
    if not numeric_cols:
        return ""

    # Prefer a volume/count-like column as the tiebreaker if present
    tiebreaker_col = next((c for c in numeric_cols if "completed" in c.lower() or "total" in c.lower() or "count" in c.lower()), numeric_cols[0])

    top_row = df.loc[df[tiebreaker_col].idxmax()]
    
    # Extract identity explicitly so the LLM doesn't hallucinate "TOTAL ROWS" as the ID
    id_cols = [c for c in df.columns if c.endswith("_id") or c in ("name", "category", "porter_name", "facility_name")]
    identity_str = "The standout entity"
    if id_cols:
        identity_str = f"The standout entity ({id_cols[0]} = {top_row[id_cols[0]]})"

    return (
        f"TIE DETECTED: {most_common_share*100:.0f}% of rows share the same "
        f"{primary_metric} value ({most_common_value}), so this metric alone "
        f"does not differentiate most entities. A natural secondary signal "
        f"already in this data is '{tiebreaker_col}'. {identity_str} has the maximum "
        f"value of {top_row[tiebreaker_col]} for this secondary metric. "
        f"(Full row data for context: {top_row.to_dict()}). "
        f"Your summary MUST mention this specific standout explicitly using its ID/name — do not "
        f"confuse row counts (like TOTAL ROWS) with entity IDs. Surface the most useful "
        f"secondary finding the user would naturally ask about next."
    )


FORMAT_INSTRUCTIONS = {
    "ranking": """
FORMAT — RANKING: Present findings in plain, flowing sentences describing the ranking.
Describe the top 3-5 entities and their values. Do not use numbered lists.
Then 1-2 sentences stating any reasonable inferences about what the ranking pattern means.""",

    "comparison": """
FORMAT — COMPARISON: Present findings in plain sentences clearly stating the before/after or group-A/group-B comparison.
State the exact change and direction (e.g., increased by X%).
Then 1-2 sentences stating any reasonable inferences about what the change direction suggests
(without attributing a cause — see HARD RULE 2).""",

    "trend": """
FORMAT — TREND: Narrate the change chronologically in plain sentences.
Start with the earliest period and end with the most recent.
Explicitly state: the direction of change, the magnitude as a percentage,
and whether the most recent period appears to be continuing or reversing
the trend. Keep it to 3-4 sentences maximum.""",

    "overview": """
FORMAT — OVERVIEW: Use short bullet points, one insight per bullet.
Each bullet should be one sentence. Cover:
- The single most notable number in the result
- Any significant outlier (highest, lowest, or furthest from median)
- The overall pattern in 1 sentence
Maximum 5 bullets.""",

    "single_stat": """
FORMAT — SINGLE STAT: Lead with the number itself, prominently.
Then one sentence of context (e.g. what time period, what scope).
Total response: 2-3 sentences maximum. No bullet points needed.""",

    "limitation": """
FORMAT — LIMITATION: Be direct and brief.
First sentence: state clearly what data is NOT available for this question.
Second sentence: state what related data IS available and can be shown.
Then proceed with whatever data IS available using the OVERVIEW format.""",
}


def _build_summary_prompt(question: str, df, plan: dict, coverage: dict = None, facility_name: str | None = None) -> str:
    import pandas as pd
    from backend.app.core.display_resolution import _resolve_display_names
    
    df = _resolve_display_names(df)
    
    coverage = coverage or {}
    
    response_format = plan.get("response_format", "overview")
    format_instruction = FORMAT_INSTRUCTIONS.get(response_format, FORMAT_INSTRUCTIONS["overview"])
    
    facility_context = ""
    if facility_name:
        facility_context = f"\nNOTE: This data is filtered to {facility_name} only. Frame your summary around this specific hospital, not hospitals in general.\n"

    if df.empty or (len(df) == 1 and not df.select_dtypes(include="number").empty and df.select_dtypes(include="number").fillna(0).sum(axis=1).iloc[0] == 0):
        if coverage.get("has_data_gap"):
            return f"""QUESTION: {question}
{facility_context}

The query returned no results. IMPORTANT CONTEXT: {coverage['note']}

Write a 2-3 sentence response that:
1. Explains that no data is currently available for the requested time period.
2. Mentions the data gap explained above. Frame this objectively: the lack of data means the status is unknown, rather than assuming the system is problem-free.
3. Suggests the user try a different time range or consult their data team.

Please maintain a neutral, analytical tone. Since data is missing, we cannot confirm whether the underlying count is actually zero or just unrecorded."""
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
            pct_lines = [f"  {idx}: {val:,.0f} ({(val/total*100) if total else 0:.1f}% of total)" for idx, val in top5.items()]
            pct_breakdown = "PERCENTAGE BREAKDOWN (top 5 by " + num_col + "):\n" + "\n".join(pct_lines)

    import numpy as np
    import pandas as pd
    sample = df.head(5).replace({np.nan: None, pd.NaT: None}).to_dict("records")

    comparison_hint = ""
    if plan.get("comparison_needed") or plan.get("grouping") not in ["unspecified", "", "none", "no grouping - single summary row"]:
        comparison_hint = "\nIMPORTANT: The user asked for a COMPARISON or BREAKDOWN. Please focus on pointing out differences, top categories, or trends across the grouped periods/items, rather than just stating the overall total."

    plan_context = f"""
ANALYTICAL CONTEXT: This query was planned to answer: {plan.get('calculation_plan', '')}
Please ensure your summary directly addresses this context. For example, if the plan involves
identifying peak values or top/bottom performers, please highlight which values meet those criteria
rather than just providing a general description of the data."""

    measure_cols = [c for c in df.select_dtypes(include="number").columns
                     if c not in ("year", "month", "_period_sort")]

    actual_range = _describe_actual_range(df, plan)
    trends       = _compute_period_trends(df, measure_cols)
    anomalies    = _detect_outliers(df, measure_cols)
    tie_signal   = _detect_tie_and_secondary_signal(df, plan)

    extra_context = "\n\n".join(filter(None, [actual_range, trends, anomalies, tie_signal]))

    return f"""QUESTION: {question}
DOMAIN: {plan.get('data_domain', 'porter')}
TOTAL ROWS: {len(df)}
{facility_context}

{extra_context}
{plan_context}

PRE-COMPUTED STATISTICS (please use these figures for accuracy without recalculating):
{chr(10).join(stats_lines) if stats_lines else "  (no numeric columns)"}

{pct_breakdown}

SAMPLE ROWS (for context only, first 5):
{json.dumps(sample, default=str)}

{comparison_hint}
Please review the context above and write your response.

{format_instruction}

REMINDER: Only mention numbers from the PRE-COMPUTED STATS block above. Do not invent metrics, causes, or comparisons not present in that data. Use flowing sentences as requested."""


_pipeline = None
def get_pipeline():
    global _pipeline
    if _pipeline is None:
        from backend.app.core.sql_pipeline import SQLGenerationPipeline
        _pipeline = SQLGenerationPipeline()
    return _pipeline

@router.post("/admin/refresh-lookups")
def refresh_lookups(_=Depends(require_api_key)):
    from backend.app.core.facility_lookup import get_facility_lookup
    from backend.app.core.term_lookup import get_term_lookup
    from backend.app.core.entity_lookups import get_user_lookup, get_location_lookup
    
    get_facility_lookup().refresh()
    get_term_lookup().refresh()
    get_user_lookup().refresh()
    get_location_lookup().refresh()
    return {"status": "refreshed"}
