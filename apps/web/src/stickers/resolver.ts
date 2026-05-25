import { stickersRegistry } from "./registry";
import { parseStickerId } from "./sticker-id";
import { registerDefaultStickerProviders } from "./providers";
import type {
	ResolvedStickerAsset,
	StickerResolveOptions,
} from "@/stickers/types";

export function resolveStickerId({
	stickerId,
	options,
}: {
	stickerId: string;
	options?: StickerResolveOptions;
}): string {
	registerDefaultStickerProviders();

	const parsedStickerId = parseStickerId({ stickerId });
	return stickersRegistry.get(parsedStickerId.providerId).resolveUrl({
		stickerId,
		options,
	});
}

export function resolveStickerAsset({
	stickerId,
	options,
}: {
	stickerId: string;
	options?: StickerResolveOptions;
}): ResolvedStickerAsset {
	registerDefaultStickerProviders();

	const parsedStickerId = parseStickerId({ stickerId });
	const provider = stickersRegistry.get(parsedStickerId.providerId);
	return (
		provider.resolveAsset?.({ stickerId, options }) ?? {
			assetType: "image",
			previewUrl: provider.resolveUrl({ stickerId, options }),
		}
	);
}
