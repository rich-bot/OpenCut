"use client";

import { useParams, useSearchParams } from "next/navigation";
import { EditorWorkspace } from "@/app/editor/[project_id]/page";
import { ThemeEmbedSync } from "@/components/theme-embed-sync";
import { parseHiddenAssetTabs } from "@/components/editor/panels/assets/assets-panel-store";

export default function EmbeddedEditorPage() {
	const params = useParams();
	const searchParams = useSearchParams();
	const projectId = params.project_id as string;
	const hideHeader = searchParams.get("hideHeader") === "1";
	const hiddenAssetTabs = parseHiddenAssetTabs(
		searchParams.get("hiddenAssetTabs"),
	);

	return (
		<>
			<ThemeEmbedSync />
			<EditorWorkspace
				projectId={projectId}
				isEmbedded
				hideHeader={hideHeader}
				hiddenAssetTabs={hiddenAssetTabs}
			/>
		</>
	);
}
