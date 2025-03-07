import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/Navbar';
import VMList from './components/VMList';
import CreateVM from './components/CreateVM';
import VMDetails from './components/VMDetails';

// API Service
import { getAllVMs } from './services/apiService';

function App() {
  const [vms, setVMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to refresh VM list
  const refreshVMs = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    const fetchVMs = async () => {
      try {
        const fetchedVMs = await getAllVMs();
        setVMs(fetchedVMs);
      } catch (error) {
        toast.error(`Error fetching VMs: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchVMs();
    
    // Set up polling for VM status updates
    const interval = setInterval(fetchVMs, 10000);
    
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/vms" />} />
            <Route
              path="/vms"
              element={<VMList vms={vms} loading={loading} refreshVMs={refreshVMs} />}
            />
            <Route
              path="/vms/create"
              element={<CreateVM refreshVMs={refreshVMs} />}
            />
            <Route
              path="/vms/:id"
              element={<VMDetails refreshVMs={refreshVMs} />}
            />
          </Routes>
        </main>
        <ToastContainer position="bottom-right" />
      </div>
    </Router>
  );
}

export default App;