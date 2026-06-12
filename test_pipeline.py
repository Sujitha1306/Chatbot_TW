import asyncio
from backend.app.core.sql_pipeline import SQLGenerationPipeline
pipeline = SQLGenerationPipeline()
intent = pipeline.classify_intent("What is the average TAT for cancelled requests last month?")
sql = "SELECT avg(round(dateDiff('second', scheduled_time, completed_time) / 60.0, 2)) AS avg_tat_minutes FROM fact_porter_request WHERE status = 'RQ-CA' AND isNotNull(completed_time) AND toMonth(scheduled_time) = toMonth(today() - INTERVAL 1 MONTH) AND toYear(scheduled_time) = toYear(today() - INTERVAL 1 MONTH) LIMIT 500"
df, s, e = pipeline.db.execute_query_with_error(sql)
print("DF Success:", s, "Error:", e)
if s:
    print("Len DF:", len(df))
    # Test chart spec
    from backend.app.core.formatter import build_chart_spec
    try:
        spec = build_chart_spec(df, intent)
        print("Spec OK")
    except Exception as ex:
        print("Spec Error:", ex)
        
    # Test followups
    try:
        f = pipeline.generate_followups("test", intent)
        print("Followups OK")
    except Exception as ex:
        print("Followups Error:", ex)
