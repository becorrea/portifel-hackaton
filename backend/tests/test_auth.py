import pytest
from modules.auth import verify_token, InvalidTokenError, get_current_user

def test_verify_token_invalid():
    """Test that invalid JWT raises error."""
    import asyncio
    with pytest.raises(InvalidTokenError):
        asyncio.run(verify_token("invalid.token"))

def test_get_current_user_invalid_header():
    """Test invalid auth header."""
    from fastapi import HTTPException
    import asyncio
    with pytest.raises(HTTPException):
        asyncio.run(get_current_user("InvalidHeader"))
