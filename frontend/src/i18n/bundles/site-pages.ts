type MessageShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : MessageShape<T[K]>;
};

const en = {
  sitePages: {
    resourcesTitle: "Resources",
    resourcesDescription:
      "Find helpful answers and guides for job seekers and employers on AsliJobs.",
    browseFaqs: "Browse FAQs",
    sitemapDescription: "Browse the public AsliJobs pages from one place.",
    contactTitle: "Contact Us",
    contactDescription:
      "Reach AsliJobs support for job search, hiring, safety, and account help.",
    email: "Email",
    phone: "Phone / WhatsApp",
    address: "Address",
    hours: "Working Hours",
    hoursValue: "24 hours",
    whatsapp: "WhatsApp Support",
    addressValue:
      "3rd Floor, SV Chambers, Plot No. 193, Kavuri Hills, Madhapur, Hyderabad - 500081.",
  },
} as const;

const hi: MessageShape<typeof en> = {
  sitePages: {
    resourcesTitle: "संसाधन",
    resourcesDescription:
      "AsliJobs पर नौकरी खोजने वालों और नियोक्ताओं के लिए उपयोगी जवाब और गाइड पाएँ।",
    browseFaqs: "अक्सर पूछे जाने वाले प्रश्न देखें",
    sitemapDescription: "AsliJobs के सार्वजनिक पेज एक जगह देखें।",
    contactTitle: "हमसे संपर्क करें",
    contactDescription:
      "नौकरी खोज, भर्ती, सुरक्षा और खाते की मदद के लिए AsliJobs सपोर्ट से संपर्क करें।",
    email: "ईमेल",
    phone: "फ़ोन / WhatsApp",
    address: "पता",
    hours: "कार्य समय",
    hoursValue: "24 घंटे",
    whatsapp: "WhatsApp सहायता",
    addressValue:
      "3rd Floor, SV Chambers, Plot No. 193, Kavuri Hills, Madhapur, Hyderabad - 500081.",
  },
};

const te: MessageShape<typeof en> = {
  sitePages: {
    resourcesTitle: "వనరులు",
    resourcesDescription:
      "AsliJobsలో ఉద్యోగార్థులు మరియు యజమానుల కోసం ఉపయోగకరమైన సమాధానాలు మరియు గైడ్‌లు కనుగొనండి.",
    browseFaqs: "తరచుగా అడిగే ప్రశ్నలు చూడండి",
    sitemapDescription: "AsliJobs పబ్లిక్ పేజీలను ఒకే చోట నుంచి చూడండి.",
    contactTitle: "మమ్మల్ని సంప్రదించండి",
    contactDescription:
      "ఉద్యోగ శోధన, నియామకం, భద్రత మరియు అకౌంట్ సహాయం కోసం AsliJobs సపోర్ట్‌ను సంప్రదించండి.",
    email: "ఇమెయిల్",
    phone: "ఫోన్ / WhatsApp",
    address: "చిరునామా",
    hours: "పని సమయం",
    hoursValue: "24 గంటలు",
    whatsapp: "WhatsApp మద్దతు",
    addressValue:
      "3rd Floor, SV Chambers, Plot No. 193, Kavuri Hills, Madhapur, Hyderabad - 500081.",
  },
};

const ta: MessageShape<typeof en> = {
  sitePages: {
    resourcesTitle: "வளங்கள்",
    resourcesDescription:
      "AsliJobs-ல் வேலை தேடுபவர்கள் மற்றும் முதலாளிகளுக்கான பயனுள்ள பதில்களையும் வழிகாட்டிகளையும் காணுங்கள்.",
    browseFaqs: "அடிக்கடி கேட்கப்படும் கேள்விகளைப் பாருங்கள்",
    sitemapDescription: "AsliJobs பொது பக்கங்களை ஒரே இடத்தில் பாருங்கள்.",
    contactTitle: "எங்களைத் தொடர்பு கொள்ளுங்கள்",
    contactDescription:
      "வேலை தேடல், பணியமர்த்தல், பாதுகாப்பு மற்றும் கணக்கு உதவிக்கு AsliJobs ஆதரவைத் தொடர்பு கொள்ளுங்கள்.",
    email: "மின்னஞ்சல்",
    phone: "தொலைபேசி / WhatsApp",
    address: "முகவரி",
    hours: "பணி நேரம்",
    hoursValue: "24 மணி",
    whatsapp: "WhatsApp ஆதரவு",
    addressValue:
      "3rd Floor, SV Chambers, Plot No. 193, Kavuri Hills, Madhapur, Hyderabad - 500081.",
  },
};

const kn: MessageShape<typeof en> = {
  sitePages: {
    resourcesTitle: "ಸಂಪನ್ಮೂಲಗಳು",
    resourcesDescription:
      "AsliJobs ನಲ್ಲಿ ಉದ್ಯೋಗಾರ್ಥಿಗಳು ಮತ್ತು ಉದ್ಯೋಗದಾತರಿಗೆ ಉಪಯುಕ್ತ ಉತ್ತರಗಳು ಮತ್ತು ಮಾರ್ಗದರ್ಶಿಗಳನ್ನು ಹುಡುಕಿ.",
    browseFaqs: "ಪದೇ ಪದೇ ಕೇಳುವ ಪ್ರಶ್ನೆಗಳನ್ನು ನೋಡಿ",
    sitemapDescription: "AsliJobs ಸಾರ್ವಜನಿಕ ಪುಟಗಳನ್ನು ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ ನೋಡಿ.",
    contactTitle: "ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ",
    contactDescription:
      "ಉದ್ಯೋಗ ಹುಡುಕಾಟ, ನೇಮಕಾತಿ, ಭದ್ರತೆ ಮತ್ತು ಖಾತೆ ಸಹಾಯಕ್ಕಾಗಿ AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    email: "ಇಮೇಲ್",
    phone: "ಫೋನ್ / WhatsApp",
    address: "ವಿಳಾಸ",
    hours: "ಕೆಲಸದ ಸಮಯ",
    hoursValue: "24 ಗಂಟೆ",
    whatsapp: "WhatsApp ಬೆಂಬಲ",
    addressValue:
      "3rd Floor, SV Chambers, Plot No. 193, Kavuri Hills, Madhapur, Hyderabad - 500081.",
  },
};

const ml: MessageShape<typeof en> = {
  sitePages: {
    resourcesTitle: "വിഭവങ്ങൾ",
    resourcesDescription:
      "AsliJobs-ൽ തൊഴിൽ അന്വേഷകർക്കും തൊഴിലുടമകൾക്കും ഉപയോഗപ്രദമായ ഉത്തരങ്ങളും ഗൈഡുകളും കണ്ടെത്തുക.",
    browseFaqs: "പതിവ് ചോദ്യങ്ങൾ കാണുക",
    sitemapDescription: "AsliJobs പൊതു പേജുകൾ ഒരിടത്ത് നിന്ന് കാണുക.",
    contactTitle: "ഞങ്ങളെ ബന്ധപ്പെടുക",
    contactDescription:
      "ജോലി തിരയൽ, നിയമനം, സുരക്ഷ, അക്കൗണ്ട് സഹായം എന്നിവയ്ക്ക് AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടുക.",
    email: "ഇമെയിൽ",
    phone: "ഫോൺ / WhatsApp",
    address: "വിലാസം",
    hours: "ജോലി സമയം",
    hoursValue: "24 മണിക്കൂർ",
    whatsapp: "WhatsApp പിന്തുണ",
    addressValue:
      "3rd Floor, SV Chambers, Plot No. 193, Kavuri Hills, Madhapur, Hyderabad - 500081.",
  },
};

export const sitePagesBundle = { en, hi, te, ta, kn, ml } as const;
