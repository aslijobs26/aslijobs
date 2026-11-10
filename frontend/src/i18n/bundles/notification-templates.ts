type MessageShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : MessageShape<T[K]>;
};

/**
 * Render-time copy for employer Messages notifications. Keys follow the
 * backend `template.key` (`employer.<type>` / `mirror.<type>`); `{token}`
 * values come from `template.params`. Stored English text is never changed.
 */
const en = {
  notificationTemplates: {
    labels: {
      date: "Date",
      time: "Time",
      mode: "Mode",
      meetingLink: "Meeting link",
      venue: "Venue",
      online: "online",
      offline: "offline",
    },
    fallback: {
      candidate: "A candidate",
      company: "the employer",
      jobTitle: "a job",
      reason: "Not specified",
      actor: "Operations",
    },
    scheduledOn: " scheduled on {date}",
    employer: {
      application_received: {
        title: "New Application Received",
        body: "{candidate} applied for {jobTitle}.",
      },
      interview_scheduled: {
        title: "Interview Scheduled",
        body: "Interview scheduled with {candidate} for {jobTitle}.{details}",
      },
      interview_updated: {
        title: "Interview Updated",
        body: "Interview with {candidate} for {jobTitle} was updated.{details}",
      },
      interview_completed: {
        title: "Interview Completed",
        body: "Interview with {candidate} for {jobTitle} was marked as completed.",
      },
      interview_cancelled: {
        title: "Interview Cancelled",
        body: "Interview with {candidate} for {jobTitle}{when} was cancelled. Reason: {reason}.",
      },
      offer_sent: {
        title: "Offer Sent",
        body: "Offer sent to {candidate} for {jobTitle}.",
      },
      offer_accepted: {
        title: "Offer Accepted",
        body: "{candidate} accepted the offer for {jobTitle}.",
      },
      offer_declined: {
        title: "Offer Declined",
        body: "{candidate} declined the offer for {jobTitle}.",
      },
      application_selected: {
        title: "Candidate Selected",
        body: "{candidate} was marked as selected for {jobTitle}.",
      },
      application_joined: {
        title: "Candidate Joined",
        body: "{candidate} was marked as joined for {jobTitle}.",
      },
      application_did_not_join: {
        title: "Did Not Join",
        body: "{candidate} was marked as did not join for {jobTitle}.",
      },
      application_rejected: {
        title: "Application Rejected",
        body: "{candidate}'s application for {jobTitle} was rejected.",
      },
      candidate_withdrawn: {
        title: "Candidate Withdrawn",
        body: "{candidate} withdrew their application for {jobTitle}.",
      },
      job_closed: {
        title: "Job closed notification",
        body: "Job Title: {jobTitle}\nJob ID: {publicJobId}\nClosure reason: {reason}\nClosed by: {actor}",
      },
      job_approved: {
        title: "Job approved and published",
        body: "Job Title: {jobTitle}\nJob ID: {publicJobId}\nStatus: Live\nApproved by: {actor}\nYour job is now visible to candidates on AsliJobs.",
      },
      job_rejected: {
        title: "Job rejected",
        body: "Job Title: {jobTitle}\nJob ID: {publicJobId}\nStatus: Rejected\nRejection reason: {reason}\nReviewed by: {actor}\nUpdate the job and resubmit it for Operations review.",
      },
      job_live_changes_approved: {
        title: "Job changes approved and published",
        body: "Job Title: {jobTitle}\nJob ID: {publicJobId}\nStatus: Live\nApproved by: {actor}\nYour job changes are now visible to candidates on AsliJobs.",
      },
      job_live_changes_rejected: {
        title: "Job changes rejected",
        body: "Job Title: {jobTitle}\nJob ID: {publicJobId}\nStatus: Live (previous version unchanged)\nRejection reason: {reason}\nReviewed by: {actor}\nYour live job is unchanged. Edit and resubmit the changes for Operations review.",
      },
    },
    mirror: {
      application_submitted: {
        title: "Application Submitted",
        body: "Candidate submitted an application.",
      },
      application_viewed: {
        title: "Application Viewed",
        body: "You viewed this application.",
      },
      application_under_review: {
        title: "Under Review",
        body: "You moved this application to Under Review.",
      },
      application_shortlisted: {
        title: "Candidate Shortlisted",
        body: "You shortlisted this candidate.",
      },
      interview_scheduled: {
        title: "Interview Scheduled",
        body: "Interview scheduled for {jobTitle} at {company}.{details}",
      },
      interview_updated: {
        title: "Interview Updated",
        body: "Interview details updated for {jobTitle}.{details}",
      },
      interview_completed: {
        title: "Interview Completed",
        body: "You marked this interview as completed.",
      },
      interview_cancelled: {
        title: "Interview Cancelled",
        body: "Interview for {jobTitle}{when} has been cancelled. Reason: {reason}.",
      },
      offer_sent: {
        title: "Offer Sent",
        body: "Offer sent for {jobTitle} at {company}.",
      },
      offer_accepted: {
        title: "Offer Accepted",
        body: "Candidate accepted the offer.",
      },
      offer_declined: {
        title: "Offer Declined",
        body: "Candidate declined the offer.",
      },
      application_selected: {
        title: "Candidate Selected",
        body: "You marked this candidate as selected.",
      },
      application_joined: {
        title: "Candidate Joined",
        body: "You marked this candidate as joined.",
      },
      application_did_not_join: {
        title: "Did Not Join",
        body: "You marked this candidate as did not join.",
      },
      application_rejected: {
        title: "Application Rejected",
        body: "You rejected this application.",
      },
      application_withdrawn: {
        title: "Candidate Withdrawn",
        body: "Candidate withdrew this application.",
      },
    },
  },
};

export type NotificationTemplatesBundle = MessageShape<typeof en>;

const hi: NotificationTemplatesBundle = {
  notificationTemplates: {
    labels: {
      date: "तारीख",
      time: "समय",
      mode: "माध्यम",
      meetingLink: "मीटिंग लिंक",
      venue: "स्थान",
      online: "ऑनलाइन",
      offline: "ऑफ़लाइन",
    },
    fallback: {
      candidate: "एक उम्मीदवार",
      company: "नियोक्ता",
      jobTitle: "एक नौकरी",
      reason: "निर्दिष्ट नहीं",
      actor: "ऑपरेशंस",
    },
    scheduledOn: " ({date} को निर्धारित)",
    employer: {
      application_received: {
        title: "नया आवेदन प्राप्त हुआ",
        body: "{candidate} ने {jobTitle} के लिए आवेदन किया।",
      },
      interview_scheduled: {
        title: "इंटरव्यू निर्धारित",
        body: "{jobTitle} के लिए {candidate} के साथ इंटरव्यू निर्धारित किया गया।{details}",
      },
      interview_updated: {
        title: "इंटरव्यू अपडेट हुआ",
        body: "{jobTitle} के लिए {candidate} के साथ इंटरव्यू अपडेट किया गया।{details}",
      },
      interview_completed: {
        title: "इंटरव्यू पूरा हुआ",
        body: "{jobTitle} के लिए {candidate} के साथ इंटरव्यू पूरा चिह्नित किया गया।",
      },
      interview_cancelled: {
        title: "इंटरव्यू रद्द",
        body: "{jobTitle} के लिए {candidate} के साथ इंटरव्यू{when} रद्द कर दिया गया। कारण: {reason}।",
      },
      offer_sent: {
        title: "ऑफ़र भेजा गया",
        body: "{jobTitle} के लिए {candidate} को ऑफ़र भेजा गया।",
      },
      offer_accepted: {
        title: "ऑफ़र स्वीकार किया",
        body: "{candidate} ने {jobTitle} का ऑफ़र स्वीकार कर लिया।",
      },
      offer_declined: {
        title: "ऑफ़र अस्वीकार किया",
        body: "{candidate} ने {jobTitle} का ऑफ़र अस्वीकार कर दिया।",
      },
      application_selected: {
        title: "उम्मीदवार चयनित",
        body: "{candidate} को {jobTitle} के लिए चयनित चिह्नित किया गया।",
      },
      application_joined: {
        title: "उम्मीदवार ने जॉइन किया",
        body: "{candidate} को {jobTitle} के लिए जॉइन किया हुआ चिह्नित किया गया।",
      },
      application_did_not_join: {
        title: "जॉइन नहीं किया",
        body: "{candidate} को {jobTitle} के लिए जॉइन नहीं किया चिह्नित किया गया।",
      },
      application_rejected: {
        title: "आवेदन अस्वीकृत",
        body: "{jobTitle} के लिए {candidate} का आवेदन अस्वीकार कर दिया गया।",
      },
      candidate_withdrawn: {
        title: "उम्मीदवार ने आवेदन वापस लिया",
        body: "{candidate} ने {jobTitle} के लिए अपना आवेदन वापस ले लिया।",
      },
      job_closed: {
        title: "नौकरी बंद होने की सूचना",
        body: "नौकरी का शीर्षक: {jobTitle}\nनौकरी ID: {publicJobId}\nबंद करने का कारण: {reason}\nबंद करने वाले: {actor}",
      },
      job_approved: {
        title: "नौकरी स्वीकृत और प्रकाशित",
        body: "नौकरी का शीर्षक: {jobTitle}\nनौकरी ID: {publicJobId}\nस्थिति: लाइव\nस्वीकृत करने वाले: {actor}\nआपकी नौकरी अब AsliJobs पर उम्मीदवारों को दिख रही है।",
      },
      job_rejected: {
        title: "नौकरी अस्वीकृत",
        body: "नौकरी का शीर्षक: {jobTitle}\nनौकरी ID: {publicJobId}\nस्थिति: अस्वीकृत\nअस्वीकृति का कारण: {reason}\nसमीक्षा करने वाले: {actor}\nनौकरी अपडेट करें और ऑपरेशंस समीक्षा के लिए फिर से जमा करें।",
      },
      job_live_changes_approved: {
        title: "नौकरी में बदलाव स्वीकृत और प्रकाशित",
        body: "नौकरी का शीर्षक: {jobTitle}\nनौकरी ID: {publicJobId}\nस्थिति: लाइव\nस्वीकृत करने वाले: {actor}\nआपकी नौकरी के बदलाव अब AsliJobs पर उम्मीदवारों को दिख रहे हैं।",
      },
      job_live_changes_rejected: {
        title: "नौकरी में बदलाव अस्वीकृत",
        body: "नौकरी का शीर्षक: {jobTitle}\nनौकरी ID: {publicJobId}\nस्थिति: लाइव (पिछला संस्करण अपरिवर्तित)\nअस्वीकृति का कारण: {reason}\nसमीक्षा करने वाले: {actor}\nआपकी लाइव नौकरी अपरिवर्तित है। बदलाव संपादित करें और ऑपरेशंस समीक्षा के लिए फिर से जमा करें।",
      },
    },
    mirror: {
      application_submitted: {
        title: "आवेदन जमा हुआ",
        body: "उम्मीदवार ने आवेदन जमा किया।",
      },
      application_viewed: {
        title: "आवेदन देखा गया",
        body: "आपने यह आवेदन देखा।",
      },
      application_under_review: {
        title: "समीक्षाधीन",
        body: "आपने इस आवेदन को समीक्षाधीन में भेजा।",
      },
      application_shortlisted: {
        title: "उम्मीदवार शॉर्टलिस्ट",
        body: "आपने इस उम्मीदवार को शॉर्टलिस्ट किया।",
      },
      interview_scheduled: {
        title: "इंटरव्यू निर्धारित",
        body: "{company} में {jobTitle} के लिए इंटरव्यू निर्धारित किया गया।{details}",
      },
      interview_updated: {
        title: "इंटरव्यू अपडेट हुआ",
        body: "{jobTitle} के लिए इंटरव्यू विवरण अपडेट किए गए।{details}",
      },
      interview_completed: {
        title: "इंटरव्यू पूरा हुआ",
        body: "आपने यह इंटरव्यू पूरा चिह्नित किया।",
      },
      interview_cancelled: {
        title: "इंटरव्यू रद्द",
        body: "{jobTitle} के लिए इंटरव्यू{when} रद्द कर दिया गया। कारण: {reason}।",
      },
      offer_sent: {
        title: "ऑफ़र भेजा गया",
        body: "{company} में {jobTitle} के लिए ऑफ़र भेजा गया।",
      },
      offer_accepted: {
        title: "ऑफ़र स्वीकार किया",
        body: "उम्मीदवार ने ऑफ़र स्वीकार कर लिया।",
      },
      offer_declined: {
        title: "ऑफ़र अस्वीकार किया",
        body: "उम्मीदवार ने ऑफ़र अस्वीकार कर दिया।",
      },
      application_selected: {
        title: "उम्मीदवार चयनित",
        body: "आपने इस उम्मीदवार को चयनित चिह्नित किया।",
      },
      application_joined: {
        title: "उम्मीदवार ने जॉइन किया",
        body: "आपने इस उम्मीदवार को जॉइन किया हुआ चिह्नित किया।",
      },
      application_did_not_join: {
        title: "जॉइन नहीं किया",
        body: "आपने इस उम्मीदवार को जॉइन नहीं किया चिह्नित किया।",
      },
      application_rejected: {
        title: "आवेदन अस्वीकृत",
        body: "आपने यह आवेदन अस्वीकार किया।",
      },
      application_withdrawn: {
        title: "उम्मीदवार ने आवेदन वापस लिया",
        body: "उम्मीदवार ने यह आवेदन वापस ले लिया।",
      },
    },
  },
};

const te: NotificationTemplatesBundle = {
  notificationTemplates: {
    labels: {
      date: "తేదీ",
      time: "సమయం",
      mode: "విధానం",
      meetingLink: "మీటింగ్ లింక్",
      venue: "వేదిక",
      online: "ఆన్‌లైన్",
      offline: "ఆఫ్‌లైన్",
    },
    fallback: {
      candidate: "ఒక అభ్యర్థి",
      company: "యజమాని",
      jobTitle: "ఒక ఉద్యోగం",
      reason: "పేర్కొనలేదు",
      actor: "ఆపరేషన్స్",
    },
    scheduledOn: " ({date}న షెడ్యూల్ చేసిన)",
    employer: {
      application_received: {
        title: "కొత్త దరఖాస్తు వచ్చింది",
        body: "{candidate} {jobTitle} కోసం దరఖాస్తు చేశారు.",
      },
      interview_scheduled: {
        title: "ఇంటర్వ్యూ షెడ్యూల్ చేయబడింది",
        body: "{jobTitle} కోసం {candidate}తో ఇంటర్వ్యూ షెడ్యూల్ చేయబడింది.{details}",
      },
      interview_updated: {
        title: "ఇంటర్వ్యూ అప్‌డేట్ చేయబడింది",
        body: "{jobTitle} కోసం {candidate}తో ఇంటర్వ్యూ అప్‌డేట్ చేయబడింది.{details}",
      },
      interview_completed: {
        title: "ఇంటర్వ్యూ పూర్తయింది",
        body: "{jobTitle} కోసం {candidate}తో ఇంటర్వ్యూ పూర్తయినట్లు గుర్తించబడింది.",
      },
      interview_cancelled: {
        title: "ఇంటర్వ్యూ రద్దు",
        body: "{jobTitle} కోసం {candidate}తో ఇంటర్వ్యూ{when} రద్దు చేయబడింది. కారణం: {reason}.",
      },
      offer_sent: {
        title: "ఆఫర్ పంపబడింది",
        body: "{jobTitle} కోసం {candidate}కి ఆఫర్ పంపబడింది.",
      },
      offer_accepted: {
        title: "ఆఫర్ అంగీకరించారు",
        body: "{candidate} {jobTitle} ఆఫర్‌ను అంగీకరించారు.",
      },
      offer_declined: {
        title: "ఆఫర్ తిరస్కరించారు",
        body: "{candidate} {jobTitle} ఆఫర్‌ను తిరస్కరించారు.",
      },
      application_selected: {
        title: "అభ్యర్థి ఎంపికయ్యారు",
        body: "{jobTitle} కోసం {candidate} ఎంపికైనట్లు గుర్తించబడింది.",
      },
      application_joined: {
        title: "అభ్యర్థి చేరారు",
        body: "{jobTitle} కోసం {candidate} చేరినట్లు గుర్తించబడింది.",
      },
      application_did_not_join: {
        title: "చేరలేదు",
        body: "{jobTitle} కోసం {candidate} చేరలేదని గుర్తించబడింది.",
      },
      application_rejected: {
        title: "దరఖాస్తు తిరస్కరించబడింది",
        body: "{jobTitle} కోసం {candidate} దరఖాస్తు తిరస్కరించబడింది.",
      },
      candidate_withdrawn: {
        title: "అభ్యర్థి ఉపసంహరించుకున్నారు",
        body: "{candidate} {jobTitle} కోసం తమ దరఖాస్తును ఉపసంహరించుకున్నారు.",
      },
      job_closed: {
        title: "ఉద్యోగం మూసివేత నోటిఫికేషన్",
        body: "ఉద్యోగ శీర్షిక: {jobTitle}\nఉద్యోగ ID: {publicJobId}\nమూసివేతకు కారణం: {reason}\nమూసివేసినవారు: {actor}",
      },
      job_approved: {
        title: "ఉద్యోగం ఆమోదించబడి ప్రచురించబడింది",
        body: "ఉద్యోగ శీర్షిక: {jobTitle}\nఉద్యోగ ID: {publicJobId}\nస్థితి: లైవ్\nఆమోదించినవారు: {actor}\nమీ ఉద్యోగం ఇప్పుడు AsliJobsలో అభ్యర్థులకు కనిపిస్తోంది.",
      },
      job_rejected: {
        title: "ఉద్యోగం తిరస్కరించబడింది",
        body: "ఉద్యోగ శీర్షిక: {jobTitle}\nఉద్యోగ ID: {publicJobId}\nస్థితి: తిరస్కరించబడింది\nతిరస్కరణ కారణం: {reason}\nసమీక్షించినవారు: {actor}\nఉద్యోగాన్ని అప్‌డేట్ చేసి ఆపరేషన్స్ సమీక్ష కోసం మళ్లీ సమర్పించండి.",
      },
      job_live_changes_approved: {
        title: "ఉద్యోగ మార్పులు ఆమోదించబడి ప్రచురించబడ్డాయి",
        body: "ఉద్యోగ శీర్షిక: {jobTitle}\nఉద్యోగ ID: {publicJobId}\nస్థితి: లైవ్\nఆమోదించినవారు: {actor}\nమీ ఉద్యోగ మార్పులు ఇప్పుడు AsliJobsలో అభ్యర్థులకు కనిపిస్తున్నాయి.",
      },
      job_live_changes_rejected: {
        title: "ఉద్యోగ మార్పులు తిరస్కరించబడ్డాయి",
        body: "ఉద్యోగ శీర్షిక: {jobTitle}\nఉద్యోగ ID: {publicJobId}\nస్థితి: లైవ్ (మునుపటి వెర్షన్ మారలేదు)\nతిరస్కరణ కారణం: {reason}\nసమీక్షించినవారు: {actor}\nమీ లైవ్ ఉద్యోగం మారలేదు. మార్పులను సవరించి ఆపరేషన్స్ సమీక్ష కోసం మళ్లీ సమర్పించండి.",
      },
    },
    mirror: {
      application_submitted: {
        title: "దరఖాస్తు సమర్పించబడింది",
        body: "అభ్యర్థి దరఖాస్తు సమర్పించారు.",
      },
      application_viewed: {
        title: "దరఖాస్తు చూశారు",
        body: "మీరు ఈ దరఖాస్తును చూశారు.",
      },
      application_under_review: {
        title: "సమీక్షలో ఉంది",
        body: "మీరు ఈ దరఖాస్తును సమీక్షలోకి మార్చారు.",
      },
      application_shortlisted: {
        title: "అభ్యర్థి షార్ట్‌లిస్ట్ అయ్యారు",
        body: "మీరు ఈ అభ్యర్థిని షార్ట్‌లిస్ట్ చేశారు.",
      },
      interview_scheduled: {
        title: "ఇంటర్వ్యూ షెడ్యూల్ చేయబడింది",
        body: "{company}లో {jobTitle} కోసం ఇంటర్వ్యూ షెడ్యూల్ చేయబడింది.{details}",
      },
      interview_updated: {
        title: "ఇంటర్వ్యూ అప్‌డేట్ చేయబడింది",
        body: "{jobTitle} కోసం ఇంటర్వ్యూ వివరాలు అప్‌డేట్ చేయబడ్డాయి.{details}",
      },
      interview_completed: {
        title: "ఇంటర్వ్యూ పూర్తయింది",
        body: "మీరు ఈ ఇంటర్వ్యూను పూర్తయినట్లు గుర్తించారు.",
      },
      interview_cancelled: {
        title: "ఇంటర్వ్యూ రద్దు",
        body: "{jobTitle} కోసం ఇంటర్వ్యూ{when} రద్దు చేయబడింది. కారణం: {reason}.",
      },
      offer_sent: {
        title: "ఆఫర్ పంపబడింది",
        body: "{company}లో {jobTitle} కోసం ఆఫర్ పంపబడింది.",
      },
      offer_accepted: {
        title: "ఆఫర్ అంగీకరించారు",
        body: "అభ్యర్థి ఆఫర్‌ను అంగీకరించారు.",
      },
      offer_declined: {
        title: "ఆఫర్ తిరస్కరించారు",
        body: "అభ్యర్థి ఆఫర్‌ను తిరస్కరించారు.",
      },
      application_selected: {
        title: "అభ్యర్థి ఎంపికయ్యారు",
        body: "మీరు ఈ అభ్యర్థిని ఎంపికైనట్లు గుర్తించారు.",
      },
      application_joined: {
        title: "అభ్యర్థి చేరారు",
        body: "మీరు ఈ అభ్యర్థి చేరినట్లు గుర్తించారు.",
      },
      application_did_not_join: {
        title: "చేరలేదు",
        body: "మీరు ఈ అభ్యర్థి చేరలేదని గుర్తించారు.",
      },
      application_rejected: {
        title: "దరఖాస్తు తిరస్కరించబడింది",
        body: "మీరు ఈ దరఖాస్తును తిరస్కరించారు.",
      },
      application_withdrawn: {
        title: "అభ్యర్థి ఉపసంహరించుకున్నారు",
        body: "అభ్యర్థి ఈ దరఖాస్తును ఉపసంహరించుకున్నారు.",
      },
    },
  },
};

const ta: NotificationTemplatesBundle = {
  notificationTemplates: {
    labels: {
      date: "தேதி",
      time: "நேரம்",
      mode: "முறை",
      meetingLink: "மீட்டிங் இணைப்பு",
      venue: "இடம்",
      online: "ஆன்லைன்",
      offline: "நேரடி",
    },
    fallback: {
      candidate: "ஒரு விண்ணப்பதாரர்",
      company: "நிறுவனம்",
      jobTitle: "ஒரு வேலை",
      reason: "குறிப்பிடப்படவில்லை",
      actor: "ஆபரேஷன்ஸ்",
    },
    scheduledOn: " ({date} அன்று திட்டமிடப்பட்ட)",
    employer: {
      application_received: {
        title: "புதிய விண்ணப்பம் பெறப்பட்டது",
        body: "{candidate} {jobTitle} பணிக்கு விண்ணப்பித்தார்.",
      },
      interview_scheduled: {
        title: "நேர்காணல் திட்டமிடப்பட்டது",
        body: "{jobTitle} பணிக்காக {candidate} உடன் நேர்காணல் திட்டமிடப்பட்டது.{details}",
      },
      interview_updated: {
        title: "நேர்காணல் புதுப்பிக்கப்பட்டது",
        body: "{jobTitle} பணிக்கான {candidate} உடனான நேர்காணல் புதுப்பிக்கப்பட்டது.{details}",
      },
      interview_completed: {
        title: "நேர்காணல் நிறைவடைந்தது",
        body: "{jobTitle} பணிக்கான {candidate} உடனான நேர்காணல் நிறைவடைந்ததாகக் குறிக்கப்பட்டது.",
      },
      interview_cancelled: {
        title: "நேர்காணல் ரத்து",
        body: "{jobTitle} பணிக்கான {candidate} உடனான நேர்காணல்{when} ரத்து செய்யப்பட்டது. காரணம்: {reason}.",
      },
      offer_sent: {
        title: "ஆஃபர் அனுப்பப்பட்டது",
        body: "{jobTitle} பணிக்காக {candidate} க்கு ஆஃபர் அனுப்பப்பட்டது.",
      },
      offer_accepted: {
        title: "ஆஃபர் ஏற்கப்பட்டது",
        body: "{candidate} {jobTitle} ஆஃபரை ஏற்றுக்கொண்டார்.",
      },
      offer_declined: {
        title: "ஆஃபர் நிராகரிக்கப்பட்டது",
        body: "{candidate} {jobTitle} ஆஃபரை நிராகரித்தார்.",
      },
      application_selected: {
        title: "விண்ணப்பதாரர் தேர்ந்தெடுக்கப்பட்டார்",
        body: "{jobTitle} பணிக்கு {candidate} தேர்ந்தெடுக்கப்பட்டதாகக் குறிக்கப்பட்டது.",
      },
      application_joined: {
        title: "விண்ணப்பதாரர் சேர்ந்தார்",
        body: "{jobTitle} பணியில் {candidate} சேர்ந்ததாகக் குறிக்கப்பட்டது.",
      },
      application_did_not_join: {
        title: "சேரவில்லை",
        body: "{jobTitle} பணியில் {candidate} சேரவில்லை எனக் குறிக்கப்பட்டது.",
      },
      application_rejected: {
        title: "விண்ணப்பம் நிராகரிக்கப்பட்டது",
        body: "{jobTitle} பணிக்கான {candidate} இன் விண்ணப்பம் நிராகரிக்கப்பட்டது.",
      },
      candidate_withdrawn: {
        title: "விண்ணப்பதாரர் விலகினார்",
        body: "{candidate} {jobTitle} பணிக்கான தங்கள் விண்ணப்பத்தைத் திரும்பப் பெற்றார்.",
      },
      job_closed: {
        title: "வேலை மூடல் அறிவிப்பு",
        body: "வேலை தலைப்பு: {jobTitle}\nவேலை ID: {publicJobId}\nமூடல் காரணம்: {reason}\nமூடியவர்: {actor}",
      },
      job_approved: {
        title: "வேலை அங்கீகரிக்கப்பட்டு வெளியிடப்பட்டது",
        body: "வேலை தலைப்பு: {jobTitle}\nவேலை ID: {publicJobId}\nநிலை: நேரலை\nஅங்கீகரித்தவர்: {actor}\nஉங்கள் வேலை இப்போது AsliJobs இல் விண்ணப்பதாரர்களுக்குத் தெரியும்.",
      },
      job_rejected: {
        title: "வேலை நிராகரிக்கப்பட்டது",
        body: "வேலை தலைப்பு: {jobTitle}\nவேலை ID: {publicJobId}\nநிலை: நிராகரிக்கப்பட்டது\nநிராகரிப்பு காரணம்: {reason}\nமதிப்பாய்வு செய்தவர்: {actor}\nவேலையைப் புதுப்பித்து ஆபரேஷன்ஸ் மதிப்பாய்வுக்கு மீண்டும் சமர்ப்பிக்கவும்.",
      },
      job_live_changes_approved: {
        title: "வேலை மாற்றங்கள் அங்கீகரிக்கப்பட்டு வெளியிடப்பட்டன",
        body: "வேலை தலைப்பு: {jobTitle}\nவேலை ID: {publicJobId}\nநிலை: நேரலை\nஅங்கீகரித்தவர்: {actor}\nஉங்கள் வேலை மாற்றங்கள் இப்போது AsliJobs இல் விண்ணப்பதாரர்களுக்குத் தெரியும்.",
      },
      job_live_changes_rejected: {
        title: "வேலை மாற்றங்கள் நிராகரிக்கப்பட்டன",
        body: "வேலை தலைப்பு: {jobTitle}\nவேலை ID: {publicJobId}\nநிலை: நேரலை (முந்தைய பதிப்பு மாறவில்லை)\nநிராகரிப்பு காரணம்: {reason}\nமதிப்பாய்வு செய்தவர்: {actor}\nஉங்கள் நேரலை வேலை மாறவில்லை. மாற்றங்களைத் திருத்தி ஆபரேஷன்ஸ் மதிப்பாய்வுக்கு மீண்டும் சமர்ப்பிக்கவும்.",
      },
    },
    mirror: {
      application_submitted: {
        title: "விண்ணப்பம் சமர்ப்பிக்கப்பட்டது",
        body: "விண்ணப்பதாரர் விண்ணப்பத்தைச் சமர்ப்பித்தார்.",
      },
      application_viewed: {
        title: "விண்ணப்பம் பார்க்கப்பட்டது",
        body: "இந்த விண்ணப்பத்தை நீங்கள் பார்த்தீர்கள்.",
      },
      application_under_review: {
        title: "மதிப்பாய்வில்",
        body: "இந்த விண்ணப்பத்தை மதிப்பாய்வுக்கு மாற்றினீர்கள்.",
      },
      application_shortlisted: {
        title: "விண்ணப்பதாரர் தேர்வுப் பட்டியலில்",
        body: "இந்த விண்ணப்பதாரரைத் தேர்வுப் பட்டியலில் சேர்த்தீர்கள்.",
      },
      interview_scheduled: {
        title: "நேர்காணல் திட்டமிடப்பட்டது",
        body: "{company} இல் {jobTitle} பணிக்கான நேர்காணல் திட்டமிடப்பட்டது.{details}",
      },
      interview_updated: {
        title: "நேர்காணல் புதுப்பிக்கப்பட்டது",
        body: "{jobTitle} பணிக்கான நேர்காணல் விவரங்கள் புதுப்பிக்கப்பட்டன.{details}",
      },
      interview_completed: {
        title: "நேர்காணல் நிறைவடைந்தது",
        body: "இந்த நேர்காணலை நிறைவடைந்ததாகக் குறித்தீர்கள்.",
      },
      interview_cancelled: {
        title: "நேர்காணல் ரத்து",
        body: "{jobTitle} பணிக்கான நேர்காணல்{when} ரத்து செய்யப்பட்டது. காரணம்: {reason}.",
      },
      offer_sent: {
        title: "ஆஃபர் அனுப்பப்பட்டது",
        body: "{company} இல் {jobTitle} பணிக்கான ஆஃபர் அனுப்பப்பட்டது.",
      },
      offer_accepted: {
        title: "ஆஃபர் ஏற்கப்பட்டது",
        body: "விண்ணப்பதாரர் ஆஃபரை ஏற்றுக்கொண்டார்.",
      },
      offer_declined: {
        title: "ஆஃபர் நிராகரிக்கப்பட்டது",
        body: "விண்ணப்பதாரர் ஆஃபரை நிராகரித்தார்.",
      },
      application_selected: {
        title: "விண்ணப்பதாரர் தேர்ந்தெடுக்கப்பட்டார்",
        body: "இந்த விண்ணப்பதாரரைத் தேர்ந்தெடுக்கப்பட்டதாகக் குறித்தீர்கள்.",
      },
      application_joined: {
        title: "விண்ணப்பதாரர் சேர்ந்தார்",
        body: "இந்த விண்ணப்பதாரர் சேர்ந்ததாகக் குறித்தீர்கள்.",
      },
      application_did_not_join: {
        title: "சேரவில்லை",
        body: "இந்த விண்ணப்பதாரர் சேரவில்லை எனக் குறித்தீர்கள்.",
      },
      application_rejected: {
        title: "விண்ணப்பம் நிராகரிக்கப்பட்டது",
        body: "இந்த விண்ணப்பத்தை நிராகரித்தீர்கள்.",
      },
      application_withdrawn: {
        title: "விண்ணப்பதாரர் விலகினார்",
        body: "விண்ணப்பதாரர் இந்த விண்ணப்பத்தைத் திரும்பப் பெற்றார்.",
      },
    },
  },
};

const kn: NotificationTemplatesBundle = {
  notificationTemplates: {
    labels: {
      date: "ದಿನಾಂಕ",
      time: "ಸಮಯ",
      mode: "ವಿಧಾನ",
      meetingLink: "ಮೀಟಿಂಗ್ ಲಿಂಕ್",
      venue: "ಸ್ಥಳ",
      online: "ಆನ್‌ಲೈನ್",
      offline: "ಆಫ್‌ಲೈನ್",
    },
    fallback: {
      candidate: "ಒಬ್ಬ ಅಭ್ಯರ್ಥಿ",
      company: "ಉದ್ಯೋಗದಾತ",
      jobTitle: "ಒಂದು ಉದ್ಯೋಗ",
      reason: "ನಮೂದಿಸಿಲ್ಲ",
      actor: "ಆಪರೇಷನ್ಸ್",
    },
    scheduledOn: " ({date} ರಂದು ನಿಗದಿಯಾದ)",
    employer: {
      application_received: {
        title: "ಹೊಸ ಅರ್ಜಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ",
        body: "{candidate} {jobTitle} ಹುದ್ದೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ್ದಾರೆ.",
      },
      interview_scheduled: {
        title: "ಸಂದರ್ಶನ ನಿಗದಿಯಾಗಿದೆ",
        body: "{jobTitle} ಹುದ್ದೆಗೆ {candidate} ಜೊತೆ ಸಂದರ್ಶನ ನಿಗದಿಯಾಗಿದೆ.{details}",
      },
      interview_updated: {
        title: "ಸಂದರ್ಶನ ನವೀಕರಿಸಲಾಗಿದೆ",
        body: "{jobTitle} ಹುದ್ದೆಗೆ {candidate} ಜೊತೆಗಿನ ಸಂದರ್ಶನವನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ.{details}",
      },
      interview_completed: {
        title: "ಸಂದರ್ಶನ ಪೂರ್ಣಗೊಂಡಿದೆ",
        body: "{jobTitle} ಹುದ್ದೆಗೆ {candidate} ಜೊತೆಗಿನ ಸಂದರ್ಶನ ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ.",
      },
      interview_cancelled: {
        title: "ಸಂದರ್ಶನ ರದ್ದು",
        body: "{jobTitle} ಹುದ್ದೆಗೆ {candidate} ಜೊತೆಗಿನ ಸಂದರ್ಶನ{when} ರದ್ದಾಗಿದೆ. ಕಾರಣ: {reason}.",
      },
      offer_sent: {
        title: "ಆಫರ್ ಕಳುಹಿಸಲಾಗಿದೆ",
        body: "{jobTitle} ಹುದ್ದೆಗೆ {candidate} ಅವರಿಗೆ ಆಫರ್ ಕಳುಹಿಸಲಾಗಿದೆ.",
      },
      offer_accepted: {
        title: "ಆಫರ್ ಒಪ್ಪಿದ್ದಾರೆ",
        body: "{candidate} {jobTitle} ಆಫರ್ ಒಪ್ಪಿಕೊಂಡಿದ್ದಾರೆ.",
      },
      offer_declined: {
        title: "ಆಫರ್ ನಿರಾಕರಿಸಿದ್ದಾರೆ",
        body: "{candidate} {jobTitle} ಆಫರ್ ನಿರಾಕರಿಸಿದ್ದಾರೆ.",
      },
      application_selected: {
        title: "ಅಭ್ಯರ್ಥಿ ಆಯ್ಕೆಯಾಗಿದ್ದಾರೆ",
        body: "{jobTitle} ಹುದ್ದೆಗೆ {candidate} ಆಯ್ಕೆಯಾಗಿದ್ದಾರೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ.",
      },
      application_joined: {
        title: "ಅಭ್ಯರ್ಥಿ ಸೇರಿದ್ದಾರೆ",
        body: "{jobTitle} ಹುದ್ದೆಗೆ {candidate} ಸೇರಿದ್ದಾರೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ.",
      },
      application_did_not_join: {
        title: "ಸೇರಲಿಲ್ಲ",
        body: "{jobTitle} ಹುದ್ದೆಗೆ {candidate} ಸೇರಲಿಲ್ಲ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ.",
      },
      application_rejected: {
        title: "ಅರ್ಜಿ ತಿರಸ್ಕೃತ",
        body: "{jobTitle} ಹುದ್ದೆಗೆ {candidate} ಅವರ ಅರ್ಜಿಯನ್ನು ತಿರಸ್ಕರಿಸಲಾಗಿದೆ.",
      },
      candidate_withdrawn: {
        title: "ಅಭ್ಯರ್ಥಿ ಹಿಂಪಡೆದಿದ್ದಾರೆ",
        body: "{candidate} {jobTitle} ಹುದ್ದೆಗೆ ತಮ್ಮ ಅರ್ಜಿಯನ್ನು ಹಿಂಪಡೆದಿದ್ದಾರೆ.",
      },
      job_closed: {
        title: "ಉದ್ಯೋಗ ಮುಚ್ಚುವಿಕೆ ಅಧಿಸೂಚನೆ",
        body: "ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ: {jobTitle}\nಉದ್ಯೋಗ ID: {publicJobId}\nಮುಚ್ಚಲು ಕಾರಣ: {reason}\nಮುಚ್ಚಿದವರು: {actor}",
      },
      job_approved: {
        title: "ಉದ್ಯೋಗ ಅನುಮೋದಿಸಿ ಪ್ರಕಟಿಸಲಾಗಿದೆ",
        body: "ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ: {jobTitle}\nಉದ್ಯೋಗ ID: {publicJobId}\nಸ್ಥಿತಿ: ಲೈವ್\nಅನುಮೋದಿಸಿದವರು: {actor}\nನಿಮ್ಮ ಉದ್ಯೋಗ ಈಗ AsliJobs ನಲ್ಲಿ ಅಭ್ಯರ್ಥಿಗಳಿಗೆ ಕಾಣುತ್ತಿದೆ.",
      },
      job_rejected: {
        title: "ಉದ್ಯೋಗ ತಿರಸ್ಕೃತ",
        body: "ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ: {jobTitle}\nಉದ್ಯೋಗ ID: {publicJobId}\nಸ್ಥಿತಿ: ತಿರಸ್ಕೃತ\nತಿರಸ್ಕಾರದ ಕಾರಣ: {reason}\nಪರಿಶೀಲಿಸಿದವರು: {actor}\nಉದ್ಯೋಗವನ್ನು ನವೀಕರಿಸಿ ಆಪರೇಷನ್ಸ್ ಪರಿಶೀಲನೆಗೆ ಮತ್ತೆ ಸಲ್ಲಿಸಿ.",
      },
      job_live_changes_approved: {
        title: "ಉದ್ಯೋಗ ಬದಲಾವಣೆಗಳನ್ನು ಅನುಮೋದಿಸಿ ಪ್ರಕಟಿಸಲಾಗಿದೆ",
        body: "ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ: {jobTitle}\nಉದ್ಯೋಗ ID: {publicJobId}\nಸ್ಥಿತಿ: ಲೈವ್\nಅನುಮೋದಿಸಿದವರು: {actor}\nನಿಮ್ಮ ಉದ್ಯೋಗ ಬದಲಾವಣೆಗಳು ಈಗ AsliJobs ನಲ್ಲಿ ಅಭ್ಯರ್ಥಿಗಳಿಗೆ ಕಾಣುತ್ತಿವೆ.",
      },
      job_live_changes_rejected: {
        title: "ಉದ್ಯೋಗ ಬದಲಾವಣೆಗಳು ತಿರಸ್ಕೃತ",
        body: "ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ: {jobTitle}\nಉದ್ಯೋಗ ID: {publicJobId}\nಸ್ಥಿತಿ: ಲೈವ್ (ಹಿಂದಿನ ಆವೃತ್ತಿ ಬದಲಾಗಿಲ್ಲ)\nತಿರಸ್ಕಾರದ ಕಾರಣ: {reason}\nಪರಿಶೀಲಿಸಿದವರು: {actor}\nನಿಮ್ಮ ಲೈವ್ ಉದ್ಯೋಗ ಬದಲಾಗಿಲ್ಲ. ಬದಲಾವಣೆಗಳನ್ನು ಸಂಪಾದಿಸಿ ಆಪರೇಷನ್ಸ್ ಪರಿಶೀಲನೆಗೆ ಮತ್ತೆ ಸಲ್ಲಿಸಿ.",
      },
    },
    mirror: {
      application_submitted: {
        title: "ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ",
        body: "ಅಭ್ಯರ್ಥಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ್ದಾರೆ.",
      },
      application_viewed: {
        title: "ಅರ್ಜಿ ನೋಡಲಾಗಿದೆ",
        body: "ನೀವು ಈ ಅರ್ಜಿಯನ್ನು ನೋಡಿದ್ದೀರಿ.",
      },
      application_under_review: {
        title: "ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ",
        body: "ನೀವು ಈ ಅರ್ಜಿಯನ್ನು ಪರಿಶೀಲನೆಗೆ ಸರಿಸಿದ್ದೀರಿ.",
      },
      application_shortlisted: {
        title: "ಅಭ್ಯರ್ಥಿ ಶಾರ್ಟ್‌ಲಿಸ್ಟ್",
        body: "ನೀವು ಈ ಅಭ್ಯರ್ಥಿಯನ್ನು ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಮಾಡಿದ್ದೀರಿ.",
      },
      interview_scheduled: {
        title: "ಸಂದರ್ಶನ ನಿಗದಿಯಾಗಿದೆ",
        body: "{company} ನಲ್ಲಿ {jobTitle} ಹುದ್ದೆಗೆ ಸಂದರ್ಶನ ನಿಗದಿಯಾಗಿದೆ.{details}",
      },
      interview_updated: {
        title: "ಸಂದರ್ಶನ ನವೀಕರಿಸಲಾಗಿದೆ",
        body: "{jobTitle} ಹುದ್ದೆಯ ಸಂದರ್ಶನ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ.{details}",
      },
      interview_completed: {
        title: "ಸಂದರ್ಶನ ಪೂರ್ಣಗೊಂಡಿದೆ",
        body: "ನೀವು ಈ ಸಂದರ್ಶನವನ್ನು ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಿದ್ದೀರಿ.",
      },
      interview_cancelled: {
        title: "ಸಂದರ್ಶನ ರದ್ದು",
        body: "{jobTitle} ಹುದ್ದೆಯ ಸಂದರ್ಶನ{when} ರದ್ದಾಗಿದೆ. ಕಾರಣ: {reason}.",
      },
      offer_sent: {
        title: "ಆಫರ್ ಕಳುಹಿಸಲಾಗಿದೆ",
        body: "{company} ನಲ್ಲಿ {jobTitle} ಹುದ್ದೆಗೆ ಆಫರ್ ಕಳುಹಿಸಲಾಗಿದೆ.",
      },
      offer_accepted: {
        title: "ಆಫರ್ ಒಪ್ಪಿದ್ದಾರೆ",
        body: "ಅಭ್ಯರ್ಥಿ ಆಫರ್ ಒಪ್ಪಿಕೊಂಡಿದ್ದಾರೆ.",
      },
      offer_declined: {
        title: "ಆಫರ್ ನಿರಾಕರಿಸಿದ್ದಾರೆ",
        body: "ಅಭ್ಯರ್ಥಿ ಆಫರ್ ನಿರಾಕರಿಸಿದ್ದಾರೆ.",
      },
      application_selected: {
        title: "ಅಭ್ಯರ್ಥಿ ಆಯ್ಕೆಯಾಗಿದ್ದಾರೆ",
        body: "ನೀವು ಈ ಅಭ್ಯರ್ಥಿಯನ್ನು ಆಯ್ಕೆಯಾಗಿದ್ದಾರೆ ಎಂದು ಗುರುತಿಸಿದ್ದೀರಿ.",
      },
      application_joined: {
        title: "ಅಭ್ಯರ್ಥಿ ಸೇರಿದ್ದಾರೆ",
        body: "ನೀವು ಈ ಅಭ್ಯರ್ಥಿ ಸೇರಿದ್ದಾರೆ ಎಂದು ಗುರುತಿಸಿದ್ದೀರಿ.",
      },
      application_did_not_join: {
        title: "ಸೇರಲಿಲ್ಲ",
        body: "ನೀವು ಈ ಅಭ್ಯರ್ಥಿ ಸೇರಲಿಲ್ಲ ಎಂದು ಗುರುತಿಸಿದ್ದೀರಿ.",
      },
      application_rejected: {
        title: "ಅರ್ಜಿ ತಿರಸ್ಕೃತ",
        body: "ನೀವು ಈ ಅರ್ಜಿಯನ್ನು ತಿರಸ್ಕರಿಸಿದ್ದೀರಿ.",
      },
      application_withdrawn: {
        title: "ಅಭ್ಯರ್ಥಿ ಹಿಂಪಡೆದಿದ್ದಾರೆ",
        body: "ಅಭ್ಯರ್ಥಿ ಈ ಅರ್ಜಿಯನ್ನು ಹಿಂಪಡೆದಿದ್ದಾರೆ.",
      },
    },
  },
};

const ml: NotificationTemplatesBundle = {
  notificationTemplates: {
    labels: {
      date: "തീയതി",
      time: "സമയം",
      mode: "രീതി",
      meetingLink: "മീറ്റിംഗ് ലിങ്ക്",
      venue: "സ്ഥലം",
      online: "ഓൺലൈൻ",
      offline: "ഓഫ്‌ലൈൻ",
    },
    fallback: {
      candidate: "ഒരു ഉദ്യോഗാർത്ഥി",
      company: "തൊഴിലുടമ",
      jobTitle: "ഒരു ജോലി",
      reason: "വ്യക്തമാക്കിയിട്ടില്ല",
      actor: "ഓപ്പറേഷൻസ്",
    },
    scheduledOn: " ({date} ന് നിശ്ചയിച്ച)",
    employer: {
      application_received: {
        title: "പുതിയ അപേക്ഷ ലഭിച്ചു",
        body: "{candidate} {jobTitle} ജോലിക്ക് അപേക്ഷിച്ചു.",
      },
      interview_scheduled: {
        title: "ഇന്റർവ്യൂ നിശ്ചയിച്ചു",
        body: "{jobTitle} ജോലിക്കായി {candidate} യുമായി ഇന്റർവ്യൂ നിശ്ചയിച്ചു.{details}",
      },
      interview_updated: {
        title: "ഇന്റർവ്യൂ അപ്ഡേറ്റ് ചെയ്തു",
        body: "{jobTitle} ജോലിക്കായുള്ള {candidate} യുമായുള്ള ഇന്റർവ്യൂ അപ്ഡേറ്റ് ചെയ്തു.{details}",
      },
      interview_completed: {
        title: "ഇന്റർവ്യൂ പൂർത്തിയായി",
        body: "{jobTitle} ജോലിക്കായുള്ള {candidate} യുമായുള്ള ഇന്റർവ്യൂ പൂർത്തിയായതായി അടയാളപ്പെടുത്തി.",
      },
      interview_cancelled: {
        title: "ഇന്റർവ്യൂ റദ്ദാക്കി",
        body: "{jobTitle} ജോലിക്കായുള്ള {candidate} യുമായുള്ള ഇന്റർവ്യൂ{when} റദ്ദാക്കി. കാരണം: {reason}.",
      },
      offer_sent: {
        title: "ഓഫർ അയച്ചു",
        body: "{jobTitle} ജോലിക്കായി {candidate} ക്ക് ഓഫർ അയച്ചു.",
      },
      offer_accepted: {
        title: "ഓഫർ സ്വീകരിച്ചു",
        body: "{candidate} {jobTitle} ഓഫർ സ്വീകരിച്ചു.",
      },
      offer_declined: {
        title: "ഓഫർ നിരസിച്ചു",
        body: "{candidate} {jobTitle} ഓഫർ നിരസിച്ചു.",
      },
      application_selected: {
        title: "ഉദ്യോഗാർത്ഥിയെ തിരഞ്ഞെടുത്തു",
        body: "{jobTitle} ജോലിക്ക് {candidate} തിരഞ്ഞെടുക്കപ്പെട്ടതായി അടയാളപ്പെടുത്തി.",
      },
      application_joined: {
        title: "ഉദ്യോഗാർത്ഥി ചേർന്നു",
        body: "{jobTitle} ജോലിയിൽ {candidate} ചേർന്നതായി അടയാളപ്പെടുത്തി.",
      },
      application_did_not_join: {
        title: "ചേർന്നില്ല",
        body: "{jobTitle} ജോലിയിൽ {candidate} ചേർന്നില്ലെന്ന് അടയാളപ്പെടുത്തി.",
      },
      application_rejected: {
        title: "അപേക്ഷ നിരസിച്ചു",
        body: "{jobTitle} ജോലിക്കുള്ള {candidate} യുടെ അപേക്ഷ നിരസിച്ചു.",
      },
      candidate_withdrawn: {
        title: "ഉദ്യോഗാർത്ഥി പിൻവലിച്ചു",
        body: "{candidate} {jobTitle} ജോലിക്കുള്ള അപേക്ഷ പിൻവലിച്ചു.",
      },
      job_closed: {
        title: "ജോലി അടച്ചതിന്റെ അറിയിപ്പ്",
        body: "ജോലിയുടെ പേര്: {jobTitle}\nജോലി ID: {publicJobId}\nഅടയ്ക്കാനുള്ള കാരണം: {reason}\nഅടച്ചത്: {actor}",
      },
      job_approved: {
        title: "ജോലി അംഗീകരിച്ച് പ്രസിദ്ധീകരിച്ചു",
        body: "ജോലിയുടെ പേര്: {jobTitle}\nജോലി ID: {publicJobId}\nനില: ലൈവ്\nഅംഗീകരിച്ചത്: {actor}\nനിങ്ങളുടെ ജോലി ഇപ്പോൾ AsliJobs-ൽ ഉദ്യോഗാർത്ഥികൾക്ക് കാണാം.",
      },
      job_rejected: {
        title: "ജോലി നിരസിച്ചു",
        body: "ജോലിയുടെ പേര്: {jobTitle}\nജോലി ID: {publicJobId}\nനില: നിരസിച്ചു\nനിരസിക്കാനുള്ള കാരണം: {reason}\nപരിശോധിച്ചത്: {actor}\nജോലി അപ്ഡേറ്റ് ചെയ്ത് ഓപ്പറേഷൻസ് പരിശോധനയ്ക്ക് വീണ്ടും സമർപ്പിക്കുക.",
      },
      job_live_changes_approved: {
        title: "ജോലി മാറ്റങ്ങൾ അംഗീകരിച്ച് പ്രസിദ്ധീകരിച്ചു",
        body: "ജോലിയുടെ പേര്: {jobTitle}\nജോലി ID: {publicJobId}\nനില: ലൈവ്\nഅംഗീകരിച്ചത്: {actor}\nനിങ്ങളുടെ ജോലി മാറ്റങ്ങൾ ഇപ്പോൾ AsliJobs-ൽ ഉദ്യോഗാർത്ഥികൾക്ക് കാണാം.",
      },
      job_live_changes_rejected: {
        title: "ജോലി മാറ്റങ്ങൾ നിരസിച്ചു",
        body: "ജോലിയുടെ പേര്: {jobTitle}\nജോലി ID: {publicJobId}\nനില: ലൈവ് (മുൻ പതിപ്പ് മാറ്റമില്ല)\nനിരസിക്കാനുള്ള കാരണം: {reason}\nപരിശോധിച്ചത്: {actor}\nനിങ്ങളുടെ ലൈവ് ജോലിക്ക് മാറ്റമില്ല. മാറ്റങ്ങൾ എഡിറ്റ് ചെയ്ത് ഓപ്പറേഷൻസ് പരിശോധനയ്ക്ക് വീണ്ടും സമർപ്പിക്കുക.",
      },
    },
    mirror: {
      application_submitted: {
        title: "അപേക്ഷ സമർപ്പിച്ചു",
        body: "ഉദ്യോഗാർത്ഥി അപേക്ഷ സമർപ്പിച്ചു.",
      },
      application_viewed: {
        title: "അപേക്ഷ കണ്ടു",
        body: "നിങ്ങൾ ഈ അപേക്ഷ കണ്ടു.",
      },
      application_under_review: {
        title: "പരിശോധനയിൽ",
        body: "നിങ്ങൾ ഈ അപേക്ഷ പരിശോധനയിലേക്ക് മാറ്റി.",
      },
      application_shortlisted: {
        title: "ഉദ്യോഗാർത്ഥി ഷോർട്ട്‌ലിസ്റ്റിൽ",
        body: "നിങ്ങൾ ഈ ഉദ്യോഗാർത്ഥിയെ ഷോർട്ട്‌ലിസ്റ്റ് ചെയ്തു.",
      },
      interview_scheduled: {
        title: "ഇന്റർവ്യൂ നിശ്ചയിച്ചു",
        body: "{company} ൽ {jobTitle} ജോലിക്കായുള്ള ഇന്റർവ്യൂ നിശ്ചയിച്ചു.{details}",
      },
      interview_updated: {
        title: "ഇന്റർവ്യൂ അപ്ഡേറ്റ് ചെയ്തു",
        body: "{jobTitle} ജോലിക്കായുള്ള ഇന്റർവ്യൂ വിവരങ്ങൾ അപ്ഡേറ്റ് ചെയ്തു.{details}",
      },
      interview_completed: {
        title: "ഇന്റർവ്യൂ പൂർത്തിയായി",
        body: "നിങ്ങൾ ഈ ഇന്റർവ്യൂ പൂർത്തിയായതായി അടയാളപ്പെടുത്തി.",
      },
      interview_cancelled: {
        title: "ഇന്റർവ്യൂ റദ്ദാക്കി",
        body: "{jobTitle} ജോലിക്കായുള്ള ഇന്റർവ്യൂ{when} റദ്ദാക്കി. കാരണം: {reason}.",
      },
      offer_sent: {
        title: "ഓഫർ അയച്ചു",
        body: "{company} ൽ {jobTitle} ജോലിക്കായുള്ള ഓഫർ അയച്ചു.",
      },
      offer_accepted: {
        title: "ഓഫർ സ്വീകരിച്ചു",
        body: "ഉദ്യോഗാർത്ഥി ഓഫർ സ്വീകരിച്ചു.",
      },
      offer_declined: {
        title: "ഓഫർ നിരസിച്ചു",
        body: "ഉദ്യോഗാർത്ഥി ഓഫർ നിരസിച്ചു.",
      },
      application_selected: {
        title: "ഉദ്യോഗാർത്ഥിയെ തിരഞ്ഞെടുത്തു",
        body: "നിങ്ങൾ ഈ ഉദ്യോഗാർത്ഥിയെ തിരഞ്ഞെടുത്തതായി അടയാളപ്പെടുത്തി.",
      },
      application_joined: {
        title: "ഉദ്യോഗാർത്ഥി ചേർന്നു",
        body: "ഈ ഉദ്യോഗാർത്ഥി ചേർന്നതായി നിങ്ങൾ അടയാളപ്പെടുത്തി.",
      },
      application_did_not_join: {
        title: "ചേർന്നില്ല",
        body: "ഈ ഉദ്യോഗാർത്ഥി ചേർന്നില്ലെന്ന് നിങ്ങൾ അടയാളപ്പെടുത്തി.",
      },
      application_rejected: {
        title: "അപേക്ഷ നിരസിച്ചു",
        body: "നിങ്ങൾ ഈ അപേക്ഷ നിരസിച്ചു.",
      },
      application_withdrawn: {
        title: "ഉദ്യോഗാർത്ഥി പിൻവലിച്ചു",
        body: "ഉദ്യോഗാർത്ഥി ഈ അപേക്ഷ പിൻവലിച്ചു.",
      },
    },
  },
};

export const notificationTemplatesBundle = { en, hi, te, ta, kn, ml } as const;
