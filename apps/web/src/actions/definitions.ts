import type { ShortcutKey } from "@/actions/keybinding";
import { editorT } from "@/i18n/editor";
import type { TActionWithOptionalArgs } from "./types";

export type TActionCategory =
	| "playback"
	| "navigation"
	| "editing"
	| "selection"
	| "history"
	| "timeline"
	| "controls"
	| "assets";

export interface TActionBaseDefinition {
	description: string;
	category: TActionCategory;
	args?: Record<string, unknown>;
}

export interface TActionDefinition extends TActionBaseDefinition {
	defaultShortcuts?: readonly ShortcutKey[];
}

export const ACTIONS = {
	"toggle-play": {
		description: editorT("actions.toggle-play"),
		category: "playback",
	},
	"stop-playback": {
		description: editorT("actions.stop-playback"),
		category: "playback",
	},
	"seek-forward": {
		description: editorT("actions.seek-forward"),
		category: "playback",
		args: { seconds: "number" },
	},
	"seek-backward": {
		description: editorT("actions.seek-backward"),
		category: "playback",
		args: { seconds: "number" },
	},
	"frame-step-forward": {
		description: editorT("actions.frame-step-forward"),
		category: "navigation",
	},
	"frame-step-backward": {
		description: editorT("actions.frame-step-backward"),
		category: "navigation",
	},
	"jump-forward": {
		description: editorT("actions.jump-forward"),
		category: "navigation",
		args: { seconds: "number" },
	},
	"jump-backward": {
		description: editorT("actions.jump-backward"),
		category: "navigation",
		args: { seconds: "number" },
	},
	"goto-start": {
		description: editorT("actions.goto-start"),
		category: "navigation",
	},
	"goto-end": {
		description: editorT("actions.goto-end"),
		category: "navigation",
	},
	split: {
		description: editorT("actions.split"),
		category: "editing",
	},
	"split-left": {
		description: editorT("actions.split-left"),
		category: "editing",
	},
	"split-right": {
		description: editorT("actions.split-right"),
		category: "editing",
	},
	"delete-selected": {
		description: editorT("actions.delete-selected"),
		category: "editing",
	},
	"copy-selected": {
		description: editorT("actions.copy-selected"),
		category: "editing",
	},
	"paste-copied": {
		description: editorT("actions.paste-copied"),
		category: "editing",
	},
	"toggle-snapping": {
		description: editorT("actions.toggle-snapping"),
		category: "editing",
	},
	"toggle-ripple-editing": {
		description: editorT("actions.toggle-ripple-editing"),
		category: "editing",
	},
	"toggle-source-audio": {
		description: editorT("actions.toggle-source-audio"),
		category: "editing",
	},
	"select-all": {
		description: editorT("actions.select-all"),
		category: "selection",
	},
	"cancel-interaction": {
		description: editorT("actions.cancel-interaction"),
		category: "controls",
	},
	"deselect-all": {
		description: editorT("actions.deselect-all"),
		category: "selection",
	},
	"duplicate-selected": {
		description: editorT("actions.duplicate-selected"),
		category: "selection",
	},
	"toggle-elements-muted-selected": {
		description: editorT("actions.toggle-elements-muted-selected"),
		category: "selection",
	},
	"toggle-elements-visibility-selected": {
		description: editorT("actions.toggle-elements-visibility-selected"),
		category: "selection",
	},
	"toggle-bookmark": {
		description: editorT("actions.toggle-bookmark"),
		category: "timeline",
	},
	undo: {
		description: editorT("actions.undo"),
		category: "history",
	},
	redo: {
		description: editorT("actions.redo"),
		category: "history",
	},
	"remove-media-asset": {
		description: editorT("actions.remove-media-asset"),
		category: "assets",
		args: { projectId: "string", assetId: "string" },
	},
	"remove-media-assets": {
		description: editorT("actions.remove-media-assets"),
		category: "assets",
		args: { projectId: "string", assetIds: "string[]" },
	},
} as const satisfies Record<string, TActionBaseDefinition>;

export type TAction = keyof typeof ACTIONS;

const ACTIONS_REQUIRING_ARGS = new Set<string>([
	"remove-media-asset",
	"remove-media-assets",
]);

export function isActionWithOptionalArgs(
	value: string,
): value is TActionWithOptionalArgs {
	return value in ACTIONS && !ACTIONS_REQUIRING_ARGS.has(value);
}

const ACTION_DEFAULT_SHORTCUTS = [
	["toggle-play", ["space", "k"]],
	["seek-forward", ["l"]],
	["seek-backward", ["j"]],
	["frame-step-forward", ["right"]],
	["frame-step-backward", ["left"]],
	["jump-forward", ["shift+right"]],
	["jump-backward", ["shift+left"]],
	["goto-start", ["home", "enter"]],
	["goto-end", ["end"]],
	["split", ["s"]],
	["split-left", ["q"]],
	["split-right", ["w"]],
	["delete-selected", ["backspace", "delete"]],
	["copy-selected", ["ctrl+c"]],
	["paste-copied", ["ctrl+v"]],
	["toggle-snapping", ["n"]],
	["select-all", ["ctrl+a"]],
	["cancel-interaction", ["escape"]],
	["duplicate-selected", ["ctrl+d"]],
	["undo", ["ctrl+z"]],
	["redo", ["ctrl+shift+z", "ctrl+y"]],
] as const satisfies ReadonlyArray<
	readonly [TActionWithOptionalArgs, readonly ShortcutKey[]]
>;

const ACTION_DEFAULT_SHORTCUTS_BY_ACTION = new Map<
	TAction,
	readonly ShortcutKey[]
>(ACTION_DEFAULT_SHORTCUTS);

export function getActionDefinition({
	action,
}: {
	action: TAction;
}): TActionDefinition {
	return {
		...ACTIONS[action],
		defaultShortcuts: ACTION_DEFAULT_SHORTCUTS_BY_ACTION.get(action),
	};
}

export function getDefaultShortcuts(): Map<
	ShortcutKey,
	TActionWithOptionalArgs
> {
	const shortcuts = new Map<ShortcutKey, TActionWithOptionalArgs>();

	for (const [action, defaultShortcuts] of ACTION_DEFAULT_SHORTCUTS) {
		for (const shortcut of defaultShortcuts) {
			shortcuts.set(shortcut, action);
		}
	}

	return shortcuts;
}
