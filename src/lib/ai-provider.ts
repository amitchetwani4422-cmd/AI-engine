import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// ─────────────────────────────────────────────────────────────────────────────
// Supported models
// ─────────────────────────────────────────────────────────────────────────────

export type AIModel =
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5"
  | "gpt-4o"
  | "gpt-4o-mini";

export interface AIModelOption {
  value: AIModel;
  label: string;
  provider: "anthropic" | "openai";
  badge: string; // e.g. "Fast & cheap", "Best quality"
}

export const AI_MODEL_OPTIONS: AIModelOption[] = [
  {
    value: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    provider: "anthropic",
    badge: "Best quality",
  },
  {
    value: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    badge: "Fast & cheap",
  },
  {
    value: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    badge: "OpenAI flagship",
  },
  {
    value: "gpt-4o-mini",
    label: "GPT-4o mini",
    provider: "openai",
    badge: "Fast & cheap",
  },
];

export const DEFAULT_IDEA_MODEL: AIModel = "claude-haiku-4-5";
export const DEFAULT_SCRIPT_MODEL: AIModel = "claude-sonnet-4-6";

// ─────────────────────────────────────────────────────────────────────────────
// Unified generate function
// ─────────────────────────────────────────────────────────────────────────────

export async function generateWithModel(
  model: AIModel,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 4096
): Promise<string> {
  const option = AI_MODEL_OPTIONS.find((m) => m.value === model);

  if (!option) throw new Error(`Unknown model: ${model}`);

  if (option.provider === "anthropic") {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    return message.content[0].type === "text" ? message.content[0].text : "";
  }

  // OpenAI
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const completion = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
}
