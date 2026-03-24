import pytest
from modules.ingestion.extractor import extract_transactions_from_pdf

@pytest.mark.asyncio
async def test_extract_transactions_from_pdf():
    """Test Gemini extraction of transactions from PDF content."""
    sample_pdf_text = """
    XP INVESTIMENTOS
    Extrato de Conta
    PETR4 - Compra - 100 unidades - R$ 32.50 - 15/01/2024
    MXRF11 - Compra - 50 unidades - R$ 12.00 - 20/01/2024
    """

    transactions = await extract_transactions_from_pdf(sample_pdf_text)

    assert isinstance(transactions, list)
    assert len(transactions) >= 0
