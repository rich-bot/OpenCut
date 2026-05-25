import type {
	TextAlign,
	TextDecoration,
	TextFontStyle,
	TextFontWeight,
} from "@/text/primitives";

export const RICH_TEXT_RUNS_PARAM = "richTextRuns";

export interface RichTextRunStyle {
	fontFamily?: string;
	fontSize?: number;
	color?: string;
	fontWeight?: TextFontWeight;
	fontStyle?: TextFontStyle;
	textDecoration?: TextDecoration;
	textAlign?: TextAlign;
	letterSpacing?: number;
	lineHeight?: number;
	outlineColor?: string;
	outlineWidth?: number;
	opacity?: number;
	backgroundColor?: string;
	backgroundOpacity?: number;
}

export interface RichTextRun {
	text: string;
	style: RichTextRunStyle;
	isHighlight?: boolean;
}

export interface MiaosiFontRun {
	value: string;
	font?: {
		family?: string;
		size?: number;
		color?: string;
		outline_color?: string;
		outline_width?: number;
		is_bold?: boolean;
		is_italic?: boolean;
		opacity?: number;
		back_opacity?: number | null;
		back_color?: string;
		spacing?: number;
		bg_opacity?: number;
	};
	is_high_light?: boolean;
}

const MIAOSI_SUBTITLE_SIZE = 72;
const OPENCUT_SUBTITLE_SIZE = 3.5;

export function normalizeColor({
	color,
	fallback,
}: {
	color: unknown;
	fallback?: string;
}): string | undefined {
	if (typeof color !== "string") return fallback;
	const trimmed = color.trim();
	if (!trimmed) return fallback;
	if (/^(#|rgb|hsl)/i.test(trimmed)) return trimmed;
	if (/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(trimmed)) {
		return `#${trimmed}`;
	}
	return trimmed;
}

export function miaosiFontSizeToOpenCutSize({
	size,
}: {
	size: number | undefined;
}): number | undefined {
	if (typeof size !== "number" || !Number.isFinite(size)) {
		return undefined;
	}
	return (size / MIAOSI_SUBTITLE_SIZE) * OPENCUT_SUBTITLE_SIZE;
}

export function miaosiOutlineWidthToOpenCutWidth({
	width,
}: {
	width: number | undefined;
}): number | undefined {
	if (typeof width !== "number" || !Number.isFinite(width)) {
		return undefined;
	}
	return (width / MIAOSI_SUBTITLE_SIZE) * OPENCUT_SUBTITLE_SIZE;
}

export function openCutFontSizeToMiaosiSize({
	size,
}: {
	size: number | undefined;
}): number {
	if (typeof size !== "number" || !Number.isFinite(size)) {
		return MIAOSI_SUBTITLE_SIZE;
	}
	return Math.round((size / OPENCUT_SUBTITLE_SIZE) * MIAOSI_SUBTITLE_SIZE);
}

export function createRichTextRunsFromMiaosiFonts({
	fonts,
	fallbackContent,
}: {
	fonts: MiaosiFontRun[] | undefined;
	fallbackContent: string;
}): RichTextRun[] | undefined {
	if (!fonts?.length) return undefined;

	const runs = fonts
		.map((run): RichTextRun | null => {
			const text = run.value ?? "";
			if (!text) return null;
			const font = run.font ?? {};
			return {
				text,
				isHighlight: run.is_high_light,
				style: {
					fontFamily: font.family,
					fontSize: miaosiFontSizeToOpenCutSize({ size: font.size }),
					color: normalizeColor({
						color: font.color,
						fallback: "#ffffff",
					}),
					fontWeight: font.is_bold ? "bold" : "normal",
					fontStyle: font.is_italic ? "italic" : "normal",
					letterSpacing:
						typeof font.spacing === "number" ? font.spacing : undefined,
					outlineColor: normalizeColor({
						color: font.outline_color,
						fallback: "#000000",
					}),
					outlineWidth: miaosiOutlineWidthToOpenCutWidth({
						width: font.outline_width,
					}),
					opacity:
						typeof font.opacity === "number" && Number.isFinite(font.opacity)
							? font.opacity
							: undefined,
					backgroundColor: normalizeColor({ color: font.back_color }),
					backgroundOpacity:
						typeof font.back_opacity === "number"
							? font.back_opacity
							: font.bg_opacity,
				},
			};
		})
		.filter((run): run is RichTextRun => Boolean(run));

	const content = getRichTextContent({ runs });
	if (content === fallbackContent) return runs;
	return [{ text: fallbackContent, style: runs[0]?.style ?? {} }];
}

export function serializeRichTextRuns({
	runs,
}: {
	runs: RichTextRun[] | undefined;
}): string | undefined {
	if (!runs?.length) return undefined;
	return JSON.stringify(runs);
}

export function parseRichTextRunsParam({
	value,
	content,
}: {
	value: unknown;
	content: string;
}): RichTextRun[] {
	if (typeof value !== "string" || !value.trim()) {
		return [{ text: content, style: {} }];
	}

	try {
		const parsed = JSON.parse(value) as unknown;
		if (!Array.isArray(parsed)) {
			return [{ text: content, style: {} }];
		}
		return normalizeRichTextRuns({
			content,
			runs: parsed
				.map((run): RichTextRun | null => {
					if (!isRecord(run)) return null;
					if (typeof run.text !== "string") return null;
					return {
						text: run.text,
						style: readRichTextRunStyle({ value: run.style }),
						isHighlight:
							typeof run.isHighlight === "boolean"
								? run.isHighlight
								: undefined,
					};
				})
				.filter((run): run is RichTextRun => Boolean(run)),
		});
	} catch {
		return [{ text: content, style: {} }];
	}
}

export function normalizeRichTextRuns({
	content,
	runs,
}: {
	content: string;
	runs: RichTextRun[] | undefined;
}): RichTextRun[] {
	const normalizedRuns = (runs ?? []).filter((run) => run.text.length > 0);
	if (normalizedRuns.length === 0) {
		return [{ text: content, style: {} }];
	}

	const runContent = getRichTextContent({ runs: normalizedRuns });
	if (runContent !== content) {
		return [{ text: content, style: normalizedRuns[0]?.style ?? {} }];
	}

	return mergeAdjacentRichTextRuns({ runs: normalizedRuns });
}

export function getRichTextContent({ runs }: { runs: RichTextRun[] }): string {
	return runs.map((run) => run.text).join("");
}

export function applyRichTextStyleToRange({
	content,
	runs,
	start,
	end,
	style,
}: {
	content: string;
	runs: RichTextRun[] | undefined;
	start: number;
	end: number;
	style: RichTextRunStyle;
}): RichTextRun[] {
	const normalizedRuns = normalizeRichTextRuns({ content, runs });
	const safeStart = Math.max(0, Math.min(start, end, content.length));
	const safeEnd = Math.max(
		safeStart,
		Math.min(Math.max(start, end), content.length),
	);
	if (safeStart === safeEnd) {
		return normalizedRuns;
	}

	let offset = 0;
	const nextRuns: RichTextRun[] = [];
	for (const run of normalizedRuns) {
		const runStart = offset;
		const runEnd = offset + run.text.length;
		offset = runEnd;

		if (runEnd <= safeStart || runStart >= safeEnd) {
			nextRuns.push(run);
			continue;
		}

		const beforeLength = Math.max(0, safeStart - runStart);
		const styledStart = Math.max(runStart, safeStart);
		const styledEnd = Math.min(runEnd, safeEnd);
		const styledLength = styledEnd - styledStart;
		const afterStart = beforeLength + styledLength;

		if (beforeLength > 0) {
			nextRuns.push({
				...run,
				text: run.text.slice(0, beforeLength),
			});
		}

		nextRuns.push({
			text: run.text.slice(beforeLength, afterStart),
			style: {
				...run.style,
				...style,
			},
			isHighlight: true,
		});

		if (afterStart < run.text.length) {
			nextRuns.push({
				...run,
				text: run.text.slice(afterStart),
			});
		}
	}

	return mergeAdjacentRichTextRuns({ runs: nextRuns });
}

export function buildUniformRichTextRuns({
	content,
	style,
}: {
	content: string;
	style: RichTextRunStyle;
}): RichTextRun[] {
	return [{ text: content, style }];
}

function mergeAdjacentRichTextRuns({
	runs,
}: {
	runs: RichTextRun[];
}): RichTextRun[] {
	const merged: RichTextRun[] = [];
	for (const run of runs) {
		if (!run.text) continue;
		const previous = merged[merged.length - 1];
		if (
			previous &&
			isSameRichTextStyle({ a: previous.style, b: run.style }) &&
			previous.isHighlight === run.isHighlight
		) {
			previous.text += run.text;
			continue;
		}
		merged.push({
			text: run.text,
			style: { ...run.style },
			isHighlight: run.isHighlight,
		});
	}
	return merged;
}

function isSameRichTextStyle({
	a,
	b,
}: {
	a: RichTextRunStyle;
	b: RichTextRunStyle;
}): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readRichTextRunStyle({ value }: { value: unknown }): RichTextRunStyle {
	if (!isRecord(value)) return {};
	const style: RichTextRunStyle = {};

	if (typeof value.fontFamily === "string") {
		style.fontFamily = value.fontFamily;
	}
	if (typeof value.fontSize === "number") {
		style.fontSize = value.fontSize;
	}
	if (typeof value.color === "string") {
		style.color = value.color;
	}
	if (value.fontWeight === "bold" || value.fontWeight === "normal") {
		style.fontWeight = value.fontWeight;
	}
	if (value.fontStyle === "italic" || value.fontStyle === "normal") {
		style.fontStyle = value.fontStyle;
	}
	if (
		value.textDecoration === "none" ||
		value.textDecoration === "underline" ||
		value.textDecoration === "line-through"
	) {
		style.textDecoration = value.textDecoration;
	}
	if (
		value.textAlign === "left" ||
		value.textAlign === "center" ||
		value.textAlign === "right"
	) {
		style.textAlign = value.textAlign;
	}
	if (typeof value.letterSpacing === "number") {
		style.letterSpacing = value.letterSpacing;
	}
	if (typeof value.lineHeight === "number") {
		style.lineHeight = value.lineHeight;
	}
	if (typeof value.outlineColor === "string") {
		style.outlineColor = value.outlineColor;
	}
	if (typeof value.outlineWidth === "number") {
		style.outlineWidth = value.outlineWidth;
	}
	if (typeof value.opacity === "number") {
		style.opacity = value.opacity;
	}
	if (typeof value.backgroundColor === "string") {
		style.backgroundColor = value.backgroundColor;
	}
	if (typeof value.backgroundOpacity === "number") {
		style.backgroundOpacity = value.backgroundOpacity;
	}

	return style;
}
