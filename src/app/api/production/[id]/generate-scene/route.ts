export const dynamic = "force-dynamic";
// Webhook approach — submits to FAL queue and returns immediately (<5s)
// No maxDuration needed; FAL calls our webhook when done.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fal } from '@fal-ai/client';
import prisma from '@/lib/prisma';
import { generateWithModel } from '@/lib/ai-provider';
import type { VideoModel } from '@/lib/fal';

fal.config({ credentials: process.env.FAL_KEY ?? process.env.FAL_API_KEY });

const FAL_MODEL_IDS: Record<string, string> = {
  'kling-3.0':   'fal-ai/kling-video/v1.6/pro/text-to-video',
  'veo-3.1':     'fal-ai/veo2',
  'ltx-video-2': 'fal-ai/ltx-video',
  'wan-2.1':     'fal-ai/wan-i2v/v2.1/1.3b',
};

const QUALITY_SUFFIX = ', photorealistic hyperrealistic ancient Indian epic, Baahubali-level cinematic quality, ultra-realistic 3D human characters with authentic skin texture and fabric simulation, volumetric divine golden light rays, cinematic depth of field, smooth 8K camera motion, no cartoon, no 2D animation, no flat illustration, no cel-shaded characters, no painted characters, no oil painting look, no Amar Chitra Katha style, no paper cutout effect, no modern elements, no western clothing';

// Painting phrases to strip from stored scene prompts — these cause Kling to generate 2D illustrated art
const PAINTING_PHRASES = [
  /ravi varma divine indian oil painting brought to life,?\s*/gi,
  /ravi varma[- ]inspired divine composition,?\s*/gi,
  /ravi varma[- ]inspired [a-z]+ composition,?\s*/gi,
  /divine indian oil painting brought to life,?\s*/gi,
  /oil painting brought to life,?\s*/gi,
  /painting brought to life,?\s*/gi,
  /ravi varma style,?\s*/gi,
];

function sanitisePrompt(raw: string): string {
  let out = raw;
  for (const re of PAINTING_PHRASES) out = out.replace(re, '');
  return out.replace(/\s{2,}/g, ' ').trim();
}

const GenerateSceneSchema = z.object({
  sceneId: z.string().min(1),
  stylePrefix: z.string().optional(),
  forceKling: z.boolean().optional(),
  modelOverride: z.string().optional(),
  feedback: z.string().optional(),
  promptOverride: z.string().optional(),
  forceRetranslate: z.boolean().optional(), // clear cached promptEn and re-translate from Hindi
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;
    const body = await request.json();
    const parsed = GenerateSceneSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const { sceneId, stylePrefix, forceKling, modelOverride, feedback, promptOverride, forceRetranslate } = parsed.data;

    if (!process.env.FAL_KEY && !process.env.FAL_API_KEY) {
      return NextResponse.json(
        { error: 'FAL_KEY not configured. Add FAL_KEY to your Vercel environment variables.' },
        { status: 500 }
      );
    }

    // Webhook URL is optional — if not set, FAL still processes the job and
    // the client will recover the result via polling + rescue-scene endpoint
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const [video, scene] = await Promise.all([
      prisma.video.findUnique({
        where: { id: videoId },
        include: { script: { select: { description: true } } }, // description = worldSetting
      }),
      prisma.scene.findUnique({ where: { id: sceneId }, select: { id: true, duration: true, modelAssigned: true, prompt: true, promptEn: true, visualGuidance: true, description: true, cameraDirection: true, locationTag: true } }),
    ]);

    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    if (!scene) return NextResponse.json({ error: 'Scene not found' }, { status: 404 });

    const model: VideoModel = forceKling ? 'kling-3.0' : ((modelOverride ?? scene.modelAssigned ?? 'ltx-video-2') as VideoModel);
    const usesEnPrompt = model === 'ltx-video-2' || model === 'wan-2.1';
    const durationSeconds = scene.duration ?? 5;

    // Look up location reference image for img2video
    const locationTag = (scene as Record<string, unknown>).locationTag as string | undefined;
    let locationRefImage: string | undefined;
    if (locationTag) {
      const locAsset = await prisma.locationAsset.findUnique({ where: { name: locationTag } });
      if (locAsset && locAsset.referenceImages.length > 0) {
        locationRefImage = locAsset.referenceImages[0];
      }
    }

    // World setting: shared background/environment description for visual consistency across all scenes
    const worldSetting = video.script?.description?.trim() ?? '';

    // Build prompt — combine all scene data for the richest possible input
    let basePrompt: string;
    if (promptOverride?.trim()) {
      basePrompt = promptOverride.trim();
    } else {
      // For LTX2/Wan: use English promptEn; auto-translate if missing
      let corePrompt: string;
      if (usesEnPrompt) {
        const promptEn = (scene as Record<string, unknown>).promptEn as string | undefined;
        if (promptEn?.trim() && !forceRetranslate) {
          corePrompt = sanitisePrompt(promptEn.trim());
        } else {
          // Auto-translate Hindi prompt to rich English for LTX2/Wan
          const hindiSource = scene.prompt?.trim() || scene.visualGuidance?.trim() || scene.description?.trim() || '';
          if (hindiSource) {
            try {
              const translated = await generateWithModel(
                'gpt-4o-mini',
                `You are an expert AI video prompt writer for ancient Indian mythological content (Ramayana, Mahabharata, Vedic epics).
Translate the following Hindi scene description into a vivid, detailed English video prompt for AI video generation models.
Your output MUST preserve ALL of the following details from the source:
1. CHARACTER: Exact character name + divine appearance (skin tone/glow, clothing, ornaments, crown, weapons, expression, body pose)
2. ACTION: The specific movement or action happening in the scene — emphasise motion and animation
3. SETTING: Exact location type (forest, palace, battlefield, ocean, celestial realm, cave, riverside, etc.)
4. ATMOSPHERE: Lighting quality (golden divine rays, moonlight, oil lamp glow, fire light, etc.) + mood + special effects (divine aura, sacred fire, mist, petals)
5. STYLE: ancient Treta Yuga India, Ravi Varma-inspired divine cinematic aesthetic, full motion video, no modern elements, no western clothing, NOT a painting or still image
Write 4-5 vivid English sentences. Do NOT summarise or abbreviate — preserve every character and visual detail.`,
                hindiSource,
                500
              );
              corePrompt = translated.trim();
              // Save back so we don't re-translate next time
              await prisma.scene.update({ where: { id: sceneId }, data: { promptEn: corePrompt } });
            } catch {
              corePrompt = hindiSource; // fallback to Hindi if translation fails
            }
          } else {
            corePrompt = '';
          }
        }
      } else {
        // Sanitise any stored "oil painting" language from older scripts before sending to FAL
        const rawCore = scene.prompt?.trim() || scene.visualGuidance?.trim() || scene.description?.trim() || '';
        corePrompt = sanitisePrompt(rawCore);
      }

      // Append cameraDirection if it adds info not already in the core prompt
      const camDir = scene.cameraDirection?.trim();
      const coreHasCamera = corePrompt.toLowerCase().includes('camera') || corePrompt.toLowerCase().includes('shot');
      const withCamera = camDir && !coreHasCamera
        ? `${corePrompt} Camera: ${camDir}.`
        : corePrompt;

      // Inject world setting for visual consistency — same for all models
      // Only add if the scene doesn't already reference the world in detail
      const worldContext = worldSetting && withCamera.length < 600
        ? ` Background world context: ${worldSetting}`
        : '';

      // Style prefix: weave it in naturally rather than prepending a tag dump
      const withStyle = stylePrefix?.trim()
        ? `${stylePrefix.replace(/,$/, '').trim()}, ${withCamera}${worldContext}`
        : `${withCamera}${worldContext}`;

      // Feedback: rephrase as a natural instruction rather than a bracketed note
      const feedbackSuffix = feedback?.trim()
        ? ` Adjust the scene so that: ${feedback.trim()}.`
        : '';

      basePrompt = withStyle + feedbackSuffix;
    }
    const prompt = basePrompt + QUALITY_SUFFIX;

    // Delete existing clips (regenerate case)
    await prisma.generatedClip.deleteMany({ where: { sceneId } });

    // Build FAL input — use img2video if location reference image exists
    const klingDuration = durationSeconds >= 8 ? '10' : '5';
    const negPrompt = 'watermark, logo, text overlay, subtitles, blurry, out of focus, low quality, compression artifacts, distorted faces, deformed hands, extra limbs, duplicate subjects, modern clothing, western outfit, suit, jeans, contemporary architecture, cars, phones, anachronistic props, ' +
      'cartoon, cartoon character, 2D animation, flat 2D character, cel-shaded, Amar Chitra Katha style, illustrated character, flat illustration, paper cutout effect, animated movie style, vector art, comic book, hand-drawn, oil painting look, painting texture, static painted image, digital painting, flat lighting on character, ' +
      'anime, 3D CGI plastic look, generic fantasy, european medieval, chinese dragon style';

    let falModelId = FAL_MODEL_IDS[model];
    let input: Record<string, unknown>;

    if (locationRefImage && model === 'kling-3.0') {
      falModelId = 'fal-ai/kling-video/v1.6/pro/image-to-video';
      input = { prompt, image_url: locationRefImage, duration: klingDuration, aspect_ratio: '16:9', negative_prompt: negPrompt, cfg_scale: 0.5 };
    } else if (locationRefImage && model === 'wan-2.1') {
      input = { prompt, image_url: locationRefImage, negative_prompt: negPrompt, num_frames: durationSeconds >= 8 ? 161 : 81, aspect_ratio: '16:9' };
    } else if (model === 'kling-3.0') {
      input = { prompt, duration: klingDuration, aspect_ratio: '16:9', negative_prompt: negPrompt, cfg_scale: 0.5 };
    } else if (model === 'ltx-video-2') {
      input = { prompt, negative_prompt: negPrompt, num_frames: durationSeconds >= 8 ? 161 : 97, aspect_ratio: '16:9' };
    } else if (model === 'wan-2.1') {
      input = { prompt, negative_prompt: negPrompt, num_frames: durationSeconds >= 8 ? 161 : 81, aspect_ratio: '16:9' };
    } else {
      input = { prompt, aspect_ratio: '16:9' }; // veo
    }

    // Submit to FAL queue — returns immediately with a request_id.
    // Webhook is optional: if NEXT_PUBLIC_APP_URL is set FAL calls us back automatically;
    // otherwise the client polls and rescue-scene fetches the result directly.
    const submitOptions: { input: typeof input; webhookUrl?: string } = { input };
    if (appUrl) submitOptions.webhookUrl = `${appUrl}/api/webhooks/fal`;

    const { request_id } = await fal.queue.submit(falModelId, submitOptions);

    // Save job with FAL request_id so webhook can look it up
    await prisma.generationJob.create({
      data: {
        type: 'video-scene',
        videoId,
        sceneId,
        model,
        status: 'pending',
        inputData: { prompt, duration: durationSeconds, model, falRequestId: request_id },
        retryCount: 0,
      },
    });

    await prisma.scene.update({ where: { id: sceneId }, data: { status: 'Generating' } });

    // Return immediately — webhook will save the clip when FAL finishes
    return NextResponse.json({ status: 'queued', requestId: request_id }, { status: 202 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('POST generate-scene error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
