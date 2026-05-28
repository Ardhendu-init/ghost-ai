"use client";

import { useOthers, shallow } from "@liveblocks/react/suspense";
import { useAuth, UserButton } from "@clerk/nextjs";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_SIZE = 28;
const MAX_VISIBLE = 5;

export function PresenceAvatars() {
  const { userId } = useAuth();

  // Filter out the current Clerk user; update only when users join/leave
  const collaborators = useOthers(
    (others) =>
      others
        .filter((o) => o.id !== userId)
        .map((o) => ({
          connectionId: o.connectionId,
          name: o.info?.name ?? "User",
          avatar: o.info?.avatar ?? "",
          color: o.info?.color ?? "#6366f1",
        })),
    shallow,
  );

  const visible = collaborators.slice(0, MAX_VISIBLE);
  const overflowCount = collaborators.length - visible.length;
  const hasCollaborators = collaborators.length > 0;

  return (
    <div
      className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border/60 rounded-full px-2 py-1 shadow-md"
      style={{ userSelect: "none" }}
    >
      {hasCollaborators && (
        <>
          <div className="flex items-center">
            {visible.map((person, i) => (
              <div
                key={person.connectionId}
                title={person.name}
                style={{
                  marginLeft: i > 0 ? -8 : 0,
                  zIndex: MAX_VISIBLE - i,
                  position: "relative",
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: `2px solid ${person.color}`,
                  boxShadow: "0 0 0 1.5px rgba(0,0,0,0.55)",
                  overflow: "hidden",
                  backgroundColor: person.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "default",
                }}
              >
                {person.avatar ? (
                  <img
                    src={person.avatar}
                    alt={person.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1,
                    }}
                  >
                    {getInitials(person.name)}
                  </span>
                )}
              </div>
            ))}

            {overflowCount > 0 && (
              <div
                title={`${overflowCount} more`}
                style={{
                  marginLeft: -8,
                  zIndex: 0,
                  position: "relative",
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: "2px solid var(--border)",
                  boxShadow: "0 0 0 1.5px rgba(0,0,0,0.55)",
                  backgroundColor: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "default",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--muted-foreground)",
                    lineHeight: 1,
                  }}
                >
                  +{overflowCount}
                </span>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-border/60 shrink-0" />
        </>
      )}

      {/* w-7 h-7 = 28px — matches AVATAR_SIZE */}
      <UserButton
        appearance={{ elements: { avatarBox: "!w-7 !h-7" } }}
      />
    </div>
  );
}
