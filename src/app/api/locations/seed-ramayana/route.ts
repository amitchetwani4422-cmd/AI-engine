export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// All 12 canonical Ramayana locations with fully locked visual descriptions.
// lockedVisualDesc is injected VERBATIM into every scene prompt for that
// locationTag — so the AI cannot deviate from the visual identity.
// ─────────────────────────────────────────────────────────────────────────────
const RAMAYANA_LOCATIONS = [
  {
    name: "Ayodhya",
    nameHindi: "अयोध्या",
    description: "Capital of the Kosala kingdom — Ram's birthplace and the seat of the Raghu dynasty.",
    kandas: ["Bala", "Ayodhya", "Yuddha"],
    visualKeywords: "golden palace, ivory marble, Nagara architecture, saffron, temple, royal court",
    lockedVisualDesc: "Ancient Treta Yuga Ayodhya — grand Nagara-style palace complex of hammered gold and ivory marble, towering ornate shikhara spires catching eternal divine sunlight, saffron and crimson silk banners draping carved stone pillars, courtyard paved with polished white marble reflecting golden god-rays, sacred ghats of Sarayu river visible in background, atmosphere of divine prosperity and royal grandeur, warm volumetric saffron light flooding every surface.",
  },
  {
    name: "Mithila",
    nameHindi: "मिथिला",
    description: "Kingdom of Raja Janaka — birthplace of Sita and site of the Swayamvar.",
    kandas: ["Bala"],
    visualKeywords: "festival, white marble, marigold, celebration, lotus, Janaka palace",
    lockedVisualDesc: "Mithila's celestial palace courtyard — dazzling white marble inlaid with lotus-pink and marigold-gold patterns, festive silk canopies in celebration colors of saffron and pink, hundreds of oil lamps and flower garlands adorning every pillar, sacred Shiva-dhanu dais at center draped in gold cloth, air filled with marigold petals and sacred incense smoke, warm festival-golden light glowing from every lamp and torch, atmosphere of divine celebration and auspicious joy.",
  },
  {
    name: "Dandaka Forest",
    nameHindi: "दण्डकारण्य",
    description: "The ancient forest of exile — vast wilderness filled with sages and demons.",
    kandas: ["Aranya"],
    visualKeywords: "ancient forest, mist, dappled light, emerald, hermitage, exile",
    lockedVisualDesc: "Dandakaranya — primordial ancient forest of towering banyan and peepal trees with roots like cathedral arches, emerald-green canopy filtering god-ray shafts of amber-gold light, blue-grey mist rolling between ancient trunks, forest floor of dark earth carpeted with roots and sacred darbha grass, distant tribal fires visible through dense foliage, atmosphere of ancient spiritual danger and wilderness solitude, no modern elements, timeless Treta Yuga India.",
  },
  {
    name: "Panchavati",
    nameHindi: "पञ्चवटी",
    description: "Ram's forest hermitage on the Godavari — where Sita was abducted.",
    kandas: ["Aranya"],
    visualKeywords: "river, hermitage, golden thatch, lotus, peaceful, Godavari",
    lockedVisualDesc: "Panchavati hermitage on the sacred Godavari river — simple golden-thatched parna-kutir (leaf huts) surrounded by five ancient banyan trees, Godavari flowing silver-blue in background with lotus blossoms on still water, soft dappled forest-light falling on the kutir in warm amber shafts, sacred tulsi plants and flower offerings near the entrance, ash grey deer grazing peacefully, atmosphere of divine simplicity and forest serenity, pure Treta Yuga ancient India.",
  },
  {
    name: "Lanka",
    nameHindi: "लंका",
    description: "Ravana's golden island fortress — capital of the demon king.",
    kandas: ["Sundara", "Yuddha"],
    visualKeywords: "golden city, dark crimson, fortress walls, Lanka, demon palace, molten gold",
    lockedVisualDesc: "Ravana's Lanka — impossibly massive golden fortress city crowning a sheer mountain peak above dark churning ocean, palace walls of dark crimson-tinged gold and black stone inlaid with rubies and emeralds, storm-purple clouds perpetually wreathing the towers, molten gold light from thousands of torches reflecting on polished dark stone floors, architectural grandeur of menacing magnificence combining Treta Yuga demon opulence with dark celestial power, atmosphere of terrifying splendour.",
  },
  {
    name: "Ashoka Vatika",
    nameHindi: "अशोक वाटिका",
    description: "The garden of Ashoka trees in Lanka where Sita was held captive.",
    kandas: ["Sundara"],
    visualKeywords: "garden, lush emerald, moonlight, jasmine, silver, Sita captive",
    lockedVisualDesc: "Ashoka Vatika — lush divine garden within Lanka's fortress walls, ancient ashoka trees with deep emerald canopy and hanging red-orange flowers, pale full-moon silver light filtering through the leaves onto white jasmine and lotus beds below, Sita's gold presence creating warm divine contrast against cool moonlit silver-green, stone pathways lined with flowering creepers, distant Lanka fortress walls visible beyond the garden, atmosphere of divine grace imprisoned in demonic splendour.",
  },
  {
    name: "Kishkindha",
    nameHindi: "किष्किन्धा",
    description: "Mountain kingdom of the Vanara — home of Sugriva and Hanuman.",
    kandas: ["Kishkindha"],
    visualKeywords: "mountain cave, vanara, rust red rock, forest, Rishyamukha, monkey kingdom",
    lockedVisualDesc: "Kishkindha Vanara kingdom — carved into rust-red granite mountain faces rising above dense tropical forest, cave palace entrances flanked by ancient stone and vine, Rishyamukha mountain peak in background catching golden afternoon light, forest canopy of deep green stretching to jungle horizon, Hanuman's saffron divine presence creating warm glow against cool rock-face, atmosphere of ancient mountain power and Bhakti devotion, wild and sacred simultaneously.",
  },
  {
    name: "Battlefield Lanka",
    nameHindi: "लंका युद्धभूमि",
    description: "The great war at Lanka — climactic battle between Ram's army and Ravana's forces.",
    kandas: ["Yuddha"],
    visualKeywords: "battle, fire, smoke, war, crimson sky, weapons, devastation",
    lockedVisualDesc: "Lanka's apocalyptic battlefield — vast churned earth of smouldering grey ash and broken stone, fire columns rising to a crimson-and-smoke-purple sky, steel-blue divine light of Ram's army clashing with dark-gold fire of Lanka's forces, broken chariot wheels and abandoned weapons scattered across ground, battle smoke creating dramatic god-ray shafts through which divine warriors move, atmosphere of cosmic war between dharma and adharma, ancient Treta Yuga India's greatest conflict.",
  },
  {
    name: "Ram Setu",
    nameHindi: "राम सेतु",
    description: "The divine bridge of floating stones built across the ocean to Lanka.",
    kandas: ["Yuddha"],
    visualKeywords: "bridge, ocean, floating stones, sapphire sea, Vanara army, golden sunlight",
    lockedVisualDesc: "Ram Setu — miraculous bridge of floating white and grey sacred stones extending across deep sapphire ocean from India's southern coast toward Lanka, Vanara army thousands strong working and moving across the bridge in organized divine purpose, golden tropical sunlight blazing from above creating divine shimmer on the ocean surface, sea spray rising white against blue water, Ram's divine presence at the vanguard radiating blue-gold Vishnu light, atmosphere of divine will made manifest over impossible ocean.",
  },
  {
    name: "Mahendra Mountain",
    nameHindi: "महेन्द्र पर्वत",
    description: "The coastal mountain from which Hanuman leaped across the ocean to Lanka.",
    kandas: ["Sundara"],
    visualKeywords: "cliff, ocean, leap, Hanuman, coastal mountain, divine wind",
    lockedVisualDesc: "Mahendra Mountain coastal cliff — sheer granite precipice rising from churning deep ocean, high-altitude grey rock face with sparse hardy vegetation, vast sapphire-blue ocean horizon stretching to distant Lanka barely visible, divine celestial wind swirling around the mountain peak, twilight sky of purple-gold transition above the ocean, atmosphere of divine courage and impossible devotion at the threshold of the great leap, Hanuman's saffron glow against vast open sky and endless sea.",
  },
  {
    name: "Valmiki Ashram",
    nameHindi: "वाल्मीकि आश्रम",
    description: "The forest hermitage of Sage Valmiki — author of the Ramayana.",
    kandas: ["Bala", "Uttara"],
    visualKeywords: "ashram, forest hermitage, sage, peaceful, dusk gold, sacred fire",
    lockedVisualDesc: "Valmiki Ashram — peaceful forest hermitage of simple thatched huts and open-air meditation platforms under ancient shady trees, sacred dhuni (fire pit) glowing warm gold-orange at center, forest green canopy allowing shafts of dusk-golden light, sage-white and earth-tone simplicity of every structure, disciples in white performing sandhya vandana, Saraswati yantra patterns on swept earth, sounds of vedic chanting implied in the stillness, atmosphere of absolute spiritual peace and timeless wisdom.",
  },
  {
    name: "Sarayu River",
    nameHindi: "सरयू नदी",
    description: "The sacred river of Ayodhya flowing beside the golden city.",
    kandas: ["Bala", "Ayodhya", "Uttara"],
    visualKeywords: "river, ghats, golden reflection, Ayodhya, ghats steps, sacred bathing",
    lockedVisualDesc: "Sacred Sarayu river beside Ayodhya — broad slow-flowing river of crystal-clear water reflecting the gold and ivory of Ayodhya's palace spires in rippled golden shimmer, ancient stone ghats descending to water's edge with carved divine motifs, oil lamps floating downstream in dozens, priests performing morning aarti creating golden fire reflections on dark water, the eternal Ayodhya skyline of Nagara shikhara towers visible above the river bank, atmosphere of divine sacred river blessing the eternal city.",
  },
];

// POST /api/locations/seed-ramayana?channelId=xxx
// Upserts all 12 canonical Ramayana LocationAssets with locked visual descriptions.
// Pass channelId to pin these locations to a specific channel (recommended).
// Safe to call multiple times — uses upsert so existing data is updated, not duplicated.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as { channelId?: string };
    const channelId: string | null = body.channelId ?? null;

    const results = await Promise.all(
      RAMAYANA_LOCATIONS.map((loc) =>
        prisma.locationAsset.upsert({
          where: { name: loc.name },
          update: {
            channelId: channelId ?? undefined, // only update channelId if provided
            nameHindi: loc.nameHindi,
            description: loc.description,
            kandas: loc.kandas,
            visualKeywords: loc.visualKeywords,
            lockedVisualDesc: loc.lockedVisualDesc,
            isVisualLocked: true,
          },
          create: {
            channelId,
            name: loc.name,
            nameHindi: loc.nameHindi,
            description: loc.description,
            kandas: loc.kandas,
            referenceImages: [],
            visualKeywords: loc.visualKeywords,
            lockedVisualDesc: loc.lockedVisualDesc,
            isVisualLocked: true,
          },
        })
      )
    );

    return NextResponse.json({
      ok: true,
      seeded: results.length,
      locations: results.map((r) => ({
        name: r.name,
        hasReferenceImage: r.referenceImages.length > 0,
        isVisualLocked: r.isVisualLocked,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
