from backend.app.core.sql_pipeline import SQLGenerationPipeline
p = SQLGenerationPipeline()
scope = p.resolve_memory_scope("By the way, do you remember my name?", "", False)
print(scope)
