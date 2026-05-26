"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { EditorCore } from "@/core";

type EmbedMessage =
	| { source: "opencut"; type: "project-created"; projectId: string }
	| { source: "opencut"; type: "embed-error"; message: string };

function notifyParent(message: EmbedMessage) {
	if (typeof window === "undefined" || window.parent === window) return;
	window.parent.postMessage(message, "*");
}

function getEmbedEditorUrl(projectId: string, searchParams: URLSearchParams) {
	const editorParams = new URLSearchParams();
	const theme = searchParams.get("theme")?.trim();
	const hideHeader = searchParams.get("hideHeader")?.trim();
	const hiddenAssetTabs = searchParams.get("hiddenAssetTabs")?.trim();

	if (theme) {
		editorParams.set("theme", theme);
	}
	if (hideHeader) {
		editorParams.set("hideHeader", hideHeader);
	}
	if (hiddenAssetTabs) {
		editorParams.set("hiddenAssetTabs", hiddenAssetTabs);
	}

	const query = editorParams.toString();
	return `/embed/editor/${projectId}${query ? `?${query}` : ""}`;
}

export default function EmbedEntryPage() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		const openEditor = async () => {
			const searchParams = new URLSearchParams(window.location.search);
			const existingProjectId = searchParams.get("projectId")?.trim();
			if (existingProjectId) {
				router.replace(getEmbedEditorUrl(existingProjectId, searchParams));
				return;
			}

			try {
				const projectName = searchParams.get("name")?.trim() || "Neo 剪辑项目";
				const editor = EditorCore.getInstance();
				const projectId = await editor.project.createNewProject({
					name: projectName,
				});

				if (cancelled) return;

				notifyParent({ source: "opencut", type: "project-created", projectId });
				router.replace(getEmbedEditorUrl(projectId, searchParams));
			} catch (err) {
				if (cancelled) return;

				const message = err instanceof Error ? err.message : "创建剪辑项目失败";
				setError(message);
				notifyParent({ source: "opencut", type: "embed-error", message });
			}
		};

		void openEditor();

		return () => {
			cancelled = true;
		};
	}, [router]);

	return (
		<div className="bg-background flex h-screen w-screen items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				{error ? (
					<p className="text-destructive text-sm">{error}</p>
				) : (
					<>
						<Loader2 className="text-muted-foreground size-8 animate-spin" />
						<p className="text-muted-foreground text-sm">正在打开剪辑器...</p>
					</>
				)}
			</div>
		</div>
	);
}
