
import React, { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Terminal } from "lucide-react";

interface CommandInputProps {
  onSendCommand: (command: string) => void;
  isProcessing: boolean;
}

const CommandInput: React.FC<CommandInputProps> = ({
  onSendCommand,
  isProcessing
}) => {
  const [command, setCommand] = useState("");

  const handleSubmit = () => {
    if (command.trim() && !isProcessing) {
      onSendCommand(command);
      setCommand("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center space-x-2 bg-secondary/50 p-3 rounded-lg border border-border">
      <Terminal className="h-5 w-5 text-accent" />
      <Input
        className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground terminal-text"
        placeholder="Enter a command or ask for code assistance..."
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isProcessing}
      />
      <Button 
        onClick={handleSubmit} 
        disabled={isProcessing || !command.trim()}
        variant="secondary"
        size="icon"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CommandInput;
