import type {
  ProductInput,
  ViewerConfig,
  ConfiguratorOption,
  OptimizationSettings,
} from "./types.js";

// ---------------------------------------------------------------------------
// model-viewer embed generator
// ---------------------------------------------------------------------------

const MV_CDN =
  "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";

export function generateModelViewerEmbed(
  product: ProductInput,
  config: ViewerConfig = {},
): string {
  const {
    autoRotate = true,
    cameraControls = true,
    ar = true,
    shadowIntensity = 1,
    exposure = 1,
    backgroundColor = "#ffffff",
    poster,
    alt,
    loading = "lazy",
    reveal = "auto",
  } = config;

  const modelSrc = product.modelUrl || `https://cdn.example.com/models/${slugify(product.name)}.glb`;
  const iosSrc = modelSrc.replace(/\.glb$/, ".usdz");
  const altText = alt || `3D model of ${product.name}`;

  const attrs: string[] = [
    `src="${modelSrc}"`,
    `ios-src="${iosSrc}"`,
    `alt="${altText}"`,
    `loading="${loading}"`,
    `reveal="${reveal}"`,
    `shadow-intensity="${shadowIntensity}"`,
    `exposure="${exposure}"`,
    `style="width: 100%; height: 500px; background-color: ${backgroundColor};"`,
  ];

  if (autoRotate) attrs.push("auto-rotate");
  if (cameraControls) attrs.push("camera-controls");
  if (ar) attrs.push("ar", 'ar-modes="webxr scene-viewer quick-look"');
  if (poster) attrs.push(`poster="${poster}"`);

  return `<!-- 3D Product Viewer — ${product.name} -->
<script type="module" src="${MV_CDN}"></script>
<model-viewer
  ${attrs.join("\n  ")}
>
  ${ar ? `<button slot="ar-button" style="background: #000; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); cursor: pointer; font-size: 14px;">View in your space</button>` : ""}
</model-viewer>`;
}

// ---------------------------------------------------------------------------
// AR try-on link generator
// ---------------------------------------------------------------------------

export type ARCategory =
  | "furniture"
  | "clothing"
  | "accessories"
  | "footwear"
  | "cosmetics"
  | "other";

export function createARTryOnEmbed(
  product: ProductInput,
  category: ARCategory = "other",
): string {
  const modelSrc = product.modelUrl || `https://cdn.example.com/models/${slugify(product.name)}.glb`;
  const usdzSrc = modelSrc.replace(/\.glb$/, ".usdz");

  const placementMode = getPlacementMode(category);
  const tryOnLabel = getTryOnLabel(category);

  return `<!-- AR Try-On — ${product.name} -->
<script type="module" src="${MV_CDN}"></script>
<model-viewer
  src="${modelSrc}"
  ios-src="${usdzSrc}"
  alt="AR try-on: ${product.name}"
  ar
  ar-modes="webxr scene-viewer quick-look"
  ar-placement="${placementMode}"
  camera-controls
  auto-rotate
  shadow-intensity="1"
  style="width: 100%; height: 500px;"
>
  <button slot="ar-button" style="
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 14px 28px;
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
  ">${tryOnLabel}</button>
</model-viewer>

<!-- Deep links for native AR apps -->
<div style="display: none;">
  <a id="ar-link-ios" rel="ar" href="${usdzSrc}">
    <img src="" alt="AR Quick Look" />
  </a>
  <a id="ar-link-android" href="intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelSrc)}&mode=ar_preferred#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end;">
    View in AR (Android)
  </a>
</div>`;
}

function getPlacementMode(category: ARCategory): "floor" | "wall" {
  switch (category) {
    case "furniture":
    case "footwear":
      return "floor";
    default:
      return "floor";
  }
}

function getTryOnLabel(category: ARCategory): string {
  switch (category) {
    case "furniture":
      return "Place in your room";
    case "clothing":
    case "accessories":
    case "footwear":
      return "Try it on";
    case "cosmetics":
      return "Try this look";
    default:
      return "View in AR";
  }
}

// ---------------------------------------------------------------------------
// Product configurator
// ---------------------------------------------------------------------------

export function generateConfigurator(
  product: ProductInput,
  options: ConfiguratorOption[],
  config: ViewerConfig = {},
): string {
  const modelSrc = product.modelUrl || `https://cdn.example.com/models/${slugify(product.name)}.glb`;

  const optionControls = options
    .map((opt) => generateOptionControl(opt))
    .join("\n    ");

  const jsHandlers = options
    .map((opt) => generateOptionHandler(opt))
    .join("\n    ");

  return `<!-- 3D Product Configurator — ${product.name} -->
<script type="module" src="${MV_CDN}"></script>
<style>
  .configurator-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 800px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .configurator-viewer {
    width: 100%;
    height: 500px;
    border-radius: 12px;
    overflow: hidden;
  }
  .configurator-options {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 16px;
    background: #f9fafb;
    border-radius: 12px;
  }
  .option-group { flex: 1; min-width: 200px; }
  .option-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 14px;
    color: #374151;
  }
  .color-swatch {
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 3px solid transparent;
    cursor: pointer;
    display: inline-block;
    margin-right: 8px;
    transition: border-color 0.2s;
  }
  .color-swatch.active, .color-swatch:hover {
    border-color: #6366f1;
  }
  .option-select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    background: #fff;
  }
  .configurator-price {
    font-size: 24px;
    font-weight: 700;
    color: #111827;
    text-align: center;
    padding: 12px;
  }
</style>

<div class="configurator-container">
  <model-viewer
    class="configurator-viewer"
    id="product-configurator"
    src="${modelSrc}"
    alt="Configure ${product.name}"
    camera-controls
    auto-rotate
    shadow-intensity="1"
    ${config.ar ? 'ar ar-modes="webxr scene-viewer quick-look"' : ""}
  ></model-viewer>

  <div class="configurator-options">
    ${optionControls}
  </div>

  <div class="configurator-price" id="configurator-price"></div>
</div>

<script type="module">
  const viewer = document.getElementById('product-configurator');
  let basePrice = 0;
  let priceModifiers = {};

  function updatePrice() {
    const total = basePrice + Object.values(priceModifiers).reduce((a, b) => a + b, 0);
    document.getElementById('configurator-price').textContent =
      total > 0 ? '$' + total.toFixed(2) : '';
  }

  ${jsHandlers}
</script>`;
}

function generateOptionControl(option: ConfiguratorOption): string {
  const id = slugify(option.name);

  if (option.type === "color") {
    const swatches = option.values
      .map(
        (v, i) =>
          `<span class="color-swatch${i === 0 ? " active" : ""}" style="background: ${v.value};" data-option="${id}" data-value="${v.value}" data-price="${v.priceModifier || 0}" title="${v.label}"></span>`,
      )
      .join("\n      ");
    return `<div class="option-group">
      <label>${option.name}</label>
      <div id="option-${id}">${swatches}</div>
    </div>`;
  }

  const selectOptions = option.values
    .map(
      (v) =>
        `<option value="${v.value}" data-price="${v.priceModifier || 0}">${v.label}</option>`,
    )
    .join("\n        ");
  return `<div class="option-group">
      <label for="option-${id}">${option.name}</label>
      <select id="option-${id}" class="option-select">
        ${selectOptions}
      </select>
    </div>`;
}

function generateOptionHandler(option: ConfiguratorOption): string {
  const id = slugify(option.name);

  if (option.type === "color") {
    return `
    document.querySelectorAll('[data-option="${id}"]').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('[data-option="${id}"]').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        priceModifiers['${id}'] = parseFloat(swatch.dataset.price || '0');
        updatePrice();
        // In production, update model material here via viewer.model API
      });
    });`;
  }

  return `
    document.getElementById('option-${id}')?.addEventListener('change', (e) => {
      const selected = e.target.selectedOptions[0];
      priceModifiers['${id}'] = parseFloat(selected?.dataset?.price || '0');
      updatePrice();
      // In production, swap model variant here
    });`;
}

// ---------------------------------------------------------------------------
// 3D asset optimization guidance
// ---------------------------------------------------------------------------

export function generateOptimizationReport(
  product: ProductInput,
  settings: OptimizationSettings = {},
): string {
  const {
    targetPolyCount = 50000,
    compressTextures = true,
    textureMaxSize = 1024,
    generateLODs = true,
    format = "glb",
  } = settings;

  const modelSrc = product.modelUrl || "(no model URL provided)";

  const steps: string[] = [
    `1. **Polygon reduction**: Target ${targetPolyCount.toLocaleString()} polygons (from source mesh). Use edge-collapse decimation to preserve silhouette edges.`,
    `2. **Texture optimization**: ${compressTextures ? `Compress all textures to max ${textureMaxSize}x${textureMaxSize}px. Use KTX2 with Basis Universal for GPU-compressed textures (70-80% smaller).` : "Textures will be kept at original resolution."}`,
    `3. **Draco mesh compression**: Enable Draco geometry compression for ${format.toUpperCase()} output (30-50% file size reduction).`,
    generateLODs
      ? `4. **LOD generation**: Create 3 LODs — High (${targetPolyCount}), Medium (${Math.round(targetPolyCount * 0.3)}), Low (${Math.round(targetPolyCount * 0.1)}) for adaptive streaming.`
      : `4. **LOD generation**: Disabled.`,
    `5. **Output format**: ${format.toUpperCase()}${format === "glb" ? " (binary, single file — best for web)" : format === "usdz" ? " (Apple AR Quick Look)" : " (JSON + binary — good for debugging)"}`,
  ];

  const estimatedSize = estimateFileSize(targetPolyCount, textureMaxSize, compressTextures);

  return `## 3D Asset Optimization Report — ${product.name}

**Source**: ${modelSrc}
**Target format**: ${format.toUpperCase()}
**Estimated output size**: ~${estimatedSize}

### Optimization Steps

${steps.join("\n\n")}

### Recommended Pipeline

\`\`\`bash
# Using glTF-Transform CLI (recommended)
npx gltf-transform optimize input.glb output.${format} \\
  --compress draco \\
  --texture-compress ktx2 \\
  --texture-size ${textureMaxSize}
\`\`\`

### Web Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| File size | < 5 MB | For fast mobile loading |
| Polygons | < ${targetPolyCount.toLocaleString()} | Smooth 60fps on mid-range devices |
| Textures | ${textureMaxSize}x${textureMaxSize} max | KTX2 with Basis Universal |
| Load time | < 3s on 4G | Use lazy loading + poster image |

### Integration Code

\`\`\`html
<model-viewer
  src="optimized-${slugify(product.name)}.${format}"
  loading="lazy"
  poster="poster-${slugify(product.name)}.webp"
  camera-controls
  auto-rotate
></model-viewer>
\`\`\``;
}

function estimateFileSize(
  polyCount: number,
  textureSize: number,
  compressed: boolean,
): string {
  // Rough estimation: ~40 bytes per triangle (Draco compressed)
  const meshKB = (polyCount * 40) / 1024;
  // 4 textures (diffuse, normal, roughness, ao) at estimated compression
  const texKB = compressed
    ? 4 * ((textureSize * textureSize * 0.5) / 1024)
    : 4 * ((textureSize * textureSize * 3) / 1024);
  const totalMB = (meshKB + texKB) / 1024;

  if (totalMB < 1) return `${Math.round((meshKB + texKB))} KB`;
  return `${totalMB.toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Turntable animation embed
// ---------------------------------------------------------------------------

export function generateTurntableEmbed(
  product: ProductInput,
  config: {
    speed?: number;
    frames?: number;
    backgroundColor?: string;
    height?: string;
  } = {},
): string {
  const {
    speed = 30,
    backgroundColor = "#ffffff",
    height = "500px",
  } = config;

  const modelSrc = product.modelUrl || `https://cdn.example.com/models/${slugify(product.name)}.glb`;

  return `<!-- 360° Turntable — ${product.name} -->
<script type="module" src="${MV_CDN}"></script>
<style>
  .turntable-container {
    position: relative;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }
  .turntable-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0,0,0,0.7);
    color: #fff;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-family: -apple-system, sans-serif;
    pointer-events: none;
    z-index: 1;
  }
</style>

<div class="turntable-container">
  <span class="turntable-badge">360°</span>
  <model-viewer
    src="${modelSrc}"
    alt="360° view of ${product.name}"
    auto-rotate
    auto-rotate-delay="0"
    rotation-per-second="${speed}deg"
    camera-controls
    interaction-prompt="none"
    shadow-intensity="1"
    exposure="1"
    style="width: 100%; height: ${height}; background-color: ${backgroundColor}; border-radius: 12px;"
  ></model-viewer>
</div>`;
}

// ---------------------------------------------------------------------------
// Shopify Liquid snippet
// ---------------------------------------------------------------------------

export function generateShopifySnippet(
  product: ProductInput,
  config: ViewerConfig & { sectionId?: string } = {},
): string {
  const sectionId = config.sectionId || "product-3d-viewer";

  return `{% comment %}
  3D Product Viewer — Drop this into your Shopify theme.
  File: snippets/product-3d-viewer.liquid
  Usage: {% render 'product-3d-viewer', product: product %}
{% endcomment %}

{% if product.metafields.custom.model_3d_url != blank %}
  <script type="module" src="${MV_CDN}"></script>

  <div
    id="${sectionId}"
    class="product-3d-viewer"
    style="width: 100%; aspect-ratio: 1; max-width: 600px; margin: 0 auto;"
  >
    <model-viewer
      src="{{ product.metafields.custom.model_3d_url }}"
      {% if product.metafields.custom.model_usdz_url %}
        ios-src="{{ product.metafields.custom.model_usdz_url }}"
      {% endif %}
      alt="{{ product.title | escape }} — 3D View"
      poster="{{ product.featured_image | image_url: width: 800 }}"
      loading="lazy"
      camera-controls
      auto-rotate
      ${config.ar !== false ? 'ar\n      ar-modes="webxr scene-viewer quick-look"' : ""}
      shadow-intensity="1"
      style="width: 100%; height: 100%;"
    >
      {% if product.metafields.custom.model_3d_url %}
        <button slot="ar-button" class="btn btn--primary product-3d-viewer__ar-btn">
          {{ 'products.product.view_in_ar' | t | default: 'View in your space' }}
        </button>
      {% endif %}
    </model-viewer>
  </div>

  <style>
    .product-3d-viewer__ar-btn {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
    }
  </style>

{% else %}
  {% comment %} No 3D model — fall back to standard product image {% endcomment %}
{% endif %}

{% comment %}
  === SETUP INSTRUCTIONS ===

  1. Add custom metafields in Shopify Admin > Settings > Metafields > Products:
     - model_3d_url (URL) — Link to .glb file
     - model_usdz_url (URL) — Link to .usdz file (optional, for iOS AR)

  2. Upload 3D models to Shopify Files (Settings > Files) or a CDN.

  3. Add this snippet to your product template:
     {% render 'product-3d-viewer', product: product %}

  4. For Dawn theme, add to sections/main-product.liquid inside the media gallery.
{% endcomment %}`;
}

// ---------------------------------------------------------------------------
// SEO structured data
// ---------------------------------------------------------------------------

export function generateSEO3DMetadata(
  product: ProductInput,
  options: {
    price?: number;
    currency?: string;
    availability?: "InStock" | "OutOfStock" | "PreOrder";
    brand?: string;
    sku?: string;
    url?: string;
  } = {},
): string {
  const {
    price,
    currency = "USD",
    availability = "InStock",
    brand,
    sku,
    url,
  } = options;

  const modelUrl = product.modelUrl || `https://cdn.example.com/models/${slugify(product.name)}.glb`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} — view in 3D and AR`,
    image: product.imageUrls?.[0],
    ...(brand && { brand: { "@type": "Brand", name: brand } }),
    ...(sku && { sku }),
    ...(url && { url }),
    subjectOf: {
      "@type": "3DModel",
      encodingFormat: "model/gltf-binary",
      contentUrl: modelUrl,
    },
    ...(price !== undefined && {
      offers: {
        "@type": "Offer",
        price: price.toFixed(2),
        priceCurrency: currency,
        availability: `https://schema.org/${availability}`,
      },
    }),
  };

  if (product.dimensions) {
    const d = product.dimensions;
    const unitMap: Record<string, string> = {
      cm: "CMT",
      m: "MTR",
      in: "INH",
      ft: "FOT",
      mm: "MMT",
    };
    schema.width = {
      "@type": "QuantitativeValue",
      value: d.width,
      unitCode: unitMap[d.unit] || d.unit,
    };
    schema.height = {
      "@type": "QuantitativeValue",
      value: d.height,
      unitCode: unitMap[d.unit] || d.unit,
    };
    schema.depth = {
      "@type": "QuantitativeValue",
      value: d.depth,
      unitCode: unitMap[d.unit] || d.unit,
    };
  }

  return `<!-- Schema.org Product + 3DModel structured data -->
<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
}

// ---------------------------------------------------------------------------
// Full product page generator
// ---------------------------------------------------------------------------

export interface ProductPageOptions {
  theme?: "minimal" | "modern" | "luxury";
  showPrice?: boolean;
  price?: number;
  currency?: string;
  showARButton?: boolean;
  showDimensions?: boolean;
  showBreadcrumbs?: boolean;
  breadcrumbs?: string[];
  ctaText?: string;
  reviews?: { rating: number; count: number };
}

export function generateProductPage(
  product: ProductInput,
  options: ProductPageOptions = {},
): string {
  const {
    theme = "modern",
    showPrice = true,
    price,
    currency = "USD",
    showARButton = true,
    showDimensions = true,
    showBreadcrumbs = true,
    breadcrumbs = ["Home", "Products"],
    ctaText = "Add to Cart",
    reviews,
  } = options;

  const modelSrc = product.modelUrl || `https://cdn.example.com/models/${slugify(product.name)}.glb`;
  const iosSrc = modelSrc.replace(/\.glb$/, ".usdz");
  const currencySymbol = getCurrencySymbol(currency);

  const themeColors = getThemeColors(theme);

  const breadcrumbHtml = showBreadcrumbs
    ? `<nav class="pp-breadcrumbs" aria-label="Breadcrumb">
      <ol>${[...breadcrumbs, product.name].map((b, i, arr) => `<li${i === arr.length - 1 ? ' aria-current="page"' : ""}>${i < arr.length - 1 ? `<a href="#">${b}</a>` : b}</li>`).join("")}</ol>
    </nav>`
    : "";

  const dimensionsHtml =
    showDimensions && product.dimensions
      ? `<div class="pp-dimensions">
        <h3>Dimensions</h3>
        <ul>
          <li><strong>Width:</strong> ${product.dimensions.width} ${product.dimensions.unit}</li>
          <li><strong>Height:</strong> ${product.dimensions.height} ${product.dimensions.unit}</li>
          <li><strong>Depth:</strong> ${product.dimensions.depth} ${product.dimensions.unit}</li>
        </ul>
      </div>`
      : "";

  const reviewsHtml = reviews
    ? `<div class="pp-reviews">
        <span class="pp-stars">${"★".repeat(Math.round(reviews.rating))}${"☆".repeat(5 - Math.round(reviews.rating))}</span>
        <span class="pp-review-count">${reviews.rating.toFixed(1)} (${reviews.count} reviews)</span>
      </div>`
    : "";

  const priceHtml =
    showPrice && price !== undefined
      ? `<div class="pp-price">${currencySymbol}${price.toFixed(2)}</div>`
      : "";

  return `<!-- Shopify Product Page with 3D Viewer — ${product.name} -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.name} — 3D Product View</title>
  <script type="module" src="${MV_CDN}"></script>
  <style>
    :root {
      --pp-primary: ${themeColors.primary};
      --pp-bg: ${themeColors.bg};
      --pp-text: ${themeColors.text};
      --pp-accent: ${themeColors.accent};
      --pp-surface: ${themeColors.surface};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${themeColors.font};
      background: var(--pp-bg);
      color: var(--pp-text);
      line-height: 1.6;
    }
    .pp-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      align-items: start;
    }
    @media (max-width: 768px) {
      .pp-container { grid-template-columns: 1fr; gap: 24px; }
    }
    .pp-breadcrumbs ol {
      display: flex;
      gap: 8px;
      list-style: none;
      font-size: 14px;
      color: #6b7280;
      grid-column: 1 / -1;
    }
    .pp-breadcrumbs li:not(:last-child)::after { content: "/"; margin-left: 8px; }
    .pp-breadcrumbs a { color: var(--pp-primary); text-decoration: none; }
    .pp-viewer-wrapper {
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      background: var(--pp-surface);
    }
    .pp-viewer {
      width: 100%;
      height: 500px;
    }
    .pp-info { display: flex; flex-direction: column; gap: 20px; }
    .pp-title { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; }
    .pp-description { font-size: 16px; color: #6b7280; }
    .pp-price { font-size: 28px; font-weight: 700; color: var(--pp-primary); }
    .pp-reviews { display: flex; align-items: center; gap: 8px; }
    .pp-stars { color: #f59e0b; font-size: 18px; }
    .pp-review-count { font-size: 14px; color: #6b7280; }
    .pp-dimensions h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 8px; }
    .pp-dimensions ul { list-style: none; display: flex; gap: 16px; flex-wrap: wrap; }
    .pp-dimensions li { font-size: 14px; }
    .pp-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 16px 32px;
      background: var(--pp-primary);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
      width: 100%;
      max-width: 400px;
    }
    .pp-cta:hover { opacity: 0.9; }
    .pp-ar-btn {
      background: var(--pp-accent);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 20px;
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    .pp-badge-3d {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(0,0,0,0.7);
      color: #fff;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      z-index: 1;
    }
  </style>
</head>
<body>
  ${breadcrumbHtml}
  <div class="pp-container">
    <div class="pp-viewer-wrapper">
      <span class="pp-badge-3d">3D</span>
      <model-viewer
        class="pp-viewer"
        src="${modelSrc}"
        ios-src="${iosSrc}"
        alt="3D model of ${product.name}"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        exposure="1"
        loading="lazy"
        ${showARButton ? 'ar ar-modes="webxr scene-viewer quick-look"' : ""}
      >
        ${showARButton ? '<button slot="ar-button" class="pp-ar-btn">View in your space</button>' : ""}
      </model-viewer>
    </div>
    <div class="pp-info">
      <h1 class="pp-title">${product.name}</h1>
      ${reviewsHtml}
      ${priceHtml}
      ${product.description ? `<p class="pp-description">${product.description}</p>` : ""}
      ${dimensionsHtml}
      <button class="pp-cta">${ctaText}</button>
    </div>
  </div>
</body>
</html>`;
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "\u20AC", GBP: "\u00A3", JPY: "\u00A5", CAD: "CA$", AUD: "A$",
    CHF: "CHF ", SEK: "kr ", NOK: "kr ", DKK: "kr ", INR: "\u20B9",
  };
  return symbols[currency] || `${currency} `;
}

function getThemeColors(theme: "minimal" | "modern" | "luxury"): {
  primary: string; bg: string; text: string; accent: string; surface: string; font: string;
} {
  switch (theme) {
    case "minimal":
      return { primary: "#000000", bg: "#ffffff", text: "#111827", accent: "#6b7280", surface: "#f9fafb", font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" };
    case "luxury":
      return { primary: "#b8860b", bg: "#faf9f6", text: "#1a1a1a", accent: "#8b7355", surface: "#f5f0e8", font: "'Playfair Display', 'Georgia', serif" };
    case "modern":
    default:
      return { primary: "#6366f1", bg: "#ffffff", text: "#111827", accent: "#8b5cf6", surface: "#f9fafb", font: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" };
  }
}

// ---------------------------------------------------------------------------
// Conversion analysis
// ---------------------------------------------------------------------------

export interface ConversionAnalysisInput {
  hasModel?: boolean;
  hasAR?: boolean;
  hasMultipleAngles?: boolean;
  hasConfigurator?: boolean;
  loadTimeSec?: number;
  modelSizeMB?: number;
  hasPosterImage?: boolean;
  isMobileOptimized?: boolean;
  hasStructuredData?: boolean;
  category?: string;
}

export interface ConversionTip {
  priority: "high" | "medium" | "low";
  category: string;
  issue: string;
  recommendation: string;
  expectedImpact: string;
}

export function analyzeConversion(input: ConversionAnalysisInput): {
  score: number;
  tips: ConversionTip[];
  summary: string;
} {
  const tips: ConversionTip[] = [];
  let score = 50; // base score

  // 3D model presence
  if (input.hasModel) {
    score += 15;
  } else {
    tips.push({
      priority: "high",
      category: "3D Model",
      issue: "No 3D model on product page",
      recommendation: "Add a 3D model viewer using <model-viewer>. Products with 3D viewers see up to 94% higher conversion rates according to Shopify studies.",
      expectedImpact: "+20-40% conversion rate",
    });
  }

  // AR support
  if (input.hasAR) {
    score += 10;
  } else {
    tips.push({
      priority: "high",
      category: "AR Experience",
      issue: "No AR try-on/placement available",
      recommendation: "Enable AR with WebXR + Scene Viewer (Android) and Quick Look (iOS). AR experiences reduce return rates by up to 25%.",
      expectedImpact: "+15-25% conversion, -25% returns",
    });
  }

  // Poster image
  if (input.hasPosterImage) {
    score += 5;
  } else {
    tips.push({
      priority: "medium",
      category: "Loading UX",
      issue: "No poster image while 3D model loads",
      recommendation: "Add a poster attribute to <model-viewer> with a high-quality product photo. Reduces perceived load time and prevents layout shift.",
      expectedImpact: "+5-10% engagement",
    });
  }

  // Load time
  if (input.loadTimeSec !== undefined) {
    if (input.loadTimeSec <= 3) {
      score += 10;
    } else if (input.loadTimeSec <= 6) {
      score += 5;
      tips.push({
        priority: "medium",
        category: "Performance",
        issue: `3D model load time is ${input.loadTimeSec}s (target: <3s)`,
        recommendation: "Compress with Draco, use KTX2 textures, reduce polygon count. Each second of delay reduces conversions by ~7%.",
        expectedImpact: "+7-15% conversion",
      });
    } else {
      tips.push({
        priority: "high",
        category: "Performance",
        issue: `3D model load time is ${input.loadTimeSec}s (critical: >6s)`,
        recommendation: "Urgently optimize: enable Draco compression, downscale textures to 1024px max, use LODs for progressive loading. Consider lazy loading with reveal='interaction'.",
        expectedImpact: "+15-30% conversion",
      });
    }
  }

  // Model size
  if (input.modelSizeMB !== undefined) {
    if (input.modelSizeMB <= 5) {
      score += 5;
    } else {
      tips.push({
        priority: input.modelSizeMB > 15 ? "high" : "medium",
        category: "File Size",
        issue: `Model file is ${input.modelSizeMB}MB (target: <5MB)`,
        recommendation: `Use gltf-transform to compress: \`npx gltf-transform optimize input.glb output.glb --compress draco --texture-compress ktx2 --texture-size 1024\``,
        expectedImpact: "+5-10% mobile conversion",
      });
    }
  }

  // Mobile optimization
  if (input.isMobileOptimized) {
    score += 5;
  } else {
    tips.push({
      priority: "high",
      category: "Mobile",
      issue: "Page not optimized for mobile 3D viewing",
      recommendation: "Ensure responsive viewer sizing, touch-friendly AR buttons (min 48px tap target), and lazy loading. Over 70% of e-commerce traffic is mobile.",
      expectedImpact: "+10-20% mobile conversion",
    });
  }

  // Configurator
  if (input.hasConfigurator) {
    score += 5;
  } else if (input.category && ["furniture", "clothing", "footwear", "accessories"].includes(input.category)) {
    tips.push({
      priority: "medium",
      category: "Interactivity",
      issue: "No product configurator for customizable category",
      recommendation: `Add a 3D configurator for ${input.category} to let customers pick colors, materials, and sizes. Configurators increase average order value by 20-30%.`,
      expectedImpact: "+20-30% average order value",
    });
  }

  // Structured data
  if (input.hasStructuredData) {
    score += 5;
  } else {
    tips.push({
      priority: "medium",
      category: "SEO",
      issue: "No 3DModel structured data for search engines",
      recommendation: "Add schema.org Product + 3DModel JSON-LD. Google shows 3D/AR badges in search results for pages with proper structured data.",
      expectedImpact: "+10-15% organic click-through rate",
    });
  }

  // Multiple angles
  if (input.hasMultipleAngles) {
    score += 5;
  } else {
    tips.push({
      priority: "low",
      category: "Content",
      issue: "Only single viewing angle available",
      recommendation: "Add camera orbit presets (front, side, detail views) or a turntable animation for guided exploration.",
      expectedImpact: "+5-8% engagement",
    });
  }

  score = Math.min(100, Math.max(0, score));

  const grade =
    score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";

  const summary = `## 3D Product Page Conversion Analysis

**Score: ${score}/100 (Grade: ${grade})**

${tips.length === 0 ? "Your 3D product page is well-optimized." : `Found **${tips.length} improvement${tips.length > 1 ? "s" : ""}** across ${new Set(tips.map((t) => t.category)).size} categories.`}

### Recommendations (sorted by priority)

${tips
  .sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  })
  .map(
    (t, i) =>
      `${i + 1}. **[${t.priority.toUpperCase()}] ${t.category}**: ${t.issue}\n   - ${t.recommendation}\n   - Expected impact: ${t.expectedImpact}`,
  )
  .join("\n\n")}

### Industry Benchmarks

| Metric | Your Page | Industry Best |
|--------|-----------|--------------|
| 3D Model | ${input.hasModel ? "Yes" : "No"} | Yes |
| AR Support | ${input.hasAR ? "Yes" : "No"} | Yes |
| Load Time | ${input.loadTimeSec ? `${input.loadTimeSec}s` : "N/A"} | < 3s |
| Model Size | ${input.modelSizeMB ? `${input.modelSizeMB}MB` : "N/A"} | < 5MB |
| Structured Data | ${input.hasStructuredData ? "Yes" : "No"} | Yes |
| Mobile Optimized | ${input.isMobileOptimized ? "Yes" : "No"} | Yes |`;

  return { score, tips, summary };
}

// ---------------------------------------------------------------------------
// AR size guide generator
// ---------------------------------------------------------------------------

export type SizeGuideCategory = "clothing" | "footwear" | "furniture" | "accessories";

export interface SizeGuideOptions {
  category: SizeGuideCategory;
  sizes?: Array<{
    label: string;
    measurements: Record<string, number>;
    unit?: string;
  }>;
  enableAR?: boolean;
  showConversionChart?: boolean;
  targetRegions?: string[];
}

export function generateSizeGuide(
  product: ProductInput,
  options: SizeGuideOptions,
): string {
  const {
    category,
    sizes = [],
    enableAR = true,
    showConversionChart = true,
    targetRegions = ["US", "EU", "UK"],
  } = options;

  const modelSrc = product.modelUrl || `https://cdn.example.com/models/${slugify(product.name)}.glb`;

  const sizeChartHtml = sizes.length > 0 ? generateSizeChart(sizes, category) : getDefaultSizeChart(category);
  const conversionChartHtml = showConversionChart ? generateConversionChart(category, targetRegions) : "";

  const arMeasurementHtml = enableAR
    ? `
  <!-- AR Measurement Section -->
  <div class="sg-ar-section">
    <h3>Measure with AR</h3>
    <p>Use your phone camera to measure and see how this ${category === "furniture" ? "piece fits in your space" : "item fits you"}.</p>
    <model-viewer
      src="${modelSrc}"
      alt="AR size reference — ${product.name}"
      ar
      ar-modes="webxr scene-viewer quick-look"
      ar-placement="${category === "furniture" ? "floor" : "wall"}"
      camera-controls
      shadow-intensity="0.5"
      style="width: 100%; height: 300px; border-radius: 12px;"
    >
      <button slot="ar-button" class="sg-ar-btn">
        ${category === "furniture" ? "Place in your room to check size" : "Try on for size"}
      </button>
    </model-viewer>
  </div>`
    : "";

  return `<!-- AR Size Guide — ${product.name} -->
<script type="module" src="${MV_CDN}"></script>
<style>
  .sg-container {
    max-width: 800px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #111827;
  }
  .sg-header {
    text-align: center;
    margin-bottom: 32px;
  }
  .sg-header h2 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
  .sg-header p { color: #6b7280; font-size: 14px; }
  .sg-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 32px;
    font-size: 14px;
  }
  .sg-table th {
    background: #f3f4f6;
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid #e5e7eb;
  }
  .sg-table td {
    padding: 10px 16px;
    border-bottom: 1px solid #f3f4f6;
  }
  .sg-table tr:hover { background: #f9fafb; }
  .sg-conversion-chart { margin-bottom: 32px; }
  .sg-conversion-chart h3 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
  .sg-ar-section {
    background: #f0f0ff;
    border-radius: 16px;
    padding: 24px;
    text-align: center;
    margin-bottom: 32px;
  }
  .sg-ar-section h3 { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
  .sg-ar-section p { color: #6b7280; font-size: 14px; margin-bottom: 16px; }
  .sg-ar-btn {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 12px 24px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
  }
  .sg-how-to {
    background: #f9fafb;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 32px;
  }
  .sg-how-to h3 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
  .sg-how-to ol { padding-left: 20px; }
  .sg-how-to li { margin-bottom: 8px; font-size: 14px; color: #374151; }
</style>

<div class="sg-container">
  <div class="sg-header">
    <h2>Size Guide — ${product.name}</h2>
    <p>${getSizeGuideSubtitle(category)}</p>
  </div>

  <div class="sg-how-to">
    <h3>How to measure</h3>
    <ol>
      ${getMeasuringInstructions(category).map((s) => `<li>${s}</li>`).join("\n      ")}
    </ol>
  </div>

  ${sizeChartHtml}
  ${conversionChartHtml}
  ${arMeasurementHtml}
</div>`;
}

function getSizeGuideSubtitle(category: SizeGuideCategory): string {
  switch (category) {
    case "clothing": return "Find your perfect fit with our size chart and AR try-on.";
    case "footwear": return "Use our size chart or AR measurement for the perfect shoe fit.";
    case "furniture": return "Check dimensions and use AR to see how it fits in your space.";
    case "accessories": return "Find the right size with our measurement guide.";
  }
}

function getMeasuringInstructions(category: SizeGuideCategory): string[] {
  switch (category) {
    case "clothing":
      return [
        "Chest: Measure around the fullest part of your chest, keeping the tape level.",
        "Waist: Measure around your natural waistline, just above the hip bones.",
        "Hips: Measure around the widest part of your hips.",
        "Length: Measure from the top of your shoulder to the desired length.",
      ];
    case "footwear":
      return [
        "Place your foot on a sheet of paper against a wall.",
        "Mark the longest part of your foot on the paper.",
        "Measure the distance from the wall to the mark in centimeters.",
        "Use the size chart below to find your size.",
      ];
    case "furniture":
      return [
        "Measure the available space (width, depth, height) in your room.",
        "Compare with the product dimensions in the table below.",
        "Allow at least 5-10 cm clearance on each side.",
        "Use AR mode to visualize the furniture in your actual room.",
      ];
    case "accessories":
      return [
        "Use a flexible measuring tape for accurate results.",
        "For rings: wrap paper around your finger, mark overlap, measure length.",
        "For bracelets: measure your wrist just above the wrist bone.",
        "Refer to the chart below for the correct size.",
      ];
  }
}

function generateSizeChart(
  sizes: Array<{ label: string; measurements: Record<string, number>; unit?: string }>,
  _category: SizeGuideCategory,
): string {
  if (sizes.length === 0) return "";

  const keys = Object.keys(sizes[0].measurements);
  const unit = sizes[0].unit || "cm";

  const headerCells = keys.map((k) => `<th>${capitalize(k)} (${unit})</th>`).join("");
  const rows = sizes
    .map(
      (s) =>
        `<tr><td><strong>${s.label}</strong></td>${keys.map((k) => `<td>${s.measurements[k]}</td>`).join("")}</tr>`,
    )
    .join("\n    ");

  return `<table class="sg-table">
    <thead><tr><th>Size</th>${headerCells}</tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function getDefaultSizeChart(category: SizeGuideCategory): string {
  switch (category) {
    case "clothing":
      return `<table class="sg-table">
    <thead><tr><th>Size</th><th>Chest (cm)</th><th>Waist (cm)</th><th>Hips (cm)</th></tr></thead>
    <tbody>
      <tr><td><strong>XS</strong></td><td>82-86</td><td>62-66</td><td>86-90</td></tr>
      <tr><td><strong>S</strong></td><td>86-90</td><td>66-70</td><td>90-94</td></tr>
      <tr><td><strong>M</strong></td><td>90-96</td><td>70-76</td><td>94-100</td></tr>
      <tr><td><strong>L</strong></td><td>96-102</td><td>76-82</td><td>100-106</td></tr>
      <tr><td><strong>XL</strong></td><td>102-110</td><td>82-90</td><td>106-114</td></tr>
    </tbody>
  </table>`;
    case "footwear":
      return `<table class="sg-table">
    <thead><tr><th>Size</th><th>Foot Length (cm)</th><th>US</th><th>EU</th><th>UK</th></tr></thead>
    <tbody>
      <tr><td><strong>S</strong></td><td>24.5</td><td>7</td><td>40</td><td>6.5</td></tr>
      <tr><td><strong>M</strong></td><td>25.5</td><td>8</td><td>41</td><td>7.5</td></tr>
      <tr><td><strong>L</strong></td><td>26.5</td><td>9</td><td>42</td><td>8.5</td></tr>
      <tr><td><strong>XL</strong></td><td>27.5</td><td>10</td><td>43</td><td>9.5</td></tr>
    </tbody>
  </table>`;
    case "furniture":
      return `<table class="sg-table">
    <thead><tr><th>Size</th><th>Width (cm)</th><th>Depth (cm)</th><th>Height (cm)</th></tr></thead>
    <tbody>
      <tr><td><strong>Small</strong></td><td>80</td><td>60</td><td>45</td></tr>
      <tr><td><strong>Medium</strong></td><td>120</td><td>80</td><td>45</td></tr>
      <tr><td><strong>Large</strong></td><td>160</td><td>90</td><td>45</td></tr>
    </tbody>
  </table>`;
    default:
      return "";
  }
}

function generateConversionChart(category: SizeGuideCategory, regions: string[]): string {
  if (category === "furniture") return ""; // no conversion for furniture

  const charts: Record<string, Record<string, string[]>> = {
    clothing: {
      US: ["XS", "S", "M", "L", "XL"],
      EU: ["32", "34-36", "38-40", "42-44", "46-48"],
      UK: ["4", "6-8", "10-12", "14-16", "18-20"],
    },
    footwear: {
      US: ["7", "8", "9", "10", "11"],
      EU: ["40", "41", "42", "43", "44"],
      UK: ["6.5", "7.5", "8.5", "9.5", "10.5"],
    },
    accessories: {
      US: ["S", "M", "L", "XL"],
      EU: ["S", "M", "L", "XL"],
      UK: ["S", "M", "L", "XL"],
    },
  };

  const chart = charts[category];
  if (!chart) return "";

  const validRegions = regions.filter((r) => chart[r]);
  if (validRegions.length < 2) return "";

  const maxLen = Math.max(...validRegions.map((r) => chart[r].length));
  const rows = Array.from({ length: maxLen }, (_, i) =>
    `<tr>${validRegions.map((r) => `<td>${chart[r][i] || "-"}</td>`).join("")}</tr>`,
  ).join("\n      ");

  return `<div class="sg-conversion-chart">
    <h3>International Size Conversion</h3>
    <table class="sg-table">
      <thead><tr>${validRegions.map((r) => `<th>${r}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

// ---------------------------------------------------------------------------
// WooCommerce snippet
// ---------------------------------------------------------------------------

export function generateWooCommerceSnippet(
  product: ProductInput,
  config: ViewerConfig & { sectionId?: string } = {},
): string {
  const sectionId = config.sectionId || "product-3d-viewer";

  return `<?php
/**
 * WooCommerce 3D Product Viewer
 *
 * Add this to your theme's functions.php or as a custom plugin.
 * Displays a 3D model viewer on WooCommerce product pages.
 *
 * Requires a custom field "model_3d_url" on the product (ACF or native meta).
 */

// Enqueue model-viewer script
add_action('wp_enqueue_scripts', function() {
    if (is_product()) {
        wp_enqueue_script(
            'model-viewer',
            '${MV_CDN}',
            array(),
            '4.0.0',
            true
        );
    }
});

// Render 3D viewer after product gallery
add_action('woocommerce_before_single_product_summary', function() {
    global $product;

    $model_url = get_post_meta($product->get_id(), 'model_3d_url', true);
    $usdz_url  = get_post_meta($product->get_id(), 'model_usdz_url', true);

    if (empty($model_url)) return;

    $title = esc_attr($product->get_name());
    $poster = wp_get_attachment_url($product->get_image_id());
    ?>
    <div id="${sectionId}" class="wc-3d-viewer" style="width: 100%; max-width: 600px; margin: 0 auto 24px;">
        <model-viewer
            src="<?php echo esc_url($model_url); ?>"
            <?php if ($usdz_url): ?>
                ios-src="<?php echo esc_url($usdz_url); ?>"
            <?php endif; ?>
            alt="<?php echo $title; ?> — 3D View"
            poster="<?php echo esc_url($poster); ?>"
            loading="lazy"
            camera-controls
            auto-rotate
            ${config.ar !== false ? 'ar\n            ar-modes="webxr scene-viewer quick-look"' : ""}
            shadow-intensity="1"
            style="width: 100%; height: 500px; border-radius: 12px;"
        >
            ${config.ar !== false ? `<button slot="ar-button" style="
                background: #000;
                color: #fff;
                border: none;
                border-radius: 8px;
                padding: 10px 20px;
                position: absolute;
                bottom: 16px;
                left: 50%;
                transform: translateX(-50%);
                cursor: pointer;
                font-size: 14px;
            ">View in your space</button>` : ""}
        </model-viewer>
    </div>
    <?php
}, 15);

// Add custom meta box for 3D model URL in admin
add_action('woocommerce_product_options_general_product_data', function() {
    woocommerce_wp_text_input(array(
        'id'          => 'model_3d_url',
        'label'       => '3D Model URL (.glb)',
        'placeholder' => 'https://cdn.example.com/models/product.glb',
        'desc_tip'    => true,
        'description' => 'URL to the GLB 3D model file.',
    ));
    woocommerce_wp_text_input(array(
        'id'          => 'model_usdz_url',
        'label'       => '3D Model URL (.usdz)',
        'placeholder' => 'https://cdn.example.com/models/product.usdz',
        'desc_tip'    => true,
        'description' => 'URL to the USDZ model file (iOS AR Quick Look).',
    ));
});

// Save custom fields
add_action('woocommerce_process_product_meta', function($post_id) {
    if (isset($_POST['model_3d_url'])) {
        update_post_meta($post_id, 'model_3d_url', esc_url_raw($_POST['model_3d_url']));
    }
    if (isset($_POST['model_usdz_url'])) {
        update_post_meta($post_id, 'model_usdz_url', esc_url_raw($_POST['model_usdz_url']));
    }
});

/*
 * === SETUP INSTRUCTIONS ===
 *
 * Option A — functions.php:
 *   Paste this code into your child theme's functions.php.
 *
 * Option B — Custom Plugin:
 *   1. Create a file: wp-content/plugins/wc-3d-viewer/wc-3d-viewer.php
 *   2. Add plugin header:
 *      <?php
 *      /**
 *       * Plugin Name: WooCommerce 3D Viewer
 *       * Description: Adds 3D product viewer with AR support.
 *       * Version: 1.0.0
 *       * /
 *   3. Paste this code below the header.
 *   4. Activate in Plugins > Installed Plugins.
 *
 * Adding 3D Models to Products:
 *   1. Edit a product in WooCommerce.
 *   2. In the General tab, find "3D Model URL (.glb)" and "3D Model URL (.usdz)".
 *   3. Enter the URLs to your 3D model files.
 *   4. Save the product.
 */`;
}

// ---------------------------------------------------------------------------
// Enhanced Shopify snippet (Liquid 2.0 / Online Store 2.0)
// ---------------------------------------------------------------------------

export function generateShopifySnippetV2(
  product: ProductInput,
  config: ViewerConfig & { sectionId?: string; sectionSchema?: boolean } = {},
): string {
  const sectionId = config.sectionId || "product-3d-viewer";

  return `{% comment %}
  3D Product Viewer — Shopify Online Store 2.0 Section
  File: sections/product-3d-viewer.liquid
  Compatible with Dawn, Sense, Craft and all OS 2.0 themes.
  Supports: App blocks, theme editor settings, metafield references.
{% endcomment %}

{% liquid
  assign model_url = product.metafields.custom.model_3d_url.value | default: section.settings.default_model_url
  assign usdz_url = product.metafields.custom.model_usdz_url.value | default: section.settings.default_usdz_url
  assign viewer_height = section.settings.viewer_height | default: '500px'
  assign bg_color = section.settings.background_color | default: '#ffffff'
  assign show_ar = section.settings.show_ar_button
  assign auto_rotate = section.settings.auto_rotate
%}

{% if model_url != blank %}
  <script type="module" src="${MV_CDN}"></script>

  <div
    id="${sectionId}"
    class="product-3d-viewer"
    {{ block.shopify_attributes }}
    style="width: 100%; max-width: {{ section.settings.max_width | default: '600' }}px; margin: 0 auto;"
  >
    <model-viewer
      src="{{ model_url }}"
      {% if usdz_url != blank %}
        ios-src="{{ usdz_url }}"
      {% endif %}
      alt="{{ product.title | escape }} — 3D View"
      poster="{{ product.featured_image | image_url: width: 800 }}"
      loading="lazy"
      {% if auto_rotate %}auto-rotate{% endif %}
      camera-controls
      {% if show_ar %}
        ar
        ar-modes="webxr scene-viewer quick-look"
      {% endif %}
      shadow-intensity="{{ section.settings.shadow_intensity | default: '1' }}"
      style="width: 100%; height: {{ viewer_height }}; background-color: {{ bg_color }}; border-radius: {{ section.settings.border_radius | default: 12 }}px;"
    >
      {% if show_ar %}
        <button slot="ar-button" class="product-3d-viewer__ar-btn btn btn--primary">
          {{ section.settings.ar_button_text | default: 'View in your space' }}
        </button>
      {% endif %}

      <div class="product-3d-viewer__loading" slot="poster">
        <div class="product-3d-viewer__spinner"></div>
        <p>Loading 3D model...</p>
      </div>
    </model-viewer>
  </div>

  <style>
    .product-3d-viewer__ar-btn {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
      z-index: 2;
    }
    .product-3d-viewer__loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 12px;
      color: #6b7280;
      font-size: 14px;
    }
    .product-3d-viewer__spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e7eb;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>

{% else %}
  {% comment %} No 3D model — section hidden {% endcomment %}
{% endif %}

{% schema %}
{
  "name": "3D Product Viewer",
  "tag": "section",
  "class": "section-3d-viewer",
  "limit": 1,
  "settings": [
    {
      "type": "checkbox",
      "id": "show_ar_button",
      "label": "Show AR button",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "auto_rotate",
      "label": "Auto-rotate model",
      "default": true
    },
    {
      "type": "text",
      "id": "viewer_height",
      "label": "Viewer height",
      "default": "500px"
    },
    {
      "type": "range",
      "id": "max_width",
      "label": "Max width (px)",
      "min": 400,
      "max": 1200,
      "step": 50,
      "default": 600
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background color",
      "default": "#ffffff"
    },
    {
      "type": "range",
      "id": "shadow_intensity",
      "label": "Shadow intensity",
      "min": 0,
      "max": 2,
      "step": 0.1,
      "default": 1
    },
    {
      "type": "range",
      "id": "border_radius",
      "label": "Border radius (px)",
      "min": 0,
      "max": 24,
      "step": 2,
      "default": 12
    },
    {
      "type": "text",
      "id": "ar_button_text",
      "label": "AR button text",
      "default": "View in your space"
    },
    {
      "type": "url",
      "id": "default_model_url",
      "label": "Default model URL (.glb)"
    },
    {
      "type": "url",
      "id": "default_usdz_url",
      "label": "Default model URL (.usdz)"
    }
  ],
  "presets": [
    {
      "name": "3D Product Viewer",
      "category": "Product information"
    }
  ]
}
{% endschema %}`;
}

// ---------------------------------------------------------------------------
// Enhanced SEO structured data (3DModel + MediaObject + AR)
// ---------------------------------------------------------------------------

export function generateEnhancedSEO3DMetadata(
  product: ProductInput,
  options: {
    price?: number;
    currency?: string;
    availability?: "InStock" | "OutOfStock" | "PreOrder";
    brand?: string;
    sku?: string;
    gtin?: string;
    url?: string;
    usdzUrl?: string;
    thumbnailUrl?: string;
    aggregateRating?: { ratingValue: number; reviewCount: number };
    returnPolicy?: { days: number; type: "full" | "exchange" | "store-credit" };
    shippingFree?: boolean;
  } = {},
): string {
  const {
    price,
    currency = "USD",
    availability = "InStock",
    brand,
    sku,
    gtin,
    url,
    usdzUrl,
    thumbnailUrl,
    aggregateRating,
    returnPolicy,
    shippingFree,
  } = options;

  const modelUrl = product.modelUrl || `https://cdn.example.com/models/${slugify(product.name)}.glb`;

  const models: Array<Record<string, unknown>> = [
    {
      "@type": "3DModel",
      name: `${product.name} (GLB)`,
      encodingFormat: "model/gltf-binary",
      contentUrl: modelUrl,
      ...(thumbnailUrl && { thumbnailUrl }),
    },
  ];

  if (usdzUrl) {
    models.push({
      "@type": "3DModel",
      name: `${product.name} (USDZ)`,
      encodingFormat: "model/vnd.usdz+zip",
      contentUrl: usdzUrl,
      ...(thumbnailUrl && { thumbnailUrl }),
    });
  }

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} — interactive 3D view and AR experience`,
    ...(product.imageUrls?.length && { image: product.imageUrls }),
    ...(brand && { brand: { "@type": "Brand", name: brand } }),
    ...(sku && { sku }),
    ...(gtin && { gtin }),
    ...(url && { url }),
    subjectOf: models.length === 1 ? models[0] : models,
    additionalProperty: [
      { "@type": "PropertyValue", name: "3DViewerAvailable", value: "true" },
      { "@type": "PropertyValue", name: "ARAvailable", value: "true" },
      { "@type": "PropertyValue", name: "3DModelFormat", value: usdzUrl ? "GLB, USDZ" : "GLB" },
    ],
  };

  if (product.dimensions) {
    const d = product.dimensions;
    const unitMap: Record<string, string> = {
      cm: "CMT", m: "MTR", in: "INH", ft: "FOT", mm: "MMT",
    };
    schema.width = { "@type": "QuantitativeValue", value: d.width, unitCode: unitMap[d.unit] || d.unit };
    schema.height = { "@type": "QuantitativeValue", value: d.height, unitCode: unitMap[d.unit] || d.unit };
    schema.depth = { "@type": "QuantitativeValue", value: d.depth, unitCode: unitMap[d.unit] || d.unit };
  }

  if (price !== undefined) {
    const offer: Record<string, unknown> = {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
    };
    if (returnPolicy) {
      offer.hasMerchantReturnPolicy = {
        "@type": "MerchantReturnPolicy",
        merchantReturnDays: returnPolicy.days,
        returnPolicyCategory: `https://schema.org/MerchantReturnFiniteReturnWindow`,
        refundType: returnPolicy.type === "full" ? "https://schema.org/FullRefund" : "https://schema.org/ExchangeRefundType",
      };
    }
    if (shippingFree) {
      offer.shippingDetails = {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency },
      };
    }
    schema.offers = offer;
  }

  if (aggregateRating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount,
      bestRating: 5,
    };
  }

  return `<!-- Enhanced Schema.org Product + 3DModel + AR structured data -->
<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
