import { pagesStep, replayStep, seekerSidebarStep } from "./tour-steps";
import type { ProductTourDefinition, ProductTourStep } from "./types";

function seekerModuleStep(
  id: string,
  title: string,
  description: string,
): ProductTourStep {
  return { target: `seeker-nav-${id}`, title, description, side: "right" };
}

export const JOB_SEEKER_CORE_TOURS: readonly ProductTourDefinition[] = [
  {
    id: "seeker-workspace-v2",
    label: "Profile",
    autoStart: true,
    routes: [{ path: "/job-seeker/profile", match: "exact" }],
    steps: [
      {
        target: "seeker-profile-header",
        title: "Your profile",
        description:
          "Your name, job role and key details such as location and WhatsApp number. Employers see your profile when you apply.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-profile-photo",
        title: "Profile photo",
        description:
          "Use the camera button to upload a JPG, PNG or WEBP photo. When a photo is set, the bin button removes it.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-profile-strength",
        title: "Profile strength",
        description:
          "Shows how complete your profile is. Improve profile opens the Preferences tab.",
        side: "bottom",
        align: "end",
      },
      {
        target: "seeker-profile-tabs",
        title: "Profile sections",
        description:
          "Switch between Overview, Experience, Education, Skills, Documents, Preferences and Activity. Take the tour again on another tab to see its sections.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-profile-about",
        title: "About me",
        description:
          "Your professional summary. Edit opens a short form to update it.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-profile-snapshot",
        title: "At a glance",
        description:
          "Your current role, total experience, location and expected salary. Anything missing shows Not set.",
        side: "top",
        align: "start",
      },
      {
        target: "seeker-profile-latest-experience",
        title: "Latest experience",
        description:
          "Your most recent job. Add or change jobs on the Experience tab.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-profile-top-skills",
        title: "Top skills",
        description:
          "Your main skills. Manage opens your skills list so you can add or remove them.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-profile-ai-insights",
        title: "AI profile insights",
        description:
          "AI suggestions for your profile and resume are coming soon. Explore shows a notice for now.",
        side: "top",
        align: "start",
      },
      {
        target: "seeker-profile-experience-toolbar",
        title: "Work experience",
        description:
          "Shows how many jobs you have added. Add experience opens a form for a new job.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-profile-experience-first",
        title: "Edit a job",
        description:
          "Edit changes this job's details. Delete removes it from your profile straight away.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-profile-education-actions",
        title: "Education actions",
        description:
          "Add education when none is saved. Once added, Edit changes it and Remove clears it.",
        side: "bottom",
        align: "end",
      },
      {
        target: "seeker-profile-education",
        title: "Education",
        description: "Your highest qualification, institution and passing year.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-profile-skills",
        title: "Skills",
        description:
          "All the skills on your profile. Edit skills lets you add or remove them.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-profile-documents",
        title: "Resume",
        description:
          "Your resume status and last update. Open builder goes to My Resume, Download PDF saves a copy and Regenerate rebuilds it from your profile.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-profile-preferences",
        title: "Career preferences",
        description:
          "Your target role, job type, work mode, preferred location, expected salary and availability. Edit updates them.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-profile-languages-contact",
        title: "Languages and contact",
        description:
          "The languages you speak and your WhatsApp number, marked when it is verified for sign-in.",
        side: "top",
        align: "start",
      },
      {
        target: "seeker-profile-activity-applied",
        title: "Recently applied",
        description:
          "Your latest applications with their status. Select one to go to My Applications.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-profile-activity-saved",
        title: "Saved jobs",
        description: "Your latest saved jobs. Select one to open the job.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-profile-activity-notifications",
        title: "Notifications",
        description:
          "Your latest notifications, with a link to view all of them.",
        side: "top",
        align: "start",
      },
      {
        target: "seeker-profile-edit-actions",
        title: "Edit profile",
        description:
          "Edit Profile opens your personal details. The menu button has shortcuts to My Resume, My Applications, Saved Jobs and Settings.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-profile-completion",
        title: "Profile completion",
        description:
          "How much of your profile is filled in, with a progress bar and checklist below.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-profile-checklist-first",
        title: "Completion checklist",
        description:
          "Each item is marked Done or Pending. Select one to open the form for that part of your profile.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-profile-quick-actions",
        title: "Quick actions",
        description:
          "Resume Builder and Upload Resume take you to My Resume. Career Preferences opens your preferences form.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-browse-jobs",
        title: "Browse Jobs",
        description:
          "Opens job search, where you can find roles, save them and apply.",
        side: "bottom",
        align: "end",
      },
      {
        target: "seeker-bell",
        title: "Notification bell",
        description:
          "Shows how many updates are unread. Open it to see recent notifications or view them all.",
        side: "bottom",
        align: "end",
      },
      seekerSidebarStep("profile", "Profile"),
      seekerModuleStep(
        "applied-jobs",
        "My Applications",
        "My Applications lists every job you have applied for, with its current status.",
      ),
      seekerModuleStep(
        "my-resume",
        "My Resume",
        "My Resume shows the resume built from your profile and lets you upload your own.",
      ),
      seekerModuleStep(
        "notifications",
        "Notifications",
        "Notifications collects updates about your applications, interviews and offers.",
      ),
      seekerModuleStep(
        "saved-jobs",
        "Saved Jobs",
        "Saved Jobs keeps the jobs you saved so you can apply when you are ready.",
      ),
      seekerModuleStep(
        "help-support",
        "Help & Support",
        "Help & Support has answers to common questions and ways to contact AsliJobs.",
      ),
      seekerModuleStep(
        "settings",
        "Account Settings",
        "Account Settings is where you manage your account and preferences.",
      ),
      replayStep,
    ],
  },
  {
    id: "seeker-applications-v2",
    label: "My Applications",
    autoStart: true,
    routes: [{ path: "/job-seeker/applied-jobs", match: "exact" }],
    steps: [
      {
        target: "seeker-applications-header",
        title: "My Applications",
        description:
          "Every job you have applied for is listed here with its latest hiring status.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-applications-status",
        title: "Filter by status",
        description:
          "Show all applications or only those that are Applied, Under Review, Shortlisted, Interview, Offer, Rejected or Withdrawn. Each pill shows its count.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-applications-search",
        title: "Search",
        description: "Find an application by job title or company name.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-applications-filters",
        title: "Filters",
        description:
          "Narrow the list by location, company, job type, work mode, shift, applied dates or minimum salary. A badge shows how many filters are on.",
        side: "bottom",
        align: "end",
      },
      {
        target: "seeker-applications-sort",
        title: "Sort",
        description:
          "Order applications by newest or oldest applied, recently updated, salary or company name.",
        side: "bottom",
        align: "end",
      },
      {
        target: "seeker-applications-first-card",
        title: "Application card",
        description:
          "Each card shows the job, company, Job ID, salary and location. Select a card to open the full application.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-applications-first-status",
        title: "Current status",
        description:
          "Where this application stands, with a related date such as when you applied or when your interview is.",
        side: "bottom",
        align: "end",
      },
      {
        target: "seeker-applications-empty",
        title: "Nothing to show",
        description:
          "When no applications match, try another search, status or filter. If you have not applied yet, Browse Jobs opens job search.",
        side: "top",
        align: "start",
      },
      pagesStep("seeker-applications-pagination", "applications"),
      {
        target: "seeker-applications-reminders",
        title: "Asli AI Reminders",
        description:
          "Your latest application, interview and offer updates, one per application. View All opens Notifications.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-applications-whatsapp",
        title: "WhatsApp support",
        description:
          "Opens a WhatsApp chat with AsliJobs for help with your applications.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-applications-overview",
        title: "Application overview",
        description:
          "Counts of your applications by status, plus a success rate based on offers and selections out of all applications.",
        side: "left",
        align: "start",
      },
      seekerSidebarStep("applied-jobs", "My Applications"),
      replayStep,
    ],
  },
  {
    id: "seeker-application-detail",
    label: "Application",
    autoStart: true,
    routes: [{ path: "/job-seeker/applied-jobs/:applicationId", match: "pattern" }],
    steps: [
      {
        target: "seeker-application-back",
        title: "Back to the list",
        description: "Return to all your applications.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-application-summary",
        title: "Job summary",
        description:
          "The job title, company, location and salary for this application.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-application-status",
        title: "Current status",
        description: "Where your application stands right now.",
        side: "bottom",
        align: "end",
      },
      {
        target: "seeker-application-actions",
        title: "Actions",
        description:
          "View Job opens the posting. Depending on the status you may also see interview, offer or feedback links, and Withdraw Application while withdrawing is still allowed.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-application-timeline",
        title: "Timeline",
        description:
          "Every status change with its date and who made it: you, the employer or the system.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-application-interview",
        title: "Interview details",
        description:
          "When an interview is set, its date, time, mode, interviewer and meeting link or venue appear here.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-application-offer",
        title: "Offer details",
        description:
          "Your offer date, joining date, package and notes. If you have not answered yet, you can accept or decline the offer here.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-application-rejection",
        title: "Rejection reason",
        description: "The reason the employer gave, when they shared one.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-application-employer-notes",
        title: "Employer notes",
        description: "Notes the employer shared with you about this application.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-application-resume",
        title: "Resume used",
        description:
          "The resume you sent with this application, kept as it was when you applied.",
        side: "top",
        align: "start",
      },
      {
        target: "seeker-application-info",
        title: "Application info",
        description:
          "Job ID, applied date, resume and version, work mode and job type. View job posting opens the job.",
        side: "left",
        align: "start",
      },
      {
        ...seekerSidebarStep("applied-jobs", "My Applications"),
        description:
          "My Applications in the sidebar takes you back to all your applications.",
      },
      replayStep,
    ],
  },
  {
    id: "seeker-resume-v2",
    label: "My Resume",
    autoStart: true,
    routes: [{ path: "/job-seeker/my-resume", match: "exact" }],
    steps: [
      {
        target: "seeker-resume-header",
        title: "My Resume",
        description:
          "Your resume generated from your profile, with when it was generated and last updated. You can also upload your own resume.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-resume-status",
        title: "Resume status",
        description:
          "Shows whether your resume is Ready, Outdated, Regenerating, Failed or Not generated.",
        side: "bottom",
        align: "end",
      },
      {
        target: "seeker-resume-generate",
        title: "Generate your resume",
        description:
          "No resume yet. Generate Resume builds one from your saved profile.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-resume-failed",
        title: "Generation failed",
        description:
          "Something went wrong while building your resume. Retry Generation tries again.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-resume-preview",
        title: "Resume preview",
        description:
          "Your AsliJobs resume as employers will read it, starting with your name, headline and contact line.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-resume-default",
        title: "AsliJobs Resume",
        description:
          "Select Use for Applications to send this resume by default when you apply.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-resume-actions",
        title: "Resume actions",
        description:
          "Preview, edit, download as PDF or print your resume. Regenerate rebuilds it from your latest profile.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-resume-metadata",
        title: "Resume details",
        description:
          "Version, generated and updated times, profile completion, generation source and template.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-resume-uploaded",
        title: "My Uploaded Resume",
        description:
          "Upload a PDF, DOC or DOCX to apply with your own CV. Once uploaded, you can make it the default, download, replace or delete it.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-resume-notice",
        title: "Needs attention",
        description:
          "When your resume is outdated or generation failed, this note tells you to regenerate it.",
        side: "left",
        align: "start",
      },
      seekerSidebarStep("my-resume", "My Resume"),
      replayStep,
    ],
  },
  {
    id: "seeker-saved-jobs-v2",
    label: "Saved Jobs",
    autoStart: true,
    routes: [{ path: "/job-seeker/saved-jobs", match: "exact" }],
    steps: [
      {
        target: "seeker-saved-header",
        title: "Saved Jobs",
        description:
          "Jobs you saved while browsing are kept here so you can come back and apply.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-saved-tabs",
        title: "Saved job tabs",
        description:
          "Switch between All Saved, Recent, High Match, Applied and Expired. Each tab shows its count.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-saved-filters-toggle",
        title: "Filters",
        description:
          "Show or hide the saved job filters. A badge shows how many are on.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-saved-sort",
        title: "Sort",
        description:
          "Order saved jobs by recently saved, newest, oldest, salary, company name or highest match.",
        side: "bottom",
        align: "end",
      },
      {
        target: "seeker-saved-search",
        title: "Search",
        description: "Search saved jobs by title, company, location or skills.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-saved-first-card",
        title: "Saved job card",
        description:
          "Each card shows the job, company, location, experience, job type, salary and when you saved it. Select the title to open the job.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-saved-first-actions",
        title: "Card actions",
        description:
          "The bookmark button removes the job from Saved Jobs. The menu button lets you view, apply for or share the job.",
        side: "bottom",
        align: "end",
      },
      {
        target: "seeker-saved-first-apply",
        title: "Apply",
        description:
          "Apply Now checks that your profile is complete and may ask which resume to send. It shows Applied or Expired when you can no longer apply.",
        side: "top",
        align: "end",
      },
      {
        target: "seeker-saved-empty",
        title: "Nothing to show",
        description:
          "When no saved jobs match, this area is empty. Browse Jobs opens job search so you can save more roles.",
        side: "top",
        align: "start",
      },
      pagesStep("seeker-saved-pagination", "saved jobs"),
      {
        target: "seeker-saved-filters",
        title: "Filter saved jobs",
        description:
          "Filter by location, salary, job type, work mode and schedule, with more options under More Filters. Changes apply right away, and Clear All resets them.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-saved-ask-ai",
        title: "Ask Asli AI",
        description:
          "Asking Asli AI for better jobs than the ones you saved is coming soon.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-saved-alerts",
        title: "Job alerts",
        description: "Alerts for similar jobs and salary drops are coming soon.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-saved-overview",
        title: "Saved jobs overview",
        description:
          "Totals for saved, applied, high match and recent jobs. View Report opens My Applications.",
        side: "left",
        align: "start",
      },
      seekerSidebarStep("saved-jobs", "Saved Jobs"),
      replayStep,
    ],
  },
];
