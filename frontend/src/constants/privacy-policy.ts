import type { LegalDocumentMeta, LegalSection } from "@/types/legal";

export const PRIVACY_POLICY_META: LegalDocumentMeta = {
  title: "Privacy Policy",
  effectiveDate: "[●]",
  lastUpdated: "[●]",
};

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    id: "overview",
    navLabel: "Overview",
    title: null,
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how AsliJobs collects, uses, stores, shares, protects, and processes personal data when you use our website, WhatsApp-based job services, employer dashboard, admin-supported services, job alerts, video profile features, support channels, promotional services, and any other services offered by AsliJobs.",
      },
      {
        type: "paragraph",
        text: "By using AsliJobs, communicating with us on WhatsApp, registering as a job seeker, posting a job as an employer, submitting information, uploading a video profile, applying for a job, or using any of our services, you agree to the practices described in this Privacy Policy. If you do not agree with this Privacy Policy, you should not use AsliJobs or share your personal information with us.",
      },
    ],
  },
  {
    id: "about-aslijobs",
    navLabel: "About AsliJobs",
    title: "About AsliJobs",
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs is a WhatsApp-based job portal designed to connect India’s blue-collar and entry-level workforce with employers. We help job seekers discover nearby job opportunities, apply for jobs, receive interview updates, communicate in preferred languages, and connect with employers through simple and familiar digital channels such as WhatsApp.",
      },
      {
        type: "paragraph",
        text: "We also help employers post job openings, receive candidate applications, shortlist candidates, schedule interviews, manage hiring communication, run hiring campaigns, and track recruitment activity.",
      },
      {
        type: "paragraph",
        text: "For the purpose of this Privacy Policy, “AsliJobs,” “we,” “us,” or “our” refers to [Legal Entity Name], operating the AsliJobs platform.",
      },
    ],
  },
  {
    id: "scope",
    navLabel: "Scope",
    title: "Scope of this Privacy Policy",
    blocks: [
      {
        type: "paragraph",
        text: "This Privacy Policy applies to all users of AsliJobs, including job seekers, employers, recruiters, business representatives, visitors, support users, and any person who interacts with AsliJobs through WhatsApp, website, dashboard, social media, forms, campaigns, or other supported channels.",
      },
      {
        type: "paragraph",
        text: "This Privacy Policy covers personal data collected through:",
      },
      {
        type: "list",
        items: [
          "AsliJobs website",
          "WhatsApp communication",
          "Job seeker registration",
          "Employer registration",
          "Job applications",
          "Candidate profiles",
          "Video profiles",
          "Transcripts and translations",
          "Employer dashboard",
          "Admin dashboard",
          "Support tickets",
          "Promotional campaigns",
          "Analytics and reporting tools",
          "Payment or subscription-related services",
          "Third-party tools used to operate the platform",
        ],
      },
    ],
  },
  {
    id: "personal-information",
    navLabel: "Personal Information",
    title: "Personal Information We Collect",
    blocks: [
      {
        type: "paragraph",
        text: "We collect information that is required to provide job search, hiring, communication, verification, support, analytics, and platform services.",
      },
    ],
  },
  {
    id: "job-seeker-information",
    navLabel: "Job Seeker Information",
    title: "Information Collected from Job Seekers",
    blocks: [
      {
        type: "paragraph",
        text: "When you register or use AsliJobs as a job seeker, we may collect:",
      },
      {
        type: "list",
        items: [
          "Full name",
          "Mobile number",
          "WhatsApp number",
          "Email address, if provided",
          "Gender, if required for job matching or employer preference",
          "Age or date of birth, if required for eligibility verification",
          "City, area, locality, pincode, district, and state",
          "Preferred language",
          "Job category preference",
          "Skills",
          "Education level",
          "Work experience",
          "Previous job details",
          "Expected salary",
          "Availability",
          "Preferred shift",
          "Preferred work location",
          "Application history",
          "Interview status",
          "Joining status",
          "Feedback and ratings",
          "Support requests",
          "Documents submitted by you, if any",
          "Video profile, if uploaded",
          "Transcript of video profile",
          "Translated transcript or summary",
          "Communication history with AsliJobs",
        ],
      },
      {
        type: "paragraph",
        text: "We may also collect any other information you voluntarily share with us through WhatsApp, forms, calls, support chats, or other communication channels.",
      },
    ],
  },
  {
    id: "employer-information",
    navLabel: "Employer Information",
    title: "Information Collected from Employers",
    blocks: [
      {
        type: "paragraph",
        text: "When you register or use AsliJobs as an employer, recruiter, business owner, or company representative, we may collect:",
      },
      {
        type: "list",
        items: [
          "Company name",
          "Business name",
          "Contact person name",
          "Mobile number",
          "WhatsApp number",
          "Email address",
          "Business address",
          "City, area, locality, pincode, district, and state",
          "Industry type",
          "Company size",
          "Hiring requirements",
          "Job posting details",
          "Salary details",
          "Work location",
          "Interview location",
          "Employer verification documents, if required",
          "GST details, if applicable",
          "Payment and subscription details",
          "Job posting history",
          "Candidate shortlisting history",
          "Employer response rate",
          "Hiring performance data",
          "Support queries",
          "Communication history with AsliJobs",
        ],
      },
      {
        type: "paragraph",
        text: "We may also collect information required to verify employer identity, business authenticity, and job posting genuineness.",
      },
    ],
  },
  {
    id: "job-posting-application",
    navLabel: "Job Posting & Applications",
    title: "Job Posting and Application Information",
    blocks: [
      {
        type: "paragraph",
        text: "When jobs are posted or applications are submitted, we may collect and process:",
      },
      {
        type: "list",
        items: [
          "Job title",
          "Job category",
          "Job description",
          "Salary range",
          "Work timing",
          "Shift details",
          "Benefits",
          "Openings",
          "Experience requirement",
          "Language requirement",
          "Location and locality",
          "Employer details",
          "Application status",
          "Candidate shortlist status",
          "Interview schedule",
          "Selection status",
          "Joining status",
          "Candidate feedback",
          "Employer feedback",
        ],
      },
      {
        type: "paragraph",
        text: "This information helps us connect job seekers with relevant employers and track the hiring journey.",
      },
    ],
  },
  {
    id: "whatsapp-communication",
    navLabel: "WhatsApp Communication",
    title: "WhatsApp Communication Data",
    blocks: [
      {
        type: "paragraph",
        text: "Since AsliJobs is a WhatsApp-first platform, we may collect and process communication data related to your interaction with us on WhatsApp. This may include:",
      },
      {
        type: "list",
        items: [
          "Your WhatsApp number",
          "Messages sent by you",
          "Messages sent by AsliJobs",
          "Job alert responses",
          "Application confirmations",
          "Interview confirmations",
          "Support messages",
          "Language selection",
          "Menu selections",
          "Template message responses",
          "Delivery status",
          "Read status, where available",
          "Reply status",
          "Opt-in and opt-out preferences",
        ],
      },
      {
        type: "paragraph",
        text: "We use WhatsApp to send job alerts, application updates, interview reminders, employer responses, support replies, feedback requests, promotional messages where permitted, and service-related communication.",
      },
      {
        type: "paragraph",
        text: "Your use of WhatsApp is also subject to WhatsApp’s own terms, privacy policy, and platform rules.",
      },
    ],
  },
  {
    id: "video-profiles",
    navLabel: "Video Profiles",
    title: "Video Profiles and Transcripts",
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs may allow job seekers to upload short video profiles to introduce themselves, explain their experience, demonstrate skills, or improve their chances of getting shortlisted.",
      },
      {
        type: "paragraph",
        text: "When you upload a video profile, we may collect:",
      },
      {
        type: "list",
        items: [
          "Video file",
          "Audio from the video",
          "Image or thumbnail from the video",
          "Spoken language",
          "Transcript generated from the video",
          "Translated transcript",
          "Summary of the video",
          "Skills or keywords identified from the video",
          "Admin review status",
          "Employer view status",
        ],
      },
      {
        type: "paragraph",
        text: "We may use AI-based tools or third-party service providers to generate transcripts, translations, summaries, or searchable text from video profiles.",
      },
      {
        type: "paragraph",
        text: "Transcripts and translations may not always be fully accurate due to accent, background noise, language differences, audio quality, or technical limitations. You may request correction where such support is available.",
      },
      {
        type: "paragraph",
        text: "Video profiles and transcripts may be shared with relevant employers, recruiters, and authorized platform users for hiring-related purposes.",
      },
    ],
  },
  {
    id: "regional-language",
    navLabel: "Regional Language",
    title: "Regional Language Information",
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs supports regional language communication to make the platform accessible for users across India. We may collect your preferred language and use it to:",
      },
      {
        type: "list",
        items: [
          "Send job alerts in your preferred language",
          "Provide onboarding support",
          "Send interview reminders",
          "Share application updates",
          "Respond to support queries",
          "Generate translated transcripts",
          "Create language-wise reports",
          "Improve user experience",
          "Assign language-specific support agents",
        ],
      },
      {
        type: "paragraph",
        text: "Supported languages may include English, Hindi, Telugu, Tamil, Marathi, Bengali, Kannada, Malayalam, Gujarati, Punjabi, Odia, and other Indian languages as introduced from time to time.",
      },
    ],
  },
  {
    id: "location-data",
    navLabel: "Location Data",
    title: "Location and Locality Data",
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs may collect your location details such as city, area, locality, district, state, and pincode. We use this information to:",
      },
      {
        type: "list",
        items: [
          "Show nearby jobs",
          "Match candidates with local employers",
          "Filter job seekers area-wise or locality-wise",
          "Help employers find nearby candidates",
          "Send locality-specific job alerts",
          "Run area-based hiring campaigns",
          "Generate city-wise and locality-wise analytics",
          "Improve job matching and operational planning",
        ],
      },
      {
        type: "paragraph",
        text: "We may not always collect precise GPS location unless specifically required and consented to. Most location-based services may rely on the information you provide manually, such as city, area, locality, or pincode.",
      },
    ],
  },
  {
    id: "device-usage",
    navLabel: "Device & Usage",
    title: "Device, Technical, and Usage Information",
    blocks: [
      {
        type: "paragraph",
        text: "When you visit our website, dashboard, or digital services, we may collect technical information such as:",
      },
      {
        type: "list",
        items: [
          "IP address",
          "Browser type",
          "Device type",
          "Operating system",
          "Pages visited",
          "Time spent on pages",
          "Referring links",
          "Login activity",
          "Session activity",
          "Error logs",
          "Cookies and similar identifiers",
          "Usage patterns",
          "Dashboard activity",
          "Campaign interaction data",
        ],
      },
      {
        type: "paragraph",
        text: "This helps us improve platform performance, prevent misuse, monitor security, understand user behaviour, and improve the overall experience.",
      },
    ],
  },
  {
    id: "payment-billing",
    navLabel: "Payment & Billing",
    title: "Payment and Billing Information",
    blocks: [
      {
        type: "paragraph",
        text: "If you purchase employer plans, subscriptions, promotions, job posting services, hiring campaigns, or other paid services, we may collect:",
      },
      {
        type: "list",
        items: [
          "Name",
          "Company name",
          "Contact details",
          "Billing address",
          "GST details, if applicable",
          "Plan details",
          "Payment status",
          "Invoice details",
          "Transaction reference",
          "Subscription validity",
          "Renewal status",
        ],
      },
      {
        type: "paragraph",
        text: "Payment processing may be handled by third-party payment gateways. AsliJobs does not store full card numbers, UPI PINs, bank passwords, or other sensitive payment credentials unless legally permitted and technically required through compliant systems.",
      },
    ],
  },
  {
    id: "how-we-collect",
    navLabel: "How We Collect",
    title: "How We Collect Information",
    blocks: [
      {
        type: "paragraph",
        text: "We may collect information directly from you when you:",
      },
      {
        type: "list",
        items: [
          "Start a WhatsApp chat with AsliJobs",
          "Register as a job seeker",
          "Register as an employer",
          "Submit a job application",
          "Post a job",
          "Upload a video profile",
          "Share documents",
          "Contact support",
          "Respond to job alerts",
          "Confirm interviews",
          "Submit feedback",
          "Purchase a paid service",
          "Use our website or dashboard",
          "Participate in campaigns or promotions",
        ],
      },
      {
        type: "paragraph",
        text: "We may also collect information from employers, recruiters, service providers, analytics tools, WhatsApp communication systems, payment providers, verification partners, support tools, and other platform integrations.",
      },
    ],
  },
  {
    id: "how-we-use",
    navLabel: "How We Use",
    title: "How We Use Your Information",
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs uses personal information to provide, operate, improve, secure, and promote its services. We may use your information to:",
      },
      {
        type: "list",
        items: [
          "Create and manage your profile",
          "Send job alerts",
          "Match job seekers with relevant jobs",
          "Share applications with employers",
          "Help employers shortlist candidates",
          "Schedule interviews",
          "Send interview reminders",
          "Track hiring progress",
          "Confirm joining status",
          "Provide customer support",
          "Verify employers and job postings",
          "Review video profiles",
          "Generate transcripts and translations",
          "Improve regional language support",
          "Run locality-wise job matching",
          "Manage employer subscriptions",
          "Process payments",
          "Create invoices",
          "Run promotional campaigns",
          "Monitor platform performance",
          "Prevent fraud and misuse",
          "Detect fake jobs or suspicious activity",
          "Generate analytics and reports",
          "Improve user experience",
          "Comply with legal obligations",
          "Resolve disputes",
          "Enforce platform terms and policies",
        ],
      },
    ],
  },
  {
    id: "legal-basis",
    navLabel: "Legal Basis",
    title: "Legal Basis for Processing",
    blocks: [
      {
        type: "paragraph",
        text: "We process personal data only for lawful purposes. Depending on the context, we may process your information based on:",
      },
      {
        type: "list",
        items: [
          "Your consent",
          "Your request to use AsliJobs services",
          "The need to provide job search or hiring services",
          "The need to share candidate information with employers after application",
          "The need to verify employers or jobs",
          "The need to provide support",
          "The need to prevent fraud, misuse, spam, or illegal activity",
          "Compliance with applicable laws",
          "Legitimate platform operations and service improvement",
        ],
      },
      {
        type: "paragraph",
        text: "Where consent is required, you may withdraw consent as permitted by applicable law. However, withdrawal of consent may affect your ability to use certain AsliJobs services.",
      },
    ],
  },
  {
    id: "sharing-employers",
    navLabel: "Sharing with Employers",
    title: "Sharing of Information with Employers",
    blocks: [
      {
        type: "paragraph",
        text: "When a job seeker applies for a job or expresses interest in a job opportunity, AsliJobs may share relevant candidate information with the employer. This may include:",
      },
      {
        type: "list",
        items: [
          "Name",
          "Mobile number",
          "Location",
          "Preferred language",
          "Job category",
          "Skills",
          "Experience",
          "Expected salary",
          "Availability",
          "Application status",
          "Video profile",
          "Transcript",
          "Translated summary",
          "Interview status",
        ],
      },
      {
        type: "paragraph",
        text: "Employers must use candidate information only for hiring-related purposes and must not misuse, sell, share, harass, spam, or contact candidates for unrelated purposes.",
      },
    ],
  },
  {
    id: "sharing-job-seekers",
    navLabel: "Sharing with Job Seekers",
    title: "Sharing of Information with Job Seekers",
    blocks: [
      {
        type: "paragraph",
        text: "When a job seeker applies for or receives information about a job, AsliJobs may share relevant employer and job details with the job seeker. This may include:",
      },
      {
        type: "list",
        items: [
          "Company name",
          "Job title",
          "Work location",
          "Salary range",
          "Work timing",
          "Job description",
          "Interview details",
          "Contact details, where required",
          "Benefits",
          "Employer instructions",
        ],
      },
      {
        type: "paragraph",
        text: "AsliJobs may limit or withhold certain employer details if required for safety, verification, privacy, or operational reasons.",
      },
    ],
  },
  {
    id: "sharing-service-providers",
    navLabel: "Service Providers",
    title: "Sharing with Service Providers",
    blocks: [
      {
        type: "paragraph",
        text: "We may share information with trusted service providers who help us operate AsliJobs. These may include:",
      },
      {
        type: "list",
        items: [
          "WhatsApp Business service providers",
          "Cloud hosting providers",
          "Database providers",
          "AI transcription tools",
          "Translation tools",
          "Analytics tools",
          "Payment gateways",
          "Customer support tools",
          "Verification partners",
          "Email or SMS providers",
          "Campaign management tools",
          "Technology development partners",
          "Security and monitoring tools",
        ],
      },
      {
        type: "paragraph",
        text: "These service providers may process information only for the purposes required to provide their services to AsliJobs, subject to applicable contracts and privacy obligations.",
      },
    ],
  },
  {
    id: "ai-automation",
    navLabel: "AI & Automation",
    title: "AI, Automation, and Decision Support",
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs may use AI and automation to improve job matching, generate transcripts, translate messages, summarize video profiles, suggest job categories, identify incomplete profiles, detect suspicious activity, and generate analytics.",
      },
      {
        type: "paragraph",
        text: "AI tools may assist with decision-making, but important hiring decisions are generally made by employers or authorized platform teams.",
      },
      {
        type: "paragraph",
        text: "AI-generated outputs such as transcripts, translations, summaries, skill tags, or match suggestions may not always be fully accurate. Users should review important information before relying on it.",
      },
      {
        type: "paragraph",
        text: "AsliJobs may use human review where necessary, especially for video profile approval, job approval, promotion approval, complaints, suspicious activity, and support escalations.",
      },
    ],
  },
  {
    id: "promotions-campaigns",
    navLabel: "Promotions",
    title: "Promotions and Campaigns",
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs may use your information to send job alerts, hiring campaigns, locality-wise opportunities, language-based campaigns, employer promotions, referral campaigns, and service updates.",
      },
      {
        type: "paragraph",
        text: "Promotional messages may be sent only where permitted and based on applicable communication rules, user consent, or platform interaction.",
      },
      {
        type: "paragraph",
        text: "You may opt out of promotional messages where such an option is provided. However, you may still receive important service-related messages such as application updates, interview reminders, account notifications, support replies, or safety alerts.",
      },
    ],
  },
  {
    id: "data-security",
    navLabel: "Data Security",
    title: "Data Security",
    blocks: [
      {
        type: "paragraph",
        text: "We take reasonable security measures to protect personal data from unauthorized access, misuse, loss, alteration, disclosure, or destruction.",
      },
      {
        type: "paragraph",
        text: "Security measures may include:",
      },
      {
        type: "list",
        items: [
          "Access controls",
          "Role-based permissions",
          "Password protection",
          "Secure cloud storage",
          "Encryption where applicable",
          "Admin activity monitoring",
          "Data backup",
          "Internal review processes",
          "Limited access to sensitive data",
          "Verification and approval workflows",
          "Security monitoring tools",
        ],
      },
      {
        type: "paragraph",
        text: "However, no digital platform, internet service, WhatsApp communication, or cloud system can be guaranteed to be completely secure. Users should also take care not to share sensitive information with unknown persons or suspicious contacts.",
      },
    ],
  },
  {
    id: "data-retention",
    navLabel: "Data Retention",
    title: "Data Retention",
    blocks: [
      {
        type: "paragraph",
        text: "We retain personal information only for as long as necessary for the purposes described in this Privacy Policy, unless a longer retention period is required for legal, tax, accounting, fraud prevention, dispute resolution, security, or compliance purposes.",
      },
      {
        type: "paragraph",
        text: "Retention periods may depend on the type of user and data. For job seekers, profile data may be retained while the account is active and for a reasonable period after inactivity. For employers, business and transaction data may be retained for account management, legal, billing, and compliance purposes.",
      },
      {
        type: "paragraph",
        text: "Job applications, interview records, support tickets, campaign logs, payment records, and communication history may be retained for operational, legal, and dispute resolution purposes.",
      },
      {
        type: "paragraph",
        text: "Users may request deletion of personal data, subject to legal and operational limitations.",
      },
    ],
  },
  {
    id: "user-rights",
    navLabel: "User Rights",
    title: "User Rights",
    blocks: [
      {
        type: "paragraph",
        text: "Subject to applicable law, users may have the right to:",
      },
      {
        type: "list",
        items: [
          "Access their personal data",
          "Correct inaccurate or incomplete data",
          "Update profile information",
          "Withdraw consent where applicable",
          "Request deletion of personal data",
          "Request grievance redressal",
          "Opt out of certain promotional communications",
          "Ask questions about data processing",
        ],
      },
      {
        type: "paragraph",
        text: "To exercise these rights, users may contact AsliJobs through the contact details provided in this Privacy Policy. We may verify your identity before processing certain requests.",
      },
    ],
  },
  {
    id: "correction-update",
    navLabel: "Correction & Update",
    title: "Correction and Update of Information",
    blocks: [
      {
        type: "paragraph",
        text: "You are responsible for keeping your information accurate and updated. Job seekers should update their location, skills, experience, salary expectation, availability, and language preference whenever required.",
      },
      {
        type: "paragraph",
        text: "Employers should update job status, salary details, interview details, hiring status, company details, and contact information whenever required.",
      },
      {
        type: "paragraph",
        text: "Incorrect or outdated information may affect job matching, application results, interview communication, and hiring outcomes.",
      },
    ],
  },
  {
    id: "consent-opt-out",
    navLabel: "Consent & Opt-Out",
    title: "Consent Withdrawal and Opt-Out",
    blocks: [
      {
        type: "paragraph",
        text: "You may withdraw consent or opt out of certain communications by using available optout options, messaging us on WhatsApp, or contacting support.",
      },
      {
        type: "paragraph",
        text: "If you withdraw consent for essential data processing, AsliJobs may not be able to provide certain services such as job alerts, applications, interview updates, employer communication, video profile access, or dashboard access.",
      },
      {
        type: "paragraph",
        text: "Withdrawal of consent will not affect processing already completed before the withdrawal, where such processing was lawful.",
      },
    ],
  },
  {
    id: "childrens-privacy",
    navLabel: "Children’s Privacy",
    title: "Children’s Privacy",
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs is intended for users who are legally eligible to work and enter into employment or service-related arrangements under applicable laws. We do not knowingly collect personal data from children for unlawful employment or inappropriate job matching.",
      },
      {
        type: "paragraph",
        text: "Employers must not post jobs that involve illegal child labour or violate employment laws. If we discover that personal data of a child has been collected in violation of applicable law, we may delete or restrict such information.",
      },
    ],
  },
  {
    id: "employer-candidate-data",
    navLabel: "Employer Use of Data",
    title: "Employer Use of Candidate Data",
    blocks: [
      {
        type: "paragraph",
        text: "Employers who receive candidate data from AsliJobs must use it only for genuine hiring purposes. Employers must not:",
      },
      {
        type: "list",
        items: [
          "Sell candidate data",
          "Share candidate data with unauthorized parties",
          "Use candidate data for unrelated marketing",
          "Harass or spam candidates",
          "Mislead candidates",
          "Demand illegal payments",
          "Use candidate data for fraud",
          "Discriminate unlawfully",
          "Store data longer than necessary",
          "Contact candidates outside legitimate hiring needs",
        ],
      },
      {
        type: "paragraph",
        text: "Employers are responsible for complying with applicable privacy, labour, employment, and communication laws.",
      },
    ],
  },
  {
    id: "cookies",
    navLabel: "Cookies",
    title: "Cookies and Tracking Technologies",
    blocks: [
      {
        type: "paragraph",
        text: "Our website and dashboard may use cookies, pixels, tags, analytics tools, and similar technologies to improve user experience and platform performance.",
      },
      {
        type: "paragraph",
        text: "These technologies may help us:",
      },
      {
        type: "list",
        items: [
          "Remember preferences",
          "Improve website speed",
          "Understand visitor behaviour",
          "Measure campaign performance",
          "Detect technical issues",
          "Improve security",
          "Track conversions",
          "Analyze traffic sources",
        ],
      },
      {
        type: "paragraph",
        text: "You may manage cookie preferences through your browser settings. Disabling cookies may affect certain website or dashboard features.",
      },
    ],
  },
  {
    id: "third-party-links",
    navLabel: "Third-Party Links",
    title: "Third-Party Links",
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs may contain links to third-party websites, employer pages, payment gateways, WhatsApp, social media platforms, or external services. We are not responsible for the privacy practices, content, terms, security, or actions of third-party websites or services.",
      },
      {
        type: "paragraph",
        text: "Users should review the privacy policies of such third parties before sharing information with them.",
      },
    ],
  },
  {
    id: "international-transfers",
    navLabel: "International Transfers",
    title: "International Data Transfers",
    blocks: [
      {
        type: "paragraph",
        text: "Some of our technology partners, cloud providers, WhatsApp-related service providers, AI tools, analytics tools, or support systems may process or store data on servers located outside India.",
      },
      {
        type: "paragraph",
        text: "Where required, AsliJobs will take reasonable steps to ensure that such processing is carried out in accordance with applicable data protection laws and appropriate safeguards.",
      },
    ],
  },
  {
    id: "data-breach",
    navLabel: "Data Breach",
    title: "Data Breach and Incident Handling",
    blocks: [
      {
        type: "paragraph",
        text: "If AsliJobs becomes aware of a data breach or security incident affecting personal data, we will take reasonable steps to investigate, contain, mitigate, and address the incident.",
      },
      {
        type: "paragraph",
        text: "Where required by applicable law, we may notify affected users, regulators, or relevant authorities.",
      },
      {
        type: "paragraph",
        text: "Users should immediately inform AsliJobs if they suspect unauthorized use of their account, misuse of their data, fake job activity, suspicious employer communication, or privacy-related issues.",
      },
    ],
  },
  {
    id: "grievance-contact",
    navLabel: "Grievance Contact",
    title: "Grievance and Privacy Contact",
    blocks: [
      {
        type: "paragraph",
        text: "For privacy-related questions, correction requests, consent withdrawal, deletion requests, complaints, or grievances, you may contact:",
      },
      {
        type: "contact-lines",
        lines: [
          "Privacy / Grievance Officer:[Name]",
          "Email:[Email Address]",
          "Phone / WhatsApp:[Phone Number]",
          "Address:[Registered Office Address]",
          "Working Hours:[●]",
        ],
      },
      {
        type: "paragraph",
        text: "We will make reasonable efforts to respond to privacy-related requests within a reasonable time as required under applicable law.",
      },
    ],
  },
  {
    id: "changes",
    navLabel: "Changes",
    title: "Changes to this Privacy Policy",
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs may update this Privacy Policy from time to time to reflect changes in law, technology, platform features, business operations, or user requirements.",
      },
      {
        type: "paragraph",
        text: "The updated Privacy Policy may be posted on our website or shared through other appropriate channels. The “Last Updated” date will reflect the latest version.",
      },
      {
        type: "paragraph",
        text: "Your continued use of AsliJobs after the updated Privacy Policy is published means you accept the revised policy.",
      },
    ],
  },
  {
    id: "contact",
    navLabel: "Contact",
    title: "Contact Information",
    blocks: [
      {
        type: "paragraph",
        text: "For questions about this Privacy Policy or how AsliJobs handles your personal information, please contact:",
      },
      {
        type: "contact-lines",
        lines: [
          "AsliJobs",
          "Legal Entity Name:[●]",
          "Email:[Email Address]",
          "Phone / WhatsApp:[Phone Number]",
          "Address:[Registered Office Address]",
          "Website:[Website URL]",
        ],
      },
    ],
  },
];
