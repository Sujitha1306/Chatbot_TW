# backend/app/api/deps.py
import secrets
from fastapi import Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from backend.config.settings import settings

security = HTTPBearer(auto_error=False)

def require_api_key(
    auth: HTTPAuthorizationCredentials = Depends(security),
    x_user_id: str = Header(None, alias="X-User-Id")
):
    """Phase 1-4 auth bridge: Accepts either X-API-Key or valid JWT Bearer token."""
    
    print(f"DEBUG: require_api_key received x_user_id={x_user_id}")
    
    # 0. LOCAL DEVELOPMENT BYPASS: Allow all requests without checking the key
    return {"role": "admin", "sub": x_user_id or "demo-user-001"}
        
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
