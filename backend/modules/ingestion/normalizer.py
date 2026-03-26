from supabase import create_client
from config import settings

class ValidationError(Exception):
    pass

def validate_transaction(txn):
    for field in ["ticker", "asset_type", "operation", "date"]:
        if not txn.get(field):
            raise ValidationError(f"Missing required field: {field}")

    valid_types = ["stock", "fii", "bdr", "fixed_income", "crypto", "international", "fund"]
    if txn.get("asset_type") not in valid_types:
        raise ValidationError(f"Invalid asset_type: {txn.get('asset_type')!r}")

    valid_ops = ["buy", "sell", "income", "split", "bonus", "dividend", "application", "redemption"]
    if txn.get("operation") not in valid_ops:
        raise ValidationError(f"Invalid operation: {txn.get('operation')!r}")

    quantity = txn.get("quantity")
    unit_price = txn.get("unit_price")
    total_value = txn.get("total_value")

    if quantity and total_value and not unit_price:
        unit_price = float(total_value) / float(quantity)
    elif quantity and unit_price and not total_value:
        total_value = float(quantity) * float(unit_price)
    elif total_value and unit_price and not quantity:
        quantity = float(total_value) / float(unit_price)

    quantity = float(quantity) if quantity is not None else 0.0
    unit_price = float(unit_price) if unit_price is not None else 0.0
    total_value = float(total_value) if total_value is not None else 0.0

    if quantity == 0 and total_value == 0:
        raise ValidationError("Both quantity and total_value are zero or missing")

    source = txn.get("source", "movement")
    if source not in ("position_snapshot", "movement"):
        source = "movement"

    return {
        "ticker": str(txn["ticker"]).upper(),
        "asset_type": txn["asset_type"],
        "operation": txn["operation"],
        "quantity": quantity,
        "unit_price": unit_price,
        "total_value": total_value,
        "date": txn["date"],
        "source": source,
    }


async def save_transactions(user_id: str, statement_id: str, transactions: list, supabase_client=None) -> dict:
    if not supabase_client:
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    normalized = []
    errors = []

    for i, txn in enumerate(transactions):
        try:
            validated = validate_transaction(txn)
            validated["user_id"] = user_id
            validated["statement_id"] = statement_id
            normalized.append(validated)
        except ValidationError as e:
            ticker = txn.get("ticker", f"<index {i}>")
            errors.append(f"Transaction {ticker}: {e}")

    if not normalized:
        return {"saved": len(normalized), "failed": len(errors), "errors": errors}

    snapshots = [t for t in normalized if t["source"] == "position_snapshot"]
    movements = [t for t in normalized if t["source"] == "movement"]

    # --- Snapshots: replace existing snapshot for each ticker ---
    if snapshots:
        snapshot_tickers = list({t["ticker"] for t in snapshots})
        # Delete previous snapshots for these tickers (keep movements)
        supabase_client.table("transactions").delete().eq("user_id", user_id).eq(
            "source", "position_snapshot"
        ).in_("ticker", snapshot_tickers).execute()
        supabase_client.table("transactions").insert(snapshots).execute()

    # --- Movements: insert with dedup (skip if same ticker+date+operation+amount exists) ---
    saved_movements = 0
    for txn in movements:
        try:
            supabase_client.table("transactions").insert(txn).execute()
            saved_movements += 1
        except Exception:
            # Unique index violation = duplicate movement, skip silently
            pass

    total_saved = len(snapshots) + saved_movements

    # Mirror dividend/income into dividends table
    DIVIDEND_OPS = {"dividend", "income"}
    OP_TO_TYPE = {"dividend": "dividend", "income": "income"}
    dividends_to_upsert = []
    for txn in normalized:
        if txn.get("operation") not in DIVIDEND_OPS:
            continue
        qty = float(txn.get("quantity") or 0)
        total = float(txn.get("total_value") or 0)
        unit_p = float(txn.get("unit_price") or 0)
        if unit_p == 0 and qty > 0:
            unit_p = total / qty
        elif unit_p == 0:
            unit_p = total
        dividends_to_upsert.append({
            "ticker": txn["ticker"],
            "type": OP_TO_TYPE.get(txn["operation"], "dividend"),
            "value_per_unit": unit_p,
            "ex_date": txn["date"],
            "payment_date": txn["date"],
        })
    if dividends_to_upsert:
        try:
            supabase_client.table("dividends").upsert(
                dividends_to_upsert, on_conflict="ticker,ex_date"
            ).execute()
        except Exception:
            for div in dividends_to_upsert:
                try:
                    supabase_client.table("dividends").insert(div).execute()
                except Exception:
                    pass

    return {"saved": total_saved, "failed": len(errors), "errors": errors}


async def update_statement_status(statement_id: str, status: str, error_message: str = None, supabase_client=None):
    if not supabase_client:
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    data = {"status": status}
    if error_message:
        try:
            supabase_client.table("statements").update({**data, "error_message": error_message}).eq("id", statement_id).execute()
            return
        except Exception:
            pass

    supabase_client.table("statements").update(data).eq("id", statement_id).execute()
