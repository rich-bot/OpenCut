import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const assetUrl = searchParams.get("url");

	if (!assetUrl) {
		return NextResponse.json({ error: "Missing asset url" }, { status: 400 });
	}

	let parsedUrl: URL;
	try {
		parsedUrl = new URL(assetUrl);
	} catch {
		return NextResponse.json({ error: "Invalid asset url" }, { status: 400 });
	}

	if (!["http:", "https:"].includes(parsedUrl.protocol)) {
		return NextResponse.json(
			{ error: "Unsupported asset protocol" },
			{ status: 400 },
		);
	}

	const upstream = await fetch(parsedUrl, {
		headers: {
			accept: "*/*",
			"user-agent":
				"Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome Safari",
		},
	});

	if (!upstream.ok || !upstream.body) {
		return NextResponse.json(
			{ error: "Asset fetch failed" },
			{ status: upstream.status || 502 },
		);
	}

	return new Response(upstream.body, {
		status: 200,
		headers: {
			"content-type":
				upstream.headers.get("content-type") || "application/octet-stream",
			"cache-control": "public, max-age=3600",
		},
	});
}
