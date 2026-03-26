"""Standalone market data updater — no APScheduler dependency.

Called by both the scheduler (cron) and the /portfolio/refresh endpoint.
"""
import logging
from datetime import datetime, timezone
from supabase import create_client
from config import settings

logger = logging.getLogger(__name__)

BUY_OPS = {"buy", "application"}
SKIP_TYPES = {"fixed_income", "fund"}  # No real-time price for these


async def refresh_market_data(user_id: str = None, supabase=None):
    """Fetch latest prices and dividends for all tickers in the portfolio.

    If user_id is provided, only refreshes tickers held by that user.
    """
    if not supabase:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    query = supabase.table("transactions").select("ticker, asset_type")
    if user_id:
        query = query.eq("user_id", user_id)
    result = query.execute()

    # Deduplicate: keep asset_type per ticker
    seen: dict[str, str] = {}
    for row in result.data:
        seen[row["ticker"]] = row["asset_type"]

    logger.info("Refreshing %d tickers (user=%s)", len(seen), user_id or "all")

    for ticker, asset_type in seen.items():
        await _update_ticker(ticker, asset_type, supabase)


async def _update_ticker(ticker: str, asset_type: str, supabase):
    if asset_type in SKIP_TYPES:
        return

    is_brazilian = asset_type in ("stock", "fii", "bdr")
    now = datetime.now(timezone.utc).isoformat()

    try:
        if is_brazilian:
            from modules.market.brapi_client import get_brapi_price, get_brapi_dividends
            price_data = await get_brapi_price(ticker)
            dividends = await get_brapi_dividends(ticker)
        else:
            from modules.market.yfinance_client import get_yfinance_price, get_yfinance_dividends
            price_data = await get_yfinance_price(ticker)
            dividends = await get_yfinance_dividends(ticker)

        if price_data and price_data.get("price"):
            supabase.table("market_prices").upsert({
                "ticker": ticker,
                "price": price_data["price"],
                "change_pct": price_data.get("change_pct", 0),
                "source": "brapi" if is_brazilian else "yfinance",
                "updated_at": now,
            }, on_conflict="ticker").execute()
            logger.info("Price updated: %s = R$ %.2f", ticker, price_data["price"])

        if dividends:
            for div in dividends:
                try:
                    supabase.table("dividends").upsert({
                        "ticker": ticker,
                        "type": div.get("type", "dividend"),
                        "value_per_unit": div.get("value_per_unit", 0),
                        "ex_date": div.get("ex_date"),
                        "payment_date": div.get("payment_date"),
                        "updated_at": now,
                    }, on_conflict="ticker,ex_date").execute()
                except Exception:
                    pass  # constraint may not exist yet
            logger.info("Dividends updated: %s (%d records)", ticker, len(dividends))

    except Exception as e:
        logger.warning("Failed to update %s: %s", ticker, e)
