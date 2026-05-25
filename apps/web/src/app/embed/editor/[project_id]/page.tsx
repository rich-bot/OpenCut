"use client";

import { useParams, useSearchParams } from "next/navigation";
import { EditorWorkspace } from "@/app/editor/[project_id]/page";
import { ThemeEmbedSync } from "@/components/theme-embed-sync";

export default function EmbeddedEditorPage() {
	const params = useParams();
	const searchParams = useSearchParams();
	const projectId = params.project_id as string;
	const hideHeader = searchParams.get("hideHeader") === "1";

	return (
		<>
			<ThemeEmbedSync />
			<EditorWorkspace projectId={projectId} isEmbedded hideHeader={hideHeader} />
		</>
	);
}
