# AsliJobs — Master Project Documentation

**Version:** Generated from current codebase (read-only analysis)  
**Audience:** Developers, QA, Designers, Product, Clients  
**Scope:** Entire monorepo — `frontend/`, `backend/`, `admin/`  
**Rule:** Documents only what exists in source code. No assumed features.

---

## 1. Project Overview

| Item | Value |
|------|--------|
| **Project name** | AsliJobs |
| **Legal / company** | Propenu Solutions Pvt Ltd. (`frontend/src/constants/site.ts`) |
| **Site name** | AsliJobs.com |
| **Tagline** | India's Trusted WhatsApp Job Network |
| **Project type** | Production multi-app hiring platform (monorepo) |
| **Purpose** | Connect employers with blue- and grey-collar job seekers via WhatsApp-first hiring workflows |
| **Target users** | Employers (owners + team members), Job Seekers, Internal Admin (stub) |

### Main features (implemented)

- Public job discovery and job detail pages
- WhatsApp OTP registration/login for employers and job seekers
- Employer job posting (wizard / draft / publish / status / cascade delete)
- Job seeker apply flow with resume snapshots
- Employer candidate pipeline (status, shortlist, notes, export)
- Interviews (embedded on applications; list, calendar UI, schedule/cancel)
- Saved jobs (seeker) and saved/shortlisted candidates (employer)
- Notifications inbox; employer messages as application-threaded conversations
- Team management (departments, roles, members, invitations) with RBAC + field-level access
- Company profile, settings, reports/analytics/campaigns/subscription pages (some UI shells)

### Business flow (core hiring)

```
Employer registers (OTP) → Completes company profile / documents
  → Creates & publishes Job
    → Job Seeker registers / logs in (OTP)
      → Applies with active Resume
        → Application appears in Employer Candidates
          → Shortlist / Save candidate
            → Schedule Interview (on application)
              → Hiring outcomes (offer / hired / reject via status APIs)
```

### Architecture overview

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  frontend/      │   │  admin/         │   │  backend/       │
│  Next.js 16     │──▶│  Vite React     │   │  Express 5      │
│  (public + UX)  │   │  (stub shell)   │   │  MongoDB/Mongoose│
└────────┬────────┘   └─────────────────┘   └────────┬────────┘
         │  REST /api/v1/*                            │
         └────────────────────────────────────────────┘
```

Three applications share one API. Admin is present with role types defined but only a home route implemented. Backend placeholder folders (`campaigns`, `admin`, etc.) are not mounted.

---

## 2. Technology Stack

### Frontend (`frontend/`)

| Area | Technology |
|------|------------|
| Framework | Next.js 16.2.10 (App Router) |
| UI | React 19.2.4 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 (`@tailwindcss/postcss`), `globals.css` `@theme` |
| Icons | lucide-react, bootstrap-icons |
| Forms | react-hook-form, @hookform/resolvers, Zod 4 |
| Data | TanStack React Query 5, Axios |
| Utilities | clsx, tailwind-merge |
| Font | Inter via `next/font/google` |

### Backend (`backend/`)

| Area | Technology |
|------|------------|
| Runtime | Node.js (ESM), Express 5 |
| Language | TypeScript 5.9, tsx |
| Database | MongoDB via Mongoose 8 |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Validation | Zod 4 |
| Uploads | multer |
| Storage | Local disk and/or Cloudinary |
| Email | Resend |
| WhatsApp | Meta WhatsApp Cloud API (OTP when configured) |
| Exports | exceljs, pdfkit |
| Security | helmet, cors, cookie-parser, express-rate-limit |
| Logging | morgan |

### Admin (`admin/`)

| Area | Technology |
|------|------------|
| Build | Vite 8, React 19, TypeScript |
| Routing | react-router-dom 7 |
| Styling | Tailwind 4 |
| Data | TanStack Query, Axios |
| Forms | RHF + Zod |
| Charts | recharts |
| Icons | lucide-react |

### Not present in repo

- Docker / docker-compose / CI workflows / vercel.json
- AWS S3 SDK usage
- Google Maps API client (employer location suggestions are DB-derived)
- Root README

---

## 3. Repository Structure

```
Asli-Jobs/
├── frontend/                 # Next.js public + employer + job seeker UX
│   ├── src/app/              # App Router pages & layouts
│   ├── src/components/       # Feature UI (~300+ component modules)
│   ├── src/constants/        # Routes, RBAC, design-system typography
│   ├── src/services/         # API clients
│   ├── src/hooks/
│   ├── src/providers/        # QueryProvider, permission provider
│   ├── src/utils/
│   ├── src/types/
│   ├── src/assets/           # Logos, illustrations
│   └── docs/                 # Design system MD (source also copied here)
├── backend/                  # Express REST API
│   ├── src/app.ts
│   ├── src/server.ts
│   ├── src/config/           # env, db
│   ├── src/middleware/
│   ├── src/routes/
│   ├── src/modules/          # Feature modules (model/service/controller/routes)
│   └── src/utils/
├── admin/                    # Internal team app (minimal)
└── docs/project-documentation/  # This documentation suite
```

---

## 4. Applications & Users

| App | Users | Auth |
|-----|--------|------|
| Public website | Anonymous visitors | Optional job seeker JWT for applied state on public jobs |
| Employer workspace | Employer owners, team members | Workspace JWT (OTP for owner; email/password for members) |
| Job seeker workspace | Job seekers | Job seeker JWT (WhatsApp OTP) |
| Admin | Role types defined (SUPER_ADMIN, OPERATIONS, …) | Not wired to backend routes yet |

---

## 5. Design System (summary)

Full detail: [AsliJobs_Design_System_Documentation.md](./AsliJobs_Design_System_Documentation.md)

| Topic | Current state |
|-------|----------------|
| Font | Inter only (`next/font/google`) |
| Colors | 72 semantic tokens in `frontend/src/app/globals.css` `@theme` |
| Primary brand | `#0e8585` / soft CTA `#00baa5` / accent `#ffd54f` |
| Logo | `frontend/src/assets/AsliLogo.svg` (213×70) |
| Tailwind | v4 CSS-first; no `tailwind.config.ts` |
| Buttons | No shared Button primitive — pattern-based Tailwind classes |

---

## 6. Authentication & RBAC (summary)

Full detail in Employer / API docs.

| Flow | Mechanism |
|------|-----------|
| Employer login | WhatsApp OTP → workspace access + refresh tokens in localStorage |
| Job seeker login | WhatsApp OTP → job seeker tokens in localStorage |
| Team member login | Email/password → same employer workspace token storage |
| Refresh / logout | `/api/v1/auth/workspace/*` and `/api/v1/auth/job-seeker/*` |
| Employer RBAC | Modules: dashboard, jobs, candidates, interviews, messages, campaigns, reports, subscription, company_profile, team_management, settings |
| Actions | create, read, update, delete, export, fullAccess |
| Field access | hidden / view / mask / edit per role |

---

## 7. Frontend Pages (inventory)

**Total App Router pages:** 49

| Area | Count | Examples |
|------|------:|----------|
| Public / marketing | 13 | `/`, `/jobs`, `/post-job`, legal pages |
| Employer | 28 | dashboard, jobs, candidates, interviews, team, settings |
| Job seeker | 11 | dashboard, profile, resume, applied/saved jobs |
| Team cross-flows | 2+ | `/team-member/login`, `/team/accept-invitation` |

Constants: `frontend/src/constants/routes.ts`  
Detailed page lists: Excel [AsliJobs_Page_List](../generated/AsliJobs_Page_List.xlsx) and module docs.

---

## 8. Backend Modules & API

**Mounted under `/api/v1`:** auth, employers, jobs, jobseekers, resumes, applications, saved-jobs, saved-candidates, notifications, team.

**Health:** `GET /api/v1/health`

**Approximate authenticated/public endpoint count:** ~110+ route definitions (see API list).

Placeholder module folders exist but are **not mounted**: admin, campaigns, interviews (standalone), placements, subscriptions, support, users, shared.

---

## 9. Database (summary)

**16 Mongoose models** — see [AsliJobs_Database_Architecture.md](./AsliJobs_Database_Architecture.md)

Core entities: Employer, JobSeeker, Job, Application, Resume, SavedJob, SavedCandidate, Notification, TeamMember, TeamRole, TeamInvitation, Department, TeamActivity, JobView, JobCounter, EmployerDocument.

Interviews/offers/shortlist metadata are **embedded on Application**, not separate collections.

---

## 10. Integrations

| Integration | Purpose | Config (env names) |
|-------------|---------|-------------------|
| MongoDB | Persistence | `MONGO_URI` |
| JWT | Auth | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, … |
| Cloudinary | Optional file storage | `CLOUDINARY_*`, `STORAGE_PROVIDER` |
| Local uploads | Default storage | `UPLOAD_DIR`, `STORAGE_PROVIDER=local` |
| Resend | Team invitation email | `RESEND_API_KEY`, `EMAIL_FROM` |
| WhatsApp Cloud API | OTP delivery | `OTP_PROVIDER=whatsapp`, `WHATSAPP_*` |
| Console OTP | Dev OTP | `OTP_PROVIDER=console` |

---

## 11. State Management & Performance

| Concern | Implementation |
|---------|----------------|
| Server/client data | TanStack Query (`QueryProvider`, default staleTime 60s) |
| Auth session | localStorage tokens + custom window events |
| Employer RBAC client | Permission provider + React Query session |
| Lists | Offset pagination utilities; page size options per feature |
| Cascade job delete | Invalidates jobs, applications, interviews, saved-candidates, notifications, messages caches |

---

## 12. Security

| Control | Implementation |
|---------|----------------|
| Transport headers | helmet |
| CORS | Configurable origins (`FRONTEND_URL`, `ADMIN_URL`, …) |
| Rate limiting | Login/register/team invitation limiters |
| Input validation | Zod at route boundaries |
| Authorization | JWT + `requirePermission` / field access |
| Passwords | bcryptjs (team members) |
| Secrets | Environment variables via validated `env.ts` |

---

## 13. Workflows (existing)

### Employer registration
Register → OTP verify → Company profile / identity document upload → Login → Dashboard

### Job lifecycle
Create / draft → Publish → Pause/close/reactivate → Single or bulk delete (cascade related hiring data)

### Application lifecycle
Seeker applies → Employer views → Status updates / shortlist → Interview schedule/cancel → Hiring fields → Optional export

### Team onboarding
Invite member → Email (Resend) → Accept invitation → Set password → Team member login → RBAC-scoped dashboard

### Notifications / messages
Domain events create notifications → Inbox for both roles → Employer conversations grouped by `application` referenceId

---

## 14. Admin Application Status

- Tech stack ready (Vite + React Router + Query + Recharts)
- Routes: only `/` → `HomePage`
- Role enum defined: SUPER_ADMIN, OPERATIONS, SUPPORT, MARKETING, CONTENT_LANGUAGE, SALES
- No backend admin router mounted

---

## 15. Documentation Index

See [AsliJobs_Project_Index.md](./AsliJobs_Project_Index.md) for links to all documents in this suite.

---

## 16. Validation

This master document was produced from read-only inspection of `frontend/`, `backend/`, and `admin/` source. Features that exist only as empty folders, stub pages, or unmounted routers are labeled accordingly and are not described as production-complete APIs.
