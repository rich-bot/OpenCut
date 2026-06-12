function getOpenCutRuntimePathPrefix() {
	if (typeof window === "undefined") {
		return "";
	}

	const routeMatch = window.location.pathname.match(
		/\/(?:embed|editor|video-editor)(?:\/|$)/,
	);
	if (!routeMatch || routeMatch.index === undefined) {
		return "";
	}
	return window.location.pathname.slice(0, routeMatch.index).replace(/\/+$/, "");
}

export function getOpenCutAssetProxyUrl({ url }: { url: string }) {
	if (typeof window === "undefined") {
		return url;
	}

	try {
		const parsedUrl = new URL(url, window.location.href);
		const pathPrefix = getOpenCutRuntimePathPrefix();
		const proxyPath = `${pathPrefix}/api/video-editor/asset`;
		const proxiedAssetUrl = parsedUrl.searchParams.get("url");

		if (
			parsedUrl.origin === window.location.origin &&
			parsedUrl.pathname.endsWith("/api/video-editor/asset") &&
			proxiedAssetUrl
		) {
			const normalizedProxyUrl = new URL(proxyPath, window.location.href);
			normalizedProxyUrl.searchParams.set("url", proxiedAssetUrl);
			return normalizedProxyUrl.toString();
		}

		if (parsedUrl.origin === window.location.origin) {
			return parsedUrl.toString();
		}
		if (!["http:", "https:"].includes(parsedUrl.protocol)) {
			return parsedUrl.toString();
		}

		const proxyUrl = new URL(proxyPath, window.location.href);
		proxyUrl.searchParams.set("url", parsedUrl.toString());
		return proxyUrl.toString();
	} catch {
		return url;
	}
}
