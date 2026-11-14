import { apiClient } from "@/services/api-client";
import { normalizeAbortedRequestError } from "@/utils/query-error";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export type PublicStateCount = {
  state: string;
  stateName: string;
  count: number;
};

export type PublicCityCount = {
  city: string;
  cityName: string;
  state: string;
  stateName: string;
  count: number;
};

export type PublicLocationCounts = {
  states: PublicStateCount[];
  cities: PublicCityCount[];
};

/** Active jobs grouped with the same visibility rule as the public jobs list. */
export async function fetchPublicLocationCounts(options?: {
  signal?: AbortSignal;
}) {
  try {
    const response = await apiClient.get<ApiSuccess<PublicLocationCounts>>(
      "/jobs/public/location-counts",
      { signal: options?.signal },
    );
    return response.data.data;
  } catch (error) {
    throw normalizeAbortedRequestError(error, options?.signal);
  }
}
