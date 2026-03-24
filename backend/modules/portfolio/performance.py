from supabase import create_client
from config import settings
from modules.portfolio.positions import get_current_positions

async def get_portfolio_summary(user_id: str, supabase=None):
    if not supabase:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    
    positions = await get_current_positions(user_id, supabase)
    
    total_cost = sum(p["total_cost"] for p in positions.values())
    current_value = sum(p["current_value"] for p in positions.values())
    unrealized_pl = current_value - total_cost
    unrealized_pct = (unrealized_pl / total_cost * 100) if total_cost > 0 else 0
    
    breakdown = {}
    for pos in positions.values():
        asset_type = pos["asset_type"]
        if asset_type not in breakdown:
            breakdown[asset_type] = 0
        breakdown[asset_type] += pos["current_value"]
    
    return {
        "total_invested": total_cost,
        "current_value": current_value,
        "unrealized_pl": unrealized_pl,
        "unrealized_pct": unrealized_pct,
        "num_assets": len(positions),
        "asset_breakdown_by_type": breakdown
    }
