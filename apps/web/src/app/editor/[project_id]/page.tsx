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
import { usePasteMedia } from "@/media/use-paste-media";
import { MobileGate } from "@/components/editor/mobile-gate";
import { useEffect, useMemo, useState } from "react";
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
}: {
	projectId: string;
	isEmbedded?: boolean;
	hideHeader?: boolean;
	hiddenAssetTabs?: readonly Tab[];
}) {
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
					{!hideHeader ? <EditorHeader isEmbedded={isEmbedded} /> : null}
					{isEmbedded && hideHeader ? <HiddenEmbeddedExportButton /> : null}
					<div className="min-h-0 min-w-0 flex-1">
						<EditorLayout hiddenAssetTabs={hiddenAssetTabs} />
					</div>
					{isEmbedded ? <EmbedReadyBridge projectId={projectId} /> : null}
					{isEmbedded ? <EmbedCommandBridge /> : null}
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
}: {
	projectId: string;
	isEmbedded?: boolean;
	makeSameId?: string;
	hideHeader?: boolean;
	hiddenAssetTabs?: readonly Tab[];
}) {
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
					{!hideHeader ? <EditorHeader isEmbedded={isEmbedded} /> : null}
					{isEmbedded && hideHeader ? <HiddenEmbeddedExportButton /> : null}
					<div className="min-h-0 min-w-0 flex-1">
						<EditorLayout hiddenAssetTabs={hiddenAssetTabs} />
					</div>
					{isEmbedded ? (
						<EmbedReadyBridge projectId={makeSameId ?? projectId} />
					) : null}
					{isEmbedded ? <EmbedCommandBridge /> : null}
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

function EmbedCommandBridge() {
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const data = event.data as
				| { source?: string; type?: string }
				| null
				| undefined;

			if (data?.source !== "neo-web" || data.type !== "trigger-export") {
				return;
			}

			document
				.querySelector<HTMLButtonElement>(
					'button[data-opencut-export-trigger="true"]',
				)
				?.click();
		};

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, []);

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
}: {
	hiddenAssetTabs?: readonly Tab[];
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
						<PreviewPanel
							overlayControls={overlayControls}
							overlayInstances={overlaySource.instances}
							onOverlayVisibilityChange={setOverlayVisibility}
						/>
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
