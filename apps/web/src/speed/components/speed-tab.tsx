import { useRef, useState } from "react";
import { useEditor } from "@/editor/use-editor";
import { NumberField } from "@/components/ui/number-field";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { HugeiconsIcon } from "@hugeicons/react";
import { DashboardSpeed02Icon } from "@hugeicons/core-free-icons";
import { buildConstantRetime } from "@/retime";
import {
	DEFAULT_RETIME_RATE,
	MIN_RETIME_RATE,
	MAX_RETIME_RATE,
	clampRetimeRate,
	canMaintainPitch,
} from "@/retime/rate";
import type { AudioElement, VideoElement } from "@/timeline";
import {
	Section,
	SectionContent,
	SectionField,
	SectionFields,
	SectionHeader,
	SectionTitle,
} from "@/components/section";
import { usePropertyDraft } from "@/components/editor/panels/properties/hooks/use-property-draft";
import {
	formatNumberForDisplay,
	getFractionDigitsForStep,
	snapToStep,
} from "@/utils/math";
import { editorT } from "@/i18n/editor";

const SPEED_STEP = 0.01;
const SPEED_FRACTION_DIGITS = getFractionDigitsForStep({ step: SPEED_STEP });

function rateToDisplay({ rate }: { rate: number }): string {
	return formatNumberForDisplay({
		value: rate,
		fractionDigits: SPEED_FRACTION_DIGITS,
	});
}

function parseSpeedInput({ input }: { input: string }): number | null {
	const parsed = parseFloat(input);
	if (Number.isNaN(parsed)) return null;
	return clampRetimeRate({
		rate: snapToStep({ value: parsed, step: SPEED_STEP }),
	});
}

function normalizeSpeedValue({ value }: { value: number }): number {
	return clampRetimeRate({
		rate: snapToStep({ value, step: SPEED_STEP }),
	});
}

function buildRetime({
	rate,
	maintainPitch,
}: {
	rate: number;
	maintainPitch: boolean;
}) {
	if (rate === DEFAULT_RETIME_RATE && !maintainPitch) return undefined;
	return buildConstantRetime({ rate, maintainPitch });
}

export function SpeedTab({
	element,
	trackId,
}: {
	element: AudioElement | VideoElement;
	trackId: string;
}) {
	const editor = useEditor();
	const rate = clampRetimeRate({
		rate: element.retime?.rate ?? DEFAULT_RETIME_RATE,
	});
	const isPitchPreserveAvailable = canMaintainPitch({ rate });
	const maintainPitch = element.retime?.maintainPitch ?? false;
	const pendingRateRef = useRef(rate);
	const [sliderDraft, setSliderDraft] = useState({
		sourceRate: rate,
		value: rate,
	});
	const [isSpeedInputEditing, setIsSpeedInputEditing] = useState(false);
	const sliderRate =
		sliderDraft.sourceRate === rate ? sliderDraft.value : rate;

	const commitRetime = ({
		rate: nextRate,
		maintainPitch: nextMaintainPitch,
	}: {
		rate: number;
		maintainPitch: boolean;
	}) => {
		editor.timeline.updateElementRetime({
			trackId,
			elementId: element.id,
			retime: buildRetime({ rate: nextRate, maintainPitch: nextMaintainPitch }),
		});
	};

	const previewRate = (nextRate: number) => {
		const normalizedRate = normalizeSpeedValue({ value: nextRate });
		pendingRateRef.current = normalizedRate;
		setSliderDraft({ sourceRate: rate, value: normalizedRate });
		editor.timeline.previewElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					updates: {
						retime: buildRetime({ rate: normalizedRate, maintainPitch }),
					},
				},
			],
		});
	};

	const speedDraft = usePropertyDraft({
		displayValue: rateToDisplay({ rate }),
		parse: (input) => parseSpeedInput({ input }),
		onPreview: previewRate,
		onCommit: () => {
			commitRetime({ rate: pendingRateRef.current, maintainPitch });
		},
	});
	const speedDisplayValue = isSpeedInputEditing
		? speedDraft.displayValue
		: rateToDisplay({ rate: sliderRate });

	return (
		<Section collapsible sectionKey={`${element.id}:speed`}>
			<SectionHeader>
				<SectionTitle>{editorT("properties.tab.speed")}</SectionTitle>
			</SectionHeader>
			<SectionContent>
				<SectionFields>
					<SectionField label={editorT("properties.tab.speed")}>
						<div className="flex flex-col gap-2.5">
							<NumberField
								icon={<HugeiconsIcon icon={DashboardSpeed02Icon} />}
								value={speedDisplayValue}
								suffix="x"
								scrubRanges={[
									{ from: 0.01, to: 1, pixelsPerUnit: 160 },
									{ from: 1, to: 5, pixelsPerUnit: 48 },
								]}
								scrubClamp={{ min: MIN_RETIME_RATE, max: MAX_RETIME_RATE }}
								onFocus={() => {
									setIsSpeedInputEditing(true);
									pendingRateRef.current = rate;
									setSliderDraft({ sourceRate: rate, value: rate });
									speedDraft.onFocus();
								}}
								onChange={speedDraft.onChange}
								onBlur={(event) => {
									speedDraft.onBlur(event);
									setIsSpeedInputEditing(false);
								}}
								onScrub={speedDraft.scrubTo}
								onScrubEnd={speedDraft.commitScrub}
								onReset={() =>
									commitRetime({ rate: DEFAULT_RETIME_RATE, maintainPitch })
								}
								isDefault={rate === DEFAULT_RETIME_RATE}
							/>
							<div className="flex items-center gap-3 px-1">
								<span className="text-muted-foreground w-10 text-xs tabular-nums">
									{rateToDisplay({ rate: MIN_RETIME_RATE })}x
								</span>
								<Slider
									value={[sliderRate]}
									min={MIN_RETIME_RATE}
									max={MAX_RETIME_RATE}
									step={SPEED_STEP}
									onValueChange={(values) => {
										const nextRate = values[0];
										if (typeof nextRate === "number") previewRate(nextRate);
									}}
									onValueCommit={(values) => {
										const nextRate = values[0];
										if (typeof nextRate !== "number") return;
										const normalizedRate = normalizeSpeedValue({ value: nextRate });
										previewRate(normalizedRate);
										commitRetime({
											rate: normalizedRate,
											maintainPitch,
										});
									}}
								/>
								<span className="text-muted-foreground w-8 text-right text-xs tabular-nums">
									{rateToDisplay({ rate: MAX_RETIME_RATE })}x
								</span>
							</div>
						</div>
					</SectionField>
					<div className="flex items-center justify-between">
						<span className="text-sm">{editorT("properties.changePitch")}</span>
						<Switch
							checked={!maintainPitch}
							disabled={!isPitchPreserveAvailable}
							onCheckedChange={(checked) =>
								commitRetime({ rate, maintainPitch: !checked })
							}
						/>
					</div>
				</SectionFields>
			</SectionContent>
		</Section>
	);
}
