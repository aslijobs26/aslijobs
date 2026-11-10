type MessageShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : MessageShape<T[K]>;
};

/** Candidate answer to an employer offer on the applied-job detail page. */
const en = {
  seeker: {
    applicationDetail: {
      offerResponse: {
        prompt: "Please let the employer know if you accept this offer.",
        accept: "Accept offer",
        decline: "Decline offer",
        submitting: "Sending…",
        acceptConfirm:
          "Accept this offer? The employer will be notified. You cannot change your answer later.",
        declineConfirm:
          "Decline this offer? The employer will be notified. You cannot change your answer later.",
        acceptedToast: "Offer accepted. The employer has been notified.",
        declinedToast: "Offer declined. The employer has been notified.",
        acceptedStatus: "You accepted this offer on {date}.",
        declinedStatus: "You declined this offer on {date}.",
      },
    },
  },
};

const hi: MessageShape<typeof en> = {
  seeker: {
    applicationDetail: {
      offerResponse: {
        prompt: "कृपया नियोक्ता को बताएं कि क्या आप यह ऑफ़र स्वीकार करते हैं।",
        accept: "ऑफ़र स्वीकार करें",
        decline: "ऑफ़र अस्वीकार करें",
        submitting: "भेजा जा रहा है…",
        acceptConfirm:
          "क्या यह ऑफ़र स्वीकार करना है? नियोक्ता को सूचित किया जाएगा। बाद में आप अपना उत्तर नहीं बदल सकेंगे।",
        declineConfirm:
          "क्या यह ऑफ़र अस्वीकार करना है? नियोक्ता को सूचित किया जाएगा। बाद में आप अपना उत्तर नहीं बदल सकेंगे।",
        acceptedToast: "ऑफ़र स्वीकार किया गया। नियोक्ता को सूचित कर दिया गया है।",
        declinedToast: "ऑफ़र अस्वीकार किया गया। नियोक्ता को सूचित कर दिया गया है।",
        acceptedStatus: "आपने {date} को यह ऑफ़र स्वीकार किया।",
        declinedStatus: "आपने {date} को यह ऑफ़र अस्वीकार किया।",
      },
    },
  },
};

const te: MessageShape<typeof en> = {
  seeker: {
    applicationDetail: {
      offerResponse: {
        prompt: "ఈ ఆఫర్‌ను మీరు అంగీకరిస్తున్నారో లేదో యజమానికి తెలియజేయండి.",
        accept: "ఆఫర్ అంగీకరించండి",
        decline: "ఆఫర్ తిరస్కరించండి",
        submitting: "పంపుతోంది…",
        acceptConfirm:
          "ఈ ఆఫర్‌ను అంగీకరించాలా? యజమానికి తెలియజేయబడుతుంది. తర్వాత మీ సమాధానాన్ని మార్చలేరు.",
        declineConfirm:
          "ఈ ఆఫర్‌ను తిరస్కరించాలా? యజమానికి తెలియజేయబడుతుంది. తర్వాత మీ సమాధానాన్ని మార్చలేరు.",
        acceptedToast: "ఆఫర్ అంగీకరించబడింది. యజమానికి తెలియజేయబడింది.",
        declinedToast: "ఆఫర్ తిరస్కరించబడింది. యజమానికి తెలియజేయబడింది.",
        acceptedStatus: "మీరు {date}న ఈ ఆఫర్‌ను అంగీకరించారు.",
        declinedStatus: "మీరు {date}న ఈ ఆఫర్‌ను తిరస్కరించారు.",
      },
    },
  },
};

const ta: MessageShape<typeof en> = {
  seeker: {
    applicationDetail: {
      offerResponse: {
        prompt: "இந்த ஆஃபரை ஏற்கிறீர்களா என்பதை முதலாளிக்குத் தெரிவிக்கவும்.",
        accept: "ஆஃபரை ஏற்கவும்",
        decline: "ஆஃபரை நிராகரிக்கவும்",
        submitting: "அனுப்புகிறது…",
        acceptConfirm:
          "இந்த ஆஃபரை ஏற்கவா? முதலாளிக்குத் தெரிவிக்கப்படும். பின்னர் உங்கள் பதிலை மாற்ற முடியாது.",
        declineConfirm:
          "இந்த ஆஃபரை நிராகரிக்கவா? முதலாளிக்குத் தெரிவிக்கப்படும். பின்னர் உங்கள் பதிலை மாற்ற முடியாது.",
        acceptedToast: "ஆஃபர் ஏற்கப்பட்டது. முதலாளிக்குத் தெரிவிக்கப்பட்டது.",
        declinedToast: "ஆஃபர் நிராகரிக்கப்பட்டது. முதலாளிக்குத் தெரிவிக்கப்பட்டது.",
        acceptedStatus: "நீங்கள் {date} அன்று இந்த ஆஃபரை ஏற்றீர்கள்.",
        declinedStatus: "நீங்கள் {date} அன்று இந்த ஆஃபரை நிராகரித்தீர்கள்.",
      },
    },
  },
};

const kn: MessageShape<typeof en> = {
  seeker: {
    applicationDetail: {
      offerResponse: {
        prompt: "ಈ ಆಫರ್ ಅನ್ನು ನೀವು ಒಪ್ಪುತ್ತೀರಾ ಎಂದು ಉದ್ಯೋಗದಾತರಿಗೆ ತಿಳಿಸಿ.",
        accept: "ಆಫರ್ ಒಪ್ಪಿಕೊಳ್ಳಿ",
        decline: "ಆಫರ್ ನಿರಾಕರಿಸಿ",
        submitting: "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…",
        acceptConfirm:
          "ಈ ಆಫರ್ ಒಪ್ಪಿಕೊಳ್ಳಬೇಕೇ? ಉದ್ಯೋಗದಾತರಿಗೆ ತಿಳಿಸಲಾಗುತ್ತದೆ. ನಂತರ ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಬದಲಾಯಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.",
        declineConfirm:
          "ಈ ಆಫರ್ ನಿರಾಕರಿಸಬೇಕೇ? ಉದ್ಯೋಗದಾತರಿಗೆ ತಿಳಿಸಲಾಗುತ್ತದೆ. ನಂತರ ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಬದಲಾಯಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.",
        acceptedToast: "ಆಫರ್ ಒಪ್ಪಿಕೊಳ್ಳಲಾಗಿದೆ. ಉದ್ಯೋಗದಾತರಿಗೆ ತಿಳಿಸಲಾಗಿದೆ.",
        declinedToast: "ಆಫರ್ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಉದ್ಯೋಗದಾತರಿಗೆ ತಿಳಿಸಲಾಗಿದೆ.",
        acceptedStatus: "ನೀವು {date} ರಂದು ಈ ಆಫರ್ ಒಪ್ಪಿಕೊಂಡಿದ್ದೀರಿ.",
        declinedStatus: "ನೀವು {date} ರಂದು ಈ ಆಫರ್ ನಿರಾಕರಿಸಿದ್ದೀರಿ.",
      },
    },
  },
};

const ml: MessageShape<typeof en> = {
  seeker: {
    applicationDetail: {
      offerResponse: {
        prompt: "ഈ ഓഫർ നിങ്ങൾ സ്വീകരിക്കുന്നുണ്ടോ എന്ന് തൊഴിലുടമയെ അറിയിക്കുക.",
        accept: "ഓഫർ സ്വീകരിക്കുക",
        decline: "ഓഫർ നിരസിക്കുക",
        submitting: "അയയ്ക്കുന്നു…",
        acceptConfirm:
          "ഈ ഓഫർ സ്വീകരിക്കണോ? തൊഴിലുടമയെ അറിയിക്കും. പിന്നീട് നിങ്ങളുടെ മറുപടി മാറ്റാനാകില്ല.",
        declineConfirm:
          "ഈ ഓഫർ നിരസിക്കണോ? തൊഴിലുടമയെ അറിയിക്കും. പിന്നീട് നിങ്ങളുടെ മറുപടി മാറ്റാനാകില്ല.",
        acceptedToast: "ഓഫർ സ്വീകരിച്ചു. തൊഴിലുടമയെ അറിയിച്ചു.",
        declinedToast: "ഓഫർ നിരസിച്ചു. തൊഴിലുടമയെ അറിയിച്ചു.",
        acceptedStatus: "നിങ്ങൾ {date}-ന് ഈ ഓഫർ സ്വീകരിച്ചു.",
        declinedStatus: "നിങ്ങൾ {date}-ന് ഈ ഓഫർ നിരസിച്ചു.",
      },
    },
  },
};

export const seekerOfferResponseBundle = { en, hi, te, ta, kn, ml } as const;
