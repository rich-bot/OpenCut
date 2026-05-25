import { PlusSignIcon, RulerIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { editorT } from "@/i18n/editor";
import type { GuideDefinition } from "@/guides/types";

function CustomGuideOptions() {
	return (
		<div className="flex gap-2">
			<Button variant="outline" size="sm" className="flex-1">
				<HugeiconsIcon icon={PlusSignIcon} />
				{editorT("guides.addLine")}
			</Button>
		</div>
	);
}

export const customGuide = {
	id: "custom",
	label: editorT("guides.custom"),
	renderPreview: () => <HugeiconsIcon size={16} icon={RulerIcon} />,
	renderTriggerIcon: () => <HugeiconsIcon icon={RulerIcon} />,
	renderOverlay: () => null,
	renderOptions: () => <CustomGuideOptions />,
} as const satisfies GuideDefinition;
