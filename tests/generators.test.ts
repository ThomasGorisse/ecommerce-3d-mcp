import { describe, it, expect } from "vitest";
import {
  generateModelViewerEmbed,
  createARTryOnEmbed,
  generateConfigurator,
  generateOptimizationReport,
  generateTurntableEmbed,
  generateShopifySnippet,
  generateSEO3DMetadata,
  slugify,
} from "../src/generators.js";

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------

describe("slugify", () => {
  it("converts text to lowercase kebab-case", () => {
    expect(slugify("Modern Leather Sofa")).toBe("modern-leather-sofa");
  });

  it("strips special characters", () => {
    expect(slugify("Chair (24\" x 30\")")).toBe("chair-24-x-30");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
  });
});

// ---------------------------------------------------------------------------
// generateModelViewerEmbed
// ---------------------------------------------------------------------------

describe("generateModelViewerEmbed", () => {
  const product = {
    name: "Oak Dining Table",
    modelUrl: "https://cdn.store.com/models/oak-table.glb",
  };

  it("generates valid model-viewer HTML", () => {
    const html = generateModelViewerEmbed(product);
    expect(html).toContain("<model-viewer");
    expect(html).toContain("</model-viewer>");
    expect(html).toContain('src="https://cdn.store.com/models/oak-table.glb"');
  });

  it("includes model-viewer CDN script", () => {
    const html = generateModelViewerEmbed(product);
    expect(html).toContain("model-viewer");
    expect(html).toContain("<script");
  });

  it("enables auto-rotate by default", () => {
    const html = generateModelViewerEmbed(product);
    expect(html).toContain("auto-rotate");
  });

  it("enables AR by default", () => {
    const html = generateModelViewerEmbed(product);
    expect(html).toContain(" ar");
    expect(html).toContain("ar-modes");
    expect(html).toContain("View in your space");
  });

  it("disables AR when configured", () => {
    const html = generateModelViewerEmbed(product, { ar: false });
    expect(html).not.toContain("ar-modes");
  });

  it("uses ios-src with .usdz extension", () => {
    const html = generateModelViewerEmbed(product);
    expect(html).toContain('ios-src="https://cdn.store.com/models/oak-table.usdz"');
  });

  it("sets custom background color", () => {
    const html = generateModelViewerEmbed(product, { backgroundColor: "#f0f0f0" });
    expect(html).toContain("background-color: #f0f0f0");
  });

  it("generates fallback model URL from product name", () => {
    const html = generateModelViewerEmbed({ name: "Red Chair" });
    expect(html).toContain("red-chair.glb");
  });
});

// ---------------------------------------------------------------------------
// createARTryOnEmbed
// ---------------------------------------------------------------------------

describe("createARTryOnEmbed", () => {
  const product = {
    name: "Velvet Armchair",
    modelUrl: "https://cdn.store.com/models/armchair.glb",
  };

  it("generates AR embed with try-on button", () => {
    const html = createARTryOnEmbed(product, "furniture");
    expect(html).toContain("<model-viewer");
    expect(html).toContain("Place in your room");
    expect(html).toContain("ar-placement");
  });

  it("uses correct CTA for clothing", () => {
    const html = createARTryOnEmbed(product, "clothing");
    expect(html).toContain("Try it on");
  });

  it("uses correct CTA for cosmetics", () => {
    const html = createARTryOnEmbed(product, "cosmetics");
    expect(html).toContain("Try this look");
  });

  it("includes Android intent deep link", () => {
    const html = createARTryOnEmbed(product);
    expect(html).toContain("intent://arvr.google.com/scene-viewer");
  });

  it("includes iOS Quick Look link", () => {
    const html = createARTryOnEmbed(product);
    expect(html).toContain('rel="ar"');
    expect(html).toContain(".usdz");
  });
});

// ---------------------------------------------------------------------------
// generateConfigurator
// ---------------------------------------------------------------------------

describe("generateConfigurator", () => {
  const product = {
    name: "Custom Sneaker",
    modelUrl: "https://cdn.store.com/models/sneaker.glb",
  };

  const options = [
    {
      name: "Color",
      type: "color" as const,
      values: [
        { label: "Black", value: "#000000" },
        { label: "White", value: "#ffffff", priceModifier: 10 },
      ],
    },
    {
      name: "Size",
      type: "size" as const,
      values: [
        { label: "US 9", value: "9" },
        { label: "US 10", value: "10" },
        { label: "US 11", value: "11" },
      ],
    },
  ];

  it("generates configurator with model-viewer", () => {
    const html = generateConfigurator(product, options);
    expect(html).toContain("<model-viewer");
    expect(html).toContain("product-configurator");
  });

  it("renders color swatches", () => {
    const html = generateConfigurator(product, options);
    expect(html).toContain("color-swatch");
    expect(html).toContain("#000000");
    expect(html).toContain("#ffffff");
  });

  it("renders select dropdowns for non-color options", () => {
    const html = generateConfigurator(product, options);
    expect(html).toContain("<select");
    expect(html).toContain("US 9");
    expect(html).toContain("US 11");
  });

  it("includes price update script", () => {
    const html = generateConfigurator(product, options);
    expect(html).toContain("updatePrice");
    expect(html).toContain("priceModifiers");
  });

  it("includes CSS styles", () => {
    const html = generateConfigurator(product, options);
    expect(html).toContain(".configurator-container");
    expect(html).toContain(".option-group");
  });
});

// ---------------------------------------------------------------------------
// generateOptimizationReport
// ---------------------------------------------------------------------------

describe("generateOptimizationReport", () => {
  const product = {
    name: "Table Lamp",
    modelUrl: "https://cdn.store.com/models/lamp.glb",
  };

  it("generates a markdown report", () => {
    const report = generateOptimizationReport(product);
    expect(report).toContain("## 3D Asset Optimization Report");
    expect(report).toContain("Table Lamp");
  });

  it("includes polygon reduction step", () => {
    const report = generateOptimizationReport(product, {
      targetPolyCount: 30000,
    });
    expect(report).toContain("30,000");
    expect(report).toContain("Polygon reduction");
  });

  it("includes CLI pipeline command", () => {
    const report = generateOptimizationReport(product);
    expect(report).toContain("gltf-transform");
    expect(report).toContain("draco");
  });

  it("includes web performance targets table", () => {
    const report = generateOptimizationReport(product);
    expect(report).toContain("Web Performance Targets");
    expect(report).toContain("File size");
    expect(report).toContain("Load time");
  });

  it("respects format option", () => {
    const report = generateOptimizationReport(product, { format: "usdz" });
    expect(report).toContain("USDZ");
    expect(report).toContain("Apple AR Quick Look");
  });
});

// ---------------------------------------------------------------------------
// generateTurntableEmbed
// ---------------------------------------------------------------------------

describe("generateTurntableEmbed", () => {
  const product = {
    name: "Gold Watch",
    modelUrl: "https://cdn.store.com/models/watch.glb",
  };

  it("generates turntable with 360 badge", () => {
    const html = generateTurntableEmbed(product);
    expect(html).toContain("360°");
    expect(html).toContain("turntable-badge");
  });

  it("sets auto-rotate speed", () => {
    const html = generateTurntableEmbed(product, { speed: 45 });
    expect(html).toContain('rotation-per-second="45deg"');
  });

  it("sets custom height", () => {
    const html = generateTurntableEmbed(product, { height: "600px" });
    expect(html).toContain("height: 600px");
  });

  it("disables interaction prompt", () => {
    const html = generateTurntableEmbed(product);
    expect(html).toContain('interaction-prompt="none"');
  });
});

// ---------------------------------------------------------------------------
// generateShopifySnippet
// ---------------------------------------------------------------------------

describe("generateShopifySnippet", () => {
  const product = { name: "Candle" };

  it("generates valid Liquid template", () => {
    const html = generateShopifySnippet(product);
    expect(html).toContain("{% if product.metafields.custom.model_3d_url");
    expect(html).toContain("{% endif %}");
  });

  it("includes metafield references", () => {
    const html = generateShopifySnippet(product);
    expect(html).toContain("product.metafields.custom.model_3d_url");
    expect(html).toContain("product.metafields.custom.model_usdz_url");
  });

  it("includes setup instructions", () => {
    const html = generateShopifySnippet(product);
    expect(html).toContain("SETUP INSTRUCTIONS");
    expect(html).toContain("metafields");
    expect(html).toContain("Dawn theme");
  });

  it("uses provided section ID", () => {
    const html = generateShopifySnippet(product, {
      sectionId: "my-3d-section",
    });
    expect(html).toContain('id="my-3d-section"');
  });

  it("includes AR by default", () => {
    const html = generateShopifySnippet(product);
    expect(html).toContain("ar");
    expect(html).toContain("ar-modes");
  });
});

// ---------------------------------------------------------------------------
// generateSEO3DMetadata
// ---------------------------------------------------------------------------

describe("generateSEO3DMetadata", () => {
  const product = {
    name: "Bluetooth Speaker",
    description: "Portable wireless speaker with 3D sound",
    modelUrl: "https://cdn.store.com/models/speaker.glb",
    imageUrls: ["https://cdn.store.com/images/speaker.jpg"],
    dimensions: { width: 10, height: 15, depth: 10, unit: "cm" },
  };

  it("generates JSON-LD script tag", () => {
    const html = generateSEO3DMetadata(product);
    expect(html).toContain('type="application/ld+json"');
  });

  it("includes schema.org context", () => {
    const html = generateSEO3DMetadata(product);
    const json = extractJsonLd(html);
    expect(json["@context"]).toBe("https://schema.org");
    expect(json["@type"]).toBe("Product");
  });

  it("includes 3DModel subject", () => {
    const html = generateSEO3DMetadata(product);
    const json = extractJsonLd(html);
    expect(json.subjectOf["@type"]).toBe("3DModel");
    expect(json.subjectOf.encodingFormat).toBe("model/gltf-binary");
    expect(json.subjectOf.contentUrl).toContain("speaker.glb");
  });

  it("includes offer with price", () => {
    const html = generateSEO3DMetadata(product, {
      price: 49.99,
      currency: "EUR",
    });
    const json = extractJsonLd(html);
    expect(json.offers.price).toBe("49.99");
    expect(json.offers.priceCurrency).toBe("EUR");
  });

  it("includes dimensions with unit codes", () => {
    const html = generateSEO3DMetadata(product);
    const json = extractJsonLd(html);
    expect(json.width.value).toBe(10);
    expect(json.width.unitCode).toBe("CMT");
    expect(json.height.value).toBe(15);
  });

  it("includes brand and sku when provided", () => {
    const html = generateSEO3DMetadata(product, {
      brand: "SoundMax",
      sku: "SM-BT-100",
    });
    const json = extractJsonLd(html);
    expect(json.brand.name).toBe("SoundMax");
    expect(json.sku).toBe("SM-BT-100");
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractJsonLd(html: string): Record<string, any> {
  const match = html.match(
    /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
  );
  if (!match) throw new Error("No JSON-LD found");
  return JSON.parse(match[1]);
}
