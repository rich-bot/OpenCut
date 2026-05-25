import type { ParamDefinition } from "@/params";
import { editorT } from "@/i18n/editor";

export type GraphicStrokeAlign = "inside" | "center" | "outside";

export const STROKE_ALIGN_PARAM: ParamDefinition<"strokeAlign"> = {
	key: "strokeAlign",
	label: editorT("params.strokeAlign"),
	type: "select",
	default: "center",
	group: "stroke",
	options: [
		{ value: "inside", label: editorT("options.inside") },
		{ value: "center", label: editorT("options.center") },
		{ value: "outside", label: editorT("options.outside") },
	],
};
