def create_market_agent():
    class MarketAgent:
        async def fetch_prices(self, tickers: list) -> dict:
            from modules.market.brapi_client import get_brapi_price
            from modules.market.yfinance_client import get_yfinance_price
            
            results = {}
            for ticker in tickers:
                is_br = ticker[-1].isdigit() or ticker.endswith("11") or "FII" in ticker
                price = await get_brapi_price(ticker) if is_br else await get_yfinance_price(ticker)
                if price:
                    results[ticker] = price
            return results
        
        async def fetch_dividends(self, tickers: list) -> list:
            from modules.market.brapi_client import get_brapi_dividends
            from modules.market.yfinance_client import get_yfinance_dividends
            
            all_divs = []
            for ticker in tickers:
                is_br = ticker[-1].isdigit() or ticker.endswith("11") or "FII" in ticker
                divs = await get_brapi_dividends(ticker) if is_br else await get_yfinance_dividends(ticker)
                all_divs.extend(divs)
            return all_divs
    
    return MarketAgent()
