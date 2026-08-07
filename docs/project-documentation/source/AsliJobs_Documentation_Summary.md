# AsliJobs Documentation — Summary Report

**Generated from:** Current monorepo (read-only analysis)  
**Output root:** `docs/project-documentation/`

---

## Counts

| Metric | Count | Notes |
|--------|------:|-------|
| Frontend App Router pages | **49** | Public + employer + job seeker + team |
| Employer workspace/auth pages | **28** | Includes redirects / unauthorized |
| Job seeker pages | **11** | Auth + workspace |
| Public site pages | **13** | Including `/login` redirect |
| Admin routes | **1** | `/` HomePage only |
| Backend mounted API modules | **10** | auth, employers, jobs, jobseekers, resumes, applications, saved-jobs, saved-candidates, notifications, team |
| Backend placeholder modules (unmounted) | **8+** | admin, campaigns, interviews folder, placements, subscriptions, support, users, shared |
| Documented API rows (workbook sample + core) | **~80+** | Full route inventory larger; see API doc + workbook |
| Database models / collections | **16** | Mongoose models |
| Frontend component TSX files under `components/` | **~300–500** | Path variants; large feature UI surface |
| Design system color tokens | **72** | `@theme` in `globals.css` |

---

## Technologies used

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind 4, TanStack Query, Axios, RHF, Zod, Lucide, Bootstrap Icons, Inter  

**Backend:** Express 5, Mongoose 8, JWT, Zod, Multer, Cloudinary, Resend, WhatsApp OTP (optional), exceljs, pdfkit, helmet, rate-limit  

**Admin:** Vite 8, React 19, React Router 7, TanStack Query, Recharts, Tailwind 4  

---

## Design system summary

- Font: **Inter** (`next/font/google`)
- Tokens: CSS `@theme` in `frontend/src/app/globals.css`
- Primary: `#0e8585` / soft `#00baa5` / accent `#ffd54f`
- Logo: `frontend/src/assets/AsliLogo.svg`
- Full doc: `source/AsliJobs_Design_System_Documentation.md`

---

## Folder paths of generated documents

| Document | Path |
|----------|------|
| Index | `docs/project-documentation/source/AsliJobs_Project_Index.md` |
| Master | `docs/project-documentation/source/AsliJobs_Master_Project_Documentation.md` |
| API | `docs/project-documentation/source/AsliJobs_API_Documentation.md` |
| Employer | `docs/project-documentation/source/AsliJobs_Employer_Module_Documentation.md` |
| Job Seeker | `docs/project-documentation/source/AsliJobs_JobSeeker_Module_Documentation.md` |
| Design System | `docs/project-documentation/source/AsliJobs_Design_System_Documentation.md` |
| Database | `docs/project-documentation/source/AsliJobs_Database_Architecture.md` |
| Summary (this file) | `docs/project-documentation/source/AsliJobs_Documentation_Summary.md` |
| Feature List | `docs/project-documentation/generated/AsliJobs_Feature_List.xlsx` |
| API List | `docs/project-documentation/generated/AsliJobs_API_List.xlsx` |
| Page List | `docs/project-documentation/generated/AsliJobs_Page_List.xlsx` |
| PDF exports (if present) | `docs/project-documentation/generated/*.pdf` |

---

## Important honesty notes

- Employer pages **Campaigns**, **Subscription**, and partially **Analytics/Reports** exist in the frontend; corresponding backend routers are **not mounted**.
- Admin app defines roles but has **no production feature screens** beyond a home stub.
- Interviews are **application-embedded**, not a separate Mongo collection.
- Documentation does **not** invent features beyond codebase evidence.
