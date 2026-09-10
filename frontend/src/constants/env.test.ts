import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adaptApiUrlForPageHost,
  isPrivateOrLoopbackHostname,
  resolveApiUrl,
} from "./env";

describe("resolveApiUrl", () => {
  it("falls back to localhost API when unset", () => {
    assert.equal(resolveApiUrl(undefined), "http://localhost:5000/api/v1");
    assert.equal(resolveApiUrl(""), "http://localhost:5000/api/v1");
  });

  it("normalizes host-only values to /api/v1", () => {
    assert.equal(
      resolveApiUrl("https://aslijobs-backend.onrender.com"),
      "https://aslijobs-backend.onrender.com/api/v1",
    );
  });
});

describe("adaptApiUrlForPageHost", () => {
  it("remaps loopback API hosts onto LAN page hostnames", () => {
    assert.equal(
      adaptApiUrlForPageHost(
        "http://localhost:5000/api/v1",
        "192.168.1.20",
      ),
      "http://192.168.1.20:5000/api/v1",
    );
    assert.equal(
      adaptApiUrlForPageHost("http://127.0.0.1:5000/api/v1", "10.0.0.8"),
      "http://10.0.0.8:5000/api/v1",
    );
  });

  it("does not remap localhost pages or production API hosts", () => {
    assert.equal(
      adaptApiUrlForPageHost("http://localhost:5000/api/v1", "localhost"),
      "http://localhost:5000/api/v1",
    );
    assert.equal(
      adaptApiUrlForPageHost(
        "https://aslijobs-backend.onrender.com/api/v1",
        "192.168.1.20",
      ),
      "https://aslijobs-backend.onrender.com/api/v1",
    );
  });

  it("recognizes private LAN hosts", () => {
    assert.equal(isPrivateOrLoopbackHostname("192.168.1.20"), true);
    assert.equal(isPrivateOrLoopbackHostname("aslijobs.com"), false);
  });
});
