# AsliJobs — Employer Module Documentation

**App:** `frontend/` employer routes + `backend/` employer-scoped APIs  
**Layout:** `employer/(workspace)/layout.tsx` → `EmployerDashboardLayout` + `EmployerAuthGuard`  
**RBAC modules:** dashboard, jobs, candidates, interviews, messages, campaigns, reports, subscription, company_profile, team_management, settings

---

## 1. Authentication & entry

| Page | Route | Purpose | Auth |
|------|-------|---------|------|
| Employer Login | `/employer/login` | WhatsApp OTP login | Public |
| Employer Register | `/employer/register` | Multi-step registration + company docs | Public |
| Member login redirect | `/employer/member-login` | Redirects to `/team-member/login` | — |
| Team Member Login | `/team-member/login` | Email/password → workspace session | Public |
| Accept Invitation | `/team/accept-invitation` | Set password from invite token | Public |
| Unauthorized | `/employer/unauthorized` | RBAC denial UX | Session |

**APIs:** `/api/v1/employers/login/*`, `/api/v1/employers/register*`, `/api/v1/team/auth/login`, invitation endpoints, `/api/v1/auth/workspace/*`

**Client storage:** `aslijobs_employer_access_token`, `aslijobs_employer_refresh_token`

---

## 2. Workspace pages

### Dashboard — `/employer/dashboard`

| Item | Detail |
|------|--------|
| Purpose | Hiring overview: stats, recent jobs, funnel, notifications, profile completion |
| Components | `EmployerDashboardHome`, dashboard-home cards |
| APIs | Job stats, application stats, notifications, growth/funnel helpers |
| Permissions | `dashboard.read` (and related module reads for widgets) |
| Features | Delete job from recent list (cascade), metric cards |

### Jobs — `/employer/jobs`

| Item | Detail |
|------|--------|
| Purpose | Manage job posts |
| Components | `EmployerJobsPageContent`, table, filters, bulk toolbar, bulk delete modal, preview modal |
| APIs | `GET /jobs/mine`, stats, status patch, delete, bulk-delete |
| Permissions | `jobs.read`; mutations need create/update/delete |
| Search / filters | Title/role/location search; status tabs; advanced filters (type, salary, city, dates, …) |
| Pagination | Page size options (10/20/50) |
| CRUD | Create via `/post-job`; edit active/draft; status actions; cascade delete + orphan heal |

### Post / Edit Job — `/post-job`, `/post-job/[jobId]`, `/post-job/success`

| Item | Detail |
|------|--------|
| Purpose | Multi-step job wizard (outside workspace chrome) |
| APIs | create, draft, publish, update |
| Permissions | `jobs.create` / `jobs.update` |

### Candidates — `/employer/candidates`, `/employer/candidates/[applicationId]`

| Item | Detail |
|------|--------|
| Purpose | Application pipeline list + detail |
| Components | `EmployerCandidatesPageContent`, list/detail panels, export modal, interview editor |
| APIs | `/applications/employer*`, shortlist, notes, status, hiring, interview |
| Permissions | `candidates.*`, `interviews.*` as applicable |
| Search / filters / sort / pagination | Yes (list params) |
| Export | Preview + Excel export endpoints |

### Saved / Shortlisted Candidates — `/employer/saved-candidates`

| Item | Detail |
|------|--------|
| Purpose | Saved candidates; shortlisted filter (`applicationStatus=shortlisted`) |
| APIs | `/saved-candidates*` |
| Features | Priority/tags/notes modals, export, stats |

### Interviews — `/employer/interviews`

| Item | Detail |
|------|--------|
| Purpose | Interview list, stats, calendar views |
| APIs | `/applications/employer/interviews`, interview patch/cancel |
| Permissions | `interviews.read/create/update` |
| Note | Data stored on Application documents |

### Messages — `/employer/messages`

| Item | Detail |
|------|--------|
| Purpose | Conversations grouped by application notifications |
| APIs | `/notifications/me/conversations*` |
| Permissions | `messages.read` |

### Notifications — `/employer/notifications`

| Item | Detail |
|------|--------|
| Purpose | Employer inbox |
| APIs | `/notifications/me*` |

### Company Profile — `/employer/company-profile`

| Item | Detail |
|------|--------|
| Purpose | View/edit company profile & media |
| APIs | `GET/PATCH /employers/me`, profile update |
| Permissions | `company_profile.*` |

### Team Management — `/employer/team-management` (+ department/member/role detail routes)

| Item | Detail |
|------|--------|
| Purpose | Departments, roles, members, invitations, permission matrix |
| APIs | `/api/v1/team/*` |
| Permissions | `team_management.*` |
| Features | Invite, resend, cancel; role archive/activate; field access |

### Team Member Profile — `/employer/team-member/profile`

| Item | Detail |
|------|--------|
| Purpose | Logged-in team member self profile |
| APIs | `GET /team/members/me` |

### Settings — `/employer/settings`

| Item | Detail |
|------|--------|
| Purpose | Settings sections (security, notifications, integrations, activity logs UI) |
| Permissions | `settings.*` |

### Help Center — `/employer/help-center`

| Item | Detail |
|------|--------|
| Purpose | Employer help content surface |

### Campaigns — `/employer/campaigns`

| Item | Detail |
|------|--------|
| Purpose | Page exists in frontend |
| Backend | **No mounted campaigns API** (placeholder module) |

### Analytics — `/employer/analytics`

| Item | Detail |
|------|--------|
| Purpose | Page exists in frontend |
| Backend | Aggregations primarily via jobs/applications stats; no dedicated analytics router |

### Reports — `/employer/reports`

| Item | Detail |
|------|--------|
| Purpose | Page exists in frontend |
| Backend | Export APIs on applications/saved-candidates; no dedicated reports router |

### Subscription — `/employer/subscription`

| Item | Detail |
|------|--------|
| Purpose | Page exists in frontend |
| Backend | **No mounted subscriptions API** |

---

## 3. Cross-cutting employer behaviors

| Concern | Implementation |
|---------|----------------|
| Sidebar nav | `EmployerSidebar` + permission-aware items |
| Field-level RBAC | Backend masks/hides fields; client Can/permission hooks |
| Cascade job delete | Removes applications, saved candidates, notifications, views for that job |
| React Query | Feature query keys; cascade invalidation helper |

---

## 4. Public job posting entry

Employers may also enter via marketing CTAs to `/post-job` and `/employer/register`.
