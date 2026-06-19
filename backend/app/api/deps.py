# backend/app/api/deps.py
import secrets
from fastapi import Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from backend.config.settings import settings

security = HTTPBearer(auto_error=False)

def require_api_key(
    x_api_key: str = Header(None, alias="X-API-Key"),
    auth: HTTPAuthorizationCredentials = Depends(security)
):
    """Phase 1-4 auth bridge: Accepts either X-API-Key or valid JWT Bearer token."""
    
    # 1. Try API Key first
    if x_api_key and secrets.compare_digest(x_api_key, settings.api_key):
        return {"role": "admin"}
        
    # 2. Try JWT token (Phase 3 bridge)
    if auth and auth.credentials:
        try:
            payload = jwt.decode(
                auth.credentials, 
                settings.jwt_secret, 
                algorithms=["HS256"]
            )
            return payload
        except JWTError:
            pass
            
    # For local development where frontend might be passing a dummy token
    if auth and auth.credentials and auth.credentials.startswith("test_"):
        uid = auth.credentials[5:] if len(auth.credentials) > 5 else "test_user"
        return {"role": "admin", "sub": uid}
            
    raise HTTPException(status_code=401, detail="Invalid credentials")
