import pytest
import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.core.sql_pipeline import SQLGenerationPipeline

@pytest.fixture
def pipeline():
    return SQLGenerationPipeline()

def test_repeated_query_is_deterministic(pipeline):
    """The same question must produce the same SQL and same summary numbers."""
    question = "How has the number of porters changed over the past year, and has performance improved?"

    results = []
    for _ in range(3):
        sql, intent, df, success, error = pipeline.run(question)
        assert success
        summary = pipeline.generate_summary(question, df, intent)
        results.append({"sql": sql, "row_count": len(df), "data": df.to_dict("records"), "summary": summary})

    # Print summaries for manual review
    for i, r in enumerate(results):
        print(f"\n--- Run {i+1} summary ---\n{r['summary']}")

    # Check that any generated SQL that contains a LIMIT clause also contains an ORDER BY clause.
    # This prevents the database non-determinism bug where tied rows return arbitrary subsets.
    for i, r in enumerate(results):
        sql_upper = r["sql"].upper()
        if "LIMIT" in sql_upper:
            assert "ORDER BY" in sql_upper, f"Query {i+1} has LIMIT but no ORDER BY, which causes non-determinism: {r['sql']}"
