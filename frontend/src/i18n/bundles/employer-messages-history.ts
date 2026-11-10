type MessageShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : MessageShape<T[K]>;
};

/** Starred / archived / muted threads, bulk read state and CSV export. */
const en = {
  employer: {
    messagesPage: {
      tabs: {
        archived: "Archived",
      },
      list: {
        starredEmptyTitle: "No starred conversations.",
        starredEmptyDesc:
          "Star important candidate threads from the conversation menu to find them quickly.",
        archivedEmptyTitle: "No archived conversations.",
        archivedEmptyDesc:
          "Archived conversations are hidden from All Conversations. Their notification history is kept.",
        starredLabel: "Starred",
        mutedLabel: "Muted",
        selectConversation: "Select conversation with {name}",
      },
      thread: {
        mutedNote:
          "Muted: WhatsApp, email and push alerts are off for this conversation. Notification history is still recorded.",
        archivedNote:
          "Archived: hidden from All Conversations. Unarchive to move it back.",
      },
      actions: {
        star: "Star conversation",
        unstar: "Remove star",
        archive: "Archive conversation",
        unarchive: "Unarchive conversation",
        mute: "Mute conversation",
        unmute: "Unmute conversation",
        starSuccess: "Conversation starred.",
        unstarSuccess: "Star removed.",
        archiveSuccess: "Conversation archived.",
        unarchiveSuccess: "Conversation moved back to All Conversations.",
        muteSuccess: "Conversation muted.",
        unmuteSuccess: "Conversation unmuted.",
        updateError: "Couldn't update this conversation.",
      },
      bulk: {
        select: "Select",
        cancel: "Cancel",
        selectedCount: "{count} selected",
        selectAll: "Select all",
        clearSelection: "Clear selection",
        markRead: "Mark as read",
        markUnread: "Mark as unread",
        readSuccess: "{count} conversation(s) marked as read.",
        unreadSuccess: "{count} conversation(s) marked as unread.",
        skipped: "{count} conversation(s) could not be updated.",
        error: "Couldn't update the selected conversations.",
        limit: "You can select up to {max} conversations at a time.",
      },
      export: {
        button: "Export CSV",
        exporting: "Exporting…",
        success: "Messages history exported.",
        error: "Couldn't export Messages history.",
      },
      options: {
        offer: {
          accepted: "Offer Accepted",
          declined: "Offer Declined",
        },
        candidateAction: {
          offerAccepted: "Offer Accepted",
          offerDeclined: "Offer Declined",
        },
      },
      badges: {
        offerAccepted: "Offer Accepted",
        offerDeclined: "Offer Declined",
      },
    },
  },
};

type EmployerMessagesHistoryBundle = MessageShape<typeof en>;

const hi: EmployerMessagesHistoryBundle = {
  employer: {
    messagesPage: {
      tabs: {
        archived: "संग्रहित",
      },
      list: {
        starredEmptyTitle: "कोई तारांकित बातचीत नहीं।",
        starredEmptyDesc:
          "महत्वपूर्ण उम्मीदवार बातचीत को जल्दी ढूँढने के लिए बातचीत मेनू से तारांकित करें।",
        archivedEmptyTitle: "कोई संग्रहित बातचीत नहीं।",
        archivedEmptyDesc:
          "संग्रहित बातचीत सभी बातचीत में नहीं दिखती। उनका सूचना इतिहास सुरक्षित रहता है।",
        starredLabel: "तारांकित",
        mutedLabel: "म्यूट",
        selectConversation: "{name} के साथ बातचीत चुनें",
      },
      thread: {
        mutedNote:
          "म्यूट: इस बातचीत के लिए WhatsApp, ईमेल और पुश अलर्ट बंद हैं। सूचना इतिहास फिर भी दर्ज होता है।",
        archivedNote:
          "संग्रहित: सभी बातचीत से छिपी हुई। वापस लाने के लिए असंग्रहित करें।",
      },
      actions: {
        star: "बातचीत तारांकित करें",
        unstar: "तारा हटाएँ",
        archive: "बातचीत संग्रहित करें",
        unarchive: "बातचीत असंग्रहित करें",
        mute: "बातचीत म्यूट करें",
        unmute: "बातचीत अनम्यूट करें",
        starSuccess: "बातचीत तारांकित की गई।",
        unstarSuccess: "तारा हटाया गया।",
        archiveSuccess: "बातचीत संग्रहित की गई।",
        unarchiveSuccess: "बातचीत वापस सभी बातचीत में ले जाई गई।",
        muteSuccess: "बातचीत म्यूट की गई।",
        unmuteSuccess: "बातचीत अनम्यूट की गई।",
        updateError: "यह बातचीत अपडेट नहीं हो सकी।",
      },
      bulk: {
        select: "चुनें",
        cancel: "रद्द करें",
        selectedCount: "{count} चुनी गईं",
        selectAll: "सभी चुनें",
        clearSelection: "चयन हटाएँ",
        markRead: "पढ़ा हुआ चिह्नित करें",
        markUnread: "अपठित चिह्नित करें",
        readSuccess: "{count} बातचीत पढ़ी हुई चिह्नित की गईं।",
        unreadSuccess: "{count} बातचीत अपठित चिह्नित की गईं।",
        skipped: "{count} बातचीत अपडेट नहीं हो सकीं।",
        error: "चुनी गई बातचीत अपडेट नहीं हो सकीं।",
        limit: "आप एक बार में अधिकतम {max} बातचीत चुन सकते हैं।",
      },
      export: {
        button: "CSV निर्यात करें",
        exporting: "निर्यात हो रहा है…",
        success: "संदेश इतिहास निर्यात किया गया।",
        error: "संदेश इतिहास निर्यात नहीं हो सका।",
      },
      options: {
        offer: {
          accepted: "ऑफ़र स्वीकार किया",
          declined: "ऑफ़र अस्वीकार किया",
        },
        candidateAction: {
          offerAccepted: "ऑफ़र स्वीकार किया",
          offerDeclined: "ऑफ़र अस्वीकार किया",
        },
      },
      badges: {
        offerAccepted: "ऑफ़र स्वीकार",
        offerDeclined: "ऑफ़र अस्वीकार",
      },
    },
  },
};

const te: EmployerMessagesHistoryBundle = {
  employer: {
    messagesPage: {
      tabs: {
        archived: "ఆర్కైవ్ చేసినవి",
      },
      list: {
        starredEmptyTitle: "స్టార్ చేసిన సంభాషణలు లేవు.",
        starredEmptyDesc:
          "ముఖ్యమైన అభ్యర్థి సంభాషణలను త్వరగా కనుగొనేందుకు సంభాషణ మెనూ నుండి స్టార్ చేయండి.",
        archivedEmptyTitle: "ఆర్కైవ్ చేసిన సంభాషణలు లేవు.",
        archivedEmptyDesc:
          "ఆర్కైవ్ చేసిన సంభాషణలు అన్ని సంభాషణలలో కనిపించవు. వాటి నోటిఫికేషన్ చరిత్ర భద్రంగా ఉంటుంది.",
        starredLabel: "స్టార్ చేసింది",
        mutedLabel: "మ్యూట్",
        selectConversation: "{name}తో సంభాషణను ఎంచుకోండి",
      },
      thread: {
        mutedNote:
          "మ్యూట్: ఈ సంభాషణకు WhatsApp, ఇమెయిల్ మరియు పుష్ అలర్ట్‌లు ఆఫ్‌లో ఉన్నాయి. నోటిఫికేషన్ చరిత్ర ఇంకా నమోదవుతుంది.",
        archivedNote:
          "ఆర్కైవ్: అన్ని సంభాషణల నుండి దాచబడింది. తిరిగి తీసుకురావడానికి అన్‌ఆర్కైవ్ చేయండి.",
      },
      actions: {
        star: "సంభాషణను స్టార్ చేయండి",
        unstar: "స్టార్ తొలగించండి",
        archive: "సంభాషణను ఆర్కైవ్ చేయండి",
        unarchive: "సంభాషణను అన్‌ఆర్కైవ్ చేయండి",
        mute: "సంభాషణను మ్యూట్ చేయండి",
        unmute: "సంభాషణను అన్‌మ్యూట్ చేయండి",
        starSuccess: "సంభాషణ స్టార్ చేయబడింది.",
        unstarSuccess: "స్టార్ తొలగించబడింది.",
        archiveSuccess: "సంభాషణ ఆర్కైవ్ చేయబడింది.",
        unarchiveSuccess: "సంభాషణ తిరిగి అన్ని సంభాషణలకు తరలించబడింది.",
        muteSuccess: "సంభాషణ మ్యూట్ చేయబడింది.",
        unmuteSuccess: "సంభాషణ అన్‌మ్యూట్ చేయబడింది.",
        updateError: "ఈ సంభాషణను అప్‌డేట్ చేయలేకపోయాం.",
      },
      bulk: {
        select: "ఎంచుకోండి",
        cancel: "రద్దు చేయండి",
        selectedCount: "{count} ఎంచుకున్నారు",
        selectAll: "అన్నీ ఎంచుకోండి",
        clearSelection: "ఎంపిక తొలగించండి",
        markRead: "చదివినట్లు గుర్తించండి",
        markUnread: "చదవనట్లు గుర్తించండి",
        readSuccess: "{count} సంభాషణలు చదివినట్లు గుర్తించబడ్డాయి.",
        unreadSuccess: "{count} సంభాషణలు చదవనట్లు గుర్తించబడ్డాయి.",
        skipped: "{count} సంభాషణలను అప్‌డేట్ చేయలేకపోయాం.",
        error: "ఎంచుకున్న సంభాషణలను అప్‌డేట్ చేయలేకపోయాం.",
        limit: "ఒకేసారి గరిష్ఠంగా {max} సంభాషణలను ఎంచుకోవచ్చు.",
      },
      export: {
        button: "CSV ఎగుమతి",
        exporting: "ఎగుమతి అవుతోంది…",
        success: "సందేశాల చరిత్ర ఎగుమతి చేయబడింది.",
        error: "సందేశాల చరిత్రను ఎగుమతి చేయలేకపోయాం.",
      },
      options: {
        offer: {
          accepted: "ఆఫర్ అంగీకరించారు",
          declined: "ఆఫర్ తిరస్కరించారు",
        },
        candidateAction: {
          offerAccepted: "ఆఫర్ అంగీకరించారు",
          offerDeclined: "ఆఫర్ తిరస్కరించారు",
        },
      },
      badges: {
        offerAccepted: "ఆఫర్ అంగీకారం",
        offerDeclined: "ఆఫర్ తిరస్కరణ",
      },
    },
  },
};

const ta: EmployerMessagesHistoryBundle = {
  employer: {
    messagesPage: {
      tabs: {
        archived: "காப்பகப்படுத்தியவை",
      },
      list: {
        starredEmptyTitle: "நட்சத்திரமிட்ட உரையாடல்கள் இல்லை.",
        starredEmptyDesc:
          "முக்கியமான விண்ணப்பதாரர் உரையாடல்களை விரைவாகக் கண்டறிய உரையாடல் மெனுவிலிருந்து நட்சத்திரமிடுங்கள்.",
        archivedEmptyTitle: "காப்பகப்படுத்திய உரையாடல்கள் இல்லை.",
        archivedEmptyDesc:
          "காப்பகப்படுத்திய உரையாடல்கள் அனைத்து உரையாடல்களில் காட்டப்படாது. அவற்றின் அறிவிப்பு வரலாறு பாதுகாக்கப்படும்.",
        starredLabel: "நட்சத்திரமிட்டது",
        mutedLabel: "முடக்கப்பட்டது",
        selectConversation: "{name} உடனான உரையாடலைத் தேர்ந்தெடுக்கவும்",
      },
      thread: {
        mutedNote:
          "முடக்கப்பட்டது: இந்த உரையாடலுக்கு WhatsApp, மின்னஞ்சல் மற்றும் புஷ் அறிவிப்புகள் அணைக்கப்பட்டுள்ளன. அறிவிப்பு வரலாறு தொடர்ந்து பதிவாகும்.",
        archivedNote:
          "காப்பகப்படுத்தப்பட்டது: அனைத்து உரையாடல்களிலிருந்து மறைக்கப்பட்டுள்ளது. மீண்டும் கொண்டுவர காப்பகத்திலிருந்து நீக்கவும்.",
      },
      actions: {
        star: "உரையாடலை நட்சத்திரமிடு",
        unstar: "நட்சத்திரத்தை நீக்கு",
        archive: "உரையாடலைக் காப்பகப்படுத்து",
        unarchive: "காப்பகத்திலிருந்து நீக்கு",
        mute: "உரையாடலை முடக்கு",
        unmute: "முடக்கத்தை நீக்கு",
        starSuccess: "உரையாடல் நட்சத்திரமிடப்பட்டது.",
        unstarSuccess: "நட்சத்திரம் நீக்கப்பட்டது.",
        archiveSuccess: "உரையாடல் காப்பகப்படுத்தப்பட்டது.",
        unarchiveSuccess: "உரையாடல் மீண்டும் அனைத்து உரையாடல்களுக்கு நகர்த்தப்பட்டது.",
        muteSuccess: "உரையாடல் முடக்கப்பட்டது.",
        unmuteSuccess: "உரையாடல் முடக்கம் நீக்கப்பட்டது.",
        updateError: "இந்த உரையாடலைப் புதுப்பிக்க முடியவில்லை.",
      },
      bulk: {
        select: "தேர்ந்தெடு",
        cancel: "ரத்துசெய்",
        selectedCount: "{count} தேர்ந்தெடுக்கப்பட்டன",
        selectAll: "அனைத்தையும் தேர்ந்தெடு",
        clearSelection: "தேர்வை அழி",
        markRead: "படித்ததாகக் குறி",
        markUnread: "படிக்காததாகக் குறி",
        readSuccess: "{count} உரையாடல்கள் படித்ததாகக் குறிக்கப்பட்டன.",
        unreadSuccess: "{count} உரையாடல்கள் படிக்காததாகக் குறிக்கப்பட்டன.",
        skipped: "{count} உரையாடல்களைப் புதுப்பிக்க முடியவில்லை.",
        error: "தேர்ந்தெடுத்த உரையாடல்களைப் புதுப்பிக்க முடியவில்லை.",
        limit: "ஒரே நேரத்தில் அதிகபட்சம் {max} உரையாடல்களைத் தேர்ந்தெடுக்கலாம்.",
      },
      export: {
        button: "CSV ஏற்றுமதி",
        exporting: "ஏற்றுமதி செய்யப்படுகிறது…",
        success: "செய்திகள் வரலாறு ஏற்றுமதி செய்யப்பட்டது.",
        error: "செய்திகள் வரலாற்றை ஏற்றுமதி செய்ய முடியவில்லை.",
      },
      options: {
        offer: {
          accepted: "ஆஃபர் ஏற்கப்பட்டது",
          declined: "ஆஃபர் நிராகரிக்கப்பட்டது",
        },
        candidateAction: {
          offerAccepted: "ஆஃபர் ஏற்கப்பட்டது",
          offerDeclined: "ஆஃபர் நிராகரிக்கப்பட்டது",
        },
      },
      badges: {
        offerAccepted: "ஆஃபர் ஏற்பு",
        offerDeclined: "ஆஃபர் நிராகரிப்பு",
      },
    },
  },
};

const kn: EmployerMessagesHistoryBundle = {
  employer: {
    messagesPage: {
      tabs: {
        archived: "ಆರ್ಕೈವ್ ಮಾಡಿದವು",
      },
      list: {
        starredEmptyTitle: "ನಕ್ಷತ್ರ ಹಾಕಿದ ಸಂಭಾಷಣೆಗಳಿಲ್ಲ.",
        starredEmptyDesc:
          "ಮುಖ್ಯ ಅಭ್ಯರ್ಥಿ ಸಂಭಾಷಣೆಗಳನ್ನು ಬೇಗ ಹುಡುಕಲು ಸಂಭಾಷಣೆ ಮೆನುವಿನಿಂದ ನಕ್ಷತ್ರ ಹಾಕಿ.",
        archivedEmptyTitle: "ಆರ್ಕೈವ್ ಮಾಡಿದ ಸಂಭಾಷಣೆಗಳಿಲ್ಲ.",
        archivedEmptyDesc:
          "ಆರ್ಕೈವ್ ಮಾಡಿದ ಸಂಭಾಷಣೆಗಳು ಎಲ್ಲಾ ಸಂಭಾಷಣೆಗಳಲ್ಲಿ ಕಾಣುವುದಿಲ್ಲ. ಅವುಗಳ ಅಧಿಸೂಚನೆ ಇತಿಹಾಸ ಉಳಿಯುತ್ತದೆ.",
        starredLabel: "ನಕ್ಷತ್ರ ಹಾಕಲಾಗಿದೆ",
        mutedLabel: "ಮ್ಯೂಟ್",
        selectConversation: "{name} ಜೊತೆಗಿನ ಸಂಭಾಷಣೆ ಆಯ್ಕೆಮಾಡಿ",
      },
      thread: {
        mutedNote:
          "ಮ್ಯೂಟ್: ಈ ಸಂಭಾಷಣೆಗೆ WhatsApp, ಇಮೇಲ್ ಮತ್ತು ಪುಷ್ ಅಲರ್ಟ್‌ಗಳು ಆಫ್ ಆಗಿವೆ. ಅಧಿಸೂಚನೆ ಇತಿಹಾಸ ಇನ್ನೂ ದಾಖಲಾಗುತ್ತದೆ.",
        archivedNote:
          "ಆರ್ಕೈವ್: ಎಲ್ಲಾ ಸಂಭಾಷಣೆಗಳಿಂದ ಮರೆಮಾಡಲಾಗಿದೆ. ಹಿಂದಕ್ಕೆ ತರಲು ಅನ್‌ಆರ್ಕೈವ್ ಮಾಡಿ.",
      },
      actions: {
        star: "ಸಂಭಾಷಣೆಗೆ ನಕ್ಷತ್ರ ಹಾಕಿ",
        unstar: "ನಕ್ಷತ್ರ ತೆಗೆದುಹಾಕಿ",
        archive: "ಸಂಭಾಷಣೆ ಆರ್ಕೈವ್ ಮಾಡಿ",
        unarchive: "ಸಂಭಾಷಣೆ ಅನ್‌ಆರ್ಕೈವ್ ಮಾಡಿ",
        mute: "ಸಂಭಾಷಣೆ ಮ್ಯೂಟ್ ಮಾಡಿ",
        unmute: "ಸಂಭಾಷಣೆ ಅನ್‌ಮ್ಯೂಟ್ ಮಾಡಿ",
        starSuccess: "ಸಂಭಾಷಣೆಗೆ ನಕ್ಷತ್ರ ಹಾಕಲಾಗಿದೆ.",
        unstarSuccess: "ನಕ್ಷತ್ರ ತೆಗೆದುಹಾಕಲಾಗಿದೆ.",
        archiveSuccess: "ಸಂಭಾಷಣೆ ಆರ್ಕೈವ್ ಮಾಡಲಾಗಿದೆ.",
        unarchiveSuccess: "ಸಂಭಾಷಣೆಯನ್ನು ಮತ್ತೆ ಎಲ್ಲಾ ಸಂಭಾಷಣೆಗಳಿಗೆ ಸರಿಸಲಾಗಿದೆ.",
        muteSuccess: "ಸಂಭಾಷಣೆ ಮ್ಯೂಟ್ ಮಾಡಲಾಗಿದೆ.",
        unmuteSuccess: "ಸಂಭಾಷಣೆ ಅನ್‌ಮ್ಯೂಟ್ ಮಾಡಲಾಗಿದೆ.",
        updateError: "ಈ ಸಂಭಾಷಣೆಯನ್ನು ನವೀಕರಿಸಲಾಗಲಿಲ್ಲ.",
      },
      bulk: {
        select: "ಆಯ್ಕೆಮಾಡಿ",
        cancel: "ರದ್ದುಮಾಡಿ",
        selectedCount: "{count} ಆಯ್ಕೆಯಾಗಿವೆ",
        selectAll: "ಎಲ್ಲವನ್ನೂ ಆಯ್ಕೆಮಾಡಿ",
        clearSelection: "ಆಯ್ಕೆ ತೆರವುಗೊಳಿಸಿ",
        markRead: "ಓದಿದೆ ಎಂದು ಗುರುತಿಸಿ",
        markUnread: "ಓದಿಲ್ಲ ಎಂದು ಗುರುತಿಸಿ",
        readSuccess: "{count} ಸಂಭಾಷಣೆಗಳನ್ನು ಓದಿದೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ.",
        unreadSuccess: "{count} ಸಂಭಾಷಣೆಗಳನ್ನು ಓದಿಲ್ಲ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ.",
        skipped: "{count} ಸಂಭಾಷಣೆಗಳನ್ನು ನವೀಕರಿಸಲಾಗಲಿಲ್ಲ.",
        error: "ಆಯ್ಕೆಮಾಡಿದ ಸಂಭಾಷಣೆಗಳನ್ನು ನವೀಕರಿಸಲಾಗಲಿಲ್ಲ.",
        limit: "ಒಮ್ಮೆಗೆ ಗರಿಷ್ಠ {max} ಸಂಭಾಷಣೆಗಳನ್ನು ಆಯ್ಕೆಮಾಡಬಹುದು.",
      },
      export: {
        button: "CSV ರಫ್ತು",
        exporting: "ರಫ್ತು ಮಾಡಲಾಗುತ್ತಿದೆ…",
        success: "ಸಂದೇಶಗಳ ಇತಿಹಾಸ ರಫ್ತು ಮಾಡಲಾಗಿದೆ.",
        error: "ಸಂದೇಶಗಳ ಇತಿಹಾಸವನ್ನು ರಫ್ತು ಮಾಡಲಾಗಲಿಲ್ಲ.",
      },
      options: {
        offer: {
          accepted: "ಆಫರ್ ಒಪ್ಪಿದ್ದಾರೆ",
          declined: "ಆಫರ್ ನಿರಾಕರಿಸಿದ್ದಾರೆ",
        },
        candidateAction: {
          offerAccepted: "ಆಫರ್ ಒಪ್ಪಿದ್ದಾರೆ",
          offerDeclined: "ಆಫರ್ ನಿರಾಕರಿಸಿದ್ದಾರೆ",
        },
      },
      badges: {
        offerAccepted: "ಆಫರ್ ಒಪ್ಪಿಗೆ",
        offerDeclined: "ಆಫರ್ ನಿರಾಕರಣೆ",
      },
    },
  },
};

const ml: EmployerMessagesHistoryBundle = {
  employer: {
    messagesPage: {
      tabs: {
        archived: "ആർക്കൈവ് ചെയ്തവ",
      },
      list: {
        starredEmptyTitle: "നക്ഷത്രമിട്ട സംഭാഷണങ്ങളില്ല.",
        starredEmptyDesc:
          "പ്രധാന ഉദ്യോഗാർത്ഥി സംഭാഷണങ്ങൾ വേഗം കണ്ടെത്താൻ സംഭാഷണ മെനുവിൽ നിന്ന് നക്ഷത്രമിടുക.",
        archivedEmptyTitle: "ആർക്കൈവ് ചെയ്ത സംഭാഷണങ്ങളില്ല.",
        archivedEmptyDesc:
          "ആർക്കൈവ് ചെയ്ത സംഭാഷണങ്ങൾ എല്ലാ സംഭാഷണങ്ങളിലും കാണിക്കില്ല. അവയുടെ അറിയിപ്പ് ചരിത്രം സൂക്ഷിക്കപ്പെടും.",
        starredLabel: "നക്ഷത്രമിട്ടത്",
        mutedLabel: "മ്യൂട്ട് ചെയ്തു",
        selectConversation: "{name} മായുള്ള സംഭാഷണം തിരഞ്ഞെടുക്കുക",
      },
      thread: {
        mutedNote:
          "മ്യൂട്ട്: ഈ സംഭാഷണത്തിന് WhatsApp, ഇമെയിൽ, പുഷ് അലേർട്ടുകൾ ഓഫാണ്. അറിയിപ്പ് ചരിത്രം തുടർന്നും രേഖപ്പെടുത്തും.",
        archivedNote:
          "ആർക്കൈവ്: എല്ലാ സംഭാഷണങ്ങളിൽ നിന്നും മറച്ചിരിക്കുന്നു. തിരികെ കൊണ്ടുവരാൻ അൺആർക്കൈവ് ചെയ്യുക.",
      },
      actions: {
        star: "സംഭാഷണത്തിന് നക്ഷത്രമിടുക",
        unstar: "നക്ഷത്രം നീക്കുക",
        archive: "സംഭാഷണം ആർക്കൈവ് ചെയ്യുക",
        unarchive: "സംഭാഷണം അൺആർക്കൈവ് ചെയ്യുക",
        mute: "സംഭാഷണം മ്യൂട്ട് ചെയ്യുക",
        unmute: "സംഭാഷണം അൺമ്യൂട്ട് ചെയ്യുക",
        starSuccess: "സംഭാഷണത്തിന് നക്ഷത്രമിട്ടു.",
        unstarSuccess: "നക്ഷത്രം നീക്കി.",
        archiveSuccess: "സംഭാഷണം ആർക്കൈവ് ചെയ്തു.",
        unarchiveSuccess: "സംഭാഷണം വീണ്ടും എല്ലാ സംഭാഷണങ്ങളിലേക്ക് മാറ്റി.",
        muteSuccess: "സംഭാഷണം മ്യൂട്ട് ചെയ്തു.",
        unmuteSuccess: "സംഭാഷണം അൺമ്യൂട്ട് ചെയ്തു.",
        updateError: "ഈ സംഭാഷണം അപ്ഡേറ്റ് ചെയ്യാനായില്ല.",
      },
      bulk: {
        select: "തിരഞ്ഞെടുക്കുക",
        cancel: "റദ്ദാക്കുക",
        selectedCount: "{count} തിരഞ്ഞെടുത്തു",
        selectAll: "എല്ലാം തിരഞ്ഞെടുക്കുക",
        clearSelection: "തിരഞ്ഞെടുപ്പ് മായ്ക്കുക",
        markRead: "വായിച്ചതായി അടയാളപ്പെടുത്തുക",
        markUnread: "വായിക്കാത്തതായി അടയാളപ്പെടുത്തുക",
        readSuccess: "{count} സംഭാഷണങ്ങൾ വായിച്ചതായി അടയാളപ്പെടുത്തി.",
        unreadSuccess: "{count} സംഭാഷണങ്ങൾ വായിക്കാത്തതായി അടയാളപ്പെടുത്തി.",
        skipped: "{count} സംഭാഷണങ്ങൾ അപ്ഡേറ്റ് ചെയ്യാനായില്ല.",
        error: "തിരഞ്ഞെടുത്ത സംഭാഷണങ്ങൾ അപ്ഡേറ്റ് ചെയ്യാനായില്ല.",
        limit: "ഒരേസമയം പരമാവധി {max} സംഭാഷണങ്ങൾ തിരഞ്ഞെടുക്കാം.",
      },
      export: {
        button: "CSV എക്സ്പോർട്ട്",
        exporting: "എക്സ്പോർട്ട് ചെയ്യുന്നു…",
        success: "സന്ദേശ ചരിത്രം എക്സ്പോർട്ട് ചെയ്തു.",
        error: "സന്ദേശ ചരിത്രം എക്സ്പോർട്ട് ചെയ്യാനായില്ല.",
      },
      options: {
        offer: {
          accepted: "ഓഫർ സ്വീകരിച്ചു",
          declined: "ഓഫർ നിരസിച്ചു",
        },
        candidateAction: {
          offerAccepted: "ഓഫർ സ്വീകരിച്ചു",
          offerDeclined: "ഓഫർ നിരസിച്ചു",
        },
      },
      badges: {
        offerAccepted: "ഓഫർ സ്വീകരിച്ചു",
        offerDeclined: "ഓഫർ നിരസിച്ചു",
      },
    },
  },
};

export const employerMessagesHistoryBundle = { en, hi, te, ta, kn, ml } as const;
