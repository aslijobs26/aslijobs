/**
 * Generates Excel inventories for AsliJobs documentation.
 * Read-only relative to application source — writes only under docs/project-documentation/generated.
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(__dirname, "../../backend/package.json"));
const ExcelJS = require("exceljs");
const outDir = join(__dirname, "generated");
mkdirSync(outDir, { recursive: true });

async function writeWorkbook(filename, sheetName, columns, rows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AsliJobs Documentation Generator";
  const sheet = wb.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ ...c, width: c.width ?? 24 }));
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    sheet.addRow(row);
  }
  const path = join(outDir, filename);
  await wb.xlsx.writeFile(path);
  console.log("Wrote", path);
}

const pages = [
  ["Public", "/", "Home / Landing", "Marketing"],
  ["Public", "/jobs", "Job search", "Discovery"],
  ["Public", "/jobs/[jobId]", "Public job detail", "Discovery"],
  ["Public", "/post-job", "Create job wizard", "Employer entry"],
  ["Public", "/post-job/[jobId]", "Edit job wizard", "Employer entry"],
  ["Public", "/post-job/success", "Job posted success", "Employer entry"],
  ["Public", "/resources", "Resources", "Content"],
  ["Public", "/faqs", "FAQs", "Content"],
  ["Public", "/help-center", "Help center", "Content"],
  ["Public", "/guidelines", "Guidelines", "Legal/Content"],
  ["Public", "/privacy-policy", "Privacy policy", "Legal"],
  ["Public", "/terms-and-conditions", "Terms", "Legal"],
  ["Public", "/login", "Redirect → /employer/login", "Legacy"],
  ["Employer Auth", "/employer/login", "Employer OTP login", "Auth"],
  ["Employer Auth", "/employer/register", "Employer registration", "Auth"],
  ["Employer Auth", "/employer/member-login", "Redirect → team-member login", "Auth"],
  ["Team", "/team-member/login", "Team member password login", "Auth"],
  ["Team", "/team/accept-invitation", "Accept team invitation", "Auth"],
  ["Employer", "/employer/dashboard", "Dashboard", "Workspace"],
  ["Employer", "/employer/jobs", "Jobs list", "Jobs"],
  ["Employer", "/employer/candidates", "Candidates", "Hiring"],
  ["Employer", "/employer/candidates/[applicationId]", "Candidate detail", "Hiring"],
  ["Employer", "/employer/saved-candidates", "Saved / shortlisted", "Hiring"],
  ["Employer", "/employer/interviews", "Interviews", "Hiring"],
  ["Employer", "/employer/messages", "Messages", "Comms"],
  ["Employer", "/employer/notifications", "Notifications", "Comms"],
  ["Employer", "/employer/company-profile", "Company profile", "Profile"],
  ["Employer", "/employer/team-management", "Team management", "Team"],
  ["Employer", "/employer/team-management/departments/[departmentId]", "Department detail", "Team"],
  ["Employer", "/employer/team-management/members/[memberId]", "Member detail", "Team"],
  ["Employer", "/employer/team-management/roles/[roleId]", "Role detail", "Team"],
  ["Employer", "/employer/team-member/profile", "Team member self profile", "Team"],
  ["Employer", "/employer/settings", "Settings", "Settings"],
  ["Employer", "/employer/help-center", "Help center", "Content"],
  ["Employer", "/employer/campaigns", "Campaigns (UI; no API mount)", "Placeholder UI"],
  ["Employer", "/employer/analytics", "Analytics (UI)", "Placeholder UI"],
  ["Employer", "/employer/reports", "Reports (UI)", "Placeholder UI"],
  ["Employer", "/employer/subscription", "Subscription (UI; no API mount)", "Placeholder UI"],
  ["Employer", "/employer/unauthorized", "Unauthorized", "RBAC"],
  ["Job Seeker Auth", "/job-seeker/login", "OTP login", "Auth"],
  ["Job Seeker Auth", "/job-seeker/register", "Registration", "Auth"],
  ["Job Seeker Auth", "/job-seeker/application-success", "Apply success", "Hiring"],
  ["Job Seeker", "/job-seeker/dashboard", "Dashboard", "Workspace"],
  ["Job Seeker", "/job-seeker/profile", "Profile", "Profile"],
  ["Job Seeker", "/job-seeker/my-resume", "My resume", "Resume"],
  ["Job Seeker", "/job-seeker/applied-jobs", "Applied jobs", "Hiring"],
  ["Job Seeker", "/job-seeker/applied-jobs/[applicationId]", "Application detail", "Hiring"],
  ["Job Seeker", "/job-seeker/saved-jobs", "Saved jobs", "Hiring"],
  ["Job Seeker", "/job-seeker/notifications", "Notifications", "Comms"],
  ["Job Seeker", "/job-seeker/settings", "Settings", "Settings"],
  ["Admin", "/", "Admin HomePage only", "Stub"],
];

const apis = [
  ["health", "GET", "/api/v1/health", "None", "Health check"],
  ["auth", "POST", "/api/v1/auth/workspace/refresh", "Refresh token", "Refresh workspace JWT"],
  ["auth", "POST", "/api/v1/auth/workspace/logout", "Refresh token", "Logout workspace"],
  ["auth", "POST", "/api/v1/auth/job-seeker/refresh", "Refresh token", "Refresh seeker JWT"],
  ["auth", "POST", "/api/v1/auth/job-seeker/logout", "Refresh token", "Logout seeker"],
  ["employers", "POST", "/api/v1/employers/login/send-otp", "Public", "Send login OTP"],
  ["employers", "POST", "/api/v1/employers/login/resend-otp", "Public", "Resend login OTP"],
  ["employers", "POST", "/api/v1/employers/login/verify-otp", "Public", "Verify login OTP"],
  ["employers", "GET", "/api/v1/employers/me", "Workspace JWT", "Get employer profile"],
  ["employers", "PATCH", "/api/v1/employers/me/profile", "company_profile.update", "Update profile"],
  ["employers", "POST", "/api/v1/employers/register", "Public", "Start registration"],
  ["employers", "POST", "/api/v1/employers/:employerId/otp/resend", "Continuation", "Resend reg OTP"],
  ["employers", "POST", "/api/v1/employers/:employerId/otp/verify", "Continuation", "Verify reg OTP"],
  ["employers", "POST", "/api/v1/employers/:employerId/company-profile", "Continuation+upload", "Company profile step"],
  ["employers", "POST", "/api/v1/employers/:employerId/identity-document", "Continuation+upload", "Identity document"],
  ["jobs", "GET", "/api/v1/jobs/public", "Optional seeker", "List public jobs"],
  ["jobs", "GET", "/api/v1/jobs/public/:publicJobId", "Optional seeker", "Public job detail"],
  ["jobs", "GET", "/api/v1/jobs/public/:publicJobId/similar", "Optional seeker", "Similar jobs"],
  ["jobs", "POST", "/api/v1/jobs", "jobs.create", "Create job"],
  ["jobs", "POST", "/api/v1/jobs/draft", "jobs.create", "Create draft"],
  ["jobs", "GET", "/api/v1/jobs/mine", "jobs.read", "List employer jobs"],
  ["jobs", "GET", "/api/v1/jobs/mine/stats", "jobs.read", "Job stats"],
  ["jobs", "POST", "/api/v1/jobs/bulk-delete", "jobs.delete", "Bulk cascade delete"],
  ["jobs", "GET", "/api/v1/jobs/:jobId", "jobs.read", "Get owned job"],
  ["jobs", "PUT", "/api/v1/jobs/:jobId", "jobs.update", "Update active job"],
  ["jobs", "PATCH", "/api/v1/jobs/:jobId/draft", "jobs.update", "Update draft"],
  ["jobs", "PUT", "/api/v1/jobs/:jobId/publish", "jobs.update", "Publish draft"],
  ["jobs", "PATCH", "/api/v1/jobs/:jobId/status", "jobs.update", "Status action"],
  ["jobs", "DELETE", "/api/v1/jobs/:jobId", "jobs.delete", "Cascade delete"],
  ["jobseekers", "POST", "/api/v1/jobseekers/login/send-otp", "Public", "Send OTP"],
  ["jobseekers", "POST", "/api/v1/jobseekers/login/verify-otp", "Public", "Verify OTP"],
  ["jobseekers", "GET", "/api/v1/jobseekers/me", "Seeker JWT", "Get profile"],
  ["jobseekers", "PATCH", "/api/v1/jobseekers/me", "Seeker JWT", "Update profile"],
  ["jobseekers", "POST", "/api/v1/jobseekers/me/photo", "Seeker JWT", "Upload photo"],
  ["jobseekers", "DELETE", "/api/v1/jobseekers/me/photo", "Seeker JWT", "Delete photo"],
  ["jobseekers", "POST", "/api/v1/jobseekers/register", "Public", "Register"],
  ["jobseekers", "POST", "/api/v1/jobseekers/register/verify-otp", "Public", "Verify reg OTP"],
  ["jobseekers", "POST", "/api/v1/jobseekers/register/preferences", "Registration", "Preferences"],
  ["jobseekers", "POST", "/api/v1/jobseekers/register/complete", "Registration", "Complete"],
  ["resumes", "GET", "/api/v1/resumes/me", "Seeker JWT", "Get resume"],
  ["resumes", "POST", "/api/v1/resumes/me/regenerate", "Seeker JWT", "Regenerate"],
  ["resumes", "GET", "/api/v1/resumes/me/pdf", "Seeker JWT", "PDF"],
  ["applications", "POST", "/api/v1/applications/apply", "Seeker JWT", "Apply"],
  ["applications", "GET", "/api/v1/applications/me", "Seeker JWT", "My applications"],
  ["applications", "GET", "/api/v1/applications/me/stats", "Seeker JWT", "My stats"],
  ["applications", "POST", "/api/v1/applications/me/:applicationId/withdraw", "Seeker JWT", "Withdraw"],
  ["applications", "GET", "/api/v1/applications/employer", "candidates.read", "List candidates"],
  ["applications", "GET", "/api/v1/applications/employer/stats", "candidates.read", "Candidate stats"],
  ["applications", "PATCH", "/api/v1/applications/employer/:applicationId/status", "candidates.update", "Status"],
  ["applications", "POST", "/api/v1/applications/employer/:applicationId/shortlist", "candidates.update", "Shortlist"],
  ["applications", "PATCH", "/api/v1/applications/employer/:applicationId/interview", "interviews.create|update", "Schedule interview"],
  ["applications", "PATCH", "/api/v1/applications/employer/:applicationId/interview/cancel", "interviews.update", "Cancel interview"],
  ["applications", "GET", "/api/v1/applications/employer/interviews", "interviews.read", "List interviews"],
  ["applications", "POST", "/api/v1/applications/employer/export", "candidates.export", "Export candidates"],
  ["saved-jobs", "GET", "/api/v1/saved-jobs/me", "Seeker JWT", "List saved jobs"],
  ["saved-jobs", "POST", "/api/v1/saved-jobs/me", "Seeker JWT", "Save job"],
  ["saved-jobs", "DELETE", "/api/v1/saved-jobs/me/:publicJobId", "Seeker JWT", "Unsave"],
  ["saved-candidates", "GET", "/api/v1/saved-candidates", "Employer", "List saved candidates"],
  ["saved-candidates", "POST", "/api/v1/saved-candidates", "Employer", "Save candidate"],
  ["saved-candidates", "POST", "/api/v1/saved-candidates/export", "Employer", "Export"],
  ["notifications", "GET", "/api/v1/notifications/me", "Seeker|Employer", "Inbox"],
  ["notifications", "GET", "/api/v1/notifications/me/conversations", "messages.read", "Message threads"],
  ["notifications", "GET", "/api/v1/notifications/me/conversations/:applicationId/timeline", "messages.read", "Timeline"],
  ["team", "POST", "/api/v1/team/auth/login", "Public", "Team login"],
  ["team", "GET", "/api/v1/team/rbac/session", "Workspace JWT", "RBAC session"],
  ["team", "GET", "/api/v1/team/members", "team_management.read", "List members"],
  ["team", "POST", "/api/v1/team/members/invite", "team_management.create", "Invite"],
  ["team", "GET", "/api/v1/team/roles", "team_management.read", "List roles"],
  ["team", "GET", "/api/v1/team/departments", "team_management.read", "List departments"],
  ["team", "GET", "/api/v1/team/invitations/preview", "Public", "Preview invite"],
  ["team", "POST", "/api/v1/team/invitations/accept", "Public", "Accept invite"],
];

const features = [
  ["Public Website", "Landing hero & CTAs", "Implemented", "/"],
  ["Public Website", "Job search & filters", "Implemented", "/jobs"],
  ["Public Website", "Job detail & apply CTA", "Implemented", "/jobs/[jobId]"],
  ["Public Website", "Legal & help pages", "Implemented", "/privacy-policy etc."],
  ["Public Website", "Resources / FAQs / Guidelines", "Implemented", "Content pages"],
  ["Employer", "WhatsApp OTP auth", "Implemented", "/employer/login"],
  ["Employer", "Registration + documents", "Implemented", "/employer/register"],
  ["Employer", "Dashboard metrics", "Implemented", "/employer/dashboard"],
  ["Employer", "Jobs CRUD + cascade delete", "Implemented", "/employer/jobs"],
  ["Employer", "Post job wizard", "Implemented", "/post-job"],
  ["Employer", "Candidates pipeline", "Implemented", "/employer/candidates"],
  ["Employer", "Shortlist / saved candidates", "Implemented", "/employer/saved-candidates"],
  ["Employer", "Interviews list/calendar", "Implemented", "/employer/interviews"],
  ["Employer", "Messages (notification threads)", "Implemented", "/employer/messages"],
  ["Employer", "Notifications inbox", "Implemented", "/employer/notifications"],
  ["Employer", "Company profile", "Implemented", "/employer/company-profile"],
  ["Employer", "Team RBAC / departments / roles", "Implemented", "/employer/team-management"],
  ["Employer", "Candidate export Excel", "Implemented", "API export"],
  ["Employer", "Campaigns page", "UI only — no API mount", "/employer/campaigns"],
  ["Employer", "Subscription page", "UI only — no API mount", "/employer/subscription"],
  ["Job Seeker", "WhatsApp OTP auth", "Implemented", "/job-seeker/login"],
  ["Job Seeker", "Registration + preferences", "Implemented", "/job-seeker/register"],
  ["Job Seeker", "Profile + photo", "Implemented", "/job-seeker/profile"],
  ["Job Seeker", "Resume generate/PDF", "Implemented", "/job-seeker/my-resume"],
  ["Job Seeker", "Apply / withdraw", "Implemented", "applications API"],
  ["Job Seeker", "Applied jobs", "Implemented", "/job-seeker/applied-jobs"],
  ["Job Seeker", "Saved jobs", "Implemented", "/job-seeker/saved-jobs"],
  ["Job Seeker", "Notifications", "Implemented", "/job-seeker/notifications"],
  ["Team", "Invite + accept + login", "Implemented", "team APIs"],
  ["Admin", "Role types defined", "Stub app (home only)", "admin/"],
  ["Shared", "Design tokens (CSS @theme)", "Implemented", "globals.css"],
  ["Shared", "TanStack Query caching", "Implemented", "QueryProvider"],
  ["Integrations", "Cloudinary / local storage", "Implemented", "STORAGE_PROVIDER"],
  ["Integrations", "Resend invitations", "Implemented", "EMAIL_FROM"],
  ["Integrations", "WhatsApp OTP", "Optional via OTP_PROVIDER", "whatsapp module"],
];

await writeWorkbook(
  "AsliJobs_Page_List.xlsx",
  "Pages",
  [
    { header: "Area", key: 0, width: 18 },
    { header: "Route", key: 1, width: 48 },
    { header: "Title / Purpose", key: 2, width: 36 },
    { header: "Category", key: 3, width: 18 },
  ],
  pages,
);

await writeWorkbook(
  "AsliJobs_API_List.xlsx",
  "APIs",
  [
    { header: "Module", key: 0, width: 18 },
    { header: "Method", key: 1, width: 10 },
    { header: "Path", key: 2, width: 64 },
    { header: "Auth / Permission", key: 3, width: 28 },
    { header: "Description", key: 4, width: 32 },
  ],
  apis,
);

await writeWorkbook(
  "AsliJobs_Feature_List.xlsx",
  "Features",
  [
    { header: "Module", key: 0, width: 18 },
    { header: "Feature", key: 1, width: 40 },
    { header: "Status", key: 2, width: 28 },
    { header: "Reference", key: 3, width: 32 },
  ],
  features,
);

console.log("Page rows:", pages.length, "API rows:", apis.length, "Feature rows:", features.length);
