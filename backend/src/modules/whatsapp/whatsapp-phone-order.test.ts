import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runInPhoneOrder } from "./whatsapp-phone-order.js";

describe("whatsapp per-number message order", () => {
  it("runs two messages for one number in order and lets another number overlap", async () => {
    const order: string[] = [];
    let releaseFirst: () => void = () => {};
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = runInPhoneOrder("9000000001", async () => {
      order.push("a-start");
      await firstGate;
      order.push("a-end");
    });
    const second = runInPhoneOrder("9000000001", async () => {
      order.push("b");
    });
    const other = runInPhoneOrder("9000000002", async () => {
      order.push("c");
    });

    await other;
    assert.deepEqual(order, ["a-start", "c"]);
    releaseFirst();
    await Promise.all([first, second]);
    assert.deepEqual(order, ["a-start", "c", "a-end", "b"]);
  });

  it("still runs the next message after the first turn fails", async () => {
    const order: string[] = [];
    await runInPhoneOrder("9000000003", async () => {
      order.push("fail");
      throw new Error("worker crashed");
    }).catch(() => undefined);
    await runInPhoneOrder("9000000003", async () => {
      order.push("next");
    });
    assert.deepEqual(order, ["fail", "next"]);
  });
});
