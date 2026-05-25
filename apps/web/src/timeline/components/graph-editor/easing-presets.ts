import type { NormalizedCubicBezier } from "@/animation/types";
import { editorT } from "@/i18n/editor";

export const PRESET_MATCH_TOLERANCE = 0.02;

export interface EasingPreset {
	id: string;
	label: string;
	value: NormalizedCubicBezier;
	isCustom?: boolean;
}

export const BUILTIN_PRESETS: EasingPreset[] = [
	{
		id: "smooth",
		label: editorT("graph.preset.smooth"),
		value: [0.25, 0.1, 0.25, 1],
	},
	{
		id: "ease-out",
		label: editorT("graph.preset.easeOut"),
		value: [0, 0, 0.2, 1],
	},
	{
		id: "ease-in",
		label: editorT("graph.preset.easeIn"),
		value: [0.8, 0, 1, 1],
	},
	{
		id: "ease-in-out",
		label: editorT("graph.preset.easeInOut"),
		value: [0.4, 0, 0.2, 1],
	},
	{
		id: "pop",
		label: editorT("graph.preset.pop"),
		value: [0.175, 0.885, 0.32, 1.275],
	},
	{ id: "linear", label: editorT("graph.preset.linear"), value: [0, 0, 1, 1] },
];
