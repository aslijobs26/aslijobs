import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { describe, it } from "node:test";
import cors from "cors";
import express from "express";
import {
  buildAllowedCorsOrigins,
  isCorsOriginAllowed,
  PRODUCTION_ADMIN_ORIGINS,
} from "./cors-origins.js";

async function withCorsTestServer(
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const allowedCorsOrigins = buildAllowedCorsOrigins({
    frontendUrl: "https://www.aslijobs.com",
    adminUrl: "https://admin.aslijobs.com",
    extraOrigins: [],
  });

  const app = express();
  app.use(
    cors({
      origin(origin, callback) {
        if (isCorsOriginAllowed(origin, allowedCorsOrigins)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Request-Id",
        "Accept",
      ],
      maxAge: 86_400,
    }),
  );

  app.post("/api/v1/operations/auth/login", (_req, res) => {
    res.status(401).json({
      success: false,
      message: "Invalid email or password.",
    });
  });

  app.get("/api/v1/operations/auth/session", (_req, res) => {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  });

  const server: Server = await new Promise((resolve) => {
    const created = createServer(app);
    created.listen(0, "127.0.0.1", () => resolve(created));
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe("Operations auth CORS HTTP behavior", () => {
  it("allows Vercel Admin and custom Admin OPTIONS preflight with credentials", async () => {
    await withCorsTestServer(async (baseUrl) => {
      const origins = [
        ...PRODUCTION_ADMIN_ORIGINS,
        "https://aslijobs-admin-git-main-asli-jobs.vercel.app",
      ];

      for (const origin of new Set(origins)) {
        const response = await fetch(`${baseUrl}/api/v1/operations/auth/login`, {
          method: "OPTIONS",
          headers: {
            Origin: origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,authorization",
          },
        });

        assert.equal(response.status, 204);
        assert.equal(response.headers.get("access-control-allow-origin"), origin);
        assert.equal(
          response.headers.get("access-control-allow-credentials"),
          "true",
        );
        const allowHeaders = (
          response.headers.get("access-control-allow-headers") ?? ""
        ).toLowerCase();
        assert.ok(allowHeaders.includes("content-type"));
        assert.ok(allowHeaders.includes("authorization"));
        const allowMethods = (
          response.headers.get("access-control-allow-methods") ?? ""
        ).toUpperCase();
        assert.ok(allowMethods.includes("POST"));
      }
    });
  });

  it("returns CORS headers on Operations login POST for Admin origins", async () => {
    await withCorsTestServer(async (baseUrl) => {
      for (const origin of PRODUCTION_ADMIN_ORIGINS) {
        const response = await fetch(`${baseUrl}/api/v1/operations/auth/login`, {
          method: "POST",
          headers: {
            Origin: origin,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "nobody@aslijobs.com",
            password: "WrongPass123!",
          }),
        });

        assert.equal(response.status, 401);
        assert.equal(response.headers.get("access-control-allow-origin"), origin);
        assert.equal(
          response.headers.get("access-control-allow-credentials"),
          "true",
        );
        const body = (await response.json()) as { message?: string };
        assert.equal(body.message, "Invalid email or password.");
      }
    });
  });

  it("allows public website origin and rejects unauthorized origins", async () => {
    await withCorsTestServer(async (baseUrl) => {
      const allowed = await fetch(`${baseUrl}/api/v1/operations/auth/session`, {
        method: "GET",
        headers: { Origin: "https://www.aslijobs.com" },
      });
      assert.equal(allowed.status, 401);
      assert.equal(
        allowed.headers.get("access-control-allow-origin"),
        "https://www.aslijobs.com",
      );

      const denied = await fetch(`${baseUrl}/api/v1/operations/auth/login`, {
        method: "OPTIONS",
        headers: {
          Origin: "https://malicious-example.com",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type",
        },
      });

      assert.equal(denied.headers.get("access-control-allow-origin"), null);
    });
  });

  it("never uses wildcard Access-Control-Allow-Origin with credentials", async () => {
    await withCorsTestServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/operations/auth/login`, {
        method: "OPTIONS",
        headers: {
          Origin: "https://admin.aslijobs.com",
          "Access-Control-Request-Method": "POST",
        },
      });

      assert.notEqual(response.headers.get("access-control-allow-origin"), "*");
      assert.equal(
        response.headers.get("access-control-allow-origin"),
        "https://admin.aslijobs.com",
      );
      assert.equal(
        response.headers.get("access-control-allow-credentials"),
        "true",
      );
    });
  });
});
