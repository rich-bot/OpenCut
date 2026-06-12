import { resolveStickerId } from "@/stickers";
import { videoCache } from "@/services/video-cache/service";
import { getOpenCutAssetProxyUrl } from "@/utils/asset-proxy";
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

const STICKER_SOURCE_LOAD_TIMEOUT_MS = 5000;
const STICKER_SOURCE_RETRY_DELAY_MS = 8000;
const stickerSourceCache = new Map<string, Promise<CachedStickerSource>>();
const stickerVideoFileCache = new Map<string, Promise<File>>();

function forgetCachedPromiseAfterDelay<T>({
	cache,
	cacheKey,
	promise,
}: {
	cache: Map<string, Promise<T>>;
	cacheKey: string;
	promise: Promise<T>;
}) {
	window.setTimeout(() => {
		if (cache.get(cacheKey) === promise) {
			cache.delete(cacheKey);
		}
	}, STICKER_SOURCE_RETRY_DELAY_MS);
}

export function loadStickerSource({
	stickerId,
	sourceUrl,
}: {
	stickerId: string;
	sourceUrl?: string;
}): Promise<CachedStickerSource> {
	const cacheKey = `${stickerId}::${sourceUrl ?? ""}`;
	const cached = stickerSourceCache.get(cacheKey);
	if (cached) return cached;

	const promise = (async (): Promise<CachedStickerSource> => {
		const resolvedUrl =
			sourceUrl ||
			resolveStickerId({
				stickerId,
				options: { width: 200, height: 200 },
			});
		const url = getOpenCutAssetProxyUrl({ url: resolvedUrl });

		const image = new Image();
		image.crossOrigin = "anonymous";

		await new Promise<void>((resolve, reject) => {
			const timeout = window.setTimeout(() => {
				image.onload = null;
				image.onerror = null;
				reject(new Error(`Timed out loading sticker: ${stickerId}`));
			}, STICKER_SOURCE_LOAD_TIMEOUT_MS);
			image.onerror = () => {
				window.clearTimeout(timeout);
				reject(new Error(`Failed to load sticker: ${stickerId}`));
			};
			image.onload = () => {
				window.clearTimeout(timeout);
				resolve();
			};
			image.src = url;
		});

		return {
			source: image,
			width: image.naturalWidth,
			height: image.naturalHeight,
		};
	})();
	const cachedPromise = promise.catch((error) => {
		forgetCachedPromiseAfterDelay({
			cache: stickerSourceCache,
			cacheKey,
			promise: cachedPromise,
		});
		throw error;
	});

	stickerSourceCache.set(cacheKey, cachedPromise);
	return cachedPromise;
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
	const proxiedSourceUrl = getOpenCutAssetProxyUrl({ url: sourceUrl });
	const cached = stickerVideoFileCache.get(proxiedSourceUrl);
	if (cached) return cached;

	const promise = (async () => {
		const abortController = new AbortController();
		const timeout = window.setTimeout(
			() => abortController.abort(),
			STICKER_SOURCE_LOAD_TIMEOUT_MS,
		);
		let response: Response;
		try {
			response = await fetch(proxiedSourceUrl, { signal: abortController.signal });
		} finally {
			window.clearTimeout(timeout);
		}
		if (!response.ok) {
			throw new Error(`Failed to load video sticker: ${proxiedSourceUrl}`);
		}

		const blob = await response.blob();
		return new File([blob], getFileNameFromUrl({ url: proxiedSourceUrl }), {
			type: blob.type || "video/webm",
		});
	})();
	const cachedPromise = promise.catch((error) => {
		forgetCachedPromiseAfterDelay({
			cache: stickerVideoFileCache,
			cacheKey: proxiedSourceUrl,
			promise: cachedPromise,
		});
		throw error;
	});

	stickerVideoFileCache.set(proxiedSourceUrl, cachedPromise);
	return cachedPromise;
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
