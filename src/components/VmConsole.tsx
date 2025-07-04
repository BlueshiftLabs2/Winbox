import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { kvmService } from '../services/api';
import NoVNC from '@novnc/novnc';

interface VmConsoleProps {
  vmId: string;
}

const VmConsole: React.FC<VmConsoleProps> = ({ vmId }) => {
  const consoleRef = useRef<HTMLDivElement>(null);
  const vncClientRef = useRef<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    let connectionCleanup: (() => void) | null = null;

    const connectToConsole = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get console WebSocket URL from backend
        const { url, token } = await kvmService.getConsoleUrl(vmId);

        // Initialize NoVNC
        if (consoleRef.current) {
          // Initialize NoVNC client
          const { RFB } = NoVNC;
          const rfb = new RFB(consoleRef.current, url);
          
          rfb.addEventListener('connect', () => {
            console.log('Connected to VM console');
            setIsLoading(false);
          });
          
          rfb.addEventListener('disconnect', (e: any) => {
            console.log('Disconnected from VM console', e);
            setError('Disconnected from VM console');
          });
          
          rfb.addEventListener('credentialsrequired', () => {
            rfb.sendCredentials({ password: token });
          });

          vncClientRef.current = rfb;

          // Return cleanup function
          connectionCleanup = () => {
            if (rfb && !rfb._rfb_connection_state !== 'disconnected') {
              rfb.disconnect();
            }
          };
        }
      } catch (err) {
        console.error('Failed to connect to VM console', err);
        setError('Failed to connect to VM console');
        setIsLoading(false);
      }
    };

    connectToConsole();

    // Clean up VNC connection when component unmounts
    return () => {
      if (connectionCleanup) {
        connectionCleanup();
      }
    };
  }, [vmId]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Virtual Machine Console
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          minHeight: '500px',
          bgcolor: '#111'
        }}
      >
        {isLoading && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
            <Typography variant="body1" color="white" sx={{ ml: 2 }}>
              Connecting to VM console...
            </Typography>
          </Box>
        )}
        
        {error && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        
        <div 
          ref={consoleRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            visibility: isLoading ? 'hidden' : 'visible'
          }}
        />
      </Paper>
      
      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
        Click inside the console to interact. Press Ctrl+Alt to release mouse focus.
      </Typography>
    </Box>
  );
};

export default VmConsole;