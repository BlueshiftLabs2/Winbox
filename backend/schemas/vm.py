from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal

class VMBase(BaseModel):
    name: str
    username: str
    cpu_count: int
    gpu_enabled: bool
    os_type: Literal["windows11", "custom"]

class VMCreate(VMBase):
    password: str
    custom_iso_id: Optional[str] = None

class VMOperation(BaseModel):
    operation: Literal["start", "stop", "restart"]

class VirtualMachine(VMBase):
    id: str
    status: str
    ram_size: int
    storage_size: int
    ip_address: Optional[str] = None
    created_at: datetime
    user_id: str

    class Config:
        orm_mode = True