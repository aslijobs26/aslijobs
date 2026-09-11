import { isAxiosError } from "axios";

export function workMutationErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 409) {
      return "This work item was updated by another user. Refresh and try again.";
    }
    if (status === 403) {
      const message = error.response?.data?.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
      return "You don't have permission to perform this action.";
    }
    if (status === 404) {
      return "Work item not found.";
    }
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
