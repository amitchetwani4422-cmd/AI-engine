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

  // ── Bala Kanda Story Beats (1–12) ─────────────────────────────────────────
  console.log("\nSeeding Bala Kanda story beats...");
  const balaBeats = [
    {
      kanda: "Bala", kandaNumber: 1, beatNumber: 1, globalSequence: 1,
      titleHindi: "पुत्रकामेष्टि यज्ञ",
      summaryHindi: "राजा दशरथ को कोई संतान नहीं थी। महर्षि वशिष्ठ की सलाह पर उन्होंने ऋषि श्रृंगी से पुत्रकामेष्टि यज्ञ करवाया। यज्ञ की अग्नि से एक दिव्य पुरुष खीर का पात्र लेकर प्रकट हुआ।",
      storyPoints: ["दशरथ की पुत्र की तीव्र इच्छा", "महर्षि वशिष्ठ की सलाह", "ऋषि श्रृंगी का आगमन", "विशाल यज्ञ का आयोजन", "अग्नि से दिव्य पुरुष का प्रकट होना", "तीनों रानियों को खीर प्रदान"],
      characters: ["दशरथ", "विश्वामित्र"],
      keyMantra: "ॐ नमो भगवते वासुदेवाय",
      mantraHindi: "भगवान वासुदेव को नमस्कार — विष्णु अवतार के आगमन की प्रार्थना",
      hookLine: "एक राजा था जिसके पास सब कुछ था — सिवाय एक चीज़ के...",
      emotionalTone: "आस्था, प्रतीक्षा, दिव्य उत्साह",
      visualTone: "विशाल यज्ञशाला, अग्नि की लपटें, सोने का महल, दिव्य प्रकाश",
    },
    {
      kanda: "Bala", kandaNumber: 1, beatNumber: 2, globalSequence: 2,
      titleHindi: "राम का जन्म",
      summaryHindi: "चैत्र शुक्ल नवमी को कौशल्या के गर्भ से भगवान राम का जन्म हुआ। जन्म लेते ही शिशु के मुख पर दिव्य तेज था। समस्त देवता पुष्प वर्षा करने लगे और अयोध्या में आनंद छा गया।",
      storyPoints: ["चैत्र नवमी का पुण्य दिन", "कौशल्या के गर्भ से जन्म", "नीले रंग का दिव्य शिशु", "देवताओं की पुष्प वर्षा", "अयोध्या में उत्सव", "दशरथ का अपार हर्ष"],
      characters: ["राम", "दशरथ"],
      keyMantra: "रामं दशरथी शान्तं सीतापतिमनिन्दितम् | कौसल्याप्रियनन्दनम्",
      mantraHindi: "दशरथ-पुत्र, शांत स्वभाव के, सीता के पति, कौशल्या के प्रिय नंदन राम",
      hookLine: "जब स्वर्ग से विष्णु ने धरती पर पहला कदम रखा...",
      emotionalTone: "आनंद, भक्ति, दिव्यता",
      visualTone: "सोने का महल, पुष्प वर्षा, नीली आभा, दीप जलते हुए",
    },
    {
      kanda: "Bala", kandaNumber: 1, beatNumber: 3, globalSequence: 3,
      titleHindi: "बाल लीलाएं",
      summaryHindi: "चारों भाई — राम, भरत, लक्ष्मण, शत्रुघ्न — महल में खेलते, गुरुकुल में पढ़ते। राम और लक्ष्मण में अलग से विशेष प्रेम था। महर्षि वशिष्ठ ने उन्हें वेद, शस्त्र और धर्म की शिक्षा दी।",
      storyPoints: ["चारों भाइयों की बाल लीलाएं", "राम-लक्ष्मण का अटूट प्रेम", "गुरुकुल में शिक्षा", "वशिष्ठ से वेद-शस्त्र की विद्या", "अयोध्या की प्रजा का स्नेह"],
      characters: ["राम", "लक्ष्मण", "भरत", "दशरथ"],
      keyMantra: null,
      mantraHindi: null,
      hookLine: "चार राजकुमार, एक महल — और एक दोस्ती जो युगों तक चली...",
      emotionalTone: "बचपन की मासूमियत, भाई-प्रेम, आनंद",
      visualTone: "सुनहरा महल, हरे बगीचे, बच्चों की मुस्कान, गुरुकुल की धूनी",
    },
    {
      kanda: "Bala", kandaNumber: 1, beatNumber: 4, globalSequence: 4,
      titleHindi: "विश्वामित्र का आगमन",
      summaryHindi: "महर्षि विश्वामित्र अयोध्या आए और राजा दशरथ से राम को माँगा — यज्ञ की रक्षा के लिए। दशरथ घबरा गए, परंतु वशिष्ठ की सलाह पर राम-लक्ष्मण को विश्वामित्र के साथ भेजा।",
      storyPoints: ["विश्वामित्र का अचानक आगमन", "यज्ञ रक्षा के लिए राम की माँग", "दशरथ का विरोध और घबराहट", "वशिष्ठ की सलाह", "राम-लक्ष्मण की विदाई"],
      characters: ["विश्वामित्र", "दशरथ", "राम", "लक्ष्मण"],
      keyMantra: "गुरुर्ब्रह्मा गुरुर्विष्णुः गुरुर्देवो महेश्वरः",
      mantraHindi: "गुरु ही ब्रह्मा, विष्णु और शिव हैं — गुरु की आज्ञा ही सर्वोपरि",
      hookLine: "एक ऋषि आया और राजा से माँगी उसकी सबसे कीमती चीज़...",
      emotionalTone: "तनाव, गुरु-भक्ति, साहस",
      visualTone: "राजदरबार, ऋषि का तेज, दशरथ की चिंता, राम का शांत चेहरा",
    },
    {
      kanda: "Bala", kandaNumber: 1, beatNumber: 5, globalSequence: 5,
      titleHindi: "ताड़का वध",
      summaryHindi: "वन में राक्षसी ताड़का ने राम-लक्ष्मण पर आक्रमण किया। विश्वामित्र के आदेश पर राम ने ताड़का का वध किया। यह राम का पहला युद्ध था — एक स्त्री राक्षस के विरुद्ध।",
      storyPoints: ["ताड़का का भयंकर रूप", "विश्वामित्र का आदेश", "राम का संशय — स्त्री पर बाण?", "धर्म की समझ", "ताड़का वध", "देवताओं की जयकार"],
      characters: ["राम", "लक्ष्मण", "विश्वामित्र"],
      keyMantra: "तमेव शरणं गच्छ सर्वभावेन भारत",
      mantraHindi: "उसी परमेश्वर की शरण लो — राम ने धर्म को समझ कर बाण चलाया",
      hookLine: "पहला युद्ध, पहली परीक्षा — और धर्म का पहला सबक...",
      emotionalTone: "वीरता, धर्म-संशय, विजय",
      visualTone: "घना वन, राक्षसी का भयंकर रूप, बाण की चमक, अंधेरे में प्रकाश",
    },
    {
      kanda: "Bala", kandaNumber: 1, beatNumber: 6, globalSequence: 6,
      titleHindi: "अहिल्या उद्धार",
      summaryHindi: "गौतम ऋषि के आश्रम में अहिल्या पत्थर बनी पड़ी थीं — शाप के कारण। राम के चरण-स्पर्श से अहिल्या का उद्धार हुआ। वे स्त्री रूप में वापस आ गईं और राम को आशीर्वाद दिया।",
      storyPoints: ["पत्थर बनी अहिल्या का दर्शन", "विश्वामित्र द्वारा कथा सुनाना", "राम के चरण-स्पर्श से मुक्ति", "अहिल्या का पुनर्जन्म", "आशीर्वाद और आभार"],
      characters: ["राम", "लक्ष्मण", "विश्वामित्र"],
      keyMantra: "अहिल्या द्रौपदी सीता तारा मंदोदरी तथा | पञ्चकन्याः स्मरेन्नित्यं महापातकनाशनम्",
      mantraHindi: "अहिल्या, द्रौपदी, सीता, तारा, मंदोदरी — इन पाँच महानारियों का स्मरण पापनाशक है",
      hookLine: "एक स्पर्श जो हजारों साल का शाप मिटा सकता था...",
      emotionalTone: "करुणा, मोक्ष, दिव्य शक्ति",
      visualTone: "सुनसान आश्रम, पत्थर का रूप, राम के चरणों से प्रकाश, नारी का पुनः जीवन",
    },
    {
      kanda: "Bala", kandaNumber: 1, beatNumber: 7, globalSequence: 7,
      titleHindi: "जनकपुर में प्रवेश",
      summaryHindi: "राम और लक्ष्मण विश्वामित्र के साथ जनकपुर पहुँचे। राजा जनक के महल में स्वयंवर की तैयारी थी। राम ने सीता को पहली बार देखा — दोनों की आँखें मिलीं और मन में प्रेम जागा।",
      storyPoints: ["जनकपुर का वैभव", "स्वयंवर की तैयारी", "राम-सीता की पहली दृष्टि", "मौन प्रेम", "विश्वामित्र की प्रसन्नता"],
      characters: ["राम", "लक्ष्मण", "सीता", "विश्वामित्र"],
      keyMantra: null,
      mantraHindi: null,
      hookLine: "जब पहली नज़र में पूरी दुनिया थम गई...",
      emotionalTone: "प्रथम प्रेम, विस्मय, दिव्य आकर्षण",
      visualTone: "भव्य नगर, फूलों की वर्षा, राम-सीता की आँखें, सोने का महल",
    },
    {
      kanda: "Bala", kandaNumber: 1, beatNumber: 8, globalSequence: 8,
      titleHindi: "शिव धनुष का भार",
      summaryHindi: "जनक ने घोषणा की — जो शिव के धनुष को उठाए, उसी से सीता का विवाह होगा। अनेक राजा आए परंतु धनुष को हिला भी नहीं सके। राम विश्वामित्र की आज्ञा से उठे।",
      storyPoints: ["जनक की चुनौती", "राजाओं की असफलता", "विश्वामित्र का आदेश", "राम का उठना", "सबकी निगाहें राम पर"],
      characters: ["राम", "सीता", "विश्वामित्र"],
      keyMantra: "शिवं शिवकरं शान्तं शिवात्मानं शिवोत्तमम्",
      mantraHindi: "भगवान शिव का स्मरण — जिनका धनुष उठाना था",
      hookLine: "हज़ारों राजा आए — पर शिव का धनुष किसी ने नहीं हिलाया...",
      emotionalTone: "सस्पेंस, प्रतीक्षा, दिव्य शक्ति",
      visualTone: "विशाल सभागार, भारी धनुष, असफल राजा, राम की शांत चाल",
    },
    {
      kanda: "Bala", kandaNumber: 1, beatNumber: 9, globalSequence: 9,
      titleHindi: "धनुष भंग",
      summaryHindi: "राम ने शिव धनुष को उठाया, प्रत्यंचा चढ़ाई — और धनुष टूट गया। टूटने की आवाज़ तीनों लोकों में गूँज गई। सीता ने राम के गले में वरमाला डाली। देवताओं ने पुष्प वर्षा की।",
      storyPoints: ["राम का धनुष उठाना", "प्रत्यंचा चढ़ाना", "भयंकर टूटने की आवाज़", "सीता द्वारा वरमाला", "देवताओं की पुष्प वर्षा", "जनक का आनंद"],
      characters: ["राम", "सीता", "विश्वामित्र"],
      keyMantra: "रामो राजमणिः सदा विजयते रामं रमेशं भजे",
      mantraHindi: "राम राजाओं के शिरोमणि हैं, सदा विजयी — राम की महिमा",
      hookLine: "वो आवाज़ जो तीनों लोकों में गूँजी — और एक इतिहास बदल गया...",
      emotionalTone: "विजय, प्रेम, दिव्य उत्सव",
      visualTone: "टूटता धनुष, सोने की वरमाला, पुष्प वर्षा, राम-सीता का मिलन",
    },
    {
      kanda: "Bala", kandaNumber: 1, beatNumber: 10, globalSequence: 10,
      titleHindi: "परशुराम का क्रोध",
      summaryHindi: "धनुष टूटने की आवाज़ सुन कर परशुराम क्रोध में प्रकट हुए। उन्होंने राम को ललकारा। राम ने शांति से उत्तर दिया। अंत में परशुराम को राम में विष्णु का दर्शन हुआ और उन्होंने शीश नवाया।",
      storyPoints: ["परशुराम का क्रोधित आगमन", "शिव धनुष टूटने पर क्रोध", "राम को चुनौती", "राम का शांत और दृढ़ उत्तर", "परशुराम को राम में विष्णु दर्शन", "परशुराम का नमन"],
      characters: ["राम", "लक्ष्मण", "विश्वामित्र"],
      keyMantra: "क्रोधो मूलमनर्थानां क्रोधः संसारबन्धनम्",
      mantraHindi: "क्रोध सभी अनर्थों की जड़ है — पर राम ने शांति से इसे जीता",
      hookLine: "परशुराम का क्रोध जिसने देवताओं को कंपाया — पर राम डरे नहीं...",
      emotionalTone: "क्रोध बनाम शांति, दिव्य पहचान",
      visualTone: "परशु लहराते परशुराम, शांत राम, बिजली जैसा वातावरण",
    },
    {
      kanda: "Bala", kandaNumber: 1, beatNumber: 11, globalSequence: 11,
      titleHindi: "राम-सीता विवाह",
      summaryHindi: "जनकपुर में विधि-विधान से राम-सीता का विवाह हुआ। भरत-मांडवी, लक्ष्मण-उर्मिला, शत्रुघ्न-श्रुतकीर्ति का भी विवाह हुआ। महर्षि वशिष्ठ ने मंत्रोच्चार किए। पूरा जनकपुर आनंद से भर गया।",
      storyPoints: ["सप्तपदी और मंत्रोच्चार", "अग्नि को साक्षी मान", "चारों भाइयों का विवाह", "जनक-दशरथ का मिलन", "जनकपुर में महोत्सव"],
      characters: ["राम", "सीता", "लक्ष्मण", "भरत", "दशरथ"],
      keyMantra: "विवाहे यज्ञकर्मणि दक्षिणे पितृकर्मणि | पत्नी धर्मे च सत्यं च पत्नी देया न संशयः",
      mantraHindi: "विवाह में पत्नी को धर्म, सत्य और जीवन में बराबर का स्थान देना कर्तव्य है",
      hookLine: "वो पल जब धरती और स्वर्ग एक साथ मुस्कुराए...",
      emotionalTone: "प्रेम, पावित्र्य, उत्सव",
      visualTone: "अग्नि की साक्षी, फूलों की वर्षा, लाल-सोने के वस्त्र, दीपों की रोशनी",
    },
    {
      kanda: "Bala", kandaNumber: 1, beatNumber: 12, globalSequence: 12,
      titleHindi: "अयोध्या वापसी",
      summaryHindi: "विवाह के बाद राम-सीता अयोध्या लौटे। पूरी अयोध्या में दीप जले। कौशल्या ने सीता को पुत्रवधू के रूप में अपनाया। दशरथ के आनंद की सीमा नहीं थी।",
      storyPoints: ["अयोध्या की दीपावली", "कौशल्या का सीता को आशीर्वाद", "दशरथ का अपार हर्ष", "प्रजा का स्वागत", "नई शुरुआत"],
      characters: ["राम", "सीता", "दशरथ", "लक्ष्मण"],
      keyMantra: null,
      mantraHindi: null,
      hookLine: "घर वापसी — जहाँ हर दीया खुशी से जल उठा...",
      emotionalTone: "गृहस्थ सुख, पारिवारिक प्रेम, आनंद",
      visualTone: "दीपों से जगमगाती अयोध्या, सोने का महल, फूलों की सजावट",
    },
  ];

  for (const beat of balaBeats) {
    const existing = await prisma.ramayanaStoryBeat.findUnique({
      where: { globalSequence: beat.globalSequence },
    });
    if (existing) {
      console.log(`  ✓ Beat ${beat.globalSequence} already exists — skipping`);
      continue;
    }
    await prisma.ramayanaStoryBeat.create({ data: beat });
    console.log(`  + Beat ${beat.globalSequence}: ${beat.titleHindi}`);
  }

  // ── Ayodhya Kanda Story Beats (13–24) ────────────────────────────────────
  console.log("\nSeeding Ayodhya Kanda story beats...");
  const ayodhyaBeats = [
    {
      kanda: "Ayodhya", kandaNumber: 2, beatNumber: 1, globalSequence: 13,
      titleHindi: "राज्याभिषेक की तैयारी",
      summaryHindi: "राजा दशरथ वृद्ध हो चले थे। उन्होंने राम को युवराज बनाने का निर्णय किया। पूरी अयोध्या में उत्सव की तैयारी शुरू हुई। राम को समाचार मिला और वे प्रसन्न हुए।",
      storyPoints: ["दशरथ का वृद्धावस्था का अहसास", "राम को युवराज बनाने का निर्णय", "वशिष्ठ की सहमति", "अयोध्या में तैयारी", "राम को समाचार"],
      characters: ["दशरथ", "राम", "सीता", "लक्ष्मण"],
      keyMantra: "यथा राजा तथा प्रजा",
      mantraHindi: "जैसा राजा, वैसी प्रजा — राम जैसे राजा की प्रतीक्षा",
      hookLine: "वो रात जब अयोध्या सो नहीं पाई — खुशी के कारण...",
      emotionalTone: "उत्साह, आनंद, गर्व",
      visualTone: "सजी हुई अयोध्या, दीप, सोने के सिंहासन की तैयारी",
    },
    {
      kanda: "Ayodhya", kandaNumber: 2, beatNumber: 2, globalSequence: 14,
      titleHindi: "मंथरा का षड्यंत्र",
      summaryHindi: "कैकेयी की दासी मंथरा ने कैकेयी के मन में ज़हर भरा। उसने कहा — राम राजा बना तो तुम्हारा पुत्र भरत क्या करेगा? कैकेयी का मन बदल गया और वे कोपभवन में चली गईं।",
      storyPoints: ["मंथरा की चाल", "भरत के भविष्य की चिंता", "कैकेयी का मन बदलना", "कोपभवन में जाना", "दशरथ को बुलावा"],
      characters: ["दशरथ"],
      keyMantra: null,
      mantraHindi: null,
      hookLine: "एक कान में फुसफुसाहट — और एक साम्राज्य का भाग्य बदल गया...",
      emotionalTone: "षड्यंत्र, भय, मन का अंधकार",
      visualTone: "अंधेरा महल, मंथरा का टेढ़ा साया, कैकेयी का क्रोधित चेहरा",
    },
    {
      kanda: "Ayodhya", kandaNumber: 2, beatNumber: 3, globalSequence: 15,
      titleHindi: "कैकेयी के दो वरदान",
      summaryHindi: "दशरथ कैकेयी से मिलने गए। कैकेयी ने पुराने दो वरदान माँगे — भरत को राज्य और राम को चौदह वर्ष का वनवास। दशरथ बेहोश हो गए।",
      storyPoints: ["दशरथ का कोपभवन में जाना", "कैकेयी की दो माँगें", "भरत को राज", "राम को वनवास", "दशरथ का मूर्छित होना"],
      characters: ["दशरथ"],
      keyMantra: "सत्यं वद धर्मं चर",
      mantraHindi: "सत्य बोलो, धर्म का पालन करो — दशरथ वचन के बंधन में थे",
      hookLine: "दो वरदान — जिन्होंने एक पिता को तोड़ दिया...",
      emotionalTone: "विश्वासघात, दर्द, बेबसी",
      visualTone: "कोपभवन की रात, दशरथ का टूटा हुआ चेहरा, कैकेयी का ठंडा भाव",
    },
    {
      kanda: "Ayodhya", kandaNumber: 2, beatNumber: 4, globalSequence: 16,
      titleHindi: "राम का वनगमन स्वीकार",
      summaryHindi: "राम को समाचार मिला। उन्होंने बिना एक पल की चिंता किए वनवास स्वीकार किया। उनका चेहरा शांत था। उन्होंने कहा — पिता का वचन सर्वोपरि है।",
      storyPoints: ["राम को समाचार", "राम की अटल शांति", "पिता के वचन का सम्मान", "राजसी वस्त्र त्यागना", "वल्कल धारण"],
      characters: ["राम", "सीता", "लक्ष्मण", "दशरथ"],
      keyMantra: "पितृ देवो भव",
      mantraHindi: "पिता ही देवता हैं — राम ने इसे जीकर दिखाया",
      hookLine: "जिसे कल राजा बनना था — उसने आज वन जाना चुना...",
      emotionalTone: "त्याग, धर्म, अटल शांति",
      visualTone: "राजसी वस्त्र उतारते राम, वल्कल वस्त्र, शांत मुखमंडल",
    },
    {
      kanda: "Ayodhya", kandaNumber: 2, beatNumber: 5, globalSequence: 17,
      titleHindi: "सीता और लक्ष्मण का साथ",
      summaryHindi: "सीता ने कहा — पत्नी का धर्म पति के साथ है, वन में भी। लक्ष्मण ने कहा — भाई बिना मैं नहीं रह सकता। तीनों ने वनवास का मार्ग चुना।",
      storyPoints: ["सीता का दृढ़ निर्णय", "लक्ष्मण का अटल प्रेम", "तीनों का वनवास", "दशरथ की आँखों में आँसू", "अयोध्या का रोना"],
      characters: ["राम", "सीता", "लक्ष्मण", "दशरथ"],
      keyMantra: "धर्मो रक्षति रक्षितः",
      mantraHindi: "धर्म की रक्षा करो — धर्म तुम्हारी रक्षा करेगा",
      hookLine: "तीन लोग — तीन अलग वजहें — एक ही रास्ता...",
      emotionalTone: "समर्पण, प्रेम, साहस",
      visualTone: "तीनों की विदाई, रोती अयोध्या, वन की ओर पहला कदम",
    },
    {
      kanda: "Ayodhya", kandaNumber: 2, beatNumber: 6, globalSequence: 18,
      titleHindi: "अयोध्या की विदाई",
      summaryHindi: "पूरी अयोध्या रो रही थी। प्रजा राम के साथ चलने लगी। दशरथ महल से देखते रहे। राम ने सबको वापस जाने को कहा और आगे बढ़ गए।",
      storyPoints: ["प्रजा का राम के पीछे चलना", "राम का विनम्र आग्रह", "दशरथ की आँखें", "अयोध्या का अंतिम दर्शन", "वन की ओर प्रस्थान"],
      characters: ["राम", "सीता", "लक्ष्मण", "दशरथ"],
      keyMantra: null,
      mantraHindi: null,
      hookLine: "जब एक पूरा शहर रोया — और राम मुड़कर देखते हुए चले गए...",
      emotionalTone: "विरह, करुणा, गहरा दुख",
      visualTone: "रोती भीड़, राम का पीछे मुड़ना, दशरथ की टूटी आँखें",
    },
    {
      kanda: "Ayodhya", kandaNumber: 2, beatNumber: 7, globalSequence: 19,
      titleHindi: "निषादराज गुह से मिलन",
      summaryHindi: "गंगा तट पर निषादराज गुह राम का स्वागत करने आए। उन्होंने सेवा की पेशकश की। राम ने प्रेम से स्वीकार किया पर साथ नहीं लिया। केवटने गंगा पार कराई।",
      storyPoints: ["गंगा तट पर पहुँचना", "गुह का स्वागत", "केवट का संवाद", "चरण धोने की जिद", "गंगा पार करना"],
      characters: ["राम", "सीता", "लक्ष्मण"],
      keyMantra: "नमामि गङ्गे तव पादपङ्कजं",
      mantraHindi: "गंगा माँ को नमन — जिनके पार राम का वनवास शुरू हुआ",
      hookLine: "एक नाविक जो भगवान के चरण धोना चाहता था...",
      emotionalTone: "भक्ति, विनम्रता, प्रेम",
      visualTone: "गंगा की लहरें, नाव, केवट की आँखों में श्रद्धा",
    },
    {
      kanda: "Ayodhya", kandaNumber: 2, beatNumber: 8, globalSequence: 20,
      titleHindi: "दशरथ की मृत्यु",
      summaryHindi: "राम के वियोग में दशरथ तड़पते रहे। उन्हें श्रवण कुमार के माता-पिता को दिया अपना पुराना शाप याद आया। पुत्र वियोग में उन्होंने प्राण त्याग दिए।",
      storyPoints: ["दशरथ का वियोग", "श्रवण कुमार के माता-पिता का शाप याद आना", "रात भर तड़पना", "राम-राम कहते हुए प्राण त्याग", "अयोध्या में शोक"],
      characters: ["दशरथ"],
      keyMantra: "रामेति रामेति रामेति रमे रामे मनोरमे",
      mantraHindi: "राम-राम-राम — यही अंतिम शब्द थे दशरथ के",
      hookLine: "जो नाम जीवन भर जपा — वही नाम अंतिम साँस बन गया...",
      emotionalTone: "गहरा शोक, पिता का प्रेम, वियोग",
      visualTone: "रात का अंधेरा महल, दशरथ का निर्जीव शरीर, रोती रानियाँ",
    },
    {
      kanda: "Ayodhya", kandaNumber: 2, beatNumber: 9, globalSequence: 21,
      titleHindi: "भरत का लौटना",
      summaryHindi: "भरत ननिहाल से लौटे। उन्हें सारी घटना पता चली। वे फूट-फूट कर रोए। माँ कैकेयी को दोष दिया। राम को वापस लाने का संकल्प लिया।",
      storyPoints: ["भरत का लौटना", "सच्चाई का पता चलना", "भरत का विलाप", "कैकेयी को फटकार", "राम के पास जाने का निश्चय"],
      characters: ["भरत", "दशरथ"],
      keyMantra: null,
      mantraHindi: null,
      hookLine: "वो बेटा जो राजा बनना नहीं चाहता था — पर राजा बना दिया गया...",
      emotionalTone: "दुख, क्रोध, पश्चाताप",
      visualTone: "भरत का टूटा चेहरा, शोक में डूबी अयोध्या, दशरथ का शव",
    },
    {
      kanda: "Ayodhya", kandaNumber: 2, beatNumber: 10, globalSequence: 22,
      titleHindi: "चित्रकूट में मिलन",
      summaryHindi: "भरत वन में चित्रकूट पहुँचे। राम से मिले। बहुत रोए। राम को वापस चलने का आग्रह किया। राम ने पिता का वचन पूरा करना धर्म बताया।",
      storyPoints: ["भरत का चित्रकूट पहुँचना", "भाइयों का मिलन", "भरत का विनती करना", "राम का धर्म समझाना", "चतुरंगिणी सेना का वन में दृश्य"],
      characters: ["राम", "भरत", "लक्ष्मण", "सीता"],
      keyMantra: "भ्रातृत्वं परमो धर्मः",
      mantraHindi: "भाई-भाई का प्रेम ही सबसे बड़ा धर्म है",
      hookLine: "दो भाइयों का मिलन — एक वन में, एक राजगद्दी छोड़कर...",
      emotionalTone: "भाई-प्रेम, धर्म, विरह",
      visualTone: "वन की पृष्ठभूमि, दोनों भाइयों का आलिंगन, आँसू",
    },
    {
      kanda: "Ayodhya", kandaNumber: 2, beatNumber: 11, globalSequence: 23,
      titleHindi: "खड़ाऊं राज",
      summaryHindi: "राम ने वापस जाने से मना किया। भरत ने राम की खड़ाऊं माँगी। नंदिग्राम में खड़ाऊं को सिंहासन पर रख कर भरत ने राज चलाया — राम के प्रतिनिधि के रूप में।",
      storyPoints: ["राम का मना करना", "भरत द्वारा खड़ाऊं माँगना", "नंदिग्राम में निवास", "खड़ाऊं का राज्याभिषेक", "भरत का तपस्वी जीवन"],
      characters: ["राम", "भरत"],
      keyMantra: "राम पादुकाभ्यां नमः",
      mantraHindi: "राम की पादुकाओं को नमन — जो राज्य का प्रतीक बनीं",
      hookLine: "एक राजा जिसने चप्पलों को सिंहासन पर बैठाया...",
      emotionalTone: "त्याग, निष्ठा, अनोखा प्रेम",
      visualTone: "सिंहासन पर खड़ाऊं, भरत का सरल वेश, नंदिग्राम का दृश्य",
    },
    {
      kanda: "Ayodhya", kandaNumber: 2, beatNumber: 12, globalSequence: 24,
      titleHindi: "दंडकारण्य की ओर",
      summaryHindi: "भरत के लौटने के बाद राम ने चित्रकूट छोड़ा। ऋषियों ने राक्षसों की बाधा की शिकायत की। राम ने उन्हें आश्वासन दिया और दंडकारण्य की ओर बढ़े।",
      storyPoints: ["चित्रकूट छोड़ना", "ऋषियों की राक्षस-बाधा की शिकायत", "राम का वचन", "अत्रि-अनुसूया से मिलन", "दंडकारण्य प्रवेश"],
      characters: ["राम", "सीता", "लक्ष्मण"],
      keyMantra: null,
      mantraHindi: null,
      hookLine: "जब वन और भी गहरा हो गया — पर राम का संकल्प और भी मजबूत...",
      emotionalTone: "साहस, कर्तव्य, वन-जीवन",
      visualTone: "घना वन, ऋषि आश्रम, रात का आकाश, तीनों का मार्ग",
    },
  ];

  for (const beat of ayodhyaBeats) {
    const existing = await prisma.ramayanaStoryBeat.findUnique({ where: { globalSequence: beat.globalSequence } });
    if (existing) { console.log(`  ✓ Beat ${beat.globalSequence} already exists — skipping`); continue; }
    await prisma.ramayanaStoryBeat.create({ data: beat });
    console.log(`  + Beat ${beat.globalSequence}: ${beat.titleHindi}`);
  }

  // ── Aranya Kanda (25–34) ──────────────────────────────────────────────────
  console.log("\nSeeding Aranya Kanda story beats...");
  const aranyaBeats = [
    {
      kanda: "Aranya", kandaNumber: 3, beatNumber: 1, globalSequence: 25,
      titleHindi: "पंचवटी में आश्रम",
      summaryHindi: "अगस्त्य मुनि के आश्रम से आशीर्वाद लेकर राम पंचवटी पहुँचे। लक्ष्मण ने सुंदर कुटी बनाई। तीनों वहाँ शांति से रहने लगे। गोदावरी नदी के किनारे वन जीवन शुरू हुआ।",
      storyPoints: ["अगस्त्य मुनि का आशीर्वाद और दिव्य धनुष", "पंचवटी का चुनाव", "लक्ष्मण द्वारा कुटी निर्माण", "शांत वन जीवन", "गोदावरी का सौंदर्य"],
      characters: ["राम", "सीता", "लक्ष्मण"],
      keyMantra: null, mantraHindi: null,
      hookLine: "वन में भी स्वर्ग बन सकता है — अगर साथ सही हो...",
      emotionalTone: "शांति, प्रकृति-प्रेम, गृहस्थ सुख",
      visualTone: "हरा-भरा वन, गोदावरी नदी, सुंदर कुटी, सूर्यास्त",
    },
    {
      kanda: "Aranya", kandaNumber: 3, beatNumber: 2, globalSequence: 26,
      titleHindi: "शूर्पणखा का आगमन",
      summaryHindi: "राक्षसी शूर्पणखा ने राम को देखा और मोहित हो गई। उसने सुंदर स्त्री का रूप धरा और राम से विवाह माँगा। राम ने विनम्रता से मना किया और लक्ष्मण की ओर भेजा।",
      storyPoints: ["शूर्पणखा का सुंदर रूप", "राम से विवाह की माँग", "राम का विनम्र मना", "लक्ष्मण की ओर भेजना", "शूर्पणखा का लक्ष्मण के पास जाना"],
      characters: ["राम", "लक्ष्मण", "सीता"],
      keyMantra: null, mantraHindi: null,
      hookLine: "एक राक्षसी जो प्रेम में पड़ी — और एक आपदा की शुरुआत हुई...",
      emotionalTone: "हास्य, खतरे की आहट",
      visualTone: "सुंदर स्त्री का भ्रामक रूप, रंगीन वन, राम की मुस्कान",
    },
    {
      kanda: "Aranya", kandaNumber: 3, beatNumber: 3, globalSequence: 27,
      titleHindi: "शूर्पणखा का विरूपण",
      summaryHindi: "शूर्पणखा ने सीता पर आक्रमण किया। लक्ष्मण ने उसकी नाक-कान काट दिए। शूर्पणखा रोती-चिल्लाती खर-दूषण के पास गई और बदला लेने को कहा।",
      storyPoints: ["सीता पर शूर्पणखा का हमला", "लक्ष्मण का कड़ा कदम", "शूर्पणखा का विरूपण", "खर-दूषण के पास जाना", "बदले की माँग"],
      characters: ["राम", "लक्ष्मण", "सीता"],
      keyMantra: null, mantraHindi: null,
      hookLine: "जब एक राक्षसी का अहंकार चकनाचूर हुआ...",
      emotionalTone: "तनाव, क्रोध, युद्ध की आहट",
      visualTone: "रक्त, राक्षसी का भयंकर रूप, लक्ष्मण का खड्ग",
    },
    {
      kanda: "Aranya", kandaNumber: 3, beatNumber: 4, globalSequence: 28,
      titleHindi: "खर-दूषण वध",
      summaryHindi: "खर-दूषण चौदह हजार राक्षसों की सेना लेकर आए। राम ने अकेले ही सारी सेना का संहार किया। खर और दूषण का वध हुआ। लक्ष्मण और सीता को आश्रम में रहने दिया।",
      storyPoints: ["चौदह हजार राक्षसों का आगमन", "राम का अकेले युद्ध", "बाणों की वर्षा", "खर-दूषण का वध", "देवताओं की पुष्प वर्षा"],
      characters: ["राम", "लक्ष्मण"],
      keyMantra: "रामो विग्रहवान् धर्मः",
      mantraHindi: "राम साक्षात् धर्म के अवतार हैं",
      hookLine: "एक तरफ चौदह हज़ार — दूसरी तरफ अकेला राम...",
      emotionalTone: "वीरता, शक्ति, दिव्य युद्ध",
      visualTone: "बाणों की बारिश, राक्षसों का पतन, राम का धनुष",
    },
    {
      kanda: "Aranya", kandaNumber: 3, beatNumber: 5, globalSequence: 29,
      titleHindi: "रावण की योजना",
      summaryHindi: "शूर्पणखा ने लंका जाकर रावण को सीता की सुंदरता बताई। रावण लालच में आ गया। उसने मारीच को बुलाया और सोने के हिरण का रूप धरने को कहा।",
      storyPoints: ["शूर्पणखा का रावण के पास जाना", "सीता की सुंदरता का वर्णन", "रावण का लालच", "मारीच को बुलाना", "षड्यंत्र की योजना"],
      characters: ["रावण"],
      keyMantra: null, mantraHindi: null,
      hookLine: "लंका के राजा ने एक गलती की — जो उसके अंत का कारण बनी...",
      emotionalTone: "लालच, षड्यंत्र, अहंकार",
      visualTone: "स्वर्ण लंका, रावण का दरबार, रात की साजिश",
    },
    {
      kanda: "Aranya", kandaNumber: 3, beatNumber: 6, globalSequence: 30,
      titleHindi: "मारीच — स्वर्ण मृग",
      summaryHindi: "मारीच ने सोने के हिरण का रूप लिया। सीता मोहित हो गईं। राम उसे पकड़ने गए। मरते वक्त मारीच ने राम की आवाज में लक्ष्मण को पुकारा।",
      storyPoints: ["सोने के हिरण का प्रकट होना", "सीता की इच्छा", "राम का पीछा करना", "लक्ष्मण को सीता की रक्षा का आदेश", "मारीच का वध और छल"],
      characters: ["राम", "सीता", "लक्ष्मण"],
      keyMantra: null, mantraHindi: null,
      hookLine: "सोने का हिरण — जो असल में मौत का जाल था...",
      emotionalTone: "मोह, छल, खतरा",
      visualTone: "चमकता सोने का हिरण, वन, सीता की आँखें, राम का पीछा",
    },
    {
      kanda: "Aranya", kandaNumber: 3, beatNumber: 7, globalSequence: 31,
      titleHindi: "सीता हरण",
      summaryHindi: "रावण साधु वेश में आया। लक्ष्मण-रेखा पार कर सीता बाहर आईं। रावण ने असली रूप दिखाया, सीता को उठाया और पुष्पक विमान से लंका ले गया।",
      storyPoints: ["रावण का साधु वेश", "लक्ष्मण-रेखा का उल्लंघन", "रावण का असली रूप", "सीता का अपहरण", "पुष्पक विमान से लंका"],
      characters: ["सीता", "रावण", "लक्ष्मण"],
      keyMantra: "रक्ष रक्ष महादेव त्राहि त्राहि जगत्पते",
      mantraHindi: "हे महादेव रक्षा करो — सीता की पुकार",
      hookLine: "वो पल जब दुनिया की सबसे बड़ी गलती हुई...",
      emotionalTone: "भय, असहायता, विपत्ति",
      visualTone: "साधु वेश, सीता का खिंचना, पुष्पक विमान, आकाश में चीख",
    },
    {
      kanda: "Aranya", kandaNumber: 3, beatNumber: 8, globalSequence: 32,
      titleHindi: "जटायु का बलिदान",
      summaryHindi: "गिद्धराज जटायु ने रावण को रोका। वृद्ध होने के बावजूद भयंकर युद्ध किया। रावण ने उनके पंख काट दिए। राम को रास्ता दिखाने के लिए जटायु ने अंतिम साँस तक प्रतीक्षा की।",
      storyPoints: ["जटायु का रावण से युद्ध", "वृद्ध पर रावण का हमला", "पंख कटना", "जटायु का धरती पर गिरना", "राम को सीता की दिशा बताना", "जटायु का मोक्ष"],
      characters: ["राम", "लक्ष्मण"],
      keyMantra: "मृत्योर्मा अमृतं गमय",
      mantraHindi: "मृत्यु से अमरत्व की ओर ले जाओ — जटायु का बलिदान अमर है",
      hookLine: "एक बूढ़ा पक्षी जिसने भगवान के लिए जान दे दी...",
      emotionalTone: "बलिदान, करुणा, वीरता",
      visualTone: "आकाश में युद्ध, कटे पंख, धरती पर गिरता जटायु, राम की आँखों में आँसू",
    },
    {
      kanda: "Aranya", kandaNumber: 3, beatNumber: 9, globalSequence: 33,
      titleHindi: "सीता — अशोक वाटिका",
      summaryHindi: "रावण सीता को अशोक वाटिका में रखा। उन्हें भोग-विलास का प्रलोभन दिया। सीता ने मना किया। एक तिनका रखकर रावण और सीता के बीच अंतर बताया।",
      storyPoints: ["अशोक वाटिका में सीता", "राक्षसियों की निगरानी", "रावण का प्रलोभन", "सीता का दृढ़ इनकार", "तिनके से रावण को दूरी"],
      characters: ["सीता", "रावण"],
      keyMantra: "न रावणसहस्रं मे युद्धे प्रतिबलं भवेत्",
      mantraHindi: "हज़ार रावण भी राम से नहीं जीत सकते — सीता का अटल विश्वास",
      hookLine: "एक तिनका — जो राम और रावण के बीच की दीवार था...",
      emotionalTone: "साहस, आस्था, प्रतीक्षा",
      visualTone: "फूलों का बगीचा, सीता का एकाकी रूप, रावण का अहंकार",
    },
    {
      kanda: "Aranya", kandaNumber: 3, beatNumber: 10, globalSequence: 34,
      titleHindi: "राम की खोज — कबंध और शबरी",
      summaryHindi: "राम-लक्ष्मण सीता को खोज रहे थे। कबंध राक्षस का उद्धार किया। शबरी माँ के जूठे बेर खाए। शबरी ने ऋष्यमूक पर्वत जाने की सलाह दी।",
      storyPoints: ["कबंध राक्षस का उद्धार", "शबरी का इंतजार", "जूठे बेर और राम का प्रेम", "शबरी को मोक्ष", "ऋष्यमूक की दिशा"],
      characters: ["राम", "लक्ष्मण"],
      keyMantra: "भक्तिः भगवतो लाभः",
      mantraHindi: "भगवान की भक्ति ही सबसे बड़ा लाभ — शबरी की भक्ति",
      hookLine: "जूठे बेर जो भगवान ने प्रेम से खाए...",
      emotionalTone: "भक्ति, प्रेम, शुद्ध समर्पण",
      visualTone: "वृद्ध शबरी, जूठे बेर, राम की मुस्कान, जंगल का आश्रम",
    },
  ];

  for (const beat of aranyaBeats) {
    const existing = await prisma.ramayanaStoryBeat.findUnique({ where: { globalSequence: beat.globalSequence } });
    if (existing) { console.log(`  ✓ Beat ${beat.globalSequence} already exists — skipping`); continue; }
    await prisma.ramayanaStoryBeat.create({ data: beat });
    console.log(`  + Beat ${beat.globalSequence}: ${beat.titleHindi}`);
  }

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
