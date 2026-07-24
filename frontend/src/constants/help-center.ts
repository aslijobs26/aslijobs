import type { HelpCenterCategory } from "@/types/help-center";

export const HELP_CENTER_PAGE_TITLE = "Help Center";

export const HELP_CENTER_SEARCH_PLACEHOLDER = "Search help articles...";

export const HELP_CENTER_EMPTY_TITLE = "No help articles found";

export const HELP_CENTER_EMPTY_DESCRIPTION =
  "Try a different keyword, or clear your search to browse all categories.";

export const HELP_CENTER_SUPPORT_TITLE = "Need more help?";

export const HELP_CENTER_SUPPORT_DESCRIPTION =
  "Contact our support team if you couldn't find your answer.";

export const HELP_CENTER_WHATSAPP_LABEL = "WhatsApp Support";

export const HELP_CENTER_CALL_LABEL = "Call Support";

export const HELP_CENTER_EMAIL_LABEL = "Email Support";

export const HELP_CENTER_CATEGORIES: HelpCenterCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Core introduction layer",
    cardTitle: "Getting Started",
    cardDescription: "Core introduction layer",
    articles: [
      {
        id: "what-is-aslijobs",
        question: "What is AsliJobs?",
        answer:
          "AsliJobs is a WhatsApp-based job portal created for India’s blue-collar, grey-collar, and entry-level workforce. It helps job seekers find suitable jobs and helps employers connect with the right candidates easily.",
      },
      {
        id: "how-does-aslijobs-work",
        question: "How does AsliJobs work?",
        answer:
          "AsliJobs works through WhatsApp. Job seekers can register, receive job alerts, apply for jobs, and get interview updates, while employers can create profiles, post jobs, manage applications, shortlist candidates, and schedule interviews.",
      },
      {
        id: "who-can-use-aslijobs",
        question: "Who can use AsliJobs?",
        answer:
          "AsliJobs can be used by job seekers looking for work and employers who want to hire workers. It is mainly designed for blue-collar, grey-collar, support, and entry-level job roles.",
      },
      {
        id: "need-to-download-app",
        question: "Do I need to download an app?",
        answer:
          "No. Job seekers and employers do not need to download any app. AsliJobs works directly through WhatsApp, making it simple and easy to use.",
      },
      {
        id: "is-aslijobs-free-to-use",
        question: "Is AsliJobs free to use?",
        answer:
          "Yes. AsliJobs is free for job seekers to search and apply for jobs. Some employer services, promotions, or hiring plans may be paid.",
      },
      {
        id: "which-cities",
        question: "Which cities does AsliJobs serve?",
        answer:
          "AsliJobs serves job seekers and employers across India. Job seekers can search and apply for jobs from anywhere, while employers can post jobs from any location. Job availability may vary depending on the city, area, locality, and current employer openings.",
      },
      {
        id: "job-categories-available",
        question: "Which job categories are available?",
        answer:
          "AsliJobs supports industries such as manufacturing, construction, logistics and transportation, warehousing, retail, hospitality, facility management, security services, automotive, healthcare support, and other blue-collar and grey-collar sectors.",
      },
    ],
  },
  {
    id: "job-seeker-help",
    title: "Job Seeker Help",
    description: "For workers searching and applying for jobs",
    cardTitle: "Job Seeker Help",
    cardDescription: "For workers searching and applying for jobs",
    articles: [
      {
        id: "register-as-job-seeker",
        question: "How do I register as a job seeker?",
        answer:
          "You can register on AsliJobs through WhatsApp by sharing basic details like your name, mobile number, location, preferred language, job category, and experience.",
      },
      {
        id: "create-job-profile",
        question: "How do I create my job profile?",
        answer:
          "You can create your job profile on the AsliJobs website by adding your preferred job category, skills, work experience, preferred location, expected salary, and availability. You can also upload an introduction video highlighting your background, skills, experience, and the type of job you are looking for.",
      },
      {
        id: "select-area-locality",
        question: "How do I select my area or locality?",
        answer:
          "You can choose your city, area, or locality on WhatsApp so AsliJobs can show jobs that are closer to you.",
      },
      {
        id: "receive-job-alerts-seeker",
        question: "How will I receive job alerts?",
        answer:
          "You will receive suitable job alerts directly on WhatsApp based on your location, job category, and profile details when the Job Search Status badge is enabled on your AsliJobs profile. If the badge is turned off, you will not receive job alerts.",
      },
      {
        id: "apply-for-a-job",
        question: "How do I apply for a job?",
        answer:
          "Job seekers can apply through the AsliJobs website or directly through WhatsApp by replying to a job alert or selecting the Apply option.",
      },
      {
        id: "check-application-status",
        question: "How can I check my application status?",
        answer:
          "Application updates such as applied, shortlisted, interview scheduled, selected, or not selected will be shared through WhatsApp.",
      },
      {
        id: "update-my-profile",
        question: "How do I update my profile?",
        answer:
          "You can update your profile details through your profile on the AsliJobs website.",
      },
      {
        id: "change-preferred-language",
        question: "How do I change my preferred language?",
        answer:
          "Yes. Users can change their preferred language through the AsliJobs website, WhatsApp, or by contacting AsliJobs support.",
      },
    ],
  },
  {
    id: "employer-help",
    title: "Employer Help",
    description: "For businesses hiring workers",
    cardTitle: "Employer Help",
    cardDescription: "For businesses hiring workers",
    articles: [
      {
        id: "register-as-employer",
        question: "How do I register as an employer?",
        answer:
          "You can register as an employer on AsliJobs by providing your employer name, company name, and contact details. Your WhatsApp number must be verified using an OTP.",
      },
      {
        id: "post-a-job",
        question: "How do I post a job?",
        answer:
          "You must complete your company profile before posting a job. Provide the job title, location, salary, work timings, number of openings, required experience, and other important details.",
      },
      {
        id: "job-post-rejected",
        question: "Why was my job post rejected?",
        answer:
          "A job post may be rejected if it has incomplete details, false information, unclear salary, wrong location, misleading content, or violates platform guidelines and if the subscription has ended.",
      },
      {
        id: "view-applications",
        question: "How can I view applications?",
        answer:
          "Employers can view, shortlist applications received for their job posts through the employer dashboard or updates shared by the AsliJobs team.",
      },
      {
        id: "close-job-post",
        question: "How do I close a job post?",
        answer:
          "You can close a job post once the position is filled, paused, cancelled, or no longer available.",
      },
      {
        id: "employers-contact-support",
        question: "How can employers contact support?",
        answer:
          "Employers can contact AsliJobs support through WhatsApp, email, or the available support option for job posting, applications, payments, or hiring help.",
      },
    ],
  },
  {
    id: "whatsapp-help",
    title: "WhatsApp Help",
    description: "Explains the WhatsApp-based experience",
    cardTitle: "WhatsApp Help",
    cardDescription: "Explains the WhatsApp-based experience",
    articles: [
      {
        id: "start-on-whatsapp",
        question: "How do I start using AsliJobs on WhatsApp?",
        answer:
          "You can start by clicking the AsliJobs WhatsApp link, scanning the QR code, or sending a message to the official AsliJobs WhatsApp number.",
      },
      {
        id: "receive-job-alerts-whatsapp",
        question: "How will I receive job alerts?",
        answer:
          "You will receive job alerts on WhatsApp based on your location, job category, experience, and profile details.",
      },
      {
        id: "reply-to-messages",
        question: "How should I reply to messages?",
        answer:
          "You can reply using the given options, such as Apply, Yes, No, Help, or any other option shown in the WhatsApp message.",
      },
      {
        id: "apply-through-whatsapp",
        question: "Can I apply for jobs through WhatsApp?",
        answer:
          "Yes. You can apply for jobs directly through WhatsApp by replying to the job alert or selecting the apply option.",
      },
      {
        id: "not-receiving-whatsapp-messages",
        question: "Why am I not receiving WhatsApp messages?",
        answer:
          "You may not receive messages due to network issues, wrong number, blocked number, or inactive WhatsApp.",
      },
      {
        id: "official-aslijobs-number",
        question: "How do I know the official AsliJobs number?",
        answer:
          "Always check the official AsliJobs website for the correct WhatsApp number.",
      },
    ],
  },
  {
    id: "applications-interviews",
    title: "Applications & Interviews",
    description: "Explains the hiring journey clearly",
    cardTitle: "Applications & Interviews",
    cardDescription: "Explains the hiring journey clearly",
    articles: [
      {
        id: "after-i-apply",
        question: "What happens after I apply for a job?",
        answer:
          "After you apply, your application is shared with the employer for review. You will receive further updates through WhatsApp.",
      },
      {
        id: "shortlisted-means",
        question: "What does shortlisted mean?",
        answer:
          "Shortlisted means the employer has selected your profile for the next step, such as an interview or further discussion.",
      },
      {
        id: "interview-updates",
        question: "How will I get interview updates?",
        answer:
          "Interview updates such as date, time, location, and contact person details will be shared with you through WhatsApp.",
      },
      {
        id: "interview-documents",
        question: "What documents should I carry for an interview?",
        answer:
          "You may need to carry an ID proof, experience details, certificates, or any documents requested by the employer.",
      },
      {
        id: "selected-status-means",
        question: "What does selected status mean?",
        answer:
          "Selected means the employer has chosen you for the job after reviewing your profile or interview performance.",
      },
      {
        id: "joining-confirmation",
        question: "What is joining confirmation?",
        answer:
          "Joining confirmation means the employer has confirmed your joining date, time, location, and other required details.",
      },
    ],
  },
  {
    id: "profile-video-profile",
    title: "Profile & Video Profile",
    description: "Helps users build better profiles",
    cardTitle: "Profile & Video Profile",
    cardDescription: "Helps users build better profiles",
    articles: [
      {
        id: "profile-details-included",
        question: "What details are included in a job seeker profile?",
        answer:
          "A job seeker profile includes details such as name, mobile number, preferred job category, skills, work experience, preferred location, expected salary, availability, and preferred language.",
      },
      {
        id: "job-seekers-update-profile",
        question: "How can job seekers update their profile?",
        answer:
          "Job seekers can update their profile details through their profile on the AsliJobs website.",
      },
      {
        id: "job-search-status-badge",
        question: "What is the job search status badge?",
        answer:
          "This badge indicates that you are actively looking for a job. You need to enable this badge on your AsliJobs profile to receive job alerts. If the badge is turned off, you will not receive job alerts.",
      },
      {
        id: "introduction-video-meaning",
        question: "What is an introduction video?",
        answer:
          "An introduction video is a short video in which the job seeker introduces themselves and explains their skills, work experience, preferred job role, and availability.",
      },
      {
        id: "create-introduction-video",
        question: "How can job seekers create an introduction video?",
        answer:
          "Job seekers can record a short and clear video introducing themselves and upload or share it through the option provided by AsliJobs.",
      },
      {
        id: "include-in-introduction-video",
        question: "What should job seekers include in the introduction video?",
        answer:
          "Job seekers should mention their name, skills, work experience, preferred job category, preferred work location, availability, and any relevant qualifications or certifications.",
      },
    ],
  },
  {
    id: "language-support",
    title: "Language Support",
    description: "For regional language accessibility",
    cardTitle: "Language Support",
    cardDescription: "For regional language accessibility",
    articles: [
      {
        id: "supported-languages",
        question: "Which languages does AsliJobs support?",
        answer:
          "AsliJobs supports English, Hindi, Telugu, Tamil, Kannada, and Malayalam.",
      },
      {
        id: "change-my-language",
        question: "How can I change my language?",
        answer:
          "Yes. Users can change their preferred language through the AsliJobs website, WhatsApp, or by contacting AsliJobs support.",
      },
      {
        id: "alerts-in-local-language",
        question: "Can I receive job alerts in my local language?",
        answer:
          "Yes. AsliJobs can send job alerts and important updates in your preferred language, where available.",
      },
    ],
  },
  {
    id: "safety-reporting",
    title: "Safety & Reporting",
    description: "User trust and protection layer",
    cardTitle: "Safety & Reporting",
    cardDescription: "User trust and protection layer",
    articles: [
      {
        id: "identify-fake-job",
        question: "How can I identify a fake job?",
        answer:
          "Be careful of jobs with unclear company details, fake salary promises, wrong location, payment demands, or suspicious interview instructions.",
      },
      {
        id: "pay-money-for-job",
        question: "Should I pay money to get a job?",
        answer:
          "No. Job seekers should not pay money for job confirmation. If anyone asks for payment, report it to AsliJobs immediately.",
      },
      {
        id: "report-fake-job",
        question: "How can I report a fake job?",
        answer:
          "You can report a fake or suspicious job by contacting AsliJobs support through WhatsApp or the available support option.",
      },
      {
        id: "report-employer-misconduct",
        question: "How can I report employer misconduct?",
        answer:
          "You can report employer misconduct by sharing the employer name, job title, issue details, and any screenshots with AsliJobs support.",
      },
      {
        id: "abusive-messages",
        question: "What should I do if I receive abusive messages?",
        answer:
          "Do not respond further. Take a screenshot and report the message to AsliJobs support immediately.",
      },
      {
        id: "information-not-to-share",
        question: "What information should I not share?",
        answer:
          "Do not share OTPs, bank details, passwords, UPI PINs, personal documents, or sensitive information with unknown persons.",
      },
      {
        id: "interview-safety-tips",
        question: "What safety tips should I follow for interviews?",
        answer:
          "Check the company name, interview location, contact person, and job details before attending. Inform a family member or friend if needed.",
      },
      {
        id: "platform-safety-checks",
        question: "How does AsliJobs keep the platform safe?",
        answer:
          "AsliJobs may review employers, complaints, and suspicious activity to maintain a safer hiring experience.",
      },
    ],
  },
  {
    id: "payments-plans-promotions",
    title: "Payments, Plans & Promotions",
    description: "Mainly for employers",
    cardTitle: "Payments & Promotions",
    cardDescription: "Mainly for employers",
    articles: [
      {
        id: "free-and-paid-services",
        question: "Which services are free and paid?",
        answer:
          "AsliJobs is free for job seekers to search and apply for jobs. Employer services, hiring plans, and promotions may be paid.",
      },
      {
        id: "employer-plans",
        question: "What are employer plans?",
        answer:
          "Employer plans are paid options that help businesses post jobs, receive applications, promote openings, and manage hiring better.",
      },
      {
        id: "promoted-jobs",
        question: "What are promoted jobs?",
        answer:
          "Promoted jobs are job posts given extra visibility so more suitable job seekers can see and apply for them.",
      },
      {
        id: "campaign-promotions",
        question: "What are campaign promotions?",
        answer:
          "Campaign promotions help employers reach job seekers through targeted job alerts based on location, job category, and language.",
      },
      {
        id: "payment-support",
        question: "How can I get payment support?",
        answer:
          "Employers can contact AsliJobs support for help with payments, plan activation, failed transactions, or billing issues.",
      },
      {
        id: "get-an-invoice",
        question: "How can I get an invoice?",
        answer:
          "Employers can request an invoice through AsliJobs support after completing the payment.",
      },
    ],
  },
  {
    id: "account-data-help",
    title: "Account & Data Help",
    description: "Profile, privacy, and data control",
    cardTitle: "Account & Data",
    cardDescription: "Profile, privacy, and data control",
    articles: [
      {
        id: "update-account-details",
        question: "How can I update my account details?",
        answer:
          "Job seekers can update their profile details through their profile on the AsliJobs website, while employers can update their details through the employer dashboard. They can also contact AsliJobs support through WhatsApp or the available support options.",
      },
      {
        id: "change-mobile-number",
        question: "How can I change my mobile number?",
        answer:
          "Job seekers can update their mobile number through their profile on the AsliJobs website, while employers can update it through the employer dashboard. They can also contact AsliJobs support and provide the required verification details.",
      },
      {
        id: "deactivate-account",
        question: "How can users deactivate their account?",
        answer:
          "Job seekers can deactivate their account through their profile settings on the AsliJobs website, while employers can deactivate their account through the employer dashboard. Users can also contact AsliJobs support for assistance with account deactivation.",
      },
      {
        id: "how-data-is-used",
        question: "How does AsliJobs use my data?",
        answer:
          "AsliJobs uses your data to provide job alerts, manage applications, support hiring, improve services, and communicate with you.",
      },
      {
        id: "who-can-see-profile",
        question: "Who can see my profile?",
        answer:
          "Your profile may be viewed by AsliJobs admins and relevant employers for job search, application, and hiring purposes.",
      },
      {
        id: "remove-job-video",
        question: "How can I remove a job video?",
        answer:
          "Job seekers can remove or delete their old introduction video and upload a new one through their profile on the AsliJobs website or by contacting AsliJobs support.",
      },
      {
        id: "privacy-support",
        question: "How can I get privacy support?",
        answer:
          "You can contact AsliJobs support for any privacy-related questions, data updates, deletion requests, or account concerns.",
      },
    ],
  },
  {
    id: "contact-support",
    title: "Contact Support",
    description: "Final help and complaint layer",
    cardTitle: "Contact Support",
    cardDescription: "Final help and complaint layer",
    articles: [
      {
        id: "contact-aslijobs-support",
        question: "How can I contact AsliJobs support?",
        answer:
          "You can contact AsliJobs support through WhatsApp, phone, or email.",
      },
      {
        id: "raise-a-complaint",
        question: "How can I raise a complaint?",
        answer:
          "You can raise a complaint by sharing your issue with AsliJobs support through WhatsApp, phone, or email.",
      },
      {
        id: "complaint-details",
        question: "What details should I provide for a complaint?",
        answer:
          "Job seekers should share their name, mobile number, job title, employer name, issue details, and screenshots, if available. Employers should share their name, company name, mobile number, job title or Job ID, candidate details, issue details, and relevant screenshots, if available.",
      },
      {
        id: "reopen-a-complaint",
        question: "How can I reopen a complaint?",
        answer:
          "You can request to reopen a complaint if the issue is not resolved or if you need further support.",
      },
      {
        id: "support-response-time",
        question: "How long does support take to respond?",
        answer:
          "AsliJobs will try to respond as soon as possible. Response time may vary based on the issue and support availability.",
      },
      {
        id: "contact-support-whatsapp",
        question: "Can I contact support through WhatsApp?",
        answer:
          "Yes. You can contact AsliJobs support through the official WhatsApp number.",
      },
      {
        id: "contact-support-email",
        question: "Can I contact support through email?",
        answer:
          "Yes. You can contact AsliJobs support through the official support email address.",
      },
    ],
  },
];
