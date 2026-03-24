from fastapi import APIRouter, Header, HTTPException
from modules.auth import get_current_user
from modules.portfolio.positions import get_current_positions
from modules.portfolio.performance import get_portfolio_summary

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

@router.get("")
async def get_portfolio(authorization: str = Header(None)):
    user_id = await get_current_user(authorization)
    summary = await get_portfolio_summary(user_id)
    positions = await get_current_positions(user_id)

    return {"summary": summary, "positions": list(positions.values())}

@router.get("/{ticker}")
async def get_asset_detail(ticker: str, authorization: str = Header(None)):
    user_id = await get_current_user(authorization)
    positions = await get_current_positions(user_id)

    if ticker not in positions:
        raise HTTPException(status_code=404, detail="Asset not in portfolio")

    position = positions[ticker]

    from supabase import create_client
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    txn_result = supabase.table("transactions").select("*").eq("user_id", user_id).eq("ticker", ticker).execute()
    position["transactions"] = txn_result.data

    return position
