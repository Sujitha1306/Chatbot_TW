from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import jwt
import bcrypt
from backend.config.settings import settings

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


# Bridge user store — replace with DB in Phase 6
# Set DEMO_USER_EMAIL and DEMO_USER_PASSWORD_HASH in .env
def _get_demo_user():
    return {
        "id":    "demo-user-001",
        "name":  settings.demo_user_name,
        "email": settings.demo_user_email,
        "role":  "analyst",
        "password_hash": settings.demo_user_password_hash,
    }


def _create_token(user_id: str, role: str) -> str:
    exp = datetime.utcnow() + timedelta(hours=settings.jwt_expire_hours)
    return jwt.encode(
        {"sub": user_id, "role": role, "exp": exp},
        settings.jwt_secret,
        algorithm="HS256",
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    user = _get_demo_user()
    if req.email != user["email"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Use bcrypt directly to avoid passlib >=4.0 incompatibilities
    is_valid = False
    try:
        is_valid = bcrypt.checkpw(
            req.password.encode('utf-8'), 
            user["password_hash"].encode('utf-8')
        )
    except Exception:
        is_valid = False
        
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = _create_token(user["id"], user["role"])
    return AuthResponse(token=token, user={"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]})


@router.post("/signup", response_model=AuthResponse)
def signup(req: SignupRequest):
    # Phase 3 bridge: only one user supported; Phase 6 adds real DB
    raise HTTPException(status_code=501, detail="Signup available in next release")


@router.get("/me")
def me():
    return {"message": "implement with JWT dependency in Phase 6"}
