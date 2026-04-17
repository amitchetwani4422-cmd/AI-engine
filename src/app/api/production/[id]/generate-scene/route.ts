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

// Kling v1.6 Pro sweet spot: 500–750 chars total. Keep quality suffix tight.
const QUALITY_SUFFIX = ', photorealistic live-action, Baahubali-quality, North Indian Nagara sandstone palace NOT Thai temple NOT Southeast Asian NOT Cambodian, 8K anamorphic, no cartoon, no CGI, no painting, no modern';

// Phrases to strip from any text before sending to FAL — cause painting/illustration style
const PAINTING_PHRASES = [
  /raja ravi varma divine indian oil painting( style)?,?\s*/gi,
  /raja ravi varma[- ]inspired [a-z]+ composition,?\s*/gi,
  /raja ravi varma style,?\s*/gi,
  /ravi varma divine indian oil painting brought to life,?\s*/gi,
  /ravi varma[- ]inspired divine composition,?\s*/gi,
  /ravi varma[- ]inspired [a-z]+ composition,?\s*/gi,
  /divine indian oil painting brought to life,?\s*/gi,
  /oil painting brought to life,?\s*/gi,
  /painting brought to life,?\s*/gi,
  /ravi varma style,?\s*/gi,
  /indian oil painting style,?\s*/gi,
  /oil painting style,?\s*/gi,
];

function sanitisePrompt(raw: string): string {
  let out = raw;
  for (const re of PAINTING_PHRASES) out = out.replace(re, '');
  return out.replace(/\s{2,}/g, ' ').trim();
}

// Builtin location descriptions used when LocationAssets have not been seeded.
// Ensures every scene with a known locationTag always gets a location lock,
// even before the user seeds the /locations page.
const BUILTIN_LOCATION_DESCS: Record<string, string> = {
  'Ayodhya': 'Ancient Treta Yuga Ayodhya — grand North Indian Nagara-style palace of carved sandstone and ivory marble, tall curved shikhara spires (NOT Thai spires, NOT Southeast Asian), saffron and crimson silk banners on carved lotus-medallion pillars, polished white marble courtyard reflecting warm golden divine light, Sarayu river ghats visible in background, atmosphere of divine prosperity.',
  'Mithila': 'Mithila palace courtyard — white marble inlaid with lotus-pink and marigold patterns, festive saffron-and-pink silk canopies, hundreds of oil lamps and flower garlands on every pillar, sacred Shiva-dhanu dais draped in gold cloth, air filled with marigold petals and incense, warm festival-golden lamp light.',
  'Dandaka Forest': 'Dandakaranya — primordial ancient forest of towering banyan and peepal trees, roots like cathedral arches, emerald canopy filtering amber god-ray shafts, blue-grey mist rolling between ancient trunks, dark earth carpeted with darbha grass, tribal fires visible through dense foliage, timeless Treta Yuga wilderness.',
  'Panchavati': 'Panchavati hermitage on Godavari river — golden-thatched parna-kutir leaf huts among five ancient banyan trees, Godavari flowing silver-blue with lotus blossoms, warm amber dappled forest-light, sacred tulsi plants and ash-grey deer grazing peacefully, divine forest serenity.',
  'Lanka': 'Ravana\'s Lanka — massive golden fortress atop sheer mountain peak above dark churning ocean, walls of dark crimson-gold and black stone set with rubies and emeralds, storm-purple clouds wreathing towers, molten gold torchlight on polished dark stone floors, atmosphere of terrifying demon splendour.',
  'Ashoka Vatika': 'Ashoka Vatika — lush garden within Lanka walls, ancient ashoka trees with deep emerald canopy and red-orange flowers, pale full-moon silver light on white jasmine and lotus beds, stone pathways with flowering creepers, distant dark Lanka fortress walls visible beyond garden.',
  'Kishkindha': 'Kishkindha — Vanara kingdom carved into rust-red granite mountain faces above dense tropical forest, cave palace entrances flanked by ancient stone and vine, Rishyamukha mountain in background, saffron divine glow against cool rock-face.',
  'Battlefield Lanka': 'Lanka\'s battlefield — churned grey ash and broken stone, fire columns rising to a crimson-and-smoke-purple sky, steel-blue divine light clashing with dark-gold demon fire, broken chariot wheels, smoke creating dramatic god-ray shafts, cosmic war between dharma and adharma.',
  'Ram Setu': 'Ram Setu — miraculous bridge of floating white and grey sacred stones across deep sapphire ocean, Vanara army thousands strong moving across it, golden tropical sunlight blazing down, sea spray rising white against blue water, Ram\'s divine presence radiating blue-gold Vishnu light at the vanguard.',
  'Mahendra Mountain': 'Mahendra Mountain — sheer granite coastal cliff rising from churning ocean, sparse hardy vegetation on high-altitude grey rock, vast sapphire-blue ocean horizon, divine celestial wind swirling at peak, twilight purple-gold sky above the sea.',
  'Valmiki Ashram': 'Valmiki Ashram — peaceful forest hermitage of simple thatched huts and open-air meditation platforms under ancient shady trees, sacred dhuni fire glowing warm gold-orange at center, dusk-golden light shafts through green canopy, disciples in white performing sandhya vandana, atmosphere of absolute spiritual peace.',
  'Sarayu River': 'Sacred Sarayu river beside Ayodhya — broad slow-flowing crystal river reflecting the gold and ivory of Ayodhya palace spires in rippled shimmer, ancient stone ghats with carved divine motifs, oil lamps floating downstream, priests performing aarti creating golden fire reflections on dark water.',
};

// Canonical Ramayana name → all recognised spelling/Hindi variants used in scene text.
// Handles: DB seed names, script AI output variants, Hindi Devanagari names.
const RAMAYANA_NAME_ALIASES: Record<string, string[]> = {
  'ram':         ['राम', 'श्री राम', 'shri ram', 'lord ram', 'rama'],
  'sita':        ['सीता', 'sita mata', 'janaki', 'maithili', 'vaidehi'],
  'hanuman':     ['हनुमान', 'bajrangbali', 'pawanputra', 'mahavir'],
  'lakshman':    ['लक्ष्मण', 'laxman', 'lakshmana', 'saumitra'],
  'ravan':       ['रावण', 'ravana', 'ravanan', 'dashanan', 'dashagriva'],
  'dasharath':   ['दशरथ', 'dasharatha', 'dashrath', 'king dasharath'],
  'kaushalya':   ['कौशल्या', 'kausalya'],
  'kaikeyi':     ['कैकेयी', 'kekeyi'],
  'vashishtha':  ['वशिष्ठ', 'vasishtha', 'vasistha', 'maharishi vashishtha', 'maharishi vasishtha', 'guru vashishtha'],
  'vishwamitra': ['विश्वामित्र', 'vishvamitra', 'maharishi vishwamitra'],
  'sugriva':     ['सुग्रीव', 'sugreeva'],
  'vibhishan':   ['विभीषण', 'vibhishana', 'vibheeshana'],
  'jatayu':      ['जटायु', 'jatayu'],
  'shabari':     ['शबरी', 'sabari'],
  'mandodari':   ['मंदोदरी', 'mandodhari'],
  'manthara':    ['मंथरा', 'manthara'],
  'bharat':      ['भरत', 'bharata'],
  'shatrughan':  ['शत्रुघ्न', 'shatrughna', 'shatrughnan'],
  'angad':       ['अंगद', 'angada'],
  'jambavan':    ['जामवंत', 'jambavant', 'jambavanta'],
  'shurpanakha': ['शूर्पणखा', 'surpanakha', 'shoorpanakha'],
  'kumbhakarna': ['कुंभकर्ण', 'kumbhakaran'],
  'indrajit':    ['इंद्रजीत', 'meghnad', 'meghnaad', 'meghanad'],
  'vali':        ['वाली', 'bali'],
};

/**
 * Returns all lowercase text tokens to search for a given character name.
 * Includes the canonical name, any known aliases, and common prefixes stripped.
 */
function buildCharacterTokens(dbName: string): string[] {
  const canonical = dbName.toLowerCase();
  const tokens = new Set<string>([canonical]);
  const aliases = RAMAYANA_NAME_ALIASES[canonical];
  if (aliases) aliases.forEach((a) => tokens.add(a.toLowerCase()));
  return [...tokens];
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
        select: { id: true, channelId: true, status: true, script: { select: { description: true } } },
      }),
      prisma.scene.findUnique({ where: { id: sceneId }, select: { id: true, duration: true, modelAssigned: true, prompt: true, promptEn: true, visualGuidance: true, description: true, cameraDirection: true, locationTag: true, characterIds: true, narrationText: true } }),
    ]);

    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    if (!scene) return NextResponse.json({ error: 'Scene not found' }, { status: 404 });

    const model: VideoModel = forceKling ? 'kling-3.0' : ((modelOverride ?? scene.modelAssigned ?? 'ltx-video-2') as VideoModel);
    const usesEnPrompt = model === 'ltx-video-2' || model === 'wan-2.1';
    const durationSeconds = scene.duration ?? 5;

    // Fetch character visual descriptions so they are injected into every prompt (including As-Is)
    const sceneCharacterIds = (scene as Record<string, unknown>).characterIds as string[] | undefined;

    let characters: Array<{ id: string; name: string; referencePrompt: string | null; personality: string; colorPalette: string[]; clothingRules: string; approvedImages: string[] }> = [];

    if (sceneCharacterIds?.length) {
      // New scenes: characterIds populated at script generation time
      characters = await prisma.character.findMany({
        where: { id: { in: sceneCharacterIds } },
        select: { id: true, name: true, referencePrompt: true, personality: true, colorPalette: true, clothingRules: true, approvedImages: true },
      });
    } else {
      // Fallback for scenes with empty characterIds: text-scan with alias matching.
      // Handles spelling variants (Vashishtha/Vasishtha) and Hindi names (वशिष्ठ/Vasishtha).
      // If the video's channel has no characters, search all channels — handles the common
      // case where Ramayana characters are seeded to one channel but videos are produced
      // under a different channel.
      let allChannelChars = await prisma.character.findMany({
        where: { channelId: video.channelId },
        select: { id: true, name: true, referencePrompt: true, personality: true, colorPalette: true, clothingRules: true, approvedImages: true },
      });
      if (allChannelChars.length === 0) {
        allChannelChars = await prisma.character.findMany({
          select: { id: true, name: true, referencePrompt: true, personality: true, colorPalette: true, clothingRules: true, approvedImages: true },
        });
      }

      const sceneText = [
        scene.prompt, scene.promptEn, scene.visualGuidance,
        scene.description, (scene as Record<string, unknown>).narrationText as string | undefined,
      ].filter(Boolean).join(' ').toLowerCase();

      // Build expanded match tokens for each character:
      // the canonical DB name + all known aliases (Hindi names, spelling variants)
      const matched = allChannelChars.filter((c) => {
        const tokens = buildCharacterTokens(c.name);
        return tokens.some((t) => sceneText.includes(t));
      });

      if (matched.length > 0) {
        characters = matched;
        // Persist so future regenerations skip the scan
        await prisma.scene.update({
          where: { id: sceneId },
          data: { characterIds: matched.map((c) => c.id) },
        });
      }
    }

    // ── PRE-GENERATION VALIDATION ────────────────────────────────────────────
    // Rule 1: If scene has explicit characterIds, verify every ID resolves in DB.
    // Bug 3 fix: auto-remove stale IDs instead of hard-blocking generation forever.
    if (sceneCharacterIds?.length) {
      const foundIds = new Set(characters.map((c) => c.id));
      const missingIds = sceneCharacterIds.filter((id) => !foundIds.has(id));
      if (missingIds.length > 0) {
        console.warn(`[generate-scene] Auto-removing ${missingIds.length} stale characterId(s) from scene ${sceneId}`);
        const cleanIds = sceneCharacterIds.filter((id) => foundIds.has(id));
        await prisma.scene.update({ where: { id: sceneId }, data: { characterIds: cleanIds } });
        // characters array already contains only resolved records — continue with those
      }
    }

    // Character portraits (approvedImages) are NOT used as i2v reference frames.
    // Sending a portrait as the starting frame produces a near-static video with no
    // background or scene context. Instead we always use text-to-video and inject the
    // full character visual description into the prompt so the model composes the full
    // scene (character + background + natural movement) from scratch.

    // Character guide injected into every text-to-video prompt.
    // LTX/Wan: full referencePrompt (long prompts accepted).
    // Kling: up to 250 chars per character — enough for appearance + clothing + key attribute,
    //        split evenly when multiple characters share a scene.
    let characterGuide = '';
    if (characters.length > 0) {
      // Kling total char budget ~750. Reserve 200 for scene core, 140 for worldContext+style,
      // 220 for QUALITY_SUFFIX → leaves ~190 chars for character guide across all chars.
      // LTX/Wan have no limit so use 600 total.
      const klingCharBudget = Math.floor((usesEnPrompt ? 600 : 190) / characters.length);
      const parts = characters.map((c) => {
        const pieces: string[] = [c.name];
        if (c.referencePrompt?.trim()) {
          const clean = sanitisePrompt(c.referencePrompt.trim());
          if (usesEnPrompt) {
            pieces.push(clean);
          } else {
            // Kling: use as much of the referencePrompt as the budget allows
            pieces.push(clean.slice(0, klingCharBudget));
          }
        }
        if (c.clothingRules?.trim()) pieces.push(sanitisePrompt(c.clothingRules.trim()).slice(0, 80));
        return pieces.join(', ');
      });
      characterGuide = `${parts.join(' | ')}. `;
    }

    // Look up location reference image AND locked visual description for img2video + prompt lock
    const locationTag = (scene as Record<string, unknown>).locationTag as string | undefined;
    let locationRefImage: string | undefined;
    let lockedLocationDesc = '';
    if (locationTag) {
      const locAsset = await prisma.locationAsset.findUnique({ where: { name: locationTag } });
      if (locAsset) {
        if (locAsset.referenceImages.length > 0) locationRefImage = locAsset.referenceImages[0];
        // Use lockedVisualDesc if it has content — regardless of isVisualLocked flag.
        // isVisualLocked is a UI approval state; the content is valid either way.
        if (locAsset.lockedVisualDesc?.trim()) {
          lockedLocationDesc = locAsset.lockedVisualDesc.trim();
        }
      }
      // Builtin fallback: if no LocationAsset seeded yet, use hardcoded description
      // so every known Ramayana location always has architecture context.
      if (!lockedLocationDesc && BUILTIN_LOCATION_DESCS[locationTag]) {
        lockedLocationDesc = BUILTIN_LOCATION_DESCS[locationTag];
      }
    }

    // World setting priority: locked location desc > builtin fallback > script worldSetting
    const worldSetting = lockedLocationDesc || video.script?.description?.trim() || '';

    // Shared location snippet used in both image-mode and text-mode prompts
    const locationSentence = worldSetting ? worldSetting.split(/\.\s+/)[0].slice(0, 130) : '';
    const worldContext = locationSentence ? ` Setting: ${locationSentence}.` : '';

    // Style / feedback clauses (same for both modes)
    const styleClause = stylePrefix?.trim() ? ` ${stylePrefix.replace(/,$/, '').trim()}.` : '';
    const feedbackSuffix = feedback?.trim() ? ` Adjust: ${feedback.trim()}.` : '';

    // Build prompt — always text-to-video.
    // Character appearance is injected via characterGuide (referencePrompt + clothingRules).
    // Location context is injected via worldContext / lockedLocationDesc.
    let basePrompt: string;
    if (promptOverride?.trim()) {
      basePrompt = promptOverride.trim();

    } else if (characterRefImage) {
      // ── IMAGE MODE ─────────────────────────────────────────────────────────
      // The character's approved image is the reference frame — appearance is fixed.
      // The prompt describes MOTION and WHERE using the full scene visual prompt.
      const charName = charWithImage!.name;
      const rawScene = scene.prompt?.trim() || scene.visualGuidance?.trim() || scene.description?.trim() || '';
      const actionText = sanitisePrompt(rawScene).slice(0, 220);
      const camDir = scene.cameraDirection?.trim() || 'smooth cinematic push-in';
      const motionCues = 'robes and hair gently flowing, subtle divine aura pulsing, natural breathing movement';
      basePrompt = `${charName} ${actionText}. ${camDir}. ${motionCues}.${worldContext}${styleClause}${feedbackSuffix}`;


    } else {
      // ── MODEL-SPECIFIC CORE PROMPT ─────────────────────────────────────────
      //
      // Kling: scene.prompt is already in English (written by the script builder).
      //   Use it directly. characterGuide (referencePrompt) is prepended separately.
      //   Cap scene core at 200 chars when characters present to stay in budget.
      //
      // LTX-Video 2 / Wan 2.1: use English promptEn which includes full scene
      //   description. Auto-translate from Hindi scene.prompt if not yet cached.
      //   No cap — these models handle long prompts well.
      let corePrompt: string;
      if (usesEnPrompt) {
        // LTX/Wan — English translation required
        const promptEn = (scene as Record<string, unknown>).promptEn as string | undefined;
        if (promptEn?.trim() && !forceRetranslate) {
          corePrompt = sanitisePrompt(promptEn.trim());
        } else {
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
5. STYLE: ancient Treta Yuga India, photorealistic live-action cinematic aesthetic (NOT a painting, NOT illustrated, NOT Ravi Varma style), full motion video with character movement, no modern elements, no western elements
Write 4-5 vivid English sentences. Do NOT summarise or abbreviate — preserve every character, action, and visual detail. Write as a cinematographer's shot description, not an art description.`,
                hindiSource,
                500
              );
              corePrompt = translated.trim();
              await prisma.scene.update({ where: { id: sceneId }, data: { promptEn: corePrompt } });
            } catch {
              corePrompt = hindiSource;
            }
          } else {
            corePrompt = '';
          }
        }
      } else {
        // Kling — use scene.prompt directly (already English from script generation)
        const rawCore = scene.prompt?.trim() || scene.visualGuidance?.trim() || scene.description?.trim() || '';
        corePrompt = sanitisePrompt(rawCore);
      }

      const camDir = scene.cameraDirection?.trim();
      const coreHasCamera = corePrompt.toLowerCase().includes('camera') || corePrompt.toLowerCase().includes('shot');
      const withCamera = camDir && !coreHasCamera ? `${corePrompt} Camera: ${camDir}.` : corePrompt;

      // Kling budget: characterGuide (~250 chars) + scene core + worldContext + QUALITY_SUFFIX
      // must stay near 750 chars total. Cap scene core to leave room for character guide.
      // LTX/Wan: no cap (long prompts accepted).
      const klingCoreCap = characters.length > 0 ? 200 : 300;
      const coreForBudget = (!usesEnPrompt && withCamera.length > klingCoreCap)
        ? withCamera.slice(0, klingCoreCap) + '...'
        : withCamera;

      const characterPrefix = characterGuide ? `${characterGuide.trim()} ` : '';
      basePrompt = `${characterPrefix}${coreForBudget}${worldContext}${styleClause}${feedbackSuffix}`;
    }
    const prompt = basePrompt + QUALITY_SUFFIX;

    // Delete existing clips (regenerate case)
    await prisma.generatedClip.deleteMany({ where: { sceneId } });

    // Build FAL input — use img2video if location reference image exists
    const klingDuration = durationSeconds >= 8 ? '10' : '5';
    // Comprehensive negative prompt — covers all known failure modes for Ramayana divine content
    const negPrompt =
      // Technical artifacts
      'text, watermark, subtitle, caption, logo, blurry, out of focus, low resolution, grainy, noisy, ' +
      // Face / body defects
      'distorted face, deformed face, ugly face, plastic face, mannequin face, uncanny valley, wax figure, ' +
      'smooth artificial skin, missing facial features, deformed hands, extra fingers, missing fingers, extra limbs, duplicate persons, cloned face, ' +
      // Wrong era / elements
      'modern clothing, western suit, jeans, t-shirt, sneakers, contemporary fashion, sunglasses, car, motorcycle, phone, electricity wires, modern architecture, concrete, ' +
      // Wrong art styles
      'cartoon, 2D animation, flat illustration, cel-shaded, Amar Chitra Katha, paper cutout, animated movie, Disney, Pixar, DreamWorks, vector art, comic book, manga, anime, chibi, hand-drawn sketch, storyboard, ' +
      // Wrong visual rendering — painting styles cause 2D art output
      'oil painting, watercolor painting, digital painting, painted look, painting texture, Raja Ravi Varma, illustration, concept art, book cover art, ' +
      // Wrong architecture — AI models frequently generate these for "ancient Asian palace"
      'Thai temple, Thai palace, Thai pagoda, Southeast Asian temple, Cambodian temple, Angkor Wat, Khmer architecture, ' +
      'orange curved terracotta roof tiles, Thai spire ornaments, pink-orange palace walls, Burmese pagoda, ' +
      'Chinese temple, Chinese architecture, Japanese pagoda, Japanese shrine, ' +
      'European medieval castle, Greek columns, Roman pillars, gothic arches, ' +
      // Wrong 3D / CGI styles
      'CGI render, Unreal Engine render, video game graphics, 3D game character, plastic sheen, Unity render, generic fantasy RPG, ' +
      // Generic / non-Indian fantasy
      'Hollywood superhero, generic fantasy warrior, western knight, viking, arabic palace, middle eastern dome';

    // cfg_scale 0.7 — strong prompt adherence critical for specific divine character/location visuals
    const klingCfg = 0.7;

    let falModelId = FAL_MODEL_IDS[model];
    let input: Record<string, unknown>;

    // Only use location reference image for i2v (gives proper scene background).
    // Character portraits are NOT used as i2v starting frames — they produce
    // near-static videos with no background. Character appearance is instead
    // injected via the text prompt (characterGuide from referencePrompt).
    const refImage = locationRefImage;

    if (refImage && model === 'kling-3.0') {
      falModelId = 'fal-ai/kling-video/v1.6/pro/image-to-video';
      input = { prompt, image_url: refImage, duration: klingDuration, aspect_ratio: '16:9', negative_prompt: negPrompt, cfg_scale: klingCfg };
    } else if (refImage && model === 'wan-2.1') {
      input = { prompt, image_url: refImage, negative_prompt: negPrompt, num_frames: durationSeconds >= 8 ? 161 : 81, aspect_ratio: '16:9' };
    } else if (model === 'kling-3.0') {
      input = { prompt, duration: klingDuration, aspect_ratio: '16:9', negative_prompt: negPrompt, cfg_scale: klingCfg };
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
        inputData: { prompt, duration: durationSeconds, model, falModelId, falRequestId: request_id },
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
