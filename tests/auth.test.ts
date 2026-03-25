import { describe, it, expect } from "vitest";
import {
  authenticate,
  recordRender,
  requiresTier,
  registerApiKey,
} from "../src/auth.js";

describe("authenticate", () => {
  it("returns free tier for anonymous users", () => {
    const ctx = authenticate();
    expect(ctx.tier).toBe("free");
    expect(ctx.rendersLimit).toBe(25);
    expect(ctx.apiKey).toBeUndefined();
  });

  it("returns free tier for unknown API keys", () => {
    const ctx = authenticate("unknown-key-123");
    expect(ctx.tier).toBe("free");
    expect(ctx.rendersUsed).toBe(0);
    expect(ctx.apiKey).toBe("unknown-key-123");
  });

  it("returns correct tier for registered keys", () => {
    registerApiKey("growth-key-test", "growth");
    const ctx = authenticate("growth-key-test");
    expect(ctx.tier).toBe("growth");
    expect(ctx.rendersLimit).toBe(500);
  });

  it("returns enterprise tier with unlimited renders", () => {
    registerApiKey("ent-key-test", "enterprise");
    const ctx = authenticate("ent-key-test");
    expect(ctx.tier).toBe("enterprise");
    expect(ctx.rendersLimit).toBe(Infinity);
  });
});

describe("recordRender", () => {
  it("allows renders within limit", () => {
    registerApiKey("render-test-key", "free");
    const allowed = recordRender("render-test-key");
    expect(allowed).toBe(true);
  });

  it("allows anonymous renders", () => {
    const allowed = recordRender();
    expect(allowed).toBe(true);
  });

  it("increments usage counter", () => {
    registerApiKey("counter-test", "free");
    recordRender("counter-test");
    recordRender("counter-test");
    const ctx = authenticate("counter-test");
    expect(ctx.rendersUsed).toBe(2);
  });
});

describe("requiresTier", () => {
  it("free tier satisfies free requirement", () => {
    const ctx = authenticate();
    expect(requiresTier(ctx, "free")).toBe(true);
  });

  it("free tier does not satisfy growth requirement", () => {
    const ctx = authenticate();
    expect(requiresTier(ctx, "growth")).toBe(false);
  });

  it("growth tier satisfies growth requirement", () => {
    registerApiKey("growth-req-test", "growth");
    const ctx = authenticate("growth-req-test");
    expect(requiresTier(ctx, "growth")).toBe(true);
  });

  it("enterprise tier satisfies all requirements", () => {
    registerApiKey("ent-req-test", "enterprise");
    const ctx = authenticate("ent-req-test");
    expect(requiresTier(ctx, "free")).toBe(true);
    expect(requiresTier(ctx, "growth")).toBe(true);
    expect(requiresTier(ctx, "enterprise")).toBe(true);
  });
});
