import { NextResponse } from "next/server";

export function jsonSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function jsonError(message: string, status = 500) {
  return NextResponse.json(
    { success: false, error: { message } },
    { status },
  );
}
