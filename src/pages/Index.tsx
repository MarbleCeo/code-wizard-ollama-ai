
import React from "react";
import CodeWizard from "@/components/CodeWizard";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">
            <span className="text-accent">Code</span> Wizard
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Powered by</span>
            <span className="font-semibold text-foreground">Ollama | qwen2.5-coder:14b</span>
          </div>
        </div>
      </header>
      
      <main className="py-8">
        <CodeWizard />
      </main>
      
      <footer className="border-t border-border py-4 mt-8">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>
            Code Wizard - Built with Ollama integration for local AI code generation and system operations
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
