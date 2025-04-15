
/**
 * Ollama integration service to handle model interactions
 */

interface OllamaOptions {
  model: string;
  useGPU: boolean;
  temperature: number;
  maxTokens?: number;
  endpoint?: string;
}

interface OllamaResponse {
  response: string;
  done: boolean;
}

interface FileContent {
  path: string;
  content: string;
  isDirectory: boolean;
}

export class OllamaService {
  private baseUrl: string;
  private defaultOptions: OllamaOptions;
  private isRunning: boolean = false;
  private currentWorkingDirectory: string = "/";

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
    this.defaultOptions = {
      model: 'qwen2.5-coder:14b',
      useGPU: true,
      temperature: 0.2,
      maxTokens: 2048
    };
  }

  // Set the Ollama endpoint
  public setEndpoint(endpoint: string): void {
    this.baseUrl = endpoint;
  }

  // Get the current endpoint
  public getEndpoint(): string {
    return this.baseUrl;
  }

  // Set current working directory
  public setWorkingDirectory(path: string): void {
    this.currentWorkingDirectory = path;
  }

  // Get current working directory
  public getWorkingDirectory(): string {
    return this.currentWorkingDirectory;
  }

  // Check if Ollama is running
  public async isOllamaRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });
      
      this.isRunning = response.status === 200;
      return this.isRunning;
    } catch (error) {
      console.error('Failed to connect to Ollama:', error);
      this.isRunning = false;
      return false;
    }
  }

  // List available models
  public async listModels(): Promise<string[]> {
    if (!await this.isOllamaRunning()) {
      throw new Error('Ollama is not running');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models.map((model: any) => model.name);
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }

  // Check if our required model is available
  public async isModelAvailable(modelName: string = this.defaultOptions.model): Promise<boolean> {
    const models = await this.listModels();
    return models.includes(modelName);
  }

  // Pull model if not available
  public async pullModel(modelName: string = this.defaultOptions.model): Promise<boolean> {
    if (!await this.isOllamaRunning()) {
      throw new Error('Ollama is not running');
    }

    try {
      console.log(`Pulling model ${modelName}...`);
      
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
        }),
      });
      
      return response.status === 200;
    } catch (error) {
      console.error(`Failed to pull model ${modelName}:`, error);
      return false;
    }
  }

  // Ensure the model is available, pulling if necessary
  public async ensureModelAvailable(modelName: string = this.defaultOptions.model): Promise<boolean> {
    if (await this.isModelAvailable(modelName)) {
      return true;
    }
    
    return await this.pullModel(modelName);
  }

  // Analyze a file or folder structure
  public async analyzeFilesOrFolders(
    paths: string[],
    options: Partial<OllamaOptions> = {}
  ): Promise<string> {
    if (!await this.isOllamaRunning()) {
      throw new Error('Ollama is not running');
    }

    // In a web environment, we can't directly access the file system
    // This would need to be implemented through a backend service
    // For now, we'll simulate it
    const fileContents = this.simulateFileContents(paths);
    const fileContentString = fileContents.map(file => 
      `${file.path} ${file.isDirectory ? '(directory)' : ''}:\n${file.content}`
    ).join('\n\n');

    const prompt = `Analyze the following files and directories:\n\n${fileContentString}\n\nProvide insights, potential improvements, and code quality assessment.`;
    
    return this.generateCompletion(prompt, options);
  }

  // Generate code completion
  public async generateCompletion(
    prompt: string, 
    options: Partial<OllamaOptions> = {}
  ): Promise<string> {
    if (!await this.isOllamaRunning()) {
      throw new Error('Ollama is not running');
    }

    const modelOptions = {
      ...this.defaultOptions,
      ...options
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelOptions.model,
          prompt: prompt,
          temperature: modelOptions.temperature,
          max_tokens: modelOptions.maxTokens,
          options: {
            num_gpu: modelOptions.useGPU ? 1 : 0,
          },
          stream: false,
        }),
      });

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Failed to generate completion:', error);
      return `Error generating code: ${error}`;
    }
  }

  // Stream completions for a more interactive experience
  public async streamCompletion(
    prompt: string, 
    options: Partial<OllamaOptions> = {},
    onChunk: (chunk: string, done: boolean) => void
  ): Promise<void> {
    if (!await this.isOllamaRunning()) {
      throw new Error('Ollama is not running');
    }

    const modelOptions = {
      ...this.defaultOptions,
      ...options
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelOptions.model,
          prompt: prompt,
          temperature: modelOptions.temperature,
          max_tokens: modelOptions.maxTokens,
          options: {
            num_gpu: modelOptions.useGPU ? 1 : 0,
          },
          stream: true,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is null');
      }

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (done) {
          onChunk('', true);
          break;
        }

        const chunk = decoder.decode(value);
        try {
          // Each line is a separate JSON object
          const lines = chunk.split('\n').filter(line => line.trim());
          for (const line of lines) {
            const data = JSON.parse(line);
            onChunk(data.response, data.done);
            if (data.done) {
              done = true;
              break;
            }
          }
        } catch (e) {
          // If parsing fails, just return the raw chunk
          onChunk(chunk, false);
        }
      }
    } catch (error) {
      console.error('Failed to stream completion:', error);
      onChunk(`Error: ${error}`, true);
    }
  }

  // Simulate file system access (would be replaced with actual backend service)
  private simulateFileContents(paths: string[]): FileContent[] {
    const sampleContents: FileContent[] = [];
    
    for (const path of paths) {
      if (path.includes('.')) {
        // Simulating a file
        sampleContents.push({
          path,
          content: `// Sample content for ${path}\n// This would be actual file content in a real implementation`,
          isDirectory: false
        });
      } else {
        // Simulating a directory
        sampleContents.push({
          path,
          content: "file1.txt\nfile2.js\nsubdir/",
          isDirectory: true
        });
      }
    }
    
    return sampleContents;
  }
}

export default new OllamaService();
