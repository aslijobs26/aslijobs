export const OPERATIONS_LOGIN_ROUTES = {
  LOGIN: "/login",
} as const;

export const OPERATIONS_LOGIN_COPY = {
  heading: "Operations Dashboard",
  subtitle:
    "Secure login for AsliJobs Operations Team. Manage hiring operations, employers, candidates and support.",
  emailLabel: "Email Address",
  emailPlaceholder: "Enter your operations team email",
  emailHelper: "Use your registered AsliJobs operations team email address.",
  passwordLabel: "Password",
  passwordPlaceholder: "Enter password",
  submitLabel: "Login",
  submittingLabel: "Signing in...",
  trustText: "Secure • Private • Trusted by 10,000+ Employers",
  footer: "© 2026 AsliJobs. All rights reserved.",
} as const;

export const OPERATIONS_LOGIN_ASSETS = {
  panelBackground: "/assets/operations-login/panel-background.jpg",
  panelBackgroundMobile: "/assets/operations-login/panel-background-mobile.jpg",
  panelBackgroundTablet: "/assets/operations-login/panel-background-tablet.jpg",
  panelTeamHero: "/assets/operations-login/panel-team-hero.png",
  teamPersons: "/assets/operations-login/team-persons.png",
  logoWhite: "/assets/operations-login/logo-white.png",
  testimonialAvatar: "/assets/operations-login/testimonial-avatar.png",
  testimonialAvatar1: "/assets/operations-login/testimonial-avatar-1.png",
  testimonialAvatar2: "/assets/operations-login/testimonial-avatar-2.png",
  testimonialAvatar3: "/assets/operations-login/testimonial-avatar-3.png",
  logo: "/AsliLogo.svg",
} as const;

export const OPERATIONS_LOGIN_TESTIMONIAL_AUTOPLAY_MS = 4000;

export const OPERATIONS_LOGIN_TESTIMONIAL_TRANSITION_MS = 400;

export const OPERATIONS_LOGIN_FEATURE_AUTOPLAY_MS = 4000;

export const OPERATIONS_LOGIN_FEATURE_TRANSITION_MS = 400;

export const OPERATIONS_LOGIN_TESTIMONIALS = [
  {
    id: "priya-reddy",
    quote:
      "AsliJobs helps us reach the right candidates in the right time. Our operations run faster and smarter every day.",
    authorName: "Priya Reddy",
    authorRole: "Talent Acquisition Lead",
    avatar: OPERATIONS_LOGIN_ASSETS.testimonialAvatar1,
    avatarAlt: "Portrait of Priya Reddy",
  },
  {
    id: "sneha-patel",
    quote:
      "The hiring process became much faster. Verified candidates, multilingual support, and instant communication saved our team valuable time.",
    authorName: "Sneha Patel",
    authorRole: "Operations Head",
    avatar: OPERATIONS_LOGIN_ASSETS.testimonialAvatar3,
    avatarAlt: "Portrait of Sneha Patel",
  },
  {
    id: "rahul-sharma",
    quote:
      "Posting jobs on AsliJobs was incredibly simple. We started receiving quality applications on WhatsApp within just a few hours.",
    authorName: "Rahul Sharma",
    authorRole: "HR Manager",
    avatar: OPERATIONS_LOGIN_ASSETS.testimonialAvatar2,
    avatarAlt: "Portrait of Rahul Sharma",
  },
] as const;

export const OPERATIONS_LOGIN_FEATURES = [
  {
    id: "whatsapp-first",
    title: "WhatsApp-First",
    description: "Connect. Engage. Hire.",
    position: "top-left" as const,
  },
  {
    id: "verified-candidates",
    title: "Verified Candidates",
    description: "Quality talent you can trust.",
    position: "top-right" as const,
  },
  {
    id: "quick-job-posting",
    title: "Quick Job Posting",
    description: "Post jobs in minutes via WhatsApp.",
    position: "bottom-left" as const,
  },
  {
    id: "real-time-insights",
    title: "Real-time Insights",
    description: "Track performance and operations live.",
    position: "bottom-right" as const,
  },
] as const;

export const OPERATIONS_LOGIN_TESTIMONIAL = OPERATIONS_LOGIN_TESTIMONIALS[0];
