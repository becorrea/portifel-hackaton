from supabase import create_client
from config import settings

class ValidationError(Exception):
    pass

REQUIRED_FIELDS = ["ticker", "asset_type", "operation", "quantity", "unit_price", "total_value", "date"]

def validate_transaction(txn):
    missing = [f for f in REQUIRED_FIELDS if f not in txn]
    if missing:
        raise ValidationError(f"Missing fields: {missing}")
    
    valid_types = ["stock", "fii", "bdr", "fixed_income", "crypto", "international"]
    if txn.get("asset_type") not in valid_types:
        raise ValidationError(f"Invalid asset_type")
    
    valid_ops = ["buy", "sell", "income", "split", "bonus"]
    if txn.get("operation") not in valid_ops:
        raise ValidationError(f"Invalid operation")
    
    return {
        "ticker": str(txn["ticker"]).upper(),
        "asset_type": txn["asset_type"],
        "operation": txn["operation"],
        "quantity": float(txn["quantity"]),
        "unit_price": float(txn["unit_price"]),
        "total_value": float(txn["total_value"]),
        "date": txn["date"],
    }

async def save_transactions(user_id: str, statement_id: str, transactions: list, supabase_client=None) -> str:
    if not supabase_client:
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    
    normalized = []
    for txn in transactions:
        try:
            validated = validate_transaction(txn)
            validated["user_id"] = user_id
            validated["statement_id"] = statement_id
            normalized.append(validated)
        except ValidationError:
            pass
    
    if normalized:
        supabase_client.table("transactions").insert(normalized).execute()
    
    return statement_id

async def update_statement_status(statement_id: str, status: str, error_message: str = None, supabase_client=None):
    if not supabase_client:
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    
    data = {"status": status}
    if error_message:
        data["error_message"] = error_message
    
    supabase_client.table("statements").update(data).eq("id", statement_id).execute()
