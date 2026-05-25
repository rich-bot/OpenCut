"use client";

import { useEffect, useRef, useState } from "react";
import type {
	ParamDefinition,
	NumberParamDefinition,
	ParamValue,
} from "@/params";
import {
	formatNumberForDisplay,
	getFractionDigitsForStep,
	snapToStep,
} from "@/utils/math";
import { SectionField } from "@/components/section";
import { NumberField } from "@/components/ui/number-field";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { usePropertyDraft } from "../hooks/use-property-draft";
import { KeyframeToggle } from "./keyframe-toggle";
import { Textarea } from "@/components/ui/textarea";
import { editorT } from "@/i18n/editor";
import { RichTextPreview } from "@/text/components/rich-text-preview";
import type { RichTextRun } from "@/text/rich-text";

const TEXT_PREVIEW_DEBOUNCE_MS = 120;

export function PropertyParamField({
	param,
	value,
	onPreview,
	onCommit,
	keyframe,
	richTextRuns,
	isTextReadOnly = false,
	onTextSelectionChange,
}: {
	param: ParamDefinition;
	value: ParamValue;
	onPreview: (value: ParamValue) => void;
	onCommit: () => void;
	richTextRuns?: RichTextRun[];
	isTextReadOnly?: boolean;
	onTextSelectionChange?: (selection: TextInputSelection | null) => void;
	keyframe?: {
		isActive: boolean;
		isDisabled: boolean;
		onToggle: () => void;
	};
}) {
	return (
		<SectionField
			label={param.label}
			beforeLabel={
				keyframe && param.keyframable !== false ? (
					<KeyframeToggle
						isActive={keyframe.isActive}
						isDisabled={keyframe.isDisabled}
						title={editorT("properties.toggleKeyframe", {
							label: param.label,
						})}
						onToggle={keyframe.onToggle}
					/>
				) : undefined
			}
		>
			<ParamInput
				param={param}
				value={value}
				onPreview={onPreview}
				onCommit={onCommit}
				richTextRuns={richTextRuns}
				isTextReadOnly={isTextReadOnly}
				onTextSelectionChange={onTextSelectionChange}
			/>
		</SectionField>
	);
}

export type TextInputSelection = {
	start: number;
	end: number;
};

function ParamInput({
	param,
	value,
	onPreview,
	onCommit,
	richTextRuns,
	isTextReadOnly,
	onTextSelectionChange,
}: {
	param: ParamDefinition;
	value: ParamValue;
	onPreview: (value: ParamValue) => void;
	onCommit: () => void;
	richTextRuns?: RichTextRun[];
	isTextReadOnly?: boolean;
	onTextSelectionChange?: (selection: TextInputSelection | null) => void;
}) {
	if (param.type === "number") {
		return (
			<NumberParamField
				param={param}
				value={typeof value === "number" ? value : Number(value)}
				onPreview={onPreview}
				onCommit={onCommit}
			/>
		);
	}

	if (param.type === "boolean") {
		return (
			<Switch
				checked={Boolean(value)}
				onCheckedChange={(checked) => {
					onPreview(checked);
					onCommit();
				}}
			/>
		);
	}

	if (param.type === "select") {
		return (
			<Select
				value={String(value)}
				onValueChange={(selected) => {
					onPreview(selected);
					onCommit();
				}}
			>
				<SelectTrigger className="w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{param.options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		);
	}

	if (param.type === "color") {
		return (
			<ColorPicker
				value={String(value).replace(/^#/, "").toUpperCase()}
				onChange={(color) => onPreview(`#${color}`)}
				onChangeEnd={(color) => {
					onPreview(`#${color}`);
					onCommit();
				}}
			/>
		);
	}

	if (param.type === "text") {
		return (
			<TextParamField
				value={String(value)}
				onPreview={onPreview}
				onCommit={onCommit}
				richTextRuns={richTextRuns}
				readOnly={isTextReadOnly}
				onTextSelectionChange={onTextSelectionChange}
			/>
		);
	}

	if (param.type === "font") {
		return (
			<input
				className="border-input bg-accent h-9 w-full rounded-md border px-3 text-sm outline-none"
				value={String(value)}
				onChange={(event) => onPreview(event.currentTarget.value)}
				onBlur={onCommit}
			/>
		);
	}

	return null;
}

function TextParamField({
	value,
	onPreview,
	onCommit,
	richTextRuns,
	readOnly = false,
	onTextSelectionChange,
}: {
	value: string;
	onPreview: (value: string) => void;
	onCommit: () => void;
	richTextRuns?: RichTextRun[];
	readOnly?: boolean;
	onTextSelectionChange?: (selection: TextInputSelection | null) => void;
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState(value);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const previewTimerRef = useRef<number | null>(null);
	const latestDraftRef = useRef(value);
	const previewedValueRef = useRef(value);
	const lastSelectionRef = useRef<TextInputSelection | null>(null);
	const isComposingRef = useRef(false);
	const onPreviewRef = useRef(onPreview);

	useEffect(() => {
		onPreviewRef.current = onPreview;
	}, [onPreview]);

	useEffect(() => {
		if (isEditing) return;
		latestDraftRef.current = value;
		previewedValueRef.current = value;
	}, [isEditing, value]);

	useEffect(() => {
		return () => {
			if (previewTimerRef.current) {
				window.clearTimeout(previewTimerRef.current);
			}
		};
	}, []);

	const clearPreviewTimer = () => {
		if (!previewTimerRef.current) return;
		window.clearTimeout(previewTimerRef.current);
		previewTimerRef.current = null;
	};

	const flushPreview = (nextValue = latestDraftRef.current) => {
		clearPreviewTimer();
		if (nextValue === previewedValueRef.current) return;
		previewedValueRef.current = nextValue;
		onPreviewRef.current(nextValue);
	};

	const schedulePreview = (nextValue: string) => {
		if (isComposingRef.current) return;
		clearPreviewTimer();
		previewTimerRef.current = window.setTimeout(() => {
			flushPreview(nextValue);
		}, TEXT_PREVIEW_DEBOUNCE_MS);
	};

	const reportSelection = (textarea: HTMLTextAreaElement | null) => {
		if (!onTextSelectionChange || !textarea) return;

		const start = Math.min(textarea.selectionStart, textarea.selectionEnd);
		const end = Math.max(textarea.selectionStart, textarea.selectionEnd);
		const nextSelection = start === end ? null : { start, end };
		const previousSelection = lastSelectionRef.current;
		if (
			previousSelection?.start === nextSelection?.start &&
			previousSelection?.end === nextSelection?.end
		) {
			return;
		}
		lastSelectionRef.current = nextSelection;
		onTextSelectionChange(nextSelection);
	};

	const displayValue = isEditing ? draft : value;

	return (
		<div className="relative">
			{richTextRuns ? (
				<RichTextPreview
					content={displayValue}
					runs={richTextRuns}
					className="absolute inset-0 min-h-[80px] overflow-hidden px-3 py-2 text-sm leading-5"
				/>
			) : null}
			<Textarea
				ref={textareaRef}
				value={displayValue}
				readOnly={readOnly}
				className={
					richTextRuns
						? "relative min-h-[80px] bg-transparent text-transparent caret-foreground selection:bg-primary/50 selection:text-transparent"
						: undefined
				}
				onFocus={(event) => {
					setIsEditing(true);
					setDraft(value);
					latestDraftRef.current = value;
					previewedValueRef.current = value;
					reportSelection(event.currentTarget);
				}}
				onChange={(event) => {
					if (readOnly) {
						reportSelection(event.currentTarget);
						return;
					}
					const nextDraft = event.currentTarget.value;
					setDraft(nextDraft);
					latestDraftRef.current = nextDraft;
					schedulePreview(nextDraft);
					reportSelection(event.currentTarget);
				}}
				onSelect={(event) => reportSelection(event.currentTarget)}
				onMouseUp={() => reportSelection(textareaRef.current)}
				onKeyUp={() => reportSelection(textareaRef.current)}
				onCompositionStart={() => {
					if (readOnly) return;
					isComposingRef.current = true;
					clearPreviewTimer();
				}}
				onCompositionEnd={(event) => {
					if (readOnly) {
						reportSelection(event.currentTarget);
						return;
					}
					isComposingRef.current = false;
					const nextDraft = event.currentTarget.value;
					setDraft(nextDraft);
					latestDraftRef.current = nextDraft;
					schedulePreview(nextDraft);
					reportSelection(event.currentTarget);
				}}
				onBlur={() => {
					if (!readOnly) {
						flushPreview();
						onCommit();
					}
					setIsEditing(false);
				}}
			/>
		</div>
	);
}

function NumberParamField({
	param,
	value,
	onPreview,
	onCommit,
}: {
	param: NumberParamDefinition;
	value: number;
	onPreview: (value: number) => void;
	onCommit: () => void;
}) {
	const { min, max, step, displayMultiplier = 1 } = param;
	const displayValue = value * displayMultiplier;
	const clampDisplayValue = (nextDisplayValue: number) =>
		Math.max(
			min,
			max !== undefined ? Math.min(max, nextDisplayValue) : nextDisplayValue,
		);

	const previewFromDisplay = (displayVal: number) => {
		const clamped = clampDisplayValue(snapToStep({ value: displayVal, step }));
		onPreview(clamped / displayMultiplier);
	};

	const maxFractionDigits = getFractionDigitsForStep({ step });

	const draft = usePropertyDraft({
		displayValue: formatNumberForDisplay({
			value: displayValue,
			maxFractionDigits,
		}),
		parse: (input) => {
			const parsed = parseFloat(input);
			if (Number.isNaN(parsed)) return null;
			return clampDisplayValue(snapToStep({ value: parsed, step }));
		},
		onPreview: previewFromDisplay,
		onCommit,
	});

	const handleReset = () => {
		onPreview(param.default);
		onCommit();
	};

	return (
		<NumberField
			icon={param.shortLabel}
			value={draft.displayValue}
			dragSensitivity="slow"
			isDefault={value === param.default}
			onFocus={draft.onFocus}
			onChange={draft.onChange}
			onBlur={draft.onBlur}
			onScrub={previewFromDisplay}
			onScrubEnd={onCommit}
			onReset={handleReset}
		/>
	);
}
