from fastapi import APIRouter, Header, Query
from typing import Optional
from modules.auth import get_current_user
from modules.portfolio.dividends import get_dividends_summary, get_dividend_timeline

router = APIRouter(prefix="/dividends", tags=["dividends"])

@router.get("")
async def get_dividends(
    authorization: str = Header(None),
    x_user_id: str = Header(None),
    tickers: Optional[str] = Query(None, description="Comma-separated ticker filter")
):
    user_id = await get_current_user(authorization, x_user_id)
    ticker_filter = [t.strip() for t in tickers.split(",")] if tickers else None
    summary = await get_dividends_summary(user_id, ticker_filter=ticker_filter)
    return summary

@router.get("/timeline")
async def get_timeline(
    authorization: str = Header(None),
    x_user_id: str = Header(None),
    months: int = 12,
    tickers: Optional[str] = Query(None, description="Comma-separated ticker filter")
):
    """Get dividends grouped by month with per-ticker breakdown."""
    user_id = await get_current_user(authorization, x_user_id)
    ticker_filter = [t.strip() for t in tickers.split(",")] if tickers else None
    timeline = await get_dividend_timeline(user_id, months=months, ticker_filter=ticker_filter)
    return {"timeline": timeline}

@router.get("/{ticker}")
async def get_ticker_dividends(
    ticker: str,
    authorization: str = Header(None),
    x_user_id: str = Header(None)
):
    """Get dividend history for a specific ticker."""
    from supabase import create_client
    from config import settings

    user_id = await get_current_user(authorization, x_user_id)
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    # Get user's positions to verify ownership
    from modules.portfolio.positions import get_current_positions
    positions = await get_current_positions(user_id, supabase)

    if ticker not in positions:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Ticker not in portfolio")

    result = supabase.table("dividends").select("*").eq("ticker", ticker).execute()

    # Enrich with quantity held
    dividends = []
    for div in result.data:
        dividends.append({
            **div,
            "quantity_held": positions[ticker]["quantity"],
            "expected_amount": positions[ticker]["quantity"] * div.get("value_per_unit", 0)
        })

    return {
        "ticker": ticker,
        "dividends": sorted(dividends, key=lambda x: x.get("ex_date", ""), reverse=True),
        "total": sum(d.get("expected_amount", 0) for d in dividends)
    }
