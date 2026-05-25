"use client";

import { useMemo, useState } from "react";
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Bold,
	Italic,
	Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { useEditor } from "@/editor/use-editor";
import { RichTextPreview } from "@/text/components/rich-text-preview";
import type { TextAlign } from "@/text/primitives";
import {
	RICH_TEXT_RUNS_PARAM,
	applyRichTextStyleToRange,
	buildUniformRichTextRuns,
	parseRichTextRunsParam,
	serializeRichTextRuns,
	type RichTextRun,
	type RichTextRunStyle,
} from "@/text/rich-text";
import type { OverlayTrack, TextElement, TextTrack } from "@/timeline";
import { cn } from "@/utils/ui";
import {
	SUBTITLE_FONT_OPTIONS,
	SUBTITLE_STYLE_PRESETS,
	getSubtitleFontOption,
	subtitleFontFamilyCss,
	stylePresetToCss,
	type SubtitleFontOption,
	type SubtitleStylePreset,
} from "@/subtitles/style-presets";

type CaptionEntry = {
	trackId: string;
	element: TextElement;
};

type CaptionTextSelection = {
	elementId: string;
	start: number;
	end: number;
};

type PanelMode = "global" | "highlight";

const DEFAULT_PRESET = SUBTITLE_STYLE_PRESETS[0];
const DEFAULT_FONT_OPTION: SubtitleFontOption = {
	value: "MFChuangJiHei",
	label: "造字工房创际黑体",
	previewText: "造字工房创际黑体",
	cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
};
const DEFAULT_CAPTION_BASE_STYLE: RichTextRunStyle = {
	fontFamily: "Arial",
	fontSize: 3.5,
	color: "#ffffff",
	fontWeight: "bold",
	fontStyle: "normal",
	textAlign: "center",
	outlineColor: "#000000",
	outlineWidth: 0,
};

export function CaptionQuickEditView() {
	const editor = useEditor();
	const scene = useEditor((currentEditor) =>
		currentEditor.scenes.getActiveSceneOrNull(),
	);
	const entries = useMemo(() => {
		if (!scene) return [];
		return scene.tracks.overlay
			.filter(isCaptionTextTrack)
			.flatMap((track) =>
				track.elements.map((element) => ({
					trackId: track.id,
					element,
				})),
			)
			.sort((a, b) => a.element.startTime - b.element.startTime);
	}, [scene]);
	const selectedElements = useEditor((currentEditor) =>
		currentEditor.selection.getSelectedElements(),
	);
	const selectedCaption = useMemo(
		() =>
			entries.find((entry) =>
				selectedElements.some(
					(selected) =>
						selected.trackId === entry.trackId &&
						selected.elementId === entry.element.id,
				),
			),
		[entries, selectedElements],
	);

	const [mode, setMode] = useState<PanelMode>("global");
	const [activeElementId, setActiveElementId] = useState<string | null>(null);
	const [drafts, setDrafts] = useState<Record<string, string>>({});
	const [selection, setSelection] = useState<CaptionTextSelection | null>(null);
	const [activePresetId, setActivePresetId] = useState<string | null>(
		DEFAULT_PRESET.id,
	);
	const [fontFamily, setFontFamily] = useState(
		DEFAULT_PRESET.style.fontFamily ?? "MFChuangJiHei",
	);
	const [fontSize, setFontSize] = useState(
		DEFAULT_PRESET.style.fontSize ?? 3.5,
	);
	const [isBold, setIsBold] = useState(
		DEFAULT_PRESET.style.fontWeight !== "normal",
	);
	const [isItalic, setIsItalic] = useState(
		DEFAULT_PRESET.style.fontStyle === "italic",
	);
	const [textAlign, setTextAlign] = useState<TextAlign>("center");

	const activeEntry =
		entries.find(
			(entry) =>
				entry.element.id === (selectedCaption?.element.id ?? activeElementId),
		) ??
		selectedCaption ??
		entries[0] ??
		null;
	const activePreset =
		SUBTITLE_STYLE_PRESETS.find((preset) => preset.id === activePresetId) ??
		DEFAULT_PRESET;
	const activeEntryStyle = useMemo(
		() =>
			activeEntry
				? elementStyleToRichTextStyle({ element: activeEntry.element })
				: null,
		[activeEntry],
	);
	const matchedActivePreset = activeEntryStyle
		? findMatchingSubtitlePreset({ style: activeEntryStyle })
		: undefined;
	const displayedActivePresetId =
		mode === "highlight" ? (matchedActivePreset?.id ?? null) : activePresetId;
	const selectedFont =
		getSubtitleFontOption({ value: fontFamily }) ?? DEFAULT_FONT_OPTION;

	const getDraftContent = ({ element }: { element: TextElement }) =>
		drafts[element.id] ?? readTextContent({ element });

	const updateCaptionElement = ({
		entry,
		content,
		runs,
		params,
		pushHistory = true,
	}: {
		entry: CaptionEntry;
		content: string;
		runs: RichTextRun[];
		params?: Record<string, string | number | boolean>;
		pushHistory?: boolean;
	}) => {
		editor.timeline.updateElements({
			pushHistory,
			updates: [
				{
					trackId: entry.trackId,
					elementId: entry.element.id,
					patch: {
						params: {
							...(params ?? {}),
							content,
							[RICH_TEXT_RUNS_PARAM]: serializeRichTextRuns({ runs }) ?? "",
						},
					},
				},
			],
		});
	};

	const commitContent = ({
		entry,
		content,
		pushHistory = true,
	}: {
		entry: CaptionEntry;
		content: string;
		pushHistory?: boolean;
	}) => {
		const previousContent = readTextContent({ element: entry.element });
		if (content === previousContent) return;
		const previousRuns = getCaptionRunsForEditing({
			element: entry.element,
			content: previousContent,
		});
		const nextRuns = buildUniformRichTextRuns({
			content,
			style:
				previousRuns[0]?.style ??
				elementStyleToRichTextStyle({ element: entry.element }),
		});
		updateCaptionElement({ entry, content, runs: nextRuns, pushHistory });
	};

	const selectEntry = ({ entry }: { entry: CaptionEntry }) => {
		setActiveElementId(entry.element.id);
		const nextStyle = elementStyleToRichTextStyle({ element: entry.element });
		setFontFamily(nextStyle.fontFamily ?? "MFChuangJiHei");
		setFontSize(nextStyle.fontSize ?? 3.5);
		setIsBold(nextStyle.fontWeight !== "normal");
		setIsItalic(nextStyle.fontStyle === "italic");
		setTextAlign(nextStyle.textAlign ?? "center");
		setActivePresetId(
			findMatchingSubtitlePreset({ style: nextStyle })?.id ?? null,
		);
		editor.selection.setSelectedElements({
			elements: [{ trackId: entry.trackId, elementId: entry.element.id }],
		});
	};

	const seekToEntry = ({ entry }: { entry: CaptionEntry }) => {
		selectEntry({ entry });
		editor.playback.seek({ time: entry.element.startTime });
	};

	const applyGlobalStyle = ({
		preset,
		style,
	}: {
		preset?: SubtitleStylePreset;
		style?: RichTextRunStyle;
	}) => {
		const nextStyle =
			style ??
			buildCurrentSubtitleStyle({
				preset: preset ?? activePreset,
				fontFamily,
				fontSize,
				isBold,
				isItalic,
				textAlign,
			});
		editor.timeline.updateElements({
			updates: entries.map((entry) => {
				const content = getDraftContent({ element: entry.element });
				return {
					trackId: entry.trackId,
					elementId: entry.element.id,
					patch: {
						params: {
							content,
							fontFamily: nextStyle.fontFamily ?? "MFChuangJiHei",
							fontSize: nextStyle.fontSize ?? 3.5,
							color: nextStyle.color ?? "#ffffff",
							fontWeight: nextStyle.fontWeight ?? "bold",
							fontStyle: nextStyle.fontStyle ?? "normal",
							textAlign: nextStyle.textAlign ?? "center",
							"stroke.color": nextStyle.outlineColor ?? "#000000",
							"stroke.width": nextStyle.outlineWidth ?? 0,
							[RICH_TEXT_RUNS_PARAM]:
								serializeRichTextRuns({
									runs: buildUniformRichTextRuns({
										content,
										style: nextStyle,
									}),
								}) ?? "",
						},
					},
				};
			}),
		});
	};

	const applyRangeStyle = ({ preset }: { preset?: SubtitleStylePreset }) => {
		if (!activeEntry) return;
		const content = getDraftContent({ element: activeEntry.element });
		if (content !== readTextContent({ element: activeEntry.element })) {
			commitContent({ entry: activeEntry, content, pushHistory: true });
		}
		const activeSelection =
			selection?.elementId === activeEntry.element.id &&
			selection.start !== selection.end
				? selection
				: { elementId: activeEntry.element.id, start: 0, end: content.length };
		const style = buildCurrentSubtitleStyle({
			preset: preset ?? activePreset,
			fontFamily,
			fontSize,
			isBold,
			isItalic,
			textAlign,
		});
		const runs = getCaptionRunsForEditing({
			element: activeEntry.element,
			content,
		});
		const nextRuns = applyRichTextStyleToRange({
			content,
			runs,
			start: activeSelection.start,
			end: activeSelection.end,
			style,
		});
		const isWholeCaptionSelected =
			activeSelection.start <= 0 && activeSelection.end >= content.length;
		updateCaptionElement({
			entry: activeEntry,
			content,
			runs: nextRuns,
			params: richTextStyleToElementParams({
				style: isWholeCaptionSelected
					? style
					: resolveCaptionBaseStyle({
							element: activeEntry.element,
							runs,
						}),
			}),
			pushHistory: true,
		});
		editor.playback.seek({ time: activeEntry.element.startTime });
	};

	const handlePresetClick = ({ preset }: { preset: SubtitleStylePreset }) => {
		setActivePresetId(preset.id);
		setFontFamily(preset.style.fontFamily ?? "MFChuangJiHei");
		setFontSize(preset.style.fontSize ?? 3.5);
		setIsBold(preset.style.fontWeight !== "normal");
		setIsItalic(preset.style.fontStyle === "italic");
		setTextAlign(preset.style.textAlign ?? textAlign);
		if (mode === "global") {
			applyGlobalStyle({ preset });
			return;
		}
		applyRangeStyle({ preset });
	};

	const handleFontFamilyChange = ({ value }: { value: string }) => {
		const nextFont = getSubtitleFontOption({ value });
		preloadSubtitleFont({ font: nextFont });
		setFontFamily(value);
		applyGlobalStyle({
			style: buildCurrentSubtitleStyle({
				preset: activePreset,
				fontFamily: value,
				fontSize,
				isBold,
				isItalic,
				textAlign,
			}),
		});
	};

	return (
		<PanelView hideHeader scrollClassName="pt-2" contentClassName="pb-4">
			<SubtitleQuickEditStyles />
			<SubtitleFontFaces />
			<div className="border-border/70 bg-background/70 grid grid-cols-2 rounded-lg border p-1">
				<ModeButton
					isActive={mode === "global"}
					onClick={() => setMode("global")}
				>
					全局字幕样式
				</ModeButton>
				<ModeButton
					isActive={mode === "highlight"}
					onClick={() => setMode("highlight")}
				>
					字幕换行和高亮
				</ModeButton>
			</div>

			{mode === "global" ? (
				<div className="mt-4 flex flex-col gap-3">
					<div className="flex items-center gap-2">
						<span className="text-foreground text-sm font-medium">样式</span>
					</div>
					<div className="grid grid-cols-[1fr_72px_36px_36px] gap-2">
						<Select
							value={fontFamily}
							onValueChange={(value) => handleFontFamilyChange({ value })}
						>
							<SelectTrigger className="h-9">
								<SelectValue>
									<span
										style={{
											fontFamily: subtitleFontFamilyCss({
												font: selectedFont,
											}),
										}}
									>
										{selectedFont.label}
									</span>
								</SelectValue>
							</SelectTrigger>
							<SelectContent className="w-[190px]">
								{SUBTITLE_FONT_OPTIONS.map((font) => (
									<SelectItem
										key={font.value}
										value={font.value}
										className="py-2"
									>
										<span
											className="text-[15px] font-semibold"
											style={{
												fontFamily: subtitleFontFamilyCss({ font }),
											}}
										>
											{font.previewText ?? font.label}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Input
							type="number"
							min={1}
							max={15}
							step={0.1}
							value={fontSize}
							onChange={(event) =>
								setFontSize(Number(event.currentTarget.value) || 3.5)
							}
							onBlur={() => applyGlobalStyle({})}
							className="h-9"
						/>
						<Button
							type="button"
							variant={isBold ? "default" : "secondary"}
							size="icon"
							onClick={() => {
								const nextIsBold = !isBold;
								setIsBold(nextIsBold);
								applyGlobalStyle({
									style: buildCurrentSubtitleStyle({
										preset: activePreset,
										fontFamily,
										fontSize,
										isBold: nextIsBold,
										isItalic,
										textAlign,
									}),
								});
							}}
							aria-label="加粗"
						>
							<Bold className="size-4" />
						</Button>
						<Button
							type="button"
							variant={isItalic ? "default" : "secondary"}
							size="icon"
							onClick={() => {
								const nextIsItalic = !isItalic;
								setIsItalic(nextIsItalic);
								applyGlobalStyle({
									style: buildCurrentSubtitleStyle({
										preset: activePreset,
										fontFamily,
										fontSize,
										isBold,
										isItalic: nextIsItalic,
										textAlign,
									}),
								});
							}}
							aria-label="斜体"
						>
							<Italic className="size-4" />
						</Button>
					</div>
					<div className="bg-muted grid grid-cols-3 rounded-md p-1">
						<AlignButton
							icon={<AlignLeft className="size-4" />}
							isActive={textAlign === "left"}
							onClick={() => {
								setTextAlign("left");
								applyGlobalStyle({
									style: buildCurrentSubtitleStyle({
										preset: activePreset,
										fontFamily,
										fontSize,
										isBold,
										isItalic,
										textAlign: "left",
									}),
								});
							}}
							label="左对齐"
						/>
						<AlignButton
							icon={<AlignCenter className="size-4" />}
							isActive={textAlign === "center"}
							onClick={() => {
								setTextAlign("center");
								applyGlobalStyle({
									style: buildCurrentSubtitleStyle({
										preset: activePreset,
										fontFamily,
										fontSize,
										isBold,
										isItalic,
										textAlign: "center",
									}),
								});
							}}
							label="居中"
						/>
						<AlignButton
							icon={<AlignRight className="size-4" />}
							isActive={textAlign === "right"}
							onClick={() => {
								setTextAlign("right");
								applyGlobalStyle({
									style: buildCurrentSubtitleStyle({
										preset: activePreset,
										fontFamily,
										fontSize,
										isBold,
										isItalic,
										textAlign: "right",
									}),
								});
							}}
							label="右对齐"
						/>
					</div>
					<SubtitlePresetGrid
						activePresetId={activePresetId}
						onPresetClick={handlePresetClick}
						density="compact"
					/>
				</div>
			) : (
				<div className="mt-2 flex min-h-0 flex-col gap-2">
					<div className="neo-caption-list-scroll border-border/60 bg-muted/20 flex h-[300px] min-h-[240px] flex-col gap-1 overflow-y-auto rounded-lg border p-1 pr-1.5">
						{entries.length === 0 ? (
							<div className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
								暂无字幕轨道
							</div>
						) : (
							entries.map((entry) => {
								const content = getDraftContent({ element: entry.element });
								const isActive = activeEntry?.element.id === entry.element.id;
								return (
									<div
										key={entry.element.id}
										className={cn(
											"rounded-md p-1.5 transition",
											isActive
												? "bg-accent text-accent-foreground"
												: "hover:bg-muted/70",
										)}
									>
										<div className="flex items-start gap-2">
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="mt-1 size-7 shrink-0 rounded-full"
												onClick={() => seekToEntry({ entry })}
												aria-label="跳转到字幕"
											>
												<Play className="size-4 fill-current" />
											</Button>
											<div className="relative min-h-10 flex-1">
												<RichTextPreview
													content={content}
													runs={getCaptionRuns({
														element: entry.element,
														content,
													})}
													className="absolute inset-0 overflow-hidden p-1 text-sm leading-5"
												/>
												<Textarea
													value={content}
													className="relative max-h-12 min-h-10 resize-none border-0 bg-transparent p-1 text-sm leading-5 text-transparent caret-foreground shadow-none selection:bg-primary/50 focus-visible:border-0"
													onFocus={() => selectEntry({ entry })}
													onSelect={(event) =>
														setSelection({
															elementId: entry.element.id,
															start: event.currentTarget.selectionStart,
															end: event.currentTarget.selectionEnd,
														})
													}
													onChange={(event) =>
														setDrafts((current) => ({
															...current,
															[entry.element.id]: event.currentTarget.value,
														}))
													}
													onBlur={(event) =>
														commitContent({
															entry,
															content: event.currentTarget.value,
															pushHistory: true,
														})
													}
												/>
											</div>
										</div>
									</div>
								);
							})
						)}
					</div>
					<div className="border-border/60 bg-background/40 rounded-lg border p-1.5">
						<SubtitlePresetGrid
							activePresetId={displayedActivePresetId}
							onPresetClick={handlePresetClick}
							density="compact"
						/>
					</div>
				</div>
			)}
		</PanelView>
	);
}

function SubtitleQuickEditStyles() {
	return (
		<style>{`
			.neo-caption-list-scroll {
				scrollbar-width: thin;
				scrollbar-color: rgba(148, 163, 184, 0.48) transparent;
			}
			.neo-caption-list-scroll::-webkit-scrollbar {
				width: 6px;
			}
			.neo-caption-list-scroll::-webkit-scrollbar-track {
				background: transparent;
			}
			.neo-caption-list-scroll::-webkit-scrollbar-thumb {
				background: rgba(148, 163, 184, 0.38);
				border-radius: 999px;
				border: 1px solid transparent;
				background-clip: content-box;
			}
			.neo-caption-list-scroll:hover::-webkit-scrollbar-thumb {
				background: rgba(148, 163, 184, 0.62);
				background-clip: content-box;
			}
		`}</style>
	);
}

function SubtitleFontFaces() {
	const css = SUBTITLE_FONT_OPTIONS.flatMap((font) => {
		if (!font.sourceUrl) return [];
		return [font.value, ...(font.aliases ?? [])].map(
			(fontFamily) =>
				`@font-face{font-family:"${fontFamily}";src:url("${encodeURI(
					font.sourceUrl ?? "",
				)}");font-display:swap;}`,
		);
	}).join("\n");

	if (!css) return null;

	return <style>{css}</style>;
}

function preloadSubtitleFont({ font }: { font?: SubtitleFontOption }) {
	if (!font?.sourceUrl || typeof document === "undefined") return;
	if (!("fonts" in document)) return;
	void document.fonts.load(`16px "${font.value}"`);
}

function SubtitlePresetGrid({
	activePresetId,
	onPresetClick,
	density = "comfortable",
}: {
	activePresetId: string | null;
	onPresetClick: ({ preset }: { preset: SubtitleStylePreset }) => void;
	density?: "comfortable" | "compact";
}) {
	const isCompact = density === "compact";

	return (
		<div
			className={cn(
				"grid",
				isCompact ? "grid-cols-9 gap-1" : "grid-cols-6 gap-2",
			)}
		>
			{SUBTITLE_STYLE_PRESETS.map((preset) => (
				<button
					key={preset.id}
					type="button"
					className={cn(
						"bg-muted/70 hover:bg-muted flex items-center justify-center rounded-md border border-transparent font-black transition",
						isCompact ? "h-7 min-w-0 text-base" : "aspect-square text-2xl",
						activePresetId === preset.id
							? "border-foreground ring-1 ring-foreground"
							: "border-transparent",
					)}
					onClick={() => onPresetClick({ preset })}
					aria-label={preset.name}
					title={preset.name}
				>
					<span style={stylePresetToCss({ style: preset.style })}>T</span>
				</button>
			))}
		</div>
	);
}

function ModeButton({
	isActive,
	onClick,
	children,
}: {
	isActive: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			className={cn(
				"h-7 rounded-md border px-2 text-xs transition",
				isActive
					? "border-primary/60 bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(59,130,246,0.22),0_4px_12px_rgba(37,99,235,0.18)]"
					: "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
			)}
			onClick={onClick}
		>
			{children}
		</button>
	);
}

function AlignButton({
	icon,
	isActive,
	onClick,
	label,
}: {
	icon: React.ReactNode;
	isActive: boolean;
	onClick: () => void;
	label: string;
}) {
	return (
		<button
			type="button"
			className={cn(
				"flex h-8 items-center justify-center rounded text-muted-foreground transition",
				isActive && "bg-background text-foreground shadow-sm",
			)}
			onClick={onClick}
			aria-label={label}
			title={label}
		>
			{icon}
		</button>
	);
}

function isCaptionTextTrack(track: OverlayTrack): track is TextTrack {
	if (track.type !== "text") return false;
	return (
		track.name.includes("字幕") ||
		track.elements.some((element) =>
			element.name.toLowerCase().startsWith("caption"),
		)
	);
}

function readTextContent({ element }: { element: TextElement }): string {
	const value = element.params.content;
	return typeof value === "string" ? value : "";
}

function getCaptionRuns({
	element,
	content,
}: {
	element: TextElement;
	content: string;
}): RichTextRun[] | undefined {
	return getCaptionRunsForEditing({ element, content });
}

function getCaptionRunsForEditing({
	element,
	content,
}: {
	element: TextElement;
	content: string;
}): RichTextRun[] {
	const storedRunsValue = element.params[RICH_TEXT_RUNS_PARAM];
	const hasStoredRuns =
		typeof storedRunsValue === "string" && Boolean(storedRunsValue.trim());
	const parsedRuns = hasStoredRuns
		? parseRichTextRunsParam({ value: storedRunsValue, content })
		: undefined;
	const baseStyle = resolveCaptionBaseStyle({
		element,
		runs: parsedRuns,
	});
	const sourceRuns =
		parsedRuns ?? buildUniformRichTextRuns({ content, style: {} });

	return sourceRuns.map((run) => ({
		...run,
		style: {
			...baseStyle,
			...run.style,
		},
	}));
}

function resolveCaptionBaseStyle({
	element,
	runs,
}: {
	element: TextElement;
	runs: RichTextRun[] | undefined;
}): RichTextRunStyle {
	const elementStyle = elementParamsToRichTextStyle({ element });
	const explicitBaseRun = runs?.find(
		(run) => !run.isHighlight && hasExplicitVisualStyle({ style: run.style }),
	);
	if (explicitBaseRun) {
		return {
			...elementStyle,
			...explicitBaseRun.style,
		};
	}
	if (runs?.some((run) => run.isHighlight)) {
		return {
			...elementStyle,
			color: DEFAULT_CAPTION_BASE_STYLE.color,
			outlineColor: DEFAULT_CAPTION_BASE_STYLE.outlineColor,
		};
	}
	return elementStyle;
}

function hasExplicitVisualStyle({ style }: { style: RichTextRunStyle }) {
	return Boolean(
		style.color ||
		style.outlineColor ||
		typeof style.outlineWidth === "number" ||
		style.fontFamily ||
		typeof style.fontSize === "number",
	);
}

function elementStyleToRichTextStyle({
	element,
}: {
	element: TextElement;
}): RichTextRunStyle {
	const content = readTextContent({ element });
	return getCaptionRunsForEditing({ element, content })[0]?.style ?? {};
}

function elementParamsToRichTextStyle({
	element,
}: {
	element: TextElement;
}): RichTextRunStyle {
	return {
		fontFamily:
			typeof element.params.fontFamily === "string"
				? element.params.fontFamily
				: DEFAULT_CAPTION_BASE_STYLE.fontFamily,
		fontSize:
			typeof element.params.fontSize === "number"
				? element.params.fontSize
				: DEFAULT_CAPTION_BASE_STYLE.fontSize,
		color:
			typeof element.params.color === "string"
				? element.params.color
				: DEFAULT_CAPTION_BASE_STYLE.color,
		fontWeight:
			element.params.fontWeight === "normal"
				? "normal"
				: DEFAULT_CAPTION_BASE_STYLE.fontWeight,
		fontStyle:
			element.params.fontStyle === "italic"
				? "italic"
				: DEFAULT_CAPTION_BASE_STYLE.fontStyle,
		textAlign:
			element.params.textAlign === "left" ||
			element.params.textAlign === "right"
				? element.params.textAlign
				: DEFAULT_CAPTION_BASE_STYLE.textAlign,
		outlineColor:
			typeof element.params["stroke.color"] === "string"
				? element.params["stroke.color"]
				: DEFAULT_CAPTION_BASE_STYLE.outlineColor,
		outlineWidth:
			typeof element.params["stroke.width"] === "number"
				? element.params["stroke.width"]
				: DEFAULT_CAPTION_BASE_STYLE.outlineWidth,
	};
}

function richTextStyleToElementParams({
	style,
}: {
	style: RichTextRunStyle;
}): Record<string, string | number | boolean> {
	return {
		fontFamily: style.fontFamily ?? "MFChuangJiHei",
		fontSize: style.fontSize ?? 3.5,
		color: style.color ?? "#ffffff",
		fontWeight: style.fontWeight ?? "bold",
		fontStyle: style.fontStyle ?? "normal",
		textAlign: style.textAlign ?? "center",
		"stroke.color": style.outlineColor ?? "#000000",
		"stroke.width": style.outlineWidth ?? 0,
	};
}

function findMatchingSubtitlePreset({
	style,
}: {
	style: RichTextRunStyle;
}): SubtitleStylePreset | undefined {
	return SUBTITLE_STYLE_PRESETS.find((preset) => {
		const presetStyle = preset.style;
		return (
			normalizeHexColor({ color: presetStyle.color }) ===
				normalizeHexColor({ color: style.color }) &&
			normalizeHexColor({ color: presetStyle.outlineColor }) ===
				normalizeHexColor({ color: style.outlineColor }) &&
			areNumbersClose({
				left: presetStyle.outlineWidth,
				right: style.outlineWidth,
				tolerance: 0.02,
			})
		);
	});
}

function normalizeHexColor({ color }: { color: string | undefined }) {
	return color?.trim().toLowerCase();
}

function areNumbersClose({
	left,
	right,
	tolerance,
}: {
	left: number | undefined;
	right: number | undefined;
	tolerance: number;
}) {
	return Math.abs((left ?? 0) - (right ?? 0)) <= tolerance;
}

function buildCurrentSubtitleStyle({
	preset,
	fontFamily,
	fontSize,
	isBold,
	isItalic,
	textAlign,
}: {
	preset: SubtitleStylePreset;
	fontFamily: string;
	fontSize: number;
	isBold: boolean;
	isItalic: boolean;
	textAlign: TextAlign;
}): RichTextRunStyle {
	return {
		...preset.style,
		fontFamily,
		fontSize: fontSize || preset.style.fontSize || 3.5,
		fontWeight: isBold ? "bold" : "normal",
		fontStyle: isItalic ? "italic" : "normal",
		textAlign,
	};
}
