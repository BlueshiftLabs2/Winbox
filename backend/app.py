from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import uuid4
import os
import jwt
import bcrypt
import uvicorn

from models.database import get_db, Base, engine
from models.user import User as UserModel
from models.vm import VirtualMachine as VmModel
from schemas.user import User, UserCreate, UserLogin
from schemas.vm import VirtualMachine, VMCreate, VMOperation
from services.vm_manager import VMManager
from services.kvm_service import KVMService

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Winbox API")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth constants
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-for-development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# VM Manager and KVM Service
vm_manager = VMManager()
kvm_service = KVMService()

# Auth helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# Auth endpoints
@app.post("/api/auth/register", response_model=dict)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(UserModel).filter(UserModel.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )
    
    hashed_password = hash_password(user_data.password)
    
    new_user = UserModel(
        id=str(uuid4()),
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        created_at=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token({"sub": new_user.id})
    
    return {
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "createdAt": new_user.created_at.isoformat()
        },
        "token": access_token
    }

@app.post("/api/auth/login", response_model=dict)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token({"sub": user.id})
    
    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "createdAt": user.created_at.isoformat()
        },
        "token": access_token
    }

@app.get("/api/auth/me", response_model=User)
def get_current_user_info(current_user: UserModel = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "createdAt": current_user.created_at.isoformat()
    }

# VM endpoints
@app.get("/api/vms", response_model=List[VirtualMachine])
def list_vms(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vms = db.query(VmModel).filter(VmModel.user_id == current_user.id).all()
    return vms

@app.get("/api/vms/{vm_id}", response_model=VirtualMachine)
def get_vm(
    vm_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vm = db.query(VmModel).filter(
        VmModel.id == vm_id,
        VmModel.user_id == current_user.id
    ).first()
    
    if not vm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Virtual machine not found"
        )
    
    return vm

@app.post("/api/vms", response_model=VirtualMachine)
def create_vm(
    vm_data: VMCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check user's VM limit (max 3)
    existing_vms_count = db.query(VmModel).filter(
        VmModel.user_id == current_user.id
    ).count()
    
    if existing_vms_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum VM limit reached (3)"
        )
    
    # Validate VM creation parameters
    if len(vm_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VM password must be at least 8 characters"
        )
    
    if vm_data.cpu_count < 6 or vm_data.cpu_count > 24:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPU count must be between 6 and 24"
        )
        
    if vm_data.os_type == "custom" and not vm_data.custom_iso_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Custom ISO ID is required for custom OS installation"
        )
    
    # Create VM record
    vm_id = str(uuid4())
    
    new_vm = VmModel(
        id=vm_id,
        name=vm_data.name,
        username=vm_data.username,
        password=hash_password(vm_data.password),  # Store hashed password
        status="creating",
        cpu_count=vm_data.cpu_count,
        ram_size=32,  # 32GB RAM fixed
        storage_size=280,  # 280GB storage fixed
        gpu_enabled=vm_data.gpu_enabled,
        os_type=vm_data.os_type,
        created_at=datetime.utcnow(),
        user_id=current_user.id
    )
    
    db.add(new_vm)
    db.commit()
    db.refresh(new_vm)
    
    # Start VM creation in background
    vm_manager.create_vm_async(
        vm_id=vm_id,
        cpu_count=vm_data.cpu_count,
        ram_size=32,
        storage_size=280,
        gpu_enabled=vm_data.gpu_enabled,
        os_type=vm_data.os_type,
        custom_iso_id=vm_data.custom_iso_id,
        username=vm_data.username,
        password=vm_data.password
    )
    
    return new_vm

@app.post("/api/vms/{vm_id}/start", response_model=VirtualMachine)
def start_vm(
    vm_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find VM and check ownership
    vm = db.query(VmModel).filter(
        VmModel.id == vm_id,
        VmModel.user_id == current_user.id
    ).first()
    
    if not vm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Virtual machine not found"
        )
    
    # Check VM state
    if vm.status != "stopped":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"VM cannot be started from state: {vm.status}"
        )
    
    # Update VM status
    vm.status = "running"
    db.commit()
    db.refresh(vm)
    
    # Start VM in background
    vm_manager.start_vm_async(vm_id)
    
    return vm

@app.post("/api/vms/{vm_id}/stop", response_model=VirtualMachine)
def stop_vm(
    vm_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find VM and check ownership
    vm = db.query(VmModel).filter(
        VmModel.id == vm_id,
        VmModel.user_id == current_user.id
    ).first()
    
    if not vm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Virtual machine not found"
        )
    
    # Check VM state
    if vm.status != "running":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"VM cannot be stopped from state: {vm.status}"
        )
    
    # Update VM status
    vm.status = "stopped"
    db.commit()
    db.refresh(vm)
    
    # Stop VM in background
    vm_manager.stop_vm_async(vm_id)
    
    return vm

@app.delete("/api/vms/{vm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vm(
    vm_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find VM and check ownership
    vm = db.query(VmModel).filter(
        VmModel.id == vm_id,
        VmModel.user_id == current_user.id
    ).first()
    
    if not vm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Virtual machine not found"
        )
    
    # Delete VM in background
    vm_manager.delete_vm_async(vm_id)
    
    # Delete VM record
    db.delete(vm)
    db.commit()
    
    return None

@app.post("/api/vms/iso-upload", response_model=dict)
async def upload_iso(
    iso: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_user)
):
    # Check file type
    if not iso.filename.lower().endswith('.iso'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an ISO image"
        )
    
    # Generate unique ID for the ISO
    iso_id = str(uuid4())
    
    # Save ISO file
    iso_path = await vm_manager.save_iso(iso_id, iso)
    
    return {"id": iso_id}

@app.get("/api/vms/{vm_id}/console", response_model=dict)
def get_console_url(
    vm_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find VM and check ownership
    vm = db.query(VmModel).filter(
        VmModel.id == vm_id,
        VmModel.user_id == current_user.id
    ).first()
    
    if not vm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Virtual machine not found"
        )
    
    # Check VM is running
    if vm.status != "running":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VM must be running to access console"
        )
    
    # Get console connection details
    console_url, token = kvm_service.get_vm_console(vm_id)
    
    return {
        "url": console_url,
        "token": token
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)