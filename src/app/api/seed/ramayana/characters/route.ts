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
    referencePrompt: "Lord Ram avatar of Vishnu, full body portrait, blue-luminescent celestial skin glowing with divine Vishnu light, noble sharp Kshatriya face with golden tilak and long dark calm eyes, jewelled peacock-feather mukut crown, golden silk dhoti with intricate zari border, sacred janeu thread across bare muscular chest, golden Kodanda divine bow held gracefully, quiver of divine arrows on back, bare consecrated feet, divine golden aura halo, ancient Nagara temple pillars background with warm saffron god rays, Raja Ravi Varma divine Indian oil painting style, cinematic 8K ultra-detailed, no modern elements, no western clothing, no anime, no cartoon",
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
    referencePrompt: "Goddess Sita Janaki full body portrait standing with divine grace, luminous golden-wheat complexion glowing with Lakshmi's warmth, large lotus-petal shaped dark eyes with serene compassionate expression, thick dark hair in single long braid adorned with fresh white jasmine garland and small gold pins, wearing rich deep RED pure silk Banarasi sari — the red is vivid and saturated not pink — with very wide heavy gold zari woven border along hem, silk pallu draped over left shoulder, gold maang tikka ornament in forehead hair parting, simple gold necklace with gem pendant, thin gold bangles on both wrists, small gold earrings, right hand gently holding a pink lotus flower, bare feet with red alta on soles, ancient Ayodhya palace interior with carved sandstone arched windows and soft warm golden afternoon light rays, garlands of marigold flowers, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, no modern clothing no western no anime no cartoon, NOT a generic Indian woman — divine goddess",
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
    referencePrompt: "Hanuman the vanara monkey deity, full body portrait standing tall and powerfully upright at full imposing height, MONKEY face: protruding simian muzzle, flat primate nose, wide monkey jaw, primate brow ridge, monkey ears — NOT a human face, red tilak mark on forehead, tall powerful muscular body covered in short warm saffron-orange monkey fur, long thick monkey tail curving behind him with bright orange flame ONLY at the very tip of the tail — NO fire on head NO burning hair, plain fur-covered head with NO flames, heavy golden gada cylindrical club-shaped mace gripped firmly in right hand — NOT a bow NOT a trident, sacred janeu thread across broad chest, white cotton dhoti around waist, gold bangles on wrists, large tearful devotional eyes looking upward toward sky, divine saffron-orange radiant aura glow around body, ancient stone Nagara temple hall background warm oil-lamp glow and stone pillars, Raja Ravi Varma divine Indian oil painting style Treta Yuga cinematic 8K ultra-detailed, tall imposing standing figure NOT small NOT crouching, young and powerful NOT old NOT bearded",
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
    referencePrompt: "Prince Lakshman Saumitra devoted warrior-brother of Ram, full body portrait in fierce protective warrior stance, fair warm golden-wheat skin completely WITHOUT blue tint — normal warm human skin — lean athletic young warrior body age 25, intensely alert dark eyes scanning surroundings with fierce brotherly protection, composite wooden bow strung taut and gripped in left hand with arrow already nocked ready to fire, full quiver of long feathered arrows over right shoulder, forehead tilak, simple jewelled warrior crown less ornate than Ram's, bright saffron-yellow silk dhoti with thin gold border, sacred janeu thread across bare chest, gold armlets on upper arms, bare feet planted firmly on ground, dense ancient forest background at golden-hour dusk with tall ashoka trees and warm amber god-rays piercing through leaves, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, FAIR SKIN not blue not dark, young man NOT old, no modern elements no anime no cartoon",
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
    referencePrompt: "King Ravan the rakshasa-king of Lanka, full body dramatic portrait from 3/4 side angle, ONE HEAD and ONE FACE ONLY shown — do not draw multiple heads, extremely powerful imposing massively muscular body, rich dark-brown complexion with warm golden sheen of supreme power, wearing magnificent full golden battle armour with ornate jewelled chest plate and large curved shoulder guards, single very large ornate golden crown on head studded with rubies and emeralds symbolising his kingship, extremely thick gold serpent armlets on upper arms, heavy gold rings on fingers, gold earrings, rich dark crimson silk dhoti lower garment, right arm raised holding a crackling dark energy astra weapon with purple-black lightning, expression of supreme pride arrogance and terrifying power, intense menacing dark eyes, dark crimson and deep storm-purple energy aura surrounding him like dark fire, grand Lanka palace background with black obsidian stone pillars golden torchlight and dramatic smoke and shadows, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, SINGLE FACE ONLY no multiple heads, powerful villain NOT comedy villain, no cartoon no anime no modern elements",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  // ─── Batch 2 ───────────────────────────────────────────────────────────────

  {
    name: "Dasharath",
    speciesOrType: "Human",
    worldRole: "King of Ayodhya — father of Ram, Bharat, Lakshman and Shatrughan",
    personality: "Noble, loving, tragic — a great emperor broken by his own boon to Kaikeyi; dies of grief after Ram's exile",
    visualReferences: [
      "elderly yet majestic king in his 60s — white mustache and beard, noble aged face",
      "deep sorrowful wise eyes filled with royal dignity and hidden grief",
      "bare chest with sacred janeu thread, strong aged Kshatriya body",
      "heavy jewelled Kosala royal crown with large central ruby",
      "multiple layers of thick gold necklaces and heavy gold armlets",
      "golden sceptre-staff held in right hand",
    ],
    clothingRules:
      "Magnificent deep burgundy-red silk royal dhoti with heavy gold zari border. Royal crown always worn. Heavy gold ornaments befitting emperor of Ayodhya. Bare feet.",
    colorPalette: ["deep burgundy", "hammered gold", "ivory white", "royal crimson"],
    restrictedChanges: [
      "always elderly — white beard and mustache, never shown young",
      "expression always carries weight of sorrow or regal burden",
      "crown always present — he is always the king",
      "never shown without royal attire",
    ],
    samplePoses: [
      "seated on Ayodhya throne — majestic but with sadness in eyes",
      "embracing Ram before exile — overcome with grief",
      "lying on royal bed dying of grief — torch-lit chamber",
      "conducting Ram's coronation yagna — fire and priests around",
    ],
    referencePrompt: "King Dasharath the great emperor of Ayodhya full body portrait, elderly yet majestic Kshatriya king in his 60s, noble aged face with full white mustache and white beard, deep sorrowful wise eyes filled with royal dignity, wearing magnificent deep burgundy-red silk royal dhoti with heavy gold zari border, elaborate jewelled Kosala royal crown with large central ruby and peacock feather, multiple layers of thick gold necklaces with large gems and heavy gold armlets on both arms, bare chest with sacred janeu thread, holding golden sceptre-staff in right hand, seated on ornate Ayodhya throne of carved sandstone, royal throne room background with tall stone pillars golden lamps and red silk curtains, warm amber royal court lighting, expression of majestic sorrow and regal burden, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, no modern elements, no western clothing, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Kaushalya",
    speciesOrType: "Human",
    worldRole: "First queen of Ayodhya — Ram's devoted mother, embodiment of maternal grace",
    personality: "Serene, deeply spiritual, accepts dharma even when it breaks her heart; strong inner faith sustains her through Ram's exile",
    visualReferences: [
      "dignified regal queen in her 50s — luminous warm golden complexion",
      "large gentle lotus-shaped eyes with serene maternal compassion",
      "dark hair with silver streaks in braided crown adorned with jasmine",
      "maang tikka, pearl necklace, delicate gold bangles",
      "hands often in namaskara mudra or holding oil lamp in puja",
      "cream-ivory silk sari with wide gold zari border",
    ],
    clothingRules:
      "Cream or ivory silk sari with wide gold zari border. Simple but rich queen's ornaments — pearl necklace, gold maang tikka, thin bangles. Red alta on bare feet. Always shown in prayer or blessing pose.",
    colorPalette: ["ivory cream", "lotus gold", "pearl white", "soft saffron"],
    restrictedChanges: [
      "complexion always warm golden — never too fair or too dark",
      "expression always serene and maternal — even in grief",
      "always wearing cream or ivory sari — her signature",
      "hair always neatly braided — never loose",
    ],
    samplePoses: [
      "morning puja — hands in namaskara before oil lamp and flowers",
      "blessing Ram before exile — hand on his head, tears on face",
      "seated in prayer chamber — deep meditation in grief",
      "welcoming Ram's return — joyful tears, open arms",
    ],
    referencePrompt: "Queen Kaushalya mother of Lord Ram full body portrait, dignified regal queen in her 50s, luminous warm golden complexion with serene maternal grace, large gentle lotus-shaped dark eyes, thick dark hair with silver streaks in elegant braided crown adorned with fresh white jasmine flowers, wearing beautiful cream-ivory pure silk Banarasi sari with very wide heavy gold zari woven border and gold pallu draped over left shoulder, rich red alta painted on bare feet, thin gold bangles on both wrists, pearl necklace with gold pendant, gold maang tikka in forehead parting, seated in morning puja prayer position with hands folded in namaskara mudra, small brass diya oil lamp and fresh marigold flowers placed before her on a carved stone floor, royal Ayodhya palace puja chamber background with carved sandstone arched windows soft golden morning light and sacred tulsi plant, expression of deep serene maternal devotion and quiet spiritual strength, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, no modern elements, no western clothing, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Kaikeyi",
    speciesOrType: "Human",
    worldRole: "Second queen of Ayodhya — Bharat's mother; her two boons cause Ram's exile; tragic figure consumed by pride",
    personality: "Beautiful, proud, once a great queen and warrior; manipulated by Manthara into betraying love with ambition — a tragic antagonist",
    visualReferences: [
      "beautiful proud queen in her 40s — warm golden complexion, sharp intelligent eyes",
      "expression of fierce royal resolve — determined, not soft",
      "ornate gold crown, heavy gold necklaces with large rubies",
      "rich deep saffron-orange Banarasi silk sari with wide gold border",
      "gold bangles on both arms, large gold earrings",
      "standing upright with posture of royal command",
    ],
    clothingRules:
      "Rich saffron-orange Banarasi silk sari — her signature colour of fire and determination. Heavy ornate gold crown. Heavy gold and ruby ornaments. Standing or seated with upright proud posture. Never in white (that is mourning).",
    colorPalette: ["saffron orange", "molten gold", "deep ruby red", "burnished copper"],
    restrictedChanges: [
      "always saffron or orange sari — never red (that is Sita's) or white (mourning)",
      "expression always determined and proud — rarely soft",
      "crown always present — she asserts her queenly status",
      "shown with Manthara nearby in political scenes",
    ],
    samplePoses: [
      "in kopa bhavan — seated on floor in proud grief demanding her boons",
      "confronting Dasharath — standing firm, eyes cold with resolve",
      "in regret — alone, realising the destruction she caused",
      "as warrior queen in flashback — on chariot helping Dasharath in battle",
    ],
    referencePrompt: "Queen Kaikeyi second queen of Ayodhya full body portrait, beautiful proud queen in her 40s, sharp intelligent eyes filled with fierce royal determination and pride, warm golden complexion, wearing rich deep saffron-orange Banarasi silk sari with very wide heavy gold border — the saffron is vibrant and saturated, elaborate gold crown with rubies, heavy layered gold necklaces with large ruby pendants, thick gold bangles on both wrists, large ornate gold earrings, standing in kopa bhavan the chamber of sorrow with arms crossed and upright proud posture, dark dramatic interior of royal chamber with single oil lamp casting long shadows, expression of fierce uncompromising royal resolve — not a villain smirking but a proud queen making a terrible choice, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, no modern elements, no western clothing, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Bharat",
    speciesOrType: "Human",
    worldRole: "Third prince of Ayodhya — Ram's devoted brother who refuses the throne and rules as regent wearing Ram's padukas",
    personality: "Pure, grief-stricken, utterly devoted to Ram — renounces all royal comfort and lives as an ascetic until Ram's return; the ideal of selfless brotherhood",
    visualReferences: [
      "young man in mid-20s, fair golden complexion similar to Lakshman",
      "face etched with deep grief and devotion, haunted eyes",
      "wearing rough bark-cloth or simple white ascetic dhoti — no royal robes",
      "no crown, no ornaments — only sacred janeu thread",
      "carrying Ram's golden padukas sandals reverently in both palms",
      "thin body from fasting and penance during 14-year wait",
    ],
    clothingRules:
      "Simple rough bark-cloth dhoti or plain white cotton — never royal silk. No crown, no gold ornaments except sacred janeu. Carries Ram's padukas at all times. Bare feet. Thin ascetic bearing.",
    colorPalette: ["bark brown", "plain white", "ash grey", "pale gold of Ram's padukas"],
    restrictedChanges: [
      "never in royal robes or crown — he renounced them",
      "always carrying or near Ram's golden padukas",
      "expression always grief and devotion — never joy until Ram returns",
      "thin ascetic body — shows 14 years of self-imposed penance",
    ],
    samplePoses: [
      "kneeling at Nandigram — holding Ram's padukas above his head",
      "seated in hermitage hut — ruling in Ram's name as regent",
      "pleading with Ram at Chitrakoot — begging him to return",
      "overjoyed reunion with Ram at Ayodhya — tears streaming down face",
    ],
    referencePrompt: "Prince Bharat the devoted brother of Ram full body portrait in ascetic renunciation, young man in mid-20s, fair warm golden complexion similar to Lakshman, deeply sorrowful eyes etched with guilt devotion and grief, lean body from 14 years of fasting and penance, wearing rough simple bark-cloth brown dhoti like an ascetic forest hermit — NOT royal silk, bare chest with only sacred janeu thread — no gold necklaces no crown no ornaments, carrying Lord Ram's sacred golden padukas sandals reverently held aloft in both palms with utmost care and devotion, kneeling on bare forest ground of Nandigram outside Ayodhya, simple forest hermitage hut background with small sacred fire and forest trees, expression of profound grief self-punishment and unwavering devotion — he believes himself responsible for Ram's exile, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, ASCETIC APPEARANCE no royal clothing, no modern elements, no western clothing, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Vibhishan",
    speciesOrType: "Rakshasa",
    worldRole: "Ravan's righteous younger brother — defects to Ram's side, crowned king of Lanka after Ravan's defeat",
    personality: "Principled, dharmic, courageous in speaking truth to power; chose righteousness over family loyalty — the voice of dharma in Ravan's court",
    visualReferences: [
      "lean dark-complexioned rakshasa with noble dignified features unlike other demons",
      "Vishnu tilak on forehead — white vertical lines with red dot (his divine allegiance)",
      "rudraksha mala around neck, simple sacred thread",
      "wearing white cotton dhoti and saffron uttariya shawl — NOT gold armour",
      "holding small brass kamandal and lotus flower",
      "half standing in divine light, half in Lanka's shadow — the inner conflict resolved",
    ],
    clothingRules:
      "Simple white dhoti and saffron shawl — righteously renounced Lanka's opulence. Vishnu tilak always on forehead. Rudraksha mala. No battle armour, no golden Lankan jewels. Carries kamandal.",
    colorPalette: ["pure white", "saffron", "deep brown skin", "gold of tilak"],
    restrictedChanges: [
      "always Vishnu tilak on forehead — his defining mark of allegiance",
      "always simple white/saffron clothing — never Lanka gold armour",
      "dark skin but with dignified noble expression — not demonic face",
      "expression always calm and righteous — never menacing",
    ],
    samplePoses: [
      "standing before Ram's army — surrendering and seeking refuge",
      "arguing dharma in Ravan's court — brave and alone",
      "being crowned king of Lanka — after Ravan's fall",
      "beside Ram in battle — guiding strategy with folded hands",
    ],
    referencePrompt: "Vibhishan the righteous rakshasa brother of Ravan full body portrait, lean dark-complexioned rakshasa with noble dignified features unlike typical demons, wearing simple pure white cotton dhoti and saffron uttariya shawl draped over left shoulder — NOT gold armour NOT Lanka royal clothing, sacred Vishnu tilak on forehead — white vertical lines with central red dot mark of Vaishnavism, rudraksha mala beads around neck, holding small brass kamandal water pot in one hand and single pink lotus flower in other hand, gentle but firm expression of righteous dharmic resolve and inner peace, standing at the boundary of Lanka where dark palace shadows give way to divine golden light streaming from Ram's direction — half lit by divine gold half still in Lanka shadow, slight dark rakshasa skin tone but face radiating noble spiritual peace, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, NOBLE DIGNIFIED face not monstrous, Vishnu tilak clearly visible, no modern elements, no anime, no cartoon",
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
            referencePrompt: char.referencePrompt,
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
            referencePrompt: char.referencePrompt,
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
