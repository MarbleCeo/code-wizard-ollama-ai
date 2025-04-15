
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { detectOS, getOllamaInstallInstructions } from "@/utils/platformUtils";

interface InstallInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstallInstructions: React.FC<InstallInstructionsProps> = ({
  isOpen,
  onClose
}) => {
  const os = detectOS();
  const instructions = getOllamaInstallInstructions()[os];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Install Ollama</DialogTitle>
          <DialogDescription>
            Follow these instructions to install Ollama on your system.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="mt-4 h-[300px]">
          <div className="terminal-window bg-code-bg">
            <pre className="terminal-text whitespace-pre-wrap text-code-text p-4">
              {instructions}
            </pre>
          </div>
        </ScrollArea>
        
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={() => window.open("https://ollama.com/download", "_blank")}
          >
            Visit Ollama Website
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallInstructions;
