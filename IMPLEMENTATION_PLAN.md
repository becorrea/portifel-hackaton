# Portifel — Portfolio Abstraction Platform — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-tenant platform that abstracts investment portfolios from different brokers, extracts transactions via AI (Gemini Flash), polls B3 market data, and presents a unified dashboard.

**Architecture:** Monolithic FastAPI backend (locally deployable) with clean module separation (auth, ingestion, market polling, portfolio calculations). React frontend with real-time portfolio updates. Supabase for PostgreSQL + Auth. Agno framework for autonomous market data polling.

**Tech Stack:**
- Backend: Python 3.11+, FastAPI, APScheduler, Supabase Python client, Google Gemini Flash API
- Frontend: React 18, Vite, TailwindCSS, shadcn/ui, Recharts, React Query
- Database: Supabase (PostgreSQL + Auth)
- Market Data: Brapi.dev, yfinance
- Deployment: Local (Docker Compose for orchestration)

---

## File Structure

### Backend
```
backend/
├── main.py                           # FastAPI app entry point
├── config.py                         # Environment variables + settings
├── requirements.txt                  # Python dependencies
├── docker-compose.yml                # Local orchestration (optional)
├── modules/
│   ├── __init__.py
│   ├── auth.py                       # JWT validation via Supabase
│   ├── ingestion/
│   │   ├── __init__.py
│   │   ├── extractor.py              # Gemini Flash integration
│   │   └── normalizer.py             # Transaction normalization + DB save
│   ├── market/
│   │   ├── __init__.py
│   │   ├── scheduler.py              # APScheduler + polling orchestration
│   │   ├── brapi_client.py           # Brapi.dev integration
│   │   ├── yfinance_client.py        # yfinance integration
│   │   └── agno_agent.py             # Agno agent definition
│   └── portfolio/
│       ├── __init__.py
│       ├── positions.py              # Current positions + avg price
│       ├── performance.py            # P&L, rentabilidade
│       └── dividends.py              # Proventos calculation
├── api/
│   ├── __init__.py
│   ├── statements.py                 # POST /statements (upload)
│   ├── portfolio.py                  # GET /portfolio, /portfolio/{ticker}
│   ├── dividends.py                  # GET /dividends
│   └── health.py                     # GET /health
└── tests/
    ├── test_extractor.py
    ├── test_normalizer.py
    ├── test_positions.py
    ├── test_api.py
    └── conftest.py
```

### Frontend
```
frontend/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── .env
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Upload.tsx
│   │   ├── Asset.tsx
│   │   └── Dividends.tsx
│   ├── components/
│   │   ├── PortfolioSummary.tsx
│   │   ├── AssetTable.tsx
│   │   ├── PerformanceChart.tsx
│   │   ├── DividendCalendar.tsx
│   │   ├── UploadStatus.tsx
│   │   └── NavBar.tsx
│   ├── lib/
│   │   ├── api.ts                    # React Query hooks + API calls
│   │   ├── supabase.ts               # Supabase client
│   │   └── utils.ts
│   └── types/
│       └── index.ts
└── tests/
    └── api.test.ts
```

### Database (Supabase)
```sql
-- Already defined in design document
-- Tables: brokers, statements, transactions, market_prices, dividends
-- RLS policies for user isolation
```

---

## Implementation Tasks

### Phase 1: Project Setup

#### Task 1: Initialize Backend Project

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/main.py`
- Create: `backend/.env.example`
- Create: `backend/config.py`

- [ ] **Step 1: Create backend directory and requirements.txt**

```bash
mkdir -p backend
cd backend
```

```txt
# backend/requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-dotenv==1.0.0
supabase==2.1.3
google-generativeai==0.3.0
requests==2.31.0
yfinance==0.2.32
apscheduler==3.10.4
pydantic==2.5.0
pydantic-settings==2.1.0
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
```

- [ ] **Step 2: Create config.py with environment variables**

```python
# backend/config.py
from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    """Application settings from environment variables."""

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str

    # Gemini
    GEMINI_API_KEY: str

    # Market Data
    BRAPI_TOKEN: str
    MARKET_POLL_INTERVAL_HOURS: int = 24

    # API
    API_HOST: str = "localhost"
    API_PORT: int = 8000
    DEBUG: bool = False

    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] **Step 3: Create main.py with FastAPI app**

```python
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings

app = FastAPI(title="Portifel API", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # localhost:5173 for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.API_HOST, port=settings.API_PORT)
```

- [ ] **Step 4: Create .env.example**

```env
# backend/.env.example
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
GEMINI_API_KEY=your-gemini-key
BRAPI_TOKEN=your-brapi-token
MARKET_POLL_INTERVAL_HOURS=24
DEBUG=false
```

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "setup: initialize backend project with FastAPI"
```

---

#### Task 2: Initialize Frontend Project

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/src/main.tsx`
- Create: `frontend/.env.example`

- [ ] **Step 1: Create frontend with Vite**

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

- [ ] **Step 2: Install dependencies**

```bash
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/react-dom
npm install @tanstack/react-query axios recharts lucide-react
npm install @supabase/supabase-js
npm install clsx class-variance-authority
```

- [ ] **Step 3: Configure TailwindCSS**

```js
// frontend/tailwind.config.js
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Create `frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Create .env.example**

```env
# frontend/.env.example
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000
```

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "setup: initialize frontend with Vite + React + TailwindCSS"
```

---

#### Task 3: Setup Supabase Database

**Files:**
- Create: `docs/database_schema.sql`

- [ ] **Step 1: Create database schema file**

```sql
-- docs/database_schema.sql
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_id UUID REFERENCES brokers(id),
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  error_message TEXT,
  raw_ai_output JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  statement_id UUID REFERENCES statements(id) ON DELETE SET NULL,
  ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'fii', 'bdr', 'fixed_income', 'crypto', 'international')),
  operation TEXT NOT NULL CHECK (operation IN ('buy', 'sell', 'income', 'split', 'bonus')),
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_value NUMERIC NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL UNIQUE,
  price NUMERIC,
  change_pct NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source TEXT CHECK (source IN ('brapi', 'yfinance'))
);

CREATE TABLE IF NOT EXISTS dividends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dividend', 'jcp', 'income', 'coupon')),
  value_per_unit NUMERIC NOT NULL,
  ex_date DATE,
  payment_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_statements" ON statements
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

-- Seed brokers
INSERT INTO brokers (name) VALUES
  ('XP Investimentos'),
  ('Nu Invest'),
  ('Inter'),
  ('BTG Pactual'),
  ('Clear Corretora'),
  ('B3')
ON CONFLICT (name) DO NOTHING;
```

- [ ] **Step 2: Execute schema in Supabase**

Go to Supabase Console → SQL Editor → Paste and run the schema

- [ ] **Step 3: Commit**

```bash
git add docs/
git commit -m "docs: add database schema setup instructions"
```

---

### Phase 2: Backend Core

#### Task 4: Implement Supabase Auth Module

**Files:**
- Create: `backend/modules/auth.py`
- Create: `backend/tests/test_auth.py`

- [ ] **Step 1: Write test for JWT validation**

```python
# backend/tests/test_auth.py
import pytest
from modules.auth import verify_token, InvalidTokenError

def test_verify_token_valid():
    """Test that valid JWT token is verified."""
    # Mock a valid Supabase JWT
    token = "valid.jwt.token"  # Will mock in actual test
    user_id = verify_token(token)
    assert user_id is not None

def test_verify_token_invalid():
    """Test that invalid JWT raises error."""
    token = "invalid.token"
    with pytest.raises(InvalidTokenError):
        verify_token(token)
```

- [ ] **Step 2: Implement auth module**

```python
# backend/modules/auth.py
from fastapi import HTTPException, status
from jose import jwt, JWTError
from config import settings
import httpx

class InvalidTokenError(Exception):
    pass

async def verify_token(token: str) -> str:
    """Verify Supabase JWT token and return user_id."""
    try:
        # Get Supabase public key
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/jwt",
                headers={"apikey": settings.SUPABASE_SERVICE_KEY}
            )

        # Decode JWT (Supabase uses RS256)
        decoded = jwt.decode(
            token,
            options={"verify_signature": False}  # For now, basic validation
        )
        return decoded.get("sub")
    except (JWTError, Exception) as e:
        raise InvalidTokenError(f"Invalid token: {str(e)}")

async def get_current_user(authorization: str) -> str:
    """Extract and verify token from Authorization header."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")

    token = authorization.split(" ")[1]
    return await verify_token(token)
```

- [ ] **Step 3: Run test**

```bash
cd backend
pytest tests/test_auth.py -v
```

Expected: PASS (or FAIL if mock setup needed)

- [ ] **Step 4: Commit**

```bash
git add backend/modules/auth.py backend/tests/test_auth.py
git commit -m "feat: add JWT token verification via Supabase"
```

---

#### Task 5: Implement Gemini AI Extractor

**Files:**
- Create: `backend/modules/ingestion/extractor.py`
- Create: `backend/tests/test_extractor.py`

- [ ] **Step 1: Write test for extraction**

```python
# backend/tests/test_extractor.py
import pytest
from modules.ingestion.extractor import extract_transactions_from_pdf

@pytest.mark.asyncio
async def test_extract_transactions_from_pdf():
    """Test Gemini extraction of transactions from PDF content."""
    sample_pdf_text = """
    XP INVESTIMENTOS
    Extrato de Conta
    ...
    PETR4 - Compra - 100 unidades - R$ 32.50 - 15/01/2024
    MXRF11 - Compra - 50 unidades - R$ 12.00 - 20/01/2024
    """

    transactions = await extract_transactions_from_pdf(sample_pdf_text)

    assert len(transactions) == 2
    assert transactions[0]["ticker"] == "PETR4"
    assert transactions[0]["operation"] == "buy"
    assert transactions[1]["ticker"] == "MXRF11"
```

- [ ] **Step 2: Implement extractor module**

```python
# backend/modules/ingestion/extractor.py
import google.generativeai as genai
from config import settings
import json
import re

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-flash")

async def extract_transactions_from_pdf(pdf_text: str) -> list[dict]:
    """
    Extract and normalize transactions from PDF/XLSX content using Gemini Flash.
    Returns list of transactions in standard format.
    """

    prompt = f"""
    Você é um especialista em extração de dados financeiros. Analise o extrato de investimentos abaixo
    e extraia TODAS as transações. Retorne um JSON válido com a seguinte estrutura:

    [{{
      "ticker": "PETR4",
      "asset_type": "stock",  // stock|fii|bdr|fixed_income|crypto|international
      "operation": "buy",      // buy|sell|income|split|bonus
      "quantity": 100,
      "unit_price": 32.50,
      "total_value": 3250.00,
      "date": "2024-01-15"
    }}]

    IMPORTANTE:
    - Retorne SOMENTE o JSON, sem texto adicional
    - Use datas no formato YYYY-MM-DD
    - Se a operação for "income", quantity é 0 e total_value é o valor do dividendo

    Extrato:
    {pdf_text}
    """

    response = await model.generate_content_async(prompt)

    # Parse response
    try:
        # Extract JSON from response (may include markdown code blocks)
        json_str = response.text
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0]

        transactions = json.loads(json_str.strip())
        return transactions
    except (json.JSONDecodeError, IndexError) as e:
        raise ValueError(f"Failed to parse Gemini response: {str(e)}")
```

- [ ] **Step 3: Run test**

```bash
pytest backend/tests/test_extractor.py -v
```

Expected: PASS (requires valid Gemini API key in .env)

- [ ] **Step 4: Commit**

```bash
git add backend/modules/ingestion/extractor.py backend/tests/test_extractor.py
git commit -m "feat: implement Gemini Flash AI extraction for broker statements"
```

---

#### Task 6: Implement Transaction Normalizer and Saver

**Files:**
- Create: `backend/modules/ingestion/normalizer.py`
- Create: `backend/tests/test_normalizer.py`

- [ ] **Step 1: Write test for transaction saving**

```python
# backend/tests/test_normalizer.py
import pytest
from modules.ingestion.normalizer import save_transactions

@pytest.mark.asyncio
async def test_save_transactions_to_db(mock_supabase):
    """Test that transactions are saved to Supabase."""
    transactions = [
        {
            "ticker": "PETR4",
            "asset_type": "stock",
            "operation": "buy",
            "quantity": 100,
            "unit_price": 32.50,
            "total_value": 3250.00,
            "date": "2024-01-15"
        }
    ]

    statement_id = await save_transactions(
        user_id="user-123",
        statement_id="stmt-456",
        transactions=transactions,
        supabase_client=mock_supabase
    )

    assert statement_id is not None
    # Verify transaction was saved
    result = mock_supabase.table("transactions").select("*").execute()
    assert len(result.data) == 1
```

- [ ] **Step 2: Implement normalizer**

```python
# backend/modules/ingestion/normalizer.py
from supabase import create_client
from config import settings
from datetime import datetime

async def save_transactions(
    user_id: str,
    statement_id: str,
    transactions: list[dict],
    supabase_client=None
) -> str:
    """
    Normalize and save transactions to Supabase.
    Returns statement_id after successful insert.
    """

    if not supabase_client:
        supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )

    # Validate and normalize each transaction
    normalized = []
    for txn in transactions:
        normalized.append({
            "user_id": user_id,
            "statement_id": statement_id,
            "ticker": txn["ticker"].upper(),
            "asset_type": txn["asset_type"],
            "operation": txn["operation"],
            "quantity": float(txn["quantity"]),
            "unit_price": float(txn["unit_price"]),
            "total_value": float(txn["total_value"]),
            "date": txn["date"],
        })

    # Batch insert
    result = supabase_client.table("transactions").insert(normalized).execute()

    return statement_id

async def update_statement_status(
    statement_id: str,
    status: str,
    error_message: str = None,
    supabase_client=None
):
    """Update statement processing status."""

    if not supabase_client:
        supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )

    data = {"status": status}
    if error_message:
        data["error_message"] = error_message

    supabase_client.table("statements").update(data).eq("id", statement_id).execute()
```

- [ ] **Step 3: Run test**

```bash
pytest backend/tests/test_normalizer.py -v
```

- [ ] **Step 4: Commit**

```bash
git add backend/modules/ingestion/normalizer.py backend/tests/test_normalizer.py
git commit -m "feat: implement transaction normalization and database saving"
```

---

#### Task 7: Implement Market Data Clients (Brapi + yfinance)

**Files:**
- Create: `backend/modules/market/brapi_client.py`
- Create: `backend/modules/market/yfinance_client.py`
- Create: `backend/tests/test_market_clients.py`

- [ ] **Step 1: Write tests for market clients**

```python
# backend/tests/test_market_clients.py
import pytest
from modules.market.brapi_client import get_brapi_price
from modules.market.yfinance_client import get_yfinance_price

@pytest.mark.asyncio
async def test_get_brapi_price():
    """Test Brapi price retrieval for Brazilian assets."""
    price_data = await get_brapi_price("PETR4")
    assert price_data["ticker"] == "PETR4"
    assert price_data["price"] is not None
    assert price_data["change_pct"] is not None

@pytest.mark.asyncio
async def test_get_yfinance_price():
    """Test yfinance price retrieval for international assets."""
    price_data = await get_yfinance_price("PETR4.SA")
    assert price_data["ticker"] == "PETR4.SA"
    assert price_data["price"] is not None
```

- [ ] **Step 2: Implement Brapi client**

```python
# backend/modules/market/brapi_client.py
import httpx
from config import settings
import asyncio

async def get_brapi_price(ticker: str) -> dict:
    """
    Fetch current price from Brapi.dev for Brazilian assets.
    Returns: {ticker, price, change_pct, source}
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://brapi.dev/api/quote/{ticker}",
                params={"token": settings.BRAPI_TOKEN}
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
            "updated_at": stock.get("lastUpdate")
        }
    except Exception as e:
        print(f"Brapi error for {ticker}: {e}")
        return None

async def get_brapi_dividends(ticker: str) -> list[dict]:
    """
    Fetch dividend history from Brapi for a ticker.
    Returns list of dividends with ex_date, payment_date, value.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://brapi.dev/api/quote/{ticker}",
                params={"token": settings.BRAPI_TOKEN}
            )

        if response.status_code != 200:
            return []

        data = response.json()
        stock = data.get("results", [{}])[0]

        dividends = []
        for div in stock.get("dividends", []):
            dividends.append({
                "ticker": ticker,
                "type": "dividend",
                "value_per_unit": float(div.get("value", 0)),
                "ex_date": div.get("exDate"),
                "payment_date": div.get("paymentDate"),
                "source": "brapi"
            })

        return dividends
    except Exception as e:
        print(f"Brapi dividends error for {ticker}: {e}")
        return []
```

- [ ] **Step 3: Implement yfinance client**

```python
# backend/modules/market/yfinance_client.py
import yfinance as yf
import asyncio
from datetime import datetime

async def get_yfinance_price(ticker: str) -> dict:
    """
    Fetch current price from yfinance for international/crypto assets.
    Returns: {ticker, price, change_pct, source}
    """
    try:
        # Run yfinance in thread pool since it's blocking
        loop = asyncio.get_event_loop()
        data = await loop.run_in_executor(
            None,
            lambda: yf.Ticker(ticker).info
        )

        price = data.get("currentPrice") or data.get("regularMarketPrice")
        change_pct = data.get("regularMarketChangePercent", 0)

        return {
            "ticker": ticker,
            "price": float(price) if price else 0,
            "change_pct": float(change_pct),
            "source": "yfinance",
            "updated_at": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"yfinance error for {ticker}: {e}")
        return None

async def get_yfinance_dividends(ticker: str) -> list[dict]:
    """
    Fetch dividend history from yfinance.
    Returns list of dividends.
    """
    try:
        loop = asyncio.get_event_loop()
        ticker_obj = await loop.run_in_executor(None, lambda: yf.Ticker(ticker))

        dividends = []
        if hasattr(ticker_obj, 'dividends') and not ticker_obj.dividends.empty:
            for date, value in ticker_obj.dividends.items():
                dividends.append({
                    "ticker": ticker,
                    "type": "dividend",
                    "value_per_unit": float(value),
                    "ex_date": date.strftime("%Y-%m-%d"),
                    "payment_date": date.strftime("%Y-%m-%d"),
                    "source": "yfinance"
                })

        return dividends
    except Exception as e:
        print(f"yfinance dividends error for {ticker}: {e}")
        return []
```

- [ ] **Step 4: Run tests**

```bash
pytest backend/tests/test_market_clients.py -v
```

- [ ] **Step 5: Commit**

```bash
git add backend/modules/market/
git commit -m "feat: implement Brapi and yfinance market data clients"
```

---

#### Task 8: Implement Market Data Scheduler (Agno Worker)

**Files:**
- Create: `backend/modules/market/scheduler.py`
- Create: `backend/modules/market/agno_agent.py`

- [ ] **Step 1: Implement Agno agent definition**

```python
# backend/modules/market/agno_agent.py
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from modules.market.brapi_client import get_brapi_price, get_brapi_dividends
from modules.market.yfinance_client import get_yfinance_price, get_yfinance_dividends
import json

def create_market_agent():
    """Create Agno agent for autonomous market data polling."""

    agent = Agent(
        name="market-data-agent",
        model=OpenAIChat(id="gpt-4"),  # Can use Gemini instead
        tools=[
            {
                "name": "get_price_brapi",
                "description": "Get current price for Brazilian assets from Brapi",
                "function": lambda ticker: get_brapi_price(ticker)
            },
            {
                "name": "get_price_yfinance",
                "description": "Get current price for international/crypto assets from yfinance",
                "function": lambda ticker: get_yfinance_price(ticker)
            },
            {
                "name": "get_dividends_brapi",
                "description": "Get dividend history from Brapi",
                "function": lambda ticker: get_brapi_dividends(ticker)
            },
            {
                "name": "get_dividends_yfinance",
                "description": "Get dividend history from yfinance",
                "function": lambda ticker: get_yfinance_dividends(ticker)
            }
        ]
    )

    return agent

async def fetch_all_tickers_prices(tickers: list[str]) -> dict:
    """
    Use Agno agent to intelligently fetch prices for all unique tickers.
    Agent decides whether to use Brapi or yfinance based on ticker format.
    """
    agent = create_market_agent()

    # Prompt agent to fetch prices efficiently
    prompt = f"""
    Fetch current prices and dividends for these tickers: {json.dumps(tickers)}

    Strategy:
    1. Brazilian assets (ending in digits, like PETR4, MXRF11): use Brapi
    2. International assets (.SA suffix, crypto): use yfinance
    3. For each ticker, fetch both price and dividend history

    Return a JSON with all results.
    """

    response = agent.run(prompt)
    return json.loads(response.content)
```

- [ ] **Step 2: Implement scheduler**

```python
# backend/modules/market/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from supabase import create_client
from config import settings
from modules.market.brapi_client import get_brapi_price, get_brapi_dividends
from modules.market.yfinance_client import get_yfinance_price, get_yfinance_dividends
import asyncio
import logging

logger = logging.getLogger(__name__)

class MarketDataScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )

    def start(self):
        """Start the background scheduler."""
        # Schedule polling every N hours (default 24)
        trigger = CronTrigger(hour=18)  # 6 PM (after B3 closes at 5 PM)
        self.scheduler.add_job(
            self.poll_market_data,
            trigger,
            id="market_data_poll",
            name="Poll market data",
            misfire_grace_time=900
        )
        self.scheduler.start()
        logger.info("Market data scheduler started")

    def stop(self):
        """Stop the scheduler."""
        self.scheduler.shutdown()
        logger.info("Market data scheduler stopped")

    async def poll_market_data(self):
        """
        Main polling function: fetch all unique tickers from user transactions
        and update market_prices and dividends tables.
        """
        try:
            # Get all unique tickers from transactions
            result = self.supabase.table("transactions").select(
                "DISTINCT ticker"
            ).execute()

            tickers = [row["ticker"] for row in result.data]
            logger.info(f"Polling {len(tickers)} tickers")

            for ticker in tickers:
                await self._update_ticker_data(ticker)

        except Exception as e:
            logger.error(f"Market data polling error: {e}")

    async def _update_ticker_data(self, ticker: str):
        """Update price and dividend data for a single ticker."""

        # Determine source based on ticker format
        # Brazilian tickers: numeric or FII pattern (11 chars ending in digits or 3-letter FII)
        is_brazilian = ticker[-1].isdigit() or ticker.endswith("11") or "FII" in ticker

        try:
            price_data = None
            dividends_data = []

            if is_brazilian:
                # Try Brapi first
                price_data = await get_brapi_price(ticker)
                dividends_data = await get_brapi_dividends(ticker)
            else:
                # Try yfinance
                price_data = await get_yfinance_price(ticker)
                dividends_data = await get_yfinance_dividends(ticker)

            # Save price to market_prices
            if price_data:
                self.supabase.table("market_prices").upsert({
                    "ticker": ticker,
                    "price": price_data["price"],
                    "change_pct": price_data["change_pct"],
                    "source": price_data["source"],
                    "updated_at": price_data.get("updated_at")
                }).execute()
                logger.info(f"Updated {ticker}: {price_data['price']}")

            # Save dividends
            if dividends_data:
                for div in dividends_data:
                    self.supabase.table("dividends").upsert(
                        {k: v for k, v in div.items() if v is not None}
                    ).execute()

        except Exception as e:
            logger.error(f"Error updating {ticker}: {e}")

# Global scheduler instance
scheduler = MarketDataScheduler()
```

- [ ] **Step 3: Integrate scheduler into main.py**

```python
# backend/main.py (update)
from modules.market.scheduler import scheduler

@app.on_event("startup")
def startup_event():
    scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    scheduler.stop()
```

- [ ] **Step 4: Commit**

```bash
git add backend/modules/market/scheduler.py backend/modules/market/agno_agent.py
git commit -m "feat: implement Agno-based market data polling scheduler"
```

---

### Phase 3: Backend API Endpoints

#### Task 9: Implement Upload and Extraction Endpoint

**Files:**
- Modify: `backend/api/statements.py`
- Create: `backend/tests/test_api_statements.py`

- [ ] **Step 1: Write test for upload endpoint**

```python
# backend/tests/test_api_statements.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_upload_statement_success():
    """Test successful statement upload and processing."""
    headers = {"Authorization": "Bearer valid-token"}

    with open("tests/fixtures/sample_statement.pdf", "rb") as f:
        response = client.post(
            "/statements",
            files={"file": f},
            headers=headers
        )

    assert response.status_code == 201
    data = response.json()
    assert "statement_id" in data
    assert data["status"] == "pending"

def test_upload_without_auth():
    """Test that upload requires authentication."""
    response = client.post(
        "/statements",
        files={"file": ("test.pdf", b"content")}
    )
    assert response.status_code == 401
```

- [ ] **Step 2: Implement upload endpoint**

```python
# backend/api/statements.py
from fastapi import APIRouter, UploadFile, File, Header, HTTPException, BackgroundTasks
from supabase import create_client
from config import settings
from modules.auth import get_current_user
from modules.ingestion.extractor import extract_transactions_from_pdf
from modules.ingestion.normalizer import save_transactions, update_statement_status
import uuid
import PyPDF2

router = APIRouter(prefix="/statements", tags=["statements"])
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

@router.post("")
async def upload_statement(
    file: UploadFile = File(...),
    authorization: str = Header(None),
    background_tasks: BackgroundTasks = None
):
    """
    Upload broker statement (PDF/XLSX).
    Triggers Gemini extraction in background.
    """

    # Authenticate
    user_id = await get_current_user(authorization)

    # Validate file type
    if not file.filename.endswith((".pdf", ".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="File must be PDF or XLSX")

    try:
        # Create statement record
        statement_id = str(uuid.uuid4())

        supabase.table("statements").insert({
            "id": statement_id,
            "user_id": user_id,
            "status": "pending"
        }).execute()

        # Read file content
        content = await file.read()

        # Extract text (simple PDF reading)
        if file.filename.endswith(".pdf"):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = "\n".join([page.extract_text() for page in pdf_reader.pages])
        else:
            # For XLSX, would use openpyxl or similar
            text = str(content)

        # Queue background extraction
        background_tasks.add_task(
            process_statement,
            statement_id=statement_id,
            user_id=user_id,
            file_text=text
        )

        return {
            "statement_id": statement_id,
            "status": "pending",
            "message": "Statement received. Processing in background..."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def process_statement(statement_id: str, user_id: str, file_text: str):
    """Background task: extract and save transactions."""
    try:
        # Update status to processing
        update_statement_status(statement_id, "processing")

        # Extract transactions via Gemini
        transactions = await extract_transactions_from_pdf(file_text)

        # Save to database
        await save_transactions(user_id, statement_id, transactions, supabase)

        # Mark as done
        update_statement_status(statement_id, "done")

    except Exception as e:
        update_statement_status(statement_id, "error", str(e))

@router.get("")
async def list_statements(authorization: str = Header(None)):
    """List all statements for current user."""
    user_id = await get_current_user(authorization)

    result = supabase.table("statements").select("*").eq("user_id", user_id).execute()
    return result.data

@router.get("/{statement_id}")
async def get_statement(statement_id: str, authorization: str = Header(None)):
    """Get details of a specific statement."""
    user_id = await get_current_user(authorization)

    result = supabase.table("statements").select("*").eq("id", statement_id).eq("user_id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Statement not found")

    return result.data[0]
```

- [ ] **Step 3: Add route to main.py**

```python
# backend/main.py (add)
from api import statements

app.include_router(statements.router)
```

- [ ] **Step 4: Run tests**

```bash
pytest backend/tests/test_api_statements.py -v
```

- [ ] **Step 5: Commit**

```bash
git add backend/api/statements.py backend/tests/test_api_statements.py
git commit -m "feat: add statement upload and extraction endpoint"
```

---

#### Task 10: Implement Portfolio Query Endpoints

**Files:**
- Create: `backend/modules/portfolio/positions.py`
- Create: `backend/modules/portfolio/performance.py`
- Create: `backend/api/portfolio.py`
- Create: `backend/tests/test_portfolio.py`

- [ ] **Step 1: Implement positions module**

```python
# backend/modules/portfolio/positions.py
from supabase import create_client
from config import settings
from decimal import Decimal

async def get_current_positions(user_id: str, supabase=None):
    """
    Calculate current positions: quantity, average price, current price, unrealized P&L.
    """
    if not supabase:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    # Get all buy/sell transactions
    result = supabase.table("transactions").select("*").eq("user_id", user_id).in_(
        "operation", ["buy", "sell"]
    ).execute()

    positions = {}
    for txn in result.data:
        ticker = txn["ticker"]
        if ticker not in positions:
            positions[ticker] = {
                "ticker": ticker,
                "asset_type": txn["asset_type"],
                "quantity": 0,
                "total_cost": 0,
                "average_price": 0
            }

        if txn["operation"] == "buy":
            positions[ticker]["quantity"] += txn["quantity"]
            positions[ticker]["total_cost"] += txn["total_value"]
        elif txn["operation"] == "sell":
            positions[ticker]["quantity"] -= txn["quantity"]
            positions[ticker]["total_cost"] -= txn["total_value"] * (txn["quantity"] / txn["quantity"])  # simplified

    # Filter out zero positions and calculate average price
    active = {}
    for ticker, pos in positions.items():
        if pos["quantity"] > 0:
            pos["average_price"] = pos["total_cost"] / pos["quantity"]
            active[ticker] = pos

    # Add current prices from market_prices
    prices_result = supabase.table("market_prices").select("*").execute()
    prices = {p["ticker"]: p["price"] for p in prices_result.data}

    for ticker in active:
        current_price = prices.get(ticker, active[ticker]["average_price"])
        active[ticker]["current_price"] = current_price
        active[ticker]["current_value"] = active[ticker]["quantity"] * current_price
        active[ticker]["unrealized_pl"] = active[ticker]["current_value"] - active[ticker]["total_cost"]
        active[ticker]["unrealized_pct"] = (active[ticker]["unrealized_pl"] / active[ticker]["total_cost"] * 100) if active[ticker]["total_cost"] > 0 else 0

    return active
```

- [ ] **Step 2: Implement performance module**

```python
# backend/modules/portfolio/performance.py
from supabase import create_client
from config import settings
from modules.portfolio.positions import get_current_positions

async def get_portfolio_summary(user_id: str, supabase=None):
    """
    Calculate overall portfolio metrics: total value, total cost, overall P&L, rentability %.
    """
    if not supabase:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    positions = await get_current_positions(user_id, supabase)

    total_cost = sum(p["total_cost"] for p in positions.values())
    current_value = sum(p["current_value"] for p in positions.values())
    unrealized_pl = current_value - total_cost
    unrealized_pct = (unrealized_pl / total_cost * 100) if total_cost > 0 else 0

    return {
        "total_invested": total_cost,
        "current_value": current_value,
        "unrealized_pl": unrealized_pl,
        "unrealized_pct": unrealized_pct,
        "num_assets": len(positions),
        "asset_breakdown_by_type": _breakdown_by_type(positions)
    }

def _breakdown_by_type(positions: dict):
    """Calculate value breakdown by asset type."""
    breakdown = {}
    for pos in positions.values():
        asset_type = pos["asset_type"]
        if asset_type not in breakdown:
            breakdown[asset_type] = 0
        breakdown[asset_type] += pos["current_value"]
    return breakdown
```

- [ ] **Step 3: Implement API endpoints**

```python
# backend/api/portfolio.py
from fastapi import APIRouter, Header, HTTPException
from modules.auth import get_current_user
from modules.portfolio.positions import get_current_positions
from modules.portfolio.performance import get_portfolio_summary

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

@router.get("")
async def get_portfolio(authorization: str = Header(None)):
    """Get portfolio summary and positions."""
    user_id = await get_current_user(authorization)

    summary = await get_portfolio_summary(user_id)
    positions = await get_current_positions(user_id)

    return {
        "summary": summary,
        "positions": list(positions.values())
    }

@router.get("/{ticker}")
async def get_asset_detail(ticker: str, authorization: str = Header(None)):
    """Get details for a specific asset."""
    user_id = await get_current_user(authorization)

    positions = await get_current_positions(user_id)

    if ticker not in positions:
        raise HTTPException(status_code=404, detail="Asset not in portfolio")

    position = positions[ticker]

    # Get transaction history
    from supabase import create_client
    from config import settings
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    txn_result = supabase.table("transactions").select("*").eq("user_id", user_id).eq("ticker", ticker).execute()

    position["transactions"] = txn_result.data

    return position
```

- [ ] **Step 4: Add routes to main.py**

```python
# backend/main.py (add)
from api import portfolio

app.include_router(portfolio.router)
```

- [ ] **Step 5: Run tests**

```bash
pytest backend/tests/test_portfolio.py -v
```

- [ ] **Step 6: Commit**

```bash
git add backend/modules/portfolio/ backend/api/portfolio.py
git commit -m "feat: implement portfolio calculation and query endpoints"
```

---

#### Task 11: Implement Dividends Endpoint

**Files:**
- Create: `backend/modules/portfolio/dividends.py`
- Create: `backend/api/dividends.py`

- [ ] **Step 1: Implement dividends module**

```python
# backend/modules/portfolio/dividends.py
from supabase import create_client
from config import settings
from datetime import datetime, timedelta
from modules.portfolio.positions import get_current_positions

async def get_dividends_summary(user_id: str, supabase=None):
    """
    Get dividends received and future dividends (based on current holdings).
    """
    if not supabase:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    positions = await get_current_positions(user_id, supabase)
    held_tickers = list(positions.keys())

    # Get all dividends for held assets
    div_result = supabase.table("dividends").select("*").in_("ticker", held_tickers).execute()

    today = datetime.now().date()
    received = []
    upcoming = []

    for div in div_result.data:
        ex_date = datetime.fromisoformat(div["ex_date"]).date() if div["ex_date"] else None

        if not ex_date:
            continue

        # Calculate expected amount based on current position
        position = positions.get(div["ticker"])
        if not position:
            continue

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

    # Sort
    received.sort(key=lambda x: x["ex_date"], reverse=True)
    upcoming.sort(key=lambda x: x["ex_date"])

    return {
        "received": received,
        "upcoming": upcoming,
        "total_received_ytd": sum(d["expected_amount"] for d in received if datetime.fromisoformat(d["ex_date"]).year == today.year),
        "total_upcoming": sum(d["expected_amount"] for d in upcoming)
    }
```

- [ ] **Step 2: Implement dividends API**

```python
# backend/api/dividends.py
from fastapi import APIRouter, Header
from modules.auth import get_current_user
from modules.portfolio.dividends import get_dividends_summary

router = APIRouter(prefix="/dividends", tags=["dividends"])

@router.get("")
async def get_dividends(authorization: str = Header(None)):
    """Get all dividends (received and upcoming)."""
    user_id = await get_current_user(authorization)
    summary = await get_dividends_summary(user_id)
    return summary
```

- [ ] **Step 3: Add route to main.py**

```python
# backend/main.py (add)
from api import dividends

app.include_router(dividends.router)
```

- [ ] **Step 4: Commit**

```bash
git add backend/modules/portfolio/dividends.py backend/api/dividends.py
git commit -m "feat: implement dividends query endpoint"
```

---

### Phase 4: Frontend Implementation

#### Task 12: Setup Authentication (Supabase Auth)

**Files:**
- Create: `frontend/src/lib/supabase.ts`
- Create: `frontend/src/pages/Login.tsx`
- Create: `frontend/src/components/ProtectedRoute.tsx`

- [ ] **Step 1: Create Supabase client**

```typescript
// frontend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const useAuth = () => {
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.data?.subscription?.unsubscribe()
    }
  }, [])

  return { user, loading }
}
```

- [ ] **Step 2: Create Login page**

```typescript
// frontend/src/pages/Login.tsx
import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-900">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-3xl font-bold text-center mb-6">Portifel</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create Protected Route component**

```typescript
// frontend/src/components/ProtectedRoute.tsx
import React from 'react'
import { useAuth } from '../lib/supabase'
import Login from '../pages/Login'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!user) {
    return <Login />
  }

  return <>{children}</>
}
```

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/lib/supabase.ts src/pages/Login.tsx src/components/ProtectedRoute.tsx
git commit -m "feat: add Supabase authentication"
```

---

#### Task 13: Build Dashboard Layout and Summary Component

**Files:**
- Create: `frontend/src/pages/Dashboard.tsx`
- Create: `frontend/src/components/PortfolioSummary.tsx`
- Create: `frontend/src/lib/api.ts`

- [ ] **Step 1: Create API client with React Query**

```typescript
// frontend/src/lib/api.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from './supabase'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

const apiClient = axios.create({
  baseURL: API_URL,
})

// Intercept to add auth token
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`
  }
  return config
})

export const usePortfolio = () => {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data } = await apiClient.get('/portfolio')
      return data
    },
  })
}

export const useDividends = () => {
  return useQuery({
    queryKey: ['dividends'],
    queryFn: async () => {
      const { data } = await apiClient.get('/dividends')
      return data
    },
  })
}

export const useUploadStatement = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await apiClient.post('/statements', formData)
      return data
    },
  })
}
```

- [ ] **Step 2: Create Portfolio Summary component**

```typescript
// frontend/src/components/PortfolioSummary.tsx
import React from 'react'
import { usePortfolio } from '../lib/api'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export function PortfolioSummary() {
  const { data, isLoading } = usePortfolio()

  if (isLoading) return <div>Loading...</div>

  const summary = data?.summary || {}
  const isPositive = summary.unrealized_pl >= 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Invested</p>
            <p className="text-2xl font-bold">
              R$ {summary.total_invested?.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <DollarSign className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Current Value</p>
            <p className="text-2xl font-bold">
              R$ {summary.current_value?.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-600" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Unrealized P&L</p>
            <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              R$ {summary.unrealized_pl?.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
            </p>
          </div>
          {isPositive ? (
            <TrendingUp className="w-8 h-8 text-green-600" />
          ) : (
            <TrendingDown className="w-8 h-8 text-red-600" />
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Return %</p>
            <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {summary.unrealized_pct?.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create Dashboard page**

```typescript
// frontend/src/pages/Dashboard.tsx
import React from 'react'
import { PortfolioSummary } from '../components/PortfolioSummary'
import { AssetTable } from '../components/AssetTable'
import { NavBar } from '../components/NavBar'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Meu Portfólio</h1>

        <div className="mb-8">
          <PortfolioSummary />
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <AssetTable />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/components/PortfolioSummary.tsx frontend/src/pages/Dashboard.tsx
git commit -m "feat: build dashboard layout with portfolio summary"
```

---

#### Task 14: Build Asset Table and Upload Components

**Files:**
- Create: `frontend/src/components/AssetTable.tsx`
- Create: `frontend/src/pages/Upload.tsx`
- Create: `frontend/src/components/UploadStatus.tsx`

- [ ] **Step 1: Create AssetTable component**

```typescript
// frontend/src/components/AssetTable.tsx
import React from 'react'
import { usePortfolio } from '../lib/api'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function AssetTable() {
  const { data, isLoading } = usePortfolio()

  if (isLoading) return <div className="p-8">Loading assets...</div>

  const positions = data?.positions || []

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold">Ticker</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Tipo</th>
            <th className="px-6 py-3 text-right text-sm font-semibold">Qtd</th>
            <th className="px-6 py-3 text-right text-sm font-semibold">Preço Médio</th>
            <th className="px-6 py-3 text-right text-sm font-semibold">Preço Atual</th>
            <th className="px-6 py-3 text-right text-sm font-semibold">Valor Total</th>
            <th className="px-6 py-3 text-right text-sm font-semibold">Ganho/Perda</th>
            <th className="px-6 py-3 text-right text-sm font-semibold">%</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {positions.map((pos) => (
            <tr key={pos.ticker} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-blue-600 cursor-pointer">
                {pos.ticker}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{pos.asset_type}</td>
              <td className="px-6 py-4 text-right">{pos.quantity.toFixed(2)}</td>
              <td className="px-6 py-4 text-right">
                R$ {pos.average_price?.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4 text-right">
                R$ {pos.current_price?.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4 text-right font-semibold">
                R$ {pos.current_value?.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              </td>
              <td className={`px-6 py-4 text-right font-semibold ${pos.unrealized_pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {pos.unrealized_pl?.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  {pos.unrealized_pct >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={pos.unrealized_pct >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {pos.unrealized_pct?.toFixed(2)}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Create Upload page**

```typescript
// frontend/src/pages/Upload.tsx
import React, { useState } from 'react'
import { useUploadStatement } from '../lib/api'
import { Upload as UploadIcon, CheckCircle, AlertCircle } from 'lucide-react'

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const uploadMutation = useUploadStatement()

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) setFile(droppedFile)
  }

  const handleSubmit = async () => {
    if (!file) return
    await uploadMutation.mutateAsync(file)
    setFile(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-8">Upload de Extrato</h1>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition"
          >
            <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-700">
              Arraste um arquivo PDF ou XLSX aqui
            </p>
            <p className="text-sm text-gray-500 mt-2">
              ou clique para selecionar
            </p>
            <input
              type="file"
              accept=".pdf,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          {file && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Arquivo selecionado:</p>
              <p className="text-blue-600">{file.name}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!file || uploadMutation.isPending}
            className="mt-8 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploadMutation.isPending ? 'Processando...' : 'Enviar'}
          </button>

          {uploadMutation.isSuccess && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">Upload realizado com sucesso!</p>
                <p className="text-sm text-green-700 mt-1">
                  Seu extrato está sendo processado. Você pode acompanhar o status aqui.
                </p>
              </div>
            </div>
          )}

          {uploadMutation.isError && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">Erro ao processar arquivo</p>
                <p className="text-sm text-red-700 mt-1">
                  {uploadMutation.error?.message || 'Tente novamente'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/AssetTable.tsx frontend/src/pages/Upload.tsx
git commit -m "feat: add asset table and upload components"
```

---

### Phase 5: Final Integration and Testing

#### Task 15: Setup and Run Local Stack

**Files:**
- Create: `docker-compose.yml` (optional)
- Create: `README.md`

- [ ] **Step 1: Test backend locally**

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with actual credentials
uvicorn main:app --reload
```

- [ ] **Step 2: Test frontend locally**

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with actual credentials
npm run dev
```

- [ ] **Step 3: Verify API endpoints**

```bash
# Test health
curl http://localhost:8000/health

# Test portfolio (with valid auth token)
curl -H "Authorization: Bearer <token>" http://localhost:8000/portfolio
```

- [ ] **Step 4: Test E2E flow**

- [ x ] User can login via Supabase Auth
- [ x ] User can upload a statement PDF
- [ x ] Upload triggers Gemini extraction
- [ x ] Transactions appear in database
- [ x ] Dashboard displays portfolio summary
- [ x ] Market data polling runs (check scheduler logs)
- [ x ] Dividends calendar shows upcoming proventos

- [ ] **Step 5: Create README.md**

```markdown
# Portifel — Portfolio Abstraction Platform

## Quickstart

### Prerequisites
- Python 3.11+
- Node 18+
- Supabase account
- Gemini API key
- Brapi token

### Setup

1. **Database**: Run SQL schema in Supabase (docs/database_schema.sql)

2. **Backend**:
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with credentials
uvicorn main:app --reload
```

3. **Frontend**:
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with credentials
npm run dev
```

4. **Access**: http://localhost:5173

## Architecture

- **Backend**: FastAPI monolith with module separation
- **Frontend**: React + Vite + TailwindCSS
- **Database**: Supabase (PostgreSQL + Auth)
- **Market Data**: Agno worker + Brapi + yfinance
- **AI Extraction**: Gemini Flash for statement parsing

## API Endpoints

- `POST /statements` — Upload broker statement
- `GET /portfolio` — Current positions and summary
- `GET /portfolio/{ticker}` — Asset detail
- `GET /dividends` — Dividends received and upcoming

## Development

Run tests:
```bash
cd backend && pytest -v
cd frontend && npm run test
```
```

- [ ] **Step 6: Final commit**

```bash
git add README.md docker-compose.yml
git commit -m "docs: add README and setup instructions"
```

---

## Summary

**This plan provides a complete, testable implementation path:**

1. **Phase 1**: Project structure and database setup
2. **Phase 2**: Core backend (auth, AI extraction, market polling)
3. **Phase 3**: API endpoints for portfolio and dividends
4. **Phase 4**: Frontend authentication, dashboard, upload UI
5. **Phase 5**: Integration testing and documentation

**Each task is TDD-driven with clear commit points.** The architecture supports future scaling (worker separation) without rewriting.

---

**Ready to execute?**
