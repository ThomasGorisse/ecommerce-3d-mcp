#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { authenticate, recordRender, requiresTier } from "./auth.js";
import { TIER_CONFIG } from "./types.js";
import type { ConfiguratorOption } from "./types.js";
import type { ARCategory, SizeGuideCategory } from "./generators.js";
import {
  generateModelViewerEmbed,
  createARTryOnEmbed,
  generateConfigurator,
  generateOptimizationReport,
  generateTurntableEmbed,
  generateShopifySnippet,
  generateShopifySnippetV2,
  generateSEO3DMetadata,
  generateEnhancedSEO3DMetadata,
  generateProductPage,
  analyzeConversion,
  generateSizeGuide,
  generateWooCommerceSnippet,
} from "./generators.js";

// ---------------------------------------------------------------------------
// Legal disclaimer
// ---------------------------------------------------------------------------

const DISCLAIMER = '\n\n---\n*Review all generated code before deploying to production. See [TERMS.md](https://github.com/thomasgorisse/ecommerce-3d-mcp/blob/main/TERMS.md).*';

function addDisclaimer(text: string): string {
  return text + DISCLAIMER;
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "ecommerce-3d-mcp",
  version: "2.0.0",
});

// ---------------------------------------------------------------------------
// Shared schemas
// ---------------------------------------------------------------------------

const ProductSchema = {
  name: z.string().describe("Product name"),
  description: z.string().optional().describe("Product description"),
  category: z.string().optional().describe("Product category (e.g. furniture, clothing)"),
  imageUrls: z.array(z.string()).optional().describe("Product image URLs"),
  modelUrl: z.string().optional().describe("URL to existing .glb 3D model"),
  dimensions: z
    .object({
      width: z.number(),
      height: z.number(),
      depth: z.number(),
      unit: z.string().default("cm"),
    })
    .optional()
    .describe("Physical dimensions"),
  apiKey: z.string().optional().describe("API key for authentication (optional, free tier by default)"),
};

// ---------------------------------------------------------------------------
// Tool: generate_product_3d
// ---------------------------------------------------------------------------

server.tool(
  "generate_product_3d",
  "Generate a <model-viewer> 3D embed for a product page. Returns ready-to-paste HTML with AR support, camera controls, and responsive sizing.",
  {
    ...ProductSchema,
    autoRotate: z.boolean().default(true).describe("Enable auto-rotation"),
    cameraControls: z.boolean().default(true).describe("Enable camera controls"),
    ar: z.boolean().default(true).describe("Enable AR button"),
    backgroundColor: z.string().default("#ffffff").describe("Background color (hex)"),
    poster: z.string().optional().describe("URL to poster image shown while loading"),
  },
  async (params) => {
    const ctx = authenticate(params.apiKey);
    if (!recordRender(params.apiKey)) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Render limit reached (${ctx.rendersUsed}/${ctx.rendersLimit} this month). Upgrade to ${ctx.tier === "free" ? "Growth ($29/mo)" : "Enterprise ($99/mo)"} for more renders.`,
          },
        ],
      };
    }

    const html = generateModelViewerEmbed(
      {
        name: params.name,
        description: params.description,
        category: params.category,
        imageUrls: params.imageUrls,
        modelUrl: params.modelUrl,
        dimensions: params.dimensions,
      },
      {
        autoRotate: params.autoRotate,
        cameraControls: params.cameraControls,
        ar: params.ar,
        backgroundColor: params.backgroundColor,
        poster: params.poster,
      },
    );

    return {
      content: [
        {
          type: "text" as const,
          text: addDisclaimer(html),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: create_ar_tryout
// ---------------------------------------------------------------------------

server.tool(
  "create_ar_tryout",
  "Create an AR try-on experience embed. Supports furniture placement, clothing/accessory try-on. Includes iOS Quick Look and Android Scene Viewer deep links.",
  {
    ...ProductSchema,
    arCategory: z
      .enum(["furniture", "clothing", "accessories", "footwear", "cosmetics", "other"])
      .default("other")
      .describe("Product category for AR placement mode"),
  },
  async (params) => {
    const ctx = authenticate(params.apiKey);
    if (!requiresTier(ctx, "growth")) {
      return {
        content: [
          {
            type: "text" as const,
            text: "AR try-on requires the Growth tier ($29/mo) or higher. Visit https://ecommerce3d.dev/pricing to upgrade.",
          },
        ],
      };
    }
    if (!recordRender(params.apiKey)) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Render limit reached. Upgrade to Enterprise ($99/mo) for unlimited renders.`,
          },
        ],
      };
    }

    const html = createARTryOnEmbed(
      {
        name: params.name,
        description: params.description,
        category: params.category,
        imageUrls: params.imageUrls,
        modelUrl: params.modelUrl,
        dimensions: params.dimensions,
      },
      params.arCategory as ARCategory,
    );

    return {
      content: [{ type: "text" as const, text: addDisclaimer(html) }],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: product_configurator
// ---------------------------------------------------------------------------

server.tool(
  "product_configurator",
  "Generate an interactive 3D product configurator with color/material/size options. Returns a self-contained HTML widget with model-viewer, option controls, and price updates.",
  {
    ...ProductSchema,
    options: z
      .array(
        z.object({
          name: z.string().describe("Option name (e.g. Color, Material, Size)"),
          type: z
            .enum(["color", "material", "size", "variant"])
            .describe("Option type"),
          values: z.array(
            z.object({
              label: z.string().describe("Display label"),
              value: z.string().describe("Value (hex for color, id for others)"),
              thumbnail: z.string().optional().describe("Thumbnail URL"),
              priceModifier: z
                .number()
                .optional()
                .describe("Price change from base (+/-)"),
            }),
          ),
        }),
      )
      .describe("Configuration options"),
    enableAR: z.boolean().default(false).describe("Enable AR in configurator"),
  },
  async (params) => {
    const ctx = authenticate(params.apiKey);
    if (!requiresTier(ctx, "growth")) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Product configurator requires the Growth tier ($29/mo) or higher.",
          },
        ],
      };
    }
    if (!recordRender(params.apiKey)) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Render limit reached.`,
          },
        ],
      };
    }

    const html = generateConfigurator(
      {
        name: params.name,
        description: params.description,
        modelUrl: params.modelUrl,
        dimensions: params.dimensions,
      },
      params.options as ConfiguratorOption[],
      { ar: params.enableAR },
    );

    return {
      content: [{ type: "text" as const, text: addDisclaimer(html) }],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: optimize_3d_asset
// ---------------------------------------------------------------------------

server.tool(
  "optimize_3d_asset",
  "Generate an optimization report and CLI commands for a 3D model. Covers polygon reduction, texture compression (KTX2), Draco mesh compression, LOD generation, and web performance targets.",
  {
    ...ProductSchema,
    targetPolyCount: z.number().default(50000).describe("Target polygon count"),
    compressTextures: z.boolean().default(true).describe("Enable texture compression"),
    textureMaxSize: z.number().default(1024).describe("Max texture dimension (px)"),
    generateLODs: z.boolean().default(true).describe("Generate LOD variants"),
    format: z
      .enum(["glb", "gltf", "usdz"])
      .default("glb")
      .describe("Output format"),
  },
  async (params) => {
    const ctx = authenticate(params.apiKey);
    if (!requiresTier(ctx, "growth")) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Asset optimization requires the Growth tier ($29/mo) or higher.",
          },
        ],
      };
    }

    const report = generateOptimizationReport(
      {
        name: params.name,
        description: params.description,
        modelUrl: params.modelUrl,
        dimensions: params.dimensions,
      },
      {
        targetPolyCount: params.targetPolyCount,
        compressTextures: params.compressTextures,
        textureMaxSize: params.textureMaxSize,
        generateLODs: params.generateLODs,
        format: params.format,
      },
    );

    return {
      content: [{ type: "text" as const, text: addDisclaimer(report) }],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: generate_turntable
// ---------------------------------------------------------------------------

server.tool(
  "generate_turntable",
  "Create a 360-degree turntable animation embed for product pages. Auto-rotating 3D view with a '360' badge, responsive sizing, and optional camera controls.",
  {
    ...ProductSchema,
    speed: z.number().default(30).describe("Rotation speed in degrees per second"),
    backgroundColor: z.string().default("#ffffff").describe("Background color (hex)"),
    height: z.string().default("500px").describe("Viewer height (CSS value)"),
  },
  async (params) => {
    const ctx = authenticate(params.apiKey);
    if (!recordRender(params.apiKey)) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Render limit reached (${ctx.rendersUsed}/${ctx.rendersLimit}).`,
          },
        ],
      };
    }

    const html = generateTurntableEmbed(
      {
        name: params.name,
        description: params.description,
        modelUrl: params.modelUrl,
      },
      {
        speed: params.speed,
        backgroundColor: params.backgroundColor,
        height: params.height,
      },
    );

    return {
      content: [{ type: "text" as const, text: addDisclaimer(html) }],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: shopify_snippet
// ---------------------------------------------------------------------------

server.tool(
  "shopify_snippet",
  "Generate a Shopify Liquid snippet to embed a 3D product viewer. Supports both legacy Liquid and Online Store 2.0 section format with theme editor settings, metafield references, and AR support.",
  {
    ...ProductSchema,
    enableAR: z.boolean().default(true).describe("Enable AR in Shopify viewer"),
    sectionId: z.string().default("product-3d-viewer").describe("HTML section ID"),
    version: z.enum(["legacy", "2.0"]).default("2.0").describe("Shopify Liquid version — 'legacy' for classic themes, '2.0' for Online Store 2.0 (Dawn, Sense, Craft)"),
  },
  async (params) => {
    const generator = params.version === "2.0" ? generateShopifySnippetV2 : generateShopifySnippet;
    const html = generator(
      {
        name: params.name,
        description: params.description,
        modelUrl: params.modelUrl,
      },
      { ar: params.enableAR, sectionId: params.sectionId },
    );

    return {
      content: [{ type: "text" as const, text: addDisclaimer(html) }],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: woocommerce_snippet
// ---------------------------------------------------------------------------

server.tool(
  "woocommerce_snippet",
  "Generate a WooCommerce/WordPress plugin snippet to embed a 3D product viewer. Includes custom meta boxes for model URLs, model-viewer integration, and AR support.",
  {
    ...ProductSchema,
    enableAR: z.boolean().default(true).describe("Enable AR in WooCommerce viewer"),
    sectionId: z.string().default("product-3d-viewer").describe("HTML container ID"),
  },
  async (params) => {
    const html = generateWooCommerceSnippet(
      {
        name: params.name,
        description: params.description,
        modelUrl: params.modelUrl,
      },
      { ar: params.enableAR, sectionId: params.sectionId },
    );

    return {
      content: [{ type: "text" as const, text: addDisclaimer(html) }],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: seo_3d_metadata
// ---------------------------------------------------------------------------

server.tool(
  "seo_3d_metadata",
  "Generate enhanced schema.org structured data (JSON-LD) for products with 3D models. Includes Product, 3DModel (GLB + USDZ), AggregateRating, MerchantReturnPolicy, and shipping details. Optimized for Google 3D/AR search badges.",
  {
    ...ProductSchema,
    price: z.number().optional().describe("Product price"),
    currency: z.string().default("USD").describe("Currency code (ISO 4217)"),
    availability: z
      .enum(["InStock", "OutOfStock", "PreOrder"])
      .default("InStock")
      .describe("Stock status"),
    brand: z.string().optional().describe("Brand name"),
    sku: z.string().optional().describe("SKU / product ID"),
    gtin: z.string().optional().describe("GTIN / EAN / UPC barcode"),
    url: z.string().optional().describe("Product page URL"),
    usdzUrl: z.string().optional().describe("URL to .usdz model (iOS AR)"),
    thumbnailUrl: z.string().optional().describe("3D model thumbnail image URL"),
    ratingValue: z.number().optional().describe("Average rating (1-5)"),
    reviewCount: z.number().optional().describe("Number of reviews"),
    returnDays: z.number().optional().describe("Return policy — number of days"),
    returnType: z.enum(["full", "exchange", "store-credit"]).optional().describe("Return policy type"),
    freeShipping: z.boolean().default(false).describe("Free shipping available"),
  },
  async (params) => {
    const html = generateEnhancedSEO3DMetadata(
      {
        name: params.name,
        description: params.description,
        imageUrls: params.imageUrls,
        modelUrl: params.modelUrl,
        dimensions: params.dimensions,
      },
      {
        price: params.price,
        currency: params.currency,
        availability: params.availability,
        brand: params.brand,
        sku: params.sku,
        gtin: params.gtin,
        url: params.url,
        usdzUrl: params.usdzUrl,
        thumbnailUrl: params.thumbnailUrl,
        aggregateRating:
          params.ratingValue !== undefined && params.reviewCount !== undefined
            ? { ratingValue: params.ratingValue, reviewCount: params.reviewCount }
            : undefined,
        returnPolicy:
          params.returnDays !== undefined
            ? { days: params.returnDays, type: params.returnType || "full" }
            : undefined,
        shippingFree: params.freeShipping,
      },
    );

    return {
      content: [{ type: "text" as const, text: addDisclaimer(html) }],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: generate_product_page
// ---------------------------------------------------------------------------

server.tool(
  "generate_product_page",
  "Generate a complete Shopify-ready product page HTML with integrated 3D viewer, AR button, breadcrumbs, price, reviews, dimensions, and CTA. Choose from minimal, modern, or luxury themes.",
  {
    ...ProductSchema,
    theme: z.enum(["minimal", "modern", "luxury"]).default("modern").describe("Page design theme"),
    price: z.number().optional().describe("Product price"),
    currency: z.string().default("USD").describe("Currency code"),
    showARButton: z.boolean().default(true).describe("Show AR button"),
    ctaText: z.string().default("Add to Cart").describe("Call-to-action button text"),
    breadcrumbs: z.array(z.string()).optional().describe("Breadcrumb trail (e.g. ['Home', 'Furniture'])"),
    ratingValue: z.number().optional().describe("Average rating (1-5)"),
    reviewCount: z.number().optional().describe("Number of reviews"),
  },
  async (params) => {
    const ctx = authenticate(params.apiKey);
    if (!recordRender(params.apiKey)) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Render limit reached (${ctx.rendersUsed}/${ctx.rendersLimit}).`,
          },
        ],
      };
    }

    const html = generateProductPage(
      {
        name: params.name,
        description: params.description,
        category: params.category,
        imageUrls: params.imageUrls,
        modelUrl: params.modelUrl,
        dimensions: params.dimensions,
      },
      {
        theme: params.theme,
        price: params.price,
        currency: params.currency,
        showARButton: params.showARButton,
        ctaText: params.ctaText,
        breadcrumbs: params.breadcrumbs,
        reviews:
          params.ratingValue !== undefined && params.reviewCount !== undefined
            ? { rating: params.ratingValue, count: params.reviewCount }
            : undefined,
      },
    );

    return {
      content: [{ type: "text" as const, text: addDisclaimer(html) }],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: analyze_conversion
// ---------------------------------------------------------------------------

server.tool(
  "analyze_conversion",
  "Analyze a 3D product page and generate actionable tips to improve conversion rates. Scores the page (0-100) based on 3D model, AR, performance, mobile, SEO, and interactivity best practices.",
  {
    hasModel: z.boolean().default(false).describe("Product page has a 3D model viewer"),
    hasAR: z.boolean().default(false).describe("AR try-on/placement is available"),
    hasMultipleAngles: z.boolean().default(false).describe("Multiple camera angles / turntable"),
    hasConfigurator: z.boolean().default(false).describe("Interactive configurator available"),
    loadTimeSec: z.number().optional().describe("3D model load time in seconds"),
    modelSizeMB: z.number().optional().describe("3D model file size in MB"),
    hasPosterImage: z.boolean().default(false).describe("Poster image shown while loading"),
    isMobileOptimized: z.boolean().default(false).describe("Page is mobile-optimized"),
    hasStructuredData: z.boolean().default(false).describe("Has schema.org 3DModel data"),
    category: z.string().optional().describe("Product category (furniture, clothing, etc.)"),
  },
  async (params) => {
    const result = analyzeConversion({
      hasModel: params.hasModel,
      hasAR: params.hasAR,
      hasMultipleAngles: params.hasMultipleAngles,
      hasConfigurator: params.hasConfigurator,
      loadTimeSec: params.loadTimeSec,
      modelSizeMB: params.modelSizeMB,
      hasPosterImage: params.hasPosterImage,
      isMobileOptimized: params.isMobileOptimized,
      hasStructuredData: params.hasStructuredData,
      category: params.category,
    });

    return {
      content: [{ type: "text" as const, text: addDisclaimer(result.summary) }],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: generate_size_guide
// ---------------------------------------------------------------------------

server.tool(
  "generate_size_guide",
  "Generate an AR-based size guide for clothing, footwear, furniture, or accessories. Includes measurement instructions, size chart, international conversion table, and optional AR model for real-world sizing.",
  {
    ...ProductSchema,
    sizeCategory: z
      .enum(["clothing", "footwear", "furniture", "accessories"])
      .describe("Product size category"),
    sizes: z
      .array(
        z.object({
          label: z.string().describe("Size label (e.g. 'S', 'M', 'L')"),
          measurements: z.record(z.string(), z.number()).describe("Measurement name to value map"),
          unit: z.string().optional().describe("Measurement unit (default: cm)"),
        }),
      )
      .optional()
      .describe("Custom size chart data"),
    enableAR: z.boolean().default(true).describe("Enable AR measurement feature"),
    showConversionChart: z.boolean().default(true).describe("Show international size conversion"),
    targetRegions: z.array(z.string()).default(["US", "EU", "UK"]).describe("Regions for size conversion"),
  },
  async (params) => {
    const ctx = authenticate(params.apiKey);
    if (!recordRender(params.apiKey)) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Render limit reached (${ctx.rendersUsed}/${ctx.rendersLimit}).`,
          },
        ],
      };
    }

    const html = generateSizeGuide(
      {
        name: params.name,
        description: params.description,
        category: params.category,
        imageUrls: params.imageUrls,
        modelUrl: params.modelUrl,
        dimensions: params.dimensions,
      },
      {
        category: params.sizeCategory as SizeGuideCategory,
        sizes: params.sizes,
        enableAR: params.enableAR,
        showConversionChart: params.showConversionChart,
        targetRegions: params.targetRegions,
      },
    );

    return {
      content: [{ type: "text" as const, text: addDisclaimer(html) }],
    };
  },
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

export { server };
