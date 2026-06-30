"use client";

import React, { useMemo, forwardRef, useImperativeHandle, useRef } from "react";
import type { ReactElement } from "react";
import { Stage, Layer, Circle, Rect, Text, Group, Line } from "react-konva";
import Konva from "konva";
import type { SealTemplateConfig, SealFieldValues } from "./types";

interface SealRendererProps {
  config: SealTemplateConfig;
  values: SealFieldValues;
  previewScale?: number;
  textDirection?: "horizontal" | "vertical";
  singleFieldAutoGrid?: boolean;
}

export interface SealRendererRef {
  exportAsDataURL: (options?: {
    width?: number;
    height?: number;
    mimeType?: string;
    transparent?: boolean;
  }) => Promise<string>;
}

const SealRenderer = forwardRef<SealRendererRef, SealRendererProps>(
  (
    { config, values, previewScale = 1, textDirection, singleFieldAutoGrid },
    ref
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stageRef = useRef<any>(null);

    // Force Konva to redraw when fonts finish loading.
    React.useEffect(() => {
      const redraw = () => {
        const stage = stageRef.current?.getStage?.();
        if (!stage) return;
        stage.find?.("Text")?.forEach((textNode: any) => {
          const ff = textNode.fontFamily();
          textNode.fontFamily("__force_redraw__");
          textNode.fontFamily(ff);
        });
        requestAnimationFrame(() => {
          stage.batchDraw?.();
        });
      };
      if (document.fonts.status === "loaded") {
        redraw();
      }
      document.fonts.addEventListener("loadingdone", redraw);
      return () => {
        document.fonts.removeEventListener("loadingdone", redraw);
      };
    }, []);

    const effectiveWidth = config.shape.size.width;
    const effectiveHeight = config.shape.size.height;

    const effectiveColor = useMemo(() => {
      return config.effects.inversion ? "#FFFFFF" : config.style.defaultColor;
    }, [config.effects.inversion, config.style.defaultColor]);

    const effectiveBgColor = useMemo(() => {
      return config.effects.inversion ? config.style.defaultColor : "#FFFFFF";
    }, [config.effects.inversion, config.style.defaultColor]);

    const padding = config.shape.borderThickness * 2;
    const innerWidth = effectiveWidth - padding * 2;
    const innerHeight = effectiveHeight - padding * 2;

    const innerElements = useMemo(() => {
      const elements: Array<{ type: string; props: Record<string, unknown> }> = [];

      // 角印：单输入框 → 自动找最优矩形网格 + 补"印"/"之印"
      if (singleFieldAutoGrid && config.fields.length === 1) {
        const field = config.fields[0];
        const rawText = String(values[field.name] ?? field.defaultValue ?? "");
        const textChars = [...rawText];
        const n = textChars.length;
        const isHorizontal = textDirection === "horizontal";

        let bestRows = 0, bestCols = 0, bestEmpty = Infinity, bestAspect = Infinity;
        const maxDim = Math.ceil(Math.sqrt(n)) + 2;
        for (let r = 2; r <= maxDim; r++) {
          for (let c = 2; c <= maxDim; c++) {
            const total = r * c;
            if (total < n) continue;
            const empty = total - n;
            const aspect = Math.abs(r - c);
            if (empty < bestEmpty || (empty === bestEmpty && aspect < bestAspect)) {
              bestEmpty = empty; bestAspect = aspect; bestRows = r; bestCols = c;
            }
          }
        }

        let allChars = [...textChars];
        if (bestEmpty === 1) allChars.push("印");
        else if (bestEmpty === 2) allChars.push("之", "印");

        const total = allChars.length;
        const cellW = innerWidth / bestCols;
        const cellH = innerHeight / bestRows;
        const cellSize = Math.min(cellW, cellH);
        const fontSize = cellSize * 0.82;

        for (let i = 0; i < total; i++) {
          let row: number, col: number;
          if (isHorizontal) {
            row = Math.floor(i / bestCols);
            col = i % bestCols;
          } else {
            col = bestCols - 1 - Math.floor(i / bestRows);
            row = i % bestRows;
          }
          const offsetX = ((innerWidth - cellSize * bestCols) / 2) || 0;
          const offsetY = ((innerHeight - cellSize * bestRows) / 2) || 0;
          elements.push({
            type: "text",
            props: {
              text: allChars[i],
              fontSize,
              fontFamily: config.style.defaultFont,
              fill: effectiveColor,
              align: "center",
              verticalAlign: "middle",
              width: cellSize,
              height: cellSize,
              x: padding + offsetX + col * cellSize,
              y: padding + offsetY + row * cellSize,
            },
          });
        }
      } else {
        switch (config.layout.type) {
          case "singleVertical": {
            const nameField = config.fields[0];
            const maxLen = nameField?.maxLength;
            const nameValue = String(values.name ?? nameField?.defaultValue ?? "");
            const truncated = maxLen ? nameValue.slice(0, maxLen) : nameValue;
            const chars = [...truncated];
            const numChars = chars.length || 1;
            const charHeight = innerHeight / numChars;
            const fontSize = charHeight;

            chars.forEach((char, i) => {
              elements.push({
                type: "text",
                props: {
                  text: char,
                  fontSize,
                  fontFamily: config.style.defaultFont,
                  fill: effectiveColor,
                  align: "center",
                  verticalAlign: "middle",
                  width: innerWidth,
                  height: charHeight,
                  x: padding,
                  y: padding + i * charHeight,
                },
              });
            });
            break;
          }

          case "tripleHorizontal": {
            const field0 = config.fields[0];
            const field1 = config.fields[1];
            const field2 = config.fields[2];
            const yearVal = String(values.year ?? field0?.defaultValue ?? "").slice(0, field0?.maxLength);
            const monthVal = String(values.month ?? field1?.defaultValue ?? "").slice(0, field1?.maxLength);
            const dayVal = String(values.day ?? field2?.defaultValue ?? "").slice(0, field2?.maxLength);
            const itemWidth = innerWidth / 3;
            const fontSize = itemWidth * 0.4;

            [yearVal, monthVal, dayVal].forEach((val, i) => {
              elements.push({
                type: "text",
                props: {
                  text: val,
                  fontSize,
                  fontFamily: config.style.defaultFont,
                  fill: effectiveColor,
                  align: "center",
                  verticalAlign: "middle",
                  width: itemWidth,
                  height: innerHeight,
                  x: padding + i * itemWidth,
                  y: padding,
                },
              });
            });
            break;
          }

          case "grid2x3":
          case "grid2x2": {
            if (textDirection) {
              const isH = textDirection === "horizontal";
              const fields = config.fields || [];
              if (isH) {
                const rowHeight = innerHeight / fields.length;
                const fSize = Math.min(innerWidth, rowHeight) * 0.35;
                fields.forEach((field, idx) => {
                  const rawValue = String(values[field.name] ?? field.defaultValue ?? "");
                  const textValue = field.maxLength ? rawValue.slice(0, field.maxLength) : rawValue;
                  elements.push({ type: "text", props: { text: textValue, fontSize: fSize, fontFamily: config.style.defaultFont, fill: effectiveColor, align: "center", verticalAlign: "middle", width: innerWidth, height: rowHeight, x: padding, y: padding + idx * rowHeight } });
                });
              } else {
                const numCols = fields.length;
                const colW = innerWidth / numCols;
                fields.forEach((field, fieldIdx) => {
                  const rawValue = String(values[field.name] ?? field.defaultValue ?? "");
                  const textValue = field.maxLength ? rawValue.slice(0, field.maxLength) : rawValue;
                  const chars = [...textValue];
                  const numChars = chars.length || 1;
                  const charH = innerHeight / numChars;
                  const fSize = Math.min(colW, charH) * 0.75;
                  const colIdx = numCols - 1 - fieldIdx;
                  const colX = padding + colIdx * colW;
                  chars.forEach((char, charIdx) => {
                    elements.push({ type: "text", props: { text: char, fontSize: fSize, fontFamily: config.style.defaultFont, fill: effectiveColor, align: "center", verticalAlign: "middle", width: colW, height: charH, x: colX, y: padding + charIdx * charH } });
                  });
                });
              }
              break;
            }

            const rows = config.layout.grid?.rows ?? 2;
            const cols = config.layout.grid?.cols ?? 2;
            const cellWidth = innerWidth / cols;
            const cellHeight = innerHeight / rows;
            const fontSize = Math.min(cellWidth, cellHeight) * 0.35;

            config.fields.forEach((field, index) => {
              const row = Math.floor(index / cols);
              const col = index % cols;
              const cellX = padding + col * cellWidth;
              const cellY = padding + row * cellHeight;
              const rawValue = String(values[field.name] ?? field.defaultValue ?? "");
              const textValue = field.maxLength ? rawValue.slice(0, field.maxLength) : rawValue;

              elements.push({
                type: "text",
                props: {
                  text: textValue,
                  fontSize,
                  fontFamily: config.style.defaultFont,
                  fill: effectiveColor,
                  align: "center",
                  verticalAlign: "middle",
                  width: cellWidth,
                  height: cellHeight,
                  x: cellX,
                  y: cellY,
                },
              });
            });
            break;
          }

          case "dateStamp": {
            const topField = config.fields.find((f) => f.name === "topText");
            const bottomField = config.fields.find((f) => f.name === "bottomText");
            const yearField = config.fields.find((f) => f.name === "year");
            const monthField = config.fields.find((f) => f.name === "month");
            const dayField = config.fields.find((f) => f.name === "day");

            const topValue = String(values.topText ?? topField?.defaultValue ?? "").slice(0, topField?.maxLength ?? 8);
            const bottomValue = String(values.bottomText ?? bottomField?.defaultValue ?? "").slice(0, bottomField?.maxLength ?? 8);
            const yearVal = String(values.year ?? yearField?.defaultValue ?? "");
            const monthVal = String(values.month ?? monthField?.defaultValue ?? "");
            const dayVal = String(values.day ?? dayField?.defaultValue ?? "");

            const dateText = `${yearVal}.${monthVal}.${dayVal}`;
            const sectionHeight = innerHeight / 3;
            const lineX1 = padding;
            const lineX2 = padding + innerWidth;

            elements.push({
              type: "text",
              props: { text: topValue, fontSize: sectionHeight * 0.5, fontFamily: config.style.defaultFont, fill: effectiveColor, align: "center", verticalAlign: "middle", width: innerWidth, height: sectionHeight, x: padding, y: padding },
            });
            elements.push({
              type: "line",
              props: { points: [lineX1, padding + sectionHeight, lineX2, padding + sectionHeight], stroke: effectiveColor, strokeWidth: 5 },
            });
            elements.push({
              type: "text",
              props: { text: dateText, fontSize: sectionHeight * 0.42, fontFamily: config.style.defaultFont, fill: effectiveColor, align: "center", verticalAlign: "middle", width: innerWidth, height: sectionHeight, x: padding, y: padding + sectionHeight },
            });
            elements.push({
              type: "line",
              props: { points: [lineX1, padding + sectionHeight * 2, lineX2, padding + sectionHeight * 2], stroke: effectiveColor, strokeWidth: 5 },
            });
            elements.push({
              type: "text",
              props: { text: bottomValue, fontSize: sectionHeight * 0.5, fontFamily: config.style.defaultFont, fill: effectiveColor, align: "center", verticalAlign: "middle", width: innerWidth, height: sectionHeight, x: padding, y: padding + sectionHeight * 2 },
            });
            break;
          }
        }
      }

      return elements;
    }, [config, values, innerWidth, innerHeight, effectiveColor, padding, textDirection, singleFieldAutoGrid]);

    const timestampWatermark = useMemo(() => {
      if (config.compliance.unixTimestampWatermark && !config.compliance.watermarkOptional) {
        return Math.floor(Date.now() / 1000).toString();
      }
      return null;
    }, [config.compliance]);

    const cornerRadius = config.shape.type === "circle" ? effectiveWidth : (config.shape.cornerRadius ?? 0);

    // Expose export method
    useImperativeHandle(ref, () => ({
      exportAsDataURL: async (options = {}) => {
        const targetWidth = options.width || 1024;
        const targetHeight = options.height || 1024;
        const scaleX = targetWidth / effectiveWidth;
        const scaleY = targetHeight / effectiveHeight;
        const scale = Math.min(scaleX, scaleY);

        const container = document.createElement("div");
        container.style.cssText = "position: absolute; left: -9999px; top: -9999px; visibility: hidden; pointer-events: none;";
        document.body.appendChild(container);

        try {
          const exportStage = new Konva.Stage({ container: container, width: targetWidth, height: targetHeight });
          const layer = new Konva.Layer();
          exportStage.add(layer);
          layer.scale({ x: scale, y: scale });

          const offsetX = (targetWidth / scale - effectiveWidth) / 2;
          const offsetY = (targetHeight / scale - effectiveHeight) / 2;
          layer.position({ x: offsetX, y: offsetY });

          if (!options.transparent) {
            layer.add(new Konva.Rect({ x: 0, y: 0, width: effectiveWidth, height: effectiveHeight, fill: effectiveBgColor, cornerRadius: cornerRadius }));
          }

          const thickness = config.shape.borderThickness;
          const halfThickness = thickness / 2;

          if (config.shape.type === "circle") {
            const centerX = effectiveWidth / 2;
            const centerY = effectiveHeight / 2;
            if (config.shape.border === "single" || config.shape.border === "double") {
              layer.add(new Konva.Circle({ x: centerX, y: centerY, radius: Math.min(effectiveWidth, effectiveHeight) / 2 - halfThickness, stroke: effectiveColor, strokeWidth: thickness, fill: "transparent" }));
            }
            if (config.shape.border === "double") {
              const innerRadius = Math.min(effectiveWidth, effectiveHeight) / 2 - halfThickness - thickness - 2;
              layer.add(new Konva.Circle({ x: centerX, y: centerY, radius: innerRadius, stroke: effectiveColor, strokeWidth: thickness, fill: "transparent" }));
            }
          } else {
            const radius = config.shape.cornerRadius ?? 0;
            if (config.shape.border === "single" || config.shape.border === "double") {
              layer.add(new Konva.Rect({ x: halfThickness, y: halfThickness, width: effectiveWidth - thickness, height: effectiveHeight - thickness, stroke: effectiveColor, strokeWidth: thickness, fill: "transparent", cornerRadius: radius }));
            }
            if (config.shape.border === "double") {
              layer.add(new Konva.Rect({ x: halfThickness + thickness + 2, y: halfThickness + thickness + 2, width: effectiveWidth - thickness * 2 - 4, height: effectiveHeight - thickness * 2 - 4, stroke: effectiveColor, strokeWidth: thickness, fill: "transparent", cornerRadius: radius > 0 ? radius - 2 : 0 }));
            }
            if (config.shape.innerDivider === "horizontalLine" && config.layout.type === "grid2x2") {
              const lineY1 = padding + innerHeight / 3;
              const lineY2 = padding + (innerHeight * 2) / 3;
              const lineX1 = padding + 8;
              const lineX2 = effectiveWidth - padding - 8;
              layer.add(new Konva.Line({ points: [lineX1, lineY1, lineX2, lineY1], stroke: effectiveColor, strokeWidth: 2 }));
              layer.add(new Konva.Line({ points: [lineX1, lineY2, lineX2, lineY2], stroke: effectiveColor, strokeWidth: 2 }));
            }
          }

          innerElements.forEach((el) => {
            if (el.type === "text") {
              layer.add(new Konva.Text(el.props as any));
            } else if (el.type === "line") {
              layer.add(new Konva.Line(el.props as any));
            }
          });

          if (timestampWatermark) {
            layer.add(new Konva.Text({ text: timestampWatermark, fontSize: 10, fontFamily: "monospace", fill: effectiveColor, opacity: 0.3, x: effectiveWidth - 50, y: effectiveHeight - 16 }));
          }

          layer.draw();
          const dataUrl = exportStage.toDataURL({ mimeType: options.mimeType || "image/png" });
          exportStage.destroy();
          container.remove();
          return dataUrl;
        } catch (error) {
          container.remove();
          throw error;
        }
      },
    }));

    const renderBorder = () => {
      const thickness = config.shape.borderThickness;
      const halfThickness = thickness / 2;
      const elements: ReactElement[] = [];

      if (config.shape.type === "circle") {
        const centerX = effectiveWidth / 2;
        const centerY = effectiveHeight / 2;
        if (config.shape.border === "single" || config.shape.border === "double") {
          elements.push(<Circle key="outer-circle" x={centerX} y={centerY} radius={Math.min(effectiveWidth, effectiveHeight) / 2 - halfThickness} stroke={effectiveColor} strokeWidth={thickness} fill="transparent" />);
        }
        if (config.shape.border === "double") {
          const innerRadius = Math.min(effectiveWidth, effectiveHeight) / 2 - halfThickness - thickness - 2;
          elements.push(<Circle key="inner-circle" x={centerX} y={centerY} radius={innerRadius} stroke={effectiveColor} strokeWidth={thickness} fill="transparent" />);
        }
      }

      if (config.shape.type === "square" || config.shape.type === "rectangle") {
        const radius = config.shape.cornerRadius ?? 0;
        if (config.shape.border === "single" || config.shape.border === "double") {
          elements.push(<Rect key="outer-rect" x={halfThickness} y={halfThickness} width={effectiveWidth - thickness} height={effectiveHeight - thickness} stroke={effectiveColor} strokeWidth={thickness} fill="transparent" cornerRadius={radius} />);
        }
        if (config.shape.border === "double") {
          elements.push(<Rect key="inner-rect" x={halfThickness + thickness + 2} y={halfThickness + thickness + 2} width={effectiveWidth - thickness * 2 - 4} height={effectiveHeight - thickness * 2 - 4} stroke={effectiveColor} strokeWidth={thickness} fill="transparent" cornerRadius={radius > 0 ? radius - 2 : 0} />);
        }
        if (config.shape.innerDivider === "horizontalLine" && config.layout.type === "grid2x2") {
          const lineY1 = padding + innerHeight / 3;
          const lineY2 = padding + (innerHeight * 2) / 3;
          const lineX1 = padding + 8;
          const lineX2 = effectiveWidth - padding - 8;
          elements.push(<Line key="divider1" points={[lineX1, lineY1, lineX2, lineY1]} stroke={effectiveColor} strokeWidth={2} />, <Line key="divider2" points={[lineX1, lineY2, lineX2, lineY2]} stroke={effectiveColor} strokeWidth={2} />);
        }
      }

      return elements;
    };

    return (
      <Stage
        ref={stageRef}
        width={effectiveWidth * previewScale}
        height={effectiveHeight * previewScale}
        style={{ width: effectiveWidth * previewScale, height: effectiveHeight * previewScale }}
        scaleX={previewScale}
        scaleY={previewScale}
      >
        <Layer>
          <Group>
            <Rect x={0} y={0} width={effectiveWidth} height={effectiveHeight} fill={effectiveBgColor} cornerRadius={cornerRadius} />
            {renderBorder()}
            {innerElements.map((el, index) => {
              if (el.type === "text") return <Text key={`text-${index}`} {...el.props} />;
              if (el.type === "line") return <Line key={`line-${index}`} {...el.props} />;
              return null;
            })}
            {timestampWatermark && (
              <Text text={timestampWatermark} fontSize={10} fontFamily="monospace" fill={effectiveColor} opacity={0.3} x={effectiveWidth - 50} y={effectiveHeight - 16} />
            )}
          </Group>
        </Layer>
      </Stage>
    );
  }
);

SealRenderer.displayName = "SealRenderer";

export default SealRenderer;
