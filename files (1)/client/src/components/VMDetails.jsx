                  </div>
                  <div>
                    <span className="text-gray-600 block text-sm">Status</span>
                    <span className={`font-medium ${getStatusColor(vm.status)}`}>{vm.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-sm">VM ID</span>
                    <span className="font-mono text-sm">{vm.id}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 block text-sm">vGPU</span>
                    <span className="font-medium">{vm.vgpu !== 'none' ? vm.vgpu : 'Not configured'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-sm">ISO Image</span>
                    <span className="font-medium">{vm.iso}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-sm">IP Address</span>
                    <span className="font-medium">{vm.ipAddress || 'Not available'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 mb-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium text-blue-800">The VM will be connected using novnc.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handlePowerToggle}
              disabled={isChangingPower}
              className={`flex-1 py-3 px-4 rounded-md font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition ${
                vm.status === 'running' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isChangingPower 
                ? 'Processing...' 
                : vm.status === 'running' 
                  ? 'Power Off' 
                  : 'Power On'
              }
            </button>
            
            <button
              onClick={handleConnect}
              disabled={vm.status !== 'running' || isConnecting}
              className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isConnecting ? 'Connecting...' : 'Connect to VM'}
            </button>
            
            {vm.vgpu !== 'none' && (
              <button
                onClick={handleInstallVGPUDriver}
                disabled={vm.status !== 'running' || isInstallingDriver}
                className="flex-1 py-3 px-4 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isInstallingDriver ? 'Installing...' : 'Install vGPU Driver'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* RDP Connection Option */}
      {vm.ipAddress && (
        <div className="bg-gray-50 border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3">Alternative Connection Method</h3>
          <p className="mb-3">You can also connect to this VM using Remote Desktop Protocol (RDP):</p>
          <div className="bg-gray-100 p-4 rounded-md font-mono text-sm mb-4">
            {`Computer: ${vm.ipAddress}`}
          </div>
          <div className="text-sm text-gray-600">
            Use the same credentials as shown in the noVNC console.
          </div>
        </div>
      )}
    </div>
  );
}

export default VMDetails;