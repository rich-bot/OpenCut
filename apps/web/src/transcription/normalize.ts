import { toSimplifiedChinese } from "@/transcription/chinese";
import { shouldNormalizeToSimplifiedChinese } from "@/transcription/languages";
import type { TranscriptionResult } from "@/transcription/types";

export function normalizeTranscriptionResult({
	result,
	language,
}: {
	result: TranscriptionResult;
	language: string;
}): TranscriptionResult {
	if (!shouldNormalizeToSimplifiedChinese({ language })) {
		return result;
	}

	return {
		...result,
		text: toSimplifiedChinese({ text: result.text }),
		segments: result.segments.map((segment) => ({
			...segment,
			text: toSimplifiedChinese({ text: segment.text }),
		})),
	};
}
