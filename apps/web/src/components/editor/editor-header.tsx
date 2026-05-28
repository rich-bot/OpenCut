"use client";

import { Button } from "../ui/button";
import { useRef, useState, type ReactNode } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Link from "next/link";
import { RenameProjectDialog } from "@/project/components/rename-project-dialog";
import { DeleteProjectDialog } from "@/project/components/delete-project-dialog";
import { useRouter } from "next/navigation";
import { FaDiscord } from "react-icons/fa6";
import { ExportButton } from "./export-button";
import { FeedbackPopover } from "@/feedback/components/feedback-popover";
import { ThemeToggle } from "../theme-toggle";
import { DEFAULT_LOGO_URL } from "@/site/brand";
import { SOCIAL_LINKS } from "@/site/social";
import { toast } from "sonner";
import { useEditor } from "@/editor/use-editor";
import { CommandIcon, Logout05Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShortcutsDialog } from "@/actions/components/shortcuts-dialog";
import Image from "next/image";
import { cn } from "@/utils/ui";
import { editorT, localizeDefaultProjectName } from "@/i18n/editor";

interface EditorHeaderProps {
	isEmbedded?: boolean;
	layoutModeSwitch?: ReactNode;
}

export function EditorHeader({
	isEmbedded = false,
	layoutModeSwitch,
}: EditorHeaderProps) {
	return (
		<header
			className={cn(
				"bg-background flex h-[3.4rem] items-center justify-between px-3 pt-0.5",
				isEmbedded &&
					"h-12 border-b border-border/80 bg-background/95 px-4 pt-0",
			)}
		>
			<div className={cn("flex items-center gap-1", isEmbedded && "gap-2")}>
				<ProjectDropdown isEmbedded={isEmbedded} />
				<EditableProjectName isEmbedded={isEmbedded} />
			</div>
			<nav className="flex items-center gap-2">
				{!isEmbedded ? <FeedbackPopover /> : null}
				{layoutModeSwitch}
				<ExportButton isEmbedded={isEmbedded} />
				{!isEmbedded ? <ThemeToggle /> : null}
			</nav>
		</header>
	);
}

function ProjectDropdown({ isEmbedded }: { isEmbedded: boolean }) {
	const [openDialog, setOpenDialog] = useState<
		"delete" | "rename" | "shortcuts" | null
	>(null);
	const [isExiting, setIsExiting] = useState(false);
	const router = useRouter();
	const editor = useEditor();
	const activeProject = useEditor((e) => e.project.getActive());

	const handleExit = async () => {
		if (isExiting) return;
		setIsExiting(true);

		try {
			await editor.project.prepareExit();
			editor.project.closeProject();
		} catch (error) {
			console.error("Failed to prepare project exit:", error);
		} finally {
			editor.project.closeProject();
			router.push("/projects");
		}
	};

	const handleSaveProjectName = async (newName: string) => {
		if (
			activeProject &&
			newName.trim() &&
			newName !== activeProject.metadata.name
		) {
			try {
				await editor.project.renameProject({
					id: activeProject.metadata.id,
					name: newName.trim(),
				});
			} catch (error) {
				toast.error(editorT("project.renameError"), {
					description:
						error instanceof Error
							? error.message
							: editorT("common.retryLater"),
				});
			} finally {
				setOpenDialog(null);
			}
		}
	};

	const handleDeleteProject = async () => {
		if (activeProject) {
			try {
				await editor.project.deleteProjects({
					ids: [activeProject.metadata.id],
				});
				router.push("/projects");
			} catch (error) {
				toast.error(editorT("project.deleteError"), {
					description:
						error instanceof Error
							? error.message
							: editorT("common.retryLater"),
				});
			} finally {
				setOpenDialog(null);
			}
		}
	};

	if (isEmbedded) {
		return (
			<div className="flex size-7 items-center justify-center rounded-md border border-border bg-accent/70 p-1">
				<Image
					src={DEFAULT_LOGO_URL}
					alt={editorT("project.logoAlt")}
					width={32}
					height={32}
					className="invert dark:invert-0 size-4.5"
				/>
			</div>
		);
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="p-1 rounded-sm size-8">
						<Image
							src={DEFAULT_LOGO_URL}
							alt={editorT("project.logoAlt")}
							width={32}
							height={32}
							className="invert dark:invert-0 size-5"
						/>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="z-100 w-44">
					<DropdownMenuItem
						onClick={handleExit}
						disabled={isExiting}
						icon={<HugeiconsIcon icon={Logout05Icon} />}
					>
						{editorT("project.exit")}
					</DropdownMenuItem>

					<DropdownMenuItem
						onClick={() => setOpenDialog("shortcuts")}
						icon={<HugeiconsIcon icon={CommandIcon} />}
					>
						{editorT("project.shortcuts")}
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					<DropdownMenuItem asChild icon={<FaDiscord className="size-4!" />}>
						<Link
							href={SOCIAL_LINKS.discord}
							target="_blank"
							rel="noopener noreferrer"
						>
							Discord
						</Link>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<RenameProjectDialog
				isOpen={openDialog === "rename"}
				onOpenChange={(isOpen) => setOpenDialog(isOpen ? "rename" : null)}
				onConfirm={(newName) => handleSaveProjectName(newName)}
				projectName={
					activeProject
						? localizeDefaultProjectName({ name: activeProject.metadata.name })
						: ""
				}
			/>
			<DeleteProjectDialog
				isOpen={openDialog === "delete"}
				onOpenChange={(isOpen) => setOpenDialog(isOpen ? "delete" : null)}
				onConfirm={handleDeleteProject}
				projectNames={[
					activeProject
						? localizeDefaultProjectName({ name: activeProject.metadata.name })
						: "",
				]}
			/>
			<ShortcutsDialog
				isOpen={openDialog === "shortcuts"}
				onOpenChange={(isOpen) => setOpenDialog(isOpen ? "shortcuts" : null)}
			/>
		</>
	);
}

function EditableProjectName({ isEmbedded = false }: { isEmbedded?: boolean }) {
	const editor = useEditor();
	const activeProject = useEditor((e) => e.project.getActive());
	const [isEditing, setIsEditing] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const originalNameRef = useRef("");

	const projectName = activeProject
		? localizeDefaultProjectName({ name: activeProject.metadata.name })
		: "";

	const startEditing = () => {
		if (isEditing) return;
		originalNameRef.current = projectName;
		setIsEditing(true);

		requestAnimationFrame(() => {
			inputRef.current?.select();
		});
	};

	const saveEdit = async () => {
		if (!inputRef.current || !activeProject) return;
		const newName = inputRef.current.value.trim();
		setIsEditing(false);

		if (!newName) {
			inputRef.current.value = originalNameRef.current;
			return;
		}

		if (newName !== originalNameRef.current) {
			try {
				await editor.project.renameProject({
					id: activeProject.metadata.id,
					name: newName,
				});
			} catch (error) {
				toast.error(editorT("project.renameError"), {
					description:
						error instanceof Error
							? error.message
							: editorT("common.retryLater"),
				});
			}
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			event.preventDefault();
			inputRef.current?.blur();
		} else if (event.key === "Escape") {
			event.preventDefault();
			if (inputRef.current) {
				inputRef.current.value = originalNameRef.current;
				inputRef.current.setSelectionRange(0, 0);
			}
			setIsEditing(false);
			inputRef.current?.blur();
		}
	};

	return (
		<input
			key={projectName}
			ref={inputRef}
			type="text"
			defaultValue={projectName}
			aria-label={editorT("project.name")}
			readOnly={!isEditing}
			onClick={startEditing}
			onBlur={saveEdit}
			onKeyDown={handleKeyDown}
			style={{ fieldSizing: "content" }}
			className={cn(
				"text-[0.9rem] h-8 px-2 py-1 rounded-sm bg-transparent outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground",
				isEmbedded &&
					"max-w-[min(26rem,45vw)] truncate px-1 text-sm font-semibold text-foreground/95 hover:bg-accent/70",
				isEditing && "ring-1 ring-ring cursor-text hover:bg-transparent",
			)}
		/>
	);
}
