from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
import certifi
from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
import jwt
import hashlib
import secrets
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configure logging for production
logging.basicConfig(
    level=logging.INFO if os.getenv("ENVIRONMENT") == "production" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with SSL configuration
mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    raise ValueError("MONGO_URL environment variable is not set")

# Fix common environment variable issues
if mongo_url.startswith('MONGO_URL='):
    mongo_url = mongo_url.split('=', 1)[1]

print(f"Connecting to MongoDB with URL: {mongo_url[:50]}...")  # Log first 50 chars for debugging

# Validate URL format
if not mongo_url.startswith(('mongodb://', 'mongodb+srv://')):
    raise ValueError(f"Invalid MongoDB URL format: {mongo_url[:50]}...")

# Use TLS with CA bundle for Atlas compatibility
client = AsyncIOMotorClient(
    mongo_url,
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000,
    connectTimeoutMS=30000,
    socketTimeoutMS=30000,
    retryWrites=True,
    retryReads=True
)
print("Connected to MongoDB with TLS using certifi CA bundle")
db = client[os.environ.get('DB_NAME', 'khlp_database')]

# Create the main app without a prefix
# Create FastAPI app
app = FastAPI(
    title="KHPL System",
    description="Team Management System with Hierarchical Structure",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") == "development" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") == "development" else None
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        # Test MongoDB connection
        await client.admin.command('ping')
        return {"status": "healthy", "mongodb": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "mongodb": "disconnected", "error": str(e)}

# Lightweight API ping (does not touch DB)
@api_router.get("/ping")
async def api_ping():
    return {"ok": True}

# Security setup
security = HTTPBearer()
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# File upload functionality not implemented yet

# Models
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    aadhaar_id: Optional[str] = None

class UserCreate(UserBase):
    password: str
    parent_id: Optional[str] = None
    id_proof: Optional[str] = None

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    parent_id: Optional[str] = None
    level: int = 0
    id_proof_url: Optional[str] = None
    is_owner: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    invited_by: Optional[str] = None

class UserLogin(BaseModel):
    phone: str  # Change from email to phone
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str]
    address: Optional[str]
    aadhaar_id: Optional[str]
    parent_id: Optional[str]
    level: int
    id_proof_url: Optional[str]
    is_owner: bool
    created_at: datetime
    children_count: int = 0

class Invitation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    invited_by: str
    token: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    status: str = "pending"  # pending, accepted, expired
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=7))

class InviteUser(BaseModel):
    name: str
    email: Optional[EmailStr] = None  # Optional for WhatsApp invitations

class RegisterFromInvitation(BaseModel):
    token: str
    password: str
    name: str
    phone: str  # Make phone mandatory for login
    email: Optional[EmailStr] = None  # Make email optional
    address: Optional[str] = None
    aadhaar_id: str
    
    @validator('email', pre=True)
    def validate_email(cls, v):
        if v == "" or v is None:
            return None
        return v
    
    @validator('address', pre=True)
    def validate_address(cls, v):
        if v == "" or v is None:
            return None
        return v

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Utility functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Try bcrypt first (new format)
        if hashed_password.startswith('$2b$'):
            return pwd_context.verify(plain_password, hashed_password)
        else:
            # Fallback to SHA256 for old hashes (backward compatibility)
            import hashlib
            return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_user_children_count(user_id: str) -> int:
    count = await db.users.count_documents({"parent_id": user_id})
    return count

async def prepare_user_response(user_doc: dict) -> UserResponse:
    # Calculate current children count
    current_children_count = await get_user_children_count(user_doc["id"])
    
    # Remove the old children_count from user_doc to avoid conflict
    user_data = {k: v for k, v in user_doc.items() if k != "children_count"}
    
    return UserResponse(
        **user_data,
        children_count=current_children_count
    )

# Initialize owner if not exists
async def initialize_owner():
    owner = await db.users.find_one({"is_owner": True})
    if not owner:
        # Create default owner - Rakesh Ranjan Mishra
        owner_data = {
            "id": str(uuid.uuid4()),
            "name": "Rakesh Ranjan Mishra",
            "email": os.getenv("OWNER_EMAIL", "owner@mlmapp.com"),
            "password_hash": get_password_hash(os.getenv("OWNER_PASSWORD", "defaultpassword123")),
            "phone": os.getenv("OWNER_PHONE", "+91-9876543210"),
            "address": None,
            "aadhaar_id": None,
            "parent_id": None,
            "level": 0,
            "id_proof_url": None,
            "is_owner": True,
            "created_at": datetime.now(timezone.utc),
            "invited_by": None
        }
        await db.users.insert_one(owner_data)
        print(f"Default owner created: {owner_data['email']} | Phone: {owner_data['phone']}")

# Routes
@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    try:
        # Find user by phone number
        user = await db.users.find_one({"phone": user_credentials.phone})
        
        if not user:
            logger.warning(f"Login attempt with non-existent phone: {user_credentials.phone}")
            raise HTTPException(
                status_code=401, 
                detail="Invalid credentials. Please check your phone number and password."
            )
        
        # Verify password
        if not verify_password(user_credentials.password, user["password_hash"]):
            logger.warning(f"Failed login attempt for user: {user['name']} (Phone: {user_credentials.phone})")
            raise HTTPException(
                status_code=401, 
                detail="Invalid credentials. Please check your phone number and password."
            )
        
        # Generate access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["id"]}, expires_delta=access_token_expires
        )
        
        user_response = await prepare_user_response(user)
        logger.info(f"Successful login for user: {user['name']} (Phone: {user_credentials.phone})")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 401)
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=500, 
            detail="An error occurred during login. Please try again."
        )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return await prepare_user_response(current_user)

@api_router.post("/invite", response_model=dict)
async def invite_user(invite_data: InviteUser, current_user: dict = Depends(get_current_user)):
    # Generate a unique email for WhatsApp invitations if not provided
    user_email = invite_data.email
    if not user_email:
        # Create a unique identifier for WhatsApp invitations
        user_email = f"whatsapp-{secrets.token_urlsafe(8)}@example.com"
    
    # Check if user already exists (only if email is provided)
    if user_email and not user_email.startswith("whatsapp-"):
        existing_user = await db.users.find_one({"email": user_email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Check if invitation already exists and is pending
        existing_invitation = await db.invitations.find_one({
            "email": user_email, 
            "status": "pending"
        })
        if existing_invitation:
            raise HTTPException(status_code=400, detail="Invitation already sent to this email")
    
    # Check team member limit (maximum 2 direct children)
    current_children_count = await db.users.count_documents({"parent_id": current_user["id"]})
    if current_children_count >= 2:
        raise HTTPException(status_code=400, detail="You can only have a maximum of 2 direct team members")
    
    # Create invitation
    invitation = Invitation(
        email=user_email,
        invited_by=current_user["id"]
    )
    
    await db.invitations.insert_one(invitation.dict())
    
    # Return the invitation details for WhatsApp sharing
    return {
        "message": "Invitation created successfully",
        "invitation_token": invitation.token,
        "invite_link": f"/register?token={invitation.token}",
        "member_name": invite_data.name
    }

@api_router.get("/invitation/{token}")
async def get_invitation_details(token: str):
    invitation = await db.invitations.find_one({
        "token": token,
        "status": "pending"
    })
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation")
    
    # Convert stored datetime to timezone-aware for comparison
    expires_at = invitation["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        await db.invitations.update_one(
            {"token": token},
            {"$set": {"status": "expired"}}
        )
        raise HTTPException(status_code=400, detail="Invitation has expired")
    
    return {
        "email": invitation["email"],
        "invited_by_name": "Unknown",  # You can fetch the inviter's name if needed
        "valid": True
    }

@api_router.post("/auth/register", response_model=Token)
async def register_from_invitation(registration_data: RegisterFromInvitation):
    # Validate invitation
    invitation = await db.invitations.find_one({
        "token": registration_data.token,
        "status": "pending"
    })
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation")
    
    # Convert stored datetime to timezone-aware for comparison
    expires_at = invitation["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitation has expired")
    
    # Use the phone number provided during registration for login
    user_phone = registration_data.phone
    
    # Check if user already exists (by phone number)
    existing_user = await db.users.find_one({"phone": user_phone})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this phone number already registered")
    
    # Get parent user to determine level
    parent_user = await db.users.find_one({"id": invitation["invited_by"]})
    if not parent_user:
        raise HTTPException(status_code=400, detail="Invalid invitation - inviter not found")
    
    # Create new user
    new_user = {
        "id": str(uuid.uuid4()),
        "name": registration_data.name,
        "email": registration_data.email or invitation["email"],  # Use provided email or placeholder
        "password_hash": get_password_hash(registration_data.password),
        "phone": registration_data.phone,
        "address": registration_data.address,
        "aadhaar_id": registration_data.aadhaar_id,
        "parent_id": invitation["invited_by"],
        "level": parent_user["level"] + 1,
        "id_proof_url": None,
        "is_owner": False,
        "created_at": datetime.now(timezone.utc),
        "invited_by": invitation["invited_by"]
    }
    
    await db.users.insert_one(new_user)
    
    # Mark invitation as accepted
    await db.invitations.update_one(
        {"token": registration_data.token},
        {"$set": {"status": "accepted"}}
    )
    
    # Generate access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user["id"]}, expires_delta=access_token_expires
    )
    
    user_response = await prepare_user_response(new_user)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

# File upload functionality will be added later

@api_router.get("/my-team", response_model=List[UserResponse])
async def get_my_team(current_user: dict = Depends(get_current_user)):
    # Get all direct children
    children = await db.users.find({"parent_id": current_user["id"]}).to_list(None)
    
    result = []
    for child in children:
        result.append(await prepare_user_response(child))
    
    return result

@api_router.get("/team-tree")
async def get_team_tree(current_user: dict = Depends(get_current_user)):
    async def build_tree(user_id: str, max_depth: int = 10, current_depth: int = 0):
        if current_depth >= max_depth:
            return None
        
        user = await db.users.find_one({"id": user_id})
        if not user:
            return None
        
        children = await db.users.find({"parent_id": user_id}).to_list(None)
        
        tree_node = {
            "id": user["id"],
            "name": user["name"],
            "phone": user["phone"],
            "level": user["level"],
            "children_count": len(children),
            "children": []
        }
        
        for child in children:
            child_tree = await build_tree(child["id"], max_depth, current_depth + 1)
            if child_tree:
                tree_node["children"].append(child_tree)
        
        return tree_node
    
    tree = await build_tree(current_user["id"])
    return tree

@api_router.get("/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    # Count direct children
    direct_children = await db.users.count_documents({"parent_id": current_user["id"]})
    
    # Count total downline (all descendants)
    async def count_descendants(user_id: str, visited: set = None) -> int:
        if visited is None:
            visited = set()
        
        if user_id in visited:
            return 0
        
        visited.add(user_id)
        
        children = await db.users.find({"parent_id": user_id}).to_list(None)
        count = len(children)
        
        for child in children:
            count += await count_descendants(child["id"], visited)
        
        return count
    
    total_downline = await count_descendants(current_user["id"])
    
    return {
        "direct_children": direct_children,
        "total_downline": total_downline,
        "level": current_user["level"],
        "is_owner": current_user.get("is_owner", False)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    try:
        # Test MongoDB connection first
        await client.admin.command('ping')
        print("✅ MongoDB connection successful")
        
        # Initialize owner
        await initialize_owner()
        print("✅ Owner initialization successful")
        
    except Exception as e:
        print(f"❌ Startup error: {e}")
        # Don't fail the entire app if MongoDB is temporarily unavailable
        # The app can still start and handle requests
        pass

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()