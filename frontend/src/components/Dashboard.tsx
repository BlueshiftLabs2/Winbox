import React, { useEffect, useState } from 'react';
import { VirtualMachine } from '../types/types';
import { vmService } from '../services/api';
import VmCard from './VmCard';
import CreateVmModal from './CreateVmModal';
import { Button, Container, Typography, Box, Grid, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const Dashboard: React.FC = () => {
  const [vms, setVms] = useState<VirtualMachine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchVMs = async () => {
    try {
      setIsLoading(true);
      const vmList = await vmService.listVMs();
      setVms(vmList);
      setError(null);
    } catch (err) {
      setError('Failed to load virtual machines');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVMs();
    // Set up polling for VM status updates
    const interval = setInterval(fetchVMs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateVM = () => {
    if (vms.length >= 3) {
      setError('Maximum VM limit reached (3)');
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const handleVMCreated = (newVM: VirtualMachine) => {
    setVms([...vms, newVM]);
    setIsCreateModalOpen(false);
  };

  const handleStartVM = async (id: string) => {
    try {
      const updatedVM = await vmService.startVM(id);
      setVms(vms.map(vm => vm.id === id ? updatedVM : vm));
    } catch (err) {
      setError('Failed to start VM');
      console.error(err);
    }
  };

  const handleStopVM = async (id: string) => {
    try {
      const updatedVM = await vmService.stopVM(id);
      setVms(vms.map(vm => vm.id === id ? updatedVM : vm));
    } catch (err) {
      setError('Failed to stop VM');
      console.error(err);
    }
  };

  const handleDeleteVM = async (id: string) => {
    try {
      await vmService.deleteVM(id);
      setVms(vms.filter(vm => vm.id !== id));
    } catch (err) {
      setError('Failed to delete VM');
      console.error(err);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" my={4}>
        <Typography variant="h4" component="h1">Your Virtual Machines</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateVM}
          disabled={vms.length >= 3}
        >
          Create VM
        </Button>
      </Box>
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      {isLoading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : vms.length === 0 ? (
        <Box textAlign="center" my={8}>
          <Typography variant="h6" color="textSecondary">
            You don't have any VMs yet. Create your first one!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {vms.map(vm => (
            <Grid item xs={12} md={6} lg={4} key={vm.id}>
              <VmCard 
                vm={vm}
                onStart={() => handleStartVM(vm.id)}
                onStop={() => handleStopVM(vm.id)}
                onDelete={() => handleDeleteVM(vm.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}
      
      <CreateVmModal 
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onVMCreated={handleVMCreated}
      />
    </Container>
  );
};

export default Dashboard;