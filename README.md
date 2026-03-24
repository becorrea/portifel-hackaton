# Portifel — Portfolio Abstraction Platform

A multi-tenant platform that abstracts investment portfolios from different brokers, extracts transactions via AI (Gemini Flash), polls B3 market data, and presents a unified dashboard.

## Stack

- **Backend**: Python 3.11+, FastAPI, Supabase
- **Frontend**: React 18, Vite, TailwindCSS
- **Database**: Supabase (PostgreSQL + Auth)
- **Market Data**: Brapi.dev, yfinance
- **AI**: Google Gemini Flash

## Quick Setup

### 1. Database Setup

Run the SQL schema in Supabase Console:

```bash
# Copy contents from docs/database_schema.sql into Supabase SQL Editor
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env

# Fill in .env with your credentials:
# SUPABASE_URL=
# SUPABASE_SERVICE_KEY=
# GEMINI_API_KEY=
# BRAPI_TOKEN=

uvicorn main:app --reload
```

Backend runs on: http://localhost:8000

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env

# Fill in .env with your credentials:
# VITE_SUPABASE_URL=
# VITE_SUPABASE_ANON_KEY=
# VITE_API_URL=http://localhost:8000

npm run dev
```

Frontend runs on: http://localhost:5173

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /statements | Upload broker statement |
| GET | /statements | List user statements |
| GET | /statements/{id} | Get statement details |
| GET | /portfolio | Portfolio summary and positions |
| GET | /portfolio/{ticker} | Asset detail |
| GET | /dividends | Dividends received and upcoming |

## Features

- ✅ Multi-broker portfolio abstraction (XP, Nu Invest, Inter, etc.)
- ✅ AI-powered statement extraction (Gemini Flash)
- ✅ Automatic market data polling (Brapi + yfinance)
- ✅ User authentication (Supabase Auth)
- ✅ Portfolio dashboard with real-time P&L
- ✅ Dividend calendar and forecasting
- ✅ Asset-level tracking and history

## Architecture

```
┌─────────────┐
│   React     │
│  Frontend   │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────────────┐
│    FastAPI Backend  │
│  ├─ Auth           │
│  ├─ Extraction     │
│  ├─ Portfolio Calc │
│  └─ Market Polling │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│     Supabase        │
│  PostgreSQL + Auth  │
└─────────────────────┘
       ▲
       │
   ┌───┴────────────┐
   │                │
  Brapi          yfinance
  (B3 data)      (International)
```

## Testing

```bash
# Backend tests
cd backend
pytest -v

# Frontend tests
cd frontend
npm run test
```

## Deployment

For production deployment:

1. Build frontend: `npm run build`
2. Deploy to Vercel/Netlify
3. Deploy backend to Railway/Fly.io
4. Configure environment variables in deployment platform

## License

MIT

## Support

For issues or questions, open a GitHub issue.
