
/**
 * Service to execute and manage commands
 * NOTE: In a web environment, you would need a backend service to actually execute commands
 */

import { detectOS, formatCommand } from '../utils/platformUtils';

export interface CommandResult {
  output: string;
  success: boolean;
  command: string;
}

export class CommandService {
  private os: 'windows' | 'linux' | 'mac' | 'unknown';
  
  constructor() {
    this.os = detectOS();
  }

  // Execute a command (simulated in browser context)
  public async executeCommand(command: string): Promise<CommandResult> {
    // Format command for the current OS
    const formattedCommand = formatCommand(command, this.os);
    
    console.log(`Would execute on ${this.os}: ${formattedCommand}`);
    
    // In a browser context, we'll simulate this.
    // In a real app with a backend, we would call the backend to execute this command.
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate success for common commands
        if (command.match(/^(ls|dir|cd|echo|cat|type)/i)) {
          resolve({
            output: `Simulated output for: ${formattedCommand}\nSuccess!`,
            success: true,
            command: formattedCommand
          });
        } else if (command.match(/^ollama run/i)) {
          resolve({
            output: "Running Ollama model...\nModel loaded successfully.\nReady for queries.",
            success: true,
            command: formattedCommand
          });
        } else if (command.match(/^ollama pull/i)) {
          resolve({
            output: "Pulling model...\nDownload 100% complete\nModel downloaded and ready to use",
            success: true,
            command: formattedCommand
          });
        } else if (command.match(/^npm|yarn|pnpm/i)) {
          resolve({
            output: "Installing packages...\nDone in 3.45s",
            success: true,
            command: formattedCommand
          });
        } else if (command.match(/^git/i)) {
          resolve({
            output: "Simulated git operation completed successfully",
            success: true,
            command: formattedCommand
          });
        } else {
          resolve({
            output: `Command not recognized or cannot be executed in browser environment.\nIn a real application, this would be sent to a backend service.`,
            success: false,
            command: formattedCommand
          });
        }
      }, 1000);
    });
  }

  // Parse AI response to extract executable commands
  public parseCommandsFromAI(response: string): string[] {
    // Look for commands in code blocks or after command prompts
    const codeBlockRegex = /```(?:bash|sh|cmd|powershell)?\s*([\s\S]*?)```/g;
    const commandPromptRegex = /\$\s+(.+)|\>\s+(.+)/g;
    
    const commands: string[] = [];
    
    // Extract from code blocks
    let match;
    while ((match = codeBlockRegex.exec(response)) !== null) {
      const codeBlock = match[1];
      // Split by lines and filter out comments and empty lines
      const lines = codeBlock
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && !line.startsWith('//'));
      
      commands.push(...lines);
    }
    
    // Extract from command prompts
    while ((match = commandPromptRegex.exec(response)) !== null) {
      const command = match[1] || match[2];
      if (command) {
        commands.push(command.trim());
      }
    }
    
    return commands;
  }
}

export default new CommandService();
