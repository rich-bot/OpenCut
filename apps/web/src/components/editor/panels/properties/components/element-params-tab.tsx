"use client";

import { useState } from "react";
import { resolveAnimationPathValueAtTime } from "@/animation";
import { Section, SectionContent, SectionFields } from "@/components/section";
import { useElementPlayhead } from "@/components/editor/panels/properties/hooks/use-element-playhead";
import { useKeyframedParamProperty } from "@/components/editor/panels/properties/hooks/use-keyframed-param-property";
import {
	PropertyParamField,
	type TextInputSelection,
} from "@/components/editor/panels/properties/components/property-param-field";
import type { ParamValue, ParamValues } from "@/params";
import {
	getElementParams,
	readElementParamValue,
	writeElementParamValue,
	type ElementParamDefinition,
} from "@/params/registry";
import {
	RICH_TEXT_RUNS_PARAM,
	applyRichTextStyleToRange,
	buildUniformRichTextRuns,
	parseRichTextRunsParam,
	serializeRichTextRuns,
	type RichTextRun,
	type RichTextRunStyle,
} from "@/text/rich-text";
import type { TimelineElement } from "@/timeline";
import type { MediaTime } from "@/wasm";

export function ElementParamsTab({
	element,
	trackId,
	trackName,
	paramKeys,
	sectionKey,
}: {
	element: TimelineElement;
	trackId: string;
	trackName?: string;
	paramKeys?: readonly string[];
	sectionKey: string;
}) {
	const { localTime, isPlayheadWithinElementRange } = useElementPlayhead({
		startTime: element.startTime,
		duration: element.duration,
	});
	const params = getElementParams({ element }).filter(
		(param) => !paramKeys || paramKeys.includes(param.key),
	);
	const baseValues = buildValues({ element, params });
	const [richTextSelection, setRichTextSelection] =
		useState<RichTextSelection | null>(null);
	const shouldLockContent =
		element.type === "text" && isCaptionTextElement({ element, trackName });

	return (
		<Section sectionKey={`${element.id}:${sectionKey}`}>
			<SectionContent className="pt-4">
				<SectionFields>
					{params
						.filter((param) => isVisible({ param, values: baseValues }))
						.map((param) => (
							<ElementParamField
								key={param.key}
								element={element}
								trackId={trackId}
								param={param}
								baseValue={baseValues[param.key] ?? param.default}
								localTime={localTime}
								isPlayheadWithinElementRange={isPlayheadWithinElementRange}
								isContentReadOnly={shouldLockContent}
								richTextSelection={richTextSelection}
								onRichTextSelectionChange={(selection) => {
									setRichTextSelection(
										selection
											? {
													elementId: element.id,
													...selection,
												}
											: null,
									);
								}}
							/>
						))}
				</SectionFields>
			</SectionContent>
		</Section>
	);
}

function ElementParamField({
	element,
	trackId,
	param,
	baseValue,
	localTime,
	isPlayheadWithinElementRange,
	isContentReadOnly,
	richTextSelection,
	onRichTextSelectionChange,
}: {
	element: TimelineElement;
	trackId: string;
	param: ElementParamDefinition;
	baseValue: ParamValue;
	localTime: MediaTime;
	isPlayheadWithinElementRange: boolean;
	isContentReadOnly: boolean;
	richTextSelection: RichTextSelection | null;
	onRichTextSelectionChange: (selection: TextInputSelection | null) => void;
}) {
	const resolvedValue = resolveAnimationPathValueAtTime({
		animations: element.animations,
		propertyPath: param.key,
		localTime,
		fallbackValue: baseValue,
	});
	const animatedParam = useKeyframedParamProperty({
		param,
		trackId,
		elementId: element.id,
		animations: element.animations,
		propertyPath: param.key,
		localTime,
		isPlayheadWithinElementRange,
		resolvedValue,
		buildBaseUpdates: ({ value }) =>
			buildElementParamUpdate({
				element,
				param,
				value,
				richTextSelection,
			}),
	});
	const richTextRuns =
		element.type === "text" && typeof element.params.content === "string"
			? applyBaseStyleToRichTextRuns({
					runs: parseRichTextRunsParam({
						value: element.params[RICH_TEXT_RUNS_PARAM],
						content: element.params.content,
					}),
					baseStyle: getElementRichTextBaseStyle({ element }),
				})
			: undefined;
	const displayedValue = getDisplayedParamValue({
		element,
		param,
		value: resolvedValue,
		richTextRuns,
		richTextSelection,
	});

	return (
		<PropertyParamField
			param={param}
			value={displayedValue}
			onPreview={animatedParam.onPreview}
			onCommit={animatedParam.onCommit}
			richTextRuns={param.key === "content" ? richTextRuns : undefined}
			isTextReadOnly={param.key === "content" && isContentReadOnly}
			onTextSelectionChange={
				param.key === "content" ? onRichTextSelectionChange : undefined
			}
			keyframe={
				param.keyframable === false
					? undefined
					: {
							isActive: animatedParam.isKeyframedAtTime,
							isDisabled: !isPlayheadWithinElementRange,
							onToggle: animatedParam.toggleKeyframe,
						}
			}
		/>
	);
}

function buildElementParamUpdate({
	element,
	param,
	value,
	richTextSelection,
}: {
	element: TimelineElement;
	param: ElementParamDefinition;
	value: ParamValue;
	richTextSelection?: RichTextSelection | null;
}): Partial<TimelineElement> {
	const update = writeElementParamValue({ element, param, value });
	if (element.type !== "text") {
		return update;
	}

	const previousContent =
		typeof element.params.content === "string" ? element.params.content : "";
	const previousRuns = applyBaseStyleToRichTextRuns({
		runs: parseRichTextRunsParam({
			value: element.params[RICH_TEXT_RUNS_PARAM],
			content: previousContent,
		}),
		baseStyle: getElementRichTextBaseStyle({ element }),
	});

	if (param.key !== "content") {
		const stylePatch = buildRichTextStylePatch({ key: param.key, value });
		if (!stylePatch) return update;
		const activeSelection = getActiveRichTextSelection({
			element,
			content: previousContent,
			richTextSelection,
		});
		if (activeSelection) {
			return {
				params: {
					...element.params,
					[RICH_TEXT_RUNS_PARAM]:
						serializeRichTextRuns({
							runs: applyRichTextStyleToRange({
								content: previousContent,
								runs: previousRuns,
								start: activeSelection.start,
								end: activeSelection.end,
								style: stylePatch,
							}),
						}) ?? "",
				},
			};
		}

		return {
			...update,
			params: {
				...(update.params ?? {}),
				[RICH_TEXT_RUNS_PARAM]:
					serializeRichTextRuns({
						runs: previousRuns.map((run) => ({
							...run,
							style: {
								...run.style,
								...stylePatch,
							},
						})),
					}) ?? "",
			},
		};
	}

	if (typeof value !== "string") return update;

	return {
		...update,
		params: {
			...(update.params ?? {}),
			[RICH_TEXT_RUNS_PARAM]:
				serializeRichTextRuns({
					runs: buildUniformRichTextRuns({
						content: value,
						style: previousRuns[0]?.style ?? {},
					}),
				}) ?? "",
		},
	};
}

type RichTextSelection = {
	elementId: string;
	start: number;
	end: number;
};

function isCaptionTextElement({
	element,
	trackName,
}: {
	element: TimelineElement;
	trackName?: string;
}) {
	if (element.type !== "text") return false;
	const elementName = element.name.toLowerCase();
	return (
		elementName.startsWith("caption") ||
		element.name.includes("字幕") ||
		(trackName ?? "").includes("字幕")
	);
}

function buildRichTextStylePatch({
	key,
	value,
}: {
	key: string;
	value: ParamValue;
}): RichTextRunStyle | null {
	if (key === "color" && typeof value === "string") {
		return { color: value };
	}
	if (key === "stroke.color" && typeof value === "string") {
		return { outlineColor: value };
	}
	if (key === "stroke.width" && typeof value === "number") {
		return { outlineWidth: value };
	}
	if (key === "fontFamily" && typeof value === "string") {
		return { fontFamily: value };
	}
	if (key === "fontSize" && typeof value === "number") {
		return { fontSize: value };
	}
	if (key === "fontWeight" && (value === "bold" || value === "normal")) {
		return { fontWeight: value };
	}
	if (key === "fontStyle" && (value === "italic" || value === "normal")) {
		return { fontStyle: value };
	}
	if (
		key === "textAlign" &&
		(value === "left" || value === "center" || value === "right")
	) {
		return { textAlign: value };
	}
	return null;
}

function getDisplayedParamValue({
	element,
	param,
	value,
	richTextRuns,
	richTextSelection,
}: {
	element: TimelineElement;
	param: ElementParamDefinition;
	value: ParamValue;
	richTextRuns: RichTextRun[] | undefined;
	richTextSelection: RichTextSelection | null;
}): ParamValue {
	if (element.type !== "text") return value;
	const content =
		typeof element.params.content === "string" ? element.params.content : "";
	const selectionStyle = getRichTextSelectionStyle({
		element,
		content,
		richTextRuns,
		richTextSelection,
	});
	if (!selectionStyle) return value;

	if (param.key === "color") {
		return selectionStyle.color ?? value;
	}
	if (param.key === "stroke.color") {
		return selectionStyle.outlineColor ?? value;
	}
	if (param.key === "stroke.width") {
		return selectionStyle.outlineWidth ?? value;
	}
	if (param.key === "fontFamily") {
		return selectionStyle.fontFamily ?? value;
	}
	if (param.key === "fontSize") {
		return selectionStyle.fontSize ?? value;
	}
	if (param.key === "fontWeight") {
		return selectionStyle.fontWeight ?? value;
	}
	if (param.key === "fontStyle") {
		return selectionStyle.fontStyle ?? value;
	}
	if (param.key === "textAlign") {
		return selectionStyle.textAlign ?? value;
	}
	return value;
}

function getElementRichTextBaseStyle({
	element,
}: {
	element: TimelineElement;
}): RichTextRunStyle {
	if (element.type !== "text") return {};

	return {
		fontFamily:
			typeof element.params.fontFamily === "string"
				? element.params.fontFamily
				: "MFChuangJiHei",
		fontSize:
			typeof element.params.fontSize === "number"
				? element.params.fontSize
				: 3.5,
		color:
			typeof element.params.color === "string"
				? element.params.color
				: "#ffffff",
		fontWeight: element.params.fontWeight === "normal" ? "normal" : "bold",
		fontStyle: element.params.fontStyle === "italic" ? "italic" : "normal",
		textAlign:
			element.params.textAlign === "left" ||
			element.params.textAlign === "right"
				? element.params.textAlign
				: "center",
		outlineColor:
			typeof element.params["stroke.color"] === "string"
				? element.params["stroke.color"]
				: "#000000",
		outlineWidth:
			typeof element.params["stroke.width"] === "number"
				? element.params["stroke.width"]
				: 0,
	};
}

function applyBaseStyleToRichTextRuns({
	runs,
	baseStyle,
}: {
	runs: RichTextRun[];
	baseStyle: RichTextRunStyle;
}): RichTextRun[] {
	return runs.map((run) => ({
		...run,
		style: {
			...baseStyle,
			...run.style,
		},
	}));
}

function getRichTextSelectionStyle({
	element,
	content,
	richTextRuns,
	richTextSelection,
}: {
	element: TimelineElement;
	content: string;
	richTextRuns: RichTextRun[] | undefined;
	richTextSelection: RichTextSelection | null;
}): RichTextRunStyle | null {
	const activeSelection = getActiveRichTextSelection({
		element,
		content,
		richTextSelection,
	});
	if (!activeSelection || !richTextRuns) return null;

	let offset = 0;
	for (const run of richTextRuns) {
		const runStart = offset;
		const runEnd = offset + run.text.length;
		offset = runEnd;
		if (runEnd <= activeSelection.start || runStart >= activeSelection.end) {
			continue;
		}
		return run.style;
	}
	return null;
}

function getActiveRichTextSelection({
	element,
	content,
	richTextSelection,
}: {
	element: TimelineElement;
	content: string;
	richTextSelection?: RichTextSelection | null;
}): TextInputSelection | null {
	if (!richTextSelection || richTextSelection.elementId !== element.id) {
		return null;
	}
	const start = Math.max(
		0,
		Math.min(richTextSelection.start, richTextSelection.end, content.length),
	);
	const end = Math.max(
		start,
		Math.min(
			Math.max(richTextSelection.start, richTextSelection.end),
			content.length,
		),
	);
	if (start === end) return null;
	return { start, end };
}

function buildValues({
	element,
	params,
}: {
	element: TimelineElement;
	params: readonly ElementParamDefinition[];
}): ParamValues {
	const values: ParamValues = {};
	for (const param of params) {
		const value = readElementParamValue({ element, param });
		if (value !== null) {
			values[param.key] = value;
		}
	}
	return values;
}

function isVisible({
	param,
	values,
}: {
	param: ElementParamDefinition;
	values: ParamValues;
}): boolean {
	return (param.dependencies ?? []).every((dependency) =>
		areParamValuesEqual({
			left: values[dependency.param],
			right: dependency.equals,
		}),
	);
}

function areParamValuesEqual({
	left,
	right,
}: {
	left: ParamValue | undefined;
	right: ParamValue;
}): boolean {
	return left === right;
}
