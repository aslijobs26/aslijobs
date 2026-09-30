export type SocialPlatform =
  | "x"
  | "facebook"
  | "instagram"
  | "youtube"
  | "linkedin";

export type SocialLink = {
  id: SocialPlatform;
  label: string;
  href: string;
};

const ASLIJOBS_SOCIAL_URLS = {
  x: "https://x.com/aslijobs",
  facebook: "https://www.facebook.com/profile.php?id=61592164760867",
  instagram: "https://www.instagram.com/asli.jobs/",
  youtube: "https://www.youtube.com/@Aslijobs",
  linkedin: "https://www.linkedin.com/company/aslijobs/",
} as const;

function resolveSocialUrl(
  value: string | undefined,
  fallback: string,
): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "#") {
    return fallback;
  }
  return trimmed;
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: "x",
    label: "X",
    href: resolveSocialUrl(process.env.NEXT_PUBLIC_X_URL, ASLIJOBS_SOCIAL_URLS.x),
  },
  {
    id: "facebook",
    label: "Facebook",
    href: resolveSocialUrl(
      process.env.NEXT_PUBLIC_FACEBOOK_URL,
      ASLIJOBS_SOCIAL_URLS.facebook,
    ),
  },
  {
    id: "instagram",
    label: "Instagram",
    href: resolveSocialUrl(
      process.env.NEXT_PUBLIC_INSTAGRAM_URL,
      ASLIJOBS_SOCIAL_URLS.instagram,
    ),
  },
  {
    id: "youtube",
    label: "YouTube",
    href: resolveSocialUrl(
      process.env.NEXT_PUBLIC_YOUTUBE_URL,
      ASLIJOBS_SOCIAL_URLS.youtube,
    ),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: resolveSocialUrl(
      process.env.NEXT_PUBLIC_LINKEDIN_URL,
      ASLIJOBS_SOCIAL_URLS.linkedin,
    ),
  },
];
