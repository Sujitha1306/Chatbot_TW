from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, UTC
from jose import jwt, JWTError
import bcrypt
import uuid
import random
import string
from backend.config.settings import settings
from backend.app.db.mysql_pool import get_mysql_connection

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class NameUpdateRequest(BaseModel):
    name: str

class AuthResponse(BaseModel):
    token: str
    user: dict

def _create_token(user_id: str, role: str) -> str:
    exp = datetime.now(UTC) + timedelta(hours=settings.jwt_expire_hours)
    return jwt.encode(
        {"sub": user_id, "role": role, "exp": exp},
        settings.jwt_secret,
        algorithm="HS256",
    )

def _get_user_by_email(email: str):
    conn = get_mysql_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cursor.fetchone()
    finally:
        conn.close()

def _get_user_by_id(user_id: str):
    conn = get_mysql_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, email, role FROM users WHERE id = %s", (user_id,))
        return cursor.fetchone()
    finally:
        conn.close()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = _get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def _generate_unique_name(base_name: str) -> str:
    conn = get_mysql_connection()
    try:
        cursor = conn.cursor()
        name = base_name
        while True:
            cursor.execute("SELECT id FROM users WHERE name = %s", (name,))
            if not cursor.fetchone():
                return name
            name = base_name + "".join(random.choices(string.digits, k=4))
    finally:
        conn.close()

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    user = _get_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
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
    if _get_user_by_email(req.email):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Generate unique name (fallback to email prefix if not provided)
    base_name = req.name.strip()
    if not base_name:
        base_name = req.email.split("@")[0]
        
    unique_name = _generate_unique_name(base_name)
    
    hashed_pwd = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user_id = str(uuid.uuid4())
    
    conn = get_mysql_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (%s, %s, %s, %s, %s, %s)",
            (user_id, unique_name, req.email, hashed_pwd, 'analyst', datetime.now(UTC))
        )
        conn.commit()
    finally:
        conn.close()
        
    token = _create_token(user_id, 'analyst')
    return AuthResponse(token=token, user={"id": user_id, "name": unique_name, "email": req.email, "role": 'analyst'})

@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return user

@router.put("/me/name")
def update_name(req: NameUpdateRequest, user: dict = Depends(get_current_user)):
    new_name = req.name.strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
        
    if new_name == user["name"]:
        return {"status": "ok", "name": new_name}
        
    conn = get_mysql_connection()
    try:
        cursor = conn.cursor()
        # Check if exists
        cursor.execute("SELECT id FROM users WHERE name = %s", (new_name,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Name already taken")
            
        cursor.execute("UPDATE users SET name = %s WHERE id = %s", (new_name, user["id"]))
        conn.commit()
        return {"status": "ok", "name": new_name}
    finally:
        conn.close()
