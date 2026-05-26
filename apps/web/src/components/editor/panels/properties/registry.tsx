import type { ReactNode } from "react";
import type {
	EffectElement,
	GraphicElement,
	ImageElement,
	MaskableElement,
	RetimableElement,
	StickerElement,
	TextElement,
	VisualElement,
	VideoElement,
	AudioElement,
	TimelineElement,
} from "@/timeline";
import type { MediaAsset } from "@/media/types";
import type { Tab as AssetPanelTab } from "@/components/editor/panels/assets/assets-panel-store";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	TextFontIcon,
	ArrowExpandIcon,
	RainDropIcon,
	MusicNote03Icon,
	MagicWand05Icon,
	DashboardSpeed02Icon,
} from "@hugeicons/core-free-icons";
import { ElementParamsTab } from "./components/element-params-tab";
import {
	ClipEffectsTab,
	StandaloneEffectTab,
} from "@/effects/components/effects-tab";
import { MasksTab } from "@/masks/components/masks-tab";
import { SpeedTab } from "@/speed/components/speed-tab";
import { GraphicTab } from "@/graphics/components/graphic-tab";
import { OcShapesIcon } from "@/components/icons";
import { editorT } from "@/i18n/editor";

const TRANSFORM_PARAM_KEYS = [
	"transform.positionX",
	"transform.positionY",
	"transform.scaleX",
	"transform.scaleY",
	"transform.rotate",
] as const;

const BLENDING_PARAM_KEYS = ["opacity", "blendMode"] as const;
const AUDIO_PARAM_KEYS = ["volume", "muted"] as const;
const TEXT_PARAM_KEYS = [
	"content",
	"fontFamily",
	"fontSize",
	"color",
	"stroke.color",
	"textAlign",
	"fontWeight",
	"fontStyle",
	"textDecoration",
	"letterSpacing",
	"lineHeight",
	"background.enabled",
	"background.color",
	"background.cornerRadius",
	"background.paddingX",
	"background.paddingY",
	"background.offsetX",
	"background.offsetY",
] as const;

export type TabContentProps = {
	trackId: string;
	trackName?: string;
};

export type PropertiesTabDef = {
	id: string;
	label: string;
	icon: ReactNode;
	content: (props: TabContentProps) => ReactNode;
};

export type ElementPropertiesConfig = {
	defaultTab: string;
	tabs: PropertiesTabDef[];
};

const DEFAULT_HIDDEN_PROPERTY_SOURCE_TABS = [
	"sounds",
	"effects",
] as const satisfies readonly AssetPanelTab[];

function getPropertyTabsForAssetTab(
	tab: AssetPanelTab | string,
): readonly string[] {
	if (tab === "sounds") return ["audio"];
	if (tab === "effects") return ["effects"];
	return [];
}

function resolveHiddenPropertyTabIds(
	hiddenAssetTabs?: readonly (AssetPanelTab | string)[],
) {
	const sourceTabs = hiddenAssetTabs ?? DEFAULT_HIDDEN_PROPERTY_SOURCE_TABS;
	return new Set(sourceTabs.flatMap(getPropertyTabsForAssetTab));
}

function filterPropertiesConfig({
	config,
	hiddenAssetTabs,
}: {
	config: ElementPropertiesConfig;
	hiddenAssetTabs?: readonly (AssetPanelTab | string)[];
}): ElementPropertiesConfig {
	const hiddenTabIds = resolveHiddenPropertyTabIds(hiddenAssetTabs);
	if (hiddenTabIds.size === 0) return config;

	const tabs = config.tabs.filter((tab) => !hiddenTabIds.has(tab.id));
	return {
		defaultTab: tabs.some((tab) => tab.id === config.defaultTab)
			? config.defaultTab
			: (tabs[0]?.id ?? config.defaultTab),
		tabs,
	};
}

function buildTransformTab({
	element,
}: {
	element: VisualElement;
}): PropertiesTabDef {
	return {
		id: "transform",
		label: editorT("properties.tab.transform"),
		icon: <HugeiconsIcon icon={ArrowExpandIcon} size={16} />,
		content: ({ trackId }) => (
			<ElementParamsTab
				element={element}
				trackId={trackId}
				paramKeys={TRANSFORM_PARAM_KEYS}
				sectionKey="transform"
			/>
		),
	};
}

function buildBlendingTab({
	element,
}: {
	element: VisualElement;
}): PropertiesTabDef {
	return {
		id: "blending",
		label: editorT("properties.tab.blending"),
		icon: <HugeiconsIcon icon={RainDropIcon} size={16} />,
		content: ({ trackId }) => (
			<ElementParamsTab
				element={element}
				trackId={trackId}
				paramKeys={BLENDING_PARAM_KEYS}
				sectionKey="blending"
			/>
		),
	};
}

function buildAudioTab({
	element,
}: {
	element: AudioElement | VideoElement;
}): PropertiesTabDef {
	return {
		id: "audio",
		label: editorT("properties.tab.audio"),
		icon: <HugeiconsIcon icon={MusicNote03Icon} size={16} />,
		content: ({ trackId }) => (
			<ElementParamsTab
				element={element}
				trackId={trackId}
				paramKeys={AUDIO_PARAM_KEYS}
				sectionKey="audio"
			/>
		),
	};
}

function buildSpeedTab({
	element,
}: {
	element: RetimableElement;
}): PropertiesTabDef {
	return {
		id: "speed",
		label: editorT("properties.tab.speed"),
		icon: <HugeiconsIcon icon={DashboardSpeed02Icon} size={16} />,
		content: ({ trackId }) => <SpeedTab element={element} trackId={trackId} />,
	};
}

function buildMasksTab({
	element,
}: {
	element: MaskableElement;
}): PropertiesTabDef {
	return {
		id: "masks",
		label: editorT("properties.tab.masks"),
		icon: <OcShapesIcon size={16} />,
		content: ({ trackId }) => <MasksTab element={element} trackId={trackId} />,
	};
}

function buildClipEffectsTab({
	element,
}: {
	element: VisualElement;
}): PropertiesTabDef {
	return {
		id: "effects",
		label: editorT("properties.tab.effects"),
		icon: <HugeiconsIcon icon={MagicWand05Icon} size={16} />,
		content: ({ trackId }) => (
			<ClipEffectsTab element={element} trackId={trackId} />
		),
	};
}

function buildTextTab({ element }: { element: TextElement }): PropertiesTabDef {
	return {
		id: "text",
		label: editorT("properties.tab.text"),
		icon: <HugeiconsIcon icon={TextFontIcon} size={16} />,
		content: ({ trackId, trackName }) => (
			<ElementParamsTab
				element={element}
				trackId={trackId}
				trackName={trackName}
				paramKeys={TEXT_PARAM_KEYS}
				sectionKey="text"
			/>
		),
	};
}

function buildGraphicTab({
	element,
}: {
	element: GraphicElement;
}): PropertiesTabDef {
	return {
		id: "graphic",
		label: editorT("properties.tab.graphic"),
		icon: <OcShapesIcon size={16} />,
		content: ({ trackId }) => (
			<GraphicTab element={element} trackId={trackId} />
		),
	};
}

function buildStandaloneEffectTab({
	element,
}: {
	element: EffectElement;
}): PropertiesTabDef {
	return {
		id: "effects",
		label: editorT("properties.tab.effects"),
		icon: <HugeiconsIcon icon={MagicWand05Icon} size={16} />,
		content: ({ trackId }) => (
			<StandaloneEffectTab element={element} trackId={trackId} />
		),
	};
}

function getTextConfig({
	element,
}: {
	element: TextElement;
}): ElementPropertiesConfig {
	return {
		defaultTab: "text",
		tabs: [
			buildTextTab({ element }),
			buildTransformTab({ element }),
			buildBlendingTab({ element }),
		],
	};
}

function getVideoConfig({
	element,
	mediaAsset,
}: {
	element: VideoElement;
	mediaAsset: MediaAsset | undefined;
}): ElementPropertiesConfig {
	const showAudioTab = mediaAsset?.hasAudio !== false;
	return {
		defaultTab: "transform",
		tabs: [
			buildTransformTab({ element }),
			...(showAudioTab ? [buildAudioTab({ element })] : []),
			buildSpeedTab({ element }),
			buildBlendingTab({ element }),
			buildMasksTab({ element }),
			buildClipEffectsTab({ element }),
		],
	};
}

function getImageConfig({
	element,
}: {
	element: ImageElement;
}): ElementPropertiesConfig {
	return {
		defaultTab: "transform",
		tabs: [
			buildTransformTab({ element }),
			buildBlendingTab({ element }),
			buildMasksTab({ element }),
			buildClipEffectsTab({ element }),
		],
	};
}

function getStickerConfig({
	element,
}: {
	element: StickerElement;
}): ElementPropertiesConfig {
	return {
		defaultTab: "transform",
		tabs: [
			buildTransformTab({ element }),
			buildBlendingTab({ element }),
			buildClipEffectsTab({ element }),
		],
	};
}

function getGraphicConfig({
	element,
}: {
	element: GraphicElement;
}): ElementPropertiesConfig {
	return {
		defaultTab: "graphic",
		tabs: [
			buildGraphicTab({ element }),
			buildTransformTab({ element }),
			buildBlendingTab({ element }),
			buildMasksTab({ element }),
			buildClipEffectsTab({ element }),
		],
	};
}

function getAudioConfig({
	element,
}: {
	element: AudioElement;
}): ElementPropertiesConfig {
	return {
		defaultTab: "audio",
		tabs: [buildAudioTab({ element }), buildSpeedTab({ element })],
	};
}

function getEffectConfig({
	element,
}: {
	element: EffectElement;
}): ElementPropertiesConfig {
	return {
		defaultTab: "effects",
		tabs: [buildStandaloneEffectTab({ element })],
	};
}

export function getPropertiesConfig({
	element,
	mediaAssets,
	hiddenAssetTabs,
}: {
	element: TimelineElement;
	mediaAssets: MediaAsset[];
	hiddenAssetTabs?: readonly (AssetPanelTab | string)[];
}): ElementPropertiesConfig {
	let config: ElementPropertiesConfig;

	switch (element.type) {
		case "text":
			config = getTextConfig({ element });
			break;
		case "video": {
			const mediaAsset = mediaAssets.find((a) => a.id === element.mediaId);
			config = getVideoConfig({ element, mediaAsset });
			break;
		}
		case "image":
			config = getImageConfig({ element });
			break;
		case "sticker":
			config = getStickerConfig({ element });
			break;
		case "graphic":
			config = getGraphicConfig({ element });
			break;
		case "audio":
			config = getAudioConfig({ element });
			break;
		case "effect":
			config = getEffectConfig({ element });
			break;
	}

	return filterPropertiesConfig({ config, hiddenAssetTabs });
}
