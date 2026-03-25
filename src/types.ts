/** Pricing tiers for the service */
export type PricingTier = "free" | "growth" | "enterprise";

export interface TierLimits {
  rendersPerMonth: number;
  pricePerMonth: number;
  features: string[];
}

export const TIER_CONFIG: Record<PricingTier, TierLimits> = {
  free: {
    rendersPerMonth: 25,
    pricePerMonth: 0,
    features: [
      "model-viewer embeds",
      "basic turntable",
      "SEO metadata",
      "Shopify snippets",
    ],
  },
  growth: {
    rendersPerMonth: 500,
    pricePerMonth: 29,
    features: [
      "everything in Free",
      "AR try-on",
      "product configurator",
      "asset optimization",
      "priority support",
    ],
  },
  enterprise: {
    rendersPerMonth: Infinity,
    pricePerMonth: 99,
    features: [
      "everything in Growth",
      "unlimited renders",
      "custom branding",
      "white-label embeds",
      "dedicated support",
      "SLA guarantee",
    ],
  },
};

/** Authentication context passed through tool calls */
export interface AuthContext {
  apiKey?: string;
  tier: PricingTier;
  rendersUsed: number;
  rendersLimit: number;
}

/** Common product description input */
export interface ProductInput {
  name: string;
  description?: string;
  category?: string;
  imageUrls?: string[];
  modelUrl?: string;
  dimensions?: { width: number; height: number; depth: number; unit: string };
}

/** Model viewer configuration */
export interface ViewerConfig {
  autoRotate?: boolean;
  cameraControls?: boolean;
  ar?: boolean;
  shadowIntensity?: number;
  exposure?: number;
  backgroundColor?: string;
  poster?: string;
  alt?: string;
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "manual" | "interaction";
}

/** Configurator option */
export interface ConfiguratorOption {
  name: string;
  type: "color" | "material" | "size" | "variant";
  values: Array<{
    label: string;
    value: string;
    thumbnail?: string;
    priceModifier?: number;
  }>;
}

/** Optimization settings */
export interface OptimizationSettings {
  targetPolyCount?: number;
  compressTextures?: boolean;
  textureMaxSize?: number;
  generateLODs?: boolean;
  format?: "glb" | "gltf" | "usdz";
}
