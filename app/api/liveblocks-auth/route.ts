import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getLiveblocks, userIdToColor } from "@/lib/liveblocks";
import { checkProjectAccess } from "@/lib/project-access";

export async function POST(request: NextRequest) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const room =
    typeof (body as { room?: unknown })?.room === "string"
      ? (body as { room: string }).room.trim()
      : "";

  if (!room) {
    return NextResponse.json({ error: "Room ID required" }, { status: 400 });
  }

  // room ID = project ID per architecture
  const { hasAccess } = await checkProjectAccess(room);

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username ||
    "Anonymous";
  const avatar = user.imageUrl ?? "";
  const color = userIdToColor(user.id);

  const liveblocks = getLiveblocks();

  // ensure the room exists; create only if missing
  await liveblocks.getOrCreateRoom(room, { defaultAccesses: [] });

  const session = liveblocks.prepareSession(user.id, {
    userInfo: { name, avatar, color },
  });

  session.allow(room, session.FULL_ACCESS);

  const { status, body: responseBody } = await session.authorize();
  return new Response(responseBody, { status });
}
