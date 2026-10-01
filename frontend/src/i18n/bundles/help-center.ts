type MessageShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : MessageShape<T[K]>;
};

const en = {
  helpCenter: {
    pageTitle: "Help Center",
    searchPlaceholder: "Search help articles...",
    emptyTitle: "No help articles found",
    emptyDescription:
      "Try a different keyword, or clear your search to browse all categories.",
    clearSearch: "Clear search",
    supportTitle: "Need more help?",
    supportDescription:
      "Contact our support team if you couldn't find your answer.",
    whatsapp: "WhatsApp Support",
    call: "Call Support",
    email: "Email Support",
    categoriesAria: "Help categories",
    categoriesLabel: "Categories",
    categories: {
      gettingStarted: {
        title: "Getting Started",
        description: "Core introduction layer",
        cardTitle: "Getting Started",
        cardDescription: "Core introduction layer",
        articles: {
          whatIsAslijobs: {
            question: "What is AsliJobs?",
            answer:
              "AsliJobs is a WhatsApp-based job portal created for India’s blue-collar, grey-collar, and entry-level workforce. It helps job seekers find suitable jobs and helps employers connect with the right candidates easily.",
          },
          howDoesAslijobsWork: {
            question: "How does AsliJobs work?",
            answer:
              "AsliJobs works through WhatsApp. Job seekers can register, receive job alerts, apply for jobs, and get interview updates, while employers can create profiles, post jobs, manage applications, shortlist candidates, and schedule interviews.",
          },
          whoCanUseAslijobs: {
            question: "Who can use AsliJobs?",
            answer:
              "AsliJobs can be used by job seekers looking for work and employers who want to hire workers. It is mainly designed for blue-collar, grey-collar, support, and entry-level job roles.",
          },
          needToDownloadApp: {
            question: "Do I need to download an app?",
            answer:
              "No. Job seekers and employers do not need to download any app. AsliJobs works directly through WhatsApp, making it simple and easy to use.",
          },
          isAslijobsFreeToUse: {
            question: "Is AsliJobs free to use?",
            answer:
              "Yes. AsliJobs is free for job seekers to search and apply for jobs. Some employer services, promotions, or hiring plans may be paid.",
          },
          whichCities: {
            question: "Which cities does AsliJobs serve?",
            answer:
              "AsliJobs serves job seekers and employers across India. Job seekers can search and apply for jobs from anywhere, while employers can post jobs from any location. Job availability may vary depending on the city, area, locality, and current employer openings.",
          },
          jobCategoriesAvailable: {
            question: "Which job categories are available?",
            answer:
              "AsliJobs supports industries such as manufacturing, construction, logistics and transportation, warehousing, retail, hospitality, facility management, security services, automotive, healthcare support, and other blue-collar and grey-collar sectors.",
          },
        },
      },
      jobSeekerHelp: {
        title: "Job Seeker Help",
        description: "For workers searching and applying for jobs",
        cardTitle: "Job Seeker Help",
        cardDescription: "For workers searching and applying for jobs",
        articles: {
          registerAsJobSeeker: {
            question: "How do I register as a job seeker?",
            answer:
              "You can register on AsliJobs through WhatsApp by sharing basic details like your name, mobile number, location, preferred language, job category, and experience.",
          },
          createJobProfile: {
            question: "How do I create my job profile?",
            answer:
              "You can create your job profile on the AsliJobs website by adding your preferred job category, skills, work experience, preferred location, expected salary, and availability. You can also upload an introduction video highlighting your background, skills, experience, and the type of job you are looking for.",
          },
          selectAreaLocality: {
            question: "How do I select my area or locality?",
            answer:
              "You can choose your city, area, or locality on WhatsApp so AsliJobs can show jobs that are closer to you.",
          },
          receiveJobAlertsSeeker: {
            question: "How will I receive job alerts?",
            answer:
              "You will receive suitable job alerts directly on WhatsApp based on your location, job category, and profile details when the Job Search Status badge is enabled on your AsliJobs profile. If the badge is turned off, you will not receive job alerts.",
          },
          applyForAJob: {
            question: "How do I apply for a job?",
            answer:
              "Job seekers can apply through the AsliJobs website or directly through WhatsApp by replying to a job alert or selecting the Apply option.",
          },
          checkApplicationStatus: {
            question: "How can I check my application status?",
            answer:
              "Application updates such as applied, shortlisted, interview scheduled, selected, or not selected will be shared through WhatsApp.",
          },
          updateMyProfile: {
            question: "How do I update my profile?",
            answer:
              "You can update your profile details through your profile on the AsliJobs website.",
          },
          changePreferredLanguage: {
            question: "How do I change my preferred language?",
            answer:
              "Yes. Users can change their preferred language through the AsliJobs website, WhatsApp, or by contacting AsliJobs support.",
          },
        },
      },
      employerHelp: {
        title: "Employer Help",
        description: "For businesses hiring workers",
        cardTitle: "Employer Help",
        cardDescription: "For businesses hiring workers",
        articles: {
          registerAsEmployer: {
            question: "How do I register as an employer?",
            answer:
              "You can register as an employer on AsliJobs by providing your employer name, company name, and contact details. Your WhatsApp number must be verified using an OTP.",
          },
          postAJob: {
            question: "How do I post a job?",
            answer:
              "You must complete your company profile before posting a job. Provide the job title, location, salary, work timings, number of openings, required experience, and other important details.",
          },
          jobPostRejected: {
            question: "Why was my job post rejected?",
            answer:
              "A job post may be rejected if it has incomplete details, false information, unclear salary, wrong location, misleading content, or violates platform guidelines and if the subscription has ended.",
          },
          viewApplications: {
            question: "How can I view applications?",
            answer:
              "Employers can view, shortlist applications received for their job posts through the employer dashboard or updates shared by the AsliJobs team.",
          },
          closeJobPost: {
            question: "How do I close a job post?",
            answer:
              "You can close a job post once the position is filled, paused, cancelled, or no longer available.",
          },
          employersContactSupport: {
            question: "How can employers contact support?",
            answer:
              "Employers can contact AsliJobs support through WhatsApp, email, or the available support option for job posting, applications, payments, or hiring help.",
          },
        },
      },
      whatsappHelp: {
        title: "WhatsApp Help",
        description: "Explains the WhatsApp-based experience",
        cardTitle: "WhatsApp Help",
        cardDescription: "Explains the WhatsApp-based experience",
        articles: {
          startOnWhatsapp: {
            question: "How do I start using AsliJobs on WhatsApp?",
            answer:
              "You can start by clicking the AsliJobs WhatsApp link, scanning the QR code, or sending a message to the official AsliJobs WhatsApp number.",
          },
          receiveJobAlertsWhatsapp: {
            question: "How will I receive job alerts?",
            answer:
              "You will receive job alerts on WhatsApp based on your location, job category, experience, and profile details.",
          },
          replyToMessages: {
            question: "How should I reply to messages?",
            answer:
              "You can reply using the given options, such as Apply, Yes, No, Help, or any other option shown in the WhatsApp message.",
          },
          applyThroughWhatsapp: {
            question: "Can I apply for jobs through WhatsApp?",
            answer:
              "Yes. You can apply for jobs directly through WhatsApp by replying to the job alert or selecting the apply option.",
          },
          notReceivingWhatsappMessages: {
            question: "Why am I not receiving WhatsApp messages?",
            answer:
              "You may not receive messages due to network issues, wrong number, blocked number, or inactive WhatsApp.",
          },
          officialAslijobsNumber: {
            question: "How do I know the official AsliJobs number?",
            answer:
              "Always check the official AsliJobs website for the correct WhatsApp number.",
          },
        },
      },
      applicationsInterviews: {
        title: "Applications & Interviews",
        description: "Explains the hiring journey clearly",
        cardTitle: "Applications & Interviews",
        cardDescription: "Explains the hiring journey clearly",
        articles: {
          afterIApply: {
            question: "What happens after I apply for a job?",
            answer:
              "After you apply, your application is shared with the employer for review. You will receive further updates through WhatsApp.",
          },
          shortlistedMeans: {
            question: "What does shortlisted mean?",
            answer:
              "Shortlisted means the employer has selected your profile for the next step, such as an interview or further discussion.",
          },
          interviewUpdates: {
            question: "How will I get interview updates?",
            answer:
              "Interview updates such as date, time, location, and contact person details will be shared with you through WhatsApp.",
          },
          interviewDocuments: {
            question: "What documents should I carry for an interview?",
            answer:
              "You may need to carry an ID proof, experience details, certificates, or any documents requested by the employer.",
          },
          selectedStatusMeans: {
            question: "What does selected status mean?",
            answer:
              "Selected means the employer has chosen you for the job after reviewing your profile or interview performance.",
          },
          joiningConfirmation: {
            question: "What is joining confirmation?",
            answer:
              "Joining confirmation means the employer has confirmed your joining date, time, location, and other required details.",
          },
        },
      },
      profileVideoProfile: {
        title: "Profile & Video Profile",
        description: "Helps users build better profiles",
        cardTitle: "Profile & Video Profile",
        cardDescription: "Helps users build better profiles",
        articles: {
          profileDetailsIncluded: {
            question: "What details are included in a job seeker profile?",
            answer:
              "A job seeker profile includes details such as name, mobile number, preferred job category, skills, work experience, preferred location, expected salary, availability, and preferred language.",
          },
          jobSeekersUpdateProfile: {
            question: "How can job seekers update their profile?",
            answer:
              "Job seekers can update their profile details through their profile on the AsliJobs website.",
          },
          jobSearchStatusBadge: {
            question: "What is the job search status badge?",
            answer:
              "This badge indicates that you are actively looking for a job. You need to enable this badge on your AsliJobs profile to receive job alerts. If the badge is turned off, you will not receive job alerts.",
          },
          introductionVideoMeaning: {
            question: "What is an introduction video?",
            answer:
              "An introduction video is a short video in which the job seeker introduces themselves and explains their skills, work experience, preferred job role, and availability.",
          },
          createIntroductionVideo: {
            question: "How can job seekers create an introduction video?",
            answer:
              "Job seekers can record a short and clear video introducing themselves and upload or share it through the option provided by AsliJobs.",
          },
          includeInIntroductionVideo: {
            question: "What should job seekers include in the introduction video?",
            answer:
              "Job seekers should mention their name, skills, work experience, preferred job category, preferred work location, availability, and any relevant qualifications or certifications.",
          },
        },
      },
      languageSupport: {
        title: "Language Support",
        description: "For regional language accessibility",
        cardTitle: "Language Support",
        cardDescription: "For regional language accessibility",
        articles: {
          supportedLanguages: {
            question: "Which languages does AsliJobs support?",
            answer:
              "AsliJobs supports English, Hindi, Telugu, Tamil, Kannada, and Malayalam.",
          },
          changeMyLanguage: {
            question: "How can I change my language?",
            answer:
              "Yes. Users can change their preferred language through the AsliJobs website, WhatsApp, or by contacting AsliJobs support.",
          },
          alertsInLocalLanguage: {
            question: "Can I receive job alerts in my local language?",
            answer:
              "Yes. AsliJobs can send job alerts and important updates in your preferred language, where available.",
          },
        },
      },
      safetyReporting: {
        title: "Safety & Reporting",
        description: "User trust and protection layer",
        cardTitle: "Safety & Reporting",
        cardDescription: "User trust and protection layer",
        articles: {
          identifyFakeJob: {
            question: "How can I identify a fake job?",
            answer:
              "Be careful of jobs with unclear company details, fake salary promises, wrong location, payment demands, or suspicious interview instructions.",
          },
          payMoneyForJob: {
            question: "Should I pay money to get a job?",
            answer:
              "No. Job seekers should not pay money for job confirmation. If anyone asks for payment, report it to AsliJobs immediately.",
          },
          reportFakeJob: {
            question: "How can I report a fake job?",
            answer:
              "You can report a fake or suspicious job by contacting AsliJobs support through WhatsApp or the available support option.",
          },
          reportEmployerMisconduct: {
            question: "How can I report employer misconduct?",
            answer:
              "You can report employer misconduct by sharing the employer name, job title, issue details, and any screenshots with AsliJobs support.",
          },
          abusiveMessages: {
            question: "What should I do if I receive abusive messages?",
            answer:
              "Do not respond further. Take a screenshot and report the message to AsliJobs support immediately.",
          },
          informationNotToShare: {
            question: "What information should I not share?",
            answer:
              "Do not share OTPs, bank details, passwords, UPI PINs, personal documents, or sensitive information with unknown persons.",
          },
          interviewSafetyTips: {
            question: "What safety tips should I follow for interviews?",
            answer:
              "Check the company name, interview location, contact person, and job details before attending. Inform a family member or friend if needed.",
          },
          platformSafetyChecks: {
            question: "How does AsliJobs keep the platform safe?",
            answer:
              "AsliJobs may review employers, complaints, and suspicious activity to maintain a safer hiring experience.",
          },
        },
      },
      paymentsPlansPromotions: {
        title: "Payments, Plans & Promotions",
        description: "Mainly for employers",
        cardTitle: "Payments & Promotions",
        cardDescription: "Mainly for employers",
        articles: {
          freeAndPaidServices: {
            question: "Which services are free and paid?",
            answer:
              "AsliJobs is free for job seekers to search and apply for jobs. Employer services, hiring plans, and promotions may be paid.",
          },
          employerPlans: {
            question: "What are employer plans?",
            answer:
              "Employer plans are paid options that help businesses post jobs, receive applications, promote openings, and manage hiring better.",
          },
          promotedJobs: {
            question: "What are promoted jobs?",
            answer:
              "Promoted jobs are job posts given extra visibility so more suitable job seekers can see and apply for them.",
          },
          campaignPromotions: {
            question: "What are campaign promotions?",
            answer:
              "Campaign promotions help employers reach job seekers through targeted job alerts based on location, job category, and language.",
          },
          paymentSupport: {
            question: "How can I get payment support?",
            answer:
              "Employers can contact AsliJobs support for help with payments, plan activation, failed transactions, or billing issues.",
          },
          getAnInvoice: {
            question: "How can I get an invoice?",
            answer:
              "Employers can request an invoice through AsliJobs support after completing the payment.",
          },
        },
      },
      accountDataHelp: {
        title: "Account & Data Help",
        description: "Profile, privacy, and data control",
        cardTitle: "Account & Data",
        cardDescription: "Profile, privacy, and data control",
        articles: {
          updateAccountDetails: {
            question: "How can I update my account details?",
            answer:
              "Job seekers can update their profile details through their profile on the AsliJobs website, while employers can update their details through the employer dashboard. They can also contact AsliJobs support through WhatsApp or the available support options.",
          },
          changeMobileNumber: {
            question: "How can I change my mobile number?",
            answer:
              "Job seekers can update their mobile number through their profile on the AsliJobs website, while employers can update it through the employer dashboard. They can also contact AsliJobs support and provide the required verification details.",
          },
          deactivateAccount: {
            question: "How can users deactivate their account?",
            answer:
              "Job seekers can deactivate their account through their profile settings on the AsliJobs website, while employers can deactivate their account through the employer dashboard. Users can also contact AsliJobs support for assistance with account deactivation.",
          },
          howDataIsUsed: {
            question: "How does AsliJobs use my data?",
            answer:
              "AsliJobs uses your data to provide job alerts, manage applications, support hiring, improve services, and communicate with you.",
          },
          whoCanSeeProfile: {
            question: "Who can see my profile?",
            answer:
              "Your profile may be viewed by AsliJobs admins and relevant employers for job search, application, and hiring purposes.",
          },
          removeJobVideo: {
            question: "How can I remove a job video?",
            answer:
              "Job seekers can remove or delete their old introduction video and upload a new one through their profile on the AsliJobs website or by contacting AsliJobs support.",
          },
          privacySupport: {
            question: "How can I get privacy support?",
            answer:
              "You can contact AsliJobs support for any privacy-related questions, data updates, deletion requests, or account concerns.",
          },
        },
      },
      contactSupport: {
        title: "Contact Support",
        description: "Final help and complaint layer",
        cardTitle: "Contact Support",
        cardDescription: "Final help and complaint layer",
        articles: {
          contactAslijobsSupport: {
            question: "How can I contact AsliJobs support?",
            answer: "You can contact AsliJobs support through WhatsApp, phone, or email.",
          },
          raiseAComplaint: {
            question: "How can I raise a complaint?",
            answer:
              "You can raise a complaint by sharing your issue with AsliJobs support through WhatsApp, phone, or email.",
          },
          complaintDetails: {
            question: "What details should I provide for a complaint?",
            answer:
              "Job seekers should share their name, mobile number, job title, employer name, issue details, and screenshots, if available. Employers should share their name, company name, mobile number, job title or Job ID, candidate details, issue details, and relevant screenshots, if available.",
          },
          reopenAComplaint: {
            question: "How can I reopen a complaint?",
            answer:
              "You can request to reopen a complaint if the issue is not resolved or if you need further support.",
          },
          supportResponseTime: {
            question: "How long does support take to respond?",
            answer:
              "AsliJobs will try to respond as soon as possible. Response time may vary based on the issue and support availability.",
          },
          contactSupportWhatsapp: {
            question: "Can I contact support through WhatsApp?",
            answer: "Yes. You can contact AsliJobs support through the official WhatsApp number.",
          },
          contactSupportEmail: {
            question: "Can I contact support through email?",
            answer:
              "Yes. You can contact AsliJobs support through the official support email address.",
          },
        },
      },
    },
  },
} as const;

const hi: MessageShape<typeof en> = {
  helpCenter: {
    pageTitle: "सहायता केंद्र",
    searchPlaceholder: "सहायता लेख खोजें...",
    emptyTitle: "कोई सहायता लेख नहीं मिला",
    emptyDescription:
      "कोई दूसरा शब्द आज़माएँ, या सभी श्रेणियाँ देखने के लिए अपनी खोज साफ़ करें।",
    clearSearch: "खोज साफ़ करें",
    supportTitle: "और मदद चाहिए?",
    supportDescription:
      "अगर आपको अपना जवाब नहीं मिला, तो हमारी सपोर्ट टीम से संपर्क करें।",
    whatsapp: "WhatsApp सपोर्ट",
    call: "कॉल सपोर्ट",
    email: "ईमेल सपोर्ट",
    categoriesAria: "सहायता श्रेणियाँ",
    categoriesLabel: "श्रेणियाँ",
    categories: {
      gettingStarted: {
        title: "शुरुआत करें",
        description: "मुख्य परिचय स्तर",
        cardTitle: "शुरुआत करें",
        cardDescription: "मुख्य परिचय स्तर",
        articles: {
          whatIsAslijobs: {
            question: "AsliJobs क्या है?",
            answer:
              "AsliJobs भारत के ब्लू-कॉलर, ग्रे-कॉलर और एंट्री-लेवल कामगारों के लिए बनाया गया WhatsApp-आधारित जॉब पोर्टल है। यह नौकरी खोजने वालों को उपयुक्त नौकरियाँ खोजने में और नियोक्ताओं को सही उम्मीदवारों से आसानी से जुड़ने में मदद करता है।",
          },
          howDoesAslijobsWork: {
            question: "AsliJobs कैसे काम करता है?",
            answer:
              "AsliJobs WhatsApp के ज़रिए काम करता है। नौकरी खोजने वाले रजिस्टर कर सकते हैं, जॉब अलर्ट पा सकते हैं, नौकरियों के लिए आवेदन कर सकते हैं और इंटरव्यू अपडेट ले सकते हैं, जबकि नियोक्ता प्रोफ़ाइल बना सकते हैं, नौकरियाँ पोस्ट कर सकते हैं, आवेदन प्रबंधित कर सकते हैं, उम्मीदवारों को शॉर्टलिस्ट कर सकते हैं और इंटरव्यू तय कर सकते हैं।",
          },
          whoCanUseAslijobs: {
            question: "AsliJobs का उपयोग कौन कर सकता है?",
            answer:
              "काम ढूँढ रहे नौकरी खोजने वाले और कामगारों की भर्ती करना चाहने वाले नियोक्ता AsliJobs का उपयोग कर सकते हैं। यह मुख्य रूप से ब्लू-कॉलर, ग्रे-कॉलर, सपोर्ट और एंट्री-लेवल जॉब रोल के लिए बनाया गया है।",
          },
          needToDownloadApp: {
            question: "क्या मुझे कोई ऐप डाउनलोड करना होगा?",
            answer:
              "नहीं। नौकरी खोजने वालों और नियोक्ताओं को कोई ऐप डाउनलोड करने की ज़रूरत नहीं है। AsliJobs सीधे WhatsApp के ज़रिए काम करता है, इसलिए इसका उपयोग सरल और आसान है।",
          },
          isAslijobsFreeToUse: {
            question: "क्या AsliJobs का उपयोग मुफ़्त है?",
            answer:
              "हाँ। नौकरी खोजने वालों के लिए नौकरियाँ खोजना और आवेदन करना AsliJobs पर मुफ़्त है। कुछ नियोक्ता सेवाएँ, प्रमोशन या हायरिंग प्लान पेड हो सकते हैं।",
          },
          whichCities: {
            question: "AsliJobs किन शहरों में सेवा देता है?",
            answer:
              "AsliJobs पूरे भारत में नौकरी खोजने वालों और नियोक्ताओं की सेवा करता है। नौकरी खोजने वाले कहीं से भी नौकरियाँ खोज और आवेदन कर सकते हैं, और नियोक्ता किसी भी स्थान से नौकरियाँ पोस्ट कर सकते हैं। नौकरियों की उपलब्धता शहर, इलाके, लोकेलिटी और मौजूदा नियोक्ता रिक्तियों के अनुसार बदल सकती है।",
          },
          jobCategoriesAvailable: {
            question: "कौन-सी नौकरी श्रेणियाँ उपलब्ध हैं?",
            answer:
              "AsliJobs मैन्युफैक्चरिंग, निर्माण, लॉजिस्टिक्स और परिवहन, वेयरहाउसिंग, रिटेल, हॉस्पिटैलिटी, फैसिलिटी मैनेजमेंट, सिक्योरिटी सेवाएँ, ऑटोमोटिव, हेल्थकेयर सपोर्ट और अन्य ब्लू-कॉलर तथा ग्रे-कॉलर क्षेत्रों जैसे उद्योगों का समर्थन करता है।",
          },
        },
      },
      jobSeekerHelp: {
        title: "नौकरी खोजने वालों की सहायता",
        description: "नौकरी खोजने और आवेदन करने वाले कामगारों के लिए",
        cardTitle: "नौकरी खोजने वालों की सहायता",
        cardDescription: "नौकरी खोजने और आवेदन करने वाले कामगारों के लिए",
        articles: {
          registerAsJobSeeker: {
            question: "मैं नौकरी खोजने वाले के रूप में कैसे रजिस्टर करूँ?",
            answer:
              "आप WhatsApp के ज़रिए AsliJobs पर अपना नाम, मोबाइल नंबर, स्थान, पसंदीदा भाषा, नौकरी श्रेणी और अनुभव जैसी बुनियादी जानकारी साझा करके रजिस्टर कर सकते हैं।",
          },
          createJobProfile: {
            question: "मैं अपनी जॉब प्रोफ़ाइल कैसे बनाऊँ?",
            answer:
              "आप AsliJobs वेबसाइट पर अपनी पसंदीदा नौकरी श्रेणी, कौशल, कार्य अनुभव, पसंदीदा स्थान, अपेक्षित वेतन और उपलब्धता जोड़कर अपनी जॉब प्रोफ़ाइल बना सकते हैं। आप अपनी पृष्ठभूमि, कौशल, अनुभव और जिस तरह की नौकरी आप ढूँढ रहे हैं, उसे बताने वाला परिचय वीडियो भी अपलोड कर सकते हैं।",
          },
          selectAreaLocality: {
            question: "मैं अपना इलाका या लोकेलिटी कैसे चुनूँ?",
            answer:
              "आप WhatsApp पर अपना शहर, इलाका या लोकेलिटी चुन सकते हैं, ताकि AsliJobs आपको आपके नज़दीक की नौकरियाँ दिखा सके।",
          },
          receiveJobAlertsSeeker: {
            question: "मुझे जॉब अलर्ट कैसे मिलेंगे?",
            answer:
              "जब आपकी AsliJobs प्रोफ़ाइल पर जॉब सर्च स्टेटस बैज चालू होगा, तब आपको स्थान, नौकरी श्रेणी और प्रोफ़ाइल विवरण के आधार पर उपयुक्त जॉब अलर्ट सीधे WhatsApp पर मिलेंगे। अगर बैज बंद है, तो आपको जॉब अलर्ट नहीं मिलेंगे।",
          },
          applyForAJob: {
            question: "मैं नौकरी के लिए कैसे आवेदन करूँ?",
            answer:
              "नौकरी खोजने वाले AsliJobs वेबसाइट से या सीधे WhatsApp पर जॉब अलर्ट का जवाब देकर या आवेदन विकल्प चुनकर आवेदन कर सकते हैं।",
          },
          checkApplicationStatus: {
            question: "मैं अपने आवेदन की स्थिति कैसे देखूँ?",
            answer:
              "आवेदन किया, शॉर्टलिस्ट, इंटरव्यू तय, चयनित या चयनित नहीं जैसे आवेदन अपडेट WhatsApp के ज़रिए साझा किए जाएँगे।",
          },
          updateMyProfile: {
            question: "मैं अपनी प्रोफ़ाइल कैसे अपडेट करूँ?",
            answer:
              "आप AsliJobs वेबसाइट पर अपनी प्रोफ़ाइल से प्रोफ़ाइल विवरण अपडेट कर सकते हैं।",
          },
          changePreferredLanguage: {
            question: "मैं अपनी पसंदीदा भाषा कैसे बदलूँ?",
            answer:
              "हाँ। उपयोगकर्ता AsliJobs वेबसाइट, WhatsApp या AsliJobs सपोर्ट से संपर्क करके अपनी पसंदीदा भाषा बदल सकते हैं।",
          },
        },
      },
      employerHelp: {
        title: "नियोक्ता सहायता",
        description: "कामगारों की भर्ती करने वाले व्यवसायों के लिए",
        cardTitle: "नियोक्ता सहायता",
        cardDescription: "कामगारों की भर्ती करने वाले व्यवसायों के लिए",
        articles: {
          registerAsEmployer: {
            question: "मैं नियोक्ता के रूप में कैसे रजिस्टर करूँ?",
            answer:
              "आप अपना नियोक्ता नाम, कंपनी का नाम और संपर्क विवरण देकर AsliJobs पर नियोक्ता के रूप में रजिस्टर कर सकते हैं। आपके WhatsApp नंबर को OTP से सत्यापित करना ज़रूरी है।",
          },
          postAJob: {
            question: "मैं नौकरी कैसे पोस्ट करूँ?",
            answer:
              "नौकरी पोस्ट करने से पहले आपको अपनी कंपनी प्रोफ़ाइल पूरी करनी होगी। जॉब टाइटल, स्थान, वेतन, कार्य समय, रिक्तियों की संख्या, आवश्यक अनुभव और अन्य ज़रूरी विवरण दें।",
          },
          jobPostRejected: {
            question: "मेरी जॉब पोस्ट अस्वीकार क्यों हुई?",
            answer:
              "अगर जॉब पोस्ट में अधूरे विवरण, गलत जानकारी, अस्पष्ट वेतन, गलत स्थान, भ्रामक सामग्री हो, या वह प्लेटफ़ॉर्म दिशानिर्देशों का उल्लंघन करती हो, और अगर सदस्यता समाप्त हो गई हो, तो उसे अस्वीकार किया जा सकता है।",
          },
          viewApplications: {
            question: "मैं आवेदन कैसे देखूँ?",
            answer:
              "नियोक्ता अपनी जॉब पोस्ट के लिए आए आवेदनों को नियोक्ता डैशबोर्ड से या AsliJobs टीम द्वारा साझा अपडेट से देख और शॉर्टलिस्ट कर सकते हैं।",
          },
          closeJobPost: {
            question: "मैं जॉब पोस्ट कैसे बंद करूँ?",
            answer:
              "जब पद भर जाए, रोक दिया जाए, रद्द हो जाए या अब उपलब्ध न हो, तब आप जॉब पोस्ट बंद कर सकते हैं।",
          },
          employersContactSupport: {
            question: "नियोक्ता सपोर्ट से कैसे संपर्क कर सकते हैं?",
            answer:
              "नियोक्ता नौकरी पोस्ट करने, आवेदनों, भुगतान या भर्ती सहायता के लिए WhatsApp, ईमेल या उपलब्ध सपोर्ट विकल्प से AsliJobs सपोर्ट से संपर्क कर सकते हैं।",
          },
        },
      },
      whatsappHelp: {
        title: "WhatsApp सहायता",
        description: "WhatsApp-आधारित अनुभव समझाता है",
        cardTitle: "WhatsApp सहायता",
        cardDescription: "WhatsApp-आधारित अनुभव समझाता है",
        articles: {
          startOnWhatsapp: {
            question: "मैं WhatsApp पर AsliJobs का उपयोग कैसे शुरू करूँ?",
            answer:
              "आप AsliJobs WhatsApp लिंक पर क्लिक करके, QR कोड स्कैन करके या आधिकारिक AsliJobs WhatsApp नंबर पर संदेश भेजकर शुरू कर सकते हैं।",
          },
          receiveJobAlertsWhatsapp: {
            question: "मुझे जॉब अलर्ट कैसे मिलेंगे?",
            answer:
              "आपको अपने स्थान, नौकरी श्रेणी, अनुभव और प्रोफ़ाइल विवरण के आधार पर WhatsApp पर जॉब अलर्ट मिलेंगे।",
          },
          replyToMessages: {
            question: "मुझे संदेशों का जवाब कैसे देना चाहिए?",
            answer:
              "आप दिए गए विकल्पों से जवाब दे सकते हैं, जैसे आवेदन करें, हाँ, नहीं, सहायता, या WhatsApp संदेश में दिखाया गया कोई अन्य विकल्प।",
          },
          applyThroughWhatsapp: {
            question: "क्या मैं WhatsApp से नौकरियों के लिए आवेदन कर सकता हूँ?",
            answer:
              "हाँ। आप जॉब अलर्ट का जवाब देकर या आवेदन विकल्प चुनकर सीधे WhatsApp से नौकरियों के लिए आवेदन कर सकते हैं।",
          },
          notReceivingWhatsappMessages: {
            question: "मुझे WhatsApp संदेश क्यों नहीं मिल रहे?",
            answer:
              "नेटवर्क समस्या, गलत नंबर, ब्लॉक किया गया नंबर या निष्क्रिय WhatsApp के कारण आपको संदेश नहीं मिल सकते।",
          },
          officialAslijobsNumber: {
            question: "मुझे आधिकारिक AsliJobs नंबर कैसे पता चलेगा?",
            answer:
              "सही WhatsApp नंबर के लिए हमेशा आधिकारिक AsliJobs वेबसाइट देखें।",
          },
        },
      },
      applicationsInterviews: {
        title: "आवेदन और इंटरव्यू",
        description: "भर्ती की यात्रा स्पष्ट रूप से समझाता है",
        cardTitle: "आवेदन और इंटरव्यू",
        cardDescription: "भर्ती की यात्रा स्पष्ट रूप से समझाता है",
        articles: {
          afterIApply: {
            question: "नौकरी के लिए आवेदन करने के बाद क्या होता है?",
            answer:
              "आवेदन करने के बाद आपका आवेदन समीक्षा के लिए नियोक्ता के साथ साझा किया जाता है। आगे के अपडेट आपको WhatsApp पर मिलेंगे।",
          },
          shortlistedMeans: {
            question: "शॉर्टलिस्ट का क्या मतलब है?",
            answer:
              "शॉर्टलिस्ट का मतलब है कि नियोक्ता ने अगले चरण, जैसे इंटरव्यू या आगे की बातचीत, के लिए आपकी प्रोफ़ाइल चुनी है।",
          },
          interviewUpdates: {
            question: "मुझे इंटरव्यू अपडेट कैसे मिलेंगे?",
            answer:
              "तारीख, समय, स्थान और संपर्क व्यक्ति के विवरण जैसे इंटरव्यू अपडेट WhatsApp के ज़रिए आपके साथ साझा किए जाएँगे।",
          },
          interviewDocuments: {
            question: "इंटरव्यू के लिए मुझे कौन-से दस्तावेज़ ले जाने चाहिए?",
            answer:
              "आपको पहचान प्रमाण, अनुभव विवरण, प्रमाणपत्र या नियोक्ता द्वारा माँगे गए कोई भी दस्तावेज़ ले जाने पड़ सकते हैं।",
          },
          selectedStatusMeans: {
            question: "चयनित स्थिति का क्या मतलब है?",
            answer:
              "चयनित का मतलब है कि नियोक्ता ने आपकी प्रोफ़ाइल या इंटरव्यू प्रदर्शन की समीक्षा के बाद आपको नौकरी के लिए चुना है।",
          },
          joiningConfirmation: {
            question: "जॉइनिंग पुष्टि क्या है?",
            answer:
              "जॉइनिंग पुष्टि का मतलब है कि नियोक्ता ने आपकी जॉइनिंग की तारीख, समय, स्थान और अन्य आवश्यक विवरण की पुष्टि कर दी है।",
          },
        },
      },
      profileVideoProfile: {
        title: "प्रोफ़ाइल और वीडियो प्रोफ़ाइल",
        description: "उपयोगकर्ताओं को बेहतर प्रोफ़ाइल बनाने में मदद करता है",
        cardTitle: "प्रोफ़ाइल और वीडियो प्रोफ़ाइल",
        cardDescription: "उपयोगकर्ताओं को बेहतर प्रोफ़ाइल बनाने में मदद करता है",
        articles: {
          profileDetailsIncluded: {
            question: "नौकरी खोजने वाले की प्रोफ़ाइल में कौन-से विवरण होते हैं?",
            answer:
              "नौकरी खोजने वाले की प्रोफ़ाइल में नाम, मोबाइल नंबर, पसंदीदा नौकरी श्रेणी, कौशल, कार्य अनुभव, पसंदीदा स्थान, अपेक्षित वेतन, उपलब्धता और पसंदीदा भाषा जैसे विवरण शामिल होते हैं।",
          },
          jobSeekersUpdateProfile: {
            question: "नौकरी खोजने वाले अपनी प्रोफ़ाइल कैसे अपडेट कर सकते हैं?",
            answer:
              "नौकरी खोजने वाले AsliJobs वेबसाइट पर अपनी प्रोफ़ाइल से प्रोफ़ाइल विवरण अपडेट कर सकते हैं।",
          },
          jobSearchStatusBadge: {
            question: "जॉब सर्च स्टेटस बैज क्या है?",
            answer:
              "यह बैज दर्शाता है कि आप सक्रिय रूप से नौकरी खोज रहे हैं। जॉब अलर्ट पाने के लिए आपको अपनी AsliJobs प्रोफ़ाइल पर यह बैज चालू करना होगा। अगर बैज बंद है, तो आपको जॉब अलर्ट नहीं मिलेंगे।",
          },
          introductionVideoMeaning: {
            question: "परिचय वीडियो क्या है?",
            answer:
              "परिचय वीडियो एक छोटा वीडियो है जिसमें नौकरी खोजने वाला अपना परिचय देता है और अपने कौशल, कार्य अनुभव, पसंदीदा जॉब रोल और उपलब्धता बताता है।",
          },
          createIntroductionVideo: {
            question: "नौकरी खोजने वाले परिचय वीडियो कैसे बना सकते हैं?",
            answer:
              "नौकरी खोजने वाले अपना परिचय देते हुए एक छोटा और स्पष्ट वीडियो रिकॉर्ड कर सकते हैं और उसे AsliJobs द्वारा दिए गए विकल्प से अपलोड या साझा कर सकते हैं।",
          },
          includeInIntroductionVideo: {
            question: "परिचय वीडियो में नौकरी खोजने वालों को क्या शामिल करना चाहिए?",
            answer:
              "नौकरी खोजने वालों को अपना नाम, कौशल, कार्य अनुभव, पसंदीदा नौकरी श्रेणी, पसंदीदा कार्य स्थान, उपलब्धता और कोई भी संबंधित योग्यता या प्रमाणपत्र बताना चाहिए।",
          },
        },
      },
      languageSupport: {
        title: "भाषा सहायता",
        description: "क्षेत्रीय भाषा की पहुँच के लिए",
        cardTitle: "भाषा सहायता",
        cardDescription: "क्षेत्रीय भाषा की पहुँच के लिए",
        articles: {
          supportedLanguages: {
            question: "AsliJobs किन भाषाओं का समर्थन करता है?",
            answer:
              "AsliJobs अंग्रेज़ी, हिंदी, तेलुगु, तमिल, कन्नड़ और मलयालम का समर्थन करता है।",
          },
          changeMyLanguage: {
            question: "मैं अपनी भाषा कैसे बदलूँ?",
            answer:
              "हाँ। उपयोगकर्ता AsliJobs वेबसाइट, WhatsApp या AsliJobs सपोर्ट से संपर्क करके अपनी पसंदीदा भाषा बदल सकते हैं।",
          },
          alertsInLocalLanguage: {
            question: "क्या मुझे अपनी स्थानीय भाषा में जॉब अलर्ट मिल सकते हैं?",
            answer:
              "हाँ। जहाँ उपलब्ध हो, AsliJobs आपकी पसंदीदा भाषा में जॉब अलर्ट और महत्वपूर्ण अपडेट भेज सकता है।",
          },
        },
      },
      safetyReporting: {
        title: "सुरक्षा और रिपोर्टिंग",
        description: "उपयोगकर्ता विश्वास और सुरक्षा स्तर",
        cardTitle: "सुरक्षा और रिपोर्टिंग",
        cardDescription: "उपयोगकर्ता विश्वास और सुरक्षा स्तर",
        articles: {
          identifyFakeJob: {
            question: "मैं नकली नौकरी कैसे पहचानूँ?",
            answer:
              "अस्पष्ट कंपनी विवरण, नकली वेतन के वादे, गलत स्थान, भुगतान की माँग या संदिग्ध इंटरव्यू निर्देश वाली नौकरियों से सावधान रहें।",
          },
          payMoneyForJob: {
            question: "क्या नौकरी पाने के लिए मुझे पैसे देने चाहिए?",
            answer:
              "नहीं। नौकरी की पुष्टि के लिए नौकरी खोजने वालों को पैसे नहीं देने चाहिए। अगर कोई भुगतान माँगे, तो तुरंत AsliJobs को रिपोर्ट करें।",
          },
          reportFakeJob: {
            question: "मैं नकली नौकरी की रिपोर्ट कैसे करूँ?",
            answer:
              "आप WhatsApp या उपलब्ध सपोर्ट विकल्प से AsliJobs सपोर्ट से संपर्क करके नकली या संदिग्ध नौकरी की रिपोर्ट कर सकते हैं।",
          },
          reportEmployerMisconduct: {
            question: "मैं नियोक्ता के दुराचार की रिपोर्ट कैसे करूँ?",
            answer:
              "आप नियोक्ता का नाम, जॉब टाइटल, समस्या का विवरण और कोई भी स्क्रीनशॉट AsliJobs सपोर्ट के साथ साझा करके नियोक्ता के दुराचार की रिपोर्ट कर सकते हैं।",
          },
          abusiveMessages: {
            question: "अगर मुझे अपमानजनक संदेश मिलें तो मुझे क्या करना चाहिए?",
            answer:
              "आगे जवाब न दें। स्क्रीनशॉट लें और संदेश की तुरंत AsliJobs सपोर्ट को रिपोर्ट करें।",
          },
          informationNotToShare: {
            question: "मुझे कौन-सी जानकारी साझा नहीं करनी चाहिए?",
            answer:
              "अनजान लोगों के साथ OTP, बैंक विवरण, पासवर्ड, UPI PIN, व्यक्तिगत दस्तावेज़ या संवेदनशील जानकारी साझा न करें।",
          },
          interviewSafetyTips: {
            question: "इंटरव्यू के लिए मुझे कौन-सी सुरक्षा सलाह माननी चाहिए?",
            answer:
              "जाने से पहले कंपनी का नाम, इंटरव्यू स्थान, संपर्क व्यक्ति और नौकरी का विवरण जाँचें। ज़रूरत हो तो परिवार के किसी सदस्य या मित्र को बता दें।",
          },
          platformSafetyChecks: {
            question: "AsliJobs प्लेटफ़ॉर्म को सुरक्षित कैसे रखता है?",
            answer:
              "सुरक्षित भर्ती अनुभव बनाए रखने के लिए AsliJobs नियोक्ताओं, शिकायतों और संदिग्ध गतिविधि की समीक्षा कर सकता है।",
          },
        },
      },
      paymentsPlansPromotions: {
        title: "भुगतान, प्लान और प्रमोशन",
        description: "मुख्य रूप से नियोक्ताओं के लिए",
        cardTitle: "भुगतान और प्रमोशन",
        cardDescription: "मुख्य रूप से नियोक्ताओं के लिए",
        articles: {
          freeAndPaidServices: {
            question: "कौन-सी सेवाएँ मुफ़्त हैं और कौन-सी पेड?",
            answer:
              "नौकरी खोजने वालों के लिए नौकरियाँ खोजना और आवेदन करना AsliJobs पर मुफ़्त है। नियोक्ता सेवाएँ, हायरिंग प्लान और प्रमोशन पेड हो सकते हैं।",
          },
          employerPlans: {
            question: "नियोक्ता प्लान क्या हैं?",
            answer:
              "नियोक्ता प्लान पेड विकल्प हैं जो व्यवसायों को नौकरियाँ पोस्ट करने, आवेदन पाने, रिक्तियों को प्रमोट करने और भर्ती बेहतर ढंग से प्रबंधित करने में मदद करते हैं।",
          },
          promotedJobs: {
            question: "प्रमोटेड नौकरियाँ क्या हैं?",
            answer:
              "प्रमोटेड नौकरियाँ ऐसी जॉब पोस्ट हैं जिन्हें अतिरिक्त दृश्यता दी जाती है, ताकि अधिक उपयुक्त नौकरी खोजने वाले उन्हें देख सकें और आवेदन कर सकें।",
          },
          campaignPromotions: {
            question: "कैंपेन प्रमोशन क्या हैं?",
            answer:
              "कैंपेन प्रमोशन नियोक्ताओं को स्थान, नौकरी श्रेणी और भाषा के आधार पर लक्षित जॉब अलर्ट के ज़रिए नौकरी खोजने वालों तक पहुँचने में मदद करते हैं।",
          },
          paymentSupport: {
            question: "मुझे भुगतान सहायता कैसे मिलेगी?",
            answer:
              "नियोक्ता भुगतान, प्लान सक्रियण, असफल लेनदेन या बिलिंग समस्याओं में मदद के लिए AsliJobs सपोर्ट से संपर्क कर सकते हैं।",
          },
          getAnInvoice: {
            question: "मुझे इनवॉइस कैसे मिलेगा?",
            answer:
              "भुगतान पूरा करने के बाद नियोक्ता AsliJobs सपोर्ट के ज़रिए इनवॉइस का अनुरोध कर सकते हैं।",
          },
        },
      },
      accountDataHelp: {
        title: "खाता और डेटा सहायता",
        description: "प्रोफ़ाइल, गोपनीयता और डेटा नियंत्रण",
        cardTitle: "खाता और डेटा",
        cardDescription: "प्रोफ़ाइल, गोपनीयता और डेटा नियंत्रण",
        articles: {
          updateAccountDetails: {
            question: "मैं अपने खाते का विवरण कैसे अपडेट करूँ?",
            answer:
              "नौकरी खोजने वाले AsliJobs वेबसाइट पर अपनी प्रोफ़ाइल से विवरण अपडेट कर सकते हैं, जबकि नियोक्ता नियोक्ता डैशबोर्ड से अपने विवरण अपडेट कर सकते हैं। वे WhatsApp या उपलब्ध सपोर्ट विकल्पों से AsliJobs सपोर्ट से भी संपर्क कर सकते हैं।",
          },
          changeMobileNumber: {
            question: "मैं अपना मोबाइल नंबर कैसे बदलूँ?",
            answer:
              "नौकरी खोजने वाले AsliJobs वेबसाइट पर अपनी प्रोफ़ाइल से मोबाइल नंबर अपडेट कर सकते हैं, जबकि नियोक्ता इसे नियोक्ता डैशबोर्ड से अपडेट कर सकते हैं। वे AsliJobs सपोर्ट से संपर्क करके आवश्यक सत्यापन विवरण भी दे सकते हैं।",
          },
          deactivateAccount: {
            question: "उपयोगकर्ता अपना खाता कैसे निष्क्रिय कर सकते हैं?",
            answer:
              "नौकरी खोजने वाले AsliJobs वेबसाइट की प्रोफ़ाइल सेटिंग्स से अपना खाता निष्क्रिय कर सकते हैं, जबकि नियोक्ता नियोक्ता डैशबोर्ड से अपना खाता निष्क्रिय कर सकते हैं। खाता निष्क्रिय करने में सहायता के लिए उपयोगकर्ता AsliJobs सपोर्ट से भी संपर्क कर सकते हैं।",
          },
          howDataIsUsed: {
            question: "AsliJobs मेरे डेटा का उपयोग कैसे करता है?",
            answer:
              "AsliJobs आपका डेटा जॉब अलर्ट देने, आवेदन प्रबंधित करने, भर्ती में सहायता करने, सेवाएँ बेहतर बनाने और आपसे संवाद करने के लिए उपयोग करता है।",
          },
          whoCanSeeProfile: {
            question: "मेरी प्रोफ़ाइल कौन देख सकता है?",
            answer:
              "नौकरी खोज, आवेदन और भर्ती के उद्देश्यों के लिए आपकी प्रोफ़ाइल AsliJobs एडमिन और संबंधित नियोक्ता देख सकते हैं।",
          },
          removeJobVideo: {
            question: "मैं जॉब वीडियो कैसे हटाऊँ?",
            answer:
              "नौकरी खोजने वाले AsliJobs वेबसाइट पर अपनी प्रोफ़ाइल से या AsliJobs सपोर्ट से संपर्क करके अपना पुराना परिचय वीडियो हटा या मिटा सकते हैं और नया अपलोड कर सकते हैं।",
          },
          privacySupport: {
            question: "मुझे गोपनीयता सहायता कैसे मिलेगी?",
            answer:
              "गोपनीयता से जुड़े किसी भी प्रश्न, डेटा अपडेट, हटाने के अनुरोध या खाते की चिंता के लिए आप AsliJobs सपोर्ट से संपर्क कर सकते हैं।",
          },
        },
      },
      contactSupport: {
        title: "सपोर्ट से संपर्क करें",
        description: "अंतिम सहायता और शिकायत स्तर",
        cardTitle: "सपोर्ट से संपर्क करें",
        cardDescription: "अंतिम सहायता और शिकायत स्तर",
        articles: {
          contactAslijobsSupport: {
            question: "मैं AsliJobs सपोर्ट से कैसे संपर्क करूँ?",
            answer:
              "आप WhatsApp, फ़ोन या ईमेल से AsliJobs सपोर्ट से संपर्क कर सकते हैं।",
          },
          raiseAComplaint: {
            question: "मैं शिकायत कैसे दर्ज करूँ?",
            answer:
              "आप WhatsApp, फ़ोन या ईमेल से AsliJobs सपोर्ट के साथ अपनी समस्या साझा करके शिकायत दर्ज कर सकते हैं।",
          },
          complaintDetails: {
            question: "शिकायत के लिए मुझे कौन-से विवरण देने चाहिए?",
            answer:
              "नौकरी खोजने वालों को अपना नाम, मोबाइल नंबर, जॉब टाइटल, नियोक्ता का नाम, समस्या का विवरण और उपलब्ध होने पर स्क्रीनशॉट साझा करने चाहिए। नियोक्ताओं को अपना नाम, कंपनी का नाम, मोबाइल नंबर, जॉब टाइटल या जॉब आईडी, उम्मीदवार का विवरण, समस्या का विवरण और उपलब्ध होने पर संबंधित स्क्रीनशॉट साझा करने चाहिए।",
          },
          reopenAComplaint: {
            question: "मैं शिकायत फिर से कैसे खोलूँ?",
            answer:
              "अगर समस्या हल नहीं हुई है या आपको और सहायता चाहिए, तो आप शिकायत फिर से खोलने का अनुरोध कर सकते हैं।",
          },
          supportResponseTime: {
            question: "सपोर्ट को जवाब देने में कितना समय लगता है?",
            answer:
              "AsliJobs जल्द से जल्द जवाब देने की कोशिश करेगा। जवाब का समय समस्या और सपोर्ट की उपलब्धता के अनुसार बदल सकता है।",
          },
          contactSupportWhatsapp: {
            question: "क्या मैं WhatsApp से सपोर्ट से संपर्क कर सकता हूँ?",
            answer:
              "हाँ। आप आधिकारिक WhatsApp नंबर से AsliJobs सपोर्ट से संपर्क कर सकते हैं।",
          },
          contactSupportEmail: {
            question: "क्या मैं ईमेल से सपोर्ट से संपर्क कर सकता हूँ?",
            answer:
              "हाँ। आप आधिकारिक सपोर्ट ईमेल पते से AsliJobs सपोर्ट से संपर्क कर सकते हैं।",
          },
        },
      },
    },
  },
};

const te: MessageShape<typeof en> = {
  helpCenter: {
    pageTitle: "సహాయ కేంద్రం",
    searchPlaceholder: "సహాయ వ్యాసాలను శోధించండి...",
    emptyTitle: "సహాయ వ్యాసాలు కనుగొనబడలేదు",
    emptyDescription:
      "వేరే కీవర్డ్ ప్రయత్నించండి, లేదా అన్ని వర్గాలను చూడటానికి శోధనను క్లియర్ చేయండి.",
    clearSearch: "శోధనను క్లియర్ చేయండి",
    supportTitle: "మరింత సహాయం కావాలా?",
    supportDescription:
      "మీ సమాధానం దొరకకపోతే మా సపోర్ట్ టీమ్‌ను సంప్రదించండి.",
    whatsapp: "WhatsApp మద్దతు",
    call: "కాల్ మద్దతు",
    email: "ఈమెయిల్ మద్దతు",
    categoriesAria: "సహాయ వర్గాలు",
    categoriesLabel: "వర్గాలు",
    categories: {
      gettingStarted: {
        title: "ప్రారంభించండి",
        description: "ప్రధాన పరిచయ స్థాయి",
        cardTitle: "ప్రారంభించండి",
        cardDescription: "ప్రధాన పరిచయ స్థాయి",
        articles: {
          whatIsAslijobs: {
            question: "AsliJobs అంటే ఏమిటి?",
            answer:
              "AsliJobs భారతదేశపు బ్లూ-కాలర్, గ్రే-కాలర్ మరియు ఎంట్రీ-లెవల్ కార్మికుల కోసం రూపొందించిన WhatsApp-ఆధారిత ఉద్యోగ పోర్టల్. ఇది ఉద్యోగార్థులకు సరైన ఉద్యోగాలు కనుగొనడంలో మరియు యజమానులకు సరైన అభ్యర్థులతో సులభంగా కనెక్ట్ కావడంలో సహాయపడుతుంది.",
          },
          howDoesAslijobsWork: {
            question: "AsliJobs ఎలా పనిచేస్తుంది?",
            answer:
              "AsliJobs WhatsApp ద్వారా పనిచేస్తుంది. ఉద్యోగార్థులు నమోదు చేసుకోవచ్చు, ఉద్యోగ అలర్ట్‌లు పొందవచ్చు, ఉద్యోగాలకు దరఖాస్తు చేయవచ్చు మరియు ఇంటర్వ్యూ అప్‌డేట్‌లు పొందవచ్చు. యజమానులు ప్రొఫైల్‌లు సృష్టించవచ్చు, ఉద్యోగాలు పోస్ట్ చేయవచ్చు, దరఖాస్తులను నిర్వహించవచ్చు, అభ్యర్థులను షార్ట్‌లిస్ట్ చేయవచ్చు మరియు ఇంటర్వ్యూలు షెడ్యూల్ చేయవచ్చు.",
          },
          whoCanUseAslijobs: {
            question: "AsliJobsను ఎవరు ఉపయోగించవచ్చు?",
            answer:
              "పని వెతుకుతున్న ఉద్యోగార్థులు మరియు కార్మికులను నియమించుకోవాలనుకునే యజమానులు AsliJobsను ఉపయోగించవచ్చు. ఇది ప్రధానంగా బ్లూ-కాలర్, గ్రే-కాలర్, సపోర్ట్ మరియు ఎంట్రీ-లెవల్ ఉద్యోగ పాత్రల కోసం రూపొందించబడింది.",
          },
          needToDownloadApp: {
            question: "నేను యాప్ డౌన్‌లోడ్ చేసుకోవాలా?",
            answer:
              "వద్దు. ఉద్యోగార్థులు మరియు యజమానులు ఏ యాప్‌నూ డౌన్‌లోడ్ చేసుకోవాల్సిన అవసరం లేదు. AsliJobs నేరుగా WhatsApp ద్వారా పనిచేస్తుంది, కాబట్టి ఉపయోగించడం సులభం.",
          },
          isAslijobsFreeToUse: {
            question: "AsliJobs ఉపయోగించడం ఉచితమా?",
            answer:
              "అవును. ఉద్యోగార్థులు ఉద్యోగాలు వెతకడం మరియు దరఖాస్తు చేయడం AsliJobsలో ఉచితం. కొన్ని యజమాని సేవలు, ప్రమోషన్లు లేదా నియామక ప్లాన్లు చెల్లింపు కావచ్చు.",
          },
          whichCities: {
            question: "AsliJobs ఏ నగరాల్లో సేవలు అందిస్తుంది?",
            answer:
              "AsliJobs భారతదేశం అంతటా ఉద్యోగార్థులకు మరియు యజమానులకు సేవలు అందిస్తుంది. ఉద్యోగార్థులు ఎక్కడి నుంచైనా ఉద్యోగాలు వెతకవచ్చు మరియు దరఖాస్తు చేయవచ్చు, యజమానులు ఏ ప్రదేశం నుంచైనా ఉద్యోగాలు పోస్ట్ చేయవచ్చు. ఉద్యోగాల లభ్యత నగరం, ప్రాంతం, లోకాలిటీ మరియు ప్రస్తుత యజమాని ఖాళీలను బట్టి మారవచ్చు.",
          },
          jobCategoriesAvailable: {
            question: "ఏ ఉద్యోగ వర్గాలు అందుబాటులో ఉన్నాయి?",
            answer:
              "AsliJobs తయారీ, నిర్మాణం, లాజిస్టిక్స్ మరియు రవాణా, వేర్‌హౌసింగ్, రిటైల్, హాస్పిటాలిటీ, ఫెసిలిటీ మేనేజ్‌మెంట్, సెక్యూరిటీ సేవలు, ఆటోమోటివ్, హెల్త్‌కేర్ సపోర్ట్ మరియు ఇతర బ్లూ-కాలర్, గ్రే-కాలర్ రంగాలను అందిస్తుంది.",
          },
        },
      },
      jobSeekerHelp: {
        title: "ఉద్యోగార్థి సహాయం",
        description: "ఉద్యోగాలు వెతికి దరఖాస్తు చేసే కార్మికుల కోసం",
        cardTitle: "ఉద్యోగార్థి సహాయం",
        cardDescription: "ఉద్యోగాలు వెతికి దరఖాస్తు చేసే కార్మికుల కోసం",
        articles: {
          registerAsJobSeeker: {
            question: "నేను ఉద్యోగార్థిగా ఎలా నమోదు చేసుకోవాలి?",
            answer:
              "మీ పేరు, మొబైల్ నంబర్, ప్రదేశం, ఇష్టపడే భాష, ఉద్యోగ వర్గం మరియు అనుభవం వంటి ప్రాథమిక వివరాలు పంచుకుని WhatsApp ద్వారా AsliJobsలో నమోదు చేసుకోవచ్చు.",
          },
          createJobProfile: {
            question: "నేను నా ఉద్యోగ ప్రొఫైల్ ఎలా సృష్టించాలి?",
            answer:
              "మీకు ఇష్టమైన ఉద్యోగ వర్గం, నైపుణ్యాలు, పని అనుభవం, ఇష్టపడే ప్రదేశం, ఆశించే జీతం మరియు లభ్యతను జోడించి AsliJobs వెబ్‌సైట్‌లో మీ ఉద్యోగ ప్రొఫైల్ సృష్టించవచ్చు. మీ నేపథ్యం, నైపుణ్యాలు, అనుభవం మరియు మీరు వెతుకుతున్న ఉద్యోగ రకాన్ని చూపే పరిచయ వీడియోను కూడా అప్‌లోడ్ చేయవచ్చు.",
          },
          selectAreaLocality: {
            question: "నేను నా ప్రాంతం లేదా లోకాలిటీని ఎలా ఎంచుకోవాలి?",
            answer:
              "AsliJobs మీకు దగ్గరగా ఉన్న ఉద్యోగాలు చూపేలా WhatsAppలో మీ నగరం, ప్రాంతం లేదా లోకాలిటీని ఎంచుకోవచ్చు.",
          },
          receiveJobAlertsSeeker: {
            question: "నాకు ఉద్యోగ అలర్ట్‌లు ఎలా వస్తాయి?",
            answer:
              "మీ AsliJobs ప్రొఫైల్‌లో జాబ్ సెర్చ్ స్టేటస్ బ్యాడ్జ్ ఆన్‌లో ఉన్నప్పుడు, మీ ప్రదేశం, ఉద్యోగ వర్గం మరియు ప్రొఫైల్ వివరాల ఆధారంగా సరైన ఉద్యోగ అలర్ట్‌లు నేరుగా WhatsAppలో వస్తాయి. బ్యాడ్జ్ ఆఫ్‌లో ఉంటే ఉద్యోగ అలర్ట్‌లు రావు.",
          },
          applyForAJob: {
            question: "నేను ఉద్యోగానికి ఎలా దరఖాస్తు చేయాలి?",
            answer:
              "ఉద్యోగార్థులు AsliJobs వెబ్‌సైట్ ద్వారా లేదా ఉద్యోగ అలర్ట్‌కు సమాధానం ఇచ్చి లేదా దరఖాస్తు ఎంపికను ఎంచుకుని నేరుగా WhatsApp ద్వారా దరఖాస్తు చేయవచ్చు.",
          },
          checkApplicationStatus: {
            question: "నా దరఖాస్తు స్థితిని నేను ఎలా చూడగలను?",
            answer:
              "దరఖాస్తు చేశారు, షార్ట్‌లిస్ట్, ఇంటర్వ్యూ షెడ్యూల్, ఎంపికయ్యారు లేదా ఎంపిక కాలేదు వంటి దరఖాస్తు అప్‌డేట్‌లు WhatsApp ద్వారా పంచబడతాయి.",
          },
          updateMyProfile: {
            question: "నేను నా ప్రొఫైల్‌ను ఎలా అప్‌డేట్ చేయాలి?",
            answer:
              "AsliJobs వెబ్‌సైట్‌లో మీ ప్రొఫైల్ ద్వారా ప్రొఫైల్ వివరాలను అప్‌డేట్ చేయవచ్చు.",
          },
          changePreferredLanguage: {
            question: "నేను నా ఇష్టపడే భాషను ఎలా మార్చాలి?",
            answer:
              "అవును. వినియోగదారులు AsliJobs వెబ్‌సైట్, WhatsApp లేదా AsliJobs సపోర్ట్‌ను సంప్రదించి తమ ఇష్టపడే భాషను మార్చుకోవచ్చు.",
          },
        },
      },
      employerHelp: {
        title: "యజమాని సహాయం",
        description: "కార్మికులను నియమించే వ్యాపారాల కోసం",
        cardTitle: "యజమాని సహాయం",
        cardDescription: "కార్మికులను నియమించే వ్యాపారాల కోసం",
        articles: {
          registerAsEmployer: {
            question: "నేను యజమానిగా ఎలా నమోదు చేసుకోవాలి?",
            answer:
              "మీ యజమాని పేరు, కంపెనీ పేరు మరియు సంప్రదింపు వివరాలు ఇచ్చి AsliJobsలో యజమానిగా నమోదు చేసుకోవచ్చు. మీ WhatsApp నంబర్‌ను OTPతో ధృవీకరించాలి.",
          },
          postAJob: {
            question: "నేను ఉద్యోగాన్ని ఎలా పోస్ట్ చేయాలి?",
            answer:
              "ఉద్యోగం పోస్ట్ చేయడానికి ముందు మీ కంపెనీ ప్రొఫైల్ పూర్తి చేయాలి. ఉద్యోగ శీర్షిక, ప్రదేశం, జీతం, పని సమయాలు, ఖాళీల సంఖ్య, అవసరమైన అనుభవం మరియు ఇతర ముఖ్యమైన వివరాలు ఇవ్వండి.",
          },
          jobPostRejected: {
            question: "నా ఉద్యోగ పోస్ట్ ఎందుకు తిరస్కరించబడింది?",
            answer:
              "అసంపూర్ణ వివరాలు, తప్పు సమాచారం, అస్పష్టమైన జీతం, తప్పు ప్రదేశం, తప్పుదారి పట్టే కంటెంట్ ఉంటే, ప్లాట్‌ఫామ్ మార్గదర్శకాలను ఉల్లంఘిస్తే, లేదా సబ్‌స్క్రిప్షన్ ముగిసి ఉంటే ఉద్యోగ పోస్ట్ తిరస్కరించబడవచ్చు.",
          },
          viewApplications: {
            question: "నేను దరఖాస్తులను ఎలా చూడగలను?",
            answer:
              "యజమానులు తమ ఉద్యోగ పోస్ట్‌లకు వచ్చిన దరఖాస్తులను యజమాని డాష్‌బోర్డ్ ద్వారా లేదా AsliJobs బృందం పంచుకున్న అప్‌డేట్‌ల ద్వారా చూడవచ్చు మరియు షార్ట్‌లిస్ట్ చేయవచ్చు.",
          },
          closeJobPost: {
            question: "నేను ఉద్యోగ పోస్ట్‌ను ఎలా మూసివేయాలి?",
            answer:
              "పదవి నిండినప్పుడు, నిలిపివేసినప్పుడు, రద్దైనప్పుడు లేదా ఇక అందుబాటులో లేనప్పుడు ఉద్యోగ పోస్ట్‌ను మూసివేయవచ్చు.",
          },
          employersContactSupport: {
            question: "యజమానులు సపోర్ట్‌ను ఎలా సంప్రదించగలరు?",
            answer:
              "ఉద్యోగం పోస్ట్ చేయడం, దరఖాస్తులు, చెల్లింపులు లేదా నియామక సహాయం కోసం యజమానులు WhatsApp, ఈమెయిల్ లేదా అందుబాటులో ఉన్న సపోర్ట్ ఎంపిక ద్వారా AsliJobs సపోర్ట్‌ను సంప్రదించవచ్చు.",
          },
        },
      },
      whatsappHelp: {
        title: "WhatsApp సహాయం",
        description: "WhatsApp-ఆధారిత అనుభవాన్ని వివరిస్తుంది",
        cardTitle: "WhatsApp సహాయం",
        cardDescription: "WhatsApp-ఆధారిత అనుభవాన్ని వివరిస్తుంది",
        articles: {
          startOnWhatsapp: {
            question: "నేను WhatsAppలో AsliJobsను ఎలా ప్రారంభించాలి?",
            answer:
              "AsliJobs WhatsApp లింక్‌పై క్లిక్ చేసి, QR కోడ్ స్కాన్ చేసి లేదా అధికారిక AsliJobs WhatsApp నంబర్‌కు సందేశం పంపి ప్రారంభించవచ్చు.",
          },
          receiveJobAlertsWhatsapp: {
            question: "నాకు ఉద్యోగ అలర్ట్‌లు ఎలా వస్తాయి?",
            answer:
              "మీ ప్రదేశం, ఉద్యోగ వర్గం, అనుభవం మరియు ప్రొఫైల్ వివరాల ఆధారంగా WhatsAppలో ఉద్యోగ అలర్ట్‌లు వస్తాయి.",
          },
          replyToMessages: {
            question: "నేను సందేశాలకు ఎలా సమాధానం ఇవ్వాలి?",
            answer:
              "దరఖాస్తు, అవును, కాదు, సహాయం లేదా WhatsApp సందేశంలో చూపిన ఇతర ఎంపికలను ఉపయోగించి సమాధానం ఇవ్వవచ్చు.",
          },
          applyThroughWhatsapp: {
            question: "నేను WhatsApp ద్వారా ఉద్యోగాలకు దరఖాస్తు చేయవచ్చా?",
            answer:
              "అవును. ఉద్యోగ అలర్ట్‌కు సమాధానం ఇచ్చి లేదా దరఖాస్తు ఎంపికను ఎంచుకుని నేరుగా WhatsApp ద్వారా ఉద్యోగాలకు దరఖాస్తు చేయవచ్చు.",
          },
          notReceivingWhatsappMessages: {
            question: "నాకు WhatsApp సందేశాలు ఎందుకు రావడం లేదు?",
            answer:
              "నెట్‌వర్క్ సమస్యలు, తప్పు నంబర్, బ్లాక్ చేసిన నంబర్ లేదా నిష్క్రియ WhatsApp కారణంగా సందేశాలు రాకపోవచ్చు.",
          },
          officialAslijobsNumber: {
            question: "అధికారిక AsliJobs నంబర్ నాకు ఎలా తెలుస్తుంది?",
            answer:
              "సరైన WhatsApp నంబర్ కోసం ఎల్లప్పుడూ అధికారిక AsliJobs వెబ్‌సైట్‌ను చూడండి.",
          },
        },
      },
      applicationsInterviews: {
        title: "దరఖాస్తులు మరియు ఇంటర్వ్యూలు",
        description: "నియామక ప్రయాణాన్ని స్పష్టంగా వివరిస్తుంది",
        cardTitle: "దరఖాస్తులు మరియు ఇంటర్వ్యూలు",
        cardDescription: "నియామక ప్రయాణాన్ని స్పష్టంగా వివరిస్తుంది",
        articles: {
          afterIApply: {
            question: "నేను ఉద్యోగానికి దరఖాస్తు చేసిన తర్వాత ఏమవుతుంది?",
            answer:
              "మీరు దరఖాస్తు చేసిన తర్వాత మీ దరఖాస్తు సమీక్ష కోసం యజమానితో పంచబడుతుంది. తదుపరి అప్‌డేట్‌లు WhatsApp ద్వారా మీకు వస్తాయి.",
          },
          shortlistedMeans: {
            question: "షార్ట్‌లిస్ట్ అంటే అర్థం ఏమిటి?",
            answer:
              "షార్ట్‌లిస్ట్ అంటే ఇంటర్వ్యూ లేదా మరింత చర్చ వంటి తదుపరి దశకు యజమాని మీ ప్రొఫైల్‌ను ఎంచుకున్నారని అర్థం.",
          },
          interviewUpdates: {
            question: "నాకు ఇంటర్వ్యూ అప్‌డేట్‌లు ఎలా వస్తాయి?",
            answer:
              "తేదీ, సమయం, ప్రదేశం మరియు సంప్రదింపు వ్యక్తి వివరాల వంటి ఇంటర్వ్యూ అప్‌డేట్‌లు WhatsApp ద్వారా మీతో పంచబడతాయి.",
          },
          interviewDocuments: {
            question: "ఇంటర్వ్యూకు నేను ఏ పత్రాలు తీసుకెళ్లాలి?",
            answer:
              "గుర్తింపు రుజువు, అనుభవ వివరాలు, సర్టిఫికెట్లు లేదా యజమాని అడిగిన ఏ పత్రాలైనా తీసుకెళ్లాల్సి రావచ్చు.",
          },
          selectedStatusMeans: {
            question: "ఎంపిక స్థితి అంటే అర్థం ఏమిటి?",
            answer:
              "ఎంపిక అంటే మీ ప్రొఫైల్ లేదా ఇంటర్వ్యూ ప్రదర్శనను సమీక్షించిన తర్వాత యజమాని మిమ్మల్ని ఉద్యోగానికి ఎంచుకున్నారని అర్థం.",
          },
          joiningConfirmation: {
            question: "చేరిక నిర్ధారణ అంటే ఏమిటి?",
            answer:
              "చేరిక నిర్ధారణ అంటే యజమాని మీ చేరిక తేదీ, సమయం, ప్రదేశం మరియు ఇతర అవసరమైన వివరాలను నిర్ధారించారని అర్థం.",
          },
        },
      },
      profileVideoProfile: {
        title: "ప్రొఫైల్ మరియు వీడియో ప్రొఫైల్",
        description: "వినియోగదారులు మెరుగైన ప్రొఫైల్‌లు రూపొందించుకోవడంలో సహాయపడుతుంది",
        cardTitle: "ప్రొఫైల్ మరియు వీడియో ప్రొఫైల్",
        cardDescription: "వినియోగదారులు మెరుగైన ప్రొఫైల్‌లు రూపొందించుకోవడంలో సహాయపడుతుంది",
        articles: {
          profileDetailsIncluded: {
            question: "ఉద్యోగార్థి ప్రొఫైల్‌లో ఏ వివరాలు ఉంటాయి?",
            answer:
              "ఉద్యోగార్థి ప్రొఫైల్‌లో పేరు, మొబైల్ నంబర్, ఇష్టపడే ఉద్యోగ వర్గం, నైపుణ్యాలు, పని అనుభవం, ఇష్టపడే ప్రదేశం, ఆశించే జీతం, లభ్యత మరియు ఇష్టపడే భాష వంటి వివరాలు ఉంటాయి.",
          },
          jobSeekersUpdateProfile: {
            question: "ఉద్యోగార్థులు తమ ప్రొఫైల్‌ను ఎలా అప్‌డేట్ చేయగలరు?",
            answer:
              "ఉద్యోగార్థులు AsliJobs వెబ్‌సైట్‌లో తమ ప్రొఫైల్ ద్వారా ప్రొఫైల్ వివరాలను అప్‌డేట్ చేయవచ్చు.",
          },
          jobSearchStatusBadge: {
            question: "జాబ్ సెర్చ్ స్టేటస్ బ్యాడ్జ్ అంటే ఏమిటి?",
            answer:
              "ఈ బ్యాడ్జ్ మీరు చురుకుగా ఉద్యోగం వెతుకుతున్నారని సూచిస్తుంది. ఉద్యోగ అలర్ట్‌లు పొందడానికి మీ AsliJobs ప్రొఫైల్‌లో ఈ బ్యాడ్జ్‌ను ఆన్ చేయాలి. బ్యాడ్జ్ ఆఫ్‌లో ఉంటే ఉద్యోగ అలర్ట్‌లు రావు.",
          },
          introductionVideoMeaning: {
            question: "పరిచయ వీడియో అంటే ఏమిటి?",
            answer:
              "పరిచయ వీడియో అనేది ఉద్యోగార్థి తనను పరిచయం చేసుకుని తన నైపుణ్యాలు, పని అనుభవం, ఇష్టపడే ఉద్యోగ పాత్ర మరియు లభ్యతను వివరించే చిన్న వీడియో.",
          },
          createIntroductionVideo: {
            question: "ఉద్యోగార్థులు పరిచయ వీడియోను ఎలా సృష్టించగలరు?",
            answer:
              "ఉద్యోగార్థులు తమను పరిచయం చేసుకుంటూ చిన్న మరియు స్పష్టమైన వీడియోను రికార్డ్ చేసి, AsliJobs అందించిన ఎంపిక ద్వారా అప్‌లోడ్ చేయవచ్చు లేదా పంచుకోవచ్చు.",
          },
          includeInIntroductionVideo: {
            question: "పరిచయ వీడియోలో ఉద్యోగార్థులు ఏమి చేర్చాలి?",
            answer:
              "ఉద్యోగార్థులు తమ పేరు, నైపుణ్యాలు, పని అనుభవం, ఇష్టపడే ఉద్యోగ వర్గం, ఇష్టపడే పని ప్రదేశం, లభ్యత మరియు సంబంధిత అర్హతలు లేదా సర్టిఫికేషన్లను చెప్పాలి.",
          },
        },
      },
      languageSupport: {
        title: "భాషా మద్దతు",
        description: "ప్రాంతీయ భాషా అందుబాటు కోసం",
        cardTitle: "భాషా మద్దతు",
        cardDescription: "ప్రాంతీయ భాషా అందుబాటు కోసం",
        articles: {
          supportedLanguages: {
            question: "AsliJobs ఏ భాషలను అందిస్తుంది?",
            answer:
              "AsliJobs ఇంగ్లీష్, హిందీ, తెలుగు, తమిళం, కన్నడ మరియు మలయాళం భాషలను అందిస్తుంది.",
          },
          changeMyLanguage: {
            question: "నేను నా భాషను ఎలా మార్చగలను?",
            answer:
              "అవును. వినియోగదారులు AsliJobs వెబ్‌సైట్, WhatsApp లేదా AsliJobs సపోర్ట్‌ను సంప్రదించి తమ ఇష్టపడే భాషను మార్చుకోవచ్చు.",
          },
          alertsInLocalLanguage: {
            question: "నా స్థానిక భాషలో ఉద్యోగ అలర్ట్‌లు పొందవచ్చా?",
            answer:
              "అవును. అందుబాటులో ఉన్న చోట AsliJobs మీ ఇష్టపడే భాషలో ఉద్యోగ అలర్ట్‌లు మరియు ముఖ్యమైన అప్‌డేట్‌లు పంపగలదు.",
          },
        },
      },
      safetyReporting: {
        title: "భద్రత మరియు రిపోర్టింగ్",
        description: "వినియోగదారు నమ్మకం మరియు రక్షణ స్థాయి",
        cardTitle: "భద్రత మరియు రిపోర్టింగ్",
        cardDescription: "వినియోగదారు నమ్మకం మరియు రక్షణ స్థాయి",
        articles: {
          identifyFakeJob: {
            question: "నకిలీ ఉద్యోగాన్ని నేను ఎలా గుర్తించగలను?",
            answer:
              "అస్పష్టమైన కంపెనీ వివరాలు, నకిలీ జీత వాగ్దానాలు, తప్పు ప్రదేశం, చెల్లింపు డిమాండ్లు లేదా అనుమానాస్పద ఇంటర్వ్యూ సూచనలు ఉన్న ఉద్యోగాల పట్ల జాగ్రత్తగా ఉండండి.",
          },
          payMoneyForJob: {
            question: "ఉద్యోగం పొందడానికి నేను డబ్బు చెల్లించాలా?",
            answer:
              "వద్దు. ఉద్యోగ నిర్ధారణ కోసం ఉద్యోగార్థులు డబ్బు చెల్లించకూడదు. ఎవరైనా చెల్లింపు అడిగితే వెంటనే AsliJobsకు రిపోర్ట్ చేయండి.",
          },
          reportFakeJob: {
            question: "నకిలీ ఉద్యోగాన్ని నేను ఎలా రిపోర్ట్ చేయాలి?",
            answer:
              "WhatsApp లేదా అందుబాటులో ఉన్న సపోర్ట్ ఎంపిక ద్వారా AsliJobs సపోర్ట్‌ను సంప్రదించి నకిలీ లేదా అనుమానాస్పద ఉద్యోగాన్ని రిపోర్ట్ చేయవచ్చు.",
          },
          reportEmployerMisconduct: {
            question: "యజమాని దుష్ప్రవర్తనను నేను ఎలా రిపోర్ట్ చేయాలి?",
            answer:
              "యజమాని పేరు, ఉద్యోగ శీర్షిక, సమస్య వివరాలు మరియు స్క్రీన్‌షాట్‌లను AsliJobs సపోర్ట్‌తో పంచుకుని యజమాని దుష్ప్రవర్తనను రిపోర్ట్ చేయవచ్చు.",
          },
          abusiveMessages: {
            question: "దుర్వినియోగ సందేశాలు వస్తే నేను ఏమి చేయాలి?",
            answer:
              "మరింత సమాధానం ఇవ్వకండి. స్క్రీన్‌షాట్ తీసి సందేశాన్ని వెంటనే AsliJobs సపోర్ట్‌కు రిపోర్ట్ చేయండి.",
          },
          informationNotToShare: {
            question: "నేను ఏ సమాచారం పంచుకోకూడదు?",
            answer:
              "తెలియని వ్యక్తులతో OTPలు, బ్యాంక్ వివరాలు, పాస్‌వర్డ్‌లు, UPI PINలు, వ్యక్తిగత పత్రాలు లేదా సున్నితమైన సమాచారం పంచుకోకండి.",
          },
          interviewSafetyTips: {
            question: "ఇంటర్వ్యూల కోసం నేను ఏ భద్రతా సూచనలు పాటించాలి?",
            answer:
              "హాజరయ్యే ముందు కంపెనీ పేరు, ఇంటర్వ్యూ ప్రదేశం, సంప్రదింపు వ్యక్తి మరియు ఉద్యోగ వివరాలు తనిఖీ చేయండి. అవసరమైతే కుటుంబ సభ్యుడికి లేదా స్నేహితుడికి తెలియజేయండి.",
          },
          platformSafetyChecks: {
            question: "AsliJobs ప్లాట్‌ఫామ్‌ను ఎలా సురక్షితంగా ఉంచుతుంది?",
            answer:
              "సురక్షితమైన నియామక అనుభవం కోసం AsliJobs యజమానులు, ఫిర్యాదులు మరియు అనుమానాస్పద కార్యకలాపాలను సమీక్షించవచ్చు.",
          },
        },
      },
      paymentsPlansPromotions: {
        title: "చెల్లింపులు, ప్లాన్లు మరియు ప్రమోషన్లు",
        description: "ప్రధానంగా యజమానుల కోసం",
        cardTitle: "చెల్లింపులు మరియు ప్రమోషన్లు",
        cardDescription: "ప్రధానంగా యజమానుల కోసం",
        articles: {
          freeAndPaidServices: {
            question: "ఏ సేవలు ఉచితం మరియు ఏవి చెల్లింపు?",
            answer:
              "ఉద్యోగార్థులు ఉద్యోగాలు వెతకడం మరియు దరఖాస్తు చేయడం AsliJobsలో ఉచితం. యజమాని సేవలు, నియామక ప్లాన్లు మరియు ప్రమోషన్లు చెల్లింపు కావచ్చు.",
          },
          employerPlans: {
            question: "యజమాని ప్లాన్లు అంటే ఏమిటి?",
            answer:
              "యజమాని ప్లాన్లు వ్యాపారాలు ఉద్యోగాలు పోస్ట్ చేయడం, దరఖాస్తులు పొందడం, ఖాళీలను ప్రమోట్ చేయడం మరియు నియామకాన్ని మెరుగ్గా నిర్వహించడంలో సహాయపడే చెల్లింపు ఎంపికలు.",
          },
          promotedJobs: {
            question: "ప్రమోటెడ్ ఉద్యోగాలు అంటే ఏమిటి?",
            answer:
              "ప్రమోటెడ్ ఉద్యోగాలు అదనపు దృశ్యత ఇచ్చిన ఉద్యోగ పోస్ట్‌లు, తద్వారా మరిన్ని సరైన ఉద్యోగార్థులు వాటిని చూసి దరఖాస్తు చేయగలరు.",
          },
          campaignPromotions: {
            question: "క్యాంపెయిన్ ప్రమోషన్లు అంటే ఏమిటి?",
            answer:
              "క్యాంపెయిన్ ప్రమోషన్లు ప్రదేశం, ఉద్యోగ వర్గం మరియు భాష ఆధారంగా లక్ష్యిత ఉద్యోగ అలర్ట్‌ల ద్వారా యజమానులు ఉద్యోగార్థులను చేరుకోవడంలో సహాయపడతాయి.",
          },
          paymentSupport: {
            question: "నాకు చెల్లింపు మద్దతు ఎలా లభిస్తుంది?",
            answer:
              "చెల్లింపులు, ప్లాన్ యాక్టివేషన్, విఫలమైన లావాదేవీలు లేదా బిల్లింగ్ సమస్యలకు సహాయం కోసం యజమానులు AsliJobs సపోర్ట్‌ను సంప్రదించవచ్చు.",
          },
          getAnInvoice: {
            question: "నాకు ఇన్‌వాయిస్ ఎలా లభిస్తుంది?",
            answer:
              "చెల్లింపు పూర్తయిన తర్వాత యజమానులు AsliJobs సపోర్ట్ ద్వారా ఇన్‌వాయిస్ అభ్యర్థించవచ్చు.",
          },
        },
      },
      accountDataHelp: {
        title: "ఖాతా మరియు డేటా సహాయం",
        description: "ప్రొఫైల్, గోప్యత మరియు డేటా నియంత్రణ",
        cardTitle: "ఖాతా మరియు డేటా",
        cardDescription: "ప్రొఫైల్, గోప్యత మరియు డేటా నియంత్రణ",
        articles: {
          updateAccountDetails: {
            question: "నేను నా ఖాతా వివరాలను ఎలా అప్‌డేట్ చేయాలి?",
            answer:
              "ఉద్యోగార్థులు AsliJobs వెబ్‌సైట్‌లో తమ ప్రొఫైల్ ద్వారా వివరాలను అప్‌డేట్ చేయవచ్చు, యజమానులు యజమాని డాష్‌బోర్డ్ ద్వారా తమ వివరాలను అప్‌డేట్ చేయవచ్చు. వారు WhatsApp లేదా అందుబాటులో ఉన్న సపోర్ట్ ఎంపికల ద్వారా AsliJobs సపోర్ట్‌ను కూడా సంప్రదించవచ్చు.",
          },
          changeMobileNumber: {
            question: "నేను నా మొబైల్ నంబర్‌ను ఎలా మార్చాలి?",
            answer:
              "ఉద్యోగార్థులు AsliJobs వెబ్‌సైట్‌లో తమ ప్రొఫైల్ ద్వారా మొబైల్ నంబర్‌ను అప్‌డేట్ చేయవచ్చు, యజమానులు యజమాని డాష్‌బోర్డ్ ద్వారా అప్‌డేట్ చేయవచ్చు. వారు AsliJobs సపోర్ట్‌ను సంప్రదించి అవసరమైన ధృవీకరణ వివరాలు ఇవ్వవచ్చు.",
          },
          deactivateAccount: {
            question: "వినియోగదారులు తమ ఖాతాను ఎలా నిష్క్రియం చేయగలరు?",
            answer:
              "ఉద్యోగార్థులు AsliJobs వెబ్‌సైట్‌లో ప్రొఫైల్ సెట్టింగ్‌ల ద్వారా తమ ఖాతాను నిష్క్రియం చేయవచ్చు, యజమానులు యజమాని డాష్‌బోర్డ్ ద్వారా తమ ఖాతాను నిష్క్రియం చేయవచ్చు. ఖాతా నిష్క్రియం చేయడంలో సహాయం కోసం వినియోగదారులు AsliJobs సపోర్ట్‌ను కూడా సంప్రదించవచ్చు.",
          },
          howDataIsUsed: {
            question: "AsliJobs నా డేటాను ఎలా ఉపయోగిస్తుంది?",
            answer:
              "ఉద్యోగ అలర్ట్‌లు ఇవ్వడం, దరఖాస్తులను నిర్వహించడం, నియామకానికి మద్దతు ఇవ్వడం, సేవలను మెరుగుపరచడం మరియు మీతో సంభాషించడం కోసం AsliJobs మీ డేటాను ఉపయోగిస్తుంది.",
          },
          whoCanSeeProfile: {
            question: "నా ప్రొఫైల్‌ను ఎవరు చూడగలరు?",
            answer:
              "ఉద్యోగ శోధన, దరఖాస్తు మరియు నియామక ప్రయోజనాల కోసం మీ ప్రొఫైల్‌ను AsliJobs అడ్మిన్లు మరియు సంబంధిత యజమానులు చూడవచ్చు.",
          },
          removeJobVideo: {
            question: "నేను ఉద్యోగ వీడియోను ఎలా తొలగించాలి?",
            answer:
              "ఉద్యోగార్థులు AsliJobs వెబ్‌సైట్‌లో తమ ప్రొఫైల్ ద్వారా లేదా AsliJobs సపోర్ట్‌ను సంప్రదించి పాత పరిచయ వీడియోను తొలగించి కొత్తది అప్‌లోడ్ చేయవచ్చు.",
          },
          privacySupport: {
            question: "నాకు గోప్యత మద్దతు ఎలా లభిస్తుంది?",
            answer:
              "గోప్యతకు సంబంధించిన ప్రశ్నలు, డేటా అప్‌డేట్‌లు, తొలగింపు అభ్యర్థనలు లేదా ఖాతా ఆందోళనల కోసం మీరు AsliJobs సపోర్ట్‌ను సంప్రదించవచ్చు.",
          },
        },
      },
      contactSupport: {
        title: "సపోర్ట్‌ను సంప్రదించండి",
        description: "చివరి సహాయం మరియు ఫిర్యాదు స్థాయి",
        cardTitle: "సపోర్ట్‌ను సంప్రదించండి",
        cardDescription: "చివరి సహాయం మరియు ఫిర్యాదు స్థాయి",
        articles: {
          contactAslijobsSupport: {
            question: "నేను AsliJobs సపోర్ట్‌ను ఎలా సంప్రదించగలను?",
            answer:
              "మీరు WhatsApp, ఫోన్ లేదా ఈమెయిల్ ద్వారా AsliJobs సపోర్ట్‌ను సంప్రదించవచ్చు.",
          },
          raiseAComplaint: {
            question: "నేను ఫిర్యాదు ఎలా చేయగలను?",
            answer:
              "WhatsApp, ఫోన్ లేదా ఈమెయిల్ ద్వారా AsliJobs సపోర్ట్‌తో మీ సమస్యను పంచుకుని ఫిర్యాదు చేయవచ్చు.",
          },
          complaintDetails: {
            question: "ఫిర్యాదు కోసం నేను ఏ వివరాలు ఇవ్వాలి?",
            answer:
              "ఉద్యోగార్థులు తమ పేరు, మొబైల్ నంబర్, ఉద్యోగ శీర్షిక, యజమాని పేరు, సమస్య వివరాలు మరియు అందుబాటులో ఉంటే స్క్రీన్‌షాట్‌లు పంచుకోవాలి. యజమానులు తమ పేరు, కంపెనీ పేరు, మొబైల్ నంబర్, ఉద్యోగ శీర్షిక లేదా జాబ్ ఐడి, అభ్యర్థి వివరాలు, సమస్య వివరాలు మరియు అందుబాటులో ఉంటే సంబంధిత స్క్రీన్‌షాట్‌లు పంచుకోవాలి.",
          },
          reopenAComplaint: {
            question: "నేను ఫిర్యాదును మళ్లీ ఎలా తెరవగలను?",
            answer:
              "సమస్య పరిష్కారం కాకపోతే లేదా మరింత మద్దతు అవసరమైతే ఫిర్యాదును మళ్లీ తెరవమని అభ్యర్థించవచ్చు.",
          },
          supportResponseTime: {
            question: "సపోర్ట్ సమాధానం ఇవ్వడానికి ఎంత సమయం పడుతుంది?",
            answer:
              "AsliJobs వీలైనంత త్వరగా సమాధానం ఇవ్వడానికి ప్రయత్నిస్తుంది. సమాధాన సమయం సమస్య మరియు సపోర్ట్ లభ్యతను బట్టి మారవచ్చు.",
          },
          contactSupportWhatsapp: {
            question: "నేను WhatsApp ద్వారా సపోర్ట్‌ను సంప్రదించవచ్చా?",
            answer:
              "అవును. అధికారిక WhatsApp నంబర్ ద్వారా మీరు AsliJobs సపోర్ట్‌ను సంప్రదించవచ్చు.",
          },
          contactSupportEmail: {
            question: "నేను ఈమెయిల్ ద్వారా సపోర్ట్‌ను సంప్రదించవచ్చా?",
            answer:
              "అవును. అధికారిక సపోర్ట్ ఈమెయిల్ చిరునామా ద్వారా మీరు AsliJobs సపోర్ట్‌ను సంప్రదించవచ్చు.",
          },
        },
      },
    },
  },
};

const ta: MessageShape<typeof en> = {
  helpCenter: {
    pageTitle: "உதவி மையம்",
    searchPlaceholder: "உதவி கட்டுரைகளைத் தேடுங்கள்...",
    emptyTitle: "உதவி கட்டுரைகள் எதுவும் கிடைக்கவில்லை",
    emptyDescription:
      "வேறு ஒரு முக்கியச் சொல்லை முயற்சிக்கவும், அல்லது அனைத்துப் பிரிவுகளையும் பார்க்க தேடலை அழிக்கவும்.",
    clearSearch: "தேடலை அழிக்கவும்",
    supportTitle: "மேலும் உதவி வேண்டுமா?",
    supportDescription:
      "நீங்கள் தேடும் பதில் கிடைக்கவில்லை என்றால் எங்கள் ஆதரவு குழுவைத் தொடர்பு கொள்ளுங்கள்.",
    whatsapp: "WhatsApp ஆதரவு",
    call: "அழைப்பு ஆதரவு",
    email: "மின்னஞ்சல் ஆதரவு",
    categoriesAria: "உதவி பிரிவுகள்",
    categoriesLabel: "பிரிவுகள்",
    categories: {
      gettingStarted: {
        title: "தொடங்குதல்",
        description: "முக்கிய அறிமுக அடுக்கு",
        cardTitle: "தொடங்குதல்",
        cardDescription: "முக்கிய அறிமுக அடுக்கு",
        articles: {
          whatIsAslijobs: {
            question: "AsliJobs என்றால் என்ன?",
            answer:
              "AsliJobs இந்தியாவின் நீலக் கழுத்து, சாம்பல் கழுத்து மற்றும் தொடக்க நிலை பணியாளர்களுக்காக உருவாக்கப்பட்ட WhatsApp அடிப்படையிலான வேலை தளம். இது வேலை தேடுபவர்களுக்கு ஏற்ற வேலைகளைக் கண்டறியவும், முதலாளிகள் சரியான விண்ணப்பதாரர்களுடன் எளிதாக இணையவும் உதவுகிறது.",
          },
          howDoesAslijobsWork: {
            question: "AsliJobs எப்படி வேலை செய்கிறது?",
            answer:
              "AsliJobs WhatsApp வழியாக வேலை செய்கிறது. வேலை தேடுபவர்கள் பதிவு செய்து, வேலை அறிவிப்புகளைப் பெற்று, வேலைகளுக்கு விண்ணப்பித்து, நேர்காணல் புதுப்பிப்புகளைப் பெறலாம். முதலாளிகள் சுயவிவரங்களை உருவாக்கி, வேலைகளை இடுகையிட்டு, விண்ணப்பங்களை நிர்வகித்து, விண்ணப்பதாரர்களை குறுகிய பட்டியலிட்டு, நேர்காணல்களை அட்டவணைப்படுத்தலாம்.",
          },
          whoCanUseAslijobs: {
            question: "AsliJobs-ஐ யார் பயன்படுத்தலாம்?",
            answer:
              "வேலை தேடும் வேலை தேடுபவர்களும், பணியாளர்களை நியமிக்க விரும்பும் முதலாளிகளும் AsliJobs-ஐப் பயன்படுத்தலாம். இது முக்கியமாக நீலக் கழுத்து, சாம்பல் கழுத்து, ஆதரவு மற்றும் தொடக்க நிலை வேலைப் பாத்திரங்களுக்காக வடிவமைக்கப்பட்டது.",
          },
          needToDownloadApp: {
            question: "நான் ஒரு செயலியைப் பதிவிறக்க வேண்டுமா?",
            answer:
              "இல்லை. வேலை தேடுபவர்களும் முதலாளிகளும் எந்தச் செயலியையும் பதிவிறக்க வேண்டியதில்லை. AsliJobs நேரடியாக WhatsApp வழியாக வேலை செய்வதால், பயன்படுத்துவது எளிது.",
          },
          isAslijobsFreeToUse: {
            question: "AsliJobs பயன்படுத்துவது இலவசமா?",
            answer:
              "ஆம். வேலை தேடுபவர்கள் வேலைகளைத் தேடவும் விண்ணப்பிக்கவும் AsliJobs இலவசம். சில முதலாளி சேவைகள், விளம்பரங்கள் அல்லது நியமனத் திட்டங்கள் கட்டணமாக இருக்கலாம்.",
          },
          whichCities: {
            question: "AsliJobs எந்த நகரங்களில் சேவை செய்கிறது?",
            answer:
              "AsliJobs இந்தியா முழுவதும் வேலை தேடுபவர்களுக்கும் முதலாளிகளுக்கும் சேவை செய்கிறது. வேலை தேடுபவர்கள் எங்கிருந்தும் வேலைகளைத் தேடி விண்ணப்பிக்கலாம், முதலாளிகள் எந்த இடத்திலிருந்தும் வேலைகளை இடுகையிடலாம். வேலை கிடைக்கும் நிலை நகரம், பகுதி, வட்டாரம் மற்றும் தற்போதைய முதலாளி காலியிடங்களைப் பொறுத்து மாறலாம்.",
          },
          jobCategoriesAvailable: {
            question: "எந்த வேலைப் பிரிவுகள் கிடைக்கின்றன?",
            answer:
              "AsliJobs உற்பத்தி, கட்டுமானம், தளவாடம் மற்றும் போக்குவரத்து, கிடங்கு, சில்லறை விற்பனை, விருந்தோம்பல், வசதி மேலாண்மை, பாதுகாப்புச் சேவைகள், வாகனத் துறை, சுகாதார ஆதரவு மற்றும் பிற நீலக் கழுத்து, சாம்பல் கழுத்து துறைகளை ஆதரிக்கிறது.",
          },
        },
      },
      jobSeekerHelp: {
        title: "வேலை தேடுபவர் உதவி",
        description: "வேலை தேடி விண்ணப்பிக்கும் பணியாளர்களுக்கு",
        cardTitle: "வேலை தேடுபவர் உதவி",
        cardDescription: "வேலை தேடி விண்ணப்பிக்கும் பணியாளர்களுக்கு",
        articles: {
          registerAsJobSeeker: {
            question: "நான் வேலை தேடுபவராக எப்படிப் பதிவு செய்வது?",
            answer:
              "உங்கள் பெயர், கைபேசி எண், இடம், விருப்ப மொழி, வேலைப் பிரிவு மற்றும் அனுபவம் போன்ற அடிப்படை விவரங்களைப் பகிர்ந்து WhatsApp வழியாக AsliJobs-இல் பதிவு செய்யலாம்.",
          },
          createJobProfile: {
            question: "என் வேலைச் சுயவிவரத்தை நான் எப்படி உருவாக்குவது?",
            answer:
              "விருப்ப வேலைப் பிரிவு, திறன்கள், பணி அனுபவம், விருப்ப இடம், எதிர்பார்க்கும் சம்பளம் மற்றும் கிடைக்கும் தன்மையைச் சேர்த்து AsliJobs வலைத்தளத்தில் உங்கள் வேலைச் சுயவிவரத்தை உருவாக்கலாம். உங்கள் பின்னணி, திறன்கள், அனுபவம் மற்றும் நீங்கள் தேடும் வேலை வகையைக் காட்டும் அறிமுகக் காணொளியையும் பதிவேற்றலாம்.",
          },
          selectAreaLocality: {
            question: "என் பகுதி அல்லது வட்டாரத்தை நான் எப்படித் தேர்ந்தெடுப்பது?",
            answer:
              "AsliJobs உங்களுக்கு அருகிலுள்ள வேலைகளைக் காட்டும்படி WhatsApp-இல் உங்கள் நகரம், பகுதி அல்லது வட்டாரத்தைத் தேர்ந்தெடுக்கலாம்.",
          },
          receiveJobAlertsSeeker: {
            question: "எனக்கு வேலை அறிவிப்புகள் எப்படி வரும்?",
            answer:
              "உங்கள் AsliJobs சுயவிவரத்தில் வேலைத் தேடல் நிலை பேட்ஜ் இயக்கப்பட்டிருக்கும்போது, உங்கள் இடம், வேலைப் பிரிவு மற்றும் சுயவிவர விவரங்களின் அடிப்படையில் பொருத்தமான வேலை அறிவிப்புகள் நேரடியாக WhatsApp-இல் வரும். பேட்ஜ் அணைக்கப்பட்டிருந்தால் வேலை அறிவிப்புகள் வராது.",
          },
          applyForAJob: {
            question: "ஒரு வேலைக்கு நான் எப்படி விண்ணப்பிப்பது?",
            answer:
              "வேலை தேடுபவர்கள் AsliJobs வலைத்தளம் வழியாக அல்லது வேலை அறிவிப்புக்குப் பதிலளித்து அல்லது விண்ணப்பிக்கும் விருப்பத்தைத் தேர்ந்தெடுத்து நேரடியாக WhatsApp வழியாக விண்ணப்பிக்கலாம்.",
          },
          checkApplicationStatus: {
            question: "என் விண்ணப்ப நிலையை நான் எப்படிப் பார்ப்பது?",
            answer:
              "விண்ணப்பித்தது, குறுகிய பட்டியல், நேர்காணல் அட்டவணை, தேர்ந்தெடுக்கப்பட்டது அல்லது தேர்ந்தெடுக்கப்படவில்லை போன்ற விண்ணப்பப் புதுப்பிப்புகள் WhatsApp வழியாகப் பகிரப்படும்.",
          },
          updateMyProfile: {
            question: "என் சுயவிவரத்தை நான் எப்படிப் புதுப்பிப்பது?",
            answer:
              "AsliJobs வலைத்தளத்தில் உங்கள் சுயவிவரம் வழியாக சுயவிவர விவரங்களைப் புதுப்பிக்கலாம்.",
          },
          changePreferredLanguage: {
            question: "என் விருப்ப மொழியை நான் எப்படி மாற்றுவது?",
            answer:
              "ஆம். பயனர்கள் AsliJobs வலைத்தளம், WhatsApp அல்லது AsliJobs ஆதரவைத் தொடர்பு கொண்டு தங்கள் விருப்ப மொழியை மாற்றலாம்.",
          },
        },
      },
      employerHelp: {
        title: "முதலாளி உதவி",
        description: "பணியாளர்களை நியமிக்கும் வணிகங்களுக்கு",
        cardTitle: "முதலாளி உதவி",
        cardDescription: "பணியாளர்களை நியமிக்கும் வணிகங்களுக்கு",
        articles: {
          registerAsEmployer: {
            question: "நான் முதலாளியாக எப்படிப் பதிவு செய்வது?",
            answer:
              "உங்கள் முதலாளி பெயர், நிறுவனப் பெயர் மற்றும் தொடர்பு விவரங்களை அளித்து AsliJobs-இல் முதலாளியாகப் பதிவு செய்யலாம். உங்கள் WhatsApp எண்ணை OTP மூலம் சரிபார்க்க வேண்டும்.",
          },
          postAJob: {
            question: "நான் ஒரு வேலையை எப்படி இடுகையிடுவது?",
            answer:
              "வேலையை இடுகையிடுவதற்கு முன் உங்கள் நிறுவனச் சுயவிவரத்தை நிறைவு செய்ய வேண்டும். வேலைத் தலைப்பு, இடம், சம்பளம், பணி நேரம், காலியிட எண்ணிக்கை, தேவையான அனுபவம் மற்றும் பிற முக்கிய விவரங்களை அளியுங்கள்.",
          },
          jobPostRejected: {
            question: "என் வேலை இடுகை ஏன் நிராகரிக்கப்பட்டது?",
            answer:
              "முழுமையற்ற விவரங்கள், தவறான தகவல், தெளிவற்ற சம்பளம், தவறான இடம், தவறாக வழிநடத்தும் உள்ளடக்கம் இருந்தால், தள வழிகாட்டுதல்களை மீறினால், அல்லது சந்தா முடிந்திருந்தால் வேலை இடுகை நிராகரிக்கப்படலாம்.",
          },
          viewApplications: {
            question: "விண்ணப்பங்களை நான் எப்படிப் பார்ப்பது?",
            answer:
              "முதலாளிகள் தங்கள் வேலை இடுகைகளுக்கு வந்த விண்ணப்பங்களை முதலாளி டாஷ்போர்டு வழியாக அல்லது AsliJobs குழு பகிர்ந்த புதுப்பிப்புகள் வழியாகப் பார்த்து குறுகிய பட்டியலிடலாம்.",
          },
          closeJobPost: {
            question: "வேலை இடுகையை நான் எப்படி மூடுவது?",
            answer:
              "பதவி நிரம்பியதும், இடைநிறுத்தப்பட்டதும், ரத்து செய்யப்பட்டதும் அல்லது இனி கிடைக்காததும் வேலை இடுகையை மூடலாம்.",
          },
          employersContactSupport: {
            question: "முதலாளிகள் ஆதரவை எப்படித் தொடர்பு கொள்வது?",
            answer:
              "வேலை இடுகை, விண்ணப்பங்கள், கட்டணங்கள் அல்லது நியமன உதவிக்கு WhatsApp, மின்னஞ்சல் அல்லது கிடைக்கும் ஆதரவு விருப்பம் வழியாக முதலாளிகள் AsliJobs ஆதரவைத் தொடர்பு கொள்ளலாம்.",
          },
        },
      },
      whatsappHelp: {
        title: "WhatsApp உதவி",
        description: "WhatsApp அடிப்படையிலான அனுபவத்தை விளக்குகிறது",
        cardTitle: "WhatsApp உதவி",
        cardDescription: "WhatsApp அடிப்படையிலான அனுபவத்தை விளக்குகிறது",
        articles: {
          startOnWhatsapp: {
            question: "WhatsApp-இல் AsliJobs-ஐ நான் எப்படித் தொடங்குவது?",
            answer:
              "AsliJobs WhatsApp இணைப்பைக் கிளிக் செய்து, QR குறியீட்டை ஸ்கேன் செய்து அல்லது அதிகாரப்பூர்வ AsliJobs WhatsApp எண்ணுக்குச் செய்தி அனுப்பி தொடங்கலாம்.",
          },
          receiveJobAlertsWhatsapp: {
            question: "எனக்கு வேலை அறிவிப்புகள் எப்படி வரும்?",
            answer:
              "உங்கள் இடம், வேலைப் பிரிவு, அனுபவம் மற்றும் சுயவிவர விவரங்களின் அடிப்படையில் WhatsApp-இல் வேலை அறிவிப்புகள் வரும்.",
          },
          replyToMessages: {
            question: "செய்திகளுக்கு நான் எப்படிப் பதிலளிக்க வேண்டும்?",
            answer:
              "விண்ணப்பி, ஆம், இல்லை, உதவி அல்லது WhatsApp செய்தியில் காட்டப்படும் வேறு விருப்பங்களைப் பயன்படுத்திப் பதிலளிக்கலாம்.",
          },
          applyThroughWhatsapp: {
            question: "WhatsApp வழியாக வேலைகளுக்கு விண்ணப்பிக்கலாமா?",
            answer:
              "ஆம். வேலை அறிவிப்புக்குப் பதிலளித்து அல்லது விண்ணப்பிக்கும் விருப்பத்தைத் தேர்ந்தெடுத்து நேரடியாக WhatsApp வழியாக வேலைகளுக்கு விண்ணப்பிக்கலாம்.",
          },
          notReceivingWhatsappMessages: {
            question: "எனக்கு WhatsApp செய்திகள் ஏன் வரவில்லை?",
            answer:
              "பிணையச் சிக்கல்கள், தவறான எண், தடுக்கப்பட்ட எண் அல்லது செயலற்ற WhatsApp காரணமாகச் செய்திகள் வராமல் இருக்கலாம்.",
          },
          officialAslijobsNumber: {
            question: "அதிகாரப்பூர்வ AsliJobs எண் எனக்கு எப்படித் தெரியும்?",
            answer:
              "சரியான WhatsApp எண்ணுக்கு எப்போதும் அதிகாரப்பூர்வ AsliJobs வலைத்தளத்தைப் பாருங்கள்.",
          },
        },
      },
      applicationsInterviews: {
        title: "விண்ணப்பங்களும் நேர்காணல்களும்",
        description: "நியமனப் பயணத்தைத் தெளிவாக விளக்குகிறது",
        cardTitle: "விண்ணப்பங்களும் நேர்காணல்களும்",
        cardDescription: "நியமனப் பயணத்தைத் தெளிவாக விளக்குகிறது",
        articles: {
          afterIApply: {
            question: "வேலைக்கு விண்ணப்பித்த பிறகு என்ன நடக்கும்?",
            answer:
              "நீங்கள் விண்ணப்பித்த பிறகு உங்கள் விண்ணப்பம் மதிப்பாய்வுக்காக முதலாளியுடன் பகிரப்படும். அடுத்த புதுப்பிப்புகள் WhatsApp வழியாக உங்களுக்கு வரும்.",
          },
          shortlistedMeans: {
            question: "குறுகிய பட்டியல் என்றால் என்ன?",
            answer:
              "குறுகிய பட்டியல் என்றால் நேர்காணல் அல்லது மேலும் விவாதம் போன்ற அடுத்த கட்டத்திற்கு முதலாளி உங்கள் சுயவிவரத்தைத் தேர்ந்தெடுத்துள்ளார் என்று பொருள்.",
          },
          interviewUpdates: {
            question: "நேர்காணல் புதுப்பிப்புகள் எனக்கு எப்படி வரும்?",
            answer:
              "தேதி, நேரம், இடம் மற்றும் தொடர்பு நபர் விவரங்கள் போன்ற நேர்காணல் புதுப்பிப்புகள் WhatsApp வழியாக உங்களுடன் பகிரப்படும்.",
          },
          interviewDocuments: {
            question: "நேர்காணலுக்கு நான் எந்த ஆவணங்களை எடுத்துச் செல்ல வேண்டும்?",
            answer:
              "அடையாளச் சான்று, அனுபவ விவரங்கள், சான்றிதழ்கள் அல்லது முதலாளி கேட்ட ஆவணங்களை எடுத்துச் செல்ல வேண்டியிருக்கலாம்.",
          },
          selectedStatusMeans: {
            question: "தேர்ந்தெடுக்கப்பட்ட நிலை என்றால் என்ன?",
            answer:
              "தேர்ந்தெடுக்கப்பட்டது என்றால் உங்கள் சுயவிவரம் அல்லது நேர்காணல் செயல்திறனை மதிப்பாய்வு செய்த பிறகு முதலாளி உங்களை வேலைக்குத் தேர்ந்தெடுத்துள்ளார் என்று பொருள்.",
          },
          joiningConfirmation: {
            question: "சேரும் உறுதிப்பாடு என்றால் என்ன?",
            answer:
              "சேரும் உறுதிப்பாடு என்றால் முதலாளி உங்கள் சேரும் தேதி, நேரம், இடம் மற்றும் பிற தேவையான விவரங்களை உறுதிப்படுத்தியுள்ளார் என்று பொருள்.",
          },
        },
      },
      profileVideoProfile: {
        title: "சுயவிவரமும் காணொளி சுயவிவரமும்",
        description: "பயனர்கள் சிறந்த சுயவிவரங்களை உருவாக்க உதவுகிறது",
        cardTitle: "சுயவிவரமும் காணொளி சுயவிவரமும்",
        cardDescription: "பயனர்கள் சிறந்த சுயவிவரங்களை உருவாக்க உதவுகிறது",
        articles: {
          profileDetailsIncluded: {
            question: "வேலை தேடுபவர் சுயவிவரத்தில் எந்த விவரங்கள் இருக்கும்?",
            answer:
              "வேலை தேடுபவர் சுயவிவரத்தில் பெயர், கைபேசி எண், விருப்ப வேலைப் பிரிவு, திறன்கள், பணி அனுபவம், விருப்ப இடம், எதிர்பார்க்கும் சம்பளம், கிடைக்கும் தன்மை மற்றும் விருப்ப மொழி போன்ற விவரங்கள் இருக்கும்.",
          },
          jobSeekersUpdateProfile: {
            question: "வேலை தேடுபவர்கள் தங்கள் சுயவிவரத்தை எப்படிப் புதுப்பிப்பது?",
            answer:
              "வேலை தேடுபவர்கள் AsliJobs வலைத்தளத்தில் தங்கள் சுயவிவரம் வழியாக சுயவிவர விவரங்களைப் புதுப்பிக்கலாம்.",
          },
          jobSearchStatusBadge: {
            question: "வேலைத் தேடல் நிலை பேட்ஜ் என்றால் என்ன?",
            answer:
              "இந்தப் பேட்ஜ் நீங்கள் தீவிரமாக வேலை தேடுகிறீர்கள் என்பதைக் காட்டுகிறது. வேலை அறிவிப்புகளைப் பெற உங்கள் AsliJobs சுயவிவரத்தில் இந்தப் பேட்ஜை இயக்க வேண்டும். பேட்ஜ் அணைக்கப்பட்டிருந்தால் வேலை அறிவிப்புகள் வராது.",
          },
          introductionVideoMeaning: {
            question: "அறிமுகக் காணொளி என்றால் என்ன?",
            answer:
              "அறிமுகக் காணொளி என்பது வேலை தேடுபவர் தன்னை அறிமுகப்படுத்தி, தனது திறன்கள், பணி அனுபவம், விருப்ப வேலைப் பாத்திரம் மற்றும் கிடைக்கும் தன்மையை விளக்கும் சிறிய காணொளி.",
          },
          createIntroductionVideo: {
            question: "வேலை தேடுபவர்கள் அறிமுகக் காணொளியை எப்படி உருவாக்குவது?",
            answer:
              "வேலை தேடுபவர்கள் தங்களை அறிமுகப்படுத்தும் சிறிய தெளிவான காணொளியைப் பதிவு செய்து, AsliJobs வழங்கும் விருப்பம் வழியாகப் பதிவேற்றலாம் அல்லது பகிரலாம்.",
          },
          includeInIntroductionVideo: {
            question: "அறிமுகக் காணொளியில் வேலை தேடுபவர்கள் எதைச் சேர்க்க வேண்டும்?",
            answer:
              "வேலை தேடுபவர்கள் தங்கள் பெயர், திறன்கள், பணி அனுபவம், விருப்ப வேலைப் பிரிவு, விருப்பப் பணி இடம், கிடைக்கும் தன்மை மற்றும் தொடர்புடைய தகுதிகள் அல்லது சான்றிதழ்களைக் குறிப்பிட வேண்டும்.",
          },
        },
      },
      languageSupport: {
        title: "மொழி ஆதரவு",
        description: "பிராந்திய மொழி அணுகலுக்காக",
        cardTitle: "மொழி ஆதரவு",
        cardDescription: "பிராந்திய மொழி அணுகலுக்காக",
        articles: {
          supportedLanguages: {
            question: "AsliJobs எந்த மொழிகளை ஆதரிக்கிறது?",
            answer:
              "AsliJobs ஆங்கிலம், இந்தி, தெலுங்கு, தமிழ், கன்னடம் மற்றும் மலையாளத்தை ஆதரிக்கிறது.",
          },
          changeMyLanguage: {
            question: "என் மொழியை நான் எப்படி மாற்றுவது?",
            answer:
              "ஆம். பயனர்கள் AsliJobs வலைத்தளம், WhatsApp அல்லது AsliJobs ஆதரவைத் தொடர்பு கொண்டு தங்கள் விருப்ப மொழியை மாற்றலாம்.",
          },
          alertsInLocalLanguage: {
            question: "என் உள்ளூர் மொழியில் வேலை அறிவிப்புகளைப் பெறலாமா?",
            answer:
              "ஆம். கிடைக்கும் இடங்களில் AsliJobs உங்கள் விருப்ப மொழியில் வேலை அறிவிப்புகளையும் முக்கிய புதுப்பிப்புகளையும் அனுப்பும்.",
          },
        },
      },
      safetyReporting: {
        title: "பாதுகாப்பும் புகாரளிப்பும்",
        description: "பயனர் நம்பிக்கை மற்றும் பாதுகாப்பு அடுக்கு",
        cardTitle: "பாதுகாப்பும் புகாரளிப்பும்",
        cardDescription: "பயனர் நம்பிக்கை மற்றும் பாதுகாப்பு அடுக்கு",
        articles: {
          identifyFakeJob: {
            question: "போலி வேலையை நான் எப்படி அடையாளம் காண்பது?",
            answer:
              "தெளிவற்ற நிறுவன விவரங்கள், போலி சம்பள வாக்குறுதிகள், தவறான இடம், கட்டணக் கோரிக்கைகள் அல்லது சந்தேகத்திற்குரிய நேர்காணல் அறிவுறுத்தல்கள் உள்ள வேலைகளில் கவனமாக இருங்கள்.",
          },
          payMoneyForJob: {
            question: "வேலை பெற நான் பணம் கொடுக்க வேண்டுமா?",
            answer:
              "இல்லை. வேலை உறுதிப்பாட்டுக்கு வேலை தேடுபவர்கள் பணம் கொடுக்கக்கூடாது. யாராவது கட்டணம் கேட்டால் உடனடியாக AsliJobs-க்குப் புகாரளியுங்கள்.",
          },
          reportFakeJob: {
            question: "போலி வேலையை நான் எப்படிப் புகாரளிப்பது?",
            answer:
              "WhatsApp அல்லது கிடைக்கும் ஆதரவு விருப்பம் வழியாக AsliJobs ஆதரவைத் தொடர்பு கொண்டு போலி அல்லது சந்தேகத்திற்குரிய வேலையைப் புகாரளிக்கலாம்.",
          },
          reportEmployerMisconduct: {
            question: "முதலாளி தவறான நடத்தையை நான் எப்படிப் புகாரளிப்பது?",
            answer:
              "முதலாளி பெயர், வேலைத் தலைப்பு, சிக்கல் விவரங்கள் மற்றும் திரைப்பிடிப்புகளை AsliJobs ஆதரவுடன் பகிர்ந்து முதலாளி தவறான நடத்தையைப் புகாரளிக்கலாம்.",
          },
          abusiveMessages: {
            question: "தாக்குதல் செய்திகள் வந்தால் நான் என்ன செய்ய வேண்டும்?",
            answer:
              "மேலும் பதிலளிக்க வேண்டாம். திரைப்பிடிப்பு எடுத்துச் செய்தியை உடனடியாக AsliJobs ஆதரவுக்குப் புகாரளியுங்கள்.",
          },
          informationNotToShare: {
            question: "நான் எந்தத் தகவலைப் பகிரக்கூடாது?",
            answer:
              "தெரியாத நபர்களுடன் OTP, வங்கி விவரங்கள், கடவுச்சொற்கள், UPI PIN, தனிப்பட்ட ஆவணங்கள் அல்லது உணர்திறன் தகவலைப் பகிர வேண்டாம்.",
          },
          interviewSafetyTips: {
            question: "நேர்காணல்களுக்கு நான் எந்தப் பாதுகாப்பு ஆலோசனைகளைப் பின்பற்ற வேண்டும்?",
            answer:
              "செல்வதற்கு முன் நிறுவனப் பெயர், நேர்காணல் இடம், தொடர்பு நபர் மற்றும் வேலை விவரங்களைச் சரிபாருங்கள். தேவைப்பட்டால் குடும்ப உறுப்பினர் அல்லது நண்பரிடம் தெரிவியுங்கள்.",
          },
          platformSafetyChecks: {
            question: "AsliJobs தளத்தை எப்படிப் பாதுகாப்பாக வைக்கிறது?",
            answer:
              "பாதுகாப்பான நியமன அனுபவத்தைப் பேண AsliJobs முதலாளிகள், புகார்கள் மற்றும் சந்தேகத்திற்குரிய செயல்பாட்டை மதிப்பாய்வு செய்யலாம்.",
          },
        },
      },
      paymentsPlansPromotions: {
        title: "கட்டணங்கள், திட்டங்கள் மற்றும் விளம்பரங்கள்",
        description: "முக்கியமாக முதலாளிகளுக்காக",
        cardTitle: "கட்டணங்களும் விளம்பரங்களும்",
        cardDescription: "முக்கியமாக முதலாளிகளுக்காக",
        articles: {
          freeAndPaidServices: {
            question: "எந்தச் சேவைகள் இலவசம், எவை கட்டணம்?",
            answer:
              "வேலை தேடுபவர்கள் வேலைகளைத் தேடவும் விண்ணப்பிக்கவும் AsliJobs இலவசம். முதலாளி சேவைகள், நியமனத் திட்டங்கள் மற்றும் விளம்பரங்கள் கட்டணமாக இருக்கலாம்.",
          },
          employerPlans: {
            question: "முதலாளி திட்டங்கள் என்றால் என்ன?",
            answer:
              "முதலாளி திட்டங்கள் வணிகங்கள் வேலைகளை இடுகையிட, விண்ணப்பங்களைப் பெற, காலியிடங்களை விளம்பரப்படுத்த மற்றும் நியமனத்தைச் சிறப்பாக நிர்வகிக்க உதவும் கட்டண விருப்பங்கள்.",
          },
          promotedJobs: {
            question: "விளம்பரப்படுத்தப்பட்ட வேலைகள் என்றால் என்ன?",
            answer:
              "விளம்பரப்படுத்தப்பட்ட வேலைகள் கூடுதல் தெரிவுநிலை அளிக்கப்பட்ட வேலை இடுகைகள். அதனால் அதிகமான பொருத்தமான வேலை தேடுபவர்கள் அவற்றைப் பார்த்து விண்ணப்பிக்கலாம்.",
          },
          campaignPromotions: {
            question: "பிரச்சார விளம்பரங்கள் என்றால் என்ன?",
            answer:
              "பிரச்சார விளம்பரங்கள் இடம், வேலைப் பிரிவு மற்றும் மொழியின் அடிப்படையில் இலக்கு வேலை அறிவிப்புகள் மூலம் முதலாளிகள் வேலை தேடுபவர்களைச் சென்றடைய உதவுகின்றன.",
          },
          paymentSupport: {
            question: "கட்டண ஆதரவை நான் எப்படிப் பெறுவது?",
            answer:
              "கட்டணங்கள், திட்டச் செயல்படுத்தல், தோல்வியடைந்த பரிவர்த்தனைகள் அல்லது பில்லிங் சிக்கல்களுக்கு உதவிக்கு முதலாளிகள் AsliJobs ஆதரவைத் தொடர்பு கொள்ளலாம்.",
          },
          getAnInvoice: {
            question: "விலைப்பட்டியலை நான் எப்படிப் பெறுவது?",
            answer:
              "கட்டணம் முடிந்த பிறகு முதலாளிகள் AsliJobs ஆதரவு வழியாக விலைப்பட்டியலைக் கோரலாம்.",
          },
        },
      },
      accountDataHelp: {
        title: "கணக்கும் தரவு உதவியும்",
        description: "சுயவிவரம், தனியுரிமை மற்றும் தரவுக் கட்டுப்பாடு",
        cardTitle: "கணக்கும் தரவும்",
        cardDescription: "சுயவிவரம், தனியுரிமை மற்றும் தரவுக் கட்டுப்பாடு",
        articles: {
          updateAccountDetails: {
            question: "என் கணக்கு விவரங்களை நான் எப்படிப் புதுப்பிப்பது?",
            answer:
              "வேலை தேடுபவர்கள் AsliJobs வலைத்தளத்தில் தங்கள் சுயவிவரம் வழியாக விவரங்களைப் புதுப்பிக்கலாம், முதலாளிகள் முதலாளி டாஷ்போர்டு வழியாகத் தங்கள் விவரங்களைப் புதுப்பிக்கலாம். அவர்கள் WhatsApp அல்லது கிடைக்கும் ஆதரவு விருப்பங்கள் வழியாக AsliJobs ஆதரவையும் தொடர்பு கொள்ளலாம்.",
          },
          changeMobileNumber: {
            question: "என் கைபேசி எண்ணை நான் எப்படி மாற்றுவது?",
            answer:
              "வேலை தேடுபவர்கள் AsliJobs வலைத்தளத்தில் தங்கள் சுயவிவரம் வழியாகக் கைபேசி எண்ணைப் புதுப்பிக்கலாம், முதலாளிகள் முதலாளி டாஷ்போர்டு வழியாகப் புதுப்பிக்கலாம். அவர்கள் AsliJobs ஆதரவைத் தொடர்பு கொண்டு தேவையான சரிபார்ப்பு விவரங்களையும் அளிக்கலாம்.",
          },
          deactivateAccount: {
            question: "பயனர்கள் தங்கள் கணக்கை எப்படி முடக்குவது?",
            answer:
              "வேலை தேடுபவர்கள் AsliJobs வலைத்தளத்தின் சுயவிவர அமைப்புகள் வழியாகத் தங்கள் கணக்கை முடக்கலாம், முதலாளிகள் முதலாளி டாஷ்போர்டு வழியாகத் தங்கள் கணக்கை முடக்கலாம். கணக்கை முடக்குவதற்கான உதவிக்குப் பயனர்கள் AsliJobs ஆதரவையும் தொடர்பு கொள்ளலாம்.",
          },
          howDataIsUsed: {
            question: "AsliJobs என் தரவை எப்படிப் பயன்படுத்துகிறது?",
            answer:
              "வேலை அறிவிப்புகளை வழங்க, விண்ணப்பங்களை நிர்வகிக்க, நியமனத்திற்கு ஆதரவளிக்க, சேவைகளை மேம்படுத்த மற்றும் உங்களுடன் தொடர்பு கொள்ள AsliJobs உங்கள் தரவைப் பயன்படுத்துகிறது.",
          },
          whoCanSeeProfile: {
            question: "என் சுயவிவரத்தை யார் பார்க்கலாம்?",
            answer:
              "வேலைத் தேடல், விண்ணப்பம் மற்றும் நியமன நோக்கங்களுக்காக உங்கள் சுயவிவரத்தை AsliJobs நிர்வாகிகளும் தொடர்புடைய முதலாளிகளும் பார்க்கலாம்.",
          },
          removeJobVideo: {
            question: "வேலைக் காணொளியை நான் எப்படி நீக்குவது?",
            answer:
              "வேலை தேடுபவர்கள் AsliJobs வலைத்தளத்தில் தங்கள் சுயவிவரம் வழியாக அல்லது AsliJobs ஆதரவைத் தொடர்பு கொண்டு பழைய அறிமுகக் காணொளியை நீக்கி புதியதைப் பதிவேற்றலாம்.",
          },
          privacySupport: {
            question: "தனியுரிமை ஆதரவை நான் எப்படிப் பெறுவது?",
            answer:
              "தனியுரிமை தொடர்பான கேள்விகள், தரவுப் புதுப்பிப்புகள், நீக்கல் கோரிக்கைகள் அல்லது கணக்குக் கவலைகளுக்கு AsliJobs ஆதரவைத் தொடர்பு கொள்ளலாம்.",
          },
        },
      },
      contactSupport: {
        title: "ஆதரவைத் தொடர்பு கொள்ளுங்கள்",
        description: "இறுதி உதவி மற்றும் புகார் அடுக்கு",
        cardTitle: "ஆதரவைத் தொடர்பு கொள்ளுங்கள்",
        cardDescription: "இறுதி உதவி மற்றும் புகார் அடுக்கு",
        articles: {
          contactAslijobsSupport: {
            question: "AsliJobs ஆதரவை நான் எப்படித் தொடர்பு கொள்வது?",
            answer:
              "WhatsApp, தொலைபேசி அல்லது மின்னஞ்சல் வழியாக AsliJobs ஆதரவைத் தொடர்பு கொள்ளலாம்.",
          },
          raiseAComplaint: {
            question: "புகாரை நான் எப்படி எழுப்புவது?",
            answer:
              "WhatsApp, தொலைபேசி அல்லது மின்னஞ்சல் வழியாக AsliJobs ஆதரவுடன் உங்கள் சிக்கலைப் பகிர்ந்து புகார் எழுப்பலாம்.",
          },
          complaintDetails: {
            question: "புகாருக்கு நான் எந்த விவரங்களை அளிக்க வேண்டும்?",
            answer:
              "வேலை தேடுபவர்கள் தங்கள் பெயர், கைபேசி எண், வேலைத் தலைப்பு, முதலாளி பெயர், சிக்கல் விவரங்கள் மற்றும் கிடைத்தால் திரைப்பிடிப்புகளைப் பகிர வேண்டும். முதலாளிகள் தங்கள் பெயர், நிறுவனப் பெயர், கைபேசி எண், வேலைத் தலைப்பு அல்லது வேலை அடையாளம், விண்ணப்பதாரர் விவரங்கள், சிக்கல் விவரங்கள் மற்றும் கிடைத்தால் தொடர்புடைய திரைப்பிடிப்புகளைப் பகிர வேண்டும்.",
          },
          reopenAComplaint: {
            question: "புகாரை நான் எப்படி மீண்டும் திறப்பது?",
            answer:
              "சிக்கல் தீரவில்லை என்றால் அல்லது மேலும் ஆதரவு தேவைப்பட்டால் புகாரை மீண்டும் திறக்கக் கோரலாம்.",
          },
          supportResponseTime: {
            question: "ஆதரவு பதிலளிக்க எவ்வளவு நேரம் ஆகும்?",
            answer:
              "AsliJobs கூடிய விரைவில் பதிலளிக்க முயலும். பதில் நேரம் சிக்கல் மற்றும் ஆதரவு கிடைப்பதைப் பொறுத்து மாறலாம்.",
          },
          contactSupportWhatsapp: {
            question: "WhatsApp வழியாக ஆதரவைத் தொடர்பு கொள்ளலாமா?",
            answer:
              "ஆம். அதிகாரப்பூர்வ WhatsApp எண் வழியாக AsliJobs ஆதரவைத் தொடர்பு கொள்ளலாம்.",
          },
          contactSupportEmail: {
            question: "மின்னஞ்சல் வழியாக ஆதரவைத் தொடர்பு கொள்ளலாமா?",
            answer:
              "ஆம். அதிகாரப்பூர்வ ஆதரவு மின்னஞ்சல் முகவரி வழியாக AsliJobs ஆதரவைத் தொடர்பு கொள்ளலாம்.",
          },
        },
      },
    },
  },
};

const kn: MessageShape<typeof en> = {
  helpCenter: {
    pageTitle: "ಸಹಾಯ ಕೇಂದ್ರ",
    searchPlaceholder: "ಸಹಾಯ ಲೇಖನಗಳನ್ನು ಹುಡುಕಿ...",
    emptyTitle: "ಯಾವುದೇ ಸಹಾಯ ಲೇಖನಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
    emptyDescription:
      "ಬೇರೆ ಕೀವರ್ಡ್ ಪ್ರಯತ್ನಿಸಿ, ಅಥವಾ ಎಲ್ಲಾ ವರ್ಗಗಳನ್ನು ನೋಡಲು ಹುಡುಕಾಟವನ್ನು ತೆರವುಗೊಳಿಸಿ.",
    clearSearch: "ಹುಡುಕಾಟವನ್ನು ತೆರವುಗೊಳಿಸಿ",
    supportTitle: "ಇನ್ನಷ್ಟು ಸಹಾಯ ಬೇಕೇ?",
    supportDescription:
      "ನಿಮ್ಮ ಉತ್ತರ ಸಿಗದಿದ್ದರೆ ನಮ್ಮ ಬೆಂಬಲ ತಂಡವನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    whatsapp: "WhatsApp ಬೆಂಬಲ",
    call: "ಕರೆ ಬೆಂಬಲ",
    email: "ಇಮೇಲ್ ಬೆಂಬಲ",
    categoriesAria: "ಸಹಾಯ ವರ್ಗಗಳು",
    categoriesLabel: "ವರ್ಗಗಳು",
    categories: {
      gettingStarted: {
        title: "ಪ್ರಾರಂಭಿಸಿ",
        description: "ಮುಖ್ಯ ಪರಿಚಯ ಪದರ",
        cardTitle: "ಪ್ರಾರಂಭಿಸಿ",
        cardDescription: "ಮುಖ್ಯ ಪರಿಚಯ ಪದರ",
        articles: {
          whatIsAslijobs: {
            question: "AsliJobs ಎಂದರೇನು?",
            answer:
              "AsliJobs ಭಾರತದ ನೀಲಿ-ಕಾಲರ್, ಬೂದು-ಕಾಲರ್ ಮತ್ತು ಪ್ರವೇಶ ಮಟ್ಟದ ಕಾರ್ಮಿಕರಿಗಾಗಿ ರಚಿಸಿದ WhatsApp-ಆಧಾರಿತ ಉದ್ಯೋಗ ಪೋರ್ಟಲ್. ಇದು ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳಿಗೆ ಸೂಕ್ತ ಉದ್ಯೋಗಗಳನ್ನು ಕಂಡುಹಿಡಿಯಲು ಮತ್ತು ಉದ್ಯೋಗದಾತರಿಗೆ ಸರಿಯಾದ ಅಭ್ಯರ್ಥಿಗಳೊಂದಿಗೆ ಸುಲಭವಾಗಿ ಸಂಪರ್ಕಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
          },
          howDoesAslijobsWork: {
            question: "AsliJobs ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?",
            answer:
              "AsliJobs WhatsApp ಮೂಲಕ ಕೆಲಸ ಮಾಡುತ್ತದೆ. ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ನೋಂದಾಯಿಸಿಕೊಳ್ಳಬಹುದು, ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಬಹುದು, ಉದ್ಯೋಗಗಳಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು ಮತ್ತು ಸಂದರ್ಶನ ನವೀಕರಣಗಳನ್ನು ಪಡೆಯಬಹುದು. ಉದ್ಯೋಗದಾತರು ಪ್ರೊಫೈಲ್‌ಗಳನ್ನು ರಚಿಸಬಹುದು, ಉದ್ಯೋಗಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಬಹುದು, ಅರ್ಜಿಗಳನ್ನು ನಿರ್ವಹಿಸಬಹುದು, ಅಭ್ಯರ್ಥಿಗಳನ್ನು ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಮಾಡಬಹುದು ಮತ್ತು ಸಂದರ್ಶನಗಳನ್ನು ನಿಗದಿಪಡಿಸಬಹುದು.",
          },
          whoCanUseAslijobs: {
            question: "AsliJobs ಅನ್ನು ಯಾರು ಬಳಸಬಹುದು?",
            answer:
              "ಕೆಲಸ ಹುಡುಕುವ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ಮತ್ತು ಕಾರ್ಮಿಕರನ್ನು ನೇಮಿಸಿಕೊಳ್ಳಲು ಬಯಸುವ ಉದ್ಯೋಗದಾತರು AsliJobs ಅನ್ನು ಬಳಸಬಹುದು. ಇದು ಮುಖ್ಯವಾಗಿ ನೀಲಿ-ಕಾಲರ್, ಬೂದು-ಕಾಲರ್, ಬೆಂಬಲ ಮತ್ತು ಪ್ರವೇಶ ಮಟ್ಟದ ಉದ್ಯೋಗ ಪಾತ್ರಗಳಿಗಾಗಿ ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ.",
          },
          needToDownloadApp: {
            question: "ನಾನು ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಬೇಕೇ?",
            answer:
              "ಇಲ್ಲ. ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ಮತ್ತು ಉದ್ಯೋಗದಾತರು ಯಾವುದೇ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಬೇಕಾಗಿಲ್ಲ. AsliJobs ನೇರವಾಗಿ WhatsApp ಮೂಲಕ ಕೆಲಸ ಮಾಡುತ್ತದೆ, ಆದ್ದರಿಂದ ಬಳಸಲು ಸರಳ.",
          },
          isAslijobsFreeToUse: {
            question: "AsliJobs ಬಳಸುವುದು ಉಚಿತವೇ?",
            answer:
              "ಹೌದು. ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳಿಗೆ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಲು ಮತ್ತು ಅರ್ಜಿ ಸಲ್ಲಿಸಲು AsliJobs ಉಚಿತ. ಕೆಲವು ಉದ್ಯೋಗದಾತ ಸೇವೆಗಳು, ಪ್ರಚಾರಗಳು ಅಥವಾ ನೇಮಕಾತಿ ಯೋಜನೆಗಳು ಪಾವತಿಯಾಗಿರಬಹುದು.",
          },
          whichCities: {
            question: "AsliJobs ಯಾವ ನಗರಗಳಲ್ಲಿ ಸೇವೆ ನೀಡುತ್ತದೆ?",
            answer:
              "AsliJobs ಭಾರತದಾದ್ಯಂತ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ಮತ್ತು ಉದ್ಯೋಗದಾತರಿಗೆ ಸೇವೆ ನೀಡುತ್ತದೆ. ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ಎಲ್ಲಿಂದಲಾದರೂ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು, ಉದ್ಯೋಗದಾತರು ಯಾವುದೇ ಸ್ಥಳದಿಂದ ಉದ್ಯೋಗಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಬಹುದು. ಉದ್ಯೋಗ ಲಭ್ಯತೆ ನಗರ, ಪ್ರದೇಶ, ಸ್ಥಳೀಯತೆ ಮತ್ತು ಪ್ರಸ್ತುತ ಉದ್ಯೋಗದಾತ ಖಾಲಿ ಹುದ್ದೆಗಳನ್ನು ಅವಲಂಬಿಸಿ ಬದಲಾಗಬಹುದು.",
          },
          jobCategoriesAvailable: {
            question: "ಯಾವ ಉದ್ಯೋಗ ವರ್ಗಗಳು ಲಭ್ಯವಿವೆ?",
            answer:
              "AsliJobs ಉತ್ಪಾದನೆ, ನಿರ್ಮಾಣ, ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಮತ್ತು ಸಾರಿಗೆ, ಗೋದಾಮು, ಚಿಲ್ಲರೆ, ಆತಿಥ್ಯ, ಸೌಲಭ್ಯ ನಿರ್ವಹಣೆ, ಭದ್ರತಾ ಸೇವೆಗಳು, ಆಟೋಮೋಟಿವ್, ಆರೋಗ್ಯ ಬೆಂಬಲ ಮತ್ತು ಇತರ ನೀಲಿ-ಕಾಲರ್ ಹಾಗೂ ಬೂದು-ಕಾಲರ್ ಕ್ಷೇತ್ರಗಳನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ.",
          },
        },
      },
      jobSeekerHelp: {
        title: "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿ ಸಹಾಯ",
        description: "ಉದ್ಯೋಗ ಹುಡುಕಿ ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಕಾರ್ಮಿಕರಿಗೆ",
        cardTitle: "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿ ಸಹಾಯ",
        cardDescription: "ಉದ್ಯೋಗ ಹುಡುಕಿ ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಕಾರ್ಮಿಕರಿಗೆ",
        articles: {
          registerAsJobSeeker: {
            question: "ನಾನು ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಯಾಗಿ ಹೇಗೆ ನೋಂದಾಯಿಸಿಕೊಳ್ಳುವುದು?",
            answer:
              "ನಿಮ್ಮ ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ಸ್ಥಳ, ಆದ್ಯತೆಯ ಭಾಷೆ, ಉದ್ಯೋಗ ವರ್ಗ ಮತ್ತು ಅನುಭವದಂತಹ ಮೂಲ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಂಡು WhatsApp ಮೂಲಕ AsliJobsನಲ್ಲಿ ನೋಂದಾಯಿಸಿಕೊಳ್ಳಬಹುದು.",
          },
          createJobProfile: {
            question: "ನಾನು ನನ್ನ ಉದ್ಯೋಗ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಹೇಗೆ ರಚಿಸುವುದು?",
            answer:
              "ನಿಮ್ಮ ಆದ್ಯತೆಯ ಉದ್ಯೋಗ ವರ್ಗ, ಕೌಶಲ್ಯಗಳು, ಕೆಲಸದ ಅನುಭವ, ಆದ್ಯತೆಯ ಸ್ಥಳ, ನಿರೀಕ್ಷಿತ ವೇತನ ಮತ್ತು ಲಭ್ಯತೆಯನ್ನು ಸೇರಿಸಿ AsliJobs ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಉದ್ಯೋಗ ಪ್ರೊಫೈಲ್ ರಚಿಸಬಹುದು. ನಿಮ್ಮ ಹಿನ್ನೆಲೆ, ಕೌಶಲ್ಯಗಳು, ಅನುಭವ ಮತ್ತು ನೀವು ಹುಡುಕುತ್ತಿರುವ ಉದ್ಯೋಗದ ಪ್ರಕಾರವನ್ನು ತೋರಿಸುವ ಪರಿಚಯ ವೀಡಿಯೊವನ್ನು ಸಹ ಅಪ್‌ಲೋಡ್ ಮಾಡಬಹುದು.",
          },
          selectAreaLocality: {
            question: "ನಾನು ನನ್ನ ಪ್ರದೇಶ ಅಥವಾ ಸ್ಥಳೀಯತೆಯನ್ನು ಹೇಗೆ ಆಯ್ಕೆಮಾಡುವುದು?",
            answer:
              "AsliJobs ನಿಮಗೆ ಹತ್ತಿರದ ಉದ್ಯೋಗಗಳನ್ನು ತೋರಿಸುವಂತೆ WhatsAppನಲ್ಲಿ ನಿಮ್ಮ ನಗರ, ಪ್ರದೇಶ ಅಥವಾ ಸ್ಥಳೀಯತೆಯನ್ನು ಆಯ್ಕೆಮಾಡಬಹುದು.",
          },
          receiveJobAlertsSeeker: {
            question: "ನನಗೆ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳು ಹೇಗೆ ಬರುತ್ತವೆ?",
            answer:
              "ನಿಮ್ಮ AsliJobs ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಉದ್ಯೋಗ ಹುಡುಕಾಟ ಸ್ಥಿತಿ ಬ್ಯಾಡ್ಜ್ ಆನ್ ಆಗಿರುವಾಗ, ನಿಮ್ಮ ಸ್ಥಳ, ಉದ್ಯೋಗ ವರ್ಗ ಮತ್ತು ಪ್ರೊಫೈಲ್ ವಿವರಗಳ ಆಧಾರದ ಮೇಲೆ ಸೂಕ್ತ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳು ನೇರವಾಗಿ WhatsAppನಲ್ಲಿ ಬರುತ್ತವೆ. ಬ್ಯಾಡ್ಜ್ ಆಫ್ ಆಗಿದ್ದರೆ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳು ಬರುವುದಿಲ್ಲ.",
          },
          applyForAJob: {
            question: "ನಾನು ಉದ್ಯೋಗಕ್ಕೆ ಹೇಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು?",
            answer:
              "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು AsliJobs ವೆಬ್‌ಸೈಟ್ ಮೂಲಕ ಅಥವಾ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗೆ ಉತ್ತರಿಸಿ ಅಥವಾ ಅರ್ಜಿ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ ನೇರವಾಗಿ WhatsApp ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು.",
          },
          checkApplicationStatus: {
            question: "ನನ್ನ ಅರ್ಜಿ ಸ್ಥಿತಿಯನ್ನು ನಾನು ಹೇಗೆ ನೋಡಬಹುದು?",
            answer:
              "ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ, ಶಾರ್ಟ್‌ಲಿಸ್ಟ್, ಸಂದರ್ಶನ ನಿಗದಿ, ಆಯ್ಕೆಯಾಗಿದೆ ಅಥವಾ ಆಯ್ಕೆಯಾಗಿಲ್ಲ ಎಂಬ ಅರ್ಜಿ ನವೀಕರಣಗಳನ್ನು WhatsApp ಮೂಲಕ ಹಂಚಲಾಗುತ್ತದೆ.",
          },
          updateMyProfile: {
            question: "ನಾನು ನನ್ನ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಹೇಗೆ ನವೀಕರಿಸುವುದು?",
            answer:
              "AsliJobs ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಮೂಲಕ ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಬಹುದು.",
          },
          changePreferredLanguage: {
            question: "ನಾನು ನನ್ನ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಹೇಗೆ ಬದಲಾಯಿಸುವುದು?",
            answer:
              "ಹೌದು. ಬಳಕೆದಾರರು AsliJobs ವೆಬ್‌ಸೈಟ್, WhatsApp ಅಥವಾ AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ ತಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಬಹುದು.",
          },
        },
      },
      employerHelp: {
        title: "ಉದ್ಯೋಗದಾತ ಸಹಾಯ",
        description: "ಕಾರ್ಮಿಕರನ್ನು ನೇಮಿಸುವ ವ್ಯವಹಾರಗಳಿಗೆ",
        cardTitle: "ಉದ್ಯೋಗದಾತ ಸಹಾಯ",
        cardDescription: "ಕಾರ್ಮಿಕರನ್ನು ನೇಮಿಸುವ ವ್ಯವಹಾರಗಳಿಗೆ",
        articles: {
          registerAsEmployer: {
            question: "ನಾನು ಉದ್ಯೋಗದಾತರಾಗಿ ಹೇಗೆ ನೋಂದಾಯಿಸಿಕೊಳ್ಳುವುದು?",
            answer:
              "ನಿಮ್ಮ ಉದ್ಯೋಗದಾತ ಹೆಸರು, ಕಂಪನಿ ಹೆಸರು ಮತ್ತು ಸಂಪರ್ಕ ವಿವರಗಳನ್ನು ನೀಡಿ AsliJobsನಲ್ಲಿ ಉದ್ಯೋಗದಾತರಾಗಿ ನೋಂದಾಯಿಸಿಕೊಳ್ಳಬಹುದು. ನಿಮ್ಮ WhatsApp ಸಂಖ್ಯೆಯನ್ನು OTP ಮೂಲಕ ಪರಿಶೀಲಿಸಬೇಕು.",
          },
          postAJob: {
            question: "ನಾನು ಉದ್ಯೋಗವನ್ನು ಹೇಗೆ ಪೋಸ್ಟ್ ಮಾಡುವುದು?",
            answer:
              "ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಮಾಡುವ ಮೊದಲು ನಿಮ್ಮ ಕಂಪನಿ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಬೇಕು. ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ, ಸ್ಥಳ, ವೇತನ, ಕೆಲಸದ ಸಮಯ, ಖಾಲಿ ಹುದ್ದೆಗಳ ಸಂಖ್ಯೆ, ಅಗತ್ಯ ಅನುಭವ ಮತ್ತು ಇತರ ಮುಖ್ಯ ವಿವರಗಳನ್ನು ನೀಡಿ.",
          },
          jobPostRejected: {
            question: "ನನ್ನ ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಏಕೆ ತಿರಸ್ಕರಿಸಲಾಯಿತು?",
            answer:
              "ಅಪೂರ್ಣ ವಿವರಗಳು, ತಪ್ಪು ಮಾಹಿತಿ, ಅಸ್ಪಷ್ಟ ವೇತನ, ತಪ್ಪು ಸ್ಥಳ, ತಪ್ಪುದಾರಿಗೆಳೆಯುವ ವಿಷಯ ಇದ್ದರೆ, ವೇದಿಕೆ ಮಾರ್ಗಸೂಚಿಗಳನ್ನು ಉಲ್ಲಂಘಿಸಿದರೆ, ಅಥವಾ ಚಂದಾದಾರಿಕೆ ಮುಗಿದಿದ್ದರೆ ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ತಿರಸ್ಕರಿಸಬಹುದು.",
          },
          viewApplications: {
            question: "ನಾನು ಅರ್ಜಿಗಳನ್ನು ಹೇಗೆ ನೋಡಬಹುದು?",
            answer:
              "ಉದ್ಯೋಗದಾತರು ತಮ್ಮ ಉದ್ಯೋಗ ಪೋಸ್ಟ್‌ಗಳಿಗೆ ಬಂದ ಅರ್ಜಿಗಳನ್ನು ಉದ್ಯೋಗದಾತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮೂಲಕ ಅಥವಾ AsliJobs ತಂಡ ಹಂಚಿದ ನವೀಕರಣಗಳ ಮೂಲಕ ನೋಡಿ ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಮಾಡಬಹುದು.",
          },
          closeJobPost: {
            question: "ನಾನು ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಅನ್ನು ಹೇಗೆ ಮುಚ್ಚುವುದು?",
            answer:
              "ಹುದ್ದೆ ತುಂಬಿದಾಗ, ವಿರಾಮಗೊಳಿಸಿದಾಗ, ರದ್ದಾದಾಗ ಅಥವಾ ಇನ್ನು ಲಭ್ಯವಿಲ್ಲದಾಗ ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಅನ್ನು ಮುಚ್ಚಬಹುದು.",
          },
          employersContactSupport: {
            question: "ಉದ್ಯೋಗದಾತರು ಬೆಂಬಲವನ್ನು ಹೇಗೆ ಸಂಪರ್ಕಿಸಬಹುದು?",
            answer:
              "ಉದ್ಯೋಗ ಪೋಸ್ಟ್, ಅರ್ಜಿಗಳು, ಪಾವತಿಗಳು ಅಥವಾ ನೇಮಕಾತಿ ಸಹಾಯಕ್ಕಾಗಿ ಉದ್ಯೋಗದಾತರು WhatsApp, ಇಮೇಲ್ ಅಥವಾ ಲಭ್ಯವಿರುವ ಬೆಂಬಲ ಆಯ್ಕೆ ಮೂಲಕ AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು.",
          },
        },
      },
      whatsappHelp: {
        title: "WhatsApp ಸಹಾಯ",
        description: "WhatsApp-ಆಧಾರಿತ ಅನುಭವವನ್ನು ವಿವರಿಸುತ್ತದೆ",
        cardTitle: "WhatsApp ಸಹಾಯ",
        cardDescription: "WhatsApp-ಆಧಾರಿತ ಅನುಭವವನ್ನು ವಿವರಿಸುತ್ತದೆ",
        articles: {
          startOnWhatsapp: {
            question: "ನಾನು WhatsAppನಲ್ಲಿ AsliJobs ಅನ್ನು ಹೇಗೆ ಪ್ರಾರಂಭಿಸುವುದು?",
            answer:
              "AsliJobs WhatsApp ಲಿಂಕ್ ಕ್ಲಿಕ್ ಮಾಡಿ, QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ಅಧಿಕೃತ AsliJobs WhatsApp ಸಂಖ್ಯೆಗೆ ಸಂದೇಶ ಕಳುಹಿಸಿ ಪ್ರಾರಂಭಿಸಬಹುದು.",
          },
          receiveJobAlertsWhatsapp: {
            question: "ನನಗೆ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳು ಹೇಗೆ ಬರುತ್ತವೆ?",
            answer:
              "ನಿಮ್ಮ ಸ್ಥಳ, ಉದ್ಯೋಗ ವರ್ಗ, ಅನುಭವ ಮತ್ತು ಪ್ರೊಫೈಲ್ ವಿವರಗಳ ಆಧಾರದ ಮೇಲೆ WhatsAppನಲ್ಲಿ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳು ಬರುತ್ತವೆ.",
          },
          replyToMessages: {
            question: "ನಾನು ಸಂದೇಶಗಳಿಗೆ ಹೇಗೆ ಉತ್ತರಿಸಬೇಕು?",
            answer:
              "ಅರ್ಜಿ, ಹೌದು, ಇಲ್ಲ, ಸಹಾಯ ಅಥವಾ WhatsApp ಸಂದೇಶದಲ್ಲಿ ತೋರಿಸಿದ ಇತರ ಆಯ್ಕೆಗಳನ್ನು ಬಳಸಿ ಉತ್ತರಿಸಬಹುದು.",
          },
          applyThroughWhatsapp: {
            question: "ನಾನು WhatsApp ಮೂಲಕ ಉದ್ಯೋಗಗಳಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದೇ?",
            answer:
              "ಹೌದು. ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗೆ ಉತ್ತರಿಸಿ ಅಥವಾ ಅರ್ಜಿ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ ನೇರವಾಗಿ WhatsApp ಮೂಲಕ ಉದ್ಯೋಗಗಳಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು.",
          },
          notReceivingWhatsappMessages: {
            question: "ನನಗೆ WhatsApp ಸಂದೇಶಗಳು ಏಕೆ ಬರುತ್ತಿಲ್ಲ?",
            answer:
              "ನೆಟ್‌ವರ್ಕ್ ಸಮಸ್ಯೆಗಳು, ತಪ್ಪು ಸಂಖ್ಯೆ, ನಿರ್ಬಂಧಿಸಿದ ಸಂಖ್ಯೆ ಅಥವಾ ನಿಷ್ಕ್ರಿಯ WhatsApp ಕಾರಣದಿಂದ ಸಂದೇಶಗಳು ಬಾರದಿರಬಹುದು.",
          },
          officialAslijobsNumber: {
            question: "ಅಧಿಕೃತ AsliJobs ಸಂಖ್ಯೆ ನನಗೆ ಹೇಗೆ ಗೊತ್ತಾಗುತ್ತದೆ?",
            answer:
              "ಸರಿಯಾದ WhatsApp ಸಂಖ್ಯೆಗಾಗಿ ಯಾವಾಗಲೂ ಅಧಿಕೃತ AsliJobs ವೆಬ್‌ಸೈಟ್ ನೋಡಿ.",
          },
        },
      },
      applicationsInterviews: {
        title: "ಅರ್ಜಿಗಳು ಮತ್ತು ಸಂದರ್ಶನಗಳು",
        description: "ನೇಮಕಾತಿ ಪ್ರಯಾಣವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ವಿವರಿಸುತ್ತದೆ",
        cardTitle: "ಅರ್ಜಿಗಳು ಮತ್ತು ಸಂದರ್ಶನಗಳು",
        cardDescription: "ನೇಮಕಾತಿ ಪ್ರಯಾಣವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ವಿವರಿಸುತ್ತದೆ",
        articles: {
          afterIApply: {
            question: "ನಾನು ಉದ್ಯೋಗಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ ನಂತರ ಏನಾಗುತ್ತದೆ?",
            answer:
              "ನೀವು ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ ನಂತರ ನಿಮ್ಮ ಅರ್ಜಿಯನ್ನು ಪರಿಶೀಲನೆಗಾಗಿ ಉದ್ಯೋಗದಾತರೊಂದಿಗೆ ಹಂಚಲಾಗುತ್ತದೆ. ಮುಂದಿನ ನವೀಕರಣಗಳು WhatsApp ಮೂಲಕ ನಿಮಗೆ ಬರುತ್ತವೆ.",
          },
          shortlistedMeans: {
            question: "ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಎಂದರೆ ಅರ್ಥವೇನು?",
            answer:
              "ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಎಂದರೆ ಸಂದರ್ಶನ ಅಥವಾ ಮುಂದಿನ ಚರ್ಚೆಯಂತಹ ಮುಂದಿನ ಹಂತಕ್ಕೆ ಉದ್ಯೋಗದಾತರು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಿದ್ದಾರೆ ಎಂದರ್ಥ.",
          },
          interviewUpdates: {
            question: "ನನಗೆ ಸಂದರ್ಶನ ನವೀಕರಣಗಳು ಹೇಗೆ ಬರುತ್ತವೆ?",
            answer:
              "ದಿನಾಂಕ, ಸಮಯ, ಸ್ಥಳ ಮತ್ತು ಸಂಪರ್ಕ ವ್ಯಕ್ತಿಯ ವಿವರಗಳಂತಹ ಸಂದರ್ಶನ ನವೀಕರಣಗಳನ್ನು WhatsApp ಮೂಲಕ ನಿಮ್ಮೊಂದಿಗೆ ಹಂಚಲಾಗುತ್ತದೆ.",
          },
          interviewDocuments: {
            question: "ಸಂದರ್ಶನಕ್ಕೆ ನಾನು ಯಾವ ದಾಖಲೆಗಳನ್ನು ತೆಗೆದುಕೊಂಡು ಹೋಗಬೇಕು?",
            answer:
              "ಗುರುತಿನ ಪುರಾವೆ, ಅನುಭವದ ವಿವರಗಳು, ಪ್ರಮಾಣಪತ್ರಗಳು ಅಥವಾ ಉದ್ಯೋಗದಾತರು ಕೇಳಿದ ಯಾವುದೇ ದಾಖಲೆಗಳನ್ನು ತೆಗೆದುಕೊಂಡು ಹೋಗಬೇಕಾಗಬಹುದು.",
          },
          selectedStatusMeans: {
            question: "ಆಯ್ಕೆ ಸ್ಥಿತಿ ಎಂದರೆ ಅರ್ಥವೇನು?",
            answer:
              "ಆಯ್ಕೆಯಾಗಿದೆ ಎಂದರೆ ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಅಥವಾ ಸಂದರ್ಶನ ಪ್ರದರ್ಶನವನ್ನು ಪರಿಶೀಲಿಸಿದ ನಂತರ ಉದ್ಯೋಗದಾತರು ನಿಮ್ಮನ್ನು ಉದ್ಯೋಗಕ್ಕೆ ಆಯ್ಕೆ ಮಾಡಿದ್ದಾರೆ ಎಂದರ್ಥ.",
          },
          joiningConfirmation: {
            question: "ಸೇರುವ ದೃಢೀಕರಣ ಎಂದರೇನು?",
            answer:
              "ಸೇರುವ ದೃಢೀಕರಣ ಎಂದರೆ ಉದ್ಯೋಗದಾತರು ನಿಮ್ಮ ಸೇರುವ ದಿನಾಂಕ, ಸಮಯ, ಸ್ಥಳ ಮತ್ತು ಇತರ ಅಗತ್ಯ ವಿವರಗಳನ್ನು ದೃಢೀಕರಿಸಿದ್ದಾರೆ ಎಂದರ್ಥ.",
          },
        },
      },
      profileVideoProfile: {
        title: "ಪ್ರೊಫೈಲ್ ಮತ್ತು ವೀಡಿಯೊ ಪ್ರೊಫೈಲ್",
        description: "ಬಳಕೆದಾರರು ಉತ್ತಮ ಪ್ರೊಫೈಲ್‌ಗಳನ್ನು ನಿರ್ಮಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ",
        cardTitle: "ಪ್ರೊಫೈಲ್ ಮತ್ತು ವೀಡಿಯೊ ಪ್ರೊಫೈಲ್",
        cardDescription: "ಬಳಕೆದಾರರು ಉತ್ತಮ ಪ್ರೊಫೈಲ್‌ಗಳನ್ನು ನಿರ್ಮಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ",
        articles: {
          profileDetailsIncluded: {
            question: "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಯಾವ ವಿವರಗಳಿರುತ್ತವೆ?",
            answer:
              "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ಆದ್ಯತೆಯ ಉದ್ಯೋಗ ವರ್ಗ, ಕೌಶಲ್ಯಗಳು, ಕೆಲಸದ ಅನುಭವ, ಆದ್ಯತೆಯ ಸ್ಥಳ, ನಿರೀಕ್ಷಿತ ವೇತನ, ಲಭ್ಯತೆ ಮತ್ತು ಆದ್ಯತೆಯ ಭಾಷೆಯಂತಹ ವಿವರಗಳಿರುತ್ತವೆ.",
          },
          jobSeekersUpdateProfile: {
            question: "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ತಮ್ಮ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಹೇಗೆ ನವೀಕರಿಸಬಹುದು?",
            answer:
              "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು AsliJobs ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ತಮ್ಮ ಪ್ರೊಫೈಲ್ ಮೂಲಕ ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಬಹುದು.",
          },
          jobSearchStatusBadge: {
            question: "ಉದ್ಯೋಗ ಹುಡುಕಾಟ ಸ್ಥಿತಿ ಬ್ಯಾಡ್ಜ್ ಎಂದರೇನು?",
            answer:
              "ಈ ಬ್ಯಾಡ್ಜ್ ನೀವು ಸಕ್ರಿಯವಾಗಿ ಉದ್ಯೋಗ ಹುಡುಕುತ್ತಿದ್ದೀರಿ ಎಂದು ಸೂಚಿಸುತ್ತದೆ. ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಲು ನಿಮ್ಮ AsliJobs ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಈ ಬ್ಯಾಡ್ಜ್ ಅನ್ನು ಆನ್ ಮಾಡಬೇಕು. ಬ್ಯಾಡ್ಜ್ ಆಫ್ ಆಗಿದ್ದರೆ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳು ಬರುವುದಿಲ್ಲ.",
          },
          introductionVideoMeaning: {
            question: "ಪರಿಚಯ ವೀಡಿಯೊ ಎಂದರೇನು?",
            answer:
              "ಪರಿಚಯ ವೀಡಿಯೊ ಎಂದರೆ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿ ತಮ್ಮನ್ನು ಪರಿಚಯಿಸಿಕೊಂಡು ತಮ್ಮ ಕೌಶಲ್ಯಗಳು, ಕೆಲಸದ ಅನುಭವ, ಆದ್ಯತೆಯ ಉದ್ಯೋಗ ಪಾತ್ರ ಮತ್ತು ಲಭ್ಯತೆಯನ್ನು ವಿವರಿಸುವ ಚಿಕ್ಕ ವೀಡಿಯೊ.",
          },
          createIntroductionVideo: {
            question: "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ಪರಿಚಯ ವೀಡಿಯೊವನ್ನು ಹೇಗೆ ರಚಿಸಬಹುದು?",
            answer:
              "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ತಮ್ಮನ್ನು ಪರಿಚಯಿಸುವ ಚಿಕ್ಕ ಸ್ಪಷ್ಟ ವೀಡಿಯೊವನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಿ, AsliJobs ನೀಡಿದ ಆಯ್ಕೆ ಮೂಲಕ ಅಪ್‌ಲೋಡ್ ಅಥವಾ ಹಂಚಿಕೊಳ್ಳಬಹುದು.",
          },
          includeInIntroductionVideo: {
            question: "ಪರಿಚಯ ವೀಡಿಯೊದಲ್ಲಿ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ಏನನ್ನು ಸೇರಿಸಬೇಕು?",
            answer:
              "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ತಮ್ಮ ಹೆಸರು, ಕೌಶಲ್ಯಗಳು, ಕೆಲಸದ ಅನುಭವ, ಆದ್ಯತೆಯ ಉದ್ಯೋಗ ವರ್ಗ, ಆದ್ಯತೆಯ ಕೆಲಸದ ಸ್ಥಳ, ಲಭ್ಯತೆ ಮತ್ತು ಸಂಬಂಧಿತ ಅರ್ಹತೆಗಳು ಅಥವಾ ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ಹೇಳಬೇಕು.",
          },
        },
      },
      languageSupport: {
        title: "ಭಾಷಾ ಬೆಂಬಲ",
        description: "ಪ್ರಾದೇಶಿಕ ಭಾಷಾ ಲಭ್ಯತೆಗಾಗಿ",
        cardTitle: "ಭಾಷಾ ಬೆಂಬಲ",
        cardDescription: "ಪ್ರಾದೇಶಿಕ ಭಾಷಾ ಲಭ್ಯತೆಗಾಗಿ",
        articles: {
          supportedLanguages: {
            question: "AsliJobs ಯಾವ ಭಾಷೆಗಳನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ?",
            answer:
              "AsliJobs ಇಂಗ್ಲಿಷ್, ಹಿಂದಿ, ತೆಲುಗು, ತಮಿಳು, ಕನ್ನಡ ಮತ್ತು ಮಲಯಾಳಂ ಭಾಷೆಗಳನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ.",
          },
          changeMyLanguage: {
            question: "ನಾನು ನನ್ನ ಭಾಷೆಯನ್ನು ಹೇಗೆ ಬದಲಾಯಿಸಬಹುದು?",
            answer:
              "ಹೌದು. ಬಳಕೆದಾರರು AsliJobs ವೆಬ್‌ಸೈಟ್, WhatsApp ಅಥವಾ AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ ತಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಬಹುದು.",
          },
          alertsInLocalLanguage: {
            question: "ನನ್ನ ಸ್ಥಳೀಯ ಭಾಷೆಯಲ್ಲಿ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಬಹುದೇ?",
            answer:
              "ಹೌದು. ಲಭ್ಯವಿರುವಲ್ಲಿ AsliJobs ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯಲ್ಲಿ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಮುಖ್ಯ ನವೀಕರಣಗಳನ್ನು ಕಳುಹಿಸಬಹುದು.",
          },
        },
      },
      safetyReporting: {
        title: "ಸುರಕ್ಷತೆ ಮತ್ತು ವರದಿ",
        description: "ಬಳಕೆದಾರ ನಂಬಿಕೆ ಮತ್ತು ರಕ್ಷಣೆ ಪದರ",
        cardTitle: "ಸುರಕ್ಷತೆ ಮತ್ತು ವರದಿ",
        cardDescription: "ಬಳಕೆದಾರ ನಂಬಿಕೆ ಮತ್ತು ರಕ್ಷಣೆ ಪದರ",
        articles: {
          identifyFakeJob: {
            question: "ನಕಲಿ ಉದ್ಯೋಗವನ್ನು ನಾನು ಹೇಗೆ ಗುರುತಿಸುವುದು?",
            answer:
              "ಅಸ್ಪಷ್ಟ ಕಂಪನಿ ವಿವರಗಳು, ನಕಲಿ ವೇತನ ಭರವಸೆಗಳು, ತಪ್ಪು ಸ್ಥಳ, ಪಾವತಿ ಬೇಡಿಕೆಗಳು ಅಥವಾ ಅನುಮಾನಾಸ್ಪದ ಸಂದರ್ಶನ ಸೂಚನೆಗಳಿರುವ ಉದ್ಯೋಗಗಳ ಬಗ್ಗೆ ಎಚ್ಚರವಿರಿ.",
          },
          payMoneyForJob: {
            question: "ಉದ್ಯೋಗ ಪಡೆಯಲು ನಾನು ಹಣ ಕೊಡಬೇಕೇ?",
            answer:
              "ಇಲ್ಲ. ಉದ್ಯೋಗ ದೃಢೀಕರಣಕ್ಕಾಗಿ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ಹಣ ಕೊಡಬಾರದು. ಯಾರಾದರೂ ಪಾವತಿ ಕೇಳಿದರೆ ತಕ್ಷಣ AsliJobsಗೆ ವರದಿ ಮಾಡಿ.",
          },
          reportFakeJob: {
            question: "ನಕಲಿ ಉದ್ಯೋಗವನ್ನು ನಾನು ಹೇಗೆ ವರದಿ ಮಾಡುವುದು?",
            answer:
              "WhatsApp ಅಥವಾ ಲಭ್ಯವಿರುವ ಬೆಂಬಲ ಆಯ್ಕೆ ಮೂಲಕ AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ ನಕಲಿ ಅಥವಾ ಅನುಮಾನಾಸ್ಪದ ಉದ್ಯೋಗವನ್ನು ವರದಿ ಮಾಡಬಹುದು.",
          },
          reportEmployerMisconduct: {
            question: "ಉದ್ಯೋಗದಾತ ದುರ್ನಡತೆಯನ್ನು ನಾನು ಹೇಗೆ ವರದಿ ಮಾಡುವುದು?",
            answer:
              "ಉದ್ಯೋಗದಾತರ ಹೆಸರು, ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ, ಸಮಸ್ಯೆಯ ವಿವರಗಳು ಮತ್ತು ಸ್ಕ್ರೀನ್‌ಶಾಟ್‌ಗಳನ್ನು AsliJobs ಬೆಂಬಲದೊಂದಿಗೆ ಹಂಚಿ ಉದ್ಯೋಗದಾತ ದುರ್ನಡತೆಯನ್ನು ವರದಿ ಮಾಡಬಹುದು.",
          },
          abusiveMessages: {
            question: "ನಿಂದನೀಯ ಸಂದೇಶಗಳು ಬಂದರೆ ನಾನು ಏನು ಮಾಡಬೇಕು?",
            answer:
              "ಮುಂದೆ ಉತ್ತರಿಸಬೇಡಿ. ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ತೆಗೆದು ಸಂದೇಶವನ್ನು ತಕ್ಷಣ AsliJobs ಬೆಂಬಲಕ್ಕೆ ವರದಿ ಮಾಡಿ.",
          },
          informationNotToShare: {
            question: "ನಾನು ಯಾವ ಮಾಹಿತಿಯನ್ನು ಹಂಚಬಾರದು?",
            answer:
              "ತಿಳಿಯದ ವ್ಯಕ್ತಿಗಳೊಂದಿಗೆ OTP, ಬ್ಯಾಂಕ್ ವಿವರಗಳು, ಪಾಸ್‌ವರ್ಡ್‌ಗಳು, UPI PIN, ವೈಯಕ್ತಿಕ ದಾಖಲೆಗಳು ಅಥವಾ ಸೂಕ್ಷ್ಮ ಮಾಹಿತಿಯನ್ನು ಹಂಚಬೇಡಿ.",
          },
          interviewSafetyTips: {
            question: "ಸಂದರ್ಶನಗಳಿಗೆ ನಾನು ಯಾವ ಸುರಕ್ಷತಾ ಸಲಹೆಗಳನ್ನು ಅನುಸರಿಸಬೇಕು?",
            answer:
              "ಹಾಜರಾಗುವ ಮೊದಲು ಕಂಪನಿ ಹೆಸರು, ಸಂದರ್ಶನ ಸ್ಥಳ, ಸಂಪರ್ಕ ವ್ಯಕ್ತಿ ಮತ್ತು ಉದ್ಯೋಗ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ. ಅಗತ್ಯವಿದ್ದರೆ ಕುಟುಂಬದ ಸದಸ್ಯರಿಗೆ ಅಥವಾ ಸ್ನೇಹಿತರಿಗೆ ತಿಳಿಸಿ.",
          },
          platformSafetyChecks: {
            question: "AsliJobs ವೇದಿಕೆಯನ್ನು ಹೇಗೆ ಸುರಕ್ಷಿತವಾಗಿಡುತ್ತದೆ?",
            answer:
              "ಸುರಕ್ಷಿತ ನೇಮಕಾತಿ ಅನುಭವಕ್ಕಾಗಿ AsliJobs ಉದ್ಯೋಗದಾತರು, ದೂರುಗಳು ಮತ್ತು ಅನುಮಾನಾಸ್ಪದ ಚಟುವಟಿಕೆಯನ್ನು ಪರಿಶೀಲಿಸಬಹುದು.",
          },
        },
      },
      paymentsPlansPromotions: {
        title: "ಪಾವತಿಗಳು, ಯೋಜನೆಗಳು ಮತ್ತು ಪ್ರಚಾರಗಳು",
        description: "ಮುಖ್ಯವಾಗಿ ಉದ್ಯೋಗದಾತರಿಗೆ",
        cardTitle: "ಪಾವತಿಗಳು ಮತ್ತು ಪ್ರಚಾರಗಳು",
        cardDescription: "ಮುಖ್ಯವಾಗಿ ಉದ್ಯೋಗದಾತರಿಗೆ",
        articles: {
          freeAndPaidServices: {
            question: "ಯಾವ ಸೇವೆಗಳು ಉಚಿತ ಮತ್ತು ಯಾವುವು ಪಾವತಿ?",
            answer:
              "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳಿಗೆ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಲು ಮತ್ತು ಅರ್ಜಿ ಸಲ್ಲಿಸಲು AsliJobs ಉಚಿತ. ಉದ್ಯೋಗದಾತ ಸೇವೆಗಳು, ನೇಮಕಾತಿ ಯೋಜನೆಗಳು ಮತ್ತು ಪ್ರಚಾರಗಳು ಪಾವತಿಯಾಗಿರಬಹುದು.",
          },
          employerPlans: {
            question: "ಉದ್ಯೋಗದಾತ ಯೋಜನೆಗಳು ಎಂದರೇನು?",
            answer:
              "ಉದ್ಯೋಗದಾತ ಯೋಜನೆಗಳು ವ್ಯವಹಾರಗಳು ಉದ್ಯೋಗಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಲು, ಅರ್ಜಿಗಳನ್ನು ಪಡೆಯಲು, ಖಾಲಿ ಹುದ್ದೆಗಳನ್ನು ಪ್ರಚಾರ ಮಾಡಲು ಮತ್ತು ನೇಮಕಾತಿಯನ್ನು ಉತ್ತಮವಾಗಿ ನಿರ್ವಹಿಸಲು ಸಹಾಯ ಮಾಡುವ ಪಾವತಿ ಆಯ್ಕೆಗಳು.",
          },
          promotedJobs: {
            question: "ಪ್ರಚಾರಿತ ಉದ್ಯೋಗಗಳು ಎಂದರೇನು?",
            answer:
              "ಪ್ರಚಾರಿತ ಉದ್ಯೋಗಗಳು ಹೆಚ್ಚುವರಿ ಗೋಚರತೆ ನೀಡಿದ ಉದ್ಯೋಗ ಪೋಸ್ಟ್‌ಗಳು, ಇದರಿಂದ ಹೆಚ್ಚು ಸೂಕ್ತ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ಅವುಗಳನ್ನು ನೋಡಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು.",
          },
          campaignPromotions: {
            question: "ಪ್ರಚಾರ ಅಭಿಯಾನಗಳು ಎಂದರೇನು?",
            answer:
              "ಪ್ರಚಾರ ಅಭಿಯಾನಗಳು ಸ್ಥಳ, ಉದ್ಯೋಗ ವರ್ಗ ಮತ್ತು ಭಾಷೆಯ ಆಧಾರದ ಮೇಲೆ ಗುರಿಯಿಟ್ಟ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳ ಮೂಲಕ ಉದ್ಯೋಗದಾತರು ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳನ್ನು ತಲುಪಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ.",
          },
          paymentSupport: {
            question: "ನನಗೆ ಪಾವತಿ ಬೆಂಬಲ ಹೇಗೆ ಸಿಗುತ್ತದೆ?",
            answer:
              "ಪಾವತಿಗಳು, ಯೋಜನೆ ಸಕ್ರಿಯಗೊಳಿಸುವಿಕೆ, ವಿಫಲ ವಹಿವಾಟುಗಳು ಅಥವಾ ಬಿಲ್ಲಿಂಗ್ ಸಮಸ್ಯೆಗಳಿಗೆ ಸಹಾಯಕ್ಕಾಗಿ ಉದ್ಯೋಗದಾತರು AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು.",
          },
          getAnInvoice: {
            question: "ನನಗೆ ಇನ್‌ವಾಯ್ಸ್ ಹೇಗೆ ಸಿಗುತ್ತದೆ?",
            answer:
              "ಪಾವತಿ ಪೂರ್ಣಗೊಂಡ ನಂತರ ಉದ್ಯೋಗದಾತರು AsliJobs ಬೆಂಬಲದ ಮೂಲಕ ಇನ್‌ವಾಯ್ಸ್ ಕೇಳಬಹುದು.",
          },
        },
      },
      accountDataHelp: {
        title: "ಖಾತೆ ಮತ್ತು ಡೇಟಾ ಸಹಾಯ",
        description: "ಪ್ರೊಫೈಲ್, ಗೌಪ್ಯತೆ ಮತ್ತು ಡೇಟಾ ನಿಯಂತ್ರಣ",
        cardTitle: "ಖಾತೆ ಮತ್ತು ಡೇಟಾ",
        cardDescription: "ಪ್ರೊಫೈಲ್, ಗೌಪ್ಯತೆ ಮತ್ತು ಡೇಟಾ ನಿಯಂತ್ರಣ",
        articles: {
          updateAccountDetails: {
            question: "ನಾನು ನನ್ನ ಖಾತೆ ವಿವರಗಳನ್ನು ಹೇಗೆ ನವೀಕರಿಸುವುದು?",
            answer:
              "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು AsliJobs ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ತಮ್ಮ ಪ್ರೊಫೈಲ್ ಮೂಲಕ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಬಹುದು, ಉದ್ಯೋಗದಾತರು ಉದ್ಯೋಗದಾತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮೂಲಕ ತಮ್ಮ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಬಹುದು. ಅವರು WhatsApp ಅಥವಾ ಲಭ್ಯವಿರುವ ಬೆಂಬಲ ಆಯ್ಕೆಗಳ ಮೂಲಕ AsliJobs ಬೆಂಬಲವನ್ನೂ ಸಂಪರ್ಕಿಸಬಹುದು.",
          },
          changeMobileNumber: {
            question: "ನಾನು ನನ್ನ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ಹೇಗೆ ಬದಲಾಯಿಸುವುದು?",
            answer:
              "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು AsliJobs ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ತಮ್ಮ ಪ್ರೊಫೈಲ್ ಮೂಲಕ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನವೀಕರಿಸಬಹುದು, ಉದ್ಯೋಗದಾತರು ಉದ್ಯೋಗದಾತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮೂಲಕ ನವೀಕರಿಸಬಹುದು. ಅವರು AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ ಅಗತ್ಯ ಪರಿಶೀಲನೆ ವಿವರಗಳನ್ನು ನೀಡಬಹುದು.",
          },
          deactivateAccount: {
            question: "ಬಳಕೆದಾರರು ತಮ್ಮ ಖಾತೆಯನ್ನು ಹೇಗೆ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಬಹುದು?",
            answer:
              "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು AsliJobs ವೆಬ್‌ಸೈಟ್‌ನ ಪ್ರೊಫೈಲ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳ ಮೂಲಕ ತಮ್ಮ ಖಾತೆಯನ್ನು ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಬಹುದು, ಉದ್ಯೋಗದಾತರು ಉದ್ಯೋಗದಾತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮೂಲಕ ತಮ್ಮ ಖಾತೆಯನ್ನು ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಬಹುದು. ಖಾತೆ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸುವ ಸಹಾಯಕ್ಕಾಗಿ ಬಳಕೆದಾರರು AsliJobs ಬೆಂಬಲವನ್ನೂ ಸಂಪರ್ಕಿಸಬಹುದು.",
          },
          howDataIsUsed: {
            question: "AsliJobs ನನ್ನ ಡೇಟಾವನ್ನು ಹೇಗೆ ಬಳಸುತ್ತದೆ?",
            answer:
              "ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳನ್ನು ನೀಡಲು, ಅರ್ಜಿಗಳನ್ನು ನಿರ್ವಹಿಸಲು, ನೇಮಕಾತಿಗೆ ಬೆಂಬಲ ನೀಡಲು, ಸೇವೆಗಳನ್ನು ಸುಧಾರಿಸಲು ಮತ್ತು ನಿಮ್ಮೊಂದಿಗೆ ಸಂವಹನ ಮಾಡಲು AsliJobs ನಿಮ್ಮ ಡೇಟಾವನ್ನು ಬಳಸುತ್ತದೆ.",
          },
          whoCanSeeProfile: {
            question: "ನನ್ನ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಯಾರು ನೋಡಬಹುದು?",
            answer:
              "ಉದ್ಯೋಗ ಹುಡುಕಾಟ, ಅರ್ಜಿ ಮತ್ತು ನೇಮಕಾತಿ ಉದ್ದೇಶಗಳಿಗಾಗಿ ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಅನ್ನು AsliJobs ನಿರ್ವಾಹಕರು ಮತ್ತು ಸಂಬಂಧಿತ ಉದ್ಯೋಗದಾತರು ನೋಡಬಹುದು.",
          },
          removeJobVideo: {
            question: "ನಾನು ಉದ್ಯೋಗ ವೀಡಿಯೊವನ್ನು ಹೇಗೆ ತೆಗೆದುಹಾಕುವುದು?",
            answer:
              "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು AsliJobs ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ತಮ್ಮ ಪ್ರೊಫೈಲ್ ಮೂಲಕ ಅಥವಾ AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ ಹಳೆಯ ಪರಿಚಯ ವೀಡಿಯೊವನ್ನು ತೆಗೆದುಹಾಕಿ ಹೊಸದನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಬಹುದು.",
          },
          privacySupport: {
            question: "ನನಗೆ ಗೌಪ್ಯತೆ ಬೆಂಬಲ ಹೇಗೆ ಸಿಗುತ್ತದೆ?",
            answer:
              "ಗೌಪ್ಯತೆಗೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಗಳು, ಡೇಟಾ ನವೀಕರಣಗಳು, ಅಳಿಸುವ ವಿನಂತಿಗಳು ಅಥವಾ ಖಾತೆ ಕಾಳಜಿಗಳಿಗಾಗಿ ನೀವು AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು.",
          },
        },
      },
      contactSupport: {
        title: "ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ",
        description: "ಅಂತಿಮ ಸಹಾಯ ಮತ್ತು ದೂರು ಪದರ",
        cardTitle: "ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ",
        cardDescription: "ಅಂತಿಮ ಸಹಾಯ ಮತ್ತು ದೂರು ಪದರ",
        articles: {
          contactAslijobsSupport: {
            question: "ನಾನು AsliJobs ಬೆಂಬಲವನ್ನು ಹೇಗೆ ಸಂಪರ್ಕಿಸಬಹುದು?",
            answer:
              "ನೀವು WhatsApp, ಫೋನ್ ಅಥವಾ ಇಮೇಲ್ ಮೂಲಕ AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು.",
          },
          raiseAComplaint: {
            question: "ನಾನು ದೂರನ್ನು ಹೇಗೆ ಸಲ್ಲಿಸಬಹುದು?",
            answer:
              "WhatsApp, ಫೋನ್ ಅಥವಾ ಇಮೇಲ್ ಮೂಲಕ AsliJobs ಬೆಂಬಲದೊಂದಿಗೆ ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಹಂಚಿ ದೂರು ಸಲ್ಲಿಸಬಹುದು.",
          },
          complaintDetails: {
            question: "ದೂರಿಗಾಗಿ ನಾನು ಯಾವ ವಿವರಗಳನ್ನು ನೀಡಬೇಕು?",
            answer:
              "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ತಮ್ಮ ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ, ಉದ್ಯೋಗದಾತರ ಹೆಸರು, ಸಮಸ್ಯೆಯ ವಿವರಗಳು ಮತ್ತು ಲಭ್ಯವಿದ್ದರೆ ಸ್ಕ್ರೀನ್‌ಶಾಟ್‌ಗಳನ್ನು ಹಂಚಬೇಕು. ಉದ್ಯೋಗದಾತರು ತಮ್ಮ ಹೆಸರು, ಕಂಪನಿ ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ ಅಥವಾ ಜಾಬ್ ಐಡಿ, ಅಭ್ಯರ್ಥಿ ವಿವರಗಳು, ಸಮಸ್ಯೆಯ ವಿವರಗಳು ಮತ್ತು ಲಭ್ಯವಿದ್ದರೆ ಸಂಬಂಧಿತ ಸ್ಕ್ರೀನ್‌ಶಾಟ್‌ಗಳನ್ನು ಹಂಚಬೇಕು.",
          },
          reopenAComplaint: {
            question: "ನಾನು ದೂರನ್ನು ಮತ್ತೆ ಹೇಗೆ ತೆರೆಯಬಹುದು?",
            answer:
              "ಸಮಸ್ಯೆ ಪರಿಹಾರವಾಗದಿದ್ದರೆ ಅಥವಾ ಹೆಚ್ಚಿನ ಬೆಂಬಲ ಬೇಕಾದರೆ ದೂರನ್ನು ಮತ್ತೆ ತೆರೆಯಲು ಕೇಳಬಹುದು.",
          },
          supportResponseTime: {
            question: "ಬೆಂಬಲ ಉತ್ತರಿಸಲು ಎಷ್ಟು ಸಮಯ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ?",
            answer:
              "AsliJobs ಸಾಧ್ಯವಾದಷ್ಟು ಬೇಗ ಉತ್ತರಿಸಲು ಪ್ರಯತ್ನಿಸುತ್ತದೆ. ಉತ್ತರದ ಸಮಯ ಸಮಸ್ಯೆ ಮತ್ತು ಬೆಂಬಲ ಲಭ್ಯತೆಯನ್ನು ಅವಲಂಬಿಸಿ ಬದಲಾಗಬಹುದು.",
          },
          contactSupportWhatsapp: {
            question: "ನಾನು WhatsApp ಮೂಲಕ ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಬಹುದೇ?",
            answer:
              "ಹೌದು. ಅಧಿಕೃತ WhatsApp ಸಂಖ್ಯೆ ಮೂಲಕ ನೀವು AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು.",
          },
          contactSupportEmail: {
            question: "ನಾನು ಇಮೇಲ್ ಮೂಲಕ ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಬಹುದೇ?",
            answer:
              "ಹೌದು. ಅಧಿಕೃತ ಬೆಂಬಲ ಇಮೇಲ್ ವಿಳಾಸದ ಮೂಲಕ ನೀವು AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು.",
          },
        },
      },
    },
  },
};

const ml: MessageShape<typeof en> = {
  helpCenter: {
    pageTitle: "സഹായ കേന്ദ്രം",
    searchPlaceholder: "സഹായ ലേഖനങ്ങൾ തിരയുക...",
    emptyTitle: "സഹായ ലേഖനങ്ങളൊന്നും കണ്ടെത്തിയില്ല",
    emptyDescription:
      "മറ്റൊരു കീവേഡ് പരീക്ഷിക്കുക, അല്ലെങ്കിൽ എല്ലാ വിഭാഗങ്ങളും കാണാൻ തിരയൽ മായ്ക്കുക.",
    clearSearch: "തിരയൽ മായ്ക്കുക",
    supportTitle: "കൂടുതൽ സഹായം വേണോ?",
    supportDescription:
      "നിങ്ങളുടെ ഉത്തരം കിട്ടിയില്ലെങ്കിൽ ഞങ്ങളുടെ സപ്പോർട്ട് ടീമിനെ ബന്ധപ്പെടുക.",
    whatsapp: "WhatsApp പിന്തുണ",
    call: "കോൾ പിന്തുണ",
    email: "ഇമെയിൽ പിന്തുണ",
    categoriesAria: "സഹായ വിഭാഗങ്ങൾ",
    categoriesLabel: "വിഭാഗങ്ങൾ",
    categories: {
      gettingStarted: {
        title: "ആരംഭിക്കുക",
        description: "പ്രധാന പരിചയ പാളി",
        cardTitle: "ആരംഭിക്കുക",
        cardDescription: "പ്രധാന പരിചയ പാളി",
        articles: {
          whatIsAslijobs: {
            question: "AsliJobs എന്താണ്?",
            answer:
              "AsliJobs ഇന്ത്യയിലെ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ, എൻട്രി-ലെവൽ തൊഴിലാളികൾക്കായി നിർമ്മിച്ച WhatsApp അടിസ്ഥാനത്തിലുള്ള ജോലി പോർട്ടലാണ്. അനുയോജ്യമായ ജോലികൾ കണ്ടെത്താൻ തൊഴിൽ അന്വേഷകരെ സഹായിക്കുകയും ശരിയായ ഉദ്യോഗാർത്ഥികളുമായി തൊഴിലുടമകൾക്ക് എളുപ്പത്തിൽ ബന്ധപ്പെടാൻ സഹായിക്കുകയും ചെയ്യുന്നു.",
          },
          howDoesAslijobsWork: {
            question: "AsliJobs എങ്ങനെ പ്രവർത്തിക്കുന്നു?",
            answer:
              "AsliJobs WhatsApp വഴി പ്രവർത്തിക്കുന്നു. തൊഴിൽ അന്വേഷകർക്ക് രജിസ്റ്റർ ചെയ്യാനും ജോലി അലർട്ടുകൾ ലഭിക്കാനും ജോലികൾക്ക് അപേക്ഷിക്കാനും അഭിമുഖ അപ്‌ഡേറ്റുകൾ ലഭിക്കാനും കഴിയും. തൊഴിലുടമകൾക്ക് പ്രൊഫൈലുകൾ സൃഷ്ടിക്കാനും ജോലികൾ പോസ്റ്റ് ചെയ്യാനും അപേക്ഷകൾ നിയന്ത്രിക്കാനും ഉദ്യോഗാർത്ഥികളെ ഷോർട്ട്‌ലിസ്റ്റ് ചെയ്യാനും അഭിമുഖങ്ങൾ ഷെഡ്യൂൾ ചെയ്യാനും കഴിയും.",
          },
          whoCanUseAslijobs: {
            question: "AsliJobs ആർക്കൊക്കെ ഉപയോഗിക്കാം?",
            answer:
              "ജോലി തിരയുന്ന തൊഴിൽ അന്വേഷകർക്കും തൊഴിലാളികളെ നിയമിക്കാൻ ആഗ്രഹിക്കുന്ന തൊഴിലുടമകൾക്കും AsliJobs ഉപയോഗിക്കാം. ഇത് പ്രധാനമായും ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ, സപ്പോർട്ട്, എൻട്രി-ലെവൽ ജോലി റോളുകൾക്കായി രൂപകൽപ്പന ചെയ്തതാണ്.",
          },
          needToDownloadApp: {
            question: "എനിക്ക് ഒരു ആപ്പ് ഡൗൺലോഡ് ചെയ്യേണ്ടതുണ്ടോ?",
            answer:
              "ഇല്ല. തൊഴിൽ അന്വേഷകർക്കും തൊഴിലുടമകൾക്കും ഒരു ആപ്പും ഡൗൺലോഡ് ചെയ്യേണ്ടതില്ല. AsliJobs നേരിട്ട് WhatsApp വഴി പ്രവർത്തിക്കുന്നതിനാൽ ഉപയോഗിക്കാൻ ലളിതമാണ്.",
          },
          isAslijobsFreeToUse: {
            question: "AsliJobs ഉപയോഗിക്കുന്നത് സൗജന്യമാണോ?",
            answer:
              "അതെ. തൊഴിൽ അന്വേഷകർക്ക് ജോലികൾ തിരയാനും അപേക്ഷിക്കാനും AsliJobs സൗജന്യമാണ്. ചില തൊഴിലുടമ സേവനങ്ങൾ, പ്രമോഷനുകൾ അല്ലെങ്കിൽ നിയമന പ്ലാനുകൾ പണമടച്ചുള്ളതാകാം.",
          },
          whichCities: {
            question: "AsliJobs ഏതൊക്കെ നഗരങ്ങളിൽ സേവനം നൽകുന്നു?",
            answer:
              "AsliJobs ഇന്ത്യയിലുടനീളം തൊഴിൽ അന്വേഷകർക്കും തൊഴിലുടമകൾക്കും സേവനം നൽകുന്നു. തൊഴിൽ അന്വേഷകർക്ക് എവിടെ നിന്നും ജോലികൾ തിരഞ്ഞ് അപേക്ഷിക്കാം, തൊഴിലുടമകൾക്ക് ഏത് സ്ഥലത്തുനിന്നും ജോലികൾ പോസ്റ്റ് ചെയ്യാം. ജോലി ലഭ്യത നഗരം, പ്രദേശം, ലോക്കാലിറ്റി, നിലവിലെ തൊഴിലുടമ ഒഴിവുകൾ എന്നിവയെ ആശ്രയിച്ച് മാറാം.",
          },
          jobCategoriesAvailable: {
            question: "ഏതൊക്കെ ജോലി വിഭാഗങ്ങളാണ് ലഭ്യം?",
            answer:
              "AsliJobs നിർമ്മാണം, നിർമ്മാണ പ്രവൃത്തി, ലോജിസ്റ്റിക്സ്, ഗതാഗതം, വെയർഹൗസിങ്, റീട്ടെയിൽ, ഹോസ്പിറ്റാലിറ്റി, ഫെസിലിറ്റി മാനേജ്‌മെന്റ്, സെക്യൂരിറ്റി സേവനങ്ങൾ, ഓട്ടോമോട്ടീവ്, ഹെൽത്ത്‌കെയർ സപ്പോർട്ട്, മറ്റ് ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ മേഖലകൾ എന്നിവയെ പിന്തുണയ്ക്കുന്നു.",
          },
        },
      },
      jobSeekerHelp: {
        title: "തൊഴിൽ അന്വേഷക സഹായം",
        description: "ജോലി തിരഞ്ഞ് അപേക്ഷിക്കുന്ന തൊഴിലാളികൾക്ക്",
        cardTitle: "തൊഴിൽ അന്വേഷക സഹായം",
        cardDescription: "ജോലി തിരഞ്ഞ് അപേക്ഷിക്കുന്ന തൊഴിലാളികൾക്ക്",
        articles: {
          registerAsJobSeeker: {
            question: "ഞാൻ തൊഴിൽ അന്വേഷകനായി എങ്ങനെ രജിസ്റ്റർ ചെയ്യും?",
            answer:
              "പേര്, മൊബൈൽ നമ്പർ, സ്ഥലം, ഇഷ്ടഭാഷ, ജോലി വിഭാഗം, അനുഭവം എന്നിവ പോലുള്ള അടിസ്ഥാന വിവരങ്ങൾ പങ്കിട്ട് WhatsApp വഴി AsliJobs-ൽ രജിസ്റ്റർ ചെയ്യാം.",
          },
          createJobProfile: {
            question: "എന്റെ ജോലി പ്രൊഫൈൽ ഞാൻ എങ്ങനെ സൃഷ്ടിക്കും?",
            answer:
              "ഇഷ്ട ജോലി വിഭാഗം, കഴിവുകൾ, ജോലി അനുഭവം, ഇഷ്ട സ്ഥലം, പ്രതീക്ഷിക്കുന്ന ശമ്പളം, ലഭ്യത എന്നിവ ചേർത്ത് AsliJobs വെബ്‌സൈറ്റിൽ നിങ്ങളുടെ ജോലി പ്രൊഫൈൽ സൃഷ്ടിക്കാം. നിങ്ങളുടെ പശ്ചാത്തലം, കഴിവുകൾ, അനുഭവം, നിങ്ങൾ തിരയുന്ന ജോലിയുടെ തരം എന്നിവ കാണിക്കുന്ന പരിചയ വീഡിയോയും അപ്‌ലോഡ് ചെയ്യാം.",
          },
          selectAreaLocality: {
            question: "എന്റെ പ്രദേശമോ ലോക്കാലിറ്റിയോ ഞാൻ എങ്ങനെ തിരഞ്ഞെടുക്കും?",
            answer:
              "AsliJobs നിങ്ങൾക്ക് അടുത്തുള്ള ജോലികൾ കാണിക്കുന്നതിന് WhatsApp-ൽ നിങ്ങളുടെ നഗരം, പ്രദേശം അല്ലെങ്കിൽ ലോക്കാലിറ്റി തിരഞ്ഞെടുക്കാം.",
          },
          receiveJobAlertsSeeker: {
            question: "എനിക്ക് ജോലി അലർട്ടുകൾ എങ്ങനെ ലഭിക്കും?",
            answer:
              "നിങ്ങളുടെ AsliJobs പ്രൊഫൈലിൽ ജോബ് സെർച്ച് സ്റ്റാറ്റസ് ബാഡ്ജ് ഓണായിരിക്കുമ്പോൾ, സ്ഥലം, ജോലി വിഭാഗം, പ്രൊഫൈൽ വിശദാംശങ്ങൾ എന്നിവയെ അടിസ്ഥാനമാക്കി അനുയോജ്യമായ ജോലി അലർട്ടുകൾ നേരിട്ട് WhatsApp-ൽ ലഭിക്കും. ബാഡ്ജ് ഓഫാണെങ്കിൽ ജോലി അലർട്ടുകൾ ലഭിക്കില്ല.",
          },
          applyForAJob: {
            question: "ഒരു ജോലിക്ക് ഞാൻ എങ്ങനെ അപേക്ഷിക്കും?",
            answer:
              "തൊഴിൽ അന്വേഷകർക്ക് AsliJobs വെബ്‌സൈറ്റ് വഴിയോ ജോലി അലർട്ടിന് മറുപടി നൽകിയോ അപേക്ഷ ഓപ്ഷൻ തിരഞ്ഞെടുത്തോ നേരിട്ട് WhatsApp വഴി അപേക്ഷിക്കാം.",
          },
          checkApplicationStatus: {
            question: "എന്റെ അപേക്ഷാ നില ഞാൻ എങ്ങനെ പരിശോധിക്കും?",
            answer:
              "അപേക്ഷിച്ചു, ഷോർട്ട്‌ലിസ്റ്റ്, അഭിമുഖം ഷെഡ്യൂൾ ചെയ്തു, തിരഞ്ഞെടുത്തു അല്ലെങ്കിൽ തിരഞ്ഞെടുത്തില്ല എന്നിവ പോലുള്ള അപേക്ഷാ അപ്‌ഡേറ്റുകൾ WhatsApp വഴി പങ്കിടും.",
          },
          updateMyProfile: {
            question: "എന്റെ പ്രൊഫൈൽ ഞാൻ എങ്ങനെ അപ്‌ഡേറ്റ് ചെയ്യും?",
            answer:
              "AsliJobs വെബ്‌സൈറ്റിലെ നിങ്ങളുടെ പ്രൊഫൈൽ വഴി പ്രൊഫൈൽ വിശദാംശങ്ങൾ അപ്‌ഡേറ്റ് ചെയ്യാം.",
          },
          changePreferredLanguage: {
            question: "എന്റെ ഇഷ്ടഭാഷ ഞാൻ എങ്ങനെ മാറ്റും?",
            answer:
              "അതെ. ഉപയോക്താക്കൾക്ക് AsliJobs വെബ്‌സൈറ്റ്, WhatsApp അല്ലെങ്കിൽ AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെട്ട് ഇഷ്ടഭാഷ മാറ്റാം.",
          },
        },
      },
      employerHelp: {
        title: "തൊഴിലുടമ സഹായം",
        description: "തൊഴിലാളികളെ നിയമിക്കുന്ന ബിസിനസുകൾക്ക്",
        cardTitle: "തൊഴിലുടമ സഹായം",
        cardDescription: "തൊഴിലാളികളെ നിയമിക്കുന്ന ബിസിനസുകൾക്ക്",
        articles: {
          registerAsEmployer: {
            question: "ഞാൻ തൊഴിലുടമയായി എങ്ങനെ രജിസ്റ്റർ ചെയ്യും?",
            answer:
              "തൊഴിലുടമയുടെ പേര്, കമ്പനി പേര്, ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ എന്നിവ നൽകി AsliJobs-ൽ തൊഴിലുടമയായി രജിസ്റ്റർ ചെയ്യാം. നിങ്ങളുടെ WhatsApp നമ്പർ OTP ഉപയോഗിച്ച് പരിശോധിക്കണം.",
          },
          postAJob: {
            question: "ഒരു ജോലി ഞാൻ എങ്ങനെ പോസ്റ്റ് ചെയ്യും?",
            answer:
              "ജോലി പോസ്റ്റ് ചെയ്യുന്നതിന് മുമ്പ് കമ്പനി പ്രൊഫൈൽ പൂർത്തിയാക്കണം. ജോലി ശീർഷകം, സ്ഥലം, ശമ്പളം, ജോലി സമയം, ഒഴിവുകളുടെ എണ്ണം, ആവശ്യമായ അനുഭവം, മറ്റ് പ്രധാന വിശദാംശങ്ങൾ എന്നിവ നൽകുക.",
          },
          jobPostRejected: {
            question: "എന്റെ ജോലി പോസ്റ്റ് എന്തുകൊണ്ട് നിരസിക്കപ്പെട്ടു?",
            answer:
              "അപൂർണ്ണമായ വിശദാംശങ്ങൾ, തെറ്റായ വിവരം, വ്യക്തമല്ലാത്ത ശമ്പളം, തെറ്റായ സ്ഥലം, തെറ്റിദ്ധരിപ്പിക്കുന്ന ഉള്ളടക്കം ഉണ്ടെങ്കിൽ, പ്ലാറ്റ്‌ഫോം മാർഗ്ഗനിർദ്ദേശങ്ങൾ ലംഘിച്ചാൽ, അല്ലെങ്കിൽ സബ്‌സ്‌ക്രിപ്ഷൻ അവസാനിച്ചാൽ ജോലി പോസ്റ്റ് നിരസിക്കപ്പെടാം.",
          },
          viewApplications: {
            question: "അപേക്ഷകൾ ഞാൻ എങ്ങനെ കാണും?",
            answer:
              "തൊഴിലുടമകൾക്ക് തങ്ങളുടെ ജോലി പോസ്റ്റുകൾക്ക് ലഭിച്ച അപേക്ഷകൾ തൊഴിലുടമ ഡാഷ്‌ബോർഡ് വഴിയോ AsliJobs ടീം പങ്കിട്ട അപ്‌ഡേറ്റുകൾ വഴിയോ കാണാനും ഷോർട്ട്‌ലിസ്റ്റ് ചെയ്യാനും കഴിയും.",
          },
          closeJobPost: {
            question: "ഒരു ജോലി പോസ്റ്റ് ഞാൻ എങ്ങനെ അടയ്ക്കും?",
            answer:
              "സ്ഥാനം നിറഞ്ഞാൽ, താൽക്കാലികമായി നിർത്തിയാൽ, റദ്ദാക്കിയാൽ അല്ലെങ്കിൽ ഇനി ലഭ്യമല്ലെങ്കിൽ ജോലി പോസ്റ്റ് അടയ്ക്കാം.",
          },
          employersContactSupport: {
            question: "തൊഴിലുടമകൾ സപ്പോർട്ടുമായി എങ്ങനെ ബന്ധപ്പെടും?",
            answer:
              "ജോലി പോസ്റ്റിങ്, അപേക്ഷകൾ, പേയ്‌മെന്റുകൾ അല്ലെങ്കിൽ നിയമന സഹായത്തിന് WhatsApp, ഇമെയിൽ അല്ലെങ്കിൽ ലഭ്യമായ സപ്പോർട്ട് ഓപ്ഷൻ വഴി തൊഴിലുടമകൾക്ക് AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടാം.",
          },
        },
      },
      whatsappHelp: {
        title: "WhatsApp സഹായം",
        description: "WhatsApp അടിസ്ഥാനത്തിലുള്ള അനുഭവം വിശദീകരിക്കുന്നു",
        cardTitle: "WhatsApp സഹായം",
        cardDescription: "WhatsApp അടിസ്ഥാനത്തിലുള്ള അനുഭവം വിശദീകരിക്കുന്നു",
        articles: {
          startOnWhatsapp: {
            question: "WhatsApp-ൽ AsliJobs ഞാൻ എങ്ങനെ തുടങ്ങും?",
            answer:
              "AsliJobs WhatsApp ലിങ്കിൽ ക്ലിക്ക് ചെയ്തോ QR കോഡ് സ്കാൻ ചെയ്തോ ഔദ്യോഗിക AsliJobs WhatsApp നമ്പറിലേക്ക് സന്ദേശം അയച്ചോ തുടങ്ങാം.",
          },
          receiveJobAlertsWhatsapp: {
            question: "എനിക്ക് ജോലി അലർട്ടുകൾ എങ്ങനെ ലഭിക്കും?",
            answer:
              "നിങ്ങളുടെ സ്ഥലം, ജോലി വിഭാഗം, അനുഭവം, പ്രൊഫൈൽ വിശദാംശങ്ങൾ എന്നിവയെ അടിസ്ഥാനമാക്കി WhatsApp-ൽ ജോലി അലർട്ടുകൾ ലഭിക്കും.",
          },
          replyToMessages: {
            question: "സന്ദേശങ്ങൾക്ക് ഞാൻ എങ്ങനെ മറുപടി നൽകണം?",
            answer:
              "അപേക്ഷിക്കുക, അതെ, ഇല്ല, സഹായം അല്ലെങ്കിൽ WhatsApp സന്ദേശത്തിൽ കാണുന്ന മറ്റ് ഓപ്ഷനുകൾ ഉപയോഗിച്ച് മറുപടി നൽകാം.",
          },
          applyThroughWhatsapp: {
            question: "WhatsApp വഴി ജോലികൾക്ക് അപേക്ഷിക്കാമോ?",
            answer:
              "അതെ. ജോലി അലർട്ടിന് മറുപടി നൽകിയോ അപേക്ഷ ഓപ്ഷൻ തിരഞ്ഞെടുത്തോ നേരിട്ട് WhatsApp വഴി ജോലികൾക്ക് അപേക്ഷിക്കാം.",
          },
          notReceivingWhatsappMessages: {
            question: "എനിക്ക് WhatsApp സന്ദേശങ്ങൾ എന്തുകൊണ്ട് ലഭിക്കുന്നില്ല?",
            answer:
              "നെറ്റ്‌വർക്ക് പ്രശ്നങ്ങൾ, തെറ്റായ നമ്പർ, ബ്ലോക്ക് ചെയ്ത നമ്പർ അല്ലെങ്കിൽ നിഷ്‌ക്രിയമായ WhatsApp കാരണം സന്ദേശങ്ങൾ ലഭിക്കാതിരിക്കാം.",
          },
          officialAslijobsNumber: {
            question: "ഔദ്യോഗിക AsliJobs നമ്പർ എനിക്ക് എങ്ങനെ അറിയാം?",
            answer:
              "ശരിയായ WhatsApp നമ്പറിനായി എപ്പോഴും ഔദ്യോഗിക AsliJobs വെബ്‌സൈറ്റ് പരിശോധിക്കുക.",
          },
        },
      },
      applicationsInterviews: {
        title: "അപേക്ഷകളും അഭിമുഖങ്ങളും",
        description: "നിയമന യാത്ര വ്യക്തമായി വിശദീകരിക്കുന്നു",
        cardTitle: "അപേക്ഷകളും അഭിമുഖങ്ങളും",
        cardDescription: "നിയമന യാത്ര വ്യക്തമായി വിശദീകരിക്കുന്നു",
        articles: {
          afterIApply: {
            question: "ഒരു ജോലിക്ക് അപേക്ഷിച്ച ശേഷം എന്ത് സംഭവിക്കും?",
            answer:
              "നിങ്ങൾ അപേക്ഷിച്ച ശേഷം നിങ്ങളുടെ അപേക്ഷ അവലോകനത്തിനായി തൊഴിലുടമയുമായി പങ്കിടും. തുടർന്നുള്ള അപ്‌ഡേറ്റുകൾ WhatsApp വഴി നിങ്ങൾക്ക് ലഭിക്കും.",
          },
          shortlistedMeans: {
            question: "ഷോർട്ട്‌ലിസ്റ്റ് എന്നാൽ എന്താണ്?",
            answer:
              "ഷോർട്ട്‌ലിസ്റ്റ് എന്നാൽ അഭിമുഖം അല്ലെങ്കിൽ തുടർന്നുള്ള ചർച്ച പോലുള്ള അടുത്ത ഘട്ടത്തിന് തൊഴിലുടമ നിങ്ങളുടെ പ്രൊഫൈൽ തിരഞ്ഞെടുത്തു എന്നാണ്.",
          },
          interviewUpdates: {
            question: "അഭിമുഖ അപ്‌ഡേറ്റുകൾ എനിക്ക് എങ്ങനെ ലഭിക്കും?",
            answer:
              "തീയതി, സമയം, സ്ഥലം, ബന്ധപ്പെടേണ്ട വ്യക്തിയുടെ വിവരങ്ങൾ എന്നിവ പോലുള്ള അഭിമുഖ അപ്‌ഡേറ്റുകൾ WhatsApp വഴി നിങ്ങളുമായി പങ്കിടും.",
          },
          interviewDocuments: {
            question: "അഭിമുഖത്തിന് ഞാൻ ഏതൊക്കെ രേഖകൾ കൊണ്ടുപോകണം?",
            answer:
              "തിരിച്ചറിയൽ രേഖ, അനുഭവ വിശദാംശങ്ങൾ, സർട്ടിഫിക്കറ്റുകൾ അല്ലെങ്കിൽ തൊഴിലുടമ ആവശ്യപ്പെടുന്ന ഏതെങ്കിലും രേഖകൾ കൊണ്ടുപോകേണ്ടി വന്നേക്കാം.",
          },
          selectedStatusMeans: {
            question: "തിരഞ്ഞെടുത്ത നില എന്നാൽ എന്താണ്?",
            answer:
              "തിരഞ്ഞെടുത്തു എന്നാൽ നിങ്ങളുടെ പ്രൊഫൈലോ അഭിമുഖ പ്രകടനമോ അവലോകനം ചെയ്ത ശേഷം തൊഴിലുടമ നിങ്ങളെ ജോലിക്ക് തിരഞ്ഞെടുത്തു എന്നാണ്.",
          },
          joiningConfirmation: {
            question: "ചേരൽ സ്ഥിരീകരണം എന്താണ്?",
            answer:
              "ചേരൽ സ്ഥിരീകരണം എന്നാൽ തൊഴിലുടമ നിങ്ങളുടെ ചേരൽ തീയതി, സമയം, സ്ഥലം, മറ്റ് ആവശ്യമായ വിശദാംശങ്ങൾ എന്നിവ സ്ഥിരീകരിച്ചു എന്നാണ്.",
          },
        },
      },
      profileVideoProfile: {
        title: "പ്രൊഫൈലും വീഡിയോ പ്രൊഫൈലും",
        description: "മെച്ചപ്പെട്ട പ്രൊഫൈലുകൾ ഉണ്ടാക്കാൻ ഉപയോക്താക്കളെ സഹായിക്കുന്നു",
        cardTitle: "പ്രൊഫൈലും വീഡിയോ പ്രൊഫൈലും",
        cardDescription: "മെച്ചപ്പെട്ട പ്രൊഫൈലുകൾ ഉണ്ടാക്കാൻ ഉപയോക്താക്കളെ സഹായിക്കുന്നു",
        articles: {
          profileDetailsIncluded: {
            question: "തൊഴിൽ അന്വേഷക പ്രൊഫൈലിൽ ഏതൊക്കെ വിശദാംശങ്ങൾ ഉൾപ്പെടുന്നു?",
            answer:
              "തൊഴിൽ അന്വേഷക പ്രൊഫൈലിൽ പേര്, മൊബൈൽ നമ്പർ, ഇഷ്ട ജോലി വിഭാഗം, കഴിവുകൾ, ജോലി അനുഭവം, ഇഷ്ട സ്ഥലം, പ്രതീക്ഷിക്കുന്ന ശമ്പളം, ലഭ്യത, ഇഷ്ടഭാഷ എന്നിവ ഉൾപ്പെടുന്നു.",
          },
          jobSeekersUpdateProfile: {
            question: "തൊഴിൽ അന്വേഷകർക്ക് പ്രൊഫൈൽ എങ്ങനെ അപ്‌ഡേറ്റ് ചെയ്യാം?",
            answer:
              "തൊഴിൽ അന്വേഷകർക്ക് AsliJobs വെബ്‌സൈറ്റിലെ തങ്ങളുടെ പ്രൊഫൈൽ വഴി പ്രൊഫൈൽ വിശദാംശങ്ങൾ അപ്‌ഡേറ്റ് ചെയ്യാം.",
          },
          jobSearchStatusBadge: {
            question: "ജോബ് സെർച്ച് സ്റ്റാറ്റസ് ബാഡ്ജ് എന്താണ്?",
            answer:
              "ഈ ബാഡ്ജ് നിങ്ങൾ സജീവമായി ജോലി തിരയുകയാണെന്ന് സൂചിപ്പിക്കുന്നു. ജോലി അലർട്ടുകൾ ലഭിക്കാൻ AsliJobs പ്രൊഫൈലിൽ ഈ ബാഡ്ജ് ഓണാക്കണം. ബാഡ്ജ് ഓഫാണെങ്കിൽ ജോലി അലർട്ടുകൾ ലഭിക്കില്ല.",
          },
          introductionVideoMeaning: {
            question: "പരിചയ വീഡിയോ എന്താണ്?",
            answer:
              "പരിചയ വീഡിയോ എന്നത് തൊഴിൽ അന്വേഷകൻ സ്വയം പരിചയപ്പെടുത്തി കഴിവുകൾ, ജോലി അനുഭവം, ഇഷ്ട ജോലി റോൾ, ലഭ്യത എന്നിവ വിശദീകരിക്കുന്ന ചെറിയ വീഡിയോയാണ്.",
          },
          createIntroductionVideo: {
            question: "തൊഴിൽ അന്വേഷകർക്ക് പരിചയ വീഡിയോ എങ്ങനെ ഉണ്ടാക്കാം?",
            answer:
              "തൊഴിൽ അന്വേഷകർക്ക് സ്വയം പരിചയപ്പെടുത്തുന്ന ചെറുതും വ്യക്തവുമായ വീഡിയോ റെക്കോർഡ് ചെയ്ത് AsliJobs നൽകുന്ന ഓപ്ഷൻ വഴി അപ്‌ലോഡ് ചെയ്യാനോ പങ്കിടാനോ കഴിയും.",
          },
          includeInIntroductionVideo: {
            question: "പരിചയ വീഡിയോയിൽ തൊഴിൽ അന്വേഷകർ എന്തൊക്കെ ഉൾപ്പെടുത്തണം?",
            answer:
              "തൊഴിൽ അന്വേഷകർ പേര്, കഴിവുകൾ, ജോലി അനുഭവം, ഇഷ്ട ജോലി വിഭാഗം, ഇഷ്ട ജോലി സ്ഥലം, ലഭ്യത, ബന്ധപ്പെട്ട യോഗ്യതകൾ അല്ലെങ്കിൽ സർട്ടിഫിക്കേഷനുകൾ എന്നിവ പറയണം.",
          },
        },
      },
      languageSupport: {
        title: "ഭാഷാ പിന്തുണ",
        description: "പ്രാദേശിക ഭാഷാ ലഭ്യതയ്ക്ക്",
        cardTitle: "ഭാഷാ പിന്തുണ",
        cardDescription: "പ്രാദേശിക ഭാഷാ ലഭ്യതയ്ക്ക്",
        articles: {
          supportedLanguages: {
            question: "AsliJobs ഏതൊക്കെ ഭാഷകളെ പിന്തുണയ്ക്കുന്നു?",
            answer:
              "AsliJobs ഇംഗ്ലീഷ്, ഹിന്ദി, തെലുഗ്, തമിഴ്, കന്നഡ, മലയാളം എന്നീ ഭാഷകളെ പിന്തുണയ്ക്കുന്നു.",
          },
          changeMyLanguage: {
            question: "എന്റെ ഭാഷ ഞാൻ എങ്ങനെ മാറ്റും?",
            answer:
              "അതെ. ഉപയോക്താക്കൾക്ക് AsliJobs വെബ്‌സൈറ്റ്, WhatsApp അല്ലെങ്കിൽ AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെട്ട് ഇഷ്ടഭാഷ മാറ്റാം.",
          },
          alertsInLocalLanguage: {
            question: "എന്റെ പ്രാദേശിക ഭാഷയിൽ ജോലി അലർട്ടുകൾ ലഭിക്കുമോ?",
            answer:
              "അതെ. ലഭ്യമായിടത്ത് AsliJobs നിങ്ങളുടെ ഇഷ്ടഭാഷയിൽ ജോലി അലർട്ടുകളും പ്രധാന അപ്‌ഡേറ്റുകളും അയയ്ക്കും.",
          },
        },
      },
      safetyReporting: {
        title: "സുരക്ഷയും റിപ്പോർട്ടിങും",
        description: "ഉപയോക്തൃ വിശ്വാസവും സംരക്ഷണ പാളിയും",
        cardTitle: "സുരക്ഷയും റിപ്പോർട്ടിങും",
        cardDescription: "ഉപയോക്തൃ വിശ്വാസവും സംരക്ഷണ പാളിയും",
        articles: {
          identifyFakeJob: {
            question: "വ്യാജ ജോലി ഞാൻ എങ്ങനെ തിരിച്ചറിയും?",
            answer:
              "വ്യക്തമല്ലാത്ത കമ്പനി വിവരങ്ങൾ, വ്യാജ ശമ്പള വാഗ്ദാനങ്ങൾ, തെറ്റായ സ്ഥലം, പണം ആവശ്യപ്പെടൽ അല്ലെങ്കിൽ സംശയാസ്പദമായ അഭിമുഖ നിർദ്ദേശങ്ങൾ ഉള്ള ജോലികളിൽ ശ്രദ്ധിക്കുക.",
          },
          payMoneyForJob: {
            question: "ജോലി ലഭിക്കാൻ ഞാൻ പണം നൽകണോ?",
            answer:
              "ഇല്ല. ജോലി സ്ഥിരീകരണത്തിന് തൊഴിൽ അന്വേഷകർ പണം നൽകരുത്. ആരെങ്കിലും പണം ആവശ്യപ്പെട്ടാൽ ഉടൻ AsliJobs-ന് റിപ്പോർട്ട് ചെയ്യുക.",
          },
          reportFakeJob: {
            question: "വ്യാജ ജോലി ഞാൻ എങ്ങനെ റിപ്പോർട്ട് ചെയ്യും?",
            answer:
              "WhatsApp അല്ലെങ്കിൽ ലഭ്യമായ സപ്പോർട്ട് ഓപ്ഷൻ വഴി AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെട്ട് വ്യാജമോ സംശയാസ്പദമോ ആയ ജോലി റിപ്പോർട്ട് ചെയ്യാം.",
          },
          reportEmployerMisconduct: {
            question: "തൊഴിലുടമ ദുരാചാരം ഞാൻ എങ്ങനെ റിപ്പോർട്ട് ചെയ്യും?",
            answer:
              "തൊഴിലുടമയുടെ പേര്, ജോലി ശീർഷകം, പ്രശ്ന വിശദാംശങ്ങൾ, സ്ക്രീൻഷോട്ടുകൾ എന്നിവ AsliJobs സപ്പോർട്ടുമായി പങ്കിട്ട് തൊഴിലുടമ ദുരാചാരം റിപ്പോർട്ട് ചെയ്യാം.",
          },
          abusiveMessages: {
            question: "ദുരുപയോഗ സന്ദേശങ്ങൾ ലഭിച്ചാൽ ഞാൻ എന്ത് ചെയ്യണം?",
            answer:
              "കൂടുതൽ മറുപടി നൽകരുത്. സ്ക്രീൻഷോട്ട് എടുത്ത് സന്ദേശം ഉടൻ AsliJobs സപ്പോർട്ടിന് റിപ്പോർട്ട് ചെയ്യുക.",
          },
          informationNotToShare: {
            question: "ഏതൊക്കെ വിവരങ്ങൾ ഞാൻ പങ്കിടരുത്?",
            answer:
              "അറിയില്ലാത്ത വ്യക്തികളുമായി OTP, ബാങ്ക് വിവരങ്ങൾ, പാസ്‌വേഡുകൾ, UPI PIN, വ്യക്തിഗത രേഖകൾ അല്ലെങ്കിൽ സെൻസിറ്റീവ് വിവരങ്ങൾ പങ്കിടരുത്.",
          },
          interviewSafetyTips: {
            question: "അഭിമുഖങ്ങൾക്ക് ഞാൻ ഏതൊക്കെ സുരക്ഷാ നിർദ്ദേശങ്ങൾ പാലിക്കണം?",
            answer:
              "പോകുന്നതിന് മുമ്പ് കമ്പനി പേര്, അഭിമുഖ സ്ഥലം, ബന്ധപ്പെടേണ്ട വ്യക്തി, ജോലി വിശദാംശങ്ങൾ എന്നിവ പരിശോധിക്കുക. വേണമെങ്കിൽ കുടുംബാംഗത്തെയോ സുഹൃത്തിനെയോ അറിയിക്കുക.",
          },
          platformSafetyChecks: {
            question: "AsliJobs പ്ലാറ്റ്‌ഫോം എങ്ങനെ സുരക്ഷിതമായി നിലനിർത്തുന്നു?",
            answer:
              "സുരക്ഷിതമായ നിയമന അനുഭവം നിലനിർത്താൻ AsliJobs തൊഴിലുടമകൾ, പരാതികൾ, സംശയാസ്പദമായ പ്രവർത്തനം എന്നിവ അവലോകനം ചെയ്തേക്കാം.",
          },
        },
      },
      paymentsPlansPromotions: {
        title: "പേയ്‌മെന്റുകൾ, പ്ലാനുകൾ, പ്രമോഷനുകൾ",
        description: "പ്രധാനമായും തൊഴിലുടമകൾക്ക്",
        cardTitle: "പേയ്‌മെന്റുകളും പ്രമോഷനുകളും",
        cardDescription: "പ്രധാനമായും തൊഴിലുടമകൾക്ക്",
        articles: {
          freeAndPaidServices: {
            question: "ഏതൊക്കെ സേവനങ്ങൾ സൗജന്യവും പണമടച്ചുള്ളതുമാണ്?",
            answer:
              "തൊഴിൽ അന്വേഷകർക്ക് ജോലികൾ തിരയാനും അപേക്ഷിക്കാനും AsliJobs സൗജന്യമാണ്. തൊഴിലുടമ സേവനങ്ങൾ, നിയമന പ്ലാനുകൾ, പ്രമോഷനുകൾ എന്നിവ പണമടച്ചുള്ളതാകാം.",
          },
          employerPlans: {
            question: "തൊഴിലുടമ പ്ലാനുകൾ എന്താണ്?",
            answer:
              "തൊഴിലുടമ പ്ലാനുകൾ ബിസിനസുകൾക്ക് ജോലികൾ പോസ്റ്റ് ചെയ്യാനും അപേക്ഷകൾ ലഭിക്കാനും ഒഴിവുകൾ പ്രമോട്ട് ചെയ്യാനും നിയമനം മെച്ചപ്പെട്ട് നിയന്ത്രിക്കാനും സഹായിക്കുന്ന പണമടച്ചുള്ള ഓപ്ഷനുകളാണ്.",
          },
          promotedJobs: {
            question: "പ്രമോട്ട് ചെയ്ത ജോലികൾ എന്താണ്?",
            answer:
              "പ്രമോട്ട് ചെയ്ത ജോലികൾ അധിക ദൃശ്യത നൽകിയ ജോലി പോസ്റ്റുകളാണ്. അതിനാൽ കൂടുതൽ അനുയോജ്യരായ തൊഴിൽ അന്വേഷകർക്ക് അവ കാണാനും അപേക്ഷിക്കാനും കഴിയും.",
          },
          campaignPromotions: {
            question: "ക്യാമ്പെയ്ൻ പ്രമോഷനുകൾ എന്താണ്?",
            answer:
              "സ്ഥലം, ജോലി വിഭാഗം, ഭാഷ എന്നിവയെ അടിസ്ഥാനമാക്കിയ ലക്ഷ്യമിട്ട ജോലി അലർട്ടുകൾ വഴി തൊഴിലുടമകൾക്ക് തൊഴിൽ അന്വേഷകരെ എത്താൻ ക്യാമ്പെയ്ൻ പ്രമോഷനുകൾ സഹായിക്കുന്നു.",
          },
          paymentSupport: {
            question: "പേയ്‌മെന്റ് പിന്തുണ എനിക്ക് എങ്ങനെ ലഭിക്കും?",
            answer:
              "പേയ്‌മെന്റുകൾ, പ്ലാൻ ആക്ടിവേഷൻ, പരാജയപ്പെട്ട ഇടപാടുകൾ അല്ലെങ്കിൽ ബില്ലിങ് പ്രശ്നങ്ങൾക്ക് സഹായത്തിന് തൊഴിലുടമകൾക്ക് AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടാം.",
          },
          getAnInvoice: {
            question: "ഇൻവോയ്സ് എനിക്ക് എങ്ങനെ ലഭിക്കും?",
            answer:
              "പേയ്‌മെന്റ് പൂർത്തിയാക്കിയ ശേഷം തൊഴിലുടമകൾക്ക് AsliJobs സപ്പോർട്ട് വഴി ഇൻവോയ്സ് അഭ്യർത്ഥിക്കാം.",
          },
        },
      },
      accountDataHelp: {
        title: "അക്കൗണ്ടും ഡാറ്റാ സഹായവും",
        description: "പ്രൊഫൈൽ, സ്വകാര്യത, ഡാറ്റാ നിയന്ത്രണം",
        cardTitle: "അക്കൗണ്ടും ഡാറ്റയും",
        cardDescription: "പ്രൊഫൈൽ, സ്വകാര്യത, ഡാറ്റാ നിയന്ത്രണം",
        articles: {
          updateAccountDetails: {
            question: "എന്റെ അക്കൗണ്ട് വിശദാംശങ്ങൾ ഞാൻ എങ്ങനെ അപ്‌ഡേറ്റ് ചെയ്യും?",
            answer:
              "തൊഴിൽ അന്വേഷകർക്ക് AsliJobs വെബ്‌സൈറ്റിലെ പ്രൊഫൈൽ വഴി വിശദാംശങ്ങൾ അപ്‌ഡേറ്റ് ചെയ്യാം, തൊഴിലുടമകൾക്ക് തൊഴിലുടമ ഡാഷ്‌ബോർഡ് വഴി വിശദാംശങ്ങൾ അപ്‌ഡേറ്റ് ചെയ്യാം. WhatsApp അല്ലെങ്കിൽ ലഭ്യമായ സപ്പോർട്ട് ഓപ്ഷനുകൾ വഴി AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടാനും കഴിയും.",
          },
          changeMobileNumber: {
            question: "എന്റെ മൊബൈൽ നമ്പർ ഞാൻ എങ്ങനെ മാറ്റും?",
            answer:
              "തൊഴിൽ അന്വേഷകർക്ക് AsliJobs വെബ്‌സൈറ്റിലെ പ്രൊഫൈൽ വഴി മൊബൈൽ നമ്പർ അപ്‌ഡേറ്റ് ചെയ്യാം, തൊഴിലുടമകൾക്ക് തൊഴിലുടമ ഡാഷ്‌ബോർഡ് വഴി അപ്‌ഡേറ്റ് ചെയ്യാം. AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെട്ട് ആവശ്യമായ പരിശോധനാ വിശദാംശങ്ങൾ നൽകാനും കഴിയും.",
          },
          deactivateAccount: {
            question: "ഉപയോക്താക്കൾക്ക് അക്കൗണ്ട് എങ്ങനെ നിർജീവമാക്കാം?",
            answer:
              "തൊഴിൽ അന്വേഷകർക്ക് AsliJobs വെബ്‌സൈറ്റിലെ പ്രൊഫൈൽ ക്രമീകരണങ്ങൾ വഴി അക്കൗണ്ട് നിർജീവമാക്കാം, തൊഴിലുടമകൾക്ക് തൊഴിലുടമ ഡാഷ്‌ബോർഡ് വഴി അക്കൗണ്ട് നിർജീവമാക്കാം. അക്കൗണ്ട് നിർജീവമാക്കുന്നതിന് ഉപയോക്താക്കൾക്ക് AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടാനും കഴിയും.",
          },
          howDataIsUsed: {
            question: "AsliJobs എന്റെ ഡാറ്റ എങ്ങനെ ഉപയോഗിക്കുന്നു?",
            answer:
              "ജോലി അലർട്ടുകൾ നൽകാനും അപേക്ഷകൾ നിയന്ത്രിക്കാനും നിയമനത്തെ പിന്തുണയ്ക്കാനും സേവനങ്ങൾ മെച്ചപ്പെടുത്താനും നിങ്ങളുമായി ആശയവിനിമയം നടത്താനും AsliJobs നിങ്ങളുടെ ഡാറ്റ ഉപയോഗിക്കുന്നു.",
          },
          whoCanSeeProfile: {
            question: "എന്റെ പ്രൊഫൈൽ ആർക്കൊക്കെ കാണാം?",
            answer:
              "ജോലി തിരയൽ, അപേക്ഷ, നിയമന ആവശ്യങ്ങൾക്കായി നിങ്ങളുടെ പ്രൊഫൈൽ AsliJobs അഡ്‌മിനുകൾക്കും ബന്ധപ്പെട്ട തൊഴിലുടമകൾക്കും കാണാം.",
          },
          removeJobVideo: {
            question: "ഒരു ജോലി വീഡിയോ ഞാൻ എങ്ങനെ നീക്കംചെയ്യും?",
            answer:
              "തൊഴിൽ അന്വേഷകർക്ക് AsliJobs വെബ്‌സൈറ്റിലെ പ്രൊഫൈൽ വഴിയോ AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെട്ടോ പഴയ പരിചയ വീഡിയോ നീക്കംചെയ്ത് പുതിയത് അപ്‌ലോഡ് ചെയ്യാം.",
          },
          privacySupport: {
            question: "സ്വകാര്യതാ പിന്തുണ എനിക്ക് എങ്ങനെ ലഭിക്കും?",
            answer:
              "സ്വകാര്യതയുമായി ബന്ധപ്പെട്ട ചോദ്യങ്ങൾ, ഡാറ്റാ അപ്‌ഡേറ്റുകൾ, ഇല്ലാതാക്കൽ അഭ്യർത്ഥനകൾ അല്ലെങ്കിൽ അക്കൗണ്ട് ആശങ്കകൾക്ക് നിങ്ങൾക്ക് AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടാം.",
          },
        },
      },
      contactSupport: {
        title: "സപ്പോർട്ടുമായി ബന്ധപ്പെടുക",
        description: "അവസാന സഹായവും പരാതി പാളിയും",
        cardTitle: "സപ്പോർട്ടുമായി ബന്ധപ്പെടുക",
        cardDescription: "അവസാന സഹായവും പരാതി പാളിയും",
        articles: {
          contactAslijobsSupport: {
            question: "AsliJobs സപ്പോർട്ടുമായി ഞാൻ എങ്ങനെ ബന്ധപ്പെടും?",
            answer:
              "WhatsApp, ഫോൺ അല്ലെങ്കിൽ ഇമെയിൽ വഴി നിങ്ങൾക്ക് AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടാം.",
          },
          raiseAComplaint: {
            question: "ഒരു പരാതി ഞാൻ എങ്ങനെ നൽകും?",
            answer:
              "WhatsApp, ഫോൺ അല്ലെങ്കിൽ ഇമെയിൽ വഴി AsliJobs സപ്പോർട്ടുമായി നിങ്ങളുടെ പ്രശ്നം പങ്കിട്ട് പരാതി നൽകാം.",
          },
          complaintDetails: {
            question: "പരാതിക്ക് ഞാൻ ഏതൊക്കെ വിശദാംശങ്ങൾ നൽകണം?",
            answer:
              "തൊഴിൽ അന്വേഷകർ പേര്, മൊബൈൽ നമ്പർ, ജോലി ശീർഷകം, തൊഴിലുടമയുടെ പേര്, പ്രശ്ന വിശദാംശങ്ങൾ, ലഭ്യമെങ്കിൽ സ്ക്രീൻഷോട്ടുകൾ എന്നിവ പങ്കിടണം. തൊഴിലുടമകൾ പേര്, കമ്പനി പേര്, മൊബൈൽ നമ്പർ, ജോലി ശീർഷകം അല്ലെങ്കിൽ ജോബ് ഐഡി, ഉദ്യോഗാർത്ഥി വിശദാംശങ്ങൾ, പ്രശ്ന വിശദാംശങ്ങൾ, ലഭ്യമെങ്കിൽ ബന്ധപ്പെട്ട സ്ക്രീൻഷോട്ടുകൾ എന്നിവ പങ്കിടണം.",
          },
          reopenAComplaint: {
            question: "ഒരു പരാതി ഞാൻ എങ്ങനെ വീണ്ടും തുറക്കും?",
            answer:
              "പ്രശ്നം പരിഹരിച്ചില്ലെങ്കിൽ അല്ലെങ്കിൽ കൂടുതൽ പിന്തുണ വേണമെങ്കിൽ പരാതി വീണ്ടും തുറക്കാൻ അഭ്യർത്ഥിക്കാം.",
          },
          supportResponseTime: {
            question: "സപ്പോർട്ട് മറുപടി നൽകാൻ എത്ര സമയമെടുക്കും?",
            answer:
              "AsliJobs കഴിയുന്നത്ര വേഗം മറുപടി നൽകാൻ ശ്രമിക്കും. മറുപടി സമയം പ്രശ്നത്തെയും സപ്പോർട്ട് ലഭ്യതയെയും ആശ്രയിച്ച് മാറാം.",
          },
          contactSupportWhatsapp: {
            question: "WhatsApp വഴി സപ്പോർട്ടുമായി ബന്ധപ്പെടാമോ?",
            answer:
              "അതെ. ഔദ്യോഗിക WhatsApp നമ്പർ വഴി നിങ്ങൾക്ക് AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടാം.",
          },
          contactSupportEmail: {
            question: "ഇമെയിൽ വഴി സപ്പോർട്ടുമായി ബന്ധപ്പെടാമോ?",
            answer:
              "അതെ. ഔദ്യോഗിക സപ്പോർട്ട് ഇമെയിൽ വിലാസം വഴി നിങ്ങൾക്ക് AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടാം.",
          },
        },
      },
    },
  },
};

export const helpCenterBundle = { en, hi, te, ta, kn, ml } as const;
