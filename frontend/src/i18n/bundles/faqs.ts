type MessageShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : MessageShape<T[K]>;
};

const en = {
  faqs: {
    breadcrumbAria: "Breadcrumb",
    pageTitle: "FAQs",
    subtitle:
      "Find quick answers to common questions about AsliJobs, job search, employer hiring, WhatsApp alerts, safety, and support.",
    searchPlaceholder: "Search FAQs...",
    emptyTitle: "No FAQs found",
    emptyDescription:
      "Try a different keyword, or browse the categories below after clearing your search.",
    clearSearch: "Clear search",
    helpTitle: "Still have questions?",
    helpDescriptionLine1: "Can't find the answer you're looking for?",
    helpDescriptionLine2: "Our support team is here to help.",
    helpContact: "Contact Support",
    helpWhatsapp: "WhatsApp Support",
    categories: {
      general: {
        title: "General",
        whatIsAslijobs: {
          question: "What is AsliJobs?",
          answer:
            "AsliJobs is a WhatsApp-based job portal that helps India’s blue-collar and grey-collar workforce find suitable jobs and helps employers hire the right candidates easily.",
        },
        howDoesAslijobsWork: {
          question: "How does AsliJobs work?",
          answer:
            "AsliJobs works through WhatsApp. Job seekers can receive job alerts and apply for jobs, while employers can post jobs and connect with suitable candidates.",
        },
        needToDownloadApp: {
          question: "Do I need to download an app?",
          answer:
            "No. Job seekers and employers do not need to download any app. AsliJobs works directly through WhatsApp, making it simple and easy to use.",
        },
        whichCities: {
          question: "Which cities does AsliJobs serve?",
          answer:
            "AsliJobs serves job seekers and employers across India. Job seekers can search and apply for jobs from anywhere, while employers can post jobs from any location. Job availability may vary depending on the city, area, locality, and current employer openings.",
        },
        jobCategories: {
          question: "Which job categories are available?",
          answer:
            "AsliJobs supports industries such as manufacturing, construction, logistics and transportation, warehousing, retail, hospitality, facility management, security services, automotive, healthcare support, and other blue-collar and grey-collar sectors.",
        },
      },
      jobSeekers: {
        title: "Job Seekers",
        freeForJobSeekers: {
          question: "Is AsliJobs free for job seekers?",
          answer: "Yes. AsliJobs is free for job seekers to search and apply for jobs.",
        },
        jobAlerts: {
          question: "How will job seekers receive job alerts?",
          answer:
            "Job seekers will receive job alerts on WhatsApp based on their location, job category, experience, and profile details.",
        },
        shouldPayForJob: {
          question: "Should job seekers pay money to get a job?",
          answer:
            "No. Job seekers should not pay money for job confirmation. If anyone asks for payment, report it to AsliJobs immediately.",
        },
        jobSearchStatusBadge: {
          question: "What is the job search status badge?",
          answer:
            "This badge indicates that you are actively looking for a job. You need to enable this badge on your AsliJobs profile to receive job alerts. If the badge is turned off, you will not receive job alerts.",
        },
      },
      employers: {
        title: "Employers",
        employerFreeOrPaid: {
          question: "Are employer services free or paid?",
          answer:
            "AsliJobs offers both free and paid services for employers. Employers can choose paid hiring plans, promoted jobs, or campaign promotions based on their hiring requirements.",
        },
        howEmployersPostJob: {
          question: "How do employers post a job?",
          answer:
            "Employers can post a job by sharing details like job title, location, salary, work timing, openings, experience required, and benefits.",
        },
        promotedJob: {
          question: "What is a promoted job?",
          answer:
            "A promoted job is a paid job post given extra visibility so more suitable job seekers can see and apply for it.",
        },
      },
      jobApplications: {
        title: "Job Applications",
        howJobSeekersApply: {
          question: "How do job seekers apply for a job?",
          answer:
            "Job seekers can apply directly through WhatsApp by replying to a job alert or selecting the Apply option. They can also apply through the AsliJobs website.",
        },
        howEmployersReceiveApplications: {
          question: "How will employers receive applications?",
          answer:
            "Employers can view applications through the employer dashboard or receive updates shared by the AsliJobs team.",
        },
        afterJobSeekerApplies: {
          question: "What happens after a job seeker applies?",
          answer:
            "After a job seeker applies, the application is shared with the employer. Further updates like shortlisting, interview details, or selection status will be shared through WhatsApp.",
        },
        howEmployersShortlist: {
          question: "How can employers shortlist candidates?",
          answer:
            "Employers can review candidate details and shortlist profiles that match their hiring requirements.",
        },
      },
      languages: {
        title: "Languages",
        supportedLanguages: {
          question: "Which languages does AsliJobs support?",
          answer: "AsliJobs supports English, Hindi, Telugu, Tamil, Kannada, and Malayalam.",
        },
        changeLanguage: {
          question: "Can users change their language preference?",
          answer:
            "Yes. Users can change their preferred language through the AsliJobs website, WhatsApp, or by contacting AsliJobs support.",
        },
      },
      safety: {
        title: "Safety",
        reportFakeJob: {
          question: "How can users report a fake job?",
          answer:
            "Users can report a fake or suspicious job by contacting AsliJobs support and sharing the job details, employer name, issue, and screenshots if available.",
        },
      },
      profileAccount: {
        title: "Profile & Account",
        updateProfile: {
          question: "How can users update their profile details?",
          answer:
            "Job seekers can update their profile details through their profile on the AsliJobs website, while employers can update their details through the employer dashboard. Users can also contact AsliJobs support through WhatsApp or the available support options.",
        },
        deactivateAccount: {
          question: "How can users deactivate their account?",
          answer:
            "Job seekers can deactivate their account through their profile settings on the AsliJobs website, while employers can deactivate their account through the employer dashboard. Users can also contact AsliJobs support for assistance with account deactivation.",
        },
      },
      support: {
        title: "Support",
        contactSupport: {
          question: "How can users contact AsliJobs support?",
          answer: "You can contact AsliJobs support through WhatsApp, phone, or email.",
        },
        moreHelp: {
          question: "Where can users get more help?",
          answer:
            "For detailed answers, users can visit the AsliJobs Help Center or contact AsliJobs support.",
        },
      },
    },
  },
};

const hi: MessageShape<typeof en> = {
  faqs: {
    breadcrumbAria: "ब्रेडक्रम्ब",
    pageTitle: "अक्सर पूछे जाने वाले प्रश्न",
    subtitle:
      "AsliJobs, नौकरी खोज, नियोक्ता भर्ती, WhatsApp अलर्ट, सुरक्षा और सहायता के बारे में आम सवालों के त्वरित जवाब पाएँ।",
    searchPlaceholder: "अक्सर पूछे जाने वाले प्रश्न खोजें...",
    emptyTitle: "कोई प्रश्न नहीं मिला",
    emptyDescription:
      "कोई दूसरा कीवर्ड आज़माएँ, या खोज साफ़ करने के बाद नीचे की श्रेणियाँ देखें।",
    clearSearch: "खोज साफ़ करें",
    helpTitle: "अभी भी सवाल हैं?",
    helpDescriptionLine1: "आपको जो जवाब चाहिए वह नहीं मिल रहा?",
    helpDescriptionLine2: "हमारी सहायता टीम मदद के लिए यहाँ है।",
    helpContact: "सपोर्ट से संपर्क करें",
    helpWhatsapp: "WhatsApp सहायता",
    categories: {
      general: {
        title: "सामान्य",
        whatIsAslijobs: {
          question: "AsliJobs क्या है?",
          answer:
            "AsliJobs एक WhatsApp-आधारित जॉब पोर्टल है जो भारत के ब्लू-कॉलर और ग्रे-कॉलर वर्कफ़ोर्स को उपयुक्त नौकरियाँ खोजने में मदद करता है और नियोक्ताओं को सही उम्मीदवार आसानी से रखने में मदद करता है।",
        },
        howDoesAslijobsWork: {
          question: "AsliJobs कैसे काम करता है?",
          answer:
            "AsliJobs WhatsApp के ज़रिए काम करता है। नौकरी खोजने वाले जॉब अलर्ट प्राप्त कर सकते हैं और नौकरियों के लिए आवेदन कर सकते हैं, जबकि नियोक्ता नौकरियाँ पोस्ट कर सकते हैं और उपयुक्त उम्मीदवारों से जुड़ सकते हैं।",
        },
        needToDownloadApp: {
          question: "क्या मुझे कोई ऐप डाउनलोड करना होगा?",
          answer:
            "नहीं। नौकरी खोजने वालों और नियोक्ताओं को कोई ऐप डाउनलोड करने की ज़रूरत नहीं है। AsliJobs सीधे WhatsApp के ज़रिए काम करता है, जिससे इसका उपयोग सरल और आसान है।",
        },
        whichCities: {
          question: "AsliJobs किन शहरों में सेवा देता है?",
          answer:
            "AsliJobs पूरे भारत में नौकरी खोजने वालों और नियोक्ताओं को सेवा देता है। नौकरी खोजने वाले कहीं से भी नौकरियाँ खोज और आवेदन कर सकते हैं, जबकि नियोक्ता किसी भी स्थान से नौकरियाँ पोस्ट कर सकते हैं। नौकरियों की उपलब्धता शहर, क्षेत्र, इलाके और वर्तमान नियोक्ता की रिक्तियों पर निर्भर कर सकती है।",
        },
        jobCategories: {
          question: "कौन-सी नौकरी श्रेणियाँ उपलब्ध हैं?",
          answer:
            "AsliJobs मैन्युफैक्चरिंग, निर्माण, लॉजिस्टिक्स और परिवहन, वेयरहाउसिंग, रिटेल, हॉस्पिटैलिटी, फैसिलिटी मैनेजमेंट, सिक्योरिटी सेवाएँ, ऑटोमोटिव, हेल्थकेयर सपोर्ट और अन्य ब्लू-कॉलर तथा ग्रे-कॉलर क्षेत्रों जैसे उद्योगों का समर्थन करता है।",
        },
      },
      jobSeekers: {
        title: "नौकरी खोजने वाले",
        freeForJobSeekers: {
          question: "क्या नौकरी खोजने वालों के लिए AsliJobs मुफ़्त है?",
          answer: "हाँ। नौकरी खोजने वालों के लिए नौकरियाँ खोजना और आवेदन करना AsliJobs पर मुफ़्त है।",
        },
        jobAlerts: {
          question: "नौकरी खोजने वालों को जॉब अलर्ट कैसे मिलेंगे?",
          answer:
            "नौकरी खोजने वालों को उनके स्थान, नौकरी श्रेणी, अनुभव और प्रोफ़ाइल विवरण के आधार पर WhatsApp पर जॉब अलर्ट मिलेंगे।",
        },
        shouldPayForJob: {
          question: "क्या नौकरी पाने के लिए नौकरी खोजने वालों को पैसे देने चाहिए?",
          answer:
            "नहीं। नौकरी की पुष्टि के लिए नौकरी खोजने वालों को पैसे नहीं देने चाहिए। अगर कोई भुगतान माँगता है, तो तुरंत AsliJobs को रिपोर्ट करें।",
        },
        jobSearchStatusBadge: {
          question: "जॉब सर्च स्टेटस बैज क्या है?",
          answer:
            "यह बैज दर्शाता है कि आप सक्रिय रूप से नौकरी खोज रहे हैं। जॉब अलर्ट प्राप्त करने के लिए आपको अपनी AsliJobs प्रोफ़ाइल पर यह बैज चालू करना होगा। अगर बैज बंद है, तो आपको जॉब अलर्ट नहीं मिलेंगे।",
        },
      },
      employers: {
        title: "नियोक्ता",
        employerFreeOrPaid: {
          question: "क्या नियोक्ता सेवाएँ मुफ़्त हैं या पेड?",
          answer:
            "AsliJobs नियोक्ताओं के लिए मुफ़्त और पेड दोनों सेवाएँ देता है। नियोक्ता अपनी भर्ती ज़रूरतों के अनुसार पेड हायरिंग प्लान, प्रमोटेड जॉब्स या कैंपेन प्रमोशन चुन सकते हैं।",
        },
        howEmployersPostJob: {
          question: "नियोक्ता नौकरी कैसे पोस्ट करते हैं?",
          answer:
            "नियोक्ता जॉब टाइटल, स्थान, वेतन, कार्य समय, रिक्तियाँ, आवश्यक अनुभव और लाभ जैसे विवरण साझा करके नौकरी पोस्ट कर सकते हैं।",
        },
        promotedJob: {
          question: "प्रमोटेड जॉब क्या है?",
          answer:
            "प्रमोटेड जॉब एक पेड जॉब पोस्ट है जिसे अतिरिक्त दृश्यता दी जाती है, ताकि अधिक उपयुक्त नौकरी खोजने वाले उसे देख सकें और आवेदन कर सकें।",
        },
      },
      jobApplications: {
        title: "नौकरी आवेदन",
        howJobSeekersApply: {
          question: "नौकरी खोजने वाले नौकरी के लिए आवेदन कैसे करते हैं?",
          answer:
            "नौकरी खोजने वाले जॉब अलर्ट का जवाब देकर या आवेदन करें विकल्प चुनकर सीधे WhatsApp के ज़रिए आवेदन कर सकते हैं। वे AsliJobs वेबसाइट के ज़रिए भी आवेदन कर सकते हैं।",
        },
        howEmployersReceiveApplications: {
          question: "नियोक्ताओं को आवेदन कैसे मिलेंगे?",
          answer:
            "नियोक्ता नियोक्ता डैशबोर्ड के ज़रिए आवेदन देख सकते हैं या AsliJobs टीम द्वारा साझा किए गए अपडेट प्राप्त कर सकते हैं।",
        },
        afterJobSeekerApplies: {
          question: "नौकरी खोजने वाले के आवेदन करने के बाद क्या होता है?",
          answer:
            "आवेदन के बाद आवेदन नियोक्ता के साथ साझा किया जाता है। शॉर्टलिस्टिंग, इंटरव्यू विवरण या चयन स्थिति जैसे आगे के अपडेट WhatsApp के ज़रिए साझा किए जाएँगे।",
        },
        howEmployersShortlist: {
          question: "नियोक्ता उम्मीदवारों को शॉर्टलिस्ट कैसे कर सकते हैं?",
          answer:
            "नियोक्ता उम्मीदवार के विवरण की समीक्षा कर सकते हैं और अपनी भर्ती ज़रूरतों से मेल खाने वाले प्रोफ़ाइल शॉर्टलिस्ट कर सकते हैं।",
        },
      },
      languages: {
        title: "भाषाएँ",
        supportedLanguages: {
          question: "AsliJobs किन भाषाओं का समर्थन करता है?",
          answer: "AsliJobs अंग्रेज़ी, हिंदी, तेलुगु, तमिल, कन्नड़ और मलयालम का समर्थन करता है।",
        },
        changeLanguage: {
          question: "क्या उपयोगकर्ता अपनी भाषा प्राथमिकता बदल सकते हैं?",
          answer:
            "हाँ। उपयोगकर्ता AsliJobs वेबसाइट, WhatsApp के ज़रिए या AsliJobs सपोर्ट से संपर्क करके अपनी पसंदीदा भाषा बदल सकते हैं।",
        },
      },
      safety: {
        title: "सुरक्षा",
        reportFakeJob: {
          question: "उपयोगकर्ता नकली नौकरी की रिपोर्ट कैसे कर सकते हैं?",
          answer:
            "उपयोगकर्ता AsliJobs सपोर्ट से संपर्क करके और नौकरी विवरण, नियोक्ता का नाम, समस्या और उपलब्ध होने पर स्क्रीनशॉट साझा करके नकली या संदिग्ध नौकरी की रिपोर्ट कर सकते हैं।",
        },
      },
      profileAccount: {
        title: "प्रोफ़ाइल और खाता",
        updateProfile: {
          question: "उपयोगकर्ता अपने प्रोफ़ाइल विवरण कैसे अपडेट कर सकते हैं?",
          answer:
            "नौकरी खोजने वाले AsliJobs वेबसाइट पर अपनी प्रोफ़ाइल के ज़रिए विवरण अपडेट कर सकते हैं, जबकि नियोक्ता नियोक्ता डैशबोर्ड के ज़रिए अपने विवरण अपडेट कर सकते हैं। उपयोगकर्ता WhatsApp या उपलब्ध सहायता विकल्पों के ज़रिए AsliJobs सपोर्ट से भी संपर्क कर सकते हैं।",
        },
        deactivateAccount: {
          question: "उपयोगकर्ता अपना खाता कैसे निष्क्रिय कर सकते हैं?",
          answer:
            "नौकरी खोजने वाले AsliJobs वेबसाइट पर अपनी प्रोफ़ाइल सेटिंग्स के ज़रिए खाता निष्क्रिय कर सकते हैं, जबकि नियोक्ता नियोक्ता डैशबोर्ड के ज़रिए खाता निष्क्रिय कर सकते हैं। खाता निष्क्रिय करने में सहायता के लिए उपयोगकर्ता AsliJobs सपोर्ट से भी संपर्क कर सकते हैं।",
        },
      },
      support: {
        title: "सहायता",
        contactSupport: {
          question: "उपयोगकर्ता AsliJobs सपोर्ट से कैसे संपर्क कर सकते हैं?",
          answer: "आप WhatsApp, फ़ोन या ईमेल के ज़रिए AsliJobs सपोर्ट से संपर्क कर सकते हैं।",
        },
        moreHelp: {
          question: "उपयोगकर्ताओं को और मदद कहाँ मिल सकती है?",
          answer:
            "विस्तृत जवाबों के लिए उपयोगकर्ता AsliJobs सहायता केंद्र देख सकते हैं या AsliJobs सपोर्ट से संपर्क कर सकते हैं।",
        },
      },
    },
  },
};

const te: MessageShape<typeof en> = {
  faqs: {
    breadcrumbAria: "బ్రెడ్‌క్రంబ్",
    pageTitle: "తరచుగా అడిగే ప్రశ్నలు",
    subtitle:
      "AsliJobs, ఉద్యోగ శోధన, యజమాని నియామకం, WhatsApp అలర్ట్‌లు, భద్రత మరియు మద్దతు గురించి సాధారణ ప్రశ్నలకు త్వరిత సమాధానాలు కనుగొనండి.",
    searchPlaceholder: "తరచుగా అడిగే ప్రశ్నలను శోధించండి...",
    emptyTitle: "ప్రశ్నలు కనుగొనబడలేదు",
    emptyDescription:
      "వేరే కీవర్డ్ ప్రయత్నించండి, లేదా శోధనను క్లియర్ చేసిన తర్వాత కింది వర్గాలను బ్రౌజ్ చేయండి.",
    clearSearch: "శోధనను క్లియర్ చేయండి",
    helpTitle: "ఇంకా ప్రశ్నలు ఉన్నాయా?",
    helpDescriptionLine1: "మీరు వెతుకుతున్న సమాధానం దొరకలేదా?",
    helpDescriptionLine2: "మా సపోర్ట్ టీమ్ సహాయం చేయడానికి ఇక్కడ ఉంది.",
    helpContact: "సపోర్ట్‌ను సంప్రదించండి",
    helpWhatsapp: "WhatsApp మద్దతు",
    categories: {
      general: {
        title: "సాధారణం",
        whatIsAslijobs: {
          question: "AsliJobs అంటే ఏమిటి?",
          answer:
            "AsliJobs అనేది WhatsApp-ఆధారిత ఉద్యోగ పోర్టల్. ఇది భారతదేశపు బ్లూ-కాలర్ మరియు గ్రే-కాలర్ కార్మికులకు సరైన ఉద్యోగాలు కనుగొనడంలో సహాయపడుతుంది మరియు యజమానులు సరైన అభ్యర్థులను సులభంగా నియమించుకోవడంలో సహాయపడుతుంది.",
        },
        howDoesAslijobsWork: {
          question: "AsliJobs ఎలా పనిచేస్తుంది?",
          answer:
            "AsliJobs WhatsApp ద్వారా పనిచేస్తుంది. ఉద్యోగార్థులు ఉద్యోగ అలర్ట్‌లు పొంది ఉద్యోగాలకు దరఖాస్తు చేయవచ్చు, అయితే యజమానులు ఉద్యోగాలు పోస్ట్ చేసి సరైన అభ్యర్థులతో కనెక్ట్ కావచ్చు.",
        },
        needToDownloadApp: {
          question: "నేను యాప్ డౌన్‌లోడ్ చేసుకోవాలా?",
          answer:
            "కాదు. ఉద్యోగార్థులు మరియు యజమానులు ఏ యాప్‌ను డౌన్‌లోడ్ చేసుకోవాల్సిన అవసరం లేదు. AsliJobs నేరుగా WhatsApp ద్వారా పనిచేస్తుంది, కాబట్టి ఇది సరళంగా మరియు సులభంగా ఉపయోగించవచ్చు.",
        },
        whichCities: {
          question: "AsliJobs ఏ నగరాల్లో సేవలు అందిస్తుంది?",
          answer:
            "AsliJobs భారతదేశం అంతటా ఉద్యోగార్థులు మరియు యజమానులకు సేవలు అందిస్తుంది. ఉద్యోగార్థులు ఎక్కడి నుంచైనా ఉద్యోగాలు వెతికి దరఖాస్తు చేయవచ్చు, అయితే యజమానులు ఏ ప్రాంతం నుంచైనా ఉద్యోగాలు పోస్ట్ చేయవచ్చు. ఉద్యోగ లభ్యత నగరం, ప్రాంతం, లోకాలిటీ మరియు ప్రస్తుత యజమాని ఓపెనింగ్‌లపై ఆధారపడి మారవచ్చు.",
        },
        jobCategories: {
          question: "ఏ ఉద్యోగ వర్గాలు అందుబాటులో ఉన్నాయి?",
          answer:
            "AsliJobs తయారీ, నిర్మాణం, లాజిస్టిక్స్ మరియు రవాణా, వేర్‌హౌసింగ్, రిటైల్, ఆతిథ్యం, ఫెసిలిటీ మేనేజ్‌మెంట్, సెక్యూరిటీ సేవలు, ఆటోమోటివ్, హెల్త్‌కేర్ సపోర్ట్ మరియు ఇతర బ్లూ-కాలర్ మరియు గ్రే-కాలర్ రంగాల వంటి పరిశ్రమలను సపోర్ట్ చేస్తుంది.",
        },
      },
      jobSeekers: {
        title: "ఉద్యోగార్థులు",
        freeForJobSeekers: {
          question: "ఉద్యోగార్థులకు AsliJobs ఉచితమా?",
          answer: "అవును. ఉద్యోగాలు వెతకడం మరియు దరఖాస్తు చేయడం ఉద్యోగార్థులకు AsliJobsలో ఉచితం.",
        },
        jobAlerts: {
          question: "ఉద్యోగార్థులు ఉద్యోగ అలర్ట్‌లు ఎలా అందుకుంటారు?",
          answer:
            "ఉద్యోగార్థులు వారి ప్రాంతం, ఉద్యోగ వర్గం, అనుభవం మరియు ప్రొఫైల్ వివరాల ఆధారంగా WhatsAppలో ఉద్యోగ అలర్ట్‌లు అందుకుంటారు.",
        },
        shouldPayForJob: {
          question: "ఉద్యోగం పొందడానికి ఉద్యోగార్థులు డబ్బు చెల్లించాలా?",
          answer:
            "కాదు. ఉద్యోగ నిర్ధారణ కోసం ఉద్యోగార్థులు డబ్బు చెల్లించకూడదు. ఎవరైనా చెల్లింపు కోరితే, వెంటనే AsliJobsకు నివేదించండి.",
        },
        jobSearchStatusBadge: {
          question: "ఉద్యోగ శోధన స్థితి బ్యాడ్జ్ అంటే ఏమిటి?",
          answer:
            "ఈ బ్యాడ్జ్ మీరు సక్రియంగా ఉద్యోగం వెతుకుతున్నారని సూచిస్తుంది. ఉద్యోగ అలర్ట్‌లు పొందడానికి మీ AsliJobs ప్రొఫైల్‌లో ఈ బ్యాడ్జ్‌ను ఆన్ చేయాలి. బ్యాడ్జ్ ఆఫ్‌లో ఉంటే, మీకు ఉద్యోగ అలర్ట్‌లు రావు.",
        },
      },
      employers: {
        title: "యజమానులు",
        employerFreeOrPaid: {
          question: "యజమాని సేవలు ఉచితమా లేక చెల్లింపుతో కూడినవా?",
          answer:
            "AsliJobs యజమానులకు ఉచిత మరియు చెల్లింపు సేవలు రెండింటినీ అందిస్తుంది. యజమానులు తమ నియామక అవసరాల ఆధారంగా చెల్లింపు హైరింగ్ ప్లాన్‌లు, ప్రమోటెడ్ ఉద్యోగాలు లేదా క్యాంపెయిన్ ప్రమోషన్‌లను ఎంచుకోవచ్చు.",
        },
        howEmployersPostJob: {
          question: "యజమానులు ఉద్యోగాన్ని ఎలా పోస్ట్ చేస్తారు?",
          answer:
            "యజమానులు ఉద్యోగ శీర్షిక, ప్రాంతం, జీతం, పని సమయం, ఓపెనింగ్‌లు, అవసరమైన అనుభవం మరియు ప్రయోజనాలు వంటి వివరాలు పంచుకుని ఉద్యోగాన్ని పోస్ట్ చేయవచ్చు.",
        },
        promotedJob: {
          question: "ప్రమోటెడ్ ఉద్యోగం అంటే ఏమిటి?",
          answer:
            "ప్రమోటెడ్ ఉద్యోగం అనేది అదనపు విజిబిలిటీ ఇవ్వబడిన చెల్లింపు ఉద్యోగ పోస్ట్, తద్వారా మరిన్ని సరైన ఉద్యోగార్థులు దాన్ని చూసి దరఖాస్తు చేయవచ్చు.",
        },
      },
      jobApplications: {
        title: "ఉద్యోగ దరఖాస్తులు",
        howJobSeekersApply: {
          question: "ఉద్యోగార్థులు ఉద్యోగానికి ఎలా దరఖాస్తు చేస్తారు?",
          answer:
            "ఉద్యోగార్థులు ఉద్యోగ అలర్ట్‌కు ప్రత్యుత్తరం ఇవ్వడం ద్వారా లేదా దరఖాస్తు ఎంపికను ఎంచుకోవడం ద్వారా నేరుగా WhatsApp ద్వారా దరఖాస్తు చేయవచ్చు. వారు AsliJobs వెబ్‌సైట్ ద్వారా కూడా దరఖాస్తు చేయవచ్చు.",
        },
        howEmployersReceiveApplications: {
          question: "యజమానులు దరఖాస్తులను ఎలా అందుకుంటారు?",
          answer:
            "యజమానులు యజమాని డాష్‌బోర్డ్ ద్వారా దరఖాస్తులను చూడవచ్చు లేదా AsliJobs టీమ్ పంచుకున్న అప్‌డేట్‌లను అందుకోవచ్చు.",
        },
        afterJobSeekerApplies: {
          question: "ఉద్యోగార్థి దరఖాస్తు చేసిన తర్వాత ఏమి జరుగుతుంది?",
          answer:
            "ఉద్యోగార్థి దరఖాస్తు చేసిన తర్వాత, దరఖాస్తు యజమానితో పంచుకోబడుతుంది. షార్ట్‌లిస్ట్, ఇంటర్వ్యూ వివరాలు లేదా ఎంపిక స్థితి వంటి తదుపరి అప్‌డేట్‌లు WhatsApp ద్వారా పంచుకోబడతాయి.",
        },
        howEmployersShortlist: {
          question: "యజమానులు అభ్యర్థులను ఎలా షార్ట్‌లిస్ట్ చేయవచ్చు?",
          answer:
            "యజమానులు అభ్యర్థి వివరాలను సమీక్షించి, తమ నియామక అవసరాలకు సరిపోయే ప్రొఫైల్‌లను షార్ట్‌లిస్ట్ చేయవచ్చు.",
        },
      },
      languages: {
        title: "భాషలు",
        supportedLanguages: {
          question: "AsliJobs ఏ భాషలను సపోర్ట్ చేస్తుంది?",
          answer: "AsliJobs ఇంగ్లీష్, హిందీ, తెలుగు, తమిళం, కన్నడ మరియు మలయాళం సపోర్ట్ చేస్తుంది.",
        },
        changeLanguage: {
          question: "వినియోగదారులు తమ భాషా ప్రాధాన్యతను మార్చుకోవచ్చా?",
          answer:
            "అవును. వినియోగదారులు AsliJobs వెబ్‌సైట్, WhatsApp ద్వారా లేదా AsliJobs సపోర్ట్‌ను సంప్రదించడం ద్వారా తమ ఇష్టపడే భాషను మార్చుకోవచ్చు.",
        },
      },
      safety: {
        title: "భద్రత",
        reportFakeJob: {
          question: "వినియోగదారులు నకిలీ ఉద్యోగాన్ని ఎలా నివేదించవచ్చు?",
          answer:
            "వినియోగదారులు AsliJobs సపోర్ట్‌ను సంప్రదించి ఉద్యోగ వివరాలు, యజమాని పేరు, సమస్య మరియు అందుబాటులో ఉంటే స్క్రీన్‌షాట్‌లు పంచుకుని నకిలీ లేదా అనుమానాస్పద ఉద్యోగాన్ని నివేదించవచ్చు.",
        },
      },
      profileAccount: {
        title: "ప్రొఫైల్ మరియు అకౌంట్",
        updateProfile: {
          question: "వినియోగదారులు తమ ప్రొఫైల్ వివరాలను ఎలా అప్‌డేట్ చేయవచ్చు?",
          answer:
            "ఉద్యోగార్థులు AsliJobs వెబ్‌సైట్‌లోని తమ ప్రొఫైల్ ద్వారా వివరాలను అప్‌డేట్ చేయవచ్చు, అయితే యజమానులు యజమాని డాష్‌బోర్డ్ ద్వారా తమ వివరాలను అప్‌డేట్ చేయవచ్చు. వినియోగదారులు WhatsApp లేదా అందుబాటులో ఉన్న సపోర్ట్ ఎంపికల ద్వారా కూడా AsliJobs సపోర్ట్‌ను సంప్రదించవచ్చు.",
        },
        deactivateAccount: {
          question: "వినియోగదారులు తమ అకౌంట్‌ను ఎలా డియాక్టివేట్ చేయవచ్చు?",
          answer:
            "ఉద్యోగార్థులు AsliJobs వెబ్‌సైట్‌లోని తమ ప్రొఫైల్ సెట్టింగ్‌ల ద్వారా అకౌంట్‌ను డియాక్టివేట్ చేయవచ్చు, అయితే యజమానులు యజమాని డాష్‌బోర్డ్ ద్వారా అకౌంట్‌ను డియాక్టివేట్ చేయవచ్చు. అకౌంట్ డియాక్టివేషన్‌లో సహాయం కోసం వినియోగదారులు AsliJobs సపోర్ట్‌ను కూడా సంప్రదించవచ్చు.",
        },
      },
      support: {
        title: "మద్దతు",
        contactSupport: {
          question: "వినియోగదారులు AsliJobs సపోర్ట్‌ను ఎలా సంప్రదించవచ్చు?",
          answer: "మీరు WhatsApp, ఫోన్ లేదా ఇమెయిల్ ద్వారా AsliJobs సపోర్ట్‌ను సంప్రదించవచ్చు.",
        },
        moreHelp: {
          question: "వినియోగదారులు మరింత సహాయం ఎక్కడ పొందవచ్చు?",
          answer:
            "వివరమైన సమాధానాల కోసం, వినియోగదారులు AsliJobs సహాయ కేంద్రాన్ని సందర్శించవచ్చు లేదా AsliJobs సపోర్ట్‌ను సంప్రదించవచ్చు.",
        },
      },
    },
  },
};

const ta: MessageShape<typeof en> = {
  faqs: {
    breadcrumbAria: "உலாவல் பாதை",
    pageTitle: "அடிக்கடி கேட்கப்படும் கேள்விகள்",
    subtitle:
      "AsliJobs, வேலை தேடல், முதலாளி பணியமர்த்தல், WhatsApp அறிவிப்புகள், பாதுகாப்பு மற்றும் ஆதரவு பற்றிய பொதுவான கேள்விகளுக்கு விரைவான பதில்களைக் கண்டறியுங்கள்.",
    searchPlaceholder: "அடிக்கடி கேட்கப்படும் கேள்விகளைத் தேடுங்கள்...",
    emptyTitle: "கேள்விகள் எதுவும் கிடைக்கவில்லை",
    emptyDescription:
      "வேறு ஒரு முக்கியச் சொல்லை முயற்சிக்கவும், அல்லது தேடலை அழித்த பிறகு கீழே உள்ள பிரிவுகளைப் பாருங்கள்.",
    clearSearch: "தேடலை அழிக்கவும்",
    helpTitle: "இன்னும் கேள்விகள் உள்ளதா?",
    helpDescriptionLine1: "நீங்கள் தேடும் பதில் கிடைக்கவில்லையா?",
    helpDescriptionLine2: "எங்கள் ஆதரவு குழு உதவ இங்கே உள்ளது.",
    helpContact: "ஆதரவைத் தொடர்பு கொள்ளுங்கள்",
    helpWhatsapp: "WhatsApp ஆதரவு",
    categories: {
      general: {
        title: "பொதுவானவை",
        whatIsAslijobs: {
          question: "AsliJobs என்றால் என்ன?",
          answer:
            "AsliJobs என்பது WhatsApp அடிப்படையிலான வேலை தளம். இது இந்தியாவின் ப்ளூ-காலர் மற்றும் கிரே-காலர் பணியாளர்களுக்கு ஏற்ற வேலைகளைக் கண்டறிய உதவுகிறது, மேலும் முதலாளிகள் சரியான விண்ணப்பதாரர்களை எளிதாக பணியமர்த்த உதவுகிறது.",
        },
        howDoesAslijobsWork: {
          question: "AsliJobs எப்படி செயல்படுகிறது?",
          answer:
            "AsliJobs WhatsApp மூலம் செயல்படுகிறது. வேலை தேடுபவர்கள் வேலை அறிவிப்புகளைப் பெற்று வேலைகளுக்கு விண்ணப்பிக்கலாம், முதலாளிகள் வேலைகளைப் பதிவிட்டு ஏற்ற விண்ணப்பதாரர்களுடன் இணைக்கலாம்.",
        },
        needToDownloadApp: {
          question: "நான் ஒரு செயலியை பதிவிறக்க வேண்டுமா?",
          answer:
            "இல்லை. வேலை தேடுபவர்களும் முதலாளிகளும் எந்தச் செயலியையும் பதிவிறக்கத் தேவையில்லை. AsliJobs நேரடியாக WhatsApp மூலம் செயல்படுவதால் இது எளிமையாகவும் பயன்படுத்த எளிதாகவும் உள்ளது.",
        },
        whichCities: {
          question: "AsliJobs எந்த நகரங்களுக்கு சேவை செய்கிறது?",
          answer:
            "AsliJobs இந்தியா முழுவதும் வேலை தேடுபவர்களுக்கும் முதலாளிகளுக்கும் சேவை செய்கிறது. வேலை தேடுபவர்கள் எங்கிருந்தும் வேலைகளைத் தேடி விண்ணப்பிக்கலாம், முதலாளிகள் எந்த இடத்திலிருந்தும் வேலைகளைப் பதிவிடலாம். வேலை கிடைப்பது நகரம், பகுதி, உள்ளூர் மற்றும் தற்போதைய முதலாளி திறப்புகளின் அடிப்படையில் மாறலாம்.",
        },
        jobCategories: {
          question: "எந்த வேலை வகைகள் கிடைக்கின்றன?",
          answer:
            "AsliJobs உற்பத்தி, கட்டுமானம், தளவாடங்கள் மற்றும் போக்குவரத்து, கிடங்கு, சில்லறை, விருந்தோம்பல், வசதி மேலாண்மை, பாதுகாப்பு சேவைகள், வாகனத்துறை, சுகாதார ஆதரவு மற்றும் பிற ப்ளூ-காலர் மற்றும் கிரே-காலர் துறைகளை ஆதரிக்கிறது.",
        },
      },
      jobSeekers: {
        title: "வேலை தேடுபவர்கள்",
        freeForJobSeekers: {
          question: "வேலை தேடுபவர்களுக்கு AsliJobs இலவசமா?",
          answer: "ஆம். வேலைகளைத் தேடி விண்ணப்பிக்க வேலை தேடுபவர்களுக்கு AsliJobs இலவசம்.",
        },
        jobAlerts: {
          question: "வேலை தேடுபவர்கள் வேலை அறிவிப்புகளை எப்படிப் பெறுவார்கள்?",
          answer:
            "வேலை தேடுபவர்கள் தங்கள் இடம், வேலை வகை, அனுபவம் மற்றும் சுயவிவர விவரங்களின் அடிப்படையில் WhatsApp-ல் வேலை அறிவிப்புகளைப் பெறுவார்கள்.",
        },
        shouldPayForJob: {
          question: "வேலை பெற வேலை தேடுபவர்கள் பணம் செலுத்த வேண்டுமா?",
          answer:
            "இல்லை. வேலை உறுதிப்படுத்தலுக்கு வேலை தேடுபவர்கள் பணம் செலுத்தக்கூடாது. யாராவது பணம் கேட்டால், உடனடியாக AsliJobs-க்கு புகாரளிக்கவும்.",
        },
        jobSearchStatusBadge: {
          question: "வேலை தேடல் நிலை பேட்ஜ் என்றால் என்ன?",
          answer:
            "இந்தப் பேட்ஜ் நீங்கள் தீவிரமாக வேலை தேடுகிறீர்கள் என்பதைக் காட்டுகிறது. வேலை அறிவிப்புகளைப் பெற உங்கள் AsliJobs சுயவிவரத்தில் இந்தப் பேட்ஜை இயக்க வேண்டும். பேட்ஜ் அணைக்கப்பட்டிருந்தால், உங்களுக்கு வேலை அறிவிப்புகள் வராது.",
        },
      },
      employers: {
        title: "முதலாளிகள்",
        employerFreeOrPaid: {
          question: "முதலாளி சேவைகள் இலவசமா அல்லது கட்டணமா?",
          answer:
            "AsliJobs முதலாளிகளுக்கு இலவச மற்றும் கட்டண சேவைகள் இரண்டையும் வழங்குகிறது. முதலாளிகள் தங்கள் பணியமர்த்தல் தேவைகளின் அடிப்படையில் கட்டண பணியமர்த்தல் திட்டங்கள், விளம்பரப்படுத்தப்பட்ட வேலைகள் அல்லது பிரச்சார விளம்பரங்களைத் தேர்வு செய்யலாம்.",
        },
        howEmployersPostJob: {
          question: "முதலாளிகள் வேலையை எப்படிப் பதிவிடுகிறார்கள்?",
          answer:
            "முதலாளிகள் வேலைத் தலைப்பு, இடம், சம்பளம், பணி நேரம், காலிப் பணியிடங்கள், தேவையான அனுபவம் மற்றும் பலன்கள் போன்ற விவரங்களைப் பகிர்ந்து வேலையைப் பதிவிடலாம்.",
        },
        promotedJob: {
          question: "விளம்பரப்படுத்தப்பட்ட வேலை என்றால் என்ன?",
          answer:
            "விளம்பரப்படுத்தப்பட்ட வேலை என்பது கூடுதல் தெரிவுநிலை கொடுக்கப்பட்ட கட்டண வேலைப் பதிவு. இதனால் அதிக ஏற்ற வேலை தேடுபவர்கள் அதைப் பார்த்து விண்ணப்பிக்க முடியும்.",
        },
      },
      jobApplications: {
        title: "வேலை விண்ணப்பங்கள்",
        howJobSeekersApply: {
          question: "வேலை தேடுபவர்கள் வேலைக்கு எப்படி விண்ணப்பிக்கிறார்கள்?",
          answer:
            "வேலை தேடுபவர்கள் வேலை அறிவிப்புக்கு பதிலளிப்பதன் மூலம் அல்லது விண்ணப்பிக்கவும் விருப்பத்தைத் தேர்ந்தெடுப்பதன் மூலம் நேரடியாக WhatsApp வழியாக விண்ணப்பிக்கலாம். அவர்கள் AsliJobs இணையதளம் மூலமும் விண்ணப்பிக்கலாம்.",
        },
        howEmployersReceiveApplications: {
          question: "முதலாளிகள் விண்ணப்பங்களை எப்படிப் பெறுவார்கள்?",
          answer:
            "முதலாளிகள் முதலாளி டாஷ்போர்டு மூலம் விண்ணப்பங்களைப் பார்க்கலாம் அல்லது AsliJobs குழு பகிரும் புதுப்பிப்புகளைப் பெறலாம்.",
        },
        afterJobSeekerApplies: {
          question: "வேலை தேடுபவர் விண்ணப்பித்த பிறகு என்ன நடக்கும்?",
          answer:
            "வேலை தேடுபவர் விண்ணப்பித்த பிறகு, விண்ணப்பம் முதலாளியுடன் பகிரப்படும். தேர்வுப் பட்டியல், நேர்காணல் விவரங்கள் அல்லது தேர்வு நிலை போன்ற மேலும் புதுப்பிப்புகள் WhatsApp மூலம் பகிரப்படும்.",
        },
        howEmployersShortlist: {
          question: "முதலாளிகள் விண்ணப்பதாரர்களை எப்படி தேர்வுப் பட்டியலிடலாம்?",
          answer:
            "முதலாளிகள் விண்ணப்பதாரர் விவரங்களை மதிப்பாய்வு செய்து, தங்கள் பணியமர்த்தல் தேவைகளுக்குப் பொருந்தும் சுயவிவரங்களைத் தேர்வுப் பட்டியலிடலாம்.",
        },
      },
      languages: {
        title: "மொழிகள்",
        supportedLanguages: {
          question: "AsliJobs எந்த மொழிகளை ஆதரிக்கிறது?",
          answer: "AsliJobs ஆங்கிலம், இந்தி, தெலுங்கு, தமிழ், கன்னடம் மற்றும் மலையாளத்தை ஆதரிக்கிறது.",
        },
        changeLanguage: {
          question: "பயனர்கள் தங்கள் மொழி விருப்பத்தை மாற்ற முடியுமா?",
          answer:
            "ஆம். பயனர்கள் AsliJobs இணையதளம், WhatsApp மூலம் அல்லது AsliJobs ஆதரவைத் தொடர்பு கொள்வதன் மூலம் தங்கள் விருப்ப மொழியை மாற்றலாம்.",
        },
      },
      safety: {
        title: "பாதுகாப்பு",
        reportFakeJob: {
          question: "பயனர்கள் போலி வேலையை எப்படி புகாரளிக்கலாம்?",
          answer:
            "பயனர்கள் AsliJobs ஆதரவைத் தொடர்பு கொண்டு வேலை விவரங்கள், முதலாளி பெயர், சிக்கல் மற்றும் கிடைத்தால் திரைப்பிடிப்புகளைப் பகிர்ந்து போலி அல்லது சந்தேகத்திற்குரிய வேலையைப் புகாரளிக்கலாம்.",
        },
      },
      profileAccount: {
        title: "சுயவிவரம் மற்றும் கணக்கு",
        updateProfile: {
          question: "பயனர்கள் தங்கள் சுயவிவர விவரங்களை எப்படிப் புதுப்பிக்கலாம்?",
          answer:
            "வேலை தேடுபவர்கள் AsliJobs இணையதளத்தில் தங்கள் சுயவிவரம் மூலம் விவரங்களைப் புதுப்பிக்கலாம், முதலாளிகள் முதலாளி டாஷ்போர்டு மூலம் தங்கள் விவரங்களைப் புதுப்பிக்கலாம். பயனர்கள் WhatsApp அல்லது கிடைக்கும் ஆதரவு விருப்பங்கள் மூலமும் AsliJobs ஆதரவைத் தொடர்பு கொள்ளலாம்.",
        },
        deactivateAccount: {
          question: "பயனர்கள் தங்கள் கணக்கை எப்படி செயலிழக்கச் செய்யலாம்?",
          answer:
            "வேலை தேடுபவர்கள் AsliJobs இணையதளத்தில் தங்கள் சுயவிவர அமைப்புகள் மூலம் கணக்கைச் செயலிழக்கச் செய்யலாம், முதலாளிகள் முதலாளி டாஷ்போர்டு மூலம் கணக்கைச் செயலிழக்கச் செய்யலாம். கணக்கு செயலிழப்பில் உதவிக்கு பயனர்கள் AsliJobs ஆதரவையும் தொடர்பு கொள்ளலாம்.",
        },
      },
      support: {
        title: "ஆதரவு",
        contactSupport: {
          question: "பயனர்கள் AsliJobs ஆதரவை எப்படித் தொடர்பு கொள்ளலாம்?",
          answer: "நீங்கள் WhatsApp, தொலைபேசி அல்லது மின்னஞ்சல் மூலம் AsliJobs ஆதரவைத் தொடர்பு கொள்ளலாம்.",
        },
        moreHelp: {
          question: "பயனர்கள் மேலும் உதவியை எங்கே பெறலாம்?",
          answer:
            "விரிவான பதில்களுக்கு, பயனர்கள் AsliJobs உதவி மையத்தைப் பார்வையிடலாம் அல்லது AsliJobs ஆதரவைத் தொடர்பு கொள்ளலாம்.",
        },
      },
    },
  },
};

const kn: MessageShape<typeof en> = {
  faqs: {
    breadcrumbAria: "ಬ್ರೆಡ್‌ಕ್ರಂಬ್",
    pageTitle: "ಪದೇ ಪದೇ ಕೇಳುವ ಪ್ರಶ್ನೆಗಳು",
    subtitle:
      "AsliJobs, ಉದ್ಯೋಗ ಹುಡುಕಾಟ, ಉದ್ಯೋಗದಾತ ನೇಮಕಾತಿ, WhatsApp ಅಲರ್ಟ್‌ಗಳು, ಭದ್ರತೆ ಮತ್ತು ಬೆಂಬಲದ ಬಗ್ಗೆ ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳಿಗೆ ತ್ವರಿತ ಉತ್ತರಗಳನ್ನು ಹುಡುಕಿ.",
    searchPlaceholder: "ಪದೇ ಪದೇ ಕೇಳುವ ಪ್ರಶ್ನೆಗಳನ್ನು ಹುಡುಕಿ...",
    emptyTitle: "ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
    emptyDescription:
      "ಬೇರೆ ಕೀವರ್ಡ್ ಪ್ರಯತ್ನಿಸಿ, ಅಥವಾ ಹುಡುಕಾಟವನ್ನು ತೆರವುಗೊಳಿಸಿದ ನಂತರ ಕೆಳಗಿನ ವರ್ಗಗಳನ್ನು ನೋಡಿ.",
    clearSearch: "ಹುಡುಕಾಟವನ್ನು ತೆರವುಗೊಳಿಸಿ",
    helpTitle: "ಇನ್ನೂ ಪ್ರಶ್ನೆಗಳಿವೆಯೇ?",
    helpDescriptionLine1: "ನೀವು ಹುಡುಕುತ್ತಿರುವ ಉತ್ತರ ಸಿಗುತ್ತಿಲ್ಲವೇ?",
    helpDescriptionLine2: "ನಮ್ಮ ಬೆಂಬಲ ತಂಡ ಸಹಾಯಕ್ಕಾಗಿ ಇಲ್ಲಿದೆ.",
    helpContact: "ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ",
    helpWhatsapp: "WhatsApp ಬೆಂಬಲ",
    categories: {
      general: {
        title: "ಸಾಮಾನ್ಯ",
        whatIsAslijobs: {
          question: "AsliJobs ಎಂದರೇನು?",
          answer:
            "AsliJobs ಒಂದು WhatsApp-ಆಧಾರಿತ ಉದ್ಯೋಗ ಪೋರ್ಟಲ್. ಇದು ಭಾರತದ ಬ್ಲೂ-ಕಾಲರ್ ಮತ್ತು ಗ್ರೇ-ಕಾಲರ್ ಕಾರ್ಮಿಕರಿಗೆ ಸೂಕ್ತ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ ಮತ್ತು ಉದ್ಯೋಗದಾತರು ಸರಿಯಾದ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ಸುಲಭವಾಗಿ ನೇಮಕ ಮಾಡಿಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
        },
        howDoesAslijobsWork: {
          question: "AsliJobs ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?",
          answer:
            "AsliJobs WhatsApp ಮೂಲಕ ಕೆಲಸ ಮಾಡುತ್ತದೆ. ಉದ್ಯೋಗಾರ್ಥಿಗಳು ಉದ್ಯೋಗ ಅಲರ್ಟ್‌ಗಳನ್ನು ಪಡೆದು ಉದ್ಯೋಗಗಳಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು, ಉದ್ಯೋಗದಾತರು ಉದ್ಯೋಗಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ ಸೂಕ್ತ ಅಭ್ಯರ್ಥಿಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಬಹುದು.",
        },
        needToDownloadApp: {
          question: "ನಾನು ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಬೇಕೇ?",
          answer:
            "ಇಲ್ಲ. ಉದ್ಯೋಗಾರ್ಥಿಗಳು ಮತ್ತು ಉದ್ಯೋಗದಾತರು ಯಾವುದೇ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡುವ ಅಗತ್ಯವಿಲ್ಲ. AsliJobs ನೇರವಾಗಿ WhatsApp ಮೂಲಕ ಕೆಲಸ ಮಾಡುವುದರಿಂದ ಇದು ಸರಳ ಮತ್ತು ಬಳಸಲು ಸುಲಭ.",
        },
        whichCities: {
          question: "AsliJobs ಯಾವ ನಗರಗಳಿಗೆ ಸೇವೆ ನೀಡುತ್ತದೆ?",
          answer:
            "AsliJobs ಭಾರತದಾದ್ಯಂತ ಉದ್ಯೋಗಾರ್ಥಿಗಳು ಮತ್ತು ಉದ್ಯೋಗದಾತರಿಗೆ ಸೇವೆ ನೀಡುತ್ತದೆ. ಉದ್ಯೋಗಾರ್ಥಿಗಳು ಎಲ್ಲಿಂದಲಾದರೂ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು, ಉದ್ಯೋಗದಾತರು ಯಾವುದೇ ಸ್ಥಳದಿಂದ ಉದ್ಯೋಗಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಬಹುದು. ಉದ್ಯೋಗ ಲಭ್ಯತೆ ನಗರ, ಪ್ರದೇಶ, ಸ್ಥಳೀಯತೆ ಮತ್ತು ಪ್ರಸ್ತುತ ಉದ್ಯೋಗದಾತರ ತೆರೆದ ಹುದ್ದೆಗಳನ್ನು ಅವಲಂಬಿಸಿ ಬದಲಾಗಬಹುದು.",
        },
        jobCategories: {
          question: "ಯಾವ ಉದ್ಯೋಗ ವರ್ಗಗಳು ಲಭ್ಯವಿವೆ?",
          answer:
            "AsliJobs ಉತ್ಪಾದನೆ, ನಿರ್ಮಾಣ, ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಮತ್ತು ಸಾರಿಗೆ, ಗೋದಾಮು, ಚಿಲ್ಲರೆ, ಆತಿಥ್ಯ, ಸೌಲಭ್ಯ ನಿರ್ವಹಣೆ, ಭದ್ರತಾ ಸೇವೆಗಳು, ಆಟೋಮೋಟಿವ್, ಆರೋಗ್ಯ ಸಹಾಯ ಮತ್ತು ಇತರ ಬ್ಲೂ-ಕಾಲರ್ ಹಾಗೂ ಗ್ರೇ-ಕಾಲರ್ ಕ್ಷೇತ್ರಗಳನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ.",
        },
      },
      jobSeekers: {
        title: "ಉದ್ಯೋಗಾರ್ಥಿಗಳು",
        freeForJobSeekers: {
          question: "ಉದ್ಯೋಗಾರ್ಥಿಗಳಿಗೆ AsliJobs ಉಚಿತವೇ?",
          answer: "ಹೌದು. ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಲು ಮತ್ತು ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಉದ್ಯೋಗಾರ್ಥಿಗಳಿಗೆ AsliJobs ಉಚಿತ.",
        },
        jobAlerts: {
          question: "ಉದ್ಯೋಗಾರ್ಥಿಗಳು ಉದ್ಯೋಗ ಅಲರ್ಟ್‌ಗಳನ್ನು ಹೇಗೆ ಪಡೆಯುತ್ತಾರೆ?",
          answer:
            "ಉದ್ಯೋಗಾರ್ಥಿಗಳು ತಮ್ಮ ಸ್ಥಳ, ಉದ್ಯೋಗ ವರ್ಗ, ಅನುಭವ ಮತ್ತು ಪ್ರೊಫೈಲ್ ವಿವರಗಳ ಆಧಾರದಲ್ಲಿ WhatsApp ನಲ್ಲಿ ಉದ್ಯೋಗ ಅಲರ್ಟ್‌ಗಳನ್ನು ಪಡೆಯುತ್ತಾರೆ.",
        },
        shouldPayForJob: {
          question: "ಉದ್ಯೋಗ ಪಡೆಯಲು ಉದ್ಯೋಗಾರ್ಥಿಗಳು ಹಣ ಪಾವತಿಸಬೇಕೇ?",
          answer:
            "ಇಲ್ಲ. ಉದ್ಯೋಗ ದೃಢೀಕರಣಕ್ಕಾಗಿ ಉದ್ಯೋಗಾರ್ಥಿಗಳು ಹಣ ಪಾವತಿಸಬಾರದು. ಯಾರಾದರೂ ಪಾವತಿ ಕೇಳಿದರೆ, ತಕ್ಷಣ AsliJobs ಗೆ ವರದಿ ಮಾಡಿ.",
        },
        jobSearchStatusBadge: {
          question: "ಉದ್ಯೋಗ ಹುಡುಕಾಟ ಸ್ಥಿತಿ ಬ್ಯಾಡ್ಜ್ ಎಂದರೇನು?",
          answer:
            "ಈ ಬ್ಯಾಡ್ಜ್ ನೀವು ಸಕ್ರಿಯವಾಗಿ ಉದ್ಯೋಗ ಹುಡುಕುತ್ತಿದ್ದೀರಿ ಎಂದು ಸೂಚಿಸುತ್ತದೆ. ಉದ್ಯೋಗ ಅಲರ್ಟ್‌ಗಳನ್ನು ಪಡೆಯಲು ನಿಮ್ಮ AsliJobs ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಈ ಬ್ಯಾಡ್ಜ್ ಅನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಬೇಕು. ಬ್ಯಾಡ್ಜ್ ಆಫ್ ಆಗಿದ್ದರೆ, ನಿಮಗೆ ಉದ್ಯೋಗ ಅಲರ್ಟ್‌ಗಳು ಬರುವುದಿಲ್ಲ.",
        },
      },
      employers: {
        title: "ಉದ್ಯೋಗದಾತರು",
        employerFreeOrPaid: {
          question: "ಉದ್ಯೋಗದಾತ ಸೇವೆಗಳು ಉಚಿತವೇ ಅಥವಾ ಶುಲ್ಕದವೇ?",
          answer:
            "AsliJobs ಉದ್ಯೋಗದಾತರಿಗೆ ಉಚಿತ ಮತ್ತು ಶುಲ್ಕದ ಸೇವೆಗಳೆರಡನ್ನೂ ನೀಡುತ್ತದೆ. ಉದ್ಯೋಗದಾತರು ತಮ್ಮ ನೇಮಕಾತಿ ಅಗತ್ಯಗಳ ಆಧಾರದಲ್ಲಿ ಶುಲ್ಕದ ನೇಮಕಾತಿ ಯೋಜನೆಗಳು, ಪ್ರಚಾರಿತ ಉದ್ಯೋಗಗಳು ಅಥವಾ ಅಭಿಯಾನ ಪ್ರಚಾರಗಳನ್ನು ಆಯ್ಕೆಮಾಡಬಹುದು.",
        },
        howEmployersPostJob: {
          question: "ಉದ್ಯೋಗದಾತರು ಉದ್ಯೋಗವನ್ನು ಹೇಗೆ ಪೋಸ್ಟ್ ಮಾಡುತ್ತಾರೆ?",
          answer:
            "ಉದ್ಯೋಗದಾತರು ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ, ಸ್ಥಳ, ವೇತನ, ಕೆಲಸದ ಸಮಯ, ತೆರೆದ ಹುದ್ದೆಗಳು, ಅಗತ್ಯ ಅನುಭವ ಮತ್ತು ಪ್ರಯೋಜನಗಳಂತಹ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಂಡು ಉದ್ಯೋಗವನ್ನು ಪೋಸ್ಟ್ ಮಾಡಬಹುದು.",
        },
        promotedJob: {
          question: "ಪ್ರಚಾರಿತ ಉದ್ಯೋಗ ಎಂದರೇನು?",
          answer:
            "ಪ್ರಚಾರಿತ ಉದ್ಯೋಗವು ಹೆಚ್ಚುವರಿ ಗೋಚರತೆ ನೀಡಲಾದ ಶುಲ್ಕದ ಉದ್ಯೋಗ ಪೋಸ್ಟ್, ಇದರಿಂದ ಹೆಚ್ಚು ಸೂಕ್ತ ಉದ್ಯೋಗಾರ್ಥಿಗಳು ಅದನ್ನು ನೋಡಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು.",
        },
      },
      jobApplications: {
        title: "ಉದ್ಯೋಗ ಅರ್ಜಿಗಳು",
        howJobSeekersApply: {
          question: "ಉದ್ಯೋಗಾರ್ಥಿಗಳು ಉದ್ಯೋಗಕ್ಕೆ ಹೇಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುತ್ತಾರೆ?",
          answer:
            "ಉದ್ಯೋಗಾರ್ಥಿಗಳು ಉದ್ಯೋಗ ಅಲರ್ಟ್‌ಗೆ ಪ್ರತ್ಯುತ್ತರಿಸುವ ಮೂಲಕ ಅಥವಾ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ಆಯ್ಕೆಯನ್ನು ಆರಿಸುವ ಮೂಲಕ ನೇರವಾಗಿ WhatsApp ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು. ಅವರು AsliJobs ವೆಬ್‌ಸೈಟ್ ಮೂಲಕವೂ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು.",
        },
        howEmployersReceiveApplications: {
          question: "ಉದ್ಯೋಗದಾತರು ಅರ್ಜಿಗಳನ್ನು ಹೇಗೆ ಸ್ವೀಕರಿಸುತ್ತಾರೆ?",
          answer:
            "ಉದ್ಯೋಗದಾತರು ಉದ್ಯೋಗದಾತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮೂಲಕ ಅರ್ಜಿಗಳನ್ನು ನೋಡಬಹುದು ಅಥವಾ AsliJobs ತಂಡ ಹಂಚಿಕೊಂಡ ನವೀಕರಣಗಳನ್ನು ಸ್ವೀಕರಿಸಬಹುದು.",
        },
        afterJobSeekerApplies: {
          question: "ಉದ್ಯೋಗಾರ್ಥಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ ನಂತರ ಏನಾಗುತ್ತದೆ?",
          answer:
            "ಉದ್ಯೋಗಾರ್ಥಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ ನಂತರ, ಅರ್ಜಿಯನ್ನು ಉದ್ಯೋಗದಾತರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಲಾಗುತ್ತದೆ. ಶಾರ್ಟ್‌ಲಿಸ್ಟ್, ಸಂದರ್ಶನ ವಿವರಗಳು ಅಥವಾ ಆಯ್ಕೆ ಸ್ಥಿತಿಯಂತಹ ಮುಂದಿನ ನವೀಕರಣಗಳನ್ನು WhatsApp ಮೂಲಕ ಹಂಚಿಕೊಳ್ಳಲಾಗುತ್ತದೆ.",
        },
        howEmployersShortlist: {
          question: "ಉದ್ಯೋಗದಾತರು ಅಭ್ಯರ್ಥಿಗಳನ್ನು ಹೇಗೆ ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಮಾಡಬಹುದು?",
          answer:
            "ಉದ್ಯೋಗದಾತರು ಅಭ್ಯರ್ಥಿ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ತಮ್ಮ ನೇಮಕಾತಿ ಅಗತ್ಯಗಳಿಗೆ ಹೊಂದುವ ಪ್ರೊಫೈಲ್‌ಗಳನ್ನು ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಮಾಡಬಹುದು.",
        },
      },
      languages: {
        title: "ಭಾಷೆಗಳು",
        supportedLanguages: {
          question: "AsliJobs ಯಾವ ಭಾಷೆಗಳನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ?",
          answer: "AsliJobs ಇಂಗ್ಲಿಷ್, ಹಿಂದಿ, ತೆಲುಗು, ತಮಿಳು, ಕನ್ನಡ ಮತ್ತು ಮಲಯಾಳಂ ಅನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ.",
        },
        changeLanguage: {
          question: "ಬಳಕೆದಾರರು ತಮ್ಮ ಭಾಷಾ ಆದ್ಯತೆಯನ್ನು ಬದಲಾಯಿಸಬಹುದೇ?",
          answer:
            "ಹೌದು. ಬಳಕೆದಾರರು AsliJobs ವೆಬ್‌ಸೈಟ್, WhatsApp ಮೂಲಕ ಅಥವಾ AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸುವ ಮೂಲಕ ತಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಬಹುದು.",
        },
      },
      safety: {
        title: "ಭದ್ರತೆ",
        reportFakeJob: {
          question: "ಬಳಕೆದಾರರು ನಕಲಿ ಉದ್ಯೋಗವನ್ನು ಹೇಗೆ ವರದಿ ಮಾಡಬಹುದು?",
          answer:
            "ಬಳಕೆದಾರರು AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ ಉದ್ಯೋಗ ವಿವರಗಳು, ಉದ್ಯೋಗದಾತರ ಹೆಸರು, ಸಮಸ್ಯೆ ಮತ್ತು ಲಭ್ಯವಿದ್ದರೆ ಸ್ಕ್ರೀನ್‌ಶಾಟ್‌ಗಳನ್ನು ಹಂಚಿಕೊಂಡು ನಕಲಿ ಅಥವಾ ಅನುಮಾನಾಸ್ಪದ ಉದ್ಯೋಗವನ್ನು ವರದಿ ಮಾಡಬಹುದು.",
        },
      },
      profileAccount: {
        title: "ಪ್ರೊಫೈಲ್ ಮತ್ತು ಖಾತೆ",
        updateProfile: {
          question: "ಬಳಕೆದಾರರು ತಮ್ಮ ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ಹೇಗೆ ನವೀಕರಿಸಬಹುದು?",
          answer:
            "ಉದ್ಯೋಗಾರ್ಥಿಗಳು AsliJobs ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ತಮ್ಮ ಪ್ರೊಫೈಲ್ ಮೂಲಕ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಬಹುದು, ಉದ್ಯೋಗದಾತರು ಉದ್ಯೋಗದಾತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮೂಲಕ ತಮ್ಮ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಬಹುದು. ಬಳಕೆದಾರರು WhatsApp ಅಥವಾ ಲಭ್ಯವಿರುವ ಬೆಂಬಲ ಆಯ್ಕೆಗಳ ಮೂಲಕವೂ AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು.",
        },
        deactivateAccount: {
          question: "ಬಳಕೆದಾರರು ತಮ್ಮ ಖಾತೆಯನ್ನು ಹೇಗೆ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಬಹುದು?",
          answer:
            "ಉದ್ಯೋಗಾರ್ಥಿಗಳು AsliJobs ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ತಮ್ಮ ಪ್ರೊಫೈಲ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳ ಮೂಲಕ ಖಾತೆಯನ್ನು ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಬಹುದು, ಉದ್ಯೋಗದಾತರು ಉದ್ಯೋಗದಾತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮೂಲಕ ಖಾತೆಯನ್ನು ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಬಹುದು. ಖಾತೆ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸುವಿಕೆಯಲ್ಲಿ ಸಹಾಯಕ್ಕಾಗಿ ಬಳಕೆದಾರರು AsliJobs ಬೆಂಬಲವನ್ನು ಸಹ ಸಂಪರ್ಕಿಸಬಹುದು.",
        },
      },
      support: {
        title: "ಬೆಂಬಲ",
        contactSupport: {
          question: "ಬಳಕೆದಾರರು AsliJobs ಬೆಂಬಲವನ್ನು ಹೇಗೆ ಸಂಪರ್ಕಿಸಬಹುದು?",
          answer: "ನೀವು WhatsApp, ಫೋನ್ ಅಥವಾ ಇಮೇಲ್ ಮೂಲಕ AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು.",
        },
        moreHelp: {
          question: "ಬಳಕೆದಾರರು ಹೆಚ್ಚಿನ ಸಹಾಯವನ್ನು ಎಲ್ಲಿ ಪಡೆಯಬಹುದು?",
          answer:
            "ವಿವರವಾದ ಉತ್ತರಗಳಿಗಾಗಿ, ಬಳಕೆದಾರರು AsliJobs ಸಹಾಯ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಬಹುದು ಅಥವಾ AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು.",
        },
      },
    },
  },
};

const ml: MessageShape<typeof en> = {
  faqs: {
    breadcrumbAria: "ബ്രെഡ്ക്രംബ്",
    pageTitle: "പതിവ് ചോദ്യങ്ങൾ",
    subtitle:
      "AsliJobs, ജോലി തിരയൽ, തൊഴിലുടമ നിയമനം, WhatsApp അലർട്ടുകൾ, സുരക്ഷ, പിന്തുണ എന്നിവയെക്കുറിച്ചുള്ള സാധാരണ ചോദ്യങ്ങൾക്ക് വേഗത്തിലുള്ള ഉത്തരങ്ങൾ കണ്ടെത്തുക.",
    searchPlaceholder: "പതിവ് ചോദ്യങ്ങൾ തിരയുക...",
    emptyTitle: "ചോദ്യങ്ങളൊന്നും കണ്ടെത്തിയില്ല",
    emptyDescription:
      "മറ്റൊരു കീവേഡ് പരീക്ഷിക്കുക, അല്ലെങ്കിൽ തിരയൽ മായ്ച്ച ശേഷം താഴെയുള്ള വിഭാഗങ്ങൾ ബ്രൗസ് ചെയ്യുക.",
    clearSearch: "തിരയൽ മായ്ക്കുക",
    helpTitle: "ഇനിയും ചോദ്യങ്ങളുണ്ടോ?",
    helpDescriptionLine1: "നിങ്ങൾ തിരയുന്ന ഉത്തരം കിട്ടുന്നില്ലേ?",
    helpDescriptionLine2: "ഞങ്ങളുടെ സപ്പോർട്ട് ടീം സഹായിക്കാൻ ഇവിടെയുണ്ട്.",
    helpContact: "സപ്പോർട്ടുമായി ബന്ധപ്പെടുക",
    helpWhatsapp: "WhatsApp പിന്തുണ",
    categories: {
      general: {
        title: "പൊതുവായവ",
        whatIsAslijobs: {
          question: "AsliJobs എന്താണ്?",
          answer:
            "AsliJobs ഒരു WhatsApp-അധിഷ്ഠിത ജോലി പോർട്ടലാണ്. ഇത് ഇന്ത്യയിലെ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ തൊഴിലാളികൾക്ക് അനുയോജ്യമായ ജോലികൾ കണ്ടെത്താൻ സഹായിക്കുകയും തൊഴിലുടമകൾക്ക് ശരിയായ ഉദ്യോഗാർത്ഥികളെ എളുപ്പത്തിൽ നിയമിക്കാൻ സഹായിക്കുകയും ചെയ്യുന്നു.",
        },
        howDoesAslijobsWork: {
          question: "AsliJobs എങ്ങനെ പ്രവർത്തിക്കുന്നു?",
          answer:
            "AsliJobs WhatsApp വഴിയാണ് പ്രവർത്തിക്കുന്നത്. തൊഴിൽ അന്വേഷകർക്ക് ജോലി അലർട്ടുകൾ ലഭിക്കുകയും ജോലികൾക്ക് അപേക്ഷിക്കുകയും ചെയ്യാം, തൊഴിലുടമകൾക്ക് ജോലികൾ പോസ്റ്റ് ചെയ്ത് അനുയോജ്യരായ ഉദ്യോഗാർത്ഥികളുമായി ബന്ധപ്പെടുകയും ചെയ്യാം.",
        },
        needToDownloadApp: {
          question: "എനിക്ക് ഒരു ആപ്പ് ഡൗൺലോഡ് ചെയ്യേണ്ടതുണ്ടോ?",
          answer:
            "ഇല്ല. തൊഴിൽ അന്വേഷകർക്കും തൊഴിലുടമകൾക്കും ഒരു ആപ്പും ഡൗൺലോഡ് ചെയ്യേണ്ടതില്ല. AsliJobs നേരിട്ട് WhatsApp വഴി പ്രവർത്തിക്കുന്നതിനാൽ ഇത് ലളിതവും ഉപയോഗിക്കാൻ എളുപ്പവുമാണ്.",
        },
        whichCities: {
          question: "AsliJobs ഏതൊക്കെ നഗരങ്ങളിൽ സേവനം നൽകുന്നു?",
          answer:
            "AsliJobs ഇന്ത്യയിലുടനീളം തൊഴിൽ അന്വേഷകർക്കും തൊഴിലുടമകൾക്കും സേവനം നൽകുന്നു. തൊഴിൽ അന്വേഷകർക്ക് എവിടെ നിന്നും ജോലികൾ തിരഞ്ഞ് അപേക്ഷിക്കാം, തൊഴിലുടമകൾക്ക് ഏത് സ്ഥലത്ത് നിന്നും ജോലികൾ പോസ്റ്റ് ചെയ്യാം. ജോലി ലഭ്യത നഗരം, പ്രദേശം, ലോക്കാലിറ്റി, നിലവിലെ തൊഴിലുടമ ഒഴിവുകൾ എന്നിവയനുസരിച്ച് വ്യത്യാസപ്പെടാം.",
        },
        jobCategories: {
          question: "ഏതൊക്കെ ജോലി വിഭാഗങ്ങൾ ലഭ്യമാണ്?",
          answer:
            "AsliJobs ഉത്പാദനം, നിർമ്മാണം, ലോജിസ്റ്റിക്സും ഗതാഗതവും, വെയർഹൗസിംഗ്, റീട്ടെയിൽ, ഹോസ്പിറ്റാലിറ്റി, ഫസിലിറ്റി മാനേജ്‌മെന്റ്, സെക്യൂരിറ്റി സേവനങ്ങൾ, ഓട്ടോമോട്ടീവ്, ഹെൽത്ത്‌കെയർ പിന്തുണ, മറ്റ് ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ മേഖലകൾ എന്നിവയെ പിന്തുണയ്ക്കുന്നു.",
        },
      },
      jobSeekers: {
        title: "തൊഴിൽ അന്വേഷകർ",
        freeForJobSeekers: {
          question: "തൊഴിൽ അന്വേഷകർക്ക് AsliJobs സൗജന്യമാണോ?",
          answer: "അതെ. ജോലികൾ തിരയാനും അപേക്ഷിക്കാനും തൊഴിൽ അന്വേഷകർക്ക് AsliJobs സൗജന്യമാണ്.",
        },
        jobAlerts: {
          question: "തൊഴിൽ അന്വേഷകർക്ക് ജോലി അലർട്ടുകൾ എങ്ങനെ ലഭിക്കും?",
          answer:
            "തൊഴിൽ അന്വേഷകർക്ക് അവരുടെ സ്ഥലം, ജോലി വിഭാഗം, പരിചയം, പ്രൊഫൈൽ വിവരങ്ങൾ എന്നിവയുടെ അടിസ്ഥാനത്തിൽ WhatsApp-ൽ ജോലി അലർട്ടുകൾ ലഭിക്കും.",
        },
        shouldPayForJob: {
          question: "ജോലി ലഭിക്കാൻ തൊഴിൽ അന്വേഷകർ പണം നൽകണോ?",
          answer:
            "ഇല്ല. ജോലി സ്ഥിരീകരണത്തിന് തൊഴിൽ അന്വേഷകർ പണം നൽകരുത്. ആരെങ്കിലും പണം ആവശ്യപ്പെട്ടാൽ, ഉടൻ AsliJobs-നെ അറിയിക്കുക.",
        },
        jobSearchStatusBadge: {
          question: "ജോലി തിരയൽ സ്റ്റാറ്റസ് ബാഡ്ജ് എന്താണ്?",
          answer:
            "നിങ്ങൾ സജീവമായി ജോലി തിരയുകയാണെന്ന് ഈ ബാഡ്ജ് സൂചിപ്പിക്കുന്നു. ജോലി അലർട്ടുകൾ ലഭിക്കാൻ നിങ്ങളുടെ AsliJobs പ്രൊഫൈലിൽ ഈ ബാഡ്ജ് ഓണാക്കണം. ബാഡ്ജ് ഓഫാണെങ്കിൽ, നിങ്ങൾക്ക് ജോലി അലർട്ടുകൾ ലഭിക്കില്ല.",
        },
      },
      employers: {
        title: "തൊഴിലുടമകൾ",
        employerFreeOrPaid: {
          question: "തൊഴിലുടമ സേവനങ്ങൾ സൗജന്യമാണോ പണമടയ്ക്കേണ്ടതാണോ?",
          answer:
            "AsliJobs തൊഴിലുടമകൾക്ക് സൗജന്യവും പണമടയ്ക്കേണ്ടതുമായ സേവനങ്ങൾ നൽകുന്നു. തൊഴിലുടമകൾക്ക് അവരുടെ നിയമന ആവശ്യങ്ങൾക്കനുസരിച്ച് പണമടയ്ക്കേണ്ട ഹയറിങ് പ്ലാനുകൾ, പ്രമോട്ട് ചെയ്ത ജോലികൾ, അല്ലെങ്കിൽ കാമ്പെയ്ൻ പ്രമോഷനുകൾ തിരഞ്ഞെടുക്കാം.",
        },
        howEmployersPostJob: {
          question: "തൊഴിലുടമകൾ ഒരു ജോലി എങ്ങനെ പോസ്റ്റ് ചെയ്യും?",
          answer:
            "തൊഴിലുടമകൾക്ക് ജോലി ശീർഷകം, സ്ഥലം, ശമ്പളം, ജോലി സമയം, ഒഴിവുകൾ, ആവശ്യമായ പരിചയം, ആനുകൂല്യങ്ങൾ തുടങ്ങിയ വിവരങ്ങൾ പങ്കിട്ട് ഒരു ജോലി പോസ്റ്റ് ചെയ്യാം.",
        },
        promotedJob: {
          question: "പ്രമോട്ട് ചെയ്ത ജോലി എന്താണ്?",
          answer:
            "പ്രമോട്ട് ചെയ്ത ജോലി എന്നത് അധിക ദൃശ്യത നൽകുന്ന, പണമടയ്ക്കേണ്ട ജോലി പോസ്റ്റാണ്, ഇതുവഴി കൂടുതൽ അനുയോജ്യരായ തൊഴിൽ അന്വേഷകർക്ക് അത് കാണാനും അപേക്ഷിക്കാനും കഴിയും.",
        },
      },
      jobApplications: {
        title: "ജോലി അപേക്ഷകൾ",
        howJobSeekersApply: {
          question: "തൊഴിൽ അന്വേഷകർ ഒരു ജോലിക്ക് എങ്ങനെ അപേക്ഷിക്കും?",
          answer:
            "തൊഴിൽ അന്വേഷകർക്ക് ജോലി അലർട്ടിന് മറുപടി നൽകിയോ അപേക്ഷിക്കുക ഓപ്ഷൻ തിരഞ്ഞെടുത്തോ നേരിട്ട് WhatsApp വഴി അപേക്ഷിക്കാം. അവർക്ക് AsliJobs വെബ്‌സൈറ്റ് വഴിയും അപേക്ഷിക്കാം.",
        },
        howEmployersReceiveApplications: {
          question: "തൊഴിലുടമകൾക്ക് അപേക്ഷകൾ എങ്ങനെ ലഭിക്കും?",
          answer:
            "തൊഴിലുടമകൾക്ക് തൊഴിലുടമ ഡാഷ്‌ബോർഡ് വഴി അപേക്ഷകൾ കാണാം, അല്ലെങ്കിൽ AsliJobs ടീം പങ്കിടുന്ന അപ്‌ഡേറ്റുകൾ ലഭിക്കാം.",
        },
        afterJobSeekerApplies: {
          question: "തൊഴിൽ അന്വേഷകൻ അപേക്ഷിച്ചതിന് ശേഷം എന്ത് സംഭവിക്കും?",
          answer:
            "തൊഴിൽ അന്വേഷകൻ അപേക്ഷിച്ചതിന് ശേഷം, അപേക്ഷ തൊഴിലുടമയുമായി പങ്കിടുന്നു. ഷോർട്ട്‌ലിസ്റ്റ്, അഭിമുഖ വിവരങ്ങൾ, അല്ലെങ്കിൽ തിരഞ്ഞെടുപ്പ് നില എന്നിവ പോലുള്ള തുടർന്നുള്ള അപ്‌ഡേറ്റുകൾ WhatsApp വഴി പങ്കിടും.",
        },
        howEmployersShortlist: {
          question: "തൊഴിലുടമകൾക്ക് ഉദ്യോഗാർത്ഥികളെ എങ്ങനെ ഷോർട്ട്‌ലിസ്റ്റ് ചെയ്യാം?",
          answer:
            "തൊഴിലുടമകൾക്ക് ഉദ്യോഗാർത്ഥി വിവരങ്ങൾ അവലോകനം ചെയ്ത് അവരുടെ നിയമന ആവശ്യങ്ങൾക്ക് യോജിക്കുന്ന പ്രൊഫൈലുകൾ ഷോർട്ട്‌ലിസ്റ്റ് ചെയ്യാം.",
        },
      },
      languages: {
        title: "ഭാഷകൾ",
        supportedLanguages: {
          question: "AsliJobs ഏതൊക്കെ ഭാഷകളെ പിന്തുണയ്ക്കുന്നു?",
          answer: "AsliJobs ഇംഗ്ലീഷ്, ഹിന്ദി, തെലുങ്ക്, തമിഴ്, കന്നഡ, മലയാളം എന്നിവയെ പിന്തുണയ്ക്കുന്നു.",
        },
        changeLanguage: {
          question: "ഉപയോക്താക്കൾക്ക് അവരുടെ ഭാഷാ മുൻഗണന മാറ്റാമോ?",
          answer:
            "അതെ. ഉപയോക്താക്കൾക്ക് AsliJobs വെബ്‌സൈറ്റ്, WhatsApp വഴി, അല്ലെങ്കിൽ AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെട്ട് അവരുടെ ഇഷ്ടമുള്ള ഭാഷ മാറ്റാം.",
        },
      },
      safety: {
        title: "സുരക്ഷ",
        reportFakeJob: {
          question: "ഉപയോക്താക്കൾക്ക് വ്യാജ ജോലി എങ്ങനെ റിപ്പോർട്ട് ചെയ്യാം?",
          answer:
            "ഉപയോക്താക്കൾക്ക് AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെട്ട് ജോലി വിവരങ്ങൾ, തൊഴിലുടമയുടെ പേര്, പ്രശ്നം, ലഭ്യമെങ്കിൽ സ്ക്രീൻഷോട്ടുകൾ പങ്കിട്ട് വ്യാജമോ സംശയാസ്പദമോ ആയ ജോലി റിപ്പോർട്ട് ചെയ്യാം.",
        },
      },
      profileAccount: {
        title: "പ്രൊഫൈൽ ആൻഡ് അക്കൗണ്ട്",
        updateProfile: {
          question: "ഉപയോക്താക്കൾക്ക് അവരുടെ പ്രൊഫൈൽ വിവരങ്ങൾ എങ്ങനെ അപ്‌ഡേറ്റ് ചെയ്യാം?",
          answer:
            "തൊഴിൽ അന്വേഷകർക്ക് AsliJobs വെബ്‌സൈറ്റിലെ അവരുടെ പ്രൊഫൈൽ വഴി വിവരങ്ങൾ അപ്‌ഡേറ്റ് ചെയ്യാം, തൊഴിലുടമകൾക്ക് തൊഴിലുടമ ഡാഷ്‌ബോർഡ് വഴി വിവരങ്ങൾ അപ്‌ഡേറ്റ് ചെയ്യാം. ഉപയോക്താക്കൾക്ക് WhatsApp വഴിയോ ലഭ്യമായ സപ്പോർട്ട് ഓപ്ഷനുകൾ വഴിയോ AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടാനും കഴിയും.",
        },
        deactivateAccount: {
          question: "ഉപയോക്താക്കൾക്ക് അവരുടെ അക്കൗണ്ട് എങ്ങനെ നിർജ്ജീവമാക്കാം?",
          answer:
            "തൊഴിൽ അന്വേഷകർക്ക് AsliJobs വെബ്‌സൈറ്റിലെ പ്രൊഫൈൽ ക്രമീകരണങ്ങൾ വഴി അക്കൗണ്ട് നിർജ്ജീവമാക്കാം, തൊഴിലുടമകൾക്ക് തൊഴിലുടമ ഡാഷ്‌ബോർഡ് വഴി അക്കൗണ്ട് നിർജ്ജീവമാക്കാം. അക്കൗണ്ട് നിർജ്ജീവമാക്കുന്നതിന് സഹായം ആവശ്യമെങ്കിൽ ഉപയോക്താക്കൾക്ക് AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടാനും കഴിയും.",
        },
      },
      support: {
        title: "പിന്തുണ",
        contactSupport: {
          question: "ഉപയോക്താക്കൾക്ക് AsliJobs സപ്പോർട്ടുമായി എങ്ങനെ ബന്ധപ്പെടാം?",
          answer: "നിങ്ങൾക്ക് WhatsApp, ഫോൺ, അല്ലെങ്കിൽ ഇമെയിൽ വഴി AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടാം.",
        },
        moreHelp: {
          question: "ഉപയോക്താക്കൾക്ക് കൂടുതൽ സഹായം എവിടെ നിന്ന് ലഭിക്കും?",
          answer:
            "വിശദമായ ഉത്തരങ്ങൾക്ക്, ഉപയോക്താക്കൾക്ക് AsliJobs സഹായ കേന്ദ്രം സന്ദർശിക്കുകയോ AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടുകയോ ചെയ്യാം.",
        },
      },
    },
  },
};

export const faqsBundle = { en, hi, te, ta, kn, ml } as const;
