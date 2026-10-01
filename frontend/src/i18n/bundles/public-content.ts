type MessageShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : MessageShape<T[K]>;
};

const en = {
  publicContent: {
    postAJob: {
      title: "Post a Job",
      metaDescription:
        "Hire the right blue-collar and grey-collar candidates with AsliJobs.",
      intro:
        "Hire the right blue-collar and grey-collar candidates with AsliJobs. Whether you need office support staff, delivery executives, drivers, electricians, housekeeping staff, security guards, warehouse workers, retail staff, technicians, or helpers, AsliJobs helps you reach suitable job seekers easily.",
      postJobsEasily: {
        title: "Post Jobs Easily",
        body: "Employers can post jobs on AsliJobs by sharing important details such as job title, location, salary, work timings, number of openings, experience required, skills needed, benefits, and interview details.",
        jobTitle: "Job title",
        location: "Location",
        salary: "Salary",
        workTimings: "Work timings",
        openings: "Number of openings",
        experience: "Experience required",
        skills: "Skills needed",
        benefits: "Benefits",
        interviewDetails: "Interview details",
      },
      reachCandidates: {
        title: "Reach Suitable Candidates",
        body: "Once your job is posted, AsliJobs helps share the opportunity with relevant job seekers based on location, job category, experience, language preference, and availability.",
      },
      manageApplications: {
        title: "Manage Applications",
        body: "Employers can view applications, shortlist candidates, schedule interviews, and track hiring progress through the employer dashboard or with support from the AsliJobs team.",
      },
      promoteJob: {
        title: "Promote Your Job",
        body: "Employers can choose promoted jobs or campaign promotions to increase visibility and reach more suitable candidates.",
      },
      cta: {
        title: "Start Hiring with AsliJobs",
        body: "Post your job on AsliJobs and connect with candidates who are ready to work.",
        tagline: "Post a job. Reach suitable candidates. Hire faster.",
        badge: "For Employers",
        postAJob: "Post a Job",
        employerLogin: "Employer Login",
      },
    },
  },
} as const;

const hi: MessageShape<typeof en> = {
  publicContent: {
    postAJob: {
      title: "नौकरी पोस्ट करें",
      metaDescription:
        "AsliJobs के साथ सही ब्लू-कॉलर और ग्रे-कॉलर उम्मीदवारों को नियुक्त करें।",
      intro:
        "AsliJobs के साथ सही ब्लू-कॉलर और ग्रे-कॉलर उम्मीदवारों को नियुक्त करें। चाहे आपको ऑफिस सपोर्ट स्टाफ, डिलीवरी एक्जीक्यूटिव, ड्राइवर, इलेक्ट्रीशियन, हाउसकीपिंग स्टाफ, सिक्योरिटी गार्ड, वेयरहाउस वर्कर, रिटेल स्टाफ, टेक्नीशियन या हेल्पर चाहिए, AsliJobs आपको उपयुक्त नौकरी खोजने वालों तक आसानी से पहुँचने में मदद करता है।",
      postJobsEasily: {
        title: "आसानी से नौकरियाँ पोस्ट करें",
        body: "नियोक्ता नौकरी का शीर्षक, स्थान, वेतन, कार्य समय, रिक्तियों की संख्या, आवश्यक अनुभव, आवश्यक कौशल, लाभ और इंटरव्यू विवरण जैसी महत्वपूर्ण जानकारी साझा करके AsliJobs पर नौकरियाँ पोस्ट कर सकते हैं।",
        jobTitle: "नौकरी का शीर्षक",
        location: "स्थान",
        salary: "वेतन",
        workTimings: "कार्य समय",
        openings: "रिक्तियों की संख्या",
        experience: "आवश्यक अनुभव",
        skills: "आवश्यक कौशल",
        benefits: "लाभ",
        interviewDetails: "इंटरव्यू विवरण",
      },
      reachCandidates: {
        title: "उपयुक्त उम्मीदवारों तक पहुँचें",
        body: "नौकरी पोस्ट होने के बाद, AsliJobs स्थान, नौकरी श्रेणी, अनुभव, भाषा प्राथमिकता और उपलब्धता के आधार पर संबंधित नौकरी खोजने वालों के साथ अवसर साझा करने में मदद करता है।",
      },
      manageApplications: {
        title: "आवेदनों का प्रबंधन करें",
        body: "नियोक्ता नियोक्ता डैशबोर्ड के माध्यम से या AsliJobs टीम की सहायता से आवेदन देख सकते हैं, उम्मीदवारों को शॉर्टलिस्ट कर सकते हैं, इंटरव्यू शेड्यूल कर सकते हैं और भर्ती प्रगति ट्रैक कर सकते हैं।",
      },
      promoteJob: {
        title: "अपनी नौकरी को प्रमोट करें",
        body: "नियोक्ता दृश्यता बढ़ाने और अधिक उपयुक्त उम्मीदवारों तक पहुँचने के लिए प्रमोटेड नौकरियाँ या कैंपेन प्रमोशन चुन सकते हैं।",
      },
      cta: {
        title: "AsliJobs के साथ भर्ती शुरू करें",
        body: "AsliJobs पर अपनी नौकरी पोस्ट करें और काम के लिए तैयार उम्मीदवारों से जुड़ें।",
        tagline: "नौकरी पोस्ट करें। उपयुक्त उम्मीदवारों तक पहुँचें। तेज़ी से नियुक्त करें।",
        badge: "नियोक्ताओं के लिए",
        postAJob: "नौकरी पोस्ट करें",
        employerLogin: "नियोक्ता लॉगिन",
      },
    },
  },
};

const te: MessageShape<typeof en> = {
  publicContent: {
    postAJob: {
      title: "ఉద్యోగం పోస్ట్ చేయండి",
      metaDescription:
        "AsliJobsతో సరైన బ్లూ-కాలర్ మరియు గ్రే-కాలర్ అభ్యర్థులను నియమించుకోండి.",
      intro:
        "AsliJobsతో సరైన బ్లూ-కాలర్ మరియు గ్రే-కాలర్ అభ్యర్థులను నియమించుకోండి. మీకు ఆఫీస్ సపోర్ట్ స్టాఫ్, డెలివరీ ఎగ్జిక్యూటివ్‌లు, డ్రైవర్లు, ఎలక్ట్రీషియన్లు, హౌస్‌కీపింగ్ స్టాఫ్, సెక్యూరిటీ గార్డులు, వేర్‌హౌస్ వర్కర్లు, రిటైల్ స్టాఫ్, టెక్నీషియన్లు లేదా హెల్పర్లు కావాలన్నా, AsliJobs సరైన ఉద్యోగార్థులను సులభంగా చేరుకోవడంలో సహాయపడుతుంది.",
      postJobsEasily: {
        title: "ఉద్యోగాలను సులభంగా పోస్ట్ చేయండి",
        body: "యజమానులు ఉద్యోగ శీర్షిక, ప్రాంతం, జీతం, పని సమయాలు, ఖాళీల సంఖ్య, అవసరమైన అనుభవం, అవసరమైన నైపుణ్యాలు, ప్రయోజనాలు మరియు ఇంటర్వ్యూ వివరాలు వంటి ముఖ్యమైన సమాచారాన్ని పంచుకుని AsliJobsలో ఉద్యోగాలను పోస్ట్ చేయవచ్చు.",
        jobTitle: "ఉద్యోగ శీర్షిక",
        location: "ప్రాంతం",
        salary: "జీతం",
        workTimings: "పని సమయాలు",
        openings: "ఖాళీల సంఖ్య",
        experience: "అవసరమైన అనుభవం",
        skills: "అవసరమైన నైపుణ్యాలు",
        benefits: "ప్రయోజనాలు",
        interviewDetails: "ఇంటర్వ్యూ వివరాలు",
      },
      reachCandidates: {
        title: "సరైన అభ్యర్థులను చేరుకోండి",
        body: "మీ ఉద్యోగం పోస్ట్ అయిన తర్వాత, ప్రాంతం, ఉద్యోగ వర్గం, అనుభవం, భాషా ప్రాధాన్యత మరియు లభ్యత ఆధారంగా సంబంధిత ఉద్యోగార్థులతో అవకాశాన్ని పంచుకోవడంలో AsliJobs సహాయపడుతుంది.",
      },
      manageApplications: {
        title: "దరఖాస్తులను నిర్వహించండి",
        body: "యజమానులు యజమాని డాష్‌బోర్డ్ ద్వారా లేదా AsliJobs బృందం సహాయంతో దరఖాస్తులను చూడవచ్చు, అభ్యర్థులను షార్ట్‌లిస్ట్ చేయవచ్చు, ఇంటర్వ్యూలు షెడ్యూల్ చేయవచ్చు మరియు నియామక పురోగతిని ట్రాక్ చేయవచ్చు.",
      },
      promoteJob: {
        title: "మీ ఉద్యోగాన్ని ప్రమోట్ చేయండి",
        body: "దృశ్యమానతను పెంచి మరిన్ని సరైన అభ్యర్థులను చేరుకోవడానికి యజమానులు ప్రమోట్ చేసిన ఉద్యోగాలు లేదా క్యాంపెయిన్ ప్రమోషన్లను ఎంచుకోవచ్చు.",
      },
      cta: {
        title: "AsliJobsతో నియామకం ప్రారంభించండి",
        body: "AsliJobsలో మీ ఉద్యోగాన్ని పోస్ట్ చేసి పని చేయడానికి సిద్ధంగా ఉన్న అభ్యర్థులతో కనెక్ట్ అవ్వండి.",
        tagline: "ఉద్యోగం పోస్ట్ చేయండి. సరైన అభ్యర్థులను చేరుకోండి. వేగంగా నియమించుకోండి.",
        badge: "యజమానుల కోసం",
        postAJob: "ఉద్యోగం పోస్ట్ చేయండి",
        employerLogin: "యజమాని లాగిన్",
      },
    },
  },
};

const ta: MessageShape<typeof en> = {
  publicContent: {
    postAJob: {
      title: "வேலை பதிவு செய்யுங்கள்",
      metaDescription:
        "AsliJobs மூலம் சரியான ப்ளூ-காலர் மற்றும் கிரே-காலர் வேட்பாளர்களை நியமிக்கவும்.",
      intro:
        "AsliJobs மூலம் சரியான ப்ளூ-காலர் மற்றும் கிரே-காலர் வேட்பாளர்களை நியமிக்கவும். அலுவலக ஆதரவு ஊழியர்கள், டெலிவரி எக்ஸிகியூட்டிவ்கள், டிரைவர்கள், எலக்ட்ரீஷியன்கள், ஹவுஸ்கீப்பிங் ஊழியர்கள், பாதுகாப்பு காவலர்கள், கிடங்கு பணியாளர்கள், சில்லறை ஊழியர்கள், டெக்னீஷியன்கள் அல்லது உதவியாளர்கள் தேவைப்பட்டாலும், AsliJobs பொருத்தமான வேலை தேடுபவர்களை எளிதாக அடைய உதவுகிறது.",
      postJobsEasily: {
        title: "வேலைகளை எளிதாக பதிவு செய்யுங்கள்",
        body: "முதலாளிகள் வேலை தலைப்பு, இடம், சம்பளம், வேலை நேரம், காலியிடங்களின் எண்ணிக்கை, தேவையான அனுபவம், தேவையான திறன்கள், சலுகைகள் மற்றும் நேர்காணல் விவரங்கள் போன்ற முக்கிய தகவல்களைப் பகிர்ந்து AsliJobs-இல் வேலைகளைப் பதிவு செய்யலாம்.",
        jobTitle: "வேலை தலைப்பு",
        location: "இடம்",
        salary: "சம்பளம்",
        workTimings: "வேலை நேரம்",
        openings: "காலியிடங்களின் எண்ணிக்கை",
        experience: "தேவையான அனுபவம்",
        skills: "தேவையான திறன்கள்",
        benefits: "சலுகைகள்",
        interviewDetails: "நேர்காணல் விவரங்கள்",
      },
      reachCandidates: {
        title: "பொருத்தமான வேட்பாளர்களை அடையுங்கள்",
        body: "உங்கள் வேலை பதிவான பிறகு, இடம், வேலை வகை, அனுபவம், மொழி விருப்பம் மற்றும் கிடைக்கும் தன்மை ஆகியவற்றின் அடிப்படையில் தொடர்புடைய வேலை தேடுபவர்களுடன் வாய்ப்பைப் பகிர AsliJobs உதவுகிறது.",
      },
      manageApplications: {
        title: "விண்ணப்பங்களை நிர்வகிக்கவும்",
        body: "முதலாளிகள் முதலாளி டாஷ்போர்டு மூலமாகவோ அல்லது AsliJobs குழுவின் ஆதரவுடனோ விண்ணப்பங்களைப் பார்க்கலாம், வேட்பாளர்களை குறுகிய பட்டியலிடலாம், நேர்காணல்களை திட்டமிடலாம் மற்றும் நியமன முன்னேற்றத்தைக் கண்காணிக்கலாம்.",
      },
      promoteJob: {
        title: "உங்கள் வேலையை விளம்பரப்படுத்துங்கள்",
        body: "தெரிவுநிலையை அதிகரித்து மேலும் பொருத்தமான வேட்பாளர்களை அடைய முதலாளிகள் விளம்பரப்படுத்தப்பட்ட வேலைகள் அல்லது பிரச்சார விளம்பரங்களைத் தேர்வு செய்யலாம்.",
      },
      cta: {
        title: "AsliJobs உடன் நியமனத்தைத் தொடங்குங்கள்",
        body: "AsliJobs-இல் உங்கள் வேலையைப் பதிவு செய்து வேலை செய்யத் தயாராக உள்ள வேட்பாளர்களுடன் இணையுங்கள்.",
        tagline: "வேலை பதிவு செய்யுங்கள். பொருத்தமான வேட்பாளர்களை அடையுங்கள். வேகமாக நியமிக்கவும்.",
        badge: "முதலாளிகளுக்காக",
        postAJob: "வேலை பதிவு செய்யுங்கள்",
        employerLogin: "முதலாளி உள்நுழைவு",
      },
    },
  },
};

const kn: MessageShape<typeof en> = {
  publicContent: {
    postAJob: {
      title: "ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಮಾಡಿ",
      metaDescription:
        "AsliJobs ಮೂಲಕ ಸರಿಯಾದ ಬ್ಲೂ-ಕಾಲರ್ ಮತ್ತು ಗ್ರೇ-ಕಾಲರ್ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ನೇಮಿಸಿ.",
      intro:
        "AsliJobs ಮೂಲಕ ಸರಿಯಾದ ಬ್ಲೂ-ಕಾಲರ್ ಮತ್ತು ಗ್ರೇ-ಕಾಲರ್ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ನೇಮಿಸಿ. ನಿಮಗೆ ಕಚೇರಿ ಬೆಂಬಲ ಸಿಬ್ಬಂದಿ, ಡೆಲಿವರಿ ಎಕ್ಸಿಕ್ಯೂಟಿವ್‌ಗಳು, ಚಾಲಕರು, ಎಲೆಕ್ಟ್ರಿಷಿಯನ್‌ಗಳು, ಹೌಸ್‌ಕೀಪಿಂಗ್ ಸಿಬ್ಬಂದಿ, ಭದ್ರತಾ ಕಾವಲುಗಾರರು, ಗೋದಾಮು ಕಾರ್ಮಿಕರು, ಚಿಲ್ಲರೆ ಸಿಬ್ಬಂದಿ, ತಂತ್ರಜ್ಞರು ಅಥವಾ ಸಹಾಯಕರು ಬೇಕಾದರೂ, AsliJobs ಸೂಕ್ತ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳನ್ನು ಸುಲಭವಾಗಿ ತಲುಪಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
      postJobsEasily: {
        title: "ಉದ್ಯೋಗಗಳನ್ನು ಸುಲಭವಾಗಿ ಪೋಸ್ಟ್ ಮಾಡಿ",
        body: "ಉದ್ಯೋಗದಾತರು ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ, ಸ್ಥಳ, ಸಂಬಳ, ಕೆಲಸದ ಸಮಯ, ಖಾಲಿ ಹುದ್ದೆಗಳ ಸಂಖ್ಯೆ, ಅಗತ್ಯ ಅನುಭವ, ಅಗತ್ಯ ಕೌಶಲ್ಯಗಳು, ಸೌಲಭ್ಯಗಳು ಮತ್ತು ಸಂದರ್ಶನ ವಿವರಗಳಂತಹ ಮುಖ್ಯ ಮಾಹಿತಿಯನ್ನು ಹಂಚಿಕೊಂಡು AsliJobs ನಲ್ಲಿ ಉದ್ಯೋಗಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಬಹುದು.",
        jobTitle: "ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ",
        location: "ಸ್ಥಳ",
        salary: "ಸಂಬಳ",
        workTimings: "ಕೆಲಸದ ಸಮಯ",
        openings: "ಖಾಲಿ ಹುದ್ದೆಗಳ ಸಂಖ್ಯೆ",
        experience: "ಅಗತ್ಯ ಅನುಭವ",
        skills: "ಅಗತ್ಯ ಕೌಶಲ್ಯಗಳು",
        benefits: "ಸೌಲಭ್ಯಗಳು",
        interviewDetails: "ಸಂದರ್ಶನ ವಿವರಗಳು",
      },
      reachCandidates: {
        title: "ಸೂಕ್ತ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ತಲುಪಿ",
        body: "ನಿಮ್ಮ ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಆದ ನಂತರ, ಸ್ಥಳ, ಉದ್ಯೋಗ ವರ್ಗ, ಅನುಭವ, ಭಾಷಾ ಆದ್ಯತೆ ಮತ್ತು ಲಭ್ಯತೆಯ ಆಧಾರದ ಮೇಲೆ ಸಂಬಂಧಿತ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳೊಂದಿಗೆ ಅವಕಾಶವನ್ನು ಹಂಚಿಕೊಳ್ಳಲು AsliJobs ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
      },
      manageApplications: {
        title: "ಅರ್ಜಿಗಳನ್ನು ನಿರ್ವಹಿಸಿ",
        body: "ಉದ್ಯೋಗದಾತರು ಉದ್ಯೋಗದಾತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮೂಲಕ ಅಥವಾ AsliJobs ತಂಡದ ಬೆಂಬಲದೊಂದಿಗೆ ಅರ್ಜಿಗಳನ್ನು ನೋಡಬಹುದು, ಅಭ್ಯರ್ಥಿಗಳನ್ನು ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಮಾಡಬಹುದು, ಸಂದರ್ಶನಗಳನ್ನು ನಿಗದಿಪಡಿಸಬಹುದು ಮತ್ತು ನೇಮಕಾತಿ ಪ್ರಗತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದು.",
      },
      promoteJob: {
        title: "ನಿಮ್ಮ ಉದ್ಯೋಗವನ್ನು ಪ್ರಚಾರ ಮಾಡಿ",
        body: "ಗೋಚರತೆಯನ್ನು ಹೆಚ್ಚಿಸಿ ಹೆಚ್ಚು ಸೂಕ್ತ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ತಲುಪಲು ಉದ್ಯೋಗದಾತರು ಪ್ರಚಾರಿತ ಉದ್ಯೋಗಗಳು ಅಥವಾ ಅಭಿಯಾನ ಪ್ರಚಾರಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಬಹುದು.",
      },
      cta: {
        title: "AsliJobs ಜೊತೆ ನೇಮಕಾತಿ ಪ್ರಾರಂಭಿಸಿ",
        body: "AsliJobs ನಲ್ಲಿ ನಿಮ್ಮ ಉದ್ಯೋಗವನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ ಮತ್ತು ಕೆಲಸಕ್ಕೆ ಸಿದ್ಧವಾಗಿರುವ ಅಭ್ಯರ್ಥಿಗಳೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಿ.",
        tagline: "ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಮಾಡಿ. ಸೂಕ್ತ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ತಲುಪಿ. ವೇಗವಾಗಿ ನೇಮಿಸಿ.",
        badge: "ಉದ್ಯೋಗದಾತರಿಗಾಗಿ",
        postAJob: "ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಮಾಡಿ",
        employerLogin: "ಉದ್ಯೋಗದಾತ ಲಾಗಿನ್",
      },
    },
  },
};

const ml: MessageShape<typeof en> = {
  publicContent: {
    postAJob: {
      title: "ജോലി പോസ്റ്റ് ചെയ്യുക",
      metaDescription:
        "AsliJobs വഴി ശരിയായ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ ഉദ്യോഗാർത്ഥികളെ നിയമിക്കുക.",
      intro:
        "AsliJobs വഴി ശരിയായ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ ഉദ്യോഗാർത്ഥികളെ നിയമിക്കുക. ഓഫീസ് സപ്പോർട്ട് സ്റ്റാഫ്, ഡെലിവറി എക്സിക്യൂട്ടീവുകൾ, ഡ്രൈവർമാർ, ഇലക്ട്രീഷ്യൻമാർ, ഹൗസ്‌കീപ്പിംഗ് സ്റ്റാഫ്, സെക്യൂരിറ്റി ഗാർഡുകൾ, വെയർഹൗസ് തൊഴിലാളികൾ, റീട്ടെയിൽ സ്റ്റാഫ്, ടെക്നീഷ്യൻമാർ അല്ലെങ്കിൽ ഹെൽപ്പർമാർ വേണമെങ്കിലും, AsliJobs അനുയോജ്യരായ തൊഴിൽ അന്വേഷകരെ എളുപ്പത്തിൽ എത്താൻ സഹായിക്കുന്നു.",
      postJobsEasily: {
        title: "ജോലികൾ എളുപ്പത്തിൽ പോസ്റ്റ് ചെയ്യുക",
        body: "തൊഴിലുടമകൾക്ക് ജോലി ശീർഷകം, സ്ഥലം, ശമ്പളം, ജോലി സമയം, ഒഴിവുകളുടെ എണ്ണം, ആവശ്യമായ പരിചയം, ആവശ്യമായ കഴിവുകൾ, ആനുകൂല്യങ്ങൾ, അഭിമുഖ വിവരങ്ങൾ എന്നിവ പങ്കിട്ട് AsliJobs-ൽ ജോലികൾ പോസ്റ്റ് ചെയ്യാം.",
        jobTitle: "ജോലി ശീർഷകം",
        location: "സ്ഥലം",
        salary: "ശമ്പളം",
        workTimings: "ജോലി സമയം",
        openings: "ഒഴിവുകളുടെ എണ്ണം",
        experience: "ആവശ്യമായ പരിചയം",
        skills: "ആവശ്യമായ കഴിവുകൾ",
        benefits: "ആനുകൂല്യങ്ങൾ",
        interviewDetails: "അഭിമുഖ വിവരങ്ങൾ",
      },
      reachCandidates: {
        title: "അനുയോജ്യരായ ഉദ്യോഗാർത്ഥികളെ എത്തുക",
        body: "നിങ്ങളുടെ ജോലി പോസ്റ്റ് ചെയ്ത ശേഷം, സ്ഥലം, ജോലി വിഭാഗം, പരിചയം, ഭാഷാ മുൻഗണന, ലഭ്യത എന്നിവയുടെ അടിസ്ഥാനത്തിൽ ബന്ധപ്പെട്ട തൊഴിൽ അന്വേഷകരുമായി അവസരം പങ്കിടാൻ AsliJobs സഹായിക്കുന്നു.",
      },
      manageApplications: {
        title: "അപേക്ഷകൾ കൈകാര്യം ചെയ്യുക",
        body: "തൊഴിലുടമകൾക്ക് തൊഴിലുടമ ഡാഷ്‌ബോർഡ് വഴിയോ AsliJobs ടീമിന്റെ പിന്തുണയോടെയോ അപേക്ഷകൾ കാണാനും, ഉദ്യോഗാർത്ഥികളെ ഷോർട്ട്‌ലിസ്റ്റ് ചെയ്യാനും, അഭിമുഖങ്ങൾ ഷെഡ്യൂൾ ചെയ്യാനും, നിയമന പുരോഗതി ട്രാക്ക് ചെയ്യാനും കഴിയും.",
      },
      promoteJob: {
        title: "നിങ്ങളുടെ ജോലി പ്രമോട്ട് ചെയ്യുക",
        body: "ദൃശ്യത വർധിപ്പിച്ച് കൂടുതൽ അനുയോജ്യരായ ഉദ്യോഗാർത്ഥികളെ എത്താൻ തൊഴിലുടമകൾക്ക് പ്രമോട്ട് ചെയ്ത ജോലികളോ കാമ്പെയ്ൻ പ്രമോഷനുകളോ തിരഞ്ഞെടുക്കാം.",
      },
      cta: {
        title: "AsliJobs ഉപയോഗിച്ച് നിയമനം ആരംഭിക്കുക",
        body: "AsliJobs-ൽ നിങ്ങളുടെ ജോലി പോസ്റ്റ് ചെയ്ത് ജോലി ചെയ്യാൻ തയ്യാറായ ഉദ്യോഗാർത്ഥികളുമായി ബന്ധപ്പെടുക.",
        tagline: "ജോലി പോസ്റ്റ് ചെയ്യുക. അനുയോജ്യരായ ഉദ്യോഗാർത്ഥികളെ എത്തുക. വേഗത്തിൽ നിയമിക്കുക.",
        badge: "തൊഴിലുടമകൾക്കായി",
        postAJob: "ജോലി പോസ്റ്റ് ചെയ്യുക",
        employerLogin: "തൊഴിലുടമ ലോഗിൻ",
      },
    },
  },
};

export const publicContentBundle = { en, hi, te, ta, kn, ml } as const;
