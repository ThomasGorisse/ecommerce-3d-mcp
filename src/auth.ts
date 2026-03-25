import { TIER_CONFIG, type AuthContext, type PricingTier } from "./types.js";

/**
 * In-memory usage tracking (replace with database in production).
 * Maps API key to usage data.
 */
const usageStore = new Map<
  string,
  { tier: PricingTier; rendersUsed: number; resetDate: Date }
>();

/** Validate an API key and return auth context. */
export function authenticate(apiKey?: string): AuthContext {
  if (!apiKey) {
    // Anonymous = free tier
    return {
      tier: "free",
      rendersUsed: 0,
      rendersLimit: TIER_CONFIG.free.rendersPerMonth,
    };
  }

  const usage = usageStore.get(apiKey);
  if (!usage) {
    // First use with this key — default to free, register it
    usageStore.set(apiKey, {
      tier: "free",
      rendersUsed: 0,
      resetDate: getNextResetDate(),
    });
    return {
      apiKey,
      tier: "free",
      rendersUsed: 0,
      rendersLimit: TIER_CONFIG.free.rendersPerMonth,
    };
  }

  // Reset monthly counter if needed
  if (new Date() >= usage.resetDate) {
    usage.rendersUsed = 0;
    usage.resetDate = getNextResetDate();
  }

  return {
    apiKey,
    tier: usage.tier,
    rendersUsed: usage.rendersUsed,
    rendersLimit: TIER_CONFIG[usage.tier].rendersPerMonth,
  };
}

/** Record a render and check limits. Returns true if allowed. */
export function recordRender(apiKey?: string): boolean {
  const ctx = authenticate(apiKey);
  if (ctx.rendersUsed >= ctx.rendersLimit) {
    return false;
  }

  if (apiKey) {
    const usage = usageStore.get(apiKey);
    if (usage) {
      usage.rendersUsed++;
    }
  }

  return true;
}

/** Check if a tool requires a paid tier. */
export function requiresTier(
  ctx: AuthContext,
  minimumTier: PricingTier,
): boolean {
  const tierOrder: PricingTier[] = ["free", "growth", "enterprise"];
  return tierOrder.indexOf(ctx.tier) >= tierOrder.indexOf(minimumTier);
}

function getNextResetDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

/** Register or update an API key with a specific tier. */
export function registerApiKey(apiKey: string, tier: PricingTier): void {
  usageStore.set(apiKey, {
    tier,
    rendersUsed: 0,
    resetDate: getNextResetDate(),
  });
}
