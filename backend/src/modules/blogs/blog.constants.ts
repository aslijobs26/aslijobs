export const BLOG_STATUSES = ["draft", "published", "scheduled"] as const;

export type BlogStatus = (typeof BLOG_STATUSES)[number];

export const BLOG_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;

export const BLOG_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const BLOG_IMAGE_PURPOSES = [
  "cover",
  "inline",
  "author",
  "social",
] as const;

export type BlogImagePurpose = (typeof BLOG_IMAGE_PURPOSES)[number];

export const DEFAULT_BLOG_CATEGORIES = [
  { name: "Job Search", slug: "job-search", displayOrder: 1 },
  { name: "Career Guidance", slug: "career-guidance", displayOrder: 2 },
  { name: "Hiring & Recruitment", slug: "hiring-recruitment", displayOrder: 3 },
  { name: "Interview Preparation", slug: "interview-preparation", displayOrder: 4 },
  { name: "Resume & Cover Letter", slug: "resume-cover-letter", displayOrder: 5 },
  { name: "Skills & Training", slug: "skills-training", displayOrder: 6 },
  { name: "Workplace & Career Growth", slug: "workplace-career-growth", displayOrder: 7 },
] as const;

export const WORDS_PER_MINUTE = 200;
