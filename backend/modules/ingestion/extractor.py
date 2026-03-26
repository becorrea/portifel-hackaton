import json
import io
from config import settings


def _build_prompt(text: str) -> str:
    return f"""Você é um extrator de dados financeiros brasileiros estrito.

TAREFA: Extraia as posições e movimentações do extrato e retorne um array JSON unificado.

PASSO 1 — POSIÇÃO ATUAL (seções: "Posição Detalhada", "Posição Atual", "Detalhamento de Ativos" com colunas Qtd e Preço Médio)
- Crie uma entrada por linha com operation="buy", quantity=Qtd, unit_price=Preço Médio, total_value=Qtd*PM
- Use a data mais recente encontrada nas Movimentações (ou data do extrato)
- Anote internamente os tickers extraídos aqui (lista A)

PASSO 2 — MOVIMENTAÇÕES (seções: "Movimentações", "Histórico", "Operações")
- Para tickers que JÁ ESTÃO na lista A (Posição): extraia SOMENTE operações que NÃO sejam compra (sell, dividend, income, redemption, application). Ignore linhas de compra desses tickers — elas já estão na Posição.
- Para tickers que NÃO estão na lista A (ex: BTC, CDB, Tesouro que só aparecem em Movimentações): extraia TODAS as operações normalmente.
- Dividendos/JCP/Rendimentos = "dividend", Juros/Rendimento de CDB = "income", Venda="sell", Resgate="redemption"

REGRAS DE TIPO:
1. Renda Fixa (CDB, LCI, LCA, Tesouro, Debenture): asset_type "fixed_income"
2. Fundos (Multimercado, FIA, FIDC): asset_type "fund"
3. FIIs (terminam em 11): asset_type "fii"
4. Crypto (BTC, ETH, etc): asset_type "crypto"
5. Ações (PETR4, VALE3, BBAS3, etc): asset_type "stock"
6. Se total_value e quantity existem mas unit_price não: unit_price = total_value / quantity
7. Se unit_price e quantity existem mas total_value não: total_value = unit_price * quantity
8. NUNCA invente tickers que não aparecem no texto
9. Se o ticker for ambíguo, use o nome mais descritivo disponível
10. Se um valor for ambíguo, prefira null

Campos de cada objeto:
- ticker: código exato do ativo (ex: "PETR4", "HGLG11", "TESOURO_IPCA_2029", "BTC")
- asset_type: "stock" | "fii" | "bdr" | "fixed_income" | "fund" | "crypto" | "international"
- operation: "buy" | "sell" | "income" | "dividend" | "application" | "redemption" | "split" | "bonus"
- quantity: número de cotas/ações/unidades (null se não informado)
- unit_price: preço unitário em reais (null se não informado)
- total_value: valor total em reais (null se não informado)
- date: data no formato YYYY-MM-DD
- source: "position_snapshot" se veio da Posição Detalhada | "movement" se veio das Movimentações

Retorne SOMENTE o array JSON, sem markdown, sem texto adicional.

Extrato:
{text[:6000]}"""


async def _extract_from_text(text: str) -> list:
    from openai import OpenAI

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Você é um extrator de dados financeiros estrito. "
                    "Retorne apenas JSON válido. "
                    "Nunca invente dados ausentes."
                ),
            },
            {"role": "user", "content": _build_prompt(text)},
        ],
        temperature=0.3,
    )

    json_str = response.choices[0].message.content

    # Strip accidental markdown fences
    if "```json" in json_str:
        json_str = json_str.split("```json")[1].split("```")[0]
    elif "```" in json_str:
        json_str = json_str.split("```")[1].split("```")[0]

    transactions = json.loads(json_str.strip())
    return transactions if isinstance(transactions, list) else []


async def _extract_from_pdf(content: bytes) -> list:
    try:
        import PyPDF2

        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = "\n".join(
            page.extract_text() or "" for page in pdf_reader.pages
        )
    except Exception as e:
        print(f"PDF read error: {e}")
        text = content.decode("utf-8", errors="replace")

    return await _extract_from_text(text)


async def _extract_from_xlsx(content: bytes) -> list:
    import pandas as pd

    xlsx_file = io.BytesIO(content)
    xls = pd.ExcelFile(xlsx_file, engine="openpyxl")

    sheet_texts = []
    for sheet_name in xls.sheet_names:
        df = xls.parse(sheet_name)
        sheet_texts.append(f"=== Sheet: {sheet_name} ===\n{df.to_string(index=False)}")

    combined_text = "\n\n".join(sheet_texts)
    return await _extract_from_text(combined_text)


async def extract_financial_summary(text: str) -> dict:
    """Extract the financial summary table (Resumo Financeiro) from statement text."""
    from openai import OpenAI

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    prompt = f"""Analise o extrato e encontre a tabela de "Resumo Financeiro", "Resumo da Carteira" ou similar.

Retorne SOMENTE um objeto JSON com os campos abaixo (use null se não encontrado):
- saldo_anterior: saldo anterior em reais (número)
- aplicacoes: total de aplicações/compras em reais (número positivo)
- resgates: total de resgates/vendas em reais (número positivo)
- rendimento: total de rendimentos/juros/dividendos em reais (número)
- saldo_atual: saldo atual em reais (número)
- ir_iof: impostos retidos em reais (número positivo)
- saldo_liquido: saldo líquido final em reais (número)

Retorne SOMENTE o objeto JSON, sem markdown.

Extrato:
{text[:3000]}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Você extrai dados financeiros. Retorne apenas JSON válido."},
                {"role": "user", "content": prompt},
            ],
            temperature=0,
        )
        json_str = response.choices[0].message.content.strip()
        if "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].lstrip("json").strip()
        return json.loads(json_str)
    except Exception as e:
        print(f"Summary extraction error: {e}")
        return {}


async def extract_transactions_from_pdf(file_text: str) -> list:
    """Legacy entry point kept for backward compatibility (accepts pre-extracted text)."""
    try:
        return await _extract_from_text(file_text)
    except Exception as e:
        print(f"Extraction error: {e}")
        return []


async def extract_transactions(content: bytes, filename: str) -> list:
    """Dispatch extraction based on file extension."""
    try:
        lower = filename.lower()
        if lower.endswith(".pdf"):
            return await _extract_from_pdf(content)
        elif lower.endswith((".xlsx", ".xls")):
            return await _extract_from_xlsx(content)
        else:
            text = content.decode("utf-8", errors="replace")
            return await _extract_from_text(text)
    except Exception as e:
        print(f"Extraction error ({filename}): {e}")
        return []
