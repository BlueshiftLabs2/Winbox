import os
import asyncio
import shutil
from typing import Optional
from fastapi import UploadFile
import subprocess
from concurrent.futures import ThreadPoolExecutor
import libvirt
import time
import xml.etree.ElementTree as ET

class VMManager:
    def __init__(self):
        self.iso_dir = os.path.join(os.getcwd(), "iso_storage")
        self.vm_dir = os.path.join(os.getcwd(), "vm_storage")
        self.windows_iso_path = os.path.join(os.getcwd(), "iso_storage", "windows11.iso")
        self.nvidia_driver_path = os.path.join(os.getcwd(), "drivers", "nvidia_driver.exe")
        
        # Create storage directories if they don't exist
        os.makedirs(self.iso_dir, exist_ok=True)
        os.makedirs(self.vm_dir, exist_ok=True)
        
        # Initialize thread pool for async operations
        self.executor = ThreadPoolExecutor(max_workers=5)
        
        # Connect to libvirt
        self.conn = libvirt.open('qemu:///system')
        if not self.conn:
            raise Exception('Failed to connect to QEMU/KVM')

    async def save_iso(self, iso_id: str, iso_file: UploadFile) -> str:
        """Save uploaded ISO file to storage"""
        iso_path = os.path.join(self.iso_dir, f"{iso_id}.iso")
        
        with open(iso_path, "wb") as f:
            # Read file in chunks to prevent memory issues with large ISOs
            chunk_size = 1024 * 1024  # 1MB chunks
            while True:
                chunk = await iso_file.read(chunk_size)
                if not chunk:
                    break
                f.write(chunk)
                
        return iso_path

    def create_vm_async(
        self, 
        vm_id: str,
        cpu_count: int,
        ram_size: int,
        storage_size: int,
        gpu_enabled: bool,
        os_type: str,
        custom_iso_id: Optional[str],
        username: str,
        password: str
    ):
        """Start VM creation in a separate thread"""
        loop = asyncio.get_event_loop()
        return loop.run_in_executor(
            self.executor,
            self._create_vm,
            vm_id,
            cpu_count,
            ram_size,
            storage_size,
            gpu_enabled,
            os_type,
            custom_iso_id,
            username,
            password
        )

    def _create_vm(
        self, 
        vm_id: str,
        cpu_count: int,
        ram_size: int,
        storage_size: int,
        gpu_enabled: bool,
        os_type: str,
        custom_iso_id: Optional[str],
        username: str,
        password: str
    ):
        """Create a new KVM virtual machine"""
        try:
            # Create VM directory
            vm_path = os.path.join(self.vm_dir, vm_id)
            os.makedirs(vm_path, exist_ok=True)
            
            # Create disk image
            disk_path = os.path.join(vm_path, f"{vm_id}.qcow2")
            subprocess.run([
                "qemu-img", "create", "-f", "qcow2", disk_path, f"{storage_size}G"
            ], check=True)
            
            # Determine ISO path
            if os_type == "windows11":
                iso_path = self.windows_iso_path
            else:  # custom ISO
                iso_path = os.path.join(self.iso_dir, f"{custom_iso_id}.iso")
                if not os.path.exists(iso_path):
                    raise FileNotFoundError(f"Custom ISO not found: {iso_path}")
            
            # Create VM XML definition
            xml_template = f"""
            <domain type='kvm'>
                <name>winbox-{vm_id}</name>
                <memory unit='GiB'>{ram_size}</memory>
                <vcpu>{cpu_count}</vcpu>
                <os>
                    <type arch='x86_64'>hvm</type>
                    <boot dev='cdrom'/>
                </os>
                <features>
                    <acpi/>
                    <apic/>
                </features>
                <cpu mode='host-passthrough'/>
                <devices>
                    <disk type='file' device='disk'>
                        <driver name='qemu' type='qcow2'/>
                        <source file='{disk_path}'/>
                        <target dev='vda' bus='virtio'/>
                    </disk>
                    <disk type='file' device='cdrom'>
                        <driver name='qemu' type='raw'/>
                        <source file='{iso_path}'/>
                        <target dev='hda' bus='ide'/>
                        <readonly/>
                    </disk>
                    <interface type='bridge'>
                        <source bridge='virbr0'/>
                        <model type='virtio'/>
                    </interface>
                    <graphics type='vnc' port='-1' autoport='yes' websocket='-1' listen='0.0.0.0'>
                        <listen type='address' address='0.0.0.0'/>
                    </graphics>
                    <video>
                        <model type='qxl' ram='65536' vram='65536' vgamem='16384' heads='1' primary='yes'/>
                    </video>
                    <input type='tablet' bus='usb'/>
                    <input type='keyboard' bus='usb'/>
                </devices>
            </domain>
            """
            
            # Add GPU passthrough if enabled
            if gpu_enabled:
                xml_root = ET.fromstring(xml_template)
                devices_node = xml_root.find('./devices')
                
                # Add NVIDIA GPU passthrough
                gpu_node = ET.SubElement(devices_node, 'hostdev')
                gpu_node.set('mode', 'subsystem')
                gpu_node.set('type', 'pci')
                gpu_node.set('managed', 'yes')
                
                source_node = ET.SubElement(gpu_node, 'source')
                address_node = ET.SubElement(source_node, 'address')
                address_node.set('domain', '0x0000')
                address_node.set('bus', '0x01')  # Example PCI address, would need to be detected dynamically
                address_node.set('slot', '0x00')
                address_node.set('function', '0x0')
                
                xml_template = ET.tostring(xml_root, encoding='unicode')
            
            # Create VM
            domain = self.conn.defineXML(xml_template)
            if not domain:
                raise Exception("Failed to define VM domain")
            
            # Start VM
            domain.create()
            
            # Update VM status in database (example implementation)
            # We'd normally update a database here, but for simplicity we'll just print
            print(f"VM {vm_id} created and started successfully")
            
            # Create a file with VM credentials for later use
            with open(os.path.join(vm_path, "credentials.txt"), "w") as f:
                f.write(f"Username: {username}\n")
                f.write(f"Password: {password}\n")
            
            return True
        except Exception as e:
            print(f"Error creating VM {vm_id}: {str(e)}")
            # Update VM status to failed
            return False

    def start_vm_async(self, vm_id: str):
        """Start VM in a separate thread"""
        loop = asyncio.get_event_loop()
        return loop.run_in_executor(
            self.executor,
            self._start_vm,
            vm_id
        )

    def _start_vm(self, vm_id: str):
        """Start a KVM virtual machine"""
        try:
            domain_name = f"winbox-{vm_id}"
            domain = self.conn.lookupByName(domain_name)
            if domain.isActive():
                print(f"VM {vm_id} is already running")
                return True
            
            domain.create()
            print(f"VM {vm_id} started successfully")
            return True
        except Exception as e:
            print(f"Error starting VM {vm_id}: {str(e)}")
            return False

    def stop_vm_async(self, vm_id: str):
        """Stop VM in a separate thread"""
        loop = asyncio.get_event_loop()
        return loop.run_in_executor(
            self.executor,
            self._stop_vm,
            vm_id
        )

    def _stop_vm(self, vm_id: str):
        """Stop a KVM virtual machine"""
        try:
            domain_name = f"winbox-{vm_id}"
            domain = self.conn.lookupByName(domain_name)
            if not domain.isActive():
                print(f"VM {vm_id} is already stopped")
                return True
            
            # Try graceful shutdown first
            domain.shutdown()
            
            # Wait for up to 30 seconds for graceful shutdown
            for _ in range(30):
                time.sleep(1)
                if not domain.isActive():
                    break
            
            # Force shutdown if still running
            if domain.isActive():
                domain.destroy()
                
            print(f"VM {vm_id} stopped successfully")
            return True
        except Exception as e:
            print(f"Error stopping VM {vm_id}: {str(e)}")
            return False

    def delete_vm_async(self, vm_id: str):
        """Delete VM in a separate thread"""
        loop = asyncio.get_event_loop()
        return loop.run_in_executor(
            self.executor,
            self._delete_vm,
            vm_id
        )

    def _delete_vm(self, vm_id: str):
        """Delete a KVM virtual machine"""
        try:
            domain_name = f"winbox-{vm_id}"
            
            # Try to find and delete the domain
            try:
                domain = self.conn.lookupByName(domain_name)
                
                # Force stop if running
                if domain.isActive():
                    domain.destroy()
                
                # Undefine the domain to remove it from libvirt
                domain.undefineFlags(libvirt.VIR_DOMAIN_UNDEFINE_NVRAM | libvirt.VIR_DOMAIN_UNDEFINE_SNAPSHOTS_METADATA)
            except libvirt.libvirtError:
                # Domain might not exist, continue with cleanup
                pass
                
            # Delete VM directory and files
            vm_path = os.path.join(self.vm_dir, vm_id)
            if os.path.exists(vm_path):
                shutil.rmtree(vm_path)
                
            print(f"VM {vm_id} deleted successfully")
            return True
        except Exception as e:
            print(f"Error deleting VM {vm_id}: {str(e)}")
            return False