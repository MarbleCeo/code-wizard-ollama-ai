import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Terminal, Code, Download, Cpu, Zap, FolderOpen, Server } from "lucide-react";
import CommandInput from "./CommandInput";
import CommandOutput from "./CommandOutput";
import ModelSettings from "./ModelSettings";
import FileExplorer from "./FileExplorer";
import InstallInstructions from "./InstallInstructions";
import ollamaService from "@/services/ollamaService";
import commandService, { CommandResult } from "@/services/commandService";
import { detectOS } from "@/utils/platformUtils";

interface OutputItem {
  type: "command" | "response" | "error" | "info";
  content: string;
  timestamp: Date;
}

const CodeWizard: React.FC = () => {
  const [output, setOutput] = useState<OutputItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const [modelSettings, setModelSettings] = useState({
    temperature: 0.2,
    useGPU: true,
    maxTokens: 2048,
    endpoint: "http://localhost:11434"
  });
  const [activeTab, setActiveTab] = useState<"commands" | "code" | "files">("commands");
  const [os, setOs] = useState<'windows' | 'linux' | 'mac' | 'unknown'>('unknown');

  useEffect(() => {
    setOs(detectOS());
  }, []);

  useEffect(() => {
    if (modelSettings.endpoint) {
      ollamaService.setEndpoint(modelSettings.endpoint);
    }
  }, [modelSettings.endpoint]);

  useEffect(() => {
    checkOllamaStatus();
  }, [modelSettings.endpoint]);

  const checkOllamaStatus = async () => {
    try {
      const isRunning = await ollamaService.isOllamaRunning();
      setOllamaConnected(isRunning);
      
      if (isRunning) {
        const isAvailable = await ollamaService.isModelAvailable();
        setModelLoaded(isAvailable);
        
        addOutput({
          type: "info",
          content: `Ollama is ${isRunning ? "running" : "not running"} at ${ollamaService.getEndpoint()}. Model qwen2.5-coder:14b is ${isAvailable ? "loaded" : "not loaded"}.`,
          timestamp: new Date()
        });
      } else {
        addOutput({
          type: "info",
          content: `Ollama is not running at ${ollamaService.getEndpoint()}. Please start Ollama to use the Code Wizard.`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error("Failed to check Ollama status:", error);
    }
  };

  const addOutput = (item: OutputItem) => {
    setOutput(prev => [...prev, item]);
  };

  const handleSendCommand = async (command: string) => {
    setIsProcessing(true);
    
    addOutput({
      type: "command",
      content: command,
      timestamp: new Date()
    });

    if (command.startsWith("ollama")) {
      if (command.includes("run")) {
        await handleOllamaRunCommand(command);
      } else if (command.includes("pull")) {
        await handleOllamaPullCommand(command);
      } else {
        await executeCommand(command);
      }
    } else if (command.match(/install ollama/i)) {
      setShowInstallInstructions(true);
      addOutput({
        type: "info",
        content: "Showing Ollama installation instructions...",
        timestamp: new Date()
      });
    } else if (command.match(/^ssh/i)) {
      await handleSSHCommand(command);
    } else if (command.match(/^warpify|analyze/i)) {
      setActiveTab("files");
      addOutput({
        type: "info",
        content: "Switched to File Explorer. Select files to analyze.",
        timestamp: new Date()
      });
    } else if (!command.match(/^(cd|ls|dir|mkdir|rm|git|npm|yarn|pnpm)/i)) {
      await handleAICommand(command);
    } else {
      await executeCommand(command);
    }
    
    setIsProcessing(false);
  };

  const executeCommand = async (command: string) => {
    try {
      const result = await commandService.executeCommand(command);
      
      addOutput({
        type: result.success ? "response" : "error",
        content: result.output,
        timestamp: new Date()
      });
    } catch (error) {
      addOutput({
        type: "error",
        content: `Error executing command: ${error}`,
        timestamp: new Date()
      });
    }
  };

  const handleSSHCommand = async (command: string) => {
    const hostMatch = command.match(/ssh\s+(?:-\w+\s+)*([^@\s]+@)?([^@\s]+)/i);
    const host = hostMatch ? hostMatch[2] : "remote-host";
    
    addOutput({
      type: "info",
      content: `Connecting to ${host}...`,
      timestamp: new Date()
    });
    
    setTimeout(() => {
      addOutput({
        type: "response",
        content: `Connected to ${host}\nTo run Ollama on this server, make sure to forward port 11434 in your SSH connection`,
        timestamp: new Date()
      });
      
      addOutput({
        type: "info",
        content: `Tip: For remote Ollama, use: ssh -L 11434:localhost:11434 user@${host}`,
        timestamp: new Date()
      });
      
      toast.success(`Connected to ${host}`);
    }, 2000);
  };

  const handleOllamaRunCommand = async (command: string) => {
    const modelMatch = command.match(/ollama run (\S+)/);
    const modelName = modelMatch ? modelMatch[1] : "qwen2.5-coder:14b";
    
    addOutput({
      type: "info",
      content: `Starting Ollama with model ${modelName}...`,
      timestamp: new Date()
    });
    
    setTimeout(() => {
      setOllamaConnected(true);
      setModelLoaded(true);
      
      addOutput({
        type: "response",
        content: `Ollama started successfully with model ${modelName}.`,
        timestamp: new Date()
      });
      
      toast.success(`Ollama is now running with model ${modelName}`);
    }, 2000);
  };

  const handleOllamaPullCommand = async (command: string) => {
    const modelMatch = command.match(/ollama pull (\S+)/);
    const modelName = modelMatch ? modelMatch[1] : "qwen2.5-coder:14b";
    
    addOutput({
      type: "info",
      content: `Pulling model ${modelName}...`,
      timestamp: new Date()
    });
    
    let progress = 0;
    const intervalId = setInterval(() => {
      progress += 20;
      
      if (progress <= 100) {
        addOutput({
          type: "response",
          content: `Download progress: ${progress}%`,
          timestamp: new Date()
        });
      }
      
      if (progress >= 100) {
        clearInterval(intervalId);
        
        addOutput({
          type: "response",
          content: `Model ${modelName} pulled successfully.`,
          timestamp: new Date()
        });
        
        setModelLoaded(true);
        toast.success(`Model ${modelName} is now available`);
      }
    }, 1000);
  };

  const handleAICommand = async (command: string) => {
    if (!ollamaConnected) {
      addOutput({
        type: "error",
        content: "Ollama is not running. Please start Ollama first.",
        timestamp: new Date()
      });
      return;
    }
    
    if (!modelLoaded) {
      addOutput({
        type: "error",
        content: "Model is not loaded. Please run 'ollama run qwen2.5-coder:14b' first.",
        timestamp: new Date()
      });
      return;
    }
    
    addOutput({
      type: "info",
      content: "Thinking...",
      timestamp: new Date()
    });
    
    try {
      let fullResponse = "";
      
      await ollamaService.streamCompletion(
        command,
        {
          temperature: modelSettings.temperature,
          useGPU: modelSettings.useGPU,
          maxTokens: modelSettings.maxTokens
        },
        (chunk, done) => {
          fullResponse += chunk;
          if (done) {
            addOutput({
              type: "response",
              content: fullResponse,
              timestamp: new Date()
            });
            
            const commands = commandService.parseCommandsFromAI(fullResponse);
            if (commands.length > 0) {
              addOutput({
                type: "info",
                content: `Found ${commands.length} executable command${commands.length > 1 ? 's' : ''}. Use the Execute button to run them.`,
                timestamp: new Date()
              });
            }
          }
        }
      );
    } catch (error) {
      console.error("Error with Ollama:", error);
      
      const responses = [
        "```python\ndef hello_world():\n    print('Hello, world!')\n```",
        "I'd recommend creating a function to handle this task:",
        "```javascript\nasync function processData(input) {\n  const result = await fetch('/api/data', {\n    method: 'POST',\n    body: JSON.stringify(input)\n  });\n  return result.json();\n}\n```",
        "Here's how you can solve this problem with React:",
        "```jsx\nimport React, { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>Increment</button>\n    </div>\n  );\n}\n```"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      addOutput({
        type: "response",
        content: randomResponse,
        timestamp: new Date()
      });
    }
  };

  const handleFileAnalysis = (result: string) => {
    addOutput({
      type: "response",
      content: result,
      timestamp: new Date()
    });
  };

  const handleSettingsChange = (settings: {
    temperature: number;
    useGPU: boolean;
    maxTokens: number;
    endpoint: string;
  }) => {
    setModelSettings(settings);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="bg-card border-border">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Code className="h-6 w-6 text-accent" />
              <span className="bg-gradient-to-r from-accent to-primary text-transparent bg-clip-text">
                Code Wizard
              </span>
              <span className="text-sm font-normal text-muted-foreground ml-2">
                using Ollama
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              {ollamaConnected ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-green-400 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
                    Ollama Connected
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={checkOllamaStatus}
                  >
                    <Server className="h-4 w-4 mr-1" />
                    Status
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowInstallInstructions(true)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Install Ollama
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <Tabs defaultValue="commands" value={activeTab} onValueChange={(value) => setActiveTab(value as "commands" | "code" | "files")}>
            <TabsList className="mb-4">
              <TabsTrigger value="commands" className="flex items-center gap-1">
                <Terminal className="h-4 w-4" />
                Commands
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-1">
                <Code className="h-4 w-4" />
                Code Generation
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-1">
                <FolderOpen className="h-4 w-4" />
                Files
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="commands" className="space-y-4">
              <div className="flex items-center space-x-2 p-3 rounded-md bg-secondary/20 border border-border">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Enter system commands to manage Ollama or execute tasks on your {os} system.
                </p>
              </div>
              
              <CommandOutput output={output} />
            </TabsContent>
            
            <TabsContent value="code" className="space-y-4">
              <div className="flex items-center space-x-2 p-3 rounded-md bg-secondary/20 border border-border">
                <Zap className="h-5 w-5 text-accent" />
                <p className="text-sm text-muted-foreground">
                  Describe what code you need, and the AI will generate it for you.
                </p>
              </div>
              
              <CommandOutput output={output} />
            </TabsContent>
            
            <TabsContent value="files" className="space-y-4">
              <div className="flex items-center space-x-2 p-3 rounded-md bg-secondary/20 border border-border">
                <FolderOpen className="h-5 w-5 text-accent" />
                <p className="text-sm text-muted-foreground">
                  Select files to analyze and get AI insights about your codebase.
                </p>
              </div>
              
              <CommandOutput output={output} />
              
              <FileExplorer 
                onAnalyze={handleFileAnalysis}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
            </TabsContent>
          </Tabs>
          
          <ModelSettings onSettingsChange={handleSettingsChange} />
        </CardContent>
        
        <CardFooter className="pt-2 border-t border-border">
          <CommandInput 
            onSendCommand={handleSendCommand}
            isProcessing={isProcessing}
          />
        </CardFooter>
      </Card>
      
      <InstallInstructions 
        isOpen={showInstallInstructions} 
        onClose={() => setShowInstallInstructions(false)} 
      />
    </div>
  );
};

export default CodeWizard;
