import type { SubtitleStyleOverrides } from "@/subtitles/types";

export interface MakeSameSubtitle {
	text: string;
	start: number;
	duration: number;
	fonts?: MakeSameSubtitleFontRun[];
	style?: SubtitleStyleOverrides;
}

export interface MakeSameSubtitleFontRun {
	value: string;
	font: {
		family: string;
		size: number;
		color: string;
		outline_color: string;
		outline_width: number;
		is_bold: boolean;
		is_italic: boolean;
		opacity: number;
		back_opacity?: number | null;
		back_color?: string;
		spacing?: number;
		bg_opacity?: number;
	};
	is_high_light?: boolean;
}

export interface MakeSameStyle {
	color: string;
	background: string;
	stroke: string;
	label: string;
}

export interface MakeSameMusic {
	title: string;
	author: string;
	duration: string;
	category: string;
}

export interface MakeSameEditorData {
	id: string;
	projectName: string;
	title: string;
	width: number;
	height: number;
	duration: number;
	videoUrl: string;
	audioUrl: string;
	coverUrl: string;
	musicName: string;
	videoSegments?: MakeSameVideoSegment[];
	subtitles: MakeSameSubtitle[];
}

export interface MakeSameVideoSegment {
	id?: string;
	title?: string;
	videoUrl: string;
	coverUrl?: string;
	duration?: number;
	start?: number;
	subtitles?: MakeSameSubtitle[];
	subtitleDataUrl?: string;
	raw?: unknown;
}

export const subtitleStyles: MakeSameStyle[] = [
	{ color: "#111827", background: "#f2f4f8", stroke: "#ffffff", label: "黑白" },
	{ color: "#f97316", background: "#fff7ed", stroke: "#111827", label: "橙黑" },
	{ color: "#facc15", background: "#fefce8", stroke: "#111827", label: "黄黑" },
	{ color: "#22c55e", background: "#f0fdf4", stroke: "#111827", label: "绿黑" },
	{ color: "#8b5cf6", background: "#f5f3ff", stroke: "#111827", label: "紫黑" },
	{ color: "#ec4899", background: "#fdf2f8", stroke: "#111827", label: "粉黑" },
	{ color: "#3b82f6", background: "#eff6ff", stroke: "#ffffff", label: "蓝白" },
	{ color: "#84cc16", background: "#f7fee7", stroke: "#111827", label: "青绿" },
	{ color: "#ef4444", background: "#fef2f2", stroke: "#111827", label: "红黑" },
	{ color: "#14b8a6", background: "#f0fdfa", stroke: "#111827", label: "松石" },
	{ color: "#f59e0b", background: "#fffbeb", stroke: "#111827", label: "金色" },
	{ color: "#64748b", background: "#f8fafc", stroke: "#ffffff", label: "灰白" },
];

export const musicCategories = [
	"时尚/魅惑",
	"可爱/童真",
	"温馨/幸福",
	"奇幻/魔法",
	"欢快",
	"古风",
	"节日/庆典",
	"氛围音乐/剧情",
	"热血",
	"国风",
	"冥想/空灵",
	"辉煌/庄重",
	"滑稽/搞笑",
	"浪漫",
	"流行",
	"史诗",
	"宁静",
	"紧张",
];

export const musicSamples: MakeSameMusic[] = [
	{
		title: "时尚清新动感电子",
		author: "U-Music",
		duration: "02:28",
		category: "时尚/魅惑",
	},
	{
		title: "热情时尚放克节奏",
		author: "BeardMusicStock",
		duration: "02:27",
		category: "欢快",
	},
	{
		title: "热情放克 时尚创意",
		author: "废铁",
		duration: "01:28",
		category: "流行",
	},
	{
		title: "快闪节奏 活力无限",
		author: "灵泽音乐",
		duration: "01:11",
		category: "欢快",
	},
	{
		title: "时尚热情活力放克",
		author: "RockEagle",
		duration: "01:25",
		category: "热血",
	},
	{
		title: "全景声极速国潮",
		author: "寻浪文化",
		duration: "02:48",
		category: "国风",
	},
	{
		title: "悠然之境",
		author: "时代环球娱乐",
		duration: "02:48",
		category: "宁静",
	},
	{
		title: "法式浪漫甜蜜时尚",
		author: "Italian Way Music",
		duration: "03:53",
		category: "浪漫",
	},
];

export const stickerPresets = [
	"爆款",
	"新品",
	"限时",
	"同款",
	"热卖",
	"箭头",
	"亮点",
	"优惠",
	"精选",
	"推荐",
	"划线",
	"标签",
];

export const makeSameDemo: MakeSameEditorData = {
	id: "512830335",
	projectName: "同款视频 mock",
	title: "四季花院静居",
	width: 720,
	height: 1280,
	duration: 73.6,
	videoUrl:
		"https://asset.gdtimg.com/0bc3gacb6aae2eal3v6y7futsmged4yaihya.f0.mp4?dis_k=50abc60183fd757421b8ccb909e2b7e5&dis_t=1779072709",
	audioUrl:
		"https://asset.gdtimg.com/0bc3juc6saafv4aew2wzjbutqtoe5fgql2ia.f0.mp3?dis_k=027dc116c8fa142ac78e97e0596e02c5&dis_t=1776067299",
	coverUrl:
		"https://asset.gdtimg.com/0bc3lificaakkqacqyilxzvdowweqfnavaia.f0.jpg?dis_k=f51bbb445c5b4fe62e708dc6dd2f54b1&dis_t=1779071214&m=b598aa6fb2947565f709c72fb07064c5",
	musicName: "智能推荐音乐",
	subtitles: [
		{
			text: "这套叠加别墅是\n有156个平方",
			start: 0,
			duration: 3.372,
			fonts: [
				{
					value: "这套叠加别墅是\n有156个",
					font: {
						family: "MFChuangJiHei",
						size: 72,
						color: "FFFFFF",
						outline_color: "000000",
						outline_width: 4,
						is_bold: false,
						is_italic: false,
						opacity: 1,
						back_opacity: null,
						back_color: "",
						spacing: 0,
						bg_opacity: 0,
					},
					is_high_light: true,
				},
				{
					value: "平方",
					font: {
						family: "MFChuangJiHei",
						size: 72,
						color: "CFFD51",
						outline_color: "000000",
						outline_width: 4,
						is_bold: false,
						is_italic: false,
						opacity: 1,
						back_opacity: null,
						back_color: "",
						spacing: 0,
						bg_opacity: 0,
					},
					is_high_light: true,
				},
			],
		},
		{ text: "院子不大", start: 3.372, duration: 0.964 },
		{ text: "养了各种花之后呢", start: 4.336, duration: 1.927 },
		{ text: "一年四季会有不\n同的这个风景", start: 6.263, duration: 3.132 },
		{ text: "小孩子是已经在新湾毕业了", start: 9.395, duration: 2.89 },
		{
			text: "所以这套房子也完成了他的\n使命了",
			start: 12.286,
			duration: 3.613,
		},
		{ text: "房主现在打算拿出来出售", start: 15.9, duration: 2.649 },
		{ text: "考虑到客厅是有\n7米2的宽度", start: 18.55, duration: 3.132 },
		{ text: "所以房主在一侧\n摆了一组沙发", start: 21.682, duration: 3.132 },
		{ text: "主要是平时一家人喝茶聊天", start: 24.814, duration: 2.891 },
		{ text: "因为家里面都没\n有放电视机哦", start: 27.705, duration: 3.132 },
		{ text: "靠窗的位置呢", start: 30.837, duration: 1.445 },
		{ text: "就留给了小孩子的这个书桌", start: 32.281, duration: 2.89 },
		{ text: "家里面因为人口少", start: 35.173, duration: 1.926 },
		{ text: "一方这个小餐桌呢", start: 37.1, duration: 1.928 },
		{ text: "正好是一家三口三菜一汤", start: 39.028, duration: 2.65 },
		{ text: "那平时买菜的话", start: 41.678, duration: 1.685 },
		{ text: "房主也是喜欢去\n隔壁的邻里中心", start: 43.364, duration: 3.373 },
		{ text: "就在菜场逛一逛", start: 46.737, duration: 1.686 },
		{ text: "更有生活的感觉", start: 48.423, duration: 1.687 },
		{ text: "二楼是有三个房间的", start: 50.11, duration: 2.167 },
		{ text: "朝南的两个房间是两个卧室", start: 52.278, duration: 2.89 },
		{ text: "北边的房间就当储藏室用了", start: 55.169, duration: 2.891 },
		{ text: "虽然走出小区", start: 58.06, duration: 1.445 },
		{
			text: "就能马上到苏州中心那种繁\n华热闹的地方",
			start: 59.506,
			duration: 4.335,
		},
		{ text: "但房主还是更喜\n欢他这套房子", start: 63.842, duration: 3.132 },
		{ text: "给他带来的宁静", start: 66.974, duration: 1.686 },
		{ text: "大家喜欢这套房子吗", start: 68.66, duration: 2.168 },
		{ text: "喜欢的话赶紧后台私信我吧", start: 70.829, duration: 2.89 },
	],
};
