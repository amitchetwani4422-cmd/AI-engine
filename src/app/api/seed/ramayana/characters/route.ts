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

  // ─── Batch 3 ───────────────────────────────────────────────────────────────

  {
    name: "Shatrughan",
    speciesOrType: "Human",
    worldRole: "Youngest prince of Ayodhya — Bharat's devoted companion, later conquers Madhura",
    personality: "Fiercely loyal, mirrors Bharat as Lakshman mirrors Ram; speaks less but acts decisively; cheerful youngest brother",
    visualReferences: [
      "youngest brother in early 20s, fair warm complexion close to Lakshman's",
      "bright alert eyes, eager youthful expression — the youngest, always energetic",
      "always positioned beside or slightly behind Bharat",
      "bow strung and quiver on back, simpler crown than Ram's",
      "sacred janeu thread across bare chest",
      "saffron-yellow silk dhoti with thin gold border",
    ],
    clothingRules:
      "Saffron-yellow silk dhoti with thin gold border. Simple warrior crown — least ornate of the four brothers. Bow always present. Bare feet. Slightly less armour than Lakshman.",
    colorPalette: ["saffron yellow", "warm gold", "ivory", "forest green"],
    restrictedChanges: [
      "always beside Bharat — their bond mirrors Ram-Lakshman",
      "youngest face — no beard, smooth youthful features",
      "simpler crown than all three elder brothers",
      "fair skin — distinguishable from Ram's blue and slightly lighter than Lakshman",
    ],
    samplePoses: [
      "standing loyally behind Bharat at Nandigram",
      "in battle stance guarding Bharat's right flank",
      "greeting returning Ram at Ayodhya — joyful youngest brother",
      "marching with bow raised in coronation procession",
    ],
    referencePrompt: "Prince Shatrughan youngest brother of Ram full body portrait, eager loyal young warrior in his early 20s, smooth youthful face without beard — the youngest prince, fair warm golden-wheat complexion slightly lighter than Lakshman, bright alert eyes filled with youthful energy and fierce loyalty, wearing saffron-yellow silk dhoti with thin gold border, simple warrior crown — the least ornate of the four brothers, composite wooden bow gripped in left hand arrow nocked and ready, full quiver of feathered arrows over right shoulder, sacred janeu thread across bare muscular chest, small forehead tilak, thin gold armlets on upper arms, bare feet, standing alert guard position slightly behind and to the right in loyalty formation, Ayodhya palace courtyard background at golden hour with carved stone columns and marigold garland decorations, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, YOUNGEST BROTHER smooth youthful face, FAIR skin not blue, no modern elements, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Vishwamitra",
    speciesOrType: "Divine Human — Brahmarishi",
    worldRole: "Royal sage who trains Ram and Lakshman — teaches them Bala-Atibala mantras and divine astras",
    personality: "Fierce spiritual power, former king turned supreme sage; intense, demanding, uncompromising — pushes Ram beyond limits; earned brahmarishi status through iron will",
    visualReferences: [
      "powerful sage in his 60s — lean muscular body from years of severe tapas",
      "tall imposing frame, matted brown-grey hair piled high in jata mukut",
      "sacred white ash vibhuti marks on forehead and arms",
      "piercing eyes like burning coals — spiritual warrior energy",
      "saffron orange cotton dhoti only, no upper garment",
      "holding tall kamandal and kush grass; divine fire tapas aura in orange-gold",
    ],
    clothingRules:
      "Single saffron dhoti — no upper garment. Sacred ash marks on forehead and arms. Matted jata hair. Holds kamandal (water pot) and kush grass. No ornaments — renounced all of that. Walks barefoot with commanding stride.",
    colorPalette: ["saffron orange", "ash white", "forest brown", "fire gold"],
    restrictedChanges: [
      "always bare-chested — no upper garment like other sages",
      "matted jata hair — never loose or neatly combed",
      "expression always fierce and commanding — never gentle",
      "ash marks always on forehead — his tapas mark",
    ],
    samplePoses: [
      "striding forward with Ram and Lakshman flanking him — purpose-filled march",
      "arms raised calling divine astra — teaching Ram celestial weapons",
      "standing before Dasharath demanding Ram — uncompromising",
      "seated in ashram — fire kund blazing during yajna",
    ],
    referencePrompt: "Sage Vishwamitra the brahmarishi royal-sage full body portrait standing tall, powerful commanding sage in his 60s with intense spiritual warrior energy, lean strong body with visible muscles from years of severe tapas penance, tall imposing frame, matted brown-grey hair piled high in elaborate jata mukut ascetic hair crown, three horizontal sacred white ash vibhuti marks on broad forehead and ash lines on arms, piercing eyes like burning spiritual coals radiating immense tapas power, wearing only a single saffron orange cotton dhoti around waist — bare chest and arms, holding tall brass kamandal water pot in right hand and bundle of sacred kush grass in left, divine saffron-orange tapas fire energy aura radiating from his body, striding forward with commanding purposeful posture, dense ancient forest ashram background with large banyan tree roots and small yajna fire kund glowing in background, warm fire-light on his face, expression of fierce uncompromising spiritual authority, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, POWERFUL SAGE bare chest, no modern elements, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Sugriva",
    speciesOrType: "Divine Vanara",
    worldRole: "King of Kishkindha — ally of Ram, commands the vanara sena that builds the bridge to Lanka",
    personality: "Cunning, grateful, kingly — suffered exile and humiliation under Vali; restored to power by Ram; repays the debt with his entire army and kingdom",
    visualReferences: [
      "monkey face with simian features — protruding muzzle, flat primate nose",
      "golden-tawny brown monkey fur, stocky powerful vanara king build",
      "royal crown of Kishkindha — more ornate than ordinary vanaras",
      "gold necklace and armlets — kingly vanara bearing",
      "seated on stone throne or standing with royal authority",
      "mace or sword — king's weapon, not just boulders like soldiers",
    ],
    clothingRules:
      "Rich gold silk dhoti. Ornate Kishkindha crown. Gold necklace and armlets. Royal bearing very distinct from Hanuman's devotee posture — Sugriva is a king. Carries a sword or mace.",
    colorPalette: ["golden tawny", "royal gold", "deep saffron", "forest green"],
    restrictedChanges: [
      "always monkey face — never human face",
      "always crown — he is the king, always in royal attire",
      "golden-tawny fur — different from Hanuman's saffron-orange",
      "expression kingly and commanding — not devotional like Hanuman",
    ],
    samplePoses: [
      "seated on Kishkindha stone throne — commanding vanara generals",
      "standing with Ram on Rishyamukha mountain — alliance formed",
      "leading vanara army — mace raised, thousands of vanaras behind",
      "pointing toward Lanka across the ocean — giving orders",
    ],
    referencePrompt: "King Sugriva the vanara king of Kishkindha full body portrait, MONKEY face with clear simian features — protruding muzzle flat primate nose wide jaw round monkey skull, golden-tawny brown monkey fur covering stocky powerfully built royal body, wearing rich gold silk dhoti with heavy gold border, elaborate Kishkindha royal crown of hammered gold with gems — more ornate than common vanaras showing his kingship, thick gold necklace with large pendant across broad chest, heavy gold armlets on upper arms, holding a gleaming golden sword in right hand as a king's weapon, seated on ancient carved stone throne of Rishyamukha mountain or standing in commanding royal posture, expression of kingly authority confidence and gratitude — he owes Ram everything, dense Kishkindha forest background with tall trees and mountain stone, dappled forest golden light, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, MONKEY face NOT human, KINGLY bearing distinct from Hanuman, no modern elements, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Jatayu",
    speciesOrType: "Divine Eagle — son of Aruna",
    worldRole: "King of vultures — fights Ravan to protect Sita; mortally wounded; tells Ram about Sita's abduction before dying",
    personality: "Fearlessly selfless — an old eagle who fought a god-king alone to protect dharma; dies in service of Ram; represents ultimate sacrifice and loyalty",
    visualReferences: [
      "massive magnificent eagle with huge wing span — golden-brown body",
      "white feathered regal head of an elder eagle, sharp intelligent divine eyes",
      "powerful curved beak and sharp talons gripping stone or earth",
      "battle wounds on one wing from fighting Ravan — blood on wing tip",
      "standing with supreme courage and dignity despite mortal wounds",
      "divine golden light around him — sacred dying warrior",
    ],
    clothingRules:
      "No clothing — pure eagle form. Show wounds on one wing as marks of sacrifice. Divine golden glow around body. Ancient dignified eagle posture even in death. Never shown flying — always grounded, mortally wounded.",
    colorPalette: ["golden brown", "white", "dark mahogany", "blood crimson"],
    restrictedChanges: [
      "always eagle form — never human or hybrid",
      "always showing battle wounds — that is his defining moment",
      "large ancient eagle — not a small bird, massive divine creature",
      "expression of sacrifice and dignity — never fear",
    ],
    samplePoses: [
      "lying on forest ground — dying, neck raised to give Ram his last message",
      "wings spread in battle — fighting Ravan's chariot mid-air",
      "Ram cradling dying Jatayu — Ram weeping over his fallen friend",
      "standing wounded but proud — refusing to fall until Ram arrives",
    ],
    referencePrompt: "Jatayu the divine eagle son of Aruna full body portrait, massive magnificent ancient eagle the size of a small hill, golden-brown eagle body with large powerful wings, noble white-feathered elder eagle head with sharp intelligent divine eyes filled with sacrifice and courage, heavy curved golden beak, powerful scaled talons gripping the Panchavati forest ground, battle wounds clearly visible on right wing — feathers torn and blood on wing tip from fighting Ravan single-handedly to protect Sita, lying with one wing spread and neck raised upright toward Ram with last remaining strength, body radiating divine golden light of a sacred dying warrior, dense ancient Panchavati forest background with large trees and dramatic shafts of golden afternoon light piercing through canopy, expression of supreme selfless sacrifice and dignity — no fear only devotion, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, GIANT EAGLE bird form NOT human, battle wounds visible, no modern elements, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Shabari",
    speciesOrType: "Human — forest tribal bhakta",
    worldRole: "Devoted forest ascetic woman — waits decades for Ram; offers him tasted berries; receives moksha from Ram's visit",
    personality: "Purest unconditional devotion — an untouchable tribal woman whose bhakti transcends all caste and form; simple, selfless, childlike love for Ram",
    visualReferences: [
      "very old tribal woman with deeply wrinkled dark complexion and white hair",
      "small hunched frail frame — decades of forest penance",
      "simple rough earth-toned brown sari of coarse cloth, barefoot",
      "glass bead necklace, red bangles — simple tribal ornaments",
      "leaf plate of forest berries before her — each one tasted with pure love",
      "tears of joy streaming down aged face — Ram has finally come",
    ],
    clothingRules:
      "Rough coarse brown/dark cloth sari — no silk, no gold. Simple glass or wooden bead necklace. Bare feet. White hair, wrinkled face. Leaf-woven plate of berries always present in her scene.",
    colorPalette: ["earth brown", "forest green", "deep ochre", "warm amber"],
    restrictedChanges: [
      "always very old — white hair, wrinkled face, frail body",
      "always in rough tribal cloth — never silk or fine fabric",
      "always with leaf plate of berries in hand or before her",
      "expression of purest joy and childlike devotion — not sad",
    ],
    samplePoses: [
      "offering berries to Ram with trembling outstretched hands — tears of joy",
      "seated outside her ashram hut — eyes searching the forest path for Ram",
      "tasting a berry carefully — making sure it is sweet enough for Ram",
      "prostrating at Ram's feet — receiving his divine touch and moksha",
    ],
    referencePrompt: "Shabari the devoted old tribal forest woman full body portrait, very old woman with deeply wrinkled dark complexion, thin white hair pulled back simply, small frail hunched body from decades of forest penance, wearing simple rough coarse dark earth-brown cloth sari — NOT silk NOT fine fabric, string of simple wooden beads around neck, red glass bangles on thin wrists, bare feet with forest earth on soles, seated on simple forest ground outside a small thatched forest hermitage hut, holding out a large fresh green leaf woven into a bowl filled with ripe forest berries — she has lovingly tasted each one to select only the sweetest for Ram, tears of pure joy and decades of patient devotion streaming down her aged deeply wrinkled face, hands trembling slightly with age and emotion, ancient forest ashram background with large old banyan tree roots moss-covered stones and dappled golden forest light, divine golden beam of light descending from above touching her in blessing, expression of the purest most childlike selfless devotion and fulfilled joy, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, VERY OLD TRIBAL WOMAN not young, no modern elements, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  // ─── Batch 4 ───────────────────────────────────────────────────────────────

  {
    name: "Angad",
    speciesOrType: "Divine Vanara",
    worldRole: "Son of Vali, vanara prince — Ram's ambassador to Ravan's court, deputy commander of vanara sena",
    personality: "Fiercely proud, fierce warrior energy barely held in check; grieves for his father Vali yet serves Ram with honour; bold enough to plant his foot in Ravan's court and dare all Lanka to lift it",
    visualReferences: [
      "young powerful vanara in prime — MONKEY face with fierce proud simian features",
      "reddish-gold fur covering athletic muscular body — younger and leaner than Sugriva",
      "wearing his father Vali's golden armlets on both upper arms — tribute to Vali",
      "saffron-orange silk dhoti, no royal crown — a prince not yet a king",
      "expression of fierce young warrior pride — daring anyone to challenge him",
      "foot planted firmly on ground — the famous Sabha scene in Lanka",
    ],
    clothingRules:
      "Saffron-orange dhoti. Vali's golden armlets always on upper arms — his most defining accessory. No crown. Lean athletic vanara build. Barefoot. Carries a heavy stone or tree trunk as weapon.",
    colorPalette: ["reddish gold", "saffron orange", "burnished gold", "forest brown"],
    restrictedChanges: [
      "always monkey face — never human",
      "Vali's golden armlets always on upper arms — never removed",
      "no crown — he is a prince not a king",
      "younger and leaner than Sugriva — distinct body type",
    ],
    samplePoses: [
      "foot planted in Ravan's sabha — daring all of Lanka to move it",
      "leaping across the ocean with the vanara sena",
      "kneeling before Ram accepting his role as ambassador",
      "fighting in Lanka with boulder raised above his head",
    ],
    referencePrompt: "Prince Angad son of Vali vanara warrior-prince full body portrait, young powerfully built vanara in his prime, MONKEY face with fierce proud simian features — protruding muzzle strong jaw primate brow, reddish-gold fur covering lean athletic muscular body, younger and leaner than Sugriva, wearing simple saffron-orange silk dhoti, his father Vali's thick golden armlets on both upper arms — these are his most important accessories showing filial tribute, no crown — a prince not yet a king, holding a massive boulder raised in one hand as weapon, right foot planted firmly and defiantly on the stone floor of Lanka's royal court, expression of fierce burning young warrior pride — daring all of Lanka to challenge him, grand Lanka palace court background with dark obsidian columns gold torches and Ravan's throne visible in background, dramatic torchlighting casting his shadow long across the floor, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, MONKEY face YOUNG LEAN warrior, Vali's golden armlets clearly visible, no modern elements, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Kumbhakarna",
    speciesOrType: "Rakshasa",
    worldRole: "Ravan's giant brother — sleeps for six months, wakes to eat; reluctantly fights for Ravan despite knowing it is adharma",
    personality: "Enormous, gluttonous, but not without honour — knows Ravan is wrong, says so directly, then fights anyway out of family loyalty; a tragic giant with integrity",
    visualReferences: [
      "absolutely massive giant demon — dwarfs everything around him",
      "dark mahogany-brown rocky rough skin texture, enormous bald head",
      "small heavy-lidded eyes just waking from long sleep — still groggy",
      "massive arms like tree trunks, barrel chest wide as a house",
      "simple enormous dark red rough cloth around giant waist",
      "colossal spiked iron club or uprooted tree as weapon",
    ],
    clothingRules:
      "Only a massive rough dark-red cloth wrapped around the giant waist. No crown, no armour — he is too massive for ornaments. Always shown at enormous scale with tiny soldiers at his feet to convey size. Half-awake expression.",
    colorPalette: ["dark mahogany", "deep crimson", "iron grey", "storm black"],
    restrictedChanges: [
      "always enormous — soldiers and buildings must look tiny beside him",
      "always half-awake — heavy-lidded sleepy eyes even in battle",
      "no crown, no armour — the giant needs none",
      "dark rough rocky skin — not smooth, textured like stone",
    ],
    samplePoses: [
      "rising from sleep — enormous body filling the frame, vanaras fleeing below",
      "striding into battle — foot crushing the ground, army parting before him",
      "swatting vanaras like flies — horrifying scale difference",
      "mortally wounded but still standing — the tragic giant refuses to fall",
    ],
    referencePrompt: "Kumbhakarna the giant rakshasa brother of Ravan full body portrait, absolutely massive giant demon body that fills the entire frame, show enormous inhuman scale — tiny vanara soldiers visible at his feet and ankles to show terrifying size, dark mahogany-brown rough rocky skin texture like weathered stone, enormous bald round head with small heavy-lidded eyes still drowsy from being forcibly awakened, massive wide flat nose, enormous mouth, barrel chest wider than a palace wall, arms like the trunks of ancient trees, wearing only a single massive rough dark crimson cloth wrapped around giant waist, carrying a colossal spiked iron club the size of a ship's mast, smoke and dust rising from ground as he walks, Lanka fortress background with walls and towers looking small beside him, dramatic battle smoke and fire in background, expression of reluctant dangerous power — knows he is going to his death but goes anyway with grim dignity, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, MASSIVE GIANT scale everything else tiny, HALF-AWAKE heavy eyes, no modern elements, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Indrajit",
    speciesOrType: "Rakshasa",
    worldRole: "Ravan's son, greatest warrior of Lanka — defeated Indra himself; uses maya and dark astras; killed by Lakshman",
    personality: "Supreme arrogance backed by genuine power — the most dangerous warrior in Lanka; fights with dark magic and illusion; proud son who truly believes in Lanka's invincibility",
    visualReferences: [
      "dark indigo-black complexion with supernatural glow — young demon prince",
      "fierce intense eyes radiating dark demonic power and supreme confidence",
      "magnificent black and gold Lanka battle armour with supernatural engravings",
      "large ornate black crown with gold trim — Lanka's crown prince",
      "crackling dark Brahmastra energy weapon in one hand — black-purple lightning",
      "dark purple-black invincibility aura surrounding entire body",
    ],
    clothingRules:
      "Full black and gold battle armour — always armoured, always in war mode. Black crown with gold. Dark crimson silk dhoti beneath armour. Always holding or conjuring a dark supernatural weapon. Dark energy aura mandatory.",
    colorPalette: ["midnight black", "dark gold", "storm purple", "blood crimson"],
    restrictedChanges: [
      "always in full battle armour — never shown unarmed or unarmoured",
      "always young — not middle-aged like Ravan, he is the son",
      "dark indigo-black skin — darker than Ravan",
      "always dark energy aura — his supernatural power is his defining trait",
    ],
    samplePoses: [
      "firing Nagastra serpent weapon — coils of dark energy from drawn bow",
      "invisible attack — dark form barely seen through supernatural concealment",
      "standing over unconscious Lakshman — moment of apparent victory",
      "final battle with Lakshman — both unleashing divine weapons",
    ],
    referencePrompt: "Indrajit the son of Ravan crown prince of Lanka full body portrait, supremely powerful young demon warrior, dark indigo-black complexion with supernatural sheen of invincibility, fierce intense eyes blazing with dark demonic confidence and pride, wearing magnificent full black battle armour with ornate gold engravings and supernatural protective runes across chest plate, large ornate black crown with heavy gold trim and single large dark ruby at centre, thick black-gold armlets and gold rings on fingers, dark crimson silk dhoti visible beneath armour hem, right hand holding crackling dark energy weapon — a black serpentine astra with purple-black electricity arcing from it, left hand raised in commanding dark mudra, entire body surrounded by supernatural dark purple-black invincibility aura like black fire, Lanka palace rooftop battle background with dark storm clouds rolling in from ocean, dramatic contrast of gold torchlight and darkness, expression of supreme arrogance and lethal power — the most dangerous warrior alive, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, YOUNG DARK WARRIOR full armour, dark energy aura always present, no modern elements, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Mandodari",
    speciesOrType: "Human — queen of Lanka",
    worldRole: "Ravan's devoted queen — daughter of Maya; most beautiful woman of her age; repeatedly pleads with Ravan to return Sita",
    personality: "Noble, tragic, deeply wise — she sees Ravan's destruction coming and begs him to stop; loves him despite his flaw; a devoted wife to a flawed great man",
    visualReferences: [
      "extraordinarily beautiful queen with luminous warm complexion",
      "large sorrowful compassionate eyes — she knows tragedy is coming",
      "elaborate crown of gold and deep rubies in dark hair",
      "rich deep purple-crimson Banarasi silk sari with very wide gold border",
      "heavy layered gold necklaces with rubies — Lanka's queen wears its wealth",
      "one hand on heart — her grief and love expressed in gesture",
    ],
    clothingRules:
      "Rich deep purple-crimson silk sari with wide gold border — Lanka's regal colours. Heavy gold-and-ruby ornaments. Elaborate crown. Always dignified and regal. Expression of grief and nobility, never demonic.",
    colorPalette: ["deep purple-crimson", "molten gold", "dark ruby red", "midnight blue"],
    restrictedChanges: [
      "always beautiful and dignified — NOT a demon-faced woman",
      "always in grief — she knows what is coming",
      "purple-crimson sari — her distinct colour from Sita's red",
      "heavy ruby-gold ornaments — Lanka's queen wears its wealth",
    ],
    samplePoses: [
      "pleading with Ravan — hands clasped, tears in eyes",
      "standing alone on Lanka's highest tower — watching the battle",
      "weeping over Ravan's body after his fall",
      "seated on Lanka throne beside Ravan — regal but sorrowful",
    ],
    referencePrompt: "Queen Mandodari the devoted queen of Lanka full body portrait, extraordinarily beautiful regal woman with luminous warm golden complexion, large dark sorrowful compassionate eyes carrying the weight of knowing tragedy is inevitable, thick lustrous dark black hair adorned with large ornate crown of heavy gold and deep red rubies, wearing rich deep purple-crimson pure silk Banarasi sari — the colour distinct from Sita's red, with very wide heavy gold zari woven border and gold pallu draped elegantly, multiple heavy layered gold necklaces with large ruby pendants and emerald accents, thick gold bangles, large gold drop earrings with rubies, one hand pressed gently on her heart in a gesture of grief and devotion, standing on a high terrace of Lanka palace with dark obsidian stone walls and golden torches, vast ocean visible behind, expression of profound noble grief — beautiful but heartbroken, NOT demonic NOT monstrous but regal and tragic, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, BEAUTIFUL DIGNIFIED QUEEN not demon, no modern elements, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Manthara",
    speciesOrType: "Human",
    worldRole: "Kaikeyi's hunchbacked maidservant — poisons Kaikeyi's mind against Ram; catalyst of the entire Ramayana exile",
    personality: "Cunning, bitter, jealous — her twisted form mirrors her twisted mind; driven by fear of losing status when Ram becomes king; destroys Ayodhya's happiness with whispers",
    visualReferences: [
      "elderly dark-complexioned woman with pronounced hunchback clearly visible",
      "narrow calculating eyes with scheming bitter expression and cunning smile",
      "wrinkled face, wiry grey hair pulled tightly back",
      "simple dark indigo-blue servant sari — minimal border",
      "walking stick in one hand, other hand gesturing conspiratorially",
      "dramatic shadow cast across her hunched form",
    ],
    clothingRules:
      "Dark indigo or dark grey servant sari — simple, minimal. No gold, only basic nose ring and bangles. Walking stick always present. Hunched posture must always be visible — never shown standing straight.",
    colorPalette: ["dark indigo", "iron grey", "shadow black", "tarnished bronze"],
    restrictedChanges: [
      "hunchback always clearly visible — it defines her silhouette",
      "always dark servant clothing — never royal",
      "expression always scheming or bitter — never kind",
      "walking stick always in hand",
    ],
    samplePoses: [
      "whispering in Kaikeyi's ear — the moment of corruption",
      "gesturing dramatically in Kaikeyi's chamber — spinning her scheme",
      "watching Ram's exile procession with dark satisfaction",
      "alone in shadows — the architect of tragedy",
    ],
    referencePrompt: "Manthara the scheming hunchbacked maidservant of Kaikeyi full body portrait, elderly dark-complexioned woman with clearly pronounced visible hunchback deformity — her silhouette is unmistakably bent, narrow calculating eyes with bitter cunning expression and slight scheming smile showing crooked teeth, deeply wrinkled face, wiry grey hair pulled tightly back in a severe bun, wearing a simple dark indigo-blue cotton servant sari with almost no border ornamentation, plain small gold nose ring, thin basic bangles, hobbling with a gnarled wooden walking stick gripped in right hand, left hand raised with one finger pointing gesturing dramatically as she whispers her scheme, walking through a dark royal Ayodhya corridor with stone arch columns and oil lamps casting long dramatic shadows, her hunched shadow looming large and sinister on the wall behind her, expression of scheming bitter triumph — the catalyst of Lanka's destruction in miniature form, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, HUNCHBACK clearly visible, DARK SERVANT clothing, no modern elements, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  // ─── Batch 5 ───────────────────────────────────────────────────────────────

  {
    name: "Vashishtha",
    speciesOrType: "Human — Brahmarishi",
    worldRole: "Royal guru of the Ikshvaku dynasty — spiritual preceptor of Dasharath and Ram; performed coronations and sacred rites",
    personality: "Infinite calm, supreme wisdom, unshakeable spiritual authority — the still centre around which Ayodhya revolves; his serenity is more powerful than any weapon",
    visualReferences: [
      "ancient sage in his 70s — long white flowing hair and white beard",
      "serene face radiating infinite wisdom and compassion",
      "pure white dhoti, sacred janeu thread, rudraksha mala",
      "holding rudraksha mala in right hand, brass kamandal in left",
      "seated on tiger skin in meditation or standing in blessing pose",
      "divine white-silver light aura of highest brahmarishi energy",
    ],
    clothingRules:
      "Pure white dhoti only — no upper garment. Long white matted or flowing hair and beard. Rudraksha mala always around neck. Kamandal in hand. Tiger skin seat in meditation scenes. White-silver aura.",
    colorPalette: ["pure white", "silver", "pale gold", "ash grey"],
    restrictedChanges: [
      "always white clothing and white hair — never saffron like Vishwamitra",
      "always calm serene expression — never fierce or angry",
      "white aura — distinct from Vishwamitra's fire-orange energy",
      "seated or standing still — never shown in motion or battle",
    ],
    samplePoses: [
      "blessing Ram at coronation — hand raised over Ram's bowed head",
      "seated in deep meditation — lotus pose on tiger skin",
      "counselling Dasharath — calm wisdom in the palace court",
      "performing yajna — fire before him, sacred chants",
    ],
    referencePrompt: "Sage Vashishtha the brahmarishi royal guru of Ayodhya full body portrait, ancient sage in his 70s exuding infinite calm spiritual authority, serene noble face with long flowing white hair and long white beard, large wise compassionate eyes holding the peace of supreme realisation, wearing only a simple pure white cotton dhoti — bare chest with sacred janeu thread across it, long rudraksha mala beads around neck, holding rudraksha mala in right hand fingers counting beads, brass kamandal water vessel in left hand, seated cross-legged in deep meditation on a folded tiger skin mat, divine white-silver light aura of highest brahmarishi mastery emanating softly around his entire body, ancient Ayodhya royal ashram background with Saraswati river glimpsed through carved stone arches, sacred fire glow and morning light, expression of absolute serene omniscient calm and compassionate wisdom, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, ANCIENT WHITE-HAIRED SAGE serene not fierce, WHITE aura not orange, no modern elements, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Jambavan",
    speciesOrType: "Divine Bear — king of bears",
    worldRole: "Ancient bear king created by Brahma — elder statesman of the vanara sena; reminds Hanuman of his forgotten powers",
    personality: "Profoundly ancient, wise beyond measure — has lived since creation itself; gentle in counsel, immovable in faith; the one who awakens Hanuman to his own greatness",
    visualReferences: [
      "massive bear form standing upright — large round bear head, dark brown-black fur",
      "white chest fur patch — distinguishing elder bear marking",
      "wise ancient eyes filled with deep cosmic knowledge",
      "sacred janeu thread across broad bear chest",
      "simple white dhoti around bear waist",
      "heavy gnarled wooden staff or stone club in one hand",
    ],
    clothingRules:
      "Simple white dhoti around the bear waist. Sacred janeu thread across chest. No crown — his dignity comes from age not rank. Heavy wooden staff. White chest fur always visible. Standing upright, not on all fours.",
    colorPalette: ["dark brown-black", "white chest", "forest green", "warm amber"],
    restrictedChanges: [
      "always bear head and body — never human face",
      "always standing upright on two legs",
      "white chest fur patch always visible — his identifier",
      "expression always wise and calm — ancient elder energy",
    ],
    samplePoses: [
      "whispering to Hanuman — placing paw on Hanuman's shoulder, awakening him",
      "seated at war council — wise elder advising Ram's generals",
      "pointing toward Lanka across the ocean — strategic counsel",
      "standing guard with heavy staff — ancient protector",
    ],
    referencePrompt: "King Jambavan the ancient divine bear king full body portrait, massive bear deity standing upright on two powerful legs, large round dark brown-black bear head with flat wide nose, small round ears, wise ancient eyes filled with profound cosmic knowledge and gentle compassion, distinctive white fur patch on broad barrel chest — his defining feature, thick dark brown-black fur covering entire powerful body, wearing simple white cotton dhoti around bear waist, sacred janeu thread draped across white chest fur, holding a heavy ancient gnarled wooden staff in right paw-hand, left paw raised in gentle wise counsel gesture, standing tall with dignified ancient bearing — the oldest living being who has seen creation itself, deep ancient forest clearing background with enormous old banyan tree roots and moss-covered stone altar, warm amber forest light filtering through canopy, expression of profound gentle wisdom and patient ancient authority, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, BEAR HEAD BEAR BODY standing upright, WHITE CHEST PATCH visible, not human face, no modern elements, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Shurpanakha",
    speciesOrType: "Rakshasi",
    worldRole: "Ravan's sister — her desire for Ram and disfigurement by Lakshman triggers the chain of events leading to Sita's abduction",
    personality: "Wild, brazen, driven by desire and pride; her humiliation becomes the spark that burns two kingdoms; in natural form she is fearsome, not comic",
    visualReferences: [
      "dark olive-brown complexioned demon woman — wild fierce features",
      "large clawed fingers and toes, wild tangled black hair",
      "wearing rough dark red woven rakshasi sari with tribal bone ornaments",
      "large silver nose ring, thick heavy silver bangles",
      "forest flowers and leaves woven into tangled hair",
      "eyes gleaming with fierce desire and menace",
    ],
    clothingRules:
      "Rough dark red woven tribal rakshasi sari. Bone and shell ornaments, large silver nose ring, thick bangles. No gold — she is rakshasi not royalty. Wild tangled hair. Clawed hands always visible. Barefoot with clawed feet.",
    colorPalette: ["dark crimson", "forest brown", "bone white", "shadow black"],
    restrictedChanges: [
      "always wild demon woman — not beautiful, not tamed",
      "clawed hands and feet always visible",
      "tribal bone ornaments — never gold like Lanka royalty",
      "wild tangled hair — never neatly arranged",
    ],
    samplePoses: [
      "advancing toward Ram in the forest — fierce desire and menace",
      "after disfigurement — covering face, rage and humiliation",
      "at Ravan's court — fury and accusation driving Lanka to war",
      "lurking in dark Dandaka forest — watching Ram's ashram",
    ],
    referencePrompt: "Shurpanakha the rakshasi sister of Ravan full body portrait in her true demon form, dark olive-brown complexioned wild demon woman with fierce rakshasi features, long clawed dark fingers and clawed bare feet, wild thick tangled black hair with forest flowers dry leaves and small bones woven through it, wearing rough dark crimson red woven tribal rakshasi sari with rough-hemmed border, large heavy silver nose ring through left nostril, thick heavy silver bangles on both wrists, animal bone necklace around neck, standing in dense dark Dandaka forest with enormous dark trees and deep shadows behind her, eyes gleaming with fierce burning desire and menace — she is dangerous not comic, expression of wild predatory hunger and rakshasi power, dramatic dark forest dusk lighting with only shafts of fading red sunlight cutting through the darkness, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, WILD DEMON WOMAN fierce features and claws, tribal NOT royal ornaments, no modern elements, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Maricha",
    speciesOrType: "Rakshasa",
    worldRole: "Ravan's uncle — powerful demon who takes the form of a golden deer to lure Ram away from Sita; dies by Ram's arrow crying Ram's name",
    personality: "Wise enough to know this mission means his death, yet bound by Ravan's order; a reluctant instrument of evil — warns Ravan but obeys; his death cry in Ram's voice is the real weapon",
    visualReferences: [
      "in golden deer form: impossibly beautiful magical deer, coat of pure shimmering gold",
      "silver spots catching supernatural light across golden flanks",
      "large supernatural eyes with hidden rakshasa intelligence behind them",
      "golden hooves and delicate golden antlers with gem-like tips",
      "magical unnatural shimmer and glow — too perfect to be real",
      "standing in dappled forest sunlight that makes the gold body blaze",
    ],
    clothingRules:
      "Shown in golden deer form only — no clothing. Pure golden coat, silver spots, gem-tipped antlers. The wrongness is only in the eyes — too intelligent for an animal. Always shown in the forest with light making the gold shimmer supernaturally.",
    colorPalette: ["pure gold", "silver", "gem blue", "forest green"],
    restrictedChanges: [
      "always golden deer form — never show demon form in this context",
      "the eyes must betray the demon within — too knowing",
      "supernatural golden shimmer — real deer do not glow like this",
      "no clothing, no ornaments — pure deer form",
    ],
    samplePoses: [
      "standing in forest clearing — blazing gold in a shaft of sunlight",
      "grazing near Sita's ashram — deliberately drawing her eye",
      "bounding away through trees — luring Ram deeper into forest",
      "struck by Ram's arrow — transforming back, crying Ram's name",
    ],
    referencePrompt: "Maricha the demon in golden deer illusion form full body portrait, impossibly beautiful supernatural golden deer standing in a forest clearing, coat of pure blazing gold covering the entire body — every hair a thread of pure gold catching and refracting forest light, small delicate silver spots scattered across golden flanks shimmering like stars, graceful slender deer legs ending in golden hooves, elegant pair of golden antlers with tips that glow like precious gemstones, large dark deer eyes — but look closely and something is deeply wrong, a rakshasa's cunning intelligence gleams behind the animal gaze, the whole body radiates an unnatural supernatural shimmer and golden glow that no real deer possesses, standing in dappled Panchavati forest sunlight where the golden light makes the supernatural coat blaze almost blindingly, tall ancient forest trees in background with Sita's ashram hut visible in far distance, expression of calculated supernatural lure — beautiful but deeply wrong, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, GOLDEN DEER supernatural shimmer, WRONG EYES with demon intelligence, no modern elements, no anime, no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Sumitra",
    speciesOrType: "Human",
    worldRole: "Third queen of Ayodhya — mother of Lakshman and Shatrughan; embodies quiet acceptance and spiritual strength",
    personality: "Gentle, spiritually grounded, selflessly accepting — sends her sons to exile without complaint, sustaining herself with faith; the quiet strength behind Lakshman's steadfastness",
    visualReferences: [
      "gentle queen in her 40s — soft warm complexion, kind compassionate eyes",
      "dark hair with small yellow flowers in a simple braid",
      "soft green-yellow silk sari with thin gold border — gentle colours",
      "simple gold ornaments — small earrings and thin delicate bangles",
      "delicate refined manner, seated in peaceful garden setting",
      "holding small brass oil lamp — her ritual of daily prayer",
    ],
    clothingRules:
      "Soft green or pale yellow silk sari with thin gold border — never vibrant colours. Simple minimal gold ornaments. Small flowers in hair. Always in garden or palace interior — peaceful setting. Gentle posture, never commanding.",
    colorPalette: ["soft sage green", "pale yellow", "ivory", "delicate gold"],
    restrictedChanges: [
      "always soft gentle colours — never orange like Kaikeyi or red like Sita",
      "always gentle compassionate expression — never fierce or proud",
      "minimal ornaments — the least adorned of the three queens",
      "small flowers in hair — her gentle signature",
    ],
    samplePoses: [
      "sending Lakshman to forest with Ram — blessing him with both hands",
      "seated in Ayodhya garden — waiting, praying, at peace",
      "consoling Kaushalya — gentle arm around her grieving sister-queen",
      "morning puja by garden pond — peaceful devotion",
    ],
    referencePrompt: "Queen Sumitra third queen of Ayodhya mother of Lakshman and Shatrughan full body portrait, gentle beautiful queen in her mid-40s, soft warm golden complexion radiating quiet inner peace, large kind compassionate dark eyes filled with gentle sorrow and spiritual acceptance, dark hair in simple neat braid adorned with small fresh yellow champa flowers, wearing soft sage-green pure silk sari with thin delicate gold border — gentle quiet colours not vibrant, simple pearl drop earrings and thin delicate gold bangles — minimal ornaments the least adorned of the queens, holding a small lit brass diya oil lamp in both cupped palms as a quiet daily offering, seated on carved stone bench in a peaceful Ayodhya palace garden with a lotus pond and flowering trees behind her, soft afternoon golden light filtering through garden leaves, expression of serene quiet spiritual strength and gentle maternal love — accepts dharma even when it takes her sons, Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, GENTLE SOFT COLOURS not vibrant, MINIMAL ornaments, no modern elements, no anime, no cartoon",
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
