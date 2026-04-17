export const dynamic = "force-dynamic";
/**
 * GET /api/production/[id]/preview-prompt?sceneId=<id>
 *
 * Returns the exact FAL prompt that would be sent for a scene — without
 * spending any credits. Used for debugging prompt construction.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ─── Duplicate only the prompt-building logic from generate-scene ───────────

const QUALITY_SUFFIX =
  ', photorealistic live-action, Baahubali-quality, North Indian Nagara sandstone palace NOT Thai temple NOT Southeast Asian NOT Cambodian, 8K anamorphic, no cartoon, no CGI, no painting, no modern';

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

const BUILTIN_LOCATION_DESCS: Record<string, string> = {
  'Ayodhya': 'Ancient Treta Yuga Ayodhya — grand North Indian Nagara-style palace of carved sandstone and ivory marble, tall curved shikhara spires (NOT Thai spires, NOT Southeast Asian), saffron and crimson silk banners on carved lotus-medallion pillars, polished white marble courtyard reflecting warm golden divine light, Sarayu river ghats visible in background, atmosphere of divine prosperity.',
  'Mithila': 'Mithila palace courtyard — white marble inlaid with lotus-pink and marigold patterns, festive saffron-and-pink silk canopies, hundreds of oil lamps and flower garlands on every pillar, sacred Shiva-dhanu dais draped in gold cloth, air filled with marigold petals and incense, warm festival-golden lamp light.',
  'Dandaka Forest': 'Dandakaranya — primordial ancient forest of towering banyan and peepal trees, roots like cathedral arches, emerald canopy filtering amber god-ray shafts, blue-grey mist rolling between ancient trunks, dark earth carpeted with darbha grass, tribal fires visible through dense foliage, timeless Treta Yuga wilderness.',
  'Panchavati': 'Panchavati hermitage on Godavari river — golden-thatched parna-kutir leaf huts among five ancient banyan trees, Godavari flowing silver-blue with lotus blossoms, warm amber dappled forest-light, sacred tulsi plants and ash-grey deer grazing peacefully, divine forest serenity.',
  'Lanka': "Ravana's Lanka — massive golden fortress atop sheer mountain peak above dark churning ocean, walls of dark crimson-gold and black stone set with rubies and emeralds, storm-purple clouds wreathing towers, molten gold torchlight on polished dark stone floors, atmosphere of terrifying demon splendour.",
  'Ashoka Vatika': 'Ashoka Vatika — lush garden within Lanka walls, ancient ashoka trees with deep emerald canopy and red-orange flowers, pale full-moon silver light on white jasmine and lotus beds, stone pathways with flowering creepers, distant dark Lanka fortress walls visible beyond garden.',
  'Kishkindha': 'Kishkindha — Vanara kingdom carved into rust-red granite mountain faces above dense tropical forest, cave palace entrances flanked by ancient stone and vine, Rishyamukha mountain in background, saffron divine glow against cool rock-face.',
  'Battlefield Lanka': "Lanka's battlefield — churned grey ash and broken stone, fire columns rising to a crimson-and-smoke-purple sky, steel-blue divine light clashing with dark-gold demon fire, broken chariot wheels, smoke creating dramatic god-ray shafts, cosmic war between dharma and adharma.",
  'Ram Setu': "Ram Setu — miraculous bridge of floating white and grey sacred stones across deep sapphire ocean, Vanara army thousands strong moving across it, golden tropical sunlight blazing down, sea spray rising white against blue water, Ram's divine presence radiating blue-gold Vishnu light at the vanguard.",
  'Mahendra Mountain': 'Mahendra Mountain — sheer granite coastal cliff rising from churning ocean, sparse hardy vegetation on high-altitude grey rock, vast sapphire-blue ocean horizon, divine celestial wind swirling at peak, twilight purple-gold sky above the sea.',
  'Valmiki Ashram': 'Valmiki Ashram — peaceful forest hermitage of simple thatched huts and open-air meditation platforms under ancient shady trees, sacred dhuni fire glowing warm gold-orange at center, dusk-golden light shafts through green canopy, disciples in white performing sandhya vandana, atmosphere of absolute spiritual peace.',
  'Sarayu River': 'Sacred Sarayu river beside Ayodhya — broad slow-flowing crystal river reflecting the gold and ivory of Ayodhya palace spires in rippled shimmer, ancient stone ghats with carved divine motifs, oil lamps floating downstream, priests performing aarti creating golden fire reflections on dark water.',
};

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
  'jatayu':      ['जटायु'],
  'shabari':     ['शबरी', 'sabari'],
  'mandodari':   ['मंदोदरी', 'mandodhari'],
  'manthara':    ['मंथरा'],
  'bharat':      ['भरत', 'bharata'],
  'shatrughan':  ['शत्रुघ्न', 'shatrughna'],
  'angad':       ['अंगद', 'angada'],
  'jambavan':    ['जामवंत', 'jambavant'],
  'shurpanakha': ['शूर्पणखा', 'surpanakha'],
  'kumbhakarna': ['कुंभकर्ण', 'kumbhakaran'],
  'indrajit':    ['इंद्रजीत', 'meghnad', 'meghanad'],
  'vali':        ['वाली', 'bali'],
};

function buildCharacterTokens(dbName: string): string[] {
  const canonical = dbName.toLowerCase();
  const tokens = new Set<string>([canonical]);
  const aliases = RAMAYANA_NAME_ALIASES[canonical];
  if (aliases) aliases.forEach((a) => tokens.add(a.toLowerCase()));
  return [...tokens];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;
    const sceneId = request.nextUrl.searchParams.get('sceneId');
    if (!sceneId) {
      return NextResponse.json({ error: 'sceneId query param required' }, { status: 400 });
    }

    const [video, scene] = await Promise.all([
      prisma.video.findUnique({
        where: { id: videoId },
        select: { id: true, channelId: true, script: { select: { description: true } } },
      }),
      prisma.scene.findUnique({
        where: { id: sceneId },
        select: {
          id: true, duration: true, modelAssigned: true,
          prompt: true, promptEn: true, visualGuidance: true,
          description: true, cameraDirection: true,
          locationTag: true, characterIds: true, narrationText: true,
        },
      }),
    ]);

    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    if (!scene) return NextResponse.json({ error: 'Scene not found' }, { status: 404 });

    const sceneCharacterIds = (scene as Record<string, unknown>).characterIds as string[] | undefined;

    // Build full scene text for scanning
    const sceneText = [
      scene.prompt, (scene as Record<string, unknown>).promptEn as string | undefined,
      scene.visualGuidance, scene.description,
      (scene as Record<string, unknown>).narrationText as string | undefined,
    ].filter(Boolean).join(' ').toLowerCase();

    // Detect ALL Ramayana character names mentioned in scene text (whether in DB or not)
    const mentionedCanonicalNames: string[] = [];
    for (const [canonical, aliases] of Object.entries(RAMAYANA_NAME_ALIASES)) {
      const allTokens = [canonical, ...aliases];
      if (allTokens.some((t) => sceneText.includes(t.toLowerCase()))) {
        mentionedCanonicalNames.push(canonical);
      }
    }

    // Fetch all characters (by IDs if available, else by channel + text-scan)
    let characters: Array<{ id: string; name: string; referencePrompt: string | null; clothingRules: string; approvedImages: string[] }> = [];
    let characterSource = 'none';

    // Fetch all characters in DB (by sceneIds or by all channel chars)
    const allDbChars = sceneCharacterIds?.length
      ? await prisma.character.findMany({
          where: { id: { in: sceneCharacterIds } },
          select: { id: true, name: true, referencePrompt: true, clothingRules: true, approvedImages: true },
        })
      : await prisma.character.findMany({
          select: { id: true, name: true, referencePrompt: true, clothingRules: true, approvedImages: true },
        });

    if (sceneCharacterIds?.length) {
      characters = allDbChars;
      characterSource = 'characterIds field';
    } else {
      const matched = allDbChars.filter((c) => {
        const tokens = buildCharacterTokens(c.name);
        return tokens.some((t) => sceneText.includes(t));
      });
      characters = matched;
      characterSource = matched.length ? 'text-scan' : 'none';
    }

    // Build character previews: matched DB chars + mentioned-but-not-in-DB chars
    const matchedIds = new Set(characters.map((c) => c.id));

    // For mentioned names, find DB record (any channel)
    const mentionedPreviews = mentionedCanonicalNames.map((canonical) => {
      // Try to find in DB by canonical name or aliases
      const dbChar = allDbChars.find((c) => {
        const tokens = buildCharacterTokens(c.name);
        return tokens.some((t) => t === canonical || t === canonical.toLowerCase());
      }) ?? allDbChars.find((c) => c.name.toLowerCase() === canonical.toLowerCase());

      if (dbChar) {
        return {
          id: dbChar.id,
          name: dbChar.name,
          imageUrl: dbChar.approvedImages?.[0] ?? null,
          hasImage: (dbChar.approvedImages?.length ?? 0) > 0,
          inDb: true,
          isMatched: matchedIds.has(dbChar.id),
        };
      }
      // Not in DB at all
      const displayName = canonical.charAt(0).toUpperCase() + canonical.slice(1);
      return { id: null as string | null, name: displayName, imageUrl: null, hasImage: false, inDb: false, isMatched: false };
    });

    // Final character list for prompt building = DB-matched characters
    // Determine mode: image-mode if any matched DB character has an approved image
    const charWithImage = characters.find((c) => c.approvedImages?.length > 0);
    const characterRefImage = charWithImage?.approvedImages[0];
    const mode = characterRefImage ? 'image-mode' : 'text-mode';

    // Location
    const locationTag = (scene as Record<string, unknown>).locationTag as string | undefined;
    let lockedLocationDesc = '';
    let locationSource = 'none';
    if (locationTag) {
      const locAsset = await prisma.locationAsset.findUnique({ where: { name: locationTag } });
      if (locAsset?.lockedVisualDesc?.trim()) {
        lockedLocationDesc = locAsset.lockedVisualDesc.trim();
        locationSource = 'LocationAsset.lockedVisualDesc';
      }
      if (!lockedLocationDesc && BUILTIN_LOCATION_DESCS[locationTag]) {
        lockedLocationDesc = BUILTIN_LOCATION_DESCS[locationTag];
        locationSource = 'BUILTIN_LOCATION_DESCS';
      }
    }

    const worldSetting = lockedLocationDesc || video.script?.description?.trim() || '';
    if (!lockedLocationDesc && video.script?.description?.trim()) locationSource = 'script.description fallback';

    const locationSentence = worldSetting ? worldSetting.split(/\.\s+/)[0].slice(0, 130) : '';
    const worldContext = locationSentence ? ` Setting: ${locationSentence}.` : '';

    let basePrompt: string;
    let promptParts: Record<string, string>;

    if (characterRefImage) {
      // Image mode — use full scene visual prompt (not just the short title/description)
      const charName = charWithImage!.name;
      const rawScene = scene.prompt?.trim() || scene.visualGuidance?.trim() || scene.description?.trim() || '';
      const actionText = sanitisePrompt(rawScene).slice(0, 220);
      const camDir = scene.cameraDirection?.trim() || '';
      const motionCues = 'robes and hair gently flowing, subtle divine aura pulsing, natural breathing movement';
      const actionWithCam = camDir ? `${actionText}. ${camDir}. ${motionCues}` : `${actionText}. ${motionCues}`;
      basePrompt = `${charName} ${actionWithCam}${worldContext}`;
      promptParts = {
        mode: 'IMAGE MODE — appearance from reference image',
        referenceImage: characterRefImage,
        charName,
        action: actionWithCam,
        worldContext: worldContext || '(empty)',
        qualitySuffix: QUALITY_SUFFIX,
      };
    } else {
      // Text mode — compact appearance description in prompt
      const characterParts: string[] = [];
      let characterGuide = '';
      if (characters.length > 0) {
        const parts = characters.map((c) => {
          const pieces: string[] = [c.name];
          if (c.referencePrompt?.trim()) {
            const clean = sanitisePrompt(c.referencePrompt.trim());
            const firstSentence = clean.split(/[.,]\s+/)[0].slice(0, 160);
            pieces.push(firstSentence);
          }
          if (c.clothingRules?.trim()) pieces.push(sanitisePrompt(c.clothingRules.trim()).slice(0, 100));
          characterParts.push(`  ${c.name}: ${pieces.slice(1).join(' | ')}`);
          return pieces.join(', ');
        });
        characterGuide = `${parts.join(' | ')}. `;
      }

      const rawCore = scene.prompt?.trim() || scene.visualGuidance?.trim() || scene.description?.trim() || '';
      const corePrompt = sanitisePrompt(rawCore);
      const camDir = scene.cameraDirection?.trim();
      const coreHasCamera = corePrompt.toLowerCase().includes('camera') || corePrompt.toLowerCase().includes('shot');
      const withCamera = camDir && !coreHasCamera ? `${corePrompt} Camera: ${camDir}.` : corePrompt;
      const coreForBudget = withCamera.length > 300 ? withCamera.slice(0, 300) + '...' : withCamera;
      const characterPrefix = characterGuide ? `${characterGuide.trim()} ` : '';
      basePrompt = `${characterPrefix}${coreForBudget}${worldContext}`;
      promptParts = {
        mode: 'TEXT MODE — no approved character image found',
        characterPrefix: characterPrefix || '(empty — no characters matched)',
        coreForBudget,
        worldContext: worldContext || '(empty — no location found)',
        qualitySuffix: QUALITY_SUFFIX,
        characterDetails: characterParts.join('\n'),
      };
    }

    const finalPrompt = basePrompt + QUALITY_SUFFIX;

    // Gather location reference image for display
    let locationRefImage: string | null = null;
    if (locationTag) {
      const locAsset = await prisma.locationAsset.findUnique({
        where: { name: locationTag },
        select: { referenceImages: true },
      });
      locationRefImage = locAsset?.referenceImages?.[0] ?? null;
    }

    const readyToGenerate = mentionedPreviews.length === 0 || mentionedPreviews.some((c) => c.hasImage);
    const missingImages = mentionedPreviews.filter((c) => !c.hasImage);

    return NextResponse.json({
      sceneId,
      mode,
      readyToGenerate,
      locationTag: locationTag ?? null,
      locationRefImage,
      characterSource,
      characters: mentionedPreviews,
      missingImages,
      prompt: finalPrompt,
      promptLength: finalPrompt.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
