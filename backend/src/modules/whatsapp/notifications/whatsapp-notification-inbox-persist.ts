/**
 * Meta has already accepted the template. A database failure must not cause
 * another send. The inbox write is separate from dispatch acceptance.
 */
export async function persistAcceptedWhatsAppTemplate(input: {
  markAccepted: () => Promise<void>;
  recordInbox: () => Promise<void>;
  stopRetry: (reason: string) => Promise<void>;
}): Promise<"stored" | "inbox_failed" | "not_retried"> {
  try {
    await input.markAccepted();
  } catch (error) {
    console.error(
      `[WhatsAppNotification] accepted message was not stored reason=${
        error instanceof Error ? error.name : "unknown"
      }`,
    );
    try {
      await input.stopRetry("dispatch_persist_failed");
    } catch (nested) {
      console.error(
        `[WhatsAppNotification] accepted message retry lock failed reason=${
          nested instanceof Error ? nested.name : "unknown"
        }`,
      );
    }
    return "not_retried";
  }

  try {
    await input.recordInbox();
  } catch (error) {
    console.error(
      `[WhatsAppNotification] inbox mirror failed reason=${
        error instanceof Error ? error.name : "unknown"
      }`,
    );
    return "inbox_failed";
  }

  return "stored";
}
