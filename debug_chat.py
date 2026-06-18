from backend.app.core.sql_pipeline import SQLGenerationPipeline
p = SQLGenerationPipeline()
memory_scope = p.resolve_memory_scope("By the way, do you remember my name?", "", False)
print("TYPE:", type(memory_scope))
print("VALUE:", memory_scope)
print("SCOPE:", memory_scope.get("scope"))
print("IS MATCH:", memory_scope.get("scope") == "other_conversation")
