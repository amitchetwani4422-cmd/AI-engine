"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AI_MODEL_OPTIONS } from "@/lib/ai-provider";
import type { AIModel } from "@/lib/ai-provider";

interface ModelSelectorProps {
  value: AIModel;
  onChange: (model: AIModel) => void;
  className?: string;
}

export function ModelSelector({ value, onChange, className }: ModelSelectorProps) {
  const selected = AI_MODEL_OPTIONS.find((m) => m.value === value);

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <span className="text-xs text-zinc-500 whitespace-nowrap">AI Model</span>
      <Select value={value} onValueChange={(v) => onChange(v as AIModel)}>
        <SelectTrigger className="w-44 h-8 text-xs bg-zinc-900 border-zinc-700">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AI_MODEL_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center gap-2">
                <span className="text-xs">{opt.label}</span>
                <Badge
                  className={`text-[10px] px-1.5 py-0 ${
                    opt.provider === "openai"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-orange-500/20 text-orange-400"
                  }`}
                >
                  {opt.badge}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <Badge className={`text-[10px] px-1.5 ${
          selected.provider === "openai"
            ? "bg-green-500/10 text-green-500 border-green-500/20"
            : "bg-orange-500/10 text-orange-500 border-orange-500/20"
        }`}>
          {selected.provider === "openai" ? "OpenAI" : "Anthropic"}
        </Badge>
      )}
    </div>
  );
}
