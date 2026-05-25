import OpenCC from "opencc-js";

const traditionalToSimplified = OpenCC.Converter({ from: "t", to: "cn" });

export function toSimplifiedChinese({ text }: { text: string }): string {
	return traditionalToSimplified(text);
}
