import { pagesStep, replayStep, seekerSidebarStep } from "./tour-steps";
import type { ProductTourDefinition } from "./types";

export const JOB_SEEKER_MORE_TOURS: readonly ProductTourDefinition[] = [
  {
    id: "seeker-notifications-v2",
    label: "Notifications",
    autoStart: true,
    routes: [{ path: "/job-seeker/notifications", match: "exact" }],
    steps: [
      {
        target: "seeker-notifications-header",
        title: "Your notifications",
        description:
          "Updates about your applications, interviews and offers are collected on this page.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-notifications-bulk-actions",
        title: "Clear all or mark all as read",
        description:
          "Mark all as read clears every unread marker. Clear all removes every notification from your inbox after you confirm, and cannot be undone.",
        side: "bottom",
        align: "end",
      },
      {
        target: "seeker-notifications-search",
        title: "Search notifications",
        description: "Type a word to find matching notifications.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-notifications-read-filter",
        title: "All, unread or read",
        description: "Show every notification, only unread ones, or only ones you have already read.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-notifications-category-filter",
        title: "Filter by type",
        description:
          "Narrow the list to application, interview, offer or system notifications.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-notifications-first-item",
        title: "A notification",
        description:
          "Each notification shows its title, message and when it arrived. A dot next to the title means it is unread.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-notifications-first-item-actions",
        title: "View details or delete",
        description:
          "View details marks the notification as read and opens the related page, when there is one. Delete removes just this notification.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-notifications-empty",
        title: "Nothing here yet",
        description:
          "When there are no notifications, or none match your search and filters, this message appears instead of the list.",
        side: "bottom",
        align: "start",
      },
      pagesStep("seeker-notifications-pagination", "notifications"),
      {
        target: "seeker-notifications-summary",
        title: "Notification summary",
        description:
          "See how many notifications you have in total, how many are unread, and how many there are of each type.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-notifications-preferences",
        title: "Notification preferences",
        description:
          "Manage Preferences opens the Notifications section of your account settings.",
        side: "left",
        align: "start",
      },
      seekerSidebarStep("notifications", "Notifications"),
      replayStep,
    ],
  },
  {
    id: "seeker-settings-v2",
    label: "Account Settings",
    autoStart: true,
    routes: [{ path: "/job-seeker/settings", match: "exact" }],
    steps: [
      {
        target: "seeker-settings-header",
        title: "Account settings",
        description:
          "Manage your account, preferences and privacy settings from this page.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-settings-nav",
        title: "Settings sections",
        description:
          "Switch between Account, Preferences, Privacy & Security, Notifications, Language and Connected Apps. Take the tour again on another section to learn about it.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-settings-account-profile",
        title: "Your account",
        description:
          "Your name, WhatsApp number and verification status. Edit Profile and the camera button take you to your profile.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-settings-account-details",
        title: "Account details",
        description:
          "Your personal and job details are listed here. Rows with an arrow open your profile so you can change them.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-settings-deactivate",
        title: "Deactivate account",
        description:
          "Deactivate Account opens a window explaining what deactivation means. Deactivation is not available online yet, so contact support if you need it.",
        side: "top",
        align: "end",
      },
      {
        target: "seeker-settings-profile-strength",
        title: "Profile strength",
        description:
          "Shows how complete your profile is. Complete profile takes you there to fill in what is missing.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-settings-quick-settings",
        title: "Quick settings",
        description:
          "Shortcuts to edit your profile and your address details.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-settings-security-card",
        title: "Account security",
        description:
          "Shows when you last signed in. Manage Security Settings opens the Privacy & Security section.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-settings-clear-cache",
        title: "Clear cache",
        description:
          "Clears temporary data saved for your account in this browser and reloads your details.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-settings-job-preferences",
        title: "Job preferences",
        description:
          "The role, job type, work mode, location and salary used to match you with jobs. Edit preferences opens your profile to change them.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-settings-app-preferences",
        title: "App preferences",
        description:
          "Turn display and recommendation options on or off. Changes save as soon as you switch them and apply on this device.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-settings-security",
        title: "Account security",
        description:
          "You sign in with a WhatsApp OTP, so there is no password to manage. Your last sign-in time is shown here.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-settings-visibility",
        title: "Profile visibility",
        description:
          "Choose whether employers can see your profile, only recruiters reviewing your applications can, or it stays private.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-settings-legal",
        title: "Privacy & legal",
        description: "Read the AsliJobs Privacy Policy and Terms & Conditions.",
        side: "top",
        align: "start",
      },
      {
        target: "seeker-settings-session",
        title: "Sign out or deactivate",
        description:
          "Sign out ends your session after you confirm. Deactivate Account explains deactivation; it is not available online yet.",
        side: "top",
        align: "start",
      },
      {
        target: "seeker-settings-inbox",
        title: "In-app notifications",
        description:
          "Manage your notification inbox here. Open inbox goes to your Notifications page.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-settings-inbox-actions",
        title: "Unread notifications",
        description:
          "See how many notifications are unread, mark them all as read, or clear the inbox after you confirm.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-settings-retention",
        title: "Retention policy",
        description:
          "How long unread and read notifications stay in your inbox.",
        side: "top",
        align: "start",
      },
      {
        target: "seeker-settings-language",
        title: "Language",
        description:
          "Pick your preferred language. Your choice is saved as soon as you select it.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-settings-connected-apps",
        title: "Connected apps",
        description:
          "Shows whether your WhatsApp number is connected. It is used for OTP sign-in and important updates.",
        side: "bottom",
        align: "start",
      },
      seekerSidebarStep("settings", "Account Settings"),
      replayStep,
    ],
  },
  {
    id: "seeker-help-support",
    label: "Help & Support",
    autoStart: true,
    routes: [{ path: "/job-seeker/help-support", match: "exact" }],
    steps: [
      {
        target: "seeker-help-header",
        title: "Help & Support",
        description:
          "Find answers to common questions and ways to reach the support team.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-help-search",
        title: "Search help",
        description:
          "Type a question to search help articles. Press Escape to clear the search.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-help-search-results",
        title: "Search results",
        description: "Matching articles appear here. Select a question to read its answer.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-help-topics",
        title: "Popular topics",
        description:
          "Common questions are grouped by topic. View All Articles opens the full Help Center.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-help-first-topic",
        title: "Browse a topic",
        description:
          "Select a topic to list its articles below. Select it again to close them.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-help-topic-articles",
        title: "Topic articles",
        description:
          "Select a question to read its answer. The close button hides this list.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-help-faq",
        title: "Frequently asked questions",
        description: "Quick answers to the questions job seekers ask most.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-help-first-faq",
        title: "Open an answer",
        description: "Select a question to show its answer. Select it again to hide it.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-help-all-faqs",
        title: "All FAQs",
        description: "View All FAQs opens the full list of frequently asked questions.",
        side: "top",
        align: "start",
      },
      {
        target: "seeker-help-contact",
        title: "Contact support",
        description:
          "Chat with support on WhatsApp, email the support team, or call during the support hours shown.",
        side: "top",
        align: "start",
      },
      {
        target: "seeker-help-ai-assistant",
        title: "AI Help Assistant",
        description:
          "Chat with Asli AI is coming soon, so this button is not active yet.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-help-tickets",
        title: "Support tickets",
        description:
          "Ticket support is not live yet. These links open the Contact page so you can reach the team.",
        side: "left",
        align: "start",
      },
      {
        target: "seeker-help-social",
        title: "Connect with us",
        description:
          "Follow AsliJobs on social media for updates and career tips. Links open in a new tab.",
        side: "left",
        align: "start",
      },
      seekerSidebarStep("help-support", "Help & Support"),
      replayStep,
    ],
  },
];

export const JOB_SEARCH_PAGE_TOURS: readonly ProductTourDefinition[] = [
  {
    id: "seeker-job-search-v2",
    label: "Job Search",
    autoStart: true,
    routes: [{ path: "/jobs", match: "exact" }],
    steps: [
      {
        target: "job-search-bar",
        title: "Search jobs",
        description:
          "Search by job title or keyword, then pick a state and city. Clear all resets your search and filters.",
        side: "bottom",
        align: "start",
      },
      {
        target: "job-search-filters",
        title: "Filters",
        description:
          "Narrow the results by location, experience, salary, job type and more.",
        side: "right",
        align: "start",
      },
      {
        target: "job-search-filter-within",
        title: "Search within results",
        description: "Type a word to narrow the jobs you already found.",
        side: "right",
        align: "start",
      },
      {
        target: "job-search-filter-location",
        title: "Location",
        description:
          "After you pick a state in the search bar, choose one or more cities in it. Select a heading to collapse or expand its filter.",
        side: "right",
        align: "start",
      },
      {
        target: "job-search-filter-experience",
        title: "Experience",
        description: "Pick the experience levels you want, from fresher upward.",
        side: "right",
        align: "start",
      },
      {
        target: "job-search-filter-salary",
        title: "Salary range",
        description: "Drag the sliders to set the salary range you want.",
        side: "right",
        align: "start",
      },
      {
        target: "job-search-filter-job-type",
        title: "Job type",
        description: "Choose the kinds of employment you are looking for.",
        side: "right",
        align: "start",
      },
      {
        target: "job-search-filter-gender",
        title: "Gender preference",
        description: "Filter by the gender preference the employer set for the job.",
        side: "right",
        align: "start",
      },
      {
        target: "job-search-filter-work-mode",
        title: "Work mode",
        description: "Choose the work modes that suit you.",
        side: "right",
        align: "start",
      },
      {
        target: "job-search-more-filters",
        title: "More filters",
        description: "Show or hide the work mode filter.",
        side: "right",
        align: "start",
      },
      {
        target: "job-search-active-filters",
        title: "Active filters",
        description: "Each filter you apply is shown here. Tap one to remove it.",
        side: "bottom",
        align: "start",
      },
      {
        target: "job-search-results-count",
        title: "Jobs found",
        description:
          "How many jobs match your search, and where, when you have chosen a location.",
        side: "bottom",
        align: "start",
      },
      {
        target: "job-search-sort",
        title: "Sort",
        description: "Order the jobs by relevance, newest first, or salary.",
        side: "bottom",
        align: "end",
      },
      {
        target: "job-search-whatsapp",
        title: "Jobs on WhatsApp",
        description: "Join Now opens WhatsApp so you can get new job openings there.",
        side: "bottom",
        align: "start",
      },
      {
        target: "job-search-results",
        title: "Job results",
        description:
          "Each card shows the role, company, location, salary and key details. Select a card to see the full job.",
        side: "bottom",
        align: "start",
      },
      {
        target: "job-search-first-card-save",
        title: "Save a job",
        description:
          "Save keeps the job in your Saved Jobs. If you are not signed in as a job seeker, you are asked to sign in first.",
        side: "bottom",
        align: "end",
      },
      {
        target: "job-search-first-card-details",
        title: "View details",
        description:
          "Opens the full job. On wide screens it appears beside the list; on smaller screens it opens on its own page.",
        side: "bottom",
        align: "start",
      },
      {
        target: "job-search-first-card-apply",
        title: "Apply",
        description:
          "Apply Now sends your application. If you are not signed in, it asks you to sign in first, and it asks you to finish your profile or choose a resume when needed.",
        side: "bottom",
        align: "end",
      },
      {
        target: "job-search-empty",
        title: "No jobs found",
        description:
          "When nothing matches, Clear Filters resets your search and filters so you can see more roles.",
        side: "bottom",
        align: "start",
      },
      {
        target: "job-search-overview-header",
        title: "Job details",
        description:
          "The job you selected appears here with its title, company and when it was posted.",
        side: "left",
        align: "start",
      },
      {
        target: "job-search-overview-quick-actions",
        title: "Share or save",
        description:
          "Share copies the job link and opens your device's share options when available. Save works the same as on the card.",
        side: "bottom",
        align: "end",
      },
      {
        target: "job-search-overview-summary",
        title: "Key details",
        description:
          "Salary, location, job type, experience and other details the employer provided.",
        side: "left",
        align: "start",
      },
      {
        target: "job-search-overview-description",
        title: "Job description",
        description: "Read what the role involves. Scroll this panel to see the rest of the job.",
        side: "left",
        align: "start",
      },
      {
        target: "job-search-overview-address",
        title: "Address",
        description: "Where the job is located.",
        side: "left",
        align: "start",
      },
      {
        target: "job-search-overview-walk-in",
        title: "Walk-in details",
        description: "For walk-in jobs, the interview address, dates and times.",
        side: "left",
        align: "start",
      },
      {
        target: "job-search-overview-instructions",
        title: "Other instructions",
        description: "Any extra instructions from the employer.",
        side: "left",
        align: "start",
      },
      {
        target: "job-search-overview-recruiter",
        title: "Recruiter",
        description: "Contact details for the recruiter, when the employer shares them.",
        side: "left",
        align: "start",
      },
      {
        target: "job-search-overview-actions",
        title: "Apply, share or save",
        description:
          "Apply Now works the same as on the card: you are asked to sign in first if you are not signed in. You can also share or save the job here.",
        side: "top",
        align: "start",
      },
      pagesStep("job-search-pagination", "jobs"),
      replayStep,
    ],
  },
];
