import uuid
import io
import logging

from fastapi import APIRouter, UploadFile, File, Header, HTTPException, BackgroundTasks
from supabase import create_client

from config import settings
from modules.auth import get_current_user
from modules.ingestion.extractor import extract_transactions, extract_financial_summary
from modules.ingestion.normalizer import save_transactions, update_statement_status

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/statements", tags=["statements"])
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


@router.post("")
async def upload_statement(
    file: UploadFile = File(...),
    authorization: str = Header(None),
    x_user_id: str = Header(None),
    background_tasks: BackgroundTasks = None,
):
    user_id = await get_current_user(authorization, x_user_id)

    if not file.filename.endswith((".pdf", ".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="File must be PDF or XLSX")

    try:
        statement_id = str(uuid.uuid4())

        supabase.table("statements").insert(
            {"id": statement_id, "user_id": user_id, "status": "pending"}
        ).execute()

        content = await file.read()

        if background_tasks:
            background_tasks.add_task(
                process_statement, statement_id, user_id, content, file.filename
            )

        return {
            "statement_id": statement_id,
            "status": "pending",
            "message": "Statement received",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def process_statement(
    statement_id: str, user_id: str, content: bytes, filename: str
):
    try:
        await update_statement_status(statement_id, "processing", supabase_client=supabase)

        logger.info("Extracting transactions from %s (statement %s)", filename, statement_id)

        # Extract transactions and financial summary in parallel
        import asyncio
        text_for_summary = content.decode("utf-8", errors="replace")
        transactions, financial_summary = await asyncio.gather(
            extract_transactions(content, filename),
            extract_financial_summary(text_for_summary),
        )

        logger.info(
            "Extracted %d raw transactions from statement %s",
            len(transactions),
            statement_id,
        )

        # Save financial summary to raw_ai_output
        if financial_summary:
            supabase.table("statements").update(
                {"raw_ai_output": {"summary": financial_summary}}
            ).eq("id", statement_id).execute()

        stats = await save_transactions(user_id, statement_id, transactions, supabase)
        logger.info(
            "Statement %s — saved: %d, failed: %d",
            statement_id,
            stats["saved"],
            stats["failed"],
        )

        if stats["failed"] > 0:
            error_summary = f"{stats['failed']} transaction(s) failed validation: " + "; ".join(
                stats["errors"]
            )
            logger.warning("Statement %s errors: %s", statement_id, error_summary)
            await update_statement_status(
                statement_id, "done", error_message=error_summary, supabase_client=supabase
            )
        else:
            await update_statement_status(statement_id, "done", supabase_client=supabase)

    except Exception as e:
        logger.exception("Fatal error processing statement %s", statement_id)
        await update_statement_status(statement_id, "error", str(e), supabase_client=supabase)


@router.get("")
async def list_statements(
    authorization: str = Header(None), x_user_id: str = Header(None)
):
    user_id = await get_current_user(authorization, x_user_id)
    result = (
        supabase.table("statements").select("*").eq("user_id", user_id).execute()
    )
    return result.data


@router.get("/{statement_id}")
async def get_statement(
    statement_id: str,
    authorization: str = Header(None),
    x_user_id: str = Header(None),
):
    user_id = await get_current_user(authorization, x_user_id)
    result = (
        supabase.table("statements")
        .select("*")
        .eq("id", statement_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Statement not found")

    return result.data[0]
