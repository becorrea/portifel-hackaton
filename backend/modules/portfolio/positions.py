from supabase import create_client
from config import settings

async def get_current_positions(user_id: str, supabase=None):
    if not supabase:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    
    result = supabase.table("transactions").select("*").eq("user_id", user_id).in_("operation", ["buy", "sell"]).execute()
    
    positions = {}
    for txn in result.data:
        ticker = txn["ticker"]
        if ticker not in positions:
            positions[ticker] = {"ticker": ticker, "asset_type": txn["asset_type"], "quantity": 0, "total_cost": 0}
        
        if txn["operation"] == "buy":
            positions[ticker]["quantity"] += txn["quantity"]
            positions[ticker]["total_cost"] += txn["total_value"]
        elif txn["operation"] == "sell":
            positions[ticker]["quantity"] -= txn["quantity"]
            positions[ticker]["total_cost"] -= txn["total_value"]
    
    active = {t: p for t, p in positions.items() if p["quantity"] > 0}
    
    for ticker in active:
        active[ticker]["average_price"] = (active[ticker]["total_cost"] / active[ticker]["quantity"]) if active[ticker]["quantity"] > 0 else 0
    
    prices_result = supabase.table("market_prices").select("*").execute()
    prices = {p["ticker"]: p.get("price") for p in prices_result.data}
    
    for ticker in active:
        current_price = prices.get(ticker, active[ticker]["average_price"])
        active[ticker]["current_price"] = current_price
        active[ticker]["current_value"] = active[ticker]["quantity"] * current_price
        active[ticker]["unrealized_pl"] = active[ticker]["current_value"] - active[ticker]["total_cost"]
        active[ticker]["unrealized_pct"] = (active[ticker]["unrealized_pl"] / active[ticker]["total_cost"] * 100) if active[ticker]["total_cost"] > 0 else 0
    
    return active
