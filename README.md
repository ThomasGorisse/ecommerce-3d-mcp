# ecommerce-3d-mcp

[![npm version](https://img.shields.io/npm/v/ecommerce-3d-mcp)](https://www.npmjs.com/package/ecommerce-3d-mcp)
[![tests](https://img.shields.io/badge/tests-124%20passed-brightgreen)](#)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

> **Disclaimer:** Generated code, HTML embeds, and assets are provided "as is" without warranty. Review all generated content before deploying to production stores. This is not a substitute for professional web development review. See [TERMS.md](./TERMS.md) and [PRIVACY.md](./PRIVACY.md).

MCP server for e-commerce 3D product visualization. Generate model-viewer embeds, AR try-on experiences, interactive product configurators, Shopify integrations, and SEO metadata — all from an AI assistant.

## Quick Start

```bash
npx ecommerce-3d-mcp
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ecommerce-3d": {
      "command": "npx",
      "args": ["-y", "ecommerce-3d-mcp"]
    }
  }
}
```

## Tools

| Tool | Tier | Description |
|------|------|-------------|
| `generate_product_3d` | Free | `<model-viewer>` 3D embed with AR support |
| `generate_turntable` | Free | 360° turntable animation embed |
| `shopify_snippet` | Free | Shopify Liquid snippet with metafield setup |
| `seo_3d_metadata` | Free | Schema.org JSON-LD for 3D products |
| `create_ar_tryout` | Growth | AR try-on (furniture, clothing, accessories) |
| `product_configurator` | Growth | Interactive 3D configurator (colors, materials, sizes) |
| `optimize_3d_asset` | Growth | Optimization report + CLI pipeline |

## Usage Examples

### 3D Product Viewer

> "Create a 3D viewer for my Oak Dining Table product. The model is at https://cdn.mystore.com/models/table.glb"

Returns ready-to-paste HTML with `<model-viewer>`, AR button, camera controls, and responsive sizing.

### Shopify Integration

> "Generate a Shopify snippet to add 3D viewing to my product pages"

Returns a Liquid template (`snippets/product-3d-viewer.liquid`) with:
- Metafield-driven model loading
- AR Quick Look (iOS) + Scene Viewer (Android)
- Dawn theme integration instructions
- Fallback to standard product image

### AR Try-On

> "Create an AR try-on experience for my velvet armchair"

Returns an embed with:
- WebXR, Scene Viewer, and Quick Look AR modes
- Category-aware placement (floor for furniture, body for clothing)
- Styled CTA button
- iOS and Android deep links

### Product Configurator

> "Build a configurator for my sneaker with color and size options"

Returns a self-contained HTML widget with:
- 3D model viewer
- Color swatches and dropdown selectors
- Dynamic price updates
- Styled options panel

### SEO Metadata

> "Generate structured data for my Bluetooth speaker at $49.99"

Returns `<script type="application/ld+json">` with Product, 3DModel, and Offer schemas.

## Pricing

| Tier | Renders/month | Price | Features |
|------|--------------|-------|----------|
| **Free** | 25 | $0 | Model viewer, turntable, SEO, Shopify snippets |
| **Growth** | 500 | $29/mo | + AR try-on, configurator, asset optimization |
| **Enterprise** | Unlimited | $99/mo | + custom branding, white-label, SLA |

Pass your API key via the `apiKey` parameter on any tool call.

## Shopify Integration Guide

### Step 1: Upload 3D Models

Upload `.glb` and `.usdz` files to **Shopify Admin > Settings > Files**, or host on a CDN.

### Step 2: Add Metafields

In **Shopify Admin > Settings > Metafields > Products**, create:

| Name | Type | Namespace/Key |
|------|------|---------------|
| 3D Model URL | URL | `custom.model_3d_url` |
| USDZ Model URL | URL | `custom.model_usdz_url` |

### Step 3: Generate Snippet

Use the `shopify_snippet` tool to get a Liquid template, then save it as `snippets/product-3d-viewer.liquid` in your theme.

### Step 4: Include in Product Template

Add to your product template (e.g., `sections/main-product.liquid`):

```liquid
{% render 'product-3d-viewer', product: product %}
```

### Step 5: Add Model URLs to Products

Edit each product and fill in the `model_3d_url` metafield with the CDN URL of your `.glb` file.

## 3D Model Sources

- **Shopify**: Upload directly via Admin > Files
- **Sketchfab**: Download or embed models
- **CGTrader / TurboSquid**: Purchase production-ready models
- **Polycam / Luma AI**: Scan real products with your phone
- **Blender**: Create and export as `.glb`

## Development

```bash
git clone https://github.com/sceneview/ecommerce-3d-mcp
cd ecommerce-3d-mcp
npm install
npm run build
npm test
```

## Legal

- [LICENSE](./LICENSE) — MIT License
- [TERMS.md](./TERMS.md) — Terms of Service
- [PRIVACY.md](./PRIVACY.md) — Privacy Policy (no data collected)

## License

MIT — see [LICENSE](./LICENSE).
