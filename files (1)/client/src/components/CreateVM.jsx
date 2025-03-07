      <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 mb-8">
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-medium text-blue-800">The VM will be connected using novnc.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* VM Name */}
          <div>
            <label htmlFor="vmName" className="block text-sm font-medium text-gray-700 mb-1">VM Name</label>
            <input 
              type="text" 
              id="vmName" 
              value={vmName} 
              onChange={(e) => setVmName(e.target.value)} 
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Enter a name for your VM"
              required 
            />
          </div>

          {/* CPU Count */}
          <div>
            <label htmlFor="cpuCount" className="block text-sm font-medium text-gray-700 mb-1">
              vCPU Count ({vcpuCount})
            </label>
            <input 
              type="range" 
              id="cpuCount" 
              value={vcpuCount} 
              onChange={(e) => setVcpuCount(parseInt(e.target.value))} 
              min="2" 
              max="16" 
              step="1" 
              className="w-full" 
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>2</span>
              <span>16</span>
            </div>
          </div>

          {/* ISO Selection */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="isoFile" className="block text-sm font-medium text-gray-700">
                ISO Image
              </label>
              <button 
                type="button"
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showUploadForm ? 'Cancel Upload' : 'Upload New ISO'}
              </button>
            </div>

            {showUploadForm ? (
              <div className="mb-4 p-4 border rounded-md bg-gray-50">
                <div className="mb-3">
                  <input 
                    type="file" 
                    id="isoUpload" 
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                    accept=".iso"
                  />
                </div>

                {isUploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={handleIsoUpload}
                  disabled={isUploading || !uploadFile}
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
                >
                  {isUploading ? 'Uploading...' : 'Upload ISO'}
                </button>
              </div>
            ) : (
              <select 
                id="isoFile" 
                value={selectedIso} 
                onChange={(e) => setSelectedIso(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select an ISO image</option>
                {isoList.map(iso => (
                  <option key={iso} value={iso}>{iso}</option>
                ))}
              </select>
            )}
          </div>

          {/* vGPU Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">vGPU Option</label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input 
                  type="radio" 
                  id="vgpu-none" 
                  name="vgpuOption" 
                  value="none" 
                  checked={vgpuOption === 'none'} 
                  onChange={() => setVgpuOption('none')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500" 
                />
                <label htmlFor="vgpu-none" className="ml-2 block text-sm text-gray-700">
                  No vGPU
                </label>
              </div>

              <div className="flex items-center">
                <input 
                  type="radio" 
                  id="vgpu-nvidia" 
                  name="vgpuOption" 
                  value="nvidia" 
                  checked={vgpuOption === 'nvidia'} 
                  onChange={() => setVgpuOption('nvidia')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500" 
                />
                <label htmlFor="vgpu-nvidia" className="ml-2 block text-sm text-gray-700">
                  NVIDIA vGPU
                </label>
              </div>

              <div className="flex items-center">
                <input 
                  type="radio" 
                  id="vgpu-amd" 
                  name="vgpuOption" 
                  value="amd" 
                  checked={vgpuOption === 'amd'} 
                  onChange={() => setVgpuOption('amd')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500" 
                />
                <label htmlFor="vgpu-amd" className="ml-2 block text-sm text-gray-700">
                  AMD vGPU
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isCreating}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
            >
              {isCreating ? 'Creating VM...' : 'Create Virtual Machine'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CreateVM;