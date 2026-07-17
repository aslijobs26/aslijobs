import type { LegalDocumentMeta, LegalSection } from "@/types/legal";

export const GUIDELINES_DOCUMENT_META: LegalDocumentMeta = {
  title: "Guidelines",
  effectiveDate: "2nd July",
  lastUpdated: "2nd July",
};

export const GUIDELINES_SECTIONS: LegalSection[] = [
  {
    id: "introduction",
    navLabel: "Introduction",
    title: "Introduction",
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs is built to make job search and hiring simple, genuine, and accessible for India’s blue-collar and entry-level workforce. These guidelines are created to help job seekers, employers, recruiters, admins, and support teams use the platform responsibly and safely.",
      },
      {
        type: "paragraph",
        text: "The purpose of these guidelines is to maintain trust, reduce fake job activity, improve communication, support regional language users, and create a reliable hiring experience for everyone using AsliJobs through WhatsApp, website, dashboard, or any other official channel.",
      },
      {
        type: "paragraph",
        text: "All users are expected to follow these guidelines while using AsliJobs.",
      },
    ],
  },
  {
    id: "general-platform-guidelines",
    navLabel: "General Platform Guidelines",
    title: "General Platform Guidelines",
    blocks: [
      {
        type: "paragraph",
        text: "Users must provide correct, genuine, and updated information while using AsliJobs. Fake profiles, misleading details, duplicate accounts, false job posts, spam activity, abusive communication, or misuse of the platform are not allowed.",
      },
      {
        type: "paragraph",
        text: "AsliJobs should be used only for genuine job search, hiring, job posting, application tracking, interview coordination, candidate communication, and related employment purposes.",
      },
      {
        type: "paragraph",
        text: "Users must communicate respectfully with each other. Any form of abusive language, harassment, discrimination, threats, fraud, or inappropriate behaviour may lead to account restriction, job post removal, or permanent suspension from the platform.",
      },
      {
        type: "paragraph",
        text: "AsliJobs may review, verify, approve, reject, edit, pause, remove, or restrict any profile, job post, video profile, transcript, campaign, or message that violates platform rules or affects user safety.",
      },
    ],
  },
  {
    id: "job-seeker-guidelines",
    navLabel: "Job Seeker Guidelines",
    title: "Job Seeker Guidelines",
    blocks: [
      {
        type: "paragraph",
        text: "Job seekers should share accurate personal and professional information such as name, mobile number, location, preferred language, job category, skills, experience, salary expectation, availability, and preferred work area.",
      },
      {
        type: "paragraph",
        text: "Job seekers should apply only for jobs they are genuinely interested in and available to attend. They should carefully read the job location, salary, timing, responsibilities, experience requirements, and interview details before applying.",
      },
      {
        type: "paragraph",
        text: "Once shortlisted, job seekers should respond to interview messages on time. If they cannot attend an interview, they should inform AsliJobs or the employer in advance.",
      },
      {
        type: "paragraph",
        text: "Job seekers should not share false experience, fake documents, misleading video profiles, incorrect location details, or wrong availability information.",
      },
      {
        type: "paragraph",
        text: "Job seekers should not pay money to unknown persons, fake agents, or suspicious employers for job confirmation. If anyone asks for payment, deposit, registration fee, training fee, or any suspicious amount, the job seeker should report it to AsliJobs immediately.",
      },
      {
        type: "paragraph",
        text: "Job seekers should use respectful language while communicating with employers, admins, or support teams.",
      },
    ],
  },
  {
    id: "employer-guidelines",
    navLabel: "Employer Guidelines",
    title: "Employer Guidelines",
    blocks: [
      {
        type: "paragraph",
        text: "Employers must post only genuine job openings with correct and complete information. Every job post should clearly mention the job title, company name, work location, salary range, job role, working hours, experience required, number of openings, benefits, and interview process.",
      },
      {
        type: "paragraph",
        text: "Employers must not post fake jobs, misleading salary details, incorrect locations, unclear work conditions, illegal job offers, commission-only jobs disguised as salary jobs, or jobs that involve unsafe or unlawful work.",
      },
      {
        type: "paragraph",
        text: "Employers must communicate professionally with candidates. They should not harass, mislead, abuse, threaten, discriminate against, or exploit any job seeker.",
      },
      {
        type: "paragraph",
        text: "Employers should update the status of applications, shortlisted candidates, interviews, selections, rejections, and job closures on time.",
      },
      {
        type: "paragraph",
        text: "Employers must use candidate information only for hiring purposes. Candidate phone numbers, profiles, videos, transcripts, and personal details should not be shared, sold, misused, or used for unrelated marketing.",
      },
      {
        type: "paragraph",
        text: "Employers must inform AsliJobs if a position is filled, paused, cancelled, or no longer available.",
      },
    ],
  },
  {
    id: "job-posting-guidelines",
    navLabel: "Job Posting Guidelines",
    title: "Job Posting Guidelines",
    blocks: [
      {
        type: "paragraph",
        text: "Every job post on AsliJobs should be clear, truthful, and easy to understand. A good job post should include all important details that help a job seeker make the right decision.",
      },
      {
        type: "paragraph",
        text: "A job post should include the job title, company or employer name, salary range, work location, area or locality, working hours, experience requirement, language preference, benefits, interview location, and joining requirement.",
      },
      {
        type: "paragraph",
        text: "Job posts should not contain false claims, exaggerated salary promises, incomplete details, spam links, offensive language, discriminatory requirements, or misleading information.",
      },
      {
        type: "paragraph",
        text: "AsliJobs may reject or ask for changes in job posts that are unclear, incomplete, suspicious, unsafe, misleading, or not suitable for the platform.",
      },
    ],
  },
  {
    id: "whatsapp-communication-guidelines",
    navLabel: "WhatsApp Communication Guidelines",
    title: "WhatsApp Communication Guidelines",
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs uses WhatsApp to make job search and hiring easier. Users may receive job alerts, application updates, interview reminders, employer responses, support messages, and other service-related communication through WhatsApp.",
      },
      {
        type: "paragraph",
        text: "Users should reply clearly to WhatsApp messages and avoid sending spam, repeated unrelated messages, abusive content, or false information.",
      },
      {
        type: "paragraph",
        text: "Job seekers should use the correct options while applying for jobs, confirming interviews, updating profile details, or asking for support.",
      },
      {
        type: "paragraph",
        text: "Employers should ensure that WhatsApp communication related to hiring is professional, clear, and relevant.",
      },
      {
        type: "paragraph",
        text: "AsliJobs may use automated messages, admin replies, templates, and support responses to improve communication.",
      },
    ],
  },
  {
    id: "regional-language-guidelines",
    navLabel: "Regional Language Guidelines",
    title: "Regional Language Guidelines",
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs supports regional language communication to make the platform easier for users across India. Users may choose their preferred language for job alerts, support messages, interview updates, and other communication.",
      },
      {
        type: "paragraph",
        text: "Users should select the language they are most comfortable with so that AsliJobs can communicate clearly.",
      },
      {
        type: "paragraph",
        text: "Employers should keep job descriptions simple and easy to translate. They should avoid complicated words, unclear terms, or confusing salary details.",
      },
      {
        type: "paragraph",
        text: "AsliJobs may translate job posts, candidate details, support messages, transcripts, or communication content for user convenience. Translations should be used as support content, and users may ask for clarification if something is unclear.",
      },
    ],
  },
  {
    id: "video-profile-guidelines",
    navLabel: "Video Profile Guidelines",
    title: "Video Profile Guidelines",
    blocks: [
      {
        type: "paragraph",
        text: "Job seekers may be allowed to upload video profiles to introduce themselves, explain their work experience, or showcase their skills. Video profiles should be clear, respectful, and related to employment.",
      },
      {
        type: "paragraph",
        text: "The candidate should speak about their name, location, experience, job preference, skills, availability, and expected role.",
      },
      {
        type: "paragraph",
        text: "Video profiles should not contain abusive language, false claims, unrelated content, personal attacks, political content, religious hate, adult content, unsafe behaviour, or misleading information.",
      },
      {
        type: "paragraph",
        text: "Candidates should upload only their own video. Impersonation or uploading someone else’s video is not allowed.",
      },
      {
        type: "paragraph",
        text: "AsliJobs may review, approve, reject, hide, or remove video profiles that do not follow platform guidelines.",
      },
    ],
  },
  {
    id: "transcript-guidelines",
    navLabel: "Transcript Guidelines",
    title: "Transcript Guidelines",
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs may generate transcripts from candidate video profiles to make the content accessible to employers, admins, and users who prefer reading instead of watching videos.",
      },
      {
        type: "paragraph",
        text: "Transcripts may be generated in the original language and may also be translated into other supported languages.",
      },
      {
        type: "paragraph",
        text: "Users should understand that transcripts and translations may sometimes have small errors due to pronunciation, accent, audio quality, background noise, or language differences.",
      },
      {
        type: "paragraph",
        text: "Candidates may request correction if their transcript contains important mistakes.",
      },
      {
        type: "paragraph",
        text: "Employers should use transcripts only for hiring-related understanding and should not misuse or share them outside the hiring process.",
      },
    ],
  },
  {
    id: "application-and-interview-guidelines",
    navLabel: "Application and Interview Guidelines",
    title: "Application and Interview Guidelines",
    blocks: [
      {
        type: "paragraph",
        text: "Job seekers should apply only to suitable jobs and should avoid applying randomly to every job without checking details.",
      },
      {
        type: "paragraph",
        text: "Employers should review applications within a reasonable time and update candidates or AsliJobs regarding shortlisting, rejection, interview scheduling, selection, or closure.",
      },
      {
        type: "paragraph",
        text: "Once an interview is scheduled, both job seekers and employers should respect the confirmed time and location. If an interview is cancelled, delayed, or rescheduled, the concerned party should inform AsliJobs or the other party as early as possible.",
      },
      {
        type: "paragraph",
        text: "Repeated no-shows, fake interview scheduling, or careless application behaviour may affect platform access.",
      },
    ],
  },
  {
    id: "promotion-guidelines",
    navLabel: "Promotion Guidelines",
    title: "Promotion Guidelines",
    blocks: [
      {
        type: "paragraph",
        text: "Employers may use AsliJobs promotional services to highlight job posts, urgent hiring requirements, locality-based campaigns, language-based campaigns, or employer visibility.",
      },
      {
        type: "paragraph",
        text: "All promotions must be truthful, clear, and based on genuine hiring requirements. Promotions should not include fake urgency, misleading salary details, exaggerated promises, false benefits, spam content, or unverified job claims.",
      },
      {
        type: "paragraph",
        text: "Every promotion may go through a multi-factor approval process before being published. This may include marketing review, operations review, language review, compliance review, and final admin approval.",
      },
      {
        type: "paragraph",
        text: "AsliJobs may reject, pause, edit, or remove any promotion that does not meet platform standards.",
      },
    ],
  },
  {
    id: "support-guidelines",
    navLabel: "Support Guidelines",
    title: "Support Guidelines",
    blocks: [
      {
        type: "paragraph",
        text: "Users can contact AsliJobs support for help with job applications, employer issues, interview updates, fake job complaints, profile updates, language support, video profile issues, transcript corrections, payment issues, or promotion-related concerns.",
      },
      {
        type: "paragraph",
        text: "Users should explain their issue clearly and provide the required details such as mobile number, job title, employer name, application status, screenshot, or message reference where applicable.",
      },
      {
        type: "paragraph",
        text: "Support requests should not contain abusive language, spam, false complaints, or repeated unrelated messages.",
      },
      {
        type: "paragraph",
        text: "AsliJobs will make reasonable efforts to review and resolve support issues based on priority and available information.",
      },
    ],
  },
  {
    id: "safety-guidelines",
    navLabel: "Safety Guidelines",
    title: "Safety Guidelines",
    blocks: [
      {
        type: "paragraph",
        text: "Job seekers should be careful while attending interviews or joining jobs. They should verify important details such as company name, location, salary, job role, work timing, and reporting person before proceeding.",
      },
      {
        type: "paragraph",
        text: "Job seekers should avoid sharing sensitive personal information unless necessary for genuine hiring purposes.",
      },
      {
        type: "paragraph",
        text: "Users should immediately report suspicious employers, fake jobs, payment demands, unsafe interview locations, abusive communication, or misleading job offers.",
      },
      {
        type: "paragraph",
        text: "Employers must provide safe, lawful, and respectful work opportunities. Any job post or employer activity that appears unsafe, illegal, misleading, or exploitative may be removed from AsliJobs.",
      },
    ],
  },
  {
    id: "admin-and-operations-guidelines",
    navLabel: "Admin and Operations Guidelines",
    title: "Admin and Operations Guidelines",
    blocks: [
      {
        type: "paragraph",
        text: "The AsliJobs admin and operations team should review employer profiles, job posts, candidate issues, support tickets, promotions, video profiles, transcripts, and platform activity regularly.",
      },
      {
        type: "paragraph",
        text: "Admins should ensure that job posts are clear, genuine, and complete before approval.",
      },
      {
        type: "paragraph",
        text: "Operations teams should monitor pending applications, employer response delays, interview updates, joining confirmations, support complaints, and suspicious activity.",
      },
      {
        type: "paragraph",
        text: "Support teams should handle user queries respectfully and try to resolve issues in the user’s preferred language wherever possible.",
      },
      {
        type: "paragraph",
        text: "Marketing teams should ensure that promotions are accurate, approved, and not misleading before publishing.",
      },
      {
        type: "paragraph",
        text: "All internal teams should use platform data responsibly and only for official AsliJobs work.",
      },
    ],
  },
  {
    id: "content-removal-and-account-restriction",
    navLabel: "Content Removal and Account Restriction",
    title: "Content Removal and Account Restriction",
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs may remove content, reject job posts, hide video profiles, restrict accounts, pause employer access, or suspend users if any guideline is violated.",
      },
      {
        type: "paragraph",
        text: "Reasons for restriction may include fake information, misleading job posts, spam, abusive communication, repeated complaints, suspicious activity, payment fraud, candidate data misuse, unsafe job offers, or violation of platform policies.",
      },
      {
        type: "paragraph",
        text: "AsliJobs may also take action based on user complaints, admin review, verification failure, legal requirements, or safety concerns.",
      },
    ],
  },
  {
    id: "reporting-violations",
    navLabel: "Reporting Violations",
    title: "Reporting Violations",
    blocks: [
      {
        type: "paragraph",
        text: "Users should report any violation of these guidelines to AsliJobs support. This includes fake jobs, misleading salary details, suspicious payment requests, employer misconduct, candidate misconduct, spam, abusive language, false profiles, unsafe interview locations, or misuse of personal data.",
      },
      {
        type: "paragraph",
        text: "Reports may be reviewed by the AsliJobs team, and necessary action may be taken based on available information.",
      },
    ],
  },
  {
    id: "final-note",
    navLabel: "Final Note",
    title: "Final Note",
    blocks: [
      {
        type: "paragraph",
        text: "AsliJobs is created to make job search and hiring easier, safer, and more accessible for India’s workforce. These guidelines help maintain a platform where job seekers can find genuine opportunities and employers can connect with suitable candidates in a simple, respectful, and reliable way.",
      },
      {
        type: "paragraph",
        text: "By using AsliJobs, every user plays a role in keeping the platform trustworthy, helpful, and workforce-friendly.",
      },
    ],
  },
];
