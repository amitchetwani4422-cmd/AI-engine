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
    referencePrompt: "Photorealistic full-body portrait, real Indian male actor age 28 as Ram, medium-deep blue skin tone like Lord Vishnu in classical iconography — blue like a clear monsoon sky, NOT dark navy NOT black NOT painted-looking, smooth matte divine skin, CLEAN-SHAVEN face with sharp noble Kshatriya jaw, serene calm dark eyes, golden tilak on forehead, handcrafted jewelled peacock-feather gold mukut crown, heavy hand-embroidered GOLDEN YELLOW silk dhoti — gold not orange not saffron — with wide real zari border reaching ankles, sacred white janeu thread clearly visible across bare muscular chest, multiple layered gold necklaces, holding a long graceful wooden longbow with gold fittings, bare feet on white marble, ancient North Indian Nagara sandstone palace colonnade with warm afternoon golden light shafts, ARRI Alexa cinema camera, natural warm volumetric light, shallow depth of field with face sharp, real skin texture, genuine gold jewelry, no beard no stubble, no CGI glow no illustration no painting no cartoon",
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
    referencePrompt: "Photorealistic full-body portrait, real Indian female actor age 24 as Sita Janaki, luminous warm golden-wheat skin with flawless natural complexion, large gentle dark eyes with serene expression, thick dark hair in single long braid with fresh white jasmine flowers and small gold pins, wearing vivid deep-red pure Banarasi silk sari — rich red not pink — with wide hand-woven gold zari border and gold pallu draped over left shoulder, gold maang tikka in hair parting, simple gold pendant necklace, thin gold bangles on both wrists, holding a fresh pink lotus, bare feet with red alta, ancient Ayodhya carved sandstone palace interior with warm afternoon window light, ARRI Alexa cinema camera, soft natural window light, shallow depth of field sharp on face, real silk fabric texture with light sheen, genuine gold jewelry, visible skin detail, no CGI no illustration no painting no cartoon",
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
    referencePrompt: "Photorealistic divine portrait of Hanuman, massive noble vanara deity of enormous divine scale — a tiny deer standing at his feet shows his immense size, GREY-WHITE-SILVER fur covering his massive powerfully muscular body — NOT orange NOT saffron, silver-grey langur monkey coloring, semi-human noble face with monkey features: reddish-brown face, monkey muzzle and jaw with beard-like fur around jaw, deeply devotional expression with eyes CLOSED in prayer and brow gently furrowed with bhakti, large ornate hammered GOLD CROWN on head with detailed carvings, seated in anjali mudra — both massive palms pressed together in namaskara prayer position, large ornate gold armlets on both upper arms, rudraksha and gold necklace across broad chest, white and pink silk dhoti barely visible at waist, massive misty forest waterfall cascading behind him, lush green tropical forest with moss-covered rocks, cool misty atmospheric light, photoreal individual fur strand texture, real gold crown and armlet detail, divine monumental scale, no fire no mace in this devotional pose, no cartoon no anime no orange fur",
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
    referencePrompt: "Photorealistic full-body portrait, real Indian male actor age 26 as Lakshman, fair warm golden skin — no blue tint, distinct human warmth, lean athletic warrior build, intense alert dark eyes scanning with fierce brotherly vigilance, forehead tilak, simple jewelled warrior crown less ornate than Ram's, hand-carved composite wooden longbow strung taut in left hand with arrow nocked, full quiver over right shoulder, saffron-yellow hand-embroidered silk dhoti with thin gold border, sacred white janeu thread across chest, gold armlets, bare feet on forest earth, dense ancient Ashoka forest at golden-hour dusk, warm amber directional light through tall trees, ARRI Alexa cinema camera, shallow depth of field sharp on face, real fabric weave and gold metal reflections, visible skin pores, no CGI no illustration no painting no cartoon, FAIR SKIN not blue young man",
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
    referencePrompt: "Photorealistic full-body portrait, real Indian male actor age 45 as Ravan, powerfully built imposing physique, rich dark-brown complexion with warm golden undertone of supreme confidence, single head and face only, intense dark eyes radiating terrifying intelligence and arrogance, wearing handcrafted full golden battle armour with ornate jewelled chest plate and curved shoulder guards, single large gold crown studded with rubies, thick serpent gold armlets, heavy gold rings, dark crimson silk dhoti, right arm raised holding crackling dark weapon, grand Lanka palace with black obsidian columns and gold torchlight, dramatic chiaroscuro lighting — deep shadow and warm torch gold, ARRI Alexa cinema camera, natural dramatic torchlight, shallow depth of field, real hammered gold armour texture, genuine gemstone reflections, single face only no multiple heads, no CGI cartoon no anime no illustration",
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
    referencePrompt: "Photorealistic full-body portrait, real Indian male actor age 62 as King Dasharath, deeply lined noble face, full white mustache and white beard, wise sorrowful dark eyes carrying the weight of a great king's regret, wearing magnificent deep burgundy-red pure silk royal dhoti with heavy gold zari border, elaborate jewelled Kosala crown with large central ruby, multiple layered thick gold necklaces with gems, heavy gold armlets, bare chest with sacred janeu thread, golden sceptre-staff in right hand, seated on ornate carved sandstone Ayodhya throne, royal court interior with tall stone columns and red silk curtains, warm amber oil-lamp light, ARRI Alexa cinema camera, natural warm court lighting, shallow depth of field sharp on face, real silk fabric drape, genuine gold jewelry weight and reflection, visible facial texture and age lines, no CGI no illustration no painting no cartoon",
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
    referencePrompt: "Photorealistic full-body portrait, real Indian female actor age 52 as Queen Kaushalya, luminous warm golden complexion with graceful age, gentle large dark eyes full of serene maternal love, dark hair with silver streaks in elegant braided crown with fresh white jasmine, wearing cream-ivory pure Banarasi silk sari with wide heavy gold zari border and gold pallu, red alta on bare feet, thin gold bangles, pearl necklace with gold pendant, gold maang tikka, seated in morning puja with hands folded in namaskara, small brass diya lamp and fresh marigold flowers before her on carved stone floor, Ayodhya palace puja chamber with sandstone arched windows, soft warm morning light filtering through, ARRI Alexa cinema camera, gentle natural morning light, shallow depth of field, real ivory silk sheen, genuine pearl and gold jewelry, visible skin texture, no CGI no illustration no painting no cartoon",
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
    referencePrompt: "Photorealistic full-body portrait, real Indian female actor age 42 as Queen Kaikeyi, sharp intelligent dark eyes filled with fierce royal determination — a proud queen making a terrible choice not a cartoon villain, warm golden complexion, wearing vivid deep saffron-orange pure Banarasi silk sari with wide heavy gold border — saturated saffron not pale, elaborate gold crown with rubies, heavy layered gold necklaces with large ruby pendants, thick gold bangles, large ornate gold earrings, standing in kopa bhavan chamber with arms crossed, dramatic single oil-lamp torchlight casting deep shadows, ARRI Alexa cinema camera, natural dramatic chiaroscuro torch lighting, shallow depth of field sharp on face, real Banarasi silk texture and sheen, genuine gold and ruby jewelry, visible skin detail, no CGI no illustration no painting no cartoon",
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
    referencePrompt: "Photorealistic full-body portrait, real Indian male actor age 26 as Prince Bharat, fair warm golden complexion, deeply sorrowful eyes etched with guilt and love, lean body from years of fasting and penance, wearing rough hand-woven brown bark-cloth dhoti — no silk no royal fabric, bare chest with only sacred janeu thread, no crown no gold ornaments, holding Lord Ram's sacred golden padukas sandals reverently aloft in both palms, kneeling on bare dusty forest ground, simple forest hermitage background with small sacred dhuni fire and tall trees, warm late-afternoon forest light, ARRI Alexa cinema camera, natural dappled forest light, shallow depth of field, rough bark-cloth texture vs smooth golden sandals contrast, visible skin and muscle detail, real fire glow on face, no CGI no illustration no painting no cartoon, ASCETIC lean appearance not muscular",
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
    referencePrompt: "Photorealistic full-body portrait, real Indian male actor as Vibhishan, lean slightly dark complexion with noble dignified features — not monstrous, subtle rakshasa quality in jaw structure only, sacred white Vishnu tilak on forehead — white vertical lines with red centre dot, wearing simple pure white cotton dhoti and saffron uttariya shawl, rudraksha mala beads, holding small brass kamandal and single pink lotus, standing at boundary between Lanka's dark obsidian palace shadows and warm golden light from outside — face half lit by divine gold half in shadow, expression of righteous resolve and quiet inner peace, ARRI Alexa cinema camera, dramatic half-and-half natural lighting, shallow depth of field, real cotton fabric texture, genuine rudraksha bead detail, Vishnu tilak clearly visible, no CGI no illustration no painting no cartoon, DIGNIFIED face not monstrous",
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
    referencePrompt: "Photorealistic full-body portrait, real Indian male actor age 22 as Prince Shatrughan, smooth youthful face without beard — the youngest prince, fair warm golden-wheat skin, bright alert eyes with youthful energy and fierce loyalty, forehead tilak, simple warrior crown least ornate of four brothers, composite wooden bow in left hand arrow nocked, full quiver over right shoulder, saffron-yellow hand-embroidered silk dhoti with thin gold border, sacred janeu thread across chest, thin gold armlets, bare feet, Ayodhya palace courtyard at golden-hour, warm directional afternoon light on carved stone columns, ARRI Alexa cinema camera, natural warm golden-hour light, shallow depth of field sharp on youthful face, real silk fabric and gold jewelry detail, visible smooth young skin texture, no CGI no illustration no painting no cartoon, YOUNGEST smooth face fair skin",
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
    referencePrompt: "Photorealistic full-body portrait, real Indian male actor age 62 as Sage Vishwamitra, powerful commanding lean body from decades of severe tapas, tall imposing frame, fierce penetrating eyes burning with spiritual warrior intensity, matted grey-brown hair in high jata mukut, three horizontal white vibhuti ash marks on broad forehead and ash lines on arms, wearing only a single rough saffron cotton dhoti — bare muscular chest and arms, holding brass kamandal in right hand and sacred kush grass in left, standing in ancient forest ashram with large banyan tree roots and yajna fire behind, warm firelight on face with deep forest shadow, ARRI Alexa cinema camera, natural dramatic mixed fire and forest light, shallow depth of field, visible muscle definition on bare chest, rough saffron cotton weave texture, real fire glow, no CGI no illustration no painting no cartoon, FIERCE COMMANDING expression bare chest",
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
    referencePrompt: "Photorealistic VFX creature portrait, hyper-realistic vanara king CGI — Hollywood blockbuster quality like Planet of the Apes, authentic primate face: protruding muzzle, flat nose, wide jaw, deep-set monkey eyes with kingly intelligence, golden-tawny brown fur covering stocky powerfully built royal body, elaborate handcrafted Kishkindha gold crown with gems showing his kingship, thick gold necklace, heavy gold armlets, rich gold silk dhoti, holding a gleaming golden sword as king's weapon, seated on ancient carved stone mountain throne, Kishkindha dense forest background, dappled forest golden light, Hollywood VFX level photoreal fur with individual strand detail, natural forest ambient light, genuine gold crown and jewelry reflections, KINGLY bearing not devotional, MONKEY face not human, no cartoon no anime",
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
    referencePrompt: "Photorealistic VFX creature portrait, hyper-realistic divine eagle — massive ancient bird, Hollywood blockbuster creature quality, authentic eagle anatomy: broad golden-brown body, wide powerful wings with individual primary feathers visible, noble white-feathered elder eagle head with sharp curved golden beak and fierce ancient intelligent eyes filled with sacrifice, powerful scaled talons gripping forest earth, right wing visibly torn and bloodied from battle with Ravan — broken feathers and real wound detail, lying mortally wounded on Panchavati forest floor with neck raised with last remaining strength, golden-hour forest light casting long dramatic shadows, photoreal feather texture individual barbs visible, natural forest ambient light, real wound detail not stylized, profound sacrifice in the eagle's ancient eyes, MASSIVE SCALE trees around him for comparison, BATTLE WOUNDS clearly visible, no cartoon no anime no illustration",
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
    referencePrompt: "Photorealistic full-body portrait, real Indian female actor age 75 as Shabari, deeply wrinkled dark complexion with warm undertones, white hair pulled back simply, thin frail small body with gentle stoop, wearing rough hand-woven dark earth-brown cotton sari — coarse fabric not silk, string of wooden beads around neck, red glass bangles on thin wrists, bare feet with forest earth, seated on forest ground outside a small thatched hut, holding out large fresh green leaf bowl filled with ripe dark forest berries, tears of pure joy on deeply lined face, hands trembling with age and overwhelming emotion, ancient forest clearing with large banyan tree roots, warm golden beam of afternoon light descending on her, ARRI Alexa cinema camera, natural warm directional forest light, shallow depth of field, real coarse fabric texture, visible age lines and wrinkled skin, no CGI no illustration no painting no cartoon, VERY OLD real face not smoothed",
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
    referencePrompt: "Photorealistic VFX creature portrait, hyper-realistic young vanara warrior prince CGI, Hollywood blockbuster quality, authentic primate face with reddish-gold fur: fierce proud young monkey features — protruding muzzle, strong jaw, primate brow, burning warrior eyes, lean athletic body younger and more wiry than Sugriva, wearing simple saffron-orange silk dhoti, thick gold armlets of his father Vali on both upper arms — his most important accessories, no crown — a prince not a king, right foot planted with absolute defiance on dark Lanka palace stone floor, holding massive boulder raised in one hand, grand dark Lanka palace court with obsidian columns and gold torches, dramatic torchlight casting his defiant shadow across the floor, photoreal fur texture with individual strands, natural dramatic torchlight, Vali's golden armlets clearly visible, YOUNG LEAN warrior, MONKEY face not human, no cartoon no anime",
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
    referencePrompt: "Photorealistic VFX giant creature, hyper-realistic colossal demon CGI, absolutely massive scale — tiny vanara soldiers visible at ankles to show terrifying size, dark mahogany-brown rough rocky skin texture like weathered stone with deep pores, enormous bald head with small heavy-lidded sleepy eyes still drowsy from awakening, massive wide flat nose, enormous barrel chest wider than a palace wall, arms like ancient tree trunks, wearing only a single massive rough dark crimson cloth around giant waist, carrying a colossal spiked iron club, smoke and dust rising from ground as he walks, Lanka fortress walls looking tiny beside his frame, dramatic battle smoke and fire, Hollywood monster-scale VFX quality, natural dramatic battle lighting, rough stone-textured dark skin with real surface detail, HALF-AWAKE heavy eyes, tiny soldiers at feet for scale, no cartoon no anime",
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
    referencePrompt: "Photorealistic full-body portrait, real Indian male actor age 30 as Indrajit, dark complexion with intense supernatural confidence, fierce eyes blazing with arrogance and lethal power, wearing magnificent handcrafted full black battle armour with ornate gold engravings and rune etchings across chest plate, large ornate black crown with heavy gold trim and single dark ruby, thick black-gold armlets and gold rings, dark crimson silk dhoti beneath armour, holding dark serpentine astra weapon with crackling dark energy arcing from it, Lanka palace rooftop with dark storm clouds rolling in from ocean behind, dramatic contrast of warm gold torchlight and deep shadow, ARRI Alexa cinema camera, natural dramatic chiaroscuro torchlight, shallow depth of field, real hammered metal armour texture, visible skin and eye detail, dark energy subtle not overpowering, no CGI cartoon no anime no illustration, YOUNG DARK WARRIOR full armour",
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
    referencePrompt: "Photorealistic full-body portrait, real Indian female actor age 38 as Queen Mandodari, extraordinarily beautiful with luminous warm golden complexion, large dark sorrowful compassionate eyes carrying the weight of inevitable tragedy, thick lustrous dark hair with large ornate heavy gold-and-ruby crown, wearing rich deep purple-crimson pure Banarasi silk sari with very wide gold zari border and gold pallu — distinct from Sita's red, multiple heavy layered gold necklaces with large ruby pendants and emerald accents, thick gold bangles, large ruby drop earrings, one hand pressed gently on heart in grief, standing on high Lanka palace terrace with dark obsidian walls and golden torches, vast dark ocean visible behind, ARRI Alexa cinema camera, natural warm torchlight with cool ocean moonlight, shallow depth of field, real Banarasi silk texture, genuine gold and ruby jewelry, visible skin and sorrow in eyes, no CGI no illustration no painting no cartoon, BEAUTIFUL QUEEN not demonic",
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
    referencePrompt: "Photorealistic full-body portrait, real Indian female actor age 65 with prosthetic hunchback makeup as Manthara, dark warm complexion, deeply wrinkled face, narrow calculating eyes with bitter cunning expression and slight scheming smile, pronounced visible hunchback — silhouette clearly bent, wiry grey hair in severe tight bun, wearing simple dark indigo-blue cotton servant sari with almost no border, plain small gold nose ring, thin basic bangles, hobbling with a gnarled wooden walking stick in right hand, left hand raised with finger pointing gesturing dramatically while whispering her scheme, dark royal Ayodhya palace stone corridor with oil-lamp lit stone arches casting long dramatic sinister shadow of her hunchbacked silhouette on wall behind her, ARRI Alexa cinema camera, natural dramatic oil-lamp chiaroscuro light, shallow depth of field, real coarse cotton fabric, visible skin wrinkles and age, HUNCHBACK silhouette clearly visible, no CGI no illustration no painting no cartoon",
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
    referencePrompt: "Photorealistic full-body portrait, real Indian male actor age 72 as Sage Vashishtha, ancient face radiating profound serene wisdom, long flowing white hair and long white beard, large compassionate omniscient eyes of deepest spiritual peace, wearing only simple pure white cotton dhoti — bare chest with sacred janeu thread, long rudraksha mala counting beads in right hand, brass kamandal in left, seated in deep cross-legged meditation on folded tiger skin, subtle white-silver rim light suggesting brahmarishi mastery — natural film look not glowing, ancient Ayodhya royal ashram with river glimpsed through carved stone arches, soft sacred morning light, ARRI Alexa cinema camera, natural gentle soft morning light, shallow depth of field sharp on serene ancient face, real cotton fabric drape, genuine rudraksha bead detail, visible age and wisdom in face texture, no CGI no illustration no painting no cartoon, ANCIENT WHITE-HAIRED serene not fierce",
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
    referencePrompt: "Photorealistic VFX creature portrait, hyper-realistic divine bear deity CGI, Hollywood blockbuster quality, massive bear standing upright on two powerful legs, large round dark brown-black bear head with flat wide nose and small round ears, wise ancient eyes filled with profound gentle knowledge, distinctive white fur patch on broad barrel chest — his defining identifier, thick dark brown-black fur covering powerful body with individual hair strands visible, wearing simple white cotton dhoti around bear waist, sacred janeu thread across white chest fur, holding heavy gnarled wooden staff in right paw, left paw raised in gentle counsel gesture, standing in ancient forest clearing with enormous banyan tree roots and moss-covered stone altar, warm amber forest light filtering through canopy, Hollywood photoreal fur and creature quality, natural ambient forest light, WHITE CHEST PATCH clearly visible, wise gentle ancient expression, BEAR HEAD BEAR BODY standing upright, no cartoon no anime",
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
    referencePrompt: "Photorealistic VFX character portrait, real Indian actress with creature makeup and partial CGI enhancement as Shurpanakha in demon form, dark olive complexion with roughened rakshasi skin texture, fierce wild eyes with predatory intensity, long dark clawed fingers, wild thick tangled black hair with dry leaves and small bones woven through it, wearing rough dark crimson red hand-woven tribal sari with raw-hemmed border, heavy silver nose ring, thick heavy silver bangles, animal bone necklace, standing in dense dark Dandaka forest with enormous trees and deep shadow, only shafts of fading red dusk sunlight cutting through darkness, ARRI Alexa cinema camera, natural dramatic dusk forest light, shallow depth of field, real rough woven fabric texture, genuine heavy silver jewelry, visible skin texture with rakshasi roughness, genuinely unsettling not comic, no cartoon no anime no illustration",
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
    referencePrompt: "Photorealistic VFX creature portrait, hyper-realistic supernatural golden deer CGI — impossibly beautiful magical animal, Hollywood photo-real quality, entire coat of pure gold with individual gold-metallic hair strands, small delicate silver spots scattered across golden flanks, graceful slender deer legs ending in golden hooves, elegant golden antlers with gem-like glowing tips, large dark deer eyes — but deeply wrong, a demon's cunning intelligence unmistakably behind the animal gaze, the creature radiates a subtle unnatural shimmer no real deer possesses, standing in dappled Panchavati forest sunlight making the supernatural coat gleam, Sita's forest ashram hut visible in far background, real deer anatomy rendered in gold, natural forest light making gold coat shimmer without being neon, WRONG EYES with demon intelligence the only tell, photoreal deer anatomy with gold materiality, no cartoon no anime no illustration",
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
    referencePrompt: "Photorealistic full-body portrait, real Indian female actor age 44 as Queen Sumitra, soft warm golden complexion radiating quiet inner peace, large kind compassionate dark eyes with gentle sorrow and spiritual acceptance, dark hair in simple neat braid with small fresh yellow champa flowers, wearing soft sage-green pure silk sari with thin delicate gold border — gentle quiet colours not vibrant, small pearl drop earrings and thin delicate gold bangles — least adorned of the queens, holding a small lit brass diya in both cupped palms as a daily offering, seated on carved stone bench in peaceful Ayodhya palace garden with lotus pond behind, soft warm afternoon golden-hour garden light filtering through flowering trees, ARRI Alexa cinema camera, soft natural garden light, shallow depth of field sharp on gentle face, real silk drape and texture, genuine pearl and delicate gold jewelry, visible natural skin texture, no CGI no illustration no painting no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  // ─── Batch 6 ───────────────────────────────────────────────────────────────

  {
    name: "Vali",
    speciesOrType: "Divine Vanara",
    worldRole: "Former king of Kishkindha — Sugriva's elder brother; possessor of divine boon that halves every opponent's strength; killed by Ram from behind a tree",
    personality: "Supreme arrogance matched by supreme power — not purely evil but corrupted by pride; has the moral clarity to question Ram's method even while dying; a complex tragic figure",
    visualReferences: [
      "massive powerfully built vanara with jet-black fur — darker than all other vanaras",
      "MONKEY face with dominant fierce primate features — larger jaw, stronger brow",
      "golden divine boon necklace glowing around his neck — his source of power",
      "ornate Kishkindha gold crown — he is always the king",
      "enormous muscular arms, commanding intimidating stance",
      "dark golden aura of the divine boon surrounding his body",
    ],
    clothingRules:
      "Rich gold dhoti. Kishkindha crown — more elaborate than Sugriva's. The golden boon necklace always glowing at his throat. Enormous build, darker fur than Sugriva. Commanding, never hunched or submissive.",
    colorPalette: ["jet black", "dark gold", "deep crimson", "shadow bronze"],
    restrictedChanges: [
      "always monkey face — never human",
      "jet-black fur — much darker than Sugriva's golden-tawny",
      "golden necklace always glowing — it is the source of his power",
      "always the most physically imposing vanara in any scene",
    ],
    samplePoses: [
      "standing on Kishkindha mountain — arms spread, absolute ruler",
      "in battle with Sugriva — overpowering him effortlessly",
      "struck by Ram's arrow — questioning Ram with dying dignity",
      "seated on throne — every inch the unquestionable king",
    ],
    referencePrompt: "Photorealistic VFX creature portrait, hyper-realistic vanara king CGI, jet-black fur covering absolutely massive powerfully built body — most physically imposing vanara alive, MONKEY face with dominant fierce primate features — larger jaw, heavier brow ridge, deeper-set eyes than other vanaras, wearing ornate heavy Kishkindha gold crown more elaborate than Sugriva's, divine golden necklace at throat with subtle supernatural glow — his boon necklace, rich deep gold silk dhoti with heavy border, thick gold armlets, massive boulder-sized fists, standing atop Kishkindha mountain with forest kingdom visible below, dark gathering storm clouds behind adding menacing power, Hollywood VFX photoreal fur quality, natural dramatic stormy light, jet-black fur with individual strand texture, golden necklace divine quality, MONKEY face dominant, JET BLACK fur darkest of all vanaras, no cartoon no anime",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Urmila",
    speciesOrType: "Human",
    worldRole: "Lakshman's devoted wife — sister of Sita; accepts 14 years of separation; legend says she took on Lakshman's sleep so he could guard Ram",
    personality: "Silent sacrifice personified — her devotion is invisible yet immeasurable; while Sita's suffering is sung, Urmila waits alone in Ayodhya; her love expressed through acceptance not words",
    visualReferences: [
      "beautiful young princess in her early 20s — luminous complexion",
      "large dark eyes carrying deep longing and quiet sacrifice — haunted but dignified",
      "dark hair in simple braid with minimal adornment — partially in penance",
      "pale moonlight-silver or soft white silk sari with thin gold border",
      "minimal gold ornaments — small earrings, thin bangles of a woman in partial vow",
      "seated by palace window looking out — the eternal wait",
    ],
    clothingRules:
      "Pale silver-white or soft ivory silk sari — never vibrant colours during the wait. Minimal ornaments showing she has reduced comforts in solidarity with Lakshman's forest hardships. Small jasmine flowers in braid. Moonlit interior setting.",
    colorPalette: ["moonlight silver", "ivory white", "pale lotus pink", "soft gold"],
    restrictedChanges: [
      "always soft pale colours — she is in a state of penance-lite",
      "always an expression of dignified longing — not crying, not joyful",
      "minimal ornaments — she has given up luxury in solidarity",
      "always near a window or lamp — waiting in the dark",
    ],
    samplePoses: [
      "seated at palace window — moonlight on face, eyes on the horizon",
      "lighting a single lamp each evening — waiting vigil",
      "asleep in Lakshman's bed — legend says she sleeps his 14-year sleep",
      "reunion with Lakshman at return — tender tears and joy",
    ],
    referencePrompt: "Photorealistic full-body portrait, real Indian female actor age 22 as Princess Urmila, luminous warm golden complexion, large dark expressive eyes filled with dignified longing and quiet sacrifice — not weeping but carrying immense private sorrow, dark hair in simple braid with small white jasmine flowers — minimal adornment, wearing pale moonlight-silver pure silk sari with only a thin delicate gold border, small pearl drop earrings and very thin gold bangles — reduced ornaments in solidarity, seated on wide stone sill of tall carved palace window, one arm resting on sill and face turned toward the moonlit Ayodhya horizon, small brass diya flickering beside her, pale moonlight washing her in silver while diya gives warm intimate light on face, ARRI Alexa cinema camera, natural cinematic moonlight with warm intimate flame fill, shallow depth of field, real pale silk sheen in moonlight, genuine minimal jewelry, visible skin and eye detail, no CGI no illustration no painting no cartoon, DIGNIFIED LONGING not weeping",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Agastya",
    speciesOrType: "Human — Brahmarishi",
    worldRole: "Greatest sage of south India — gave Ram the Aditya Hridayam hymn and divine weapons; his ashram is a sacred stop on Ram's forest journey",
    personality: "Short in stature, vast in power — his tapas burned down mountains; direct, no-nonsense, fierce spiritual energy packed into a compact form; the sage who civilised the south",
    visualReferences: [
      "short stout powerfully built sage — compact body from intense tapas",
      "dark warm complexion, round face with bushy thick eyebrows",
      "eyes like burning coals — fierce concentrated divine fire",
      "matted dark-brown jata hair piled high despite short stature",
      "saffron dhoti, sacred ash marks on forehead and arms",
      "holding a golden bow or sacred text — giving Ram divine weapons",
    ],
    clothingRules:
      "Single saffron dhoti — bare chest like Vishwamitra. Sacred ash marks on forehead. Matted jata. Short compact build — never drawn tall. Intense fire energy. Holding a golden bow (Aditya Hridayam gift) or brass kamandal.",
    colorPalette: ["saffron", "ash white", "fire gold", "dark forest brown"],
    restrictedChanges: [
      "always short and stout — never tall like Vishwamitra",
      "dark complexion — south Indian sage",
      "bushy thick eyebrows — his distinguishing facial feature",
      "always fierce expression — intense tapas energy",
    ],
    samplePoses: [
      "presenting golden bow to Ram — both hands extended, sacred transfer",
      "teaching Aditya Hridayam — finger raised in teaching mudra",
      "seated in deep tapas — fire blazing around his still form",
      "striding through Vindhya forest — short powerful steps, total authority",
    ],
    referencePrompt: "Photorealistic full-body portrait, real Indian male actor age 58 as Sage Agastya — notably SHORT and stocky, compact powerfully built body, dark warm south Indian complexion, round face with very thick bushy dark eyebrows — his most distinctive feature, intense eyes burning with concentrated divine tapas fire, matted dark-brown jata hair piled high adding height, three horizontal white ash vibhuti marks on forehead and ash lines on arms, wearing only single rough saffron cotton dhoti — bare compact muscular chest, holding gleaming gold divine bow in both outstretched hands presenting it to Ram, deep tropical south Indian forest ashram with large dense trees and sacred fire kund behind, warm firelight and tropical forest ambient light, ARRI Alexa cinema camera, natural warm mixed fire and tropical forest light, visible compact muscle definition, DARK COMPLEXION south Indian, THICK BUSHY EYEBROWS, SHORT STOUT not tall, no CGI no illustration no painting no cartoon",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Nala",
    speciesOrType: "Divine Vanara",
    worldRole: "Son of Vishwakarma the divine architect — built the Ram Setu bridge across the ocean to Lanka; rocks float at his touch",
    personality: "Focused, creative, quietly proud of his divine gift; the engineer of the impossible — his bridge is the miracle that makes the rescue of Sita possible",
    visualReferences: [
      "MONKEY face with focused intelligent craftsman expression",
      "brown-golden fur, medium build — more wiry than warrior vanaras",
      "carrying measuring rope in one hand and a flat rock in other",
      "simple work dhoti — practical not royal",
      "ocean behind him with rocks visibly floating on water — Ram Setu",
      "thousands of vanaras working in background",
    ],
    clothingRules:
      "Simple plain work dhoti — not royal silk. Carrying tools: measuring rope, rocks. No crown, no ornaments — he is a craftsman at work. Ocean setting always. Rocks floating on water behind him as proof of his divine gift.",
    colorPalette: ["golden brown", "ocean blue", "granite grey", "saffron work cloth"],
    restrictedChanges: [
      "always monkey face — never human",
      "always shown at the ocean with Ram Setu under construction",
      "carrying construction tools — not weapons",
      "focused practical expression — a craftsman not a warrior",
    ],
    samplePoses: [
      "placing rock on ocean — it floats, workers cheering around him",
      "surveying the bridge line — rope held taut, squinting with precision",
      "presenting completed bridge to Ram — proud humble craftsman",
      "directing vanara workers — arm pointing, others lifting boulders",
    ],
    referencePrompt: "Photorealistic VFX creature portrait, hyper-realistic vanara craftsman CGI, authentic primate face with focused intelligent craftsman expression, brown-golden monkey fur, medium wiry build — more lean than warrior vanaras, wearing simple plain saffron work dhoti — not royal decorated silk, holding thick measuring rope coiled in right hand and flat grey granite rock in left hand, standing at ocean shoreline with the miraculous Ram Setu bridge visible stretching behind him — large rocks visibly floating impossibly on deep ocean water, thousands of vanara workers in background carrying boulders, bright midday ocean light with sea spray and waves, Hollywood photoreal fur quality, natural bright midday coastal light, genuine ocean and rock texture, floating rocks clearly visible on water, slight proud smile of an engineer whose miracle just worked, MONKEY face not human, CRAFTSMAN lean build, no cartoon no anime no illustration",
    preferredModel: "kling-3.0",
    universeId: "A",
  },

  {
    name: "Tara",
    speciesOrType: "Divine Vanara",
    worldRole: "Vali's queen, later Sugriva's queen — one of the five divine women (Panchakanya); her grief over Vali's death is one of Ramayana's most moving moments",
    personality: "Dignified in grief, perceptive, wise — she alone among the vanaras understood Ram's deeper purpose; accepted dharma even in personal loss; her composure in widowhood is her greatness",
    visualReferences: [
      "graceful female vanara with golden-tawny fur — lighter than Vali's black",
      "female MONKEY face with sorrowful dignified features and large expressive eyes",
      "white silk mourning dhoti with thin gold border — the colour of vanara widowhood",
      "simple gold bangles and necklace of a widowed queen",
      "one hand resting on Vali's memorial stone or chest",
      "expression of profound grief and quiet dignified acceptance",
    ],
    clothingRules:
      "White silk dhoti of mourning with thin gold border. Simple restrained gold ornaments — not the full royal jewellery of a reigning queen. Golden-tawny fur. Always in grief posture — never joyful in the Vali death scene.",
    colorPalette: ["white mourning", "golden tawny", "pale gold", "soft ochre"],
    restrictedChanges: [
      "always female monkey face — never human",
      "golden-tawny fur — lighter than Vali's jet-black",
      "white mourning clothing in all Vali death scenes",
      "expression always grief and dignity — never anger or joy",
    ],
    samplePoses: [
      "kneeling over fallen Vali — head bowed, tears on fur",
      "confronting Ram after Vali's death — dignified accusation",
      "seated beside Sugriva — reluctant new queen, still grieving",
      "blessing Angad as he departs for Lanka — motherly despite grief",
    ],
    referencePrompt: "Photorealistic VFX creature portrait, hyper-realistic female vanara CGI, graceful dignified golden-tawny fur — distinctly lighter than Vali's jet-black, female primate face with sorrowful but composed dignified features, large expressive dark eyes filled with profound grief and quiet wisdom, wearing pure white silk mourning dhoti with only thin gold border — white of vanara widowhood, simple restrained gold bangles and plain thin gold necklace — not full royal ornamentation, kneeling beside the fallen massive body of Vali on Kishkindha forest ground, one gentle paw-hand resting with infinite tenderness on Vali's broad chest, head bowed in grief but spine upright with dignity, dappled forest light filtering through Kishkindha canopy, Hollywood VFX photoreal fur texture, natural dappled forest ambient light, GOLDEN-TAWNY fur lighter than Vali's black, WHITE MOURNING cloth, grief and dignity not anger, female primate face, no cartoon no anime",
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
