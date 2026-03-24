import json
from config import settings

async def extract_transactions_from_pdf(pdf_text: str) -> list:
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""Você é especialista em extração de dados financeiros. Analise o extrato:

{pdf_text[:2000]}

Retorne SOMENTE JSON (sem markdown):
[{{"ticker":"PETR4","asset_type":"stock","operation":"buy","quantity":100,"unit_price":32.50,"total_value":3250.00,"date":"2024-01-15"}}]

IMPORTANTE: Somente JSON, sem texto adicional."""
        
        response = await model.generate_content_async(prompt)
        json_str = response.text
        
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0]
        
        transactions = json.loads(json_str.strip())
        return transactions if isinstance(transactions, list) else []
    except Exception as e:
        print(f"Extraction error: {e}")
        return []
