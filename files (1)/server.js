  if (!fs.existsSync(ISO_DIRECTORY)) {
    fs.mkdirSync(ISO_DIRECTORY, { recursive: true });
  }
  if (!fs.existsSync(VM_STORAGE_DIRECTORY)) {
    fs.mkdirSync(VM_STORAGE_DIRECTORY, { recursive: true });
  }
} catch (error) {
  console.error('Error creating directories:', error);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, ISO_DIRECTORY);
  },
  filename: function (req, file, cb) {
    // Sanitize filename to prevent security issues
    const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const uniqueName = `${Date.now()}-${sanitizedName}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Only allow ISO files
    if (file.mimetype !== 'application/octet-stream' && !file.originalname.toLowerCase().endsWith('.iso')) {
      return cb(new Error('Only ISO files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 8 * 1024 * 1024 * 1024 // 8GB limit
  }
});

// API Endpoints

// List all available ISOs
app.get('/api/isos', async (req, res, next) => {
  try {
    const files = await fs.promises.readdir(ISO_DIRECTORY);
    const isoFiles = files.filter(file => file.toLowerCase().endsWith('.iso'));
    res.json({ isos: isoFiles });
  } catch (error) {
    next(error);
  }
});

// Upload ISO file
app.post('/api/isos', upload.single('iso'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({ 
      filename: req.file.filename,
      originalname: req.file.originalname,
      success: true 
    });
  } catch (error) {
    next(error);
  }
});

// Create a new VM
app.post('/api/vms', async (req, res, next) => {
  try {
    const vmData = await vmService.createVM(req.body);
    res.json(vmData);
  } catch (error) {
    next(error);
  }
});

// Get all VMs
app.get('/api/vms', async (req, res, next) => {
  try {
    const vms = await vmService.getAllVMs();
    res.json(vms);
  } catch (error) {
    next(error);
  }
});

// Get VM details
app.get('/api/vms/:id', async (req, res, next) => {
  try {
    const vm = await vmService.getVMById(req.params.id);
    res.json(vm);
  } catch (error) {
    next(error);
  }
});

// Change VM power state
app.put('/api/vms/:id/power', async (req, res, next) => {
  try {
    const result = await vmService.changeVMPowerState(req.params.id, req.body.state);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Connect to VM via NoVNC
app.get('/api/vms/:id/connect', async (req, res, next) => {
  try {
    const vm = await vmService.getVMById(req.params.id);
    
    // Check if VM is running
    if (vm.status !== 'running') {
      return res.status(400).json({ error: 'VM must be running to connect' });
    }
    
    // Start NoVNC proxy if not already running
    let connection = novncService.getConnection(vm.name);
    if (!connection) {
      connection = await novncService.startProxy(vm.name, vm.id);
    }
    
    res.json({ url: connection.url });
  } catch (error) {
    next(error);
  }
});

// Install vGPU driver in VM
app.post('/api/vms/:id/install-vgpu', async (req, res, next) => {
  try {
    const vm = await vmService.getVMById(req.params.id);
    const { driverType } = req.body;
    
    // Check if VM is running
    if (vm.status !== 'running') {
      return res.status(400).json({ error: 'VM must be running to install vGPU driver' });
    }
    
    // Download vGPU driver
    const driverUrl = 'https://griddownloads.nvidia.com/ems/sec/vGPU18.0/NVIDIA-GRID-Windows_Server_Host-572.60-570.124.06-572.60.zip?autho=st=1741145679~exp=1741149279~acl=/ems/sec/vGPU18.0/NVIDIA-GRID-Windows_Server_Host-572.60-570.124.06-572.60.zip~hmac=b4d9dd14c775a4244b0dad9ea05f66a59bce3ea3a1cd8072794eab6548ab520f';
    const downloadPath = path.join(VM_STORAGE_DIRECTORY, 'temp', `${vm.name}-driver.zip`);
    const extractPath = path.join(VM_STORAGE_DIRECTORY, 'temp', `${vm.name}-driver`);
    
    // Create temp directory if it doesn't exist
    await fs.promises.mkdir(path.join(VM_STORAGE_DIRECTORY, 'temp'), { recursive: true });
    
    // Download the driver
    const response = await axios({
      method: 'GET',
      url: driverUrl,
      responseType: 'stream'
    });
    
    // Create write stream
    const writer = fs.createWriteStream(downloadPath);
    response.data.pipe(writer);
    
    // Wait for download to finish
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    // Extract the driver
    await extractZip(downloadPath, { dir: extractPath });
    
    // Copy the driver to the VM
    await execPowershell(`
      Copy-VMFile -VMName "${vm.name}" -SourcePath "${extractPath}" -DestinationPath "C:\\Drivers" -CreateFullPath -FileSource Host
    `, { name: vm.name, extractPath });
    
    // Install the driver inside the VM
    await execPowershell(`
      Invoke-Command -VMName "${vm.name}" -ScriptBlock {
        Start-Process -FilePath "C:\\Drivers\\setup.exe" -ArgumentList "/s", "/norestart" -Wait
      }
    `, { name: vm.name });
    
    res.json({ success: true, message: 'vGPU driver installation started' });
  } catch (error) {
    next(error);
  }
});

// Use error handling middleware
app.use(errorHandler);

// Serve React frontend for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Close all NoVNC connections
  for (const [vmName] of novncService.connections.entries()) {
    novncService.terminateConnection(vmName);
  }
  
  server.close(() => {
    console.log('Server shutdown complete');
  });
});