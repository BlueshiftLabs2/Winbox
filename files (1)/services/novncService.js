const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class NoVNCService {
  constructor() {
    this.connections = new Map();
    this.tokenFile = '/tmp/vnc-tokens.cfg';
    
    // Ensure token file exists
    try {
      if (!fs.existsSync(path.dirname(this.tokenFile))) {
        fs.mkdirSync(path.dirname(this.tokenFile), { recursive: true });
      }
      if (!fs.existsSync(this.tokenFile)) {
        fs.writeFileSync(this.tokenFile, '');
      }
    } catch (error) {
      console.error('Error initializing NoVNC token file:', error);
    }
  }
  
  async startProxy(vmName, vmId) {
    // Generate a unique port for this VM (between 6000-7000)
    const port = 6000 + Math.floor(Math.random() * 1000);
    const token = vmId || uuidv4();
    
    try {
      // Start websockify in the background
      const command = `websockify ${port} localhost:5900 --token-plugin=TokenFile --token-source=${this.tokenFile} &`;
      execSync(command);
      
      // Add the token to the token file
      fs.appendFileSync(this.tokenFile, `${token}: localhost:5900\n`);
      
      // Store connection information
      const connectionInfo = {
        port,
        url: `http://localhost:${port}/vnc.html?token=${token}`,
        token,
        timestamp: new Date().toISOString()
      };
      
      this.connections.set(vmName, connectionInfo);
      return connectionInfo;
    } catch (error) {
      console.error('Error starting NoVNC proxy:', error);
      throw new Error('Failed to start NoVNC proxy');
    }
  }
  
  getConnection(vmName) {
    return this.connections.get(vmName);
  }
  
  terminateConnection(vmName) {
    const connection = this.connections.get(vmName);
    if (!connection) return;
    
    try {
      // Find and kill the websockify process
      execSync(`pkill -f "websockify ${connection.port}"`);
      
      // Remove from connections map
      this.connections.delete(vmName);
      
      console.log(`Terminated NoVNC connection for ${vmName}`);
    } catch (error) {
      console.error(`Error terminating NoVNC connection for ${vmName}:`, error);
    }
  }
}

module.exports = new NoVNCService();