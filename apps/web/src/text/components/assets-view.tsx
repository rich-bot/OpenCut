import { DraggableItem } from "@/components/editor/panels/assets/draggable-item";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { useEditor } from "@/editor/use-editor";
import type { ParamValues } from "@/params";
import { DEFAULTS } from "@/timeline/defaults";
import { buildTextElement } from "@/timeline/element-utils";
import type { MediaTime } from "@/wasm";
import type { CSSProperties } from "react";

type TextStylePreset = {
	id: string;
	name: string;
	content: string;
	params: Partial<ParamValues>;
	previewClassName?: string;
	previewStyle?: CSSProperties;
};

const PRESET_CONTENT = "花字";
const previewSurfaceStyle: CSSProperties = {
	backgroundColor: "#f3f4f7",
	backgroundImage:
		"linear-gradient(45deg, rgba(17, 24, 39, 0.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(17, 24, 39, 0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(17, 24, 39, 0.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(17, 24, 39, 0.06) 75%)",
	backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
	backgroundSize: "16px 16px",
};
const previewTextSafetyStyle: CSSProperties = {
	filter:
		"drop-shadow(0 1px 0 rgba(255,255,255,0.92)) drop-shadow(0 1px 2px rgba(0,0,0,0.35))",
};

const TEXT_STYLE_PRESETS: TextStylePreset[] = [
	{
		id: "default",
		name: "默认文本",
		content: "默认文本",
		params: {
			content: "默认文本",
			fontSize: 12,
			color: "#FFFFFF",
			fontWeight: "normal",
			fontStyle: "normal",
			textAlign: "center",
		},
		previewStyle: {
			color: "#1F2937",
			WebkitTextStroke: "1px rgba(255,255,255,0.86)",
			textShadow: "0 1px 2px rgba(0,0,0,0.18)",
		},
	},
	{
		id: "white-outline",
		name: "白字黑边",
		content: PRESET_CONTENT,
		params: {
			content: PRESET_CONTENT,
			fontSize: 12,
			color: "#FFFFFF",
			fontWeight: "bold",
			textAlign: "center",
			"stroke.color": "#101114",
			"stroke.width": 1.5,
			"shadow.color": "rgba(16,17,20,0.8)",
			"shadow.offsetY": 0.7,
		},
		previewStyle: {
			color: "#ffffff",
			WebkitTextStroke: "2px #101114",
			textShadow: "0 2px 0 #101114",
		},
	},
	{
		id: "yellow-outline",
		name: "黄字黑边",
		content: PRESET_CONTENT,
		params: {
			content: PRESET_CONTENT,
			fontSize: 12,
			color: "#FFD84D",
			fontWeight: "bold",
			textAlign: "center",
			"stroke.color": "#161616",
			"stroke.width": 1.5,
			"shadow.color": "rgba(0,0,0,0.55)",
			"shadow.offsetY": 0.7,
		},
		previewStyle: {
			color: "#ffe255",
			WebkitTextStroke: "2px #161616",
			textShadow: "0 2px 0 #161616",
		},
	},
	{
		id: "red-white",
		name: "红字白边",
		content: PRESET_CONTENT,
		params: {
			content: PRESET_CONTENT,
			fontSize: 12,
			color: "#FF4A3D",
			fontWeight: "bold",
			textAlign: "center",
			"stroke.color": "#FFFFFF",
			"stroke.width": 1.2,
			"shadow.color": "rgba(0,0,0,0.25)",
			"shadow.offsetY": 0.6,
		},
		previewStyle: {
			color: "#ff4438",
			WebkitTextStroke: "2px #ffffff",
			textShadow: "0 2px 0 rgba(0,0,0,0.18)",
		},
	},
	{
		id: "pink-white",
		name: "粉字白边",
		content: PRESET_CONTENT,
		params: {
			content: PRESET_CONTENT,
			fontSize: 12,
			color: "#FF8DC7",
			fontWeight: "bold",
			textAlign: "center",
			"stroke.color": "#FFFFFF",
			"stroke.width": 1.2,
			"shadow.color": "rgba(255,71,151,0.36)",
			"shadow.offsetY": 0.6,
		},
		previewStyle: {
			color: "#ff9dd1",
			WebkitTextStroke: "2px #ffffff",
			textShadow: "0 2px 0 rgba(255,71,151,0.36)",
		},
	},
	{
		id: "mint-outline",
		name: "青字深边",
		content: PRESET_CONTENT,
		params: {
			content: PRESET_CONTENT,
			fontSize: 12,
			color: "#41E7A7",
			fontWeight: "bold",
			textAlign: "center",
			"stroke.color": "#063A2C",
			"stroke.width": 1.4,
			"shadow.color": "rgba(6,58,44,0.6)",
			"shadow.offsetY": 0.7,
		},
		previewStyle: {
			color: "#45edaa",
			WebkitTextStroke: "2px #063a2c",
			textShadow: "0 2px 0 #063a2c",
		},
	},
	{
		id: "purple-shadow",
		name: "紫色投影",
		content: PRESET_CONTENT,
		params: {
			content: PRESET_CONTENT,
			fontSize: 12,
			color: "#D47BFF",
			fontWeight: "bold",
			textAlign: "center",
			"stroke.color": "#2B0C48",
			"stroke.width": 1,
			"shadow.color": "#FFD233",
			"shadow.offsetX": 0.9,
			"shadow.offsetY": 0.9,
		},
		previewStyle: {
			color: "#d77bff",
			WebkitTextStroke: "1.5px #2b0c48",
			textShadow: "2px 2px 0 #ffd233",
		},
	},
	{
		id: "orange-pop",
		name: "橙黄醒目",
		content: PRESET_CONTENT,
		params: {
			content: PRESET_CONTENT,
			fontSize: 12,
			color: "#FF7A18",
			fontWeight: "bold",
			textAlign: "center",
			"stroke.color": "#FFE55B",
			"stroke.width": 1.4,
			"shadow.color": "#7A1F00",
			"shadow.offsetY": 0.8,
		},
		previewStyle: {
			color: "#ff7a18",
			WebkitTextStroke: "2px #ffe55b",
			textShadow: "0 2px 0 #7a1f00",
		},
	},
];

export function TextView() {
	const editor = useEditor();

	const handleAddToTimeline = ({
		currentTime,
		preset,
	}: {
		currentTime: MediaTime;
		preset: TextStylePreset;
	}) => {
		const activeScene = editor.scenes.getActiveScene();
		if (!activeScene) return;

		const element = buildTextElement({
			raw: {
				...DEFAULTS.text.element,
				name: preset.name,
				params: {
					...DEFAULTS.text.element.params,
					...preset.params,
					content: preset.content,
				},
			},
			startTime: currentTime,
		});

		editor.timeline.insertElement({
			element,
			placement: { mode: "auto" },
		});
	};

	return (
		<PanelView title="花字" contentClassName="grid grid-cols-2 gap-2 pb-4">
			{TEXT_STYLE_PRESETS.map((preset) => (
				<DraggableItem
					key={preset.id}
					name={preset.name}
					preview={
						<div
							className="flex size-full items-center justify-center rounded"
							style={previewSurfaceStyle}
						>
							<span
								className={`select-none text-center text-xl font-black ${preset.previewClassName ?? ""}`}
								style={{
									...previewTextSafetyStyle,
									...preset.previewStyle,
								}}
							>
								{preset.content}
							</span>
						</div>
					}
					dragData={{
						id: `text-style:${preset.id}`,
						type: DEFAULTS.text.element.type,
						name: preset.name,
						content: preset.content,
						params: {
							...preset.params,
							content: preset.content,
						},
					}}
					aspectRatio={1}
					containerClassName="w-full"
					onAddToTimeline={({ currentTime }) =>
						handleAddToTimeline({ currentTime, preset })
					}
					shouldShowLabel={false}
				/>
			))}
		</PanelView>
	);
}
