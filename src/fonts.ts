/**
 * Google Fonts 在线字体映射（显示名 → CSS font-family 名）
 * 通过 fonts.googleapis.com CDN 加载，无需下载字体文件
 */
export const GOOGLE_FONT_MAP: Record<string, string> = {
  // 正式印章向（明朝体 / 楷書体替代）
  "Noto Serif JP": "Noto Serif JP",
  "Shippori Mincho": "Shippori Mincho",
  "Zen Old Mincho": "Zen Old Mincho",
  "Hina Mincho": "Hina Mincho",
  "Sawarabi Mincho": "Sawarabi Mincho",
  // 日常认印向（ゴシック体）
  "Noto Sans JP": "Noto Sans JP",
  "Zen Kaku Gothic New": "Zen Kaku Gothic New",
  "M PLUS 1p": "M PLUS 1p",
  "BIZ UDPGothic": "BIZ UDPGothic",
  Kosugi: "Kosugi",
  // 毛笔/手写风
  "Potta One": "Potta One",
  "Klee One": "Klee One",
  "Yusei Magic": "Yusei Magic",
  "Zen Kurenaido": "Zen Kurenaido",
  "Mochiy Pop One": "Mochiy Pop One",
  // 个性/冲击力向
  "Dela Gothic One": "Dela Gothic One",
  DotGothic16: "DotGothic16",
  "Kaisei Decol": "Kaisei Decol",
  "RocknRoll One": "RocknRoll One",
  "Rampart One": "Rampart One",
  "Train One": "Train One",
  // 丸ゴシック / 其他
  "Zen Maru Gothic": "Zen Maru Gothic",
  "M PLUS Rounded 1c": "M PLUS Rounded 1c",
  "Kiwi Maru": "Kiwi Maru",
  "Kosugi Maru": "Kosugi Maru",
  "Sawarabi Gothic": "Sawarabi Gothic",
  "Kaisei Opti": "Kaisei Opti",
  "Hachi Maru Pop": "Hachi Maru Pop",
  Yomogi: "Yomogi",
  "IBM Plex Sans JP": "IBM Plex Sans JP",
  "Aoboshi One": "Aoboshi One",
};

/** 默认字体名称（所有预设共用） */
export const DEFAULT_FONT = "Noto Serif JP";

export interface FontRegistration {
  family: string;
  /** Local font file URL (e.g. "/fonts/myfont.woff2") */
  src?: string;
  /** Font format hint */
  format?: "woff2" | "woff" | "opentype" | "truetype";
  /** Use Google Fonts CDN (true = load from fonts.googleapis.com) */
  google?: boolean;
}

/** 已注册的本地/自定义字体 */
const registeredFonts = new Map<string, FontRegistration>();

/**
 * 注册字体信息。注册后，`loadFont(family)` 会自动识别并加载。
 *
 * @example
 * // 本地字体
 * registerFont({ family: "装甲明朝", src: "/fonts/soukou.woff2", format: "woff2" });
 *
 * // Google Fonts 快捷方式
 * registerFont({ family: "Noto Serif JP", google: true });
 *
 * // 任意在线字体
 * registerFont({ family: "MyFont", src: "https://cdn.example.com/myfont.woff2" });
 */
export function registerFont(reg: FontRegistration): void {
  registeredFonts.set(reg.family, reg);
}

/**
 * 从已注册信息或 Google Fonts 加载字体到浏览器。
 * 返回 Promise，字体 ready 后 resolve。
 */
export async function loadFont(fontName: string): Promise<void> {
  if (typeof document === "undefined") return;

  // ── 1. 检查已注册字体 ──
  const reg = registeredFonts.get(fontName);
  if (reg) {
    // Google Fonts 快捷方式
    if (reg.google) {
      return loadGoogleFont(fontName);
    }
    // 本地/在线字体文件
    if (reg.src) {
      return loadLocalFontFromSrc(fontName, reg.src, reg.format);
    }
    // 已注册但无 src，仅尝试系统字体
  }

  // ── 2. Google Fonts 映射 ──
  if (GOOGLE_FONT_MAP[fontName]) {
    return loadGoogleFont(fontName);
  }

  // ── 3. 系统字体 ──
  await loadSystemFont(fontName);
}

async function loadLocalFontFromSrc(
  fontName: string,
  src: string,
  formatHint?: string
): Promise<void> {
  const styleId = `seal-local-font-${fontName.replace(/\s+/g, "-")}`;
  if (document.getElementById(styleId)) {
    await document.fonts.load(`1em '${fontName}'`);
    return;
  }

  const ext = formatHint || src.split(".").pop() || "woff2";
  const format =
    ext === "woff2"
      ? "woff2"
      : ext === "woff"
        ? "woff"
        : ext === "otf"
          ? "opentype"
          : "truetype";

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    @font-face {
      font-family: '${fontName}';
      src: url('${src}') format('${format}');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
  await document.fonts.load(`1em '${fontName}'`);
}

async function loadGoogleFont(fontName: string): Promise<void> {
  const family = GOOGLE_FONT_MAP[fontName] || fontName;
  const encoded = family.replace(/\s+/g, "+");
  const href = `https://fonts.googleapis.com/css2?family=${encoded}&display=swap`;
  const linkId = `seal-font-${encoded}`;

  // Already loaded
  if (document.getElementById(linkId)) {
    await document.fonts.load(`1em '${GOOGLE_FONT_MAP[fontName] || fontName}'`);
    return;
  }

  // Check if an existing <link> already points to the same Google Fonts URL
  const existingLink = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"]')
  ).find((el) => (el as HTMLLinkElement).href === href);

  if (existingLink) {
    const currentRel = existingLink.getAttribute("rel");
    if (currentRel === "stylesheet") {
      await document.fonts.load(`1em '${GOOGLE_FONT_MAP[fontName] || fontName}'`);
      return;
    }
    // Preload → wait for stylesheet transition
    await new Promise<void>((resolve) => {
      const observer = new MutationObserver(() => {
        if (existingLink.getAttribute("rel") === "stylesheet") {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(existingLink, {
        attributes: true,
        attributeFilter: ["rel"],
      });
      // Fallback: poll document.fonts
      const poll = setInterval(() => {
        if (document.fonts.check(`1em '${GOOGLE_FONT_MAP[fontName] || fontName}'`)) {
          clearInterval(poll);
          observer.disconnect();
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(poll);
        observer.disconnect();
        resolve();
      }, 10000);
    });
    await document.fonts.load(`1em '${GOOGLE_FONT_MAP[fontName] || fontName}'`);
    return;
  }

  // Create new link
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => {
      document.fonts
        .load(`1em '${GOOGLE_FONT_MAP[fontName] || fontName}'`)
        .then(() => resolve())
        .catch(reject);
    };
    link.onerror = () => reject(new Error(`Failed to load font: ${fontName}`));
    document.head.appendChild(link);
  });
}

async function loadSystemFont(fontName: string): Promise<void> {
  if (document.fonts.check(`1em '${fontName}'`)) return;
  try {
    await document.fonts.load(`1em '${fontName}'`);
  } catch {
    // System font not available, skip
  }
}
