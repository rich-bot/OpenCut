import type { CSSProperties } from "react";
import {
	normalizeRichTextRuns,
	type RichTextRun,
	type RichTextRunStyle,
} from "@/text/rich-text";
import { cn } from "@/utils/ui";

export function RichTextPreview({
	content,
	runs,
	className,
}: {
	content: string;
	runs: RichTextRun[] | undefined;
	className?: string;
}) {
	const normalizedRuns = normalizeRichTextRuns({ content, runs });

	return (
		<div
			aria-hidden
			className={cn(
				"pointer-events-none whitespace-pre-wrap break-words",
				className,
			)}
		>
			{normalizedRuns.map((run, index) => (
				<span
					key={`${index}:${run.text}`}
					style={richTextRunStyleToCss({ style: run.style })}
				>
					{run.text}
				</span>
			))}
		</div>
	);
}

export function richTextRunStyleToCss({
	style,
}: {
	style: RichTextRunStyle;
}): CSSProperties {
	const outlineStrength =
		typeof style.outlineWidth === "number" && style.outlineWidth > 0
			? Math.min(0.7, Math.max(0.35, style.outlineWidth * 0.8))
			: 0;
	const outlineColor = style.outlineColor ?? "rgba(0,0,0,0.45)";
	const outlineShadow =
		outlineStrength > 0
			? [
					`${outlineStrength}px 0 0 ${outlineColor}`,
					`-${outlineStrength}px 0 0 ${outlineColor}`,
					`0 ${outlineStrength}px 0 ${outlineColor}`,
					`0 -${outlineStrength}px 0 ${outlineColor}`,
					`0 1px 1px rgba(0,0,0,0.3)`,
				].join(", ")
			: undefined;
	const color = style.color ?? "currentColor";

	return {
		color,
		fontFamily: style.fontFamily,
		fontWeight: style.fontWeight === "normal" ? 400 : 700,
		fontStyle: style.fontStyle ?? "normal",
		WebkitTextFillColor: color,
		textShadow: outlineShadow,
	};
}
