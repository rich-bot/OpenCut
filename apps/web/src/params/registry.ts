import type { ParamDefinition, ParamValue, ParamValues } from "@/params";
import { MIN_TRANSFORM_SCALE } from "@/animation/transform";
import type { BlendMode } from "@/rendering";
import type { ElementType, TimelineElement } from "@/timeline";
import { DEFAULTS } from "@/timeline/defaults";
import { VOLUME_DB_MAX, VOLUME_DB_MIN } from "@/timeline/audio-constants";
import { CORNER_RADIUS_MAX, CORNER_RADIUS_MIN } from "@/text/background";
import { editorT } from "@/i18n/editor";

export type ElementParamDefinition<TKey extends string = string> =
	ParamDefinition<TKey> & {
		read?: ({ element }: { element: TimelineElement }) => ParamValue | null;
		write?: ({
			element,
			value,
		}: {
			element: TimelineElement;
			value: ParamValue;
		}) => TimelineElement;
	};

export function buildDefaultParamValues(
	params: readonly ParamDefinition[],
): ParamValues {
	const values: ParamValues = {};
	for (const param of params) {
		values[param.key] = param.default;
	}
	return values;
}

export class DefinitionRegistry<TKey extends string, TDefinition> {
	private definitions = new Map<TKey, TDefinition>();
	private entityName: string;

	constructor(entityName: string) {
		this.entityName = entityName;
	}

	register({ key, definition }: { key: TKey; definition: TDefinition }): void {
		this.definitions.set(key, definition);
	}

	has(key: TKey): boolean {
		return this.definitions.has(key);
	}

	get(key: TKey): TDefinition {
		const def = this.definitions.get(key);
		if (!def) {
			throw new Error(`Unknown ${this.entityName}: ${key}`);
		}
		return def;
	}

	getAll(): TDefinition[] {
		return Array.from(this.definitions.values());
	}
}

const BLEND_MODE_OPTIONS: Array<{ value: BlendMode; label: string }> = [
	{ value: "normal", label: editorT("options.normal") },
	{ value: "darken", label: editorT("options.darken") },
	{ value: "multiply", label: editorT("options.multiply") },
	{ value: "color-burn", label: editorT("options.color-burn") },
	{ value: "lighten", label: editorT("options.lighten") },
	{ value: "screen", label: editorT("options.screen") },
	{ value: "plus-lighter", label: editorT("options.plus-lighter") },
	{ value: "color-dodge", label: editorT("options.color-dodge") },
	{ value: "overlay", label: editorT("options.overlay") },
	{ value: "soft-light", label: editorT("options.soft-light") },
	{ value: "hard-light", label: editorT("options.hard-light") },
	{ value: "difference", label: editorT("options.difference") },
	{ value: "exclusion", label: editorT("options.exclusion") },
	{ value: "hue", label: editorT("options.hue") },
	{ value: "saturation", label: editorT("options.saturation") },
	{ value: "color", label: editorT("options.color") },
	{ value: "luminosity", label: editorT("options.luminosity") },
];

const visualElementParams: ElementParamDefinition[] = [
	{
		key: "transform.positionX",
		label: editorT("params.positionX"),
		type: "number",
		default: DEFAULTS.element.transform.position.x,
		min: -100_000,
		step: 1,
	},
	{
		key: "transform.positionY",
		label: editorT("params.positionY"),
		type: "number",
		default: DEFAULTS.element.transform.position.y,
		min: -100_000,
		step: 1,
	},
	{
		key: "transform.scaleX",
		label: editorT("params.scaleX"),
		type: "number",
		default: DEFAULTS.element.transform.scaleX,
		min: MIN_TRANSFORM_SCALE,
		step: 0.01,
	},
	{
		key: "transform.scaleY",
		label: editorT("params.scaleY"),
		type: "number",
		default: DEFAULTS.element.transform.scaleY,
		min: MIN_TRANSFORM_SCALE,
		step: 0.01,
	},
	{
		key: "transform.rotate",
		label: editorT("params.rotate"),
		type: "number",
		default: DEFAULTS.element.transform.rotate,
		min: -360,
		max: 360,
		step: 1,
	},
	{
		key: "opacity",
		label: editorT("params.opacity"),
		type: "number",
		default: DEFAULTS.element.opacity,
		min: 0,
		max: 1,
		step: 0.01,
	},
	{
		key: "blendMode",
		label: editorT("params.blendMode"),
		type: "select",
		default: DEFAULTS.element.blendMode,
		keyframable: false,
		options: BLEND_MODE_OPTIONS,
	},
];

const audioElementParams: ElementParamDefinition[] = [
	{
		key: "volume",
		label: editorT("params.volume"),
		type: "number",
		default: DEFAULTS.element.volume,
		min: VOLUME_DB_MIN,
		max: VOLUME_DB_MAX,
		step: 0.01,
	},
	{
		key: "muted",
		label: editorT("params.muted"),
		type: "boolean",
		default: false,
		keyframable: false,
	},
];

const textElementParams: ElementParamDefinition[] = [
	{
		key: "content",
		label: editorT("params.content"),
		type: "text",
		default: editorT("params.defaultText"),
		keyframable: false,
	},
	{
		key: "fontFamily",
		label: editorT("params.fontFamily"),
		type: "font",
		default: "Arial",
		keyframable: false,
	},
	{
		key: "fontSize",
		label: editorT("params.fontSize"),
		type: "number",
		default: 15,
		min: 1,
		step: 1,
		keyframable: false,
	},
	{
		key: "color",
		label: editorT("params.color"),
		type: "color",
		default: "#ffffff",
		keyframable: false,
	},
	{
		key: "stroke.color",
		label: editorT("params.strokeColor"),
		type: "color",
		default: "#000000",
		keyframable: false,
	},
	{
		key: "stroke.width",
		label: editorT("params.strokeWidth"),
		type: "number",
		default: 0,
		min: 0,
		step: 0.1,
		keyframable: false,
	},
	{
		key: "textAlign",
		label: editorT("params.textAlign"),
		type: "select",
		default: "center",
		keyframable: false,
		options: [
			{ value: "left", label: editorT("options.left") },
			{ value: "center", label: editorT("options.center") },
			{ value: "right", label: editorT("options.right") },
		],
	},
	{
		key: "fontWeight",
		label: editorT("params.fontWeight"),
		type: "select",
		default: "normal",
		keyframable: false,
		options: [
			{ value: "normal", label: editorT("options.normal") },
			{ value: "bold", label: editorT("options.bold") },
		],
	},
	{
		key: "fontStyle",
		label: editorT("params.fontStyle"),
		type: "select",
		default: "normal",
		keyframable: false,
		options: [
			{ value: "normal", label: editorT("options.normal") },
			{ value: "italic", label: editorT("options.italic") },
		],
	},
	{
		key: "textDecoration",
		label: editorT("params.textDecoration"),
		type: "select",
		default: "none",
		keyframable: false,
		options: [
			{ value: "none", label: editorT("options.none") },
			{ value: "underline", label: editorT("options.underline") },
			{ value: "line-through", label: editorT("options.lineThrough") },
		],
	},
	{
		key: "letterSpacing",
		label: editorT("params.letterSpacing"),
		type: "number",
		default: DEFAULTS.text.letterSpacing,
		min: -100,
		step: 0.1,
		keyframable: false,
	},
	{
		key: "lineHeight",
		label: editorT("params.lineHeight"),
		type: "number",
		default: DEFAULTS.text.lineHeight,
		min: 0.1,
		step: 0.1,
		keyframable: false,
	},
	{
		key: "background.enabled",
		label: editorT("params.backgroundEnabled"),
		type: "boolean",
		default: DEFAULTS.text.background.enabled,
		keyframable: false,
	},
	{
		key: "background.color",
		label: editorT("params.backgroundColor"),
		type: "color",
		default: DEFAULTS.text.background.color,
		dependencies: [{ param: "background.enabled", equals: true }],
	},
	{
		key: "background.cornerRadius",
		label: editorT("params.backgroundRadius"),
		type: "number",
		default: DEFAULTS.text.background.cornerRadius,
		min: CORNER_RADIUS_MIN,
		max: CORNER_RADIUS_MAX,
		step: 1,
		dependencies: [{ param: "background.enabled", equals: true }],
	},
	{
		key: "background.paddingX",
		label: editorT("params.backgroundPaddingX"),
		type: "number",
		default: DEFAULTS.text.background.paddingX,
		min: 0,
		step: 1,
		dependencies: [{ param: "background.enabled", equals: true }],
	},
	{
		key: "background.paddingY",
		label: editorT("params.backgroundPaddingY"),
		type: "number",
		default: DEFAULTS.text.background.paddingY,
		min: 0,
		step: 1,
		dependencies: [{ param: "background.enabled", equals: true }],
	},
	{
		key: "background.offsetX",
		label: editorT("params.backgroundOffsetX"),
		type: "number",
		default: DEFAULTS.text.background.offsetX,
		min: -100_000,
		step: 1,
		dependencies: [{ param: "background.enabled", equals: true }],
	},
	{
		key: "background.offsetY",
		label: editorT("params.backgroundOffsetY"),
		type: "number",
		default: DEFAULTS.text.background.offsetY,
		min: -100_000,
		step: 1,
		dependencies: [{ param: "background.enabled", equals: true }],
	},
];

export const elementParamRegistry = new DefinitionRegistry<
	ElementType,
	readonly ElementParamDefinition[]
>("element params");

elementParamRegistry.register({
	key: "video",
	definition: [...visualElementParams, ...audioElementParams],
});
elementParamRegistry.register({
	key: "image",
	definition: visualElementParams,
});
elementParamRegistry.register({
	key: "text",
	definition: [...textElementParams, ...visualElementParams],
});
elementParamRegistry.register({
	key: "sticker",
	definition: visualElementParams,
});
elementParamRegistry.register({
	key: "graphic",
	definition: visualElementParams,
});
elementParamRegistry.register({ key: "audio", definition: audioElementParams });
elementParamRegistry.register({ key: "effect", definition: [] });

export function getElementParams({
	element,
}: {
	element: TimelineElement;
}): readonly ElementParamDefinition[] {
	return elementParamRegistry.has(element.type)
		? elementParamRegistry.get(element.type)
		: [];
}

export function getBuiltInElementParams({
	type,
}: {
	type: ElementType;
}): readonly ElementParamDefinition[] {
	return elementParamRegistry.has(type) ? elementParamRegistry.get(type) : [];
}

export function getElementParam({
	element,
	key,
}: {
	element: TimelineElement;
	key: string;
}): ElementParamDefinition | null {
	return (
		getElementParams({ element }).find((param) => param.key === key) ?? null
	);
}

export function readElementParamValue({
	element,
	param,
}: {
	element: TimelineElement;
	param: ElementParamDefinition;
}): ParamValue | null {
	if (param.read) {
		return param.read({ element });
	}
	if ("params" in element) {
		return element.params[param.key] ?? param.default;
	}
	return null;
}

export function writeElementParamValue({
	element,
	param,
	value,
}: {
	element: TimelineElement;
	param: ElementParamDefinition;
	value: ParamValue;
}): TimelineElement {
	if (param.write) {
		return param.write({ element, value });
	}
	if ("params" in element) {
		return {
			...element,
			params: {
				...element.params,
				[param.key]: value,
			},
		};
	}
	return element;
}

export function buildElementParamValues({
	element,
}: {
	element: TimelineElement;
}): ParamValues {
	const values: ParamValues = {};
	for (const param of getElementParams({ element })) {
		const value = readElementParamValue({ element, param });
		if (value !== null) {
			values[param.key] = value;
		}
	}
	return values;
}
