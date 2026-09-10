import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDevelopmentCorsPorts,
  isDevelopmentLanOriginAllowed,
  isPrivateOrLoopbackHostname,
} from "./cors-origins.js";

describe("cors LAN development helpers", () => {
  it("recognizes private and loopback hostnames", () => {
    assert.equal(isPrivateOrLoopbackHostname("localhost"), true);
    assert.equal(isPrivateOrLoopbackHostname("127.0.0.1"), true);
    assert.equal(isPrivateOrLoopbackHostname("192.168.1.20"), true);
    assert.equal(isPrivateOrLoopbackHostname("10.0.0.8"), true);
    assert.equal(isPrivateOrLoopbackHostname("172.16.4.2"), true);
    assert.equal(isPrivateOrLoopbackHostname("172.32.0.1"), false);
    assert.equal(isPrivateOrLoopbackHostname("aslijobs.com"), false);
  });

  it("allows LAN origins only on configured frontend/admin ports", () => {
    const ports = buildDevelopmentCorsPorts({
      frontendUrl: "http://localhost:3000",
      adminUrl: "http://localhost:5173",
    });

    assert.equal(
      isDevelopmentLanOriginAllowed("http://192.168.1.20:3000", ports),
      true,
    );
    assert.equal(
      isDevelopmentLanOriginAllowed("http://10.0.0.5:5173", ports),
      true,
    );
    assert.equal(
      isDevelopmentLanOriginAllowed("http://192.168.1.20:4000", ports),
      false,
    );
    assert.equal(
      isDevelopmentLanOriginAllowed("https://evil.example:3000", ports),
      false,
    );
  });
});
