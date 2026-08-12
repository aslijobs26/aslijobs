import type { JobSeekerContentPageData } from "@/types/job-seeker-content";
import { WHATSAPP_JOIN_URL } from "@/constants/cta";
import { ROUTES } from "@/constants/routes";

const JOB_SEEKER_CTA_ACTIONS = [
  {
    label: "Start on WhatsApp",
    href: WHATSAPP_JOIN_URL,
    external: true,
    variant: "primary" as const,
  },
  {
    label: "Browse Jobs",
    href: ROUTES.FIND_JOBS,
    variant: "secondary" as const,
  },
] as const;

export const FIND_JOBS_CONTENT: JobSeekerContentPageData = {
  slug: "find-jobs",
  title: "Find Jobs",
  metaDescription:
    "Looking for the right job? AsliJobs makes job search simple, quick, and easy through WhatsApp.",
  intro: [
    "Looking for the right job? AsliJobs makes job search simple, quick, and easy through WhatsApp.",
    "AsliJobs helps job seekers find blue-collar and grey-collar jobs based on their location, job category, experience, skills, language preference, and availability. Whether you are looking for office support work, delivery jobs, driving jobs, electrician work, housekeeping, security, warehouse jobs, retail jobs, technician roles, or other workforce opportunities, AsliJobs helps you connect with suitable employers.",
  ],
  sections: [
    {
      id: "find-jobs-through-whatsapp",
      title: "Find Jobs Through WhatsApp",
      paragraphs: [
        "You do not need to download any new app. With AsliJobs, you can receive job alerts, view job details, apply for jobs, and get interview updates directly on WhatsApp.",
        "Simply start the AsliJobs WhatsApp chat, share your basic profile details, select your preferred job category and location, and receive suitable job opportunities.",
      ],
    },
    {
      id: "jobs-based-on-your-location",
      title: "Jobs Based on Your Location",
      paragraphs: [
        "AsliJobs helps you find jobs based on your city, area, locality, or preferred work location. This makes it easier to discover nearby job opportunities and apply for jobs that are convenient for you.",
      ],
    },
    {
      id: "apply-easily",
      title: "Apply Easily",
      paragraphs: [
        "When you receive a job alert, you can check the job title, salary, location, timings, experience required, and other details. If you are interested, you can apply directly through WhatsApp by replying to the job alert or selecting the apply option.",
      ],
    },
    {
      id: "stay-updated",
      title: "Stay Updated",
      paragraphs: [
        "After applying, you will receive important updates through WhatsApp, including application status, shortlisting updates, interview details, selection status, and joining information.",
      ],
    },
    {
      id: "safe-job-search",
      title: "Safe Job Search",
      variant: "safety",
      paragraphs: [
        "AsliJobs focuses on creating a simple and reliable job search experience. Job seekers should always check job details carefully and report any fake job, payment demand, or suspicious activity to AsliJobs support.",
      ],
    },
  ],
  cta: {
    title: "Start Finding Jobs",
    paragraphs: [
      "Start your job search with AsliJobs and receive suitable job opportunities directly on WhatsApp.",
    ],
    tagline: "Find jobs. Apply easily. Get updates on WhatsApp.",
    badge: "WhatsApp",
    actions: JOB_SEEKER_CTA_ACTIONS,
  },
};

export const BROWSE_BY_CITY_CONTENT: JobSeekerContentPageData = {
  slug: "browse-by-city",
  title: "Browse by City",
  metaDescription:
    "Find blue-collar and grey-collar jobs in your preferred city with AsliJobs through WhatsApp.",
  intro: [
    "Find blue-collar and grey-collar jobs in your preferred city with AsliJobs. Whether you are looking for a nearby job or planning to work in another city, AsliJobs helps you discover suitable opportunities through WhatsApp.",
  ],
  sections: [
    {
      id: "find-jobs-in-your-city",
      title: "Find Jobs in Your City",
      paragraphs: [
        "AsliJobs allows job seekers to search for jobs based on city, area, locality, and preferred work location. This helps you find jobs that are closer, easier to reach, and suitable for your daily routine.",
      ],
    },
    {
      id: "how-it-works",
      title: "How It Works",
      variant: "steps",
      paragraphs: [
        "Select your city, choose your job category, and share your basic profile details. Based on your location, experience, skills, and availability, AsliJobs will send suitable job alerts directly on WhatsApp.",
      ],
      bullets: [
        "Select city",
        "Choose job category",
        "Share basic profile details",
        "Matching based on location, experience, skills and availability",
        "Receive suitable job alerts through WhatsApp",
      ],
    },
    {
      id: "city-based-job-alerts",
      title: "City-Based Job Alerts",
      paragraphs: [
        "You can receive job alerts for roles such as office support, delivery, driver, electrician, plumber, housekeeping, security, helper, warehouse staff, retail staff, technician, and other workforce jobs available in your city.",
      ],
      bullets: [
        "Office support",
        "Delivery",
        "Driver",
        "Electrician",
        "Plumber",
        "Housekeeping",
        "Security",
        "Helper",
        "Warehouse staff",
        "Retail staff",
        "Technician",
        "Other workforce jobs",
      ],
    },
    {
      id: "job-availability",
      title: "Job Availability",
      paragraphs: [
        "AsliJobs serves job seekers and employers across India. Job availability may vary based on city, area, locality, job category, and employer openings.",
      ],
    },
  ],
  cta: {
    title: "Start Searching",
    paragraphs: [
      "Choose your city and start receiving job opportunities directly on WhatsApp.",
    ],
    tagline: "Find jobs near you. Apply easily through WhatsApp.",
    badge: "WhatsApp",
    actions: JOB_SEEKER_CTA_ACTIONS,
  },
};

export const BROWSE_BY_STATE_CONTENT: JobSeekerContentPageData = {
  slug: "browse-by-state",
  title: "Browse by State",
  metaDescription:
    "Find blue-collar and grey-collar jobs across different states in India with AsliJobs through WhatsApp.",
  intro: [
    "Find blue-collar and grey-collar jobs across different states in India with AsliJobs. Whether you want to work in your home state or explore opportunities in another state, AsliJobs helps you discover suitable jobs through WhatsApp.",
  ],
  sections: [
    {
      id: "find-jobs-state-wise",
      title: "Find Jobs State-Wise",
      paragraphs: [
        "AsliJobs allows job seekers to search for jobs based on state, city, area, locality, and preferred work location. This makes it easier to find opportunities that match your location and job preference.",
      ],
    },
    {
      id: "how-it-works",
      title: "How It Works",
      variant: "steps",
      paragraphs: [
        "Select your state, choose your city or locality, and share your preferred job category. Based on your profile details, AsliJobs will send suitable job alerts directly on WhatsApp.",
      ],
      bullets: [
        "Select state",
        "Choose city/locality",
        "Select preferred job category",
        "Receive suitable job alerts through WhatsApp",
      ],
    },
    {
      id: "state-based-job-alerts",
      title: "State-Based Job Alerts",
      paragraphs: [
        "You can receive job alerts for roles such as office support, delivery, driver, electrician, plumber, housekeeping, security, helper, warehouse staff, retail staff, technician, and other workforce jobs available in your selected state.",
      ],
      bullets: [
        "Office support",
        "Delivery",
        "Driver",
        "Electrician",
        "Plumber",
        "Housekeeping",
        "Security",
        "Helper",
        "Warehouse staff",
        "Retail staff",
        "Technician",
        "Other workforce jobs",
      ],
    },
    {
      id: "job-availability",
      title: "Job Availability",
      paragraphs: [
        "AsliJobs serves job seekers and employers across India. Job availability may vary based on state, city, locality, job category, and employer openings.",
      ],
    },
  ],
  cta: {
    title: "Start Searching",
    paragraphs: [
      "Choose your preferred state and start receiving suitable job opportunities on WhatsApp.",
    ],
    tagline: "Search state-wise. Apply easily. Get updates on WhatsApp.",
    badge: "WhatsApp",
    actions: JOB_SEEKER_CTA_ACTIONS,
  },
};

export const JOB_CATEGORIES_CONTENT: JobSeekerContentPageData = {
  slug: "job-categories",
  title: "Job Categories",
  metaDescription:
    "AsliJobs helps job seekers find blue-collar and grey-collar jobs across different categories through WhatsApp.",
  intro: [
    "AsliJobs helps job seekers find blue-collar and grey-collar jobs across different categories. Whether you are looking for field work, technical work, office support, delivery, retail, or service-based roles, AsliJobs makes it easy to discover suitable jobs through WhatsApp.",
  ],
  sections: [
    {
      id: "explore-jobs-by-category",
      title: "Explore Jobs by Category",
      paragraphs: [
        "You can choose your preferred job category while creating your profile. Based on your skills, experience, location, and availability, AsliJobs will send suitable job alerts directly on WhatsApp.",
      ],
    },
    {
      id: "popular-job-categories",
      title: "Popular Job Categories",
      cards: [
        {
          id: "office-support",
          title: "Office Support",
          description:
            "Jobs like office assistant, admin helper, receptionist, data entry support, and back-office staff.",
        },
        {
          id: "delivery-logistics",
          title: "Delivery & Logistics",
          description:
            "Jobs like delivery executive, courier staff, logistics helper, and field delivery roles.",
        },
        {
          id: "driver-jobs",
          title: "Driver Jobs",
          description:
            "Jobs for car drivers, commercial drivers, personal drivers, and company drivers.",
        },
        {
          id: "electrician-jobs",
          title: "Electrician Jobs",
          description:
            "Jobs for electricians, electrical helpers, wiring technicians, and maintenance staff.",
        },
        {
          id: "plumbing-jobs",
          title: "Plumbing Jobs",
          description:
            "Jobs for plumbers, plumbing assistants, and maintenance support workers.",
        },
        {
          id: "housekeeping-jobs",
          title: "Housekeeping Jobs",
          description:
            "Jobs for housekeeping staff, cleaning staff, facility support, and maintenance workers.",
        },
        {
          id: "security-jobs",
          title: "Security Jobs",
          description:
            "Jobs for security guards, watchmen, building security, and site security staff.",
        },
        {
          id: "warehouse-jobs",
          title: "Warehouse Jobs",
          description:
            "Jobs for warehouse helpers, packers, loaders, inventory assistants, and store support staff.",
        },
        {
          id: "retail-jobs",
          title: "Retail Jobs",
          description:
            "Jobs for sales staff, store assistants, cashiers, promoters, and customer support roles.",
        },
        {
          id: "technician-jobs",
          title: "Technician Jobs",
          description:
            "Jobs for AC technicians, appliance technicians, machine operators, mechanics, and service technicians.",
        },
        {
          id: "helper-jobs",
          title: "Helper Jobs",
          description:
            "Jobs for general helpers, site helpers, factory helpers, shop helpers, and support workers.",
        },
        {
          id: "other-workforce-jobs",
          title: "Other Workforce Jobs",
          description:
            "AsliJobs may also include other blue-collar and grey-collar job roles based on employer requirements and location availability.",
        },
      ],
    },
    {
      id: "jobs-based-on-your-location",
      title: "Jobs Based on Your Location",
      paragraphs: [
        "Job availability may vary based on your state, city, area, locality, job category, and employer openings. You can select your preferred location to receive more relevant job alerts.",
      ],
    },
  ],
  cta: {
    title: "Start Finding the Right Job",
    paragraphs: [
      "Choose your job category and start receiving suitable job opportunities directly on WhatsApp.",
    ],
    tagline:
      "Select your category. Get job alerts. Apply easily through WhatsApp.",
    badge: "WhatsApp",
    actions: JOB_SEEKER_CTA_ACTIONS,
  },
};

export const JOB_SEEKER_GUIDE_CONTENT: JobSeekerContentPageData = {
  slug: "job-seeker-guide",
  title: "Job Seeker Guide",
  metaDescription:
    "AsliJobs makes job search simple for India’s blue-collar and grey-collar workforce through WhatsApp.",
  intro: [
    "AsliJobs makes job search simple for India’s blue-collar and grey-collar workforce. With AsliJobs, job seekers can find suitable jobs, apply easily, and receive updates directly through WhatsApp.",
  ],
  sections: [
    {
      id: "start-with-whatsapp",
      title: "Start with WhatsApp",
      variant: "steps",
      paragraphs: [
        "You do not need to download any new app. You can start by clicking the AsliJobs WhatsApp link, scanning the QR code, or sending a message to the official AsliJobs WhatsApp number.",
      ],
    },
    {
      id: "create-your-profile",
      title: "Create Your Profile",
      variant: "steps",
      paragraphs: [
        "Share your basic details like name, mobile number, location, preferred language, job category, skills, experience, expected salary, and availability. This helps AsliJobs send you more suitable job opportunities.",
      ],
      bullets: [
        "Name",
        "Mobile number",
        "Location",
        "Preferred language",
        "Job category",
        "Skills",
        "Experience",
        "Expected salary",
        "Availability",
      ],
    },
    {
      id: "choose-your-job-category",
      title: "Choose Your Job Category",
      variant: "steps",
      paragraphs: [
        "Select the type of job you are looking for, such as office support, delivery, driver, electrician, housekeeping, security, retail, warehouse, technician, helper, or other available workforce jobs.",
      ],
      bullets: [
        "Office support",
        "Delivery",
        "Driver",
        "Electrician",
        "Housekeeping",
        "Security",
        "Retail",
        "Warehouse",
        "Technician",
        "Helper",
        "Other available workforce jobs",
      ],
    },
    {
      id: "select-your-location",
      title: "Select Your Location",
      variant: "steps",
      paragraphs: [
        "Choose your state, city, area, or locality so AsliJobs can show jobs that are closer and more convenient for you.",
      ],
      bullets: ["State", "City", "Area", "Locality"],
    },
    {
      id: "receive-job-alerts",
      title: "Receive Job Alerts",
      variant: "steps",
      paragraphs: [
        "You will receive suitable job alerts on WhatsApp based on your profile, location, job category, and availability. Keep your profile updated to receive better job matches.",
      ],
    },
    {
      id: "apply-through-whatsapp",
      title: "Apply Through WhatsApp",
      variant: "steps",
      paragraphs: [
        "When you receive a job alert, read the job details carefully. If you are interested, apply directly through WhatsApp by replying to the job alert or selecting the apply option.",
      ],
    },
    {
      id: "track-application-updates",
      title: "Track Application Updates",
      variant: "steps",
      paragraphs: [
        "After applying, you may receive updates such as applied, shortlisted, interview scheduled, selected, or joining confirmed through WhatsApp.",
      ],
      bullets: [
        "Applied",
        "Shortlisted",
        "Interview scheduled",
        "Selected",
        "Joining confirmed",
      ],
    },
    {
      id: "use-your-preferred-language",
      title: "Use Your Preferred Language",
      variant: "steps",
      paragraphs: [
        "AsliJobs supports English, Hindi, Telugu, Tamil, Kannada, and Malayalam. You can choose your preferred language to receive job alerts and updates more comfortably.",
      ],
      bullets: [
        "English",
        "Hindi",
        "Telugu",
        "Tamil",
        "Kannada",
        "Malayalam",
      ],
    },
    {
      id: "stay-safe-while-searching",
      title: "Stay Safe While Searching",
      variant: "safety",
      paragraphs: [
        "Do not pay money for job confirmation. Always check the company name, job location, salary, work timing, and interview details before proceeding. Report fake jobs, payment demands, or suspicious messages to AsliJobs support immediately.",
      ],
      bullets: [
        "Do not pay money for job confirmation.",
        "Check company name.",
        "Check job location.",
        "Check salary.",
        "Check work timing.",
        "Check interview details.",
        "Report fake jobs.",
        "Report payment demands.",
        "Report suspicious messages.",
      ],
    },
    {
      id: "get-support-when-needed",
      title: "Get Support When Needed",
      variant: "steps",
      paragraphs: [
        "You can contact AsliJobs support through WhatsApp, call, or email for help with registration, job alerts, applications, interviews, profile updates, language support, or complaints.",
      ],
      bullets: [
        "WhatsApp",
        "Call",
        "Email",
        "Registration",
        "Job alerts",
        "Applications",
        "Interviews",
        "Profile updates",
        "Language support",
        "Complaints",
      ],
    },
  ],
  cta: {
    title: "Start Your Job Search",
    paragraphs: [
      "With AsliJobs, finding and applying for jobs is simple, familiar, and easy.",
    ],
    tagline: "Create your profile. Receive job alerts. Apply through WhatsApp.",
    badge: "WhatsApp",
    actions: JOB_SEEKER_CTA_ACTIONS,
  },
};
