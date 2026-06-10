import pytest
from backend.app.core.sql_pipeline import SQLGenerationPipeline
from backend.config.settings import settings

HARD_QUERIES = [
    "What is the average TAT for cancelled requests last month?",
    "Show facilities where more than 50% of requests were cancelled",
    "Which porter had the fastest average TAT in June 2025?",
    "Count assets by criticality for facility 0184",
    "Show warranty expiring in the next 30 days with asset cost above 100000",
    "What percentage of requests were completed vs cancelled this year?",
    "Show hour-by-hour request volume for last week",
]

@pytest.fixture(scope="module")
def pipeline():
    return SQLGenerationPipeline()

@pytest.mark.parametrize("question", HARD_QUERIES)
def test_sql_executes(pipeline, question):
    sql, intent, df, success, error = pipeline.run(question)
    print(f"\n✅ {question}")
    print(f"   SQL: {sql[:120]}...")
    print(f"   Rows: {len(df) if df is not None else 0}, Error: {error}")
    assert success, f"Failed: {question}\nSQL: {sql}\nError: {error}"

def test_no_if_else_routing():
    """Verify the old guaranteed_queries dict is gone."""
    import inspect
    from backend.app.core import sql_pipeline
    source = inspect.getsource(sql_pipeline)
    assert "guaranteed_queries" not in source
    assert "_fallback_intent_analysis" not in source
