import type { KnowledgePersona, KnowledgeSourceType } from "./website-knowledge.types.js";
import { OFFICIAL_PUBLIC_CONTACT } from "./website-knowledge.catalog.js";

/**
 * Official English documentation mirrored from frontend i18n bundles
 * (faqs.ts, public-pages.ts, privacy.ts, site-pages contact). Do not invent
 * prices, phone numbers, or workflows beyond these strings.
 */
export type CorpusFaq = {
  id: string;
  question: string;
  answer: string;
  path: string;
  persona: KnowledgePersona;
};

export type CorpusSection = {
  id: string;
  path: string;
  title: string;
  sectionHeading: string;
  content: string;
  sourceType: KnowledgeSourceType;
  persona: KnowledgePersona;
  keywords?: string[];
};

export const CORPUS_FAQS: readonly CorpusFaq[] = [
  {
    id: "what-is-aslijobs",
    question: "What is AsliJobs?",
    answer:
      "AsliJobs is a WhatsApp-based job portal that helps India’s blue-collar and grey-collar workforce find suitable jobs and helps employers hire the right candidates easily.",
    path: "/faqs",
    persona: "general",
  },
  {
    id: "how-does-aslijobs-work",
    question: "How does AsliJobs work?",
    answer:
      "AsliJobs works through WhatsApp. Job seekers can receive job alerts and apply for jobs, while employers can post jobs and connect with suitable candidates.",
    path: "/faqs",
    persona: "general",
  },
  {
    id: "need-to-download-app",
    question: "Do I need to download an app?",
    answer:
      "No. Job seekers and employers do not need to download any app. AsliJobs works directly through WhatsApp, making it simple and easy to use.",
    path: "/faqs",
    persona: "general",
  },
  {
    id: "which-cities",
    question: "Which cities does AsliJobs serve?",
    answer:
      "AsliJobs serves job seekers and employers across India. Job seekers can search and apply for jobs from anywhere, while employers can post jobs from any location. Job availability may vary depending on the city, area, locality, and current employer openings.",
    path: "/faqs",
    persona: "general",
  },
  {
    id: "job-categories",
    question: "Which job categories are available?",
    answer:
      "AsliJobs supports industries such as manufacturing, construction, logistics and transportation, warehousing, retail, hospitality, facility management, security services, automotive, healthcare support, and other blue-collar and grey-collar sectors.",
    path: "/faqs",
    persona: "general",
  },
  {
    id: "free-for-job-seekers",
    question: "Is AsliJobs free for job seekers?",
    answer: "Yes. AsliJobs is free for job seekers to search and apply for jobs.",
    path: "/faqs",
    persona: "seeker",
  },
  {
    id: "job-alerts",
    question: "How will job seekers receive job alerts?",
    answer:
      "Job seekers will receive job alerts on WhatsApp based on their location, job category, experience, and profile details.",
    path: "/faqs",
    persona: "seeker",
  },
  {
    id: "should-pay-for-job",
    question: "Should job seekers pay money to get a job?",
    answer:
      "No. Job seekers should not pay money for job confirmation. If anyone asks for payment, report it to AsliJobs immediately.",
    path: "/faqs",
    persona: "seeker",
  },
  {
    id: "job-search-status-badge",
    question: "What is the job search status badge?",
    answer:
      "This badge indicates that you are actively looking for a job. You need to enable this badge on your AsliJobs profile to receive job alerts. If the badge is turned off, you will not receive job alerts.",
    path: "/faqs",
    persona: "seeker",
  },
  {
    id: "employer-free-or-paid",
    question: "Are employer services free or paid?",
    answer:
      "AsliJobs offers both free and paid services for employers. Employers can choose paid hiring plans, promoted jobs, or campaign promotions based on their hiring requirements.",
    path: "/faqs",
    persona: "employer",
  },
  {
    id: "how-employers-post-job",
    question: "How do employers post a job?",
    answer:
      "Employers can post a job by sharing details like job title, location, salary, work timing, openings, experience required, and benefits.",
    path: "/faqs",
    persona: "employer",
  },
  {
    id: "promoted-job",
    question: "What is a promoted job?",
    answer:
      "A promoted job is a paid job post given extra visibility so more suitable job seekers can see and apply for it.",
    path: "/faqs",
    persona: "employer",
  },
  {
    id: "how-job-seekers-apply",
    question: "How do job seekers apply for a job?",
    answer:
      "Job seekers can apply directly through WhatsApp by replying to a job alert or selecting the Apply option. They can also apply through the AsliJobs website.",
    path: "/faqs",
    persona: "seeker",
  },
  {
    id: "how-employers-receive-applications",
    question: "How will employers receive applications?",
    answer:
      "Employers can view applications through the employer dashboard or receive updates shared by the AsliJobs team.",
    path: "/faqs",
    persona: "employer",
  },
  {
    id: "after-job-seeker-applies",
    question: "What happens after a job seeker applies?",
    answer:
      "After a job seeker applies, the application is shared with the employer. Further updates like shortlisting, interview details, or selection status will be shared through WhatsApp.",
    path: "/faqs",
    persona: "seeker",
  },
  {
    id: "how-employers-shortlist",
    question: "How can employers shortlist candidates?",
    answer:
      "Employers can review candidate details and shortlist profiles that match their hiring requirements.",
    path: "/faqs",
    persona: "employer",
  },
  {
    id: "supported-languages",
    question: "Which languages does AsliJobs support?",
    answer: "AsliJobs supports English, Hindi, Telugu, Tamil, Kannada, and Malayalam.",
    path: "/faqs",
    persona: "general",
  },
  {
    id: "change-language",
    question: "Can users change their language preference?",
    answer:
      "Yes. Users can change their preferred language through the AsliJobs website, WhatsApp, or by contacting AsliJobs support.",
    path: "/faqs",
    persona: "general",
  },
  {
    id: "report-fake-job",
    question: "How can users report a fake job?",
    answer:
      "Users can report a fake or suspicious job by contacting AsliJobs support and sharing the job details, employer name, issue, and screenshots if available.",
    path: "/faqs",
    persona: "general",
  },
  {
    id: "update-profile",
    question: "How can users update their profile details?",
    answer:
      "Job seekers can update their profile details through their profile on the AsliJobs website, while employers can update their details through the employer dashboard. Users can also contact AsliJobs support through WhatsApp or the available support options.",
    path: "/faqs",
    persona: "general",
  },
  {
    id: "deactivate-account",
    question: "How can users deactivate their account?",
    answer:
      "Job seekers can deactivate their account through their profile settings on the AsliJobs website, while employers can deactivate their account through the employer dashboard. Users can also contact AsliJobs support for assistance with account deactivation.",
    path: "/faqs",
    persona: "general",
  },
  {
    id: "contact-support",
    question: "How can users contact AsliJobs support?",
    answer: "You can contact AsliJobs support through WhatsApp, phone, or email.",
    path: "/faqs",
    persona: "general",
  },
  {
    id: "more-help",
    question: "Where can users get more help?",
    answer:
      "For detailed answers, users can visit the AsliJobs Help Center or contact AsliJobs support.",
    path: "/faqs",
    persona: "general",
  },
];

export const CORPUS_SECTIONS: readonly CorpusSection[] = [
  {
    id: "pricing-intro",
    path: "/pricing-plans",
    title: "Pricing Plans",
    sectionHeading: "Pricing Plans",
    content:
      "Choose the right hiring plan for your business and connect with suitable blue-collar and grey-collar candidates through AsliJobs. AsliJobs offers paid hiring plans for employers who want to post jobs, receive applications, promote openings, and manage hiring more effectively.",
    sourceType: "pricing",
    persona: "employer",
    keywords: ["pricing", "plans", "subscription", "paid", "hiring plan"],
  },
  {
    id: "pricing-basic",
    path: "/pricing-plans",
    title: "Pricing Plans",
    sectionHeading: "Basic Hiring Plan",
    content:
      "Basic Hiring Plan — Best For: Employers with limited hiring needs. Includes: Job posting, candidate applications, and basic dashboard access.",
    sourceType: "pricing",
    persona: "employer",
    keywords: ["basic", "pricing", "plan"],
  },
  {
    id: "pricing-standard",
    path: "/pricing-plans",
    title: "Pricing Plans",
    sectionHeading: "Standard Hiring Plan",
    content:
      "Standard Hiring Plan — Best For: Employers hiring regularly. Includes: Multiple job postings, more candidate reach, application tracking, and support.",
    sourceType: "pricing",
    persona: "employer",
    keywords: ["standard", "pricing", "plan"],
  },
  {
    id: "pricing-premium",
    path: "/pricing-plans",
    title: "Pricing Plans",
    sectionHeading: "Premium Hiring Plan",
    content:
      "Premium Hiring Plan — Best For: Employers who need faster hiring. Includes: Higher visibility, promoted job options, priority support, and better candidate reach.",
    sourceType: "pricing",
    persona: "employer",
    keywords: ["premium", "pricing", "plan", "promoted"],
  },
  {
    id: "pricing-campaign",
    path: "/pricing-plans",
    title: "Pricing Plans",
    sectionHeading: "Campaign Hiring Plan",
    content:
      "Campaign Hiring Plan — Best For: Employers with bulk or urgent hiring needs. Includes: Targeted hiring campaigns, location-based reach, WhatsApp job alerts, and hiring support.",
    sourceType: "pricing",
    persona: "employer",
    keywords: ["campaign", "pricing", "bulk", "urgent"],
  },
  {
    id: "pricing-payments",
    path: "/pricing-plans",
    title: "Pricing Plans",
    sectionHeading: "Payments and Invoices",
    content:
      "Employers can choose a suitable plan and complete the payment through the available payment options. After payment, invoices can be requested through AsliJobs support.",
    sourceType: "pricing",
    persona: "employer",
    keywords: ["payment", "invoice", "pricing"],
  },
  {
    id: "seeker-guide-intro",
    path: "/job-seeker-guide",
    title: "Job Seeker Guide",
    sectionHeading: "Job Seeker Guide",
    content:
      "AsliJobs makes job search simple for India’s blue-collar and grey-collar workforce. With AsliJobs, job seekers can find suitable jobs, apply easily, and receive updates directly through WhatsApp.",
    sourceType: "guide",
    persona: "seeker",
    keywords: ["job seeker", "guide", "register", "profile", "whatsapp"],
  },
  {
    id: "seeker-guide-whatsapp",
    path: "/job-seeker-guide",
    title: "Job Seeker Guide",
    sectionHeading: "Start with WhatsApp",
    content:
      "You do not need to download any new app. You can start by clicking the AsliJobs WhatsApp link, scanning the QR code, or sending a message to the official AsliJobs WhatsApp number.",
    sourceType: "guide",
    persona: "seeker",
    keywords: ["whatsapp", "qr", "start"],
  },
  {
    id: "seeker-guide-profile",
    path: "/job-seeker-guide",
    title: "Job Seeker Guide",
    sectionHeading: "Create Your Profile",
    content:
      "Share your basic details like name, mobile number, location, preferred language, job category, skills, experience, expected salary, and availability. This helps AsliJobs send you more suitable job opportunities.",
    sourceType: "guide",
    persona: "seeker",
    keywords: ["profile", "register", "registration", "job seeker"],
  },
  {
    id: "seeker-guide-apply",
    path: "/job-seeker-guide",
    title: "Job Seeker Guide",
    sectionHeading: "Apply Through WhatsApp",
    content:
      "When you receive a job alert, read the job details carefully. If you are interested, apply directly through WhatsApp by replying to the job alert or selecting the apply option.",
    sourceType: "guide",
    persona: "seeker",
    keywords: ["apply", "whatsapp", "job alert"],
  },
  {
    id: "seeker-guide-track",
    path: "/job-seeker-guide",
    title: "Job Seeker Guide",
    sectionHeading: "Track Application Updates",
    content:
      "After applying, you may receive updates such as applied, shortlisted, interview scheduled, selected, or joining confirmed through WhatsApp.",
    sourceType: "guide",
    persona: "seeker",
    keywords: ["application", "status", "interview", "shortlisted"],
  },
  {
    id: "seeker-guide-safety",
    path: "/job-seeker-guide",
    title: "Job Seeker Guide",
    sectionHeading: "Stay Safe While Searching",
    content:
      "Do not pay money for job confirmation. Always check the company name, job location, salary, work timing, and interview details before proceeding. Report fake jobs, payment demands, or suspicious messages to AsliJobs support immediately.",
    sourceType: "guide",
    persona: "seeker",
    keywords: ["safe", "fake", "payment", "report"],
  },
  {
    id: "employer-guide-intro",
    path: "/employer-guide",
    title: "Employer Guide",
    sectionHeading: "Employer Guide",
    content:
      "AsliJobs helps employers hire suitable blue-collar and grey-collar candidates through a simple, WhatsApp-friendly hiring process. Whether you are hiring for one role or multiple openings, AsliJobs helps you reach job seekers based on location, job category, experience, skills, language preference, and availability.",
    sourceType: "guide",
    persona: "employer",
    keywords: ["employer", "guide", "hire", "hiring"],
  },
  {
    id: "employer-guide-register",
    path: "/employer-guide",
    title: "Employer Guide",
    sectionHeading: "Register as an Employer",
    content:
      "Start by creating your employer profile on AsliJobs. Share basic details like employer name, company name, contact person details, mobile number, location, business type, hiring categories, and preferred language.",
    sourceType: "guide",
    persona: "employer",
    keywords: ["employer", "register", "registration", "profile"],
  },
  {
    id: "employer-guide-post",
    path: "/employer-guide",
    title: "Employer Guide",
    sectionHeading: "Post a Job",
    content:
      "Post your job by adding clear details such as job title, salary range, work location, timings, number of openings, experience required, skills needed, benefits, and interview details. Clear job details help job seekers understand the opportunity better and apply with confidence.",
    sourceType: "guide",
    persona: "employer",
    keywords: ["post", "job", "employer", "openings", "salary"],
  },
  {
    id: "employer-guide-applications",
    path: "/employer-guide",
    title: "Employer Guide",
    sectionHeading: "Receive Applications",
    content:
      "Once your job is posted, suitable job seekers can view and apply for the job. Applications can be managed through the employer dashboard or with support from the AsliJobs team.",
    sourceType: "guide",
    persona: "employer",
    keywords: ["applicants", "applications", "dashboard", "candidates", "where"],
  },
  {
    id: "employer-guide-shortlist",
    path: "/employer-guide",
    title: "Employer Guide",
    sectionHeading: "Shortlist Candidates",
    content:
      "Review candidate details such as name, location, experience, skills, expected salary, availability, and preferred language. Shortlist candidates who match your hiring requirements.",
    sourceType: "guide",
    persona: "employer",
    keywords: ["shortlist", "candidates", "dashboard"],
  },
  {
    id: "employer-guide-interview",
    path: "/employer-guide",
    title: "Employer Guide",
    sectionHeading: "Schedule Interviews",
    content:
      "After shortlisting, schedule interviews by sharing the interview date, time, location, and contact person details. Candidates can receive interview updates through WhatsApp.",
    sourceType: "guide",
    persona: "employer",
    keywords: ["interview", "schedule"],
  },
  {
    id: "employer-guide-track",
    path: "/employer-guide",
    title: "Employer Guide",
    sectionHeading: "Track Hiring Progress",
    content:
      "Use the employer dashboard to track applications, shortlisted candidates, interviews scheduled, selected candidates, and closed job posts.",
    sourceType: "guide",
    persona: "employer",
    keywords: ["dashboard", "track", "applications", "hiring"],
  },
  {
    id: "post-a-job-page",
    path: "/post-a-job",
    title: "Post a Job",
    sectionHeading: "Post Jobs Easily",
    content:
      "Employers can post jobs on AsliJobs by sharing important details such as job title, location, salary, work timings, number of openings, experience required, skills needed, benefits, and interview details.",
    sourceType: "guide",
    persona: "employer",
    keywords: ["post a job", "post job", "employer"],
  },
  {
    id: "privacy-intro",
    path: "/privacy-policy",
    title: "Privacy Policy",
    sectionHeading: "Privacy Policy",
    content:
      "AsliJobs respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how AsliJobs collects, uses, stores, shares, protects, and processes personal data when you use our website, WhatsApp-based job services, employer dashboard, admin-supported services, job alerts, video profile features, support channels, promotional services, and any other services offered by AsliJobs.",
    sourceType: "policy",
    persona: "general",
    keywords: ["privacy", "policy", "personal data", "data"],
  },
  {
    id: "privacy-about",
    path: "/privacy-policy",
    title: "Privacy Policy",
    sectionHeading: "About AsliJobs",
    content:
      "AsliJobs is a WhatsApp-based job portal designed to connect India’s blue-collar and entry-level workforce with employers. We help job seekers discover nearby job opportunities, apply for jobs, receive interview updates, communicate in preferred languages, and connect with employers through simple and familiar digital channels such as WhatsApp.",
    sourceType: "policy",
    persona: "general",
    keywords: ["privacy", "aslijobs", "whatsapp"],
  },
  {
    id: "privacy-scope",
    path: "/privacy-policy",
    title: "Privacy Policy",
    sectionHeading: "Scope of this Privacy Policy",
    content:
      "This Privacy Policy applies to all users of AsliJobs, including job seekers, employers, recruiters, business representatives, visitors, support users, and any person who interacts with AsliJobs through WhatsApp, website, dashboard, social media, forms, campaigns, or other supported channels.",
    sourceType: "policy",
    persona: "general",
    keywords: ["privacy", "scope", "policy"],
  },
  {
    id: "contact-page",
    path: "/contact",
    title: "Contact Us",
    sectionHeading: "Contact AsliJobs",
    content: `You can contact AsliJobs support through WhatsApp, phone, or email. Public contact email: ${OFFICIAL_PUBLIC_CONTACT.email}. Public phone: ${OFFICIAL_PUBLIC_CONTACT.phone}. For more help, visit the Help Center or FAQs on the AsliJobs website.`,
    sourceType: "contact",
    persona: "general",
    keywords: ["contact", "support", "email", "phone", "whatsapp", "help"],
  },
  {
    id: "help-center",
    path: "/help-center",
    title: "Help Center",
    sectionHeading: "Help Center",
    content:
      "The AsliJobs Help Center covers common questions about job search, employer hiring, WhatsApp alerts, safety, account help, and support. Visit the Help Center or FAQs on the website for detailed guides, or contact AsliJobs support through WhatsApp, phone, or email.",
    sourceType: "help",
    persona: "general",
    keywords: ["help", "center", "support", "faq"],
  },
  {
    id: "guidelines",
    path: "/guidelines",
    title: "Guidelines",
    sectionHeading: "Community Guidelines",
    content:
      "AsliJobs guidelines explain expected behaviour for job seekers and employers on the platform, including safe hiring practices, honest job posts, and reporting suspicious activity. Read the full Guidelines page on the AsliJobs website.",
    sourceType: "policy",
    persona: "general",
    keywords: ["guidelines", "rules", "safety"],
  },
  {
    id: "terms",
    path: "/terms-and-conditions",
    title: "Terms & Conditions",
    sectionHeading: "Terms & Conditions",
    content:
      "The Terms & Conditions page explains the rules for using AsliJobs website and WhatsApp services for job seekers and employers. Read the full Terms & Conditions on the AsliJobs website for complete legal terms.",
    sourceType: "policy",
    persona: "general",
    keywords: ["terms", "conditions", "legal"],
  },
  {
    id: "employer-login-info",
    path: "/employer-login-info",
    title: "Employer Login",
    sectionHeading: "Employer Login",
    content:
      "Employers can sign in through the Employer Login page on the AsliJobs website to access the employer dashboard, post jobs, and manage applications.",
    sourceType: "guide",
    persona: "employer",
    keywords: ["employer", "login", "sign in", "dashboard"],
  },
  {
    id: "find-jobs-page",
    path: "/find-jobs",
    title: "Find Jobs",
    sectionHeading: "Find Jobs",
    content:
      "Job seekers can browse and search jobs on AsliJobs by city, state, and job category, or ask the WhatsApp bot for jobs by sharing a role and location.",
    sourceType: "guide",
    persona: "seeker",
    keywords: ["find jobs", "browse", "search"],
  },
];
