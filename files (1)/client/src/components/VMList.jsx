import React from 'react';
import { Link } from 'react-router-dom';
import { powerOnVM, powerOffVM } from '../services/apiService';
import { toast } from 'react-toastify';

function VMList({ vms, loading, refreshVMs }) {
  const handlePowerToggle = async (vm) => {
    try {
      if (vm.status === 'running' || vm.status === 'running') {
        await powerOffVM(vm.id);
        toast.info(`Powering off ${vm.name}...`);
      } else {
        await powerOnVM(vm.id);
        toast.info(`Powering on ${vm.name}...`);
      }
      refreshVMs();
    } catch (error) {
      toast.error(`Error changing power state: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'running': return 'text-green-500';
      case 'off': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="loader"></div></div>;
  }

  if (vms.length === 0) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">No VMs Found</h2>
        <p className="mb-4">You haven't created any virtual machines yet.</p>
        <Link to="/vms/create" className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded transition">
          Create Your First VM
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Virtual Machines</h2>
        <Link to="/vms/create" className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded transition">
          Create New VM
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vms.map(vm => (
          <div key={vm.id} className="border rounded-lg shadow-md hover:shadow-lg transition">
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold">{vm.name}</h3>
                <span className={`font-medium ${getStatusColor(vm.status)}`}>
                  {vm.status}
                </span>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <p>vCPUs: {vm.vcpus}</p>
                {vm.vgpu !== 'none' && <p>vGPU: {vm.vgpu}</p>}
                {vm.ipAddress && <p>IP: {vm.ipAddress}</p>}
              </div>
              
              <div className="flex space-x-2">
                <Link 
                  to={`/vms/${vm.id}`}
                  className="bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition flex-1 text-center"
                >
                  Manage
                </Link>
                <button
                  onClick={() => handlePowerToggle(vm)}
                  className={`py-1 px-3 rounded text-sm text-white flex-1 ${
                    vm.status === 'running' 
                      ? 'bg-red-500 hover:bg-red-700' 
                      : 'bg-green-500 hover:bg-green-700'
                  }`}
                >
                  {vm.status === 'running' ? 'Power Off' : 'Power On'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VMList;