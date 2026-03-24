import pytest

def test_brapi_client_structure():
    """Test Brapi client exists and is importable."""
    from modules.market.brapi_client import get_brapi_price
    assert callable(get_brapi_price)

def test_yfinance_client_structure():
    """Test yfinance client exists and is importable."""
    from modules.market.yfinance_client import get_yfinance_price
    assert callable(get_yfinance_price)
