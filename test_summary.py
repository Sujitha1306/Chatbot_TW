import asyncio
from backend.app.core.sql_pipeline import SQLGenerationPipeline

async def main():
    pipeline = SQLGenerationPipeline()
    for q in [
        "Show porter performance by facility",
        "Compare porter performance year over year"
    ]:
        print(f"\n--- Q: {q} ---")
        sql, intent, df, success, error = pipeline.run(q)
        from backend.app.api.routes.chat import _build_summary_prompt
        prompt = _build_summary_prompt(q, df, intent)
        print("Prompt Generated:")
        print(prompt)
        print("\n--- Summary Stream ---")
        stream = pipeline.client.chat.completions.create(
            model=pipeline.model,
            messages=[
                {"role": "system", "content": pipeline.SUMMARY_SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            stream=False,
            temperature=0.3,
            max_tokens=300,
        )
        print(stream.choices[0].message.content)
        
        print("\n--- Followups ---")
        print(pipeline.generate_followups(q, intent))

asyncio.run(main())
