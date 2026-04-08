import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding 5 channels...");

  const channels = [
    {
      name: "DevLok",
      niche: "Hindu Mythology & Dev Stories",
      universe: "A",
      targetAudience: "18-35 spiritual/mythology enthusiasts, Hindi-speaking diaspora",
      primaryPlatform: "YouTube",
      secondaryPlatform: "Instagram",
      language: "Hindi",
      postingFrequency: "3x/week",
      contentPillars: [
        "Dev origin stories",
        "Epic battles from Puranas",
        "Cosmic events & avatars",
        "Hidden mythology facts",
        "Moral tales from Mahabharata/Ramayana",
      ],
      visualStyle:
        "Epic cinematic — golden hour lighting, jewel-toned palettes, divine glow effects, grand temples and cosmic vistas",
      voiceStyle: "Deep, reverent narrator — authoritative yet accessible, Sanskrit occasional",
      monetizationPriority: 1,
      status: "Active",
      defaultModelPref: "veo-heavy",
      maxBudgetPerVideo: 15,
      maxBudgetPerWeek: 75,
      formatStrategy:
        "3-5 min YouTube shorts hybrid: hook (15s) → myth reveal → cinematic scene → moral close",
      repurposingRules:
        "Cut 60s version for Instagram Reels; thumbnail must show deity face prominently",
    },
    {
      name: "BhaktiSwar",
      niche: "Devotional & Bhakti Content",
      universe: "A",
      targetAudience: "25-55 devotional audience, temple-goers, spiritual seekers",
      primaryPlatform: "YouTube",
      secondaryPlatform: "Facebook",
      language: "Hindi",
      postingFrequency: "5x/week",
      contentPillars: [
        "Morning aarti visuals",
        "Bhajan visualization",
        "Festival specials",
        "Pilgrimage journeys",
        "Saint stories",
      ],
      visualStyle:
        "Warm, devotional — soft saffron and gold tones, incense smoke effects, temple architecture, peaceful deities",
      voiceStyle: "Calm, melodious, devotional tone — like a temple priest reading",
      monetizationPriority: 2,
      status: "Active",
      defaultModelPref: "kling-heavy",
      maxBudgetPerVideo: 8,
      maxBudgetPerWeek: 40,
      formatStrategy:
        "2-4 min ambient devotional videos; festival shorts go viral; pair with bhajan audio",
      repurposingRules:
        "WhatsApp-friendly 60s cuts; vertical format for Reels; add subtitle text for silent viewing",
    },
    {
      name: "ToonVerse",
      niche: "Original Cartoon Characters & Animated Stories",
      universe: "B",
      targetAudience: "6-14 kids + nostalgic 20-35 adults, global English audience",
      primaryPlatform: "YouTube",
      secondaryPlatform: "Instagram",
      language: "English",
      postingFrequency: "3x/week",
      contentPillars: [
        "Character origin episodes",
        "Friendship & adventure arcs",
        "Comedy shorts",
        "Holiday specials",
        "Villain vs hero clashes",
      ],
      visualStyle:
        "Bright, vibrant 2.5D animation aesthetic — bold outlines, exaggerated expressions, saturated colors, comic-book panels",
      voiceStyle: "Energetic, playful narrator — fast pacing, fun sound effects",
      monetizationPriority: 1,
      status: "Active",
      defaultModelPref: "kling-heavy",
      maxBudgetPerVideo: 12,
      maxBudgetPerWeek: 60,
      formatStrategy:
        "5-8 min episodic YouTube content with cliffhangers; 30s teasers for Shorts/Reels",
      repurposingRules:
        "Character highlight clips for Shorts; reaction thumbnails perform best; keep lore consistent",
    },
    {
      name: "BeastBit",
      niche: "Creature & Mascot Universe",
      universe: "B",
      targetAudience: "10-25 gamers, creature-design fans, fantasy/sci-fi audience",
      primaryPlatform: "YouTube",
      secondaryPlatform: "TikTok",
      language: "English",
      postingFrequency: "4x/week",
      contentPillars: [
        "Creature ability reveals",
        "Beast battles",
        "World-building lore drops",
        "Evolution arcs",
        "Community fan creatures",
      ],
      visualStyle:
        "Dark fantasy meets game cinematic — moody lighting, bioluminescent accents, battle smoke, dynamic creature angles",
      voiceStyle: "Hype announcer style — cinematic drops, mysterious lore tone for backstories",
      monetizationPriority: 2,
      status: "Testing",
      defaultModelPref: "veo-heavy",
      maxBudgetPerVideo: 14,
      maxBudgetPerWeek: 70,
      formatStrategy:
        "60-90s creature reveal Shorts + 5 min lore deep-dives on main channel; fan votes drive creature designs",
      repurposingRules:
        "TikTok gets 30s battle clips; Reddit-style 'who would win' thumbnails; always end with cliffhanger",
    },
    {
      name: "AgniBhojan",
      niche: "Cinematic Cooking Spectacle",
      universe: "C",
      targetAudience: "20-45 food lovers, ASMR fans, travel-food enthusiasts globally",
      primaryPlatform: "YouTube",
      secondaryPlatform: "Instagram",
      language: "English",
      postingFrequency: "4x/week",
      contentPillars: [
        "Street food cinematics",
        "Ancient recipe recreations",
        "Fire cooking techniques",
        "Regional Indian cuisine spotlights",
        "Extreme portion / feast videos",
      ],
      visualStyle:
        "Ultra-cinematic food — macro lens steam shots, golden oil pours, fire sparks, slow-motion sizzle, deep warm tones",
      voiceStyle: "Lush, sensory narrator — evocative, ASMR-influenced, slightly theatrical",
      monetizationPriority: 1,
      status: "Active",
      defaultModelPref: "kling-heavy",
      maxBudgetPerVideo: 10,
      maxBudgetPerWeek: 50,
      formatStrategy:
        "60-90s hypnotic food Shorts are primary growth driver; 5-10 min documentaries for long-form",
      repurposingRules:
        "Isolate sizzle moments for 15s Reels; ingredient close-ups as standalone ASMR Shorts; add location text overlays",
    },
  ];

  for (const channel of channels) {
    const existing = await prisma.channel.findFirst({ where: { name: channel.name } });
    if (existing) {
      console.log(`  ✓ ${channel.name} already exists — skipping`);
      continue;
    }
    await prisma.channel.create({ data: channel });
    console.log(`  + Created ${channel.name} (Universe ${channel.universe})`);
  }

  // ── Ramayana Characters ────────────────────────────────────────────────────
  console.log("\nSeeding Ramayana characters...");
  const devlok = await prisma.channel.findFirst({ where: { name: "DevLok" } });
  if (devlok) {
    const ramayanaCharacters = [
      {
        name: "राम",
        speciesOrType: "Divine Human (Vishnu Avatar)",
        personality: "शांत, धर्मनिष्ठ, करुणामय, वीर — मर्यादा पुरुषोत्तम",
        visualReferences: [
          "नीले रंग की त्वचा, सुनहरा मुकुट, पीले वस्त्र, धनुष-बाण हमेशा साथ",
          "लंबा कद, चौड़ी छाती, शांत आँखें, माथे पर तिलक",
          "दिव्य प्रकाश से घिरे, कमल जैसे नेत्र, वनवास में साधारण जटा-मुकुट"
        ],
        clothingRules: "राज्याभिषेक में: सोने का मुकुट + पीले रेशमी वस्त्र | वनवास में: जटा + भूरे/सफेद वल्कल वस्त्र | युद्ध में: कवच + धनुष",
        colorPalette: ["#1a4a8a", "#ffd700", "#ff8c00", "#ffffff"],
        worldRole: "नायक — विष्णु के सातवें अवतार, धर्म की स्थापना के लिए जन्मे",
        restrictedChanges: ["त्वचा का रंग नीला ही रहे", "धनुष हमेशा साथ हो", "मुखमण्डल शांत और दिव्य हो"],
        samplePoses: ["धनुष तानते हुए", "सिंहासन पर बैठे", "वन में चलते हुए", "हनुमान को आशीर्वाद देते"],
        preferredModel: "kling-3.0",
        universeId: "A",
        seriesIds: [],
        channelId: devlok.id,
        approvedImages: [],
        approvedExpressions: [],
      },
      {
        name: "सीता",
        speciesOrType: "Divine Human (Bhumi Devi Avatar)",
        personality: "पतिव्रता, साहसी, धैर्यशाली, करुणामयी — आदर्श नारी",
        visualReferences: [
          "सुनहरी आभा वाली त्वचा, लाल-सुनहरी साड़ी, माथे पर सिंदूर",
          "कोमल मुखमण्डल, लंबे काले बाल, गले में मंगलसूत्र",
          "वनवास में: सरल वस्त्र, फिर भी दिव्य सौंदर्य"
        ],
        clothingRules: "अयोध्या में: लाल-सुनहरी साड़ी + आभूषण | वनवास में: सरल पीली साड़ी | लंका में: सफेद वस्त्र (अशोक वाटिका)",
        colorPalette: ["#ffd700", "#dc143c", "#ffffff", "#ff8c00"],
        worldRole: "नायिका — भूमि देवी की पुत्री, सत्य और पवित्रता की प्रतीक",
        restrictedChanges: ["सौंदर्य दिव्य और कोमल हो", "आँखें बड़ी और करुणामयी हों"],
        samplePoses: ["वनवास में राम के साथ", "अशोक वाटिका में बैठी", "अग्नि परीक्षा में खड़ी", "स्वयंवर में"],
        preferredModel: "kling-3.0",
        universeId: "A",
        seriesIds: [],
        channelId: devlok.id,
        approvedImages: [],
        approvedExpressions: [],
      },
      {
        name: "लक्ष्मण",
        speciesOrType: "Divine Human (Shesha Avatar)",
        personality: "भ्राता-भक्त, क्रोधी परंतु धर्मनिष्ठ, तीव्र बुद्धि, अटल सेवक",
        visualReferences: [
          "गोरी-सांवली त्वचा, हमेशा सतर्क मुद्रा, धनुष-तरकश साथ",
          "छोटे बाल या जटा, लाल-सोने का कवच, तीखी नज़र",
          "राम की छाया की तरह — हर पल पास खड़े"
        ],
        clothingRules: "वनवास में: हरे/भूरे वल्कल वस्त्र + कवच | युद्ध में: पूर्ण कवच",
        colorPalette: ["#228b22", "#ffd700", "#8b4513", "#ff6347"],
        worldRole: "राम के अनुज, शेषनाग के अवतार, सेवा और भक्ति के प्रतीक",
        restrictedChanges: ["हमेशा राम के साथ या उनकी रक्षा में दिखें", "भाव सतर्क और समर्पित हो"],
        samplePoses: ["राम की पहरेदारी करते", "युद्ध में धनुष तानते", "शक्ति लगने पर मूर्छित"],
        preferredModel: "kling-3.0",
        universeId: "A",
        seriesIds: [],
        channelId: devlok.id,
        approvedImages: [],
        approvedExpressions: [],
      },
      {
        name: "हनुमान",
        speciesOrType: "Vanara (Divine Monkey — Rudra Avatar)",
        personality: "भक्त शिरोमणि, असीम शक्तिशाली, विनम्र, बुद्धिमान, वायु-पुत्र",
        visualReferences: [
          "नारंगी-लाल वानर रूप, विशाल शरीर, लंबी पूंछ, गदा हाथ में",
          "माथे पर राम-नाम, भक्ति से भरे नेत्र, कभी विराट कभी लघु रूप",
          "उड़ते समय: विशाल पंख-जैसी छलांग, पूंछ में अग्नि (लंका दहन)"
        ],
        clothingRules: "सदा: नारंगी धोती + यज्ञोपवीत | लंका में: पूंछ में आग | उड़ान में: विराट रूप",
        colorPalette: ["#ff6600", "#ff4500", "#ffd700", "#8b0000"],
        worldRole: "राम के परम भक्त, सेतु निर्माण और लंका दहन के नायक",
        restrictedChanges: ["वानर रूप स्पष्ट हो", "भाव में भक्ति और शक्ति दोनों हों"],
        samplePoses: ["समुद्र लांघते हुए", "राम को प्रणाम करते", "लंका दहन", "संजीवनी लाते हुए पर्वत उठाए"],
        preferredModel: "kling-3.0",
        universeId: "A",
        seriesIds: [],
        channelId: devlok.id,
        approvedImages: [],
        approvedExpressions: [],
      },
      {
        name: "रावण",
        speciesOrType: "Rakshasa King (Brahmin lineage)",
        personality: "अहंकारी, विद्वान, शक्तिशाली, शिव-भक्त — खलनायक परंतु वीर",
        visualReferences: [
          "दस सिर, बीस भुजाएं, सोने का मुकुट, लाल नेत्र",
          "काला-सांवला विशाल शरीर, सोने का कवच, सभी अस्त्र-शस्त्र",
          "सिंहासन पर: राजसी वस्त्र | युद्ध में: पूर्ण कवच"
        ],
        clothingRules: "हमेशा: सोने का मुकुट, सोने का कवच, लाल-सोने के राजसी वस्त्र",
        colorPalette: ["#8b0000", "#ffd700", "#000000", "#ff4500"],
        worldRole: "लंका का राजा, खलनायक, सीता हरण का कारण",
        restrictedChanges: ["दस सिर स्पष्ट दिखें", "आँखें लाल और क्रोधित हों", "राजसी भव्यता बनाए रखें"],
        samplePoses: ["दरबार में सिंहासन पर", "सीता को धमकाते", "राम से युद्ध करते", "शिव तांडव स्तोत्र गाते"],
        preferredModel: "kling-3.0",
        universeId: "A",
        seriesIds: [],
        channelId: devlok.id,
        approvedImages: [],
        approvedExpressions: [],
      },
      {
        name: "दशरथ",
        speciesOrType: "Human King",
        personality: "वीर राजा, पुत्र-प्रेमी, वचन-बद्ध, दुखी पिता",
        visualReferences: [
          "वृद्ध परंतु तेजस्वी, सफेद दाढ़ी, सोने का राजमुकुट",
          "राजसी वस्त्र, शोक में श्वेत वस्त्र, अंत में रोते हुए"
        ],
        clothingRules: "राजदरबार में: सोने का मुकुट + राजसी वस्त्र | शोक में: श्वेत वस्त्र",
        colorPalette: ["#ffd700", "#ffffff", "#8b7355", "#c0c0c0"],
        worldRole: "अयोध्या के राजा, राम के पिता",
        restrictedChanges: ["वृद्धावस्था स्पष्ट हो", "राजसी गरिमा बनाए रखें"],
        samplePoses: ["राजसिंहासन पर", "राम को गले लगाते", "कैकेयी को वचन देते", "शोक में लेटे"],
        preferredModel: "kling-3.0",
        universeId: "A",
        seriesIds: [],
        channelId: devlok.id,
        approvedImages: [],
        approvedExpressions: [],
      },
      {
        name: "कैकेयी",
        speciesOrType: "Human Queen",
        personality: "सुंदर, एक बार साहसी योद्धा, बाद में मंथरा के प्रभाव में — जटिल चरित्र",
        visualReferences: [
          "अत्यंत सुंदर, लाल-सोने के वस्त्र, राजसी आभूषण",
          "क्रोधी मुद्रा में: भौंहें तनी, होंठ कसे",
          "कोपभवन में: उलझे बाल, कच्चे वस्त्र, फर्श पर"
        ],
        clothingRules: "सामान्य: राजसी लाल-सोने के वस्त्र | कोपभवन में: बिखरे वस्त्र",
        colorPalette: ["#dc143c", "#ffd700", "#800080", "#ff69b4"],
        worldRole: "दशरथ की प्रिय रानी, भरत की माँ, वनवास का कारण",
        restrictedChanges: ["सौंदर्य और क्रूरता दोनों एक साथ दिखाएं"],
        samplePoses: ["कोपभवन में", "दशरथ से वरदान माँगते", "मंथरा की बात सुनते"],
        preferredModel: "kling-3.0",
        universeId: "A",
        seriesIds: [],
        channelId: devlok.id,
        approvedImages: [],
        approvedExpressions: [],
      },
      {
        name: "मंथरा",
        speciesOrType: "Human (Kaikeyi's maid)",
        personality: "कुटिल, ईर्ष्यालु, षड्यंत्रकारी — खलपात्र",
        visualReferences: [
          "कुबड़ी बूढ़ी स्त्री, झुकी कमर, छोटे-चालाक नेत्र",
          "साधारण वस्त्र, बुरी हँसी, हमेशा कैकेयी के कान में"
        ],
        clothingRules: "गहरे रंग के साधारण वस्त्र, कोई आभूषण नहीं",
        colorPalette: ["#4a4a4a", "#8b4513", "#2f4f4f"],
        worldRole: "कैकेयी की दासी, राम के वनवास की मुख्य षड्यंत्रकर्ता",
        restrictedChanges: ["कुबड़ापन और कुटिल भाव स्पष्ट हो"],
        samplePoses: ["कैकेयी के कान में फुसफुसाते", "षड्यंत्र करते", "हाथ मलते"],
        preferredModel: "kling-3.0",
        universeId: "A",
        seriesIds: [],
        channelId: devlok.id,
        approvedImages: [],
        approvedExpressions: [],
      },
      {
        name: "भरत",
        speciesOrType: "Human Prince",
        personality: "अत्यंत धर्मनिष्ठ, राम-भक्त, माँ के कृत्य से व्यथित, त्यागी",
        visualReferences: [
          "राम जैसा दिखता है, सांवला, तेजस्वी",
          "राम की खड़ाऊं लेकर: सरल वस्त्र, दुखी मुखमण्डल",
          "कभी राजसिंहासन पर नहीं बैठे — खड़ाऊं को सिंहासन पर रखा"
        ],
        clothingRules: "राम के वनवास के बाद: सरल वस्त्र + जटा, राजा होते हुए भी तपस्वी जीवन",
        colorPalette: ["#ff8c00", "#ffd700", "#8b7355"],
        worldRole: "अयोध्या का राजा — पर राम की खड़ाऊं के नाम पर राज",
        restrictedChanges: ["भाव में विरह और समर्पण हो"],
        samplePoses: ["राम की खड़ाऊं पूजते", "चित्रकूट में राम के चरण पकड़ते", "अयोध्या में तपस्वी जीवन"],
        preferredModel: "kling-3.0",
        universeId: "A",
        seriesIds: [],
        channelId: devlok.id,
        approvedImages: [],
        approvedExpressions: [],
      },
      {
        name: "विभीषण",
        speciesOrType: "Rakshasa (Righteous)",
        personality: "धर्मनिष्ठ राक्षस, सत्य का साथ देने वाला, रावण का छोटा भाई",
        visualReferences: [
          "राक्षस रूप परंतु शांत मुखमण्डल, सफेद/हल्के वस्त्र",
          "रावण जैसा दिखता है परंतु एक सिर, शांत नेत्र",
          "हाथ जोड़े राम की शरण में"
        ],
        clothingRules: "लंका में: राजसी वस्त्र | राम की शरण के बाद: सरल सफेद वस्त्र",
        colorPalette: ["#ffffff", "#4169e1", "#ffd700"],
        worldRole: "रावण का भाई, राम का भक्त, लंका का धर्मी राजा",
        restrictedChanges: ["चेहरे पर शांति और धर्म का भाव हो — क्रूरता नहीं"],
        samplePoses: ["राम की शरण में", "लंका राज्याभिषेक", "रावण को समझाते"],
        preferredModel: "kling-3.0",
        universeId: "A",
        seriesIds: [],
        channelId: devlok.id,
        approvedImages: [],
        approvedExpressions: [],
      },
      {
        name: "सुग्रीव",
        speciesOrType: "Vanara King",
        personality: "भयभीत, फिर राम-मित्र, योद्धा वानर राजा",
        visualReferences: [
          "सुनहरे रंग का वानर, राजसी वानर-मुकुट",
          "मध्यम कद, हमेशा सतर्क, किष्किन्धा का राजा बनने के बाद राजसी"
        ],
        clothingRules: "बाली के भय में: साधारण | राजा बनने के बाद: सोने के आभूषण + वानर-मुकुट",
        colorPalette: ["#ffd700", "#ff8c00", "#8b4513"],
        worldRole: "वानरराज, राम का मित्र, सेना का राजा",
        restrictedChanges: ["सुनहरा रंग बाली से अलग पहचान के लिए"],
        samplePoses: ["राम से मित्रता करते", "बाली के विरुद्ध युद्ध", "वानर सेना को आदेश देते"],
        preferredModel: "kling-3.0",
        universeId: "A",
        seriesIds: [],
        channelId: devlok.id,
        approvedImages: [],
        approvedExpressions: [],
      },
      {
        name: "जटायु",
        speciesOrType: "Divine Eagle (Garuda lineage)",
        personality: "वृद्ध परंतु वीर, दशरथ का मित्र, धर्म के लिए प्राण देने वाला",
        visualReferences: [
          "विशाल गरुड़ जैसा गिद्ध, भूरे-सोने के पंख, तीखी नज़र",
          "रावण से युद्ध में घायल, टूटे पंख, फिर भी लड़ते हुए",
          "राम की गोद में अंतिम सांस"
        ],
        clothingRules: "पक्षी रूप — कोई वस्त्र नहीं, पंखों का रंग ही पहचान",
        colorPalette: ["#8b4513", "#ffd700", "#8b0000", "#ff6347"],
        worldRole: "दशरथ का मित्र गिद्धराज, सीता की रक्षा में शहीद",
        restrictedChanges: ["विशालता स्पष्ट हो", "युद्ध में घायल अवस्था दिखाएं"],
        samplePoses: ["उड़ते हुए", "रावण से युद्ध", "राम की गोद में"],
        preferredModel: "kling-3.0",
        universeId: "A",
        seriesIds: [],
        channelId: devlok.id,
        approvedImages: [],
        approvedExpressions: [],
      },
      {
        name: "कुंभकर्ण",
        speciesOrType: "Rakshasa (Giant)",
        personality: "विशाल, हमेशा सोने वाला, भाई-प्रेमी, अनिच्छा से युद्ध में",
        visualReferences: [
          "अत्यंत विशाल — पहाड़ जैसा, नींद भरी आँखें",
          "काला-भूरा विशाल शरीर, ढीले वस्त्र, जागते ही भूखा"
        ],
        clothingRules: "विशाल ढीले वस्त्र, कोई कवच नहीं — शरीर ही कवच",
        colorPalette: ["#2f4f4f", "#8b4513", "#000000"],
        worldRole: "रावण का भाई, जागने पर युद्धभूमि पर भयंकर विनाश",
        restrictedChanges: ["विशालता हमेशा दिखाई दे — मनुष्यों से 10 गुना बड़ा"],
        samplePoses: ["सोते हुए", "जागते हुए (गुस्से में)", "युद्धभूमि पर विनाश करते"],
        preferredModel: "kling-3.0",
        universeId: "A",
        seriesIds: [],
        channelId: devlok.id,
        approvedImages: [],
        approvedExpressions: [],
      },
      {
        name: "विश्वामित्र",
        speciesOrType: "Brahmarishi",
        personality: "तेजस्वी ऋषि, कठोर तपस्वी, राम के प्रथम गुरु",
        visualReferences: [
          "वृद्ध महर्षि, लंबी सफेद दाढ़ी, तेजस्वी नेत्र, दण्ड हाथ में",
          "भगवा वस्त्र, जटा-मुकुट, आभामंडल"
        ],
        clothingRules: "सदा: भगवा/गेरुए वस्त्र + दण्ड + यज्ञोपवीत",
        colorPalette: ["#ff8c00", "#ffffff", "#ffd700"],
        worldRole: "राम-लक्ष्मण के प्रथम गुरु, यज्ञ रक्षक",
        restrictedChanges: ["तेजस्विता और ऋषि-भाव स्पष्ट हो"],
        samplePoses: ["अयोध्या में दशरथ से राम माँगते", "यज्ञ करते", "राम को शिक्षा देते"],
        preferredModel: "kling-3.0",
        universeId: "A",
        seriesIds: [],
        channelId: devlok.id,
        approvedImages: [],
        approvedExpressions: [],
      },
      {
        name: "शबरी",
        speciesOrType: "Human (Bhil Tribe, devotee)",
        personality: "परम भक्त, सरल, वर्षों से राम की प्रतीक्षा में",
        visualReferences: [
          "वृद्ध आदिवासी स्त्री, साधारण वस्त्र, हाथ में बेर",
          "झोपड़ी के बाहर राम की राह देखती, आँखों में भक्ति के आँसू"
        ],
        clothingRules: "साधारण मटमैले वस्त्र, कोई आभूषण नहीं",
        colorPalette: ["#8b7355", "#daa520", "#228b22"],
        worldRole: "भक्ति की प्रतीक — बेर चखकर राम को देती है",
        restrictedChanges: ["वृद्धावस्था और सरलता स्पष्ट हो"],
        samplePoses: ["राम की प्रतीक्षा में", "बेर राम को अर्पण करते", "राम के चरणों में"],
        preferredModel: "kling-3.0",
        universeId: "A",
        seriesIds: [],
        channelId: devlok.id,
        approvedImages: [],
        approvedExpressions: [],
      },
    ];

    for (const char of ramayanaCharacters) {
      const existing = await prisma.character.findFirst({
        where: { name: char.name, channelId: devlok.id },
      });
      if (existing) {
        console.log(`  ✓ ${char.name} already exists — skipping`);
        continue;
      }
      await prisma.character.create({ data: char });
      console.log(`  + Created character: ${char.name}`);
    }
  } else {
    console.log("  ⚠ DevLok channel not found — skipping character seed");
  }

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
