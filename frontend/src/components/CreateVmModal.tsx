import React, { useState } from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, DialogTitle, 
  TextField, FormControl, InputLabel, Select, MenuItem, 
  FormControlLabel, Switch, Typography, Box, CircularProgress,
  Slider, Alert
} from '@mui/material';
import { VMCreationParams, VirtualMachine } from '../types/types';
import { vmService } from '../services/api';

interface CreateVmModalProps {
  open: boolean;
  onClose: () => void;
  onVMCreated: (vm: VirtualMachine) => void;
}

const CreateVmModal: React.FC<CreateVmModalProps> = ({ open, onClose, onVMCreated }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cpuCount, setCpuCount] = useState(6);
  const [gpuEnabled, setGpuEnabled] = useState(false);
  const [osType, setOsType] = useState<'windows11' | 'custom'>('windows11');
  const [customIso, setCustomIso] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);
    
    try {
      // Validate inputs
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        setIsCreating(false);
        return;
      }
      
      let customIsoId = undefined;
      
      // Upload custom ISO if selected
      if (osType === 'custom' && customIso) {
        setIsUploading(true);
        try {
          const result = await vmService.uploadIso(customIso);
          customIsoId = result.id;
        } catch (err) {
          setError('Failed to upload ISO file');
          setIsCreating(false);
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }
      
      // Create VM with parameters
      const vmParams: VMCreationParams = {
        name,
        username,
        password,
        cpuCount,
        gpuEnabled,
        osType,
        customIsoId
      };
      
      const newVM = await vmService.createVM(vmParams);
      onVMCreated(newVM);
      handleReset();
    } catch (err) {
      console.error(err);
      setError('Failed to create VM');
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    setName('');
    setUsername('');
    setPassword('');
    setCpuCount(6);
    setGpuEnabled(false);
    setOsType('windows11');
    setCustomIso(null);
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create a New Virtual Machine</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TextField
            autoFocus
            margin="dense"
            label="VM Name"
            type="text"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isCreating}
            sx={{ mb: 2 }}
          />
          
          <Box display="flex" gap={2} sx={{ mb: 2 }}>
            <TextField
              margin="dense"
              label="Username"
              type="text"
              fullWidth
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isCreating}
            />
            
            <TextField
              margin="dense"
              label="Password (8+ characters)"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={password.length > 0 && password.length < 8}
              helperText={password.length > 0 && password.length < 8 ? "Password must be at least 8 characters" : ""}
              disabled={isCreating}
            />
          </Box>
          
          <Typography gutterBottom>
            CPU Cores: {cpuCount}
          </Typography>
          <Slider
            value={cpuCount}
            onChange={(_, newValue) => setCpuCount(newValue as number)}
            step={2}
            marks
            min={6}
            max={24}
            valueLabelDisplay="auto"
            disabled={isCreating}
            sx={{ mb: 3 }}
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={gpuEnabled} 
                onChange={(e) => setGpuEnabled(e.target.checked)}
                disabled={isCreating}
              />
            }
            label="Enable NVIDIA GPU"
            sx={{ mb: 2, display: 'block' }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Operating System</InputLabel>
            <Select
              value={osType}
              label="Operating System"
              onChange={(e) => setOsType(e.target.value as 'windows11' | 'custom')}
              disabled={isCreating}
            >
              <MenuItem value="windows11">Pre-installed Windows 11</MenuItem>
              <MenuItem value="custom">Upload Custom ISO</MenuItem>
            </Select>
          </FormControl>
          
          {osType === 'custom' && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                component="label"
                disabled={isCreating || isUploading}
              >
                {isUploading ? <CircularProgress size={24} /> : "Select ISO File"}
                <input
                  type="file"
                  accept=".iso"
                  hidden
                  onChange={(e) => e.target.files && setCustomIso(e.target.files[0])}
                />
              </Button>
              {customIso && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected file: {customIso.name}
                </Typography>
              )}
            </Box>
          )}
          
          <Typography variant="body2" color="textSecondary">
            All VMs include 32GB of RAM and 280GB of storage.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={isCreating || (osType === 'custom' && !customIso)}
          >
            {isCreating ? <CircularProgress size={24} /> : "Create VM"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateVmModal;