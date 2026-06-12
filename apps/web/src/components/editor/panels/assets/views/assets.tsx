"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { MediaDragOverlay } from "@/components/editor/panels/assets/drag-overlay";
import { DraggableItem } from "@/components/editor/panels/assets/draggable-item";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { DEFAULT_NEW_ELEMENT_DURATION } from "@/timeline/creation";
import { mediaTimeFromSeconds, type MediaTime } from "@/wasm";
import { useEditor } from "@/editor/use-editor";
import { useFileUpload } from "@/media/use-file-upload";
import { invokeAction } from "@/actions";
import { processMediaAssets } from "@/media/processing";
import { showMediaUploadToast } from "@/media/upload-toast";
import {
	SelectableItem,
	SelectableSurface,
	useSelection,
	useSelectionScope,
} from "@/selection";
import { buildElementFromMedia } from "@/timeline/element-utils";
import {
	type MediaSortKey,
	type MediaSortOrder,
	type MediaViewMode,
	useAssetsPanelStore,
} from "@/components/editor/panels/assets/assets-panel-store";
import { MASKABLE_ELEMENT_TYPES } from "@/timeline";
import type { MediaAsset } from "@/media/types";
import { getOpenCutAssetProxyUrl } from "@/utils/asset-proxy";
import { cn } from "@/utils/ui";
import {
	CloudUploadIcon,
	Folder03Icon,
	GridViewIcon,
	LeftToRightListDashIcon,
	SortingOneNineIcon,
	Image02Icon,
	MusicNote03Icon,
	Video01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

const MEDIA_SORT_LABELS: Record<MediaSortKey, string> = {
	name: "名称",
	type: "类型",
	duration: "时长",
	size: "文件大小",
};

type NeoWebMaterialMediaType = "video" | "image" | "audio";

type NeoWebMaterialImportAsset = {
	id?: string | number;
	url?: string;
	name?: string;
	mediaType?: NeoWebMaterialMediaType;
	materialType?: "VIDEO" | "IMAGE" | "AUDIO" | "GROUP";
	originalName?: string;
	fileSize?: number;
	duration?: number;
	thumbnailUrl?: string;
	source?: "asset" | "group-item";
	groupId?: string | number;
	groupTitle?: string;
	segmentIndex?: number;
};

type NeoWebMaterialPickerMessage =
	| {
			source: "neo-web";
			type: "material-picker-opened";
			requestId?: string;
			projectId?: string;
	  }
	| {
			source: "neo-web";
			type: "material-picker-picked";
			requestId?: string;
			projectId?: string;
			assets?: NeoWebMaterialImportAsset[];
	  }
	| {
			source: "neo-web";
			type: "material-picker-cancelled";
			requestId?: string;
			projectId?: string;
	  };

const DEFAULT_EXTENSION_BY_MEDIA_TYPE: Record<NeoWebMaterialMediaType, string> = {
	video: "mp4",
	image: "png",
	audio: "mp3",
};

const MIME_BY_EXTENSION: Record<string, string> = {
	mp4: "video/mp4",
	webm: "video/webm",
	mov: "video/quicktime",
	m4v: "video/x-m4v",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	gif: "image/gif",
	webp: "image/webp",
	bmp: "image/bmp",
	svg: "image/svg+xml",
	mp3: "audio/mpeg",
	wav: "audio/wav",
	m4a: "audio/mp4",
	aac: "audio/aac",
	flac: "audio/flac",
	ogg: "audio/ogg",
	opus: "audio/opus",
};

const DEFAULT_MIME_BY_MEDIA_TYPE: Record<NeoWebMaterialMediaType, string> = {
	video: "video/mp4",
	image: "image/png",
	audio: "audio/mpeg",
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === "object";
}

function isNeoWebMaterialPickerMessage(
	data: unknown,
): data is NeoWebMaterialPickerMessage {
	if (!isRecord(data)) return false;
	return (
		data.source === "neo-web" &&
		(data.type === "material-picker-opened" ||
			data.type === "material-picker-picked" ||
			data.type === "material-picker-cancelled")
	);
}

function createMaterialPickerRequestId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `material-picker-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function inferMediaType(asset: NeoWebMaterialImportAsset): NeoWebMaterialMediaType {
	if (
		asset.mediaType === "video" ||
		asset.mediaType === "image" ||
		asset.mediaType === "audio"
	) {
		return asset.mediaType;
	}
	if (asset.materialType === "IMAGE") return "image";
	if (asset.materialType === "AUDIO") return "audio";
	return "video";
}

function getExtension(value?: string) {
	const cleanValue = String(value || "")
		.split("?")[0]
		.split("#")[0];
	const match = cleanValue.match(/\.([a-z0-9]+)$/i);
	return match?.[1]?.toLowerCase() || "";
}

function sanitizeFileName(value: string) {
	const withoutReservedCharacters = value
		.trim()
		.replace(/[\\/:*?"<>|]/g, "_")
		.replace(/\s+/g, " ");
	const withoutControlCharacters = Array.from(withoutReservedCharacters)
		.filter((character) => character.charCodeAt(0) >= 32)
		.join("");

	return withoutControlCharacters.slice(0, 140) || "素材";
}

function buildMaterialFileName(asset: NeoWebMaterialImportAsset) {
	const mediaType = inferMediaType(asset);
	const baseName = sanitizeFileName(
		asset.originalName || asset.name || `素材-${asset.id ?? Date.now()}`,
	);
	const existingExtension = getExtension(baseName);
	if (existingExtension) return baseName;

	const urlExtension = getExtension(asset.url);
	const extension = urlExtension || DEFAULT_EXTENSION_BY_MEDIA_TYPE[mediaType];
	return `${baseName}.${extension}`;
}

function inferMimeType(asset: NeoWebMaterialImportAsset) {
	const mediaType = inferMediaType(asset);
	const extension =
		getExtension(asset.originalName) ||
		getExtension(asset.name) ||
		getExtension(asset.url);
	return (
		MIME_BY_EXTENSION[extension] || DEFAULT_MIME_BY_MEDIA_TYPE[mediaType]
	);
}

function isUsableBlobType({
	blobType,
	mediaType,
}: {
	blobType: string;
	mediaType: NeoWebMaterialMediaType;
}) {
	return blobType.toLowerCase().startsWith(`${mediaType}/`);
}

async function fetchMaterialAssetFile(asset: NeoWebMaterialImportAsset) {
	const url = String(asset.url || "").trim();
	if (!url) {
		throw new Error("素材缺少下载地址");
	}

	const response = await fetch(getOpenCutAssetProxyUrl({ url }), {
		cache: "force-cache",
	});
	if (!response.ok) {
		throw new Error(`下载失败：${response.status}`);
	}

	const blob = await response.blob();
	const mediaType = inferMediaType(asset);
	const blobType = blob.type || "";
	const fileType = isUsableBlobType({ blobType, mediaType })
		? blobType
		: inferMimeType(asset);

	return new File([blob], buildMaterialFileName(asset), {
		type: fileType,
		lastModified: Date.now(),
	});
}

export function MediaView() {
	const editor = useEditor();
	const mediaFiles = useEditor((e) => e.media.getAssets());
	const activeProject = useEditor((e) => e.project.getActive());

	const {
		mediaViewMode,
		setMediaViewMode,
		highlightMediaId,
		clearHighlight,
		mediaSortBy,
		mediaSortOrder,
		setMediaSort,
	} = useAssetsPanelStore();

	const [isProcessing, setIsProcessing] = useState(false);
	const [isImportingFromMaterialCenter, setIsImportingFromMaterialCenter] =
		useState(false);
	const [pendingMaterialRequestId, setPendingMaterialRequestId] = useState<
		string | null
	>(null);
	const [isMaterialPickerOpened, setIsMaterialPickerOpened] = useState(false);
	const pendingMaterialRequestIdRef = useRef<string | null>(null);
	const [progress, setProgress] = useState(0);
	const isMediaActionDisabled =
		isProcessing || isImportingFromMaterialCenter || !!pendingMaterialRequestId;

	const clearPendingMaterialRequest = useCallback(() => {
		pendingMaterialRequestIdRef.current = null;
		setPendingMaterialRequestId(null);
		setIsMaterialPickerOpened(false);
	}, []);

	const processFiles = useCallback(async ({ files }: { files: File[] }) => {
		if (!files || files.length === 0) return;
		if (!activeProject) {
			toast.error("当前没有打开的项目");
			return;
		}

		setIsProcessing(true);
		setProgress(0);
		try {
			await showMediaUploadToast({
				filesCount: files.length,
				promise: async () => {
					const processedAssets = await processMediaAssets({
						files,
						onProgress: (progress: { progress: number }) =>
							setProgress(progress.progress),
					});
					for (const asset of processedAssets) {
						await editor.media.addMediaAsset({
							projectId: activeProject.metadata.id,
							asset,
						});
					}
					return {
						uploadedCount: processedAssets.length,
						assetNames: processedAssets.map((asset) => asset.name),
					};
				},
			});
		} catch (error) {
			console.error("Error processing files:", error);
		} finally {
			setIsProcessing(false);
			setProgress(0);
		}
	}, [activeProject, editor]);

	const openMaterialCenter = useCallback(() => {
		if (!activeProject) {
			toast.error("当前没有打开的项目");
			return;
		}
		if (typeof window === "undefined" || window.parent === window) {
			toast.warning("请在业务页面中打开剪辑器后再从素材中心导入");
			return;
		}
		if (pendingMaterialRequestId) return;

		const requestId = createMaterialPickerRequestId();
		pendingMaterialRequestIdRef.current = requestId;
		setIsMaterialPickerOpened(false);
		setPendingMaterialRequestId(requestId);
		window.parent.postMessage(
			{
				source: "opencut",
				type: "request-material-picker",
				requestId,
				projectId: activeProject.metadata.id,
			},
			"*",
		);
	}, [activeProject, pendingMaterialRequestId]);

	useEffect(() => {
		if (!pendingMaterialRequestId || isMaterialPickerOpened) return;

		const timer = window.setTimeout(() => {
			toast.error("素材中心没有响应", {
				description: "请刷新业务页面后重新打开剪辑器再试",
			});
			clearPendingMaterialRequest();
		}, 8000);

		return () => window.clearTimeout(timer);
	}, [
		pendingMaterialRequestId,
		isMaterialPickerOpened,
		clearPendingMaterialRequest,
	]);

	useEffect(() => {
		let cancelled = false;

		const handleMaterialPickerMessage = (event: MessageEvent) => {
			const requestId = pendingMaterialRequestIdRef.current;
			if (!requestId) return;
			if (!isNeoWebMaterialPickerMessage(event.data)) return;
			if (event.data.requestId !== requestId) return;

			if (event.data.type === "material-picker-opened") {
				setIsMaterialPickerOpened(true);
				return;
			}

			if (event.data.type === "material-picker-cancelled") {
				clearPendingMaterialRequest();
				return;
			}

			const assets = Array.isArray(event.data.assets)
				? event.data.assets.filter((asset) => String(asset.url || "").trim())
				: [];
			if (!assets.length) {
				toast.warning("没有可导入的素材");
				clearPendingMaterialRequest();
				return;
			}

			setIsImportingFromMaterialCenter(true);
			void (async () => {
				try {
					const files = await Promise.all(
						assets.map((asset) => fetchMaterialAssetFile(asset)),
					);
					if (!cancelled) {
						await processFiles({ files });
					}
				} catch (error) {
					console.error("Error importing material center assets:", error);
					toast.error("素材中心导入失败", {
						description:
							error instanceof Error
								? error.message
								: "请检查素材地址或跨域配置",
					});
				} finally {
					if (!cancelled) {
						setIsImportingFromMaterialCenter(false);
						clearPendingMaterialRequest();
					}
				}
			})();
		};

		window.addEventListener("message", handleMaterialPickerMessage);
		return () => {
			cancelled = true;
			window.removeEventListener("message", handleMaterialPickerMessage);
		};
	}, [clearPendingMaterialRequest, processFiles]);

	const { isDragOver, dragProps, openFilePicker, fileInputProps } =
		useFileUpload({
			accept: "image/*,video/*,audio/*",
			multiple: true,
			onFilesSelected: (files) => processFiles({ files }),
		});

	const handleRemove = ({
		event,
		ids,
	}: {
		event: React.MouseEvent;
		ids: string[];
	}) => {
		event.stopPropagation();

		invokeAction("remove-media-assets", {
			projectId: activeProject.metadata.id,
			assetIds: ids,
		});
	};

	const handleSort = ({ key }: { key: MediaSortKey }) => {
		if (mediaSortBy === key) {
			setMediaSort({
				key,
				order: mediaSortOrder === "asc" ? "desc" : "asc",
			});
		} else {
			setMediaSort({ key, order: "asc" });
		}
	};

	const filteredMediaItems = useMemo(() => {
		const filtered = mediaFiles.filter((item) => !item.ephemeral);

		filtered.sort((a, b) => {
			let valueA: string | number;
			let valueB: string | number;

			switch (mediaSortBy) {
				case "name":
					valueA = a.name.toLowerCase();
					valueB = b.name.toLowerCase();
					break;
				case "type":
					valueA = a.type;
					valueB = b.type;
					break;
				case "duration":
					valueA = a.duration || 0;
					valueB = b.duration || 0;
					break;
				case "size":
					valueA = a.file.size;
					valueB = b.file.size;
					break;
				default:
					return 0;
			}

			if (valueA < valueB) return mediaSortOrder === "asc" ? -1 : 1;
			if (valueA > valueB) return mediaSortOrder === "asc" ? 1 : -1;
			return 0;
		});

		return filtered;
	}, [mediaFiles, mediaSortBy, mediaSortOrder]);
	const orderedMediaIds = useMemo(() => {
		return filteredMediaItems.map((item) => item.id);
	}, [filteredMediaItems]);

	return (
		<>
			<input {...fileInputProps} />

			<PanelView
				title="素材"
				actions={
					<MediaActions
						mediaViewMode={mediaViewMode}
						setMediaViewMode={setMediaViewMode}
						isProcessing={isMediaActionDisabled}
						sortBy={mediaSortBy}
						sortOrder={mediaSortOrder}
						onSort={handleSort}
						onImport={openFilePicker}
						onImportFromMaterialCenter={openMaterialCenter}
					/>
				}
				className={cn(isDragOver && "bg-accent/30")}
				contentClassName="h-full"
				{...dragProps}
			>
				{isDragOver || filteredMediaItems.length === 0 ? (
					<MediaDragOverlay
						isVisible={true}
						isProcessing={isProcessing || isImportingFromMaterialCenter}
						progress={progress}
						onClick={openFilePicker}
					/>
				) : (
					<SelectableSurface
						ariaLabel="素材"
						orderedIds={orderedMediaIds}
						revealId={highlightMediaId}
						onRevealComplete={clearHighlight}
					>
						<MediaScopeRegistrar />
						<MediaItemList
							items={filteredMediaItems}
							mode={mediaViewMode}
							onRemove={handleRemove}
						/>
					</SelectableSurface>
				)}
			</PanelView>
		</>
	);
}

function MediaScopeRegistrar() {
	useSelectionScope();
	return null;
}

function MediaAssetDraggable({
	item,
	preview,
	variant,
	isRounded,
}: {
	item: MediaAsset;
	preview: React.ReactNode;
	variant: "card" | "compact";
	isRounded?: boolean;
}) {
	const editor = useEditor();

	const addElementAtTime = ({
		asset,
		startTime,
	}: {
		asset: MediaAsset;
		startTime: MediaTime;
	}) => {
		const duration =
			asset.duration != null
				? mediaTimeFromSeconds({ seconds: asset.duration })
				: DEFAULT_NEW_ELEMENT_DURATION;
		const element = buildElementFromMedia({
			mediaId: asset.id,
			mediaType: asset.type,
			name: asset.name,
			duration,
			startTime,
		});
		editor.timeline.insertElement({
			element,
			placement: { mode: "auto" },
		});
	};

	return (
		<DraggableItem
			name={item.name}
			preview={preview}
			dragData={{
				id: item.id,
				type: "media",
				mediaType: item.type,
				name: item.name,
				...(item.type !== "audio" && {
					targetElementTypes: [...MASKABLE_ELEMENT_TYPES],
				}),
			}}
			shouldShowPlusOnDrag={false}
			onAddToTimeline={({ currentTime }) =>
				addElementAtTime({ asset: item, startTime: currentTime })
			}
			variant={variant}
			isRounded={isRounded}
		/>
	);
}

function MediaItemWithContextMenu({
	item,
	children,
	onRemove,
}: {
	item: MediaAsset;
	children: React.ReactNode;
	onRemove: ({
		event,
		ids,
	}: {
		event: React.MouseEvent;
		ids: string[];
	}) => void;
}) {
	const { isSelected, selectedIds } = useSelection();
	const idsToDelete = isSelected(item.id) ? selectedIds : [item.id];
	const deleteLabel =
		idsToDelete.length > 1 ? `删除 ${idsToDelete.length} 个素材` : "删除";

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem>导出片段</ContextMenuItem>
				<ContextMenuItem
					variant="destructive"
					onClick={(event: React.MouseEvent<HTMLDivElement>) =>
						onRemove({ event, ids: idsToDelete })
					}
				>
					{deleteLabel}
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}

function MediaItemList({
	items,
	mode,
	onRemove,
}: {
	items: MediaAsset[];
	mode: MediaViewMode;
	onRemove: ({
		event,
		ids,
	}: {
		event: React.MouseEvent;
		ids: string[];
	}) => void;
}) {
	const isGrid = mode === "grid";

	return (
		<div
			className={cn(isGrid ? "grid gap-4" : "flex flex-col gap-1.5")}
			style={
				isGrid ? { gridTemplateColumns: "repeat(auto-fill, 7rem)" } : undefined
			}
		>
			{items.map((item) => (
				<MediaItemWithContextMenu item={item} onRemove={onRemove} key={item.id}>
					<SelectableItem className={cn(!isGrid && "w-full")} id={item.id}>
						<MediaAssetDraggable
							item={item}
							preview={
								<MediaPreview
									item={item}
									variant={isGrid ? "grid" : "compact"}
								/>
							}
							variant={isGrid ? "card" : "compact"}
							isRounded={isGrid ? false : undefined}
						/>
					</SelectableItem>
				</MediaItemWithContextMenu>
			))}
		</div>
	);
}

function formatDuration({ duration }: { duration: number }) {
	const min = Math.floor(duration / 60);
	const sec = Math.floor(duration % 60);
	return `${min}:${sec.toString().padStart(2, "0")}`;
}

function MediaDurationBadge({ duration }: { duration?: number }) {
	if (!duration) return null;

	return (
		<div className="absolute right-1 bottom-1 rounded bg-black/70 px-1 text-xs text-white">
			{formatDuration({ duration })}
		</div>
	);
}

function MediaDurationLabel({ duration }: { duration?: number }) {
	if (!duration) return null;

	return (
		<span className="text-xs opacity-70">{formatDuration({ duration })}</span>
	);
}

function MediaTypePlaceholder({
	icon,
	label,
	duration,
	variant,
}: {
	icon: IconSvgElement;
	label: string;
	duration?: number;
	variant: "muted" | "bordered";
}) {
	const iconClassName = cn("size-6", variant === "bordered" && "mb-1");

	return (
		<div
			className={cn(
				"text-muted-foreground flex size-full flex-col items-center justify-center rounded",
				variant === "muted" ? "bg-muted/30" : "border",
			)}
		>
			<HugeiconsIcon icon={icon} className={iconClassName} />
			<span className="text-xs">{label}</span>
			<MediaDurationLabel duration={duration} />
		</div>
	);
}

function MediaPreview({
	item,
	variant = "grid",
}: {
	item: MediaAsset;
	variant?: "grid" | "compact";
}) {
	const shouldShowDurationBadge = variant === "grid";

	if (item.type === "image") {
		return (
			<div className="relative flex size-full items-center justify-center bg-muted">
				<Image
					src={item.url ?? ""}
					alt={item.name}
					fill
					sizes="100vw"
					className="object-cover"
					loading="lazy"
					unoptimized
				/>
			</div>
		);
	}

	if (item.type === "video") {
		if (item.thumbnailUrl) {
			return (
				<div className="relative size-full">
					<Image
						src={item.thumbnailUrl}
						alt={item.name}
						fill
						sizes="100vw"
						className="rounded object-cover"
						loading="lazy"
						unoptimized
					/>
					{shouldShowDurationBadge ? (
						<MediaDurationBadge duration={item.duration} />
					) : null}
				</div>
			);
		}

		return (
			<MediaTypePlaceholder
				icon={Video01Icon}
				label="视频"
				duration={item.duration}
				variant="muted"
			/>
		);
	}

	if (item.type === "audio") {
		return (
			<MediaTypePlaceholder
				icon={MusicNote03Icon}
				label="音频"
				duration={item.duration}
				variant="bordered"
			/>
		);
	}

	return (
		<MediaTypePlaceholder icon={Image02Icon} label="未知" variant="muted" />
	);
}

function MediaActions({
	mediaViewMode,
	setMediaViewMode,
	isProcessing,
	sortBy,
	sortOrder,
	onSort,
	onImport,
	onImportFromMaterialCenter,
}: {
	mediaViewMode: MediaViewMode;
	setMediaViewMode: (mode: MediaViewMode) => void;
	isProcessing: boolean;
	sortBy: MediaSortKey;
	sortOrder: MediaSortOrder;
	onSort: ({ key }: { key: MediaSortKey }) => void;
	onImport: () => void;
	onImportFromMaterialCenter: () => void;
}) {
	return (
		<div className="flex gap-1.5">
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							onClick={() =>
								setMediaViewMode(mediaViewMode === "grid" ? "list" : "grid")
							}
							disabled={isProcessing}
							className="items-center justify-center"
						>
							{mediaViewMode === "grid" ? (
								<HugeiconsIcon icon={LeftToRightListDashIcon} />
							) : (
								<HugeiconsIcon icon={GridViewIcon} />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>
							{mediaViewMode === "grid" ? "切换到列表视图" : "切换到网格视图"}
						</p>
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<DropdownMenu>
						<TooltipTrigger asChild>
							<DropdownMenuTrigger asChild>
								<Button
									size="icon"
									variant="ghost"
									disabled={isProcessing}
									className="items-center justify-center"
								>
									<HugeiconsIcon icon={SortingOneNineIcon} />
								</Button>
							</DropdownMenuTrigger>
						</TooltipTrigger>
						<DropdownMenuContent align="end">
							<SortMenuItem
								label="名称"
								sortKey="name"
								currentSortBy={sortBy}
								currentSortOrder={sortOrder}
								onSort={onSort}
							/>
							<SortMenuItem
								label="类型"
								sortKey="type"
								currentSortBy={sortBy}
								currentSortOrder={sortOrder}
								onSort={onSort}
							/>
							<SortMenuItem
								label="时长"
								sortKey="duration"
								currentSortBy={sortBy}
								currentSortOrder={sortOrder}
								onSort={onSort}
							/>
							<SortMenuItem
								label="文件大小"
								sortKey="size"
								currentSortBy={sortBy}
								currentSortOrder={sortOrder}
								onSort={onSort}
							/>
						</DropdownMenuContent>
					</DropdownMenu>
					<TooltipContent>
						<p>
							按 {MEDIA_SORT_LABELS[sortBy]} 排序（
							{sortOrder === "asc" ? "升序" : "降序"}）
						</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<Button
				variant="outline"
				onClick={onImportFromMaterialCenter}
				disabled={isProcessing}
				size="sm"
				className="items-center justify-center gap-1.5"
			>
				<HugeiconsIcon icon={Folder03Icon} />
				素材中心
			</Button>
			<Button
				variant="outline"
				onClick={onImport}
				disabled={isProcessing}
				size="sm"
				className="items-center justify-center gap-1.5"
			>
				<HugeiconsIcon icon={CloudUploadIcon} />
				导入
			</Button>
		</div>
	);
}

function SortMenuItem({
	label,
	sortKey,
	currentSortBy,
	currentSortOrder,
	onSort,
}: {
	label: string;
	sortKey: MediaSortKey;
	currentSortBy: MediaSortKey;
	currentSortOrder: MediaSortOrder;
	onSort: ({ key }: { key: MediaSortKey }) => void;
}) {
	const isActive = currentSortBy === sortKey;
	const arrow = isActive ? (currentSortOrder === "asc" ? "↑" : "↓") : "";

	return (
		<DropdownMenuItem onClick={() => onSort({ key: sortKey })}>
			{label} {arrow}
		</DropdownMenuItem>
	);
}
