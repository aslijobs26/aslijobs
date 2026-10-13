import {
  SITE_DEFAULT_LANGUAGE,
  type SiteLanguageOption,
} from "../constants/site-language";

/**
 * Public employer auth pages stay on the website language.
 * Every other employer workspace route, including job posting, is English-only.
 */
const PUBLIC_EMPLOYER_AUTH_PREFIXES = [
  "/employer/login",
  "/employer/register",
  "/employer/member-login",
] as const;

function pathnameOnly(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] ?? "";
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path || "/";
}

export function isEmployerDashboardInterfacePath(pathname: string): boolean {
  const path = pathnameOnly(pathname);
  if (path === "/post-job" || path.startsWith("/post-job/")) {
    return true;
  }
  if (path !== "/employer" && !path.startsWith("/employer/")) {
    return false;
  }
  return !PUBLIC_EMPLOYER_AUTH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/** Dashboard chrome uses English. The stored public language is left unchanged. */
export function resolveInterfaceSiteLanguage(
  pathname: string,
  publicLanguage: SiteLanguageOption,
): SiteLanguageOption {
  return isEmployerDashboardInterfacePath(pathname)
    ? SITE_DEFAULT_LANGUAGE
    : publicLanguage;
}
