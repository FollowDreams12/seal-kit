export type SealShapeType = "circle" | "square" | "rectangle";
export type BorderStyle = "none" | "single" | "double";
export type InnerDivider = "none" | "horizontalLine";

export interface ShapeConfig {
  type: SealShapeType;
  border: BorderStyle;
  borderThickness: number;
  innerDivider?: InnerDivider;
  cornerRadius?: number;
  size: { width: number; height: number };
}

export type FieldInputType =
  | "text"
  | "textarea"
  | "select"
  | "date"
  | "color"
  | "radio"
  | "slider"
  | "image";

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldInputType;
  required?: boolean;
  defaultValue?: string | number | boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  options?: FieldOption[];
  accept?: string;
}

export type LayoutType =
  | "singleVertical"
  | "tripleHorizontal"
  | "grid2x3"
  | "grid2x2"
  | "centerImage"
  | "dateStamp"
  | "kakuin";

export type ReadingOrder = "rtl-ttb" | "ltr-ttb";

export interface LayoutConfig {
  type: LayoutType;
  direction: "horizontal" | "vertical";
  autoFit: boolean;
  textDirection?: "horizontal" | "vertical";
  grid?: {
    rows: number;
    cols: number;
    readingOrder: ReadingOrder;
  };
}

export interface FontOption {
  label: string;
  value: string;
}

export interface StyleConfig {
  defaultColor: string;
  availableColors: string[];
  fontOptions: FontOption[];
  defaultFont: string;
}

export interface EffectsConfig {
  inversion: boolean;
  bleed: boolean;
  bleedIntensity?: number;
  cornerRound: boolean;
}

export interface ModesConfig {
  inkStyle?: "shubun" | "hakubun";
  fontVariant?: string;
}

export type ExportFormat = "png" | "pdf" | "svg";

export interface ExportConfig {
  formats: ExportFormat[];
  transparent: boolean;
  freeResolution: number;
  premiumResolution: number;
  filenamePattern: string;
}

export interface ComplianceConfig {
  unixTimestampWatermark: boolean;
  watermarkOptional: boolean;
}

export interface SealTemplateConfig {
  id: string;
  shape: ShapeConfig;
  fields: FieldConfig[];
  layout: LayoutConfig;
  style: StyleConfig;
  effects: EffectsConfig;
  modes?: ModesConfig;
  export: ExportConfig;
  compliance: ComplianceConfig;
}

export interface SealFieldValues {
  [key: string]: string | number | boolean | null | File | undefined;
}

export interface SealExportOptions {
  format: ExportFormat;
  resolution?: number;
  transparent?: boolean;
  filename?: string;
}
