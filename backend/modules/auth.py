from fastapi import HTTPException
from jose import jwt

class InvalidTokenError(Exception):
    pass

async def verify_token(token: str) -> str:
    """Verify Supabase JWT token."""
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get("sub")
        if not user_id:
            raise InvalidTokenError("No user_id in token")
        return user_id
    except Exception as e:
        raise InvalidTokenError(f"Invalid token: {str(e)}")

async def get_current_user(authorization: str) -> str:
    """Extract and verify token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    token = authorization.split(" ")[1]
    try:
        return await verify_token(token)
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
