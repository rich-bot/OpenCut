import { NextResponse } from "next/server";
import { makeSameDemo } from "@/mock/make-same-demo";

interface RouteContext {
	params: Promise<{
		id: string;
	}>;
}

export async function GET(_request: Request, context: RouteContext) {
	const { id } = await context.params;

	return NextResponse.json({
		...makeSameDemo,
		id: id || makeSameDemo.id,
		projectName: `同款视频 ${id || makeSameDemo.id}`,
	});
}
