import type { STICKER_CATEGORIES } from "@/stickers/categories";

export type StickerCategory = keyof typeof STICKER_CATEGORIES;
export type StickerAssetType = "image" | "video";

export interface StickerItem {
	id: string;
	provider: string;
	name: string;
	previewUrl: string;
	assetType?: StickerAssetType;
	sourceUrl?: string;
	sourceDuration?: number;
	intrinsicWidth?: number;
	intrinsicHeight?: number;
	metadata: Record<string, unknown>;
}

export interface StickerSearchResult {
	items: StickerItem[];
	total: number;
	hasMore: boolean;
}

export interface StickerBrowseSection {
	id: string;
	title?: string;
	items: StickerItem[];
	hasMore?: boolean;
	layout?: "grid" | "row";
	action?: {
		type: "see-all";
		category?: StickerCategory;
		sectionId?: string;
	};
}

export interface StickerBrowseResult {
	sections: StickerBrowseSection[];
}

export interface StickerProviderSearchOptions {
	limit?: number;
}

export interface StickerProviderBrowseOptions {
	page?: number;
	limit?: number;
}

export interface StickerResolveOptions {
	width?: number;
	height?: number;
}

export interface ResolvedStickerAsset {
	assetType: StickerAssetType;
	previewUrl: string;
	sourceUrl?: string;
	sourceDuration?: number;
	intrinsicWidth?: number;
	intrinsicHeight?: number;
	metadata?: Record<string, unknown>;
}

export interface StickerProvider {
	id: string;
	search({
		query,
		options,
	}: {
		query: string;
		options?: StickerProviderSearchOptions;
	}): Promise<StickerSearchResult>;
	browse({
		options,
	}: {
		options?: StickerProviderBrowseOptions;
	}): Promise<StickerBrowseResult>;
	resolveUrl({
		stickerId,
		options,
	}: {
		stickerId: string;
		options?: StickerResolveOptions;
	}): string;
	resolveAsset?({
		stickerId,
		options,
	}: {
		stickerId: string;
		options?: StickerResolveOptions;
	}): ResolvedStickerAsset;
}
