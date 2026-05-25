import type { TranscriptionSegment, CaptionChunk } from "@/transcription/types";
import {
	DEFAULT_CJK_CHARS_PER_CAPTION,
	DEFAULT_WORDS_PER_CAPTION,
	MIN_CAPTION_DURATION_SECONDS,
} from "@/transcription/caption-defaults";

const CJK_PATTERN = /[\u3400-\u9fff\uf900-\ufaff]/;
const CJK_BREAK_PUNCTUATION = /[，。！？、：；,.!?:;]/;

function containsCjk({ text }: { text: string }) {
	return CJK_PATTERN.test(text);
}

function splitCjkText({
	text,
	charsPerChunk,
}: {
	text: string;
	charsPerChunk: number;
}): string[] {
	const normalizedText = text.trim().replace(/\s+/g, "");
	if (!normalizedText) return [];

	const chunks: string[] = [];
	let currentChunk = "";
	const softBreakLength = Math.max(6, Math.floor(charsPerChunk / 2));

	for (const char of Array.from(normalizedText)) {
		currentChunk += char;

		const shouldBreakOnPunctuation =
			CJK_BREAK_PUNCTUATION.test(char) &&
			currentChunk.length >= softBreakLength;
		const shouldBreakOnLength = currentChunk.length >= charsPerChunk;

		if (shouldBreakOnPunctuation || shouldBreakOnLength) {
			chunks.push(currentChunk);
			currentChunk = "";
		}
	}

	if (currentChunk) {
		chunks.push(currentChunk);
	}

	return chunks;
}

function splitWhitespaceText({
	text,
	wordsPerChunk,
}: {
	text: string;
	wordsPerChunk: number;
}): string[] {
	const words = text.trim().split(/\s+/).filter(Boolean);
	const chunks: string[] = [];

	for (let i = 0; i < words.length; i += wordsPerChunk) {
		chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
	}

	return chunks;
}

export function buildCaptionChunks({
	segments,
	wordsPerChunk = DEFAULT_WORDS_PER_CAPTION,
	cjkCharsPerChunk = DEFAULT_CJK_CHARS_PER_CAPTION,
	minDuration = MIN_CAPTION_DURATION_SECONDS,
}: {
	segments: TranscriptionSegment[];
	wordsPerChunk?: number;
	cjkCharsPerChunk?: number;
	minDuration?: number;
}): CaptionChunk[] {
	const captions: CaptionChunk[] = [];
	let globalEndTime = 0;

	for (const segment of segments) {
		const text = segment.text.trim();
		if (!text) continue;

		const chunks = containsCjk({ text })
			? splitCjkText({ text, charsPerChunk: cjkCharsPerChunk })
			: splitWhitespaceText({ text, wordsPerChunk });

		if (chunks.length === 0) continue;

		const segmentDuration = Math.max(segment.end - segment.start, minDuration);
		const totalUnits = chunks.reduce(
			(sum, chunk) =>
				sum +
				(containsCjk({ text: chunk })
					? Array.from(chunk).length
					: chunk.split(/\s+/).length),
			0,
		);
		const unitsPerSecond = totalUnits / segmentDuration;
		let chunkStartTime = segment.start;

		for (const chunk of chunks) {
			const chunkUnits = containsCjk({ text: chunk })
				? Array.from(chunk).length
				: chunk.split(/\s+/).length;
			const chunkDuration = Math.max(minDuration, chunkUnits / unitsPerSecond);
			const adjustedStartTime = Math.max(chunkStartTime, globalEndTime);

			captions.push({
				text: chunk,
				startTime: adjustedStartTime,
				duration: chunkDuration,
			});

			globalEndTime = adjustedStartTime + chunkDuration;
			chunkStartTime += chunkDuration;
		}
	}

	return captions;
}
