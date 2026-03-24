from fastapi import APIRouter, UploadFile, File, Header, HTTPException, BackgroundTasks
from supabase import create_client
from config import settings
from modules.auth import get_current_user
from modules.ingestion.extractor import extract_transactions_from_pdf
from modules.ingestion.normalizer import save_transactions, update_statement_status
import uuid
import io

router = APIRouter(prefix="/statements", tags=["statements"])
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

@router.post("")
async def upload_statement(
    file: UploadFile = File(...),
    authorization: str = Header(None),
    background_tasks: BackgroundTasks = None
):
    user_id = await get_current_user(authorization)

    if not file.filename.endswith((".pdf", ".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="File must be PDF or XLSX")

    try:
        statement_id = str(uuid.uuid4())

        supabase.table("statements").insert({
            "id": statement_id,
            "user_id": user_id,
            "status": "pending"
        }).execute()

        content = await file.read()

        if file.filename.endswith(".pdf"):
            try:
                import PyPDF2
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
                text = "\n".join([page.extract_text() for page in pdf_reader.pages])
            except:
                text = str(content)
        else:
            text = str(content)

        if background_tasks:
            background_tasks.add_task(process_statement, statement_id, user_id, text)

        return {"statement_id": statement_id, "status": "pending", "message": "Statement received"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def process_statement(statement_id: str, user_id: str, file_text: str):
    try:
        update_statement_status(statement_id, "processing")
        transactions = await extract_transactions_from_pdf(file_text)
        await save_transactions(user_id, statement_id, transactions, supabase)
        update_statement_status(statement_id, "done")
    except Exception as e:
        update_statement_status(statement_id, "error", str(e))

@router.get("")
async def list_statements(authorization: str = Header(None)):
    user_id = await get_current_user(authorization)
    result = supabase.table("statements").select("*").eq("user_id", user_id).execute()
    return result.data

@router.get("/{statement_id}")
async def get_statement(statement_id: str, authorization: str = Header(None)):
    user_id = await get_current_user(authorization)
    result = supabase.table("statements").select("*").eq("id", statement_id).eq("user_id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Statement not found")
    
    return result.data[0]
