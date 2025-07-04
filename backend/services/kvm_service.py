import os
import uuid
import json
import time
from typing import Tuple
import subprocess
import threading
import libvirt

class KVMService:
    def __init__(self):
        self.token_dir = os.path.join(os.getcwd(), "kvm_tokens")
        self.websockify_port = 6080
        self.websockify_host = "localhost"
        
        # Create token directory if it doesn't exist
        os.makedirs(self.token_dir, exist_ok=True)
        
        # Init token file
        self.token_file_path = os.path.join(self.token_dir, "tokens.json")
        if not os.path.exists(self.token_file_path):
            with open(self.token_file_path, "w") as f:
                json.dump({}, f)
        
        # Start websockify process for VNC connections
        self._start_websockify()
        
        # Connect to libvirt
        self.conn = libvirt.open('qemu:///system')
        if not self.conn:
            raise Exception('Failed to connect to QEMU/KVM')
    
    def _start_websockify(self):
        """Start websockify process to proxy VNC connections"""
        def run_websockify():
            subprocess.run([
                "websockify",
                f"{self.websockify_port}",
                "--token-plugin=TokenFile",
                f"--token-source={self.token_file_path}",
                "--web=/usr/share/novnc/"  # Path to NoVNC files
            ])
        
        # Run websockify in a separate thread
        websockify_thread = threading.Thread(target=run_websockify, daemon=True)
        websockify_thread.start()
    
    def get_vm_console(self, vm_id: str) -> Tuple[str, str]:
        """Get VM console WebSocket URL and token"""
        try:
            # Get VNC connection details from libvirt
            domain_name = f"winbox-{vm_id}"
            domain = self.conn.lookupByName(domain_name)
            
            if not domain.isActive():
                raise Exception("VM is not running")
            
            # Get VNC port
            xml_desc = domain.XMLDesc(0)
            import xml.etree.ElementTree as ET
            root = ET.fromstring(xml_desc)
            graphics = root.findall("./devices/graphics[@type='vnc']")[0]
            vnc_port = int(graphics.get("port"))
            
            # Create a new access token
            access_token = str(uuid.uuid4())
            
            # Update tokens file
            with open(self.token_file_path, "r") as f:
                tokens = json.load(f)
            
            # Add new token with VM's VNC port
            tokens[access_token] = f"localhost:{vnc_port}"
            
            with open(self.token_file_path, "w") as f:
                json.dump(tokens, f)
            
            # Return WebSocket URL and token
            ws_url = f"ws://{self.websockify_host}:{self.websockify_port}/websockify"
            
            return ws_url, access_token
            
        except Exception as e:
            raise Exception(f"Failed to get VM console: {str(e)}")
    
    def cleanup_tokens(self):
        """Clean up expired console tokens"""
        # This would remove old tokens after some time
        # For a production system, you'd want to implement token expiration
        pass