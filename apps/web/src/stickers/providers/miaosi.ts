import { withBasePath } from "@/utils/base-path";
import { buildStickerId, parseStickerId } from "../sticker-id";
import type {
	ResolvedStickerAsset,
	StickerAssetType,
	StickerBrowseResult,
	StickerItem,
	StickerProvider,
	StickerSearchResult,
} from "../types";

const MIAOSI_PROVIDER_ID = "miaosi";
const ASSET_BASE = "/stickers/miaosi";

type MiaosiStickerAsset = {
	slug: string;
	name: string;
	file: string;
	assetType: StickerAssetType;
	sourceFile: string;
	sourceDuration: number;
	intrinsicWidth: number;
	intrinsicHeight: number;
	keywords: string[];
	sourceId: string;
};

const MIAOSI_STICKERS: MiaosiStickerAsset[] = [
	{
		slug: "miaosi-1",
		name: "赚钱2",
		file: "cover/miaosi-1.png",
		assetType: "video",
		sourceFile: "video/miaosi-1.webm",
		sourceDuration: 1.92,
		intrinsicWidth: 690,
		intrinsicHeight: 711,
		keywords: ["赚钱2", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "1",
	},
	{
		slug: "miaosi-2",
		name: "赚钱1",
		file: "cover/miaosi-2.png",
		assetType: "video",
		sourceFile: "video/miaosi-2.webm",
		sourceDuration: 2,
		intrinsicWidth: 488,
		intrinsicHeight: 340,
		keywords: ["赚钱1", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "2",
	},
	{
		slug: "miaosi-3",
		name: "下载-格子箭头",
		file: "cover/miaosi-3.png",
		assetType: "video",
		sourceFile: "video/miaosi-3.webm",
		sourceDuration: 2.92,
		intrinsicWidth: 209,
		intrinsicHeight: 208,
		keywords: ["下载-格子箭头", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "3",
	},
	{
		slug: "miaosi-4",
		name: "链接8",
		file: "cover/miaosi-4.png",
		assetType: "video",
		sourceFile: "video/miaosi-4.webm",
		sourceDuration: 2,
		intrinsicWidth: 360,
		intrinsicHeight: 217,
		keywords: ["链接8", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "4",
	},
	{
		slug: "miaosi-5",
		name: "链接5",
		file: "cover/miaosi-5.png",
		assetType: "video",
		sourceFile: "video/miaosi-5.webm",
		sourceDuration: 1.54,
		intrinsicWidth: 467,
		intrinsicHeight: 178,
		keywords: ["链接5", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "5",
	},
	{
		slug: "miaosi-6",
		name: "链接4",
		file: "cover/miaosi-6.png",
		assetType: "video",
		sourceFile: "video/miaosi-6.webm",
		sourceDuration: 1.96,
		intrinsicWidth: 419,
		intrinsicHeight: 294,
		keywords: ["链接4", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "6",
	},
	{
		slug: "miaosi-7",
		name: "红包8",
		file: "cover/miaosi-7.png",
		assetType: "video",
		sourceFile: "video/miaosi-7.webm",
		sourceDuration: 2.96,
		intrinsicWidth: 294,
		intrinsicHeight: 381,
		keywords: ["红包8", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "7",
	},
	{
		slug: "miaosi-9",
		name: "赚钱9",
		file: "cover/miaosi-9.png",
		assetType: "video",
		sourceFile: "video/miaosi-9.webm",
		sourceDuration: 3,
		intrinsicWidth: 351,
		intrinsicHeight: 341,
		keywords: ["赚钱9", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "9",
	},
	{
		slug: "miaosi-11",
		name: "下方4",
		file: "cover/miaosi-11.png",
		assetType: "video",
		sourceFile: "video/miaosi-11.webm",
		sourceDuration: 2,
		intrinsicWidth: 146,
		intrinsicHeight: 184,
		keywords: ["下方4", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "11",
	},
	{
		slug: "miaosi-12",
		name: "怎么-4",
		file: "cover/miaosi-12.png",
		assetType: "video",
		sourceFile: "video/miaosi-12.webm",
		sourceDuration: 1.54,
		intrinsicWidth: 537,
		intrinsicHeight: 449,
		keywords: ["怎么-4", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "12",
	},
	{
		slug: "miaosi-13",
		name: "现在5",
		file: "cover/miaosi-13.png",
		assetType: "video",
		sourceFile: "video/miaosi-13.webm",
		sourceDuration: 2,
		intrinsicWidth: 296,
		intrinsicHeight: 237,
		keywords: ["现在5", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "13",
	},
	{
		slug: "miaosi-14",
		name: "下载-手指点这里",
		file: "cover/miaosi-14.png",
		assetType: "video",
		sourceFile: "video/miaosi-14.webm",
		sourceDuration: 2,
		intrinsicWidth: 668,
		intrinsicHeight: 372,
		keywords: ["下载-手指点这里", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "14",
	},
	{
		slug: "miaosi-15",
		name: "下载-黄色Q弹箭头",
		file: "cover/miaosi-15.png",
		assetType: "video",
		sourceFile: "video/miaosi-15.webm",
		sourceDuration: 3,
		intrinsicWidth: 254,
		intrinsicHeight: 462,
		keywords: ["下载-黄色Q弹箭头", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "15",
	},
	{
		slug: "miaosi-16",
		name: "活动02",
		file: "cover/miaosi-16.png",
		assetType: "video",
		sourceFile: "video/miaosi-16.webm",
		sourceDuration: 2.54,
		intrinsicWidth: 560,
		intrinsicHeight: 560,
		keywords: ["活动02", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "16",
	},
	{
		slug: "miaosi-17",
		name: "极速09竖",
		file: "cover/miaosi-17.png",
		assetType: "video",
		sourceFile: "video/miaosi-17.webm",
		sourceDuration: 2.04,
		intrinsicWidth: 533,
		intrinsicHeight: 634,
		keywords: ["极速09竖", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "17",
	},
	{
		slug: "miaosi-18",
		name: "极速03竖",
		file: "cover/miaosi-18.png",
		assetType: "video",
		sourceFile: "video/miaosi-18.webm",
		sourceDuration: 3.04,
		intrinsicWidth: 621,
		intrinsicHeight: 178,
		keywords: ["极速03竖", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "18",
	},
	{
		slug: "miaosi-19",
		name: "下载-大小活泼箭头",
		file: "cover/miaosi-19.png",
		assetType: "video",
		sourceFile: "video/miaosi-19.webm",
		sourceDuration: 2.96,
		intrinsicWidth: 453,
		intrinsicHeight: 445,
		keywords: ["下载-大小活泼箭头", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "19",
	},
	{
		slug: "miaosi-20",
		name: "下载-9",
		file: "cover/miaosi-20.png",
		assetType: "video",
		sourceFile: "video/miaosi-20.webm",
		sourceDuration: 1.54,
		intrinsicWidth: 466,
		intrinsicHeight: 463,
		keywords: ["下载-9", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "20",
	},
	{
		slug: "miaosi-21",
		name: "下载-7",
		file: "cover/miaosi-21.png",
		assetType: "video",
		sourceFile: "video/miaosi-21.webm",
		sourceDuration: 2.75,
		intrinsicWidth: 350,
		intrinsicHeight: 277,
		keywords: ["下载-7", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "21",
	},
	{
		slug: "miaosi-22",
		name: "下载",
		file: "cover/miaosi-22.png",
		assetType: "video",
		sourceFile: "video/miaosi-22.webm",
		sourceDuration: 2.71,
		intrinsicWidth: 117,
		intrinsicHeight: 228,
		keywords: ["下载", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "22",
	},
	{
		slug: "miaosi-23",
		name: "下方6",
		file: "cover/miaosi-23.png",
		assetType: "video",
		sourceFile: "video/miaosi-23.webm",
		sourceDuration: 2,
		intrinsicWidth: 95,
		intrinsicHeight: 220,
		keywords: ["下方6", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "23",
	},
	{
		slug: "miaosi-24",
		name: "下方5",
		file: "cover/miaosi-24.png",
		assetType: "video",
		sourceFile: "video/miaosi-24.webm",
		sourceDuration: 1.71,
		intrinsicWidth: 398,
		intrinsicHeight: 131,
		keywords: ["下方5", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "24",
	},
	{
		slug: "miaosi-25",
		name: "下载3",
		file: "cover/miaosi-25.png",
		assetType: "video",
		sourceFile: "video/miaosi-25.webm",
		sourceDuration: 2.58,
		intrinsicWidth: 125,
		intrinsicHeight: 165,
		keywords: ["下载3", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "25",
	},
	{
		slug: "miaosi-26",
		name: "下方10",
		file: "cover/miaosi-26.png",
		assetType: "video",
		sourceFile: "video/miaosi-26.webm",
		sourceDuration: 3,
		intrinsicWidth: 340,
		intrinsicHeight: 99,
		keywords: ["下方10", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "26",
	},
	{
		slug: "miaosi-27",
		name: "提现9",
		file: "cover/miaosi-27.png",
		assetType: "video",
		sourceFile: "video/miaosi-27.webm",
		sourceDuration: 3,
		intrinsicWidth: 372,
		intrinsicHeight: 287,
		keywords: ["提现9", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "27",
	},
	{
		slug: "miaosi-29",
		name: "送心贴纸",
		file: "cover/miaosi-29.png",
		assetType: "video",
		sourceFile: "video/miaosi-29.webm",
		sourceDuration: 2.54,
		intrinsicWidth: 237,
		intrinsicHeight: 356,
		keywords: ["送心贴纸", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "29",
	},
	{
		slug: "miaosi-30",
		name: "舒适-竖10",
		file: "cover/miaosi-30.png",
		assetType: "video",
		sourceFile: "video/miaosi-30.webm",
		sourceDuration: 3,
		intrinsicWidth: 500,
		intrinsicHeight: 509,
		keywords: ["舒适-竖10", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "30",
	},
	{
		slug: "miaosi-31",
		name: "舒适-竖09",
		file: "cover/miaosi-31.png",
		assetType: "video",
		sourceFile: "video/miaosi-31.webm",
		sourceDuration: 3,
		intrinsicWidth: 528,
		intrinsicHeight: 693,
		keywords: ["舒适-竖09", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "31",
	},
	{
		slug: "miaosi-32",
		name: "舒适-竖05",
		file: "cover/miaosi-32.png",
		assetType: "video",
		sourceFile: "video/miaosi-32.webm",
		sourceDuration: 3,
		intrinsicWidth: 577,
		intrinsicHeight: 447,
		keywords: ["舒适-竖05", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "32",
	},
	{
		slug: "miaosi-33",
		name: "舒适-竖02",
		file: "cover/miaosi-33.png",
		assetType: "video",
		sourceFile: "video/miaosi-33.webm",
		sourceDuration: 5.88,
		intrinsicWidth: 512,
		intrinsicHeight: 567,
		keywords: ["舒适-竖02", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "33",
	},
	{
		slug: "miaosi-34",
		name: "手举666",
		file: "cover/miaosi-34.png",
		assetType: "video",
		sourceFile: "video/miaosi-34.webm",
		sourceDuration: 3.29,
		intrinsicWidth: 355,
		intrinsicHeight: 288,
		keywords: ["手举666", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "34",
	},
	{
		slug: "miaosi-35",
		name: "手机金币-赚钱",
		file: "cover/miaosi-35.png",
		assetType: "video",
		sourceFile: "video/miaosi-35.webm",
		sourceDuration: 1.67,
		intrinsicWidth: 487,
		intrinsicHeight: 482,
		keywords: ["手机金币-赚钱", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "35",
	},
	{
		slug: "miaosi-36",
		name: "手绘划重点",
		file: "cover/miaosi-36.png",
		assetType: "video",
		sourceFile: "video/miaosi-36.webm",
		sourceDuration: 2.54,
		intrinsicWidth: 431,
		intrinsicHeight: 292,
		keywords: ["手绘划重点", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "36",
	},
	{
		slug: "miaosi-37",
		name: "生活7",
		file: "cover/miaosi-37.png",
		assetType: "video",
		sourceFile: "video/miaosi-37.webm",
		sourceDuration: 2,
		intrinsicWidth: 246,
		intrinsicHeight: 232,
		keywords: ["生活7", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "37",
	},
	{
		slug: "miaosi-38",
		name: "美观6",
		file: "cover/miaosi-38.png",
		assetType: "video",
		sourceFile: "video/miaosi-38.webm",
		sourceDuration: 2,
		intrinsicWidth: 269,
		intrinsicHeight: 330,
		keywords: ["美观6", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "38",
	},
	{
		slug: "miaosi-39",
		name: "前方高能",
		file: "cover/miaosi-39.png",
		assetType: "video",
		sourceFile: "video/miaosi-39.webm",
		sourceDuration: 2.71,
		intrinsicWidth: 521,
		intrinsicHeight: 826,
		keywords: ["前方高能", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "39",
	},
	{
		slug: "miaosi-40",
		name: "千万别7",
		file: "cover/miaosi-40.png",
		assetType: "video",
		sourceFile: "video/miaosi-40.webm",
		sourceDuration: 1.92,
		intrinsicWidth: 413,
		intrinsicHeight: 131,
		keywords: ["千万别7", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "40",
	},
	{
		slug: "miaosi-41",
		name: "粒子爱心贴纸",
		file: "cover/miaosi-41.png",
		assetType: "video",
		sourceFile: "video/miaosi-41.webm",
		sourceDuration: 2.54,
		intrinsicWidth: 684,
		intrinsicHeight: 640,
		keywords: ["粒子爱心贴纸", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "41",
	},
	{
		slug: "miaosi-42",
		name: "千万别3",
		file: "cover/miaosi-42.png",
		assetType: "video",
		sourceFile: "video/miaosi-42.webm",
		sourceDuration: 1.88,
		intrinsicWidth: 164,
		intrinsicHeight: 201,
		keywords: ["千万别3", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "42",
	},
	{
		slug: "miaosi-43",
		name: "女追男WoW",
		file: "cover/miaosi-43.png",
		assetType: "video",
		sourceFile: "video/miaosi-43.webm",
		sourceDuration: 2.17,
		intrinsicWidth: 221,
		intrinsicHeight: 241,
		keywords: ["女追男WoW", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "43",
	},
	{
		slug: "miaosi-44",
		name: "女追男03",
		file: "cover/miaosi-44.png",
		assetType: "video",
		sourceFile: "video/miaosi-44.webm",
		sourceDuration: 3,
		intrinsicWidth: 556,
		intrinsicHeight: 273,
		keywords: ["女追男03", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "44",
	},
	{
		slug: "miaosi-45",
		name: "女追男02",
		file: "cover/miaosi-45.png",
		assetType: "video",
		sourceFile: "video/miaosi-45.webm",
		sourceDuration: 3,
		intrinsicWidth: 348,
		intrinsicHeight: 170,
		keywords: ["女追男02", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "45",
	},
	{
		slug: "miaosi-46",
		name: "好福利",
		file: "cover/miaosi-46.png",
		assetType: "video",
		sourceFile: "video/miaosi-46.webm",
		sourceDuration: 2,
		intrinsicWidth: 304,
		intrinsicHeight: 205,
		keywords: ["好福利", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "46",
	},
	{
		slug: "miaosi-47",
		name: "福利6",
		file: "cover/miaosi-47.png",
		assetType: "video",
		sourceFile: "video/miaosi-47.webm",
		sourceDuration: 1.92,
		intrinsicWidth: 282,
		intrinsicHeight: 246,
		keywords: ["福利6", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "47",
	},
	{
		slug: "miaosi-48",
		name: "翅膀爱心贴纸",
		file: "cover/miaosi-48.png",
		assetType: "video",
		sourceFile: "video/miaosi-48.webm",
		sourceDuration: 2.54,
		intrinsicWidth: 387,
		intrinsicHeight: 346,
		keywords: ["翅膀爱心贴纸", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "48",
	},
	{
		slug: "miaosi-49",
		name: "品牌名称强化-视频强化",
		file: "cover/miaosi-49.png",
		assetType: "video",
		sourceFile: "video/miaosi-49.webm",
		sourceDuration: 3,
		intrinsicWidth: 352,
		intrinsicHeight: 205,
		keywords: ["品牌名称强化-视频强化", "活泼", "妙思", "贴纸", "动效", "webm"],
		sourceId: "49",
	},
	{
		slug: "miaosi-50",
		name: "红包金币弹出-竖版-视频强化贴纸",
		file: "cover/miaosi-50.png",
		assetType: "video",
		sourceFile: "video/miaosi-50.webm",
		sourceDuration: 3.33,
		intrinsicWidth: 720,
		intrinsicHeight: 1248,
		keywords: [
			"红包金币弹出-竖版-视频强化贴纸",
			"活泼",
			"妙思",
			"贴纸",
			"动效",
			"webm",
		],
		sourceId: "50",
	},
];

function buildAssetUrl({ file }: { file: string }) {
	return withBasePath(ASSET_BASE + "/" + file);
}

function resolveAsset({
	asset,
	missingStickerId,
}: {
	asset: MiaosiStickerAsset;
	missingStickerId?: string;
}): ResolvedStickerAsset {
	return {
		assetType: asset.assetType,
		previewUrl: buildAssetUrl({ file: asset.file }),
		sourceUrl: buildAssetUrl({ file: asset.sourceFile }),
		sourceDuration: asset.sourceDuration,
		intrinsicWidth: asset.intrinsicWidth,
		intrinsicHeight: asset.intrinsicHeight,
		metadata: {
			file: asset.file,
			sourceFile: asset.sourceFile,
			keywords: asset.keywords,
			sourceId: asset.sourceId,
			...(missingStickerId
				? {
						missingSticker: true,
						missingStickerId,
					}
				: {}),
		},
	};
}

function toStickerItem({ asset }: { asset: MiaosiStickerAsset }): StickerItem {
	const resolvedAsset = resolveAsset({ asset });
	return {
		id: buildStickerId({
			providerId: MIAOSI_PROVIDER_ID,
			providerValue: asset.slug,
		}),
		provider: MIAOSI_PROVIDER_ID,
		name: asset.name,
		previewUrl: resolvedAsset.previewUrl,
		assetType: resolvedAsset.assetType,
		sourceUrl: resolvedAsset.sourceUrl,
		sourceDuration: resolvedAsset.sourceDuration,
		intrinsicWidth: resolvedAsset.intrinsicWidth,
		intrinsicHeight: resolvedAsset.intrinsicHeight,
		metadata: resolvedAsset.metadata ?? {},
	};
}

function findAssetByStickerId({ stickerId }: { stickerId: string }) {
	try {
		const { providerValue } = parseStickerId({ stickerId });
		return MIAOSI_STICKERS.find((asset) => asset.slug === providerValue);
	} catch {
		return null;
	}
}

function filterAssets({ query }: { query: string }) {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return MIAOSI_STICKERS;
	}

	return MIAOSI_STICKERS.filter((asset) => {
		return (
			asset.name.toLowerCase().includes(normalizedQuery) ||
			asset.slug.includes(normalizedQuery) ||
			asset.keywords.some((keyword) =>
				keyword.toLowerCase().includes(normalizedQuery),
			)
		);
	});
}

function paginateAssets({
	assets,
	limit,
}: {
	assets: MiaosiStickerAsset[];
	limit?: number;
}) {
	const safeLimit = Math.max(1, limit ?? assets.length);
	return {
		items: assets.slice(0, safeLimit),
		hasMore: assets.length > safeLimit,
		total: assets.length,
	};
}

export const miaosiProvider: StickerProvider = {
	id: MIAOSI_PROVIDER_ID,
	async search({ query, options }): Promise<StickerSearchResult> {
		const filteredAssets = filterAssets({ query });
		const paged = paginateAssets({
			assets: filteredAssets,
			limit: options?.limit,
		});

		return {
			items: paged.items.map((asset) => toStickerItem({ asset })),
			total: paged.total,
			hasMore: paged.hasMore,
		};
	},
	async browse({ options }): Promise<StickerBrowseResult> {
		const paged = paginateAssets({
			assets: MIAOSI_STICKERS,
			limit: options?.limit,
		});

		return {
			sections: [
				{
					id: "all",
					items: paged.items.map((asset) => toStickerItem({ asset })),
					hasMore: paged.hasMore,
					layout: "grid",
				},
			],
		};
	},
	resolveUrl({ stickerId }): string {
		const asset = findAssetByStickerId({ stickerId }) ?? MIAOSI_STICKERS[0];
		return buildAssetUrl({ file: asset.file });
	},
	resolveAsset({ stickerId }): ResolvedStickerAsset {
		const asset = findAssetByStickerId({ stickerId });
		if (asset) {
			return resolveAsset({ asset });
		}

		return resolveAsset({
			asset: MIAOSI_STICKERS[0],
			missingStickerId: stickerId,
		});
	},
};
