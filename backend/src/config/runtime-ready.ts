/**
 * Process-local readiness flag for graceful drain.
 * `/api/v1/health` stays a liveness probe; `/api/v1/health/ready` uses this.
 */
let shuttingDown = false;

export function markRuntimeShuttingDown(): void {
  shuttingDown = true;
}

export function isRuntimeShuttingDown(): boolean {
  return shuttingDown;
}
