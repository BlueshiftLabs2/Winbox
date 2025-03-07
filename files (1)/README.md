- File uploads are restricted to ISO files, but additional validation should be implemented in a production environment
- The application should be deployed behind a secure HTTPS connection
- Use proper authentication and authorization for user access
- Regular security audits are recommended

## PowerShell Command Security

This application executes PowerShell commands to interact with Hyper-V. To ensure security:

1. All user inputs are sanitized before being used in PowerShell commands
2. The application uses proper parameter binding when constructing commands
3. Error handling captures and logs any execution issues

## VM Creation Process

The application follows this workflow when creating a new VM:

1. User uploads or selects an ISO file
2. User configures VM settings (name, vCPU count, vGPU option)
3. System creates a new VM using Hyper-V commands
4. Optional vGPU driver is installed if selected
5. User can power on the VM
6. User connects to the VM via NoVNC

## vGPU Driver Installation

When a user creates a VM with vGPU support:

1. The application downloads the appropriate driver package
2. The driver is transferred to the VM using PowerShell commands
3. The driver installation is executed inside the VM
4. The VM is configured to use the vGPU

## Troubleshooting

### NoVNC Connection Issues

If you experience problems connecting via NoVNC:

1. Check that websockify is running: `ps aux | grep websockify`
2. Ensure the VM is powered on
3. Check firewall settings for the NoVNC port (usually 6080)
4. Verify that Hyper-V Integration Services are enabled in the VM

### PowerShell Execution Policy

If PowerShell commands fail:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser