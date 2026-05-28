"use client";

import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react";
import { ErrorBoundary } from "react-error-boundary";
import { FlowCanvas } from "./flow-canvas";
import type { FlowCanvasHandle } from "./flow-canvas";

interface CanvasWrapperProps {
  roomId: string;
  canvasRef?: React.Ref<FlowCanvasHandle>;
}

function CanvasError() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <p className="text-sm text-muted-foreground select-none">
        Failed to connect to canvas. Please refresh.
      </p>
    </div>
  );
}

function CanvasLoading() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <p className="text-sm text-muted-foreground select-none animate-pulse">
        Connecting to canvas…
      </p>
    </div>
  );
}

export function CanvasWrapper({ roomId, canvasRef }: CanvasWrapperProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, isThinking: false }}
      >
        <ErrorBoundary fallbackRender={() => <CanvasError />}>
          <ClientSideSuspense fallback={<CanvasLoading />}>
            <FlowCanvas ref={canvasRef} />
          </ClientSideSuspense>
        </ErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
