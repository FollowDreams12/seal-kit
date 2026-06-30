import type { SealTemplateConfig } from "./types";
import { DEFAULT_FONT, GOOGLE_FONT_MAP } from "./fonts";

// Build font options from google fonts map
function buildFontOptions(): { label: string; value: string }[] {
  return Object.keys(GOOGLE_FONT_MAP).map((key) => ({
    label: key,
    value: key,
  }));
}

export const mitomePreset: SealTemplateConfig = {
  id: "mitome",
  shape: {
    type: "circle",
    border: "single",
    borderThickness: 15,
    size: { width: 500, height: 500 },
  },
  fields: [
    {
      name: "name",
      label: "名称",
      type: "text",
      defaultValue: "佐藤",
      maxLength: 4,
    },
  ],
  layout: {
    type: "singleVertical",
    direction: "vertical",
    autoFit: true,
  },
  style: {
    defaultColor: "#C41E3A",
    availableColors: ["#C41E3A", "#D3381C", "#8B0000", "#000000"],
    fontOptions: buildFontOptions(),
    defaultFont: DEFAULT_FONT,
  },
  effects: {
    inversion: false,
    bleed: false,
    cornerRound: false,
  },
  export: {
    formats: ["png"],
    transparent: true,
    freeResolution: 300,
    premiumResolution: 600,
    filenamePattern: "mitome_{timestamp}",
  },
  compliance: {
    unixTimestampWatermark: false,
    watermarkOptional: true,
  },
};

export const dateStampPreset: SealTemplateConfig = {
  id: "date-stamp",
  shape: {
    type: "circle",
    border: "single",
    borderThickness: 12,
    size: { width: 500, height: 500 },
  },
  fields: [
    {
      name: "year",
      label: "日付",
      type: "select",
      defaultValue: String(new Date().getFullYear()),
      options: Array.from({ length: 21 }, (_, i) => ({
        label: String(new Date().getFullYear() - 10 + i),
        value: String(new Date().getFullYear() - 10 + i),
      })),
    },
    {
      name: "month",
      label: "",
      type: "select",
      defaultValue: String(new Date().getMonth() + 1),
      options: Array.from({ length: 12 }, (_, i) => ({
        label: String(i + 1),
        value: String(i + 1),
      })),
    },
    {
      name: "day",
      label: "",
      type: "select",
      defaultValue: String(new Date().getDate()),
      options: Array.from({ length: 31 }, (_, i) => ({
        label: String(i + 1),
        value: String(i + 1),
      })),
    },
    {
      name: "topText",
      label: "部署",
      type: "text",
      defaultValue: "承認",
      maxLength: 8,
    },
    {
      name: "bottomText",
      label: "名前",
      type: "text",
      defaultValue: "伊藤",
      maxLength: 8,
    },
  ],
  layout: {
    type: "dateStamp",
    direction: "vertical",
    autoFit: true,
  },
  style: {
    defaultColor: "#C41E3A",
    availableColors: [
      "#C41E3A", "#D3381C", "#8B0000", "#000000",
      "#2E8B57", "#00008B",
    ],
    fontOptions: buildFontOptions(),
    defaultFont: DEFAULT_FONT,
  },
  effects: {
    inversion: false,
    bleed: false,
    cornerRound: false,
  },
  export: {
    formats: ["png"],
    transparent: true,
    freeResolution: 300,
    premiumResolution: 600,
    filenamePattern: "date_stamp_{timestamp}",
  },
  compliance: {
    unixTimestampWatermark: false,
    watermarkOptional: true,
  },
};

export const kakuinPreset: SealTemplateConfig = {
  id: "kakuin",
  shape: {
    type: "square",
    border: "single",
    borderThickness: 15,
    cornerRadius: 8,
    size: { width: 500, height: 500 },
  },
  fields: [
    {
      name: "text",
      label: "会社名",
      type: "text",
      defaultValue: "株式会社サンプル",
      maxLength: 12,
    },
  ],
  layout: {
    type: "grid2x3",
    direction: "vertical",
    autoFit: true,
    textDirection: "vertical",
  },
  style: {
    defaultColor: "#C41E3A",
    availableColors: ["#C41E3A", "#D3381C", "#8B0000", "#000000"],
    fontOptions: buildFontOptions(),
    defaultFont: DEFAULT_FONT,
  },
  effects: {
    inversion: false,
    bleed: false,
    cornerRound: true,
  },
  export: {
    formats: ["png"],
    transparent: true,
    freeResolution: 300,
    premiumResolution: 600,
    filenamePattern: "kakuin_{timestamp}",
  },
  compliance: {
    unixTimestampWatermark: true,
    watermarkOptional: false,
  },
};

export const tenkokuPreset: SealTemplateConfig = {
  id: "tenkoku",
  shape: {
    type: "square",
    border: "single",
    borderThickness: 15,
    innerDivider: "horizontalLine",
    cornerRadius: 4,
    size: { width: 500, height: 500 },
  },
  fields: [
    { name: "top", label: "上段", type: "text", defaultValue: "印", maxLength: 4 },
    { name: "middle", label: "中段", type: "text", defaultValue: "公司", maxLength: 4 },
    { name: "bottom", label: "下段", type: "text", defaultValue: "之印", maxLength: 4 },
  ],
  layout: {
    type: "grid2x2",
    direction: "vertical",
    autoFit: true,
    grid: { rows: 3, cols: 1, readingOrder: "ltr-ttb" },
  },
  modes: {
    inkStyle: "shubun",
    fontVariant: "seal-script",
  },
  style: {
    defaultColor: "#C41E3A",
    availableColors: ["#C41E3A", "#D3381C", "#8B0000", "#000000"],
    fontOptions: buildFontOptions(),
    defaultFont: DEFAULT_FONT,
  },
  effects: {
    inversion: true,
    bleed: true,
    bleedIntensity: 0.5,
    cornerRound: false,
  },
  export: {
    formats: ["png"],
    transparent: true,
    freeResolution: 300,
    premiumResolution: 600,
    filenamePattern: "tenkoku_{timestamp}",
  },
  compliance: {
    unixTimestampWatermark: true,
    watermarkOptional: true,
  },
};

export const allPresets: Record<string, SealTemplateConfig> = {
  mitome: mitomePreset,
  "date-stamp": dateStampPreset,
  kakuin: kakuinPreset,
  tenkoku: tenkokuPreset,
};

export type PresetName = keyof typeof allPresets;
