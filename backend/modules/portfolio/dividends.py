from supabase import create_client
from config import settings
from datetime import datetime
from modules.portfolio.positions import get_current_positions

async def get_dividends_summary(user_id: str, supabase=None):
    if not supabase:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    
    positions = await get_current_positions(user_id, supabase)
    held_tickers = list(positions.keys())
    
    if not held_tickers:
        return {"received": [], "upcoming": [], "total_received_ytd": 0, "total_upcoming": 0}
    
    div_result = supabase.table("dividends").select("*").in_("ticker", held_tickers).execute()
    
    today = datetime.now().date()
    received = []
    upcoming = []
    
    for div in div_result.data:
        try:
            ex_date = datetime.fromisoformat(div["ex_date"]).date() if div["ex_date"] else None
        except:
            continue
        
        if not ex_date or div["ticker"] not in positions:
            continue
        
        position = positions[div["ticker"]]
        expected_amount = position["quantity"] * div["value_per_unit"]
        
        div_item = {
            "ticker": div["ticker"],
            "type": div["type"],
            "ex_date": str(ex_date),
            "payment_date": div["payment_date"],
            "value_per_unit": div["value_per_unit"],
            "quantity_held": position["quantity"],
            "expected_amount": expected_amount
        }
        
        if ex_date < today:
            received.append(div_item)
        else:
            upcoming.append(div_item)
    
    return {
        "received": received,
        "upcoming": upcoming,
        "total_received_ytd": sum(d["expected_amount"] for d in received if datetime.fromisoformat(d["ex_date"]).year == today.year),
        "total_upcoming": sum(d["expected_amount"] for d in upcoming)
    }
