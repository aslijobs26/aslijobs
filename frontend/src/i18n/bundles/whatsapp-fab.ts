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
};

export const whatsappFabBundle = { en, hi, te, ta, kn, ml } as const;
