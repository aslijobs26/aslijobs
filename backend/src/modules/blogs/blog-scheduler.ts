import { publishDueBlogs } from "./blog.service.js";

const INTERVAL_MS = 60_000;

export function startBlogPublishScheduler(): () => void {
  const timer = setInterval(() => {
    void publishDueBlogs().catch((error) => {
      console.error("[blogs] scheduled publish failed", error);
    });
  }, INTERVAL_MS);
  timer.unref?.();
  return () => clearInterval(timer);
}
