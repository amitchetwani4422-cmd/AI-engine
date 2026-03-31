// ─────────────────────────────────────────────────────────────────────────────
// ElevenLabs voice generation client
// ─────────────────────────────────────────────────────────────────────────────

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

function getHeaders(includeContentType = true): HeadersInit {
  const headers: HeadersInit = {
    "xi-api-key": process.env.ELEVENLABS_API_KEY!,
  };
  if (includeContentType) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }
  return headers;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface GenerateVoiceParams {
  text: string;
  voiceId: string;
  emotion?: string;
  modelId?: string;
  voiceSettings?: VoiceSettings;
  outputFormat?: "mp3_44100_128" | "mp3_44100_192" | "pcm_24000" | "ulaw_8000";
}

export interface GenerateVoiceResult {
  audioBuffer: Buffer;
  mimeType: string;
  characterCount: number;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  description?: string;
  preview_url?: string;
  category?: string;
  labels?: Record<string, string>;
  available_for_tiers?: string[];
  settings?: VoiceSettings;
}

export interface ListVoicesResult {
  voices: ElevenLabsVoice[];
}

export interface CloneVoiceResult {
  voice_id: string;
  name: string;
  description?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Emotion to VoiceSettings mapper
// ─────────────────────────────────────────────────────────────────────────────

function emotionToVoiceSettings(emotion?: string): VoiceSettings {
  const base: VoiceSettings = {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
  };

  if (!emotion) return base;

  const emotionMap: Record<string, Partial<VoiceSettings>> = {
    epic: { stability: 0.3, similarity_boost: 0.8, style: 0.8 },
    calm: { stability: 0.85, similarity_boost: 0.7, style: 0.1 },
    excited: { stability: 0.25, similarity_boost: 0.85, style: 0.9 },
    sad: { stability: 0.7, similarity_boost: 0.65, style: 0.4 },
    angry: { stability: 0.2, similarity_boost: 0.9, style: 0.95 },
    devotional: { stability: 0.75, similarity_boost: 0.8, style: 0.3 },
    mysterious: { stability: 0.6, similarity_boost: 0.7, style: 0.5 },
    cheerful: { stability: 0.4, similarity_boost: 0.8, style: 0.7 },
    narration: { stability: 0.65, similarity_boost: 0.75, style: 0.2 },
    whispering: { stability: 0.9, similarity_boost: 0.6, style: 0.1 },
  };

  const lowerEmotion = emotion.toLowerCase();

  for (const [key, settings] of Object.entries(emotionMap)) {
    if (lowerEmotion.includes(key)) {
      return { ...base, ...settings };
    }
  }

  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
// generateVoice
// ─────────────────────────────────────────────────────────────────────────────

export async function generateVoice(
  text: string,
  voiceId: string,
  emotion?: string,
  options: Partial<GenerateVoiceParams> = {}
): Promise<GenerateVoiceResult> {
  const modelId = options.modelId ?? "eleven_multilingual_v2";
  const outputFormat = options.outputFormat ?? "mp3_44100_128";
  const voiceSettings = options.voiceSettings ?? emotionToVoiceSettings(emotion);

  const response = await fetch(
    `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}?output_format=${outputFormat}`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: voiceSettings,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `ElevenLabs voice generation failed (${response.status}): ${errorText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);

  const mimeType =
    outputFormat.startsWith("mp3") ? "audio/mpeg" : "audio/wav";

  return {
    audioBuffer,
    mimeType,
    characterCount: text.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// listVoices
// ─────────────────────────────────────────────────────────────────────────────

export async function listVoices(): Promise<ListVoicesResult> {
  const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
    method: "GET",
    headers: getHeaders(false),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Failed to list ElevenLabs voices (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as ListVoicesResult;
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// cloneVoice
// ─────────────────────────────────────────────────────────────────────────────

export async function cloneVoice(
  name: string,
  audioFiles: string[],
  description?: string,
  labels?: Record<string, string>
): Promise<CloneVoiceResult> {
  if (audioFiles.length === 0) {
    throw new Error("At least one audio file URL is required to clone a voice");
  }

  // Fetch all audio files and prepare FormData
  const formData = new FormData();
  formData.append("name", name);

  if (description) {
    formData.append("description", description);
  }

  if (labels) {
    formData.append("labels", JSON.stringify(labels));
  }

  // Download each audio file and append as blob
  const audioFetchPromises = audioFiles.map(async (fileUrl, index) => {
    const audioResponse = await fetch(fileUrl);
    if (!audioResponse.ok) {
      throw new Error(
        `Failed to fetch audio file at index ${index}: ${fileUrl}`
      );
    }
    const arrayBuffer = await audioResponse.arrayBuffer();
    const contentType =
      audioResponse.headers.get("content-type") ?? "audio/mpeg";
    const blob = new Blob([arrayBuffer], { type: contentType });
    const ext = contentType.includes("wav") ? "wav" : "mp3";
    formData.append("files", blob, `audio_${index}.${ext}`);
  });

  await Promise.all(audioFetchPromises);

  const response = await fetch(`${ELEVENLABS_BASE_URL}/voices/add`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      // Do NOT set Content-Type — let the browser/Node set it with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Failed to clone voice with ElevenLabs (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as { voice_id: string };

  return {
    voice_id: data.voice_id,
    name,
    description,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// deleteVoice
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteVoice(voiceId: string): Promise<void> {
  const response = await fetch(`${ELEVENLABS_BASE_URL}/voices/${voiceId}`, {
    method: "DELETE",
    headers: getHeaders(false),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Failed to delete ElevenLabs voice (${response.status}): ${errorText}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getVoice
// ─────────────────────────────────────────────────────────────────────────────

export async function getVoice(voiceId: string): Promise<ElevenLabsVoice> {
  const response = await fetch(`${ELEVENLABS_BASE_URL}/voices/${voiceId}`, {
    method: "GET",
    headers: getHeaders(false),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Failed to get ElevenLabs voice (${response.status}): ${errorText}`
    );
  }

  return (await response.json()) as ElevenLabsVoice;
}

// ─────────────────────────────────────────────────────────────────────────────
// getVoiceUsage — returns character count used this billing period
// ─────────────────────────────────────────────────────────────────────────────

export interface UserSubscription {
  character_count: number;
  character_limit: number;
  voice_limit: number;
  professional_voice_limit: number;
  can_extend_character_limit: boolean;
  next_character_reset_unix: number;
}

export async function getUserSubscription(): Promise<UserSubscription> {
  const response = await fetch(`${ELEVENLABS_BASE_URL}/user/subscription`, {
    method: "GET",
    headers: getHeaders(false),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Failed to get ElevenLabs subscription info (${response.status}): ${errorText}`
    );
  }

  return (await response.json()) as UserSubscription;
}
