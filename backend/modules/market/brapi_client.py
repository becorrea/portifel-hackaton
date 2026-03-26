import httpx
from config import settings

async def get_brapi_price(ticker: str) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://brapi.dev/api/quote/{ticker}",
                params={"token": settings.BRAPI_TOKEN},
                timeout=10
            )
        if response.status_code != 200:
            return None
        data = response.json()
        stock = data.get("results", [{}])[0]
        price = stock.get("regularMarketPrice") or stock.get("lastPrice")
        if not price:
            return None
        return {
            "ticker": ticker,
            "price": float(price),
            "change_pct": float(stock.get("regularMarketChangePercent") or stock.get("change") or 0),
            "source": "brapi",
        }
    except Exception:
        return None

async def get_brapi_dividends(ticker: str) -> list:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://brapi.dev/api/quote/{ticker}",
                params={
                    "token": settings.BRAPI_TOKEN,
                    "modules": "dividends",
                    "range": "5y"
                },
                timeout=10
            )
        if response.status_code != 200:
            return []
        data = response.json()
        stock = data.get("results", [{}])[0]
        return [
            {
                "ticker": ticker,
                "type": _get_dividend_type(div),
                "value_per_unit": float(div.get("value", 0)),
                "ex_date": div.get("exDate"),
                "payment_date": div.get("paymentDate"),
            }
            for div in stock.get("dividends", [])
        ]
    except Exception:
        return []

def _get_dividend_type(dividend_data: dict) -> str:
    """Determine dividend type from Brapi data."""
    if "type" in dividend_data:
        div_type = str(dividend_data.get("type", "")).lower()
        if "jcp" in div_type:
            return "jcp"
        if "rendimento" in div_type or "income" in div_type:
            return "income"
    return "dividend"
