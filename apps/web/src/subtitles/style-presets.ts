import type { RichTextRunStyle } from "@/text/rich-text";

export interface SubtitleStylePreset {
	id: string;
	name: string;
	style: RichTextRunStyle;
}

export interface SubtitleFontOption {
	value: string;
	label: string;
	previewText?: string;
	sourceUrl?: string;
	aliases?: string[];
	cssFallback?: string[];
}

const MIAOSI_FONT_BASE_URL =
	"https://staticfile.qq.com/creative-market/p15d0a5f5e0754a75bf77a52973f8c438/latest/";

function miaosiFontUrl({
	label,
	type,
}: {
	label: string;
	type: "otf" | "ttf";
}) {
	return `${MIAOSI_FONT_BASE_URL}${label}.${type}`;
}

export const SUBTITLE_FONT_OPTIONS: SubtitleFontOption[] = [
	{
		value: "MFChuangJiHei",
		label: "造字工房创际黑体",
		previewText: "造字工房创际黑体",
		sourceUrl: miaosiFontUrl({ label: "造字工房创际黑体", type: "otf" }),
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "MFFengChuan",
		label: "造字工房风川体",
		previewText: "造字工房风川体",
		sourceUrl: miaosiFontUrl({ label: "造字工房风川体", type: "otf" }),
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "MFTheGoldenEraJianYue",
		label: "造字工房黄金时代简约体",
		previewText: "造字工房黄金时代简约体",
		sourceUrl: miaosiFontUrl({
			label: "造字工房黄金时代简约体",
			type: "otf",
		}),
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "MFKeSong",
		label: "造字工房刻宋体",
		previewText: "造字工房刻宋体",
		sourceUrl: miaosiFontUrl({ label: "造字工房刻宋体", type: "otf" }),
		cssFallback: ["Songti SC", "SimSun", "serif"],
	},
	{
		value: "MFLangSongJianYuan",
		label: "造字工房朗宋简圆体",
		previewText: "造字工房朗宋简圆体",
		sourceUrl: miaosiFontUrl({ label: "造字工房朗宋简圆体", type: "otf" }),
		cssFallback: ["Songti SC", "SimSun", "serif"],
	},
	{
		value: "MFYanSong",
		label: "造字工房言宋体",
		previewText: "造字工房言宋体",
		sourceUrl: miaosiFontUrl({ label: "造字工房言宋体", type: "otf" }),
		cssFallback: ["Songti SC", "SimSun", "serif"],
	},
	{
		value: "MFYuanHei",
		label: "造字工房元黑体",
		previewText: "造字工房元黑体",
		sourceUrl: miaosiFontUrl({ label: "造字工房元黑体", type: "otf" }),
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "MFZhenSongJianYue",
		label: "造字工房臻宋简约体",
		previewText: "造字工房臻宋简约体",
		sourceUrl: miaosiFontUrl({ label: "造字工房臻宋简约体", type: "otf" }),
		cssFallback: ["Songti SC", "SimSun", "serif"],
	},
	{
		value: "MFZhuoHei",
		label: "造字工房卓黑体",
		previewText: "造字工房卓黑体",
		sourceUrl: miaosiFontUrl({ label: "造字工房卓黑体", type: "otf" }),
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "MFZhuoHeiXinChao",
		label: "造字工房卓黑新潮体",
		previewText: "造字工房卓黑新潮体",
		sourceUrl: miaosiFontUrl({ label: "造字工房卓黑新潮体", type: "otf" }),
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts JingDianHei 45",
		label: "点字经典黑-45",
		previewText: "点字经典黑-45",
		sourceUrl: miaosiFontUrl({ label: "点字经典黑-45", type: "ttf" }),
		aliases: ["IdeaFonts_JingDianHei_45"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts JingDianHei 80",
		label: "点字经典黑-80",
		previewText: "点字经典黑-80",
		sourceUrl: miaosiFontUrl({ label: "点字经典黑-80", type: "ttf" }),
		aliases: ["IdeaFonts_JingDianHei_80"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts LieHei 75",
		label: "点字烈黑-75",
		previewText: "点字烈黑-75",
		sourceUrl: miaosiFontUrl({ label: "点字烈黑-75", type: "ttf" }),
		aliases: ["IdeaFonts_LieHei_75"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts ShangHei",
		label: "点字尚黑",
		previewText: "点字尚黑",
		sourceUrl: miaosiFontUrl({ label: "点字尚黑", type: "ttf" }),
		aliases: ["IdeaFonts_ShangHei"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts ChuYuan 45",
		label: "点字初圆-45",
		previewText: "点字初圆-45",
		sourceUrl: miaosiFontUrl({ label: "点字初圆-45", type: "ttf" }),
		aliases: ["IdeaFonts_ChuYuan_45"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts ChuYuan 75",
		label: "点字初圆-75",
		previewText: "点字初圆-75",
		sourceUrl: miaosiFontUrl({ label: "点字初圆-75", type: "ttf" }),
		aliases: ["IdeaFonts_ChuYuan_75"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts YiYuan",
		label: "点字艺圆",
		previewText: "点字艺圆",
		sourceUrl: miaosiFontUrl({ label: "点字艺圆", type: "ttf" }),
		aliases: ["IdeaFonts_YiYuan"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts JianSong 55",
		label: "点字简宋-55",
		previewText: "点字简宋-55",
		sourceUrl: miaosiFontUrl({ label: "点字简宋-55", type: "ttf" }),
		aliases: ["IdeaFonts_JianSong_55"],
		cssFallback: ["Songti SC", "SimSun", "serif"],
	},
	{
		value: "IdeaFonts JianSong 95",
		label: "点字简宋-95",
		previewText: "点字简宋-95",
		sourceUrl: miaosiFontUrl({ label: "点字简宋-95", type: "ttf" }),
		aliases: ["IdeaFonts_JianSong_95"],
		cssFallback: ["Songti SC", "SimSun", "serif"],
	},
	{
		value: "IdeaFonts JiangHuZhaoPaiHei",
		label: "点字江户招牌黑",
		previewText: "点字江户招牌黑",
		sourceUrl: miaosiFontUrl({ label: "点字江户招牌黑", type: "ttf" }),
		aliases: ["IdeaFonts_JiangHuZhaoPaiHei"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts ChunHei",
		label: "点字醇黑",
		previewText: "点字醇黑",
		sourceUrl: miaosiFontUrl({ label: "点字醇黑", type: "ttf" }),
		aliases: ["IdeaFonts_ChunHei"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts ChaoFanZhanJia",
		label: "点字超凡战甲",
		previewText: "点字超凡战甲",
		sourceUrl: miaosiFontUrl({ label: "点字超凡战甲", type: "ttf" }),
		aliases: ["IdeaFonts_ChaoFanZhanJia"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts DunDun 55",
		label: "点字墩墩体-55",
		previewText: "点字墩墩体-55",
		sourceUrl: miaosiFontUrl({ label: "点字墩墩体-55", type: "ttf" }),
		aliases: ["IdeaFonts_DunDun_55"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts DunDun 95",
		label: "点字墩墩体-95",
		previewText: "点字墩墩体-95",
		sourceUrl: miaosiFontUrl({ label: "点字墩墩体-95", type: "ttf" }),
		aliases: ["IdeaFonts_DunDun_95"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts RouRun",
		label: "点字柔润体",
		previewText: "点字柔润体",
		sourceUrl: miaosiFontUrl({ label: "点字柔润体", type: "ttf" }),
		aliases: ["IdeaFonts_RouRun"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts JunRanSong",
		label: "点字俊然宋",
		previewText: "点字俊然宋",
		sourceUrl: miaosiFontUrl({ label: "点字俊然宋", type: "ttf" }),
		aliases: ["IdeaFonts_JunRanSong"],
		cssFallback: ["Songti SC", "SimSun", "serif"],
	},
	{
		value: "IdeaFonts MeiLingTi",
		label: "点字美玲体",
		previewText: "点字美玲体",
		sourceUrl: miaosiFontUrl({ label: "点字美玲体", type: "ttf" }),
		aliases: ["IdeaFonts_MeiLingTi"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts MuFengTi",
		label: "点字沐风体",
		previewText: "点字沐风体",
		sourceUrl: miaosiFontUrl({ label: "点字沐风体", type: "ttf" }),
		aliases: ["IdeaFonts_MuFengTi"],
		cssFallback: ["Kaiti SC", "KaiTi", "serif"],
	},
	{
		value: "IdeaFonts ManHei",
		label: "点字漫黑",
		previewText: "点字漫黑",
		sourceUrl: miaosiFontUrl({ label: "点字漫黑", type: "ttf" }),
		aliases: ["IdeaFonts_ManHei"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts ZongYi 85",
		label: "点字综艺体-85",
		previewText: "点字综艺体-85",
		sourceUrl: miaosiFontUrl({ label: "点字综艺体-85", type: "ttf" }),
		aliases: ["IdeaFonts_ZongYi_85"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts HaoHun",
		label: "点字浩魂体",
		previewText: "点字浩魂体",
		sourceUrl: miaosiFontUrl({ label: "点字浩魂体", type: "ttf" }),
		aliases: ["IdeaFonts_HaoHun"],
		cssFallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
	},
	{
		value: "IdeaFonts BangKeTi",
		label: "点字榜刻体",
		previewText: "点字榜刻体",
		sourceUrl: miaosiFontUrl({ label: "点字榜刻体", type: "ttf" }),
		aliases: ["IdeaFonts_BangKeTi"],
		cssFallback: ["Kaiti SC", "KaiTi", "serif"],
	},
];

export function getSubtitleFontOption({
	value,
}: {
	value: string;
}): SubtitleFontOption | undefined {
	return SUBTITLE_FONT_OPTIONS.find(
		(font) => font.value === value || font.aliases?.includes(value),
	);
}

export function subtitleFontFamilyCss({ font }: { font: SubtitleFontOption }) {
	return [
		`"${font.value}"`,
		...(font.aliases ?? []).map((alias) => `"${alias}"`),
		...(font.cssFallback ?? ["PingFang SC", "Microsoft YaHei", "sans-serif"]),
	].join(", ");
}

const SUBTITLE_PRESET_FONT_SIZE = 3.5;
const TEXT_TAB_PRESET_FONT_SIZE = 12;

function textPresetStrokeToSubtitleWidth({ width }: { width: number }) {
	return (width / TEXT_TAB_PRESET_FONT_SIZE) * SUBTITLE_PRESET_FONT_SIZE;
}

const BASE_SUBTITLE_STYLE: RichTextRunStyle = {
	fontFamily: "MFChuangJiHei",
	fontSize: SUBTITLE_PRESET_FONT_SIZE,
	fontWeight: "bold",
	fontStyle: "normal",
	outlineWidth: textPresetStrokeToSubtitleWidth({ width: 1.4 }),
	opacity: 1,
};

function preset({
	id,
	name,
	color,
	outlineColor,
	outlineWidth = textPresetStrokeToSubtitleWidth({ width: 1.4 }),
}: {
	id: string;
	name: string;
	color: string;
	outlineColor: string;
	outlineWidth?: number;
}): SubtitleStylePreset {
	return {
		id,
		name,
		style: {
			...BASE_SUBTITLE_STYLE,
			color,
			outlineColor,
			outlineWidth,
		},
	};
}

export const SUBTITLE_STYLE_PRESETS: SubtitleStylePreset[] = [
	preset({
		id: "white-black",
		name: "白字黑边",
		color: "#ffffff",
		outlineColor: "#101114",
		outlineWidth: textPresetStrokeToSubtitleWidth({ width: 1.5 }),
	}),
	preset({
		id: "black-white",
		name: "黑字白边",
		color: "#111827",
		outlineColor: "#ffffff",
		outlineWidth: textPresetStrokeToSubtitleWidth({ width: 1.2 }),
	}),
	preset({
		id: "yellow-black",
		name: "黄字黑边",
		color: "#ffd84d",
		outlineColor: "#161616",
		outlineWidth: textPresetStrokeToSubtitleWidth({ width: 1.5 }),
	}),
	preset({
		id: "gold-black",
		name: "金字黑边",
		color: "#ffbf1f",
		outlineColor: "#111111",
	}),
	preset({
		id: "lime-black",
		name: "青黄黑边",
		color: "#cffd51",
		outlineColor: "#000000",
	}),
	preset({
		id: "red-white",
		name: "红字白边",
		color: "#ff4a3d",
		outlineColor: "#ffffff",
		outlineWidth: textPresetStrokeToSubtitleWidth({ width: 1.2 }),
	}),
	preset({
		id: "pink-white",
		name: "粉字白边",
		color: "#ff8dc7",
		outlineColor: "#ffffff",
		outlineWidth: textPresetStrokeToSubtitleWidth({ width: 1.2 }),
	}),
	preset({
		id: "orange-yellow",
		name: "橙字黄边",
		color: "#ff7a18",
		outlineColor: "#ffe55b",
		outlineWidth: textPresetStrokeToSubtitleWidth({ width: 1.4 }),
	}),
	preset({
		id: "orange-purple",
		name: "橙字紫边",
		color: "#ff9f43",
		outlineColor: "#7c3aed",
	}),
	preset({
		id: "coral-white",
		name: "珊瑚白边",
		color: "#ff735c",
		outlineColor: "#ffffff",
	}),
	preset({
		id: "cream-black",
		name: "米白黑边",
		color: "#fff7d6",
		outlineColor: "#111111",
	}),
	preset({
		id: "mint-black",
		name: "青字深边",
		color: "#41e7a7",
		outlineColor: "#063a2c",
		outlineWidth: textPresetStrokeToSubtitleWidth({ width: 1.4 }),
	}),
	preset({
		id: "green-black",
		name: "绿字黑边",
		color: "#21d889",
		outlineColor: "#073b2b",
	}),
	preset({
		id: "purple-black",
		name: "紫字深边",
		color: "#d47bff",
		outlineColor: "#2b0c48",
		outlineWidth: textPresetStrokeToSubtitleWidth({ width: 1 }),
	}),
	preset({
		id: "pink-black",
		name: "粉字黑边",
		color: "#f472b6",
		outlineColor: "#220617",
	}),
	preset({
		id: "pink-purple",
		name: "粉字紫边",
		color: "#ff7ad9",
		outlineColor: "#4c1d95",
	}),
	preset({
		id: "rose-black",
		name: "玫红黑边",
		color: "#f9a8d4",
		outlineColor: "#111827",
	}),
	preset({
		id: "blue-white",
		name: "蓝字白边",
		color: "#2563eb",
		outlineColor: "#ffffff",
	}),
	preset({
		id: "sky-blue",
		name: "天蓝深边",
		color: "#60a5fa",
		outlineColor: "#1d4ed8",
	}),
	preset({
		id: "neon-lime",
		name: "荧光绿边",
		color: "#bef264",
		outlineColor: "#0f172a",
	}),
	preset({
		id: "lime-green",
		name: "亮绿黑边",
		color: "#a3e635",
		outlineColor: "#052e16",
	}),
	preset({
		id: "brown-white",
		name: "棕字白边",
		color: "#b45309",
		outlineColor: "#ffffff",
	}),
	preset({
		id: "red-pale",
		name: "红棕浅边",
		color: "#b91c1c",
		outlineColor: "#fecaca",
	}),
	preset({
		id: "navy-white",
		name: "深蓝白边",
		color: "#0f172a",
		outlineColor: "#e0f2fe",
	}),
	preset({
		id: "teal-white",
		name: "青蓝白边",
		color: "#0f766e",
		outlineColor: "#ccfbf1",
	}),
	preset({
		id: "olive-white",
		name: "橄榄白边",
		color: "#84cc16",
		outlineColor: "#f7fee7",
	}),
	preset({
		id: "plum-pink",
		name: "梅紫粉边",
		color: "#831843",
		outlineColor: "#fbcfe8",
	}),
	preset({
		id: "cyan-slate",
		name: "青字灰边",
		color: "#67e8f9",
		outlineColor: "#334155",
	}),
	preset({
		id: "violet-pink",
		name: "紫字粉边",
		color: "#c084fc",
		outlineColor: "#f0abfc",
	}),
	preset({
		id: "blue-yellow",
		name: "蓝字黄边",
		color: "#0ea5e9",
		outlineColor: "#fde047",
	}),
	preset({
		id: "yellow-white",
		name: "黄字白边",
		color: "#fef08a",
		outlineColor: "#ffffff",
	}),
	preset({
		id: "charcoal-white",
		name: "灰黑白边",
		color: "#18181b",
		outlineColor: "#ffffff",
	}),
	preset({
		id: "lime-navy",
		name: "嫩黄蓝边",
		color: "#d9f99d",
		outlineColor: "#0f172a",
	}),
	preset({
		id: "teal-dark",
		name: "湖绿深边",
		color: "#5eead4",
		outlineColor: "#134e4a",
	}),
	preset({
		id: "green-white",
		name: "绿字白边",
		color: "#22c55e",
		outlineColor: "#ffffff",
	}),
];

export function stylePresetToCss({
	style,
	outlineScale = 4,
}: {
	style: RichTextRunStyle;
	outlineScale?: number;
}) {
	const outlineWidth = Math.min(
		2,
		Math.max(1, (style.outlineWidth ?? 0.35) * outlineScale),
	);

	return {
		color: style.color ?? "#ffffff",
		WebkitTextStroke: `${outlineWidth}px ${style.outlineColor ?? "#000000"}`,
		textShadow: `0 1px 0 ${style.outlineColor ?? "rgba(0,0,0,0.45)"}`,
		fontWeight: style.fontWeight === "normal" ? 700 : 900,
		fontStyle: style.fontStyle ?? "normal",
	};
}
