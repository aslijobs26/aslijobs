type LocalizedShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : LocalizedShape<T[K]>;
};

const en = {
  whatsappFab: {
    openAria: "Chat with AsliJobs on WhatsApp",
    openTitle: "Chat with AsliJobs on WhatsApp",
    closeAria: "Close WhatsApp options",
    title: "How can we help you?",
    subtitle: "Choose an option to continue on WhatsApp.",
    loadingTitle: "Checking your account…",
    loadingSubtitle: "Please wait a moment.",
    unknownTitle: "We could not verify your account",
    unknownSubtitle: "Try again, or continue from your account page.",
    retryLabel: "Try again",
    actions: {
      find_job: {
        title: "Find a Job",
        description: "Explore jobs that match your skills.",
        aria: "Open WhatsApp to find a job",
      },
      hire_staff: {
        title: "Hire Staff",
        description: "Find suitable candidates for your business.",
        aria: "Open WhatsApp to hire staff",
      },
      find_jobs: {
        title: "Find Jobs",
        description: "Search jobs that match what you need.",
        aria: "Open WhatsApp to find jobs",
      },
      profile_jobs: {
        title: "Job Recommendations",
        description: "Get jobs suggested from your profile.",
        aria: "Open WhatsApp for job recommendations",
      },
      application_status: {
        title: "Application Status",
        description: "Check the status of your applications.",
        aria: "Open WhatsApp to check application status",
      },
      seeker_help: {
        title: "Talk to Support",
        description: "Get help with your Job Seeker account.",
        aria: "Open WhatsApp for Job Seeker support",
      },
      post_job: {
        title: "Post a Job",
        description: "Post a role and start hiring.",
        aria: "Open WhatsApp to post a job",
      },
      my_jobs: {
        title: "My Job Posts",
        description: "Review the jobs you have posted.",
        aria: "Open WhatsApp to check your job posts",
      },
      employer_applications: {
        title: "Applications Received",
        description: "See how many applications your jobs received.",
        aria: "Open WhatsApp to check applications on your jobs",
      },
      employer_help: {
        title: "Talk to Support",
        description: "Get help with your Employer account.",
        aria: "Open WhatsApp for Employer support",
      },
    },
  },
} as const;

type FabCatalog = LocalizedShape<typeof en>;

const hi: FabCatalog = {
  whatsappFab: {
    openAria: "AsliJobs से WhatsApp पर चैट करें",
    openTitle: "AsliJobs से WhatsApp पर चैट करें",
    closeAria: "WhatsApp विकल्प बंद करें",
    title: "हम आपकी कैसे मदद कर सकते हैं?",
    subtitle: "WhatsApp पर जारी रखने के लिए एक विकल्प चुनें।",
    loadingTitle: "आपका खाता जाँच रहे हैं…",
    loadingSubtitle: "कृपया थोड़ा प्रतीक्षा करें।",
    unknownTitle: "हम आपका खाता सत्यापित नहीं कर सके",
    unknownSubtitle: "फिर कोशिश करें, या अपने खाता पृष्ठ से जारी रखें।",
    retryLabel: "फिर कोशिश करें",
    actions: {
      find_job: {
        title: "नौकरी खोजें",
        description: "अपने कौशल से मेल खाने वाली नौकरियां देखें।",
        aria: "नौकरी खोजने के लिए WhatsApp खोलें",
      },
      hire_staff: {
        title: "स्टाफ रखें",
        description: "अपने व्यवसाय के लिए उपयुक्त उम्मीदवार खोजें।",
        aria: "स्टाफ रखने के लिए WhatsApp खोलें",
      },
      find_jobs: {
        title: "नौकरियां खोजें",
        description: "अपनी जरूरत के अनुसार नौकरियां देखें।",
        aria: "नौकरियां खोजने के लिए WhatsApp खोलें",
      },
      profile_jobs: {
        title: "नौकरी सुझाव",
        description: "अपने प्रोफ़ाइल से मेल खाती नौकरियां पाएं।",
        aria: "नौकरी सुझाव के लिए WhatsApp खोलें",
      },
      application_status: {
        title: "आवेदन स्थिति",
        description: "अपने आवेदनों की स्थिति जाँचें।",
        aria: "आवेदन स्थिति के लिए WhatsApp खोलें",
      },
      seeker_help: {
        title: "सहायता से बात करें",
        description: "अपने जॉब सीकर खाते में मदद पाएं।",
        aria: "जॉब सीकर सहायता के लिए WhatsApp खोलें",
      },
      post_job: {
        title: "नौकरी पोस्ट करें",
        description: "एक रोल पोस्ट करके भर्ती शुरू करें।",
        aria: "नौकरी पोस्ट करने के लिए WhatsApp खोलें",
      },
      my_jobs: {
        title: "मेरी नौकरी पोस्ट",
        description: "अपनी पोस्ट की गई नौकरियां देखें।",
        aria: "अपनी नौकरी पोस्ट के लिए WhatsApp खोलें",
      },
      employer_applications: {
        title: "प्राप्त आवेदन",
        description: "अपकी नौकरियों पर आए आवेदन देखें।",
        aria: "आवेदन गिनती के लिए WhatsApp खोलें",
      },
      employer_help: {
        title: "सहायता से बात करें",
        description: "अपने नियोक्ता खाते में मदद पाएं।",
        aria: "नियोक्ता सहायता के लिए WhatsApp खोलें",
      },
    },
  },
};

const te: FabCatalog = {
  whatsappFab: {
    openAria: "AsliJobsతో WhatsAppలో చాట్ చేయండి",
    openTitle: "AsliJobsతో WhatsAppలో చాట్ చేయండి",
    closeAria: "WhatsApp ఎంపికలను మూసివేయండి",
    title: "మేము మీకు ఎలా సహాయం చేయగలం?",
    subtitle: "WhatsAppలో కొనసాగించడానికి ఒక ఎంపికను ఎంచుకోండి.",
    loadingTitle: "మీ ఖాతాను చూస్తున్నామ…",
    loadingSubtitle: "దయచేసి కొద్ది నిలుపండి.",
    unknownTitle: "మీ ఖాతాను నిర్ధారించలేదు",
    unknownSubtitle: "మళ్లీ ప్రయత్న చేయండి, లేదా ఖాతా పేజీ నుండి కొనసాండి.",
    retryLabel: "మళ్లీ ప్రయత్న",
    actions: {
      find_job: {
        title: "ఉద్యోగం కనుగొనండి",
        description: "మీ నైపుణ్యాలకు సరిపోయే ఉద్యోగాలను చూడండి.",
        aria: "ఉద్యోగం కోసం WhatsApp తెరవండి",
      },
      hire_staff: {
        title: "సిబ్బందిని నియమించండి",
        description: "మీ వ్యాపారానికి సరైన అభ్యర్థులను కనుగొనండి.",
        aria: "సిబ్బంది నియామకం కోసం WhatsApp తెరవండి",
      },
      find_jobs: {
        title: "ఉద్యోగాలను కనుగొనండి",
        description: "మీకు కావలసిన ఉద్యోగాలను వెతక్కండి.",
        aria: "ఉద్యోగాల కోసం WhatsApp తెరవండి",
      },
      profile_jobs: {
        title: "ఉద్యోగ సిఫార్సులు",
        description: "మీ ప్రొఫైల్ నుండి సరిపోయే ఉద్యోగాలను పొందుండి.",
        aria: "ఉద్యోగ సిఫార్సుల కోసం WhatsApp తెరవండి",
      },
      application_status: {
        title: "అప్లికేషన్ స్తితి",
        description: "మీ అప్లికేషన్ల స్తితిని చూడండి.",
        aria: "అప్లికేషన్ స్తితి కోసం WhatsApp తెరవండి",
      },
      seeker_help: {
        title: "సహాయం తో మాట్లాడండి",
        description: "మీ జాబ్ సీకర్ ఖాతాకు సహాయం పొందుండి.",
        aria: "జాబ్ సీకర్ సహాయం కోసం WhatsApp తెరవండి",
      },
      post_job: {
        title: "ఉద్యోగం పోస్ట్ చేయండి",
        description: "ఒక రోల్ పోస్ట్ చేసి నియామకం ప్రారంభించండి.",
        aria: "ఉద్యోగం పోస్ట్ కోసం WhatsApp తెరవండి",
      },
      my_jobs: {
        title: "నా ఉద్యోగ పోస్ట్లు",
        description: "మీరు పోస్ట్ చేసిన ఉద్యోగాలను చూడండి.",
        aria: "నా ఉద్యోగ పోస్ట్ల కోసం WhatsApp తెరవండి",
      },
      employer_applications: {
        title: "వచ్చిన అప్లికేషన్లు",
        description: "మీ ఉద్యోగాలకు వచ్చిన అప్లికేషన్లను చూడండి.",
        aria: "అప్లికేషన్ల కోసం WhatsApp తెరవండి",
      },
      employer_help: {
        title: "సహాయం తో మాట్లాడండి",
        description: "మీ యజమానదారుల ఖాతాకు సహాయం పొందుండి.",
        aria: "యజమానదారుల సహాయం కోసం WhatsApp తెరవండి",
      },
    },
  },
};

const ta: FabCatalog = {
  whatsappFab: {
    openAria: "AsliJobs உடன் WhatsApp-இல் அரட்டையடிக்கவும்",
    openTitle: "AsliJobs உடன் WhatsApp-இல் அரட்டையடிக்கவும்",
    closeAria: "WhatsApp விருப்பங்களை மூடு",
    title: "நாங்கள் உங்களுக்கு எப்படி உதவலாம்?",
    subtitle: "WhatsApp-இல் தொடர ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்.",
    loadingTitle: "உங்கள் கணக்கு சரிபார்க்கப்படுகிறது…",
    loadingSubtitle: "சிறிது காத்திருங்கள்.",
    unknownTitle: "உங்கள் கணக்கை உறுதிசெய்ய முடியவில்லை",
    unknownSubtitle: "மீண்டும் முயற்சிக்கவும்.",
    retryLabel: "மீண்டும் முயற்சி",
    actions: {
      find_job: {
        title: "வேலை தேடுங்கள்",
        description: "உங்கள் திறமைக்கு ஏற்ற வேலைகளைப் பாருங்கள்.",
        aria: "வேலை தேட WhatsApp திறக்கவும்",
      },
      hire_staff: {
        title: "ஊழியர்களை நியமிக்கவும்",
        description: "உங்கள் நிறுவனத்திற்கு ஏற்ற விண்ணப்பதாரர்களைக் கண்டறியுங்கள்.",
        aria: "ஊழியர்களை நியமிக்க WhatsApp திறக்கவும்",
      },
      find_jobs: {
        title: "வேலைகளைத் தேடுங்கள்",
        description: "உங்களுக்கு தேவையான வேலைகளைத் தேடுங்கள்.",
        aria: "வேலைகள் தேட WhatsApp திறக்கவும்",
      },
      profile_jobs: {
        title: "வேலை பரிந்துரைகள்",
        description: "உங்கள் ப்ரொஃபைலில் இருந்து வேலைகள்.",
        aria: "வேலை பரிந்துரைகள் WhatsApp",
      },
      application_status: {
        title: "விண்ணப்ப நிலை",
        description: "உங்கள் விண்ணப்பங்களின் நிலையைப் பாருங்கள்.",
        aria: "விண்ணப்ப நிலை WhatsApp",
      },
      seeker_help: {
        title: "உதவியுடன் பேசுங்கள்",
        description: "உங்கள் வேலை தேடுபவர் கணக்கில் உதவி பெறுங்கள்.",
        aria: "வேலை தேடுபவர் உதவி WhatsApp",
      },
      post_job: {
        title: "வேலையைப் போஸ்ட் செய்யவும்",
        description: "ஒரு பணியைப் போஸ்ட் செய்து நியமனத்தைத் தொடங்கள்.",
        aria: "வேலை போஸ்ட் WhatsApp",
      },
      my_jobs: {
        title: "என் வேலை போஸ்ட்கள்",
        description: "நீங்கள் போஸ்ட் செய்த வேலைகளைப் பாருங்கள்.",
        aria: "என் வேலை போஸ்ட்கள் WhatsApp",
      },
      employer_applications: {
        title: "வந்த விண்ணப்பங்கள்",
        description: "உங்கள் வேலைகளுக்கு வந்த விண்ணப்பங்களைப் பாருங்கள்.",
        aria: "விண்ணப்பங்கள் WhatsApp",
      },
      employer_help: {
        title: "உதவியுடன் பேசுங்கள்",
        description: "உங்கள் முதலாளியாளர் கணக்கில் உதவி பெறுங்கள்.",
        aria: "முதலாளியாளர் உதவி WhatsApp",
      },
    },
  },
};

const kn: FabCatalog = {
  whatsappFab: {
    openAria: "AsliJobs ಜೊತೆ WhatsAppನಲ್ಲಿ ಚಾಟ್ ಮಾಡಿ",
    openTitle: "AsliJobs ಜೊತೆ WhatsAppನಲ್ಲಿ ಚಾಟ್ ಮಾಡಿ",
    closeAria: "WhatsApp ಆಯ್ಕೆಗಳನ್ನು ಮುಚ್ಚಿ",
    title: "ನಾವು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    subtitle: "WhatsAppನಲ್ಲಿ ಮುಂದುವರಿಸಲು ಒಂದು ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ.",
    loadingTitle: "ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಪರಿಶಿಸಲಾಗುತ್ತಿದೆ…",
    loadingSubtitle: "ದಯವಿಟ್ಟು ಕಾಯಿರಿ.",
    unknownTitle: "ನಿಮ್ಮ ಖಾತೆಯನ್ನು ದೃಢಿಕರಿಸಲಾಗಲಿಲ್ಲ",
    unknownSubtitle: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    retryLabel: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    actions: {
      find_job: {
        title: "ಉದ್ಯೋಗ ಹುಡುಕಿ",
        description: "ನಿಮ್ಮ ಕೌಶಲ್ಯಕ್ಕೆ ಹೊಂದುವ ಉದ್ಯೋಗಗಳನ್ನು ನೋಡಿ.",
        aria: "ಉದ್ಯೋಗಕ್ಕಾಗಿ WhatsApp ತೆರೆಯಿರಿ",
      },
      hire_staff: {
        title: "ಸಿಬ್ಬಂದಿ ನೇಮಿಸಿ",
        description: "ನಿಮ್ಮ ವ್ಯವಹಾರಕ್ಕೆ ಸೂಕ್ತ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ಹುಡುಕಿ.",
        aria: "ಸಿಬ್ಬಂದಿ ನೇಮಕಾತಿಗಾಗಿ WhatsApp ತೆರೆಯಿರಿ",
      },
      find_jobs: {
        title: "ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ",
        description: "ನಿಮಗೆ ಬೇಕಾಗಿರುವ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ.",
        aria: "ಉದ್ಯೋಗಗಳಿಗಾಗಿ WhatsApp ತೆರೆಯಿರಿ",
      },
      profile_jobs: {
        title: "ಉದ್ಯೋಗ ಶಿಫಾರಸುಗಳು",
        description: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ನಿಂದ ಉದ್ಯೋಗಗಳನ್ನು ಪಡೆಯಿರಿ.",
        aria: "ಉದ್ಯೋಗ ಶಿಫಾರಸುಗಳಿಗಾಗಿ WhatsApp ತೆರೆಯಿರಿ",
      },
      application_status: {
        title: "ಅರ್ಜಿ ಸ್ಥಿತಿ",
        description: "ನಿಮ್ಮ ಅರ್ಜಿಗಳ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶಿಸಿ.",
        aria: "ಅರ್ಜಿ ಸ್ಥಿತಿಗಾಗಿ WhatsApp ತೆರೆಯಿರಿ",
      },
      seeker_help: {
        title: "ಸಹಾಯಕ್ಕೆ ಮಾತನಾಡಿ",
        description: "ನಿಮ್ಮ ಉದ್ಯೋಗವನ್ ಖಾತೆಗೆ ಸಹಾಯ ಪಡೆಯಿರಿ.",
        aria: "ಉದ್ಯೋಗವನ್ ಸಹಾಯಕ್ಕಾಗಿ WhatsApp ತೆರೆಯಿರಿ",
      },
      post_job: {
        title: "ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಮಾಡಿ",
        description: "ಒಂದು ಪದವಿಯನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ ನೇಮಕಾತಿ ಪ್ರಾರಂಭಿಸಿ.",
        aria: "ಉದ್ಯೋಗ ಪೋಸ್ಟ್ಗಾಗಿ WhatsApp ತೆರೆಯಿರಿ",
      },
      my_jobs: {
        title: "ನನ್ನ ಉದ್ಯೋಗ ಪೋಸ್ಟ್ಗಳು",
        description: "ನಿಾವು ಪೋಸ್ಟ್ ಮಾಡಿದ ಉದ್ಯೋಗಗಳನ್ನು ನೋಡಿ.",
        aria: "ನನ್ನ ಉದ್ಯೋಗ ಪೋಸ್ಟ್ಗಳಿಗಾಗಿ WhatsApp ತೆರೆಯಿರಿ",
      },
      employer_applications: {
        title: "ಬಂದ ಅರ್ಜಿಗಳು",
        description: "ನಿಮ್ಮ ಉದ್ಯೋಗಗಳಿಗೆ ಬಂದ ಅರ್ಜಿಗಳನ್ನು ನೋಡಿ.",
        aria: "ಅರ್ಜಿಗಳಿಗಾಗಿ WhatsApp ತೆರೆಯಿರಿ",
      },
      employer_help: {
        title: "ಸಹಾಯಕ್ಕೆ ಮಾತನಾಡಿ",
        description: "ನಿಮ್ಮ ನಿಯೊಕ್ತಾರ ಖಾತೆಗೆ ಸಹಾಯ ಪಡೆಯಿರಿ.",
        aria: "ನಿಯೊಕ್ತಾರ ಸಹಾಯಕ್ಕಾಗಿ WhatsApp ತೆರೆಯಿರಿ",
      },
    },
  },
};

const ml: FabCatalog = {
  whatsappFab: {
    openAria: "AsliJobs-നൊപ്പം WhatsApp-ൽ ചാറ്റ് ചെയ്യുക",
    openTitle: "AsliJobs-നൊപ്പം WhatsApp-ൽ ചാറ്റ് ചെയ്യുക",
    closeAria: "WhatsApp ഓപ്ഷനുകൾ അടയ്ക്കുക",
    title: "ഞങ്ങൾക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാനാകും?",
    subtitle: "WhatsApp-ൽ തുടരാൻ ഒരു ഓപ്ഷൻ തിരഞ്ഞെടുക്കുക.",
    loadingTitle: "നിങ്ങളുടെ അക്കൗണ്ട് പരിശോധിക്കുന്നു…",
    loadingSubtitle: "ദയവായി കാത്തിരിക്കൂ.",
    unknownTitle: "അക്കൗണ്ട് ലഭിച്ചാലായില്ല",
    unknownSubtitle: "വീണ്ടും ശ്രമിക്കൂ.",
    retryLabel: "വീണ്ടും ശ്രമിക്കുക",
    actions: {
      find_job: {
        title: "ജോലി കണ്ടെത്തുക",
        description: "നിങ്ങളുടെ കഴിവുകളുമായി പൊരുത്തപ്പെടുന്ന ജോലികൾ കാണുക.",
        aria: "ജോലിക്കായി WhatsApp തുറക്കുക",
      },
      hire_staff: {
        title: "ജീവനക്കാരെ നിയമിക്കുക",
        description: "നിങ്ങളുടെ സ്ഥാപനത്തിന്ന് അനുയോജ്യരായ ഉദ്യോഗാർത്ഥികളെ കണ്ടെത്തുക.",
        aria: "നിയമനത്തിനായി WhatsApp തുറക്കുക",
      },
      find_jobs: {
        title: "ജോലികൾ കണ്ടെത്തുക",
        description: "നിങ്ങൾക്ക് ആവശ്യമായ ജോലികൾ തിരയുക.",
        aria: "ജോലികൾക്കായി WhatsApp തുറക്കുക",
      },
      profile_jobs: {
        title: "ജോലി ശിപാര്ശങ്ങൾ",
        description: "നിങ്ങളുടെ പ്രൊഫൈലില് നിന്നിന്നിന്ന ജോലികൾ നൽകൂ.",
        aria: "ജോലി ശിപാര്ശങ്ങൾക്കായി WhatsApp തുറക്കുക",
      },
      application_status: {
        title: "അപേക്ഷ നല",
        description: "നിങ്ങളുടെ അപേക്ഷകളുടെ നല പരിശോധിക്കുക.",
        aria: "അപേക്ഷ നലയ്ക്കായി WhatsApp തുറക്കുക",
      },
      seeker_help: {
        title: "സഹായത്തിനോടു സംസാരിക്കുക",
        description: "നിങ്ങളുടെ ജോലിതേടുകാരൻ അക്കൗണ്ടില് സഹായം നൽകൂ.",
        aria: "ജോലിതേടുകാരൻ സഹായത്തിനു WhatsApp തുറക്കുക",
      },
      post_job: {
        title: "ജോലി പോസ്റ്റ് ചെയ്യുക",
        description: "ഒരു റോൾ പോസ്റ്റ് ചെയ്തു നിയമനം ആരംഭിക്കുക.",
        aria: "ജോലി പോസ്റ്റിനു WhatsApp തുറക്കുക",
      },
      my_jobs: {
        title: "എന്റെ ജോലി പോസ്റ്റുകൾ",
        description: "നിങ്ങൾ പോസ്റ്റ് ചെയ്ത ജോലികൾ കാണുക.",
        aria: "എന്റെ ജോലി പോസ്റ്റുകൾ WhatsApp തുറക്കുക",
      },
      employer_applications: {
        title: "ലഭിച്ച അപേക്ഷകൾ",
        description: "നിങ്ങളുടെ ജോലികൾക്ക് ലഭിച്ച അപേക്ഷകൾ കാണുക.",
        aria: "അപേക്ഷകൾക്കായി WhatsApp തുറക്കുക",
      },
      employer_help: {
        title: "സഹായത്തിനോടു സംസാരിക്കുക",
        description: "നിങ്ങളുടെ തൊഴില്മുകൾ അക്കൗണ്ടില് സഹായം നൽകൂ.",
        aria: "തൊഴില്മുകൾ സഹായത്തിനു WhatsApp തുറക്കുക",
      },
    },
  },
};

export const whatsappFabBundle = { en, hi, te, ta, kn, ml } as const;
