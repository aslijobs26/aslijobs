type LocalizedShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : LocalizedShape<T[K]>;
};

const en = {
  home: {
    common: {
      jobCount: "{count} Jobs",
      logoAlt: "{name} logo",
    },
    hero: {
      headingLine1: "Find Jobs Easy.",
      headingLine2: "On WhatsApp.",
      supportingLine1: "The fastest way to hire people or find jobs.",
      supportingLine2: "Simple • Multilingual • WhatsApp First",
      languagesLabel: "Multi-language Support",
      languagesAria: "Supported languages",
      imageAlt: "Job seeker browsing jobs on WhatsApp",
      features: {
        voiceSearch: { title: "Voice Search", description: "Speak & find jobs" },
        whatsappFirst: { title: "WhatsApp First", description: "No App Needed" },
        verifiedJobs: { title: "Verified Jobs", description: "Trusted Employers" },
        inYourLanguage: { title: "In Your Language", description: "Apply with ease" },
      },
      messages: {
        voiceSearch: "Delivery jobs near me",
        whatsappFirst: "Hi AsliJobs, find jobs for me",
        verifiedJobs: "Show me verified jobs",
      },
    },
    search: {
      formAria: "Job search",
      queryLabel: "Search Job, Role or Keyword",
      queryPlaceholder: "e.g. Driver, Delivery Executive, Electrician",
      cityPlaceholderExample: "e.g. {city}",
      cityPlaceholderSearch: "Search city",
      popularLabel: "Popular Searches:",
      popular: {
        deliveryExecutive: "Delivery Executive",
        driver: "Driver",
        helper: "Helper",
        cook: "Cook",
        salesExecutive: "Sales Executive",
        warehouse: "Warehouse",
        securityGuard: "Security Guard",
      },
    },
    cta: {
      sectionAria: "Quick actions",
      whatsapp: {
        title: "Join AsliJobs on WhatsApp",
        description: "Get job alerts and apply in seconds",
        action: "Join on WhatsApp",
      },
      employer: {
        title: "Looking for Staff?",
        description: "Post a job and hire the right people",
        action: "Post a Job FREE",
      },
      assist: {
        title: "Need Help Hiring?",
        description: "Our experts will help you hire faster",
        action: "Get Hire Assist",
      },
    },
    employerConfirm: {
      closeDialog: "Close dialog",
      closeAria: "Close employer confirmation",
      title: "Are you an Employer?",
      description: "Post jobs and hire suitable candidates through AsliJobs.",
      continue: "Continue as Employer",
    },
    discovery: {
      sectionAria: "Discover jobs and employers",
      categoriesTitle: "Browse Jobs by Category",
      categoriesAction: "View all categories →",
      employersTitle: "Top Employers Hiring Now",
      employersAction: "View all employers →",
      previousEmployers: "Previous employers",
      nextEmployers: "Next employers",
      categories: {
        drivers: "Drivers",
        delivery: "Delivery",
        warehouse: "Warehouse",
        security: "Security",
        construction: "Construction",
        hospitality: "Hospitality",
        manufacturing: "Manufacturing",
        viewAll: "View All",
        viewAllSubtitle: "Categories",
      },
    },
    jobsDiscovery: {
      sectionAria: "Popular jobs and locations",
      trendingTitle: "Trending jobs in Hyderabad",
      viewAllJobs: "View all jobs →",
      statesTitle: "Browse Jobs by State",
      statesAction: "View all states →",
      citiesTitle: "Browse Jobs by City",
      citiesAction: "View all cities →",
      perMonth: "/month",
      experienceOnly: "Experience Only",
      postedDayAgo: "{count} day ago",
      postedDaysAgo: "{count} days ago",
    },
    hiring: {
      title: "Hiring Solutions for Every Need",
      description: "Choose the perfect solution to find the right talent",
      compare: "Compare Solutions",
      freeJobPost: {
        title: "FREE JOB POST",
        subtitle: "Best for small employers",
        feature1: "Post unlimited jobs",
        feature2: "Receive applications",
        feature3: "Manage candidates",
        action: "Post Job FREE",
      },
      jobBoosters: {
        title: "JOB BOOSTERS",
        subtitle: "Need faster hiring?",
        feature1: "Reach more candidates",
        feature2: "Priority in search results",
        feature3: "Highlight your job",
        action: "Boost Job",
      },
      hireAssist: {
        title: "HIRE ASSIST",
        subtitle: "We'll help you hire",
        feature1: "Dedicated hiring expert",
        feature2: "Shortlist best candidates",
        feature3: "End-to-end support",
        action: "Get Hire Assist",
      },
      businessHiring: {
        title: "BUSINESS HIRING",
        subtitle: "Hiring every month?",
        feature1: "Volume hiring support",
        feature2: "Custom hiring solution",
        feature3: "Account manager",
        action: "Contact Sales",
      },
    },
    trust: {
      sectionAria: "Why choose AsliJobs, how it works, and resources",
      whyTitle: "Why Choose AsliJobs?",
      benefits: {
        whatsapp: {
          title: "WhatsApp First",
          description: "No app installation.\nUse WhatsApp\nto find and apply.",
        },
        languages: {
          title: "Multi-Language\nSupport",
          description: "Search and apply\nin your language.",
        },
        voice: {
          title: "Voice Search",
          description: "Just speak and\nfind the right jobs\nnear you.",
        },
        verified: {
          title: "Verified Employers",
          description: "All employers are\nverified for your\nsafety.",
        },
        aiMatching: {
          title: "AI Job Matching",
          description:
            "Get job recommendations\nthat match your skills\nand location.",
        },
        free: {
          title: "Free for Job Seekers",
          description: "Create profile, search\njobs and apply\ncompletely free.",
        },
      },
      howTitle: "How AsliJobs Works",
      howSubtitle: "Find jobs on WhatsApp in 4 simple steps",
      steps: {
        whatsapp: {
          title: "Join on WhatsApp",
          description:
            "Click 'Join on WhatsApp'\nand start chatting with\nAsliJobs Bot.",
        },
        language: {
          title: "Choose Language",
          description:
            "Select your preferred\nlanguage and tell us what\nyou're looking for.",
        },
        search: {
          title: "Get Job Matches",
          description: "Receive relevant job\nlistings instantly in\nWhatsApp.",
        },
        apply: {
          title: "Apply & Get Hired",
          description:
            "Apply in one click and get\nconnected with employers\nquickly.",
        },
      },
      resourcesTitle: "Job Seeker Resources",
      resourcesAction: "View all resources →",
      resources: {
        guide: {
          title: "Job Seeker Guide",
          description: "Tips to create profile,\nsearch jobs and\ncrack interviews.",
        },
        resume: {
          title: "Resume Builder",
          description: "Create a professional\nresume in minutes.",
        },
        interview: {
          title: "Interview Tips",
          description: "Prepare for interviews\nand get hired faster.",
        },
        salary: {
          title: "Salary Guide",
          description: "Know the right salary\nfor your role.",
        },
        career: {
          title: "Career Advice",
          description: "Guidance to grow\nyour career.",
        },
      },
      statsAria: "AsliJobs platform statistics",
      stats: {
        hiredToday: "People Got Hired Today",
        jobsToday: "Jobs Posted Today",
        applicationsToday: "Applications Today",
        employerSatisfaction: "Employer Satisfaction",
        platformRating: "Platform Rating",
      },
    },
  },
} as const;

type HomeCatalog = LocalizedShape<typeof en>;

const hi: HomeCatalog = {
  home: {
    common: {
      jobCount: "{count} नौकरियां",
      logoAlt: "{name} लोगो",
    },
    hero: {
      headingLine1: "आसानी से नौकरी पाएं।",
      headingLine2: "WhatsApp पर।",
      supportingLine1: "लोगों को काम पर रखने या नौकरी पाने का सबसे तेज़ तरीका।",
      supportingLine2: "आसान • बहुभाषी • WhatsApp फ़र्स्ट",
      languagesLabel: "बहुभाषी सहायता",
      languagesAria: "समर्थित भाषाएं",
      imageAlt: "WhatsApp पर नौकरियां देखता नौकरी खोजने वाला",
      features: {
        voiceSearch: { title: "वॉइस सर्च", description: "बोलें और नौकरी पाएं" },
        whatsappFirst: { title: "WhatsApp फ़र्स्ट", description: "कोई ऐप नहीं चाहिए" },
        verifiedJobs: { title: "सत्यापित नौकरियां", description: "भरोसेमंद नियोक्ता" },
        inYourLanguage: { title: "आपकी भाषा में", description: "आसानी से आवेदन करें" },
      },
      messages: {
        voiceSearch: "मेरे पास डिलीवरी की नौकरियां",
        whatsappFirst: "नमस्ते AsliJobs, मेरे लिए नौकरी खोजें",
        verifiedJobs: "मुझे सत्यापित नौकरियां दिखाएं",
      },
    },
    search: {
      formAria: "नौकरी खोज",
      queryLabel: "नौकरी, पद या कीवर्ड खोजें",
      queryPlaceholder: "जैसे ड्राइवर, डिलीवरी एग्ज़ीक्यूटिव, इलेक्ट्रीशियन",
      cityPlaceholderExample: "जैसे {city}",
      cityPlaceholderSearch: "शहर खोजें",
      popularLabel: "लोकप्रिय खोजें:",
      popular: {
        deliveryExecutive: "डिलीवरी एग्ज़ीक्यूटिव",
        driver: "ड्राइवर",
        helper: "हेल्पर",
        cook: "रसोइया",
        salesExecutive: "सेल्स एग्ज़ीक्यूटिव",
        warehouse: "वेयरहाउस",
        securityGuard: "सिक्योरिटी गार्ड",
      },
    },
    cta: {
      sectionAria: "त्वरित कार्य",
      whatsapp: {
        title: "WhatsApp पर AsliJobs से जुड़ें",
        description: "नौकरी अलर्ट पाएं और सेकंडों में आवेदन करें",
        action: "WhatsApp पर जुड़ें",
      },
      employer: {
        title: "स्टाफ़ चाहिए?",
        description: "नौकरी पोस्ट करें और सही लोगों को रखें",
        action: "मुफ़्त में नौकरी पोस्ट करें",
      },
      assist: {
        title: "भर्ती में मदद चाहिए?",
        description: "हमारे विशेषज्ञ आपको तेज़ी से भर्ती करने में मदद करेंगे",
        action: "भर्ती सहायता पाएं",
      },
    },
    employerConfirm: {
      closeDialog: "डायलॉग बंद करें",
      closeAria: "नियोक्ता पुष्टि बंद करें",
      title: "क्या आप नियोक्ता हैं?",
      description: "AsliJobs के ज़रिए नौकरियां पोस्ट करें और उपयुक्त उम्मीदवारों को रखें।",
      continue: "नियोक्ता के रूप में जारी रखें",
    },
    discovery: {
      sectionAria: "नौकरियां और नियोक्ता खोजें",
      categoriesTitle: "श्रेणी के अनुसार नौकरियां देखें",
      categoriesAction: "सभी श्रेणियां देखें →",
      employersTitle: "अभी भर्ती कर रहे शीर्ष नियोक्ता",
      employersAction: "सभी नियोक्ता देखें →",
      previousEmployers: "पिछले नियोक्ता",
      nextEmployers: "अगले नियोक्ता",
      categories: {
        drivers: "ड्राइवर",
        delivery: "डिलीवरी",
        warehouse: "वेयरहाउस",
        security: "सिक्योरिटी",
        construction: "निर्माण",
        hospitality: "हॉस्पिटैलिटी",
        manufacturing: "मैन्युफैक्चरिंग",
        viewAll: "सभी देखें",
        viewAllSubtitle: "श्रेणियां",
      },
    },
    jobsDiscovery: {
      sectionAria: "लोकप्रिय नौकरियां और स्थान",
      trendingTitle: "हैदराबाद में ट्रेंडिंग नौकरियां",
      viewAllJobs: "सभी नौकरियां देखें →",
      statesTitle: "राज्य के अनुसार नौकरियां देखें",
      statesAction: "सभी राज्य देखें →",
      citiesTitle: "शहर के अनुसार नौकरियां देखें",
      citiesAction: "सभी शहर देखें →",
      perMonth: "/माह",
      experienceOnly: "केवल अनुभवी",
      postedDayAgo: "{count} दिन पहले",
      postedDaysAgo: "{count} दिन पहले",
    },
    hiring: {
      title: "हर ज़रूरत के लिए भर्ती समाधान",
      description: "सही प्रतिभा पाने के लिए सही समाधान चुनें",
      compare: "समाधानों की तुलना करें",
      freeJobPost: {
        title: "मुफ़्त जॉब पोस्ट",
        subtitle: "छोटे नियोक्ताओं के लिए सबसे अच्छा",
        feature1: "असीमित नौकरियां पोस्ट करें",
        feature2: "आवेदन प्राप्त करें",
        feature3: "उम्मीदवारों को प्रबंधित करें",
        action: "मुफ़्त में जॉब पोस्ट करें",
      },
      jobBoosters: {
        title: "जॉब बूस्टर",
        subtitle: "जल्दी भर्ती चाहिए?",
        feature1: "ज़्यादा उम्मीदवारों तक पहुंचें",
        feature2: "खोज परिणामों में प्राथमिकता",
        feature3: "अपनी नौकरी को हाइलाइट करें",
        action: "जॉब बूस्ट करें",
      },
      hireAssist: {
        title: "भर्ती सहायता",
        subtitle: "हम आपकी भर्ती में मदद करेंगे",
        feature1: "समर्पित भर्ती विशेषज्ञ",
        feature2: "सर्वश्रेष्ठ उम्मीदवारों को शॉर्टलिस्ट करें",
        feature3: "शुरू से अंत तक सहायता",
        action: "भर्ती सहायता पाएं",
      },
      businessHiring: {
        title: "बिज़नेस भर्ती",
        subtitle: "हर महीने भर्ती करते हैं?",
        feature1: "बड़े पैमाने पर भर्ती सहायता",
        feature2: "कस्टम भर्ती समाधान",
        feature3: "अकाउंट मैनेजर",
        action: "सेल्स से संपर्क करें",
      },
    },
    trust: {
      sectionAria: "AsliJobs क्यों चुनें, यह कैसे काम करता है, और संसाधन",
      whyTitle: "AsliJobs क्यों चुनें?",
      benefits: {
        whatsapp: {
          title: "WhatsApp फ़र्स्ट",
          description: "कोई ऐप इंस्टॉल नहीं। नौकरी खोजने और आवेदन करने के लिए WhatsApp का उपयोग करें।",
        },
        languages: {
          title: "बहुभाषी सहायता",
          description: "अपनी भाषा में खोजें और आवेदन करें।",
        },
        voice: {
          title: "वॉइस सर्च",
          description: "बस बोलें और अपने आस-पास सही नौकरियां पाएं।",
        },
        verified: {
          title: "सत्यापित नियोक्ता",
          description: "आपकी सुरक्षा के लिए सभी नियोक्ता सत्यापित हैं।",
        },
        aiMatching: {
          title: "AI जॉब मैचिंग",
          description: "अपने कौशल और स्थान से मेल खाती नौकरी की सिफ़ारिशें पाएं।",
        },
        free: {
          title: "नौकरी खोजने वालों के लिए मुफ़्त",
          description: "प्रोफ़ाइल बनाएं, नौकरियां खोजें और पूरी तरह मुफ़्त आवेदन करें।",
        },
      },
      howTitle: "AsliJobs कैसे काम करता है",
      howSubtitle: "4 आसान चरणों में WhatsApp पर नौकरी पाएं",
      steps: {
        whatsapp: {
          title: "WhatsApp पर जुड़ें",
          description: "'WhatsApp पर जुड़ें' पर क्लिक करें और AsliJobs Bot से चैट शुरू करें।",
        },
        language: {
          title: "भाषा चुनें",
          description: "अपनी पसंदीदा भाषा चुनें और बताएं कि आप क्या ढूंढ रहे हैं।",
        },
        search: {
          title: "मेल खाती नौकरियां पाएं",
          description: "WhatsApp में तुरंत संबंधित नौकरियों की सूची पाएं।",
        },
        apply: {
          title: "आवेदन करें और नौकरी पाएं",
          description: "एक क्लिक में आवेदन करें और नियोक्ताओं से जल्दी जुड़ें।",
        },
      },
      resourcesTitle: "नौकरी खोजने वालों के लिए संसाधन",
      resourcesAction: "सभी संसाधन देखें →",
      resources: {
        guide: {
          title: "नौकरी खोजने वाले के लिए गाइड",
          description: "प्रोफ़ाइल बनाने, नौकरी खोजने और इंटरव्यू पास करने के टिप्स।",
        },
        resume: {
          title: "रिज़्यूमे बिल्डर",
          description: "मिनटों में प्रोफ़ेशनल रिज़्यूमे बनाएं।",
        },
        interview: {
          title: "इंटरव्यू टिप्स",
          description: "इंटरव्यू की तैयारी करें और जल्दी नौकरी पाएं।",
        },
        salary: {
          title: "वेतन गाइड",
          description: "अपनी भूमिका के लिए सही वेतन जानें।",
        },
        career: {
          title: "करियर सलाह",
          description: "अपना करियर आगे बढ़ाने के लिए मार्गदर्शन।",
        },
      },
      statsAria: "AsliJobs प्लेटफ़ॉर्म आंकड़े",
      stats: {
        hiredToday: "आज नौकरी पाने वाले लोग",
        jobsToday: "आज पोस्ट की गई नौकरियां",
        applicationsToday: "आज के आवेदन",
        employerSatisfaction: "नियोक्ता संतुष्टि",
        platformRating: "प्लेटफ़ॉर्म रेटिंग",
      },
    },
  },
};

const te: HomeCatalog = {
  home: {
    common: {
      jobCount: "{count} ఉద్యోగాలు",
      logoAlt: "{name} లోగో",
    },
    hero: {
      headingLine1: "ఉద్యోగాలు సులభంగా పొందండి.",
      headingLine2: "WhatsAppలో.",
      supportingLine1:
        "సిబ్బందిని నియమించుకోవడానికి లేదా ఉద్యోగం పొందడానికి అత్యంత వేగవంతమైన మార్గం.",
      supportingLine2: "సులభం • బహుభాషా • WhatsApp ఫస్ట్",
      languagesLabel: "బహుభాషా సపోర్ట్",
      languagesAria: "అందుబాటులో ఉన్న భాషలు",
      imageAlt: "WhatsAppలో ఉద్యోగాలు చూస్తున్న ఉద్యోగార్థి",
      features: {
        voiceSearch: { title: "వాయిస్ సెర్చ్", description: "మాట్లాడి ఉద్యోగాలు కనుగొనండి" },
        whatsappFirst: { title: "WhatsApp ఫస్ట్", description: "యాప్ అవసరం లేదు" },
        verifiedJobs: { title: "ధృవీకరించిన ఉద్యోగాలు", description: "నమ్మకమైన యజమానులు" },
        inYourLanguage: { title: "మీ భాషలో", description: "సులభంగా దరఖాస్తు చేయండి" },
      },
      messages: {
        voiceSearch: "నా దగ్గర డెలివరీ ఉద్యోగాలు",
        whatsappFirst: "హాయ్ AsliJobs, నాకు ఉద్యోగాలు చూపించండి",
        verifiedJobs: "ధృవీకరించిన ఉద్యోగాలు చూపించండి",
      },
    },
    search: {
      formAria: "ఉద్యోగ శోధన",
      queryLabel: "ఉద్యోగం, పాత్ర లేదా కీవర్డ్ వెతకండి",
      queryPlaceholder: "ఉదా. డ్రైవర్, డెలివరీ ఎగ్జిక్యూటివ్, ఎలక్ట్రీషియన్",
      cityPlaceholderExample: "ఉదా. {city}",
      cityPlaceholderSearch: "నగరం వెతకండి",
      popularLabel: "ప్రముఖ శోధనలు:",
      popular: {
        deliveryExecutive: "డెలివరీ ఎగ్జిక్యూటివ్",
        driver: "డ్రైవర్",
        helper: "హెల్పర్",
        cook: "వంటమనిషి",
        salesExecutive: "సేల్స్ ఎగ్జిక్యూటివ్",
        warehouse: "గిడ్డంగి",
        securityGuard: "సెక్యూరిటీ గార్డ్",
      },
    },
    cta: {
      sectionAria: "త్వరిత చర్యలు",
      whatsapp: {
        title: "WhatsAppలో AsliJobsలో చేరండి",
        description: "ఉద్యోగ అలర్ట్‌లు పొంది సెకన్లలో దరఖాస్తు చేయండి",
        action: "WhatsAppలో చేరండి",
      },
      employer: {
        title: "సిబ్బంది కావాలా?",
        description: "ఉద్యోగం పోస్ట్ చేసి సరైన వ్యక్తులను నియమించుకోండి",
        action: "ఉచితంగా ఉద్యోగం పోస్ట్ చేయండి",
      },
      assist: {
        title: "నియామకంలో సహాయం కావాలా?",
        description: "మా నిపుణులు మీకు వేగంగా నియమించుకోవడంలో సహాయం చేస్తారు",
        action: "నియామక సహాయం పొందండి",
      },
    },
    employerConfirm: {
      closeDialog: "డైలాగ్ మూసివేయండి",
      closeAria: "యజమాని నిర్ధారణను మూసివేయండి",
      title: "మీరు యజమానా?",
      description: "AsliJobs ద్వారా ఉద్యోగాలు పోస్ట్ చేసి తగిన అభ్యర్థులను నియమించుకోండి.",
      continue: "యజమానిగా కొనసాగండి",
    },
    discovery: {
      sectionAria: "ఉద్యోగాలు మరియు యజమానులను కనుగొనండి",
      categoriesTitle: "వర్గం వారీగా ఉద్యోగాలు చూడండి",
      categoriesAction: "అన్ని వర్గాలు చూడండి →",
      employersTitle: "ఇప్పుడు నియమిస్తున్న అగ్ర యజమానులు",
      employersAction: "అందరు యజమానులను చూడండి →",
      previousEmployers: "మునుపటి యజమానులు",
      nextEmployers: "తదుపరి యజమానులు",
      categories: {
        drivers: "డ్రైవర్లు",
        delivery: "డెలివరీ",
        warehouse: "గిడ్డంగి",
        security: "సెక్యూరిటీ",
        construction: "నిర్మాణం",
        hospitality: "ఆతిథ్యం",
        manufacturing: "తయారీ",
        viewAll: "అన్నీ చూడండి",
        viewAllSubtitle: "వర్గాలు",
      },
    },
    jobsDiscovery: {
      sectionAria: "ప్రముఖ ఉద్యోగాలు మరియు ప్రాంతాలు",
      trendingTitle: "హైదరాబాద్‌లో ట్రెండింగ్ ఉద్యోగాలు",
      viewAllJobs: "అన్ని ఉద్యోగాలు చూడండి →",
      statesTitle: "రాష్ట్రం వారీగా ఉద్యోగాలు చూడండి",
      statesAction: "అన్ని రాష్ట్రాలు చూడండి →",
      citiesTitle: "నగరం వారీగా ఉద్యోగాలు చూడండి",
      citiesAction: "అన్ని నగరాలు చూడండి →",
      perMonth: "/నెల",
      experienceOnly: "అనుభవం ఉన్నవారికి మాత్రమే",
      postedDayAgo: "{count} రోజు క్రితం",
      postedDaysAgo: "{count} రోజుల క్రితం",
    },
    hiring: {
      title: "ప్రతి అవసరానికి నియామక పరిష్కారాలు",
      description: "సరైన ప్రతిభను కనుగొనడానికి సరైన పరిష్కారాన్ని ఎంచుకోండి",
      compare: "పరిష్కారాలను పోల్చండి",
      freeJobPost: {
        title: "ఉచిత ఉద్యోగ పోస్ట్",
        subtitle: "చిన్న యజమానులకు ఉత్తమం",
        feature1: "అపరిమిత ఉద్యోగాలు పోస్ట్ చేయండి",
        feature2: "దరఖాస్తులు స్వీకరించండి",
        feature3: "అభ్యర్థులను నిర్వహించండి",
        action: "ఉచితంగా ఉద్యోగం పోస్ట్ చేయండి",
      },
      jobBoosters: {
        title: "జాబ్ బూస్టర్లు",
        subtitle: "వేగంగా నియమించుకోవాలా?",
        feature1: "మరింత మంది అభ్యర్థులను చేరుకోండి",
        feature2: "శోధన ఫలితాల్లో ప్రాధాన్యత",
        feature3: "మీ ఉద్యోగాన్ని హైలైట్ చేయండి",
        action: "ఉద్యోగాన్ని బూస్ట్ చేయండి",
      },
      hireAssist: {
        title: "నియామక సహాయం",
        subtitle: "నియామకంలో మేము సహాయం చేస్తాము",
        feature1: "ప్రత్యేక నియామక నిపుణుడు",
        feature2: "ఉత్తమ అభ్యర్థులను షార్ట్‌లిస్ట్ చేయండి",
        feature3: "మొదటి నుండి చివరి వరకు సపోర్ట్",
        action: "నియామక సహాయం పొందండి",
      },
      businessHiring: {
        title: "బిజినెస్ నియామకం",
        subtitle: "ప్రతి నెలా నియమిస్తున్నారా?",
        feature1: "భారీ నియామక సపోర్ట్",
        feature2: "కస్టమ్ నియామక పరిష్కారం",
        feature3: "అకౌంట్ మేనేజర్",
        action: "సేల్స్ బృందాన్ని సంప్రదించండి",
      },
    },
    trust: {
      sectionAria: "AsliJobsను ఎందుకు ఎంచుకోవాలి, ఇది ఎలా పనిచేస్తుంది, మరియు వనరులు",
      whyTitle: "AsliJobsను ఎందుకు ఎంచుకోవాలి?",
      benefits: {
        whatsapp: {
          title: "WhatsApp ఫస్ట్",
          description:
            "యాప్ ఇన్‌స్టాల్ అవసరం లేదు. ఉద్యోగాలు కనుగొని దరఖాస్తు చేయడానికి WhatsApp ఉపయోగించండి.",
        },
        languages: {
          title: "బహుభాషా సపోర్ట్",
          description: "మీ భాషలో వెతికి దరఖాస్తు చేయండి.",
        },
        voice: {
          title: "వాయిస్ సెర్చ్",
          description: "మాట్లాడితే చాలు, మీ దగ్గరలోని సరైన ఉద్యోగాలు కనుగొనండి.",
        },
        verified: {
          title: "ధృవీకరించిన యజమానులు",
          description: "మీ భద్రత కోసం యజమానులందరూ ధృవీకరించబడ్డారు.",
        },
        aiMatching: {
          title: "AI జాబ్ మ్యాచింగ్",
          description: "మీ నైపుణ్యాలు మరియు ప్రాంతానికి సరిపోయే ఉద్యోగ సిఫార్సులు పొందండి.",
        },
        free: {
          title: "ఉద్యోగార్థులకు ఉచితం",
          description:
            "ప్రొఫైల్ సృష్టించండి, ఉద్యోగాలు వెతకండి మరియు పూర్తిగా ఉచితంగా దరఖాస్తు చేయండి.",
        },
      },
      howTitle: "AsliJobs ఎలా పనిచేస్తుంది",
      howSubtitle: "4 సులభ దశల్లో WhatsAppలో ఉద్యోగాలు కనుగొనండి",
      steps: {
        whatsapp: {
          title: "WhatsAppలో చేరండి",
          description: "'WhatsAppలో చేరండి' క్లిక్ చేసి AsliJobs Botతో చాట్ ప్రారంభించండి.",
        },
        language: {
          title: "భాష ఎంచుకోండి",
          description: "మీకు నచ్చిన భాషను ఎంచుకుని మీరు ఏమి వెతుకుతున్నారో చెప్పండి.",
        },
        search: {
          title: "సరిపోయే ఉద్యోగాలు పొందండి",
          description: "సంబంధిత ఉద్యోగ జాబితాలను WhatsAppలో వెంటనే పొందండి.",
        },
        apply: {
          title: "దరఖాస్తు చేసి ఉద్యోగం పొందండి",
          description: "ఒక్క క్లిక్‌లో దరఖాస్తు చేసి యజమానులతో త్వరగా కనెక్ట్ అవ్వండి.",
        },
      },
      resourcesTitle: "ఉద్యోగార్థుల వనరులు",
      resourcesAction: "అన్ని వనరులు చూడండి →",
      resources: {
        guide: {
          title: "ఉద్యోగార్థి గైడ్",
          description:
            "ప్రొఫైల్ సృష్టించడం, ఉద్యోగాలు వెతకడం మరియు ఇంటర్వ్యూలలో విజయం సాధించడానికి చిట్కాలు.",
        },
        resume: {
          title: "రెజ్యూమ్ బిల్డర్",
          description: "నిమిషాల్లో ప్రొఫెషనల్ రెజ్యూమ్ సృష్టించండి.",
        },
        interview: {
          title: "ఇంటర్వ్యూ చిట్కాలు",
          description: "ఇంటర్వ్యూలకు సిద్ధమై త్వరగా ఉద్యోగం పొందండి.",
        },
        salary: {
          title: "జీతం గైడ్",
          description: "మీ పాత్రకు సరైన జీతం తెలుసుకోండి.",
        },
        career: {
          title: "కెరీర్ సలహా",
          description: "మీ కెరీర్ ఎదుగుదలకు మార్గదర్శనం.",
        },
      },
      statsAria: "AsliJobs ప్లాట్‌ఫామ్ గణాంకాలు",
      stats: {
        hiredToday: "ఈరోజు ఉద్యోగం పొందినవారు",
        jobsToday: "ఈరోజు పోస్ట్ చేసిన ఉద్యోగాలు",
        applicationsToday: "ఈరోజు దరఖాస్తులు",
        employerSatisfaction: "యజమానుల సంతృప్తి",
        platformRating: "ప్లాట్‌ఫామ్ రేటింగ్",
      },
    },
  },
};

const ta: HomeCatalog = {
  home: {
    common: {
      jobCount: "{count} வேலைகள்",
      logoAlt: "{name} லோகோ",
    },
    hero: {
      headingLine1: "எளிதாக வேலை தேடுங்கள்.",
      headingLine2: "WhatsApp-இல்.",
      supportingLine1: "ஆட்களை பணியமர்த்த அல்லது வேலை தேட மிக விரைவான வழி.",
      supportingLine2: "எளிமை • பல மொழி • WhatsApp முதன்மை",
      languagesLabel: "பல மொழி ஆதரவு",
      languagesAria: "ஆதரிக்கப்படும் மொழிகள்",
      imageAlt: "WhatsApp-இல் வேலைகளைப் பார்க்கும் வேலை தேடுபவர்",
      features: {
        voiceSearch: { title: "குரல் தேடல்", description: "பேசி வேலை தேடுங்கள்" },
        whatsappFirst: { title: "WhatsApp முதன்மை", description: "ஆப் தேவையில்லை" },
        verifiedJobs: {
          title: "சரிபார்க்கப்பட்ட வேலைகள்",
          description: "நம்பகமான முதலாளிகள்",
        },
        inYourLanguage: { title: "உங்கள் மொழியில்", description: "எளிதாக விண்ணப்பிக்கவும்" },
      },
      messages: {
        voiceSearch: "எனக்கு அருகில் டெலிவரி வேலைகள்",
        whatsappFirst: "வணக்கம் AsliJobs, எனக்கு வேலை தேடுங்கள்",
        verifiedJobs: "சரிபார்க்கப்பட்ட வேலைகளைக் காட்டுங்கள்",
      },
    },
    search: {
      formAria: "வேலை தேடல்",
      queryLabel: "வேலை, பணி அல்லது முக்கியச் சொல்லைத் தேடுங்கள்",
      queryPlaceholder: "எ.கா. ஓட்டுநர், டெலிவரி எக்ஸிகியூட்டிவ், எலக்ட்ரீஷியன்",
      cityPlaceholderExample: "எ.கா. {city}",
      cityPlaceholderSearch: "நகரத்தைத் தேடுங்கள்",
      popularLabel: "பிரபலமான தேடல்கள்:",
      popular: {
        deliveryExecutive: "டெலிவரி எக்ஸிகியூட்டிவ்",
        driver: "ஓட்டுநர்",
        helper: "உதவியாளர்",
        cook: "சமையல்காரர்",
        salesExecutive: "விற்பனை எக்ஸிகியூட்டிவ்",
        warehouse: "கிடங்கு",
        securityGuard: "பாதுகாவலர்",
      },
    },
    cta: {
      sectionAria: "விரைவு செயல்கள்",
      whatsapp: {
        title: "WhatsApp-இல் AsliJobs-இல் சேருங்கள்",
        description: "வேலை அறிவிப்புகளைப் பெற்று சில நொடிகளில் விண்ணப்பியுங்கள்",
        action: "WhatsApp-இல் சேருங்கள்",
      },
      employer: {
        title: "பணியாளர்கள் தேவையா?",
        description: "வேலையைப் பதிவிட்டு சரியான நபர்களை பணியமர்த்துங்கள்",
        action: "இலவசமாக வேலை பதிவிடுங்கள்",
      },
      assist: {
        title: "பணியமர்த்த உதவி தேவையா?",
        description: "எங்கள் நிபுணர்கள் விரைவாக பணியமர்த்த உதவுவார்கள்",
        action: "பணியமர்த்தல் உதவி பெறுங்கள்",
      },
    },
    employerConfirm: {
      closeDialog: "உரையாடலை மூடு",
      closeAria: "முதலாளி உறுதிப்படுத்தலை மூடு",
      title: "நீங்கள் முதலாளியா?",
      description:
        "AsliJobs மூலம் வேலைகளைப் பதிவிட்டு பொருத்தமான விண்ணப்பதாரர்களை பணியமர்த்துங்கள்.",
      continue: "முதலாளியாகத் தொடரவும்",
    },
    discovery: {
      sectionAria: "வேலைகள் மற்றும் முதலாளிகளைக் கண்டறியுங்கள்",
      categoriesTitle: "பிரிவு வாரியாக வேலைகளைப் பாருங்கள்",
      categoriesAction: "அனைத்து பிரிவுகளையும் பாருங்கள் →",
      employersTitle: "இப்போது பணியமர்த்தும் முன்னணி முதலாளிகள்",
      employersAction: "அனைத்து முதலாளிகளையும் பாருங்கள் →",
      previousEmployers: "முந்தைய முதலாளிகள்",
      nextEmployers: "அடுத்த முதலாளிகள்",
      categories: {
        drivers: "ஓட்டுநர்கள்",
        delivery: "டெலிவரி",
        warehouse: "கிடங்கு",
        security: "பாதுகாப்பு",
        construction: "கட்டுமானம்",
        hospitality: "விருந்தோம்பல்",
        manufacturing: "உற்பத்தி",
        viewAll: "அனைத்தையும் பாருங்கள்",
        viewAllSubtitle: "பிரிவுகள்",
      },
    },
    jobsDiscovery: {
      sectionAria: "பிரபலமான வேலைகள் மற்றும் இடங்கள்",
      trendingTitle: "ஹைதராபாத்தில் டிரெண்டிங் வேலைகள்",
      viewAllJobs: "அனைத்து வேலைகளையும் பாருங்கள் →",
      statesTitle: "மாநில வாரியாக வேலைகளைப் பாருங்கள்",
      statesAction: "அனைத்து மாநிலங்களையும் பாருங்கள் →",
      citiesTitle: "நகர வாரியாக வேலைகளைப் பாருங்கள்",
      citiesAction: "அனைத்து நகரங்களையும் பாருங்கள் →",
      perMonth: "/மாதம்",
      experienceOnly: "அனுபவம் உள்ளவர்கள் மட்டும்",
      postedDayAgo: "{count} நாள் முன்பு",
      postedDaysAgo: "{count} நாட்கள் முன்பு",
    },
    hiring: {
      title: "ஒவ்வொரு தேவைக்கும் பணியமர்த்தல் தீர்வுகள்",
      description: "சரியான திறமையைக் கண்டறிய சரியான தீர்வைத் தேர்ந்தெடுங்கள்",
      compare: "தீர்வுகளை ஒப்பிடுங்கள்",
      freeJobPost: {
        title: "இலவச வேலை பதிவு",
        subtitle: "சிறு முதலாளிகளுக்கு சிறந்தது",
        feature1: "வரம்பற்ற வேலைகளைப் பதிவிடுங்கள்",
        feature2: "விண்ணப்பங்களைப் பெறுங்கள்",
        feature3: "விண்ணப்பதாரர்களை நிர்வகியுங்கள்",
        action: "இலவசமாக வேலை பதிவிடுங்கள்",
      },
      jobBoosters: {
        title: "வேலை பூஸ்டர்கள்",
        subtitle: "விரைவாக பணியமர்த்த வேண்டுமா?",
        feature1: "அதிக விண்ணப்பதாரர்களைச் சென்றடையுங்கள்",
        feature2: "தேடல் முடிவுகளில் முன்னுரிமை",
        feature3: "உங்கள் வேலையை முன்னிலைப்படுத்துங்கள்",
        action: "வேலையை பூஸ்ட் செய்யுங்கள்",
      },
      hireAssist: {
        title: "பணியமர்த்தல் உதவி",
        subtitle: "பணியமர்த்த நாங்கள் உதவுவோம்",
        feature1: "பிரத்யேக பணியமர்த்தல் நிபுணர்",
        feature2: "சிறந்த விண்ணப்பதாரர்களைத் தேர்வுசெய்யுங்கள்",
        feature3: "தொடக்கம் முதல் இறுதி வரை ஆதரவு",
        action: "பணியமர்த்தல் உதவி பெறுங்கள்",
      },
      businessHiring: {
        title: "வணிக பணியமர்த்தல்",
        subtitle: "ஒவ்வொரு மாதமும் பணியமர்த்துகிறீர்களா?",
        feature1: "அதிக அளவு பணியமர்த்தல் ஆதரவு",
        feature2: "தனிப்பயன் பணியமர்த்தல் தீர்வு",
        feature3: "கணக்கு மேலாளர்",
        action: "விற்பனைக் குழுவைத் தொடர்புகொள்ளுங்கள்",
      },
    },
    trust: {
      sectionAria: "ஏன் AsliJobs, இது எப்படி செயல்படுகிறது, மற்றும் வளங்கள்",
      whyTitle: "ஏன் AsliJobs-ஐத் தேர்ந்தெடுக்க வேண்டும்?",
      benefits: {
        whatsapp: {
          title: "WhatsApp முதன்மை",
          description:
            "ஆப் நிறுவத் தேவையில்லை. வேலை தேடவும் விண்ணப்பிக்கவும் WhatsApp-ஐப் பயன்படுத்துங்கள்.",
        },
        languages: {
          title: "பல மொழி ஆதரவு",
          description: "உங்கள் மொழியில் தேடி விண்ணப்பியுங்கள்.",
        },
        voice: {
          title: "குரல் தேடல்",
          description: "பேசினால் போதும், அருகிலுள்ள சரியான வேலைகளைக் கண்டறியுங்கள்.",
        },
        verified: {
          title: "சரிபார்க்கப்பட்ட முதலாளிகள்",
          description: "உங்கள் பாதுகாப்பிற்காக அனைத்து முதலாளிகளும் சரிபார்க்கப்பட்டவர்கள்.",
        },
        aiMatching: {
          title: "AI வேலை பொருத்தம்",
          description:
            "உங்கள் திறன்கள் மற்றும் இடத்திற்குப் பொருந்தும் வேலைப் பரிந்துரைகளைப் பெறுங்கள்.",
        },
        free: {
          title: "வேலை தேடுபவர்களுக்கு இலவசம்",
          description: "சுயவிவரம் உருவாக்கி, வேலை தேடி, முற்றிலும் இலவசமாக விண்ணப்பியுங்கள்.",
        },
      },
      howTitle: "AsliJobs எப்படி செயல்படுகிறது",
      howSubtitle: "4 எளிய படிகளில் WhatsApp-இல் வேலை தேடுங்கள்",
      steps: {
        whatsapp: {
          title: "WhatsApp-இல் சேருங்கள்",
          description:
            "'WhatsApp-இல் சேருங்கள்' என்பதைக் கிளிக் செய்து AsliJobs Bot உடன் அரட்டையைத் தொடங்குங்கள்.",
        },
        language: {
          title: "மொழியைத் தேர்ந்தெடுங்கள்",
          description:
            "உங்களுக்கு விருப்பமான மொழியைத் தேர்ந்தெடுத்து நீங்கள் என்ன தேடுகிறீர்கள் என்று சொல்லுங்கள்.",
        },
        search: {
          title: "பொருத்தமான வேலைகளைப் பெறுங்கள்",
          description: "தொடர்புடைய வேலைப் பட்டியல்களை WhatsApp-இல் உடனடியாகப் பெறுங்கள்.",
        },
        apply: {
          title: "விண்ணப்பித்து வேலை பெறுங்கள்",
          description: "ஒரே கிளிக்கில் விண்ணப்பித்து முதலாளிகளுடன் விரைவாக இணையுங்கள்.",
        },
      },
      resourcesTitle: "வேலை தேடுபவர் வளங்கள்",
      resourcesAction: "அனைத்து வளங்களையும் பாருங்கள் →",
      resources: {
        guide: {
          title: "வேலை தேடுபவர் வழிகாட்டி",
          description:
            "சுயவிவரம் உருவாக்க, வேலை தேட மற்றும் நேர்காணல்களில் வெற்றிபெற குறிப்புகள்.",
        },
        resume: {
          title: "ரெஸ்யூம் பில்டர்",
          description: "சில நிமிடங்களில் தொழில்முறை ரெஸ்யூம் உருவாக்குங்கள்.",
        },
        interview: {
          title: "நேர்காணல் குறிப்புகள்",
          description: "நேர்காணலுக்குத் தயாராகி விரைவாக வேலை பெறுங்கள்.",
        },
        salary: {
          title: "சம்பள வழிகாட்டி",
          description: "உங்கள் பணிக்கான சரியான சம்பளத்தை அறியுங்கள்.",
        },
        career: {
          title: "தொழில் ஆலோசனை",
          description: "உங்கள் தொழில் வளர்ச்சிக்கான வழிகாட்டுதல்.",
        },
      },
      statsAria: "AsliJobs தள புள்ளிவிவரங்கள்",
      stats: {
        hiredToday: "இன்று வேலை பெற்றவர்கள்",
        jobsToday: "இன்று பதிவிடப்பட்ட வேலைகள்",
        applicationsToday: "இன்றைய விண்ணப்பங்கள்",
        employerSatisfaction: "முதலாளி திருப்தி",
        platformRating: "தள மதிப்பீடு",
      },
    },
  },
};

const kn: HomeCatalog = {
  home: {
    common: {
      jobCount: "{count} ಉದ್ಯೋಗಗಳು",
      logoAlt: "{name} ಲೋಗೋ",
    },
    hero: {
      headingLine1: "ಸುಲಭವಾಗಿ ಉದ್ಯೋಗ ಹುಡುಕಿ.",
      headingLine2: "WhatsApp ನಲ್ಲಿ.",
      supportingLine1: "ಸಿಬ್ಬಂದಿಯನ್ನು ನೇಮಿಸಿಕೊಳ್ಳಲು ಅಥವಾ ಉದ್ಯೋಗ ಪಡೆಯಲು ಅತ್ಯಂತ ವೇಗದ ಮಾರ್ಗ.",
      supportingLine2: "ಸರಳ • ಬಹುಭಾಷಾ • WhatsApp ಮೊದಲು",
      languagesLabel: "ಬಹುಭಾಷಾ ಬೆಂಬಲ",
      languagesAria: "ಬೆಂಬಲಿತ ಭಾಷೆಗಳು",
      imageAlt: "WhatsApp ನಲ್ಲಿ ಉದ್ಯೋಗಗಳನ್ನು ನೋಡುತ್ತಿರುವ ಉದ್ಯೋಗಾರ್ಥಿ",
      features: {
        voiceSearch: { title: "ಧ್ವನಿ ಹುಡುಕಾಟ", description: "ಮಾತನಾಡಿ ಉದ್ಯೋಗ ಹುಡುಕಿ" },
        whatsappFirst: { title: "WhatsApp ಮೊದಲು", description: "ಆ್ಯಪ್ ಬೇಕಿಲ್ಲ" },
        verifiedJobs: { title: "ಪರಿಶೀಲಿತ ಉದ್ಯೋಗಗಳು", description: "ನಂಬಿಕಸ್ಥ ಉದ್ಯೋಗದಾತರು" },
        inYourLanguage: { title: "ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ", description: "ಸುಲಭವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ" },
      },
      messages: {
        voiceSearch: "ನನ್ನ ಹತ್ತಿರದ ಡೆಲಿವರಿ ಉದ್ಯೋಗಗಳು",
        whatsappFirst: "ಹಾಯ್ AsliJobs, ನನಗೆ ಉದ್ಯೋಗ ಹುಡುಕಿ",
        verifiedJobs: "ಪರಿಶೀಲಿತ ಉದ್ಯೋಗಗಳನ್ನು ತೋರಿಸಿ",
      },
    },
    search: {
      formAria: "ಉದ್ಯೋಗ ಹುಡುಕಾಟ",
      queryLabel: "ಉದ್ಯೋಗ, ಹುದ್ದೆ ಅಥವಾ ಕೀವರ್ಡ್ ಹುಡುಕಿ",
      queryPlaceholder: "ಉದಾ. ಚಾಲಕ, ಡೆಲಿವರಿ ಎಕ್ಸಿಕ್ಯೂಟಿವ್, ಎಲೆಕ್ಟ್ರಿಷಿಯನ್",
      cityPlaceholderExample: "ಉದಾ. {city}",
      cityPlaceholderSearch: "ನಗರ ಹುಡುಕಿ",
      popularLabel: "ಜನಪ್ರಿಯ ಹುಡುಕಾಟಗಳು:",
      popular: {
        deliveryExecutive: "ಡೆಲಿವರಿ ಎಕ್ಸಿಕ್ಯೂಟಿವ್",
        driver: "ಚಾಲಕ",
        helper: "ಸಹಾಯಕ",
        cook: "ಅಡುಗೆಯವರು",
        salesExecutive: "ಸೇಲ್ಸ್ ಎಕ್ಸಿಕ್ಯೂಟಿವ್",
        warehouse: "ಗೋದಾಮು",
        securityGuard: "ಸೆಕ್ಯುರಿಟಿ ಗಾರ್ಡ್",
      },
    },
    cta: {
      sectionAria: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು",
      whatsapp: {
        title: "WhatsApp ನಲ್ಲಿ AsliJobs ಗೆ ಸೇರಿ",
        description: "ಉದ್ಯೋಗ ಅಲರ್ಟ್‌ಗಳನ್ನು ಪಡೆದು ಕ್ಷಣಗಳಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
        action: "WhatsApp ನಲ್ಲಿ ಸೇರಿ",
      },
      employer: {
        title: "ಸಿಬ್ಬಂದಿ ಬೇಕೇ?",
        description: "ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಮಾಡಿ ಸರಿಯಾದ ಜನರನ್ನು ನೇಮಿಸಿ",
        action: "ಉಚಿತವಾಗಿ ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಮಾಡಿ",
      },
      assist: {
        title: "ನೇಮಕಾತಿಗೆ ಸಹಾಯ ಬೇಕೇ?",
        description: "ನಮ್ಮ ತಜ್ಞರು ವೇಗವಾಗಿ ನೇಮಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತಾರೆ",
        action: "ನೇಮಕಾತಿ ಸಹಾಯ ಪಡೆಯಿರಿ",
      },
    },
    employerConfirm: {
      closeDialog: "ಡೈಲಾಗ್ ಮುಚ್ಚಿ",
      closeAria: "ಉದ್ಯೋಗದಾತ ದೃಢೀಕರಣವನ್ನು ಮುಚ್ಚಿ",
      title: "ನೀವು ಉದ್ಯೋಗದಾತರೇ?",
      description: "AsliJobs ಮೂಲಕ ಉದ್ಯೋಗಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ ಸೂಕ್ತ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ನೇಮಿಸಿ.",
      continue: "ಉದ್ಯೋಗದಾತರಾಗಿ ಮುಂದುವರಿಯಿರಿ",
    },
    discovery: {
      sectionAria: "ಉದ್ಯೋಗಗಳು ಮತ್ತು ಉದ್ಯೋಗದಾತರನ್ನು ಅನ್ವೇಷಿಸಿ",
      categoriesTitle: "ವರ್ಗದ ಪ್ರಕಾರ ಉದ್ಯೋಗಗಳನ್ನು ನೋಡಿ",
      categoriesAction: "ಎಲ್ಲಾ ವರ್ಗಗಳನ್ನು ನೋಡಿ →",
      employersTitle: "ಈಗ ನೇಮಿಸುತ್ತಿರುವ ಪ್ರಮುಖ ಉದ್ಯೋಗದಾತರು",
      employersAction: "ಎಲ್ಲಾ ಉದ್ಯೋಗದಾತರನ್ನು ನೋಡಿ →",
      previousEmployers: "ಹಿಂದಿನ ಉದ್ಯೋಗದಾತರು",
      nextEmployers: "ಮುಂದಿನ ಉದ್ಯೋಗದಾತರು",
      categories: {
        drivers: "ಚಾಲಕರು",
        delivery: "ಡೆಲಿವರಿ",
        warehouse: "ಗೋದಾಮು",
        security: "ಭದ್ರತೆ",
        construction: "ನಿರ್ಮಾಣ",
        hospitality: "ಆತಿಥ್ಯ",
        manufacturing: "ಉತ್ಪಾದನೆ",
        viewAll: "ಎಲ್ಲವನ್ನೂ ನೋಡಿ",
        viewAllSubtitle: "ವರ್ಗಗಳು",
      },
    },
    jobsDiscovery: {
      sectionAria: "ಜನಪ್ರಿಯ ಉದ್ಯೋಗಗಳು ಮತ್ತು ಸ್ಥಳಗಳು",
      trendingTitle: "ಹೈದರಾಬಾದ್‌ನಲ್ಲಿ ಟ್ರೆಂಡಿಂಗ್ ಉದ್ಯೋಗಗಳು",
      viewAllJobs: "ಎಲ್ಲಾ ಉದ್ಯೋಗಗಳನ್ನು ನೋಡಿ →",
      statesTitle: "ರಾಜ್ಯದ ಪ್ರಕಾರ ಉದ್ಯೋಗಗಳನ್ನು ನೋಡಿ",
      statesAction: "ಎಲ್ಲಾ ರಾಜ್ಯಗಳನ್ನು ನೋಡಿ →",
      citiesTitle: "ನಗರದ ಪ್ರಕಾರ ಉದ್ಯೋಗಗಳನ್ನು ನೋಡಿ",
      citiesAction: "ಎಲ್ಲಾ ನಗರಗಳನ್ನು ನೋಡಿ →",
      perMonth: "/ತಿಂಗಳು",
      experienceOnly: "ಅನುಭವಿಗಳಿಗೆ ಮಾತ್ರ",
      postedDayAgo: "{count} ದಿನದ ಹಿಂದೆ",
      postedDaysAgo: "{count} ದಿನಗಳ ಹಿಂದೆ",
    },
    hiring: {
      title: "ಪ್ರತಿ ಅಗತ್ಯಕ್ಕೂ ನೇಮಕಾತಿ ಪರಿಹಾರಗಳು",
      description: "ಸರಿಯಾದ ಪ್ರತಿಭೆಯನ್ನು ಹುಡುಕಲು ಸೂಕ್ತ ಪರಿಹಾರವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
      compare: "ಪರಿಹಾರಗಳನ್ನು ಹೋಲಿಸಿ",
      freeJobPost: {
        title: "ಉಚಿತ ಉದ್ಯೋಗ ಪೋಸ್ಟ್",
        subtitle: "ಸಣ್ಣ ಉದ್ಯೋಗದಾತರಿಗೆ ಉತ್ತಮ",
        feature1: "ಅನಿಯಮಿತ ಉದ್ಯೋಗಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ",
        feature2: "ಅರ್ಜಿಗಳನ್ನು ಸ್ವೀಕರಿಸಿ",
        feature3: "ಅಭ್ಯರ್ಥಿಗಳನ್ನು ನಿರ್ವಹಿಸಿ",
        action: "ಉಚಿತವಾಗಿ ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಮಾಡಿ",
      },
      jobBoosters: {
        title: "ಜಾಬ್ ಬೂಸ್ಟರ್‌ಗಳು",
        subtitle: "ವೇಗವಾಗಿ ನೇಮಿಸಬೇಕೇ?",
        feature1: "ಹೆಚ್ಚು ಅಭ್ಯರ್ಥಿಗಳನ್ನು ತಲುಪಿ",
        feature2: "ಹುಡುಕಾಟ ಫಲಿತಾಂಶಗಳಲ್ಲಿ ಆದ್ಯತೆ",
        feature3: "ನಿಮ್ಮ ಉದ್ಯೋಗವನ್ನು ಹೈಲೈಟ್ ಮಾಡಿ",
        action: "ಉದ್ಯೋಗ ಬೂಸ್ಟ್ ಮಾಡಿ",
      },
      hireAssist: {
        title: "ನೇಮಕಾತಿ ಸಹಾಯ",
        subtitle: "ನೇಮಕಾತಿಗೆ ನಾವು ಸಹಾಯ ಮಾಡುತ್ತೇವೆ",
        feature1: "ಮೀಸಲಾದ ನೇಮಕಾತಿ ತಜ್ಞ",
        feature2: "ಅತ್ಯುತ್ತಮ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಮಾಡಿ",
        feature3: "ಆರಂಭದಿಂದ ಕೊನೆಯವರೆಗೆ ಬೆಂಬಲ",
        action: "ನೇಮಕಾತಿ ಸಹಾಯ ಪಡೆಯಿರಿ",
      },
      businessHiring: {
        title: "ವ್ಯಾಪಾರ ನೇಮಕಾತಿ",
        subtitle: "ಪ್ರತಿ ತಿಂಗಳು ನೇಮಿಸುತ್ತೀರಾ?",
        feature1: "ಬೃಹತ್ ನೇಮಕಾತಿ ಬೆಂಬಲ",
        feature2: "ಕಸ್ಟಮ್ ನೇಮಕಾತಿ ಪರಿಹಾರ",
        feature3: "ಖಾತೆ ವ್ಯವಸ್ಥಾಪಕ",
        action: "ಸೇಲ್ಸ್ ತಂಡವನ್ನು ಸಂಪರ್ಕಿಸಿ",
      },
    },
    trust: {
      sectionAria: "AsliJobs ಅನ್ನು ಏಕೆ ಆಯ್ಕೆಮಾಡಬೇಕು, ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ ಮತ್ತು ಸಂಪನ್ಮೂಲಗಳು",
      whyTitle: "AsliJobs ಅನ್ನು ಏಕೆ ಆಯ್ಕೆಮಾಡಬೇಕು?",
      benefits: {
        whatsapp: {
          title: "WhatsApp ಮೊದಲು",
          description:
            "ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಬೇಕಿಲ್ಲ. ಉದ್ಯೋಗ ಹುಡುಕಲು ಮತ್ತು ಅರ್ಜಿ ಸಲ್ಲಿಸಲು WhatsApp ಬಳಸಿ.",
        },
        languages: {
          title: "ಬಹುಭಾಷಾ ಬೆಂಬಲ",
          description: "ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಹುಡುಕಿ ಮತ್ತು ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
        },
        voice: {
          title: "ಧ್ವನಿ ಹುಡುಕಾಟ",
          description: "ಮಾತನಾಡಿದರೆ ಸಾಕು, ನಿಮ್ಮ ಹತ್ತಿರದ ಸರಿಯಾದ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ.",
        },
        verified: {
          title: "ಪರಿಶೀಲಿತ ಉದ್ಯೋಗದಾತರು",
          description: "ನಿಮ್ಮ ಸುರಕ್ಷತೆಗಾಗಿ ಎಲ್ಲಾ ಉದ್ಯೋಗದಾತರನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ.",
        },
        aiMatching: {
          title: "AI ಉದ್ಯೋಗ ಹೊಂದಾಣಿಕೆ",
          description: "ನಿಮ್ಮ ಕೌಶಲ್ಯ ಮತ್ತು ಸ್ಥಳಕ್ಕೆ ಹೊಂದುವ ಉದ್ಯೋಗ ಶಿಫಾರಸುಗಳನ್ನು ಪಡೆಯಿರಿ.",
        },
        free: {
          title: "ಉದ್ಯೋಗಾರ್ಥಿಗಳಿಗೆ ಉಚಿತ",
          description: "ಪ್ರೊಫೈಲ್ ರಚಿಸಿ, ಉದ್ಯೋಗ ಹುಡುಕಿ ಮತ್ತು ಸಂಪೂರ್ಣ ಉಚಿತವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
        },
      },
      howTitle: "AsliJobs ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
      howSubtitle: "4 ಸರಳ ಹಂತಗಳಲ್ಲಿ WhatsApp ನಲ್ಲಿ ಉದ್ಯೋಗ ಹುಡುಕಿ",
      steps: {
        whatsapp: {
          title: "WhatsApp ನಲ್ಲಿ ಸೇರಿ",
          description: "'WhatsApp ನಲ್ಲಿ ಸೇರಿ' ಕ್ಲಿಕ್ ಮಾಡಿ ಮತ್ತು AsliJobs Bot ಜೊತೆ ಚಾಟ್ ಪ್ರಾರಂಭಿಸಿ.",
        },
        language: {
          title: "ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ",
          description:
            "ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ನೀವು ಏನು ಹುಡುಕುತ್ತಿದ್ದೀರಿ ಎಂದು ತಿಳಿಸಿ.",
        },
        search: {
          title: "ಹೊಂದುವ ಉದ್ಯೋಗಗಳನ್ನು ಪಡೆಯಿರಿ",
          description: "ಸಂಬಂಧಿತ ಉದ್ಯೋಗ ಪಟ್ಟಿಗಳನ್ನು WhatsApp ನಲ್ಲಿ ತಕ್ಷಣ ಪಡೆಯಿರಿ.",
        },
        apply: {
          title: "ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ಉದ್ಯೋಗ ಪಡೆಯಿರಿ",
          description: "ಒಂದೇ ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ಉದ್ಯೋಗದಾತರೊಂದಿಗೆ ಬೇಗ ಸಂಪರ್ಕ ಪಡೆಯಿರಿ.",
        },
      },
      resourcesTitle: "ಉದ್ಯೋಗಾರ್ಥಿ ಸಂಪನ್ಮೂಲಗಳು",
      resourcesAction: "ಎಲ್ಲಾ ಸಂಪನ್ಮೂಲಗಳನ್ನು ನೋಡಿ →",
      resources: {
        guide: {
          title: "ಉದ್ಯೋಗಾರ್ಥಿ ಮಾರ್ಗದರ್ಶಿ",
          description: "ಪ್ರೊಫೈಲ್ ರಚಿಸಲು, ಉದ್ಯೋಗ ಹುಡುಕಲು ಮತ್ತು ಸಂದರ್ಶನ ಗೆಲ್ಲಲು ಸಲಹೆಗಳು.",
        },
        resume: {
          title: "ರೆಸ್ಯೂಮ್ ಬಿಲ್ಡರ್",
          description: "ನಿಮಿಷಗಳಲ್ಲಿ ವೃತ್ತಿಪರ ರೆಸ್ಯೂಮ್ ರಚಿಸಿ.",
        },
        interview: {
          title: "ಸಂದರ್ಶನ ಸಲಹೆಗಳು",
          description: "ಸಂದರ್ಶನಕ್ಕೆ ಸಿದ್ಧರಾಗಿ ಬೇಗ ಉದ್ಯೋಗ ಪಡೆಯಿರಿ.",
        },
        salary: {
          title: "ಸಂಬಳ ಮಾರ್ಗದರ್ಶಿ",
          description: "ನಿಮ್ಮ ಹುದ್ದೆಗೆ ಸರಿಯಾದ ಸಂಬಳವನ್ನು ತಿಳಿಯಿರಿ.",
        },
        career: {
          title: "ವೃತ್ತಿ ಸಲಹೆ",
          description: "ನಿಮ್ಮ ವೃತ್ತಿ ಬೆಳವಣಿಗೆಗೆ ಮಾರ್ಗದರ್ಶನ.",
        },
      },
      statsAria: "AsliJobs ವೇದಿಕೆಯ ಅಂಕಿಅಂಶಗಳು",
      stats: {
        hiredToday: "ಇಂದು ಉದ್ಯೋಗ ಪಡೆದವರು",
        jobsToday: "ಇಂದು ಪೋಸ್ಟ್ ಮಾಡಿದ ಉದ್ಯೋಗಗಳು",
        applicationsToday: "ಇಂದಿನ ಅರ್ಜಿಗಳು",
        employerSatisfaction: "ಉದ್ಯೋಗದಾತರ ತೃಪ್ತಿ",
        platformRating: "ವೇದಿಕೆ ರೇಟಿಂಗ್",
      },
    },
  },
};

const ml: HomeCatalog = {
  home: {
    common: {
      jobCount: "{count} ജോലികൾ",
      logoAlt: "{name} ലോഗോ",
    },
    hero: {
      headingLine1: "എളുപ്പത്തിൽ ജോലി കണ്ടെത്തൂ.",
      headingLine2: "WhatsApp-ൽ.",
      supportingLine1: "ആളുകളെ നിയമിക്കാനോ ജോലി കണ്ടെത്താനോ ഉള്ള ഏറ്റവും വേഗമേറിയ മാർഗം.",
      supportingLine2: "ലളിതം • ബഹുഭാഷ • WhatsApp ഫസ്റ്റ്",
      languagesLabel: "ബഹുഭാഷാ പിന്തുണ",
      languagesAria: "പിന്തുണയ്ക്കുന്ന ഭാഷകൾ",
      imageAlt: "WhatsApp-ൽ ജോലികൾ തിരയുന്ന തൊഴിൽ അന്വേഷകൻ",
      features: {
        voiceSearch: { title: "വോയ്സ് സെർച്ച്", description: "സംസാരിച്ച് ജോലി കണ്ടെത്തൂ" },
        whatsappFirst: { title: "WhatsApp ഫസ്റ്റ്", description: "ആപ്പ് ആവശ്യമില്ല" },
        verifiedJobs: { title: "പരിശോധിച്ച ജോലികൾ", description: "വിശ്വസ്ത തൊഴിലുടമകൾ" },
        inYourLanguage: { title: "നിങ്ങളുടെ ഭാഷയിൽ", description: "എളുപ്പത്തിൽ അപേക്ഷിക്കൂ" },
      },
      messages: {
        voiceSearch: "എന്റെ അടുത്തുള്ള ഡെലിവറി ജോലികൾ",
        whatsappFirst: "ഹായ് AsliJobs, എനിക്ക് ജോലി കണ്ടെത്തൂ",
        verifiedJobs: "പരിശോധിച്ച ജോലികൾ കാണിക്കൂ",
      },
    },
    search: {
      formAria: "ജോലി തിരയൽ",
      queryLabel: "ജോലി, റോൾ അല്ലെങ്കിൽ കീവേഡ് തിരയൂ",
      queryPlaceholder: "ഉദാ. ഡ്രൈവർ, ഡെലിവറി എക്സിക്യൂട്ടീവ്, ഇലക്ട്രീഷ്യൻ",
      cityPlaceholderExample: "ഉദാ. {city}",
      cityPlaceholderSearch: "നഗരം തിരയൂ",
      popularLabel: "ജനപ്രിയ തിരയലുകൾ:",
      popular: {
        deliveryExecutive: "ഡെലിവറി എക്സിക്യൂട്ടീവ്",
        driver: "ഡ്രൈവർ",
        helper: "ഹെൽപ്പർ",
        cook: "പാചകക്കാരൻ",
        salesExecutive: "സെയിൽസ് എക്സിക്യൂട്ടീവ്",
        warehouse: "വെയർഹൗസ്",
        securityGuard: "സെക്യൂരിറ്റി ഗാർഡ്",
      },
    },
    cta: {
      sectionAria: "ദ്രുത പ്രവർത്തനങ്ങൾ",
      whatsapp: {
        title: "WhatsApp-ൽ AsliJobs-ൽ ചേരൂ",
        description: "ജോലി അലർട്ടുകൾ നേടി നിമിഷങ്ങൾക്കുള്ളിൽ അപേക്ഷിക്കൂ",
        action: "WhatsApp-ൽ ചേരൂ",
      },
      employer: {
        title: "ജീവനക്കാരെ ആവശ്യമുണ്ടോ?",
        description: "ജോലി പോസ്റ്റ് ചെയ്ത് ശരിയായ ആളുകളെ നിയമിക്കൂ",
        action: "സൗജന്യമായി ജോലി പോസ്റ്റ് ചെയ്യൂ",
      },
      assist: {
        title: "നിയമനത്തിൽ സഹായം വേണോ?",
        description: "ഞങ്ങളുടെ വിദഗ്ധർ വേഗത്തിൽ നിയമിക്കാൻ സഹായിക്കും",
        action: "നിയമന സഹായം നേടൂ",
      },
    },
    employerConfirm: {
      closeDialog: "ഡയലോഗ് അടയ്ക്കുക",
      closeAria: "തൊഴിലുടമ സ്ഥിരീകരണം അടയ്ക്കുക",
      title: "നിങ്ങൾ ഒരു തൊഴിലുടമയാണോ?",
      description:
        "AsliJobs വഴി ജോലികൾ പോസ്റ്റ് ചെയ്ത് അനുയോജ്യരായ ഉദ്യോഗാർത്ഥികളെ നിയമിക്കൂ.",
      continue: "തൊഴിലുടമയായി തുടരുക",
    },
    discovery: {
      sectionAria: "ജോലികളും തൊഴിലുടമകളും കണ്ടെത്തൂ",
      categoriesTitle: "വിഭാഗം അനുസരിച്ച് ജോലികൾ കാണൂ",
      categoriesAction: "എല്ലാ വിഭാഗങ്ങളും കാണൂ →",
      employersTitle: "ഇപ്പോൾ നിയമിക്കുന്ന മുൻനിര തൊഴിലുടമകൾ",
      employersAction: "എല്ലാ തൊഴിലുടമകളെയും കാണൂ →",
      previousEmployers: "മുൻ തൊഴിലുടമകൾ",
      nextEmployers: "അടുത്ത തൊഴിലുടമകൾ",
      categories: {
        drivers: "ഡ്രൈവർമാർ",
        delivery: "ഡെലിവറി",
        warehouse: "വെയർഹൗസ്",
        security: "സെക്യൂരിറ്റി",
        construction: "നിർമ്മാണം",
        hospitality: "ഹോസ്പിറ്റാലിറ്റി",
        manufacturing: "ഉത്പാദനം",
        viewAll: "എല്ലാം കാണൂ",
        viewAllSubtitle: "വിഭാഗങ്ങൾ",
      },
    },
    jobsDiscovery: {
      sectionAria: "ജനപ്രിയ ജോലികളും സ്ഥലങ്ങളും",
      trendingTitle: "ഹൈദരാബാദിലെ ട്രെൻഡിംഗ് ജോലികൾ",
      viewAllJobs: "എല്ലാ ജോലികളും കാണൂ →",
      statesTitle: "സംസ്ഥാനം അനുസരിച്ച് ജോലികൾ കാണൂ",
      statesAction: "എല്ലാ സംസ്ഥാനങ്ങളും കാണൂ →",
      citiesTitle: "നഗരം അനുസരിച്ച് ജോലികൾ കാണൂ",
      citiesAction: "എല്ലാ നഗരങ്ങളും കാണൂ →",
      perMonth: "/മാസം",
      experienceOnly: "പരിചയസമ്പന്നർക്ക് മാത്രം",
      postedDayAgo: "{count} ദിവസം മുമ്പ്",
      postedDaysAgo: "{count} ദിവസം മുമ്പ്",
    },
    hiring: {
      title: "എല്ലാ ആവശ്യങ്ങൾക്കുമുള്ള നിയമന പരിഹാരങ്ങൾ",
      description: "ശരിയായ പ്രതിഭയെ കണ്ടെത്താൻ അനുയോജ്യമായ പരിഹാരം തിരഞ്ഞെടുക്കൂ",
      compare: "പരിഹാരങ്ങൾ താരതമ്യം ചെയ്യൂ",
      freeJobPost: {
        title: "സൗജന്യ ജോബ് പോസ്റ്റ്",
        subtitle: "ചെറിയ തൊഴിലുടമകൾക്ക് മികച്ചത്",
        feature1: "പരിധിയില്ലാതെ ജോലികൾ പോസ്റ്റ് ചെയ്യൂ",
        feature2: "അപേക്ഷകൾ സ്വീകരിക്കൂ",
        feature3: "ഉദ്യോഗാർത്ഥികളെ നിയന്ത്രിക്കൂ",
        action: "സൗജന്യമായി ജോലി പോസ്റ്റ് ചെയ്യൂ",
      },
      jobBoosters: {
        title: "ജോബ് ബൂസ്റ്ററുകൾ",
        subtitle: "വേഗത്തിൽ നിയമിക്കണോ?",
        feature1: "കൂടുതൽ ഉദ്യോഗാർത്ഥികളിലേക്ക് എത്തൂ",
        feature2: "തിരയൽ ഫലങ്ങളിൽ മുൻഗണന",
        feature3: "നിങ്ങളുടെ ജോലി ഹൈലൈറ്റ് ചെയ്യൂ",
        action: "ജോലി ബൂസ്റ്റ് ചെയ്യൂ",
      },
      hireAssist: {
        title: "നിയമന സഹായം",
        subtitle: "നിയമിക്കാൻ ഞങ്ങൾ സഹായിക്കും",
        feature1: "സമർപ്പിത നിയമന വിദഗ്ധൻ",
        feature2: "മികച്ച ഉദ്യോഗാർത്ഥികളെ ഷോർട്ട്‌ലിസ്റ്റ് ചെയ്യൂ",
        feature3: "തുടക്കം മുതൽ അവസാനം വരെ പിന്തുണ",
        action: "നിയമന സഹായം നേടൂ",
      },
      businessHiring: {
        title: "ബിസിനസ് നിയമനം",
        subtitle: "എല്ലാ മാസവും നിയമിക്കുന്നുണ്ടോ?",
        feature1: "വൻതോതിലുള്ള നിയമന പിന്തുണ",
        feature2: "ഇഷ്ടാനുസൃത നിയമന പരിഹാരം",
        feature3: "അക്കൗണ്ട് മാനേജർ",
        action: "സെയിൽസ് ടീമിനെ ബന്ധപ്പെടൂ",
      },
    },
    trust: {
      sectionAria: "എന്തുകൊണ്ട് AsliJobs, ഇത് എങ്ങനെ പ്രവർത്തിക്കുന്നു, ഉറവിടങ്ങൾ",
      whyTitle: "എന്തുകൊണ്ട് AsliJobs തിരഞ്ഞെടുക്കണം?",
      benefits: {
        whatsapp: {
          title: "WhatsApp ഫസ്റ്റ്",
          description:
            "ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യേണ്ട. ജോലി കണ്ടെത്താനും അപേക്ഷിക്കാനും WhatsApp ഉപയോഗിക്കൂ.",
        },
        languages: {
          title: "ബഹുഭാഷാ പിന്തുണ",
          description: "നിങ്ങളുടെ ഭാഷയിൽ തിരഞ്ഞ് അപേക്ഷിക്കൂ.",
        },
        voice: {
          title: "വോയ്സ് സെർച്ച്",
          description: "സംസാരിച്ചാൽ മതി, അടുത്തുള്ള ശരിയായ ജോലികൾ കണ്ടെത്തൂ.",
        },
        verified: {
          title: "പരിശോധിച്ച തൊഴിലുടമകൾ",
          description: "നിങ്ങളുടെ സുരക്ഷയ്ക്കായി എല്ലാ തൊഴിലുടമകളെയും പരിശോധിച്ചിട്ടുണ്ട്.",
        },
        aiMatching: {
          title: "AI ജോബ് മാച്ചിംഗ്",
          description:
            "നിങ്ങളുടെ കഴിവുകൾക്കും സ്ഥലത്തിനും അനുയോജ്യമായ ജോലി ശുപാർശകൾ നേടൂ.",
        },
        free: {
          title: "തൊഴിൽ അന്വേഷകർക്ക് സൗജന്യം",
          description:
            "പ്രൊഫൈൽ ഉണ്ടാക്കൂ, ജോലികൾ തിരയൂ, പൂർണ്ണമായും സൗജന്യമായി അപേക്ഷിക്കൂ.",
        },
      },
      howTitle: "AsliJobs എങ്ങനെ പ്രവർത്തിക്കുന്നു",
      howSubtitle: "4 ലളിതമായ ഘട്ടങ്ങളിൽ WhatsApp-ൽ ജോലി കണ്ടെത്തൂ",
      steps: {
        whatsapp: {
          title: "WhatsApp-ൽ ചേരൂ",
          description: "'WhatsApp-ൽ ചേരൂ' ക്ലിക്ക് ചെയ്ത് AsliJobs Bot-മായി ചാറ്റ് തുടങ്ങൂ.",
        },
        language: {
          title: "ഭാഷ തിരഞ്ഞെടുക്കൂ",
          description:
            "നിങ്ങൾക്ക് ഇഷ്ടമുള്ള ഭാഷ തിരഞ്ഞെടുത്ത് നിങ്ങൾ എന്താണ് തിരയുന്നതെന്ന് പറയൂ.",
        },
        search: {
          title: "അനുയോജ്യമായ ജോലികൾ നേടൂ",
          description: "ബന്ധപ്പെട്ട ജോലി ലിസ്റ്റിംഗുകൾ WhatsApp-ൽ ഉടൻ ലഭിക്കും.",
        },
        apply: {
          title: "അപേക്ഷിച്ച് ജോലി നേടൂ",
          description: "ഒറ്റ ക്ലിക്കിൽ അപേക്ഷിച്ച് തൊഴിലുടമകളുമായി വേഗത്തിൽ ബന്ധപ്പെടൂ.",
        },
      },
      resourcesTitle: "തൊഴിൽ അന്വേഷകർക്കുള്ള ഉറവിടങ്ങൾ",
      resourcesAction: "എല്ലാ ഉറവിടങ്ങളും കാണൂ →",
      resources: {
        guide: {
          title: "തൊഴിൽ അന്വേഷക ഗൈഡ്",
          description:
            "പ്രൊഫൈൽ ഉണ്ടാക്കാനും ജോലി തിരയാനും ഇന്റർവ്യൂ വിജയിക്കാനുമുള്ള നുറുങ്ങുകൾ.",
        },
        resume: {
          title: "റെസ്യൂമെ ബിൽഡർ",
          description: "മിനിറ്റുകൾക്കുള്ളിൽ പ്രൊഫഷണൽ റെസ്യൂമെ ഉണ്ടാക്കൂ.",
        },
        interview: {
          title: "ഇന്റർവ്യൂ നുറുങ്ങുകൾ",
          description: "ഇന്റർവ്യൂവിന് തയ്യാറെടുത്ത് വേഗത്തിൽ ജോലി നേടൂ.",
        },
        salary: {
          title: "ശമ്പള ഗൈഡ്",
          description: "നിങ്ങളുടെ റോളിന് അനുയോജ്യമായ ശമ്പളം അറിയൂ.",
        },
        career: {
          title: "കരിയർ ഉപദേശം",
          description: "നിങ്ങളുടെ കരിയർ വളർത്താനുള്ള മാർഗ്ഗനിർദ്ദേശം.",
        },
      },
      statsAria: "AsliJobs പ്ലാറ്റ്ഫോം സ്ഥിതിവിവരക്കണക്കുകൾ",
      stats: {
        hiredToday: "ഇന്ന് ജോലി ലഭിച്ചവർ",
        jobsToday: "ഇന്ന് പോസ്റ്റ് ചെയ്ത ജോലികൾ",
        applicationsToday: "ഇന്നത്തെ അപേക്ഷകൾ",
        employerSatisfaction: "തൊഴിലുടമ സംതൃപ്തി",
        platformRating: "പ്ലാറ്റ്ഫോം റേറ്റിംഗ്",
      },
    },
  },
};

export const homeBundle = { en, hi, te, ta, kn, ml } as const;
