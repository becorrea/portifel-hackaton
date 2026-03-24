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
        return {
            "ticker": ticker,
            "price": float(stock.get("lastPrice", 0)),
            "change_pct": float(stock.get("change", 0)),
            "source": "brapi",
        }
    except Exception:
        return None

async def get_brapi_dividends(ticker: str) -> list:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://brapi.dev/api/quote/{ticker}",
                params={"token": settings.BRAPI_TOKEN},
                timeout=10
            )
        if response.status_code != 200:
            return []
        data = response.json()
        stock = data.get("results", [{}])[0]
        return [
            {
                "ticker": ticker,
                "type": "dividend",
                "value_per_unit": float(div.get("value", 0)),
                "ex_date": div.get("exDate"),
                "payment_date": div.get("paymentDate"),
            }
            for div in stock.get("dividends", [])
        ]
    except Exception:
        return []
