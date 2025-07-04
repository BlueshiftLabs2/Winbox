from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class VirtualMachine(Base):
    __tablename__ = "virtual_machines"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    username = Column(String)
    password = Column(String)  # Hashed password for VM access
    status = Column(String)  # creating, running, stopped, failed
    cpu_count = Column(Integer)
    ram_size = Column(Integer)  # GB
    storage_size = Column(Integer)  # GB
    gpu_enabled = Column(Boolean, default=False)
    os_type = Column(String)  # windows11 or custom
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime)
    user_id = Column(String, ForeignKey("users.id"))

    # Relationship to User
    user = relationship("User")