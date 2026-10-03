type MessageShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : MessageShape<T[K]>;
};

const en = {
  publicPages: {
    breadcrumbAria: "Breadcrumb",
    actions: {
      startOnWhatsapp: "Start on WhatsApp",
      browseJobs: "Browse Jobs",
      postAJob: "Post a Job",
      employerLogin: "Employer Login",
      contactSupport: "Contact Support",
    },
    findJobs: {
      title: "Find Jobs",
      metaDescription:
        "Looking for the right job? AsliJobs makes job search simple, quick, and easy through WhatsApp.",
      intro: {
        i1: "Looking for the right job? AsliJobs makes job search simple, quick, and easy through WhatsApp.",
        i2: "AsliJobs helps job seekers find blue-collar and grey-collar jobs based on their location, job category, experience, skills, language preference, and availability. Whether you are looking for office support work, delivery jobs, driving jobs, electrician work, housekeeping, security, warehouse jobs, retail jobs, technician roles, or other workforce opportunities, AsliJobs helps you connect with suitable employers.",
      },
      sections: {
        findJobsThroughWhatsapp: {
          title: "Find Jobs Through WhatsApp",
          p1: "You do not need to download any new app. With AsliJobs, you can receive job alerts, view job details, apply for jobs, and get interview updates directly on WhatsApp.",
          p2: "Simply start the AsliJobs WhatsApp chat, share your basic profile details, select your preferred job category and location, and receive suitable job opportunities.",
        },
        jobsBasedOnYourLocation: {
          title: "Jobs Based on Your Location",
          p1: "AsliJobs helps you find jobs based on your city, area, locality, or preferred work location. This makes it easier to discover nearby job opportunities and apply for jobs that are convenient for you.",
        },
        applyEasily: {
          title: "Apply Easily",
          p1: "When you receive a job alert, you can check the job title, salary, location, timings, experience required, and other details. If you are interested, you can apply directly through WhatsApp by replying to the job alert or selecting the apply option.",
        },
        stayUpdated: {
          title: "Stay Updated",
          p1: "After applying, you will receive important updates through WhatsApp, including application status, shortlisting updates, interview details, selection status, and joining information.",
        },
        safeJobSearch: {
          title: "Safe Job Search",
          p1: "AsliJobs focuses on creating a simple and reliable job search experience. Job seekers should always check job details carefully and report any fake job, payment demand, or suspicious activity to AsliJobs support.",
        },
      },
      cta: {
        title: "Start Finding Jobs",
        p1: "Start your job search with AsliJobs and receive suitable job opportunities directly on WhatsApp.",
        tagline: "Find jobs. Apply easily. Get updates on WhatsApp.",
        badge: "WhatsApp",
      },
    },
    browseByCity: {
      title: "Browse by City",
      metaDescription:
        "Find blue-collar and grey-collar jobs in your preferred city with AsliJobs through WhatsApp.",
      intro: {
        i1: "Find blue-collar and grey-collar jobs in your preferred city with AsliJobs. Whether you are looking for a nearby job or planning to work in another city, AsliJobs helps you discover suitable opportunities through WhatsApp.",
      },
      sections: {
        findJobsInYourCity: {
          title: "Find Jobs in Your City",
          p1: "AsliJobs allows job seekers to search for jobs based on city, area, locality, and preferred work location. This helps you find jobs that are closer, easier to reach, and suitable for your daily routine.",
        },
        howItWorks: {
          title: "How It Works",
          p1: "Select your city, choose your job category, and share your basic profile details. Based on your location, experience, skills, and availability, AsliJobs will send suitable job alerts directly on WhatsApp.",
          b1: "Select city",
          b2: "Choose job category",
          b3: "Share basic profile details",
          b4: "Matching based on location, experience, skills and availability",
          b5: "Receive suitable job alerts through WhatsApp",
        },
        cityBasedJobAlerts: {
          title: "City-Based Job Alerts",
          p1: "You can receive job alerts for roles such as office support, delivery, driver, electrician, plumber, housekeeping, security, helper, warehouse staff, retail staff, technician, and other workforce jobs available in your city.",
          b1: "Office support",
          b2: "Delivery",
          b3: "Driver",
          b4: "Electrician",
          b5: "Plumber",
          b6: "Housekeeping",
          b7: "Security",
          b8: "Helper",
          b9: "Warehouse staff",
          b10: "Retail staff",
          b11: "Technician",
          b12: "Other workforce jobs",
        },
        jobAvailability: {
          title: "Job Availability",
          p1: "AsliJobs serves job seekers and employers across India. Job availability may vary based on city, area, locality, job category, and employer openings.",
        },
      },
      cta: {
        title: "Start Searching",
        p1: "Choose your city and start receiving job opportunities directly on WhatsApp.",
        tagline: "Find jobs near you. Apply easily through WhatsApp.",
        badge: "WhatsApp",
      },
    },
    browseByState: {
      title: "Browse by State",
      metaDescription:
        "Find blue-collar and grey-collar jobs across different states in India with AsliJobs through WhatsApp.",
      intro: {
        i1: "Find blue-collar and grey-collar jobs across different states in India with AsliJobs. Whether you want to work in your home state or explore opportunities in another state, AsliJobs helps you discover suitable jobs through WhatsApp.",
      },
      sections: {
        findJobsStateWise: {
          title: "Find Jobs State-Wise",
          p1: "AsliJobs allows job seekers to search for jobs based on state, city, area, locality, and preferred work location. This makes it easier to find opportunities that match your location and job preference.",
        },
        howItWorks: {
          title: "How It Works",
          p1: "Select your state, choose your city or locality, and share your preferred job category. Based on your profile details, AsliJobs will send suitable job alerts directly on WhatsApp.",
          b1: "Select state",
          b2: "Choose city/locality",
          b3: "Select preferred job category",
          b4: "Receive suitable job alerts through WhatsApp",
        },
        stateBasedJobAlerts: {
          title: "State-Based Job Alerts",
          p1: "You can receive job alerts for roles such as office support, delivery, driver, electrician, plumber, housekeeping, security, helper, warehouse staff, retail staff, technician, and other workforce jobs available in your selected state.",
          b1: "Office support",
          b2: "Delivery",
          b3: "Driver",
          b4: "Electrician",
          b5: "Plumber",
          b6: "Housekeeping",
          b7: "Security",
          b8: "Helper",
          b9: "Warehouse staff",
          b10: "Retail staff",
          b11: "Technician",
          b12: "Other workforce jobs",
        },
        jobAvailability: {
          title: "Job Availability",
          p1: "AsliJobs serves job seekers and employers across India. Job availability may vary based on state, city, locality, job category, and employer openings.",
        },
      },
      cta: {
        title: "Start Searching",
        p1: "Choose your preferred state and start receiving suitable job opportunities on WhatsApp.",
        tagline: "Search state-wise. Apply easily. Get updates on WhatsApp.",
        badge: "WhatsApp",
      },
    },
    jobCategories: {
      title: "Job Categories",
      metaDescription:
        "AsliJobs helps job seekers find blue-collar and grey-collar jobs across different categories through WhatsApp.",
      intro: {
        i1: "AsliJobs helps job seekers find blue-collar and grey-collar jobs across different categories. Whether you are looking for field work, technical work, office support, delivery, retail, or service-based roles, AsliJobs makes it easy to discover suitable jobs through WhatsApp.",
      },
      sections: {
        exploreJobsByCategory: {
          title: "Explore Jobs by Category",
          p1: "You can choose your preferred job category while creating your profile. Based on your skills, experience, location, and availability, AsliJobs will send suitable job alerts directly on WhatsApp.",
        },
        popularJobCategories: {
          title: "Popular Job Categories",
          cards: {
            officeSupport: {
              title: "Office Support",
              description:
                "Jobs like office assistant, admin helper, receptionist, data entry support, and back-office staff.",
            },
            deliveryLogistics: {
              title: "Delivery & Logistics",
              description:
                "Jobs like delivery executive, courier staff, logistics helper, and field delivery roles.",
            },
            driverJobs: {
              title: "Driver Jobs",
              description:
                "Jobs for car drivers, commercial drivers, personal drivers, and company drivers.",
            },
            electricianJobs: {
              title: "Electrician Jobs",
              description:
                "Jobs for electricians, electrical helpers, wiring technicians, and maintenance staff.",
            },
            plumbingJobs: {
              title: "Plumbing Jobs",
              description:
                "Jobs for plumbers, plumbing assistants, and maintenance support workers.",
            },
            housekeepingJobs: {
              title: "Housekeeping Jobs",
              description:
                "Jobs for housekeeping staff, cleaning staff, facility support, and maintenance workers.",
            },
            securityJobs: {
              title: "Security Jobs",
              description:
                "Jobs for security guards, watchmen, building security, and site security staff.",
            },
            warehouseJobs: {
              title: "Warehouse Jobs",
              description:
                "Jobs for warehouse helpers, packers, loaders, inventory assistants, and store support staff.",
            },
            retailJobs: {
              title: "Retail Jobs",
              description:
                "Jobs for sales staff, store assistants, cashiers, promoters, and customer support roles.",
            },
            technicianJobs: {
              title: "Technician Jobs",
              description:
                "Jobs for AC technicians, appliance technicians, machine operators, mechanics, and service technicians.",
            },
            helperJobs: {
              title: "Helper Jobs",
              description:
                "Jobs for general helpers, site helpers, factory helpers, shop helpers, and support workers.",
            },
            otherWorkforceJobs: {
              title: "Other Workforce Jobs",
              description:
                "AsliJobs may also include other blue-collar and grey-collar job roles based on employer requirements and location availability.",
            },
          },
        },
        jobsBasedOnYourLocation: {
          title: "Jobs Based on Your Location",
          p1: "Job availability may vary based on your state, city, area, locality, job category, and employer openings. You can select your preferred location to receive more relevant job alerts.",
        },
      },
      cta: {
        title: "Start Finding the Right Job",
        p1: "Choose your job category and start receiving suitable job opportunities directly on WhatsApp.",
        tagline: "Select your category. Get job alerts. Apply easily through WhatsApp.",
        badge: "WhatsApp",
      },
    },
    jobSeekerGuide: {
      title: "Job Seeker Guide",
      metaDescription:
        "AsliJobs makes job search simple for India’s blue-collar and grey-collar workforce through WhatsApp.",
      intro: {
        i1: "AsliJobs makes job search simple for India’s blue-collar and grey-collar workforce. With AsliJobs, job seekers can find suitable jobs, apply easily, and receive updates directly through WhatsApp.",
      },
      sections: {
        startWithWhatsapp: {
          title: "Start with WhatsApp",
          p1: "You do not need to download any new app. You can start by clicking the AsliJobs WhatsApp link, scanning the QR code, or sending a message to the official AsliJobs WhatsApp number.",
        },
        createYourProfile: {
          title: "Create Your Profile",
          p1: "Share your basic details like name, mobile number, location, preferred language, job category, skills, experience, expected salary, and availability. This helps AsliJobs send you more suitable job opportunities.",
          b1: "Name",
          b2: "Mobile number",
          b3: "Location",
          b4: "Preferred language",
          b5: "Job category",
          b6: "Skills",
          b7: "Experience",
          b8: "Expected salary",
          b9: "Availability",
        },
        chooseYourJobCategory: {
          title: "Choose Your Job Category",
          p1: "Select the type of job you are looking for, such as office support, delivery, driver, electrician, housekeeping, security, retail, warehouse, technician, helper, or other available workforce jobs.",
          b1: "Office support",
          b2: "Delivery",
          b3: "Driver",
          b4: "Electrician",
          b5: "Housekeeping",
          b6: "Security",
          b7: "Retail",
          b8: "Warehouse",
          b9: "Technician",
          b10: "Helper",
          b11: "Other available workforce jobs",
        },
        selectYourLocation: {
          title: "Select Your Location",
          p1: "Choose your state, city, area, or locality so AsliJobs can show jobs that are closer and more convenient for you.",
          b1: "State",
          b2: "City",
          b3: "Area",
          b4: "Locality",
        },
        receiveJobAlerts: {
          title: "Receive Job Alerts",
          p1: "You will receive suitable job alerts on WhatsApp based on your profile, location, job category, and availability. Keep your profile updated to receive better job matches.",
        },
        applyThroughWhatsapp: {
          title: "Apply Through WhatsApp",
          p1: "When you receive a job alert, read the job details carefully. If you are interested, apply directly through WhatsApp by replying to the job alert or selecting the apply option.",
        },
        trackApplicationUpdates: {
          title: "Track Application Updates",
          p1: "After applying, you may receive updates such as applied, shortlisted, interview scheduled, selected, or joining confirmed through WhatsApp.",
          b1: "Applied",
          b2: "Shortlisted",
          b3: "Interview scheduled",
          b4: "Selected",
          b5: "Joining confirmed",
        },
        useYourPreferredLanguage: {
          title: "Use Your Preferred Language",
          p1: "AsliJobs supports English, Hindi, Telugu, Tamil, Kannada, and Malayalam. You can choose your preferred language to receive job alerts and updates more comfortably.",
          b1: "English",
          b2: "Hindi",
          b3: "Telugu",
          b4: "Tamil",
          b5: "Kannada",
          b6: "Malayalam",
        },
        staySafeWhileSearching: {
          title: "Stay Safe While Searching",
          p1: "Do not pay money for job confirmation. Always check the company name, job location, salary, work timing, and interview details before proceeding. Report fake jobs, payment demands, or suspicious messages to AsliJobs support immediately.",
          b1: "Do not pay money for job confirmation.",
          b2: "Check company name.",
          b3: "Check job location.",
          b4: "Check salary.",
          b5: "Check work timing.",
          b6: "Check interview details.",
          b7: "Report fake jobs.",
          b8: "Report payment demands.",
          b9: "Report suspicious messages.",
        },
        getSupportWhenNeeded: {
          title: "Get Support When Needed",
          p1: "You can contact AsliJobs support through WhatsApp, call, or email for help with registration, job alerts, applications, interviews, profile updates, language support, or complaints.",
          b1: "WhatsApp",
          b2: "Call",
          b3: "Email",
          b4: "Registration",
          b5: "Job alerts",
          b6: "Applications",
          b7: "Interviews",
          b8: "Profile updates",
          b9: "Language support",
          b10: "Complaints",
        },
      },
      cta: {
        title: "Start Your Job Search",
        p1: "With AsliJobs, finding and applying for jobs is simple, familiar, and easy.",
        tagline: "Create your profile. Receive job alerts. Apply through WhatsApp.",
        badge: "WhatsApp",
      },
    },
    postAJob: {
      title: "Post a Job",
      metaDescription: "Hire the right blue-collar and grey-collar candidates with AsliJobs.",
      intro: {
        i1: "Hire the right blue-collar and grey-collar candidates with AsliJobs. Whether you need office support staff, delivery executives, drivers, electricians, housekeeping staff, security guards, warehouse workers, retail staff, technicians, or helpers, AsliJobs helps you reach suitable job seekers easily.",
      },
      sections: {
        postJobsEasily: {
          title: "Post Jobs Easily",
          p1: "Employers can post jobs on AsliJobs by sharing important details such as job title, location, salary, work timings, number of openings, experience required, skills needed, benefits, and interview details.",
          b1: "Job title",
          b2: "Location",
          b3: "Salary",
          b4: "Work timings",
          b5: "Number of openings",
          b6: "Experience required",
          b7: "Skills needed",
          b8: "Benefits",
          b9: "Interview details",
        },
        reachSuitableCandidates: {
          title: "Reach Suitable Candidates",
          p1: "Once your job is posted, AsliJobs helps share the opportunity with relevant job seekers based on location, job category, experience, language preference, and availability.",
        },
        manageApplications: {
          title: "Manage Applications",
          p1: "Employers can view applications, shortlist candidates, schedule interviews, and track hiring progress through the employer dashboard or with support from the AsliJobs team.",
        },
        promoteYourJob: {
          title: "Promote Your Job",
          p1: "Employers can choose promoted jobs or campaign promotions to increase visibility and reach more suitable candidates.",
        },
      },
      cta: {
        title: "Start Hiring with AsliJobs",
        p1: "Post your job on AsliJobs and connect with candidates who are ready to work.",
        tagline: "Post a job. Reach suitable candidates. Hire faster.",
        badge: "For Employers",
      },
    },
    employerLogin: {
      title: "Employer Login",
      metaDescription:
        "Access your AsliJobs employer dashboard to manage job posts, applications, candidates, interviews, hiring plans, and promotions.",
      intro: {
        i1: "Access your AsliJobs employer dashboard to manage job posts, applications, candidates, interviews, hiring plans, and promotions in one place.",
      },
      sections: {
        loginToYourEmployerDashboard: {
          title: "Login to Your Employer Dashboard",
          p1: "Employers can log in using their registered mobile number, email address, or the login option provided by AsliJobs.",
        },
        manageJobPosts: {
          title: "Manage Job Posts",
          p1: "After logging in, employers can post new jobs, edit job details, update openings, pause jobs, close filled positions, and track active job posts.",
        },
        viewApplications: {
          title: "View Applications",
          p1: "Employers can view applications received for their job posts, check candidate details, and shortlist suitable profiles based on hiring requirements.",
        },
        scheduleInterviews: {
          title: "Schedule Interviews",
          p1: "Employers can schedule interviews by adding the interview date, time, location, and contact person details. Candidates can receive interview updates through WhatsApp.",
        },
        trackHiringProgress: {
          title: "Track Hiring Progress",
          p1: "The employer dashboard helps track application status, shortlisted candidates, interviews scheduled, selected candidates, and closed job posts.",
        },
        managePlansAndPromotions: {
          title: "Manage Plans and Promotions",
          p1: "Employers can view hiring plans, promoted jobs, campaign promotions, payments, invoices, and renewal details through the dashboard.",
        },
        needLoginHelp: {
          title: "Need Login Help?",
          p1: "If you are unable to log in or access your employer dashboard, contact AsliJobs support through WhatsApp, call, or email.",
          b1: "WhatsApp",
          b2: "Call",
          b3: "Email",
        },
      },
      cta: {
        title: "Employer Login",
        tagline: "Login. Manage jobs. Hire faster with AsliJobs.",
        badge: "For Employers",
      },
    },
    pricingPlans: {
      title: "Pricing Plans",
      metaDescription:
        "Choose the right hiring plan for your business and connect with suitable blue-collar and grey-collar candidates through AsliJobs.",
      intro: {
        i1: "Choose the right hiring plan for your business and connect with suitable blue-collar and grey-collar candidates through AsliJobs.",
        i2: "AsliJobs offers paid hiring plans for employers who want to post jobs, receive applications, promote openings, and manage hiring more effectively.",
      },
      sections: {
        simplePlansForEveryHiringNeed: {
          title: "Simple Plans for Every Hiring Need",
          p1: "Whether you are hiring for one role or multiple openings, AsliJobs helps you reach job seekers based on location, job category, experience, language preference, and availability.",
        },
        employerHiringPlans: {
          title: "Employer Hiring Plans",
          cards: {
            basicHiringPlan: {
              title: "Basic Hiring Plan",
              description:
                "Best For: Employers with limited hiring needs. Includes: Job posting, candidate applications, and basic dashboard access.",
            },
            standardHiringPlan: {
              title: "Standard Hiring Plan",
              description:
                "Best For: Employers hiring regularly. Includes: Multiple job postings, more candidate reach, application tracking, and support.",
            },
            premiumHiringPlan: {
              title: "Premium Hiring Plan",
              description:
                "Best For: Employers who need faster hiring. Includes: Higher visibility, promoted job options, priority support, and better candidate reach.",
            },
            campaignHiringPlan: {
              title: "Campaign Hiring Plan",
              description:
                "Best For: Employers with bulk or urgent hiring needs. Includes: Targeted hiring campaigns, location-based reach, WhatsApp job alerts, and hiring support.",
            },
          },
        },
        whatEmployersCanDo: {
          title: "What Employers Can Do",
          b1: "Post jobs",
          b2: "Receive candidate applications",
          b3: "View candidate details",
          b4: "Shortlist suitable profiles",
          b5: "Schedule interviews",
          b6: "Track hiring progress",
          b7: "Promote job openings",
          b8: "Get support for hiring-related queries",
        },
        promotedJobs: {
          title: "Promoted Jobs",
          p1: "Promoted jobs help employers increase visibility for important or urgent openings. These jobs can reach more relevant job seekers based on location, job role, and candidate profile.",
        },
        campaignPromotions: {
          title: "Campaign Promotions",
          p1: "Campaign promotions are useful for employers who want to hire in bulk, target specific locations, or reach job seekers in selected job categories.",
        },
        paymentsAndInvoices: {
          title: "Payments and Invoices",
          p1: "Employers can choose a suitable plan and complete the payment through the available payment options. After payment, invoices can be requested through AsliJobs support.",
        },
        needHelpChoosingAPlan: {
          title: "Need Help Choosing a Plan?",
          p1: "If you are not sure which plan is right for your hiring need, contact AsliJobs support. Our team will help you choose a suitable plan based on your job role, location, number of openings, and hiring urgency.",
        },
      },
      cta: {
        title: "Start Hiring with AsliJobs",
        tagline: "Choose a plan. Post your job. Start hiring with AsliJobs.",
        badge: "For Employers",
      },
    },
    employerGuide: {
      title: "Employer Guide",
      metaDescription:
        "AsliJobs helps employers hire suitable blue-collar and grey-collar candidates through a simple, WhatsApp-friendly hiring process.",
      intro: {
        i1: "AsliJobs helps employers hire suitable blue-collar and grey-collar candidates through a simple, WhatsApp-friendly hiring process. Whether you are hiring for one role or multiple openings, AsliJobs helps you reach job seekers based on location, job category, experience, skills, language preference, and availability.",
      },
      sections: {
        registerAsAnEmployer: {
          title: "Register as an Employer",
          p1: "Start by creating your employer profile on AsliJobs. Share basic details like employer name, company name, contact person details, mobile number, location, business type, hiring categories, and preferred language.",
          b1: "Employer name",
          b2: "Company name",
          b3: "Contact person details",
          b4: "Mobile number",
          b5: "Location",
          b6: "Business type",
          b7: "Hiring categories",
          b8: "Preferred language",
        },
        postAJob: {
          title: "Post a Job",
          p1: "Post your job by adding clear details such as job title, salary range, work location, timings, number of openings, experience required, skills needed, benefits, and interview details. Clear job details help job seekers understand the opportunity better and apply with confidence.",
        },
        receiveApplications: {
          title: "Receive Applications",
          p1: "Once your job is posted, suitable job seekers can view and apply for the job. Applications can be managed through the employer dashboard or with support from the AsliJobs team.",
        },
        shortlistCandidates: {
          title: "Shortlist Candidates",
          p1: "Review candidate details such as name, location, experience, skills, expected salary, availability, and preferred language. Shortlist candidates who match your hiring requirements.",
        },
        scheduleInterviews: {
          title: "Schedule Interviews",
          p1: "After shortlisting, schedule interviews by sharing the interview date, time, location, and contact person details. Candidates can receive interview updates through WhatsApp.",
        },
        trackHiringProgress: {
          title: "Track Hiring Progress",
          p1: "Use the employer dashboard to track applications, shortlisted candidates, interviews scheduled, selected candidates, and closed job posts.",
        },
        promoteJobOpenings: {
          title: "Promote Job Openings",
          p1: "Employers can choose promoted jobs or campaign promotions to improve job visibility and reach more suitable candidates faster.",
        },
        updateOrCloseJobPosts: {
          title: "Update or Close Job Posts",
          p1: "Keep your job posts updated. If a position is filled, paused, cancelled, or no longer available, update or close the job post through the dashboard or by contacting AsliJobs support.",
        },
        getEmployerSupport: {
          title: "Get Employer Support",
          p1: "Employers can contact AsliJobs support through WhatsApp, call, or email for help with job posting, applications, candidate shortlisting, interviews, payments, invoices, promotions, or dashboard support.",
          b1: "WhatsApp",
          b2: "Call",
          b3: "Email",
          b4: "Job posting",
          b5: "Applications",
          b6: "Candidate shortlisting",
          b7: "Interviews",
          b8: "Payments",
          b9: "Invoices",
          b10: "Promotions",
          b11: "Dashboard support",
        },
        hiringTipsForEmployers: {
          title: "Hiring Tips for Employers",
          b1: "Add complete and clear job details.",
          b2: "Mention the correct salary, location, and work timings.",
          b3: "Respond to applications on time.",
          b4: "Share interview details clearly.",
          b5: "Close filled jobs to avoid unnecessary applications.",
          b6: "Use promotions for urgent or bulk hiring needs.",
        },
      },
      cta: {
        title: "Start Hiring with AsliJobs",
        p1: "AsliJobs makes hiring easier by connecting employers with suitable workforce candidates through a simple and familiar platform.",
        tagline: "Create your employer profile. Post a job. Hire faster with AsliJobs.",
        badge: "For Employers",
      },
    },
    interviewTips: {
      title: "Interview Tips",
      metaDescription:
        "Simple interview tips to help job seekers prepare well, attend interviews with confidence, and get selected.",
      intro: {
        i1: "A little preparation can help you feel confident and make a good impression at your interview. Use these simple tips before, during, and after your interview.",
      },
      sections: {
        prepareBeforeTheInterview: {
          title: "Prepare Before the Interview",
          p1: "Read the job details again, including the job role, salary, work location, and timings. Think about how your skills and experience match the job.",
        },
        documentsToCarry: {
          title: "Documents to Carry",
          p1: "Keep your documents ready the day before so you do not rush on the interview day.",
          b1: "ID proof such as Aadhaar card",
          b2: "Resume or profile details",
          b3: "Experience or salary certificates, if available",
          b4: "Educational certificates, if required",
          b5: "Passport-size photos",
        },
        onTheInterviewDay: {
          title: "On the Interview Day",
          p1: "Plan your travel and reach the interview location 10 to 15 minutes early. Wear clean, neat clothes and keep your phone on silent.",
          b1: "Reach on time",
          b2: "Dress neatly",
          b3: "Greet politely",
          b4: "Keep your phone on silent",
        },
        answerWithConfidence: {
          title: "Answer With Confidence",
          p1: "Listen carefully, answer honestly, and speak clearly. Be ready for common questions like these.",
          b1: "Tell me about yourself.",
          b2: "What work have you done before?",
          b3: "When can you join?",
          b4: "What salary do you expect?",
        },
        afterTheInterview: {
          title: "After the Interview",
          p1: "Thank the interviewer before you leave. Interview results and next steps are shared on WhatsApp, so keep checking your messages and reply on time.",
        },
        staySafe: {
          title: "Stay Safe",
          p1: "Genuine employers do not ask for money to schedule an interview or confirm a job. If anyone asks you to pay, do not pay and report it to AsliJobs support immediately.",
          b1: "Do not pay for interviews or job confirmation.",
          b2: "Attend interviews only at the address shared in the job details.",
          b3: "Report suspicious requests to AsliJobs support.",
        },
      },
      cta: {
        title: "Get Interview Updates on WhatsApp",
        p1: "Apply for suitable jobs and receive interview details directly on WhatsApp.",
        tagline: "Prepare well. Attend on time. Get selected.",
        badge: "WhatsApp",
      },
    },
    salaryGuide: {
      title: "Salary Guide",
      metaDescription:
        "Understand salary details in job offers, including in-hand salary, deductions, extra pay, and payment schedules, before you accept a job.",
      intro: {
        i1: "Salary is one of the most important parts of any job. This guide helps you understand the salary details in a job alert or offer so you can make the right decision.",
      },
      sections: {
        checkTheSalaryInJobDetails: {
          title: "Check the Salary in Job Details",
          p1: "Every job on AsliJobs shows the salary offered by the employer. Read it carefully along with the job role, work timings, and location before you apply.",
        },
        inHandSalaryAndDeductions: {
          title: "In-Hand Salary and Deductions",
          p1: "In-hand salary is the amount you receive after deductions. Ask the employer whether the salary shown is in-hand or before deductions such as PF or ESI.",
          b1: "In-hand (take-home) salary",
          b2: "PF (Provident Fund)",
          b3: "ESI (Employee State Insurance)",
          b4: "Other deductions, if any",
        },
        extraPayAndBenefits: {
          title: "Extra Pay and Benefits",
          p1: "Some jobs offer extra pay or benefits along with the salary. Ask clearly about what is included.",
          b1: "Overtime pay",
          b2: "Incentives",
          b3: "Food or accommodation",
          b4: "Travel allowance",
          b5: "Weekly off and paid leave",
        },
        salaryPaymentSchedule: {
          title: "Salary Payment Schedule",
          p1: "Confirm when and how the salary will be paid, such as monthly, weekly, or daily, and whether it is paid by bank transfer or cash. Keep a record of your salary payments.",
        },
        whatAffectsYourSalary: {
          title: "What Affects Your Salary",
          p1: "Salary can differ based on these factors. Improving your skills and keeping your profile updated can help you find better-paying jobs.",
          b1: "Experience",
          b2: "Skills",
          b3: "Job category",
          b4: "City and location",
          b5: "Shift and work timings",
        },
        salarySafety: {
          title: "Salary Safety",
          p1: "Never pay money to get a job or a higher salary. Be careful of offers that promise a very high salary for little work, and report them to AsliJobs support.",
          b1: "Never pay money to get a job.",
          b2: "Be careful of unrealistic salary promises.",
          b3: "Report suspicious offers to AsliJobs support.",
        },
      },
      cta: {
        title: "Find Jobs With Clear Salary Details",
        p1: "Receive job alerts with salary, location, and timings directly on WhatsApp.",
        tagline: "Know your salary. Choose the right job.",
        badge: "WhatsApp",
      },
    },
    careerAdvice: {
      title: "Career Advice",
      metaDescription:
        "Practical career advice to help job seekers grow their skills, find better jobs, and build a stable career.",
      intro: {
        i1: "Every job is a step in your career. These practical tips can help you grow your skills, find better opportunities, and build a stable future.",
      },
      sections: {
        keepYourProfileUpdated: {
          title: "Keep Your Profile Updated",
          p1: "Update your skills, experience, preferred location, and expected salary whenever they change. An updated profile helps AsliJobs send you better job matches.",
        },
        learnNewSkills: {
          title: "Learn New Skills",
          p1: "New skills can open better jobs and a higher salary. Learn from experienced co-workers, join short training courses, and get certificates where possible.",
          b1: "Driving licence for driver jobs",
          b2: "Basic computer and mobile skills",
          b3: "Workplace safety training",
          b4: "Trade skills such as electrical or plumbing work",
          b5: "Customer service and communication",
        },
        chooseTheRightJob: {
          title: "Choose the Right Job",
          p1: "Look beyond salary. Consider these points before you accept a job.",
          b1: "Work location and travel time",
          b2: "Shift timings",
          b3: "Job security",
          b4: "Growth opportunities",
        },
        growInYourCurrentJob: {
          title: "Grow in Your Current Job",
          p1: "Be punctual, reliable, and honest at work. Good attendance and a positive attitude help you earn trust, responsibility, and promotions.",
          b1: "Be on time",
          b2: "Learn from your supervisor",
          b3: "Take responsibility",
          b4: "Keep a record of your work experience",
        },
        planYourNextStep: {
          title: "Plan Your Next Step",
          p1: "Set a clear goal, such as becoming a supervisor, senior technician, or team leader. Collect experience letters and references to support your next job application.",
        },
      },
      cta: {
        title: "Take the Next Step in Your Career",
        p1: "Find jobs that match your skills and goals, and receive alerts directly on WhatsApp.",
        tagline: "Learn. Grow. Find better jobs.",
        badge: "WhatsApp",
      },
    },
  },
} as const;

const hi: MessageShape<typeof en> = {
  publicPages: {
    breadcrumbAria: "ब्रेडक्रम्ब",
    actions: {
      startOnWhatsapp: "WhatsApp पर शुरू करें",
      browseJobs: "नौकरियाँ देखें",
      postAJob: "नौकरी पोस्ट करें",
      employerLogin: "नियोक्ता लॉगिन",
      contactSupport: "सपोर्ट से संपर्क करें",
    },
    findJobs: {
      title: "नौकरियाँ खोजें",
      metaDescription:
        "सही नौकरी ढूँढ रहे हैं? AsliJobs WhatsApp के ज़रिए नौकरी खोजना सरल, तेज़ और आसान बनाता है।",
      intro: {
        i1: "सही नौकरी ढूँढ रहे हैं? AsliJobs WhatsApp के ज़रिए नौकरी खोजना सरल, तेज़ और आसान बनाता है।",
        i2: "AsliJobs नौकरी खोजने वालों को उनके स्थान, नौकरी श्रेणी, अनुभव, कौशल, भाषा प्राथमिकता और उपलब्धता के आधार पर ब्लू-कॉलर और ग्रे-कॉलर नौकरियाँ खोजने में मदद करता है। चाहे आप ऑफिस सपोर्ट, डिलीवरी, ड्राइविंग, इलेक्ट्रीशियन, हाउसकीपिंग, सिक्योरिटी, वेयरहाउस, रिटेल, टेक्नीशियन या अन्य वर्कफोर्स अवसर ढूँढ रहे हों, AsliJobs आपको उपयुक्त नियोक्ताओं से जोड़ता है।",
      },
      sections: {
        findJobsThroughWhatsapp: {
          title: "WhatsApp से नौकरियाँ खोजें",
          p1: "आपको कोई नया ऐप डाउनलोड करने की ज़रूरत नहीं है। AsliJobs के साथ आप जॉब अलर्ट पा सकते हैं, नौकरी का विवरण देख सकते हैं, आवेदन कर सकते हैं और इंटरव्यू अपडेट सीधे WhatsApp पर ले सकते हैं।",
          p2: "बस AsliJobs WhatsApp चैट शुरू करें, अपनी बुनियादी प्रोफ़ाइल जानकारी साझा करें, पसंदीदा नौकरी श्रेणी और स्थान चुनें, और उपयुक्त नौकरी के अवसर पाएँ।",
        },
        jobsBasedOnYourLocation: {
          title: "आपके स्थान पर आधारित नौकरियाँ",
          p1: "AsliJobs आपके शहर, इलाके, लोकेलिटी या पसंदीदा कार्य स्थान के आधार पर नौकरियाँ खोजने में मदद करता है। इससे नज़दीकी और आपके लिए सुविधाजनक नौकरियाँ ढूँढना और आवेदन करना आसान होता है।",
        },
        applyEasily: {
          title: "आसानी से आवेदन करें",
          p1: "जब आपको जॉब अलर्ट मिले, तो आप जॉब टाइटल, वेतन, स्थान, समय, आवश्यक अनुभव और अन्य विवरण देख सकते हैं। अगर आप रुचि रखते हैं, तो जॉब अलर्ट का जवाब देकर या आवेदन विकल्प चुनकर सीधे WhatsApp से आवेदन कर सकते हैं।",
        },
        stayUpdated: {
          title: "अपडेट रहते रहें",
          p1: "आवेदन करने के बाद आपको WhatsApp पर महत्वपूर्ण अपडेट मिलेंगे, जिनमें आवेदन की स्थिति, शॉर्टलिस्ट अपडेट, इंटरव्यू विवरण, चयन स्थिति और जॉइनिंग जानकारी शामिल है।",
        },
        safeJobSearch: {
          title: "सुरक्षित नौकरी खोज",
          p1: "AsliJobs एक सरल और भरोसेमंद नौकरी खोज अनुभव बनाने पर ध्यान देता है। नौकरी खोजने वालों को हमेशा नौकरी का विवरण ध्यान से जाँचना चाहिए और किसी भी नकली नौकरी, भुगतान की माँग या संदिग्ध गतिविधि की AsliJobs सपोर्ट को रिपोर्ट करनी चाहिए।",
        },
      },
      cta: {
        title: "नौकरियाँ खोजना शुरू करें",
        p1: "AsliJobs के साथ अपनी नौकरी खोज शुरू करें और उपयुक्त नौकरी के अवसर सीधे WhatsApp पर पाएँ।",
        tagline: "नौकरियाँ खोजें। आसानी से आवेदन करें। WhatsApp पर अपडेट पाएँ।",
        badge: "WhatsApp",
      },
    },
    browseByCity: {
      title: "शहर के अनुसार देखें",
      metaDescription:
        "AsliJobs के साथ WhatsApp के ज़रिए अपने पसंदीदा शहर में ब्लू-कॉलर और ग्रे-कॉलर नौकरियाँ खोजें।",
      intro: {
        i1: "AsliJobs के साथ अपने पसंदीदा शहर में ब्लू-कॉलर और ग्रे-कॉलर नौकरियाँ खोजें। चाहे आप नज़दीकी नौकरी ढूँढ रहे हों या दूसरे शहर में काम करने की योजना बना रहे हों, AsliJobs WhatsApp के ज़रिए उपयुक्त अवसर खोजने में मदद करता है।",
      },
      sections: {
        findJobsInYourCity: {
          title: "अपने शहर में नौकरियाँ खोजें",
          p1: "AsliJobs नौकरी खोजने वालों को शहर, इलाके, लोकेलिटी और पसंदीदा कार्य स्थान के आधार पर नौकरियाँ खोजने देता है। इससे आपको ऐसी नौकरियाँ मिलती हैं जो नज़दीक हों, पहुँचने में आसान हों और आपकी दिनचर्या के अनुकूल हों।",
        },
        howItWorks: {
          title: "यह कैसे काम करता है",
          p1: "अपना शहर चुनें, नौकरी श्रेणी चुनें और अपनी बुनियादी प्रोफ़ाइल जानकारी साझा करें। आपके स्थान, अनुभव, कौशल और उपलब्धता के आधार पर AsliJobs उपयुक्त जॉब अलर्ट सीधे WhatsApp पर भेजेगा।",
          b1: "शहर चुनें",
          b2: "नौकरी श्रेणी चुनें",
          b3: "बुनियादी प्रोफ़ाइल जानकारी साझा करें",
          b4: "स्थान, अनुभव, कौशल और उपलब्धता के आधार पर मिलान",
          b5: "WhatsApp के ज़रिए उपयुक्त जॉब अलर्ट पाएँ",
        },
        cityBasedJobAlerts: {
          title: "शहर-आधारित जॉब अलर्ट",
          p1: "आप ऑफिस सपोर्ट, डिलीवरी, ड्राइवर, इलेक्ट्रीशियन, प्लंबर, हाउसकीपिंग, सिक्योरिटी, हेल्पर, वेयरहाउस स्टाफ, रिटेल स्टाफ, टेक्नीशियन और अपने शहर में उपलब्ध अन्य वर्कफोर्स नौकरियों जैसे रोल के लिए जॉब अलर्ट पा सकते हैं।",
          b1: "ऑफिस सपोर्ट",
          b2: "डिलीवरी",
          b3: "ड्राइवर",
          b4: "इलेक्ट्रीशियन",
          b5: "प्लंबर",
          b6: "हाउसकीपिंग",
          b7: "सिक्योरिटी",
          b8: "हेल्पर",
          b9: "वेयरहाउस स्टाफ",
          b10: "रिटेल स्टाफ",
          b11: "टेक्नीशियन",
          b12: "अन्य वर्कफोर्स नौकरियाँ",
        },
        jobAvailability: {
          title: "नौकरियों की उपलब्धता",
          p1: "AsliJobs पूरे भारत में नौकरी खोजने वालों और नियोक्ताओं की सेवा करता है। नौकरियों की उपलब्धता शहर, इलाके, लोकेलिटी, नौकरी श्रेणी और नियोक्ता रिक्तियों के अनुसार बदल सकती है।",
        },
      },
      cta: {
        title: "खोज शुरू करें",
        p1: "अपना शहर चुनें और नौकरी के अवसर सीधे WhatsApp पर पाना शुरू करें।",
        tagline: "अपने पास की नौकरियाँ खोजें। WhatsApp से आसानी से आवेदन करें।",
        badge: "WhatsApp",
      },
    },
    browseByState: {
      title: "राज्य के अनुसार देखें",
      metaDescription:
        "AsliJobs के साथ WhatsApp के ज़रिए भारत के अलग-अलग राज्यों में ब्लू-कॉलर और ग्रे-कॉलर नौकरियाँ खोजें।",
      intro: {
        i1: "AsliJobs के साथ भारत के अलग-अलग राज्यों में ब्लू-कॉलर और ग्रे-कॉलर नौकरियाँ खोजें। चाहे आप अपने गृह राज्य में काम करना चाहें या किसी दूसरे राज्य में अवसर देखना चाहें, AsliJobs WhatsApp के ज़रिए उपयुक्त नौकरियाँ खोजने में मदद करता है।",
      },
      sections: {
        findJobsStateWise: {
          title: "राज्य के अनुसार नौकरियाँ खोजें",
          p1: "AsliJobs नौकरी खोजने वालों को राज्य, शहर, इलाके, लोकेलिटी और पसंदीदा कार्य स्थान के आधार पर नौकरियाँ खोजने देता है। इससे आपके स्थान और नौकरी प्राथमिकता से मेल खाने वाले अवसर ढूँढना आसान होता है।",
        },
        howItWorks: {
          title: "यह कैसे काम करता है",
          p1: "अपना राज्य चुनें, शहर या लोकेलिटी चुनें और अपनी पसंदीदा नौकरी श्रेणी साझा करें। आपके प्रोफ़ाइल विवरण के आधार पर AsliJobs उपयुक्त जॉब अलर्ट सीधे WhatsApp पर भेजेगा।",
          b1: "राज्य चुनें",
          b2: "शहर/लोकेलिटी चुनें",
          b3: "पसंदीदा नौकरी श्रेणी चुनें",
          b4: "WhatsApp के ज़रिए उपयुक्त जॉब अलर्ट पाएँ",
        },
        stateBasedJobAlerts: {
          title: "राज्य-आधारित जॉब अलर्ट",
          p1: "आप ऑफिस सपोर्ट, डिलीवरी, ड्राइवर, इलेक्ट्रीशियन, प्लंबर, हाउसकीपिंग, सिक्योरिटी, हेल्पर, वेयरहाउस स्टाफ, रिटेल स्टाफ, टेक्नीशियन और अपने चुने हुए राज्य में उपलब्ध अन्य वर्कफोर्स नौकरियों जैसे रोल के लिए जॉब अलर्ट पा सकते हैं।",
          b1: "ऑफिस सपोर्ट",
          b2: "डिलीवरी",
          b3: "ड्राइवर",
          b4: "इलेक्ट्रीशियन",
          b5: "प्लंबर",
          b6: "हाउसकीपिंग",
          b7: "सिक्योरिटी",
          b8: "हेल्पर",
          b9: "वेयरहाउस स्टाफ",
          b10: "रिटेल स्टाफ",
          b11: "टेक्नीशियन",
          b12: "अन्य वर्कफोर्स नौकरियाँ",
        },
        jobAvailability: {
          title: "नौकरियों की उपलब्धता",
          p1: "AsliJobs पूरे भारत में नौकरी खोजने वालों और नियोक्ताओं की सेवा करता है। नौकरियों की उपलब्धता राज्य, शहर, लोकेलिटी, नौकरी श्रेणी और नियोक्ता रिक्तियों के अनुसार बदल सकती है।",
        },
      },
      cta: {
        title: "खोज शुरू करें",
        p1: "अपना पसंदीदा राज्य चुनें और WhatsApp पर उपयुक्त नौकरी के अवसर पाना शुरू करें।",
        tagline: "राज्य के अनुसार खोजें। आसानी से आवेदन करें। WhatsApp पर अपडेट पाएँ।",
        badge: "WhatsApp",
      },
    },
    jobCategories: {
      title: "नौकरी श्रेणियाँ",
      metaDescription:
        "AsliJobs नौकरी खोजने वालों को WhatsApp के ज़रिए अलग-अलग श्रेणियों में ब्लू-कॉलर और ग्रे-कॉलर नौकरियाँ खोजने में मदद करता है।",
      intro: {
        i1: "AsliJobs नौकरी खोजने वालों को अलग-अलग श्रेणियों में ब्लू-कॉलर और ग्रे-कॉलर नौकरियाँ खोजने में मदद करता है। चाहे आप फील्ड वर्क, तकनीकी काम, ऑफिस सपोर्ट, डिलीवरी, रिटेल या सेवा-आधारित रोल ढूँढ रहे हों, AsliJobs WhatsApp के ज़रिए उपयुक्त नौकरियाँ खोजना आसान बनाता है।",
      },
      sections: {
        exploreJobsByCategory: {
          title: "श्रेणी के अनुसार नौकरियाँ देखें",
          p1: "प्रोफ़ाइल बनाते समय आप अपनी पसंदीदा नौकरी श्रेणी चुन सकते हैं। आपके कौशल, अनुभव, स्थान और उपलब्धता के आधार पर AsliJobs उपयुक्त जॉब अलर्ट सीधे WhatsApp पर भेजेगा।",
        },
        popularJobCategories: {
          title: "लोकप्रिय नौकरी श्रेणियाँ",
          cards: {
            officeSupport: {
              title: "ऑफिस सपोर्ट",
              description:
                "ऑफिस असिस्टेंट, एडमिन हेल्पर, रिसेप्शनिस्ट, डेटा एंट्री सपोर्ट और बैक-ऑफिस स्टाफ जैसी नौकरियाँ।",
            },
            deliveryLogistics: {
              title: "डिलीवरी और लॉजिस्टिक्स",
              description:
                "डिलीवरी एग्ज़ीक्यूटिव, कूरियर स्टाफ, लॉजिस्टिक्स हेल्पर और फील्ड डिलीवरी रोल जैसी नौकरियाँ।",
            },
            driverJobs: {
              title: "ड्राइवर नौकरियाँ",
              description:
                "कार ड्राइवर, कमर्शियल ड्राइवर, पर्सनल ड्राइवर और कंपनी ड्राइवर की नौकरियाँ।",
            },
            electricianJobs: {
              title: "इलेक्ट्रीशियन नौकरियाँ",
              description:
                "इलेक्ट्रीशियन, इलेक्ट्रिकल हेल्पर, वायरिंग टेक्नीशियन और मेंटेनेंस स्टाफ की नौकरियाँ।",
            },
            plumbingJobs: {
              title: "प्लंबिंग नौकरियाँ",
              description:
                "प्लंबर, प्लंबिंग असिस्टेंट और मेंटेनेंस सपोर्ट वर्कर की नौकरियाँ।",
            },
            housekeepingJobs: {
              title: "हाउसकीपिंग नौकरियाँ",
              description:
                "हाउसकीपिंग स्टाफ, सफाई स्टाफ, फैसिलिटी सपोर्ट और मेंटेनेंस वर्कर की नौकरियाँ।",
            },
            securityJobs: {
              title: "सिक्योरिटी नौकरियाँ",
              description:
                "सिक्योरिटी गार्ड, चौकीदार, बिल्डिंग सिक्योरिटी और साइट सिक्योरिटी स्टाफ की नौकरियाँ।",
            },
            warehouseJobs: {
              title: "वेयरहाउस नौकरियाँ",
              description:
                "वेयरहाउस हेल्पर, पैकर, लोडर, इन्वेंटरी असिस्टेंट और स्टोर सपोर्ट स्टाफ की नौकरियाँ।",
            },
            retailJobs: {
              title: "रिटेल नौकरियाँ",
              description:
                "सेल्स स्टाफ, स्टोर असिस्टेंट, कैशियर, प्रमोटर और कस्टमर सपोर्ट रोल की नौकरियाँ।",
            },
            technicianJobs: {
              title: "टेक्नीशियन नौकरियाँ",
              description:
                "एसी टेक्नीशियन, अप्लायंस टेक्नीशियन, मशीन ऑपरेटर, मैकेनिक और सर्विस टेक्नीशियन की नौकरियाँ।",
            },
            helperJobs: {
              title: "हेल्पर नौकरियाँ",
              description:
                "जनरल हेल्पर, साइट हेल्पर, फैक्ट्री हेल्पर, शॉप हेल्पर और सपोर्ट वर्कर की नौकरियाँ।",
            },
            otherWorkforceJobs: {
              title: "अन्य वर्कफोर्स नौकरियाँ",
              description:
                "नियोक्ता की ज़रूरतों और स्थान की उपलब्धता के आधार पर AsliJobs में अन्य ब्लू-कॉलर और ग्रे-कॉलर जॉब रोल भी शामिल हो सकते हैं।",
            },
          },
        },
        jobsBasedOnYourLocation: {
          title: "आपके स्थान पर आधारित नौकरियाँ",
          p1: "नौकरियों की उपलब्धता आपके राज्य, शहर, इलाके, लोकेलिटी, नौकरी श्रेणी और नियोक्ता रिक्तियों के अनुसार बदल सकती है। अधिक प्रासंगिक जॉब अलर्ट पाने के लिए आप अपना पसंदीदा स्थान चुन सकते हैं।",
        },
      },
      cta: {
        title: "सही नौकरी खोजना शुरू करें",
        p1: "अपनी नौकरी श्रेणी चुनें और उपयुक्त नौकरी के अवसर सीधे WhatsApp पर पाना शुरू करें।",
        tagline: "अपनी श्रेणी चुनें। जॉब अलर्ट पाएँ। WhatsApp से आसानी से आवेदन करें।",
        badge: "WhatsApp",
      },
    },
    jobSeekerGuide: {
      title: "नौकरी खोजने वालों की गाइड",
      metaDescription:
        "AsliJobs भारत के ब्लू-कॉलर और ग्रे-कॉलर कामगारों के लिए WhatsApp के ज़रिए नौकरी खोजना सरल बनाता है।",
      intro: {
        i1: "AsliJobs भारत के ब्लू-कॉलर और ग्रे-कॉलर कामगारों के लिए नौकरी खोजना सरल बनाता है। AsliJobs के साथ नौकरी खोजने वाले उपयुक्त नौकरियाँ खोज सकते हैं, आसानी से आवेदन कर सकते हैं और अपडेट सीधे WhatsApp पर पा सकते हैं।",
      },
      sections: {
        startWithWhatsapp: {
          title: "WhatsApp से शुरू करें",
          p1: "आपको कोई नया ऐप डाउनलोड करने की ज़रूरत नहीं है। आप AsliJobs WhatsApp लिंक पर क्लिक करके, QR कोड स्कैन करके या आधिकारिक AsliJobs WhatsApp नंबर पर संदेश भेजकर शुरू कर सकते हैं।",
        },
        createYourProfile: {
          title: "अपनी प्रोफ़ाइल बनाएँ",
          p1: "नाम, मोबाइल नंबर, स्थान, पसंदीदा भाषा, नौकरी श्रेणी, कौशल, अनुभव, अपेक्षित वेतन और उपलब्धता जैसी बुनियादी जानकारी साझा करें। इससे AsliJobs आपको अधिक उपयुक्त नौकरी के अवसर भेज सकता है।",
          b1: "नाम",
          b2: "मोबाइल नंबर",
          b3: "स्थान",
          b4: "पसंदीदा भाषा",
          b5: "नौकरी श्रेणी",
          b6: "कौशल",
          b7: "अनुभव",
          b8: "अपेक्षित वेतन",
          b9: "उपलब्धता",
        },
        chooseYourJobCategory: {
          title: "अपनी नौकरी श्रेणी चुनें",
          p1: "जिस तरह की नौकरी आप ढूँढ रहे हैं उसे चुनें, जैसे ऑफिस सपोर्ट, डिलीवरी, ड्राइवर, इलेक्ट्रीशियन, हाउसकीपिंग, सिक्योरिटी, रिटेल, वेयरहाउस, टेक्नीशियन, हेल्पर या अन्य उपलब्ध वर्कफोर्स नौकरियाँ।",
          b1: "ऑफिस सपोर्ट",
          b2: "डिलीवरी",
          b3: "ड्राइवर",
          b4: "इलेक्ट्रीशियन",
          b5: "हाउसकीपिंग",
          b6: "सिक्योरिटी",
          b7: "रिटेल",
          b8: "वेयरहाउस",
          b9: "टेक्नीशियन",
          b10: "हेल्पर",
          b11: "अन्य उपलब्ध वर्कफोर्स नौकरियाँ",
        },
        selectYourLocation: {
          title: "अपना स्थान चुनें",
          p1: "अपना राज्य, शहर, इलाका या लोकेलिटी चुनें, ताकि AsliJobs आपको नज़दीक और अधिक सुविधाजनक नौकरियाँ दिखा सके।",
          b1: "राज्य",
          b2: "शहर",
          b3: "इलाका",
          b4: "लोकेलिटी",
        },
        receiveJobAlerts: {
          title: "जॉब अलर्ट पाएँ",
          p1: "आपको अपनी प्रोफ़ाइल, स्थान, नौकरी श्रेणी और उपलब्धता के आधार पर WhatsApp पर उपयुक्त जॉब अलर्ट मिलेंगे। बेहतर नौकरी मिलान पाने के लिए अपनी प्रोफ़ाइल अपडेट रखें।",
        },
        applyThroughWhatsapp: {
          title: "WhatsApp से आवेदन करें",
          p1: "जब आपको जॉब अलर्ट मिले, तो नौकरी का विवरण ध्यान से पढ़ें। अगर आप रुचि रखते हैं, तो जॉब अलर्ट का जवाब देकर या आवेदन विकल्प चुनकर सीधे WhatsApp से आवेदन करें।",
        },
        trackApplicationUpdates: {
          title: "आवेदन अपडेट ट्रैक करें",
          p1: "आवेदन करने के बाद आपको WhatsApp पर आवेदन किया, शॉर्टलिस्ट, इंटरव्यू तय, चयनित या जॉइनिंग पुष्टि जैसे अपडेट मिल सकते हैं।",
          b1: "आवेदन किया",
          b2: "शॉर्टलिस्ट",
          b3: "इंटरव्यू तय",
          b4: "चयनित",
          b5: "जॉइनिंग पुष्टि",
        },
        useYourPreferredLanguage: {
          title: "अपनी पसंदीदा भाषा का उपयोग करें",
          p1: "AsliJobs अंग्रेज़ी, हिंदी, तेलुगु, तमिल, कन्नड़ और मलयालम का समर्थन करता है। जॉब अलर्ट और अपडेट अधिक सहजता से पाने के लिए आप अपनी पसंदीदा भाषा चुन सकते हैं।",
          b1: "अंग्रेज़ी",
          b2: "हिंदी",
          b3: "तेलुगु",
          b4: "तमिल",
          b5: "कन्नड़",
          b6: "मलयालम",
        },
        staySafeWhileSearching: {
          title: "खोजते समय सुरक्षित रहें",
          p1: "नौकरी की पुष्टि के लिए पैसे न दें। आगे बढ़ने से पहले कंपनी का नाम, नौकरी का स्थान, वेतन, कार्य समय और इंटरव्यू विवरण हमेशा जाँचें। नकली नौकरियों, भुगतान की माँग या संदिग्ध संदेशों की तुरंत AsliJobs सपोर्ट को रिपोर्ट करें।",
          b1: "नौकरी की पुष्टि के लिए पैसे न दें।",
          b2: "कंपनी का नाम जाँचें।",
          b3: "नौकरी का स्थान जाँचें।",
          b4: "वेतन जाँचें।",
          b5: "कार्य समय जाँचें।",
          b6: "इंटरव्यू विवरण जाँचें।",
          b7: "नकली नौकरियों की रिपोर्ट करें।",
          b8: "भुगतान की माँग की रिपोर्ट करें।",
          b9: "संदिग्ध संदेशों की रिपोर्ट करें।",
        },
        getSupportWhenNeeded: {
          title: "ज़रूरत पड़ने पर सहायता लें",
          p1: "रजिस्ट्रेशन, जॉब अलर्ट, आवेदन, इंटरव्यू, प्रोफ़ाइल अपडेट, भाषा सहायता या शिकायतों में मदद के लिए आप WhatsApp, कॉल या ईमेल से AsliJobs सपोर्ट से संपर्क कर सकते हैं।",
          b1: "WhatsApp",
          b2: "कॉल",
          b3: "ईमेल",
          b4: "रजिस्ट्रेशन",
          b5: "जॉब अलर्ट",
          b6: "आवेदन",
          b7: "इंटरव्यू",
          b8: "प्रोफ़ाइल अपडेट",
          b9: "भाषा सहायता",
          b10: "शिकायतें",
        },
      },
      cta: {
        title: "अपनी नौकरी खोज शुरू करें",
        p1: "AsliJobs के साथ नौकरी खोजना और आवेदन करना सरल, परिचित और आसान है।",
        tagline: "अपनी प्रोफ़ाइल बनाएँ। जॉब अलर्ट पाएँ। WhatsApp से आवेदन करें।",
        badge: "WhatsApp",
      },
    },
    postAJob: {
      title: "नौकरी पोस्ट करें",
      metaDescription: "AsliJobs के साथ सही ब्लू-कॉलर और ग्रे-कॉलर उम्मीदवारों की भर्ती करें।",
      intro: {
        i1: "AsliJobs के साथ सही ब्लू-कॉलर और ग्रे-कॉलर उम्मीदवारों की भर्ती करें। चाहे आपको ऑफिस सपोर्ट स्टाफ, डिलीवरी एग्ज़ीक्यूटिव, ड्राइवर, इलेक्ट्रीशियन, हाउसकीपिंग स्टाफ, सिक्योरिटी गार्ड, वेयरहाउस वर्कर, रिटेल स्टाफ, टेक्नीशियन या हेल्पर चाहिए, AsliJobs आपको उपयुक्त नौकरी खोजने वालों तक आसानी से पहुँचाता है।",
      },
      sections: {
        postJobsEasily: {
          title: "आसानी से नौकरियाँ पोस्ट करें",
          p1: "नियोक्ता जॉब टाइटल, स्थान, वेतन, कार्य समय, रिक्तियों की संख्या, आवश्यक अनुभव, आवश्यक कौशल, लाभ और इंटरव्यू विवरण जैसी महत्वपूर्ण जानकारी साझा करके AsliJobs पर नौकरियाँ पोस्ट कर सकते हैं।",
          b1: "जॉब टाइटल",
          b2: "स्थान",
          b3: "वेतन",
          b4: "कार्य समय",
          b5: "रिक्तियों की संख्या",
          b6: "आवश्यक अनुभव",
          b7: "आवश्यक कौशल",
          b8: "लाभ",
          b9: "इंटरव्यू विवरण",
        },
        reachSuitableCandidates: {
          title: "उपयुक्त उम्मीदवारों तक पहुँचें",
          p1: "आपकी नौकरी पोस्ट होने के बाद, AsliJobs स्थान, नौकरी श्रेणी, अनुभव, भाषा प्राथमिकता और उपलब्धता के आधार पर संबंधित नौकरी खोजने वालों के साथ अवसर साझा करने में मदद करता है।",
        },
        manageApplications: {
          title: "आवेदन प्रबंधित करें",
          p1: "नियोक्ता नियोक्ता डैशबोर्ड से या AsliJobs टीम की सहायता से आवेदन देख सकते हैं, उम्मीदवारों को शॉर्टलिस्ट कर सकते हैं, इंटरव्यू तय कर सकते हैं और भर्ती की प्रगति ट्रैक कर सकते हैं।",
        },
        promoteYourJob: {
          title: "अपनी नौकरी को प्रमोट करें",
          p1: "नियोक्ता दृश्यता बढ़ाने और अधिक उपयुक्त उम्मीदवारों तक पहुँचने के लिए प्रमोटेड नौकरियाँ या कैंपेन प्रमोशन चुन सकते हैं।",
        },
      },
      cta: {
        title: "AsliJobs के साथ भर्ती शुरू करें",
        p1: "AsliJobs पर अपनी नौकरी पोस्ट करें और काम के लिए तैयार उम्मीदवारों से जुड़ें।",
        tagline: "नौकरी पोस्ट करें। उपयुक्त उम्मीदवारों तक पहुँचें। तेज़ी से भर्ती करें।",
        badge: "नियोक्ताओं के लिए",
      },
    },
    employerLogin: {
      title: "नियोक्ता लॉगिन",
      metaDescription:
        "जॉब पोस्ट, आवेदन, उम्मीदवार, इंटरव्यू, हायरिंग प्लान और प्रमोशन प्रबंधित करने के लिए अपने AsliJobs नियोक्ता डैशबोर्ड तक पहुँचें।",
      intro: {
        i1: "जॉब पोस्ट, आवेदन, उम्मीदवार, इंटरव्यू, हायरिंग प्लान और प्रमोशन एक ही जगह प्रबंधित करने के लिए अपने AsliJobs नियोक्ता डैशबोर्ड तक पहुँचें।",
      },
      sections: {
        loginToYourEmployerDashboard: {
          title: "अपने नियोक्ता डैशबोर्ड में लॉगिन करें",
          p1: "नियोक्ता अपने रजिस्टर्ड मोबाइल नंबर, ईमेल पते या AsliJobs द्वारा दिए गए लॉगिन विकल्प से लॉगिन कर सकते हैं।",
        },
        manageJobPosts: {
          title: "जॉब पोस्ट प्रबंधित करें",
          p1: "लॉगिन के बाद नियोक्ता नई नौकरियाँ पोस्ट कर सकते हैं, नौकरी का विवरण बदल सकते हैं, रिक्तियाँ अपडेट कर सकते हैं, नौकरियाँ रोक सकते हैं, भरी हुई पदों को बंद कर सकते हैं और सक्रिय जॉब पोस्ट ट्रैक कर सकते हैं।",
        },
        viewApplications: {
          title: "आवेदन देखें",
          p1: "नियोक्ता अपनी जॉब पोस्ट के लिए आए आवेदन देख सकते हैं, उम्मीदवार का विवरण जाँच सकते हैं और भर्ती ज़रूरतों के अनुसार उपयुक्त प्रोफ़ाइल शॉर्टलिस्ट कर सकते हैं।",
        },
        scheduleInterviews: {
          title: "इंटरव्यू तय करें",
          p1: "नियोक्ता इंटरव्यू की तारीख, समय, स्थान और संपर्क व्यक्ति का विवरण जोड़कर इंटरव्यू तय कर सकते हैं। उम्मीदवार WhatsApp पर इंटरव्यू अपडेट पा सकते हैं।",
        },
        trackHiringProgress: {
          title: "भर्ती की प्रगति ट्रैक करें",
          p1: "नियोक्ता डैशबोर्ड आवेदन की स्थिति, शॉर्टलिस्ट उम्मीदवार, तय इंटरव्यू, चयनित उम्मीदवार और बंद जॉब पोस्ट ट्रैक करने में मदद करता है।",
        },
        managePlansAndPromotions: {
          title: "प्लान और प्रमोशन प्रबंधित करें",
          p1: "नियोक्ता डैशबोर्ड से हायरिंग प्लान, प्रमोटेड नौकरियाँ, कैंपेन प्रमोशन, भुगतान, इनवॉइस और रिन्यूअल विवरण देख सकते हैं।",
        },
        needLoginHelp: {
          title: "लॉगिन में मदद चाहिए?",
          p1: "अगर आप लॉगिन नहीं कर पा रहे या अपने नियोक्ता डैशबोर्ड तक नहीं पहुँच पा रहे, तो WhatsApp, कॉल या ईमेल से AsliJobs सपोर्ट से संपर्क करें।",
          b1: "WhatsApp",
          b2: "कॉल",
          b3: "ईमेल",
        },
      },
      cta: {
        title: "नियोक्ता लॉगिन",
        tagline: "लॉगिन करें। नौकरियाँ प्रबंधित करें। AsliJobs के साथ तेज़ी से भर्ती करें।",
        badge: "नियोक्ताओं के लिए",
      },
    },
    pricingPlans: {
      title: "प्राइसिंग प्लान",
      metaDescription:
        "अपने व्यवसाय के लिए सही हायरिंग प्लान चुनें और AsliJobs के ज़रिए उपयुक्त ब्लू-कॉलर और ग्रे-कॉलर उम्मीदवारों से जुड़ें।",
      intro: {
        i1: "अपने व्यवसाय के लिए सही हायरिंग प्लान चुनें और AsliJobs के ज़रिए उपयुक्त ब्लू-कॉलर और ग्रे-कॉलर उम्मीदवारों से जुड़ें।",
        i2: "AsliJobs उन नियोक्ताओं के लिए पेड हायरिंग प्लान देता है जो नौकरियाँ पोस्ट करना, आवेदन पाना, रिक्तियों को प्रमोट करना और भर्ती अधिक प्रभावी ढंग से प्रबंधित करना चाहते हैं।",
      },
      sections: {
        simplePlansForEveryHiringNeed: {
          title: "हर भर्ती ज़रूरत के लिए सरल प्लान",
          p1: "चाहे आप एक रोल के लिए भर्ती कर रहे हों या कई रिक्तियों के लिए, AsliJobs आपको स्थान, नौकरी श्रेणी, अनुभव, भाषा प्राथमिकता और उपलब्धता के आधार पर नौकरी खोजने वालों तक पहुँचने में मदद करता है।",
        },
        employerHiringPlans: {
          title: "नियोक्ता हायरिंग प्लान",
          cards: {
            basicHiringPlan: {
              title: "बेसिक हायरिंग प्लान",
              description:
                "किसके लिए सबसे अच्छा: सीमित भर्ती ज़रूरत वाले नियोक्ता। इसमें शामिल: नौकरी पोस्ट करना, उम्मीदवार आवेदन और बेसिक डैशबोर्ड एक्सेस।",
            },
            standardHiringPlan: {
              title: "स्टैंडर्ड हायरिंग प्लान",
              description:
                "किसके लिए सबसे अच्छा: नियमित भर्ती करने वाले नियोक्ता। इसमें शामिल: कई जॉब पोस्ट, अधिक उम्मीदवार पहुँच, आवेदन ट्रैकिंग और सपोर्ट।",
            },
            premiumHiringPlan: {
              title: "प्रीमियम हायरिंग प्लान",
              description:
                "किसके लिए सबसे अच्छा: तेज़ भर्ती चाहने वाले नियोक्ता। इसमें शामिल: अधिक दृश्यता, प्रमोटेड जॉब विकल्प, प्राथमिकता सपोर्ट और बेहतर उम्मीदवार पहुँच।",
            },
            campaignHiringPlan: {
              title: "कैंपेन हायरिंग प्लान",
              description:
                "किसके लिए सबसे अच्छा: बड़ी संख्या या तुरंत भर्ती की ज़रूरत वाले नियोक्ता। इसमें शामिल: लक्षित हायरिंग कैंपेन, स्थान-आधारित पहुँच, WhatsApp जॉब अलर्ट और हायरिंग सपोर्ट।",
            },
          },
        },
        whatEmployersCanDo: {
          title: "नियोक्ता क्या कर सकते हैं",
          b1: "नौकरियाँ पोस्ट करें",
          b2: "उम्मीदवार आवेदन पाएँ",
          b3: "उम्मीदवार का विवरण देखें",
          b4: "उपयुक्त प्रोफ़ाइल शॉर्टलिस्ट करें",
          b5: "इंटरव्यू तय करें",
          b6: "भर्ती की प्रगति ट्रैक करें",
          b7: "नौकरी की रिक्तियाँ प्रमोट करें",
          b8: "भर्ती से जुड़े प्रश्नों के लिए सहायता पाएँ",
        },
        promotedJobs: {
          title: "प्रमोटेड नौकरियाँ",
          p1: "प्रमोटेड नौकरियाँ नियोक्ताओं को महत्वपूर्ण या तुरंत भरी जाने वाली रिक्तियों की दृश्यता बढ़ाने में मदद करती हैं। ये नौकरियाँ स्थान, जॉब रोल और उम्मीदवार प्रोफ़ाइल के आधार पर अधिक प्रासंगिक नौकरी खोजने वालों तक पहुँच सकती हैं।",
        },
        campaignPromotions: {
          title: "कैंपेन प्रमोशन",
          p1: "कैंपेन प्रमोशन उन नियोक्ताओं के लिए उपयोगी हैं जो बड़ी संख्या में भर्ती करना चाहते हैं, खास स्थानों को लक्षित करना चाहते हैं या चुनी हुई नौकरी श्रेणियों के नौकरी खोजने वालों तक पहुँचना चाहते हैं।",
        },
        paymentsAndInvoices: {
          title: "भुगतान और इनवॉइस",
          p1: "नियोक्ता उपयुक्त प्लान चुन सकते हैं और उपलब्ध भुगतान विकल्पों से भुगतान पूरा कर सकते हैं। भुगतान के बाद AsliJobs सपोर्ट के ज़रिए इनवॉइस का अनुरोध किया जा सकता है।",
        },
        needHelpChoosingAPlan: {
          title: "प्लान चुनने में मदद चाहिए?",
          p1: "अगर आप सुनिश्चित नहीं हैं कि आपकी भर्ती ज़रूरत के लिए कौन-सा प्लान सही है, तो AsliJobs सपोर्ट से संपर्क करें। हमारी टीम आपके जॉब रोल, स्थान, रिक्तियों की संख्या और भर्ती की तात्कालिकता के आधार पर उपयुक्त प्लान चुनने में मदद करेगी।",
        },
      },
      cta: {
        title: "AsliJobs के साथ भर्ती शुरू करें",
        tagline: "प्लान चुनें। अपनी नौकरी पोस्ट करें। AsliJobs के साथ भर्ती शुरू करें।",
        badge: "नियोक्ताओं के लिए",
      },
    },
    employerGuide: {
      title: "नियोक्ता गाइड",
      metaDescription:
        "AsliJobs एक सरल, WhatsApp-अनुकूल भर्ती प्रक्रिया के ज़रिए नियोक्ताओं को उपयुक्त ब्लू-कॉलर और ग्रे-कॉलर उम्मीदवारों की भर्ती में मदद करता है।",
      intro: {
        i1: "AsliJobs एक सरल, WhatsApp-अनुकूल भर्ती प्रक्रिया के ज़रिए नियोक्ताओं को उपयुक्त ब्लू-कॉलर और ग्रे-कॉलर उम्मीदवारों की भर्ती में मदद करता है। चाहे आप एक रोल के लिए भर्ती कर रहे हों या कई रिक्तियों के लिए, AsliJobs आपको स्थान, नौकरी श्रेणी, अनुभव, कौशल, भाषा प्राथमिकता और उपलब्धता के आधार पर नौकरी खोजने वालों तक पहुँचने में मदद करता है।",
      },
      sections: {
        registerAsAnEmployer: {
          title: "नियोक्ता के रूप में रजिस्टर करें",
          p1: "AsliJobs पर अपनी नियोक्ता प्रोफ़ाइल बनाकर शुरू करें। नियोक्ता नाम, कंपनी का नाम, संपर्क व्यक्ति का विवरण, मोबाइल नंबर, स्थान, व्यवसाय का प्रकार, भर्ती श्रेणियाँ और पसंदीदा भाषा जैसी बुनियादी जानकारी साझा करें।",
          b1: "नियोक्ता नाम",
          b2: "कंपनी का नाम",
          b3: "संपर्क व्यक्ति का विवरण",
          b4: "मोबाइल नंबर",
          b5: "स्थान",
          b6: "व्यवसाय का प्रकार",
          b7: "भर्ती श्रेणियाँ",
          b8: "पसंदीदा भाषा",
        },
        postAJob: {
          title: "नौकरी पोस्ट करें",
          p1: "जॉब टाइटल, वेतन सीमा, कार्य स्थान, समय, रिक्तियों की संख्या, आवश्यक अनुभव, आवश्यक कौशल, लाभ और इंटरव्यू विवरण जैसी स्पष्ट जानकारी जोड़कर अपनी नौकरी पोस्ट करें। स्पष्ट नौकरी विवरण नौकरी खोजने वालों को अवसर बेहतर समझने और भरोसे के साथ आवेदन करने में मदद करता है।",
        },
        receiveApplications: {
          title: "आवेदन पाएँ",
          p1: "आपकी नौकरी पोस्ट होने के बाद उपयुक्त नौकरी खोजने वाले नौकरी देख और आवेदन कर सकते हैं। आवेदन नियोक्ता डैशबोर्ड से या AsliJobs टीम की सहायता से प्रबंधित किए जा सकते हैं।",
        },
        shortlistCandidates: {
          title: "उम्मीदवारों को शॉर्टलिस्ट करें",
          p1: "नाम, स्थान, अनुभव, कौशल, अपेक्षित वेतन, उपलब्धता और पसंदीदा भाषा जैसे उम्मीदवार विवरण की समीक्षा करें। अपनी भर्ती ज़रूरतों से मेल खाने वाले उम्मीदवारों को शॉर्टलिस्ट करें।",
        },
        scheduleInterviews: {
          title: "इंटरव्यू तय करें",
          p1: "शॉर्टलिस्ट करने के बाद इंटरव्यू की तारीख, समय, स्थान और संपर्क व्यक्ति का विवरण साझा करके इंटरव्यू तय करें। उम्मीदवार WhatsApp पर इंटरव्यू अपडेट पा सकते हैं।",
        },
        trackHiringProgress: {
          title: "भर्ती की प्रगति ट्रैक करें",
          p1: "आवेदन, शॉर्टलिस्ट उम्मीदवार, तय इंटरव्यू, चयनित उम्मीदवार और बंद जॉब पोस्ट ट्रैक करने के लिए नियोक्ता डैशबोर्ड का उपयोग करें।",
        },
        promoteJobOpenings: {
          title: "नौकरी की रिक्तियाँ प्रमोट करें",
          p1: "नियोक्ता नौकरी की दृश्यता बढ़ाने और अधिक उपयुक्त उम्मीदवारों तक तेज़ी से पहुँचने के लिए प्रमोटेड नौकरियाँ या कैंपेन प्रमोशन चुन सकते हैं।",
        },
        updateOrCloseJobPosts: {
          title: "जॉब पोस्ट अपडेट या बंद करें",
          p1: "अपनी जॉब पोस्ट अपडेट रखें। अगर कोई पद भर गया है, रोक दिया गया है, रद्द हो गया है या अब उपलब्ध नहीं है, तो डैशबोर्ड से या AsliJobs सपोर्ट से संपर्क करके जॉब पोस्ट अपडेट या बंद करें।",
        },
        getEmployerSupport: {
          title: "नियोक्ता सहायता पाएँ",
          p1: "नौकरी पोस्ट करने, आवेदनों, उम्मीदवार शॉर्टलिस्टिंग, इंटरव्यू, भुगतान, इनवॉइस, प्रमोशन या डैशबोर्ड सहायता के लिए नियोक्ता WhatsApp, कॉल या ईमेल से AsliJobs सपोर्ट से संपर्क कर सकते हैं।",
          b1: "WhatsApp",
          b2: "कॉल",
          b3: "ईमेल",
          b4: "नौकरी पोस्ट करना",
          b5: "आवेदन",
          b6: "उम्मीदवार शॉर्टलिस्टिंग",
          b7: "इंटरव्यू",
          b8: "भुगतान",
          b9: "इनवॉइस",
          b10: "प्रमोशन",
          b11: "डैशबोर्ड सहायता",
        },
        hiringTipsForEmployers: {
          title: "नियोक्ताओं के लिए भर्ती सुझाव",
          b1: "पूरा और स्पष्ट नौकरी विवरण जोड़ें।",
          b2: "सही वेतन, स्थान और कार्य समय लिखें।",
          b3: "आवेदनों का समय पर जवाब दें।",
          b4: "इंटरव्यू विवरण स्पष्ट रूप से साझा करें।",
          b5: "अनावश्यक आवेदन रोकने के लिए भरी हुई नौकरियाँ बंद करें।",
          b6: "तुरंत या बड़ी संख्या में भर्ती के लिए प्रमोशन का उपयोग करें।",
        },
      },
      cta: {
        title: "AsliJobs के साथ भर्ती शुरू करें",
        p1: "AsliJobs एक सरल और परिचित प्लेटफ़ॉर्म के ज़रिए नियोक्ताओं को उपयुक्त वर्कफोर्स उम्मीदवारों से जोड़कर भर्ती आसान बनाता है।",
        tagline: "अपनी नियोक्ता प्रोफ़ाइल बनाएँ। नौकरी पोस्ट करें। AsliJobs के साथ तेज़ी से भर्ती करें।",
        badge: "नियोक्ताओं के लिए",
      },
    },
    interviewTips: {
      title: "इंटरव्यू टिप्स",
      metaDescription:
        "नौकरी चाहने वालों के लिए आसान इंटरव्यू टिप्स, ताकि वे अच्छी तैयारी करें, आत्मविश्वास के साथ इंटरव्यू दें और चयनित हों।",
      intro: {
        i1: "थोड़ी सी तैयारी आपको इंटरव्यू में आत्मविश्वास देती है और अच्छा प्रभाव बनाने में मदद करती है। इंटरव्यू से पहले, इंटरव्यू के दौरान और इंटरव्यू के बाद इन आसान टिप्स का पालन करें।",
      },
      sections: {
        prepareBeforeTheInterview: {
          title: "इंटरव्यू से पहले तैयारी करें",
          p1: "नौकरी का विवरण फिर से पढ़ें, जिसमें नौकरी की भूमिका, वेतन, काम की जगह और समय शामिल हैं। सोचें कि आपके कौशल और अनुभव इस नौकरी से कैसे मेल खाते हैं।",
        },
        documentsToCarry: {
          title: "साथ ले जाने वाले दस्तावेज़",
          p1: "अपने दस्तावेज़ एक दिन पहले ही तैयार रखें, ताकि इंटरव्यू वाले दिन जल्दबाज़ी न हो।",
          b1: "पहचान पत्र, जैसे आधार कार्ड",
          b2: "रिज़्यूमे या प्रोफ़ाइल विवरण",
          b3: "अनुभव या वेतन प्रमाणपत्र, यदि उपलब्ध हों",
          b4: "शैक्षणिक प्रमाणपत्र, यदि आवश्यक हों",
          b5: "पासपोर्ट साइज़ फ़ोटो",
        },
        onTheInterviewDay: {
          title: "इंटरव्यू वाले दिन",
          p1: "अपनी यात्रा की योजना बनाएँ और इंटरव्यू की जगह पर 10 से 15 मिनट पहले पहुँचें। साफ़-सुथरे कपड़े पहनें और अपना फ़ोन साइलेंट पर रखें।",
          b1: "समय पर पहुँचें",
          b2: "साफ़-सुथरे कपड़े पहनें",
          b3: "विनम्रता से अभिवादन करें",
          b4: "फ़ोन साइलेंट पर रखें",
        },
        answerWithConfidence: {
          title: "आत्मविश्वास से जवाब दें",
          p1: "ध्यान से सुनें, ईमानदारी से जवाब दें और साफ़ बोलें। इन जैसे आम सवालों के लिए तैयार रहें।",
          b1: "अपने बारे में बताइए।",
          b2: "आपने पहले कौन सा काम किया है?",
          b3: "आप कब से जॉइन कर सकते हैं?",
          b4: "आप कितना वेतन चाहते हैं?",
        },
        afterTheInterview: {
          title: "इंटरव्यू के बाद",
          p1: "जाने से पहले इंटरव्यू लेने वाले को धन्यवाद कहें। इंटरव्यू का परिणाम और अगले कदम WhatsApp पर भेजे जाते हैं, इसलिए अपने मैसेज देखते रहें और समय पर जवाब दें।",
        },
        staySafe: {
          title: "सुरक्षित रहें",
          p1: "असली नियोक्ता इंटरव्यू तय करने या नौकरी पक्की करने के लिए पैसे नहीं माँगते। अगर कोई पैसे माँगे, तो भुगतान न करें और तुरंत AsliJobs सपोर्ट को रिपोर्ट करें।",
          b1: "इंटरव्यू या नौकरी पक्की करने के लिए पैसे न दें।",
          b2: "केवल नौकरी विवरण में दिए गए पते पर ही इंटरव्यू देने जाएँ।",
          b3: "संदिग्ध माँगों की रिपोर्ट AsliJobs सपोर्ट को करें।",
        },
      },
      cta: {
        title: "WhatsApp पर इंटरव्यू अपडेट पाएँ",
        p1: "उपयुक्त नौकरियों के लिए आवेदन करें और इंटरव्यू का विवरण सीधे WhatsApp पर पाएँ।",
        tagline: "अच्छी तैयारी करें। समय पर पहुँचें। चयनित हों।",
        badge: "WhatsApp",
      },
    },
    salaryGuide: {
      title: "वेतन गाइड",
      metaDescription:
        "नौकरी स्वीकार करने से पहले जॉब ऑफ़र में वेतन का विवरण समझें, जैसे इन-हैंड वेतन, कटौतियाँ, अतिरिक्त भुगतान और भुगतान का समय।",
      intro: {
        i1: "वेतन किसी भी नौकरी का सबसे महत्वपूर्ण हिस्सा होता है। यह गाइड आपको जॉब अलर्ट या ऑफ़र में दिए गए वेतन विवरण को समझने में मदद करती है, ताकि आप सही फ़ैसला ले सकें।",
      },
      sections: {
        checkTheSalaryInJobDetails: {
          title: "नौकरी विवरण में वेतन देखें",
          p1: "AsliJobs पर हर नौकरी में नियोक्ता द्वारा दिया जाने वाला वेतन दिखाया जाता है। आवेदन करने से पहले इसे नौकरी की भूमिका, काम के समय और जगह के साथ ध्यान से पढ़ें।",
        },
        inHandSalaryAndDeductions: {
          title: "इन-हैंड वेतन और कटौतियाँ",
          p1: "इन-हैंड वेतन वह राशि है जो कटौतियों के बाद आपको मिलती है। नियोक्ता से पूछें कि दिखाया गया वेतन इन-हैंड है या PF या ESI जैसी कटौतियों से पहले का है।",
          b1: "इन-हैंड (घर ले जाने वाला) वेतन",
          b2: "PF (प्रोविडेंट फ़ंड)",
          b3: "ESI (कर्मचारी राज्य बीमा)",
          b4: "अन्य कटौतियाँ, यदि कोई हों",
        },
        extraPayAndBenefits: {
          title: "अतिरिक्त भुगतान और लाभ",
          p1: "कुछ नौकरियों में वेतन के साथ अतिरिक्त भुगतान या लाभ मिलते हैं। साफ़-साफ़ पूछें कि इसमें क्या-क्या शामिल है।",
          b1: "ओवरटाइम भुगतान",
          b2: "इंसेंटिव",
          b3: "भोजन या रहने की सुविधा",
          b4: "यात्रा भत्ता",
          b5: "साप्ताहिक छुट्टी और सवेतन अवकाश",
        },
        salaryPaymentSchedule: {
          title: "वेतन भुगतान का समय",
          p1: "पुष्टि करें कि वेतन कब और कैसे मिलेगा, जैसे मासिक, साप्ताहिक या दैनिक, और यह बैंक ट्रांसफ़र से मिलेगा या नकद। अपने वेतन भुगतान का रिकॉर्ड रखें।",
        },
        whatAffectsYourSalary: {
          title: "आपके वेतन को क्या प्रभावित करता है",
          p1: "वेतन इन बातों के आधार पर अलग हो सकता है। अपने कौशल बढ़ाने और प्रोफ़ाइल अपडेट रखने से आपको बेहतर वेतन वाली नौकरियाँ मिल सकती हैं।",
          b1: "अनुभव",
          b2: "कौशल",
          b3: "नौकरी की श्रेणी",
          b4: "शहर और जगह",
          b5: "शिफ़्ट और काम का समय",
        },
        salarySafety: {
          title: "वेतन से जुड़ी सुरक्षा",
          p1: "नौकरी या ज़्यादा वेतन पाने के लिए कभी पैसे न दें। कम काम के लिए बहुत ज़्यादा वेतन का वादा करने वाले ऑफ़र से सावधान रहें और उनकी रिपोर्ट AsliJobs सपोर्ट को करें।",
          b1: "नौकरी पाने के लिए कभी पैसे न दें।",
          b2: "अवास्तविक वेतन के वादों से सावधान रहें।",
          b3: "संदिग्ध ऑफ़र की रिपोर्ट AsliJobs सपोर्ट को करें।",
        },
      },
      cta: {
        title: "साफ़ वेतन विवरण वाली नौकरियाँ खोजें",
        p1: "वेतन, जगह और समय के साथ जॉब अलर्ट सीधे WhatsApp पर पाएँ।",
        tagline: "अपना वेतन जानें। सही नौकरी चुनें।",
        badge: "WhatsApp",
      },
    },
    careerAdvice: {
      title: "करियर सलाह",
      metaDescription:
        "नौकरी चाहने वालों के लिए व्यावहारिक करियर सलाह, ताकि वे अपने कौशल बढ़ाएँ, बेहतर नौकरियाँ पाएँ और स्थिर करियर बनाएँ।",
      intro: {
        i1: "हर नौकरी आपके करियर का एक कदम है। ये व्यावहारिक टिप्स आपको अपने कौशल बढ़ाने, बेहतर अवसर पाने और स्थिर भविष्य बनाने में मदद कर सकते हैं।",
      },
      sections: {
        keepYourProfileUpdated: {
          title: "अपनी प्रोफ़ाइल अपडेट रखें",
          p1: "जब भी आपके कौशल, अनुभव, पसंदीदा जगह या अपेक्षित वेतन में बदलाव हो, उन्हें अपडेट करें। अपडेट प्रोफ़ाइल से AsliJobs आपको बेहतर नौकरियाँ भेज पाता है।",
        },
        learnNewSkills: {
          title: "नए कौशल सीखें",
          p1: "नए कौशल बेहतर नौकरियों और ज़्यादा वेतन के रास्ते खोल सकते हैं। अनुभवी साथियों से सीखें, छोटे ट्रेनिंग कोर्स करें और जहाँ संभव हो प्रमाणपत्र लें।",
          b1: "ड्राइवर नौकरियों के लिए ड्राइविंग लाइसेंस",
          b2: "बुनियादी कंप्यूटर और मोबाइल कौशल",
          b3: "कार्यस्थल सुरक्षा प्रशिक्षण",
          b4: "बिजली या प्लंबिंग जैसे तकनीकी कौशल",
          b5: "ग्राहक सेवा और बातचीत का कौशल",
        },
        chooseTheRightJob: {
          title: "सही नौकरी चुनें",
          p1: "सिर्फ़ वेतन ही न देखें। नौकरी स्वीकार करने से पहले इन बातों पर ध्यान दें।",
          b1: "काम की जगह और आने-जाने का समय",
          b2: "शिफ़्ट का समय",
          b3: "नौकरी की स्थिरता",
          b4: "आगे बढ़ने के अवसर",
        },
        growInYourCurrentJob: {
          title: "मौजूदा नौकरी में आगे बढ़ें",
          p1: "काम पर समय के पाबंद, भरोसेमंद और ईमानदार रहें। अच्छी उपस्थिति और सकारात्मक रवैया आपको भरोसा, ज़िम्मेदारी और प्रमोशन दिलाने में मदद करते हैं।",
          b1: "समय पर पहुँचें",
          b2: "अपने सुपरवाइज़र से सीखें",
          b3: "ज़िम्मेदारी लें",
          b4: "अपने काम के अनुभव का रिकॉर्ड रखें",
        },
        planYourNextStep: {
          title: "अपने अगले कदम की योजना बनाएँ",
          p1: "एक साफ़ लक्ष्य तय करें, जैसे सुपरवाइज़र, सीनियर टेक्नीशियन या टीम लीडर बनना। अपने अगले जॉब आवेदन के लिए अनुभव पत्र और रेफ़रेंस इकट्ठा करें।",
        },
      },
      cta: {
        title: "अपने करियर में अगला कदम उठाएँ",
        p1: "अपने कौशल और लक्ष्यों से मेल खाने वाली नौकरियाँ खोजें और अलर्ट सीधे WhatsApp पर पाएँ।",
        tagline: "सीखें। आगे बढ़ें। बेहतर नौकरियाँ पाएँ।",
        badge: "WhatsApp",
      },
    },
  },
};

const te: MessageShape<typeof en> = {
  publicPages: {
    breadcrumbAria: "బ్రెడ్‌క్రంబ్",
    actions: {
      startOnWhatsapp: "WhatsAppలో ప్రారంభించండి",
      browseJobs: "ఉద్యోగాలు చూడండి",
      postAJob: "ఉద్యోగం పోస్ట్ చేయండి",
      employerLogin: "యజమాని లాగిన్",
      contactSupport: "సపోర్ట్‌ను సంప్రదించండి",
    },
    findJobs: {
      title: "ఉద్యోగాలు కనుగొనండి",
      metaDescription:
        "సరైన ఉద్యోగం వెతుకుతున్నారా? AsliJobs WhatsApp ద్వారా ఉద్యోగ శోధనను సులభంగా, వేగంగా, సరళంగా చేస్తుంది.",
      intro: {
        i1: "సరైన ఉద్యోగం వెతుకుతున్నారా? AsliJobs WhatsApp ద్వారా ఉద్యోగ శోధనను సులభంగా, వేగంగా, సరళంగా చేస్తుంది.",
        i2: "AsliJobs ఉద్యోగార్థులకు ప్రదేశం, ఉద్యోగ వర్గం, అనుభవం, నైపుణ్యాలు, భాషా ప్రాధాన్యం మరియు లభ్యత ఆధారంగా బ్లూ-కాలర్ మరియు గ్రే-కాలర్ ఉద్యోగాలు కనుగొనడంలో సహాయపడుతుంది. ఆఫీస్ సపోర్ట్, డెలివరీ, డ్రైవింగ్, ఎలక్ట్రీషియన్, హౌస్‌కీపింగ్, సెక్యూరిటీ, వేర్‌హౌస్, రిటైల్, టెక్నీషియన్ లేదా ఇతర వర్క్‌ఫోర్స్ అవకాశాలు వెతుకుతున్నా, AsliJobs మిమ్మల్ని సరైన యజమానులతో కనెక్ట్ చేస్తుంది.",
      },
      sections: {
        findJobsThroughWhatsapp: {
          title: "WhatsApp ద్వారా ఉద్యోగాలు కనుగొనండి",
          p1: "మీరు కొత్త యాప్ డౌన్‌లోడ్ చేసుకోవాల్సిన అవసరం లేదు. AsliJobsతో ఉద్యోగ అలర్ట్‌లు పొందవచ్చు, ఉద్యోగ వివరాలు చూడవచ్చు, దరఖాస్తు చేయవచ్చు మరియు ఇంటర్వ్యూ అప్‌డేట్‌లు నేరుగా WhatsAppలో పొందవచ్చు.",
          p2: "AsliJobs WhatsApp చాట్ ప్రారంభించి, మీ ప్రాథమిక ప్రొఫైల్ వివరాలు పంచుకుని, ఇష్టపడే ఉద్యోగ వర్గం మరియు ప్రదేశం ఎంచుకుని, సరైన ఉద్యోగ అవకాశాలు పొందండి.",
        },
        jobsBasedOnYourLocation: {
          title: "మీ ప్రదేశం ఆధారంగా ఉద్యోగాలు",
          p1: "AsliJobs మీ నగరం, ప్రాంతం, లోకాలిటీ లేదా ఇష్టపడే పని ప్రదేశం ఆధారంగా ఉద్యోగాలు కనుగొనడంలో సహాయపడుతుంది. దగ్గరగా ఉన్న, మీకు అనుకూలమైన ఉద్యోగాలు కనుగొని దరఖాస్తు చేయడం సులభం అవుతుంది.",
        },
        applyEasily: {
          title: "సులభంగా దరఖాస్తు చేయండి",
          p1: "ఉద్యోగ అలర్ట్ వచ్చినప్పుడు ఉద్యోగ శీర్షిక, జీతం, ప్రదేశం, సమయాలు, అవసరమైన అనుభవం మరియు ఇతర వివరాలు చూడవచ్చు. ఆసక్తి ఉంటే ఉద్యోగ అలర్ట్‌కు సమాధానం ఇచ్చి లేదా దరఖాస్తు ఎంపికను ఎంచుకుని నేరుగా WhatsApp ద్వారా దరఖాస్తు చేయవచ్చు.",
        },
        stayUpdated: {
          title: "అప్‌డేట్‌గా ఉండండి",
          p1: "దరఖాస్తు చేసిన తర్వాత దరఖాస్తు స్థితి, షార్ట్‌లిస్ట్ అప్‌డేట్‌లు, ఇంటర్వ్యూ వివరాలు, ఎంపిక స్థితి మరియు చేరిక సమాచారం సహా ముఖ్యమైన అప్‌డేట్‌లు WhatsApp ద్వారా వస్తాయి.",
        },
        safeJobSearch: {
          title: "సురక్షిత ఉద్యోగ శోధన",
          p1: "AsliJobs సరళమైన మరియు నమ్మదగిన ఉద్యోగ శోధన అనుభవం సృష్టించడంపై దృష్టి పెడుతుంది. ఉద్యోగార్థులు ఉద్యోగ వివరాలను ఎప్పుడూ జాగ్రత్తగా పరిశీలించాలి మరియు నకిలీ ఉద్యోగం, చెల్లింపు డిమాండ్ లేదా అనుమానాస్పద కార్యకలాపాన్ని AsliJobs సపోర్ట్‌కు రిపోర్ట్ చేయాలి.",
        },
      },
      cta: {
        title: "ఉద్యోగాలు వెతకడం ప్రారంభించండి",
        p1: "AsliJobsతో మీ ఉద్యోగ శోధన ప్రారంభించి సరైన ఉద్యోగ అవకాశాలు నేరుగా WhatsAppలో పొందండి.",
        tagline: "ఉద్యోగాలు కనుగొనండి. సులభంగా దరఖాస్తు చేయండి. WhatsAppలో అప్‌డేట్‌లు పొందండి.",
        badge: "WhatsApp",
      },
    },
    browseByCity: {
      title: "నగరం వారీగా చూడండి",
      metaDescription:
        "AsliJobsతో WhatsApp ద్వారా మీ ఇష్టపడే నగరంలో బ్లూ-కాలర్ మరియు గ్రే-కాలర్ ఉద్యోగాలు కనుగొనండి.",
      intro: {
        i1: "AsliJobsతో మీ ఇష్టపడే నగరంలో బ్లూ-కాలర్ మరియు గ్రే-కాలర్ ఉద్యోగాలు కనుగొనండి. దగ్గరలో ఉద్యోగం వెతుకుతున్నా లేదా మరో నగరంలో పని చేయాలని ప్లాన్ చేస్తున్నా, AsliJobs WhatsApp ద్వారా సరైన అవకాశాలు కనుగొనడంలో సహాయపడుతుంది.",
      },
      sections: {
        findJobsInYourCity: {
          title: "మీ నగరంలో ఉద్యోగాలు కనుగొనండి",
          p1: "AsliJobs ఉద్యోగార్థులకు నగరం, ప్రాంతం, లోకాలిటీ మరియు ఇష్టపడే పని ప్రదేశం ఆధారంగా ఉద్యోగాలు వెతకడానికి అనుమతిస్తుంది. దగ్గరగా ఉన్న, చేరుకోవడం సులభమైన, మీ రోజువారీకి సరిపోయే ఉద్యోగాలు కనుగొనడంలో ఇది సహాయపడుతుంది.",
        },
        howItWorks: {
          title: "ఇది ఎలా పనిచేస్తుంది",
          p1: "మీ నగరం ఎంచుకోండి, ఉద్యోగ వర్గం ఎంచుకోండి మరియు ప్రాథమిక ప్రొఫైల్ వివరాలు పంచుకోండి. మీ ప్రదేశం, అనుభవం, నైపుణ్యాలు మరియు లభ్యత ఆధారంగా AsliJobs సరైన ఉద్యోగ అలర్ట్‌లను నేరుగా WhatsAppలో పంపుతుంది.",
          b1: "నగరం ఎంచుకోండి",
          b2: "ఉద్యోగ వర్గం ఎంచుకోండి",
          b3: "ప్రాథమిక ప్రొఫైల్ వివరాలు పంచుకోండి",
          b4: "ప్రదేశం, అనుభవం, నైపుణ్యాలు మరియు లభ్యత ఆధారంగా సరిపోలిక",
          b5: "WhatsApp ద్వారా సరైన ఉద్యోగ అలర్ట్‌లు పొందండి",
        },
        cityBasedJobAlerts: {
          title: "నగర ఆధారిత ఉద్యోగ అలర్ట్‌లు",
          p1: "ఆఫీస్ సపోర్ట్, డెలివరీ, డ్రైవర్, ఎలక్ట్రీషియన్, ప్లంబర్, హౌస్‌కీపింగ్, సెక్యూరిటీ, హెల్పర్, వేర్‌హౌస్ సిబ్బంది, రిటైల్ సిబ్బంది, టెక్నీషియన్ మరియు మీ నగరంలో అందుబాటులో ఉన్న ఇతర వర్క్‌ఫోర్స్ ఉద్యోగాలకు అలర్ట్‌లు పొందవచ్చు.",
          b1: "ఆఫీస్ సపోర్ట్",
          b2: "డెలివరీ",
          b3: "డ్రైవర్",
          b4: "ఎలక్ట్రీషియన్",
          b5: "ప్లంబర్",
          b6: "హౌస్‌కీపింగ్",
          b7: "సెక్యూరిటీ",
          b8: "హెల్పర్",
          b9: "వేర్‌హౌస్ సిబ్బంది",
          b10: "రిటైల్ సిబ్బంది",
          b11: "టెక్నీషియన్",
          b12: "ఇతర వర్క్‌ఫోర్స్ ఉద్యోగాలు",
        },
        jobAvailability: {
          title: "ఉద్యోగ లభ్యత",
          p1: "AsliJobs భారతదేశం అంతటా ఉద్యోగార్థులకు మరియు యజమానులకు సేవలు అందిస్తుంది. ఉద్యోగ లభ్యత నగరం, ప్రాంతం, లోకాలిటీ, ఉద్యోగ వర్గం మరియు యజమాని ఖాళీలను బట్టి మారవచ్చు.",
        },
      },
      cta: {
        title: "శోధన ప్రారంభించండి",
        p1: "మీ నగరం ఎంచుకుని ఉద్యోగ అవకాశాలు నేరుగా WhatsAppలో పొందడం ప్రారంభించండి.",
        tagline: "మీ దగ్గర ఉద్యోగాలు కనుగొనండి. WhatsApp ద్వారా సులభంగా దరఖాస్తు చేయండి.",
        badge: "WhatsApp",
      },
    },
    browseByState: {
      title: "రాష్ట్రం వారీగా చూడండి",
      metaDescription:
        "AsliJobsతో WhatsApp ద్వారా భారతదేశంలోని వివిధ రాష్ట్రాల్లో బ్లూ-కాలర్ మరియు గ్రే-కాలర్ ఉద్యోగాలు కనుగొనండి.",
      intro: {
        i1: "AsliJobsతో భారతదేశంలోని వివిధ రాష్ట్రాల్లో బ్లూ-కాలర్ మరియు గ్రే-కాలర్ ఉద్యోగాలు కనుగొనండి. మీ స్వరాష్ట్రంలో పని చేయాలనుకున్నా లేదా మరో రాష్ట్రంలో అవకాశాలు చూడాలనుకున్నా, AsliJobs WhatsApp ద్వారా సరైన ఉద్యోగాలు కనుగొనడంలో సహాయపడుతుంది.",
      },
      sections: {
        findJobsStateWise: {
          title: "రాష్ట్రం వారీగా ఉద్యోగాలు కనుగొనండి",
          p1: "AsliJobs ఉద్యోగార్థులకు రాష్ట్రం, నగరం, ప్రాంతం, లోకాలిటీ మరియు ఇష్టపడే పని ప్రదేశం ఆధారంగా ఉద్యోగాలు వెతకడానికి అనుమతిస్తుంది. మీ ప్రదేశం మరియు ఉద్యోగ ప్రాధాన్యానికి సరిపోయే అవకాశాలు కనుగొనడం సులభం అవుతుంది.",
        },
        howItWorks: {
          title: "ఇది ఎలా పనిచేస్తుంది",
          p1: "మీ రాష్ట్రం ఎంచుకోండి, నగరం లేదా లోకాలిటీ ఎంచుకోండి మరియు ఇష్టపడే ఉద్యోగ వర్గం పంచుకోండి. మీ ప్రొఫైల్ వివరాల ఆధారంగా AsliJobs సరైన ఉద్యోగ అలర్ట్‌లను నేరుగా WhatsAppలో పంపుతుంది.",
          b1: "రాష్ట్రం ఎంచుకోండి",
          b2: "నగరం/లోకాలిటీ ఎంచుకోండి",
          b3: "ఇష్టపడే ఉద్యోగ వర్గం ఎంచుకోండి",
          b4: "WhatsApp ద్వారా సరైన ఉద్యోగ అలర్ట్‌లు పొందండి",
        },
        stateBasedJobAlerts: {
          title: "రాష్ట్ర ఆధారిత ఉద్యోగ అలర్ట్‌లు",
          p1: "ఆఫీస్ సపోర్ట్, డెలివరీ, డ్రైవర్, ఎలక్ట్రీషియన్, ప్లంబర్, హౌస్‌కీపింగ్, సెక్యూరిటీ, హెల్పర్, వేర్‌హౌస్ సిబ్బంది, రిటైల్ సిబ్బంది, టెక్నీషియన్ మరియు మీరు ఎంచుకున్న రాష్ట్రంలో అందుబాటులో ఉన్న ఇతర వర్క్‌ఫోర్స్ ఉద్యోగాలకు అలర్ట్‌లు పొందవచ్చు.",
          b1: "ఆఫీస్ సపోర్ట్",
          b2: "డెలివరీ",
          b3: "డ్రైవర్",
          b4: "ఎలక్ట్రీషియన్",
          b5: "ప్లంబర్",
          b6: "హౌస్‌కీపింగ్",
          b7: "సెక్యూరిటీ",
          b8: "హెల్పర్",
          b9: "వేర్‌హౌస్ సిబ్బంది",
          b10: "రిటైల్ సిబ్బంది",
          b11: "టెక్నీషియన్",
          b12: "ఇతర వర్క్‌ఫోర్స్ ఉద్యోగాలు",
        },
        jobAvailability: {
          title: "ఉద్యోగ లభ్యత",
          p1: "AsliJobs భారతదేశం అంతటా ఉద్యోగార్థులకు మరియు యజమానులకు సేవలు అందిస్తుంది. ఉద్యోగ లభ్యత రాష్ట్రం, నగరం, లోకాలిటీ, ఉద్యోగ వర్గం మరియు యజమాని ఖాళీలను బట్టి మారవచ్చు.",
        },
      },
      cta: {
        title: "శోధన ప్రారంభించండి",
        p1: "మీ ఇష్టపడే రాష్ట్రం ఎంచుకుని WhatsAppలో సరైన ఉద్యోగ అవకాశాలు పొందడం ప్రారంభించండి.",
        tagline: "రాష్ట్రం వారీగా వెతకండి. సులభంగా దరఖాస్తు చేయండి. WhatsAppలో అప్‌డేట్‌లు పొందండి.",
        badge: "WhatsApp",
      },
    },
    jobCategories: {
      title: "ఉద్యోగ వర్గాలు",
      metaDescription:
        "AsliJobs ఉద్యోగార్థులకు WhatsApp ద్వారా వివిధ వర్గాల్లో బ్లూ-కాలర్ మరియు గ్రే-కాలర్ ఉద్యోగాలు కనుగొనడంలో సహాయపడుతుంది.",
      intro: {
        i1: "AsliJobs ఉద్యోగార్థులకు వివిధ వర్గాల్లో బ్లూ-కాలర్ మరియు గ్రే-కాలర్ ఉద్యోగాలు కనుగొనడంలో సహాయపడుతుంది. ఫీల్డ్ పని, సాంకేతిక పని, ఆఫీస్ సపోర్ట్, డెలివరీ, రిటైల్ లేదా సేవా ఆధారిత పాత్రలు వెతుకుతున్నా, AsliJobs WhatsApp ద్వారా సరైన ఉద్యోగాలు కనుగొనడం సులభం చేస్తుంది.",
      },
      sections: {
        exploreJobsByCategory: {
          title: "వర్గం వారీగా ఉద్యోగాలు చూడండి",
          p1: "ప్రొఫైల్ సృష్టించేటప్పుడు మీ ఇష్టపడే ఉద్యోగ వర్గం ఎంచుకోవచ్చు. మీ నైపుణ్యాలు, అనుభవం, ప్రదేశం మరియు లభ్యత ఆధారంగా AsliJobs సరైన ఉద్యోగ అలర్ట్‌లను నేరుగా WhatsAppలో పంపుతుంది.",
        },
        popularJobCategories: {
          title: "ప్రాచుర్యం పొందిన ఉద్యోగ వర్గాలు",
          cards: {
            officeSupport: {
              title: "ఆఫీస్ సపోర్ట్",
              description:
                "ఆఫీస్ అసిస్టెంట్, అడ్మిన్ హెల్పర్, రిసెప్షనిస్ట్, డేటా ఎంట్రీ సపోర్ట్ మరియు బ్యాక్-ఆఫీస్ సిబ్బంది వంటి ఉద్యోగాలు.",
            },
            deliveryLogistics: {
              title: "డెలివరీ మరియు లాజిస్టిక్స్",
              description:
                "డెలివరీ ఎగ్జిక్యూటివ్, కొరియర్ సిబ్బంది, లాజిస్టిక్స్ హెల్పర్ మరియు ఫీల్డ్ డెలివరీ పాత్రల వంటి ఉద్యోగాలు.",
            },
            driverJobs: {
              title: "డ్రైవర్ ఉద్యోగాలు",
              description:
                "కారు డ్రైవర్లు, కమర్షియల్ డ్రైవర్లు, పర్సనల్ డ్రైవర్లు మరియు కంపెనీ డ్రైవర్ల ఉద్యోగాలు.",
            },
            electricianJobs: {
              title: "ఎలక్ట్రీషియన్ ఉద్యోగాలు",
              description:
                "ఎలక్ట్రీషియన్లు, ఎలక్ట్రికల్ హెల్పర్లు, వైరింగ్ టెక్నీషియన్లు మరియు మెయింటెనెన్స్ సిబ్బంది ఉద్యోగాలు.",
            },
            plumbingJobs: {
              title: "ప్లంబింగ్ ఉద్యోగాలు",
              description:
                "ప్లంబర్లు, ప్లంబింగ్ అసిస్టెంట్లు మరియు మెయింటెనెన్స్ సపోర్ట్ కార్మికుల ఉద్యోగాలు.",
            },
            housekeepingJobs: {
              title: "హౌస్‌కీపింగ్ ఉద్యోగాలు",
              description:
                "హౌస్‌కీపింగ్ సిబ్బంది, శుభ్రత సిబ్బంది, ఫెసిలిటీ సపోర్ట్ మరియు మెయింటెనెన్స్ కార్మికుల ఉద్యోగాలు.",
            },
            securityJobs: {
              title: "సెక్యూరిటీ ఉద్యోగాలు",
              description:
                "సెక్యూరిటీ గార్డులు, వాచ్‌మెన్లు, భవన భద్రత మరియు సైట్ భద్రతా సిబ్బంది ఉద్యోగాలు.",
            },
            warehouseJobs: {
              title: "వేర్‌హౌస్ ఉద్యోగాలు",
              description:
                "వేర్‌హౌస్ హెల్పర్లు, ప్యాకర్లు, లోడర్లు, ఇన్వెంటరీ అసిస్టెంట్లు మరియు స్టోర్ సపోర్ట్ సిబ్బంది ఉద్యోగాలు.",
            },
            retailJobs: {
              title: "రిటైల్ ఉద్యోగాలు",
              description:
                "సేల్స్ సిబ్బంది, స్టోర్ అసిస్టెంట్లు, క్యాషియర్లు, ప్రమోటర్లు మరియు కస్టమర్ సపోర్ట్ పాత్రల ఉద్యోగాలు.",
            },
            technicianJobs: {
              title: "టెక్నీషియన్ ఉద్యోగాలు",
              description:
                "ఏసీ టెక్నీషియన్లు, అప్లయన్స్ టెక్నీషియన్లు, మెషిన్ ఆపరేటర్లు, మెకానిక్స్ మరియు సర్వీస్ టెక్నీషియన్ల ఉద్యోగాలు.",
            },
            helperJobs: {
              title: "హెల్పర్ ఉద్యోగాలు",
              description:
                "జనరల్ హెల్పర్లు, సైట్ హెల్పర్లు, ఫ్యాక్టరీ హెల్పర్లు, షాప్ హెల్పర్లు మరియు సపోర్ట్ కార్మికుల ఉద్యోగాలు.",
            },
            otherWorkforceJobs: {
              title: "ఇతర వర్క్‌ఫోర్స్ ఉద్యోగాలు",
              description:
                "యజమాని అవసరాలు మరియు ప్రదేశ లభ్యత ఆధారంగా AsliJobsలో ఇతర బ్లూ-కాలర్ మరియు గ్రే-కాలర్ ఉద్యోగ పాత్రలు కూడా ఉండవచ్చు.",
            },
          },
        },
        jobsBasedOnYourLocation: {
          title: "మీ ప్రదేశం ఆధారంగా ఉద్యోగాలు",
          p1: "ఉద్యోగ లభ్యత మీ రాష్ట్రం, నగరం, ప్రాంతం, లోకాలిటీ, ఉద్యోగ వర్గం మరియు యజమాని ఖాళీలను బట్టి మారవచ్చు. మరింత సంబంధిత ఉద్యోగ అలర్ట్‌లు పొందడానికి మీ ఇష్టపడే ప్రదేశం ఎంచుకోవచ్చు.",
        },
      },
      cta: {
        title: "సరైన ఉద్యోగం వెతకడం ప్రారంభించండి",
        p1: "మీ ఉద్యోగ వర్గం ఎంచుకుని సరైన ఉద్యోగ అవకాశాలు నేరుగా WhatsAppలో పొందడం ప్రారంభించండి.",
        tagline: "మీ వర్గం ఎంచుకోండి. ఉద్యోగ అలర్ట్‌లు పొందండి. WhatsApp ద్వారా సులభంగా దరఖాస్తు చేయండి.",
        badge: "WhatsApp",
      },
    },
    jobSeekerGuide: {
      title: "ఉద్యోగార్థి గైడ్",
      metaDescription:
        "AsliJobs భారతదేశపు బ్లూ-కాలర్ మరియు గ్రే-కాలర్ కార్మికులకు WhatsApp ద్వారా ఉద్యోగ శోధనను సులభం చేస్తుంది.",
      intro: {
        i1: "AsliJobs భారతదేశపు బ్లూ-కాలర్ మరియు గ్రే-కాలర్ కార్మికులకు ఉద్యోగ శోధనను సులభం చేస్తుంది. AsliJobsతో ఉద్యోగార్థులు సరైన ఉద్యోగాలు కనుగొనవచ్చు, సులభంగా దరఖాస్తు చేయవచ్చు మరియు అప్‌డేట్‌లు నేరుగా WhatsApp ద్వారా పొందవచ్చు.",
      },
      sections: {
        startWithWhatsapp: {
          title: "WhatsAppతో ప్రారంభించండి",
          p1: "మీరు కొత్త యాప్ డౌన్‌లోడ్ చేసుకోవాల్సిన అవసరం లేదు. AsliJobs WhatsApp లింక్‌పై క్లిక్ చేసి, QR కోడ్ స్కాన్ చేసి లేదా అధికారిక AsliJobs WhatsApp నంబర్‌కు సందేశం పంపి ప్రారంభించవచ్చు.",
        },
        createYourProfile: {
          title: "మీ ప్రొఫైల్ సృష్టించండి",
          p1: "పేరు, మొబైల్ నంబర్, ప్రదేశం, ఇష్టపడే భాష, ఉద్యోగ వర్గం, నైపుణ్యాలు, అనుభవం, ఆశించే జీతం మరియు లభ్యత వంటి ప్రాథమిక వివరాలు పంచుకోండి. ఇది AsliJobs మీకు మరింత సరైన ఉద్యోగ అవకాశాలు పంపడంలో సహాయపడుతుంది.",
          b1: "పేరు",
          b2: "మొబైల్ నంబర్",
          b3: "ప్రదేశం",
          b4: "ఇష్టపడే భాష",
          b5: "ఉద్యోగ వర్గం",
          b6: "నైపుణ్యాలు",
          b7: "అనుభవం",
          b8: "ఆశించే జీతం",
          b9: "లభ్యత",
        },
        chooseYourJobCategory: {
          title: "మీ ఉద్యోగ వర్గం ఎంచుకోండి",
          p1: "మీరు వెతుకుతున్న ఉద్యోగ రకం ఎంచుకోండి, ఉదాహరణకు ఆఫీస్ సపోర్ట్, డెలివరీ, డ్రైవర్, ఎలక్ట్రీషియన్, హౌస్‌కీపింగ్, సెక్యూరిటీ, రిటైల్, వేర్‌హౌస్, టెక్నీషియన్, హెల్పర్ లేదా ఇతర అందుబాటులో ఉన్న వర్క్‌ఫోర్స్ ఉద్యోగాలు.",
          b1: "ఆఫీస్ సపోర్ట్",
          b2: "డెలివరీ",
          b3: "డ్రైవర్",
          b4: "ఎలక్ట్రీషియన్",
          b5: "హౌస్‌కీపింగ్",
          b6: "సెక్యూరిటీ",
          b7: "రిటైల్",
          b8: "వేర్‌హౌస్",
          b9: "టెక్నీషియన్",
          b10: "హెల్పర్",
          b11: "ఇతర అందుబాటులో ఉన్న వర్క్‌ఫోర్స్ ఉద్యోగాలు",
        },
        selectYourLocation: {
          title: "మీ ప్రదేశం ఎంచుకోండి",
          p1: "AsliJobs మీకు దగ్గరగా మరియు అనుకూలంగా ఉన్న ఉద్యోగాలు చూపేలా మీ రాష్ట్రం, నగరం, ప్రాంతం లేదా లోకాలిటీ ఎంచుకోండి.",
          b1: "రాష్ట్రం",
          b2: "నగరం",
          b3: "ప్రాంతం",
          b4: "లోకాలిటీ",
        },
        receiveJobAlerts: {
          title: "ఉద్యోగ అలర్ట్‌లు పొందండి",
          p1: "మీ ప్రొఫైల్, ప్రదేశం, ఉద్యోగ వర్గం మరియు లభ్యత ఆధారంగా WhatsAppలో సరైన ఉద్యోగ అలర్ట్‌లు వస్తాయి. మెరుగైన ఉద్యోగ సరిపోలికలు పొందడానికి ప్రొఫైల్‌ను అప్‌డేట్‌గా ఉంచండి.",
        },
        applyThroughWhatsapp: {
          title: "WhatsApp ద్వారా దరఖాస్తు చేయండి",
          p1: "ఉద్యోగ అలర్ట్ వచ్చినప్పుడు ఉద్యోగ వివరాలు జాగ్రత్తగా చదవండి. ఆసక్తి ఉంటే ఉద్యోగ అలర్ట్‌కు సమాధానం ఇచ్చి లేదా దరఖాస్తు ఎంపికను ఎంచుకుని నేరుగా WhatsApp ద్వారా దరఖాస్తు చేయండి.",
        },
        trackApplicationUpdates: {
          title: "దరఖాస్తు అప్‌డేట్‌లు ట్రాక్ చేయండి",
          p1: "దరఖాస్తు చేసిన తర్వాత దరఖాస్తు చేశారు, షార్ట్‌లిస్ట్, ఇంటర్వ్యూ షెడ్యూల్, ఎంపికయ్యారు లేదా చేరిక నిర్ధారణ వంటి అప్‌డేట్‌లు WhatsApp ద్వారా రావచ్చు.",
          b1: "దరఖాస్తు చేశారు",
          b2: "షార్ట్‌లిస్ట్",
          b3: "ఇంటర్వ్యూ షెడ్యూల్",
          b4: "ఎంపికయ్యారు",
          b5: "చేరిక నిర్ధారణ",
        },
        useYourPreferredLanguage: {
          title: "మీ ఇష్టపడే భాష ఉపయోగించండి",
          p1: "AsliJobs ఇంగ్లీష్, హిందీ, తెలుగు, తమిళం, కన్నడ మరియు మలయాళం భాషలను అందిస్తుంది. ఉద్యోగ అలర్ట్‌లు మరియు అప్‌డేట్‌లు మరింత సౌకర్యంగా పొందడానికి మీ ఇష్టపడే భాష ఎంచుకోవచ్చు.",
          b1: "ఇంగ్లీష్",
          b2: "హిందీ",
          b3: "తెలుగు",
          b4: "తమిళం",
          b5: "కన్నడ",
          b6: "మలయాళం",
        },
        staySafeWhileSearching: {
          title: "వెతుకుతున్నప్పుడు సురక్షితంగా ఉండండి",
          p1: "ఉద్యోగ నిర్ధారణ కోసం డబ్బు చెల్లించకండి. ముందుకు వెళ్లే ముందు కంపెనీ పేరు, ఉద్యోగ ప్రదేశం, జీతం, పని సమయం మరియు ఇంటర్వ్యూ వివరాలు ఎప్పుడూ తనిఖీ చేయండి. నకిలీ ఉద్యోగాలు, చెల్లింపు డిమాండ్లు లేదా అనుమానాస్పద సందేశాలను వెంటనే AsliJobs సపోర్ట్‌కు రిపోర్ట్ చేయండి.",
          b1: "ఉద్యోగ నిర్ధారణ కోసం డబ్బు చెల్లించకండి.",
          b2: "కంపెనీ పేరు తనిఖీ చేయండి.",
          b3: "ఉద్యోగ ప్రదేశం తనిఖీ చేయండి.",
          b4: "జీతం తనిఖీ చేయండి.",
          b5: "పని సమయం తనిఖీ చేయండి.",
          b6: "ఇంటర్వ్యూ వివరాలు తనిఖీ చేయండి.",
          b7: "నకిలీ ఉద్యోగాలను రిపోర్ట్ చేయండి.",
          b8: "చెల్లింపు డిమాండ్లను రిపోర్ట్ చేయండి.",
          b9: "అనుమానాస్పద సందేశాలను రిపోర్ట్ చేయండి.",
        },
        getSupportWhenNeeded: {
          title: "అవసరమైనప్పుడు సహాయం పొందండి",
          p1: "నమోదు, ఉద్యోగ అలర్ట్‌లు, దరఖాస్తులు, ఇంటర్వ్యూలు, ప్రొఫైల్ అప్‌డేట్‌లు, భాషా మద్దతు లేదా ఫిర్యాదులకు సహాయం కోసం WhatsApp, కాల్ లేదా ఈమెయిల్ ద్వారా AsliJobs సపోర్ట్‌ను సంప్రదించవచ్చు.",
          b1: "WhatsApp",
          b2: "కాల్",
          b3: "ఈమెయిల్",
          b4: "నమోదు",
          b5: "ఉద్యోగ అలర్ట్‌లు",
          b6: "దరఖాస్తులు",
          b7: "ఇంటర్వ్యూలు",
          b8: "ప్రొఫైల్ అప్‌డేట్‌లు",
          b9: "భాషా మద్దతు",
          b10: "ఫిర్యాదులు",
        },
      },
      cta: {
        title: "మీ ఉద్యోగ శోధన ప్రారంభించండి",
        p1: "AsliJobsతో ఉద్యోగాలు కనుగొనడం మరియు దరఖాస్తు చేయడం సరళం, పరిచితం మరియు సులభం.",
        tagline: "మీ ప్రొఫైల్ సృష్టించండి. ఉద్యోగ అలర్ట్‌లు పొందండి. WhatsApp ద్వారా దరఖాస్తు చేయండి.",
        badge: "WhatsApp",
      },
    },
    postAJob: {
      title: "ఉద్యోగం పోస్ట్ చేయండి",
      metaDescription: "AsliJobsతో సరైన బ్లూ-కాలర్ మరియు గ్రే-కాలర్ అభ్యర్థులను నియమించుకోండి.",
      intro: {
        i1: "AsliJobsతో సరైన బ్లూ-కాలర్ మరియు గ్రే-కాలర్ అభ్యర్థులను నియమించుకోండి. ఆఫీస్ సపోర్ట్ సిబ్బంది, డెలివరీ ఎగ్జిక్యూటివ్‌లు, డ్రైవర్లు, ఎలక్ట్రీషియన్లు, హౌస్‌కీపింగ్ సిబ్బంది, సెక్యూరిటీ గార్డులు, వేర్‌హౌస్ కార్మికులు, రిటైల్ సిబ్బంది, టెక్నీషియన్లు లేదా హెల్పర్లు కావాలన్నా, AsliJobs మిమ్మల్ని సరైన ఉద్యోగార్థుల వద్దకు సులభంగా చేరుస్తుంది.",
      },
      sections: {
        postJobsEasily: {
          title: "ఉద్యోగాలు సులభంగా పోస్ట్ చేయండి",
          p1: "యజమానులు ఉద్యోగ శీర్షిక, ప్రదేశం, జీతం, పని సమయాలు, ఖాళీల సంఖ్య, అవసరమైన అనుభవం, అవసరమైన నైపుణ్యాలు, ప్రయోజనాలు మరియు ఇంటర్వ్యూ వివరాలు పంచుకుని AsliJobsలో ఉద్యోగాలు పోస్ట్ చేయవచ్చు.",
          b1: "ఉద్యోగ శీర్షిక",
          b2: "ప్రదేశం",
          b3: "జీతం",
          b4: "పని సమయాలు",
          b5: "ఖాళీల సంఖ్య",
          b6: "అవసరమైన అనుభవం",
          b7: "అవసరమైన నైపుణ్యాలు",
          b8: "ప్రయోజనాలు",
          b9: "ఇంటర్వ్యూ వివరాలు",
        },
        reachSuitableCandidates: {
          title: "సరైన అభ్యర్థులను చేరుకోండి",
          p1: "మీ ఉద్యోగం పోస్ట్ అయిన తర్వాత, ప్రదేశం, ఉద్యోగ వర్గం, అనుభవం, భాషా ప్రాధాన్యం మరియు లభ్యత ఆధారంగా సంబంధిత ఉద్యోగార్థులతో అవకాశాన్ని పంచుకోవడంలో AsliJobs సహాయపడుతుంది.",
        },
        manageApplications: {
          title: "దరఖాస్తులను నిర్వహించండి",
          p1: "యజమానులు యజమాని డాష్‌బోర్డ్ ద్వారా లేదా AsliJobs బృందం మద్దతుతో దరఖాస్తులు చూడవచ్చు, అభ్యర్థులను షార్ట్‌లిస్ట్ చేయవచ్చు, ఇంటర్వ్యూలు షెడ్యూల్ చేయవచ్చు మరియు నియామక పురోగతిని ట్రాక్ చేయవచ్చు.",
        },
        promoteYourJob: {
          title: "మీ ఉద్యోగాన్ని ప్రమోట్ చేయండి",
          p1: "దృశ్యత పెంచి మరిన్ని సరైన అభ్యర్థులను చేరుకోవడానికి యజమానులు ప్రమోటెడ్ ఉద్యోగాలు లేదా క్యాంపెయిన్ ప్రమోషన్లు ఎంచుకోవచ్చు.",
        },
      },
      cta: {
        title: "AsliJobsతో నియామకం ప్రారంభించండి",
        p1: "AsliJobsలో మీ ఉద్యోగం పోస్ట్ చేసి పని చేయడానికి సిద్ధంగా ఉన్న అభ్యర్థులతో కనెక్ట్ అవ్వండి.",
        tagline: "ఉద్యోగం పోస్ట్ చేయండి. సరైన అభ్యర్థులను చేరుకోండి. వేగంగా నియమించుకోండి.",
        badge: "యజమానుల కోసం",
      },
    },
    employerLogin: {
      title: "యజమాని లాగిన్",
      metaDescription:
        "ఉద్యోగ పోస్ట్‌లు, దరఖాస్తులు, అభ్యర్థులు, ఇంటర్వ్యూలు, నియామక ప్లాన్లు మరియు ప్రమోషన్లు నిర్వహించడానికి మీ AsliJobs యజమాని డాష్‌బోర్డ్‌ను యాక్సెస్ చేయండి.",
      intro: {
        i1: "ఉద్యోగ పోస్ట్‌లు, దరఖాస్తులు, అభ్యర్థులు, ఇంటర్వ్యూలు, నియామక ప్లాన్లు మరియు ప్రమోషన్లను ఒకే చోట నిర్వహించడానికి మీ AsliJobs యజమాని డాష్‌బోర్డ్‌ను యాక్సెస్ చేయండి.",
      },
      sections: {
        loginToYourEmployerDashboard: {
          title: "మీ యజమాని డాష్‌బోర్డ్‌లో లాగిన్ అవ్వండి",
          p1: "యజమానులు తమ నమోదైన మొబైల్ నంబర్, ఈమెయిల్ చిరునామా లేదా AsliJobs అందించిన లాగిన్ ఎంపికతో లాగిన్ అవ్వవచ్చు.",
        },
        manageJobPosts: {
          title: "ఉద్యోగ పోస్ట్‌లను నిర్వహించండి",
          p1: "లాగిన్ అయిన తర్వాత యజమానులు కొత్త ఉద్యోగాలు పోస్ట్ చేయవచ్చు, ఉద్యోగ వివరాలు సవరించవచ్చు, ఖాళీలు అప్‌డేట్ చేయవచ్చు, ఉద్యోగాలు నిలిపివేయవచ్చు, నిండిన పదవులు మూసివేయవచ్చు మరియు సక్రియ ఉద్యోగ పోస్ట్‌లను ట్రాక్ చేయవచ్చు.",
        },
        viewApplications: {
          title: "దరఖాస్తులు చూడండి",
          p1: "యజమానులు తమ ఉద్యోగ పోస్ట్‌లకు వచ్చిన దరఖాస్తులు చూడవచ్చు, అభ్యర్థి వివరాలు తనిఖీ చేయవచ్చు మరియు నియామక అవసరాల ఆధారంగా సరైన ప్రొఫైల్‌లను షార్ట్‌లిస్ట్ చేయవచ్చు.",
        },
        scheduleInterviews: {
          title: "ఇంటర్వ్యూలు షెడ్యూల్ చేయండి",
          p1: "యజమానులు ఇంటర్వ్యూ తేదీ, సమయం, ప్రదేశం మరియు సంప్రదింపు వ్యక్తి వివరాలు జోడించి ఇంటర్వ్యూలు షెడ్యూల్ చేయవచ్చు. అభ్యర్థులు WhatsApp ద్వారా ఇంటర్వ్యూ అప్‌డేట్‌లు పొందవచ్చు.",
        },
        trackHiringProgress: {
          title: "నియామక పురోగతిని ట్రాక్ చేయండి",
          p1: "యజమాని డాష్‌బోర్డ్ దరఖాస్తు స్థితి, షార్ట్‌లిస్ట్ అభ్యర్థులు, షెడ్యూల్ అయిన ఇంటర్వ్యూలు, ఎంపికైన అభ్యర్థులు మరియు మూసిన ఉద్యోగ పోస్ట్‌లను ట్రాక్ చేయడంలో సహాయపడుతుంది.",
        },
        managePlansAndPromotions: {
          title: "ప్లాన్లు మరియు ప్రమోషన్లు నిర్వహించండి",
          p1: "యజమానులు డాష్‌బోర్డ్ ద్వారా నియామక ప్లాన్లు, ప్రమోటెడ్ ఉద్యోగాలు, క్యాంపెయిన్ ప్రమోషన్లు, చెల్లింపులు, ఇన్‌వాయిస్‌లు మరియు పునరుద్ధరణ వివరాలు చూడవచ్చు.",
        },
        needLoginHelp: {
          title: "లాగిన్ సహాయం కావాలా?",
          p1: "మీరు లాగిన్ కాలేకపోతే లేదా యజమాని డాష్‌బోర్డ్‌ను యాక్సెస్ చేయలేకపోతే, WhatsApp, కాల్ లేదా ఈమెయిల్ ద్వారా AsliJobs సపోర్ట్‌ను సంప్రదించండి.",
          b1: "WhatsApp",
          b2: "కాల్",
          b3: "ఈమెయిల్",
        },
      },
      cta: {
        title: "యజమాని లాగిన్",
        tagline: "లాగిన్ అవ్వండి. ఉద్యోగాలు నిర్వహించండి. AsliJobsతో వేగంగా నియమించుకోండి.",
        badge: "యజమానుల కోసం",
      },
    },
    pricingPlans: {
      title: "ధరల ప్లాన్లు",
      metaDescription:
        "మీ వ్యాపారానికి సరైన నియామక ప్లాన్ ఎంచుకుని AsliJobs ద్వారా సరైన బ్లూ-కాలర్ మరియు గ్రే-కాలర్ అభ్యర్థులతో కనెక్ట్ అవ్వండి.",
      intro: {
        i1: "మీ వ్యాపారానికి సరైన నియామక ప్లాన్ ఎంచుకుని AsliJobs ద్వారా సరైన బ్లూ-కాలర్ మరియు గ్రే-కాలర్ అభ్యర్థులతో కనెక్ట్ అవ్వండి.",
        i2: "ఉద్యోగాలు పోస్ట్ చేయాలనుకునే, దరఖాస్తులు పొందాలనుకునే, ఖాళీలను ప్రమోట్ చేయాలనుకునే మరియు నియామకాన్ని మరింత సమర్థవంతంగా నిర్వహించాలనుకునే యజమానులకు AsliJobs చెల్లింపు నియామక ప్లాన్లు అందిస్తుంది.",
      },
      sections: {
        simplePlansForEveryHiringNeed: {
          title: "ప్రతి నియామక అవసరానికి సరళమైన ప్లాన్లు",
          p1: "ఒక పాత్రకు నియమిస్తున్నా లేదా అనేక ఖాళీలకు నియమిస్తున్నా, ప్రదేశం, ఉద్యోగ వర్గం, అనుభవం, భాషా ప్రాధాన్యం మరియు లభ్యత ఆధారంగా ఉద్యోగార్థులను చేరుకోవడంలో AsliJobs సహాయపడుతుంది.",
        },
        employerHiringPlans: {
          title: "యజమాని నియామక ప్లాన్లు",
          cards: {
            basicHiringPlan: {
              title: "బేసిక్ నియామక ప్లాన్",
              description:
                "ఎవరికి ఉత్తమం: పరిమిత నియామక అవసరాలున్న యజమానులు. ఇందులో ఉంటుంది: ఉద్యోగం పోస్ట్ చేయడం, అభ్యర్థి దరఖాస్తులు మరియు ప్రాథమిక డాష్‌బోర్డ్ యాక్సెస్.",
            },
            standardHiringPlan: {
              title: "స్టాండర్డ్ నియామక ప్లాన్",
              description:
                "ఎవరికి ఉత్తమం: క్రమం తప్పకుండా నియమించే యజమానులు. ఇందులో ఉంటుంది: అనేక ఉద్యోగ పోస్ట్‌లు, మరింత అభ్యర్థి చేరిక, దరఖాస్తు ట్రాకింగ్ మరియు సపోర్ట్.",
            },
            premiumHiringPlan: {
              title: "ప్రీమియం నియామక ప్లాన్",
              description:
                "ఎవరికి ఉత్తమం: వేగవంతమైన నియామకం కావాల్సిన యజమానులు. ఇందులో ఉంటుంది: ఎక్కువ దృశ్యత, ప్రమోటెడ్ ఉద్యోగ ఎంపికలు, ప్రాధాన్య సపోర్ట్ మరియు మెరుగైన అభ్యర్థి చేరిక.",
            },
            campaignHiringPlan: {
              title: "క్యాంపెయిన్ నియామక ప్లాన్",
              description:
                "ఎవరికి ఉత్తమం: భారీ లేదా అత్యవసర నియామక అవసరాలున్న యజమానులు. ఇందులో ఉంటుంది: లక్ష్యిత నియామక క్యాంపెయిన్లు, ప్రదేశ ఆధారిత చేరిక, WhatsApp ఉద్యోగ అలర్ట్‌లు మరియు నియామక సపోర్ట్.",
            },
          },
        },
        whatEmployersCanDo: {
          title: "యజమానులు ఏమి చేయగలరు",
          b1: "ఉద్యోగాలు పోస్ట్ చేయండి",
          b2: "అభ్యర్థి దరఖాస్తులు పొందండి",
          b3: "అభ్యర్థి వివరాలు చూడండి",
          b4: "సరైన ప్రొఫైల్‌లను షార్ట్‌లిస్ట్ చేయండి",
          b5: "ఇంటర్వ్యూలు షెడ్యూల్ చేయండి",
          b6: "నియామక పురోగతిని ట్రాక్ చేయండి",
          b7: "ఉద్యోగ ఖాళీలను ప్రమోట్ చేయండి",
          b8: "నియామక సంబంధిత ప్రశ్నలకు సహాయం పొందండి",
        },
        promotedJobs: {
          title: "ప్రమోటెడ్ ఉద్యోగాలు",
          p1: "ముఖ్యమైన లేదా అత్యవసర ఖాళీల దృశ్యత పెంచడంలో ప్రమోటెడ్ ఉద్యోగాలు యజమానులకు సహాయపడతాయి. ఈ ఉద్యోగాలు ప్రదేశం, ఉద్యోగ పాత్ర మరియు అభ్యర్థి ప్రొఫైల్ ఆధారంగా మరింత సంబంధిత ఉద్యోగార్థులను చేరుకోగలవు.",
        },
        campaignPromotions: {
          title: "క్యాంపెయిన్ ప్రమోషన్లు",
          p1: "భారీగా నియమించాలనుకునే, నిర్దిష్ట ప్రదేశాలను లక్ష్యంగా చేసుకోవాలనుకునే లేదా ఎంచుకున్న ఉద్యోగ వర్గాల్లోని ఉద్యోగార్థులను చేరుకోవాలనుకునే యజమానులకు క్యాంపెయిన్ ప్రమోషన్లు ఉపయోగపడతాయి.",
        },
        paymentsAndInvoices: {
          title: "చెల్లింపులు మరియు ఇన్‌వాయిస్‌లు",
          p1: "యజమానులు సరైన ప్లాన్ ఎంచుకుని అందుబాటులో ఉన్న చెల్లింపు ఎంపికల ద్వారా చెల్లింపు పూర్తి చేయవచ్చు. చెల్లింపు తర్వాత AsliJobs సపోర్ట్ ద్వారా ఇన్‌వాయిస్‌లు అభ్యర్థించవచ్చు.",
        },
        needHelpChoosingAPlan: {
          title: "ప్లాన్ ఎంచుకోవడంలో సహాయం కావాలా?",
          p1: "మీ నియామక అవసరానికి ఏ ప్లాన్ సరైనదో తెలియకపోతే AsliJobs సపోర్ట్‌ను సంప్రదించండి. మీ ఉద్యోగ పాత్ర, ప్రదేశం, ఖాళీల సంఖ్య మరియు నియామక అత్యవసరత ఆధారంగా సరైన ప్లాన్ ఎంచుకోవడంలో మా బృందం సహాయపడుతుంది.",
        },
      },
      cta: {
        title: "AsliJobsతో నియామకం ప్రారంభించండి",
        tagline: "ప్లాన్ ఎంచుకోండి. మీ ఉద్యోగం పోస్ట్ చేయండి. AsliJobsతో నియామకం ప్రారంభించండి.",
        badge: "యజమానుల కోసం",
      },
    },
    employerGuide: {
      title: "యజమాని గైడ్",
      metaDescription:
        "సరళమైన, WhatsApp-స్నేహపూర్వక నియామక ప్రక్రియ ద్వారా సరైన బ్లూ-కాలర్ మరియు గ్రే-కాలర్ అభ్యర్థులను నియమించుకోవడంలో AsliJobs యజమానులకు సహాయపడుతుంది.",
      intro: {
        i1: "సరళమైన, WhatsApp-స్నేహపూర్వక నియామక ప్రక్రియ ద్వారా సరైన బ్లూ-కాలర్ మరియు గ్రే-కాలర్ అభ్యర్థులను నియమించుకోవడంలో AsliJobs యజమానులకు సహాయపడుతుంది. ఒక పాత్రకు నియమిస్తున్నా లేదా అనేక ఖాళీలకు నియమిస్తున్నా, ప్రదేశం, ఉద్యోగ వర్గం, అనుభవం, నైపుణ్యాలు, భాషా ప్రాధాన్యం మరియు లభ్యత ఆధారంగా ఉద్యోగార్థులను చేరుకోవడంలో AsliJobs సహాయపడుతుంది.",
      },
      sections: {
        registerAsAnEmployer: {
          title: "యజమానిగా నమోదు చేసుకోండి",
          p1: "AsliJobsలో మీ యజమాని ప్రొఫైల్ సృష్టించడం ద్వారా ప్రారంభించండి. యజమాని పేరు, కంపెనీ పేరు, సంప్రదింపు వ్యక్తి వివరాలు, మొబైల్ నంబర్, ప్రదేశం, వ్యాపార రకం, నియామక వర్గాలు మరియు ఇష్టపడే భాష వంటి ప్రాథమిక వివరాలు పంచుకోండి.",
          b1: "యజమాని పేరు",
          b2: "కంపెనీ పేరు",
          b3: "సంప్రదింపు వ్యక్తి వివరాలు",
          b4: "మొబైల్ నంబర్",
          b5: "ప్రదేశం",
          b6: "వ్యాపార రకం",
          b7: "నియామక వర్గాలు",
          b8: "ఇష్టపడే భాష",
        },
        postAJob: {
          title: "ఉద్యోగం పోస్ట్ చేయండి",
          p1: "ఉద్యోగ శీర్షిక, జీత పరిధి, పని ప్రదేశం, సమయాలు, ఖాళీల సంఖ్య, అవసరమైన అనుభవం, అవసరమైన నైపుణ్యాలు, ప్రయోజనాలు మరియు ఇంటర్వ్యూ వివరాలు వంటి స్పష్టమైన వివరాలు జోడించి మీ ఉద్యోగం పోస్ట్ చేయండి. స్పష్టమైన ఉద్యోగ వివరాలు ఉద్యోగార్థులు అవకాశాన్ని మెరుగ్గా అర్థం చేసుకుని నమ్మకంతో దరఖాస్తు చేయడంలో సహాయపడతాయి.",
        },
        receiveApplications: {
          title: "దరఖాస్తులు పొందండి",
          p1: "మీ ఉద్యోగం పోస్ట్ అయిన తర్వాత సరైన ఉద్యోగార్థులు ఉద్యోగం చూసి దరఖాస్తు చేయవచ్చు. దరఖాస్తులను యజమాని డాష్‌బోర్డ్ ద్వారా లేదా AsliJobs బృందం మద్దతుతో నిర్వహించవచ్చు.",
        },
        shortlistCandidates: {
          title: "అభ్యర్థులను షార్ట్‌లిస్ట్ చేయండి",
          p1: "పేరు, ప్రదేశం, అనుభవం, నైపుణ్యాలు, ఆశించే జీతం, లభ్యత మరియు ఇష్టపడే భాష వంటి అభ్యర్థి వివరాలు సమీక్షించండి. మీ నియామక అవసరాలకు సరిపోయే అభ్యర్థులను షార్ట్‌లిస్ట్ చేయండి.",
        },
        scheduleInterviews: {
          title: "ఇంటర్వ్యూలు షెడ్యూల్ చేయండి",
          p1: "షార్ట్‌లిస్ట్ చేసిన తర్వాత ఇంటర్వ్యూ తేదీ, సమయం, ప్రదేశం మరియు సంప్రదింపు వ్యక్తి వివరాలు పంచుకుని ఇంటర్వ్యూలు షెడ్యూల్ చేయండి. అభ్యర్థులు WhatsApp ద్వారా ఇంటర్వ్యూ అప్‌డేట్‌లు పొందవచ్చు.",
        },
        trackHiringProgress: {
          title: "నియామక పురోగతిని ట్రాక్ చేయండి",
          p1: "దరఖాస్తులు, షార్ట్‌లిస్ట్ అభ్యర్థులు, షెడ్యూల్ అయిన ఇంటర్వ్యూలు, ఎంపికైన అభ్యర్థులు మరియు మూసిన ఉద్యోగ పోస్ట్‌లను ట్రాక్ చేయడానికి యజమాని డాష్‌బోర్డ్ ఉపయోగించండి.",
        },
        promoteJobOpenings: {
          title: "ఉద్యోగ ఖాళీలను ప్రమోట్ చేయండి",
          p1: "ఉద్యోగ దృశ్యత మెరుగుపరచి మరిన్ని సరైన అభ్యర్థులను వేగంగా చేరుకోవడానికి యజమానులు ప్రమోటెడ్ ఉద్యోగాలు లేదా క్యాంపెయిన్ ప్రమోషన్లు ఎంచుకోవచ్చు.",
        },
        updateOrCloseJobPosts: {
          title: "ఉద్యోగ పోస్ట్‌లను అప్‌డేట్ చేయండి లేదా మూసివేయండి",
          p1: "మీ ఉద్యోగ పోస్ట్‌లను అప్‌డేట్‌గా ఉంచండి. ఒక పదవి నిండితే, నిలిపివేస్తే, రద్దైతే లేదా ఇక అందుబాటులో లేకపోతే, డాష్‌బోర్డ్ ద్వారా లేదా AsliJobs సపోర్ట్‌ను సంప్రదించి ఉద్యోగ పోస్ట్‌ను అప్‌డేట్ చేయండి లేదా మూసివేయండి.",
        },
        getEmployerSupport: {
          title: "యజమాని మద్దతు పొందండి",
          p1: "ఉద్యోగం పోస్ట్ చేయడం, దరఖాస్తులు, అభ్యర్థి షార్ట్‌లిస్టింగ్, ఇంటర్వ్యూలు, చెల్లింపులు, ఇన్‌వాయిస్‌లు, ప్రమోషన్లు లేదా డాష్‌బోర్డ్ మద్దతు కోసం యజమానులు WhatsApp, కాల్ లేదా ఈమెయిల్ ద్వారా AsliJobs సపోర్ట్‌ను సంప్రదించవచ్చు.",
          b1: "WhatsApp",
          b2: "కాల్",
          b3: "ఈమెయిల్",
          b4: "ఉద్యోగం పోస్ట్ చేయడం",
          b5: "దరఖాస్తులు",
          b6: "అభ్యర్థి షార్ట్‌లిస్టింగ్",
          b7: "ఇంటర్వ్యూలు",
          b8: "చెల్లింపులు",
          b9: "ఇన్‌వాయిస్‌లు",
          b10: "ప్రమోషన్లు",
          b11: "డాష్‌బోర్డ్ మద్దతు",
        },
        hiringTipsForEmployers: {
          title: "యజమానులకు నియామక చిట్కాలు",
          b1: "పూర్తి మరియు స్పష్టమైన ఉద్యోగ వివరాలు జోడించండి.",
          b2: "సరైన జీతం, ప్రదేశం మరియు పని సమయాలు పేర్కొనండి.",
          b3: "దరఖాస్తులకు సమయానికి సమాధానం ఇవ్వండి.",
          b4: "ఇంటర్వ్యూ వివరాలు స్పష్టంగా పంచుకోండి.",
          b5: "అనవసర దరఖాస్తులు నివారించడానికి నిండిన ఉద్యోగాలు మూసివేయండి.",
          b6: "అత్యవసర లేదా భారీ నియామక అవసరాలకు ప్రమోషన్లు ఉపయోగించండి.",
        },
      },
      cta: {
        title: "AsliJobsతో నియామకం ప్రారంభించండి",
        p1: "సరళమైన మరియు పరిచితమైన ప్లాట్‌ఫామ్ ద్వారా యజమానులను సరైన వర్క్‌ఫోర్స్ అభ్యర్థులతో కనెక్ట్ చేసి AsliJobs నియామకాన్ని సులభం చేస్తుంది.",
        tagline: "మీ యజమాని ప్రొఫైల్ సృష్టించండి. ఉద్యోగం పోస్ట్ చేయండి. AsliJobsతో వేగంగా నియమించుకోండి.",
        badge: "యజమానుల కోసం",
      },
    },
    interviewTips: {
      title: "ఇంటర్వ్యూ చిట్కాలు",
      metaDescription:
        "ఉద్యోగార్థులు బాగా సిద్ధమై, ఆత్మవిశ్వాసంతో ఇంటర్వ్యూకు హాజరై, ఎంపిక కావడానికి సులభమైన ఇంటర్వ్యూ చిట్కాలు.",
      intro: {
        i1: "కొంచెం సిద్ధత మీకు ఇంటర్వ్యూలో ఆత్మవిశ్వాసాన్ని ఇస్తుంది మరియు మంచి అభిప్రాయం కలిగించడంలో సహాయపడుతుంది. ఇంటర్వ్యూకు ముందు, ఇంటర్వ్యూ సమయంలో మరియు తర్వాత ఈ సులభమైన చిట్కాలను పాటించండి.",
      },
      sections: {
        prepareBeforeTheInterview: {
          title: "ఇంటర్వ్యూకు ముందు సిద్ధం అవ్వండి",
          p1: "ఉద్యోగ పాత్ర, జీతం, పని ప్రదేశం మరియు సమయాలతో సహా ఉద్యోగ వివరాలను మళ్లీ చదవండి. మీ నైపుణ్యాలు మరియు అనుభవం ఈ ఉద్యోగానికి ఎలా సరిపోతాయో ఆలోచించండి.",
        },
        documentsToCarry: {
          title: "తీసుకెళ్లాల్సిన పత్రాలు",
          p1: "ఇంటర్వ్యూ రోజు హడావిడి లేకుండా ఉండేందుకు మీ పత్రాలను ఒక రోజు ముందే సిద్ధంగా ఉంచుకోండి.",
          b1: "ఆధార్ కార్డ్ వంటి గుర్తింపు పత్రం",
          b2: "రెజ్యూమే లేదా ప్రొఫైల్ వివరాలు",
          b3: "అనుభవ లేదా జీతం సర్టిఫికెట్లు, ఉంటే",
          b4: "విద్యా సర్టిఫికెట్లు, అవసరమైతే",
          b5: "పాస్‌పోర్ట్ సైజ్ ఫోటోలు",
        },
        onTheInterviewDay: {
          title: "ఇంటర్వ్యూ రోజున",
          p1: "మీ ప్రయాణాన్ని ప్లాన్ చేసుకుని ఇంటర్వ్యూ ప్రదేశానికి 10 నుండి 15 నిమిషాలు ముందుగా చేరుకోండి. శుభ్రమైన, చక్కని దుస్తులు ధరించి, మీ ఫోన్‌ను సైలెంట్‌లో ఉంచండి.",
          b1: "సమయానికి చేరుకోండి",
          b2: "చక్కగా దుస్తులు ధరించండి",
          b3: "మర్యాదగా పలకరించండి",
          b4: "ఫోన్‌ను సైలెంట్‌లో ఉంచండి",
        },
        answerWithConfidence: {
          title: "ఆత్మవిశ్వాసంతో సమాధానం ఇవ్వండి",
          p1: "శ్రద్ధగా వినండి, నిజాయితీగా సమాధానం ఇవ్వండి మరియు స్పష్టంగా మాట్లాడండి. ఇలాంటి సాధారణ ప్రశ్నలకు సిద్ధంగా ఉండండి.",
          b1: "మీ గురించి చెప్పండి.",
          b2: "మీరు ఇంతకు ముందు ఏ పని చేశారు?",
          b3: "మీరు ఎప్పుడు చేరగలరు?",
          b4: "మీరు ఎంత జీతం ఆశిస్తున్నారు?",
        },
        afterTheInterview: {
          title: "ఇంటర్వ్యూ తర్వాత",
          p1: "వెళ్లే ముందు ఇంటర్వ్యూ చేసిన వారికి ధన్యవాదాలు చెప్పండి. ఇంటర్వ్యూ ఫలితాలు మరియు తదుపరి దశలు WhatsAppలో పంపబడతాయి, కాబట్టి మీ సందేశాలను చూస్తూ సమయానికి స్పందించండి.",
        },
        staySafe: {
          title: "సురక్షితంగా ఉండండి",
          p1: "నిజమైన యజమానులు ఇంటర్వ్యూ షెడ్యూల్ చేయడానికి లేదా ఉద్యోగం ఖరారు చేయడానికి డబ్బు అడగరు. ఎవరైనా డబ్బు అడిగితే చెల్లించవద్దు, వెంటనే AsliJobs సపోర్ట్‌కు రిపోర్ట్ చేయండి.",
          b1: "ఇంటర్వ్యూ లేదా ఉద్యోగ నిర్ధారణ కోసం డబ్బు చెల్లించవద్దు.",
          b2: "ఉద్యోగ వివరాల్లో ఇచ్చిన చిరునామాలో మాత్రమే ఇంటర్వ్యూకు హాజరవ్వండి.",
          b3: "అనుమానాస్పద అభ్యర్థనలను AsliJobs సపోర్ట్‌కు రిపోర్ట్ చేయండి.",
        },
      },
      cta: {
        title: "WhatsAppలో ఇంటర్వ్యూ అప్‌డేట్‌లు పొందండి",
        p1: "సరైన ఉద్యోగాలకు దరఖాస్తు చేసి, ఇంటర్వ్యూ వివరాలను నేరుగా WhatsAppలో పొందండి.",
        tagline: "బాగా సిద్ధం అవ్వండి. సమయానికి హాజరవ్వండి. ఎంపిక అవ్వండి.",
        badge: "WhatsApp",
      },
    },
    salaryGuide: {
      title: "జీతం గైడ్",
      metaDescription:
        "ఉద్యోగాన్ని అంగీకరించే ముందు జాబ్ ఆఫర్‌లోని జీతం వివరాలను అర్థం చేసుకోండి — ఇన్-హ్యాండ్ జీతం, కోతలు, అదనపు చెల్లింపులు మరియు చెల్లింపు షెడ్యూల్.",
      intro: {
        i1: "ఏ ఉద్యోగంలోనైనా జీతం అత్యంత ముఖ్యమైన భాగం. జాబ్ అలర్ట్ లేదా ఆఫర్‌లోని జీతం వివరాలను అర్థం చేసుకుని సరైన నిర్ణయం తీసుకోవడానికి ఈ గైడ్ మీకు సహాయపడుతుంది.",
      },
      sections: {
        checkTheSalaryInJobDetails: {
          title: "ఉద్యోగ వివరాల్లో జీతాన్ని చూడండి",
          p1: "AsliJobsలోని ప్రతి ఉద్యోగంలో యజమాని ఇచ్చే జీతం చూపబడుతుంది. దరఖాస్తు చేసే ముందు ఉద్యోగ పాత్ర, పని సమయాలు మరియు ప్రదేశంతో పాటు దాన్ని జాగ్రత్తగా చదవండి.",
        },
        inHandSalaryAndDeductions: {
          title: "ఇన్-హ్యాండ్ జీతం మరియు కోతలు",
          p1: "కోతల తర్వాత మీకు అందే మొత్తమే ఇన్-హ్యాండ్ జీతం. చూపిన జీతం ఇన్-హ్యాండ్ జీతమా లేక PF లేదా ESI వంటి కోతలకు ముందు జీతమా అని యజమానిని అడగండి.",
          b1: "ఇన్-హ్యాండ్ (చేతికి వచ్చే) జీతం",
          b2: "PF (ప్రావిడెంట్ ఫండ్)",
          b3: "ESI (ఎంప్లాయీ స్టేట్ ఇన్సూరెన్స్)",
          b4: "ఇతర కోతలు, ఏవైనా ఉంటే",
        },
        extraPayAndBenefits: {
          title: "అదనపు చెల్లింపులు మరియు ప్రయోజనాలు",
          p1: "కొన్ని ఉద్యోగాల్లో జీతంతో పాటు అదనపు చెల్లింపులు లేదా ప్రయోజనాలు ఉంటాయి. వాటిలో ఏమేమి ఉన్నాయో స్పష్టంగా అడగండి.",
          b1: "ఓవర్‌టైమ్ చెల్లింపు",
          b2: "ఇన్సెంటివ్‌లు",
          b3: "భోజనం లేదా వసతి",
          b4: "ప్రయాణ భత్యం",
          b5: "వారపు సెలవు మరియు జీతంతో కూడిన సెలవు",
        },
        salaryPaymentSchedule: {
          title: "జీతం చెల్లింపు షెడ్యూల్",
          p1: "జీతం ఎప్పుడు, ఎలా చెల్లిస్తారో నిర్ధారించుకోండి — నెలవారీ, వారానికి లేదా రోజువారీ, బ్యాంక్ ట్రాన్స్‌ఫర్ ద్వారానా లేక నగదుగానా. మీ జీతం చెల్లింపుల రికార్డు ఉంచుకోండి.",
        },
        whatAffectsYourSalary: {
          title: "మీ జీతాన్ని ఏవి ప్రభావితం చేస్తాయి",
          p1: "ఈ అంశాల ఆధారంగా జీతం మారవచ్చు. మీ నైపుణ్యాలను మెరుగుపరచుకుని, ప్రొఫైల్‌ను అప్‌డేట్‌గా ఉంచితే మెరుగైన జీతం ఉన్న ఉద్యోగాలు పొందవచ్చు.",
          b1: "అనుభవం",
          b2: "నైపుణ్యాలు",
          b3: "ఉద్యోగ వర్గం",
          b4: "నగరం మరియు ప్రదేశం",
          b5: "షిఫ్ట్ మరియు పని సమయాలు",
        },
        salarySafety: {
          title: "జీతానికి సంబంధించిన భద్రత",
          p1: "ఉద్యోగం లేదా ఎక్కువ జీతం కోసం ఎప్పుడూ డబ్బు చెల్లించవద్దు. తక్కువ పనికి చాలా ఎక్కువ జీతం ఇస్తామని చెప్పే ఆఫర్ల పట్ల జాగ్రత్తగా ఉండి, వాటిని AsliJobs సపోర్ట్‌కు రిపోర్ట్ చేయండి.",
          b1: "ఉద్యోగం కోసం ఎప్పుడూ డబ్బు చెల్లించవద్దు.",
          b2: "నమ్మశక్యం కాని జీతం హామీల పట్ల జాగ్రత్తగా ఉండండి.",
          b3: "అనుమానాస్పద ఆఫర్లను AsliJobs సపోర్ట్‌కు రిపోర్ట్ చేయండి.",
        },
      },
      cta: {
        title: "స్పష్టమైన జీతం వివరాలతో ఉద్యోగాలు కనుగొనండి",
        p1: "జీతం, ప్రదేశం మరియు సమయాలతో కూడిన జాబ్ అలర్ట్‌లను నేరుగా WhatsAppలో పొందండి.",
        tagline: "మీ జీతం తెలుసుకోండి. సరైన ఉద్యోగం ఎంచుకోండి.",
        badge: "WhatsApp",
      },
    },
    careerAdvice: {
      title: "కెరీర్ సలహా",
      metaDescription:
        "ఉద్యోగార్థులు తమ నైపుణ్యాలను పెంచుకుని, మెరుగైన ఉద్యోగాలు పొంది, స్థిరమైన కెరీర్ నిర్మించుకోవడానికి ఆచరణాత్మక కెరీర్ సలహా.",
      intro: {
        i1: "ప్రతి ఉద్యోగం మీ కెరీర్‌లో ఒక అడుగు. ఈ ఆచరణాత్మక చిట్కాలు మీ నైపుణ్యాలను పెంచుకోవడానికి, మెరుగైన అవకాశాలు పొందడానికి మరియు స్థిరమైన భవిష్యత్తును నిర్మించుకోవడానికి సహాయపడతాయి.",
      },
      sections: {
        keepYourProfileUpdated: {
          title: "మీ ప్రొఫైల్‌ను అప్‌డేట్‌గా ఉంచండి",
          p1: "మీ నైపుణ్యాలు, అనుభవం, ఇష్టమైన ప్రదేశం మరియు ఆశించే జీతం మారినప్పుడల్లా వాటిని అప్‌డేట్ చేయండి. అప్‌డేట్ చేసిన ప్రొఫైల్ వల్ల AsliJobs మీకు మెరుగైన ఉద్యోగాలను పంపగలదు.",
        },
        learnNewSkills: {
          title: "కొత్త నైపుణ్యాలు నేర్చుకోండి",
          p1: "కొత్త నైపుణ్యాలు మెరుగైన ఉద్యోగాలకు మరియు ఎక్కువ జీతానికి దారి తీస్తాయి. అనుభవం ఉన్న సహోద్యోగుల నుండి నేర్చుకోండి, చిన్న శిక్షణ కోర్సుల్లో చేరండి మరియు వీలైనప్పుడు సర్టిఫికెట్లు పొందండి.",
          b1: "డ్రైవర్ ఉద్యోగాలకు డ్రైవింగ్ లైసెన్స్",
          b2: "ప్రాథమిక కంప్యూటర్ మరియు మొబైల్ నైపుణ్యాలు",
          b3: "పని ప్రదేశ భద్రత శిక్షణ",
          b4: "ఎలక్ట్రికల్ లేదా ప్లంబింగ్ వంటి వృత్తి నైపుణ్యాలు",
          b5: "కస్టమర్ సర్వీస్ మరియు కమ్యూనికేషన్",
        },
        chooseTheRightJob: {
          title: "సరైన ఉద్యోగం ఎంచుకోండి",
          p1: "జీతం ఒక్కటే చూడకండి. ఉద్యోగాన్ని అంగీకరించే ముందు ఈ అంశాలను పరిగణించండి.",
          b1: "పని ప్రదేశం మరియు ప్రయాణ సమయం",
          b2: "షిఫ్ట్ సమయాలు",
          b3: "ఉద్యోగ భద్రత",
          b4: "ఎదుగుదల అవకాశాలు",
        },
        growInYourCurrentJob: {
          title: "ప్రస్తుత ఉద్యోగంలో ఎదగండి",
          p1: "పనిలో సమయపాలన, నమ్మకం మరియు నిజాయితీతో ఉండండి. మంచి హాజరు మరియు సానుకూల వైఖరి మీకు నమ్మకం, బాధ్యత మరియు ప్రమోషన్లు సంపాదించడంలో సహాయపడతాయి.",
          b1: "సమయానికి రండి",
          b2: "మీ సూపర్‌వైజర్ నుండి నేర్చుకోండి",
          b3: "బాధ్యత తీసుకోండి",
          b4: "మీ పని అనుభవ రికార్డు ఉంచుకోండి",
        },
        planYourNextStep: {
          title: "మీ తదుపరి అడుగును ప్లాన్ చేయండి",
          p1: "సూపర్‌వైజర్, సీనియర్ టెక్నీషియన్ లేదా టీమ్ లీడర్ కావడం వంటి స్పష్టమైన లక్ష్యాన్ని పెట్టుకోండి. మీ తదుపరి ఉద్యోగ దరఖాస్తుకు అనుభవ పత్రాలు మరియు రిఫరెన్స్‌లను సేకరించండి.",
        },
      },
      cta: {
        title: "మీ కెరీర్‌లో తదుపరి అడుగు వేయండి",
        p1: "మీ నైపుణ్యాలు మరియు లక్ష్యాలకు సరిపోయే ఉద్యోగాలను కనుగొని, అలర్ట్‌లను నేరుగా WhatsAppలో పొందండి.",
        tagline: "నేర్చుకోండి. ఎదగండి. మెరుగైన ఉద్యోగాలు పొందండి.",
        badge: "WhatsApp",
      },
    },
  },
};

const ta: MessageShape<typeof en> = {
  publicPages: {
    breadcrumbAria: "உலாவல் பாதை",
    actions: {
      startOnWhatsapp: "WhatsApp-இல் தொடங்குங்கள்",
      browseJobs: "வேலைகளைப் பாருங்கள்",
      postAJob: "வேலையை இடுகையிடுங்கள்",
      employerLogin: "முதலாளி உள்நுழைவு",
      contactSupport: "ஆதரவைத் தொடர்பு கொள்ளுங்கள்",
    },
    findJobs: {
      title: "வேலைகளைக் கண்டறியுங்கள்",
      metaDescription:
        "சரியான வேலையைத் தேடுகிறீர்களா? AsliJobs WhatsApp வழியாக வேலைத் தேடலை எளிதாகவும், விரைவாகவும், சுலபமாகவும் செய்கிறது.",
      intro: {
        i1: "சரியான வேலையைத் தேடுகிறீர்களா? AsliJobs WhatsApp வழியாக வேலைத் தேடலை எளிதாகவும், விரைவாகவும், சுலபமாகவும் செய்கிறது.",
        i2: "இடம், வேலைப் பிரிவு, அனுபவம், திறன்கள், மொழி விருப்பம் மற்றும் கிடைக்கும் தன்மையின் அடிப்படையில் நீலக் கழுத்து மற்றும் சாம்பல் கழுத்து வேலைகளைக் கண்டறிய AsliJobs வேலை தேடுபவர்களுக்கு உதவுகிறது. அலுவலக ஆதரவு, விநியோகம், வாகன ஓட்டுதல், மின்சாரப் பணி, வீட்டுப் பராமரிப்பு, பாதுகாப்பு, கிடங்கு, சில்லறை, தொழில்நுட்பப் பணியாளர் அல்லது பிற பணியாளர் வாய்ப்புகளைத் தேடினாலும், AsliJobs உங்களைப் பொருத்தமான முதலாளிகளுடன் இணைக்கிறது.",
      },
      sections: {
        findJobsThroughWhatsapp: {
          title: "WhatsApp வழியாக வேலைகளைக் கண்டறியுங்கள்",
          p1: "புதிய செயலியைப் பதிவிறக்க வேண்டியதில்லை. AsliJobs மூலம் வேலை அறிவிப்புகளைப் பெறலாம், வேலை விவரங்களைப் பார்க்கலாம், விண்ணப்பிக்கலாம் மற்றும் நேர்காணல் புதுப்பிப்புகளை நேரடியாக WhatsApp-இல் பெறலாம்.",
          p2: "AsliJobs WhatsApp அரட்டையைத் தொடங்கி, அடிப்படைச் சுயவிவர விவரங்களைப் பகிர்ந்து, விருப்ப வேலைப் பிரிவு மற்றும் இடத்தைத் தேர்ந்தெடுத்து, பொருத்தமான வேலை வாய்ப்புகளைப் பெறுங்கள்.",
        },
        jobsBasedOnYourLocation: {
          title: "உங்கள் இடத்தின் அடிப்படையிலான வேலைகள்",
          p1: "உங்கள் நகரம், பகுதி, வட்டாரம் அல்லது விருப்பப் பணி இடத்தின் அடிப்படையில் வேலைகளைக் கண்டறிய AsliJobs உதவுகிறது. அருகிலுள்ள, உங்களுக்கு வசதியான வேலைகளைக் கண்டறிந்து விண்ணப்பிப்பது எளிதாகிறது.",
        },
        applyEasily: {
          title: "எளிதாக விண்ணப்பியுங்கள்",
          p1: "வேலை அறிவிப்பு வந்ததும் வேலைத் தலைப்பு, சம்பளம், இடம், நேரம், தேவையான அனுபவம் மற்றும் பிற விவரங்களைப் பார்க்கலாம். ஆர்வம் இருந்தால் வேலை அறிவிப்புக்குப் பதிலளித்து அல்லது விண்ணப்பிக்கும் விருப்பத்தைத் தேர்ந்தெடுத்து நேரடியாக WhatsApp வழியாக விண்ணப்பிக்கலாம்.",
        },
        stayUpdated: {
          title: "புதுப்பிப்பாக இருங்கள்",
          p1: "விண்ணப்பித்த பிறகு விண்ணப்ப நிலை, குறுகிய பட்டியல் புதுப்பிப்புகள், நேர்காணல் விவரங்கள், தேர்வு நிலை மற்றும் சேரும் தகவல் உட்பட முக்கிய புதுப்பிப்புகள் WhatsApp வழியாக வரும்.",
        },
        safeJobSearch: {
          title: "பாதுகாப்பான வேலைத் தேடல்",
          p1: "எளிய நம்பகமான வேலைத் தேடல் அனுபவத்தை உருவாக்குவதில் AsliJobs கவனம் செலுத்துகிறது. வேலை தேடுபவர்கள் வேலை விவரங்களை எப்போதும் கவனமாகச் சரிபார்த்து, போலி வேலை, கட்டணக் கோரிக்கை அல்லது சந்தேகத்திற்குரிய செயல்பாட்டை AsliJobs ஆதரவுக்குப் புகாரளிக்க வேண்டும்.",
        },
      },
      cta: {
        title: "வேலைகளைத் தேடத் தொடங்குங்கள்",
        p1: "AsliJobs மூலம் உங்கள் வேலைத் தேடலைத் தொடங்கி பொருத்தமான வேலை வாய்ப்புகளை நேரடியாக WhatsApp-இல் பெறுங்கள்.",
        tagline: "வேலைகளைக் கண்டறியுங்கள். எளிதாக விண்ணப்பியுங்கள். WhatsApp-இல் புதுப்பிப்புகளைப் பெறுங்கள்.",
        badge: "WhatsApp",
      },
    },
    browseByCity: {
      title: "நகரம் வாரியாகப் பாருங்கள்",
      metaDescription:
        "AsliJobs மூலம் WhatsApp வழியாக உங்கள் விருப்ப நகரத்தில் நீலக் கழுத்து மற்றும் சாம்பல் கழுத்து வேலைகளைக் கண்டறியுங்கள்.",
      intro: {
        i1: "AsliJobs மூலம் உங்கள் விருப்ப நகரத்தில் நீலக் கழுத்து மற்றும் சாம்பல் கழுத்து வேலைகளைக் கண்டறியுங்கள். அருகிலுள்ள வேலையைத் தேடினாலும் அல்லது வேறொரு நகரத்தில் வேலை செய்யத் திட்டமிட்டாலும், AsliJobs WhatsApp வழியாகப் பொருத்தமான வாய்ப்புகளைக் கண்டறிய உதவுகிறது.",
      },
      sections: {
        findJobsInYourCity: {
          title: "உங்கள் நகரத்தில் வேலைகளைக் கண்டறியுங்கள்",
          p1: "நகரம், பகுதி, வட்டாரம் மற்றும் விருப்பப் பணி இடத்தின் அடிப்படையில் வேலைகளைத் தேட AsliJobs வேலை தேடுபவர்களுக்கு அனுமதிக்கிறது. அருகில் உள்ள, எளிதாகச் சென்றடையும், உங்கள் அன்றாடத்திற்கு ஏற்ற வேலைகளைக் கண்டறிய இது உதவுகிறது.",
        },
        howItWorks: {
          title: "இது எப்படி வேலை செய்கிறது",
          p1: "உங்கள் நகரத்தைத் தேர்ந்தெடுங்கள், வேலைப் பிரிவைத் தேர்ந்தெடுங்கள் மற்றும் அடிப்படைச் சுயவிவர விவரங்களைப் பகிருங்கள். உங்கள் இடம், அனுபவம், திறன்கள் மற்றும் கிடைக்கும் தன்மையின் அடிப்படையில் AsliJobs பொருத்தமான வேலை அறிவிப்புகளை நேரடியாக WhatsApp-இல் அனுப்பும்.",
          b1: "நகரத்தைத் தேர்ந்தெடுங்கள்",
          b2: "வேலைப் பிரிவைத் தேர்ந்தெடுங்கள்",
          b3: "அடிப்படைச் சுயவிவர விவரங்களைப் பகிருங்கள்",
          b4: "இடம், அனுபவம், திறன்கள் மற்றும் கிடைக்கும் தன்மையின் அடிப்படையிலான பொருத்தம்",
          b5: "WhatsApp வழியாகப் பொருத்தமான வேலை அறிவிப்புகளைப் பெறுங்கள்",
        },
        cityBasedJobAlerts: {
          title: "நகர அடிப்படையிலான வேலை அறிவிப்புகள்",
          p1: "அலுவலக ஆதரவு, விநியோகம், ஓட்டுநர், மின்சாரப் பணியாளர், குழாய் பணியாளர், வீட்டுப் பராமரிப்பு, பாதுகாப்பு, உதவியாளர், கிடங்கு ஊழியர், சில்லறை ஊழியர், தொழில்நுட்பப் பணியாளர் மற்றும் உங்கள் நகரத்தில் கிடைக்கும் பிற பணியாளர் வேலைகளுக்கான அறிவிப்புகளைப் பெறலாம்.",
          b1: "அலுவலக ஆதரவு",
          b2: "விநியோகம்",
          b3: "ஓட்டுநர்",
          b4: "மின்சாரப் பணியாளர்",
          b5: "குழாய் பணியாளர்",
          b6: "வீட்டுப் பராமரிப்பு",
          b7: "பாதுகாப்பு",
          b8: "உதவியாளர்",
          b9: "கிடங்கு ஊழியர்",
          b10: "சில்லறை ஊழியர்",
          b11: "தொழில்நுட்பப் பணியாளர்",
          b12: "பிற பணியாளர் வேலைகள்",
        },
        jobAvailability: {
          title: "வேலை கிடைக்கும் நிலை",
          p1: "AsliJobs இந்தியா முழுவதும் வேலை தேடுபவர்களுக்கும் முதலாளிகளுக்கும் சேவை செய்கிறது. வேலை கிடைக்கும் நிலை நகரம், பகுதி, வட்டாரம், வேலைப் பிரிவு மற்றும் முதலாளி காலியிடங்களைப் பொறுத்து மாறலாம்.",
        },
      },
      cta: {
        title: "தேடலைத் தொடங்குங்கள்",
        p1: "உங்கள் நகரத்தைத் தேர்ந்தெடுத்து வேலை வாய்ப்புகளை நேரடியாக WhatsApp-இல் பெறத் தொடங்குங்கள்.",
        tagline: "உங்களுக்கு அருகிலுள்ள வேலைகளைக் கண்டறியுங்கள். WhatsApp வழியாக எளிதாக விண்ணப்பியுங்கள்.",
        badge: "WhatsApp",
      },
    },
    browseByState: {
      title: "மாநிலம் வாரியாகப் பாருங்கள்",
      metaDescription:
        "AsliJobs மூலம் WhatsApp வழியாக இந்தியாவின் பல்வேறு மாநிலங்களில் நீலக் கழுத்து மற்றும் சாம்பல் கழுத்து வேலைகளைக் கண்டறியுங்கள்.",
      intro: {
        i1: "AsliJobs மூலம் இந்தியாவின் பல்வேறு மாநிலங்களில் நீலக் கழுத்து மற்றும் சாம்பல் கழுத்து வேலைகளைக் கண்டறியுங்கள். உங்கள் சொந்த மாநிலத்தில் வேலை செய்ய விரும்பினாலும் அல்லது வேறொரு மாநிலத்தில் வாய்ப்புகளைப் பார்க்க விரும்பினாலும், AsliJobs WhatsApp வழியாகப் பொருத்தமான வேலைகளைக் கண்டறிய உதவுகிறது.",
      },
      sections: {
        findJobsStateWise: {
          title: "மாநிலம் வாரியாக வேலைகளைக் கண்டறியுங்கள்",
          p1: "மாநிலம், நகரம், பகுதி, வட்டாரம் மற்றும் விருப்பப் பணி இடத்தின் அடிப்படையில் வேலைகளைத் தேட AsliJobs வேலை தேடுபவர்களுக்கு அனுமதிக்கிறது. உங்கள் இடம் மற்றும் வேலை விருப்பத்துக்குப் பொருந்தும் வாய்ப்புகளைக் கண்டறிவது எளிதாகிறது.",
        },
        howItWorks: {
          title: "இது எப்படி வேலை செய்கிறது",
          p1: "உங்கள் மாநிலத்தைத் தேர்ந்தெடுங்கள், நகரம் அல்லது வட்டாரத்தைத் தேர்ந்தெடுங்கள் மற்றும் விருப்ப வேலைப் பிரிவைப் பகிருங்கள். உங்கள் சுயவிவர விவரங்களின் அடிப்படையில் AsliJobs பொருத்தமான வேலை அறிவிப்புகளை நேரடியாக WhatsApp-இல் அனுப்பும்.",
          b1: "மாநிலத்தைத் தேர்ந்தெடுங்கள்",
          b2: "நகரம்/வட்டாரத்தைத் தேர்ந்தெடுங்கள்",
          b3: "விருப்ப வேலைப் பிரிவைத் தேர்ந்தெடுங்கள்",
          b4: "WhatsApp வழியாகப் பொருத்தமான வேலை அறிவிப்புகளைப் பெறுங்கள்",
        },
        stateBasedJobAlerts: {
          title: "மாநில அடிப்படையிலான வேலை அறிவிப்புகள்",
          p1: "அலுவலக ஆதரவு, விநியோகம், ஓட்டுநர், மின்சாரப் பணியாளர், குழாய் பணியாளர், வீட்டுப் பராமரிப்பு, பாதுகாப்பு, உதவியாளர், கிடங்கு ஊழியர், சில்லறை ஊழியர், தொழில்நுட்பப் பணியாளர் மற்றும் நீங்கள் தேர்ந்தெடுத்த மாநிலத்தில் கிடைக்கும் பிற பணியாளர் வேலைகளுக்கான அறிவிப்புகளைப் பெறலாம்.",
          b1: "அலுவலக ஆதரவு",
          b2: "விநியோகம்",
          b3: "ஓட்டுநர்",
          b4: "மின்சாரப் பணியாளர்",
          b5: "குழாய் பணியாளர்",
          b6: "வீட்டுப் பராமரிப்பு",
          b7: "பாதுகாப்பு",
          b8: "உதவியாளர்",
          b9: "கிடங்கு ஊழியர்",
          b10: "சில்லறை ஊழியர்",
          b11: "தொழில்நுட்பப் பணியாளர்",
          b12: "பிற பணியாளர் வேலைகள்",
        },
        jobAvailability: {
          title: "வேலை கிடைக்கும் நிலை",
          p1: "AsliJobs இந்தியா முழுவதும் வேலை தேடுபவர்களுக்கும் முதலாளிகளுக்கும் சேவை செய்கிறது. வேலை கிடைக்கும் நிலை மாநிலம், நகரம், வட்டாரம், வேலைப் பிரிவு மற்றும் முதலாளி காலியிடங்களைப் பொறுத்து மாறலாம்.",
        },
      },
      cta: {
        title: "தேடலைத் தொடங்குங்கள்",
        p1: "உங்கள் விருப்ப மாநிலத்தைத் தேர்ந்தெடுத்து WhatsApp-இல் பொருத்தமான வேலை வாய்ப்புகளைப் பெறத் தொடங்குங்கள்.",
        tagline: "மாநிலம் வாரியாகத் தேடுங்கள். எளிதாக விண்ணப்பியுங்கள். WhatsApp-இல் புதுப்பிப்புகளைப் பெறுங்கள்.",
        badge: "WhatsApp",
      },
    },
    jobCategories: {
      title: "வேலைப் பிரிவுகள்",
      metaDescription:
        "AsliJobs வேலை தேடுபவர்களுக்கு WhatsApp வழியாகப் பல்வேறு பிரிவுகளில் நீலக் கழுத்து மற்றும் சாம்பல் கழுத்து வேலைகளைக் கண்டறிய உதவுகிறது.",
      intro: {
        i1: "AsliJobs வேலை தேடுபவர்களுக்குப் பல்வேறு பிரிவுகளில் நீலக் கழுத்து மற்றும் சாம்பல் கழுத்து வேலைகளைக் கண்டறிய உதவுகிறது. களப்பணி, தொழில்நுட்பப் பணி, அலுவலக ஆதரவு, விநியோகம், சில்லறை அல்லது சேவை அடிப்படையிலான பாத்திரங்களைத் தேடினாலும், AsliJobs WhatsApp வழியாகப் பொருத்தமான வேலைகளைக் கண்டறிவதை எளிதாக்குகிறது.",
      },
      sections: {
        exploreJobsByCategory: {
          title: "பிரிவு வாரியாக வேலைகளைப் பாருங்கள்",
          p1: "சுயவிவரத்தை உருவாக்கும்போது உங்கள் விருப்ப வேலைப் பிரிவைத் தேர்ந்தெடுக்கலாம். உங்கள் திறன்கள், அனுபவம், இடம் மற்றும் கிடைக்கும் தன்மையின் அடிப்படையில் AsliJobs பொருத்தமான வேலை அறிவிப்புகளை நேரடியாக WhatsApp-இல் அனுப்பும்.",
        },
        popularJobCategories: {
          title: "பிரபலமான வேலைப் பிரிவுகள்",
          cards: {
            officeSupport: {
              title: "அலுவலக ஆதரவு",
              description:
                "அலுவலக உதவியாளர், நிர்வாக உதவியாளர், வரவேற்பாளர், தரவு உள்ளீட்டு ஆதரவு மற்றும் பின்புற அலுவலக ஊழியர் போன்ற வேலைகள்.",
            },
            deliveryLogistics: {
              title: "விநியோகமும் தளவாடமும்",
              description:
                "விநியோக நிர்வாகி, கூரியர் ஊழியர், தளவாட உதவியாளர் மற்றும் கள விநியோகப் பாத்திரங்கள் போன்ற வேலைகள்.",
            },
            driverJobs: {
              title: "ஓட்டுநர் வேலைகள்",
              description:
                "கார் ஓட்டுநர்கள், வணிக ஓட்டுநர்கள், தனிப்பட்ட ஓட்டுநர்கள் மற்றும் நிறுவன ஓட்டுநர்களுக்கான வேலைகள்.",
            },
            electricianJobs: {
              title: "மின்சாரப் பணியாளர் வேலைகள்",
              description:
                "மின்சாரப் பணியாளர்கள், மின் உதவியாளர்கள், வயரிங் தொழில்நுட்பப் பணியாளர்கள் மற்றும் பராமரிப்பு ஊழியர்களுக்கான வேலைகள்.",
            },
            plumbingJobs: {
              title: "குழாய் பணி வேலைகள்",
              description:
                "குழாய் பணியாளர்கள், குழாய் உதவியாளர்கள் மற்றும் பராமரிப்பு ஆதரவுப் பணியாளர்களுக்கான வேலைகள்.",
            },
            housekeepingJobs: {
              title: "வீட்டுப் பராமரிப்பு வேலைகள்",
              description:
                "வீட்டுப் பராமரிப்பு ஊழியர், சுத்தம் செய்யும் ஊழியர், வசதி ஆதரவு மற்றும் பராமரிப்புப் பணியாளர்களுக்கான வேலைகள்.",
            },
            securityJobs: {
              title: "பாதுகாப்பு வேலைகள்",
              description:
                "பாதுகாப்புக் காவலர்கள், காவல்காரர்கள், கட்டிடப் பாதுகாப்பு மற்றும் தளப் பாதுகாப்பு ஊழியர்களுக்கான வேலைகள்.",
            },
            warehouseJobs: {
              title: "கிடங்கு வேலைகள்",
              description:
                "கிடங்கு உதவியாளர்கள், பொதி செய்பவர்கள், ஏற்றுபவர்கள், இருப்பு உதவியாளர்கள் மற்றும் கடை ஆதரவு ஊழியர்களுக்கான வேலைகள்.",
            },
            retailJobs: {
              title: "சில்லறை வேலைகள்",
              description:
                "விற்பனை ஊழியர், கடை உதவியாளர், பணம் பெறுபவர், விளம்பரதாரர் மற்றும் வாடிக்கையாளர் ஆதரவுப் பாத்திரங்களுக்கான வேலைகள்.",
            },
            technicianJobs: {
              title: "தொழில்நுட்பப் பணியாளர் வேலைகள்",
              description:
                "ஏசி தொழில்நுட்பப் பணியாளர்கள், சாதனத் தொழில்நுட்பப் பணியாளர்கள், இயந்திர இயக்குபவர்கள், மெக்கானிக்குகள் மற்றும் சேவைத் தொழில்நுட்பப் பணியாளர்களுக்கான வேலைகள்.",
            },
            helperJobs: {
              title: "உதவியாளர் வேலைகள்",
              description:
                "பொது உதவியாளர்கள், தள உதவியாளர்கள், தொழிற்சாலை உதவியாளர்கள், கடை உதவியாளர்கள் மற்றும் ஆதரவுப் பணியாளர்களுக்கான வேலைகள்.",
            },
            otherWorkforceJobs: {
              title: "பிற பணியாளர் வேலைகள்",
              description:
                "முதலாளி தேவைகள் மற்றும் இடக் கிடைப்பு அடிப்படையில் பிற நீலக் கழுத்து மற்றும் சாம்பல் கழுத்து வேலைப் பாத்திரங்களும் AsliJobs-இல் இருக்கலாம்.",
            },
          },
        },
        jobsBasedOnYourLocation: {
          title: "உங்கள் இடத்தின் அடிப்படையிலான வேலைகள்",
          p1: "வேலை கிடைக்கும் நிலை உங்கள் மாநிலம், நகரம், பகுதி, வட்டாரம், வேலைப் பிரிவு மற்றும் முதலாளி காலியிடங்களைப் பொறுத்து மாறலாம். மேலும் பொருத்தமான வேலை அறிவிப்புகளைப் பெற உங்கள் விருப்ப இடத்தைத் தேர்ந்தெடுக்கலாம்.",
        },
      },
      cta: {
        title: "சரியான வேலையைத் தேடத் தொடங்குங்கள்",
        p1: "உங்கள் வேலைப் பிரிவைத் தேர்ந்தெடுத்து பொருத்தமான வேலை வாய்ப்புகளை நேரடியாக WhatsApp-இல் பெறத் தொடங்குங்கள்.",
        tagline: "உங்கள் பிரிவைத் தேர்ந்தெடுங்கள். வேலை அறிவிப்புகளைப் பெறுங்கள். WhatsApp வழியாக எளிதாக விண்ணப்பியுங்கள்.",
        badge: "WhatsApp",
      },
    },
    jobSeekerGuide: {
      title: "வேலை தேடுபவர் வழிகாட்டி",
      metaDescription:
        "இந்தியாவின் நீலக் கழுத்து மற்றும் சாம்பல் கழுத்துப் பணியாளர்களுக்கு WhatsApp வழியாக வேலைத் தேடலை AsliJobs எளிதாக்குகிறது.",
      intro: {
        i1: "இந்தியாவின் நீலக் கழுத்து மற்றும் சாம்பல் கழுத்துப் பணியாளர்களுக்கு வேலைத் தேடலை AsliJobs எளிதாக்குகிறது. AsliJobs மூலம் வேலை தேடுபவர்கள் பொருத்தமான வேலைகளைக் கண்டறிந்து, எளிதாக விண்ணப்பித்து, புதுப்பிப்புகளை நேரடியாக WhatsApp வழியாகப் பெறலாம்.",
      },
      sections: {
        startWithWhatsapp: {
          title: "WhatsApp மூலம் தொடங்குங்கள்",
          p1: "புதிய செயலியைப் பதிவிறக்க வேண்டியதில்லை. AsliJobs WhatsApp இணைப்பைக் கிளிக் செய்து, QR குறியீட்டை ஸ்கேன் செய்து அல்லது அதிகாரப்பூர்வ AsliJobs WhatsApp எண்ணுக்குச் செய்தி அனுப்பி தொடங்கலாம்.",
        },
        createYourProfile: {
          title: "உங்கள் சுயவிவரத்தை உருவாக்குங்கள்",
          p1: "பெயர், கைபேசி எண், இடம், விருப்ப மொழி, வேலைப் பிரிவு, திறன்கள், அனுபவம், எதிர்பார்க்கும் சம்பளம் மற்றும் கிடைக்கும் தன்மை போன்ற அடிப்படை விவரங்களைப் பகிருங்கள். இது AsliJobs உங்களுக்கு மேலும் பொருத்தமான வேலை வாய்ப்புகளை அனுப்ப உதவுகிறது.",
          b1: "பெயர்",
          b2: "கைபேசி எண்",
          b3: "இடம்",
          b4: "விருப்ப மொழி",
          b5: "வேலைப் பிரிவு",
          b6: "திறன்கள்",
          b7: "அனுபவம்",
          b8: "எதிர்பார்க்கும் சம்பளம்",
          b9: "கிடைக்கும் தன்மை",
        },
        chooseYourJobCategory: {
          title: "உங்கள் வேலைப் பிரிவைத் தேர்ந்தெடுங்கள்",
          p1: "நீங்கள் தேடும் வேலை வகையைத் தேர்ந்தெடுங்கள், உதாரணமாக அலுவலக ஆதரவு, விநியோகம், ஓட்டுநர், மின்சாரப் பணியாளர், வீட்டுப் பராமரிப்பு, பாதுகாப்பு, சில்லறை, கிடங்கு, தொழில்நுட்பப் பணியாளர், உதவியாளர் அல்லது கிடைக்கும் பிற பணியாளர் வேலைகள்.",
          b1: "அலுவலக ஆதரவு",
          b2: "விநியோகம்",
          b3: "ஓட்டுநர்",
          b4: "மின்சாரப் பணியாளர்",
          b5: "வீட்டுப் பராமரிப்பு",
          b6: "பாதுகாப்பு",
          b7: "சில்லறை",
          b8: "கிடங்கு",
          b9: "தொழில்நுட்பப் பணியாளர்",
          b10: "உதவியாளர்",
          b11: "கிடைக்கும் பிற பணியாளர் வேலைகள்",
        },
        selectYourLocation: {
          title: "உங்கள் இடத்தைத் தேர்ந்தெடுங்கள்",
          p1: "AsliJobs உங்களுக்கு அருகிலும் வசதியாகவும் உள்ள வேலைகளைக் காட்டும்படி உங்கள் மாநிலம், நகரம், பகுதி அல்லது வட்டாரத்தைத் தேர்ந்தெடுங்கள்.",
          b1: "மாநிலம்",
          b2: "நகரம்",
          b3: "பகுதி",
          b4: "வட்டாரம்",
        },
        receiveJobAlerts: {
          title: "வேலை அறிவிப்புகளைப் பெறுங்கள்",
          p1: "உங்கள் சுயவிவரம், இடம், வேலைப் பிரிவு மற்றும் கிடைக்கும் தன்மையின் அடிப்படையில் WhatsApp-இல் பொருத்தமான வேலை அறிவிப்புகள் வரும். சிறந்த வேலைப் பொருத்தங்களைப் பெற சுயவிவரத்தைப் புதுப்பித்து வையுங்கள்.",
        },
        applyThroughWhatsapp: {
          title: "WhatsApp வழியாக விண்ணப்பியுங்கள்",
          p1: "வேலை அறிவிப்பு வந்ததும் வேலை விவரங்களைக் கவனமாகப் படியுங்கள். ஆர்வம் இருந்தால் வேலை அறிவிப்புக்குப் பதிலளித்து அல்லது விண்ணப்பிக்கும் விருப்பத்தைத் தேர்ந்தெடுத்து நேரடியாக WhatsApp வழியாக விண்ணப்பியுங்கள்.",
        },
        trackApplicationUpdates: {
          title: "விண்ணப்பப் புதுப்பிப்புகளைக் கண்காணியுங்கள்",
          p1: "விண்ணப்பித்த பிறகு விண்ணப்பித்தது, குறுகிய பட்டியல், நேர்காணல் அட்டவணை, தேர்ந்தெடுக்கப்பட்டது அல்லது சேரும் உறுதிப்பாடு போன்ற புதுப்பிப்புகள் WhatsApp வழியாக வரலாம்.",
          b1: "விண்ணப்பித்தது",
          b2: "குறுகிய பட்டியல்",
          b3: "நேர்காணல் அட்டவணை",
          b4: "தேர்ந்தெடுக்கப்பட்டது",
          b5: "சேரும் உறுதிப்பாடு",
        },
        useYourPreferredLanguage: {
          title: "உங்கள் விருப்ப மொழியைப் பயன்படுத்துங்கள்",
          p1: "AsliJobs ஆங்கிலம், இந்தி, தெலுங்கு, தமிழ், கன்னடம் மற்றும் மலையாளத்தை ஆதரிக்கிறது. வேலை அறிவிப்புகளையும் புதுப்பிப்புகளையும் மேலும் வசதியாகப் பெற உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கலாம்.",
          b1: "ஆங்கிலம்",
          b2: "இந்தி",
          b3: "தெலுங்கு",
          b4: "தமிழ்",
          b5: "கன்னடம்",
          b6: "மலையாளம்",
        },
        staySafeWhileSearching: {
          title: "தேடும்போது பாதுகாப்பாக இருங்கள்",
          p1: "வேலை உறுதிப்பாட்டுக்குப் பணம் கொடுக்க வேண்டாம். முன்னேறுவதற்கு முன் நிறுவனப் பெயர், வேலை இடம், சம்பளம், பணி நேரம் மற்றும் நேர்காணல் விவரங்களை எப்போதும் சரிபாருங்கள். போலி வேலைகள், கட்டணக் கோரிக்கைகள் அல்லது சந்தேகத்திற்குரிய செய்திகளை உடனடியாக AsliJobs ஆதரவுக்குப் புகாரளியுங்கள்.",
          b1: "வேலை உறுதிப்பாட்டுக்குப் பணம் கொடுக்க வேண்டாம்.",
          b2: "நிறுவனப் பெயரைச் சரிபாருங்கள்.",
          b3: "வேலை இடத்தைச் சரிபாருங்கள்.",
          b4: "சம்பளத்தைச் சரிபாருங்கள்.",
          b5: "பணி நேரத்தைச் சரிபாருங்கள்.",
          b6: "நேர்காணல் விவரங்களைச் சரிபாருங்கள்.",
          b7: "போலி வேலைகளைப் புகாரளியுங்கள்.",
          b8: "கட்டணக் கோரிக்கைகளைப் புகாரளியுங்கள்.",
          b9: "சந்தேகத்திற்குரிய செய்திகளைப் புகாரளியுங்கள்.",
        },
        getSupportWhenNeeded: {
          title: "தேவைப்படும்போது ஆதரவைப் பெறுங்கள்",
          p1: "பதிவு, வேலை அறிவிப்புகள், விண்ணப்பங்கள், நேர்காணல்கள், சுயவிவரப் புதுப்பிப்புகள், மொழி ஆதரவு அல்லது புகார்களுக்கு உதவிக்கு WhatsApp, அழைப்பு அல்லது மின்னஞ்சல் வழியாக AsliJobs ஆதரவைத் தொடர்பு கொள்ளலாம்.",
          b1: "WhatsApp",
          b2: "அழைப்பு",
          b3: "மின்னஞ்சல்",
          b4: "பதிவு",
          b5: "வேலை அறிவிப்புகள்",
          b6: "விண்ணப்பங்கள்",
          b7: "நேர்காணல்கள்",
          b8: "சுயவிவரப் புதுப்பிப்புகள்",
          b9: "மொழி ஆதரவு",
          b10: "புகார்கள்",
        },
      },
      cta: {
        title: "உங்கள் வேலைத் தேடலைத் தொடங்குங்கள்",
        p1: "AsliJobs மூலம் வேலைகளைக் கண்டறிந்து விண்ணப்பிப்பது எளிது, பழக்கமானது மற்றும் சுலபம்.",
        tagline: "உங்கள் சுயவிவரத்தை உருவாக்குங்கள். வேலை அறிவிப்புகளைப் பெறுங்கள். WhatsApp வழியாக விண்ணப்பியுங்கள்.",
        badge: "WhatsApp",
      },
    },
    postAJob: {
      title: "வேலையை இடுகையிடுங்கள்",
      metaDescription: "AsliJobs மூலம் சரியான நீலக் கழுத்து மற்றும் சாம்பல் கழுத்து விண்ணப்பதாரர்களை நியமியுங்கள்.",
      intro: {
        i1: "AsliJobs மூலம் சரியான நீலக் கழுத்து மற்றும் சாம்பல் கழுத்து விண்ணப்பதாரர்களை நியமியுங்கள். அலுவலக ஆதரவு ஊழியர், விநியோக நிர்வாகிகள், ஓட்டுநர்கள், மின்சாரப் பணியாளர்கள், வீட்டுப் பராமரிப்பு ஊழியர், பாதுகாப்புக் காவலர்கள், கிடங்குப் பணியாளர்கள், சில்லறை ஊழியர், தொழில்நுட்பப் பணியாளர்கள் அல்லது உதவியாளர்கள் தேவைப்பட்டாலும், AsliJobs பொருத்தமான வேலை தேடுபவர்களை எளிதாகச் சென்றடைய உதவுகிறது.",
      },
      sections: {
        postJobsEasily: {
          title: "வேலைகளை எளிதாக இடுகையிடுங்கள்",
          p1: "வேலைத் தலைப்பு, இடம், சம்பளம், பணி நேரம், காலியிட எண்ணிக்கை, தேவையான அனுபவம், தேவையான திறன்கள், பலன்கள் மற்றும் நேர்காணல் விவரங்கள் போன்ற முக்கிய விவரங்களைப் பகிர்ந்து முதலாளிகள் AsliJobs-இல் வேலைகளை இடுகையிடலாம்.",
          b1: "வேலைத் தலைப்பு",
          b2: "இடம்",
          b3: "சம்பளம்",
          b4: "பணி நேரம்",
          b5: "காலியிட எண்ணிக்கை",
          b6: "தேவையான அனுபவம்",
          b7: "தேவையான திறன்கள்",
          b8: "பலன்கள்",
          b9: "நேர்காணல் விவரங்கள்",
        },
        reachSuitableCandidates: {
          title: "பொருத்தமான விண்ணப்பதாரர்களைச் சென்றடையுங்கள்",
          p1: "உங்கள் வேலை இடுகையிடப்பட்ட பிறகு, இடம், வேலைப் பிரிவு, அனுபவம், மொழி விருப்பம் மற்றும் கிடைக்கும் தன்மையின் அடிப்படையில் தொடர்புடைய வேலை தேடுபவர்களுடன் வாய்ப்பைப் பகிர AsliJobs உதவுகிறது.",
        },
        manageApplications: {
          title: "விண்ணப்பங்களை நிர்வகியுங்கள்",
          p1: "முதலாளிகள் முதலாளி டாஷ்போர்டு வழியாக அல்லது AsliJobs குழுவின் ஆதரவுடன் விண்ணப்பங்களைப் பார்க்கலாம், விண்ணப்பதாரர்களைக் குறுகிய பட்டியலிடலாம், நேர்காணல்களை அட்டவணைப்படுத்தலாம் மற்றும் நியமன முன்னேற்றத்தைக் கண்காணிக்கலாம்.",
        },
        promoteYourJob: {
          title: "உங்கள் வேலையை விளம்பரப்படுத்துங்கள்",
          p1: "தெரிவுநிலையை அதிகரித்து மேலும் பொருத்தமான விண்ணப்பதாரர்களைச் சென்றடைய முதலாளிகள் விளம்பரப்படுத்தப்பட்ட வேலைகள் அல்லது பிரச்சார விளம்பரங்களைத் தேர்ந்தெடுக்கலாம்.",
        },
      },
      cta: {
        title: "AsliJobs மூலம் நியமனத்தைத் தொடங்குங்கள்",
        p1: "AsliJobs-இல் உங்கள் வேலையை இடுகையிட்டு வேலை செய்யத் தயாராக உள்ள விண்ணப்பதாரர்களுடன் இணையுங்கள்.",
        tagline: "வேலையை இடுகையிடுங்கள். பொருத்தமான விண்ணப்பதாரர்களைச் சென்றடையுங்கள். விரைவாக நியமியுங்கள்.",
        badge: "முதலாளிகளுக்காக",
      },
    },
    employerLogin: {
      title: "முதலாளி உள்நுழைவு",
      metaDescription:
        "வேலை இடுகைகள், விண்ணப்பங்கள், விண்ணப்பதாரர்கள், நேர்காணல்கள், நியமனத் திட்டங்கள் மற்றும் விளம்பரங்களை நிர்வகிக்க உங்கள் AsliJobs முதலாளி டாஷ்போர்டை அணுகுங்கள்.",
      intro: {
        i1: "வேலை இடுகைகள், விண்ணப்பங்கள், விண்ணப்பதாரர்கள், நேர்காணல்கள், நியமனத் திட்டங்கள் மற்றும் விளம்பரங்களை ஒரே இடத்தில் நிர்வகிக்க உங்கள் AsliJobs முதலாளி டாஷ்போர்டை அணுகுங்கள்.",
      },
      sections: {
        loginToYourEmployerDashboard: {
          title: "உங்கள் முதலாளி டாஷ்போர்டில் உள்நுழையுங்கள்",
          p1: "முதலாளிகள் தங்கள் பதிவு செய்யப்பட்ட கைபேசி எண், மின்னஞ்சல் முகவரி அல்லது AsliJobs வழங்கும் உள்நுழைவு விருப்பத்தைப் பயன்படுத்தி உள்நுழையலாம்.",
        },
        manageJobPosts: {
          title: "வேலை இடுகைகளை நிர்வகியுங்கள்",
          p1: "உள்நுழைந்த பிறகு முதலாளிகள் புதிய வேலைகளை இடுகையிடலாம், வேலை விவரங்களைத் திருத்தலாம், காலியிடங்களைப் புதுப்பிக்கலாம், வேலைகளை இடைநிறுத்தலாம், நிரம்பிய பதவிகளை மூடலாம் மற்றும் செயலில் உள்ள வேலை இடுகைகளைக் கண்காணிக்கலாம்.",
        },
        viewApplications: {
          title: "விண்ணப்பங்களைப் பாருங்கள்",
          p1: "முதலாளிகள் தங்கள் வேலை இடுகைகளுக்கு வந்த விண்ணப்பங்களைப் பார்க்கலாம், விண்ணப்பதாரர் விவரங்களைச் சரிபார்க்கலாம் மற்றும் நியமனத் தேவைகளின் அடிப்படையில் பொருத்தமான சுயவிவரங்களைக் குறுகிய பட்டியலிடலாம்.",
        },
        scheduleInterviews: {
          title: "நேர்காணல்களை அட்டவணைப்படுத்துங்கள்",
          p1: "முதலாளிகள் நேர்காணல் தேதி, நேரம், இடம் மற்றும் தொடர்பு நபர் விவரங்களைச் சேர்த்து நேர்காணல்களை அட்டவணைப்படுத்தலாம். விண்ணப்பதாரர்கள் WhatsApp வழியாக நேர்காணல் புதுப்பிப்புகளைப் பெறலாம்.",
        },
        trackHiringProgress: {
          title: "நியமன முன்னேற்றத்தைக் கண்காணியுங்கள்",
          p1: "முதலாளி டாஷ்போர்டு விண்ணப்ப நிலை, குறுகிய பட்டியல் விண்ணப்பதாரர்கள், அட்டவணைப்படுத்தப்பட்ட நேர்காணல்கள், தேர்ந்தெடுக்கப்பட்ட விண்ணப்பதாரர்கள் மற்றும் மூடப்பட்ட வேலை இடுகைகளைக் கண்காணிக்க உதவுகிறது.",
        },
        managePlansAndPromotions: {
          title: "திட்டங்களையும் விளம்பரங்களையும் நிர்வகியுங்கள்",
          p1: "முதலாளிகள் டாஷ்போர்டு வழியாக நியமனத் திட்டங்கள், விளம்பரப்படுத்தப்பட்ட வேலைகள், பிரச்சார விளம்பரங்கள், கட்டணங்கள், விலைப்பட்டியல்கள் மற்றும் புதுப்பிப்பு விவரங்களைப் பார்க்கலாம்.",
        },
        needLoginHelp: {
          title: "உள்நுழைவு உதவி வேண்டுமா?",
          p1: "உங்களால் உள்நுழைய முடியவில்லை அல்லது முதலாளி டாஷ்போர்டை அணுக முடியவில்லை என்றால், WhatsApp, அழைப்பு அல்லது மின்னஞ்சல் வழியாக AsliJobs ஆதரவைத் தொடர்பு கொள்ளுங்கள்.",
          b1: "WhatsApp",
          b2: "அழைப்பு",
          b3: "மின்னஞ்சல்",
        },
      },
      cta: {
        title: "முதலாளி உள்நுழைவு",
        tagline: "உள்நுழையுங்கள். வேலைகளை நிர்வகியுங்கள். AsliJobs மூலம் விரைவாக நியமியுங்கள்.",
        badge: "முதலாளிகளுக்காக",
      },
    },
    pricingPlans: {
      title: "விலைத் திட்டங்கள்",
      metaDescription:
        "உங்கள் வணிகத்திற்குச் சரியான நியமனத் திட்டத்தைத் தேர்ந்தெடுத்து AsliJobs மூலம் பொருத்தமான நீலக் கழுத்து மற்றும் சாம்பல் கழுத்து விண்ணப்பதாரர்களுடன் இணையுங்கள்.",
      intro: {
        i1: "உங்கள் வணிகத்திற்குச் சரியான நியமனத் திட்டத்தைத் தேர்ந்தெடுத்து AsliJobs மூலம் பொருத்தமான நீலக் கழுத்து மற்றும் சாம்பல் கழுத்து விண்ணப்பதாரர்களுடன் இணையுங்கள்.",
        i2: "வேலைகளை இடுகையிட, விண்ணப்பங்களைப் பெற, காலியிடங்களை விளம்பரப்படுத்த மற்றும் நியமனத்தை மேலும் திறம்பட நிர்வகிக்க விரும்பும் முதலாளிகளுக்கு AsliJobs கட்டண நியமனத் திட்டங்களை வழங்குகிறது.",
      },
      sections: {
        simplePlansForEveryHiringNeed: {
          title: "ஒவ்வொரு நியமனத் தேவைக்கும் எளிய திட்டங்கள்",
          p1: "ஒரு பாத்திரத்திற்கு நியமித்தாலும் அல்லது பல காலியிடங்களுக்கு நியமித்தாலும், இடம், வேலைப் பிரிவு, அனுபவம், மொழி விருப்பம் மற்றும் கிடைக்கும் தன்மையின் அடிப்படையில் வேலை தேடுபவர்களைச் சென்றடைய AsliJobs உதவுகிறது.",
        },
        employerHiringPlans: {
          title: "முதலாளி நியமனத் திட்டங்கள்",
          cards: {
            basicHiringPlan: {
              title: "அடிப்படை நியமனத் திட்டம்",
              description:
                "யாருக்குச் சிறந்தது: குறைந்த நியமனத் தேவைகள் உள்ள முதலாளிகள். உள்ளடக்கம்: வேலை இடுகை, விண்ணப்பதாரர் விண்ணப்பங்கள் மற்றும் அடிப்படை டாஷ்போர்டு அணுகல்.",
            },
            standardHiringPlan: {
              title: "நிலையான நியமனத் திட்டம்",
              description:
                "யாருக்குச் சிறந்தது: தொடர்ந்து நியமிக்கும் முதலாளிகள். உள்ளடக்கம்: பல வேலை இடுகைகள், அதிக விண்ணப்பதாரர் சென்றடைதல், விண்ணப்பக் கண்காணிப்பு மற்றும் ஆதரவு.",
            },
            premiumHiringPlan: {
              title: "பிரீமியம் நியமனத் திட்டம்",
              description:
                "யாருக்குச் சிறந்தது: விரைவான நியமனம் தேவைப்படும் முதலாளிகள். உள்ளடக்கம்: அதிக தெரிவுநிலை, விளம்பரப்படுத்தப்பட்ட வேலை விருப்பங்கள், முன்னுரிமை ஆதரவு மற்றும் சிறந்த விண்ணப்பதாரர் சென்றடைதல்.",
            },
            campaignHiringPlan: {
              title: "பிரச்சார நியமனத் திட்டம்",
              description:
                "யாருக்குச் சிறந்தது: மொத்த அல்லது அவசர நியமனத் தேவைகள் உள்ள முதலாளிகள். உள்ளடக்கம்: இலக்கு நியமனப் பிரச்சாரங்கள், இட அடிப்படையிலான சென்றடைதல், WhatsApp வேலை அறிவிப்புகள் மற்றும் நியமன ஆதரவு.",
            },
          },
        },
        whatEmployersCanDo: {
          title: "முதலாளிகள் என்ன செய்யலாம்",
          b1: "வேலைகளை இடுகையிடுங்கள்",
          b2: "விண்ணப்பதாரர் விண்ணப்பங்களைப் பெறுங்கள்",
          b3: "விண்ணப்பதாரர் விவரங்களைப் பாருங்கள்",
          b4: "பொருத்தமான சுயவிவரங்களைக் குறுகிய பட்டியலிடுங்கள்",
          b5: "நேர்காணல்களை அட்டவணைப்படுத்துங்கள்",
          b6: "நியமன முன்னேற்றத்தைக் கண்காணியுங்கள்",
          b7: "வேலைக் காலியிடங்களை விளம்பரப்படுத்துங்கள்",
          b8: "நியமனம் தொடர்பான கேள்விகளுக்கு ஆதரவு பெறுங்கள்",
        },
        promotedJobs: {
          title: "விளம்பரப்படுத்தப்பட்ட வேலைகள்",
          p1: "முக்கிய அல்லது அவசர காலியிடங்களின் தெரிவுநிலையை அதிகரிக்க விளம்பரப்படுத்தப்பட்ட வேலைகள் முதலாளிகளுக்கு உதவுகின்றன. இந்த வேலைகள் இடம், வேலைப் பாத்திரம் மற்றும் விண்ணப்பதாரர் சுயவிவரத்தின் அடிப்படையில் மேலும் பொருத்தமான வேலை தேடுபவர்களைச் சென்றடையலாம்.",
        },
        campaignPromotions: {
          title: "பிரச்சார விளம்பரங்கள்",
          p1: "மொத்தமாக நியமிக்க விரும்பும், குறிப்பிட்ட இடங்களை இலக்காகக் கொள்ள விரும்பும் அல்லது தேர்ந்தெடுத்த வேலைப் பிரிவுகளில் உள்ள வேலை தேடுபவர்களைச் சென்றடைய விரும்பும் முதலாளிகளுக்குப் பிரச்சார விளம்பரங்கள் பயனுள்ளவை.",
        },
        paymentsAndInvoices: {
          title: "கட்டணங்களும் விலைப்பட்டியல்களும்",
          p1: "முதலாளிகள் பொருத்தமான திட்டத்தைத் தேர்ந்தெடுத்து கிடைக்கும் கட்டண விருப்பங்கள் வழியாகக் கட்டணத்தை நிறைவு செய்யலாம். கட்டணத்திற்குப் பிறகு AsliJobs ஆதரவு வழியாக விலைப்பட்டியல்களைக் கோரலாம்.",
        },
        needHelpChoosingAPlan: {
          title: "திட்டம் தேர்ந்தெடுக்க உதவி வேண்டுமா?",
          p1: "உங்கள் நியமனத் தேவைக்கு எந்தத் திட்டம் சரியானது என்று தெரியவில்லை என்றால் AsliJobs ஆதரவைத் தொடர்பு கொள்ளுங்கள். உங்கள் வேலைப் பாத்திரம், இடம், காலியிட எண்ணிக்கை மற்றும் நியமன அவசரத்தின் அடிப்படையில் பொருத்தமான திட்டத்தைத் தேர்ந்தெடுக்க எங்கள் குழு உதவும்.",
        },
      },
      cta: {
        title: "AsliJobs மூலம் நியமனத்தைத் தொடங்குங்கள்",
        tagline: "ஒரு திட்டத்தைத் தேர்ந்தெடுங்கள். உங்கள் வேலையை இடுகையிடுங்கள். AsliJobs மூலம் நியமனத்தைத் தொடங்குங்கள்.",
        badge: "முதலாளிகளுக்காக",
      },
    },
    employerGuide: {
      title: "முதலாளி வழிகாட்டி",
      metaDescription:
        "எளிய, WhatsApp-நட்பு நியமனச் செயல்முறை மூலம் பொருத்தமான நீலக் கழுத்து மற்றும் சாம்பல் கழுத்து விண்ணப்பதாரர்களை நியமிக்க AsliJobs முதலாளிகளுக்கு உதவுகிறது.",
      intro: {
        i1: "எளிய, WhatsApp-நட்பு நியமனச் செயல்முறை மூலம் பொருத்தமான நீலக் கழுத்து மற்றும் சாம்பல் கழுத்து விண்ணப்பதாரர்களை நியமிக்க AsliJobs முதலாளிகளுக்கு உதவுகிறது. ஒரு பாத்திரத்திற்கு நியமித்தாலும் அல்லது பல காலியிடங்களுக்கு நியமித்தாலும், இடம், வேலைப் பிரிவு, அனுபவம், திறன்கள், மொழி விருப்பம் மற்றும் கிடைக்கும் தன்மையின் அடிப்படையில் வேலை தேடுபவர்களைச் சென்றடைய AsliJobs உதவுகிறது.",
      },
      sections: {
        registerAsAnEmployer: {
          title: "முதலாளியாகப் பதிவு செய்யுங்கள்",
          p1: "AsliJobs-இல் உங்கள் முதலாளி சுயவிவரத்தை உருவாக்கி தொடங்குங்கள். முதலாளி பெயர், நிறுவனப் பெயர், தொடர்பு நபர் விவரங்கள், கைபேசி எண், இடம், வணிக வகை, நியமனப் பிரிவுகள் மற்றும் விருப்ப மொழி போன்ற அடிப்படை விவரங்களைப் பகிருங்கள்.",
          b1: "முதலாளி பெயர்",
          b2: "நிறுவனப் பெயர்",
          b3: "தொடர்பு நபர் விவரங்கள்",
          b4: "கைபேசி எண்",
          b5: "இடம்",
          b6: "வணிக வகை",
          b7: "நியமனப் பிரிவுகள்",
          b8: "விருப்ப மொழி",
        },
        postAJob: {
          title: "வேலையை இடுகையிடுங்கள்",
          p1: "வேலைத் தலைப்பு, சம்பள வரம்பு, பணி இடம், நேரம், காலியிட எண்ணிக்கை, தேவையான அனுபவம், தேவையான திறன்கள், பலன்கள் மற்றும் நேர்காணல் விவரங்கள் போன்ற தெளிவான விவரங்களைச் சேர்த்து உங்கள் வேலையை இடுகையிடுங்கள். தெளிவான வேலை விவரங்கள் வேலை தேடுபவர்கள் வாய்ப்பை நன்றாகப் புரிந்து நம்பிக்கையுடன் விண்ணப்பிக்க உதவுகின்றன.",
        },
        receiveApplications: {
          title: "விண்ணப்பங்களைப் பெறுங்கள்",
          p1: "உங்கள் வேலை இடுகையிடப்பட்ட பிறகு பொருத்தமான வேலை தேடுபவர்கள் வேலையைப் பார்த்து விண்ணப்பிக்கலாம். விண்ணப்பங்களை முதலாளி டாஷ்போர்டு வழியாக அல்லது AsliJobs குழுவின் ஆதரவுடன் நிர்வகிக்கலாம்.",
        },
        shortlistCandidates: {
          title: "விண்ணப்பதாரர்களைக் குறுகிய பட்டியலிடுங்கள்",
          p1: "பெயர், இடம், அனுபவம், திறன்கள், எதிர்பார்க்கும் சம்பளம், கிடைக்கும் தன்மை மற்றும் விருப்ப மொழி போன்ற விண்ணப்பதாரர் விவரங்களை மதிப்பாய்வு செய்யுங்கள். உங்கள் நியமனத் தேவைகளுக்குப் பொருந்தும் விண்ணப்பதாரர்களைக் குறுகிய பட்டியலிடுங்கள்.",
        },
        scheduleInterviews: {
          title: "நேர்காணல்களை அட்டவணைப்படுத்துங்கள்",
          p1: "குறுகிய பட்டியலுக்குப் பிறகு நேர்காணல் தேதி, நேரம், இடம் மற்றும் தொடர்பு நபர் விவரங்களைப் பகிர்ந்து நேர்காணல்களை அட்டவணைப்படுத்துங்கள். விண்ணப்பதாரர்கள் WhatsApp வழியாக நேர்காணல் புதுப்பிப்புகளைப் பெறலாம்.",
        },
        trackHiringProgress: {
          title: "நியமன முன்னேற்றத்தைக் கண்காணியுங்கள்",
          p1: "விண்ணப்பங்கள், குறுகிய பட்டியல் விண்ணப்பதாரர்கள், அட்டவணைப்படுத்தப்பட்ட நேர்காணல்கள், தேர்ந்தெடுக்கப்பட்ட விண்ணப்பதாரர்கள் மற்றும் மூடப்பட்ட வேலை இடுகைகளைக் கண்காணிக்க முதலாளி டாஷ்போர்டைப் பயன்படுத்துங்கள்.",
        },
        promoteJobOpenings: {
          title: "வேலைக் காலியிடங்களை விளம்பரப்படுத்துங்கள்",
          p1: "வேலைத் தெரிவுநிலையை மேம்படுத்தி மேலும் பொருத்தமான விண்ணப்பதாரர்களை விரைவாகச் சென்றடைய முதலாளிகள் விளம்பரப்படுத்தப்பட்ட வேலைகள் அல்லது பிரச்சார விளம்பரங்களைத் தேர்ந்தெடுக்கலாம்.",
        },
        updateOrCloseJobPosts: {
          title: "வேலை இடுகைகளைப் புதுப்பிக்கவும் அல்லது மூடவும்",
          p1: "உங்கள் வேலை இடுகைகளைப் புதுப்பித்து வையுங்கள். ஒரு பதவி நிரம்பியிருந்தால், இடைநிறுத்தப்பட்டிருந்தால், ரத்து செய்யப்பட்டிருந்தால் அல்லது இனி கிடைக்கவில்லை என்றால், டாஷ்போர்டு வழியாக அல்லது AsliJobs ஆதரவைத் தொடர்பு கொண்டு வேலை இடுகையைப் புதுப்பிக்கவும் அல்லது மூடவும்.",
        },
        getEmployerSupport: {
          title: "முதலாளி ஆதரவைப் பெறுங்கள்",
          p1: "வேலை இடுகை, விண்ணப்பங்கள், விண்ணப்பதாரர் குறுகிய பட்டியல், நேர்காணல்கள், கட்டணங்கள், விலைப்பட்டியல்கள், விளம்பரங்கள் அல்லது டாஷ்போர்டு ஆதரவுக்கு WhatsApp, அழைப்பு அல்லது மின்னஞ்சல் வழியாக முதலாளிகள் AsliJobs ஆதரவைத் தொடர்பு கொள்ளலாம்.",
          b1: "WhatsApp",
          b2: "அழைப்பு",
          b3: "மின்னஞ்சல்",
          b4: "வேலை இடுகை",
          b5: "விண்ணப்பங்கள்",
          b6: "விண்ணப்பதாரர் குறுகிய பட்டியல்",
          b7: "நேர்காணல்கள்",
          b8: "கட்டணங்கள்",
          b9: "விலைப்பட்டியல்கள்",
          b10: "விளம்பரங்கள்",
          b11: "டாஷ்போர்டு ஆதரவு",
        },
        hiringTipsForEmployers: {
          title: "முதலாளிகளுக்கான நியமனக் குறிப்புகள்",
          b1: "முழுமையான தெளிவான வேலை விவரங்களைச் சேருங்கள்.",
          b2: "சரியான சம்பளம், இடம் மற்றும் பணி நேரத்தைக் குறிப்பிடுங்கள்.",
          b3: "விண்ணப்பங்களுக்கு நேரத்தில் பதிலளியுங்கள்.",
          b4: "நேர்காணல் விவரங்களைத் தெளிவாகப் பகிருங்கள்.",
          b5: "தேவையற்ற விண்ணப்பங்களைத் தவிர்க்க நிரம்பிய வேலைகளை மூடுங்கள்.",
          b6: "அவசர அல்லது மொத்த நியமனத் தேவைகளுக்கு விளம்பரங்களைப் பயன்படுத்துங்கள்.",
        },
      },
      cta: {
        title: "AsliJobs மூலம் நியமனத்தைத் தொடங்குங்கள்",
        p1: "எளிய பழக்கமான தளம் மூலம் முதலாளிகளைப் பொருத்தமான பணியாளர் விண்ணப்பதாரர்களுடன் இணைத்து AsliJobs நியமனத்தை எளிதாக்குகிறது.",
        tagline: "உங்கள் முதலாளி சுயவிவரத்தை உருவாக்குங்கள். வேலையை இடுகையிடுங்கள். AsliJobs மூலம் விரைவாக நியமியுங்கள்.",
        badge: "முதலாளிகளுக்காக",
      },
    },
    interviewTips: {
      title: "நேர்காணல் குறிப்புகள்",
      metaDescription:
        "வேலை தேடுபவர்கள் நன்றாகத் தயாராகி, நம்பிக்கையுடன் நேர்காணலில் கலந்துகொண்டு, தேர்வு பெற உதவும் எளிய நேர்காணல் குறிப்புகள்.",
      intro: {
        i1: "சிறிது தயாரிப்பு உங்களுக்கு நேர்காணலில் நம்பிக்கையைத் தரும், நல்ல அபிப்பிராயத்தை ஏற்படுத்தவும் உதவும். நேர்காணலுக்கு முன்பு, நேர்காணலின் போது மற்றும் பிறகு இந்த எளிய குறிப்புகளைப் பின்பற்றுங்கள்.",
      },
      sections: {
        prepareBeforeTheInterview: {
          title: "நேர்காணலுக்கு முன் தயாராகுங்கள்",
          p1: "வேலைப் பொறுப்பு, சம்பளம், பணியிடம் மற்றும் நேரம் உள்ளிட்ட வேலை விவரங்களை மீண்டும் படியுங்கள். உங்கள் திறன்களும் அனுபவமும் இந்த வேலைக்கு எப்படிப் பொருந்துகின்றன என்று யோசியுங்கள்.",
        },
        documentsToCarry: {
          title: "எடுத்துச் செல்ல வேண்டிய ஆவணங்கள்",
          p1: "நேர்காணல் நாளில் அவசரப்படாமல் இருக்க, உங்கள் ஆவணங்களை ஒரு நாள் முன்பே தயாராக வைத்துக்கொள்ளுங்கள்.",
          b1: "ஆதார் அட்டை போன்ற அடையாளச் சான்று",
          b2: "ரெஸ்யூம் அல்லது சுயவிவர விவரங்கள்",
          b3: "அனுபவம் அல்லது சம்பளச் சான்றிதழ்கள், இருந்தால்",
          b4: "கல்விச் சான்றிதழ்கள், தேவைப்பட்டால்",
          b5: "பாஸ்போர்ட் அளவு புகைப்படங்கள்",
        },
        onTheInterviewDay: {
          title: "நேர்காணல் நாளில்",
          p1: "உங்கள் பயணத்தைத் திட்டமிட்டு, நேர்காணல் இடத்திற்கு 10 முதல் 15 நிமிடங்கள் முன்னதாகச் செல்லுங்கள். சுத்தமான, நேர்த்தியான உடைகளை அணிந்து, உங்கள் போனை சைலண்டில் வையுங்கள்.",
          b1: "சரியான நேரத்தில் செல்லுங்கள்",
          b2: "நேர்த்தியாக உடை அணியுங்கள்",
          b3: "பணிவாக வணக்கம் சொல்லுங்கள்",
          b4: "போனை சைலண்டில் வையுங்கள்",
        },
        answerWithConfidence: {
          title: "நம்பிக்கையுடன் பதிலளியுங்கள்",
          p1: "கவனமாகக் கேளுங்கள், நேர்மையாகப் பதிலளியுங்கள், தெளிவாகப் பேசுங்கள். இது போன்ற பொதுவான கேள்விகளுக்குத் தயாராக இருங்கள்.",
          b1: "உங்களைப் பற்றிச் சொல்லுங்கள்.",
          b2: "இதற்கு முன் என்ன வேலை செய்தீர்கள்?",
          b3: "எப்போது வேலையில் சேர முடியும்?",
          b4: "எவ்வளவு சம்பளம் எதிர்பார்க்கிறீர்கள்?",
        },
        afterTheInterview: {
          title: "நேர்காணலுக்குப் பிறகு",
          p1: "புறப்படும் முன் நேர்காணல் செய்தவருக்கு நன்றி சொல்லுங்கள். நேர்காணல் முடிவுகளும் அடுத்த படிகளும் WhatsApp-இல் அனுப்பப்படும், எனவே உங்கள் செய்திகளைச் சரிபார்த்து, சரியான நேரத்தில் பதிலளியுங்கள்.",
        },
        staySafe: {
          title: "பாதுகாப்பாக இருங்கள்",
          p1: "உண்மையான முதலாளிகள் நேர்காணலை ஏற்பாடு செய்யவோ வேலையை உறுதிப்படுத்தவோ பணம் கேட்பதில்லை. யாராவது பணம் கேட்டால், செலுத்தாதீர்கள், உடனடியாக AsliJobs ஆதரவுக்குப் புகாரளியுங்கள்.",
          b1: "நேர்காணல் அல்லது வேலை உறுதிப்படுத்தலுக்குப் பணம் செலுத்தாதீர்கள்.",
          b2: "வேலை விவரங்களில் கொடுக்கப்பட்ட முகவரியில் மட்டுமே நேர்காணலில் கலந்துகொள்ளுங்கள்.",
          b3: "சந்தேகமான கோரிக்கைகளை AsliJobs ஆதரவுக்குப் புகாரளியுங்கள்.",
        },
      },
      cta: {
        title: "WhatsApp-இல் நேர்காணல் அப்டேட்களைப் பெறுங்கள்",
        p1: "பொருத்தமான வேலைகளுக்கு விண்ணப்பித்து, நேர்காணல் விவரங்களை நேரடியாக WhatsApp-இல் பெறுங்கள்.",
        tagline: "நன்றாகத் தயாராகுங்கள். சரியான நேரத்தில் செல்லுங்கள். தேர்வு பெறுங்கள்.",
        badge: "WhatsApp",
      },
    },
    salaryGuide: {
      title: "சம்பள வழிகாட்டி",
      metaDescription:
        "வேலையை ஏற்கும் முன், வேலை வாய்ப்பில் உள்ள சம்பள விவரங்களைப் புரிந்துகொள்ளுங்கள் — கைக்கு வரும் சம்பளம், பிடித்தங்கள், கூடுதல் ஊதியம் மற்றும் சம்பளம் வழங்கும் அட்டவணை.",
      intro: {
        i1: "எந்த வேலையிலும் சம்பளம் மிக முக்கியமான பகுதி. வேலை அறிவிப்பு அல்லது வாய்ப்பில் உள்ள சம்பள விவரங்களைப் புரிந்துகொண்டு சரியான முடிவை எடுக்க இந்த வழிகாட்டி உதவுகிறது.",
      },
      sections: {
        checkTheSalaryInJobDetails: {
          title: "வேலை விவரங்களில் சம்பளத்தைச் சரிபாருங்கள்",
          p1: "AsliJobs-இல் உள்ள ஒவ்வொரு வேலையிலும் முதலாளி வழங்கும் சம்பளம் காட்டப்படுகிறது. விண்ணப்பிக்கும் முன், வேலைப் பொறுப்பு, பணி நேரம் மற்றும் இடத்துடன் அதைக் கவனமாகப் படியுங்கள்.",
        },
        inHandSalaryAndDeductions: {
          title: "கைக்கு வரும் சம்பளம் மற்றும் பிடித்தங்கள்",
          p1: "பிடித்தங்களுக்குப் பிறகு உங்களுக்குக் கிடைக்கும் தொகையே கைக்கு வரும் சம்பளம். காட்டப்பட்ட சம்பளம் கைக்கு வரும் சம்பளமா அல்லது PF அல்லது ESI போன்ற பிடித்தங்களுக்கு முந்தையதா என்று முதலாளியிடம் கேளுங்கள்.",
          b1: "கைக்கு வரும் (டேக்-ஹோம்) சம்பளம்",
          b2: "PF (வருங்கால வைப்பு நிதி)",
          b3: "ESI (தொழிலாளர் அரசு காப்பீடு)",
          b4: "பிற பிடித்தங்கள், ஏதேனும் இருந்தால்",
        },
        extraPayAndBenefits: {
          title: "கூடுதல் ஊதியம் மற்றும் சலுகைகள்",
          p1: "சில வேலைகளில் சம்பளத்துடன் கூடுதல் ஊதியம் அல்லது சலுகைகள் வழங்கப்படும். அதில் என்னென்ன அடங்கும் என்று தெளிவாகக் கேளுங்கள்.",
          b1: "ஓவர்டைம் ஊதியம்",
          b2: "ஊக்கத்தொகை",
          b3: "உணவு அல்லது தங்குமிடம்",
          b4: "பயணப்படி",
          b5: "வார விடுமுறை மற்றும் சம்பளத்துடன் கூடிய விடுப்பு",
        },
        salaryPaymentSchedule: {
          title: "சம்பளம் வழங்கும் அட்டவணை",
          p1: "சம்பளம் எப்போது, எப்படி வழங்கப்படும் என்பதை உறுதிப்படுத்துங்கள் — மாதந்தோறும், வாரந்தோறும் அல்லது தினசரி, வங்கிப் பரிமாற்றம் மூலமா அல்லது ரொக்கமாகவா. உங்கள் சம்பளப் பதிவுகளை வைத்துக்கொள்ளுங்கள்.",
        },
        whatAffectsYourSalary: {
          title: "உங்கள் சம்பளத்தைப் பாதிப்பவை",
          p1: "இந்தக் காரணிகளைப் பொறுத்து சம்பளம் மாறலாம். உங்கள் திறன்களை மேம்படுத்தி, சுயவிவரத்தைப் புதுப்பித்து வைத்தால் சிறந்த சம்பளம் உள்ள வேலைகள் கிடைக்கலாம்.",
          b1: "அனுபவம்",
          b2: "திறன்கள்",
          b3: "வேலை வகை",
          b4: "நகரம் மற்றும் இடம்",
          b5: "ஷிஃப்ட் மற்றும் பணி நேரம்",
        },
        salarySafety: {
          title: "சம்பளப் பாதுகாப்பு",
          p1: "வேலை அல்லது அதிக சம்பளத்திற்காக ஒருபோதும் பணம் செலுத்தாதீர்கள். குறைந்த வேலைக்கு மிக அதிக சம்பளம் தருவதாகச் சொல்லும் வாய்ப்புகளில் கவனமாக இருந்து, அவற்றை AsliJobs ஆதரவுக்குப் புகாரளியுங்கள்.",
          b1: "வேலைக்காக ஒருபோதும் பணம் செலுத்தாதீர்கள்.",
          b2: "நம்ப முடியாத சம்பள வாக்குறுதிகளில் கவனமாக இருங்கள்.",
          b3: "சந்தேகமான வாய்ப்புகளை AsliJobs ஆதரவுக்குப் புகாரளியுங்கள்.",
        },
      },
      cta: {
        title: "தெளிவான சம்பள விவரங்களுடன் வேலைகளைக் கண்டறியுங்கள்",
        p1: "சம்பளம், இடம் மற்றும் நேரத்துடன் கூடிய வேலை அறிவிப்புகளை நேரடியாக WhatsApp-இல் பெறுங்கள்.",
        tagline: "உங்கள் சம்பளத்தை அறியுங்கள். சரியான வேலையைத் தேர்ந்தெடுங்கள்.",
        badge: "WhatsApp",
      },
    },
    careerAdvice: {
      title: "தொழில் ஆலோசனை",
      metaDescription:
        "வேலை தேடுபவர்கள் தங்கள் திறன்களை வளர்த்து, சிறந்த வேலைகளைப் பெற்று, நிலையான தொழில் வாழ்க்கையை உருவாக்க உதவும் நடைமுறை ஆலோசனைகள்.",
      intro: {
        i1: "ஒவ்வொரு வேலையும் உங்கள் தொழில் வாழ்க்கையில் ஒரு படி. இந்த நடைமுறைக் குறிப்புகள் உங்கள் திறன்களை வளர்க்கவும், சிறந்த வாய்ப்புகளைப் பெறவும், நிலையான எதிர்காலத்தை உருவாக்கவும் உதவும்.",
      },
      sections: {
        keepYourProfileUpdated: {
          title: "உங்கள் சுயவிவரத்தைப் புதுப்பித்து வையுங்கள்",
          p1: "உங்கள் திறன்கள், அனுபவம், விருப்பமான இடம் மற்றும் எதிர்பார்க்கும் சம்பளம் மாறும்போதெல்லாம் அவற்றைப் புதுப்பியுங்கள். புதுப்பிக்கப்பட்ட சுயவிவரம் AsliJobs உங்களுக்குச் சிறந்த வேலைகளை அனுப்ப உதவும்.",
        },
        learnNewSkills: {
          title: "புதிய திறன்களைக் கற்றுக்கொள்ளுங்கள்",
          p1: "புதிய திறன்கள் சிறந்த வேலைகளுக்கும் அதிக சம்பளத்திற்கும் வழி திறக்கும். அனுபவமுள்ள சக ஊழியர்களிடம் கற்றுக்கொள்ளுங்கள், குறுகிய பயிற்சி வகுப்புகளில் சேருங்கள், முடிந்தால் சான்றிதழ்கள் பெறுங்கள்.",
          b1: "ஓட்டுநர் வேலைகளுக்கு ஓட்டுநர் உரிமம்",
          b2: "அடிப்படைக் கணினி மற்றும் மொபைல் திறன்கள்",
          b3: "பணியிடப் பாதுகாப்புப் பயிற்சி",
          b4: "மின்சாரம் அல்லது பிளம்பிங் போன்ற தொழில் திறன்கள்",
          b5: "வாடிக்கையாளர் சேவை மற்றும் தொடர்புத் திறன்",
        },
        chooseTheRightJob: {
          title: "சரியான வேலையைத் தேர்ந்தெடுங்கள்",
          p1: "சம்பளத்தை மட்டும் பார்க்காதீர்கள். வேலையை ஏற்கும் முன் இவற்றைக் கவனியுங்கள்.",
          b1: "பணியிடம் மற்றும் பயண நேரம்",
          b2: "ஷிஃப்ட் நேரம்",
          b3: "வேலைப் பாதுகாப்பு",
          b4: "வளர்ச்சி வாய்ப்புகள்",
        },
        growInYourCurrentJob: {
          title: "தற்போதைய வேலையில் வளருங்கள்",
          p1: "வேலையில் நேரந்தவறாமை, நம்பகத்தன்மை மற்றும் நேர்மையுடன் இருங்கள். நல்ல வருகையும் நேர்மறையான அணுகுமுறையும் நம்பிக்கை, பொறுப்பு மற்றும் பதவி உயர்வுகளைப் பெற உதவும்.",
          b1: "சரியான நேரத்தில் வாருங்கள்",
          b2: "உங்கள் மேற்பார்வையாளரிடம் கற்றுக்கொள்ளுங்கள்",
          b3: "பொறுப்பை ஏற்றுக்கொள்ளுங்கள்",
          b4: "உங்கள் பணி அனுபவப் பதிவை வைத்துக்கொள்ளுங்கள்",
        },
        planYourNextStep: {
          title: "உங்கள் அடுத்த படியைத் திட்டமிடுங்கள்",
          p1: "மேற்பார்வையாளர், மூத்த தொழில்நுட்ப வல்லுநர் அல்லது குழுத் தலைவர் ஆவது போன்ற தெளிவான இலக்கை அமையுங்கள். உங்கள் அடுத்த வேலை விண்ணப்பத்திற்கு அனுபவக் கடிதங்களையும் பரிந்துரைகளையும் சேகரியுங்கள்.",
        },
      },
      cta: {
        title: "உங்கள் தொழில் வாழ்க்கையில் அடுத்த படியை எடுங்கள்",
        p1: "உங்கள் திறன்களுக்கும் இலக்குகளுக்கும் பொருந்தும் வேலைகளைக் கண்டறிந்து, அறிவிப்புகளை நேரடியாக WhatsApp-இல் பெறுங்கள்.",
        tagline: "கற்றுக்கொள்ளுங்கள். வளருங்கள். சிறந்த வேலைகளைப் பெறுங்கள்.",
        badge: "WhatsApp",
      },
    },
  },
};

const kn: MessageShape<typeof en> = {
  publicPages: {
    breadcrumbAria: "ಬ್ರೆಡ್‌ಕ್ರಂಬ್",
    actions: {
      startOnWhatsapp: "WhatsAppನಲ್ಲಿ ಪ್ರಾರಂಭಿಸಿ",
      browseJobs: "ಉದ್ಯೋಗಗಳನ್ನು ನೋಡಿ",
      postAJob: "ಉದ್ಯೋಗವನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ",
      employerLogin: "ಉದ್ಯೋಗದಾತ ಲಾಗಿನ್",
      contactSupport: "ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ",
    },
    findJobs: {
      title: "ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ",
      metaDescription:
        "ಸರಿಯಾದ ಉದ್ಯೋಗವನ್ನು ಹುಡುಕುತ್ತಿದ್ದೀರಾ? AsliJobs WhatsApp ಮೂಲಕ ಉದ್ಯೋಗ ಹುಡುಕಾಟವನ್ನು ಸರಳ, ವೇಗವಾಗಿ ಮತ್ತು ಸುಲಭವಾಗಿಸುತ್ತದೆ.",
      intro: {
        i1: "ಸರಿಯಾದ ಉದ್ಯೋಗವನ್ನು ಹುಡುಕುತ್ತಿದ್ದೀರಾ? AsliJobs WhatsApp ಮೂಲಕ ಉದ್ಯೋಗ ಹುಡುಕಾಟವನ್ನು ಸರಳ, ವೇಗವಾಗಿ ಮತ್ತು ಸುಲಭವಾಗಿಸುತ್ತದೆ.",
        i2: "ಸ್ಥಳ, ಉದ್ಯೋಗ ವರ್ಗ, ಅನುಭವ, ಕೌಶಲ್ಯಗಳು, ಭಾಷಾ ಆದ್ಯತೆ ಮತ್ತು ಲಭ್ಯತೆಯ ಆಧಾರದ ಮೇಲೆ ನೀಲಿ-ಕಾಲರ್ ಮತ್ತು ಬೂದು-ಕಾಲರ್ ಉದ್ಯೋಗಗಳನ್ನು ಕಂಡುಹಿಡಿಯಲು AsliJobs ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ. ಕಚೇರಿ ಬೆಂಬಲ, ವಿತರಣೆ, ಚಾಲನೆ, ಎಲೆಕ್ಟ್ರಿಷಿಯನ್, ಹೌಸ್‌ಕೀಪಿಂಗ್, ಭದ್ರತೆ, ಗೋದಾಮು, ಚಿಲ್ಲರೆ, ತಂತ್ರಜ್ಞ ಅಥವಾ ಇತರ ಕಾರ್ಮಿಕ ಅವಕಾಶಗಳನ್ನು ಹುಡುಕುತ್ತಿದ್ದರೂ, AsliJobs ನಿಮ್ಮನ್ನು ಸೂಕ್ತ ಉದ್ಯೋಗದಾತರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುತ್ತದೆ.",
      },
      sections: {
        findJobsThroughWhatsapp: {
          title: "WhatsApp ಮೂಲಕ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ",
          p1: "ನೀವು ಹೊಸ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಬೇಕಾಗಿಲ್ಲ. AsliJobs ಮೂಲಕ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಬಹುದು, ಉದ್ಯೋಗ ವಿವರಗಳನ್ನು ನೋಡಬಹುದು, ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು ಮತ್ತು ಸಂದರ್ಶನ ನವೀಕರಣಗಳನ್ನು ನೇರವಾಗಿ WhatsAppನಲ್ಲಿ ಪಡೆಯಬಹುದು.",
          p2: "AsliJobs WhatsApp ಚಾಟ್ ಪ್ರಾರಂಭಿಸಿ, ನಿಮ್ಮ ಮೂಲ ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ, ಆದ್ಯತೆಯ ಉದ್ಯೋಗ ವರ್ಗ ಮತ್ತು ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಸೂಕ್ತ ಉದ್ಯೋಗ ಅವಕಾಶಗಳನ್ನು ಪಡೆಯಿರಿ.",
        },
        jobsBasedOnYourLocation: {
          title: "ನಿಮ್ಮ ಸ್ಥಳದ ಆಧಾರದ ಮೇಲಿನ ಉದ್ಯೋಗಗಳು",
          p1: "ನಿಮ್ಮ ನಗರ, ಪ್ರದೇಶ, ಸ್ಥಳೀಯತೆ ಅಥವಾ ಆದ್ಯತೆಯ ಕೆಲಸದ ಸ್ಥಳದ ಆಧಾರದ ಮೇಲೆ ಉದ್ಯೋಗಗಳನ್ನು ಕಂಡುಹಿಡಿಯಲು AsliJobs ಸಹಾಯ ಮಾಡುತ್ತದೆ. ಹತ್ತಿರದ, ನಿಮಗೆ ಅನುಕೂಲವಾದ ಉದ್ಯೋಗಗಳನ್ನು ಕಂಡುಹಿಡಿದು ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಸುಲಭವಾಗುತ್ತದೆ.",
        },
        applyEasily: {
          title: "ಸುಲಭವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
          p1: "ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆ ಬಂದಾಗ ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ, ವೇತನ, ಸ್ಥಳ, ಸಮಯ, ಅಗತ್ಯ ಅನುಭವ ಮತ್ತು ಇತರ ವಿವರಗಳನ್ನು ನೋಡಬಹುದು. ಆಸಕ್ತಿ ಇದ್ದರೆ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗೆ ಉತ್ತರಿಸಿ ಅಥವಾ ಅರ್ಜಿ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ ನೇರವಾಗಿ WhatsApp ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು.",
        },
        stayUpdated: {
          title: "ನವೀಕೃತರಾಗಿರಿ",
          p1: "ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ ನಂತರ ಅರ್ಜಿ ಸ್ಥಿತಿ, ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ನವೀಕರಣಗಳು, ಸಂದರ್ಶನ ವಿವರಗಳು, ಆಯ್ಕೆ ಸ್ಥಿತಿ ಮತ್ತು ಸೇರುವ ಮಾಹಿತಿ ಸೇರಿದಂತೆ ಮುಖ್ಯ ನವೀಕರಣಗಳು WhatsApp ಮೂಲಕ ಬರುತ್ತವೆ.",
        },
        safeJobSearch: {
          title: "ಸುರಕ್ಷಿತ ಉದ್ಯೋಗ ಹುಡುಕಾಟ",
          p1: "ಸರಳ ಮತ್ತು ನಂಬಲರ್ಹ ಉದ್ಯೋಗ ಹುಡುಕಾಟ ಅನುಭವವನ್ನು ರಚಿಸುವುದರ ಮೇಲೆ AsliJobs ಗಮನಹರಿಸುತ್ತದೆ. ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ಉದ್ಯೋಗ ವಿವರಗಳನ್ನು ಯಾವಾಗಲೂ ಎಚ್ಚರಿಕೆಯಿಂದ ಪರಿಶೀಲಿಸಬೇಕು ಮತ್ತು ನಕಲಿ ಉದ್ಯೋಗ, ಪಾವತಿ ಬೇಡಿಕೆ ಅಥವಾ ಅನುಮಾನಾಸ್ಪದ ಚಟುವಟಿಕೆಯನ್ನು AsliJobs ಬೆಂಬಲಕ್ಕೆ ವರದಿ ಮಾಡಬೇಕು.",
        },
      },
      cta: {
        title: "ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಲು ಪ್ರಾರಂಭಿಸಿ",
        p1: "AsliJobs ಮೂಲಕ ನಿಮ್ಮ ಉದ್ಯೋಗ ಹುಡುಕಾಟವನ್ನು ಪ್ರಾರಂಭಿಸಿ ಮತ್ತು ಸೂಕ್ತ ಉದ್ಯೋಗ ಅವಕಾಶಗಳನ್ನು ನೇರವಾಗಿ WhatsAppನಲ್ಲಿ ಪಡೆಯಿರಿ.",
        tagline: "ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ. ಸುಲಭವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ. WhatsAppನಲ್ಲಿ ನವೀಕರಣಗಳನ್ನು ಪಡೆಯಿರಿ.",
        badge: "WhatsApp",
      },
    },
    browseByCity: {
      title: "ನಗರದ ಪ್ರಕಾರ ನೋಡಿ",
      metaDescription:
        "AsliJobs ಮೂಲಕ WhatsAppನಲ್ಲಿ ನಿಮ್ಮ ಆದ್ಯತೆಯ ನಗರದಲ್ಲಿ ನೀಲಿ-ಕಾಲರ್ ಮತ್ತು ಬೂದು-ಕಾಲರ್ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ.",
      intro: {
        i1: "AsliJobs ಮೂಲಕ ನಿಮ್ಮ ಆದ್ಯತೆಯ ನಗರದಲ್ಲಿ ನೀಲಿ-ಕಾಲರ್ ಮತ್ತು ಬೂದು-ಕಾಲರ್ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ. ಹತ್ತಿರದ ಉದ್ಯೋಗವನ್ನು ಹುಡುಕುತ್ತಿದ್ದರೂ ಅಥವಾ ಇನ್ನೊಂದು ನಗರದಲ್ಲಿ ಕೆಲಸ ಮಾಡಲು ಯೋಜಿಸುತ್ತಿದ್ದರೂ, AsliJobs WhatsApp ಮೂಲಕ ಸೂಕ್ತ ಅವಕಾಶಗಳನ್ನು ಕಂಡುಹಿಡಿಯಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
      },
      sections: {
        findJobsInYourCity: {
          title: "ನಿಮ್ಮ ನಗರದಲ್ಲಿ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ",
          p1: "ನಗರ, ಪ್ರದೇಶ, ಸ್ಥಳೀಯತೆ ಮತ್ತು ಆದ್ಯತೆಯ ಕೆಲಸದ ಸ್ಥಳದ ಆಧಾರದ ಮೇಲೆ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಲು AsliJobs ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳಿಗೆ ಅನುಮತಿಸುತ್ತದೆ. ಹತ್ತಿರವಿರುವ, ತಲುಪಲು ಸುಲಭವಾದ, ನಿಮ್ಮ ದೈನಂದಿನಕ್ಕೆ ಸೂಕ್ತವಾದ ಉದ್ಯೋಗಗಳನ್ನು ಕಂಡುಹಿಡಿಯಲು ಇದು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
        },
        howItWorks: {
          title: "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
          p1: "ನಿಮ್ಮ ನಗರವನ್ನು ಆಯ್ಕೆಮಾಡಿ, ಉದ್ಯೋಗ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಮೂಲ ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ. ನಿಮ್ಮ ಸ್ಥಳ, ಅನುಭವ, ಕೌಶಲ್ಯಗಳು ಮತ್ತು ಲಭ್ಯತೆಯ ಆಧಾರದ ಮೇಲೆ AsliJobs ಸೂಕ್ತ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳನ್ನು ನೇರವಾಗಿ WhatsAppನಲ್ಲಿ ಕಳುಹಿಸುತ್ತದೆ.",
          b1: "ನಗರವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
          b2: "ಉದ್ಯೋಗ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
          b3: "ಮೂಲ ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ",
          b4: "ಸ್ಥಳ, ಅನುಭವ, ಕೌಶಲ್ಯಗಳು ಮತ್ತು ಲಭ್ಯತೆಯ ಆಧಾರದ ಮೇಲಿನ ಹೊಂದಾಣಿಕೆ",
          b5: "WhatsApp ಮೂಲಕ ಸೂಕ್ತ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಿರಿ",
        },
        cityBasedJobAlerts: {
          title: "ನಗರ ಆಧಾರಿತ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳು",
          p1: "ಕಚೇರಿ ಬೆಂಬಲ, ವಿತರಣೆ, ಚಾಲಕ, ಎಲೆಕ್ಟ್ರಿಷಿಯನ್, ಪ್ಲಂಬರ್, ಹೌಸ್‌ಕೀಪಿಂಗ್, ಭದ್ರತೆ, ಸಹಾಯಕ, ಗೋದಾಮು ಸಿಬ್ಬಂದಿ, ಚಿಲ್ಲರೆ ಸಿಬ್ಬಂದಿ, ತಂತ್ರಜ್ಞ ಮತ್ತು ನಿಮ್ಮ ನಗರದಲ್ಲಿ ಲಭ್ಯವಿರುವ ಇತರ ಕಾರ್ಮಿಕ ಉದ್ಯೋಗಗಳಿಗೆ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಬಹುದು.",
          b1: "ಕಚೇರಿ ಬೆಂಬಲ",
          b2: "ವಿತರಣೆ",
          b3: "ಚಾಲಕ",
          b4: "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್",
          b5: "ಪ್ಲಂಬರ್",
          b6: "ಹೌಸ್‌ಕೀಪಿಂಗ್",
          b7: "ಭದ್ರತೆ",
          b8: "ಸಹಾಯಕ",
          b9: "ಗೋದಾಮು ಸಿಬ್ಬಂದಿ",
          b10: "ಚಿಲ್ಲರೆ ಸಿಬ್ಬಂದಿ",
          b11: "ತಂತ್ರಜ್ಞ",
          b12: "ಇತರ ಕಾರ್ಮಿಕ ಉದ್ಯೋಗಗಳು",
        },
        jobAvailability: {
          title: "ಉದ್ಯೋಗ ಲಭ್ಯತೆ",
          p1: "AsliJobs ಭಾರತದಾದ್ಯಂತ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ಮತ್ತು ಉದ್ಯೋಗದಾತರಿಗೆ ಸೇವೆ ನೀಡುತ್ತದೆ. ಉದ್ಯೋಗ ಲಭ್ಯತೆ ನಗರ, ಪ್ರದೇಶ, ಸ್ಥಳೀಯತೆ, ಉದ್ಯೋಗ ವರ್ಗ ಮತ್ತು ಉದ್ಯೋಗದಾತ ಖಾಳಿ ಹುದ್ದೆಗಳನ್ನು ಅವಲಂಬಿಸಿ ಬದಲಾಗಬಹುದು.",
        },
      },
      cta: {
        title: "ಹುಡುಕಾಟ ಪ್ರಾರಂಭಿಸಿ",
        p1: "ನಿಮ್ಮ ನಗರವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಉದ್ಯೋಗ ಅವಕಾಶಗಳನ್ನು ನೇರವಾಗಿ WhatsAppನಲ್ಲಿ ಪಡೆಯಲು ಪ್ರಾರಂಭಿಸಿ.",
        tagline: "ನಿಮ್ಮ ಹತ್ತಿರದ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ. WhatsApp ಮೂಲಕ ಸುಲಭವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
        badge: "WhatsApp",
      },
    },
    browseByState: {
      title: "ರಾಜ್ಯದ ಪ್ರಕಾರ ನೋಡಿ",
      metaDescription:
        "AsliJobs ಮೂಲಕ WhatsAppನಲ್ಲಿ ಭಾರತದ ವಿವಿಧ ರಾಜ್ಯಗಳಲ್ಲಿ ನೀಲಿ-ಕಾಲರ್ ಮತ್ತು ಬೂದು-ಕಾಲರ್ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ.",
      intro: {
        i1: "AsliJobs ಮೂಲಕ ಭಾರತದ ವಿವಿಧ ರಾಜ್ಯಗಳಲ್ಲಿ ನೀಲಿ-ಕಾಲರ್ ಮತ್ತು ಬೂದು-ಕಾಲರ್ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ. ನಿಮ್ಮ ತವರು ರಾಜ್ಯದಲ್ಲಿ ಕೆಲಸ ಮಾಡಲು ಬಯಸಿದರೂ ಅಥವಾ ಇನ್ನೊಂದು ರಾಜ್ಯದಲ್ಲಿ ಅವಕಾಶಗಳನ್ನು ನೋಡಲು ಬಯಸಿದರೂ, AsliJobs WhatsApp ಮೂಲಕ ಸೂಕ್ತ ಉದ್ಯೋಗಗಳನ್ನು ಕಂಡುಹಿಡಿಯಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
      },
      sections: {
        findJobsStateWise: {
          title: "ರಾಜ್ಯವಾರು ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ",
          p1: "ರಾಜ್ಯ, ನಗರ, ಪ್ರದೇಶ, ಸ್ಥಳೀಯತೆ ಮತ್ತು ಆದ್ಯತೆಯ ಕೆಲಸದ ಸ್ಥಳದ ಆಧಾರದ ಮೇಲೆ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಲು AsliJobs ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳಿಗೆ ಅನುಮತಿಸುತ್ತದೆ. ನಿಮ್ಮ ಸ್ಥಳ ಮತ್ತು ಉದ್ಯೋಗ ಆದ್ಯತೆಗೆ ಹೊಂದುವ ಅವಕಾಶಗಳನ್ನು ಕಂಡುಹಿಡಿಯುವುದು ಸುಲಭವಾಗುತ್ತದೆ.",
        },
        howItWorks: {
          title: "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
          p1: "ನಿಮ್ಮ ರಾಜ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ, ನಗರ ಅಥವಾ ಸ್ಥಳೀಯತೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಆದ್ಯತೆಯ ಉದ್ಯೋಗ ವರ್ಗವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ. ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ವಿವರಗಳ ಆಧಾರದ ಮೇಲೆ AsliJobs ಸೂಕ್ತ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳನ್ನು ನೇರವಾಗಿ WhatsAppನಲ್ಲಿ ಕಳುಹಿಸುತ್ತದೆ.",
          b1: "ರಾಜ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
          b2: "ನಗರ/ಸ್ಥಳೀಯತೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
          b3: "ಆದ್ಯತೆಯ ಉದ್ಯೋಗ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
          b4: "WhatsApp ಮೂಲಕ ಸೂಕ್ತ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಿರಿ",
        },
        stateBasedJobAlerts: {
          title: "ರಾಜ್ಯ ಆಧಾರಿತ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳು",
          p1: "ಕಚೇರಿ ಬೆಂಬಲ, ವಿತರಣೆ, ಚಾಲಕ, ಎಲೆಕ್ಟ್ರಿಷಿಯನ್, ಪ್ಲಂಬರ್, ಹೌಸ್‌ಕೀಪಿಂಗ್, ಭದ್ರತೆ, ಸಹಾಯಕ, ಗೋದಾಮು ಸಿಬ್ಬಂದಿ, ಚಿಲ್ಲರೆ ಸಿಬ್ಬಂದಿ, ತಂತ್ರಜ್ಞ ಮತ್ತು ನೀವು ಆಯ್ಕೆಮಾಡಿದ ರಾಜ್ಯದಲ್ಲಿ ಲಭ್ಯವಿರುವ ಇತರ ಕಾರ್ಮಿಕ ಉದ್ಯೋಗಗಳಿಗೆ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಬಹುದು.",
          b1: "ಕಚೇರಿ ಬೆಂಬಲ",
          b2: "ವಿತರಣೆ",
          b3: "ಚಾಲಕ",
          b4: "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್",
          b5: "ಪ್ಲಂಬರ್",
          b6: "ಹೌಸ್‌ಕೀಪಿಂಗ್",
          b7: "ಭದ್ರತೆ",
          b8: "ಸಹಾಯಕ",
          b9: "ಗೋದಾಮು ಸಿಬ್ಬಂದಿ",
          b10: "ಚಿಲ್ಲರೆ ಸಿಬ್ಬಂದಿ",
          b11: "ತಂತ್ರಜ್ಞ",
          b12: "ಇತರ ಕಾರ್ಮಿಕ ಉದ್ಯೋಗಗಳು",
        },
        jobAvailability: {
          title: "ಉದ್ಯೋಗ ಲಭ್ಯತೆ",
          p1: "AsliJobs ಭಾರತದಾದ್ಯಂತ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ಮತ್ತು ಉದ್ಯೋಗದಾತರಿಗೆ ಸೇವೆ ನೀಡುತ್ತದೆ. ಉದ್ಯೋಗ ಲಭ್ಯತೆ ರಾಜ್ಯ, ನಗರ, ಸ್ಥಳೀಯತೆ, ಉದ್ಯೋಗ ವರ್ಗ ಮತ್ತು ಉದ್ಯೋಗದಾತ ಖಾಳಿ ಹುದ್ದೆಗಳನ್ನು ಅವಲಂಬಿಸಿ ಬದಲಾಗಬಹುದು.",
        },
      },
      cta: {
        title: "ಹುಡುಕಾಟ ಪ್ರಾರಂಭಿಸಿ",
        p1: "ನಿಮ್ಮ ಆದ್ಯತೆಯ ರಾಜ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು WhatsAppನಲ್ಲಿ ಸೂಕ್ತ ಉದ್ಯೋಗ ಅವಕಾಶಗಳನ್ನು ಪಡೆಯಲು ಪ್ರಾರಂಭಿಸಿ.",
        tagline: "ರಾಜ್ಯವಾರು ಹುಡುಕಿ. ಸುಲಭವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ. WhatsAppನಲ್ಲಿ ನವೀಕರಣಗಳನ್ನು ಪಡೆಯಿರಿ.",
        badge: "WhatsApp",
      },
    },
    jobCategories: {
      title: "ಉದ್ಯೋಗ ವರ್ಗಗಳು",
      metaDescription:
        "AsliJobs ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳಿಗೆ WhatsApp ಮೂಲಕ ವಿವಿಧ ವರ್ಗಗಳಲ್ಲಿ ನೀಲಿ-ಕಾಲರ್ ಮತ್ತು ಬೂದು-ಕಾಲರ್ ಉದ್ಯೋಗಗಳನ್ನು ಕಂಡುಹಿಡಿಯಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
      intro: {
        i1: "AsliJobs ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳಿಗೆ ವಿವಿಧ ವರ್ಗಗಳಲ್ಲಿ ನೀಲಿ-ಕಾಲರ್ ಮತ್ತು ಬೂದು-ಕಾಲರ್ ಉದ್ಯೋಗಗಳನ್ನು ಕಂಡುಹಿಡಿಯಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ. ಕ್ಷೇತ್ರ ಕೆಲಸ, ತಾಂತ್ರಿಕ ಕೆಲಸ, ಕಚೇರಿ ಬೆಂಬಲ, ವಿತರಣೆ, ಚಿಲ್ಲರೆ ಅಥವಾ ಸೇವಾ ಆಧಾರಿತ ಪಾತ್ರಗಳನ್ನು ಹುಡುಕುತ್ತಿದ್ದರೂ, AsliJobs WhatsApp ಮೂಲಕ ಸೂಕ್ತ ಉದ್ಯೋಗಗಳನ್ನು ಕಂಡುಹಿಡಿಯುವುದನ್ನು ಸುಲಭಗೊಳಿಸುತ್ತದೆ.",
      },
      sections: {
        exploreJobsByCategory: {
          title: "ವರ್ಗದ ಪ್ರಕಾರ ಉದ್ಯೋಗಗಳನ್ನು ನೋಡಿ",
          p1: "ಪ್ರೊಫೈಲ್ ರಚಿಸುವಾಗ ನಿಮ್ಮ ಆದ್ಯತೆಯ ಉದ್ಯೋಗ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಬಹುದು. ನಿಮ್ಮ ಕೌಶಲ್ಯಗಳು, ಅನುಭವ, ಸ್ಥಳ ಮತ್ತು ಲಭ್ಯತೆಯ ಆಧಾರದ ಮೇಲೆ AsliJobs ಸೂಕ್ತ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳನ್ನು ನೇರವಾಗಿ WhatsAppನಲ್ಲಿ ಕಳುಹಿಸುತ್ತದೆ.",
        },
        popularJobCategories: {
          title: "ಜನಪ್ರಿಯ ಉದ್ಯೋಗ ವರ್ಗಗಳು",
          cards: {
            officeSupport: {
              title: "ಕಚೇರಿ ಬೆಂಬಲ",
              description:
                "ಕಚೇರಿ ಸಹಾಯಕ, ಆಡಳಿತ ಸಹಾಯಕ, ಸ್ವಾಗತಕಾರ, ಡೇಟಾ ನಮೂದು ಬೆಂಬಲ ಮತ್ತು ಬ್ಯಾಕ್-ಆಫೀಸ್ ಸಿಬ್ಬಂದಿಯಂತಹ ಉದ್ಯೋಗಗಳು.",
            },
            deliveryLogistics: {
              title: "ವಿತರಣೆ ಮತ್ತು ಲಾಜಿಸ್ಟಿಕ್ಸ್",
              description:
                "ವಿತರಣಾ ಕಾರ್ಯನಿರ್ವಾಹಕ, ಕೊರಿಯರ್ ಸಿಬ್ಬಂದಿ, ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಸಹಾಯಕ ಮತ್ತು ಕ್ಷೇತ್ರ ವಿತರಣಾ ಪಾತ್ರಗಳಂತಹ ಉದ್ಯೋಗಗಳು.",
            },
            driverJobs: {
              title: "ಚಾಲಕ ಉದ್ಯೋಗಗಳು",
              description:
                "ಕಾರು ಚಾಲಕರು, ವಾಣಿಜ್ಯ ಚಾಲಕರು, ವೈಯಕ್ತಿಕ ಚಾಲಕರು ಮತ್ತು ಕಂಪನಿ ಚಾಲಕರ ಉದ್ಯೋಗಗಳು.",
            },
            electricianJobs: {
              title: "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಉದ್ಯೋಗಗಳು",
              description:
                "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್‌ಗಳು, ವಿದ್ಯುತ್ ಸಹಾಯಕರು, ವೈರಿಂಗ್ ತಂತ್ರಜ್ಞರು ಮತ್ತು ನಿರ್ವಹಣಾ ಸಿಬ್ಬಂದಿಯ ಉದ್ಯೋಗಗಳು.",
            },
            plumbingJobs: {
              title: "ಪ್ಲಂಬಿಂಗ್ ಉದ್ಯೋಗಗಳು",
              description:
                "ಪ್ಲಂಬರ್‌ಗಳು, ಪ್ಲಂಬಿಂಗ್ ಸಹಾಯಕರು ಮತ್ತು ನಿರ್ವಹಣಾ ಬೆಂಬಲ ಕಾರ್ಮಿಕರ ಉದ್ಯೋಗಗಳು.",
            },
            housekeepingJobs: {
              title: "ಹೌಸ್‌ಕೀಪಿಂಗ್ ಉದ್ಯೋಗಗಳು",
              description:
                "ಹೌಸ್‌ಕೀಪಿಂಗ್ ಸಿಬ್ಬಂದಿ, ಸ್ವಚ್ಛತಾ ಸಿಬ್ಬಂದಿ, ಸೌಲಭ್ಯ ಬೆಂಬಲ ಮತ್ತು ನಿರ್ವಹಣಾ ಕಾರ್ಮಿಕರ ಉದ್ಯೋಗಗಳು.",
            },
            securityJobs: {
              title: "ಭದ್ರತಾ ಉದ್ಯೋಗಗಳು",
              description:
                "ಭದ್ರತಾ ಕಾವಲುಗಾರರು, ಕಾವಲುಗಾರರು, ಕಟ್ಟಡ ಭದ್ರತೆ ಮತ್ತು ಸೈಟ್ ಭದ್ರತಾ ಸಿಬ್ಬಂದಿಯ ಉದ್ಯೋಗಗಳು.",
            },
            warehouseJobs: {
              title: "ಗೋದಾಮು ಉದ್ಯೋಗಗಳು",
              description:
                "ಗೋದಾಮು ಸಹಾಯಕರು, ಪ್ಯಾಕರ್‌ಗಳು, ಲೋಡರ್‌ಗಳು, ದಾಸ್ತಾನು ಸಹಾಯಕರು ಮತ್ತು ಅಂಗಡಿ ಬೆಂಬಲ ಸಿಬ್ಬಂದಿಯ ಉದ್ಯೋಗಗಳು.",
            },
            retailJobs: {
              title: "ಚಿಲ್ಲರೆ ಉದ್ಯೋಗಗಳು",
              description:
                "ಮಾರಾಟ ಸಿಬ್ಬಂದಿ, ಅಂಗಡಿ ಸಹಾಯಕರು, ನಗದುಗಾರರು, ಪ್ರಚಾರಕರು ಮತ್ತು ಗ್ರಾಹಕ ಬೆಂಬಲ ಪಾತ್ರಗಳ ಉದ್ಯೋಗಗಳು.",
            },
            technicianJobs: {
              title: "ತಂತ್ರಜ್ಞ ಉದ್ಯೋಗಗಳು",
              description:
                "ಎಸಿ ತಂತ್ರಜ್ಞರು, ಉಪಕರಣ ತಂತ್ರಜ್ಞರು, ಯಂತ್ರ ನಿರ್ವಾಹಕರು, ಮೆಕ್ಯಾನಿಕ್‌ಗಳು ಮತ್ತು ಸೇವಾ ತಂತ್ರಜ್ಞರ ಉದ್ಯೋಗಗಳು.",
            },
            helperJobs: {
              title: "ಸಹಾಯಕ ಉದ್ಯೋಗಗಳು",
              description:
                "ಸಾಮಾನ್ಯ ಸಹಾಯಕರು, ಸೈಟ್ ಸಹಾಯಕರು, ಕಾರ್ಖಾನೆ ಸಹಾಯಕರು, ಅಂಗಡಿ ಸಹಾಯಕರು ಮತ್ತು ಬೆಂಬಲ ಕಾರ್ಮಿಕರ ಉದ್ಯೋಗಗಳು.",
            },
            otherWorkforceJobs: {
              title: "ಇತರ ಕಾರ್ಮಿಕ ಉದ್ಯೋಗಗಳು",
              description:
                "ಉದ್ಯೋಗದಾತ ಅಗತ್ಯಗಳು ಮತ್ತು ಸ್ಥಳ ಲಭ್ಯತೆಯ ಆಧಾರದ ಮೇಲೆ AsliJobsನಲ್ಲಿ ಇತರ ನೀಲಿ-ಕಾಲರ್ ಮತ್ತು ಬೂದು-ಕಾಲರ್ ಉದ್ಯೋಗ ಪಾತ್ರಗಳೂ ಇರಬಹುದು.",
            },
          },
        },
        jobsBasedOnYourLocation: {
          title: "ನಿಮ್ಮ ಸ್ಥಳದ ಆಧಾರದ ಮೇಲಿನ ಉದ್ಯೋಗಗಳು",
          p1: "ಉದ್ಯೋಗ ಲಭ್ಯತೆ ನಿಮ್ಮ ರಾಜ್ಯ, ನಗರ, ಪ್ರದೇಶ, ಸ್ಥಳೀಯತೆ, ಉದ್ಯೋಗ ವರ್ಗ ಮತ್ತು ಉದ್ಯೋಗದಾತ ಖಾಳಿ ಹುದ್ದೆಗಳನ್ನು ಅವಲಂಬಿಸಿ ಬದಲಾಗಬಹುದು. ಹೆಚ್ಚು ಸಂಬಂಧಿತ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಲು ನಿಮ್ಮ ಆದ್ಯತೆಯ ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಬಹುದು.",
        },
      },
      cta: {
        title: "ಸರಿಯಾದ ಉದ್ಯೋಗವನ್ನು ಹುಡುಕಲು ಪ್ರಾರಂಭಿಸಿ",
        p1: "ನಿಮ್ಮ ಉದ್ಯೋಗ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಸೂಕ್ತ ಉದ್ಯೋಗ ಅವಕಾಶಗಳನ್ನು ನೇರವಾಗಿ WhatsAppನಲ್ಲಿ ಪಡೆಯಲು ಪ್ರಾರಂಭಿಸಿ.",
        tagline: "ನಿಮ್ಮ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಿರಿ. WhatsApp ಮೂಲಕ ಸುಲಭವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
        badge: "WhatsApp",
      },
    },
    jobSeekerGuide: {
      title: "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿ ಮಾರ್ಗದರ್ಶಿ",
      metaDescription:
        "ಭಾರತದ ನೀಲಿ-ಕಾಲರ್ ಮತ್ತು ಬೂದು-ಕಾಲರ್ ಕಾರ್ಮಿಕರಿಗೆ WhatsApp ಮೂಲಕ ಉದ್ಯೋಗ ಹುಡುಕಾಟವನ್ನು AsliJobs ಸರಳಗೊಳಿಸುತ್ತದೆ.",
      intro: {
        i1: "ಭಾರತದ ನೀಲಿ-ಕಾಲರ್ ಮತ್ತು ಬೂದು-ಕಾಲರ್ ಕಾರ್ಮಿಕರಿಗೆ ಉದ್ಯೋಗ ಹುಡುಕಾಟವನ್ನು AsliJobs ಸರಳಗೊಳಿಸುತ್ತದೆ. AsliJobs ಮೂಲಕ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ಸೂಕ್ತ ಉದ್ಯೋಗಗಳನ್ನು ಕಂಡುಹಿಡಿಯಬಹುದು, ಸುಲಭವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು ಮತ್ತು ನವೀಕರಣಗಳನ್ನು ನೇರವಾಗಿ WhatsApp ಮೂಲಕ ಪಡೆಯಬಹುದು.",
      },
      sections: {
        startWithWhatsapp: {
          title: "WhatsAppನೊಂದಿಗೆ ಪ್ರಾರಂಭಿಸಿ",
          p1: "ನೀವು ಹೊಸ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಬೇಕಾಗಿಲ್ಲ. AsliJobs WhatsApp ಲಿಂಕ್ ಕ್ಲಿಕ್ ಮಾಡಿ, QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ಅಧಿಕೃತ AsliJobs WhatsApp ಸಂಖ್ಯೆಗೆ ಸಂದೇಶ ಕಳುಹಿಸಿ ಪ್ರಾರಂಭಿಸಬಹುದು.",
        },
        createYourProfile: {
          title: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ",
          p1: "ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ಸ್ಥಳ, ಆದ್ಯತೆಯ ಭಾಷೆ, ಉದ್ಯೋಗ ವರ್ಗ, ಕೌಶಲ್ಯಗಳು, ಅನುಭವ, ನಿರೀಕ್ಷಿತ ವೇತನ ಮತ್ತು ಲಭ್ಯತೆಯಂತಹ ಮೂಲ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ. ಇದು AsliJobs ನಿಮಗೆ ಹೆಚ್ಚು ಸೂಕ್ತ ಉದ್ಯೋಗ ಅವಕಾಶಗಳನ್ನು ಕಳುಹಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
          b1: "ಹೆಸರು",
          b2: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
          b3: "ಸ್ಥಳ",
          b4: "ಆದ್ಯತೆಯ ಭಾಷೆ",
          b5: "ಉದ್ಯೋಗ ವರ್ಗ",
          b6: "ಕೌಶಲ್ಯಗಳು",
          b7: "ಅನುಭವ",
          b8: "ನಿರೀಕ್ಷಿತ ವೇತನ",
          b9: "ಲಭ್ಯತೆ",
        },
        chooseYourJobCategory: {
          title: "ನಿಮ್ಮ ಉದ್ಯೋಗ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
          p1: "ನೀವು ಹುಡುಕುತ್ತಿರುವ ಉದ್ಯೋಗದ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆಮಾಡಿ, ಉದಾಹರಣೆಗೆ ಕಚೇರಿ ಬೆಂಬಲ, ವಿತರಣೆ, ಚಾಲಕ, ಎಲೆಕ್ಟ್ರಿಷಿಯನ್, ಹೌಸ್‌ಕೀಪಿಂಗ್, ಭದ್ರತೆ, ಚಿಲ್ಲರೆ, ಗೋದಾಮು, ತಂತ್ರಜ್ಞ, ಸಹಾಯಕ ಅಥವಾ ಲಭ್ಯವಿರುವ ಇತರ ಕಾರ್ಮಿಕ ಉದ್ಯೋಗಗಳು.",
          b1: "ಕಚೇರಿ ಬೆಂಬಲ",
          b2: "ವಿತರಣೆ",
          b3: "ಚಾಲಕ",
          b4: "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್",
          b5: "ಹೌಸ್‌ಕೀಪಿಂಗ್",
          b6: "ಭದ್ರತೆ",
          b7: "ಚಿಲ್ಲರೆ",
          b8: "ಗೋದಾಮು",
          b9: "ತಂತ್ರಜ್ಞ",
          b10: "ಸಹಾಯಕ",
          b11: "ಲಭ್ಯವಿರುವ ಇತರ ಕಾರ್ಮಿಕ ಉದ್ಯೋಗಗಳು",
        },
        selectYourLocation: {
          title: "ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
          p1: "AsliJobs ನಿಮಗೆ ಹತ್ತಿರದ ಮತ್ತು ಅನುಕೂಲಕರ ಉದ್ಯೋಗಗಳನ್ನು ತೋರಿಸುವಂತೆ ನಿಮ್ಮ ರಾಜ್ಯ, ನಗರ, ಪ್ರದೇಶ ಅಥವಾ ಸ್ಥಳೀಯತೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
          b1: "ರಾಜ್ಯ",
          b2: "ನಗರ",
          b3: "ಪ್ರದೇಶ",
          b4: "ಸ್ಥಳೀಯತೆ",
        },
        receiveJobAlerts: {
          title: "ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಿರಿ",
          p1: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್, ಸ್ಥಳ, ಉದ್ಯೋಗ ವರ್ಗ ಮತ್ತು ಲಭ್ಯತೆಯ ಆಧಾರದ ಮೇಲೆ WhatsAppನಲ್ಲಿ ಸೂಕ್ತ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳು ಬರುತ್ತವೆ. ಉತ್ತಮ ಉದ್ಯೋಗ ಹೊಂದಾಣಿಕೆಗಳನ್ನು ಪಡೆಯಲು ಪ್ರೊಫೈಲ್ ಅನ್ನು ನವೀಕೃತವಾಗಿಡಿ.",
        },
        applyThroughWhatsapp: {
          title: "WhatsApp ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
          p1: "ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆ ಬಂದಾಗ ಉದ್ಯೋಗ ವಿವರಗಳನ್ನು ಎಚ್ಚರಿಕೆಯಿಂದ ಓದಿ. ಆಸಕ್ತಿ ಇದ್ದರೆ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗೆ ಉತ್ತರಿಸಿ ಅಥವಾ ಅರ್ಜಿ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ ನೇರವಾಗಿ WhatsApp ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
        },
        trackApplicationUpdates: {
          title: "ಅರ್ಜಿ ನವೀಕರಣಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
          p1: "ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ ನಂತರ ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ, ಶಾರ್ಟ್‌ಲಿಸ್ಟ್, ಸಂದರ್ಶನ ನಿಗದಿ, ಆಯ್ಕೆಯಾಗಿದೆ ಅಥವಾ ಸೇರುವ ದೃಢೀಕರಣದಂತಹ ನವೀಕರಣಗಳು WhatsApp ಮೂಲಕ ಬರಬಹುದು.",
          b1: "ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ",
          b2: "ಶಾರ್ಟ್‌ಲಿಸ್ಟ್",
          b3: "ಸಂದರ್ಶನ ನಿಗದಿ",
          b4: "ಆಯ್ಕೆಯಾಗಿದೆ",
          b5: "ಸೇರುವ ದೃಢೀಕರಣ",
        },
        useYourPreferredLanguage: {
          title: "ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಬಳಸಿ",
          p1: "AsliJobs ಇಂಗ್ಲಿಷ್, ಹಿಂದಿ, ತೆಲುಗು, ತಮಿಳು, ಕನ್ನಡ ಮತ್ತು ಮಲಯಾಳಂ ಭಾಷೆಗಳನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ. ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ನವೀಕರಣಗಳನ್ನು ಹೆಚ್ಚು ಆರಾಮದಾಯಕವಾಗಿ ಪಡೆಯಲು ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಬಹುದು.",
          b1: "ಇಂಗ್ಲಿಷ್",
          b2: "ಹಿಂದಿ",
          b3: "ತೆಲುಗು",
          b4: "ತಮಿಳು",
          b5: "ಕನ್ನಡ",
          b6: "ಮಲಯಾಳಂ",
        },
        staySafeWhileSearching: {
          title: "ಹುಡುಕುವಾಗ ಸುರಕ್ಷಿತವಾಗಿರಿ",
          p1: "ಉದ್ಯೋಗ ದೃಢೀಕರಣಕ್ಕಾಗಿ ಹಣ ಕೊಡಬೇಡಿ. ಮುಂದುವರಿಯುವ ಮೊದಲು ಕಂಪನಿ ಹೆಸರು, ಉದ್ಯೋಗ ಸ್ಥಳ, ವೇತನ, ಕೆಲಸದ ಸಮಯ ಮತ್ತು ಸಂದರ್ಶನ ವಿವರಗಳನ್ನು ಯಾವಾಗಲೂ ಪರಿಶೀಲಿಸಿ. ನಕಲಿ ಉದ್ಯೋಗಗಳು, ಪಾವತಿ ಬೇಡಿಕೆಗಳು ಅಥವಾ ಅನುಮಾನಾಸ್ಪದ ಸಂದೇಶಗಳನ್ನು ತಕ್ಷಣ AsliJobs ಬೆಂಬಲಕ್ಕೆ ವರದಿ ಮಾಡಿ.",
          b1: "ಉದ್ಯೋಗ ದೃಢೀಕರಣಕ್ಕಾಗಿ ಹಣ ಕೊಡಬೇಡಿ.",
          b2: "ಕಂಪನಿ ಹೆಸರನ್ನು ಪರಿಶೀಲಿಸಿ.",
          b3: "ಉದ್ಯೋಗ ಸ್ಥಳವನ್ನು ಪರಿಶೀಲಿಸಿ.",
          b4: "ವೇತನವನ್ನು ಪರಿಶೀಲಿಸಿ.",
          b5: "ಕೆಲಸದ ಸಮಯವನ್ನು ಪರಿಶೀಲಿಸಿ.",
          b6: "ಸಂದರ್ಶನ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
          b7: "ನಕಲಿ ಉದ್ಯೋಗಗಳನ್ನು ವರದಿ ಮಾಡಿ.",
          b8: "ಪಾವತಿ ಬೇಡಿಕೆಗಳನ್ನು ವರದಿ ಮಾಡಿ.",
          b9: "ಅನುಮಾನಾಸ್ಪದ ಸಂದೇಶಗಳನ್ನು ವರದಿ ಮಾಡಿ.",
        },
        getSupportWhenNeeded: {
          title: "ಅಗತ್ಯವಿದ್ದಾಗ ಬೆಂಬಲ ಪಡೆಯಿರಿ",
          p1: "ನೋಂದಣಿ, ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳು, ಅರ್ಜಿಗಳು, ಸಂದರ್ಶನಗಳು, ಪ್ರೊಫೈಲ್ ನವೀಕರಣಗಳು, ಭಾಷಾ ಬೆಂಬಲ ಅಥವಾ ದೂರುಗಳಿಗೆ ಸಹಾಯಕ್ಕಾಗಿ WhatsApp, ಕರೆ ಅಥವಾ ಇಮೇಲ್ ಮೂಲಕ AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು.",
          b1: "WhatsApp",
          b2: "ಕರೆ",
          b3: "ಇಮೇಲ್",
          b4: "ನೋಂದಣಿ",
          b5: "ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳು",
          b6: "ಅರ್ಜಿಗಳು",
          b7: "ಸಂದರ್ಶನಗಳು",
          b8: "ಪ್ರೊಫೈಲ್ ನವೀಕರಣಗಳು",
          b9: "ಭಾಷಾ ಬೆಂಬಲ",
          b10: "ದೂರುಗಳು",
        },
      },
      cta: {
        title: "ನಿಮ್ಮ ಉದ್ಯೋಗ ಹುಡುಕಾಟವನ್ನು ಪ್ರಾರಂಭಿಸಿ",
        p1: "AsliJobs ಮೂಲಕ ಉದ್ಯೋಗಗಳನ್ನು ಕಂಡುಹಿಡಿಯುವುದು ಮತ್ತು ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಸರಳ, ಪರಿಚಿತ ಮತ್ತು ಸುಲಭ.",
        tagline: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ. ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಿರಿ. WhatsApp ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
        badge: "WhatsApp",
      },
    },
    postAJob: {
      title: "ಉದ್ಯೋಗವನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ",
      metaDescription: "AsliJobs ಮೂಲಕ ಸರಿಯಾದ ನೀಲಿ-ಕಾಲರ್ ಮತ್ತು ಬೂದು-ಕಾಲರ್ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ನೇಮಿಸಿಕೊಳ್ಳಿ.",
      intro: {
        i1: "AsliJobs ಮೂಲಕ ಸರಿಯಾದ ನೀಲಿ-ಕಾಲರ್ ಮತ್ತು ಬೂದು-ಕಾಲರ್ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ನೇಮಿಸಿಕೊಳ್ಳಿ. ಕಚೇರಿ ಬೆಂಬಲ ಸಿಬ್ಬಂದಿ, ವಿತರಣಾ ಕಾರ್ಯನಿರ್ವಾಹಕರು, ಚಾಲಕರು, ಎಲೆಕ್ಟ್ರಿಷಿಯನ್‌ಗಳು, ಹೌಸ್‌ಕೀಪಿಂಗ್ ಸಿಬ್ಬಂದಿ, ಭದ್ರತಾ ಕಾವಲುಗಾರರು, ಗೋದಾಮು ಕಾರ್ಮಿಕರು, ಚಿಲ್ಲರೆ ಸಿಬ್ಬಂದಿ, ತಂತ್ರಜ್ಞರು ಅಥವಾ ಸಹಾಯಕರು ಬೇಕಾದರೂ, AsliJobs ನಿಮ್ಮನ್ನು ಸೂಕ್ತ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳ ಬಳಿ ಸುಲಭವಾಗಿ ತಲುಪಿಸುತ್ತದೆ.",
      },
      sections: {
        postJobsEasily: {
          title: "ಉದ್ಯೋಗಗಳನ್ನು ಸುಲಭವಾಗಿ ಪೋಸ್ಟ್ ಮಾಡಿ",
          p1: "ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ, ಸ್ಥಳ, ವೇತನ, ಕೆಲಸದ ಸಮಯ, ಖಾಳಿ ಹುದ್ದೆಗಳ ಸಂಖ್ಯೆ, ಅಗತ್ಯ ಅನುಭವ, ಅಗತ್ಯ ಕೌಶಲ್ಯಗಳು, ಪ್ರಯೋಜನಗಳು ಮತ್ತು ಸಂದರ್ಶನ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಂಡು ಉದ್ಯೋಗದಾತರು AsliJobsನಲ್ಲಿ ಉದ್ಯೋಗಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಬಹುದು.",
          b1: "ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ",
          b2: "ಸ್ಥಳ",
          b3: "ವೇತನ",
          b4: "ಕೆಲಸದ ಸಮಯ",
          b5: "ಖಾಳಿ ಹುದ್ದೆಗಳ ಸಂಖ್ಯೆ",
          b6: "ಅಗತ್ಯ ಅನುಭವ",
          b7: "ಅಗತ್ಯ ಕೌಶಲ್ಯಗಳು",
          b8: "ಪ್ರಯೋಜನಗಳು",
          b9: "ಸಂದರ್ಶನ ವಿವರಗಳು",
        },
        reachSuitableCandidates: {
          title: "ಸೂಕ್ತ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ತಲುಪಿ",
          p1: "ನಿಮ್ಮ ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಆದ ನಂತರ, ಸ್ಥಳ, ಉದ್ಯೋಗ ವರ್ಗ, ಅನುಭವ, ಭಾಷಾ ಆದ್ಯತೆ ಮತ್ತು ಲಭ್ಯತೆಯ ಆಧಾರದ ಮೇಲೆ ಸಂಬಂಧಿತ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳೊಂದಿಗೆ ಅವಕಾಶವನ್ನು ಹಂಚಿಕೊಳ್ಳಲು AsliJobs ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
        },
        manageApplications: {
          title: "ಅರ್ಜಿಗಳನ್ನು ನಿರ್ವಹಿಸಿ",
          p1: "ಉದ್ಯೋಗದಾತರು ಉದ್ಯೋಗದಾತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮೂಲಕ ಅಥವಾ AsliJobs ತಂಡದ ಬೆಂಬಲದೊಂದಿಗೆ ಅರ್ಜಿಗಳನ್ನು ನೋಡಬಹುದು, ಅಭ್ಯರ್ಥಿಗಳನ್ನು ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಮಾಡಬಹುದು, ಸಂದರ್ಶನಗಳನ್ನು ನಿಗದಿಪಡಿಸಬಹುದು ಮತ್ತು ನೇಮಕಾತಿ ಪ್ರಗತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದು.",
        },
        promoteYourJob: {
          title: "ನಿಮ್ಮ ಉದ್ಯೋಗವನ್ನು ಪ್ರಚಾರ ಮಾಡಿ",
          p1: "ಗೋಚರತೆ ಹೆಚ್ಚಿಸಿ ಹೆಚ್ಚು ಸೂಕ್ತ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ತಲುಪಲು ಉದ್ಯೋಗದಾತರು ಪ್ರಚಾರಿತ ಉದ್ಯೋಗಗಳು ಅಥವಾ ಪ್ರಚಾರ ಅಭಿಯಾನಗಳನ್ನು ಆಯ್ಕೆಮಾಡಬಹುದು.",
        },
      },
      cta: {
        title: "AsliJobs ಮೂಲಕ ನೇಮಕಾತಿ ಪ್ರಾರಂಭಿಸಿ",
        p1: "AsliJobsನಲ್ಲಿ ನಿಮ್ಮ ಉದ್ಯೋಗವನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ ಮತ್ತು ಕೆಲಸ ಮಾಡಲು ಸಿದ್ಧರಿರುವ ಅಭ್ಯರ್ಥಿಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಿ.",
        tagline: "ಉದ್ಯೋಗವನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ. ಸೂಕ್ತ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ತಲುಪಿ. ವೇಗವಾಗಿ ನೇಮಿಸಿಕೊಳ್ಳಿ.",
        badge: "ಉದ್ಯೋಗದಾತರಿಗಾಗಿ",
      },
    },
    employerLogin: {
      title: "ಉದ್ಯೋಗದಾತ ಲಾಗಿನ್",
      metaDescription:
        "ಉದ್ಯೋಗ ಪೋಸ್ಟ್‌ಗಳು, ಅರ್ಜಿಗಳು, ಅಭ್ಯರ್ಥಿಗಳು, ಸಂದರ್ಶನಗಳು, ನೇಮಕಾತಿ ಯೋಜನೆಗಳು ಮತ್ತು ಪ್ರಚಾರಗಳನ್ನು ನಿರ್ವಹಿಸಲು ನಿಮ್ಮ AsliJobs ಉದ್ಯೋಗದಾತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಅನ್ನು ಪ್ರವೇಶಿಸಿ.",
      intro: {
        i1: "ಉದ್ಯೋಗ ಪೋಸ್ಟ್‌ಗಳು, ಅರ್ಜಿಗಳು, ಅಭ್ಯರ್ಥಿಗಳು, ಸಂದರ್ಶನಗಳು, ನೇಮಕಾತಿ ಯೋಜನೆಗಳು ಮತ್ತು ಪ್ರಚಾರಗಳನ್ನು ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ ನಿರ್ವಹಿಸಲು ನಿಮ್ಮ AsliJobs ಉದ್ಯೋಗದಾತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಅನ್ನು ಪ್ರವೇಶಿಸಿ.",
      },
      sections: {
        loginToYourEmployerDashboard: {
          title: "ನಿಮ್ಮ ಉದ್ಯೋಗದಾತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಲಾಗಿನ್ ಆಗಿ",
          p1: "ಉದ್ಯೋಗದಾತರು ತಮ್ಮ ನೋಂದಾಯಿತ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ಇಮೇಲ್ ವಿಳಾಸ ಅಥವಾ AsliJobs ನೀಡಿದ ಲಾಗಿನ್ ಆಯ್ಕೆಯಿಂದ ಲಾಗಿನ್ ಆಗಬಹುದು.",
        },
        manageJobPosts: {
          title: "ಉದ್ಯೋಗ ಪೋಸ್ಟ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಿ",
          p1: "ಲಾಗಿನ್ ಆದ ನಂತರ ಉದ್ಯೋಗದಾತರು ಹೊಸ ಉದ್ಯೋಗಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಬಹುದು, ಉದ್ಯೋಗ ವಿವರಗಳನ್ನು ಸಂಪಾದಿಸಬಹುದು, ಖಾಳಿ ಹುದ್ದೆಗಳನ್ನು ನವೀಕರಿಸಬಹುದು, ಉದ್ಯೋಗಗಳನ್ನು ವಿರಾಮಗೊಳಿಸಬಹುದು, ತುಂಬಿದ ಹುದ್ದೆಗಳನ್ನು ಮುಚ್ಚಬಹುದು ಮತ್ತು ಸಕ್ರಿಯ ಉದ್ಯೋಗ ಪೋಸ್ಟ್‌ಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದು.",
        },
        viewApplications: {
          title: "ಅರ್ಜಿಗಳನ್ನು ನೋಡಿ",
          p1: "ಉದ್ಯೋಗದಾತರು ತಮ್ಮ ಉದ್ಯೋಗ ಪೋಸ್ಟ್‌ಗಳಿಗೆ ಬಂದ ಅರ್ಜಿಗಳನ್ನು ನೋಡಬಹುದು, ಅಭ್ಯರ್ಥಿ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಬಹುದು ಮತ್ತು ನೇಮಕಾತಿ ಅಗತ್ಯಗಳ ಆಧಾರದ ಮೇಲೆ ಸೂಕ್ತ ಪ್ರೊಫೈಲ್‌ಗಳನ್ನು ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಮಾಡಬಹುದು.",
        },
        scheduleInterviews: {
          title: "ಸಂದರ್ಶನಗಳನ್ನು ನಿಗದಿಪಡಿಸಿ",
          p1: "ಉದ್ಯೋಗದಾತರು ಸಂದರ್ಶನ ದಿನಾಂಕ, ಸಮಯ, ಸ್ಥಳ ಮತ್ತು ಸಂಪರ್ಕ ವ್ಯಕ್ತಿಯ ವಿವರಗಳನ್ನು ಸೇರಿಸಿ ಸಂದರ್ಶನಗಳನ್ನು ನಿಗದಿಪಡಿಸಬಹುದು. ಅಭ್ಯರ್ಥಿಗಳು WhatsApp ಮೂಲಕ ಸಂದರ್ಶನ ನವೀಕರಣಗಳನ್ನು ಪಡೆಯಬಹುದು.",
        },
        trackHiringProgress: {
          title: "ನೇಮಕಾತಿ ಪ್ರಗತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
          p1: "ಉದ್ಯೋಗದಾತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಅರ್ಜಿ ಸ್ಥಿತಿ, ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಅಭ್ಯರ್ಥಿಗಳು, ನಿಗದಿಯಾದ ಸಂದರ್ಶನಗಳು, ಆಯ್ಕೆಯಾದ ಅಭ್ಯರ್ಥಿಗಳು ಮತ್ತು ಮುಚ್ಚಿದ ಉದ್ಯೋಗ ಪೋಸ್ಟ್‌ಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
        },
        managePlansAndPromotions: {
          title: "ಯೋಜನೆಗಳು ಮತ್ತು ಪ್ರಚಾರಗಳನ್ನು ನಿರ್ವಹಿಸಿ",
          p1: "ಉದ್ಯೋಗದಾತರು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮೂಲಕ ನೇಮಕಾತಿ ಯೋಜನೆಗಳು, ಪ್ರಚಾರಿತ ಉದ್ಯೋಗಗಳು, ಪ್ರಚಾರ ಅಭಿಯಾನಗಳು, ಪಾವತಿಗಳು, ಇನ್‌ವಾಯ್ಸ್‌ಗಳು ಮತ್ತು ನವೀಕರಣ ವಿವರಗಳನ್ನು ನೋಡಬಹುದು.",
        },
        needLoginHelp: {
          title: "ಲಾಗಿನ್ ಸಹಾಯ ಬೇಕೇ?",
          p1: "ನಿಮಗೆ ಲಾಗಿನ್ ಆಗಲು ಸಾಧ್ಯವಾಗದಿದ್ದರೆ ಅಥವಾ ಉದ್ಯೋಗದಾತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಅನ್ನು ಪ್ರವೇಶಿಸಲು ಸಾಧ್ಯವಾಗದಿದ್ದರೆ, WhatsApp, ಕರೆ ಅಥವಾ ಇಮೇಲ್ ಮೂಲಕ AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ.",
          b1: "WhatsApp",
          b2: "ಕರೆ",
          b3: "ಇಮೇಲ್",
        },
      },
      cta: {
        title: "ಉದ್ಯೋಗದಾತ ಲಾಗಿನ್",
        tagline: "ಲಾಗಿನ್ ಆಗಿ. ಉದ್ಯೋಗಗಳನ್ನು ನಿರ್ವಹಿಸಿ. AsliJobs ಮೂಲಕ ವೇಗವಾಗಿ ನೇಮಿಸಿಕೊಳ್ಳಿ.",
        badge: "ಉದ್ಯೋಗದಾತರಿಗಾಗಿ",
      },
    },
    pricingPlans: {
      title: "ಬೆಲೆ ಯೋಜನೆಗಳು",
      metaDescription:
        "ನಿಮ್ಮ ವ್ಯವಹಾರಕ್ಕೆ ಸರಿಯಾದ ನೇಮಕಾತಿ ಯೋಜನೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು AsliJobs ಮೂಲಕ ಸೂಕ್ತ ನೀಲಿ-ಕಾಲರ್ ಮತ್ತು ಬೂದು-ಕಾಲರ್ ಅಭ್ಯರ್ಥಿಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಿ.",
      intro: {
        i1: "ನಿಮ್ಮ ವ್ಯವಹಾರಕ್ಕೆ ಸರಿಯಾದ ನೇಮಕಾತಿ ಯೋಜನೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು AsliJobs ಮೂಲಕ ಸೂಕ್ತ ನೀಲಿ-ಕಾಲರ್ ಮತ್ತು ಬೂದು-ಕಾಲರ್ ಅಭ್ಯರ್ಥಿಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಿ.",
        i2: "ಉದ್ಯೋಗಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಲು, ಅರ್ಜಿಗಳನ್ನು ಪಡೆಯಲು, ಖಾಳಿ ಹುದ್ದೆಗಳನ್ನು ಪ್ರಚಾರ ಮಾಡಲು ಮತ್ತು ನೇಮಕಾತಿಯನ್ನು ಹೆಚ್ಚು ಪರಿಣಾಮಕಾರಿಯಾಗಿ ನಿರ್ವಹಿಸಲು ಬಯಸುವ ಉದ್ಯೋಗದಾತರಿಗೆ AsliJobs ಪಾವತಿ ನೇಮಕಾತಿ ಯೋಜನೆಗಳನ್ನು ನೀಡುತ್ತದೆ.",
      },
      sections: {
        simplePlansForEveryHiringNeed: {
          title: "ಪ್ರತಿ ನೇಮಕಾತಿ ಅಗತ್ಯಕ್ಕೆ ಸರಳ ಯೋಜನೆಗಳು",
          p1: "ಒಂದು ಪಾತ್ರಕ್ಕೆ ನೇಮಿಸುತ್ತಿದ್ದರೂ ಅಥವಾ ಅನೇಕ ಖಾಳಿ ಹುದ್ದೆಗಳಿಗೆ ನೇಮಿಸುತ್ತಿದ್ದರೂ, ಸ್ಥಳ, ಉದ್ಯೋಗ ವರ್ಗ, ಅನುಭವ, ಭಾಷಾ ಆದ್ಯತೆ ಮತ್ತು ಲಭ್ಯತೆಯ ಆಧಾರದ ಮೇಲೆ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳನ್ನು ತಲುಪಲು AsliJobs ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
        },
        employerHiringPlans: {
          title: "ಉದ್ಯೋಗದಾತ ನೇಮಕಾತಿ ಯೋಜನೆಗಳು",
          cards: {
            basicHiringPlan: {
              title: "ಮೂಲ ನೇಮಕಾತಿ ಯೋಜನೆ",
              description:
                "ಯಾರಿಗೆ ಉತ್ತಮ: ಸೀಮಿತ ನೇಮಕಾತಿ ಅಗತ್ಯಗಳಿರುವ ಉದ್ಯೋಗದಾತರು. ಇದರಲ್ಲಿ ಸೇರಿದೆ: ಉದ್ಯೋಗ ಪೋಸ್ಟ್, ಅಭ್ಯರ್ಥಿ ಅರ್ಜಿಗಳು ಮತ್ತು ಮೂಲ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪ್ರವೇಶ.",
            },
            standardHiringPlan: {
              title: "ಪ್ರಮಾಣಿತ ನೇಮಕಾತಿ ಯೋಜನೆ",
              description:
                "ಯಾರಿಗೆ ಉತ್ತಮ: ನಿಯಮಿತವಾಗಿ ನೇಮಿಸುವ ಉದ್ಯೋಗದಾತರು. ಇದರಲ್ಲಿ ಸೇರಿದೆ: ಅನೇಕ ಉದ್ಯೋಗ ಪೋಸ್ಟ್‌ಗಳು, ಹೆಚ್ಚು ಅಭ್ಯರ್ಥಿ ತಲುಪುವಿಕೆ, ಅರ್ಜಿ ಟ್ರ್ಯಾಕಿಂಗ್ ಮತ್ತು ಬೆಂಬಲ.",
            },
            premiumHiringPlan: {
              title: "ಪ್ರೀಮಿಯಂ ನೇಮಕಾತಿ ಯೋಜನೆ",
              description:
                "ಯಾರಿಗೆ ಉತ್ತಮ: ವೇಗವಾದ ನೇಮಕಾತಿ ಬೇಕಾದ ಉದ್ಯೋಗದಾತರು. ಇದರಲ್ಲಿ ಸೇರಿದೆ: ಹೆಚ್ಚು ಗೋಚರತೆ, ಪ್ರಚಾರಿತ ಉದ್ಯೋಗ ಆಯ್ಕೆಗಳು, ಆದ್ಯತೆ ಬೆಂಬಲ ಮತ್ತು ಉತ್ತಮ ಅಭ್ಯರ್ಥಿ ತಲುಪುವಿಕೆ.",
            },
            campaignHiringPlan: {
              title: "ಪ್ರಚಾರ ನೇಮಕಾತಿ ಯೋಜನೆ",
              description:
                "ಯಾರಿಗೆ ಉತ್ತಮ: ಬೃಹತ್ ಅಥವಾ ತುರ್ತು ನೇಮಕಾತಿ ಅಗತ್ಯಗಳಿರುವ ಉದ್ಯೋಗದಾತರು. ಇದರಲ್ಲಿ ಸೇರಿದೆ: ಗುರಿಯಿಟ್ಟ ನೇಮಕಾತಿ ಅಭಿಯಾನಗಳು, ಸ್ಥಳ ಆಧಾರಿತ ತಲುಪುವಿಕೆ, WhatsApp ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ನೇಮಕಾತಿ ಬೆಂಬಲ.",
            },
          },
        },
        whatEmployersCanDo: {
          title: "ಉದ್ಯೋಗದಾತರು ಏನು ಮಾಡಬಹುದು",
          b1: "ಉದ್ಯೋಗಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ",
          b2: "ಅಭ್ಯರ್ಥಿ ಅರ್ಜಿಗಳನ್ನು ಪಡೆಯಿರಿ",
          b3: "ಅಭ್ಯರ್ಥಿ ವಿವರಗಳನ್ನು ನೋಡಿ",
          b4: "ಸೂಕ್ತ ಪ್ರೊಫೈಲ್‌ಗಳನ್ನು ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಮಾಡಿ",
          b5: "ಸಂದರ್ಶನಗಳನ್ನು ನಿಗದಿಪಡಿಸಿ",
          b6: "ನೇಮಕಾತಿ ಪ್ರಗತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
          b7: "ಉದ್ಯೋಗ ಖಾಳಿ ಹುದ್ದೆಗಳನ್ನು ಪ್ರಚಾರ ಮಾಡಿ",
          b8: "ನೇಮಕಾತಿ ಸಂಬಂಧಿತ ಪ್ರಶ್ನೆಗಳಿಗೆ ಬೆಂಬಲ ಪಡೆಯಿರಿ",
        },
        promotedJobs: {
          title: "ಪ್ರಚಾರಿತ ಉದ್ಯೋಗಗಳು",
          p1: "ಮುಖ್ಯ ಅಥವಾ ತುರ್ತು ಖಾಳಿ ಹುದ್ದೆಗಳ ಗೋಚರತೆ ಹೆಚ್ಚಿಸಲು ಪ್ರಚಾರಿತ ಉದ್ಯೋಗಗಳು ಉದ್ಯೋಗದಾತರಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತವೆ. ಈ ಉದ್ಯೋಗಗಳು ಸ್ಥಳ, ಉದ್ಯೋಗ ಪಾತ್ರ ಮತ್ತು ಅಭ್ಯರ್ಥಿ ಪ್ರೊಫೈಲ್ ಆಧಾರದ ಮೇಲೆ ಹೆಚ್ಚು ಸಂಬಂಧಿತ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳನ್ನು ತಲುಪಬಹುದು.",
        },
        campaignPromotions: {
          title: "ಪ್ರಚಾರ ಅಭಿಯಾನಗಳು",
          p1: "ಬೃಹತ್ ಪ್ರಮಾಣದಲ್ಲಿ ನೇಮಿಸಲು ಬಯಸುವ, ನಿರ್ದಿಷ್ಟ ಸ್ಥಳಗಳನ್ನು ಗುರಿಯಾಗಿಸಲು ಬಯಸುವ ಅಥವಾ ಆಯ್ಕೆಮಾಡಿದ ಉದ್ಯೋಗ ವರ್ಗಗಳಲ್ಲಿನ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳನ್ನು ತಲುಪಲು ಬಯಸುವ ಉದ್ಯೋಗದಾತರಿಗೆ ಪ್ರಚಾರ ಅಭಿಯಾನಗಳು ಉಪಯುಕ್ತ.",
        },
        paymentsAndInvoices: {
          title: "ಪಾವತಿಗಳು ಮತ್ತು ಇನ್‌ವಾಯ್ಸ್‌ಗಳು",
          p1: "ಉದ್ಯೋಗದಾತರು ಸೂಕ್ತ ಯೋಜನೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ ಲಭ್ಯವಿರುವ ಪಾವತಿ ಆಯ್ಕೆಗಳ ಮೂಲಕ ಪಾವತಿ ಪೂರ್ಣಗೊಳಿಸಬಹುದು. ಪಾವತಿಯ ನಂತರ AsliJobs ಬೆಂಬಲದ ಮೂಲಕ ಇನ್‌ವಾಯ್ಸ್‌ಗಳನ್ನು ಕೇಳಬಹುದು.",
        },
        needHelpChoosingAPlan: {
          title: "ಯೋಜನೆ ಆಯ್ಕೆಮಾಡಲು ಸಹಾಯ ಬೇಕೇ?",
          p1: "ನಿಮ್ಮ ನೇಮಕಾತಿ ಅಗತ್ಯಕ್ಕೆ ಯಾವ ಯೋಜನೆ ಸರಿಯಾಗಿದೆ ಎಂದು ಖಚಿತವಿಲ್ಲದಿದ್ದರೆ AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ. ನಿಮ್ಮ ಉದ್ಯೋಗ ಪಾತ್ರ, ಸ್ಥಳ, ಖಾಳಿ ಹುದ್ದೆಗಳ ಸಂಖ್ಯೆ ಮತ್ತು ನೇಮಕಾತಿ ತುರ್ತಿನ ಆಧಾರದ ಮೇಲೆ ಸೂಕ್ತ ಯೋಜನೆಯನ್ನು ಆಯ್ಕೆಮಾಡಲು ನಮ್ಮ ತಂಡ ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
        },
      },
      cta: {
        title: "AsliJobs ಮೂಲಕ ನೇಮಕಾತಿ ಪ್ರಾರಂಭಿಸಿ",
        tagline: "ಯೋಜನೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ. ನಿಮ್ಮ ಉದ್ಯೋಗವನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ. AsliJobs ಮೂಲಕ ನೇಮಕಾತಿ ಪ್ರಾರಂಭಿಸಿ.",
        badge: "ಉದ್ಯೋಗದಾತರಿಗಾಗಿ",
      },
    },
    employerGuide: {
      title: "ಉದ್ಯೋಗದಾತ ಮಾರ್ಗದರ್ಶಿ",
      metaDescription:
        "ಸರಳ, WhatsApp-ಸ್ನೇಹಿ ನೇಮಕಾತಿ ಪ್ರಕ್ರಿಯೆ ಮೂಲಕ ಸೂಕ್ತ ನೀಲಿ-ಕಾಲರ್ ಮತ್ತು ಬೂದು-ಕಾಲರ್ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ನೇಮಿಸಿಕೊಳ್ಳಲು AsliJobs ಉದ್ಯೋಗದಾತರಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
      intro: {
        i1: "ಸರಳ, WhatsApp-ಸ್ನೇಹಿ ನೇಮಕಾತಿ ಪ್ರಕ್ರಿಯೆ ಮೂಲಕ ಸೂಕ್ತ ನೀಲಿ-ಕಾಲರ್ ಮತ್ತು ಬೂದು-ಕಾಲರ್ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ನೇಮಿಸಿಕೊಳ್ಳಲು AsliJobs ಉದ್ಯೋಗದಾತರಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ. ಒಂದು ಪಾತ್ರಕ್ಕೆ ನೇಮಿಸುತ್ತಿದ್ದರೂ ಅಥವಾ ಅನೇಕ ಖಾಳಿ ಹುದ್ದೆಗಳಿಗೆ ನೇಮಿಸುತ್ತಿದ್ದರೂ, ಸ್ಥಳ, ಉದ್ಯೋಗ ವರ್ಗ, ಅನುಭವ, ಕೌಶಲ್ಯಗಳು, ಭಾಷಾ ಆದ್ಯತೆ ಮತ್ತು ಲಭ್ಯತೆಯ ಆಧಾರದ ಮೇಲೆ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳನ್ನು ತಲುಪಲು AsliJobs ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
      },
      sections: {
        registerAsAnEmployer: {
          title: "ಉದ್ಯೋಗದಾತರಾಗಿ ನೋಂದಾಯಿಸಿಕೊಳ್ಳಿ",
          p1: "AsliJobsನಲ್ಲಿ ನಿಮ್ಮ ಉದ್ಯೋಗದಾತ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ ಪ್ರಾರಂಭಿಸಿ. ಉದ್ಯೋಗದಾತ ಹೆಸರು, ಕಂಪನಿ ಹೆಸರು, ಸಂಪರ್ಕ ವ್ಯಕ್ತಿಯ ವಿವರಗಳು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ಸ್ಥಳ, ವ್ಯವಹಾರ ಪ್ರಕಾರ, ನೇಮಕಾತಿ ವರ್ಗಗಳು ಮತ್ತು ಆದ್ಯತೆಯ ಭಾಷೆಯಂತಹ ಮೂಲ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.",
          b1: "ಉದ್ಯೋಗದಾತ ಹೆಸರು",
          b2: "ಕಂಪನಿ ಹೆಸರು",
          b3: "ಸಂಪರ್ಕ ವ್ಯಕ್ತಿಯ ವಿವರಗಳು",
          b4: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
          b5: "ಸ್ಥಳ",
          b6: "ವ್ಯವಹಾರ ಪ್ರಕಾರ",
          b7: "ನೇಮಕಾತಿ ವರ್ಗಗಳು",
          b8: "ಆದ್ಯತೆಯ ಭಾಷೆ",
        },
        postAJob: {
          title: "ಉದ್ಯೋಗವನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ",
          p1: "ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ, ವೇತನ ವ್ಯಾಪ್ತಿ, ಕೆಲಸದ ಸ್ಥಳ, ಸಮಯ, ಖಾಳಿ ಹುದ್ದೆಗಳ ಸಂಖ್ಯೆ, ಅಗತ್ಯ ಅನುಭವ, ಅಗತ್ಯ ಕೌಶಲ್ಯಗಳು, ಪ್ರಯೋಜನಗಳು ಮತ್ತು ಸಂದರ್ಶನ ವಿವರಗಳಂತಹ ಸ್ಪಷ್ಟ ವಿವರಗಳನ್ನು ಸೇರಿಸಿ ನಿಮ್ಮ ಉದ್ಯೋಗವನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ. ಸ್ಪಷ್ಟ ಉದ್ಯೋಗ ವಿವರಗಳು ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ಅವಕಾಶವನ್ನು ಉತ್ತಮವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಂಡು ವಿಶ್ವಾಸದಿಂದ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ.",
        },
        receiveApplications: {
          title: "ಅರ್ಜಿಗಳನ್ನು ಪಡೆಯಿರಿ",
          p1: "ನಿಮ್ಮ ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಆದ ನಂತರ ಸೂಕ್ತ ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ಉದ್ಯೋಗವನ್ನು ನೋಡಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು. ಅರ್ಜಿಗಳನ್ನು ಉದ್ಯೋಗದಾತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮೂಲಕ ಅಥವಾ AsliJobs ತಂಡದ ಬೆಂಬಲದೊಂದಿಗೆ ನಿರ್ವಹಿಸಬಹುದು.",
        },
        shortlistCandidates: {
          title: "ಅಭ್ಯರ್ಥಿಗಳನ್ನು ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಮಾಡಿ",
          p1: "ಹೆಸರು, ಸ್ಥಳ, ಅನುಭವ, ಕೌಶಲ್ಯಗಳು, ನಿರೀಕ್ಷಿತ ವೇತನ, ಲಭ್ಯತೆ ಮತ್ತು ಆದ್ಯತೆಯ ಭಾಷೆಯಂತಹ ಅಭ್ಯರ್ಥಿ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ. ನಿಮ್ಮ ನೇಮಕಾತಿ ಅಗತ್ಯಗಳಿಗೆ ಹೊಂದುವ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಮಾಡಿ.",
        },
        scheduleInterviews: {
          title: "ಸಂದರ್ಶನಗಳನ್ನು ನಿಗದಿಪಡಿಸಿ",
          p1: "ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಮಾಡಿದ ನಂತರ ಸಂದರ್ಶನ ದಿನಾಂಕ, ಸಮಯ, ಸ್ಥಳ ಮತ್ತು ಸಂಪರ್ಕ ವ್ಯಕ್ತಿಯ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಂಡು ಸಂದರ್ಶನಗಳನ್ನು ನಿಗದಿಪಡಿಸಿ. ಅಭ್ಯರ್ಥಿಗಳು WhatsApp ಮೂಲಕ ಸಂದರ್ಶನ ನವೀಕರಣಗಳನ್ನು ಪಡೆಯಬಹುದು.",
        },
        trackHiringProgress: {
          title: "ನೇಮಕಾತಿ ಪ್ರಗತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
          p1: "ಅರ್ಜಿಗಳು, ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಅಭ್ಯರ್ಥಿಗಳು, ನಿಗದಿಯಾದ ಸಂದರ್ಶನಗಳು, ಆಯ್ಕೆಯಾದ ಅಭ್ಯರ್ಥಿಗಳು ಮತ್ತು ಮುಚ್ಚಿದ ಉದ್ಯೋಗ ಪೋಸ್ಟ್‌ಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಉದ್ಯೋಗದಾತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಬಳಸಿ.",
        },
        promoteJobOpenings: {
          title: "ಉದ್ಯೋಗ ಖಾಳಿ ಹುದ್ದೆಗಳನ್ನು ಪ್ರಚಾರ ಮಾಡಿ",
          p1: "ಉದ್ಯೋಗ ಗೋಚರತೆಯನ್ನು ಸುಧಾರಿಸಿ ಹೆಚ್ಚು ಸೂಕ್ತ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ವೇಗವಾಗಿ ತಲುಪಲು ಉದ್ಯೋಗದಾತರು ಪ್ರಚಾರಿತ ಉದ್ಯೋಗಗಳು ಅಥವಾ ಪ್ರಚಾರ ಅಭಿಯಾನಗಳನ್ನು ಆಯ್ಕೆಮಾಡಬಹುದು.",
        },
        updateOrCloseJobPosts: {
          title: "ಉದ್ಯೋಗ ಪೋಸ್ಟ್‌ಗಳನ್ನು ನವೀಕರಿಸಿ ಅಥವಾ ಮುಚ್ಚಿ",
          p1: "ನಿಮ್ಮ ಉದ್ಯೋಗ ಪೋಸ್ಟ್‌ಗಳನ್ನು ನವೀಕೃತವಾಗಿಡಿ. ಹುದ್ದೆ ತುಂಬಿದರೆ, ವಿರಾಮಗೊಳಿಸಿದರೆ, ರದ್ದಾದರೆ ಅಥವಾ ಇನ್ನು ಲಭ್ಯವಿಲ್ಲದಿದ್ದರೆ, ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮೂಲಕ ಅಥವಾ AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಅನ್ನು ನವೀಕರಿಸಿ ಅಥವಾ ಮುಚ್ಚಿ.",
        },
        getEmployerSupport: {
          title: "ಉದ್ಯೋಗದಾತ ಬೆಂಬಲ ಪಡೆಯಿರಿ",
          p1: "ಉದ್ಯೋಗ ಪೋಸ್ಟ್, ಅರ್ಜಿಗಳು, ಅಭ್ಯರ್ಥಿ ಶಾರ್ಟ್‌ಲಿಸ್ಟಿಂಗ್, ಸಂದರ್ಶನಗಳು, ಪಾವತಿಗಳು, ಇನ್‌ವಾಯ್ಸ್‌ಗಳು, ಪ್ರಚಾರಗಳು ಅಥವಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಬೆಂಬಲಕ್ಕಾಗಿ ಉದ್ಯೋಗದಾತರು WhatsApp, ಕರೆ ಅಥವಾ ಇಮೇಲ್ ಮೂಲಕ AsliJobs ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು.",
          b1: "WhatsApp",
          b2: "ಕರೆ",
          b3: "ಇಮೇಲ್",
          b4: "ಉದ್ಯೋಗ ಪೋಸ್ಟ್",
          b5: "ಅರ್ಜಿಗಳು",
          b6: "ಅಭ್ಯರ್ಥಿ ಶಾರ್ಟ್‌ಲಿಸ್ಟಿಂಗ್",
          b7: "ಸಂದರ್ಶನಗಳು",
          b8: "ಪಾವತಿಗಳು",
          b9: "ಇನ್‌ವಾಯ್ಸ್‌ಗಳು",
          b10: "ಪ್ರಚಾರಗಳು",
          b11: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಬೆಂಬಲ",
        },
        hiringTipsForEmployers: {
          title: "ಉದ್ಯೋಗದಾತರಿಗೆ ನೇಮಕಾತಿ ಸಲಹೆಗಳು",
          b1: "ಪೂರ್ಣ ಮತ್ತು ಸ್ಪಷ್ಟ ಉದ್ಯೋಗ ವಿವರಗಳನ್ನು ಸೇರಿಸಿ.",
          b2: "ಸರಿಯಾದ ವೇತನ, ಸ್ಥಳ ಮತ್ತು ಕೆಲಸದ ಸಮಯವನ್ನು ತಿಳಿಸಿ.",
          b3: "ಅರ್ಜಿಗಳಿಗೆ ಸಮಯಕ್ಕೆ ಉತ್ತರಿಸಿ.",
          b4: "ಸಂದರ್ಶನ ವಿವರಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಹಂಚಿಕೊಳ್ಳಿ.",
          b5: "ಅನಗತ್ಯ ಅರ್ಜಿಗಳನ್ನು ತಪ್ಪಿಸಲು ತುಂಬಿದ ಉದ್ಯೋಗಗಳನ್ನು ಮುಚ್ಚಿ.",
          b6: "ತುರ್ತು ಅಥವಾ ಬೃಹತ್ ನೇಮಕಾತಿ ಅಗತ್ಯಗಳಿಗೆ ಪ್ರಚಾರಗಳನ್ನು ಬಳಸಿ.",
        },
      },
      cta: {
        title: "AsliJobs ಮೂಲಕ ನೇಮಕಾತಿ ಪ್ರಾರಂಭಿಸಿ",
        p1: "ಸರಳ ಮತ್ತು ಪರಿಚಿತ ವೇದಿಕೆ ಮೂಲಕ ಉದ್ಯೋಗದಾತರನ್ನು ಸೂಕ್ತ ಕಾರ್ಮಿಕ ಅಭ್ಯರ್ಥಿಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಿ AsliJobs ನೇಮಕಾತಿಯನ್ನು ಸುಲಭಗೊಳಿಸುತ್ತದೆ.",
        tagline: "ನಿಮ್ಮ ಉದ್ಯೋಗದಾತ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ. ಉದ್ಯೋಗವನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ. AsliJobs ಮೂಲಕ ವೇಗವಾಗಿ ನೇಮಿಸಿಕೊಳ್ಳಿ.",
        badge: "ಉದ್ಯೋಗದಾತರಿಗಾಗಿ",
      },
    },
    interviewTips: {
      title: "ಸಂದರ್ಶನ ಸಲಹೆಗಳು",
      metaDescription:
        "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ಚೆನ್ನಾಗಿ ತಯಾರಾಗಿ, ಆತ್ಮವಿಶ್ವಾಸದಿಂದ ಸಂದರ್ಶನಕ್ಕೆ ಹಾಜರಾಗಿ, ಆಯ್ಕೆಯಾಗಲು ಸಹಾಯ ಮಾಡುವ ಸರಳ ಸಂದರ್ಶನ ಸಲಹೆಗಳು.",
      intro: {
        i1: "ಸ್ವಲ್ಪ ತಯಾರಿ ನಿಮಗೆ ಸಂದರ್ಶನದಲ್ಲಿ ಆತ್ಮವಿಶ್ವಾಸ ನೀಡುತ್ತದೆ ಮತ್ತು ಉತ್ತಮ ಅಭಿಪ್ರಾಯ ಮೂಡಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ. ಸಂದರ್ಶನದ ಮೊದಲು, ಸಂದರ್ಶನದ ಸಮಯದಲ್ಲಿ ಮತ್ತು ನಂತರ ಈ ಸರಳ ಸಲಹೆಗಳನ್ನು ಅನುಸರಿಸಿ.",
      },
      sections: {
        prepareBeforeTheInterview: {
          title: "ಸಂದರ್ಶನಕ್ಕೆ ಮೊದಲು ತಯಾರಾಗಿ",
          p1: "ಉದ್ಯೋಗದ ಪಾತ್ರ, ಸಂಬಳ, ಕೆಲಸದ ಸ್ಥಳ ಮತ್ತು ಸಮಯ ಸೇರಿದಂತೆ ಉದ್ಯೋಗದ ವಿವರಗಳನ್ನು ಮತ್ತೊಮ್ಮೆ ಓದಿ. ನಿಮ್ಮ ಕೌಶಲ್ಯಗಳು ಮತ್ತು ಅನುಭವ ಈ ಉದ್ಯೋಗಕ್ಕೆ ಹೇಗೆ ಹೊಂದುತ್ತವೆ ಎಂದು ಯೋಚಿಸಿ.",
        },
        documentsToCarry: {
          title: "ತೆಗೆದುಕೊಂಡು ಹೋಗಬೇಕಾದ ದಾಖಲೆಗಳು",
          p1: "ಸಂದರ್ಶನದ ದಿನ ಆತುರ ಆಗದಂತೆ ನಿಮ್ಮ ದಾಖಲೆಗಳನ್ನು ಒಂದು ದಿನ ಮೊದಲೇ ಸಿದ್ಧವಾಗಿಡಿ.",
          b1: "ಆಧಾರ್ ಕಾರ್ಡ್‌ನಂತಹ ಗುರುತಿನ ಪುರಾವೆ",
          b2: "ರೆಸ್ಯೂಮೆ ಅಥವಾ ಪ್ರೊಫೈಲ್ ವಿವರಗಳು",
          b3: "ಅನುಭವ ಅಥವಾ ಸಂಬಳ ಪ್ರಮಾಣಪತ್ರಗಳು, ಇದ್ದರೆ",
          b4: "ಶೈಕ್ಷಣಿಕ ಪ್ರಮಾಣಪತ್ರಗಳು, ಅಗತ್ಯವಿದ್ದರೆ",
          b5: "ಪಾಸ್‌ಪೋರ್ಟ್ ಅಳತೆಯ ಫೋಟೋಗಳು",
        },
        onTheInterviewDay: {
          title: "ಸಂದರ್ಶನದ ದಿನ",
          p1: "ನಿಮ್ಮ ಪ್ರಯಾಣವನ್ನು ಯೋಜಿಸಿ ಸಂದರ್ಶನದ ಸ್ಥಳಕ್ಕೆ 10 ರಿಂದ 15 ನಿಮಿಷ ಮುಂಚಿತವಾಗಿ ತಲುಪಿ. ಸ್ವಚ್ಛ, ಅಚ್ಚುಕಟ್ಟಾದ ಬಟ್ಟೆ ಧರಿಸಿ ಮತ್ತು ನಿಮ್ಮ ಫೋನ್ ಅನ್ನು ಸೈಲೆಂಟ್‌ನಲ್ಲಿಡಿ.",
          b1: "ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ತಲುಪಿ",
          b2: "ಅಚ್ಚುಕಟ್ಟಾಗಿ ಬಟ್ಟೆ ಧರಿಸಿ",
          b3: "ವಿನಯದಿಂದ ನಮಸ್ಕರಿಸಿ",
          b4: "ಫೋನ್ ಅನ್ನು ಸೈಲೆಂಟ್‌ನಲ್ಲಿಡಿ",
        },
        answerWithConfidence: {
          title: "ಆತ್ಮವಿಶ್ವಾಸದಿಂದ ಉತ್ತರಿಸಿ",
          p1: "ಗಮನವಿಟ್ಟು ಕೇಳಿ, ಪ್ರಾಮಾಣಿಕವಾಗಿ ಉತ್ತರಿಸಿ ಮತ್ತು ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ. ಇಂತಹ ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳಿಗೆ ಸಿದ್ಧರಾಗಿರಿ.",
          b1: "ನಿಮ್ಮ ಬಗ್ಗೆ ಹೇಳಿ.",
          b2: "ನೀವು ಹಿಂದೆ ಯಾವ ಕೆಲಸ ಮಾಡಿದ್ದೀರಿ?",
          b3: "ನೀವು ಯಾವಾಗ ಸೇರಬಹುದು?",
          b4: "ನೀವು ಎಷ್ಟು ಸಂಬಳ ನಿರೀಕ್ಷಿಸುತ್ತೀರಿ?",
        },
        afterTheInterview: {
          title: "ಸಂದರ್ಶನದ ನಂತರ",
          p1: "ಹೊರಡುವ ಮೊದಲು ಸಂದರ್ಶಕರಿಗೆ ಧನ್ಯವಾದ ಹೇಳಿ. ಸಂದರ್ಶನದ ಫಲಿತಾಂಶ ಮತ್ತು ಮುಂದಿನ ಹಂತಗಳನ್ನು WhatsApp ನಲ್ಲಿ ಕಳುಹಿಸಲಾಗುತ್ತದೆ, ಆದ್ದರಿಂದ ನಿಮ್ಮ ಸಂದೇಶಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತಿರಿ ಮತ್ತು ಸಮಯಕ್ಕೆ ಉತ್ತರಿಸಿ.",
        },
        staySafe: {
          title: "ಸುರಕ್ಷಿತವಾಗಿರಿ",
          p1: "ನಿಜವಾದ ಉದ್ಯೋಗದಾತರು ಸಂದರ್ಶನ ನಿಗದಿಪಡಿಸಲು ಅಥವಾ ಉದ್ಯೋಗ ಖಚಿತಪಡಿಸಲು ಹಣ ಕೇಳುವುದಿಲ್ಲ. ಯಾರಾದರೂ ಹಣ ಕೇಳಿದರೆ, ಪಾವತಿಸಬೇಡಿ ಮತ್ತು ತಕ್ಷಣ AsliJobs ಬೆಂಬಲಕ್ಕೆ ವರದಿ ಮಾಡಿ.",
          b1: "ಸಂದರ್ಶನ ಅಥವಾ ಉದ್ಯೋಗ ಖಚಿತಪಡಿಸುವಿಕೆಗಾಗಿ ಹಣ ಪಾವತಿಸಬೇಡಿ.",
          b2: "ಉದ್ಯೋಗ ವಿವರಗಳಲ್ಲಿ ನೀಡಿದ ವಿಳಾಸದಲ್ಲಿ ಮಾತ್ರ ಸಂದರ್ಶನಕ್ಕೆ ಹಾಜರಾಗಿ.",
          b3: "ಅನುಮಾನಾಸ್ಪದ ಬೇಡಿಕೆಗಳನ್ನು AsliJobs ಬೆಂಬಲಕ್ಕೆ ವರದಿ ಮಾಡಿ.",
        },
      },
      cta: {
        title: "WhatsApp ನಲ್ಲಿ ಸಂದರ್ಶನದ ಅಪ್‌ಡೇಟ್‌ಗಳನ್ನು ಪಡೆಯಿರಿ",
        p1: "ಸೂಕ್ತ ಉದ್ಯೋಗಗಳಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ಮತ್ತು ಸಂದರ್ಶನದ ವಿವರಗಳನ್ನು ನೇರವಾಗಿ WhatsApp ನಲ್ಲಿ ಪಡೆಯಿರಿ.",
        tagline: "ಚೆನ್ನಾಗಿ ತಯಾರಾಗಿ. ಸಮಯಕ್ಕೆ ಹಾಜರಾಗಿ. ಆಯ್ಕೆಯಾಗಿ.",
        badge: "WhatsApp",
      },
    },
    salaryGuide: {
      title: "ಸಂಬಳ ಮಾರ್ಗದರ್ಶಿ",
      metaDescription:
        "ಉದ್ಯೋಗವನ್ನು ಒಪ್ಪಿಕೊಳ್ಳುವ ಮೊದಲು ಉದ್ಯೋಗ ಆಫರ್‌ನಲ್ಲಿನ ಸಂಬಳದ ವಿವರಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ — ಕೈಗೆ ಬರುವ ಸಂಬಳ, ಕಡಿತಗಳು, ಹೆಚ್ಚುವರಿ ವೇತನ ಮತ್ತು ಪಾವತಿ ವೇಳಾಪಟ್ಟಿ.",
      intro: {
        i1: "ಯಾವುದೇ ಉದ್ಯೋಗದಲ್ಲಿ ಸಂಬಳ ಅತ್ಯಂತ ಮುಖ್ಯ ಭಾಗ. ಉದ್ಯೋಗ ಅಲರ್ಟ್ ಅಥವಾ ಆಫರ್‌ನಲ್ಲಿನ ಸಂಬಳದ ವಿವರಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡು ಸರಿಯಾದ ನಿರ್ಧಾರ ತೆಗೆದುಕೊಳ್ಳಲು ಈ ಮಾರ್ಗದರ್ಶಿ ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
      },
      sections: {
        checkTheSalaryInJobDetails: {
          title: "ಉದ್ಯೋಗ ವಿವರಗಳಲ್ಲಿ ಸಂಬಳವನ್ನು ಪರಿಶೀಲಿಸಿ",
          p1: "AsliJobs ನಲ್ಲಿನ ಪ್ರತಿಯೊಂದು ಉದ್ಯೋಗದಲ್ಲಿ ಉದ್ಯೋಗದಾತರು ನೀಡುವ ಸಂಬಳವನ್ನು ತೋರಿಸಲಾಗುತ್ತದೆ. ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ಉದ್ಯೋಗದ ಪಾತ್ರ, ಕೆಲಸದ ಸಮಯ ಮತ್ತು ಸ್ಥಳದೊಂದಿಗೆ ಅದನ್ನು ಎಚ್ಚರಿಕೆಯಿಂದ ಓದಿ.",
        },
        inHandSalaryAndDeductions: {
          title: "ಕೈಗೆ ಬರುವ ಸಂಬಳ ಮತ್ತು ಕಡಿತಗಳು",
          p1: "ಕಡಿತಗಳ ನಂತರ ನಿಮಗೆ ಸಿಗುವ ಮೊತ್ತವೇ ಕೈಗೆ ಬರುವ ಸಂಬಳ. ತೋರಿಸಿರುವ ಸಂಬಳ ಕೈಗೆ ಬರುವ ಸಂಬಳವೇ ಅಥವಾ PF ಅಥವಾ ESI ನಂತಹ ಕಡಿತಗಳ ಮೊದಲಿನದೇ ಎಂದು ಉದ್ಯೋಗದಾತರನ್ನು ಕೇಳಿ.",
          b1: "ಕೈಗೆ ಬರುವ (ಟೇಕ್-ಹೋಮ್) ಸಂಬಳ",
          b2: "PF (ಭವಿಷ್ಯ ನಿಧಿ)",
          b3: "ESI (ನೌಕರರ ರಾಜ್ಯ ವಿಮೆ)",
          b4: "ಇತರ ಕಡಿತಗಳು, ಯಾವುದಾದರೂ ಇದ್ದರೆ",
        },
        extraPayAndBenefits: {
          title: "ಹೆಚ್ಚುವರಿ ವೇತನ ಮತ್ತು ಸೌಲಭ್ಯಗಳು",
          p1: "ಕೆಲವು ಉದ್ಯೋಗಗಳಲ್ಲಿ ಸಂಬಳದ ಜೊತೆಗೆ ಹೆಚ್ಚುವರಿ ವೇತನ ಅಥವಾ ಸೌಲಭ್ಯಗಳು ಇರುತ್ತವೆ. ಅದರಲ್ಲಿ ಏನೇನು ಸೇರಿದೆ ಎಂದು ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿ.",
          b1: "ಓವರ್‌ಟೈಮ್ ವೇತನ",
          b2: "ಪ್ರೋತ್ಸಾಹ ಧನ",
          b3: "ಊಟ ಅಥವಾ ವಸತಿ",
          b4: "ಪ್ರಯಾಣ ಭತ್ಯೆ",
          b5: "ವಾರದ ರಜೆ ಮತ್ತು ವೇತನ ಸಹಿತ ರಜೆ",
        },
        salaryPaymentSchedule: {
          title: "ಸಂಬಳ ಪಾವತಿ ವೇಳಾಪಟ್ಟಿ",
          p1: "ಸಂಬಳವನ್ನು ಯಾವಾಗ ಮತ್ತು ಹೇಗೆ ಪಾವತಿಸಲಾಗುತ್ತದೆ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ — ಮಾಸಿಕ, ವಾರಕ್ಕೊಮ್ಮೆ ಅಥವಾ ದಿನಕ್ಕೊಮ್ಮೆ, ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆಯ ಮೂಲಕವೇ ಅಥವಾ ನಗದಾಗಿಯೇ. ನಿಮ್ಮ ಸಂಬಳ ಪಾವತಿಗಳ ದಾಖಲೆ ಇಟ್ಟುಕೊಳ್ಳಿ.",
        },
        whatAffectsYourSalary: {
          title: "ನಿಮ್ಮ ಸಂಬಳದ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರುವ ಅಂಶಗಳು",
          p1: "ಈ ಅಂಶಗಳ ಆಧಾರದ ಮೇಲೆ ಸಂಬಳ ಬದಲಾಗಬಹುದು. ನಿಮ್ಮ ಕೌಶಲ್ಯಗಳನ್ನು ಸುಧಾರಿಸಿ ಮತ್ತು ಪ್ರೊಫೈಲ್ ಅನ್ನು ಅಪ್‌ಡೇಟ್ ಮಾಡಿಟ್ಟರೆ ಉತ್ತಮ ಸಂಬಳದ ಉದ್ಯೋಗಗಳು ಸಿಗಬಹುದು.",
          b1: "ಅನುಭವ",
          b2: "ಕೌಶಲ್ಯಗಳು",
          b3: "ಉದ್ಯೋಗ ವರ್ಗ",
          b4: "ನಗರ ಮತ್ತು ಸ್ಥಳ",
          b5: "ಶಿಫ್ಟ್ ಮತ್ತು ಕೆಲಸದ ಸಮಯ",
        },
        salarySafety: {
          title: "ಸಂಬಳ ಸುರಕ್ಷತೆ",
          p1: "ಉದ್ಯೋಗ ಅಥವಾ ಹೆಚ್ಚಿನ ಸಂಬಳಕ್ಕಾಗಿ ಎಂದಿಗೂ ಹಣ ಪಾವತಿಸಬೇಡಿ. ಕಡಿಮೆ ಕೆಲಸಕ್ಕೆ ತುಂಬಾ ಹೆಚ್ಚು ಸಂಬಳ ನೀಡುವುದಾಗಿ ಹೇಳುವ ಆಫರ್‌ಗಳ ಬಗ್ಗೆ ಎಚ್ಚರದಿಂದಿರಿ ಮತ್ತು ಅವುಗಳನ್ನು AsliJobs ಬೆಂಬಲಕ್ಕೆ ವರದಿ ಮಾಡಿ.",
          b1: "ಉದ್ಯೋಗಕ್ಕಾಗಿ ಎಂದಿಗೂ ಹಣ ಪಾವತಿಸಬೇಡಿ.",
          b2: "ನಂಬಲಾಗದ ಸಂಬಳದ ಭರವಸೆಗಳ ಬಗ್ಗೆ ಎಚ್ಚರದಿಂದಿರಿ.",
          b3: "ಅನುಮಾನಾಸ್ಪದ ಆಫರ್‌ಗಳನ್ನು AsliJobs ಬೆಂಬಲಕ್ಕೆ ವರದಿ ಮಾಡಿ.",
        },
      },
      cta: {
        title: "ಸ್ಪಷ್ಟ ಸಂಬಳ ವಿವರಗಳಿರುವ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ",
        p1: "ಸಂಬಳ, ಸ್ಥಳ ಮತ್ತು ಸಮಯದೊಂದಿಗೆ ಉದ್ಯೋಗ ಅಲರ್ಟ್‌ಗಳನ್ನು ನೇರವಾಗಿ WhatsApp ನಲ್ಲಿ ಪಡೆಯಿರಿ.",
        tagline: "ನಿಮ್ಮ ಸಂಬಳ ತಿಳಿಯಿರಿ. ಸರಿಯಾದ ಉದ್ಯೋಗ ಆರಿಸಿ.",
        badge: "WhatsApp",
      },
    },
    careerAdvice: {
      title: "ವೃತ್ತಿ ಸಲಹೆ",
      metaDescription:
        "ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳು ತಮ್ಮ ಕೌಶಲ್ಯಗಳನ್ನು ಬೆಳೆಸಿಕೊಂಡು, ಉತ್ತಮ ಉದ್ಯೋಗಗಳನ್ನು ಪಡೆದು, ಸ್ಥಿರ ವೃತ್ತಿಜೀವನ ನಿರ್ಮಿಸಲು ಸಹಾಯ ಮಾಡುವ ಪ್ರಾಯೋಗಿಕ ಸಲಹೆಗಳು.",
      intro: {
        i1: "ಪ್ರತಿಯೊಂದು ಉದ್ಯೋಗವೂ ನಿಮ್ಮ ವೃತ್ತಿಜೀವನದ ಒಂದು ಹೆಜ್ಜೆ. ಈ ಪ್ರಾಯೋಗಿಕ ಸಲಹೆಗಳು ನಿಮ್ಮ ಕೌಶಲ್ಯಗಳನ್ನು ಬೆಳೆಸಲು, ಉತ್ತಮ ಅವಕಾಶಗಳನ್ನು ಪಡೆಯಲು ಮತ್ತು ಸ್ಥಿರ ಭವಿಷ್ಯ ನಿರ್ಮಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ.",
      },
      sections: {
        keepYourProfileUpdated: {
          title: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಅಪ್‌ಡೇಟ್ ಆಗಿಡಿ",
          p1: "ನಿಮ್ಮ ಕೌಶಲ್ಯಗಳು, ಅನುಭವ, ಆದ್ಯತೆಯ ಸ್ಥಳ ಮತ್ತು ನಿರೀಕ್ಷಿತ ಸಂಬಳ ಬದಲಾದಾಗಲೆಲ್ಲಾ ಅವುಗಳನ್ನು ಅಪ್‌ಡೇಟ್ ಮಾಡಿ. ಅಪ್‌ಡೇಟ್ ಆದ ಪ್ರೊಫೈಲ್ AsliJobs ನಿಮಗೆ ಉತ್ತಮ ಉದ್ಯೋಗಗಳನ್ನು ಕಳುಹಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
        },
        learnNewSkills: {
          title: "ಹೊಸ ಕೌಶಲ್ಯಗಳನ್ನು ಕಲಿಯಿರಿ",
          p1: "ಹೊಸ ಕೌಶಲ್ಯಗಳು ಉತ್ತಮ ಉದ್ಯೋಗಗಳಿಗೆ ಮತ್ತು ಹೆಚ್ಚಿನ ಸಂಬಳಕ್ಕೆ ದಾರಿ ತೆರೆಯುತ್ತವೆ. ಅನುಭವಿ ಸಹೋದ್ಯೋಗಿಗಳಿಂದ ಕಲಿಯಿರಿ, ಕಿರು ತರಬೇತಿ ಕೋರ್ಸ್‌ಗಳಿಗೆ ಸೇರಿ ಮತ್ತು ಸಾಧ್ಯವಾದಾಗ ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ಪಡೆಯಿರಿ.",
          b1: "ಡ್ರೈವರ್ ಉದ್ಯೋಗಗಳಿಗೆ ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್",
          b2: "ಮೂಲ ಕಂಪ್ಯೂಟರ್ ಮತ್ತು ಮೊಬೈಲ್ ಕೌಶಲ್ಯಗಳು",
          b3: "ಕೆಲಸದ ಸ್ಥಳದ ಸುರಕ್ಷತಾ ತರಬೇತಿ",
          b4: "ಎಲೆಕ್ಟ್ರಿಕಲ್ ಅಥವಾ ಪ್ಲಂಬಿಂಗ್‌ನಂತಹ ವೃತ್ತಿ ಕೌಶಲ್ಯಗಳು",
          b5: "ಗ್ರಾಹಕ ಸೇವೆ ಮತ್ತು ಸಂವಹನ",
        },
        chooseTheRightJob: {
          title: "ಸರಿಯಾದ ಉದ್ಯೋಗ ಆರಿಸಿ",
          p1: "ಕೇವಲ ಸಂಬಳವನ್ನು ಮಾತ್ರ ನೋಡಬೇಡಿ. ಉದ್ಯೋಗವನ್ನು ಒಪ್ಪಿಕೊಳ್ಳುವ ಮೊದಲು ಈ ಅಂಶಗಳನ್ನು ಪರಿಗಣಿಸಿ.",
          b1: "ಕೆಲಸದ ಸ್ಥಳ ಮತ್ತು ಪ್ರಯಾಣದ ಸಮಯ",
          b2: "ಶಿಫ್ಟ್ ಸಮಯ",
          b3: "ಉದ್ಯೋಗ ಭದ್ರತೆ",
          b4: "ಬೆಳವಣಿಗೆಯ ಅವಕಾಶಗಳು",
        },
        growInYourCurrentJob: {
          title: "ಪ್ರಸ್ತುತ ಉದ್ಯೋಗದಲ್ಲಿ ಬೆಳೆಯಿರಿ",
          p1: "ಕೆಲಸದಲ್ಲಿ ಸಮಯಪಾಲನೆ, ವಿಶ್ವಾಸಾರ್ಹತೆ ಮತ್ತು ಪ್ರಾಮಾಣಿಕತೆಯಿಂದಿರಿ. ಉತ್ತಮ ಹಾಜರಾತಿ ಮತ್ತು ಸಕಾರಾತ್ಮಕ ಮನೋಭಾವ ನಿಮಗೆ ನಂಬಿಕೆ, ಜವಾಬ್ದಾರಿ ಮತ್ತು ಬಡ್ತಿ ಗಳಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ.",
          b1: "ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಬನ್ನಿ",
          b2: "ನಿಮ್ಮ ಮೇಲ್ವಿಚಾರಕರಿಂದ ಕಲಿಯಿರಿ",
          b3: "ಜವಾಬ್ದಾರಿ ತೆಗೆದುಕೊಳ್ಳಿ",
          b4: "ನಿಮ್ಮ ಕೆಲಸದ ಅನುಭವದ ದಾಖಲೆ ಇಟ್ಟುಕೊಳ್ಳಿ",
        },
        planYourNextStep: {
          title: "ನಿಮ್ಮ ಮುಂದಿನ ಹೆಜ್ಜೆಯನ್ನು ಯೋಜಿಸಿ",
          p1: "ಮೇಲ್ವಿಚಾರಕ, ಹಿರಿಯ ತಂತ್ರಜ್ಞ ಅಥವಾ ತಂಡದ ನಾಯಕರಾಗುವಂತಹ ಸ್ಪಷ್ಟ ಗುರಿಯನ್ನು ಇಟ್ಟುಕೊಳ್ಳಿ. ನಿಮ್ಮ ಮುಂದಿನ ಉದ್ಯೋಗ ಅರ್ಜಿಗೆ ಅನುಭವ ಪತ್ರಗಳು ಮತ್ತು ಶಿಫಾರಸುಗಳನ್ನು ಸಂಗ್ರಹಿಸಿ.",
        },
      },
      cta: {
        title: "ನಿಮ್ಮ ವೃತ್ತಿಜೀವನದಲ್ಲಿ ಮುಂದಿನ ಹೆಜ್ಜೆ ಇಡಿ",
        p1: "ನಿಮ್ಮ ಕೌಶಲ್ಯಗಳು ಮತ್ತು ಗುರಿಗಳಿಗೆ ಹೊಂದುವ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಿ ಮತ್ತು ಅಲರ್ಟ್‌ಗಳನ್ನು ನೇರವಾಗಿ WhatsApp ನಲ್ಲಿ ಪಡೆಯಿರಿ.",
        tagline: "ಕಲಿಯಿರಿ. ಬೆಳೆಯಿರಿ. ಉತ್ತಮ ಉದ್ಯೋಗಗಳನ್ನು ಪಡೆಯಿರಿ.",
        badge: "WhatsApp",
      },
    },
  },
};

const ml: MessageShape<typeof en> = {
  publicPages: {
    breadcrumbAria: "ബ്രെഡ്ക്രംബ്",
    actions: {
      startOnWhatsapp: "WhatsApp-ൽ ആരംഭിക്കുക",
      browseJobs: "ജോലികൾ കാണുക",
      postAJob: "ജോലി പോസ്റ്റ് ചെയ്യുക",
      employerLogin: "തൊഴിലുടമ ലോഗിൻ",
      contactSupport: "സപ്പോർട്ടുമായി ബന്ധപ്പെടുക",
    },
    findJobs: {
      title: "ജോലികൾ കണ്ടെത്തുക",
      metaDescription:
        "ശരിയായ ജോലി തിരയുകയാണോ? AsliJobs WhatsApp വഴി ജോലി തിരയൽ ലളിതവും വേഗമേറിയതും എളുപ്പവുമാക്കുന്നു.",
      intro: {
        i1: "ശരിയായ ജോലി തിരയുകയാണോ? AsliJobs WhatsApp വഴി ജോലി തിരയൽ ലളിതവും വേഗമേറിയതും എളുപ്പവുമാക്കുന്നു.",
        i2: "സ്ഥലം, ജോലി വിഭാഗം, അനുഭവം, കഴിവുകൾ, ഭാഷാ മുൻഗണന, ലഭ്യത എന്നിവയെ അടിസ്ഥാനമാക്കി ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ ജോലികൾ കണ്ടെത്താൻ AsliJobs തൊഴിൽ അന്വേഷകരെ സഹായിക്കുന്നു. ഓഫീസ് സപ്പോർട്ട്, ഡെലിവറി, ഡ്രൈവിങ്, ഇലക്ട്രീഷ്യൻ, ഹൗസ്‌കീപ്പിങ്, സെക്യൂരിറ്റി, വെയർഹൗസ്, റീട്ടെയിൽ, ടെക്നീഷ്യൻ അല്ലെങ്കിൽ മറ്റ് തൊഴിലാളി അവസരങ്ങൾ തിരഞ്ഞാലും, AsliJobs നിങ്ങളെ അനുയോജ്യരായ തൊഴിലുടമകളുമായി ബന്ധിപ്പിക്കുന്നു.",
      },
      sections: {
        findJobsThroughWhatsapp: {
          title: "WhatsApp വഴി ജോലികൾ കണ്ടെത്തുക",
          p1: "പുതിയ ആപ്പ് ഡൗൺലോഡ് ചെയ്യേണ്ടതില്ല. AsliJobs വഴി ജോലി അലർട്ടുകൾ ലഭിക്കാനും ജോലി വിശദാംശങ്ങൾ കാണാനും അപേക്ഷിക്കാനും അഭിമുഖ അപ്‌ഡേറ്റുകൾ നേരിട്ട് WhatsApp-ൽ ലഭിക്കാനും കഴിയും.",
          p2: "AsliJobs WhatsApp ചാറ്റ് തുടങ്ങി, അടിസ്ഥാന പ്രൊഫൈൽ വിശദാംശങ്ങൾ പങ്കിട്ട്, ഇഷ്ട ജോലി വിഭാഗവും സ്ഥലവും തിരഞ്ഞെടുത്ത് അനുയോജ്യമായ ജോലി അവസരങ്ങൾ ലഭിക്കുക.",
        },
        jobsBasedOnYourLocation: {
          title: "നിങ്ങളുടെ സ്ഥലം അടിസ്ഥാനമാക്കിയ ജോലികൾ",
          p1: "നഗരം, പ്രദേശം, ലോക്കാലിറ്റി അല്ലെങ്കിൽ ഇഷ്ട ജോലി സ്ഥലം അടിസ്ഥാനമാക്കി ജോലികൾ കണ്ടെത്താൻ AsliJobs സഹായിക്കുന്നു. അടുത്തുള്ളതും നിങ്ങൾക്ക് സൗകര്യപ്രദവുമായ ജോലികൾ കണ്ടെത്തി അപേക്ഷിക്കുന്നത് എളുപ്പമാകുന്നു.",
        },
        applyEasily: {
          title: "എളുപ്പത്തിൽ അപേക്ഷിക്കുക",
          p1: "ജോലി അലർട്ട് ലഭിച്ചാൽ ജോലി ശീർഷകം, ശമ്പളം, സ്ഥലം, സമയം, ആവശ്യമായ അനുഭവം, മറ്റ് വിശദാംശങ്ങൾ എന്നിവ കാണാം. താൽപ്പര്യമുണ്ടെങ്കിൽ ജോലി അലർട്ടിന് മറുപടി നൽകിയോ അപേക്ഷ ഓപ്ഷൻ തിരഞ്ഞെടുത്തോ നേരിട്ട് WhatsApp വഴി അപേക്ഷിക്കാം.",
        },
        stayUpdated: {
          title: "അപ്‌ഡേറ്റായി തുടരുക",
          p1: "അപേക്ഷിച്ച ശേഷം അപേക്ഷാ നില, ഷോർട്ട്‌ലിസ്റ്റ് അപ്‌ഡേറ്റുകൾ, അഭിമുഖ വിശദാംശങ്ങൾ, തിരഞ്ഞെടുപ്പ് നില, ചേരൽ വിവരം എന്നിവ ഉൾപ്പെടെ പ്രധാന അപ്‌ഡേറ്റുകൾ WhatsApp വഴി ലഭിക്കും.",
        },
        safeJobSearch: {
          title: "സുരക്ഷിത ജോലി തിരയൽ",
          p1: "ലളിതവും വിശ്വസനീയവുമായ ജോലി തിരയൽ അനുഭവം സൃഷ്ടിക്കുന്നതിൽ AsliJobs ശ്രദ്ധ കേന്ദ്രീകരിക്കുന്നു. തൊഴിൽ അന്വേഷകർ ജോലി വിശദാംശങ്ങൾ എപ്പോഴും ശ്രദ്ധാപൂർവം പരിശോധിക്കുകയും വ്യാജ ജോലി, പണം ആവശ്യപ്പെടൽ അല്ലെങ്കിൽ സംശയാസ്പദമായ പ്രവർത്തനം AsliJobs സപ്പോർട്ടിന് റിപ്പോർട്ട് ചെയ്യുകയും വേണം.",
        },
      },
      cta: {
        title: "ജോലികൾ തിരയാൻ തുടങ്ങുക",
        p1: "AsliJobs ഉപയോഗിച്ച് ജോലി തിരയൽ തുടങ്ങി അനുയോജ്യമായ ജോലി അവസരങ്ങൾ നേരിട്ട് WhatsApp-ൽ ലഭിക്കുക.",
        tagline: "ജോലികൾ കണ്ടെത്തുക. എളുപ്പത്തിൽ അപേക്ഷിക്കുക. WhatsApp-ൽ അപ്‌ഡേറ്റുകൾ ലഭിക്കുക.",
        badge: "WhatsApp",
      },
    },
    browseByCity: {
      title: "നഗരം അനുസരിച്ച് കാണുക",
      metaDescription:
        "AsliJobs ഉപയോഗിച്ച് WhatsApp വഴി ഇഷ്ട നഗരത്തിലെ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ ജോലികൾ കണ്ടെത്തുക.",
      intro: {
        i1: "AsliJobs ഉപയോഗിച്ച് ഇഷ്ട നഗരത്തിലെ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ ജോലികൾ കണ്ടെത്തുക. അടുത്തുള്ള ജോലി തിരഞ്ഞാലും മറ്റൊരു നഗരത്തിൽ ജോലി ചെയ്യാൻ പദ്ധതിയിട്ടാലും, AsliJobs WhatsApp വഴി അനുയോജ്യമായ അവസരങ്ങൾ കണ്ടെത്താൻ സഹായിക്കുന്നു.",
      },
      sections: {
        findJobsInYourCity: {
          title: "നിങ്ങളുടെ നഗരത്തിലെ ജോലികൾ കണ്ടെത്തുക",
          p1: "നഗരം, പ്രദേശം, ലോക്കാലിറ്റി, ഇഷ്ട ജോലി സ്ഥലം എന്നിവ അടിസ്ഥാനമാക്കി ജോലികൾ തിരയാൻ AsliJobs തൊഴിൽ അന്വേഷകരെ അനുവദിക്കുന്നു. അടുത്തുള്ളതും എത്തിച്ചേരാൻ എളുപ്പമുള്ളതും ദൈനംദിന ജീവിതത്തിന് അനുയോജ്യവുമായ ജോലികൾ കണ്ടെത്താൻ ഇത് സഹായിക്കുന്നു.",
        },
        howItWorks: {
          title: "ഇത് എങ്ങനെ പ്രവർത്തിക്കുന്നു",
          p1: "നഗരം തിരഞ്ഞെടുക്കുക, ജോലി വിഭാഗം തിരഞ്ഞെടുക്കുക, അടിസ്ഥാന പ്രൊഫൈൽ വിശദാംശങ്ങൾ പങ്കിടുക. സ്ഥലം, അനുഭവം, കഴിവുകൾ, ലഭ്യത എന്നിവ അടിസ്ഥാനമാക്കി AsliJobs അനുയോജ്യമായ ജോലി അലർട്ടുകൾ നേരിട്ട് WhatsApp-ൽ അയയ്ക്കും.",
          b1: "നഗരം തിരഞ്ഞെടുക്കുക",
          b2: "ജോലി വിഭാഗം തിരഞ്ഞെടുക്കുക",
          b3: "അടിസ്ഥാന പ്രൊഫൈൽ വിശദാംശങ്ങൾ പങ്കിടുക",
          b4: "സ്ഥലം, അനുഭവം, കഴിവുകൾ, ലഭ്യത എന്നിവ അടിസ്ഥാനമാക്കിയ പൊരുത്തം",
          b5: "WhatsApp വഴി അനുയോജ്യമായ ജോലി അലർട്ടുകൾ ലഭിക്കുക",
        },
        cityBasedJobAlerts: {
          title: "നഗരാധിഷ്ഠിത ജോലി അലർട്ടുകൾ",
          p1: "ഓഫീസ് സപ്പോർട്ട്, ഡെലിവറി, ഡ്രൈവർ, ഇലക്ട്രീഷ്യൻ, പ്ലംബർ, ഹൗസ്‌കീപ്പിങ്, സെക്യൂരിറ്റി, ഹെൽപ്പർ, വെയർഹൗസ് ജീവനക്കാർ, റീട്ടെയിൽ ജീവനക്കാർ, ടെക്നീഷ്യൻ, നിങ്ങളുടെ നഗരത്തിൽ ലഭ്യമായ മറ്റ് തൊഴിലാളി ജോലികൾ എന്നിവയ്ക്ക് അലർട്ടുകൾ ലഭിക്കാം.",
          b1: "ഓഫീസ് സപ്പോർട്ട്",
          b2: "ഡെലിവറി",
          b3: "ഡ്രൈവർ",
          b4: "ഇലക്ട്രീഷ്യൻ",
          b5: "പ്ലംബർ",
          b6: "ഹൗസ്‌കീപ്പിങ്",
          b7: "സെക്യൂരിറ്റി",
          b8: "ഹെൽപ്പർ",
          b9: "വെയർഹൗസ് ജീവനക്കാർ",
          b10: "റീട്ടെയിൽ ജീവനക്കാർ",
          b11: "ടെക്നീഷ്യൻ",
          b12: "മറ്റ് തൊഴിലാളി ജോലികൾ",
        },
        jobAvailability: {
          title: "ജോലി ലഭ്യത",
          p1: "AsliJobs ഇന്ത്യയിലുടനീളം തൊഴിൽ അന്വേഷകർക്കും തൊഴിലുടമകൾക്കും സേവനം നൽകുന്നു. ജോലി ലഭ്യത നഗരം, പ്രദേശം, ലോക്കാലിറ്റി, ജോലി വിഭാഗം, തൊഴിലുടമ ഒഴിവുകൾ എന്നിവയെ ആശ്രയിച്ച് മാറാം.",
        },
      },
      cta: {
        title: "തിരയൽ തുടങ്ങുക",
        p1: "നഗരം തിരഞ്ഞെടുത്ത് ജോലി അവസരങ്ങൾ നേരിട്ട് WhatsApp-ൽ ലഭിക്കാൻ തുടങ്ങുക.",
        tagline: "അടുത്തുള്ള ജോലികൾ കണ്ടെത്തുക. WhatsApp വഴി എളുപ്പത്തിൽ അപേക്ഷിക്കുക.",
        badge: "WhatsApp",
      },
    },
    browseByState: {
      title: "സംസ്ഥാനം അനുസരിച്ച് കാണുക",
      metaDescription:
        "AsliJobs ഉപയോഗിച്ച് WhatsApp വഴി ഇന്ത്യയിലെ വിവിധ സംസ്ഥാനങ്ങളിലെ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ ജോലികൾ കണ്ടെത്തുക.",
      intro: {
        i1: "AsliJobs ഉപയോഗിച്ച് ഇന്ത്യയിലെ വിവിധ സംസ്ഥാനങ്ങളിലെ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ ജോലികൾ കണ്ടെത്തുക. സ്വന്തം സംസ്ഥാനത്ത് ജോലി ചെയ്യാൻ ആഗ്രഹിച്ചാലും മറ്റൊരു സംസ്ഥാനത്തെ അവസരങ്ങൾ നോക്കിയാലും, AsliJobs WhatsApp വഴി അനുയോജ്യമായ ജോലികൾ കണ്ടെത്താൻ സഹായിക്കുന്നു.",
      },
      sections: {
        findJobsStateWise: {
          title: "സംസ്ഥാനം തോറും ജോലികൾ കണ്ടെത്തുക",
          p1: "സംസ്ഥാനം, നഗരം, പ്രദേശം, ലോക്കാലിറ്റി, ഇഷ്ട ജോലി സ്ഥലം എന്നിവ അടിസ്ഥാനമാക്കി ജോലികൾ തിരയാൻ AsliJobs തൊഴിൽ അന്വേഷകരെ അനുവദിക്കുന്നു. സ്ഥലത്തിനും ജോലി മുൻഗണനയ്ക്കും യോജിക്കുന്ന അവസരങ്ങൾ കണ്ടെത്തുന്നത് എളുപ്പമാകുന്നു.",
        },
        howItWorks: {
          title: "ഇത് എങ്ങനെ പ്രവർത്തിക്കുന്നു",
          p1: "സംസ്ഥാനം തിരഞ്ഞെടുക്കുക, നഗരമോ ലോക്കാലിറ്റിയോ തിരഞ്ഞെടുക്കുക, ഇഷ്ട ജോലി വിഭാഗം പങ്കിടുക. പ്രൊഫൈൽ വിശദാംശങ്ങൾ അടിസ്ഥാനമാക്കി AsliJobs അനുയോജ്യമായ ജോലി അലർട്ടുകൾ നേരിട്ട് WhatsApp-ൽ അയയ്ക്കും.",
          b1: "സംസ്ഥാനം തിരഞ്ഞെടുക്കുക",
          b2: "നഗരം/ലോക്കാലിറ്റി തിരഞ്ഞെടുക്കുക",
          b3: "ഇഷ്ട ജോലി വിഭാഗം തിരഞ്ഞെടുക്കുക",
          b4: "WhatsApp വഴി അനുയോജ്യമായ ജോലി അലർട്ടുകൾ ലഭിക്കുക",
        },
        stateBasedJobAlerts: {
          title: "സംസ്ഥാനാധിഷ്ഠിത ജോലി അലർട്ടുകൾ",
          p1: "ഓഫീസ് സപ്പോർട്ട്, ഡെലിവറി, ഡ്രൈവർ, ഇലക്ട്രീഷ്യൻ, പ്ലംബർ, ഹൗസ്‌കീപ്പിങ്, സെക്യൂരിറ്റി, ഹെൽപ്പർ, വെയർഹൗസ് ജീവനക്കാർ, റീട്ടെയിൽ ജീവനക്കാർ, ടെക്നീഷ്യൻ, തിരഞ്ഞെടുത്ത സംസ്ഥാനത്ത് ലഭ്യമായ മറ്റ് തൊഴിലാളി ജോലികൾ എന്നിവയ്ക്ക് അലർട്ടുകൾ ലഭിക്കാം.",
          b1: "ഓഫീസ് സപ്പോർട്ട്",
          b2: "ഡെലിവറി",
          b3: "ഡ്രൈവർ",
          b4: "ഇലക്ട്രീഷ്യൻ",
          b5: "പ്ലംബർ",
          b6: "ഹൗസ്‌കീപ്പിങ്",
          b7: "സെക്യൂരിറ്റി",
          b8: "ഹെൽപ്പർ",
          b9: "വെയർഹൗസ് ജീവനക്കാർ",
          b10: "റീട്ടെയിൽ ജീവനക്കാർ",
          b11: "ടെക്നീഷ്യൻ",
          b12: "മറ്റ് തൊഴിലാളി ജോലികൾ",
        },
        jobAvailability: {
          title: "ജോലി ലഭ്യത",
          p1: "AsliJobs ഇന്ത്യയിലുടനീളം തൊഴിൽ അന്വേഷകർക്കും തൊഴിലുടമകൾക്കും സേവനം നൽകുന്നു. ജോലി ലഭ്യത സംസ്ഥാനം, നഗരം, ലോക്കാലിറ്റി, ജോലി വിഭാഗം, തൊഴിലുടമ ഒഴിവുകൾ എന്നിവയെ ആശ്രയിച്ച് മാറാം.",
        },
      },
      cta: {
        title: "തിരയൽ തുടങ്ങുക",
        p1: "ഇഷ്ട സംസ്ഥാനം തിരഞ്ഞെടുത്ത് WhatsApp-ൽ അനുയോജ്യമായ ജോലി അവസരങ്ങൾ ലഭിക്കാൻ തുടങ്ങുക.",
        tagline: "സംസ്ഥാനം തോറും തിരയുക. എളുപ്പത്തിൽ അപേക്ഷിക്കുക. WhatsApp-ൽ അപ്‌ഡേറ്റുകൾ ലഭിക്കുക.",
        badge: "WhatsApp",
      },
    },
    jobCategories: {
      title: "ജോലി വിഭാഗങ്ങൾ",
      metaDescription:
        "വിവിധ വിഭാഗങ്ങളിലെ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ ജോലികൾ WhatsApp വഴി കണ്ടെത്താൻ AsliJobs തൊഴിൽ അന്വേഷകരെ സഹായിക്കുന്നു.",
      intro: {
        i1: "വിവിധ വിഭാഗങ്ങളിലെ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ ജോലികൾ കണ്ടെത്താൻ AsliJobs തൊഴിൽ അന്വേഷകരെ സഹായിക്കുന്നു. ഫീൽഡ് ജോലി, സാങ്കേതിക ജോലി, ഓഫീസ് സപ്പോർട്ട്, ഡെലിവറി, റീട്ടെയിൽ അല്ലെങ്കിൽ സേവന അധിഷ്ഠിത റോളുകൾ തിരഞ്ഞാലും, AsliJobs WhatsApp വഴി അനുയോജ്യമായ ജോലികൾ കണ്ടെത്തുന്നത് എളുപ്പമാക്കുന്നു.",
      },
      sections: {
        exploreJobsByCategory: {
          title: "വിഭാഗം അനുസരിച്ച് ജോലികൾ കാണുക",
          p1: "പ്രൊഫൈൽ സൃഷ്ടിക്കുമ്പോൾ ഇഷ്ട ജോലി വിഭാഗം തിരഞ്ഞെടുക്കാം. കഴിവുകൾ, അനുഭവം, സ്ഥലം, ലഭ്യത എന്നിവ അടിസ്ഥാനമാക്കി AsliJobs അനുയോജ്യമായ ജോലി അലർട്ടുകൾ നേരിട്ട് WhatsApp-ൽ അയയ്ക്കും.",
        },
        popularJobCategories: {
          title: "ജനപ്രിയ ജോലി വിഭാഗങ്ങൾ",
          cards: {
            officeSupport: {
              title: "ഓഫീസ് സപ്പോർട്ട്",
              description:
                "ഓഫീസ് അസിസ്റ്റന്റ്, അഡ്‌മിൻ ഹെൽപ്പർ, റിസപ്ഷനിസ്റ്റ്, ഡാറ്റാ എൻട്രി സപ്പോർട്ട്, ബാക്ക്-ഓഫീസ് ജീവനക്കാർ തുടങ്ങിയ ജോലികൾ.",
            },
            deliveryLogistics: {
              title: "ഡെലിവറിയും ലോജിസ്റ്റിക്സും",
              description:
                "ഡെലിവറി എക്സിക്യൂട്ടീവ്, കൊറിയർ ജീവനക്കാർ, ലോജിസ്റ്റിക്സ് ഹെൽപ്പർ, ഫീൽഡ് ഡെലിവറി റോളുകൾ തുടങ്ങിയ ജോലികൾ.",
            },
            driverJobs: {
              title: "ഡ്രൈവർ ജോലികൾ",
              description:
                "കാർ ഡ്രൈവർമാർ, കൊമേഴ്‌സ്യൽ ഡ്രൈവർമാർ, പേഴ്‌സണൽ ഡ്രൈവർമാർ, കമ്പനി ഡ്രൈവർമാർ എന്നിവർക്കുള്ള ജോലികൾ.",
            },
            electricianJobs: {
              title: "ഇലക്ട്രീഷ്യൻ ജോലികൾ",
              description:
                "ഇലക്ട്രീഷ്യൻമാർ, ഇലക്ട്രിക്കൽ ഹെൽപ്പർമാർ, വയറിങ് ടെക്നീഷ്യൻമാർ, മെയിന്റനൻസ് ജീവനക്കാർ എന്നിവർക്കുള്ള ജോലികൾ.",
            },
            plumbingJobs: {
              title: "പ്ലംബിങ് ജോലികൾ",
              description:
                "പ്ലംബർമാർ, പ്ലംബിങ് അസിസ്റ്റന്റുമാർ, മെയിന്റനൻസ് സപ്പോർട്ട് തൊഴിലാളികൾ എന്നിവർക്കുള്ള ജോലികൾ.",
            },
            housekeepingJobs: {
              title: "ഹൗസ്‌കീപ്പിങ് ജോലികൾ",
              description:
                "ഹൗസ്‌കീപ്പിങ് ജീവനക്കാർ, ക്ലീനിങ് ജീവനക്കാർ, ഫെസിലിറ്റി സപ്പോർട്ട്, മെയിന്റനൻസ് തൊഴിലാളികൾ എന്നിവർക്കുള്ള ജോലികൾ.",
            },
            securityJobs: {
              title: "സെക്യൂരിറ്റി ജോലികൾ",
              description:
                "സെക്യൂരിറ്റി ഗാർഡുമാർ, വാച്ച്‌മാൻമാർ, കെട്ടിട സുരക്ഷ, സൈറ്റ് സെക്യൂരിറ്റി ജീവനക്കാർ എന്നിവർക്കുള്ള ജോലികൾ.",
            },
            warehouseJobs: {
              title: "വെയർഹൗസ് ജോലികൾ",
              description:
                "വെയർഹൗസ് ഹെൽപ്പർമാർ, പാക്കർമാർ, ലോഡർമാർ, ഇൻവെന്ററി അസിസ്റ്റന്റുമാർ, സ്റ്റോർ സപ്പോർട്ട് ജീവനക്കാർ എന്നിവർക്കുള്ള ജോലികൾ.",
            },
            retailJobs: {
              title: "റീട്ടെയിൽ ജോലികൾ",
              description:
                "സെയിൽസ് ജീവനക്കാർ, സ്റ്റോർ അസിസ്റ്റന്റുമാർ, കാഷ്യർമാർ, പ്രമോട്ടർമാർ, കസ്റ്റമർ സപ്പോർട്ട് റോളുകൾ എന്നിവർക്കുള്ള ജോലികൾ.",
            },
            technicianJobs: {
              title: "ടെക്നീഷ്യൻ ജോലികൾ",
              description:
                "എസി ടെക്നീഷ്യൻമാർ, അപ്ലയൻസ് ടെക്നീഷ്യൻമാർ, മെഷീൻ ഓപ്പറേറ്റർമാർ, മെക്കാനിക്കുകൾ, സർവീസ് ടെക്നീഷ്യൻമാർ എന്നിവർക്കുള്ള ജോലികൾ.",
            },
            helperJobs: {
              title: "ഹെൽപ്പർ ജോലികൾ",
              description:
                "ജനറൽ ഹെൽപ്പർമാർ, സൈറ്റ് ഹെൽപ്പർമാർ, ഫാക്ടറി ഹെൽപ്പർമാർ, ഷോപ്പ് ഹെൽപ്പർമാർ, സപ്പോർട്ട് തൊഴിലാളികൾ എന്നിവർക്കുള്ള ജോലികൾ.",
            },
            otherWorkforceJobs: {
              title: "മറ്റ് തൊഴിലാളി ജോലികൾ",
              description:
                "തൊഴിലുടമ ആവശ്യങ്ങളും സ്ഥല ലഭ്യതയും അടിസ്ഥാനമാക്കി മറ്റ് ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ ജോലി റോളുകളും AsliJobs-ിൽ ഉൾപ്പെടാം.",
            },
          },
        },
        jobsBasedOnYourLocation: {
          title: "നിങ്ങളുടെ സ്ഥലം അടിസ്ഥാനമാക്കിയ ജോലികൾ",
          p1: "ജോലി ലഭ്യത സംസ്ഥാനം, നഗരം, പ്രദേശം, ലോക്കാലിറ്റി, ജോലി വിഭാഗം, തൊഴിലുടമ ഒഴിവുകൾ എന്നിവയെ ആശ്രയിച്ച് മാറാം. കൂടുതൽ പ്രസക്തമായ ജോലി അലർട്ടുകൾ ലഭിക്കാൻ ഇഷ്ട സ്ഥലം തിരഞ്ഞെടുക്കാം.",
        },
      },
      cta: {
        title: "ശരിയായ ജോലി തിരയാൻ തുടങ്ങുക",
        p1: "ജോലി വിഭാഗം തിരഞ്ഞെടുത്ത് അനുയോജ്യമായ ജോലി അവസരങ്ങൾ നേരിട്ട് WhatsApp-ൽ ലഭിക്കാൻ തുടങ്ങുക.",
        tagline: "വിഭാഗം തിരഞ്ഞെടുക്കുക. ജോലി അലർട്ടുകൾ ലഭിക്കുക. WhatsApp വഴി എളുപ്പത്തിൽ അപേക്ഷിക്കുക.",
        badge: "WhatsApp",
      },
    },
    jobSeekerGuide: {
      title: "തൊഴിൽ അന്വേഷക ഗൈഡ്",
      metaDescription:
        "ഇന്ത്യയിലെ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ തൊഴിലാളികൾക്ക് WhatsApp വഴി ജോലി തിരയൽ AsliJobs ലളിതമാക്കുന്നു.",
      intro: {
        i1: "ഇന്ത്യയിലെ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ തൊഴിലാളികൾക്ക് ജോലി തിരയൽ AsliJobs ലളിതമാക്കുന്നു. AsliJobs ഉപയോഗിച്ച് തൊഴിൽ അന്വേഷകർക്ക് അനുയോജ്യമായ ജോലികൾ കണ്ടെത്താനും എളുപ്പത്തിൽ അപേക്ഷിക്കാനും അപ്‌ഡേറ്റുകൾ നേരിട്ട് WhatsApp വഴി ലഭിക്കാനും കഴിയും.",
      },
      sections: {
        startWithWhatsapp: {
          title: "WhatsApp ഉപയോഗിച്ച് തുടങ്ങുക",
          p1: "പുതിയ ആപ്പ് ഡൗൺലോഡ് ചെയ്യേണ്ടതില്ല. AsliJobs WhatsApp ലിങ്കിൽ ക്ലിക്ക് ചെയ്തോ QR കോഡ് സ്കാൻ ചെയ്തോ ഔദ്യോഗിക AsliJobs WhatsApp നമ്പറിലേക്ക് സന്ദേശം അയച്ചോ തുടങ്ങാം.",
        },
        createYourProfile: {
          title: "നിങ്ങളുടെ പ്രൊഫൈൽ സൃഷ്ടിക്കുക",
          p1: "പേര്, മൊബൈൽ നമ്പർ, സ്ഥലം, ഇഷ്ടഭാഷ, ജോലി വിഭാഗം, കഴിവുകൾ, അനുഭവം, പ്രതീക്ഷിക്കുന്ന ശമ്പളം, ലഭ്യത എന്നിവ പോലുള്ള അടിസ്ഥാന വിശദാംശങ്ങൾ പങ്കിടുക. കൂടുതൽ അനുയോജ്യമായ ജോലി അവസരങ്ങൾ അയയ്ക്കാൻ ഇത് AsliJobs-നെ സഹായിക്കുന്നു.",
          b1: "പേര്",
          b2: "മൊബൈൽ നമ്പർ",
          b3: "സ്ഥലം",
          b4: "ഇഷ്ടഭാഷ",
          b5: "ജോലി വിഭാഗം",
          b6: "കഴിവുകൾ",
          b7: "അനുഭവം",
          b8: "പ്രതീക്ഷിക്കുന്ന ശമ്പളം",
          b9: "ലഭ്യത",
        },
        chooseYourJobCategory: {
          title: "ജോലി വിഭാഗം തിരഞ്ഞെടുക്കുക",
          p1: "നിങ്ങൾ തിരയുന്ന ജോലി തരം തിരഞ്ഞെടുക്കുക, ഉദാഹരണത്തിന് ഓഫീസ് സപ്പോർട്ട്, ഡെലിവറി, ഡ്രൈവർ, ഇലക്ട്രീഷ്യൻ, ഹൗസ്‌കീപ്പിങ്, സെക്യൂരിറ്റി, റീട്ടെയിൽ, വെയർഹൗസ്, ടെക്നീഷ്യൻ, ഹെൽപ്പർ അല്ലെങ്കിൽ ലഭ്യമായ മറ്റ് തൊഴിലാളി ജോലികൾ.",
          b1: "ഓഫീസ് സപ്പോർട്ട്",
          b2: "ഡെലിവറി",
          b3: "ഡ്രൈവർ",
          b4: "ഇലക്ട്രീഷ്യൻ",
          b5: "ഹൗസ്‌കീപ്പിങ്",
          b6: "സെക്യൂരിറ്റി",
          b7: "റീട്ടെയിൽ",
          b8: "വെയർഹൗസ്",
          b9: "ടെക്നീഷ്യൻ",
          b10: "ഹെൽപ്പർ",
          b11: "ലഭ്യമായ മറ്റ് തൊഴിലാളി ജോലികൾ",
        },
        selectYourLocation: {
          title: "സ്ഥലം തിരഞ്ഞെടുക്കുക",
          p1: "AsliJobs അടുത്തുള്ളതും സൗകര്യപ്രദവുമായ ജോലികൾ കാണിക്കുന്നതിന് സംസ്ഥാനം, നഗരം, പ്രദേശം അല്ലെങ്കിൽ ലോക്കാലിറ്റി തിരഞ്ഞെടുക്കുക.",
          b1: "സംസ്ഥാനം",
          b2: "നഗരം",
          b3: "പ്രദേശം",
          b4: "ലോക്കാലിറ്റി",
        },
        receiveJobAlerts: {
          title: "ജോലി അലർട്ടുകൾ ലഭിക്കുക",
          p1: "പ്രൊഫൈൽ, സ്ഥലം, ജോലി വിഭാഗം, ലഭ്യത എന്നിവ അടിസ്ഥാനമാക്കി WhatsApp-ൽ അനുയോജ്യമായ ജോലി അലർട്ടുകൾ ലഭിക്കും. മെച്ചപ്പെട്ട ജോലി പൊരുത്തങ്ങൾ ലഭിക്കാൻ പ്രൊഫൈൽ അപ്‌ഡേറ്റായി സൂക്ഷിക്കുക.",
        },
        applyThroughWhatsapp: {
          title: "WhatsApp വഴി അപേക്ഷിക്കുക",
          p1: "ജോലി അലർട്ട് ലഭിച്ചാൽ ജോലി വിശദാംശങ്ങൾ ശ്രദ്ധാപൂർവം വായിക്കുക. താൽപ്പര്യമുണ്ടെങ്കിൽ ജോലി അലർട്ടിന് മറുപടി നൽകിയോ അപേക്ഷ ഓപ്ഷൻ തിരഞ്ഞെടുത്തോ നേരിട്ട് WhatsApp വഴി അപേക്ഷിക്കുക.",
        },
        trackApplicationUpdates: {
          title: "അപേക്ഷാ അപ്‌ഡേറ്റുകൾ ട്രാക്ക് ചെയ്യുക",
          p1: "അപേക്ഷിച്ച ശേഷം അപേക്ഷിച്ചു, ഷോർട്ട്‌ലിസ്റ്റ്, അഭിമുഖം ഷെഡ്യൂൾ ചെയ്തു, തിരഞ്ഞെടുത്തു അല്ലെങ്കിൽ ചേരൽ സ്ഥിരീകരിച്ചു എന്നിവ പോലുള്ള അപ്‌ഡേറ്റുകൾ WhatsApp വഴി ലഭിച്ചേക്കാം.",
          b1: "അപേക്ഷിച്ചു",
          b2: "ഷോർട്ട്‌ലിസ്റ്റ്",
          b3: "അഭിമുഖം ഷെഡ്യൂൾ ചെയ്തു",
          b4: "തിരഞ്ഞെടുത്തു",
          b5: "ചേരൽ സ്ഥിരീകരിച്ചു",
        },
        useYourPreferredLanguage: {
          title: "ഇഷ്ടഭാഷ ഉപയോഗിക്കുക",
          p1: "AsliJobs ഇംഗ്ലീഷ്, ഹിന്ദി, തെലുഗ്, തമിഴ്, കന്നഡ, മലയാളം എന്നീ ഭാഷകളെ പിന്തുണയ്ക്കുന്നു. ജോലി അലർട്ടുകളും അപ്‌ഡേറ്റുകളും കൂടുതൽ സുഖകരമായി ലഭിക്കാൻ ഇഷ്ടഭാഷ തിരഞ്ഞെടുക്കാം.",
          b1: "ഇംഗ്ലീഷ്",
          b2: "ഹിന്ദി",
          b3: "തെലുഗ്",
          b4: "തമിഴ്",
          b5: "കന്നഡ",
          b6: "മലയാളം",
        },
        staySafeWhileSearching: {
          title: "തിരയുമ്പോൾ സുരക്ഷിതമായി തുടരുക",
          p1: "ജോലി സ്ഥിരീകരണത്തിന് പണം നൽകരുത്. മുന്നോട്ട് പോകുന്നതിന് മുമ്പ് കമ്പനി പേര്, ജോലി സ്ഥലം, ശമ്പളം, ജോലി സമയം, അഭിമുഖ വിശദാംശങ്ങൾ എന്നിവ എപ്പോഴും പരിശോധിക്കുക. വ്യാജ ജോലികൾ, പണം ആവശ്യപ്പെടൽ അല്ലെങ്കിൽ സംശയാസ്പദമായ സന്ദേശങ്ങൾ ഉടൻ AsliJobs സപ്പോർട്ടിന് റിപ്പോർട്ട് ചെയ്യുക.",
          b1: "ജോലി സ്ഥിരീകരണത്തിന് പണം നൽകരുത്.",
          b2: "കമ്പനി പേര് പരിശോധിക്കുക.",
          b3: "ജോലി സ്ഥലം പരിശോധിക്കുക.",
          b4: "ശമ്പളം പരിശോധിക്കുക.",
          b5: "ജോലി സമയം പരിശോധിക്കുക.",
          b6: "അഭിമുഖ വിശദാംശങ്ങൾ പരിശോധിക്കുക.",
          b7: "വ്യാജ ജോലികൾ റിപ്പോർട്ട് ചെയ്യുക.",
          b8: "പണം ആവശ്യപ്പെടൽ റിപ്പോർട്ട് ചെയ്യുക.",
          b9: "സംശയാസ്പദമായ സന്ദേശങ്ങൾ റിപ്പോർട്ട് ചെയ്യുക.",
        },
        getSupportWhenNeeded: {
          title: "ആവശ്യമുള്ളപ്പോൾ പിന്തുണ നേടുക",
          p1: "രജിസ്ട്രേഷൻ, ജോലി അലർട്ടുകൾ, അപേക്ഷകൾ, അഭിമുഖങ്ങൾ, പ്രൊഫൈൽ അപ്‌ഡേറ്റുകൾ, ഭാഷാ പിന്തുണ അല്ലെങ്കിൽ പരാതികൾക്ക് സഹായത്തിന് WhatsApp, കോൾ അല്ലെങ്കിൽ ഇമെയിൽ വഴി AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടാം.",
          b1: "WhatsApp",
          b2: "കോൾ",
          b3: "ഇമെയിൽ",
          b4: "രജിസ്ട്രേഷൻ",
          b5: "ജോലി അലർട്ടുകൾ",
          b6: "അപേക്ഷകൾ",
          b7: "അഭിമുഖങ്ങൾ",
          b8: "പ്രൊഫൈൽ അപ്‌ഡേറ്റുകൾ",
          b9: "ഭാഷാ പിന്തുണ",
          b10: "പരാതികൾ",
        },
      },
      cta: {
        title: "ജോലി തിരയൽ തുടങ്ങുക",
        p1: "AsliJobs ഉപയോഗിച്ച് ജോലികൾ കണ്ടെത്തുന്നതും അപേക്ഷിക്കുന്നതും ലളിതവും പരിചിതവും എളുപ്പവുമാണ്.",
        tagline: "പ്രൊഫൈൽ സൃഷ്ടിക്കുക. ജോലി അലർട്ടുകൾ ലഭിക്കുക. WhatsApp വഴി അപേക്ഷിക്കുക.",
        badge: "WhatsApp",
      },
    },
    postAJob: {
      title: "ജോലി പോസ്റ്റ് ചെയ്യുക",
      metaDescription: "AsliJobs ഉപയോഗിച്ച് ശരിയായ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ ഉദ്യോഗാർത്ഥികളെ നിയമിക്കുക.",
      intro: {
        i1: "AsliJobs ഉപയോഗിച്ച് ശരിയായ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ ഉദ്യോഗാർത്ഥികളെ നിയമിക്കുക. ഓഫീസ് സപ്പോർട്ട് ജീവനക്കാർ, ഡെലിവറി എക്സിക്യൂട്ടീവുകൾ, ഡ്രൈവർമാർ, ഇലക്ട്രീഷ്യൻമാർ, ഹൗസ്‌കീപ്പിങ് ജീവനക്കാർ, സെക്യൂരിറ്റി ഗാർഡുകൾ, വെയർഹൗസ് തൊഴിലാളികൾ, റീട്ടെയിൽ ജീവനക്കാർ, ടെക്നീഷ്യൻമാർ അല്ലെങ്കിൽ ഹെൽപ്പർമാർ വേണമെങ്കിലും, AsliJobs അനുയോജ്യരായ തൊഴിൽ അന്വേഷകരെ എളുപ്പത്തിൽ എത്താൻ സഹായിക്കുന്നു.",
      },
      sections: {
        postJobsEasily: {
          title: "ജോലികൾ എളുപ്പത്തിൽ പോസ്റ്റ് ചെയ്യുക",
          p1: "ജോലി ശീർഷകം, സ്ഥലം, ശമ്പളം, ജോലി സമയം, ഒഴിവുകളുടെ എണ്ണം, ആവശ്യമായ അനുഭവം, ആവശ്യമായ കഴിവുകൾ, ആനുകൂല്യങ്ങൾ, അഭിമുഖ വിശദാംശങ്ങൾ എന്നിവ പങ്കിട്ട് തൊഴിലുടമകൾക്ക് AsliJobs-ൽ ജോലികൾ പോസ്റ്റ് ചെയ്യാം.",
          b1: "ജോലി ശീർഷകം",
          b2: "സ്ഥലം",
          b3: "ശമ്പളം",
          b4: "ജോലി സമയം",
          b5: "ഒഴിവുകളുടെ എണ്ണം",
          b6: "ആവശ്യമായ അനുഭവം",
          b7: "ആവശ്യമായ കഴിവുകൾ",
          b8: "ആനുകൂല്യങ്ങൾ",
          b9: "അഭിമുഖ വിശദാംശങ്ങൾ",
        },
        reachSuitableCandidates: {
          title: "അനുയോജ്യരായ ഉദ്യോഗാർത്ഥികളെ എത്തുക",
          p1: "ജോലി പോസ്റ്റ് ചെയ്ത ശേഷം, സ്ഥലം, ജോലി വിഭാഗം, അനുഭവം, ഭാഷാ മുൻഗണന, ലഭ്യത എന്നിവ അടിസ്ഥാനമാക്കി ബന്ധപ്പെട്ട തൊഴിൽ അന്വേഷകരുമായി അവസരം പങ്കിടാൻ AsliJobs സഹായിക്കുന്നു.",
        },
        manageApplications: {
          title: "അപേക്ഷകൾ നിയന്ത്രിക്കുക",
          p1: "തൊഴിലുടമ ഡാഷ്‌ബോർഡ് വഴിയോ AsliJobs ടീമിന്റെ പിന്തുണയോടെയോ തൊഴിലുടമകൾക്ക് അപേക്ഷകൾ കാണാനും ഉദ്യോഗാർത്ഥികളെ ഷോർട്ട്‌ലിസ്റ്റ് ചെയ്യാനും അഭിമുഖങ്ങൾ ഷെഡ്യൂൾ ചെയ്യാനും നിയമന പുരോഗതി ട്രാക്ക് ചെയ്യാനും കഴിയും.",
        },
        promoteYourJob: {
          title: "ജോലി പ്രമോട്ട് ചെയ്യുക",
          p1: "ദൃശ്യത വർധിപ്പിച്ച് കൂടുതൽ അനുയോജ്യരായ ഉദ്യോഗാർത്ഥികളെ എത്താൻ തൊഴിലുടമകൾക്ക് പ്രമോട്ട് ചെയ്ത ജോലികളോ ക്യാമ്പെയ്ൻ പ്രമോഷനുകളോ തിരഞ്ഞെടുക്കാം.",
        },
      },
      cta: {
        title: "AsliJobs ഉപയോഗിച്ച് നിയമനം തുടങ്ങുക",
        p1: "AsliJobs-ൽ ജോലി പോസ്റ്റ് ചെയ്ത് ജോലി ചെയ്യാൻ തയ്യാറായ ഉദ്യോഗാർത്ഥികളുമായി ബന്ധപ്പെടുക.",
        tagline: "ജോലി പോസ്റ്റ് ചെയ്യുക. അനുയോജ്യരായ ഉദ്യോഗാർത്ഥികളെ എത്തുക. വേഗത്തിൽ നിയമിക്കുക.",
        badge: "തൊഴിലുടമകൾക്ക്",
      },
    },
    employerLogin: {
      title: "തൊഴിലുടമ ലോഗിൻ",
      metaDescription:
        "ജോലി പോസ്റ്റുകൾ, അപേക്ഷകൾ, ഉദ്യോഗാർത്ഥികൾ, അഭിമുഖങ്ങൾ, നിയമന പ്ലാനുകൾ, പ്രമോഷനുകൾ എന്നിവ നിയന്ത്രിക്കാൻ AsliJobs തൊഴിലുടമ ഡാഷ്‌ബോർഡ് ആക്സസ് ചെയ്യുക.",
      intro: {
        i1: "ജോലി പോസ്റ്റുകൾ, അപേക്ഷകൾ, ഉദ്യോഗാർത്ഥികൾ, അഭിമുഖങ്ങൾ, നിയമന പ്ലാനുകൾ, പ്രമോഷനുകൾ എന്നിവ ഒരിടത്ത് നിയന്ത്രിക്കാൻ AsliJobs തൊഴിലുടമ ഡാഷ്‌ബോർഡ് ആക്സസ് ചെയ്യുക.",
      },
      sections: {
        loginToYourEmployerDashboard: {
          title: "തൊഴിലുടമ ഡാഷ്‌ബോർഡിലേക്ക് ലോഗിൻ ചെയ്യുക",
          p1: "രജിസ്റ്റർ ചെയ്ത മൊബൈൽ നമ്പർ, ഇമെയിൽ വിലാസം അല്ലെങ്കിൽ AsliJobs നൽകുന്ന ലോഗിൻ ഓപ്ഷൻ ഉപയോഗിച്ച് തൊഴിലുടമകൾക്ക് ലോഗിൻ ചെയ്യാം.",
        },
        manageJobPosts: {
          title: "ജോലി പോസ്റ്റുകൾ നിയന്ത്രിക്കുക",
          p1: "ലോഗിൻ ചെയ്ത ശേഷം തൊഴിലുടമകൾക്ക് പുതിയ ജോലികൾ പോസ്റ്റ് ചെയ്യാനും ജോലി വിശദാംശങ്ങൾ തിരുത്താനും ഒഴിവുകൾ അപ്‌ഡേറ്റ് ചെയ്യാനും ജോലികൾ താൽക്കാലികമായി നിർത്താനും നിറഞ്ഞ സ്ഥാനങ്ങൾ അടയ്ക്കാനും സജീവ ജോലി പോസ്റ്റുകൾ ട്രാക്ക് ചെയ്യാനും കഴിയും.",
        },
        viewApplications: {
          title: "അപേക്ഷകൾ കാണുക",
          p1: "തൊഴിലുടമകൾക്ക് ജോലി പോസ്റ്റുകൾക്ക് ലഭിച്ച അപേക്ഷകൾ കാണാനും ഉദ്യോഗാർത്ഥി വിശദാംശങ്ങൾ പരിശോധിക്കാനും നിയമന ആവശ്യങ്ങൾക്കനുസരിച്ച് അനുയോജ്യമായ പ്രൊഫൈലുകൾ ഷോർട്ട്‌ലിസ്റ്റ് ചെയ്യാനും കഴിയും.",
        },
        scheduleInterviews: {
          title: "അഭിമുഖങ്ങൾ ഷെഡ്യൂൾ ചെയ്യുക",
          p1: "അഭിമുഖ തീയതി, സമയം, സ്ഥലം, ബന്ധപ്പെടേണ്ട വ്യക്തിയുടെ വിവരങ്ങൾ എന്നിവ ചേർത്ത് തൊഴിലുടമകൾക്ക് അഭിമുഖങ്ങൾ ഷെഡ്യൂൾ ചെയ്യാം. ഉദ്യോഗാർത്ഥികൾക്ക് WhatsApp വഴി അഭിമുഖ അപ്‌ഡേറ്റുകൾ ലഭിക്കാം.",
        },
        trackHiringProgress: {
          title: "നിയമന പുരോഗതി ട്രാക്ക് ചെയ്യുക",
          p1: "അപേക്ഷാ നില, ഷോർട്ട്‌ലിസ്റ്റ് ഉദ്യോഗാർത്ഥികൾ, ഷെഡ്യൂൾ ചെയ്ത അഭിമുഖങ്ങൾ, തിരഞ്ഞെടുത്ത ഉദ്യോഗാർത്ഥികൾ, അടച്ച ജോലി പോസ്റ്റുകൾ എന്നിവ ട്രാക്ക് ചെയ്യാൻ തൊഴിലുടമ ഡാഷ്‌ബോർഡ് സഹായിക്കുന്നു.",
        },
        managePlansAndPromotions: {
          title: "പ്ലാനുകളും പ്രമോഷനുകളും നിയന്ത്രിക്കുക",
          p1: "തൊഴിലുടമകൾക്ക് ഡാഷ്‌ബോർഡ് വഴി നിയമന പ്ലാനുകൾ, പ്രമോട്ട് ചെയ്ത ജോലികൾ, ക്യാമ്പെയ്ൻ പ്രമോഷനുകൾ, പേയ്‌മെന്റുകൾ, ഇൻവോയ്സുകൾ, പുതുക്കൽ വിശദാംശങ്ങൾ എന്നിവ കാണാം.",
        },
        needLoginHelp: {
          title: "ലോഗിൻ സഹായം വേണോ?",
          p1: "ലോഗിൻ ചെയ്യാനോ തൊഴിലുടമ ഡാഷ്‌ബോർഡ് ആക്സസ് ചെയ്യാനോ കഴിയുന്നില്ലെങ്കിൽ, WhatsApp, കോൾ അല്ലെങ്കിൽ ഇമെയിൽ വഴി AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടുക.",
          b1: "WhatsApp",
          b2: "കോൾ",
          b3: "ഇമെയിൽ",
        },
      },
      cta: {
        title: "തൊഴിലുടമ ലോഗിൻ",
        tagline: "ലോഗിൻ ചെയ്യുക. ജോലികൾ നിയന്ത്രിക്കുക. AsliJobs ഉപയോഗിച്ച് വേഗത്തിൽ നിയമിക്കുക.",
        badge: "തൊഴിലുടമകൾക്ക്",
      },
    },
    pricingPlans: {
      title: "വില പ്ലാനുകൾ",
      metaDescription:
        "ബിസിനസിന് ശരിയായ നിയമന പ്ലാൻ തിരഞ്ഞെടുത്ത് AsliJobs വഴി അനുയോജ്യരായ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ ഉദ്യോഗാർത്ഥികളുമായി ബന്ധപ്പെടുക.",
      intro: {
        i1: "ബിസിനസിന് ശരിയായ നിയമന പ്ലാൻ തിരഞ്ഞെടുത്ത് AsliJobs വഴി അനുയോജ്യരായ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ ഉദ്യോഗാർത്ഥികളുമായി ബന്ധപ്പെടുക.",
        i2: "ജോലികൾ പോസ്റ്റ് ചെയ്യാനും അപേക്ഷകൾ ലഭിക്കാനും ഒഴിവുകൾ പ്രമോട്ട് ചെയ്യാനും നിയമനം കൂടുതൽ ഫലപ്രദമായി നിയന്ത്രിക്കാനും ആഗ്രഹിക്കുന്ന തൊഴിലുടമകൾക്ക് AsliJobs പണമടച്ചുള്ള നിയമന പ്ലാനുകൾ നൽകുന്നു.",
      },
      sections: {
        simplePlansForEveryHiringNeed: {
          title: "ഓരോ നിയമന ആവശ്യത്തിനും ലളിതമായ പ്ലാനുകൾ",
          p1: "ഒരു റോളിനോ ഒന്നിലധികം ഒഴിവുകൾക്കോ നിയമിച്ചാലും, സ്ഥലം, ജോലി വിഭാഗം, അനുഭവം, ഭാഷാ മുൻഗണന, ലഭ്യത എന്നിവ അടിസ്ഥാനമാക്കി തൊഴിൽ അന്വേഷകരെ എത്താൻ AsliJobs സഹായിക്കുന്നു.",
        },
        employerHiringPlans: {
          title: "തൊഴിലുടമ നിയമന പ്ലാനുകൾ",
          cards: {
            basicHiringPlan: {
              title: "അടിസ്ഥാന നിയമന പ്ലാൻ",
              description:
                "ആർക്ക് ഏറ്റവും അനുയോജ്യം: പരിമിതമായ നിയമന ആവശ്യങ്ങളുള്ള തൊഴിലുടമകൾ. ഉൾപ്പെടുന്നത്: ജോലി പോസ്റ്റിങ്, ഉദ്യോഗാർത്ഥി അപേക്ഷകൾ, അടിസ്ഥാന ഡാഷ്‌ബോർഡ് ആക്സസ്.",
            },
            standardHiringPlan: {
              title: "സ്റ്റാൻഡേർഡ് നിയമന പ്ലാൻ",
              description:
                "ആർക്ക് ഏറ്റവും അനുയോജ്യം: പതിവായി നിയമിക്കുന്ന തൊഴിലുടമകൾ. ഉൾപ്പെടുന്നത്: ഒന്നിലധികം ജോലി പോസ്റ്റുകൾ, കൂടുതൽ ഉദ്യോഗാർത്ഥി എത്തിച്ചേരൽ, അപേക്ഷാ ട്രാക്കിങ്, പിന്തുണ.",
            },
            premiumHiringPlan: {
              title: "പ്രീമിയം നിയമന പ്ലാൻ",
              description:
                "ആർക്ക് ഏറ്റവും അനുയോജ്യം: വേഗത്തിലുള്ള നിയമനം വേണ്ട തൊഴിലുടമകൾ. ഉൾപ്പെടുന്നത്: കൂടുതൽ ദൃശ്യത, പ്രമോട്ട് ചെയ്ത ജോലി ഓപ്ഷനുകൾ, മുൻഗണനാ പിന്തുണ, മെച്ചപ്പെട്ട ഉദ്യോഗാർത്ഥി എത്തിച്ചേരൽ.",
            },
            campaignHiringPlan: {
              title: "ക്യാമ്പെയ്ൻ നിയമന പ്ലാൻ",
              description:
                "ആർക്ക് ഏറ്റവും അനുയോജ്യം: കൂട്ടമായോ അടിയന്തരമായോ നിയമനം വേണ്ട തൊഴിലുടമകൾ. ഉൾപ്പെടുന്നത്: ലക്ഷ്യമിട്ട നിയമന ക്യാമ്പെയ്‌നുകൾ, സ്ഥലാധിഷ്ഠിത എത്തിച്ചേരൽ, WhatsApp ജോലി അലർട്ടുകൾ, നിയമന പിന്തുണ.",
            },
          },
        },
        whatEmployersCanDo: {
          title: "തൊഴിലുടമകൾക്ക് എന്ത് ചെയ്യാം",
          b1: "ജോലികൾ പോസ്റ്റ് ചെയ്യുക",
          b2: "ഉദ്യോഗാർത്ഥി അപേക്ഷകൾ ലഭിക്കുക",
          b3: "ഉദ്യോഗാർത്ഥി വിശദാംശങ്ങൾ കാണുക",
          b4: "അനുയോജ്യമായ പ്രൊഫൈലുകൾ ഷോർട്ട്‌ലിസ്റ്റ് ചെയ്യുക",
          b5: "അഭിമുഖങ്ങൾ ഷെഡ്യൂൾ ചെയ്യുക",
          b6: "നിയമന പുരോഗതി ട്രാക്ക് ചെയ്യുക",
          b7: "ജോലി ഒഴിവുകൾ പ്രമോട്ട് ചെയ്യുക",
          b8: "നിയമനവുമായി ബന്ധപ്പെട്ട ചോദ്യങ്ങൾക്ക് പിന്തുണ നേടുക",
        },
        promotedJobs: {
          title: "പ്രമോട്ട് ചെയ്ത ജോലികൾ",
          p1: "പ്രധാനമോ അടിയന്തരമോ ആയ ഒഴിവുകളുടെ ദൃശ്യത വർധിപ്പിക്കാൻ പ്രമോട്ട് ചെയ്ത ജോലികൾ തൊഴിലുടമകളെ സഹായിക്കുന്നു. ഈ ജോലികൾ സ്ഥലം, ജോലി റോൾ, ഉദ്യോഗാർത്ഥി പ്രൊഫൈൽ എന്നിവ അടിസ്ഥാനമാക്കി കൂടുതൽ പ്രസക്തരായ തൊഴിൽ അന്വേഷകരെ എത്താം.",
        },
        campaignPromotions: {
          title: "ക്യാമ്പെയ്ൻ പ്രമോഷനുകൾ",
          p1: "കൂട്ടമായി നിയമിക്കാനോ പ്രത്യേക സ്ഥലങ്ങൾ ലക്ഷ്യമിടാനോ തിരഞ്ഞെടുത്ത ജോലി വിഭാഗങ്ങളിലെ തൊഴിൽ അന്വേഷകരെ എത്താനോ ആഗ്രഹിക്കുന്ന തൊഴിലുടമകൾക്ക് ക്യാമ്പെയ്ൻ പ്രമോഷനുകൾ ഉപയോഗപ്രദമാണ്.",
        },
        paymentsAndInvoices: {
          title: "പേയ്‌മെന്റുകളും ഇൻവോയ്സുകളും",
          p1: "തൊഴിലുടമകൾക്ക് അനുയോജ്യമായ പ്ലാൻ തിരഞ്ഞെടുത്ത് ലഭ്യമായ പേയ്‌മെന്റ് ഓപ്ഷനുകൾ വഴി പേയ്‌മെന്റ് പൂർത്തിയാക്കാം. പേയ്‌മെന്റിന് ശേഷം AsliJobs സപ്പോർട്ട് വഴി ഇൻവോയ്സുകൾ അഭ്യർത്ഥിക്കാം.",
        },
        needHelpChoosingAPlan: {
          title: "പ്ലാൻ തിരഞ്ഞെടുക്കാൻ സഹായം വേണോ?",
          p1: "നിയമന ആവശ്യത്തിന് ഏത് പ്ലാൻ ശരിയെന്ന് ഉറപ്പില്ലെങ്കിൽ AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടുക. ജോലി റോൾ, സ്ഥലം, ഒഴിവുകളുടെ എണ്ണം, നിയമന അടിയന്തരത എന്നിവ അടിസ്ഥാനമാക്കി അനുയോജ്യമായ പ്ലാൻ തിരഞ്ഞെടുക്കാൻ ഞങ്ങളുടെ ടീം സഹായിക്കും.",
        },
      },
      cta: {
        title: "AsliJobs ഉപയോഗിച്ച് നിയമനം തുടങ്ങുക",
        tagline: "ഒരു പ്ലാൻ തിരഞ്ഞെടുക്കുക. ജോലി പോസ്റ്റ് ചെയ്യുക. AsliJobs ഉപയോഗിച്ച് നിയമനം തുടങ്ങുക.",
        badge: "തൊഴിലുടമകൾക്ക്",
      },
    },
    employerGuide: {
      title: "തൊഴിലുടമ ഗൈഡ്",
      metaDescription:
        "ലളിതവും WhatsApp-സൗഹൃദവുമായ നിയമന പ്രക്രിയയിലൂടെ അനുയോജ്യരായ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ ഉദ്യോഗാർത്ഥികളെ നിയമിക്കാൻ AsliJobs തൊഴിലുടമകളെ സഹായിക്കുന്നു.",
      intro: {
        i1: "ലളിതവും WhatsApp-സൗഹൃദവുമായ നിയമന പ്രക്രിയയിലൂടെ അനുയോജ്യരായ ബ്ലൂ-കോളർ, ഗ്രേ-കോളർ ഉദ്യോഗാർത്ഥികളെ നിയമിക്കാൻ AsliJobs തൊഴിലുടമകളെ സഹായിക്കുന്നു. ഒരു റോളിനോ ഒന്നിലധികം ഒഴിവുകൾക്കോ നിയമിച്ചാലും, സ്ഥലം, ജോലി വിഭാഗം, അനുഭവം, കഴിവുകൾ, ഭാഷാ മുൻഗണന, ലഭ്യത എന്നിവ അടിസ്ഥാനമാക്കി തൊഴിൽ അന്വേഷകരെ എത്താൻ AsliJobs സഹായിക്കുന്നു.",
      },
      sections: {
        registerAsAnEmployer: {
          title: "തൊഴിലുടമയായി രജിസ്റ്റർ ചെയ്യുക",
          p1: "AsliJobs-ൽ തൊഴിലുടമ പ്രൊഫൈൽ സൃഷ്ടിച്ച് തുടങ്ങുക. തൊഴിലുടമയുടെ പേര്, കമ്പനി പേര്, ബന്ധപ്പെടേണ്ട വ്യക്തിയുടെ വിവരങ്ങൾ, മൊബൈൽ നമ്പർ, സ്ഥലം, ബിസിനസ് തരം, നിയമന വിഭാഗങ്ങൾ, ഇഷ്ടഭാഷ എന്നിവ പോലുള്ള അടിസ്ഥാന വിശദാംശങ്ങൾ പങ്കിടുക.",
          b1: "തൊഴിലുടമയുടെ പേര്",
          b2: "കമ്പനി പേര്",
          b3: "ബന്ധപ്പെടേണ്ട വ്യക്തിയുടെ വിവരങ്ങൾ",
          b4: "മൊബൈൽ നമ്പർ",
          b5: "സ്ഥലം",
          b6: "ബിസിനസ് തരം",
          b7: "നിയമന വിഭാഗങ്ങൾ",
          b8: "ഇഷ്ടഭാഷ",
        },
        postAJob: {
          title: "ജോലി പോസ്റ്റ് ചെയ്യുക",
          p1: "ജോലി ശീർഷകം, ശമ്പള പരിധി, ജോലി സ്ഥലം, സമയം, ഒഴിവുകളുടെ എണ്ണം, ആവശ്യമായ അനുഭവം, ആവശ്യമായ കഴിവുകൾ, ആനുകൂല്യങ്ങൾ, അഭിമുഖ വിശദാംശങ്ങൾ എന്നിവ പോലുള്ള വ്യക്തമായ വിശദാംശങ്ങൾ ചേർത്ത് ജോലി പോസ്റ്റ് ചെയ്യുക. വ്യക്തമായ ജോലി വിശദാംശങ്ങൾ തൊഴിൽ അന്വേഷകർക്ക് അവസരം നന്നായി മനസ്സിലാക്കി ആത്മവിശ്വാസത്തോടെ അപേക്ഷിക്കാൻ സഹായിക്കുന്നു.",
        },
        receiveApplications: {
          title: "അപേക്ഷകൾ ലഭിക്കുക",
          p1: "ജോലി പോസ്റ്റ് ചെയ്ത ശേഷം അനുയോജ്യരായ തൊഴിൽ അന്വേഷകർക്ക് ജോലി കാണാനും അപേക്ഷിക്കാനും കഴിയും. അപേക്ഷകൾ തൊഴിലുടമ ഡാഷ്‌ബോർഡ് വഴിയോ AsliJobs ടീമിന്റെ പിന്തുണയോടെയോ നിയന്ത്രിക്കാം.",
        },
        shortlistCandidates: {
          title: "ഉദ്യോഗാർത്ഥികളെ ഷോർട്ട്‌ലിസ്റ്റ് ചെയ്യുക",
          p1: "പേര്, സ്ഥലം, അനുഭവം, കഴിവുകൾ, പ്രതീക്ഷിക്കുന്ന ശമ്പളം, ലഭ്യത, ഇഷ്ടഭാഷ എന്നിവ പോലുള്ള ഉദ്യോഗാർത്ഥി വിശദാംശങ്ങൾ അവലോകനം ചെയ്യുക. നിയമന ആവശ്യങ്ങൾക്ക് യോജിക്കുന്ന ഉദ്യോഗാർത്ഥികളെ ഷോർട്ട്‌ലിസ്റ്റ് ചെയ്യുക.",
        },
        scheduleInterviews: {
          title: "അഭിമുഖങ്ങൾ ഷെഡ്യൂൾ ചെയ്യുക",
          p1: "ഷോർട്ട്‌ലിസ്റ്റ് ചെയ്ത ശേഷം അഭിമുഖ തീയതി, സമയം, സ്ഥലം, ബന്ധപ്പെടേണ്ട വ്യക്തിയുടെ വിവരങ്ങൾ എന്നിവ പങ്കിട്ട് അഭിമുഖങ്ങൾ ഷെഡ്യൂൾ ചെയ്യുക. ഉദ്യോഗാർത്ഥികൾക്ക് WhatsApp വഴി അഭിമുഖ അപ്‌ഡേറ്റുകൾ ലഭിക്കാം.",
        },
        trackHiringProgress: {
          title: "നിയമന പുരോഗതി ട്രാക്ക് ചെയ്യുക",
          p1: "അപേക്ഷകൾ, ഷോർട്ട്‌ലിസ്റ്റ് ഉദ്യോഗാർത്ഥികൾ, ഷെഡ്യൂൾ ചെയ്ത അഭിമുഖങ്ങൾ, തിരഞ്ഞെടുത്ത ഉദ്യോഗാർത്ഥികൾ, അടച്ച ജോലി പോസ്റ്റുകൾ എന്നിവ ട്രാക്ക് ചെയ്യാൻ തൊഴിലുടമ ഡാഷ്‌ബോർഡ് ഉപയോഗിക്കുക.",
        },
        promoteJobOpenings: {
          title: "ജോലി ഒഴിവുകൾ പ്രമോട്ട് ചെയ്യുക",
          p1: "ജോലി ദൃശ്യത മെച്ചപ്പെടുത്തി കൂടുതൽ അനുയോജ്യരായ ഉദ്യോഗാർത്ഥികളെ വേഗം എത്താൻ തൊഴിലുടമകൾക്ക് പ്രമോട്ട് ചെയ്ത ജോലികളോ ക്യാമ്പെയ്ൻ പ്രമോഷനുകളോ തിരഞ്ഞെടുക്കാം.",
        },
        updateOrCloseJobPosts: {
          title: "ജോലി പോസ്റ്റുകൾ അപ്‌ഡേറ്റ് ചെയ്യുകയോ അടയ്ക്കുകയോ ചെയ്യുക",
          p1: "ജോലി പോസ്റ്റുകൾ അപ്‌ഡേറ്റായി സൂക്ഷിക്കുക. ഒരു സ്ഥാനം നിറഞ്ഞാൽ, താൽക്കാലികമായി നിർത്തിയാൽ, റദ്ദാക്കിയാൽ അല്ലെങ്കിൽ ഇനി ലഭ്യമല്ലെങ്കിൽ, ഡാഷ്‌ബോർഡ് വഴിയോ AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെട്ടോ ജോലി പോസ്റ്റ് അപ്‌ഡേറ്റ് ചെയ്യുകയോ അടയ്ക്കുകയോ ചെയ്യുക.",
        },
        getEmployerSupport: {
          title: "തൊഴിലുടമ പിന്തുണ നേടുക",
          p1: "ജോലി പോസ്റ്റിങ്, അപേക്ഷകൾ, ഉദ്യോഗാർത്ഥി ഷോർട്ട്‌ലിസ്റ്റിങ്, അഭിമുഖങ്ങൾ, പേയ്‌മെന്റുകൾ, ഇൻവോയ്സുകൾ, പ്രമോഷനുകൾ അല്ലെങ്കിൽ ഡാഷ്‌ബോർഡ് പിന്തുണയ്ക്ക് WhatsApp, കോൾ അല്ലെങ്കിൽ ഇമെയിൽ വഴി തൊഴിലുടമകൾക്ക് AsliJobs സപ്പോർട്ടുമായി ബന്ധപ്പെടാം.",
          b1: "WhatsApp",
          b2: "കോൾ",
          b3: "ഇമെയിൽ",
          b4: "ജോലി പോസ്റ്റിങ്",
          b5: "അപേക്ഷകൾ",
          b6: "ഉദ്യോഗാർത്ഥി ഷോർട്ട്‌ലിസ്റ്റിങ്",
          b7: "അഭിമുഖങ്ങൾ",
          b8: "പേയ്‌മെന്റുകൾ",
          b9: "ഇൻവോയ്സുകൾ",
          b10: "പ്രമോഷനുകൾ",
          b11: "ഡാഷ്‌ബോർഡ് പിന്തുണ",
        },
        hiringTipsForEmployers: {
          title: "തൊഴിലുടമകൾക്കുള്ള നിയമന നിർദ്ദേശങ്ങൾ",
          b1: "പൂർണ്ണവും വ്യക്തവുമായ ജോലി വിശദാംശങ്ങൾ ചേർക്കുക.",
          b2: "ശരിയായ ശമ്പളം, സ്ഥലം, ജോലി സമയം എന്നിവ പറയുക.",
          b3: "അപേക്ഷകൾക്ക് സമയത്ത് മറുപടി നൽകുക.",
          b4: "അഭിമുഖ വിശദാംശങ്ങൾ വ്യക്തമായി പങ്കിടുക.",
          b5: "അനാവശ്യ അപേക്ഷകൾ ഒഴിവാക്കാൻ നിറഞ്ഞ ജോലികൾ അടയ്ക്കുക.",
          b6: "അടിയന്തരമോ കൂട്ട നിയമനമോ ആവശ്യമുള്ളപ്പോൾ പ്രമോഷനുകൾ ഉപയോഗിക്കുക.",
        },
      },
      cta: {
        title: "AsliJobs ഉപയോഗിച്ച് നിയമനം തുടങ്ങുക",
        p1: "ലളിതവും പരിചിതവുമായ പ്ലാറ്റ്‌ഫോം വഴി തൊഴിലുടമകളെ അനുയോജ്യരായ തൊഴിലാളി ഉദ്യോഗാർത്ഥികളുമായി ബന്ധിപ്പിച്ച് AsliJobs നിയമനം എളുപ്പമാക്കുന്നു.",
        tagline: "തൊഴിലുടമ പ്രൊഫൈൽ സൃഷ്ടിക്കുക. ജോലി പോസ്റ്റ് ചെയ്യുക. AsliJobs ഉപയോഗിച്ച് വേഗത്തിൽ നിയമിക്കുക.",
        badge: "തൊഴിലുടമകൾക്ക്",
      },
    },
    interviewTips: {
      title: "ഇന്റർവ്യൂ ടിപ്പുകൾ",
      metaDescription:
        "ഉദ്യോഗാർത്ഥികൾക്ക് നന്നായി തയ്യാറെടുക്കാനും ആത്മവിശ്വാസത്തോടെ ഇന്റർവ്യൂവിൽ പങ്കെടുക്കാനും തിരഞ്ഞെടുക്കപ്പെടാനും സഹായിക്കുന്ന ലളിതമായ ഇന്റർവ്യൂ ടിപ്പുകൾ.",
      intro: {
        i1: "കുറച്ച് തയ്യാറെടുപ്പ് ഇന്റർവ്യൂവിൽ നിങ്ങൾക്ക് ആത്മവിശ്വാസം നൽകുകയും നല്ല മതിപ്പ് ഉണ്ടാക്കാൻ സഹായിക്കുകയും ചെയ്യും. ഇന്റർവ്യൂവിന് മുമ്പും ഇന്റർവ്യൂ സമയത്തും ശേഷവും ഈ ലളിതമായ ടിപ്പുകൾ പിന്തുടരുക.",
      },
      sections: {
        prepareBeforeTheInterview: {
          title: "ഇന്റർവ്യൂവിന് മുമ്പ് തയ്യാറെടുക്കുക",
          p1: "ജോലിയുടെ റോൾ, ശമ്പളം, ജോലിസ്ഥലം, സമയം എന്നിവ ഉൾപ്പെടെയുള്ള ജോലി വിവരങ്ങൾ വീണ്ടും വായിക്കുക. നിങ്ങളുടെ കഴിവുകളും അനുഭവവും ഈ ജോലിക്ക് എങ്ങനെ യോജിക്കുന്നു എന്ന് ചിന്തിക്കുക.",
        },
        documentsToCarry: {
          title: "കൊണ്ടുപോകേണ്ട രേഖകൾ",
          p1: "ഇന്റർവ്യൂ ദിവസം തിരക്ക് ഒഴിവാക്കാൻ നിങ്ങളുടെ രേഖകൾ ഒരു ദിവസം മുമ്പേ തയ്യാറാക്കി വയ്ക്കുക.",
          b1: "ആധാർ കാർഡ് പോലുള്ള തിരിച്ചറിയൽ രേഖ",
          b2: "റെസ്യൂമെ അല്ലെങ്കിൽ പ്രൊഫൈൽ വിവരങ്ങൾ",
          b3: "അനുഭവ അല്ലെങ്കിൽ ശമ്പള സർട്ടിഫിക്കറ്റുകൾ, ഉണ്ടെങ്കിൽ",
          b4: "വിദ്യാഭ്യാസ സർട്ടിഫിക്കറ്റുകൾ, ആവശ്യമെങ്കിൽ",
          b5: "പാസ്‌പോർട്ട് സൈസ് ഫോട്ടോകൾ",
        },
        onTheInterviewDay: {
          title: "ഇന്റർവ്യൂ ദിവസം",
          p1: "നിങ്ങളുടെ യാത്ര ആസൂത്രണം ചെയ്ത് ഇന്റർവ്യൂ സ്ഥലത്ത് 10 മുതൽ 15 മിനിറ്റ് മുമ്പ് എത്തുക. വൃത്തിയുള്ള, ഭംഗിയുള്ള വസ്ത്രം ധരിക്കുകയും ഫോൺ സൈലന്റിൽ വയ്ക്കുകയും ചെയ്യുക.",
          b1: "സമയത്ത് എത്തുക",
          b2: "ഭംഗിയായി വസ്ത്രം ധരിക്കുക",
          b3: "വിനയത്തോടെ അഭിവാദ്യം ചെയ്യുക",
          b4: "ഫോൺ സൈലന്റിൽ വയ്ക്കുക",
        },
        answerWithConfidence: {
          title: "ആത്മവിശ്വാസത്തോടെ ഉത്തരം നൽകുക",
          p1: "ശ്രദ്ധയോടെ കേൾക്കുക, സത്യസന്ധമായി ഉത്തരം നൽകുക, വ്യക്തമായി സംസാരിക്കുക. ഇതുപോലുള്ള സാധാരണ ചോദ്യങ്ങൾക്ക് തയ്യാറായിരിക്കുക.",
          b1: "നിങ്ങളെക്കുറിച്ച് പറയൂ.",
          b2: "മുമ്പ് എന്ത് ജോലിയാണ് ചെയ്തിരുന്നത്?",
          b3: "എപ്പോൾ ജോലിയിൽ ചേരാൻ കഴിയും?",
          b4: "എത്ര ശമ്പളം പ്രതീക്ഷിക്കുന്നു?",
        },
        afterTheInterview: {
          title: "ഇന്റർവ്യൂവിന് ശേഷം",
          p1: "പോകുന്നതിന് മുമ്പ് ഇന്റർവ്യൂ ചെയ്തയാൾക്ക് നന്ദി പറയുക. ഇന്റർവ്യൂ ഫലവും അടുത്ത ഘട്ടങ്ങളും WhatsApp-ൽ അയയ്ക്കും, അതിനാൽ സന്ദേശങ്ങൾ പരിശോധിച്ചുകൊണ്ടിരിക്കുകയും സമയത്ത് മറുപടി നൽകുകയും ചെയ്യുക.",
        },
        staySafe: {
          title: "സുരക്ഷിതരായിരിക്കുക",
          p1: "യഥാർത്ഥ തൊഴിലുടമകൾ ഇന്റർവ്യൂ ഷെഡ്യൂൾ ചെയ്യാനോ ജോലി ഉറപ്പാക്കാനോ പണം ആവശ്യപ്പെടില്ല. ആരെങ്കിലും പണം ആവശ്യപ്പെട്ടാൽ നൽകരുത്, ഉടൻ AsliJobs സപ്പോർട്ടിനെ അറിയിക്കുക.",
          b1: "ഇന്റർവ്യൂവിനോ ജോലി ഉറപ്പാക്കുന്നതിനോ പണം നൽകരുത്.",
          b2: "ജോലി വിവരങ്ങളിൽ നൽകിയ വിലാസത്തിൽ മാത്രം ഇന്റർവ്യൂവിന് പോകുക.",
          b3: "സംശയാസ്പദമായ ആവശ്യങ്ങൾ AsliJobs സപ്പോർട്ടിനെ അറിയിക്കുക.",
        },
      },
      cta: {
        title: "WhatsApp-ൽ ഇന്റർവ്യൂ അപ്‌ഡേറ്റുകൾ നേടുക",
        p1: "അനുയോജ്യമായ ജോലികൾക്ക് അപേക്ഷിക്കുകയും ഇന്റർവ്യൂ വിവരങ്ങൾ നേരിട്ട് WhatsApp-ൽ നേടുകയും ചെയ്യുക.",
        tagline: "നന്നായി തയ്യാറെടുക്കുക. സമയത്ത് എത്തുക. തിരഞ്ഞെടുക്കപ്പെടുക.",
        badge: "WhatsApp",
      },
    },
    salaryGuide: {
      title: "ശമ്പള ഗൈഡ്",
      metaDescription:
        "ജോലി സ്വീകരിക്കുന്നതിന് മുമ്പ് ജോബ് ഓഫറിലെ ശമ്പള വിവരങ്ങൾ മനസ്സിലാക്കുക — കൈയിൽ കിട്ടുന്ന ശമ്പളം, കിഴിവുകൾ, അധിക വേതനം, പേയ്‌മെന്റ് ഷെഡ്യൂൾ.",
      intro: {
        i1: "ഏത് ജോലിയിലും ശമ്പളം ഏറ്റവും പ്രധാനപ്പെട്ട ഭാഗമാണ്. ജോബ് അലേർട്ടിലോ ഓഫറിലോ ഉള്ള ശമ്പള വിവരങ്ങൾ മനസ്സിലാക്കി ശരിയായ തീരുമാനമെടുക്കാൻ ഈ ഗൈഡ് സഹായിക്കുന്നു.",
      },
      sections: {
        checkTheSalaryInJobDetails: {
          title: "ജോലി വിവരങ്ങളിൽ ശമ്പളം പരിശോധിക്കുക",
          p1: "AsliJobs-ലെ ഓരോ ജോലിയിലും തൊഴിലുടമ നൽകുന്ന ശമ്പളം കാണിക്കുന്നു. അപേക്ഷിക്കുന്നതിന് മുമ്പ് ജോലിയുടെ റോൾ, ജോലി സമയം, സ്ഥലം എന്നിവയ്‌ക്കൊപ്പം അത് ശ്രദ്ധയോടെ വായിക്കുക.",
        },
        inHandSalaryAndDeductions: {
          title: "കൈയിൽ കിട്ടുന്ന ശമ്പളവും കിഴിവുകളും",
          p1: "കിഴിവുകൾക്ക് ശേഷം നിങ്ങൾക്ക് ലഭിക്കുന്ന തുകയാണ് കൈയിൽ കിട്ടുന്ന ശമ്പളം. കാണിച്ചിരിക്കുന്ന ശമ്പളം കൈയിൽ കിട്ടുന്നതാണോ അതോ PF അല്ലെങ്കിൽ ESI പോലുള്ള കിഴിവുകൾക്ക് മുമ്പുള്ളതാണോ എന്ന് തൊഴിലുടമയോട് ചോദിക്കുക.",
          b1: "കൈയിൽ കിട്ടുന്ന (ടേക്ക്-ഹോം) ശമ്പളം",
          b2: "PF (പ്രൊവിഡന്റ് ഫണ്ട്)",
          b3: "ESI (എംപ്ലോയീസ് സ്റ്റേറ്റ് ഇൻഷുറൻസ്)",
          b4: "മറ്റ് കിഴിവുകൾ, ഉണ്ടെങ്കിൽ",
        },
        extraPayAndBenefits: {
          title: "അധിക വേതനവും ആനുകൂല്യങ്ങളും",
          p1: "ചില ജോലികളിൽ ശമ്പളത്തോടൊപ്പം അധിക വേതനമോ ആനുകൂല്യങ്ങളോ ലഭിക്കും. അതിൽ എന്തെല്ലാം ഉൾപ്പെടുന്നു എന്ന് വ്യക്തമായി ചോദിക്കുക.",
          b1: "ഓവർടൈം വേതനം",
          b2: "ഇൻസെന്റീവുകൾ",
          b3: "ഭക്ഷണം അല്ലെങ്കിൽ താമസം",
          b4: "യാത്രാ ബത്ത",
          b5: "ആഴ്ചതോറുമുള്ള അവധിയും ശമ്പളത്തോടുകൂടിയ അവധിയും",
        },
        salaryPaymentSchedule: {
          title: "ശമ്പള പേയ്‌മെന്റ് ഷെഡ്യൂൾ",
          p1: "ശമ്പളം എപ്പോൾ, എങ്ങനെ നൽകും എന്ന് ഉറപ്പാക്കുക — മാസത്തിലോ ആഴ്ചയിലോ ദിവസത്തിലോ, ബാങ്ക് ട്രാൻസ്ഫർ വഴിയോ പണമായോ. നിങ്ങളുടെ ശമ്പള പേയ്‌മെന്റുകളുടെ രേഖ സൂക്ഷിക്കുക.",
        },
        whatAffectsYourSalary: {
          title: "നിങ്ങളുടെ ശമ്പളത്തെ ബാധിക്കുന്നവ",
          p1: "ഈ ഘടകങ്ങൾ അനുസരിച്ച് ശമ്പളം വ്യത്യാസപ്പെടാം. നിങ്ങളുടെ കഴിവുകൾ മെച്ചപ്പെടുത്തുകയും പ്രൊഫൈൽ അപ്‌ഡേറ്റ് ചെയ്യുകയും ചെയ്താൽ മികച്ച ശമ്പളമുള്ള ജോലികൾ കണ്ടെത്താം.",
          b1: "അനുഭവം",
          b2: "കഴിവുകൾ",
          b3: "ജോലി വിഭാഗം",
          b4: "നഗരവും സ്ഥലവും",
          b5: "ഷിഫ്റ്റും ജോലി സമയവും",
        },
        salarySafety: {
          title: "ശമ്പള സുരക്ഷ",
          p1: "ജോലിക്കോ കൂടുതൽ ശമ്പളത്തിനോ വേണ്ടി ഒരിക്കലും പണം നൽകരുത്. കുറഞ്ഞ ജോലിക്ക് വളരെ ഉയർന്ന ശമ്പളം വാഗ്ദാനം ചെയ്യുന്ന ഓഫറുകളിൽ ജാഗ്രത പാലിക്കുകയും അവ AsliJobs സപ്പോർട്ടിനെ അറിയിക്കുകയും ചെയ്യുക.",
          b1: "ജോലിക്കായി ഒരിക്കലും പണം നൽകരുത്.",
          b2: "അവിശ്വസനീയമായ ശമ്പള വാഗ്ദാനങ്ങളിൽ ജാഗ്രത പാലിക്കുക.",
          b3: "സംശയാസ്പദമായ ഓഫറുകൾ AsliJobs സപ്പോർട്ടിനെ അറിയിക്കുക.",
        },
      },
      cta: {
        title: "വ്യക്തമായ ശമ്പള വിവരങ്ങളുള്ള ജോലികൾ കണ്ടെത്തുക",
        p1: "ശമ്പളം, സ്ഥലം, സമയം എന്നിവയുള്ള ജോബ് അലേർട്ടുകൾ നേരിട്ട് WhatsApp-ൽ നേടുക.",
        tagline: "നിങ്ങളുടെ ശമ്പളം അറിയുക. ശരിയായ ജോലി തിരഞ്ഞെടുക്കുക.",
        badge: "WhatsApp",
      },
    },
    careerAdvice: {
      title: "കരിയർ ഉപദേശം",
      metaDescription:
        "ഉദ്യോഗാർത്ഥികൾക്ക് കഴിവുകൾ വളർത്താനും മികച്ച ജോലികൾ നേടാനും സ്ഥിരതയുള്ള കരിയർ കെട്ടിപ്പടുക്കാനും സഹായിക്കുന്ന പ്രായോഗിക ഉപദേശങ്ങൾ.",
      intro: {
        i1: "ഓരോ ജോലിയും നിങ്ങളുടെ കരിയറിലെ ഒരു ചുവടാണ്. ഈ പ്രായോഗിക ടിപ്പുകൾ നിങ്ങളുടെ കഴിവുകൾ വളർത്താനും മികച്ച അവസരങ്ങൾ കണ്ടെത്താനും സ്ഥിരതയുള്ള ഭാവി കെട്ടിപ്പടുക്കാനും സഹായിക്കും.",
      },
      sections: {
        keepYourProfileUpdated: {
          title: "നിങ്ങളുടെ പ്രൊഫൈൽ അപ്‌ഡേറ്റ് ചെയ്യുക",
          p1: "നിങ്ങളുടെ കഴിവുകൾ, അനുഭവം, ഇഷ്ടപ്പെട്ട സ്ഥലം, പ്രതീക്ഷിക്കുന്ന ശമ്പളം എന്നിവ മാറുമ്പോഴെല്ലാം അപ്‌ഡേറ്റ് ചെയ്യുക. അപ്‌ഡേറ്റ് ചെയ്ത പ്രൊഫൈൽ AsliJobs-ന് നിങ്ങൾക്ക് മികച്ച ജോലികൾ അയയ്ക്കാൻ സഹായിക്കുന്നു.",
        },
        learnNewSkills: {
          title: "പുതിയ കഴിവുകൾ പഠിക്കുക",
          p1: "പുതിയ കഴിവുകൾ മികച്ച ജോലികളിലേക്കും ഉയർന്ന ശമ്പളത്തിലേക്കും വഴി തുറക്കും. അനുഭവപരിചയമുള്ള സഹപ്രവർത്തകരിൽ നിന്ന് പഠിക്കുക, ചെറിയ പരിശീലന കോഴ്‌സുകളിൽ ചേരുക, സാധ്യമെങ്കിൽ സർട്ടിഫിക്കറ്റുകൾ നേടുക.",
          b1: "ഡ്രൈവർ ജോലികൾക്ക് ഡ്രൈവിംഗ് ലൈസൻസ്",
          b2: "അടിസ്ഥാന കമ്പ്യൂട്ടർ, മൊബൈൽ കഴിവുകൾ",
          b3: "ജോലിസ്ഥല സുരക്ഷാ പരിശീലനം",
          b4: "ഇലക്ട്രിക്കൽ അല്ലെങ്കിൽ പ്ലംബിംഗ് പോലുള്ള തൊഴിൽ കഴിവുകൾ",
          b5: "കസ്റ്റമർ സർവീസും ആശയവിനിമയവും",
        },
        chooseTheRightJob: {
          title: "ശരിയായ ജോലി തിരഞ്ഞെടുക്കുക",
          p1: "ശമ്പളം മാത്രം നോക്കരുത്. ജോലി സ്വീകരിക്കുന്നതിന് മുമ്പ് ഈ കാര്യങ്ങൾ പരിഗണിക്കുക.",
          b1: "ജോലിസ്ഥലവും യാത്രാ സമയവും",
          b2: "ഷിഫ്റ്റ് സമയം",
          b3: "ജോലി സുരക്ഷ",
          b4: "വളർച്ചാ അവസരങ്ങൾ",
        },
        growInYourCurrentJob: {
          title: "നിലവിലെ ജോലിയിൽ വളരുക",
          p1: "ജോലിയിൽ സമയനിഷ്ഠയും വിശ്വാസ്യതയും സത്യസന്ധതയും പാലിക്കുക. നല്ല ഹാജരും പോസിറ്റീവ് മനോഭാവവും വിശ്വാസം, ഉത്തരവാദിത്തം, സ്ഥാനക്കയറ്റം എന്നിവ നേടാൻ സഹായിക്കും.",
          b1: "സമയത്ത് എത്തുക",
          b2: "നിങ്ങളുടെ സൂപ്പർവൈസറിൽ നിന്ന് പഠിക്കുക",
          b3: "ഉത്തരവാദിത്തം ഏറ്റെടുക്കുക",
          b4: "നിങ്ങളുടെ ജോലി അനുഭവത്തിന്റെ രേഖ സൂക്ഷിക്കുക",
        },
        planYourNextStep: {
          title: "നിങ്ങളുടെ അടുത്ത ചുവട് ആസൂത്രണം ചെയ്യുക",
          p1: "സൂപ്പർവൈസർ, സീനിയർ ടെക്നീഷ്യൻ അല്ലെങ്കിൽ ടീം ലീഡർ ആകുക പോലുള്ള വ്യക്തമായ ലക്ഷ്യം നിശ്ചയിക്കുക. നിങ്ങളുടെ അടുത്ത ജോലി അപേക്ഷയ്ക്കായി അനുഭവ സർട്ടിഫിക്കറ്റുകളും റഫറൻസുകളും ശേഖരിക്കുക.",
        },
      },
      cta: {
        title: "നിങ്ങളുടെ കരിയറിൽ അടുത്ത ചുവട് വയ്ക്കുക",
        p1: "നിങ്ങളുടെ കഴിവുകൾക്കും ലക്ഷ്യങ്ങൾക്കും യോജിക്കുന്ന ജോലികൾ കണ്ടെത്തുകയും അലേർട്ടുകൾ നേരിട്ട് WhatsApp-ൽ നേടുകയും ചെയ്യുക.",
        tagline: "പഠിക്കുക. വളരുക. മികച്ച ജോലികൾ നേടുക.",
        badge: "WhatsApp",
      },
    },
  },
};

export const publicPagesBundle = { en, hi, te, ta, kn, ml } as const;
