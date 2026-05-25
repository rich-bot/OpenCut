import type { TrackType } from "@/timeline";
import { editorT } from "@/i18n/editor";

export const DEFAULT_TRACK_NAMES: Record<TrackType, string> = {
	video: editorT("track.video"),
	text: editorT("track.text"),
	audio: editorT("track.audio"),
	graphic: editorT("track.graphic"),
	effect: editorT("track.effect"),
} as const;
