import { buildStickerId, parseStickerId } from "../sticker-id";
import type {
	ResolvedStickerAsset,
	StickerBrowseResult,
	StickerProvider,
	StickerSearchResult,
} from "../types";
import { getOpenCutAssetProxyUrl } from "@/utils/asset-proxy";

export const NEO_IMAGE_MATERIALS_PROVIDER_ID = "neo-image-material";

export function buildNeoImageMaterialStickerId({ url }: { url: string }) {
	return buildStickerId({
		providerId: NEO_IMAGE_MATERIALS_PROVIDER_ID,
		providerValue: encodeURIComponent(url),
	});
}

export function buildNeoImageMaterialAssetProxyUrl({ url }: { url: string }) {
	return getOpenCutAssetProxyUrl({ url });
}

function resolveNeoImageMaterialUrl({ stickerId }: { stickerId: string }) {
	const { providerValue } = parseStickerId({ stickerId });
	try {
		return decodeURIComponent(providerValue);
	} catch {
		return providerValue;
	}
}

export const neoImageMaterialsProvider: StickerProvider = {
	id: NEO_IMAGE_MATERIALS_PROVIDER_ID,

	async search(): Promise<StickerSearchResult> {
		return { items: [], total: 0, hasMore: false };
	},

	async browse(): Promise<StickerBrowseResult> {
		return { sections: [] };
	},

	resolveUrl({ stickerId }): string {
		return buildNeoImageMaterialAssetProxyUrl({
			url: resolveNeoImageMaterialUrl({ stickerId }),
		});
	},

	resolveAsset({ stickerId }): ResolvedStickerAsset {
		const url = resolveNeoImageMaterialUrl({ stickerId });
		const proxiedUrl = buildNeoImageMaterialAssetProxyUrl({ url });
		return {
			assetType: "image",
			previewUrl: proxiedUrl,
			sourceUrl: proxiedUrl,
			metadata: {
				source: "neo-image-material",
				originalUrl: url,
			},
		};
	},
};
