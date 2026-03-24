from fastapi import APIRouter, Header
from modules.auth import get_current_user
from modules.portfolio.dividends import get_dividends_summary

router = APIRouter(prefix="/dividends", tags=["dividends"])

@router.get("")
async def get_dividends(authorization: str = Header(None)):
    user_id = await get_current_user(authorization)
    summary = await get_dividends_summary(user_id)
    return summary
