"use client";

import React, { useMemo, useRef, forwardRef, useImperativeHandle, useEffect, useState } from "react";
import SealRenderer from "./renderer";
import type { SealRendererRef } from "./renderer";
import { loadFont } from "./fonts";
import { allPresets, type PresetName } from "./presets";
import type { SealTemplateConfig, SealFieldValues } from "./types";

export interface SealCanvasProps {
  /** 预设模板，提供全部默认值 */
  preset?: PresetName;
  /** 印章文字。单字符串按字符竖向排列；数组元素按行排列 */
  text?: string | string[];
  /** 印章颜色 */
  color?: string;
  /** 字体名称，需要已通过 registerFont() 注册，或在 GOOGLE_FONT_MAP 中 */
  fontFamily?: string;
  /** 印章尺寸，number 表示正方形边长 */
  size?: number | { width: number; height: number };
  /** 边框粗细 */
  borderThickness?: number;
  /** 形状 */
  shape?: "circle" | "square";
  /** 边框样式 */
  border?: "single" | "double" | "none";
  /** 方印圆角半径 */
  cornerRadius?: number;
  /** 朱文——反色效果（白字彩色底） */
  invert?: boolean;
  /** 渗墨效果 */
  bleed?: boolean;
  /** 文字方向 */
  textDirection?: "horizontal" | "vertical";
  /** 单字段自动计算网格（用于角印类印章） */
  singleFieldAutoGrid?: boolean;
  /** 预览缩放比例 */
  previewScale?: number;
  /** 日期印章专用 */
  dateStamp?: {
    year?: string | number;
    month?: string | number;
    day?: string | number;
    topText?: string;
    bottomText?: string;
  };
}

export interface SealCanvasRef {
  /**
   * 导出 PNG 格式的 dataURL
   * @param options.width - 导出宽度（默认 1024）
   * @param options.height - 导出高度（默认同 width）
   * @param options.transparent - 是否透明背景（默认 true）
   */
  exportPng: (options?: { width?: number; height?: number; transparent?: boolean }) => Promise<string>;
}

/**
 * 印章 Canvas 组件。
 * - 预设驱动：传入 `preset` + `text` 即可生成印章
 * - 所有参数可单独覆盖，未传则使用预设默认值
 * - 字体通过 `registerFont()` 注册后直接传 `fontFamily` 即可
 *
 * @example
 * ```tsx
 * <SealCanvas preset="mitome" text="佐藤" color="#000" />
 * ```
 */
const SealCanvas = forwardRef<SealCanvasRef, SealCanvasProps>(
  (props, ref) => {
    const {
      preset: presetName = "mitome",
      text,
      color,
      fontFamily,
      size: sizeProp,
      borderThickness,
      shape: shapeProp,
      border: borderProp,
      cornerRadius,
      invert,
      bleed,
      textDirection,
      singleFieldAutoGrid,
      previewScale = 1,
      dateStamp,
    } = props;

    const rendererRef = useRef<SealRendererRef>(null);
    const [fontReady, setFontReady] = useState(false);

    // Resolve size
    const size = useMemo(() => {
      if (sizeProp === undefined) return undefined;
      if (typeof sizeProp === "number") return { width: sizeProp, height: sizeProp };
      return sizeProp;
    }, [sizeProp]);

    // Build merged config from preset + overrides
    const config: SealTemplateConfig = useMemo(() => {
      const base = allPresets[presetName] || allPresets.mitome;
      const merged: SealTemplateConfig = JSON.parse(JSON.stringify(base));

      if (color) {
        merged.style.defaultColor = color;
      }
      if (fontFamily) {
        merged.style.defaultFont = fontFamily;
      }
      if (size) {
        merged.shape.size = size;
      }
      if (borderThickness !== undefined) {
        merged.shape.borderThickness = borderThickness;
      }
      if (shapeProp) {
        merged.shape.type = shapeProp;
      }
      if (borderProp) {
        merged.shape.border = borderProp;
      }
      if (cornerRadius !== undefined) {
        merged.shape.cornerRadius = cornerRadius;
      }
      if (invert !== undefined) {
        merged.effects.inversion = invert;
      }
      if (bleed !== undefined) {
        merged.effects.bleed = bleed;
      }

      return merged;
    }, [presetName, color, fontFamily, size, borderThickness, shapeProp, borderProp, cornerRadius, invert, bleed]);

    // Build values from text prop
    const values: SealFieldValues = useMemo(() => {
      const vals: SealFieldValues = {};

      if (presetName === "date-stamp" && dateStamp) {
        vals.year = String(dateStamp.year ?? "");
        vals.month = String(dateStamp.month ?? "");
        vals.day = String(dateStamp.day ?? "");
        vals.topText = dateStamp.topText ?? "";
        vals.bottomText = dateStamp.bottomText ?? "";
      } else if (text !== undefined) {
        if (Array.isArray(text)) {
          config.fields.forEach((field, i) => {
            vals[field.name] = text[i] ?? field.defaultValue ?? "";
          });
        } else {
          if (config.fields.length === 1) {
            vals[config.fields[0].name] = text;
          }
        }
      }

      // Fill any remaining fields with defaults
      config.fields.forEach((field) => {
        if (!(field.name in vals)) {
          vals[field.name] = field.defaultValue ?? "";
        }
      });

      return vals;
    }, [text, presetName, dateStamp, config.fields]);

    // Preload font
    useEffect(() => {
      let cancelled = false;
      const fFamily = config.style.defaultFont;
      loadFont(fFamily)
        .then(() => {
          if (!cancelled) setFontReady(true);
        })
        .catch(() => {
          // Font load failed, render anyway
          if (!cancelled) setFontReady(true);
        });
      return () => { cancelled = true; };
    }, [config.style.defaultFont]);

    // Expose export methods
    useImperativeHandle(ref, () => ({
      exportPng: async (options = {}) => {
        if (!rendererRef.current) {
          throw new Error("SealCanvas renderer not ready");
        }
        const width = options.width || 1024;
        return rendererRef.current.exportAsDataURL({
          width,
          height: options.height || width,
          transparent: options.transparent ?? true,
          mimeType: "image/png",
        });
      },
    }));

    if (!fontReady) {
      return (
        <div
          style={{
            width: config.shape.size.width * previewScale,
            height: config.shape.size.height * previewScale,
            background: "#f0f0f0",
            borderRadius: config.shape.type === "circle" ? "50%" : "4px",
          }}
        />
      );
    }

    return (
      <SealRenderer
        ref={rendererRef}
        config={config}
        values={values}
        previewScale={previewScale}
        textDirection={textDirection}
        singleFieldAutoGrid={singleFieldAutoGrid}
      />
    );
  }
);

SealCanvas.displayName = "SealCanvas";

export default SealCanvas;
