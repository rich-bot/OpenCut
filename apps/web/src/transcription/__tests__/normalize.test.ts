import { describe, expect, test } from "bun:test";
import { getModelLanguageCode } from "@/transcription/languages";
import { normalizeTranscriptionResult } from "@/transcription/normalize";

describe("Chinese transcription normalization", () => {
	test("maps Simplified Chinese UI language to the Whisper Chinese language code", () => {
		expect(getModelLanguageCode({ language: "zh-CN" })).toBe("zh");
	});

	test("converts Traditional Chinese transcription output to Simplified Chinese", () => {
		const result = normalizeTranscriptionResult({
			language: "zh-CN",
			result: {
				text: "服務態度很好，這個方法發揮作用。",
				language: "zh-CN",
				segments: [
					{
						text: "服務態度很好，",
						start: 0,
						end: 2,
					},
					{
						text: "這個方法發揮作用。",
						start: 2,
						end: 5,
					},
				],
			},
		});

		expect(result.text).toBe("服务态度很好，这个方法发挥作用。");
		expect(result.segments.map((segment) => segment.text)).toEqual([
			"服务态度很好，",
			"这个方法发挥作用。",
		]);
	});
});
