import { describe, it, expect } from "vitest";
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

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles numbers-only input", () => {
    expect(slugify("123 456")).toBe("123-456");
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

  it("includes poster when provided", () => {
    const html = generateModelViewerEmbed(product, { poster: "https://cdn.store.com/poster.jpg" });
    expect(html).toContain('poster="https://cdn.store.com/poster.jpg"');
  });

  it("sets lazy loading by default", () => {
    const html = generateModelViewerEmbed(product);
    expect(html).toContain('loading="lazy"');
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

  it("uses correct CTA for footwear", () => {
    const html = createARTryOnEmbed(product, "footwear");
    expect(html).toContain("Try it on");
  });

  it("uses generic CTA for other category", () => {
    const html = createARTryOnEmbed(product, "other");
    expect(html).toContain("View in AR");
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

  it("enables AR when configured", () => {
    const html = generateConfigurator(product, options, { ar: true });
    expect(html).toContain("ar-modes");
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

  it("shows estimated output size", () => {
    const report = generateOptimizationReport(product, { targetPolyCount: 10000 });
    expect(report).toContain("Estimated output size");
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
// generateShopifySnippet (legacy)
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
// generateShopifySnippetV2 (Online Store 2.0)
// ---------------------------------------------------------------------------

describe("generateShopifySnippetV2", () => {
  const product = { name: "Modern Lamp" };

  it("generates Online Store 2.0 section with schema", () => {
    const html = generateShopifySnippetV2(product);
    expect(html).toContain("{% schema %}");
    expect(html).toContain("{% endschema %}");
  });

  it("uses liquid tag for variable assignment", () => {
    const html = generateShopifySnippetV2(product);
    expect(html).toContain("{% liquid");
    expect(html).toContain("assign model_url");
  });

  it("includes section settings for theme editor", () => {
    const html = generateShopifySnippetV2(product);
    expect(html).toContain("section.settings.viewer_height");
    expect(html).toContain("section.settings.background_color");
    expect(html).toContain("section.settings.show_ar_button");
  });

  it("includes presets for theme editor", () => {
    const html = generateShopifySnippetV2(product);
    expect(html).toContain('"presets"');
    expect(html).toContain('"3D Product Viewer"');
  });

  it("includes loading spinner slot", () => {
    const html = generateShopifySnippetV2(product);
    expect(html).toContain('slot="poster"');
    expect(html).toContain("product-3d-viewer__spinner");
  });

  it("includes shopify_attributes block binding", () => {
    const html = generateShopifySnippetV2(product);
    expect(html).toContain("block.shopify_attributes");
  });

  it("supports custom section ID", () => {
    const html = generateShopifySnippetV2(product, { sectionId: "custom-3d" });
    expect(html).toContain('id="custom-3d"');
  });

  it("includes range settings for max_width and shadow", () => {
    const html = generateShopifySnippetV2(product);
    expect(html).toContain('"type": "range"');
    expect(html).toContain("max_width");
    expect(html).toContain("shadow_intensity");
  });
});

// ---------------------------------------------------------------------------
// generateSEO3DMetadata (legacy)
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
// generateEnhancedSEO3DMetadata
// ---------------------------------------------------------------------------

describe("generateEnhancedSEO3DMetadata", () => {
  const product = {
    name: "Designer Chair",
    description: "Ergonomic office chair",
    modelUrl: "https://cdn.store.com/models/chair.glb",
    imageUrls: ["https://cdn.store.com/images/chair.jpg"],
  };

  it("generates enhanced JSON-LD with additionalProperty", () => {
    const html = generateEnhancedSEO3DMetadata(product);
    const json = extractJsonLd(html);
    expect(json.additionalProperty).toBeDefined();
    expect(json.additionalProperty.length).toBeGreaterThanOrEqual(3);
    const arProp = json.additionalProperty.find((p: any) => p.name === "ARAvailable");
    expect(arProp.value).toBe("true");
  });

  it("includes both GLB and USDZ models when provided", () => {
    const html = generateEnhancedSEO3DMetadata(product, {
      usdzUrl: "https://cdn.store.com/models/chair.usdz",
    });
    const json = extractJsonLd(html);
    expect(Array.isArray(json.subjectOf)).toBe(true);
    expect(json.subjectOf.length).toBe(2);
    expect(json.subjectOf[0].encodingFormat).toBe("model/gltf-binary");
    expect(json.subjectOf[1].encodingFormat).toBe("model/vnd.usdz+zip");
  });

  it("includes single model when no USDZ", () => {
    const html = generateEnhancedSEO3DMetadata(product);
    const json = extractJsonLd(html);
    expect(json.subjectOf["@type"]).toBe("3DModel");
  });

  it("includes aggregate rating", () => {
    const html = generateEnhancedSEO3DMetadata(product, {
      aggregateRating: { ratingValue: 4.5, reviewCount: 128 },
    });
    const json = extractJsonLd(html);
    expect(json.aggregateRating.ratingValue).toBe(4.5);
    expect(json.aggregateRating.reviewCount).toBe(128);
    expect(json.aggregateRating.bestRating).toBe(5);
  });

  it("includes return policy", () => {
    const html = generateEnhancedSEO3DMetadata(product, {
      price: 299,
      returnPolicy: { days: 30, type: "full" },
    });
    const json = extractJsonLd(html);
    expect(json.offers.hasMerchantReturnPolicy).toBeDefined();
    expect(json.offers.hasMerchantReturnPolicy.merchantReturnDays).toBe(30);
  });

  it("includes free shipping", () => {
    const html = generateEnhancedSEO3DMetadata(product, {
      price: 299,
      shippingFree: true,
    });
    const json = extractJsonLd(html);
    expect(json.offers.shippingDetails).toBeDefined();
    expect(json.offers.shippingDetails.shippingRate.value).toBe("0");
  });

  it("includes GTIN when provided", () => {
    const html = generateEnhancedSEO3DMetadata(product, {
      gtin: "0012345678901",
    });
    const json = extractJsonLd(html);
    expect(json.gtin).toBe("0012345678901");
  });

  it("includes thumbnail URL on 3D models", () => {
    const html = generateEnhancedSEO3DMetadata(product, {
      thumbnailUrl: "https://cdn.store.com/thumbnails/chair.jpg",
    });
    const json = extractJsonLd(html);
    expect(json.subjectOf.thumbnailUrl).toBe("https://cdn.store.com/thumbnails/chair.jpg");
  });
});

// ---------------------------------------------------------------------------
// generateProductPage
// ---------------------------------------------------------------------------

describe("generateProductPage", () => {
  const product = {
    name: "Leather Sofa",
    description: "Premium Italian leather sofa",
    modelUrl: "https://cdn.store.com/models/sofa.glb",
    dimensions: { width: 200, height: 85, depth: 90, unit: "cm" },
  };

  it("generates complete HTML page", () => {
    const html = generateProductPage(product);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
    expect(html).toContain("<model-viewer");
  });

  it("includes product title", () => {
    const html = generateProductPage(product);
    expect(html).toContain("Leather Sofa");
  });

  it("includes product description", () => {
    const html = generateProductPage(product);
    expect(html).toContain("Premium Italian leather sofa");
  });

  it("shows price when provided", () => {
    const html = generateProductPage(product, { price: 1299.99, currency: "USD" });
    expect(html).toContain("$1299.99");
  });

  it("shows EUR price symbol", () => {
    const html = generateProductPage(product, { price: 999, currency: "EUR" });
    expect(html).toContain("\u20AC999.00");
  });

  it("shows dimensions when available", () => {
    const html = generateProductPage(product);
    expect(html).toContain("200 cm");
    expect(html).toContain("85 cm");
  });

  it("shows reviews when provided", () => {
    const html = generateProductPage(product, {
      reviews: { rating: 4.5, count: 42 },
    });
    expect(html).toContain("4.5");
    expect(html).toContain("42 reviews");
  });

  it("includes breadcrumbs", () => {
    const html = generateProductPage(product, {
      breadcrumbs: ["Home", "Furniture", "Sofas"],
    });
    expect(html).toContain("Home");
    expect(html).toContain("Furniture");
    expect(html).toContain("Sofas");
  });

  it("includes CTA button with custom text", () => {
    const html = generateProductPage(product, { ctaText: "Buy Now" });
    expect(html).toContain("Buy Now");
  });

  it("applies modern theme by default", () => {
    const html = generateProductPage(product);
    expect(html).toContain("#6366f1"); // modern primary
  });

  it("applies luxury theme", () => {
    const html = generateProductPage(product, { theme: "luxury" });
    expect(html).toContain("#b8860b"); // luxury gold
  });

  it("applies minimal theme", () => {
    const html = generateProductPage(product, { theme: "minimal" });
    expect(html).toContain("--pp-primary: #000000");
  });

  it("includes AR button by default", () => {
    const html = generateProductPage(product);
    expect(html).toContain("ar-modes");
    expect(html).toContain("View in your space");
  });

  it("hides AR button when disabled", () => {
    const html = generateProductPage(product, { showARButton: false });
    expect(html).not.toContain("ar-modes");
  });

  it("includes 3D badge", () => {
    const html = generateProductPage(product);
    expect(html).toContain("pp-badge-3d");
    expect(html).toContain("3D");
  });

  it("is responsive with grid layout", () => {
    const html = generateProductPage(product);
    expect(html).toContain("grid-template-columns");
    expect(html).toContain("@media (max-width: 768px)");
  });
});

// ---------------------------------------------------------------------------
// analyzeConversion
// ---------------------------------------------------------------------------

describe("analyzeConversion", () => {
  it("returns base score of 50 for empty input", () => {
    const result = analyzeConversion({});
    expect(result.score).toBe(50);
  });

  it("scores higher with 3D model", () => {
    const result = analyzeConversion({ hasModel: true });
    expect(result.score).toBeGreaterThan(50);
  });

  it("scores higher with AR", () => {
    const result = analyzeConversion({ hasModel: true, hasAR: true });
    expect(result.score).toBeGreaterThan(65);
  });

  it("gives perfect-ish score for fully optimized page", () => {
    const result = analyzeConversion({
      hasModel: true,
      hasAR: true,
      hasMultipleAngles: true,
      hasConfigurator: true,
      loadTimeSec: 2,
      modelSizeMB: 3,
      hasPosterImage: true,
      isMobileOptimized: true,
      hasStructuredData: true,
    });
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it("flags slow load time", () => {
    const result = analyzeConversion({ loadTimeSec: 8 });
    const perfTip = result.tips.find((t) => t.category === "Performance");
    expect(perfTip).toBeDefined();
    expect(perfTip!.priority).toBe("high");
  });

  it("flags large model size", () => {
    const result = analyzeConversion({ modelSizeMB: 20 });
    const sizeTip = result.tips.find((t) => t.category === "File Size");
    expect(sizeTip).toBeDefined();
    expect(sizeTip!.priority).toBe("high");
  });

  it("suggests configurator for furniture category", () => {
    const result = analyzeConversion({ category: "furniture" });
    const configTip = result.tips.find((t) => t.category === "Interactivity");
    expect(configTip).toBeDefined();
  });

  it("generates markdown summary", () => {
    const result = analyzeConversion({ hasModel: true, hasAR: false });
    expect(result.summary).toContain("## 3D Product Page Conversion Analysis");
    expect(result.summary).toContain("Score:");
    expect(result.summary).toContain("Industry Benchmarks");
  });

  it("caps score at 100", () => {
    const result = analyzeConversion({
      hasModel: true,
      hasAR: true,
      hasMultipleAngles: true,
      hasConfigurator: true,
      loadTimeSec: 1,
      modelSizeMB: 1,
      hasPosterImage: true,
      isMobileOptimized: true,
      hasStructuredData: true,
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("does not suggest configurator for non-applicable categories", () => {
    const result = analyzeConversion({ category: "electronics" });
    const configTip = result.tips.find((t) => t.category === "Interactivity");
    expect(configTip).toBeUndefined();
  });

  it("sorts tips by priority in summary", () => {
    const result = analyzeConversion({});
    const highIdx = result.summary.indexOf("[HIGH]");
    const mediumIdx = result.summary.indexOf("[MEDIUM]");
    if (highIdx >= 0 && mediumIdx >= 0) {
      expect(highIdx).toBeLessThan(mediumIdx);
    }
  });
});

// ---------------------------------------------------------------------------
// generateSizeGuide
// ---------------------------------------------------------------------------

describe("generateSizeGuide", () => {
  const product = {
    name: "Slim Fit Shirt",
    modelUrl: "https://cdn.store.com/models/shirt.glb",
  };

  it("generates size guide for clothing", () => {
    const html = generateSizeGuide(product, { category: "clothing" });
    expect(html).toContain("Size Guide");
    expect(html).toContain("Slim Fit Shirt");
    expect(html).toContain("Chest");
  });

  it("includes measuring instructions for clothing", () => {
    const html = generateSizeGuide(product, { category: "clothing" });
    expect(html).toContain("How to measure");
    expect(html).toContain("Chest:");
    expect(html).toContain("Waist:");
  });

  it("generates default size chart for footwear", () => {
    const html = generateSizeGuide(product, { category: "footwear" });
    expect(html).toContain("Foot Length");
    expect(html).toContain("US");
    expect(html).toContain("EU");
  });

  it("generates default size chart for furniture", () => {
    const html = generateSizeGuide(product, { category: "furniture" });
    expect(html).toContain("Width (cm)");
    expect(html).toContain("Depth (cm)");
  });

  it("uses custom sizes when provided", () => {
    const html = generateSizeGuide(product, {
      category: "clothing",
      sizes: [
        { label: "S", measurements: { chest: 92, waist: 76 }, unit: "cm" },
        { label: "M", measurements: { chest: 98, waist: 82 }, unit: "cm" },
      ],
    });
    expect(html).toContain(">S<");
    expect(html).toContain(">M<");
    expect(html).toContain("92");
    expect(html).toContain("98");
  });

  it("includes AR measurement section by default", () => {
    const html = generateSizeGuide(product, { category: "clothing" });
    expect(html).toContain("Measure with AR");
    expect(html).toContain("<model-viewer");
    expect(html).toContain("ar-modes");
  });

  it("hides AR section when disabled", () => {
    const html = generateSizeGuide(product, { category: "clothing", enableAR: false });
    expect(html).not.toContain("Measure with AR");
  });

  it("includes international conversion chart", () => {
    const html = generateSizeGuide(product, {
      category: "clothing",
      showConversionChart: true,
      targetRegions: ["US", "EU", "UK"],
    });
    expect(html).toContain("International Size Conversion");
  });

  it("hides conversion chart when disabled", () => {
    const html = generateSizeGuide(product, {
      category: "clothing",
      showConversionChart: false,
    });
    expect(html).not.toContain("International Size Conversion");
  });

  it("skips conversion chart for furniture", () => {
    const html = generateSizeGuide(product, {
      category: "furniture",
      showConversionChart: true,
    });
    expect(html).not.toContain("International Size Conversion");
  });

  it("includes furniture-specific AR instructions", () => {
    const html = generateSizeGuide(product, { category: "furniture" });
    expect(html).toContain("fits in your space");
    expect(html).toContain('ar-placement="floor"');
  });
});

// ---------------------------------------------------------------------------
// generateWooCommerceSnippet
// ---------------------------------------------------------------------------

describe("generateWooCommerceSnippet", () => {
  const product = { name: "Ceramic Vase" };

  it("generates valid PHP code", () => {
    const php = generateWooCommerceSnippet(product);
    expect(php).toContain("<?php");
    expect(php).toContain("add_action(");
  });

  it("enqueues model-viewer script", () => {
    const php = generateWooCommerceSnippet(product);
    expect(php).toContain("wp_enqueue_script");
    expect(php).toContain("model-viewer");
  });

  it("checks is_product() before enqueuing", () => {
    const php = generateWooCommerceSnippet(product);
    expect(php).toContain("is_product()");
  });

  it("reads model URL from post meta", () => {
    const php = generateWooCommerceSnippet(product);
    expect(php).toContain("get_post_meta");
    expect(php).toContain("model_3d_url");
    expect(php).toContain("model_usdz_url");
  });

  it("includes model-viewer tag with PHP variables", () => {
    const php = generateWooCommerceSnippet(product);
    expect(php).toContain("<model-viewer");
    expect(php).toContain("esc_url($model_url)");
  });

  it("adds custom meta boxes in admin", () => {
    const php = generateWooCommerceSnippet(product);
    expect(php).toContain("woocommerce_product_options_general_product_data");
    expect(php).toContain("woocommerce_wp_text_input");
  });

  it("saves custom fields", () => {
    const php = generateWooCommerceSnippet(product);
    expect(php).toContain("woocommerce_process_product_meta");
    expect(php).toContain("update_post_meta");
  });

  it("includes AR by default", () => {
    const php = generateWooCommerceSnippet(product);
    expect(php).toContain("ar-modes");
    expect(php).toContain("View in your space");
  });

  it("includes setup instructions", () => {
    const php = generateWooCommerceSnippet(product);
    expect(php).toContain("SETUP INSTRUCTIONS");
    expect(php).toContain("functions.php");
    expect(php).toContain("Custom Plugin");
  });

  it("uses provided section ID", () => {
    const php = generateWooCommerceSnippet(product, { sectionId: "my-3d" });
    expect(php).toContain('id="my-3d"');
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
