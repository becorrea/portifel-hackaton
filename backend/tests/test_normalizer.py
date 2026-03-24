import pytest
from modules.ingestion.normalizer import validate_transaction

def test_validate_transaction():
    """Test transaction validation."""
    txn = {
        "ticker": "PETR4",
        "asset_type": "stock",
        "operation": "buy",
        "quantity": 100,
        "unit_price": 32.50,
        "total_value": 3250.00,
        "date": "2024-01-15"
    }

    validated = validate_transaction(txn)
    assert validated["ticker"] == "PETR4"
    assert validated["quantity"] == 100.0

def test_validate_transaction_invalid():
    """Test invalid transaction."""
    from modules.ingestion.normalizer import ValidationError
    txn = {"ticker": "PETR4"}  # Incomplete

    with pytest.raises(ValidationError):
        validate_transaction(txn)
