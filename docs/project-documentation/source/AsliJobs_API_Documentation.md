# AsliJobs — API Documentation

**Base URL:** `/api/v1`  
**Server:** Express 5 (`backend/src/app.ts`)  
**Auth:** Bearer JWT (workspace or job seeker)  
**Validation:** Zod via `validate` middleware  
**Responses:** Centralized success/error helpers (`utils/api-response.ts`)

Complete machine-readable inventory: [AsliJobs_API_List.xlsx](../generated/AsliJobs_API_List.xlsx)

---

## 1. Global endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/health` | None | Health check |
| GET | `/uploads/*` | None | Static files when `STORAGE_PROVIDER=local` |

---

## 2. Authentication module (`/api/v1/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/workspace/refresh` | Refresh employer/team workspace tokens |
| POST | `/workspace/logout` | Revoke workspace refresh |
| POST | `/job-seeker/refresh` | Refresh job seeker tokens |
| POST | `/job-seeker/logout` | Revoke job seeker refresh |

**JWT roles:** `employer` | `team_member` | `job_seeker`

---

## 3. Employers (`/api/v1/employers`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/login/send-otp` | Public | Rate limited |
| POST | `/login/resend-otp` | Public | |
| POST | `/login/verify-otp` | Public | Issues workspace tokens |
| GET | `/me` | Workspace | Profile |
| PATCH | `/me/profile` | Workspace + `company_profile.update` | |
| POST | `/register` | Public | Start registration |
| POST | `/:employerId/otp/resend` | Continuation | |
| POST | `/:employerId/otp/verify` | Continuation | |
| POST | `/:employerId/company-profile` | Continuation + upload | |
| POST | `/:employerId/identity-document` | Continuation + upload | |

---

## 4. Jobs (`/api/v1/jobs`)

| Method | Path | Auth / permission |
|--------|------|-------------------|
| GET | `/public` | Optional job seeker |
| GET | `/public/:publicJobId` | Optional job seeker |
| GET | `/public/:publicJobId/similar` | Optional job seeker |
| POST | `/` | `jobs.create` |
| POST | `/draft` | `jobs.create` |
| GET | `/mine` | `jobs.read` |
| GET | `/mine/stats` | `jobs.read` (+ orphan heal) |
| POST | `/bulk-delete` | `jobs.delete` (cascade) |
| GET | `/:jobId` | `jobs.read` |
| PUT | `/:jobId` | `jobs.update` |
| PATCH | `/:jobId/draft` | `jobs.update` |
| PUT | `/:jobId/publish` | `jobs.update` |
| PATCH | `/:jobId/status` | `jobs.update` |
| DELETE | `/:jobId` | `jobs.delete` (cascade) |

---

## 5. Job seekers (`/api/v1/jobseekers`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/login/send-otp` | Public |
| POST | `/login/resend-otp` | Public |
| POST | `/login/verify-otp` | Public |
| GET | `/me` | Job seeker |
| PATCH | `/me` | Job seeker |
| POST | `/me/photo` | Job seeker |
| DELETE | `/me/photo` | Job seeker |
| GET | `/register/job-roles` | Public |
| POST | `/register` | Public |
| POST | `/register/resend-otp` | Public |
| POST | `/register/verify-otp` | Public |
| POST | `/register/preferences` | Registration |
| POST | `/register/complete` | Registration |

---

## 6. Resumes (`/api/v1/resumes`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/me` | Job seeker |
| POST | `/me/regenerate` | Job seeker |
| GET | `/me/pdf` | Job seeker |

---

## 7. Applications (`/api/v1/applications`)

### Job seeker

| Method | Path |
|--------|------|
| POST | `/apply` |
| GET | `/me` |
| GET | `/me/stats` |
| GET | `/me/:applicationId` |
| POST | `/me/:applicationId/withdraw` |

### Employer

| Method | Path | Permission |
|--------|------|------------|
| GET | `/employer` | `candidates.read` |
| GET | `/employer/stats` | `candidates.read` |
| GET | `/employer/:applicationId` | `candidates.read` |
| GET | `/employer/location-suggestions` | `candidates.read` |
| PATCH | `/employer/:applicationId/status` | `candidates.update` |
| POST | `/employer/:applicationId/shortlist` | `candidates.update` |
| PATCH | `/employer/:applicationId/notes` | `candidates.update` |
| PATCH | `/employer/:applicationId/hiring` | `candidates.update` |
| PATCH | `/employer/:applicationId/interview` | `interviews.create` or `update` |
| PATCH | `/employer/:applicationId/interview/cancel` | `interviews.update` |
| GET | `/employer/interviews` | `interviews.read` |
| GET | `/employer/interviews/stats` | `interviews.read` |
| POST | `/employer/export` | `candidates.export` |
| POST | `/employer/export/preview` | `candidates.export` |
| GET | `/employer/:applicationId/pdf` | `candidates.export` |
| GET | `/employer/resume-access/:token/pdf` | Public token |

---

## 8. Saved jobs (`/api/v1/saved-jobs`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/me` | Job seeker |
| GET | `/me/stats` | Job seeker |
| GET | `/me/ids` | Job seeker |
| POST | `/me` | Job seeker |
| DELETE | `/me/:publicJobId` | Job seeker |

---

## 9. Saved candidates (`/api/v1/saved-candidates`)

| Method | Path | Typical permission |
|--------|------|--------------------|
| GET | `/` | Employer (candidates scope) |
| GET | `/stats` | Employer |
| GET | `/ids` | Employer |
| POST | `/` | Employer |
| PATCH | `/:savedCandidateId` | Employer |
| DELETE | `/:savedCandidateId` | Employer |
| DELETE | `/by-application/:applicationId` | Employer |
| POST | `/export` | Employer |
| POST | `/export/preview` | Employer |

Shortlisted UI filters with `applicationStatus=shortlisted` and may backfill saved rows for shortlisted applications.

---

## 10. Notifications (`/api/v1/notifications`)

Auth: job seeker **or** employer workspace token (`requireNotificationRecipientAuth`).

| Method | Path | Notes |
|--------|------|-------|
| GET | `/me` | Inbox list |
| GET | `/me/unread-count` | Badge |
| POST | `/me/read-all` | |
| POST | `/me/clear-all` | Soft dismiss |
| DELETE | `/me/:notificationId` | |
| POST | `/me/:notificationId/read` | |
| GET | `/me/conversations` | Employer messages; needs `messages.read` |
| GET | `/me/conversations/:applicationId/timeline` | `messages.read` |
| POST | `/me/conversations/:applicationId/read` | `messages.read` |

---

## 11. Team (`/api/v1/team`)

### Public

| Method | Path |
|--------|------|
| GET | `/invitations/preview` |
| POST | `/invitations/accept` |
| POST | `/auth/login` |

### Authenticated workspace

| Area | Endpoints (prefix `/api/v1/team`) |
|------|-----------------------------------|
| RBAC session | `GET /rbac/session` |
| Stats / sidebar | `GET /stats`, `GET /sidebar` |
| Roles | CRUD + permissions + archive/activate/duplicate |
| Members | list, invite, update, transfer, change-role, activate/deactivate, delete, resend/cancel invitation |
| Departments | CRUD + deactivate |
| Self | `GET /members/me` |

Most team routes require `team_management.*` permissions; owners have full access.

---

## 12. Controllers / services / validation pattern

Each mounted module typically contains:

- `*.routes.ts` — Express router + middleware chain  
- `*.controller.ts` — thin HTTP adapter  
- `*.service.ts` — business logic  
- `*.validation.ts` — Zod schemas  
- `*.model.ts` — Mongoose schema (where persisted)

RBAC engine: `backend/src/modules/rbac/`  
Permissions middleware: `backend/src/middleware/permission.middleware.ts`

---

## 13. Unmounted / placeholder modules

Folders under `backend/src/modules/` without API mounts: `admin`, `campaigns`, `interviews` (standalone), `placements`, `subscriptions`, `support`, `users`, `shared`. Interview **functionality** is served via Applications routes, not a separate interviews router.
