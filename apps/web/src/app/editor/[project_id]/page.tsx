"use client";

import { useParams } from "next/navigation";
import {
	ResizablePanelGroup,
	ResizablePanel,
	ResizableHandle,
} from "@/components/ui/resizable";
import { AssetsPanel } from "@/components/editor/panels/assets";
import type { Tab } from "@/components/editor/panels/assets/assets-panel-store";
import { PropertiesPanel } from "@/components/editor/panels/properties";
import { Timeline } from "@/timeline/components";
import { PreviewPanel } from "@/preview/components";
import { EditorHeader } from "@/components/editor/editor-header";
import { ExportButton } from "@/components/editor/export-button";
import { EditorProvider } from "@/components/providers/editor-provider";
import { Onboarding } from "@/components/editor/onboarding";
import { MigrationDialog } from "@/project/components/migration-dialog";
import { usePanelStore } from "@/editor/panel-store";
import type { PanelId, PanelSizes } from "@/editor/panel-store";
import { usePasteMedia } from "@/media/use-paste-media";
import { MobileGate } from "@/components/editor/mobile-gate";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useEditor } from "@/editor/use-editor";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { ChangelogNotification } from "@/changelog/components/changelog-notification";
import {
	createPreviewOverlayControl,
	isPreviewOverlayVisible,
	mergePreviewOverlaySources,
} from "@/preview/overlays";
import { usePreviewStore } from "@/preview/preview-store";
import { getGuidePreviewOverlaySource } from "@/guides";
import {
	bookmarkNotesPreviewOverlay,
	getBookmarkPreviewOverlaySource,
} from "@/timeline/bookmarks/index";
import { cn } from "@/utils/ui";
import {
	LayoutPanelTopIcon,
	PanelRightIcon,
	type LucideIcon,
} from "lucide-react";

export type EditorLayoutMode = "vertical-preview" | "classic";

const EDITOR_LAYOUT_MODE_STORAGE_KEY = "opencut:editor-layout-mode";

function isEditorLayoutMode(value: unknown): value is EditorLayoutMode {
	return value === "vertical-preview" || value === "classic";
}

function clampPanelSize({
	value,
	min,
	max,
}: {
	value: number;
	min: number;
	max: number;
}) {
	return Math.min(max, Math.max(min, value));
}

export default function Editor() {
	const params = useParams();
	const projectId = params.project_id as string;

	return <EditorWorkspace projectId={projectId} />;
}

export function EditorWorkspace({
	projectId,
	isEmbedded = false,
	hideHeader = false,
	hiddenAssetTabs,
	defaultLayoutMode = "classic",
	layoutModeStorageKey = EDITOR_LAYOUT_MODE_STORAGE_KEY,
}: {
	projectId: string;
	isEmbedded?: boolean;
	hideHeader?: boolean;
	hiddenAssetTabs?: readonly Tab[];
	defaultLayoutMode?: EditorLayoutMode;
	layoutModeStorageKey?: string;
}) {
	const [layoutMode, setLayoutMode] = useEditorLayoutMode({
		defaultLayoutMode,
		layoutModeStorageKey,
	});
	const layoutModeSwitch = (
		<EditorLayoutModeSwitch value={layoutMode} onChange={setLayoutMode} />
	);

	return (
		<MobileGate>
			<EditorProvider projectId={projectId} isEmbedded={isEmbedded}>
				<div
					className={cn(
						"bg-background flex h-screen w-screen flex-col overflow-hidden",
						isEmbedded && "opencut-embedded-shell",
					)}
				>
					<DegradedRendererBanner />
					{!hideHeader ? (
						<EditorHeader
							isEmbedded={isEmbedded}
							layoutModeSwitch={layoutModeSwitch}
						/>
					) : null}
					{isEmbedded && hideHeader ? <HiddenEmbeddedExportButton /> : null}
					<div className="min-h-0 min-w-0 flex-1">
						<EditorLayout
							hiddenAssetTabs={hiddenAssetTabs}
							layoutMode={layoutMode}
						/>
					</div>
					{isEmbedded ? <EmbedReadyBridge projectId={projectId} /> : null}
					{isEmbedded ? (
						<EmbedCommandBridge
							layoutMode={layoutMode}
							onLayoutModeChange={setLayoutMode}
						/>
					) : null}
					{!isEmbedded ? <Onboarding /> : null}
					<MigrationDialog />
					{!isEmbedded ? <ChangelogNotification /> : null}
				</div>
			</EditorProvider>
		</MobileGate>
	);
}

export function MakeSameEditorWorkspace({
	projectId,
	isEmbedded = true,
	makeSameId,
	hideHeader = false,
	hiddenAssetTabs,
	defaultLayoutMode = "vertical-preview",
	layoutModeStorageKey,
}: {
	projectId: string;
	isEmbedded?: boolean;
	makeSameId?: string;
	hideHeader?: boolean;
	hiddenAssetTabs?: readonly Tab[];
	defaultLayoutMode?: EditorLayoutMode;
	layoutModeStorageKey?: string;
}) {
	const [layoutMode, setLayoutMode] = useEditorLayoutMode({
		defaultLayoutMode,
		layoutModeStorageKey,
	});
	const layoutModeSwitch = (
		<EditorLayoutModeSwitch value={layoutMode} onChange={setLayoutMode} />
	);

	return (
		<MobileGate>
			<EditorProvider projectId={projectId} isEmbedded={isEmbedded}>
				<div
					className={cn(
						"bg-background flex h-screen w-screen flex-col overflow-hidden",
						isEmbedded && "opencut-embedded-shell",
					)}
				>
					<DegradedRendererBanner />
					{!hideHeader ? (
						<EditorHeader
							isEmbedded={isEmbedded}
							layoutModeSwitch={layoutModeSwitch}
						/>
					) : null}
					{isEmbedded && hideHeader ? <HiddenEmbeddedExportButton /> : null}
					<div className="min-h-0 min-w-0 flex-1">
						<EditorLayout
							hiddenAssetTabs={hiddenAssetTabs}
							layoutMode={layoutMode}
						/>
					</div>
					{isEmbedded ? (
						<EmbedReadyBridge projectId={makeSameId ?? projectId} />
					) : null}
					{isEmbedded ? (
						<EmbedCommandBridge
							layoutMode={layoutMode}
							onLayoutModeChange={setLayoutMode}
						/>
					) : null}
					<MigrationDialog />
				</div>
			</EditorProvider>
		</MobileGate>
	);
}

function HiddenEmbeddedExportButton() {
	return (
		<div className="pointer-events-none fixed top-3 right-3 z-50 opacity-0">
			<ExportButton isEmbedded />
		</div>
	);
}

function EmbedReadyBridge({ projectId }: { projectId: string }) {
	useEffect(() => {
		if (typeof window === "undefined" || window.parent === window) return;
		window.parent.postMessage(
			{ source: "opencut", type: "editor-ready", projectId },
			"*",
		);
	}, [projectId]);

	return null;
}

function EmbedCommandBridge({
	layoutMode,
	onLayoutModeChange,
}: {
	layoutMode: EditorLayoutMode;
	onLayoutModeChange: (value: EditorLayoutMode) => void;
}) {
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const data = event.data as
				| { source?: string; type?: string; layoutMode?: unknown }
				| null
				| undefined;

			if (data?.source !== "neo-web") {
				return;
			}

			if (data.type === "trigger-export") {
				document
					.querySelector<HTMLButtonElement>(
						'button[data-opencut-export-trigger="true"]',
					)
					?.click();
				return;
			}

			if (
				data.type === "set-layout-mode" &&
				isEditorLayoutMode(data.layoutMode)
			) {
				onLayoutModeChange(data.layoutMode);
			}
		};

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [onLayoutModeChange]);

	useEffect(() => {
		if (typeof window === "undefined" || window.parent === window) return;
		window.parent.postMessage(
			{ source: "opencut", type: "layout-mode-changed", layoutMode },
			"*",
		);
	}, [layoutMode]);

	return null;
}

function DegradedRendererBanner() {
	const isDegraded = useEditor((e) => e.renderer.isDegraded);
	const [dismissed, setDismissed] = useState(false);
	if (!isDegraded || dismissed) return null;

	return (
		<div className="bg-accent border-b h-9 flex items-center justify-center gap-2 text-xs text-muted-foreground">
			<span>为了获得最佳剪辑体验，建议使用 Chrome 打开。</span>
			<Button
				variant="text"
				size="icon"
				className="p-0 w-auto [&_svg]:size-3.5"
				onClick={() => setDismissed(true)}
				aria-label="关闭提示"
			>
				<HugeiconsIcon icon={Cancel01Icon} />
			</Button>
		</div>
	);
}

function EditorLayout({
	hiddenAssetTabs,
	layoutMode,
}: {
	hiddenAssetTabs?: readonly Tab[];
	layoutMode: EditorLayoutMode;
}) {
	usePasteMedia();
	const { panels, setPanel } = usePanelStore();
	const activeScene = useEditor((editor) =>
		editor.scenes.getActiveSceneOrNull(),
	);
	const currentTime = useEditor((editor) => editor.playback.getCurrentTime());
	const activeGuide = usePreviewStore((state) => state.activeGuide);
	const overlays = usePreviewStore((state) => state.overlays);
	const setOverlayVisibility = usePreviewStore(
		(state) => state.setOverlayVisibility,
	);
	const showBookmarkNotes = isPreviewOverlayVisible({
		overlay: bookmarkNotesPreviewOverlay,
		overlays,
	});

	const overlaySource = useMemo(
		() =>
			mergePreviewOverlaySources({
				sources: [
					getGuidePreviewOverlaySource({
						guideId: activeGuide,
					}),
					activeScene
						? getBookmarkPreviewOverlaySource({
								bookmarks: activeScene.bookmarks,
								time: currentTime,
								isVisible: showBookmarkNotes,
							})
						: {
								definitions: [bookmarkNotesPreviewOverlay],
								instances: [],
							},
				],
			}),
		[activeGuide, activeScene, currentTime, showBookmarkNotes],
	);

	const overlayControls = useMemo(
		() =>
			overlaySource.definitions.map((overlay) =>
				createPreviewOverlayControl({ overlay, overlays }),
			),
		[overlaySource.definitions, overlays],
	);

	const previewPanel = (
		<PreviewPanel
			overlayControls={overlayControls}
			overlayInstances={overlaySource.instances}
			onOverlayVisibilityChange={setOverlayVisibility}
		/>
	);

	return (
		<div className="relative size-full">
			{layoutMode === "vertical-preview" ? (
				<VerticalPreviewEditorLayout
					hiddenAssetTabs={hiddenAssetTabs}
					panels={panels}
					setPanel={setPanel}
					previewPanel={previewPanel}
				/>
			) : (
				<ClassicEditorLayout
					hiddenAssetTabs={hiddenAssetTabs}
					panels={panels}
					setPanel={setPanel}
					previewPanel={previewPanel}
				/>
			)}
		</div>
	);
}

function useEditorLayoutMode({
	defaultLayoutMode,
	layoutModeStorageKey,
}: {
	defaultLayoutMode: EditorLayoutMode;
	layoutModeStorageKey?: string;
}) {
	const [layoutMode, setLayoutMode] = useState<EditorLayoutMode>(() => {
		if (typeof window === "undefined" || !layoutModeStorageKey) {
			return defaultLayoutMode;
		}
		const storedMode = window.localStorage.getItem(layoutModeStorageKey);
		return isEditorLayoutMode(storedMode) ? storedMode : defaultLayoutMode;
	});

	useEffect(() => {
		if (!layoutModeStorageKey) return;
		window.localStorage.setItem(layoutModeStorageKey, layoutMode);
	}, [layoutMode, layoutModeStorageKey]);

	return [layoutMode, setLayoutMode] as const;
}

function EditorLayoutModeSwitch({
	value,
	onChange,
}: {
	value: EditorLayoutMode;
	onChange: (value: EditorLayoutMode) => void;
}) {
	const options: Array<{
		value: EditorLayoutMode;
		label: string;
		icon: LucideIcon;
	}> = [
		{ value: "vertical-preview", label: "竖版", icon: PanelRightIcon },
		{ value: "classic", label: "常规", icon: LayoutPanelTopIcon },
	];

	return (
		<div className="bg-muted/70 border-border/70 flex items-center gap-1 rounded-md border p-1 shadow-sm shadow-black/10 backdrop-blur">
			{options.map((option) => {
				const Icon = option.icon;
				const isActive = option.value === value;
				return (
					<button
						key={option.value}
						type="button"
						onClick={() => onChange(option.value)}
						className={cn(
							"flex h-7 cursor-pointer items-center gap-1.5 rounded-sm px-2 text-xs font-medium transition-colors",
							isActive
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:bg-accent hover:text-foreground",
						)}
						aria-pressed={isActive}
						title={`切换到${option.label}布局`}
					>
						<Icon className="size-3.5" />
						<span>{option.label}</span>
					</button>
				);
			})}
		</div>
	);
}

function ClassicEditorLayout({
	hiddenAssetTabs,
	panels,
	setPanel,
	previewPanel,
}: {
	hiddenAssetTabs?: readonly Tab[];
	panels: PanelSizes;
	setPanel: (args: { panel: PanelId; size: number }) => void;
	previewPanel: ReactNode;
}) {
	return (
		<ResizablePanelGroup
			direction="vertical"
			className="size-full gap-[0.18rem]"
			onLayout={(sizes) => {
				setPanel({
					panel: "mainContent",
					size: sizes[0] ?? panels.mainContent,
				});
				setPanel({
					panel: "timeline",
					size: sizes[1] ?? panels.timeline,
				});
			}}
		>
			<ResizablePanel
				defaultSize={panels.mainContent}
				minSize={30}
				maxSize={85}
				className="min-h-0"
			>
				<ResizablePanelGroup
					direction="horizontal"
					className="size-full gap-[0.19rem] px-3"
					onLayout={(sizes) => {
						setPanel({ panel: "tools", size: sizes[0] ?? panels.tools });
						setPanel({ panel: "preview", size: sizes[1] ?? panels.preview });
						setPanel({
							panel: "properties",
							size: sizes[2] ?? panels.properties,
						});
					}}
				>
					<ResizablePanel
						defaultSize={panels.tools}
						minSize={15}
						maxSize={40}
						className="min-w-0"
					>
						<AssetsPanel hiddenTabs={hiddenAssetTabs} />
					</ResizablePanel>

					<ResizableHandle withHandle />

					<ResizablePanel
						defaultSize={panels.preview}
						minSize={30}
						className="min-h-0 min-w-0 flex-1"
					>
						{previewPanel}
					</ResizablePanel>

					<ResizableHandle withHandle />

					<ResizablePanel
						defaultSize={panels.properties}
						minSize={15}
						maxSize={40}
						className="min-w-0"
					>
						<PropertiesPanel hiddenAssetTabs={hiddenAssetTabs} />
					</ResizablePanel>
				</ResizablePanelGroup>
			</ResizablePanel>

			<ResizableHandle withHandle />

			<ResizablePanel
				defaultSize={panels.timeline}
				minSize={15}
				maxSize={70}
				className="min-h-0 px-3 pb-3"
			>
				<Timeline />
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}

function VerticalPreviewEditorLayout({
	hiddenAssetTabs,
	panels,
	setPanel,
	previewPanel,
}: {
	hiddenAssetTabs?: readonly Tab[];
	panels: PanelSizes;
	setPanel: (args: { panel: PanelId; size: number }) => void;
	previewPanel: ReactNode;
}) {
	const topAreaSize = clampPanelSize({
		value: 100 - panels.timeline,
		min: 28,
		max: 70,
	});
	const timelineSize = 100 - topAreaSize;

	return (
		<ResizablePanelGroup
			direction="horizontal"
			className="size-full gap-[0.19rem] px-3 pb-3"
			onLayout={(sizes) => {
				setPanel({ panel: "preview", size: sizes[1] ?? panels.preview });
			}}
		>
			<ResizablePanel defaultSize={72} minSize={52} className="min-w-0">
				<ResizablePanelGroup
					direction="vertical"
					className="size-full gap-[0.18rem]"
					onLayout={(sizes) => {
						setPanel({
							panel: "mainContent",
							size: sizes[0] ?? panels.mainContent,
						});
						setPanel({
							panel: "timeline",
							size: sizes[1] ?? panels.timeline,
						});
					}}
				>
					<ResizablePanel
						defaultSize={topAreaSize}
						minSize={24}
						maxSize={70}
						className="min-h-0"
					>
						<ResizablePanelGroup
							direction="horizontal"
							className="size-full gap-[0.19rem]"
							onLayout={(sizes) => {
								setPanel({ panel: "tools", size: sizes[0] ?? panels.tools });
								setPanel({
									panel: "properties",
									size: sizes[1] ?? panels.properties,
								});
							}}
						>
							<ResizablePanel
								defaultSize={55}
								minSize={24}
								maxSize={70}
								className="min-w-0"
							>
								<AssetsPanel hiddenTabs={hiddenAssetTabs} />
							</ResizablePanel>

							<ResizableHandle withHandle />

							<ResizablePanel defaultSize={45} minSize={24} className="min-w-0">
								<PropertiesPanel hiddenAssetTabs={hiddenAssetTabs} />
							</ResizablePanel>
						</ResizablePanelGroup>
					</ResizablePanel>

					<ResizableHandle withHandle />

					<ResizablePanel
						defaultSize={timelineSize}
						minSize={30}
						maxSize={76}
						className="min-h-0"
					>
						<Timeline />
					</ResizablePanel>
				</ResizablePanelGroup>
			</ResizablePanel>

			<ResizableHandle withHandle />

			<ResizablePanel
				defaultSize={28}
				minSize={22}
				maxSize={45}
				className="min-w-[17.5rem]"
			>
				{previewPanel}
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
