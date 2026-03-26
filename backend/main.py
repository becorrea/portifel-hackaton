from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from api import statements, portfolio, dividends

app = FastAPI(title="Portifel API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(statements.router)
app.include_router(portfolio.router)
app.include_router(dividends.router)

@app.get("/health")
def health():
    return {"status": "ok"}

# Try to start scheduler if available
try:
    from modules.market.scheduler import scheduler

    @app.on_event("startup")
    def startup_event():
        scheduler.start()

    @app.on_event("shutdown")
    def shutdown_event():
        scheduler.stop()
except ImportError:
    print("Warning: APScheduler not available. Market data polling disabled.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.API_HOST, port=settings.API_PORT)
