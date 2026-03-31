import Anthropic from "@anthropic-ai/sdk";
import type {
  Channel,
  Idea,
  Script,
  StyleBible,
  Series,
  Episode,
} from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8192;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface GeneratedScript {
  title: string;
  hook: string;
  fullScript: string;
  narrationDraft: string;
  formatVariant: string;
  musicMood: string;
  thumbnailConcepts: string[];
  titleOptions: string[];
  subtitleText: string;
  description: string;
  caption: string;
  scenes: GeneratedScene[];
}

export interface GeneratedScene {
  sequenceNumber: number;
  description: string;
  duration: number;
  modelAssigned: "kling-3.0" | "veo-3.1";
  routingReason: string;
  cameraDirection: string;
  visualGuidance: string;
  prompt: string;
  characterIds: string[];
}

export interface ScoredIdea {
  channelFitScore: number;
  noveltyScore: number;
  repeatabilityScore: number;
  productionDifficulty: number;
  estimatedCost: number;
  monetizationScore: number;
  overallScore: number;
  notes: string;
}

export interface GeneratedIdea {
  title: string;
  description: string;
  type: "topic" | "series" | "hook" | "trend" | "evergreen";
  format: string;
  tags: string[];
  estimatedCost: number;
}

export interface WeeklyContentPlan {
  weekStartDate: string;
  channelPlans: ChannelWeekPlan[];
  totalEstimatedCost: number;
  notes: string;
}

export interface ChannelWeekPlan {
  channelId: string;
  channelName: string;
  scheduledVideos: ScheduledVideo[];
  weeklyBudget: number;
}

export interface ScheduledVideo {
  dayOfWeek: number;
  ideaId?: string;
  title: string;
  format: string;
  estimatedCost: number;
  platform: string[];
}

export interface NextEpisodeSuggestion {
  episodeNumber: number;
  title: string;
  summary: string;
  characterArcs: Record<string, string>;
  continuityHooks: string[];
  format: string;
  estimatedCost: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function extractJSON<T>(text: string): T {
  // Strip markdown code fences if present
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Try to find the first complete JSON object or array
  const firstBrace = stripped.indexOf("{");
  const firstBracket = stripped.indexOf("[");
  let startIndex = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
  }

  if (startIndex === -1) {
    throw new Error("No JSON found in response: " + text.slice(0, 200));
  }

  const jsonText = stripped.slice(startIndex);
  return JSON.parse(jsonText) as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// generateScript
// ─────────────────────────────────────────────────────────────────────────────

export async function generateScript(
  idea: Pick<Idea, "title" | "description" | "format" | "tags" | "type">,
  channel: Pick<
    Channel,
    | "name"
    | "niche"
    | "universe"
    | "targetAudience"
    | "primaryPlatform"
    | "language"
    | "visualStyle"
    | "voiceStyle"
    | "contentPillars"
  >,
  styleBible: Pick<
    StyleBible,
    | "narrationTone"
    | "musicDirection"
    | "cameraFeel"
    | "lightingPreferences"
    | "subtitleStyle"
    | "visualConstraints"
    | "compositionStyles"
  > | null
): Promise<GeneratedScript> {
  const styleBibleContext = styleBible
    ? `
Style Bible:
- Narration Tone: ${styleBible.narrationTone}
- Music Direction: ${styleBible.musicDirection}
- Camera Feel: ${styleBible.cameraFeel}
- Lighting: ${styleBible.lightingPreferences}
- Subtitle Style: ${styleBible.subtitleStyle}
- Visual Constraints: ${styleBible.visualConstraints}
- Composition Styles: ${styleBible.compositionStyles.join(", ")}
`
    : "";

  const systemPrompt = `You are an expert AI video content scriptwriter specializing in short-form and long-form social media content.
You create scripts optimized for AI video generation using models like Kling 3.0 (action/character-heavy scenes) and Veo 3.1 (speaking/cinematic/devotional scenes).
Always respond with valid JSON only, no explanation outside the JSON.`;

  const userPrompt = `Generate a complete production-ready video script for the following:

Channel: ${channel.name}
Niche: ${channel.niche}
Universe: ${channel.universe}
Target Audience: ${channel.targetAudience}
Primary Platform: ${channel.primaryPlatform}
Language: ${channel.language}
Visual Style: ${channel.visualStyle}
Voice Style: ${channel.voiceStyle}
Content Pillars: ${channel.contentPillars.join(", ")}
${styleBibleContext}
Idea Title: ${idea.title}
Idea Description: ${idea.description}
Format: ${idea.format}
Type: ${idea.type}
Tags: ${idea.tags.join(", ")}

Return a JSON object with this exact structure:
{
  "title": "final video title",
  "hook": "opening hook text (first 3 seconds - must be attention-grabbing)",
  "fullScript": "complete script with timestamps and scene markers",
  "narrationDraft": "voice-over narration text only",
  "formatVariant": "shorts-60s | shorts-30s | long-form-8min | etc.",
  "musicMood": "epic/devotional/upbeat/etc.",
  "thumbnailConcepts": ["concept 1", "concept 2", "concept 3"],
  "titleOptions": ["title option 1", "title option 2", "title option 3", "title option 4", "title option 5"],
  "subtitleText": "subtitle/tagline for the video",
  "description": "YouTube/Instagram description with hashtags",
  "caption": "short social media caption for posting",
  "scenes": [
    {
      "sequenceNumber": 1,
      "description": "what happens in this scene",
      "duration": 5,
      "modelAssigned": "kling-3.0",
      "routingReason": "why this model was chosen",
      "cameraDirection": "camera movement and angle description",
      "visualGuidance": "detailed visual composition notes",
      "prompt": "optimized generation prompt for the assigned model",
      "characterIds": []
    }
  ]
}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic");
  }

  return extractJSON<GeneratedScript>(content.text);
}

// ─────────────────────────────────────────────────────────────────────────────
// generateIdeas
// ─────────────────────────────────────────────────────────────────────────────

export async function generateIdeas(
  channel: Pick<
    Channel,
    | "name"
    | "niche"
    | "universe"
    | "targetAudience"
    | "primaryPlatform"
    | "language"
    | "contentPillars"
    | "formatStrategy"
  >,
  count: number = 10
): Promise<GeneratedIdea[]> {
  const systemPrompt = `You are an expert content strategist for AI-generated video channels.
You generate viral, high-potential content ideas optimized for short-form and long-form video.
Always respond with valid JSON only.`;

  const userPrompt = `Generate ${count} high-quality content ideas for this channel:

Channel: ${channel.name}
Niche: ${channel.niche}
Universe: ${channel.universe}
Target Audience: ${channel.targetAudience}
Primary Platform: ${channel.primaryPlatform}
Language: ${channel.language}
Content Pillars: ${channel.contentPillars.join(", ")}
Format Strategy: ${channel.formatStrategy ?? "mixed"}

Requirements:
- Mix of evergreen, trending, and series ideas
- Optimized for AI video generation
- Culturally relevant and engaging
- Consider festival seasons and trending topics
- Include variety in formats (shorts, long-form, series episodes)

Return a JSON array with exactly ${count} objects:
[
  {
    "title": "compelling video title",
    "description": "2-3 sentence description of the content",
    "type": "topic | series | hook | trend | evergreen",
    "format": "shorts-60s | shorts-30s | long-form-8min | episode | etc.",
    "tags": ["tag1", "tag2", "tag3"],
    "estimatedCost": 5.50
  }
]`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic");
  }

  return extractJSON<GeneratedIdea[]>(content.text);
}

// ─────────────────────────────────────────────────────────────────────────────
// scoreIdea
// ─────────────────────────────────────────────────────────────────────────────

export async function scoreIdea(
  idea: Pick<Idea, "title" | "description" | "type" | "format" | "tags">,
  channel: Pick<
    Channel,
    | "name"
    | "niche"
    | "universe"
    | "targetAudience"
    | "primaryPlatform"
    | "contentPillars"
    | "maxBudgetPerVideo"
  >
): Promise<ScoredIdea> {
  const systemPrompt = `You are an expert content analyst specializing in AI-generated video performance prediction.
Score ideas objectively on multiple dimensions. Always respond with valid JSON only.`;

  const userPrompt = `Score this content idea for the channel:

Channel: ${channel.name}
Niche: ${channel.niche}
Universe: ${channel.universe}
Target Audience: ${channel.targetAudience}
Primary Platform: ${channel.primaryPlatform}
Content Pillars: ${channel.contentPillars.join(", ")}
Max Budget Per Video: $${channel.maxBudgetPerVideo}

Idea Title: ${idea.title}
Idea Description: ${idea.description}
Type: ${idea.type}
Format: ${idea.format}
Tags: ${idea.tags.join(", ")}

Score each dimension from 0.0 to 10.0:
- channelFitScore: How well does it fit the channel's niche, audience, and pillars?
- noveltyScore: How unique and fresh is the idea vs. common content?
- repeatabilityScore: Can this format/topic be repeated regularly? (series potential)
- productionDifficulty: How easy is it to produce with AI? (10 = very easy, 0 = very hard)
- estimatedCost: Estimated production cost in USD (not a 0-10 score, actual dollar amount)
- monetizationScore: Potential for ad revenue, sponsorships, merchandise?
- overallScore: Weighted overall score (0-10)

Return a JSON object:
{
  "channelFitScore": 8.5,
  "noveltyScore": 7.2,
  "repeatabilityScore": 9.0,
  "productionDifficulty": 6.5,
  "estimatedCost": 4.75,
  "monetizationScore": 8.0,
  "overallScore": 7.8,
  "notes": "Brief explanation of the scores and any concerns or opportunities"
}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic");
  }

  return extractJSON<ScoredIdea>(content.text);
}

// ─────────────────────────────────────────────────────────────────────────────
// generateContentPlan
// ─────────────────────────────────────────────────────────────────────────────

export async function generateContentPlan(
  channels: Array<
    Pick<
      Channel,
      | "id"
      | "name"
      | "niche"
      | "universe"
      | "primaryPlatform"
      | "postingFrequency"
      | "maxBudgetPerWeek"
      | "uploadCadence"
    >
  >,
  ideas: Array<
    Pick<Idea, "id" | "title" | "format" | "overallScore" | "estimatedCost"> & {
      channelId: string;
    }
  >
): Promise<WeeklyContentPlan> {
  const channelsSummary = channels
    .map(
      (c) =>
        `- ${c.name} (${c.universe}): ${c.postingFrequency} on ${c.primaryPlatform}, budget $${c.maxBudgetPerWeek}/week`
    )
    .join("\n");

  const ideasByChannel = channels.reduce(
    (acc, ch) => {
      acc[ch.id] = ideas
        .filter((i) => i.channelId === ch.id)
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, 10);
      return acc;
    },
    {} as Record<string, typeof ideas>
  );

  const ideasSummary = Object.entries(ideasByChannel)
    .map(([chId, chIdeas]) => {
      const ch = channels.find((c) => c.id === chId);
      return `${ch?.name ?? chId}:\n${chIdeas.map((i) => `  - [${i.id}] "${i.title}" (score: ${i.overallScore}, cost: $${i.estimatedCost}, format: ${i.format})`).join("\n")}`;
    })
    .join("\n\n");

  const systemPrompt = `You are an expert content calendar manager for a multi-channel AI video production operation.
Create efficient weekly schedules that maximize output within budget constraints.
Always respond with valid JSON only.`;

  const userPrompt = `Create a weekly content production plan for the following channels:

Channels:
${channelsSummary}

Available Ideas by Channel:
${ideasSummary}

Rules:
- Respect each channel's posting frequency and weekly budget
- Prioritize higher-scoring ideas
- Spread content evenly across the week
- Consider cross-channel synergies for Universe A/B/C
- Leave buffer in budgets for unexpected costs

Return a JSON object:
{
  "weekStartDate": "YYYY-MM-DD",
  "channelPlans": [
    {
      "channelId": "channel_id",
      "channelName": "Channel Name",
      "weeklyBudget": 50.0,
      "scheduledVideos": [
        {
          "dayOfWeek": 1,
          "ideaId": "idea_id_or_null",
          "title": "video title",
          "format": "shorts-60s",
          "estimatedCost": 4.5,
          "platform": ["youtube", "instagram"]
        }
      ]
    }
  ],
  "totalEstimatedCost": 120.0,
  "notes": "Any strategic notes or recommendations"
}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic");
  }

  return extractJSON<WeeklyContentPlan>(content.text);
}

// ─────────────────────────────────────────────────────────────────────────────
// generateNextEpisodeSuggestion
// ─────────────────────────────────────────────────────────────────────────────

export async function generateNextEpisodeSuggestion(
  series: Pick<Series, "id" | "name" | "description" | "characterIds" | "continuityLog"> & {
    episodes: Array<Pick<Episode, "episodeNumber" | "title" | "summary" | "characterArcs">>;
  }
): Promise<NextEpisodeSuggestion> {
  const episodeHistory = series.episodes
    .sort((a, b) => a.episodeNumber - b.episodeNumber)
    .map(
      (e) =>
        `Episode ${e.episodeNumber}: "${e.title}" - ${e.summary}`
    )
    .join("\n");

  const systemPrompt = `You are an expert serialized content writer for AI-generated video series.
You create compelling episode continuations that maintain consistency and build audience retention.
Always respond with valid JSON only.`;

  const userPrompt = `Suggest the next episode for this series:

Series: ${series.name}
Description: ${series.description}
Characters: ${series.characterIds.join(", ")}
Continuity Log: ${series.continuityLog ?? "No continuity log yet."}

Episode History:
${episodeHistory || "No episodes yet — this would be Episode 1."}

Create a suggestion for Episode ${(series.episodes.length ?? 0) + 1} that:
- Continues story threads from previous episodes
- Introduces a compelling new conflict or revelation
- Develops character arcs meaningfully
- Works as a standalone short video (not requiring knowledge of prior episodes for new viewers)
- Is optimized for AI video production

Return a JSON object:
{
  "episodeNumber": ${(series.episodes.length ?? 0) + 1},
  "title": "episode title",
  "summary": "2-3 sentence plot summary",
  "characterArcs": {
    "character_name": "what happens to this character this episode"
  },
  "continuityHooks": ["hook 1 to resolve from previous ep", "new hook introduced this ep"],
  "format": "shorts-60s | long-form-8min | etc.",
  "estimatedCost": 6.50
}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic");
  }

  return extractJSON<NextEpisodeSuggestion>(content.text);
}
