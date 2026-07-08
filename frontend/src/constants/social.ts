export type SocialPlatform = "facebook" | "instagram" | "linkedin" | "youtube";



export type SocialLink = {

  id: SocialPlatform;

  label: string;

  href: string;

};



function resolveSocialUrl(value: string | undefined) {

  if (!value || value === "#") {

    return "#";

  }



  return value;

}



export const SOCIAL_LINKS: SocialLink[] = [

  {

    id: "facebook",

    label: "Facebook",

    href: resolveSocialUrl(process.env.NEXT_PUBLIC_FACEBOOK_URL),

  },

  {

    id: "instagram",

    label: "Instagram",

    href: resolveSocialUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL),

  },

  {

    id: "linkedin",

    label: "LinkedIn",

    href: resolveSocialUrl(process.env.NEXT_PUBLIC_LINKEDIN_URL),

  },

  {

    id: "youtube",

    label: "YouTube",

    href: resolveSocialUrl(process.env.NEXT_PUBLIC_YOUTUBE_URL),

  },

];


