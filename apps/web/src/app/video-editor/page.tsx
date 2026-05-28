"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
	MakeSameEditorWorkspace,
	type EditorLayoutMode,
} from "@/app/editor/[project_id]/page";
import { storageService } from "@/services/storage/service";
import { CURRENT_PROJECT_VERSION } from "@/services/storage/migrations";
import { DEFAULT_BACKGROUND_COLOR } from "@/background/color";
import { DEFAULT_FPS } from "@/fps/defaults";
import { readVideoFile } from "@/media/mediabunny";
import { buildElementFromMedia, buildLibraryAudioElement } from "@/timeline";
import { buildSeparatedAudioElement } from "@/timeline/audio-separation";
import { buildSubtitleTextElement } from "@/subtitles/build-subtitle-text-element";
import {
	parseHiddenAssetTabs,
	type Tab,
} from "@/components/editor/panels/assets/assets-panel-store";
import { createRichTextRunsFromMiaosiFonts } from "@/text/rich-text";
import { generateUUID } from "@/utils/id";
import { mediaTimeFromSeconds, type MediaTime, ZERO_MEDIA_TIME } from "@/wasm";
import type {
	VideoEditorData,
	VideoEditorSubtitle,
	VideoEditorVideoSegment,
} from "@/video-editor/types";
import type { MediaAsset, MediaType } from "@/media/types";
import type { TProject } from "@/project/types";
import type {
	CreateTimelineElement,
	ImageElement,
	SceneTracks,
	TimelineElement,
	TScene,
	VideoElement,
} from "@/timeline";

type PrimaryAsset = {
	asset: MediaAsset;
	mediaType: Extract<MediaType, "video" | "image">;
	startSeconds: number;
	timelineDurationSeconds: number;
};

const VIDEO_EDITOR_PROJECT_SCHEMA_VERSION = 12;
const VIDEO_EDITOR_SESSION_PREFIX = "neo:opencut:video-editor:";

type LoadState =
	| {
			status: "loading";
			id: string;
			message: string;
			hideHeader: boolean;
			hiddenAssetTabs?: readonly Tab[];
			layoutMode?: EditorLayoutMode;
	  }
	| {
			status: "ready";
			id: string;
			projectId: string;
			hideHeader: boolean;
			hiddenAssetTabs?: readonly Tab[];
			layoutMode?: EditorLayoutMode;
	  }
	| {
			status: "error";
			id: string;
			message: string;
			hideHeader: boolean;
			hiddenAssetTabs?: readonly Tab[];
			layoutMode?: EditorLayoutMode;
	  };

export default function VideoEditorPage() {
	const [state, setState] = useState<LoadState>({
		status: "loading",
		id: "",
		message: "正在准备剪辑项目...",
		hideHeader: false,
	});

	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const id = searchParams.get("id")?.trim() || "";
		const reset = searchParams.get("reset") === "1";
		const hideHeader = searchParams.get("hideHeader") === "1";
		const hiddenAssetTabs = parseHiddenAssetTabs(
			searchParams.get("hiddenAssetTabs"),
		);
		const layoutMode = parseMakeSameLayoutMode(searchParams.get("layout"));

		if (!id) {
			setState({
				status: "error",
				id: "",
				hideHeader,
				hiddenAssetTabs,
				layoutMode,
				message: "缺少剪辑项目 ID，请从业务页面重新打开剪辑器",
			});
			return;
		}

		setState({
			status: "loading",
			id,
			message: "正在准备剪辑项目...",
			hideHeader,
			hiddenAssetTabs,
			layoutMode,
		});

		ensureMakeSameProject({ id, reset })
			.then((projectId) => {
				setState({
					status: "ready",
					id,
					projectId,
					hideHeader,
					hiddenAssetTabs,
					layoutMode,
				});
			})
			.catch((error) => {
				console.error("[video-editor] failed to prepare project", error);
				setState({
					status: "error",
					id,
					hideHeader,
					hiddenAssetTabs,
					layoutMode,
					message:
						error instanceof Error
							? error.message
							: "剪辑项目准备失败，请稍后重试",
				});
			});
	}, []);

	if (state.status === "ready") {
		return (
			<MakeSameEditorWorkspace
				key={state.projectId}
				projectId={state.projectId}
				makeSameId={state.id}
				isEmbedded
				hideHeader={state.hideHeader}
				hiddenAssetTabs={state.hiddenAssetTabs}
				defaultLayoutMode={state.layoutMode ?? "vertical-preview"}
			/>
		);
	}

	return (
		<div className="bg-background flex h-screen w-screen items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				{state.status === "loading" ? (
					<Loader2 className="text-muted-foreground size-8 animate-spin" />
				) : null}
				<p className="text-muted-foreground text-sm">{state.message}</p>
			</div>
		</div>
	);
}

function parseMakeSameLayoutMode(
	value: string | null,
): EditorLayoutMode | undefined {
	if (value === "classic" || value === "normal") return "classic";
	if (value === "vertical-preview" || value === "vertical") {
		return "vertical-preview";
	}
	return undefined;
}

async function ensureMakeSameProject({
	id,
	reset,
}: {
	id: string;
	reset: boolean;
}) {
	const projectId = buildMakeSameProjectId({ id });
	const data = await loadMakeSameData({ id });
	const signature = buildMakeSameProjectSignature({ data });

	if (!reset) {
		const existing = await storageService.loadProject({ id: projectId });
		if (
			existing?.project &&
			(await isReusableMakeSameProject({
				projectId,
				project: existing.project,
				signature,
			}))
		) {
			return projectId;
		}
	}

	const primaryAssets = await createPrimaryAssets({ data });

	await storageService.deleteProjectMedia({ projectId }).catch(() => undefined);

	for (const primaryAsset of primaryAssets) {
		await storageService.saveMediaAsset({
			projectId,
			mediaAsset: primaryAsset.asset,
		});
	}

	const project = buildMakeSameProject({
		projectId,
		data,
		primaryAssets,
	});

	await storageService.saveProject({ project });
	window.localStorage.setItem(
		getMakeSameProjectMarkerKey({ projectId }),
		signature,
	);
	return projectId;
}

function buildMakeSameProjectId({ id }: { id: string }) {
	return `video-editor-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function getMakeSameProjectMarkerKey({ projectId }: { projectId: string }) {
	return `opencut:video-editor-project:${projectId}:signature`;
}

function buildMakeSameProjectSignature({ data }: { data: VideoEditorData }) {
	return JSON.stringify({
		version: VIDEO_EDITOR_PROJECT_SCHEMA_VERSION,
		id: data.id,
		videoUrl: data.videoUrl,
		audioUrl: data.audioUrl,
		coverUrl: data.coverUrl,
		duration: data.duration,
		width: data.width,
		height: data.height,
		title: data.title,
		videoSegments: (data.videoSegments ?? []).map((segment) => [
			segment.id,
			segment.videoUrl,
			segment.coverUrl,
			segment.duration,
			segment.start,
			segment.subtitles,
		]),
		subtitles: data.subtitles.map((subtitle) => [
			subtitle.text,
			subtitle.start,
			subtitle.duration,
			subtitle.fonts,
			subtitle.style,
		]),
	});
}

async function isReusableMakeSameProject({
	projectId,
	project,
	signature,
}: {
	projectId: string;
	project: TProject;
	signature: string;
}) {
	if (
		window.localStorage.getItem(getMakeSameProjectMarkerKey({ projectId })) !==
		signature
	) {
		return false;
	}

	const scene = project.scenes.find(
		(item) => item.id === project.currentSceneId,
	);
	const primaryElement = scene?.tracks.main.elements.find(
		(element) => "mediaId" in element,
	);
	if (!primaryElement || !("mediaId" in primaryElement)) return false;

	const mediaAsset = await storageService.loadMediaAsset({
		projectId,
		id: primaryElement.mediaId,
	});
	return Boolean(mediaAsset?.file?.size);
}

async function loadMakeSameData({ id }: { id: string }) {
	const sessionData = loadMakeSameSessionData({ id });
	if (sessionData) {
		return normalizeMakeSameData({ id, payload: sessionData });
	}
	throw new Error("未找到剪辑项目数据，请从业务页面重新打开剪辑器");
}

function loadMakeSameSessionData({ id }: { id: string }) {
	try {
		const raw = window.sessionStorage.getItem(
			`${VIDEO_EDITOR_SESSION_PREFIX}${id}`,
		);
		if (!raw) return null;
		return JSON.parse(raw) as Partial<VideoEditorData>;
	} catch (error) {
		console.warn("[video-editor] session data parse failed", error);
		return null;
	}
}

function normalizeMakeSameData({
	id,
	payload,
}: {
	id: string;
	payload: Partial<VideoEditorData>;
}): VideoEditorData {
	const videoSegments = Array.isArray(payload.videoSegments)
		? payload.videoSegments.filter(
				(segment): segment is VideoEditorVideoSegment =>
					!!segment &&
					typeof segment.videoUrl === "string" &&
					!!segment.videoUrl,
			)
		: undefined;
	const duration =
		typeof payload.duration === "number" && Number.isFinite(payload.duration)
			? payload.duration
			: getVideoSegmentsDuration(videoSegments);
	const width = getPositiveSeconds(payload.width);
	const height = getPositiveSeconds(payload.height);

	if (!width || !height) {
		throw new Error("剪辑项目缺少视频尺寸信息");
	}
	if (!duration) {
		throw new Error("剪辑项目缺少视频时长信息");
	}
	if (!videoSegments?.length && !payload.videoUrl) {
		throw new Error("剪辑项目缺少可编辑视频素材");
	}

	return {
		id,
		projectName: payload.projectName || `剪辑项目 ${id}`,
		title: payload.title || "",
		width,
		height,
		duration,
		videoUrl: payload.videoUrl || videoSegments?.[0]?.videoUrl || "",
		audioUrl: payload.audioUrl || "",
		coverUrl: payload.coverUrl || videoSegments?.[0]?.coverUrl || "",
		musicName: payload.musicName || "",
		videoSegments,
		subtitles: Array.isArray(payload.subtitles) ? payload.subtitles : [],
	};
}

async function createPrimaryAssets({
	data,
}: {
	data: VideoEditorData;
}): Promise<PrimaryAsset[]> {
	const segments = normalizePrimaryVideoSegments({ data });
	const assets: PrimaryAsset[] = [];
	let cursor = 0;
	for (const [index, segment] of segments.entries()) {
		const asset = await createPrimaryAssetFromSegment({
			data,
			segment,
			index,
			startSeconds: cursor,
		});
		if (asset) {
			assets.push(asset);
			cursor += asset.timelineDurationSeconds;
		}
	}
	if (!assets.length) {
		throw new Error("剪辑项目视频素材加载失败");
	}
	return assets;
}

function normalizePrimaryVideoSegments({ data }: { data: VideoEditorData }) {
	return data.videoSegments?.length
		? data.videoSegments
		: [
				{
					id: data.id,
					title: data.title,
					videoUrl: data.videoUrl,
					coverUrl: data.coverUrl,
					duration: data.duration,
					start: 0,
				},
			];
}

function getVideoSegmentsDuration(segments?: VideoEditorVideoSegment[]) {
	if (!segments?.length) return 0;
	return segments.reduce((max, segment, index) => {
		const start = getFiniteSeconds(segment.start) ?? (index === 0 ? 0 : max);
		const duration = getPositiveSeconds(segment.duration) ?? 0;
		return Math.max(max, start + duration);
	}, 0);
}

function getFiniteSeconds(value: unknown) {
	const seconds = typeof value === "number" ? value : Number(value);
	return Number.isFinite(seconds) ? seconds : undefined;
}

function getPositiveSeconds(value: unknown) {
	const seconds = getFiniteSeconds(value);
	return seconds !== undefined && seconds > 0 ? seconds : undefined;
}

async function createPrimaryAssetFromSegment({
	data,
	segment,
	index,
	startSeconds,
}: {
	data: VideoEditorData;
	segment: VideoEditorVideoSegment;
	index: number;
	startSeconds: number;
}): Promise<PrimaryAsset | null> {
	const videoAsset = await fetchAssetFile({
		url: segment.videoUrl,
		name: `${segment.title || data.title || data.id}-${index + 1}.mp4`,
		fallbackType: "video/mp4",
	}).catch((error) => {
		console.warn("[video-editor] video asset fetch failed", error);
		return null;
	});

	if (videoAsset) {
		const videoData = await readVideoFile({
			file: videoAsset,
			thumbnailTimeSeconds: getMakeSameThumbnailTime({ data, segment }),
		}).catch((error) => {
			console.warn("[video-editor] video metadata read failed", error);
			return null;
		});
		const timelineDurationSeconds =
			getPositiveSeconds(videoData?.duration) ??
			getPositiveSeconds(segment.duration) ??
			getPositiveSeconds(data.duration) ??
			0.2;

		return {
			mediaType: "video",
			startSeconds,
			timelineDurationSeconds,
			asset: {
				id: `video-editor-video-${data.id}-${index}`,
				name: videoAsset.name,
				type: "video",
				file: videoAsset,
				width: videoData?.width ?? data.width,
				height: videoData?.height ?? data.height,
				duration: timelineDurationSeconds,
				fps: videoData?.fps,
				hasAudio: videoData?.hasAudio,
				thumbnailUrl: videoData?.thumbnailUrl ?? undefined,
			},
		};
	}

	const coverAsset = await fetchAssetFile({
		url: segment.coverUrl || data.coverUrl,
		name: `${segment.title || data.title || data.id}-${index + 1}.jpg`,
		fallbackType: "image/jpeg",
	}).catch((error) => {
		console.warn("[video-editor] cover asset fetch failed", error);
		return null;
	});

	if (!coverAsset) return null;
	const imageDuration =
		getPositiveSeconds(segment.duration) ??
		getPositiveSeconds(data.duration) ??
		0.2;

	return {
		mediaType: "image",
		startSeconds,
		timelineDurationSeconds: imageDuration,
		asset: {
			id: `video-editor-cover-${data.id}-${index}`,
			name: coverAsset.name,
			type: "image",
			file: coverAsset,
			width: data.width,
			height: data.height,
			duration: imageDuration,
			thumbnailUrl: segment.coverUrl || data.coverUrl,
		},
	};
}

function getMakeSameThumbnailTime({
	data,
	segment,
}: {
	data: VideoEditorData;
	segment?: VideoEditorVideoSegment;
}) {
	const duration =
		getPositiveSeconds(segment?.duration) ??
		getPositiveSeconds(data.duration) ??
		4;
	return Math.min(16, Math.max(1, duration * 0.25));
}

async function fetchAssetFile({
	url,
	name,
	fallbackType,
}: {
	url: string;
	name: string;
	fallbackType: string;
}) {
	if (!url) return null;

	const response = await fetchAssetResponse({ url });
	if (!response.ok) return null;

	const blob = await response.blob();
	if (blob.size === 0) return null;

	return new File([blob], name, {
		type: blob.type || fallbackType,
		lastModified: Date.now(),
	});
}

async function fetchAssetResponse({ url }: { url: string }) {
	const directResponse = await fetch(url, { cache: "force-cache" }).catch(
		(error) => {
			console.warn("[video-editor] direct asset fetch failed", {
				url,
				error,
			});
			return null;
		},
	);

	return directResponse ?? new Response(null, { status: 400 });
}

function buildMakeSameProject({
	projectId,
	data,
	primaryAssets,
}: {
	projectId: string;
	data: VideoEditorData;
	primaryAssets: PrimaryAsset[];
}): TProject {
	const now = new Date();
	const canvasSize = {
		width: data.width,
		height: data.height,
	};
	const projectDurationSeconds =
		getPrimaryAssetsEndSeconds({ primaryAssets }) ||
		getPositiveSeconds(data.duration) ||
		0.2;
	const duration = mediaTimeFromSeconds({ seconds: projectDurationSeconds });
	const tracks = buildMakeSameTracks({
		data,
		primaryAssets,
		canvasSize,
		projectDurationSeconds,
	});
	const scene: TScene = {
		id: generateUUID(),
		name: "主场景",
		isMain: true,
		tracks,
		bookmarks: [],
		createdAt: now,
		updatedAt: now,
	};

	return {
		metadata: {
			id: projectId,
			name: data.projectName || `同款剪辑 ${data.id}`,
			duration,
			createdAt: now,
			updatedAt: now,
			thumbnail: data.coverUrl,
		},
		scenes: [scene],
		currentSceneId: scene.id,
		settings: {
			fps: DEFAULT_FPS,
			canvasSize,
			canvasSizeMode: "preset",
			lastCustomCanvasSize: null,
			originalCanvasSize: canvasSize,
			background: {
				type: "color",
				color: DEFAULT_BACKGROUND_COLOR,
			},
		},
		version: CURRENT_PROJECT_VERSION,
		timelineViewState: {
			zoomLevel: 1,
			scrollLeft: 0,
			playheadTime: ZERO_MEDIA_TIME,
		},
	};
}

function getPrimaryAssetsEndSeconds({
	primaryAssets,
}: {
	primaryAssets: PrimaryAsset[];
}) {
	return primaryAssets.reduce(
		(max, primaryAsset) =>
			Math.max(
				max,
				primaryAsset.startSeconds + primaryAsset.timelineDurationSeconds,
			),
		0,
	);
}

function buildMakeSameTracks({
	data,
	primaryAssets,
	canvasSize,
	projectDurationSeconds,
}: {
	data: VideoEditorData;
	primaryAssets: PrimaryAsset[];
	canvasSize: { width: number; height: number };
	projectDurationSeconds: number;
}): SceneTracks {
	const duration = mediaTimeFromSeconds({ seconds: projectDurationSeconds });
	const titleElement = data.title
		? withElementId(
				buildSubtitleTextElement({
					index: 0,
					caption: {
						text: data.title,
						startTime: 0,
						duration: projectDurationSeconds,
						style: {
							fontSize: 4.6,
							color: "#ff4fd8",
							fontWeight: "bold",
							lineHeight: 1.05,
							placement: {
								verticalAlign: "top",
								marginVerticalRatio: 0.08,
							},
						},
					},
					canvasSize,
				}),
			)
		: null;
	const subtitleElements = getTimelineSubtitles({ data, primaryAssets }).map(
		(subtitle, index) =>
			withElementId(
				buildSubtitleTextElement({
					index,
					caption: subtitleToCaption({ subtitle }),
					canvasSize,
				}),
			),
	);
	const mainElements = primaryAssets.map((primaryAsset) =>
		buildPrimaryTimelineElement({
			primaryAsset,
			duration: mediaTimeFromSeconds({
				seconds: primaryAsset.timelineDurationSeconds || data.duration,
			}),
			startTime: mediaTimeFromSeconds({
				seconds: primaryAsset.startSeconds,
			}),
		}),
	);
	const sourceAudioElements = mainElements
		.filter(
			(element, index): element is VideoElement =>
				element.type === "video" &&
				primaryAssets[index]?.asset.hasAudio !== false,
		)
		.map((videoElement) =>
			withElementId(
				buildSeparatedAudioElement({
					sourceElement: videoElement,
				}),
			),
		);
	const musicElement = data.audioUrl
		? withElementId(
				buildLibraryAudioElement({
					sourceUrl: data.audioUrl,
					name: data.musicName || "智能推荐音乐",
					duration,
					startTime: ZERO_MEDIA_TIME,
				}),
			)
		: null;

	return {
		overlay: [
			{
				id: generateUUID(),
				name: "字幕",
				type: "text",
				elements: subtitleElements,
				hidden: false,
			},
			...(titleElement
				? [
						{
							id: generateUUID(),
							name: "标题",
							type: "text" as const,
							elements: [titleElement],
							hidden: false,
						},
					]
				: []),
		],
		main: {
			id: generateUUID(),
			name: "主场景",
			type: "video",
			elements: mainElements,
			muted: false,
			hidden: false,
		},
		audio: [
			...(sourceAudioElements.length
				? [
						{
							id: generateUUID(),
							name: "原声",
							type: "audio" as const,
							elements: sourceAudioElements,
							muted: false,
						},
					]
				: []),
			...(musicElement
				? [
						{
							id: generateUUID(),
							name: data.musicName || "智能推荐音乐",
							type: "audio" as const,
							elements: [musicElement],
							muted: false,
						},
					]
				: []),
		],
	};
}

function getTimelineSubtitles({
	data,
	primaryAssets,
}: {
	data: VideoEditorData;
	primaryAssets: PrimaryAsset[];
}) {
	const segments = data.videoSegments;
	if (!segments?.length || !primaryAssets.length) {
		return data.subtitles;
	}

	const rebasedSubtitles: VideoEditorSubtitle[] = [];
	let sourceCursor = 0;

	for (const [index, segment] of segments.entries()) {
		const primaryAsset = primaryAssets[index];
		if (!primaryAsset) continue;

		const sourceStart = getFiniteSeconds(segment.start) ?? sourceCursor;
		const sourceDuration =
			getPositiveSeconds(segment.duration) ??
			primaryAsset.timelineDurationSeconds ??
			0;
		sourceCursor = sourceStart + sourceDuration;

		for (const subtitle of segment.subtitles ?? []) {
			const rawSubtitleStart = getFiniteSeconds(subtitle.start) ?? sourceStart;
			const localStart =
				rawSubtitleStart >= sourceStart
					? rawSubtitleStart - sourceStart
					: rawSubtitleStart;
			const boundedLocalStart = Math.min(
				Math.max(0, localStart),
				Math.max(0, primaryAsset.timelineDurationSeconds - 0.2),
			);
			const availableDuration = Math.max(
				0.2,
				primaryAsset.timelineDurationSeconds - boundedLocalStart,
			);

			rebasedSubtitles.push({
				...subtitle,
				start: primaryAsset.startSeconds + boundedLocalStart,
				duration: Math.min(
					getPositiveSeconds(subtitle.duration) ?? availableDuration,
					availableDuration,
				),
			});
		}
	}

	return rebasedSubtitles.length ? rebasedSubtitles : data.subtitles;
}

function subtitleToCaption({ subtitle }: { subtitle: VideoEditorSubtitle }) {
	const style = subtitle.style ?? {};
	return {
		text: subtitle.text,
		startTime: subtitle.start,
		duration: subtitle.duration,
		style: {
			fontSize: 3.5,
			color: "#ffffff",
			fontWeight: "bold" as const,
			lineHeight: 1.1,
			background: {
				enabled: false,
				color: "#000000",
			},
			...style,
			placement: {
				verticalAlign: "bottom" as const,
				marginVerticalRatio: 0.08,
				...(style.placement ?? {}),
			},
		},
		richTextRuns: createRichTextRunsFromMiaosiFonts({
			fonts: subtitle.fonts,
			fallbackContent: subtitle.text,
		}),
	};
}

function buildPrimaryTimelineElement({
	primaryAsset,
	duration,
	startTime,
}: {
	primaryAsset: PrimaryAsset;
	duration: MediaTime;
	startTime: MediaTime;
}): VideoElement | ImageElement {
	const element = withElementId(
		buildElementFromMedia({
			mediaId: primaryAsset.asset.id,
			mediaType: primaryAsset.mediaType,
			name: primaryAsset.asset.name,
			duration,
			startTime,
		}),
	);

	if (primaryAsset.mediaType === "video") {
		return {
			...element,
			isSourceAudioEnabled: false,
		} as VideoElement;
	}

	return element as ImageElement;
}

function withElementId<TElement extends CreateTimelineElement>(
	element: TElement,
) {
	return {
		id: generateUUID(),
		...element,
	} as TElement & TimelineElement;
}
