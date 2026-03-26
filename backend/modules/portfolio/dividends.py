from supabase import create_client
from config import settings
from datetime import datetime
from collections import defaultdict
from modules.portfolio.positions import get_current_positions

async def get_dividend_timeline(user_id: str, months: int = 12, ticker_filter: list = None, supabase=None) -> list:
    """Get dividends grouped by month.

    Priority:
    1. Actual received amounts from transactions (operation=dividend/income) — per user
    2. Estimated amounts from dividends table (Brapi/yfinance) × quantity held — for tickers
       that haven't been confirmed via extrato yet
    """
    if not supabase:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    try:
        # Source 1: confirmed received dividends from user's transactions
        txn_query = supabase.table("transactions").select("*").eq("user_id", user_id).in_(
            "operation", ["dividend", "income"]
        )
        if ticker_filter:
            txn_query = txn_query.in_("ticker", ticker_filter)
        txn_result = txn_query.execute()

        timeline = defaultdict(lambda: {"total": 0.0, "breakdown": defaultdict(float)})
        confirmed_keys = set()

        for txn in txn_result.data:
            try:
                date = datetime.fromisoformat(txn["date"]).date() if txn["date"] else None
                if not date:
                    continue
                year_month = f"{date.year}-{date.month:02d}"
                amount = float(txn.get("total_value") or 0)
                ticker = txn["ticker"]
                timeline[year_month]["total"] += amount
                timeline[year_month]["breakdown"][ticker] += amount
                confirmed_keys.add(f"{ticker}:{year_month}")
            except:
                continue

        # Source 2: estimated from dividends table (Brapi/yfinance) for non-confirmed entries
        positions = await get_current_positions(user_id, supabase)
        held_tickers = list(positions.keys())
        if ticker_filter:
            held_tickers = [t for t in held_tickers if t in ticker_filter]

        if held_tickers:
            div_result = supabase.table("dividends").select("*").in_("ticker", held_tickers).execute()
            for div in div_result.data:
                try:
                    ex_date = datetime.fromisoformat(div["ex_date"]).date() if div["ex_date"] else None
                    if not ex_date or div["ticker"] not in positions:
                        continue
                    year_month = f"{ex_date.year}-{ex_date.month:02d}"
                    key = f"{div['ticker']}:{year_month}"
                    if key in confirmed_keys:
                        continue
                    qty = positions[div["ticker"]]["quantity"]
                    amount = qty * float(div.get("value_per_unit", 0))
                    timeline[year_month]["total"] += amount
                    timeline[year_month]["breakdown"][div["ticker"]] += amount
                except:
                    continue

        month_names = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                       "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

        output = []
        for year_month in sorted(timeline.keys()):
            year, month = map(int, year_month.split("-"))
            output.append({
                "year": year,
                "month": month,
                "month_name": month_names[month],
                "total": round(timeline[year_month]["total"], 2),
                "breakdown": [
                    {"ticker": ticker, "amount": round(amount, 2)}
                    for ticker, amount in sorted(timeline[year_month]["breakdown"].items())
                ]
            })

        return output[-months:] if len(output) > months else output

    except Exception as e:
        print(f"Timeline error: {e}")
        return []

async def get_dividends_summary(user_id: str, ticker_filter: list = None, supabase=None):
    if not supabase:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    positions = await get_current_positions(user_id, supabase)
    held_tickers = list(positions.keys())
    if ticker_filter:
        held_tickers = [t for t in held_tickers if t in ticker_filter]

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

    # Total received YTD from actual transactions (confirmed, not estimated)
    ytd_query = supabase.table("transactions").select("total_value").eq("user_id", user_id).in_(
        "operation", ["dividend", "income"]
    ).gte("date", f"{today.year}-01-01")
    if ticker_filter:
        ytd_query = ytd_query.in_("ticker", ticker_filter)
    txn_ytd = ytd_query.execute()
    total_received_ytd = sum(float(r.get("total_value") or 0) for r in txn_ytd.data)

    return {
        "received": received,
        "upcoming": upcoming,
        "total_received_ytd": total_received_ytd,
        "total_upcoming": sum(d["expected_amount"] for d in upcoming)
    }
