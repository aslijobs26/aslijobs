# AsliJobs — Job Seeker Module Documentation

**App:** `frontend/` job-seeker routes + public apply flows  
**Workspace layout:** `job-seeker/(workspace)/layout.tsx` → `JobSeekerDashboardLayout` + `JobSeekerAuthGuard`  
**Auth storage:** `aslijobs_jobseeker_access_token`, `aslijobs_jobseeker_refresh_token`

---

## 1. Authentication & onboarding

| Page | Route | Purpose |
|------|-------|---------|
| Login | `/job-seeker/login` | WhatsApp OTP login |
| Register | `/job-seeker/register` | Registration + OTP + preferences + complete |
| Application success | `/job-seeker/application-success` | Post-apply confirmation |

**APIs:** `/api/v1/jobseekers/login/*`, `/api/v1/jobseekers/register*`, `/api/v1/auth/job-seeker/*`

---

## 2. Workspace pages

### Dashboard — `/job-seeker/dashboard`

| Item | Detail |
|------|--------|
| Purpose | Seeker home overview |
| Components | `DashboardHomeContent` / job-seeker dashboard components |
| APIs | Profile, applications stats, notifications unread |

### Profile — `/job-seeker/profile`

| Item | Detail |
|------|--------|
| Purpose | View/edit profile, photo, preferences dialogs |
| APIs | `GET/PATCH /jobseekers/me`, photo upload/delete |
| Features | Profile strength UI, edit modals, sidebar |

### My Resume — `/job-seeker/my-resume`

| Item | Detail |
|------|--------|
| Purpose | Resume preview, regenerate, PDF |
| APIs | `/resumes/me`, regenerate, PDF |
| Features | Print styles (`.resume-print-root`) |

### Applied Jobs — `/job-seeker/applied-jobs`, `/job-seeker/applied-jobs/[applicationId]`

| Item | Detail |
|------|--------|
| Purpose | Application list + detail; withdraw |
| APIs | `/applications/me*`, withdraw |
| Search / filters / sort / pagination | Yes (AppliedJobs filters panel/sidebar) |

### Saved Jobs — `/job-seeker/saved-jobs`

| Item | Detail |
|------|--------|
| Purpose | Bookmarked jobs |
| APIs | `/saved-jobs/me*` |
| Features | Stats, ids, sort/select, unsave |

### Notifications — `/job-seeker/notifications`

| Item | Detail |
|------|--------|
| Purpose | Seeker inbox |
| APIs | `/notifications/me*` |

### Settings — `/job-seeker/settings`

| Item | Detail |
|------|--------|
| Purpose | Seeker settings surface |

---

## 3. Public discovery & apply (shared with public site)

| Page | Route | Purpose |
|------|-------|---------|
| Find jobs | `/jobs` | Search, filters, pagination, mobile sheets |
| Job detail | `/jobs/[jobId]` | Public job; apply CTA when authenticated |
| Home | `/` | Landing hero, categories, resources, employer carousel |

**APIs:** `GET /jobs/public*`, `POST /applications/apply` (auth), saved-jobs for bookmarking

Optional job seeker JWT on public job routes enables applied-state awareness (`optionalJobSeekerAuth`).

---

## 4. Workflows

### Registration
Register → OTP → Preferences → Complete → Login/session

### Apply
Browse/search → Job detail → Apply (requires resume) → Application success → Track in Applied Jobs

### Withdraw
Applied job detail → Withdraw (when status allows)

### Save job
Job card/detail → Save → Manage in Saved Jobs

---

## 5. What is not a separate seeker page

| Concept | Where it lives |
|---------|----------------|
| Messages | No dedicated seeker messages page; notifications inbox covers alerts |
| Career documents beyond resume | Resume module + profile fields |
| Companies directory page | No `/companies` page; employer logos on home carousel |

---

## 6. Navigation chrome

| Component | Role |
|-----------|------|
| `JobSeekerSidebar` | Workspace nav + logo |
| `JobSeekerTopBar` | Top bar |
| `FloatingBottomNav` | Mobile nav (public + authenticated items) |
| Site `Navbar` | Public header with seeker login/register CTAs |
