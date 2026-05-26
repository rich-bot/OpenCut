"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { MakeSameEditorWorkspace } from "@/app/editor/[project_id]/page";
import { storageService } from "@/services/storage/service";
import { CURRENT_PROJECT_VERSION } from "@/services/storage/migrations";
import { DEFAULT_BACKGROUND_COLOR } from "@/background/color";
import { DEFAULT_FPS } from "@/fps/defaults";
import { readVideoFile } from "@/media/mediabunny";
import { buildElementFromMedia, buildLibraryAudioElement } from "@/timeline";
import { buildSubtitleTextElement } from "@/subtitles/build-subtitle-text-element";
import {
	parseHiddenAssetTabs,
	type Tab,
} from "@/components/editor/panels/assets/assets-panel-store";
import { createRichTextRunsFromMiaosiFonts } from "@/text/rich-text";
import { generateUUID } from "@/utils/id";
import { withBasePath } from "@/utils/base-path";
import { mediaTimeFromSeconds, type MediaTime, ZERO_MEDIA_TIME } from "@/wasm";
import {
	makeSameDemo,
	type MakeSameEditorData,
	type MakeSameSubtitle,
	type MakeSameVideoSegment,
} from "@/mock/make-same-demo";
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

const MAKE_SAME_PROJECT_SCHEMA_VERSION = 10;
const MAKE_SAME_SESSION_PREFIX = "neo:opencut:make-same:";

type LoadState =
	| {
			status: "loading";
			id: string;
			message: string;
			hideHeader: boolean;
			hiddenAssetTabs?: readonly Tab[];
	  }
	| {
			status: "ready";
			id: string;
			projectId: string;
			hideHeader: boolean;
			hiddenAssetTabs?: readonly Tab[];
	  }
	| {
			status: "error";
			id: string;
			message: string;
			hideHeader: boolean;
			hiddenAssetTabs?: readonly Tab[];
	  };

export default function MakeSameMockPage() {
	const [state, setState] = useState<LoadState>({
		status: "loading",
		id: makeSameDemo.id,
		message: "正在准备同款剪辑项目...",
		hideHeader: false,
	});

	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const id = searchParams.get("id") || makeSameDemo.id;
		const reset = searchParams.get("reset") === "1";
		const hideHeader = searchParams.get("hideHeader") === "1";
		const hiddenAssetTabs = parseHiddenAssetTabs(
			searchParams.get("hiddenAssetTabs"),
		);

		setState({
			status: "loading",
			id,
			message: "正在准备同款剪辑项目...",
			hideHeader,
			hiddenAssetTabs,
		});

		ensureMakeSameProject({ id, reset })
			.then((projectId) => {
				setState({ status: "ready", id, projectId, hideHeader, hiddenAssetTabs });
			})
			.catch((error) => {
				console.error("[make-same] failed to prepare project", error);
				setState({
					status: "error",
					id,
					hideHeader,
					hiddenAssetTabs,
					message:
						error instanceof Error
							? error.message
							: "同款剪辑项目准备失败，请稍后重试",
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
	return `make-same-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function getMakeSameProjectMarkerKey({ projectId }: { projectId: string }) {
	return `opencut:make-same-project:${projectId}:signature`;
}

function buildMakeSameProjectSignature({ data }: { data: MakeSameEditorData }) {
	return JSON.stringify({
		version: MAKE_SAME_PROJECT_SCHEMA_VERSION,
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

	const response = await fetch(
		withBasePath(`/api/mock/make-same/${encodeURIComponent(id)}`),
		{ cache: "no-store" },
	);

	if (!response.ok) {
		throw new Error("同款 mock 数据加载失败");
	}

	const payload = (await response.json()) as Partial<MakeSameEditorData>;
	return normalizeMakeSameData({ id, payload });
}

function loadMakeSameSessionData({ id }: { id: string }) {
	try {
		const raw = window.sessionStorage.getItem(
			`${MAKE_SAME_SESSION_PREFIX}${id}`,
		);
		if (!raw) return null;
		return JSON.parse(raw) as Partial<MakeSameEditorData>;
	} catch (error) {
		console.warn("[make-same] session data parse failed", error);
		return null;
	}
}

function normalizeMakeSameData({
	id,
	payload,
}: {
	id: string;
	payload: Partial<MakeSameEditorData>;
}): MakeSameEditorData {
	const videoSegments = Array.isArray(payload.videoSegments)
		? payload.videoSegments.filter(
				(segment): segment is MakeSameVideoSegment =>
					!!segment &&
					typeof segment.videoUrl === "string" &&
					!!segment.videoUrl,
			)
		: undefined;
	const duration =
		typeof payload.duration === "number" && Number.isFinite(payload.duration)
			? payload.duration
			: getVideoSegmentsDuration(videoSegments) || makeSameDemo.duration;

	return {
		...makeSameDemo,
		...payload,
		id,
		duration,
		videoSegments,
		subtitles: payload.subtitles ?? makeSameDemo.subtitles,
	};
}

async function createPrimaryAssets({
	data,
}: {
	data: MakeSameEditorData;
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
	return assets;
}

function normalizePrimaryVideoSegments({ data }: { data: MakeSameEditorData }) {
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

function getVideoSegmentsDuration(segments?: MakeSameVideoSegment[]) {
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
	data: MakeSameEditorData;
	segment: MakeSameVideoSegment;
	index: number;
	startSeconds: number;
}): Promise<PrimaryAsset | null> {
	const videoAsset = await fetchAssetFile({
		url: segment.videoUrl,
		name: `${segment.title || data.title || data.id}-${index + 1}.mp4`,
		fallbackType: "video/mp4",
	}).catch((error) => {
		console.warn("[make-same] video asset fetch failed", error);
		return null;
	});

	if (videoAsset) {
		const videoData = await readVideoFile({
			file: videoAsset,
			thumbnailTimeSeconds: getMakeSameThumbnailTime({ data, segment }),
		}).catch((error) => {
			console.warn("[make-same] video metadata read failed", error);
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
				id: `make-same-video-${data.id}-${index}`,
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
		console.warn("[make-same] cover asset fetch failed", error);
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
			id: `make-same-cover-${data.id}-${index}`,
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
	data: MakeSameEditorData;
	segment?: MakeSameVideoSegment;
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

	const response = await fetch(
		withBasePath(`/api/mock/make-same/asset?url=${encodeURIComponent(url)}`),
		{ cache: "force-cache" },
	);
	if (!response.ok) return null;

	const blob = await response.blob();
	if (blob.size === 0) return null;

	return new File([blob], name, {
		type: blob.type || fallbackType,
		lastModified: Date.now(),
	});
}

function buildMakeSameProject({
	projectId,
	data,
	primaryAssets,
}: {
	projectId: string;
	data: MakeSameEditorData;
	primaryAssets: PrimaryAsset[];
}): TProject {
	const now = new Date();
	const canvasSize = {
		width: data.width || makeSameDemo.width,
		height: data.height || makeSameDemo.height,
	};
	const projectDurationSeconds =
		getPrimaryAssetsEndSeconds({ primaryAssets }) ||
		getPositiveSeconds(data.duration) ||
		makeSameDemo.duration;
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
	data: MakeSameEditorData;
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
		audio: musicElement
			? [
					{
						id: generateUUID(),
						name: data.musicName || "智能推荐音乐",
						type: "audio",
						elements: [musicElement],
						muted: false,
					},
				]
			: [],
	};
}

function getTimelineSubtitles({
	data,
	primaryAssets,
}: {
	data: MakeSameEditorData;
	primaryAssets: PrimaryAsset[];
}) {
	const segments = data.videoSegments;
	if (!segments?.length || !primaryAssets.length) {
		return data.subtitles;
	}

	const rebasedSubtitles: MakeSameSubtitle[] = [];
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

function subtitleToCaption({ subtitle }: { subtitle: MakeSameSubtitle }) {
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
			isSourceAudioEnabled: true,
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
