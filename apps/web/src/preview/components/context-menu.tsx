"use client";

import {
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { usePreviewViewport } from "@/preview/components/preview-viewport";
import { useEditor } from "@/editor/use-editor";
import type { PreviewOverlayControl } from "@/preview/overlays";
import { toast } from "sonner";
import { editorT } from "@/i18n/editor";

export function PreviewContextMenu({
	onToggleFullscreen,
	container,
	overlayControls,
	onOverlayVisibilityChange,
}: {
	onToggleFullscreen: () => void;
	container: HTMLElement | null;
	overlayControls: PreviewOverlayControl[];
	onOverlayVisibilityChange: (params: {
		overlayId: string;
		isVisible: boolean;
	}) => void;
}) {
	const editor = useEditor();
	const viewport = usePreviewViewport();

	const handleCopySnapshot = async () => {
		const result = await editor.renderer.copySnapshot();

		if (!result.success) {
			toast.error(editorT("preview.copySnapshotError"), {
				description: result.error ?? editorT("common.retryLater"),
			});
			return;
		}
	};

	const handleSaveSnapshot = async () => {
		const result = await editor.renderer.saveSnapshot();

		if (!result.success) {
			toast.error(editorT("preview.saveSnapshotError"), {
				description: result.error ?? editorT("common.retryLater"),
			});
			return;
		}
	};

	return (
		<ContextMenuContent className="w-56" container={container}>
			<ContextMenuItem onClick={viewport.fitToScreen} inset>
				{editorT("preview.fit")}
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem onClick={onToggleFullscreen} inset>
				{editorT("preview.fullscreen")}
			</ContextMenuItem>
			<ContextMenuItem onClick={handleSaveSnapshot} inset>
				{editorT("preview.saveSnapshot")}
			</ContextMenuItem>
			<ContextMenuItem onClick={handleCopySnapshot} inset>
				{editorT("preview.copySnapshot")}
			</ContextMenuItem>
			{overlayControls.length > 0 ? <ContextMenuSeparator /> : null}
			{overlayControls.map((overlayControl) => (
				<ContextMenuCheckboxItem
					key={overlayControl.id}
					checked={overlayControl.isVisible}
					onCheckedChange={(checked) =>
						onOverlayVisibilityChange({
							overlayId: overlayControl.id,
							isVisible: !!checked,
						})
					}
				>
					{overlayControl.label}
				</ContextMenuCheckboxItem>
			))}
		</ContextMenuContent>
	);
}
