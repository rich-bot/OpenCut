import { describe, expect, test } from "bun:test";
import { buildCaptionChunks } from "@/transcription/caption";

describe("buildCaptionChunks", () => {
	test("splits Chinese transcription text by punctuation and length", () => {
		const captions = buildCaptionChunks({
			segments: [
				{
					text: "欢迎使用智能剪辑工具。它可以自动识别字幕，并生成更适合阅读的片段。",
					start: 0,
					end: 8,
				},
			],
			cjkCharsPerChunk: 14,
		});

		expect(captions.map((caption) => caption.text)).toEqual([
			"欢迎使用智能剪辑工具。",
			"它可以自动识别字幕，",
			"并生成更适合阅读的片段。",
		]);
	});

	test("keeps whitespace based chunking for English text", () => {
		const captions = buildCaptionChunks({
			segments: [
				{
					text: "Create captions from the timeline audio",
					start: 0,
					end: 3,
				},
			],
			wordsPerChunk: 3,
		});

		expect(captions.map((caption) => caption.text)).toEqual([
			"Create captions from",
			"the timeline audio",
		]);
	});
});
