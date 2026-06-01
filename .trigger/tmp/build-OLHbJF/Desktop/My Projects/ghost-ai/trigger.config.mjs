import {
  defineConfig
} from "../../../chunk-6ZSQFZND.mjs";
import "../../../chunk-WC7F3RM6.mjs";
import {
  init_esm
} from "../../../chunk-KUOAKOUY.mjs";

// trigger.config.ts
init_esm();
var trigger_config_default = defineConfig({
  project: "proj_guhjyezwgxqpeqzvmgku",
  dirs: ["trigger"],
  // Max compute-time seconds a task run may run before being killed (min 5s)
  maxDuration: 300,
  // Default machine for all deployed tasks — override per-task when needed
  // Options: "micro" | "small-1x" | "small-2x" | "medium-1x" | "medium-2x" | "large-1x" | "large-2x"
  machine: "small-1x",
  runtime: "node",
  build: {},
  // Default retry behavior for all tasks (can be overridden per task)
  retries: {
    enabledInDev: false,
    // don't retry in local dev — fail fast
    default: {
      maxAttempts: 3,
      factor: 2,
      // exponential backoff multiplier
      minTimeoutInMs: 1e3,
      maxTimeoutInMs: 3e4,
      randomize: true,
      // jitter to avoid thundering herd
      outOfMemory: {
        machine: "medium-1x"
        // auto-upgrade machine on OOM failure
      }
    }
  }
});
var resolveEnvVars = void 0;
export {
  trigger_config_default as default,
  resolveEnvVars
};
//# sourceMappingURL=trigger.config.mjs.map
