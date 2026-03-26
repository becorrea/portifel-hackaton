import asyncio
from datetime import datetime

async def get_yfinance_price(ticker: str) -> dict:
    try:
        import yfinance as yf
        data = yf.Ticker(ticker).info
        price = data.get("currentPrice") or data.get("regularMarketPrice")
        return {
            "ticker": ticker,
            "price": float(price) if price else 0,
            "change_pct": float(data.get("regularMarketChangePercent", 0)),
            "source": "yfinance",
        }
    except Exception:
        return None

async def get_yfinance_dividends(ticker: str) -> list:
    try:
        import yfinance as yf
        # Add .SA suffix for Brazilian B3 tickers if not already present
        ticker_symbol = ticker if ticker.endswith(".SA") else f"{ticker}.SA"
        ticker_obj = yf.Ticker(ticker_symbol)
        if hasattr(ticker_obj, 'dividends') and not ticker_obj.dividends.empty:
            return [
                {
                    "ticker": ticker,  # Return original ticker (without .SA)
                    "type": "dividend",
                    "value_per_unit": float(value),
                    "ex_date": date.strftime("%Y-%m-%d"),
                    "payment_date": None,  # yfinance doesn't provide separate payment_date
                }
                for date, value in ticker_obj.dividends.items()
            ]
        return []
    except Exception:
        return []
