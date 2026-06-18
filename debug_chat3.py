from backend.app.core.sql_pipeline import SQLGenerationPipeline
p = SQLGenerationPipeline()
memory_scope = p.resolve_memory_scope(
    message="By the way, do you remember my name?", 
    current_history="USER: By the way, do you remember my name?", 
    has_current_history=True
)
print("WITH ONLY CURRENT QUESTION:")
print(memory_scope)
