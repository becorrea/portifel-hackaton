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

async def get_current_user(authorization: str = None, x_user_id: str = None) -> str:
    """Extract user_id from Authorization header or X-User-ID header.

    Priority:
    1. X-User-ID header (development/testing)
    2. Authorization Bearer token (production)
    """
    # Development mode: use X-User-ID header
    if x_user_id:
        return x_user_id

    # Production mode: use JWT token
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    token = authorization.split(" ")[1]
    try:
        return await verify_token(token)
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
