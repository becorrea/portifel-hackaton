from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from supabase import create_client
from config import settings
import logging
import asyncio

logger = logging.getLogger(__name__)

class MarketDataScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        self.running = False

    def start(self):
        if self.running:
            return
        trigger = CronTrigger(hour=18)
        self.scheduler.add_job(
            self.poll_market_data,
            trigger,
            id="market_data_poll",
            name="Poll market data",
            misfire_grace_time=900
        )
        self.scheduler.start()
        self.running = True
        logger.info("Market data scheduler started")

    def stop(self):
        if self.running:
            self.scheduler.shutdown()
            self.running = False

    def poll_market_data(self):
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(self._async_poll())
        except Exception as e:
            logger.error(f"Polling error: {e}")

    async def _async_poll(self):
        try:
            result = self.supabase.table("transactions").select("DISTINCT ticker").execute()
            tickers = [row["ticker"] for row in result.data]
            logger.info(f"Polling {len(tickers)} tickers")
        except Exception as e:
            logger.error(f"Error: {e}")

scheduler = MarketDataScheduler()
