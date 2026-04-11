export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ─── Core 5 Ramayana Characters ───────────────────────────────────────────────
// visualReferences are injected verbatim into every scene prompt for consistency
const CHARACTERS = [
  {
    name: "Ram",
    nameHindi: "श्री राम",
    speciesOrType: "Divine Human",
    worldRole: "Protagonist — 7th avatar of Lord Vishnu, Prince of Ayodhya",
    personality: "मर्यादा पुरुषोत्तम — righteous, compassionate, brave, devoted to dharma and duty above all else",
    visualReferences: [
      "blue-luminescent divine skin radiating Vishnu's celestial light",
      "sharp noble Kshatriya features, long dark eyes filled with divine calm",
      "sacred janeu (yajnopavita) thread across bare chest",
      "golden tilak on forehead, divine tej (radiance) surrounding face and body",
      "Kodanda — golden divine bow held with perfect archer's grace",
      "quiver of luminous divine arrows on back",
    ],
    clothingRules:
      "Golden silk dhoti with intricate zari border reaching ankles. Jewelled Kshatriya mukut (crown) with peacock feather and divine gems. Bare consecrated feet — never footwear.",
    colorPalette: ["celestial blue", "hammered gold", "saffron", "ivory white"],
    restrictedChanges: [
      "skin tone always blue-luminescent — never dark brown or fair",
      "always barefoot — no footwear ever",
      "janeu thread always visible across chest",
      "always carries bow — even in non-combat scenes",
    ],
    samplePoses: [
      "standing in divine archer stance — bow drawn, eyes focused",
      "seated in padmasana in forest — meditative calm",
      "right hand in abhaya mudra — blessing devotees",
      "walking in forest with Sita on left, Lakshman behind",
    ],
    preferredModel: "kling-3.0",
    universeId: "A",
  },
  {
    name: "Sita",
    nameHindi: "सीता माँ",
    speciesOrType: "Divine Human",
    worldRole: "Protagonist — avatar of Goddess Lakshmi, daughter of King Janaka, wife of Ram",
    personality: "Pure, devoted, courageous, embodiment of divine feminine grace and unwavering faithfulness",
    visualReferences: [
      "golden-wheat complexion radiant as Goddess Lakshmi — luminous warm glow",
      "large gentle eyes, soft serene expression, compassionate divine grace",
      "dark hair in single braid adorned with jasmine flowers and gold ornaments",
      "delicate divine hands, slender graceful form",
      "maang tikka (forehead ornament), gold necklace, bangles, earrings",
    ],
    clothingRules:
      "Rich red Banarasi silk sari with wide gold zari border and pallu. Simple divine gold ornaments — no excess. Bare divine feet with alta (red dye). In Ashoka Vatika: same sari but slightly worn, no crown — only simple ornaments.",
    colorPalette: ["lotus red", "marigold gold", "lotus pink", "ivory"],
    restrictedChanges: [
      "complexion always golden-wheat — never too fair or too dark",
      "always wears red sari — her signature colour",
      "hair always in braid — never loose in public",
      "expression always serene — never angry or distressed even in captivity",
    ],
    samplePoses: [
      "standing beside Ram — slightly behind, hand near his arm",
      "seated under Ashoka tree in Ashoka Vatika — composed dignity",
      "hands in namaskara mudra — praying at sunrise",
      "picking flowers in Panchavati forest — peaceful joy",
    ],
    preferredModel: "kling-3.0",
    universeId: "A",
  },
  {
    name: "Hanuman",
    nameHindi: "हनुमान जी",
    speciesOrType: "Divine Vanara",
    worldRole: "Devotee and warrior — son of Vayu (Wind God), greatest devotee of Ram, commander of vanara sena",
    personality: "Boundless devotion to Ram, supreme strength with humility, fearless, witty, completely selfless",
    visualReferences: [
      "powerful saffron-tinted divine simian form — muscular vajra-hard body",
      "long tail with divine orange flame at tip curling upward",
      "broad chest bearing Ram's name written in devotional heart",
      "large devotional eyes filled with tears of Ram-bhakti",
      "divine orange-saffron aura glow surrounding body",
      "sacred janeu thread, white dhoti",
    ],
    clothingRules:
      "Simple white dhoti. Sacred janeu thread across chest. Golden gada (mace) held reverently in right hand. No crown — he is a devotee, not a king. In Lanka: same but with divine fire on tail.",
    colorPalette: ["saffron orange", "divine gold", "white", "red"],
    restrictedChanges: [
      "always saffron-tinted skin — never plain brown",
      "tail always present and curved upward with flame",
      "eyes always show devotion — teary or intensely focused on Ram",
      "gada (mace) always in hand or nearby",
    ],
    samplePoses: [
      "kneeling before Ram — hands folded, eyes tearful with bhakti",
      "flying through sky — tail blazing, carrying Dronagiri mountain",
      "sitting on wall in Lanka — observing below with wisdom",
      "chest torn open to reveal Ram and Sita in heart — divine gesture",
    ],
    preferredModel: "kling-3.0",
    universeId: "A",
  },
  {
    name: "Lakshman",
    nameHindi: "लक्ष्मण",
    speciesOrType: "Divine Human",
    worldRole: "Ram's devoted younger brother — protector and companion throughout the exile",
    personality: "Fiercely protective, loyal, quick-tempered in defense of Ram and Sita, ever-vigilant warrior",
    visualReferences: [
      "fair golden skin — slightly lighter than Ram, warm golden tone",
      "fierce younger brother's alert protective expression",
      "strong warrior build, ever-vigilant eyes scanning surroundings",
      "bow always strung and ready, quiver full of arrows on back",
      "sacred janeu thread across chest",
    ],
    clothingRules:
      "Saffron-yellow silk dhoti with simpler zari border than Ram. Lighter warrior crown — less ornate than Ram's. Bow always strung. Bare feet. In forest exile: simpler cloth, more warrior gear.",
    colorPalette: ["warm gold", "saffron yellow", "forest green", "ivory"],
    restrictedChanges: [
      "always has bow strung and ready — never unarmed",
      "expression always alert and watchful — never fully relaxed",
      "positioned slightly behind and to the right of Ram",
      "fair golden skin — distinguishable from Ram's blue tone",
    ],
    samplePoses: [
      "standing guard behind Ram and Sita — bow drawn, vigilant",
      "on one knee drawing Lakshman Rekha in ground — warning Sita",
      "in fierce battle stance — arrows nocked, fierce warrior eyes",
      "lying unconscious on battlefield — Sanjivani needed",
    ],
    preferredModel: "kling-3.0",
    universeId: "A",
  },
  {
    name: "Ravan",
    nameHindi: "रावण",
    speciesOrType: "Rakshasa",
    worldRole: "Antagonist — demon king of Lanka, greatest scholar and devotee of Shiva, abductor of Sita",
    personality: "Immensely learned, proud, powerful, consumed by ego and desire — a tragic antagonist of supreme intellect",
    visualReferences: [
      "imposing dark-gold complexion — powerful dark skin with golden divine sheen",
      "ten heads suggested by golden crown cluster — show 1-2 heads with shadows suggesting more, never cartoon multi-head",
      "massive powerful warrior form radiating supreme Lanka power",
      "golden armour with jewelled chest plate — Lanka's magnificence",
      "shown from profile or slightly behind — never full frontal face (adds mystery and menace)",
      "dark red aura of rakshasa power and pride",
    ],
    clothingRules:
      "Magnificent golden armour over dark red silk dhoti. Multiple jewelled crowns stacked or suggested. Heavy gold ornaments — rings, armlets, earrings — Lanka's wealth on display. Pushpaka vimana (divine chariot) nearby in aerial scenes.",
    colorPalette: ["dark crimson", "molten gold", "storm purple", "menacing black"],
    restrictedChanges: [
      "never show ten heads literally — suggest through shadows/crowns",
      "always shown from profile or 3/4 view — full face sparingly",
      "dark-gold complexion — never fully black or fully fair",
      "golden armour always present — he is always the king",
    ],
    samplePoses: [
      "seated on Lanka throne — back to viewer, 10 crowns radiating power",
      "in profile — looking at abducted Sita with desire and menace",
      "in battle — raising divine astra weapon toward sky",
      "bowing before Shiva's lingam — the scholar-devotee side",
    ],
    preferredModel: "kling-3.0",
    universeId: "A",
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const channelId = (body as Record<string, string>).channelId;

    // Find channel — use provided channelId or fall back to first channel
    let channel;
    if (channelId) {
      channel = await prisma.channel.findUnique({ where: { id: channelId } });
      if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    } else {
      channel = await prisma.channel.findFirst({ orderBy: { createdAt: "asc" } });
      if (!channel) return NextResponse.json({ error: "No channels found — create a channel first" }, { status: 400 });
    }

    let created = 0;
    let updated = 0;

    for (const char of CHARACTERS) {
      const existing = await prisma.character.findFirst({
        where: { name: char.name, channelId: channel.id },
      });

      if (existing) {
        await prisma.character.update({
          where: { id: existing.id },
          data: {
            visualReferences: char.visualReferences,
            clothingRules: char.clothingRules,
            colorPalette: char.colorPalette,
            restrictedChanges: char.restrictedChanges,
            samplePoses: char.samplePoses,
            worldRole: char.worldRole,
            personality: char.personality,
            speciesOrType: char.speciesOrType,
          },
        });
        updated++;
      } else {
        await prisma.character.create({
          data: {
            channelId: channel.id,
            name: char.name,
            speciesOrType: char.speciesOrType,
            worldRole: char.worldRole,
            personality: char.personality,
            clothingRules: char.clothingRules,
            preferredModel: char.preferredModel,
            universeId: char.universeId,
            colorPalette: char.colorPalette,
            visualReferences: char.visualReferences,
            restrictedChanges: char.restrictedChanges,
            samplePoses: char.samplePoses,
            approvedImages: [],
            approvedExpressions: [],
            seriesIds: [],
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      ok: true,
      channelId: channel.id,
      channelName: channel.name,
      created,
      updated,
      total: CHARACTERS.length,
    });
  } catch (error) {
    console.error("[POST seed/ramayana/characters]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
