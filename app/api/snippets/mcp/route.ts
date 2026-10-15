import { NextResponse } from "next/server";
import { handleMcpRequest } from "@/lib/snippets/mcp";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 });
  }
  const response = handleMcpRequest(body);
  if (response === null) return new Response(null, { status: 202 });
  return NextResponse.json(response);
}
