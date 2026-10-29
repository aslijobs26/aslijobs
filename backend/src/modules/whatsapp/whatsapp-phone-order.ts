const chains = new Map<string, Promise<void>>();

/**
 * Run work for one WhatsApp number in arrival order inside this process.
 * A second message waits until the first turn finishes, including a failure.
 * A different number is not blocked. This does not coordinate separate Node
 * processes; a multi-process worker can still interleave the same number.
 */
export function runInPhoneOrder<T>(phone: string, task: () => Promise<T>): Promise<T> {
  const key = phone || "unknown";
  const previous = chains.get(key) ?? Promise.resolve();
  const run = previous.then(task, task);
  const settled = run.then(
    () => undefined,
    () => undefined,
  );
  chains.set(key, settled);
  void settled.then(() => {
    if (chains.get(key) === settled) chains.delete(key);
  });
  return run;
}
