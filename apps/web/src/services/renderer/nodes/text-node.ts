import { BaseNode } from "./base-node";
import type { TextElement } from "@/timeline";
import type { EffectPass } from "@/effects/types";
import type { BlendMode, Transform } from "@/rendering";
import {
	buildTextFontString,
	drawMeasuredTextLayout,
	strokeMeasuredTextLayout,
	type TextAlign,
	type TextFontStyle,
	type TextFontWeight,
} from "@/text/primitives";
import { setCanvasLetterSpacing } from "@/text/layout";
import type { MeasuredTextElement } from "@/text/measure-element";
import type { ParamValue } from "@/params";
import { FONT_SIZE_SCALE_REFERENCE } from "@/text/typography";
import {
	RICH_TEXT_RUNS_PARAM,
	parseRichTextRunsParam,
	type RichTextRun,
	type RichTextRunStyle,
} from "@/text/rich-text";

export type TextNodeParams = TextElement & {
	transform: Transform;
	opacity: number;
	blendMode?: BlendMode;
	canvasCenter: { x: number; y: number };
	canvasHeight: number;
	textBaseline?: CanvasTextBaseline;
};

export interface ResolvedTextNodeState {
	transform: Transform;
	opacity: number;
	textColor: string;
	backgroundColor: string;
	effectPasses: EffectPass[][];
	measuredText: MeasuredTextElement;
}

export class TextNode extends BaseNode<TextNodeParams, ResolvedTextNodeState> {}

type TextRenderContext =
	| CanvasRenderingContext2D
	| OffscreenCanvasRenderingContext2D;

type RichLineSegment = {
	text: string;
	style: RichTextRunStyle;
};

function readNumberValue({
	value,
	fallback,
}: {
	value: ParamValue | undefined;
	fallback: number;
}) {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readStringValue({
	value,
	fallback,
}: {
	value: ParamValue | undefined;
	fallback: string;
}) {
	return typeof value === "string" ? value : fallback;
}

function readFontWeightValue({
	value,
	fallback,
}: {
	value: ParamValue | undefined;
	fallback: TextFontWeight;
}): TextFontWeight {
	return value === "bold" ? "bold" : fallback;
}

function readFontStyleValue({
	value,
	fallback,
}: {
	value: ParamValue | undefined;
	fallback: TextFontStyle;
}): TextFontStyle {
	return value === "italic" ? "italic" : fallback;
}

function readTextAlignValue({
	value,
	fallback,
}: {
	value: ParamValue | undefined;
	fallback: TextAlign;
}): TextAlign {
	return value === "left" || value === "right" || value === "center"
		? value
		: fallback;
}

export function renderTextToContext({
	node,
	ctx,
}: {
	node: TextNode;
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}): void {
	const resolved = node.resolved;
	if (!resolved) {
		return;
	}

	const x = resolved.transform.position.x + node.params.canvasCenter.x;
	const y = resolved.transform.position.y + node.params.canvasCenter.y;
	const baseline = node.params.textBaseline ?? "middle";

	ctx.save();
	ctx.translate(x, y);
	ctx.scale(resolved.transform.scaleX, resolved.transform.scaleY);
	if (resolved.transform.rotate) {
		ctx.rotate((resolved.transform.rotate * Math.PI) / 180);
	}

	const strokeWidth = readNumberValue({
		value: node.params.params["stroke.width"],
		fallback: 0,
	});
	const shadowBlur = readNumberValue({
		value: node.params.params["shadow.blur"],
		fallback: 0,
	});
	const shadowOffsetX = readNumberValue({
		value: node.params.params["shadow.offsetX"],
		fallback: 0,
	});
	const shadowOffsetY = readNumberValue({
		value: node.params.params["shadow.offsetY"],
		fallback: 0,
	});
	const unitScale = node.params.canvasHeight / FONT_SIZE_SCALE_REFERENCE;
	const hasRichTextRuns =
		typeof node.params.params[RICH_TEXT_RUNS_PARAM] === "string" &&
		Boolean((node.params.params[RICH_TEXT_RUNS_PARAM] as string).trim());

	if (!hasRichTextRuns && strokeWidth > 0) {
		strokeMeasuredTextLayout({
			ctx,
			layout: resolved.measuredText,
			strokeColor: readStringValue({
				value: node.params.params["stroke.color"],
				fallback: "#000000",
			}),
			strokeWidth: strokeWidth * unitScale,
			textBaseline: baseline,
		});
	}

	if (shadowBlur > 0 || shadowOffsetX !== 0 || shadowOffsetY !== 0) {
		ctx.shadowColor = readStringValue({
			value: node.params.params["shadow.color"],
			fallback: "rgba(0, 0, 0, 0.45)",
		});
		ctx.shadowBlur = shadowBlur * unitScale;
		ctx.shadowOffsetX = shadowOffsetX * unitScale;
		ctx.shadowOffsetY = shadowOffsetY * unitScale;
	}

	if (hasRichTextRuns) {
		renderRichTextRunsToContext({
			ctx,
			node,
			content: readStringValue({
				value: node.params.params.content,
				fallback: "",
			}),
			textColor: resolved.textColor,
			textBaseline: baseline,
			unitScale,
		});
		ctx.restore();
		return;
	}

	drawMeasuredTextLayout({
		ctx,
		layout: resolved.measuredText,
		textColor: resolved.textColor,
		background: resolved.measuredText.resolvedBackground,
		backgroundColor: resolved.backgroundColor,
		textBaseline: baseline,
	});

	ctx.restore();
}

function renderRichTextRunsToContext({
	ctx,
	node,
	content,
	textColor,
	textBaseline,
	unitScale,
}: {
	ctx: TextRenderContext;
	node: TextNode;
	content: string;
	textColor: string;
	textBaseline: CanvasTextBaseline;
	unitScale: number;
}): void {
	const resolved = node.resolved;
	if (!resolved) return;

	const parsedRuns = parseRichTextRunsParam({
		value: node.params.params[RICH_TEXT_RUNS_PARAM],
		content,
	});
	const lineHeightPx = resolved.measuredText.lineHeightPx;
	const baseFontSize = resolved.measuredText.fontSizeRatio * 15;
	const fallback = {
		fontFamily: readStringValue({
			value: node.params.params.fontFamily,
			fallback: "Arial",
		}),
		fontWeight: readFontWeightValue({
			value: node.params.params.fontWeight,
			fallback: "normal",
		}),
		fontStyle: readFontStyleValue({
			value: node.params.params.fontStyle,
			fallback: "normal",
		}),
		textAlign: readTextAlignValue({
			value: node.params.params.textAlign,
			fallback: "center",
		}),
		letterSpacing: readNumberValue({
			value: node.params.params.letterSpacing,
			fallback: resolved.measuredText.letterSpacing,
		}),
		outlineColor: readStringValue({
			value: node.params.params["stroke.color"],
			fallback: "#000000",
		}),
		outlineWidth: readNumberValue({
			value: node.params.params["stroke.width"],
			fallback: 0,
		}),
	};
	const runs = repairImplicitBaseStyleForHighlightedRuns({
		runs: parsedRuns,
		textColor,
		fallback,
	});
	const lines = splitRichTextRunsIntoLines({ runs });

	const measuredLines = lines.map((segments) =>
		measureRichLine({
			ctx,
			segments,
			canvasHeight: node.params.canvasHeight,
			baseFontSize,
			fallback,
		}),
	);
	const visualCenterOffset = ((lines.length - 1) * lineHeightPx) / 2;

	ctx.textAlign = "left";
	ctx.textBaseline = textBaseline;

	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		const lineY = lineIndex * lineHeightPx - visualCenterOffset;
		let cursorX = getRichLineStartX({
			width: measuredLines[lineIndex],
			textAlign: fallback.textAlign,
		});

		for (const segment of lines[lineIndex]) {
			const metrics = setupRichTextSegment({
				ctx,
				segment,
				canvasHeight: node.params.canvasHeight,
				baseFontSize,
				fallback,
			});
			const outlineWidth =
				segment.style.outlineWidth ?? fallback.outlineWidth ?? 0;
			const previousAlpha = ctx.globalAlpha;
			ctx.globalAlpha =
				previousAlpha * clampOpacity({ opacity: segment.style.opacity ?? 1 });

			if (outlineWidth > 0) {
				ctx.strokeStyle = segment.style.outlineColor ?? fallback.outlineColor;
				ctx.lineWidth = outlineWidth * unitScale;
				ctx.lineJoin = "round";
				ctx.lineCap = "round";
				ctx.strokeText(segment.text, cursorX, lineY);
			}

			ctx.fillStyle = segment.style.color ?? textColor;
			ctx.fillText(segment.text, cursorX, lineY);
			ctx.globalAlpha = previousAlpha;
			cursorX += metrics.width;
		}
	}
}

function splitRichTextRunsIntoLines({
	runs,
}: {
	runs: RichTextRun[];
}): RichLineSegment[][] {
	const lines: RichLineSegment[][] = [[]];

	for (const run of runs) {
		const parts = run.text.split("\n");
		for (let index = 0; index < parts.length; index++) {
			if (index > 0) {
				lines.push([]);
			}
			if (!parts[index]) continue;
			lines[lines.length - 1].push({
				text: parts[index],
				style: run.style,
			});
		}
	}

	return lines.length > 0 ? lines : [[]];
}

function repairImplicitBaseStyleForHighlightedRuns({
	runs,
	textColor,
	fallback,
}: {
	runs: RichTextRun[];
	textColor: string;
	fallback: {
		outlineColor: string;
		outlineWidth: number;
	};
}): RichTextRun[] {
	const highlightedColor = runs.find(
		(run) => run.isHighlight && run.style.color,
	)?.style.color;
	const hasImplicitBaseRun = runs.some(
		(run) => !run.isHighlight && !hasExplicitRichTextVisualStyle(run.style),
	);
	const shouldRepair =
		Boolean(highlightedColor) &&
		hasImplicitBaseRun &&
		normalizeColorForCompare({ color: highlightedColor }) ===
			normalizeColorForCompare({ color: textColor });

	if (!shouldRepair) {
		return runs;
	}

	return runs.map((run) => {
		if (run.isHighlight || hasExplicitRichTextVisualStyle(run.style)) {
			return run;
		}
		return {
			...run,
			style: {
				...run.style,
				color: "#ffffff",
				outlineColor: fallback.outlineColor || "#000000",
				outlineWidth: fallback.outlineWidth,
			},
		};
	});
}

function hasExplicitRichTextVisualStyle(style: RichTextRunStyle): boolean {
	return Boolean(
		style.color ||
		style.outlineColor ||
		typeof style.outlineWidth === "number" ||
		style.fontFamily ||
		typeof style.fontSize === "number",
	);
}

function normalizeColorForCompare({
	color,
}: {
	color: string | undefined;
}): string {
	return (color ?? "").trim().toLowerCase();
}

function measureRichLine({
	ctx,
	segments,
	canvasHeight,
	baseFontSize,
	fallback,
}: {
	ctx: TextRenderContext;
	segments: RichLineSegment[];
	canvasHeight: number;
	baseFontSize: number;
	fallback: {
		fontFamily: string;
		fontWeight: TextFontWeight;
		fontStyle: TextFontStyle;
		letterSpacing: number;
	};
}): number {
	return segments.reduce((width, segment) => {
		const metrics = setupRichTextSegment({
			ctx,
			segment,
			canvasHeight,
			baseFontSize,
			fallback,
		});
		return width + metrics.width;
	}, 0);
}

function setupRichTextSegment({
	ctx,
	segment,
	canvasHeight,
	baseFontSize,
	fallback,
}: {
	ctx: TextRenderContext;
	segment: RichLineSegment;
	canvasHeight: number;
	baseFontSize: number;
	fallback: {
		fontFamily: string;
		fontWeight: TextFontWeight;
		fontStyle: TextFontStyle;
		letterSpacing: number;
	};
}): TextMetrics {
	const fontSize = segment.style.fontSize ?? baseFontSize;
	const scaledFontSize = fontSize * (canvasHeight / FONT_SIZE_SCALE_REFERENCE);
	ctx.font = buildTextFontString({
		fontFamily: segment.style.fontFamily ?? fallback.fontFamily,
		fontWeight: segment.style.fontWeight ?? fallback.fontWeight,
		fontStyle: segment.style.fontStyle ?? fallback.fontStyle,
		scaledFontSize,
	});
	setCanvasLetterSpacing({
		ctx,
		letterSpacingPx: segment.style.letterSpacing ?? fallback.letterSpacing,
	});
	return ctx.measureText(segment.text);
}

function getRichLineStartX({
	width,
	textAlign,
}: {
	width: number;
	textAlign: TextAlign;
}): number {
	if (textAlign === "left") return 0;
	if (textAlign === "right") return -width;
	return -width / 2;
}

function clampOpacity({ opacity }: { opacity: number }): number {
	if (!Number.isFinite(opacity)) return 1;
	return Math.max(0, Math.min(1, opacity));
}
