export type EmployerPosterImageAsset = {
  url?: string;
  fileSize?: number;
  updatedAt?: string | null;
};

export type EmployerPosterImageSource = {
  accountType?: string;
  companyLogo?: EmployerPosterImageAsset | null;
  profilePhoto?: EmployerPosterImageAsset | null;
};

function versionFromStoredUrl(url?: string): number {
  if (!url) {
    return 0;
  }

  const match = url.match(/-(\d{10,})-[0-9a-f]{8}\.[a-z0-9]+(?:\?|$)/i);
  if (!match) {
    return 0;
  }

  const value = Number(match[1]);
  return Number.isFinite(value) ? value : 0;
}

function assetVersion(asset?: EmployerPosterImageAsset | null): number {
  if (!asset) {
    return 0;
  }

  if (asset.updatedAt) {
    const timestamp = new Date(asset.updatedAt).getTime();
    if (Number.isFinite(timestamp) && timestamp > 0) {
      return timestamp;
    }
  }

  return versionFromStoredUrl(asset.url);
}

function withMediaCacheBuster(url: string, version?: number): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  if (/[?&]v=/.test(trimmed)) {
    return trimmed;
  }

  if (!version) {
    return trimmed;
  }

  const separator = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${separator}v=${encodeURIComponent(String(version))}`;
}

export function resolveEmployerPosterImageUrl(
  employer?: EmployerPosterImageSource | null,
): string {
  if (!employer) {
    return "";
  }

  const photoUrl = employer.profilePhoto?.url?.trim() ?? "";
  const logoUrl = employer.companyLogo?.url?.trim() ?? "";

  if (photoUrl && logoUrl) {
    const photoVersion = assetVersion(employer.profilePhoto);
    const logoVersion = assetVersion(employer.companyLogo);

    if (photoVersion === 0 && logoVersion === 0) {
      return employer.accountType === "individual" ? photoUrl : logoUrl;
    }

    const chosen =
      photoVersion >= logoVersion
        ? employer.profilePhoto
        : employer.companyLogo;
    return withMediaCacheBuster(
      chosen?.url?.trim() ?? photoUrl,
      assetVersion(chosen),
    );
  }

  const singleAsset = photoUrl
    ? employer.profilePhoto
    : logoUrl
      ? employer.companyLogo
      : null;

  return withMediaCacheBuster(photoUrl || logoUrl, assetVersion(singleAsset));
}
