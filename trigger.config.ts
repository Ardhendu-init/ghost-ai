import { defineConfig } from "@trigger.dev/sdk";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  project: "proj_guhjyezwgxqpeqzvmgku",
  dirs: ["trigger"],

  // Max compute-time seconds a task run may run before being killed (min 5s)
  maxDuration: 300,

  // Default machine for all deployed tasks — override per-task when needed
  // Options: "micro" | "small-1x" | "small-2x" | "medium-1x" | "medium-2x" | "large-1x" | "large-2x"
  machine: "small-1x",
  runtime: "node",
  build: {
    extensions: [
      prismaExtension({
        mode: "legacy",
        schema: "./prisma",
      }),
    ],
  },
  // Default retry behavior for all tasks (can be overridden per task)
  retries: {
    enabledInDev: false, // don't retry in local dev — fail fast
    default: {
      maxAttempts: 3,
      factor: 2, // exponential backoff multiplier
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 30000,
      randomize: true, // jitter to avoid thundering herd
      outOfMemory: {
        machine: "medium-1x", // auto-upgrade machine on OOM failure
      },
    },
  },
});
