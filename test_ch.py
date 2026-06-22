from dotenv import load_dotenv
load_dotenv()
from backend.app.db.clickhouse import ClickHouseConnection

client = ClickHouseConnection()
client.connect()
query = """
SELECT
    porter_user_id,
    count() AS delayed_request_count
FROM fact_porter_request
WHERE
    status = 'RQ-CO'
    AND isNotNull(completed_time)
    AND isNotNull(porter_user_id)
    AND round(dateDiff('second', scheduled_time, completed_time)/60.0, 2) > 30
    AND scheduled_time <= now() + INTERVAL 1 DAY
    AND completed_time <= now() + INTERVAL 1 DAY
GROUP BY porter_user_id
ORDER BY delayed_request_count DESC, porter_user_id ASC
LIMIT 5
"""
try:
    df, success = client.execute_query(query)
    print("Success:", success)
    print("Result Rows:", len(df) if df is not None else 0)
    if df is not None and not df.empty:
        print(df.head())
except Exception as e:
    print("Error:", e)
