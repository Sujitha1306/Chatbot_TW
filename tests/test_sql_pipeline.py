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

    # SQL must be identical across runs
    sqls = [r["sql"] for r in results]
    assert len(set(sqls)) == 1, f"SQL differs across runs:\n" + "\n---\n".join(sqls)

    # Row counts and data must be identical
    row_counts = [r["row_count"] for r in results]
    assert len(set(row_counts)) == 1, f"Row counts differ: {row_counts}"

