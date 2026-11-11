import { employerSidebarStep, pagesStep, replayStep } from "./tour-steps";
import type { ProductTourDefinition } from "./types";

export const EMPLOYER_ENGAGEMENT_TOURS: readonly ProductTourDefinition[] = [
  {
    id: "employer-interviews-v2",
    label: "Interviews",
    autoStart: true,
    routes: [{ path: "/employer/interviews", match: "exact" }],
    steps: [
      {
        target: "employer-interviews-header",
        title: "Interviews",
        description:
          "Track, filter and manage the interviews scheduled for candidates on your jobs.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-interviews-view-toggle",
        title: "List or calendar",
        description:
          "Switch between List View and Calendar View. Take the tour again after switching to see the parts of the other view.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-interviews-schedule",
        title: "Schedule an interview",
        description:
          "Schedule Interview lets you select a candidate and book their interview. It appears when you can create interviews.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-interviews-kpis",
        title: "Interview summary",
        description:
          "Counts of today's interviews, this week's interviews, and scheduled and completed interviews.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-interviews-job-select",
        title: "Filter by job",
        description:
          "Show interviews for one job, or All Jobs. Each job shows how many interviews it has.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-interviews-search",
        title: "Search interviews",
        description: "Search by candidate, job or interviewer.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-interviews-filters-toggle",
        title: "Show filters",
        description:
          "Open the filters to narrow interviews by date, status, mode or interviewer.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-interviews-filters",
        title: "Filters",
        description:
          "Narrow interviews by quick date, status, interview mode, interviewer or a date range. Clear resets them.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-interviews-calendar-nav",
        title: "Move through the calendar",
        description:
          "Use the arrows to go back or forward, or Today to jump to the current date. Select an interview to open the candidate's interview details.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-interviews-calendar-modes",
        title: "Calendar range",
        description: "Choose how much of the calendar to show at once.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-interviews-table-head",
        title: "Interview list",
        description:
          "Each row shows the candidate, job, interview date and time, interview type, interviewer and status.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-interviews-sort",
        title: "Sort by date",
        description:
          "Select this heading to switch between earliest and latest interviews first.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-interviews-first-row",
        title: "Open a candidate",
        description:
          "Select a row to open that candidate's details without leaving this page.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-interviews-first-row-actions",
        title: "Interview actions",
        description:
          "Open the menu to open the candidate or mark an open interview as completed. If you can update interviews, you can also edit, reschedule or cancel it here.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-interviews-empty",
        title: "No interviews yet",
        description:
          "This appears when no interviews match the selected job and filters. If you can create interviews, you can schedule one from here.",
        side: "bottom",
        align: "start",
      },
      pagesStep("employer-interviews-pagination", "interviews"),
      {
        target: "employer-interviews-today",
        title: "Today's schedule",
        description:
          "Today's interviews in time order. Select one to open the candidate's interview details. When there are some, View All Interviews lists just today's.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-interviews-status-overview",
        title: "Status overview",
        description:
          "How your interviews split across scheduled, completed, rescheduled and cancelled. Pick a time period to change the range.",
        side: "left",
        align: "start",
      },
      employerSidebarStep("interviews", "Interviews"),
      replayStep,
    ],
  },
  {
    id: "employer-messages-v2",
    label: "Messages",
    autoStart: true,
    routes: [{ path: "/employer/messages", match: "exact" }],
    steps: [
      {
        target: "employer-messages-header",
        title: "Messages",
        description:
          "Hiring notifications for each candidate application, grouped into conversations. This is notification history, not a live chat.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-messages-export",
        title: "Export CSV",
        description:
          "If you can export messages, download your Messages history as a CSV file for the view and filters you have applied.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-messages-filters-toggle",
        title: "Filters",
        description:
          "Open the filters to narrow conversations by job, candidate, status, date and more.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-messages-stats",
        title: "Conversation summary",
        description:
          "Totals for all conversations, unread conversations, active hiring and interview events in the last seven days. When filters are on, the first two also show how many match.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-messages-tabs",
        title: "Conversation views",
        description:
          "Switch between all conversations, unread, starred and archived ones.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-messages-search",
        title: "Search conversations",
        description:
          "Find a conversation by candidate name, phone number or application ID.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-messages-categories",
        title: "Notification categories",
        description:
          "Show only application, interview, offer or status notifications.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-messages-bulk",
        title: "Select several",
        description:
          "Select lets you pick several conversations and mark them as read or unread together.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-messages-first-conversation",
        title: "Conversations",
        description:
          "Each conversation shows the candidate, job, latest notification and unread count. Open one to see its history; opening it marks it as read.",
        side: "right",
        align: "start",
      },
      {
        target: "employer-messages-list-empty",
        title: "No conversations",
        description:
          "Application activity for your jobs appears here as notifications. If filters are on, try clearing them.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-messages-load-more",
        title: "Load more",
        description: "Load older conversations when there are more to show.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-messages-thread-empty",
        title: "Conversation history",
        description:
          "Select a conversation to see its notification history here.",
        side: "left",
        align: "center",
      },
      {
        target: "employer-messages-conversation-header",
        title: "Open conversation",
        description:
          "Shows who and which job the open conversation is about. Candidate conversations also show the application status.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-messages-conversation-actions",
        title: "Conversation actions",
        description:
          "Call the candidate when a phone number is available. More actions lists what your role allows, such as opening the profile or resume, scheduling an interview, marking as unread, and starring, archiving or muting.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-messages-latest-message",
        title: "Notification history",
        description:
          "Each notification for this application appears in date order, with the newest at the bottom.",
        side: "top",
        align: "center",
      },
      {
        target: "employer-messages-thread-footer",
        title: "History only",
        description:
          "You cannot send replies here. Notes also appear here when a conversation is muted or archived.",
        side: "top",
        align: "center",
      },
      {
        target: "employer-messages-filters",
        title: "Filters",
        description:
          "Narrow conversations by job, candidate, category, hiring, interview or offer status, date, unread, actions and conversation type. Clear All resets them.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-messages-filters-apply",
        title: "Apply filters",
        description: "Filter changes take effect when you select Apply Filters.",
        side: "left",
        align: "end",
      },
      employerSidebarStep("messages", "Messages"),
      replayStep,
    ],
  },
  {
    id: "employer-notifications",
    label: "Notifications",
    autoStart: true,
    routes: [{ path: "/employer/notifications", match: "exact" }],
    steps: [
      {
        target: "employer-notifications-header",
        title: "Notifications",
        description:
          "Updates about applications, interviews and offers for your account.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-notifications-clear-all",
        title: "Clear all",
        description:
          "Remove every notification from this inbox after you confirm. Conversation history in Messages is not affected.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-notifications-mark-all-read",
        title: "Mark all as read",
        description:
          "Mark every unread notification as read. It is available when you have unread notifications.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-notifications-search",
        title: "Search notifications",
        description: "Type to search your notifications.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-notifications-read-filters",
        title: "Read status",
        description: "Show all notifications, only unread ones or only read ones.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-notifications-categories",
        title: "Categories",
        description:
          "Show only application, interview, offer or system notifications.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-notifications-first-row",
        title: "A notification",
        description:
          "Each notification shows what happened and when. Unread ones are highlighted.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-notifications-first-row-actions",
        title: "Notification actions",
        description:
          "View details marks it as read and opens the related page when there is one. You can also mark it as read or delete it.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-notifications-empty",
        title: "No notifications",
        description:
          "Updates about your hiring activity appear here. If filters are on, try changing them.",
        side: "bottom",
        align: "start",
      },
      pagesStep("employer-notifications-pagination", "notifications"),
      {
        target: "employer-bell",
        title: "Notification bell",
        description:
          "The bell shows your recent notifications and links to this page.",
        side: "bottom",
        align: "end",
      },
      replayStep,
    ],
  },
];
