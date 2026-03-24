# Portifel - Quick Start

## ⚡ Setup em 3 passos

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edite .env com suas credenciais
python -m uvicorn main:app --reload
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edite .env com suas credenciais
npm run dev
```

### 3. Database
Execute o SQL em: `docs/database_schema.sql`
No Supabase Console → SQL Editor → Cole e execute

## 📝 Arquivos Principais

- `backend/` - API Python/FastAPI
- `frontend/` - React + Vite + TypeScript
- `docs/database_schema.sql` - Schema Supabase

## 🚀 APIs Prontas

- POST `/statements` - Upload de extrato
- GET `/portfolio` - Portfólio atual
- GET `/dividends` - Proventos
- GET `/health` - Health check

## 📚 Documentação Completa

Veja `README.md` para arquitetura e detalhes técnicos.
