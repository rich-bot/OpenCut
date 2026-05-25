"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

type OpenCutTheme = "light" | "dark" | "system";

function normalizeTheme(value: unknown): OpenCutTheme | null {
	if (typeof value !== "string") return null;

	if (value === "light" || value === "dark" || value === "system") {
		return value;
	}

	if (value === "auto") {
		return "system";
	}

	return null;
}

export function ThemeEmbedSync() {
	const { setTheme } = useTheme();
	const setThemeRef = useRef(setTheme);

	useEffect(() => {
		setThemeRef.current = setTheme;
	}, [setTheme]);

	useEffect(() => {
		const applyTheme = (value: unknown) => {
			const theme = normalizeTheme(value);
			if (theme) {
				setThemeRef.current(theme);
			}
		};

		applyTheme(new URLSearchParams(window.location.search).get("theme"));

		const handleMessage = (event: MessageEvent) => {
			const data = event.data;
			if (!data || typeof data !== "object") return;

			const message = data as {
				source?: unknown;
				type?: unknown;
				theme?: unknown;
			};

			if (message.source !== "neo-web" || message.type !== "set-theme") {
				return;
			}

			applyTheme(message.theme);
		};

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, []);

	return null;
}
