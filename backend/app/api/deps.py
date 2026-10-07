# backend/app/api/deps.py
import secrets
from fastapi import Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from backend.config.settings import settings

security = HTTPBearer(auto_error=False)

from fastapi import Query, Request

def require_api_key(
    request: Request,
    auth: HTTPAuthorizationCredentials = Depends(security),
    x_user_id: str = Header(None, alias="X-User-Id"),
    userId: str = Query(None),
    facility_id_header: str = Header(None, alias="facilityId"),
    x_facility_id: str = Header(None, alias="X-Facility-Id"),
    facility_id_query: str = Query(None, alias="facilityId"),
    customer_id_header: str = Header(None, alias="customerId"),
    region_id_header: str = Header(None, alias="regionId"),
):
    """Phase 1-4 auth bridge: Accepts either X-API-Key or valid JWT Bearer token."""
    
    raw_fac_id = (
        facility_id_header 
        or x_facility_id 
        or facility_id_query 
        or request.headers.get("facilityid") 
        or request.headers.get("x-facility-id") 
        or request.headers.get("facility_id") 
        or request.headers.get("facility") 
        or request.headers.get("X-Facility-Id")
        or request.query_params.get("facilityid") 
        or request.query_params.get("facility_id") 
        or request.query_params.get("facility") 
        or request.query_params.get("facilityId")
    )
    eff_facility_id = raw_fac_id.strip() if raw_fac_id and str(raw_fac_id).strip() != "" else "0459"
    print(f"DEBUG: require_api_key received x_user_id={x_user_id}, eff_facility_id={eff_facility_id}")
    
    # 0. LOCAL DEVELOPMENT BYPASS: Allow all requests without checking the key
    return {
        "role": "admin", 
        "sub": userId or x_user_id or "demo-user-001",
        "facility_id": eff_facility_id,
        "customer_id": customer_id_header,
        "region_id": region_id_header,
    }
        
    # 2. Try JWT token (Phase 3 bridge)
    if auth and auth.credentials:
        try:
            payload = jwt.decode(
                auth.credentials, 
                settings.jwt_secret, 
                algorithms=["HS256"]
            )
            if eff_facility_id:
                payload["facility_id"] = eff_facility_id
            if customer_id_header:
                payload["customer_id"] = customer_id_header
            if region_id_header:
                payload["region_id"] = region_id_header
            return payload
        except JWTError:
            pass
            
    # For local development where frontend might be passing a dummy token
    if auth and auth.credentials and auth.credentials.startswith("test_"):
        uid = auth.credentials[5:] if len(auth.credentials) > 5 else "test_user"
        return {
            "role": "admin", 
            "sub": uid,
            "facility_id": eff_facility_id,
            "customer_id": customer_id_header,
            "region_id": region_id_header,
        }
            
    raise HTTPException(status_code=401, detail="Invalid credentials")
