
/**
 * Utility functions for platform detection and system operations
 */

// Detect the current operating system
export const detectOS = (): 'windows' | 'linux' | 'mac' | 'unknown' => {
  const userAgent = window.navigator.userAgent;
  
  if (userAgent.indexOf('Win') !== -1) return 'windows';
  if (userAgent.indexOf('Linux') !== -1) return 'linux';
  if (userAgent.indexOf('Mac') !== -1) return 'mac';
  
  return 'unknown';
};

// Get platform-specific installation instructions
export const getOllamaInstallInstructions = (): { [key: string]: string } => {
  return {
    windows: `
# Install Ollama on Windows
1. Download the latest Windows installer from https://ollama.com/download/windows
2. Run the installer and follow the instructions
3. Open Command Prompt and run: ollama run qwen2.5-coder:14b
    `,
    linux: `
# Install Ollama on Linux
curl -fsSL https://ollama.com/install.sh | sh
ollama run qwen2.5-coder:14b
    `,
    mac: `
# Install Ollama on macOS
curl -fsSL https://ollama.com/install.sh | sh
ollama run qwen2.5-coder:14b
    `,
    unknown: 'Please visit https://ollama.com/download for installation instructions.'
  };
};

// Check if Nvidia GPU is available
export const checkForNvidiaGPU = async (): Promise<boolean> => {
  // This is a simplified check that won't actually work in browser
  // In a real application, you would need to use a backend service to check
  // For now, we'll just detect if WebGL is using NVIDIA renderer
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        return renderer.toLowerCase().includes('nvidia');
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking for NVIDIA GPU:', error);
    return false;
  }
};

// Format command for current OS
export const formatCommand = (command: string, os: 'windows' | 'linux' | 'mac' | 'unknown'): string => {
  if (os === 'windows') {
    // Convert Unix-style commands to Windows Command Prompt style
    return command
      .replace(/\//g, '\\')
      .replace(/^rm -rf/, 'rmdir /s /q')
      .replace(/^rm/, 'del')
      .replace(/^mkdir -p/, 'mkdir')
      .replace(/^cp/, 'copy')
      .replace(/^mv/, 'move');
  }
  
  return command;
};

// Get SSH command for port forwarding
export const getSSHPortForwardingCommand = (host: string, username: string = 'user', localPort: number = 11434, remotePort: number = 11434): string => {
  return `ssh -L ${localPort}:localhost:${remotePort} ${username}@${host}`;
};

// Parse SSH connection string
export const parseSSHConnectionString = (sshString: string): { username: string, host: string, port?: number } => {
  // Format: [user@]host[:port]
  const regex = /^(?:([^@]+)@)?([^:]+)(?::(\d+))?$/;
  const match = sshString.match(regex);
  
  if (!match) {
    return { username: 'user', host: sshString };
  }
  
  return {
    username: match[1] || 'user',
    host: match[2],
    port: match[3] ? parseInt(match[3], 10) : undefined
  };
};

// Generate path for current OS
export const formatPath = (path: string, os: 'windows' | 'linux' | 'mac' | 'unknown'): string => {
  if (os === 'windows') {
    // Convert Unix-style paths to Windows style
    return path.replace(/\//g, '\\');
  }
  
  // Convert Windows-style paths to Unix style
  return path.replace(/\\/g, '/');
};
