import type { SubtitleStyleOverrides } from "@/subtitles/types";

export interface VideoEditorSubtitle {
	text: string;
	start: number;
	duration: number;
	fonts?: VideoEditorSubtitleFontRun[];
	style?: SubtitleStyleOverrides;
}

export interface VideoEditorSubtitleFontRun {
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

export interface VideoEditorData {
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
	videoSegments?: VideoEditorVideoSegment[];
	subtitles: VideoEditorSubtitle[];
}

export interface VideoEditorVideoSegment {
	id?: string;
	title?: string;
	videoUrl: string;
	coverUrl?: string;
	duration?: number;
	start?: number;
	subtitles?: VideoEditorSubtitle[];
	subtitleDataUrl?: string;
	raw?: unknown;
}
