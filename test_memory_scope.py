import sys
import os
import asyncio
sys.path.append(os.getcwd())
from backend.app.core.sql_pipeline import SQLGenerationPipeline
pipeline = SQLGenerationPipeline()
res = pipeline.resolve_memory_scope("tell me my name", "", False)
print("Memory scope result:", res)
