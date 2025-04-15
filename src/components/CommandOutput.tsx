
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CommandOutputProps {
  output: Array<{
    type: "command" | "response" | "error" | "info";
    content: string;
    timestamp: Date;
  }>;
}

const CommandOutput: React.FC<CommandOutputProps> = ({ output }) => {
  // Auto-scroll to bottom ref
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Format the code blocks with syntax highlighting
  const formatOutput = (content: string) => {
    // Replace code blocks
    const formattedContent = content.replace(
      /```([\s\S]*?)```/g,
      (match, codeContent) => {
        return `<div class="code-block my-2"><pre><code>${codeContent}</code></pre></div>`;
      }
    );

    return formattedContent;
  };

  // Auto-scroll to bottom on new output
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <ScrollArea className="flex-1 p-4 bg-card rounded-lg border border-border">
      <div ref={scrollRef} className="space-y-3 min-h-[300px]">
        {output.map((item, index) => (
          <div key={index} className="terminal-line">
            {item.type === "command" && (
              <div className="flex items-start">
                <span className="terminal-prompt font-semibold text-green-400 mr-2">
                  $
                </span>
                <span className="text-foreground font-semibold">{item.content}</span>
              </div>
            )}

            {item.type === "response" && (
              <div 
                className="pl-5 text-muted-foreground terminal-text whitespace-pre-wrap" 
                dangerouslySetInnerHTML={{ 
                  __html: formatOutput(item.content) 
                }}
              />
            )}

            {item.type === "error" && (
              <div className="pl-5 text-destructive terminal-text whitespace-pre-wrap">
                {item.content}
              </div>
            )}

            {item.type === "info" && (
              <div className="pl-2 text-accent italic terminal-text">
                {item.content}
              </div>
            )}
          </div>
        ))}

        {output.length === 0 && (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p className="italic">Enter a command to get started</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default CommandOutput;
