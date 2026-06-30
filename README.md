# react-seal-kit

Generate Japanese electronic seals (はんこ / 印鑑) with React. Built on Konva Canvas for high-quality PNG export.

> 👉 **Live demo**: [sealkit.app](https://sealkit.app) — 無料で電子印鑑を作成・ダウンロード

## Features

- 🎨 **4 seal types**: 認印 (mitomein), 日付印 (date stamp), 角印 (kakuin), 篆刻 (tenkoku)
- 🖼️ **High-res export**: PNG up to 2048px, transparent background
- 🔤 **Flexible fonts**: Google Fonts + custom local fonts — just call `registerFont()`
- 📐 **Easy API**: `<SealCanvas preset="mitome" text="佐藤" />`
- 🎯 **Preset-driven**: 4 ready-to-use presets with full customization

## Install

```bash
npm install react-seal-kit konva react-konva
```

> `konva` and `react-konva` are peer dependencies.

## Quick Start

```tsx
import { SealCanvas, registerFont } from "react-seal-kit";

// Optional: register custom fonts
registerFont({ family: "Noto Serif JP", google: true });

function App() {
  return (
    <SealCanvas
      preset="mitome"       // Seal type
      text="佐藤"             // Name / text content
      color="#C41E3A"        // Ink color (default: vermilion)
      fontFamily="Noto Serif JP"
      size={500}
    />
  );
}
```

## Export as PNG

```tsx
import { useRef } from "react";
import { SealCanvas, type SealCanvasRef } from "react-seal-kit";

function App() {
  const ref = useRef<SealCanvasRef>(null);

  const handleExport = async () => {
    const dataUrl = await ref.current?.exportPng({
      width: 1024,
      transparent: true,
    });
    // Download or process the dataUrl...
  };

  return <SealCanvas ref={ref} preset="mitome" text="佐藤" />;
}
```

## Presets

| Preset | Type | Shape | Description |
|--------|------|-------|-------------|
| `"mitome"` | 認印 | Circle | Daily use, surname only. E.g. `text="佐藤"` |
| `"date-stamp"` | 日付印 | Circle | Date + name stamp. Use `dateStamp` prop |
| `"kakuin"` | 角印 | Square (rounded) | Company seal. Auto-grid layout |
| `"tenkoku"` | 篆刻 | Square | Artistic seal with shubun (朱文) effect |

### Date Stamp

```tsx
<SealCanvas
  preset="date-stamp"
  dateStamp={{ year: "2026", month: "6", day: "30", topText: "承認", bottomText: "伊藤" }}
/>
```

### Array text (multi-row)

```tsx
<SealCanvas preset="tenkoku" text={["印", "公司", "之印"]} />
```

## API

### `<SealCanvas />`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `preset` | `"mitome" \| "date-stamp" \| "kakuin" \| "tenkoku"` | `"mitome"` | Preset template |
| `text` | `string \| string[]` | — | Seal text. String = vertical; Array = grid rows |
| `color` | `string` | `"#C41E3A"` | Ink color |
| `fontFamily` | `string` | `"Noto Serif JP"` | Font name (must be registered or a Google Font) |
| `size` | `number \| { width, height }` | `500` | Canvas render size in pixels |
| `borderThickness` | `number` | preset default | Border width |
| `shape` | `"circle" \| "square"` | preset default | Shape override |
| `border` | `"single" \| "double" \| "none"` | preset default | Border style |
| `invert` | `boolean` | preset default | Shubun (朱文) — white text on colored background |
| `bleed` | `boolean` | preset default | Ink bleed effect (にじみ) |
| `previewScale` | `number` | `1` | Display scale factor |
| `dateStamp` | `{ year, month, day, topText, bottomText }` | — | Date stamp fields |

### `SealCanvasRef`

```ts
interface SealCanvasRef {
  exportPng: (options?: {
    width?: number;      // default: 1024
    height?: number;     // default: same as width
    transparent?: boolean; // default: true
  }) => Promise<string>;  // returns dataURL
}
```

### Font Management

```ts
import { registerFont, loadFont } from "react-seal-kit";

// Google Fonts (built-in map includes 30+ Japanese fonts)
registerFont({ family: "Noto Serif JP", google: true });

// Local font file
registerFont({ family: "My Font", src: "/fonts/myfont.woff2", format: "woff2" });

// Remote CDN font
registerFont({ family: "Custom Font", src: "https://cdn.example.com/font.woff2" });

// Load font on demand (checks registered → Google Fonts → system)
await loadFont("Noto Serif JP");
```

## Japanese Font Support

The package includes a built-in Google Fonts map with 30+ Japanese fonts:

| Category | Fonts |
|----------|-------|
| Mincho (明朝体) | Noto Serif JP, Shippori Mincho, Zen Old Mincho, Hina Mincho, Sawarabi Mincho |
| Gothic (ゴシック) | Noto Sans JP, Zen Kaku Gothic New, M PLUS 1p, BIZ UDPGothic |
| Handwriting | Potta One, Klee One, Yusei Magic, Zen Kurenaido |
| Display | Dela Gothic One, DotGothic16, Kaisei Decol, RocknRoll One |
| Maru Gothic | Zen Maru Gothic, M PLUS Rounded 1c, Kiwi Maru, Kosugi Maru |

## Related

- **[sealkit.app](https://sealkit.app)** — Free online Japanese seal generator. 認印・日付印・角印・篆刻を無料作成。
- Built with [Konva](https://konvajs.org/) for HTML5 Canvas rendering

## License

MIT
