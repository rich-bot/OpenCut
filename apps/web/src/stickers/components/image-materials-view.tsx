"use client";

import Image from "next/image";
import { UploadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DraggableItem } from "@/components/editor/panels/assets/draggable-item";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useEditor } from "@/editor/use-editor";
import { resolveStickerIntrinsicSize } from "@/stickers";
import {
	buildNeoImageMaterialAssetProxyUrl,
	buildNeoImageMaterialStickerId,
} from "@/stickers/providers/neo-image-materials";
import { useStickersStore } from "@/stickers/stickers-store";
import { buildStickerElement } from "@/timeline/element-utils";
import type { TimelineDragData } from "@/timeline/drag";

type NeoImageMaterialSticker = {
	id?: string | number;
	url: string;
	name: string;
	originalName?: string;
	fileSize?: number;
	createTime?: string;
};

type NeoImageMaterialMessage =
	| {
			source: "neo-web";
			type: "image-material-stickers-result";
			requestId?: string;
			rows?: NeoImageMaterialSticker[];
			total?: number;
			pageNum?: number;
			pageSize?: number;
	  }
	| {
			source: "neo-web";
			type: "image-material-sticker-uploaded";
			requestId?: string;
	  }
	| {
			source: "neo-web";
			type: "image-material-stickers-error";
			requestId?: string;
			message?: string;
	  };

const PAGE_SIZE = 30;

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === "object";
}

function isNeoImageMaterialMessage(
	value: unknown,
): value is NeoImageMaterialMessage {
	return (
		isRecord(value) &&
		value.source === "neo-web" &&
		(value.type === "image-material-stickers-result" ||
			value.type === "image-material-sticker-uploaded" ||
			value.type === "image-material-stickers-error")
	);
}

function createRequestId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `image-material-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function canTalkToParent() {
	return typeof window !== "undefined" && window.parent !== window;
}

export function ImageMaterialStickersView() {
	const editor = useEditor();
	const searchQuery = useStickersStore((state) => state.searchQuery);
	const addToRecentStickers = useStickersStore(
		(state) => state.addToRecentStickers,
	);
	const [items, setItems] = useState<NeoImageMaterialSticker[]>([]);
	const [pageNum, setPageNum] = useState(1);
	const [total, setTotal] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const listRequestIdRef = useRef<string | null>(null);
	const uploadRequestIdRef = useRef<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const hasMore = items.length < total || (total === 0 && items.length >= PAGE_SIZE);

	const requestPage = useCallback(
		({ page, mode }: { page: number; mode: "replace" | "append" }) => {
			if (!canTalkToParent()) {
				toast.warning("请在业务页面中打开剪辑器后再使用图片素材");
				return;
			}

			const requestId = createRequestId();
			listRequestIdRef.current = requestId;
			setIsLoading(true);
			window.parent.postMessage(
				{
					source: "opencut",
					type: "request-image-material-stickers",
					requestId,
					query: searchQuery.trim(),
					pageNum: page,
					pageSize: PAGE_SIZE,
					mode,
				},
				"*",
			);
		},
		[searchQuery],
	);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setPageNum(1);
			requestPage({ page: 1, mode: "replace" });
		}, 260);

		return () => window.clearTimeout(timer);
	}, [requestPage]);

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (!isNeoImageMaterialMessage(event.data)) return;

			if (event.data.type === "image-material-stickers-result") {
				if (event.data.requestId !== listRequestIdRef.current) return;
				const rows = Array.isArray(event.data.rows) ? event.data.rows : [];
				const responsePage = Number(event.data.pageNum || 1);
				setItems((previous) =>
					responsePage <= 1 ? rows : [...previous, ...rows],
				);
				setPageNum(responsePage);
				setTotal(Number(event.data.total || rows.length));
				setIsLoading(false);
				return;
			}

			if (event.data.type === "image-material-sticker-uploaded") {
				if (event.data.requestId !== uploadRequestIdRef.current) return;
				uploadRequestIdRef.current = null;
				setIsUploading(false);
				toast.success("图片素材上传成功");
				setPageNum(1);
				requestPage({ page: 1, mode: "replace" });
				return;
			}

			if (event.data.type === "image-material-stickers-error") {
				const matchesList = event.data.requestId === listRequestIdRef.current;
				const matchesUpload =
					event.data.requestId === uploadRequestIdRef.current;
				if (!matchesList && !matchesUpload) return;
				if (matchesList) setIsLoading(false);
				if (matchesUpload) {
					uploadRequestIdRef.current = null;
					setIsUploading(false);
				}
				toast.error(event.data.message || "图片素材加载失败");
			}
		};

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [requestPage]);

	const handleUploadClick = () => {
		if (isUploading) return;
		fileInputRef.current?.click();
	};

	const handleUploadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.warning("请选择图片文件");
			return;
		}
		if (!canTalkToParent()) {
			toast.warning("请在业务页面中打开剪辑器后再上传图片素材");
			return;
		}

		const requestId = createRequestId();
		uploadRequestIdRef.current = requestId;
		setIsUploading(true);
		window.parent.postMessage(
			{
				source: "opencut",
				type: "upload-image-material-sticker",
				requestId,
				file,
			},
			"*",
		);
	};

	const handleLoadMore = () => {
		if (isLoading || !hasMore) return;
		requestPage({ page: pageNum + 1, mode: "append" });
	};

	return (
		<div className="flex h-full flex-col gap-3 pb-4">
			<div className="flex items-center justify-between gap-2">
				<span className="text-muted-foreground text-xs">
					{isLoading && items.length === 0
						? "正在加载图片素材..."
						: `共 ${total || items.length} 个图片素材`}
				</span>
				<Button
					variant="outline"
					size="sm"
					className="gap-1.5"
					disabled={isUploading}
					onClick={handleUploadClick}
				>
					{isUploading ? (
						<Spinner className="size-3.5" />
					) : (
						<HugeiconsIcon icon={UploadIcon} className="size-3.5" />
					)}
					上传
				</Button>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={handleUploadChange}
				/>
			</div>

			{isLoading && items.length === 0 ? (
				<div className="flex items-center justify-center py-8">
					<Spinner className="text-muted-foreground size-6" />
				</div>
			) : items.length ? (
				<>
					<div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(80px,1fr))]">
						{items.map((item) => (
							<ImageMaterialStickerItem
								key={`${item.id ?? item.url}:${item.url}`}
								item={item}
								onAdd={async () => {
									const currentTime = editor.playback.getCurrentTime();
									const stickerId = buildNeoImageMaterialStickerId({
										url: item.url,
									});
									const sourceUrl = buildNeoImageMaterialAssetProxyUrl({
										url: item.url,
									});
									const size = await resolveStickerIntrinsicSize({ stickerId });
									const element = buildStickerElement({
										stickerId,
										name: item.name,
										startTime: currentTime,
										assetType: "image",
										sourceUrl,
										intrinsicWidth: size.width,
										intrinsicHeight: size.height,
									});
									editor.timeline.insertElement({
										placement: { mode: "auto" },
										element,
									});
									addToRecentStickers({ stickerId });
								}}
							/>
						))}
					</div>
					<div className="flex justify-center pt-1">
						<Button
							variant="text"
							size="sm"
							disabled={isLoading || !hasMore}
							onClick={handleLoadMore}
							className="text-xs text-muted-foreground"
						>
							{isLoading ? "加载中..." : hasMore ? "加载更多" : "已加载全部"}
						</Button>
					</div>
				</>
			) : (
				<div className="text-muted-foreground flex h-full items-center justify-center px-4 text-center text-sm">
					暂无图片素材
				</div>
			)}
		</div>
	);
}

function ImageMaterialStickerItem({
	item,
	onAdd,
}: {
	item: NeoImageMaterialSticker;
	onAdd: () => Promise<void>;
}) {
	const [hasImageError, setHasImageError] = useState(false);
	const [intrinsicSize, setIntrinsicSize] = useState<{
		url: string;
		width: number;
		height: number;
	} | null>(null);
	const stickerId = buildNeoImageMaterialStickerId({ url: item.url });
	const sourceUrl = buildNeoImageMaterialAssetProxyUrl({ url: item.url });
	const currentIntrinsicSize =
		intrinsicSize?.url === item.url ? intrinsicSize : null;
	const dragData: TimelineDragData = {
		id: stickerId,
		type: "sticker",
		name: item.name,
		stickerId,
		assetType: "image",
		sourceUrl,
		intrinsicWidth: currentIntrinsicSize?.width,
		intrinsicHeight: currentIntrinsicSize?.height,
	};

	const preview = (
		<div className="relative flex size-full items-center justify-center p-2">
			{hasImageError ? (
				<span className="text-muted-foreground text-center text-xs break-all">
					{item.name}
				</span>
			) : (
				<Image
					src={item.url}
					alt={item.name}
					width={80}
					height={80}
					className="size-full object-contain"
					onError={() => setHasImageError(true)}
					onLoad={(event) => {
						const image = event.currentTarget;
						if (image.naturalWidth > 0 && image.naturalHeight > 0) {
							setIntrinsicSize({
								url: item.url,
								width: image.naturalWidth,
								height: image.naturalHeight,
							});
						}
					}}
					loading="lazy"
					unoptimized
				/>
			)}
		</div>
	);

	return (
		<DraggableItem
			name={item.name}
			preview={preview}
			dragData={dragData}
			onAddToTimeline={() => {
				void onAdd().catch((error) => {
					console.error("Failed to add image material sticker:", error);
					toast.error("图片素材添加失败");
				});
			}}
			aspectRatio={1}
			shouldShowLabel={false}
			isRounded
			variant="card"
			containerClassName="w-full"
		/>
	);
}
