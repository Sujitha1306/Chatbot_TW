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
    """Phase 1-4 auth bridge: Extracts user ID from JWT, falling back to X-User-Id."""
    
    # 1. Try to extract user ID from the JWT token
    if auth and auth.credentials:
        try:
            # First try with signature verification
            payload = jwt.decode(
                auth.credentials, 
                settings.jwt_secret, 
                algorithms=["HS256"]
            )
            if "sub" in payload:
                return {"role": payload.get("role", "admin"), "sub": payload["sub"]}
        except JWTError:
            # If signature fails (e.g. parent app uses different secret), extract unverified claims
            try:
                unverified_payload = jwt.get_unverified_claims(auth.credentials)
                if "sub" in unverified_payload:
                    return {"role": unverified_payload.get("role", "admin"), "sub": unverified_payload["sub"]}
            except Exception:
                pass
                
        # Handle the local testing token format
        if auth.credentials.startswith("test_"):
            uid = auth.credentials[5:] if len(auth.credentials) > 5 else "test_user"
            return {"role": "admin", "sub": uid}
            
    # 2. If no valid JWT, fallback to X-User-Id header directly
    if x_user_id:
        return {"role": "admin", "sub": x_user_id}
        
    # 3. Ultimate fallback
    return {"role": "admin", "sub": "demo-user-001"}
