import React, { useState } from 'react';
import { 
  Card, CardHeader, CardContent, CardActions, 
  Typography, Button, Box, Chip, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import ComputerIcon from '@mui/icons-material/Computer';
import DeleteIcon from '@mui/icons-material/Delete';
import LaptopIcon from '@mui/icons-material/Laptop';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import GpuIcon from '@mui/icons-material/Memory';
import { VirtualMachine } from '../types/types';
import VmConsole from './VmConsole';

interface VmCardProps {
  vm: VirtualMachine;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
}

const VmCard: React.FC<VmCardProps> = ({ vm, onStart, onStop, onDelete }) => {
  const [showConsole, setShowConsole] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getStatusColor = () => {
    switch (vm.status) {
      case 'running':
        return 'success';
      case 'stopped':
        return 'error';
      case 'creating':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardHeader
          avatar={<ComputerIcon />}
          title={vm.name}
          subheader={
            <Chip 
              size="small" 
              label={vm.status} 
              color={getStatusColor()} 
              sx={{ mt: 0.5 }} 
            />
          }
        />
        
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <MemoryIcon fontSize="small" color="action" />
              <Typography variant="body2">{vm.cpuCount} vCPUs</Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <LaptopIcon fontSize="small" color="action" />
              <Typography variant="body2">32GB RAM</Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <StorageIcon fontSize="small" color="action" />
              <Typography variant="body2">280GB Storage</Typography>
            </Box>
            
            {vm.gpuEnabled && (
              <Box display="flex" alignItems="center" gap={1}>
                <GpuIcon fontSize="small" color="action" />
                <Typography variant="body2">NVIDIA GPU Enabled</Typography>
              </Box>
            )}
            
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2">
                OS: {vm.osType === 'windows11' ? 'Windows 11' : 'Custom OS'}
              </Typography>
            </Box>
            
            {vm.ipAddress && (
              <Box>
                <Typography variant="body2">IP: {vm.ipAddress}</Typography>
                <Typography variant="body2">Username: {vm.username}</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
          <Box>
            {vm.status === 'stopped' ? (
              <Button 
                startIcon={<PlayArrowIcon />} 
                onClick={onStart} 
                variant="contained" 
                color="primary"
                size="small"
              >
                Start
              </Button>
            ) : vm.status === 'running' ? (
              <Button 
                startIcon={<StopIcon />} 
                onClick={onStop} 
                variant="outlined" 
                color="primary"
                size="small"
              >
                Stop
              </Button>
            ) : null}
          </Box>
          
          <Box>
            {vm.status === 'running' && (
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={() => setShowConsole(true)}
                size="small"
              >
                Open Console
              </Button>
            )}
            
            <IconButton 
              color="error" 
              onClick={() => setShowDeleteConfirm(true)}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </CardActions>
      </Card>
      
      {/* VM Console Dialog */}
      <Dialog 
        open={showConsole} 
        onClose={() => setShowConsole(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          {vm.name} Console
        </DialogTitle>
        <DialogContent dividers sx={{ height: '70vh', p: 0 }}>
          <VmConsole vmId={vm.id} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConsole(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>Delete Virtual Machine</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{vm.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default VmCard;