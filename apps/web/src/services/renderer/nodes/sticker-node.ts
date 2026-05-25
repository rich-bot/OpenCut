import { resolveStickerId } from "@/stickers";
import { videoCache } from "@/services/video-cache/service";
import {
	VisualNode,
	type ResolvedVisualSourceNodeState,
	type VisualNodeParams,
} from "./visual-node";

export interface StickerNodeParams extends VisualNodeParams {
	stickerId: string;
	assetType?: "image" | "video";
	sourceUrl?: string;
	sourceDuration?: number;
	intrinsicWidth?: number;
	intrinsicHeight?: number;
}

interface CachedStickerSource {
	source: HTMLImageElement;
	width: number;
	height: number;
}

const stickerSourceCache = new Map<string, Promise<CachedStickerSource>>();
const stickerVideoFileCache = new Map<string, Promise<File>>();

export function loadStickerSource({
	stickerId,
}: {
	stickerId: string;
}): Promise<CachedStickerSource> {
	const cached = stickerSourceCache.get(stickerId);
	if (cached) return cached;

	const promise = (async (): Promise<CachedStickerSource> => {
		const url = resolveStickerId({
			stickerId,
			options: { width: 200, height: 200 },
		});

		const image = new Image();

		await new Promise<void>((resolve, reject) => {
			image.onload = () => resolve();
			image.onerror = () =>
				reject(new Error(`Failed to load sticker: ${stickerId}`));
			image.src = url;
		});

		return {
			source: image,
			width: image.naturalWidth,
			height: image.naturalHeight,
		};
	})();

	stickerSourceCache.set(stickerId, promise);
	return promise;
}

function getFileNameFromUrl({ url }: { url: string }): string {
	try {
		const parsed = new URL(url, window.location.href);
		return parsed.pathname.split("/").pop() || "animated-sticker.webm";
	} catch {
		return "animated-sticker.webm";
	}
}

async function loadStickerVideoFile({ sourceUrl }: { sourceUrl: string }) {
	const cached = stickerVideoFileCache.get(sourceUrl);
	if (cached) return cached;

	const promise = (async () => {
		const response = await fetch(sourceUrl);
		if (!response.ok) {
			throw new Error(`Failed to load video sticker: ${sourceUrl}`);
		}

		const blob = await response.blob();
		return new File([blob], getFileNameFromUrl({ url: sourceUrl }), {
			type: blob.type || "video/webm",
		});
	})();

	stickerVideoFileCache.set(sourceUrl, promise);
	return promise;
}

export async function loadStickerVideoFrame({
	stickerId,
	sourceUrl,
	time,
}: {
	stickerId: string;
	sourceUrl: string;
	time: number;
}) {
	const file = await loadStickerVideoFile({ sourceUrl });
	return videoCache.getFrameAt({
		mediaId: `video-sticker:${stickerId}:${sourceUrl}`,
		file,
		time,
	});
}

export class StickerNode extends VisualNode<
	StickerNodeParams,
	ResolvedVisualSourceNodeState
> {}
