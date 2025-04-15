
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { checkForNvidiaGPU } from "@/utils/platformUtils";
import { Settings, Cpu, Monitor } from "lucide-react";

interface ModelSettingsProps {
  onSettingsChange: (settings: {
    temperature: number;
    useGPU: boolean;
    maxTokens: number;
  }) => void;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({ onSettingsChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [temperature, setTemperature] = useState(0.2);
  const [useGPU, setUseGPU] = useState(true);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [hasGPU, setHasGPU] = useState(false);

  // Check for GPU on component mount
  useEffect(() => {
    const checkGPU = async () => {
      const gpuAvailable = await checkForNvidiaGPU();
      setHasGPU(gpuAvailable);
      setUseGPU(gpuAvailable);
    };
    
    checkGPU();
  }, []);

  // Update parent component when settings change
  useEffect(() => {
    onSettingsChange({
      temperature,
      useGPU,
      maxTokens
    });
  }, [temperature, useGPU, maxTokens, onSettingsChange]);

  return (
    <div className="my-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1"
      >
        <Settings className="h-4 w-4" />
        <span>Settings</span>
      </Button>

      {isOpen && (
        <Card className="mt-2 border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Model Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="temperature">Temperature: {temperature}</Label>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.05}
                value={[temperature]}
                onValueChange={(value) => setTemperature(value[0])}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="max-tokens">Max Tokens: {maxTokens}</Label>
              </div>
              <Slider
                id="max-tokens"
                min={512}
                max={4096}
                step={512}
                value={[maxTokens]}
                onValueChange={(value) => setMaxTokens(value[0])}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="use-gpu"
                checked={useGPU}
                disabled={!hasGPU}
                onCheckedChange={setUseGPU}
              />
              <Label htmlFor="use-gpu" className="flex items-center gap-1">
                {useGPU ? (
                  <Monitor className="h-4 w-4 text-green-400" />
                ) : (
                  <Cpu className="h-4 w-4" />
                )}
                <span>Use GPU Acceleration</span>
              </Label>
              {!hasGPU && (
                <span className="text-xs text-muted-foreground ml-2">
                  (No NVIDIA GPU detected)
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModelSettings;
