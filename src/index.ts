#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { authenticate, recordRender, requiresTier } from "./auth.js";
import { TIER_CONFIG } from "./types.js";
import type { ConfiguratorOption } from "./types.js";
import type { ARCategory } from "./generators.js";
import {
  generateModelViewerEmbed,
  createARTryOnEmbed,
  generateConfigurator,
  generateOptimizationReport,
  generateTurntableEmbed,
  generateShopifySnippet,
  generateSEO3DMetadata,
} from "./generators.js";

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "ecommerce-3d-mcp",
  version: "1.0.0",
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
          text: html,
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
      content: [{ type: "text" as const, text: html }],
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
      content: [{ type: "text" as const, text: html }],
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
      content: [{ type: "text" as const, text: report }],
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
      content: [{ type: "text" as const, text: html }],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: shopify_snippet
// ---------------------------------------------------------------------------

server.tool(
  "shopify_snippet",
  "Generate a Shopify Liquid snippet to embed a 3D product viewer in a Shopify store. Includes metafield setup instructions, Dawn theme integration, and AR support.",
  {
    ...ProductSchema,
    enableAR: z.boolean().default(true).describe("Enable AR in Shopify viewer"),
    sectionId: z.string().default("product-3d-viewer").describe("HTML section ID"),
  },
  async (params) => {
    const html = generateShopifySnippet(
      {
        name: params.name,
        description: params.description,
        modelUrl: params.modelUrl,
      },
      { ar: params.enableAR, sectionId: params.sectionId },
    );

    return {
      content: [{ type: "text" as const, text: html }],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: seo_3d_metadata
// ---------------------------------------------------------------------------

server.tool(
  "seo_3d_metadata",
  "Generate schema.org structured data (JSON-LD) for products with 3D models. Improves search engine visibility for 3D/AR-enabled products. Includes Product, 3DModel, and Offer schemas.",
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
    url: z.string().optional().describe("Product page URL"),
  },
  async (params) => {
    const html = generateSEO3DMetadata(
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
        url: params.url,
      },
    );

    return {
      content: [{ type: "text" as const, text: html }],
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
