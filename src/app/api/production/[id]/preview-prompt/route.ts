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

    let characters: Array<{ id: string; name: string; referencePrompt: string | null; clothingRules: string }> = [];
    let characterSource = 'none';

    if (sceneCharacterIds?.length) {
      characters = await prisma.character.findMany({
        where: { id: { in: sceneCharacterIds } },
        select: { id: true, name: true, referencePrompt: true, clothingRules: true },
      });
      characterSource = 'characterIds field';
    } else {
      const allChannelChars = await prisma.character.findMany({
        where: { channelId: video.channelId },
        select: { id: true, name: true, referencePrompt: true, clothingRules: true },
      });
      const sceneText = [
        scene.prompt, (scene as Record<string, unknown>).promptEn as string | undefined,
        scene.visualGuidance, scene.description,
        (scene as Record<string, unknown>).narrationText as string | undefined,
      ].filter(Boolean).join(' ').toLowerCase();

      const matched = allChannelChars.filter((c) => {
        const tokens = buildCharacterTokens(c.name);
        return tokens.some((t) => sceneText.includes(t));
      });
      characters = matched;
      characterSource = matched.length ? 'text-scan fallback' : 'none (no match found)';
    }

    // Build character guide
    let characterGuide = '';
    const characterParts: string[] = [];
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

    const rawCore = scene.prompt?.trim() || scene.visualGuidance?.trim() || scene.description?.trim() || '';
    const corePrompt = sanitisePrompt(rawCore);
    const camDir = scene.cameraDirection?.trim();
    const coreHasCamera = corePrompt.toLowerCase().includes('camera') || corePrompt.toLowerCase().includes('shot');
    const withCamera = camDir && !coreHasCamera ? `${corePrompt} Camera: ${camDir}.` : corePrompt;
    const coreForBudget = withCamera.length > 300 ? withCamera.slice(0, 300) + '...' : withCamera;

    const locationSentence = worldSetting ? worldSetting.split(/\.\s+/)[0].slice(0, 130) : '';
    const worldContext = locationSentence ? ` Setting: ${locationSentence}.` : '';

    const characterPrefix = characterGuide ? `${characterGuide.trim()} ` : '';
    const basePrompt = `${characterPrefix}${coreForBudget}${worldContext}`;
    const finalPrompt = basePrompt + QUALITY_SUFFIX;

    return NextResponse.json({
      sceneId,
      locationTag: locationTag ?? null,
      locationSource,
      characterSource,
      characters: characters.map((c) => c.name),
      budgetBreakdown: {
        characterGuide: characterGuide.length,
        corePrompt: coreForBudget.length,
        worldContext: worldContext.length,
        qualitySuffix: QUALITY_SUFFIX.length,
        total: finalPrompt.length,
      },
      characterDetails: characterParts,
      prompt: finalPrompt,
      promptParts: {
        characterPrefix: characterPrefix || '(empty — no characters matched)',
        coreForBudget,
        worldContext: worldContext || '(empty — no location found)',
        qualitySuffix: QUALITY_SUFFIX,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
