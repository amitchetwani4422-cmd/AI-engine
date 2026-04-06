export type RamayanaKandaName =
  | "Bala Kanda"
  | "Ayodhya Kanda"
  | "Aranya Kanda"
  | "Kishkindha Kanda"
  | "Sundara Kanda"
  | "Yuddha Kanda"
  | "Uttara Kanda";

export interface KandaEpisodeSeed {
  title: string;
  beat: string;
  mantraFocus: string;
}

export interface CharacterProfile {
  name: string;
  aliases: string[];
  visualDescription: string;
  canonicalTraits: string[];
  promptBlock: string;
}

export interface MantraEntry {
  id: string;
  context: string;
  sanskrit: string;
  transliteration: string;
  translation: string;
}

export interface KandaKnowledge {
  name: RamayanaKandaName;
  summary: string;
  mustIncludeThemes: string[];
  episodeSeeds: KandaEpisodeSeed[];
  recommendedMantras: MantraEntry[];
}

export interface RamayanaKnowledgeBase {
  universe: string;
  kandas: Record<RamayanaKandaName, KandaKnowledge>;
  characterProfiles: CharacterProfile[];
  globalAccuracyRules: string[];
  forbiddenMistakes: string[];
}

const MANTRAS: Record<string, MantraEntry> = {
  ramaNama: {
    id: "rama-nama",
    context: "For devotion, protection, and remembrance of Shri Rama.",
    sanskrit: "श्रीराम जय राम जय जय राम",
    transliteration: "Sri Rama Jaya Rama Jaya Jaya Rama",
    translation: "Glory to Lord Rama, victory to Lord Rama, repeated victory to Lord Rama.",
  },
  ramaRaksha: {
    id: "rama-raksha",
    context: "For courage and dharmic strength in difficult scenes.",
    sanskrit: "रामो राजमणिः सदा विजयते रामं रमेशं भजे",
    transliteration: "Ramo Rajamanih Sada Vijayate Ramam Ramesham Bhaje",
    translation: "Rama, jewel among kings, is ever victorious; I worship that Lord Rama.",
  },
  hanumanMula: {
    id: "hanuman-mula",
    context: "For Hanuman-focused scenes of strength and service.",
    sanskrit: "मनोजवं मारुततुल्यवेगं जितेन्द्रियं बुद्धिमतां वरिष्ठम्",
    transliteration: "Manojavam Maruta-Tulya-Vegam Jitendriyam Buddhimatam Varishtham",
    translation: "Swift as the mind, fast as the wind, master of senses, foremost among the wise.",
  },
  sitaMangala: {
    id: "sita-mangala",
    context: "For scenes centered on Sita's purity and grace.",
    sanskrit: "सीतारामं सीतारामं सीतारामं भजे",
    transliteration: "Sita-Ramam Sita-Ramam Sita-Ramam Bhaje",
    translation: "I worship Sita and Rama together as the ideal divine couple.",
  },
  shanti: {
    id: "shanti-mantra",
    context: "For closure scenes and spiritually calm transitions.",
    sanskrit: "ॐ सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः",
    transliteration: "Om Sarve Bhavantu Sukhinah Sarve Santu Niramayah",
    translation: "May all be happy, may all be free from illness.",
  },
};

export const RAMAYANA_KANDAS: RamayanaKandaName[] = [
  "Bala Kanda",
  "Ayodhya Kanda",
  "Aranya Kanda",
  "Kishkindha Kanda",
  "Sundara Kanda",
  "Yuddha Kanda",
  "Uttara Kanda",
];

export const RAMAYANA_KNOWLEDGE_BASE: RamayanaKnowledgeBase = {
  universe: "Valmiki Ramayana aligned storytelling for devotional/mythological production",
  kandas: {
    "Bala Kanda": {
      name: "Bala Kanda",
      summary: "Birth and early life of Rama, Vishvamitra's guidance, and marriage of Rama and Sita.",
      mustIncludeThemes: ["divine birth", "guru-shishya discipline", "breaking Shiva dhanush", "Sita swayamvara"],
      episodeSeeds: [
        { title: "Putrakameshti and Divine Birth", beat: "Dasharatha performs yajna; Rama and brothers are born.", mantraFocus: "ramaNama" },
        { title: "Vishvamitra's Arrival", beat: "Rama and Lakshmana defend the yajna from demonic disruption.", mantraFocus: "ramaRaksha" },
        { title: "Ahalya Uddhara", beat: "Rama redeems Ahalya with compassionate grace.", mantraFocus: "shanti" },
        { title: "Janaka's Court and the Bow", beat: "Rama lifts and breaks Shiva's bow.", mantraFocus: "sitaMangala" },
        { title: "Sita-Rama Vivaaha", beat: "Sacred wedding rites and joyous union.", mantraFocus: "sitaMangala" },
      ],
      recommendedMantras: [MANTRAS.ramaNama, MANTRAS.sitaMangala, MANTRAS.shanti],
    },
    "Ayodhya Kanda": {
      name: "Ayodhya Kanda",
      summary: "Coronation halted, exile accepted, and Bharata's devotion to Rama's sandals.",
      mustIncludeThemes: ["dharma over power", "Kaikeyi's boons", "forest exile", "Bharata's loyalty"],
      episodeSeeds: [
        { title: "Coronation Preparations", beat: "Ayodhya celebrates Rama's upcoming rajyabhisheka.", mantraFocus: "ramaNama" },
        { title: "Kaikeyi's Two Boons", beat: "Rama accepts exile with serenity and obedience.", mantraFocus: "ramaRaksha" },
        { title: "Farewell to Ayodhya", beat: "Rama, Sita, Lakshmana leave palace life behind.", mantraFocus: "sitaMangala" },
        { title: "Dasharatha's Grief", beat: "King Dasharatha dies longing for Rama.", mantraFocus: "shanti" },
        { title: "Bharata and Paduka Pattabhisheka", beat: "Bharata rules as regent with Rama's sandals on throne.", mantraFocus: "ramaNama" },
      ],
      recommendedMantras: [MANTRAS.ramaNama, MANTRAS.ramaRaksha, MANTRAS.shanti],
    },
    "Aranya Kanda": {
      name: "Aranya Kanda",
      summary: "Forest life, Surpanakha episode, golden deer deception, and Sita's abduction.",
      mustIncludeThemes: ["rishi hermitages", "Surpanakha encounter", "Maricha's illusion", "Ravana abducts Sita"],
      episodeSeeds: [
        { title: "Life in Dandaka Forest", beat: "Rama protects sages and keeps vows of exile.", mantraFocus: "ramaRaksha" },
        { title: "Surpanakha's Humiliation", beat: "Lakshmana intervenes after Surpanakha attacks Sita.", mantraFocus: "ramaRaksha" },
        { title: "Golden Deer", beat: "Maricha lures Rama away by illusion.", mantraFocus: "shanti" },
        { title: "Lakshmana Rekha and Abduction", beat: "Ravana kidnaps Sita in mendicant disguise.", mantraFocus: "sitaMangala" },
        { title: "Jatayu's Last Stand", beat: "Jatayu battles Ravana and informs Rama before dying.", mantraFocus: "shanti" },
      ],
      recommendedMantras: [MANTRAS.ramaRaksha, MANTRAS.sitaMangala, MANTRAS.shanti],
    },
    "Kishkindha Kanda": {
      name: "Kishkindha Kanda",
      summary: "Alliance with Sugriva, Vali's fall, and search mission organized.",
      mustIncludeThemes: ["friendship oath", "Vali-Sugriva conflict", "Hanuman emerges", "search for Sita"],
      episodeSeeds: [
        { title: "Meeting Hanuman", beat: "Hanuman introduces Rama to Sugriva.", mantraFocus: "hanumanMula" },
        { title: "Rama-Sugriva Alliance", beat: "Sacred pact to recover kingdom and find Sita.", mantraFocus: "ramaNama" },
        { title: "Vali Vadha", beat: "Rama slays Vali and restores Sugriva's rule.", mantraFocus: "ramaRaksha" },
        { title: "Monsoon Delay", beat: "Lakshmana reminds Sugriva of his promise.", mantraFocus: "shanti" },
        { title: "Search Parties Deployed", beat: "Vanara sena spreads across directions.", mantraFocus: "hanumanMula" },
      ],
      recommendedMantras: [MANTRAS.hanumanMula, MANTRAS.ramaNama, MANTRAS.ramaRaksha],
    },
    "Sundara Kanda": {
      name: "Sundara Kanda",
      summary: "Hanuman's leap to Lanka, meeting Sita, and delivering Rama's ring.",
      mustIncludeThemes: ["ocean leap", "Ashoka Vatika", "Sita-Hanuman dialogue", "Lanka dahan"],
      episodeSeeds: [
        { title: "Leap Across the Ocean", beat: "Hanuman expands form and crosses the sea.", mantraFocus: "hanumanMula" },
        { title: "Entering Lanka", beat: "Hanuman scouts the city in subtle form.", mantraFocus: "hanumanMula" },
        { title: "Ashoka Vatika Darshan", beat: "Hanuman finds Sita in devotion under the tree.", mantraFocus: "sitaMangala" },
        { title: "Ring of Hope", beat: "Hanuman gives Rama's ring and receives chudamani.", mantraFocus: "ramaNama" },
        { title: "Burning of Lanka", beat: "Hanuman destroys arrogance and returns with message.", mantraFocus: "hanumanMula" },
      ],
      recommendedMantras: [MANTRAS.hanumanMula, MANTRAS.sitaMangala, MANTRAS.ramaNama],
    },
    "Yuddha Kanda": {
      name: "Yuddha Kanda",
      summary: "Bridge to Lanka, great war, Ravana's defeat, and Sita-Rama reunion.",
      mustIncludeThemes: ["setu bandhan", "war with Rakshasas", "Kumbhakarna/Indrajit", "Ravana vadha"],
      episodeSeeds: [
        { title: "Building Rama Setu", beat: "Vanara army builds bridge with Rama nama stones.", mantraFocus: "ramaNama" },
        { title: "Siege of Lanka", beat: "War formations and first major clashes.", mantraFocus: "ramaRaksha" },
        { title: "Lakshmana vs Indrajit", beat: "Indrajit falls and momentum shifts.", mantraFocus: "ramaRaksha" },
        { title: "Ravana's Final Battle", beat: "Rama destroys Ravana with Brahmastra.", mantraFocus: "ramaRaksha" },
        { title: "Return and Coronation", beat: "Ayodhya welcomes Rama; rajyabhisheka happens.", mantraFocus: "shanti" },
      ],
      recommendedMantras: [MANTRAS.ramaRaksha, MANTRAS.ramaNama, MANTRAS.shanti],
    },
    "Uttara Kanda": {
      name: "Uttara Kanda",
      summary: "Later reign, Sita's exile, Lava-Kusha story, and Rama's final ascent.",
      mustIncludeThemes: ["rajadharma complexity", "Valmiki ashram", "Lava-Kusha", "legacy of Rama rajya"],
      episodeSeeds: [
        { title: "Rama Rajya and Public Doubt", beat: "Rama prioritizes rajadharma amid social criticism.", mantraFocus: "shanti" },
        { title: "Sita at Valmiki Ashram", beat: "Sita finds refuge and spiritual strength.", mantraFocus: "sitaMangala" },
        { title: "Birth of Lava and Kusha", beat: "Princes are raised in dharma and music.", mantraFocus: "ramaNama" },
        { title: "Ramayana Sung in Court", beat: "Lava-Kusha narrate Rama's own story.", mantraFocus: "shanti" },
        { title: "Maha-Prasthana", beat: "Rama returns to his divine abode.", mantraFocus: "ramaNama" },
      ],
      recommendedMantras: [MANTRAS.shanti, MANTRAS.sitaMangala, MANTRAS.ramaNama],
    },
  },
  characterProfiles: [
    {
      name: "Shri Rama",
      aliases: ["Raghava", "Maryada Purushottama", "Ram"],
      visualDescription: "Blue-toned or lotus-complexioned prince with serene eyes, bow in hand, yellow/golden dhoti, kiritam crown in royal scenes and ascetic simplicity in exile scenes.",
      canonicalTraits: ["calm", "dharmic", "compassionate", "warrior precision"],
      promptBlock: "Rama should appear dignified and restrained; never rage-filled caricature. Keep posture upright, expression compassionate, and weapons traditional (Kodanda bow, quiver, occasional sword).",
    },
    {
      name: "Sita",
      aliases: ["Janaki", "Vaidehi", "Mithila princess"],
      visualDescription: "Graceful queenly figure in elegant sari (often saffron, red, or gold), minimal regal jewelry, lotus-like eyes, radiating purity and resilience.",
      canonicalTraits: ["compassion", "steadfastness", "inner strength", "devotional focus"],
      promptBlock: "Sita must be shown with dignity and spiritual strength; avoid passive-only portrayal. In Ashoka Vatika scenes, emphasize austerity and unwavering faith.",
    },
    {
      name: "Hanuman",
      aliases: ["Anjaneya", "Maruti", "Bajrangbali"],
      visualDescription: "Vanara hero with athletic build, expressive eyes, gada (mace), sacred thread, and orange/red dhoti; can shift between humble messenger and colossal warrior forms.",
      canonicalTraits: ["bhakti", "intelligence", "strength", "humility"],
      promptBlock: "Hanuman should feel both powerful and devotional. Include folded hands in Rama's presence and explosive kinetic energy in action scenes.",
    },
    {
      name: "Lakshmana",
      aliases: ["Saumitra"],
      visualDescription: "Younger prince similar royal lineage to Rama, slightly fiercer gaze, armed with bow and sword, simple forest attire during exile.",
      canonicalTraits: ["loyal", "alert", "protective", "disciplined"],
      promptBlock: "Lakshmana remains devoted and vigilant; avoid depicting him as reckless or disobedient toward Rama.",
    },
    {
      name: "Ravana",
      aliases: ["Dashanana", "Lankesh"],
      visualDescription: "Regal but intimidating king in dark jeweled armor, elaborate crown(s), scholarly-yet-arrogant demeanor, physically commanding with royal Lankan architecture around him.",
      canonicalTraits: ["brilliant", "ego-driven", "devotee-scholar", "tyrannical"],
      promptBlock: "Do not reduce Ravana to a comic villain; portray him as formidable and learned, while clearly morally opposed to dharma.",
    },
  ],
  globalAccuracyRules: [
    "Keep Kanda chronology intact: events must not be shuffled across major arcs.",
    "Rama and Sita are one married couple from Bala Kanda onward; never depict alternate romantic pairings.",
    "Hanuman meets Rama in Kishkindha Kanda; avoid introducing their alliance earlier.",
    "Ravana abducts Sita via deceit in Aranya Kanda; no mutual consent framing.",
    "Use respectful devotional tone for divine figures and sages.",
    "When uncertain between regional variants, default to core Valmiki-consistent storyline and avoid controversial additions.",
  ],
  forbiddenMistakes: [
    "Do not portray Ravana killing Rama (canonically false).",
    "Do not portray Sita as daughter of Ravana (non-canonical for this project).",
    "Do not place Lanka in the Himalayas; it is an island fortress in the south.",
    "Do not omit Lakshmana from exile arc scenes where he is canonically present.",
    "Do not use modern weapons, modern clothing, or futuristic architecture in canonical episodes.",
  ],
};

export function getKandaKnowledge(kandaName: string): KandaKnowledge | null {
  return RAMAYANA_KNOWLEDGE_BASE.kandas[kandaName as RamayanaKandaName] ?? null;
}

export function getMantraById(id: string): MantraEntry | null {
  return Object.values(MANTRAS).find((entry) => entry.id === id) ?? null;
}

export function isRamayanaContext(tags: string[], text?: string | null): boolean {
  const corpus = `${tags.join(" ")} ${text ?? ""}`.toLowerCase();
  const needles = ["ramayana", "rama", "sita", "hanuman", "ravana", "mythology", "kanda"];
  return needles.some((needle) => corpus.includes(needle));
}
