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
            # ── Event 0: session id (for new conversations) ──
            yield _sse({"event": "session", "id": session_id})

            # ── Event 1: intent (fast, ~0.5s) ──
            intent = pipeline.classify_intent(req.question)
            yield _sse({"event": "intent", "domain": intent["data_domain"], "chart_type": intent["chart_type"]})

            # ── Event 2: SQL generated (~2–4s) ──
            sql = pipeline.generate_sql(req.question, intent)
            yield _sse({"event": "sql", "sql": sql})

            # ── Event 3: Query executed ──
            df, success, error_msg = pipeline.db.execute_query_with_error(sql)

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
                    domain=intent.get("data_domain", "porter"),
                ))
                yield _sse({"event": "error", "message": f"Query failed: {error_msg}", "sql": sql})
                return

            # ── Event 4: Data ready ──
            data_payload = df.head(500).to_dict("records")
            yield _sse({
                "event": "data",
                "rows": data_payload,
                "row_count": len(df),
                "columns": list(df.columns),
            })

            # ── Event 5: Summary streamed token by token ──
            yield _sse({"event": "summary_start"})
            summary_prompt = _build_summary_prompt(req.question, df, intent)

            stream = pipeline.client.chat.completions.create(
                model=pipeline.model,
                messages=[
                    {"role": "system", "content": pipeline.SUMMARY_SYSTEM},
                    {"role": "user",   "content": summary_prompt},
                ],
                stream=True,
                temperature=0.3,
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
            chart_spec = build_chart_spec(df, intent)
            yield _sse({"event": "chart", "spec": chart_spec})

            # ── Event 7: Follow-up suggestions ──
            followups = pipeline.generate_followups(req.question, intent)
            yield _sse({"event": "followups", "suggestions": followups})

            # ── Event 8: Done ──
            yield _sse({"event": "done"})
            
            # Save assistant response to history
            _store.add_message(user_id, session_id, Message(
                role="assistant", 
                content=full_summary, 
                sql=sql, 
                row_count=len(df), 
                domain=intent.get("data_domain", "porter"),
                data=data_payload,
                chartSpec=chart_spec
            ))

        except Exception as e:
            import traceback
            logging.error("Stream error: %s\n%s", e, traceback.format_exc())
            yield _sse({"event": "error", "message": "An unexpected error occurred."})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _sse(payload: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(payload, default=str)}\n\n"


def _build_summary_prompt(question: str, df, intent: dict) -> str:
    sample = df.head(10).to_dict("records")
    return (
        f"QUESTION: {question}\n"
        f"DOMAIN: {intent.get('data_domain', 'porter')}\n"
        f"TOTAL ROWS: {len(df)}\n"
        f"SAMPLE DATA: {json.dumps(sample, default=str)}\n\n"
        "Write a 2–3 sentence plain-language summary for a hospital manager."
    )


_pipeline = None
def get_pipeline():
    global _pipeline
    if _pipeline is None:
        from backend.app.core.sql_pipeline import SQLGenerationPipeline
        _pipeline = SQLGenerationPipeline()
    return _pipeline
