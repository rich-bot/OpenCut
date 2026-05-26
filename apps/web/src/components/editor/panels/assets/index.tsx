"use client";

import { Separator } from "@/components/ui/separator";
import {
	isVisibleTab,
	resolveVisibleAssetTabs,
	type Tab,
	type VisibleTab,
	useAssetsPanelStore,
} from "@/components/editor/panels/assets/assets-panel-store";
import { TabBar } from "./tabbar";
import { Captions } from "@/subtitles/components/assets-view";
import { CaptionQuickEditView } from "@/subtitles/components/quick-edit-view";
import { MediaView } from "./views/assets";
import { SettingsView } from "./views/settings";
import { SoundsView } from "@/sounds/components/assets-view";
import { StickersView } from "@/stickers/components/assets-view";
import { TextView } from "@/text/components/assets-view";

export function AssetsPanel({ hiddenTabs }: { hiddenTabs?: readonly Tab[] }) {
	const { activeTab } = useAssetsPanelStore();
	const visibleTabs = resolveVisibleAssetTabs(hiddenTabs);
	const currentTab = isVisibleTab(activeTab, visibleTabs)
		? activeTab
		: "subtitleEdit";

	const viewMap: Record<VisibleTab, React.ReactNode> = {
		media: <MediaView />,
		sounds: <SoundsView />,
		text: <TextView />,
		stickers: <StickersView />,
		subtitleEdit: <CaptionQuickEditView />,
		captions: <Captions />,
		settings: <SettingsView />,
	};

	return (
		<div className="panel bg-background flex h-full rounded-sm border overflow-hidden">
			<TabBar hiddenTabs={hiddenTabs} />
			<Separator orientation="vertical" />
			<div className="flex-1 overflow-hidden">{viewMap[currentTab]}</div>
		</div>
	);
}
