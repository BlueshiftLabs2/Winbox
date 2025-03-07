const { exec } = require('child_process');
const { promisify } = require('util');

// Sanitize input values to prevent command injection
const sanitizeValue = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  
  // Replace potentially dangerous characters
  return value.replace(/[&|;$<>(){}[\]\\\/\`'"]/g, '_');
};

// Execute PowerShell command safely
const execPowershell = async (command, params = {}) => {
  const execAsync = promisify(exec);
  
  // Replace parameters in the command with sanitized values
  let safeCommand = command;
  for (const [key, value] of Object.entries(params)) {
    const sanitizedValue = sanitizeValue(value);
    // Use regex to replace placeholders with sanitized values
    const placeholder = new RegExp(`\\$\\{${key}\\}`, 'g');
    safeCommand = safeCommand.replace(placeholder, sanitizedValue);
  }
  
  try {
    const { stdout, stderr } = await execAsync(`powershell -Command "${safeCommand.replace(/"/g, '\\"')}"`);
    if (stderr) {
      console.error(`PowerShell stderr: ${stderr}`);
    }
    return stdout.trim();
  } catch (error) {
    console.error(`PowerShell execution error: ${error}`);
    throw error;
  }
};

module.exports = {
  execPowershell,
  sanitizeValue
};