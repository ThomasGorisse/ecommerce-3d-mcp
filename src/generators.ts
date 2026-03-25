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
// Utility
// ---------------------------------------------------------------------------

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
