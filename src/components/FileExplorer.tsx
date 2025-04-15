
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Folder, FileText, ChevronRight, RefreshCw, Code, Zap, FolderInput } from "lucide-react";
import ollamaService from "@/services/ollamaService";
import { detectOS } from "@/utils/platformUtils";

interface FileExplorerProps {
  onAnalyze: (result: string) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
}

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isExpanded?: boolean;
  children?: FileItem[];
}

const FileExplorer: React.FC<FileExplorerProps> = ({ onAnalyze, isProcessing, setIsProcessing }) => {
  const [currentPath, setCurrentPath] = useState("");
  const [fileStructure, setFileStructure] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const os = detectOS();

  // Simulate loading the file structure
  const loadFileStructure = async () => {
    try {
      // In a real implementation, this would call a backend API
      // For now, we'll simulate it
      setIsProcessing(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const sampleStructure: FileItem[] = [
        {
          name: "src",
          path: `${currentPath}/src`,
          isDirectory: true,
          isExpanded: false,
          children: [
            { name: "components", path: `${currentPath}/src/components`, isDirectory: true },
            { name: "utils", path: `${currentPath}/src/utils`, isDirectory: true },
            { name: "App.tsx", path: `${currentPath}/src/App.tsx`, isDirectory: false },
            { name: "main.tsx", path: `${currentPath}/src/main.tsx`, isDirectory: false },
          ]
        },
        {
          name: "public",
          path: `${currentPath}/public`,
          isDirectory: true,
          isExpanded: false,
          children: [
            { name: "index.html", path: `${currentPath}/public/index.html`, isDirectory: false },
            { name: "favicon.ico", path: `${currentPath}/public/favicon.ico`, isDirectory: false },
          ]
        },
        {
          name: "package.json",
          path: `${currentPath}/package.json`,
          isDirectory: false
        },
        {
          name: "tsconfig.json",
          path: `${currentPath}/tsconfig.json`,
          isDirectory: false
        },
      ];
      
      setFileStructure(sampleStructure);
      toast.success("File structure loaded");
    } catch (error) {
      toast.error(`Error loading file structure: ${error}`);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle directory expansion
  const toggleDirectory = (path: string) => {
    setFileStructure(prevStructure => {
      const updateStructure = (items: FileItem[]): FileItem[] => {
        return items.map(item => {
          if (item.path === path) {
            return { ...item, isExpanded: !item.isExpanded };
          } else if (item.children) {
            return { ...item, children: updateStructure(item.children) };
          }
          return item;
        });
      };
      
      return updateStructure(prevStructure);
    });
  };

  // Handle file selection
  const toggleFileSelection = (path: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(path)) {
        return prev.filter(p => p !== path);
      } else {
        return [...prev, path];
      }
    });
  };

  // Render file tree recursively
  const renderFileTree = (items: FileItem[]) => {
    return (
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.path} className="pl-2">
            <div className="flex items-center">
              {item.isDirectory ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 justify-start"
                  onClick={() => toggleDirectory(item.path)}
                >
                  <ChevronRight
                    className={`h-3 w-3 mr-1 transition-transform ${
                      item.isExpanded ? "rotate-90" : ""
                    }`}
                  />
                  <Folder className="h-4 w-4 mr-2 text-amber-400" />
                  {item.name}
                </Button>
              ) : (
                <div
                  className={`flex items-center px-2 py-1 rounded-sm ${
                    selectedFiles.includes(item.path)
                      ? "bg-secondary/50"
                      : "hover:bg-secondary/20"
                  }`}
                  onClick={() => toggleFileSelection(item.path)}
                >
                  <FileText className="h-4 w-4 mr-2 text-accent" />
                  <span className="text-sm">{item.name}</span>
                </div>
              )}
            </div>
            
            {item.isDirectory && item.isExpanded && item.children && (
              <div className="ml-4 mt-1 border-l border-border pl-2">
                {renderFileTree(item.children)}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  // Analyze selected files
  const handleAnalyzeFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select files to analyze");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // This would make an actual API call in a real implementation
      const analysisResult = await ollamaService.analyzeFilesOrFolders(selectedFiles);
      
      onAnalyze(`Analysis of selected files:\n\n${analysisResult}`);
      toast.success("Files analyzed successfully");
    } catch (error) {
      toast.error(`Error analyzing files: ${error}`);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border border-border mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FolderInput className="h-4 w-4 text-accent" />
          File Explorer
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="path" className="text-xs mb-1 block">Project Path</Label>
            <Input
              id="path"
              placeholder={os === 'windows' ? "C:\\Projects\\my-app" : "/home/user/projects/my-app"}
              value={currentPath}
              onChange={(e) => setCurrentPath(e.target.value)}
              className="text-sm"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadFileStructure}
            disabled={isProcessing || !currentPath}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Load
          </Button>
        </div>
        
        {fileStructure.length > 0 ? (
          <div className="border rounded-md overflow-auto max-h-60">
            {renderFileTree(fileStructure)}
          </div>
        ) : (
          <div className="h-20 border rounded-md flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Enter a path and click Load to view files</p>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-2">
          <div className="text-xs text-muted-foreground">
            {selectedFiles.length} files selected
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedFiles([])}
              disabled={selectedFiles.length === 0 || isProcessing}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={handleAnalyzeFiles}
              disabled={selectedFiles.length === 0 || isProcessing}
              className="bg-accent hover:bg-accent/80"
            >
              {isProcessing ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Zap className="h-3 w-3 mr-1" />
              )}
              Warpify
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileExplorer;
