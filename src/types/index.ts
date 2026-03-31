// ─────────────────────────────────────────────────────────────────────────────
// Re-export all Prisma types
// ─────────────────────────────────────────────────────────────────────────────
export type {
  Channel,
  Idea,
  Script,
  Scene,
  Character,
  CharacterPrompt,
  Prompt,
  StyleBible,
  Video,
  GeneratedClip,
  Series,
  Episode,
  VoiceAsset,
  Asset,
  CulturalEvent,
  VideoAnalytics,
  ChannelAnalytics,
  FormatPlaybook,
  GenerationJob,
  CompetitorReference,
} from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export enum ApprovalStatus {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
  RevisionRequired = "RevisionRequired",
  Regenerate = "Regenerate",
}

export enum VideoStatus {
  Pending = "Pending",
  Scripting = "Scripting",
  InProduction = "InProduction",
  QualityCheck = "QualityCheck",
  Approved = "Approved",
  Publishing = "Publishing",
  Published = "Published",
  Failed = "Failed",
  Archived = "Archived",
}

export enum IdeaStatus {
  Draft = "Draft",
  Approved = "Approved",
  InProduction = "InProduction",
  Completed = "Completed",
  Rejected = "Rejected",
  Archived = "Archived",
}

export enum ScriptStatus {
  Draft = "Draft",
  Review = "Review",
  Approved = "Approved",
  InProduction = "InProduction",
  Completed = "Completed",
  Archived = "Archived",
}

export enum SceneStatus {
  Pending = "Pending",
  Generating = "Generating",
  Generated = "Generated",
  Approved = "Approved",
  Rejected = "Rejected",
  Regenerating = "Regenerating",
}

export enum JobStatus {
  Pending = "pending",
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
  Retrying = "retrying",
}

export enum SuccessRating {
  Great = "Great",
  Acceptable = "Acceptable",
  Failed = "Failed",
}

export enum VideoClassification {
  Winner = "Winner",
  Loser = "Loser",
  Inconclusive = "Inconclusive",
}

export enum RepeatRecommendation {
  Yes = "Yes",
  No = "No",
  TestVariant = "Test variant",
}

// ─────────────────────────────────────────────────────────────────────────────
// Content Universe
// ─────────────────────────────────────────────────────────────────────────────

export type UniverseKey = "A" | "B" | "C";

export interface ContentUniverse {
  key: UniverseKey;
  name: string;
  description: string;
  channels: string[];
  primaryModel: VideoModel;
  contentThemes: string[];
  targetDemographic: string;
  monetizationStrategy: string;
}

export const UNIVERSE_DEFINITIONS: Record<UniverseKey, ContentUniverse> = {
  A: {
    key: "A",
    name: "Mythology and Bhakti",
    description: "Devotional and mythological content rooted in Hindu/Indian spiritual traditions",
    channels: ["mythology", "bhakti"],
    primaryModel: "veo-3.1",
    contentThemes: ["Ramayana", "Mahabharata", "devotional songs", "temple rituals", "gods and goddesses"],
    targetDemographic: "18-55 religious and culturally connected Indian audience",
    monetizationStrategy: "Ad revenue + devotional product sponsorships",
  },
  B: {
    key: "B",
    name: "Character and Entertainment IP",
    description: "Original characters, cartoons, and creature IP with serialized storytelling",
    channels: ["cartoon", "creature"],
    primaryModel: "kling-3.0",
    contentThemes: ["original characters", "adventure", "humor", "creature worlds", "episodic stories"],
    targetDemographic: "6-24 entertainment-seeking global audience",
    monetizationStrategy: "Ad revenue + merchandise + character licensing",
  },
  C: {
    key: "C",
    name: "Cooking Spectacle",
    description: "Visually spectacular cooking and food content with AI-enhanced VFX",
    channels: ["cooking"],
    primaryModel: "kling-3.0",
    contentThemes: ["extreme cooking", "food science", "traditional recipes", "cooking challenges", "food VFX"],
    targetDemographic: "16-45 food and entertainment enthusiast global audience",
    monetizationStrategy: "Ad revenue + cooking product sponsorships + affiliate",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Video Generation
// ─────────────────────────────────────────────────────────────────────────────

export type VideoModel = "kling-3.0" | "veo-3.1";

export interface VideoGenerationParams {
  model: VideoModel;
  prompt: string;
  duration: number;
  referenceImage?: string;
  audioUrl?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  negativePrompt?: string;
  sceneId?: string;
  videoId?: string;
}

export interface VideoGenerationResult {
  requestId: string;
  videoUrl: string;
  duration: number;
  cost: number;
  model: VideoModel;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene Routing
// ─────────────────────────────────────────────────────────────────────────────

export type SceneType =
  | "character-action"
  | "multi-shot"
  | "creature-mascot"
  | "cooking-vfx"
  | "cartoon-episode"
  | "battle-action"
  | "high-volume"
  | "character-speaking"
  | "bhajan-lipsync"
  | "devotional-closeup"
  | "cinematic-hero"
  | "mythology-narration";

export type SceneRoutingTable = Record<SceneType, VideoModel>;

export const DEFAULT_SCENE_ROUTING: SceneRoutingTable = {
  "character-action": "kling-3.0",
  "multi-shot": "kling-3.0",
  "creature-mascot": "kling-3.0",
  "cooking-vfx": "kling-3.0",
  "cartoon-episode": "kling-3.0",
  "battle-action": "kling-3.0",
  "high-volume": "kling-3.0",
  "character-speaking": "veo-3.1",
  "bhajan-lipsync": "veo-3.1",
  "devotional-closeup": "veo-3.1",
  "cinematic-hero": "veo-3.1",
  "mythology-narration": "veo-3.1",
};

// ─────────────────────────────────────────────────────────────────────────────
// Quality Dimensions
// ─────────────────────────────────────────────────────────────────────────────

export type QualityDimensionKey =
  | "visualClarity"
  | "characterConsistency"
  | "motionSmoothness"
  | "promptAdherence"
  | "colorGrading"
  | "composition"
  | "facialExpression"
  | "lipSync"
  | "backgroundQuality"
  | "lightingConsistency"
  | "overallImpact";

export interface QualityDimension {
  key: QualityDimensionKey;
  label: string;
  description: string;
  weight: number; // 0-1, all weights must sum to 1
  minPassScore: number; // minimum acceptable score (0-10)
}

export const QUALITY_DIMENSIONS: QualityDimension[] = [
  {
    key: "visualClarity",
    label: "Visual Clarity",
    description: "Sharpness, resolution, and absence of artifacts",
    weight: 0.12,
    minPassScore: 6.0,
  },
  {
    key: "characterConsistency",
    label: "Character Consistency",
    description: "Character appearance matches approved references",
    weight: 0.15,
    minPassScore: 7.0,
  },
  {
    key: "motionSmoothness",
    label: "Motion Smoothness",
    description: "Natural fluid movement without jitter or warping",
    weight: 0.12,
    minPassScore: 6.0,
  },
  {
    key: "promptAdherence",
    label: "Prompt Adherence",
    description: "How closely the output matches the generation prompt",
    weight: 0.12,
    minPassScore: 6.5,
  },
  {
    key: "colorGrading",
    label: "Color Grading",
    description: "Color palette consistency with channel style bible",
    weight: 0.08,
    minPassScore: 5.5,
  },
  {
    key: "composition",
    label: "Composition",
    description: "Framing, rule of thirds, visual balance",
    weight: 0.1,
    minPassScore: 6.0,
  },
  {
    key: "facialExpression",
    label: "Facial Expression",
    description: "Appropriate and natural facial expressions for the scene",
    weight: 0.1,
    minPassScore: 6.0,
  },
  {
    key: "lipSync",
    label: "Lip Sync",
    description: "Accuracy of lip movement to audio (for speaking scenes)",
    weight: 0.08,
    minPassScore: 6.0,
  },
  {
    key: "backgroundQuality",
    label: "Background Quality",
    description: "Background detail, coherence, and style match",
    weight: 0.06,
    minPassScore: 5.0,
  },
  {
    key: "lightingConsistency",
    label: "Lighting Consistency",
    description: "Consistent and appropriate lighting throughout the clip",
    weight: 0.04,
    minPassScore: 5.5,
  },
  {
    key: "overallImpact",
    label: "Overall Impact",
    description: "Emotional impact and viewer engagement potential",
    weight: 0.03,
    minPassScore: 6.0,
  },
];

export interface QualityScoreResult {
  dimensions: Partial<Record<QualityDimensionKey, number>>;
  weightedScore: number;
  passed: boolean;
  recommendation: "approve" | "revise" | "regenerate" | "reject";
  notes: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Content Pack (Module 4 output)
// ─────────────────────────────────────────────────────────────────────────────

export interface ContentPackScene {
  sequenceNumber: number;
  description: string;
  duration: number;
  modelAssigned: VideoModel;
  routingReason: string;
  cameraDirection: string;
  visualGuidance: string;
  prompt: string;
  characterIds: string[];
  generatedClipUrl?: string;
  clipStatus: "pending" | "generating" | "generated" | "approved" | "rejected";
  cost: number;
}

export interface ContentPackScript {
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
}

export interface ContentPack {
  id: string;
  channelId: string;
  channelName: string;
  ideaId: string;
  ideaTitle: string;
  script: ContentPackScript;
  scenes: ContentPackScene[];
  voiceoverUrl?: string;
  musicUrl?: string;
  thumbnailUrls: string[];
  selectedThumbnail?: string;
  finalVideoUrl?: string;
  totalCost: number;
  klingCost: number;
  veoCost: number;
  status:
    | "draft"
    | "scripted"
    | "scenes_generating"
    | "scenes_ready"
    | "voice_ready"
    | "assembling"
    | "quality_check"
    | "approved"
    | "publishing"
    | "published"
    | "failed";
  qualityScore?: QualityScoreResult;
  publishedAt?: Date;
  youtubeVideoId?: string;
  instagramPostId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Channel with relations (for dashboard use)
// ─────────────────────────────────────────────────────────────────────────────

export interface ChannelWithStats {
  id: string;
  name: string;
  niche: string;
  universe: UniverseKey;
  targetAudience: string;
  primaryPlatform: string;
  secondaryPlatform?: string | null;
  language: string;
  postingFrequency: string;
  contentPillars: string[];
  visualStyle: string;
  voiceStyle: string;
  monetizationPriority: number;
  status: string;
  defaultModelPref: string;
  maxBudgetPerVideo: number;
  maxBudgetPerWeek: number;
  subscriberCount: number;
  watchHoursTotal: number;
  shortsViewsTotal: number;
  uploadCadence: string;
  createdAt: Date;
  updatedAt: Date;
  // Computed stats
  totalIdeas: number;
  totalVideos: number;
  totalSpend: number;
  weeklySpend: number;
  lastPublishedAt?: Date | null;
  yppProgress: {
    earlyAccess: {
      subscribers: number;
      subscribersTarget: number;
      uploadsTarget: number;
      currentUploads: number;
      qualified: boolean;
    };
    fullAdRevenue: {
      subscribers: number;
      subscribersTarget: number;
      watchHours: number;
      watchHoursTarget: number;
      shortsViews: number;
      shortsViewsTarget: number;
      qualified: boolean;
    };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard summary
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalChannels: number;
  activeChannels: number;
  totalVideosPublished: number;
  totalVideosInProduction: number;
  totalIdeasDraft: number;
  weeklySpend: number;
  weeklyBudget: number;
  totalSubscribers: number;
  totalWatchHours: number;
  totalShortsViews: number;
  klingSpend: number;
  veoSpend: number;
  qualifiedForYPP: string[];
  nearYPPQualification: string[];
  recentWinners: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// API response wrappers
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form input types
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateChannelInput {
  name: string;
  niche: string;
  universe: UniverseKey;
  targetAudience: string;
  primaryPlatform: string;
  secondaryPlatform?: string;
  language?: string;
  postingFrequency: string;
  contentPillars: string[];
  visualStyle: string;
  voiceStyle: string;
  monetizationPriority?: number;
  formatStrategy?: string;
  repurposingRules?: string;
  defaultModelPref?: string;
  maxBudgetPerVideo?: number;
  maxBudgetPerWeek?: number;
}

export interface CreateIdeaInput {
  channelId: string;
  title: string;
  description: string;
  type: "topic" | "series" | "hook" | "trend" | "evergreen";
  format: string;
  tags?: string[];
  notes?: string;
  sourceUrl?: string;
}

export interface CreateScriptInput {
  channelId: string;
  ideaId?: string;
  title: string;
  hook: string;
  fullScript: string;
  narrationDraft?: string;
  formatVariant: string;
  musicMood: string;
  thumbnailConcepts: string[];
  titleOptions: string[];
  subtitleText?: string;
  description?: string;
  caption?: string;
}

export interface UpdateSceneInput {
  description?: string;
  duration?: number;
  modelAssigned?: VideoModel;
  routingReason?: string;
  cameraDirection?: string;
  visualGuidance?: string;
  prompt?: string;
  characterIds?: string[];
  status?: string;
}
