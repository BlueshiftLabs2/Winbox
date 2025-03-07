const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { execPowershell } = require('../utils/powershellExecutor');

const VM_STORAGE_DIRECTORY = '/hyperv/vms/';
const NETWORK_SWITCH_NAME = 'Default Switch';

class VMService {
  constructor() {
    this.vms = new Map();
  }
  
  async createVM(vmConfig) {
    const { name, vcpus, vgpu, iso } = vmConfig;
    
    // Validate inputs
    if (!name || !vcpus || !iso) {
      throw new Error('Missing required parameters');
    }
    
    if (this.vms.has(name)) {
      throw new Error('VM with this name already exists');
    }
    
    // Generate unique ID for the VM
    const vmId = uuidv4();
    
    // Create VM storage directory
    const vmDir = path.join(VM_STORAGE_DIRECTORY, name);
    await fs.mkdir(vmDir, { recursive: true });
    
    // Create VM with PowerShell
    const vhdPath = path.join(vmDir, `${name}.vhdx`);
    const isoPath = path.join('/hyperv/isos/', iso);
    
    // Create VM
    await execPowershell(`
      New-VM -Name "${name}" -MemoryStartupBytes 4GB -NewVHDPath "${vhdPath}" -NewVHDSizeBytes 80GB -Generation 2 -SwitchName "${NETWORK_SWITCH_NAME}"
    `, { name, vhdPath, switchName: NETWORK_SWITCH_NAME });
    
    // Set CPU count
    await execPowershell(`Set-VMProcessor -VMName "${name}" -Count ${vcpus}`, {
      name, vcpus
    });
    
    // Mount ISO
    await execPowershell(`Add-VMDvdDrive -VMName "${name}" -Path "${isoPath}"`, {
      name, isoPath
    });
    
    // Add vGPU if requested
    if (vgpu && vgpu !== 'none') {
      if (vgpu === 'nvidia') {
        await execPowershell(`
          Add-VMGpuPartitionAdapter -VMName "${name}"
          Set-VMGpuPartitionAdapter -VMName "${name}" -OptimalPartitionCount 1
        `, { name });
      } else if (vgpu === 'amd') {
        // AMD GPU partitioning commands would go here
        console.log('AMD vGPU selected, but implementation not provided');
      }
    }
    
    // Save VM data
    const vmData = {
      id: vmId,
      name,
      status: 'created',
      vcpus,
      vgpu: vgpu || 'none',
      iso,
      ipAddress: null,
      createdAt: new Date().toISOString()
    };
    
    this.vms.set(name, vmData);
    return vmData;
  }
  
  async getAllVMs() {
    try {
      // Get actual VM statuses from Hyper-V
      const vmList = await execPowershell('Get-VM | Select-Object Name,State | ConvertTo-Json');
      const hypervVMs = JSON.parse(vmList);
      
      // Update our VM records with current state
      const vmArray = Array.from(this.vms.values());
      
      // If we got a single VM back (not in an array)
      const hypervVMArray = Array.isArray(hypervVMs) ? hypervVMs : [hypervVMs];
      
      for (const vm of vmArray) {
        const hypervVM = hypervVMArray.find(h => h.Name === vm.name);
        if (hypervVM) {
          vm.status = hypervVM.State.toLowerCase();
        }
      }
      
      return vmArray;
    } catch (error) {
      console.error('Error getting VMs:', error);
      throw error;
    }
  }
  
  async getVMById(id) {
    // Find the VM by ID
    let foundVM = null;
    for (const vm of this.vms.values()) {
      if (vm.id === id) {
        foundVM = { ...vm };
        break;
      }
    }
    
    if (!foundVM) {
      throw new Error('VM not found');
    }
    
    // Get current VM state from Hyper-V
    try {
      const vmStatus = await execPowershell(`Get-VM -Name "${foundVM.name}" | Select-Object State | ConvertTo-Json`, {
        name: foundVM.name
      });
      const status = JSON.parse(vmStatus);
      foundVM.status = status.State.toLowerCase();
      
      // If VM is running, try to get its IP address
      if (foundVM.status === 'running' && !foundVM.ipAddress) {
        try {
          const ipAddress = await execPowershell(`
            Invoke-Command -VMName "${foundVM.name}" -ScriptBlock { 
              (Get-NetIPAddress -InterfaceAlias Ethernet -AddressFamily IPv4).IPAddress 
            } -ErrorAction SilentlyContinue
          `, { name: foundVM.name });
          
          if (ipAddress && ipAddress.trim()) {
            foundVM.ipAddress = ipAddress.trim();
            // Update the stored VM data
            const storedVM = this.vms.get(foundVM.name);
            if (storedVM) {
              storedVM.ipAddress = ipAddress.trim();
            }
          }
        } catch (error) {
          console.warn(`Failed to get IP address for VM ${foundVM.name}:`, error.message);
        }
      }
      
      return foundVM;
    } catch (error) {
      console.error(`Error getting VM ${foundVM.name} status:`, error);
      return foundVM; // Return VM with potentially stale status
    }
  }
  
  async changeVMPowerState(id, state) {
    // Find the VM by ID
    let foundVM = null;
    let vmName = null;
    
    for (const [name, vm] of this.vms.entries()) {
      if (vm.id === id) {
        foundVM = vm;
        vmName = name;
        break;
      }
    }
    
    if (!foundVM) {
      throw new Error('VM not found');
    }
    
    // Validate state
    if (state !== 'on' && state !== 'off') {
      throw new Error('Invalid power state. Use "on" or "off".');
    }
    
    // Change power state
    if (state === 'on') {
      await execPowershell(`Start-VM -Name "${vmName}"`, { name: vmName });
      foundVM.status = 'running';
    } else {
      await execPowershell(`Stop-VM -Name "${vmName}" -Force`, { name: vmName });
      foundVM.status = 'off';
    }
    
    return { status: foundVM.status };
  }
}

module.exports = new VMService();