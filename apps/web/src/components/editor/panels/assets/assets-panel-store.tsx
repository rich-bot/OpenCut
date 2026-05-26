import type { ElementType } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
	ArrowRightDoubleIcon,
	Folder03Icon,
	Happy01Icon,
	HeadphonesIcon,
	MagicWand05Icon,
	SpeechToTextIcon,
	SubtitleIcon,
	TextIcon,
	Settings01Icon,
	SlidersHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

export const TAB_KEYS = [
	"subtitleEdit",
	"media",
	"sounds",
	"text",
	"stickers",
	"effects",
	"transitions",
	"captions",
	"adjustment",
	"settings",
] as const;

export type Tab = (typeof TAB_KEYS)[number];

export const VISIBLE_TAB_KEYS = [
	"subtitleEdit",
	"media",
	"sounds",
	"text",
	"stickers",
	"captions",
	"settings",
] as const satisfies readonly Tab[];

export type VisibleTab = (typeof VISIBLE_TAB_KEYS)[number];

export const DEFAULT_HIDDEN_ASSET_TAB_KEYS = [
	"sounds",
	"effects",
] as const satisfies readonly Tab[];

export function isTabKey(value: string): value is Tab {
	return (TAB_KEYS as readonly string[]).includes(value);
}

export function parseHiddenAssetTabs(
	value?: string | null,
): readonly Tab[] | undefined {
	if (value == null) return undefined;
	return value
		.split(",")
		.map((tab) => tab.trim())
		.filter(isTabKey);
}

export function resolveVisibleAssetTabs(
	hiddenTabs?: readonly (Tab | string)[],
): VisibleTab[] {
	const hidden = new Set(
		(hiddenTabs ?? DEFAULT_HIDDEN_ASSET_TAB_KEYS).filter(isTabKey),
	);
	return VISIBLE_TAB_KEYS.filter((visibleTab) => !hidden.has(visibleTab));
}

export function isVisibleTab(
	tab: Tab,
	visibleTabs: readonly Tab[] = resolveVisibleAssetTabs(),
): tab is VisibleTab {
	return visibleTabs.some((visibleTab) => visibleTab === tab);
}

const createHugeiconsIcon = ({ icon }: { icon: IconSvgElement }) => {
	const AssetPanelIcon = ({ className }: { className?: string }) => (
		<HugeiconsIcon icon={icon} className={className} />
	);
	AssetPanelIcon.displayName = "AssetPanelIcon";
	return AssetPanelIcon;
};

export const tabs = {
	media: {
		icon: createHugeiconsIcon({ icon: Folder03Icon }),
		label: "素材",
	},
	sounds: {
		icon: createHugeiconsIcon({ icon: HeadphonesIcon }),
		label: "音频",
	},
	text: {
		icon: createHugeiconsIcon({ icon: TextIcon }),
		label: "文字",
	},
	stickers: {
		icon: createHugeiconsIcon({ icon: Happy01Icon }),
		label: "贴纸",
	},
	subtitleEdit: {
		icon: createHugeiconsIcon({ icon: SubtitleIcon }),
		label: "字幕",
	},
	effects: {
		icon: createHugeiconsIcon({ icon: MagicWand05Icon }),
		label: "特效",
	},
	transitions: {
		icon: createHugeiconsIcon({ icon: ArrowRightDoubleIcon }),
		label: "转场",
	},
	captions: {
		icon: createHugeiconsIcon({ icon: SpeechToTextIcon }),
		label: "识别",
	},
	adjustment: {
		icon: createHugeiconsIcon({ icon: SlidersHorizontalIcon }),
		label: "调节",
	},
	settings: {
		icon: createHugeiconsIcon({ icon: Settings01Icon }),
		label: "设置",
	},
} satisfies Record<
	Tab,
	{ icon: ElementType<{ className?: string }>; label: string }
>;

export type MediaViewMode = "grid" | "list";
export type MediaSortKey = "name" | "type" | "duration" | "size";
export type MediaSortOrder = "asc" | "desc";

interface AssetsPanelStore {
	activeTab: Tab;
	setActiveTab: (tab: Tab) => void;
	highlightMediaId: string | null;
	requestRevealMedia: (mediaId: string) => void;
	clearHighlight: () => void;

	/* Media */
	mediaViewMode: MediaViewMode;
	setMediaViewMode: (mode: MediaViewMode) => void;
	mediaSortBy: MediaSortKey;
	mediaSortOrder: MediaSortOrder;
	setMediaSort: (args: { key: MediaSortKey; order: MediaSortOrder }) => void;
}

export const useAssetsPanelStore = create<AssetsPanelStore>()(
	persist(
		(set) => ({
			activeTab: "subtitleEdit",
			setActiveTab: (tab) =>
				set({ activeTab: isVisibleTab(tab) ? tab : "subtitleEdit" }),
			highlightMediaId: null,
			requestRevealMedia: (mediaId) =>
				set({ activeTab: "media", highlightMediaId: mediaId }),
			clearHighlight: () => set({ highlightMediaId: null }),
			mediaViewMode: "grid",
			setMediaViewMode: (mode) => set({ mediaViewMode: mode }),
			mediaSortBy: "name",
			mediaSortOrder: "asc",
			setMediaSort: ({ key, order }) =>
				set({ mediaSortBy: key, mediaSortOrder: order }),
		}),
		{
			name: "assets-panel",
			partialize: (state) => ({
				mediaViewMode: state.mediaViewMode,
				mediaSortBy: state.mediaSortBy,
				mediaSortOrder: state.mediaSortOrder,
			}),
		},
	),
);
