import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/utils/ui";
import { editorT } from "@/i18n/editor";

function Spinner({ className, ...props }: Omit<HugeiconsIconProps, "icon">) {
	return (
		<HugeiconsIcon
			icon={Loading03Icon}
			role="status"
			aria-label={editorT("common.loading")}
			className={cn("size-4 animate-spin", className)}
			{...props}
		/>
	);
}

export { Spinner };
