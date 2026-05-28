Rework template import to be additive instead of destructive, and fix three sidebar/canvas issues from `context/current-issue.md`: clear canvas not removing anything, sidebar not refreshing after project add/delete, and projects accepting unbounded repeat clicks with no loading feedback.

## Implementation

1. Rework template import as additive insert (replaces the previous clear-then-add behaviour).

   In `components/editor/flow-canvas.tsx`:
   - Rewrite `loadTemplate` so it never wipes the canvas.
   - Generate a fresh id for every imported node and edge using a per-import tag, and rewrite edge `source`/`target` through an id map. Two imports of the same template must coexist without colliding.
   - Compute the existing canvas bounding box and the incoming template bounding box. Offset the template so its bbox sits to the right of existing content with a fixed gap; align the top edge. If the canvas is empty, use zero offset.
   - Deselect any currently selected nodes via `select` changes, then add the new nodes with `selected: true`. The imported group should land selected so the user can drag it as one cluster.
   - After the add commits, call `rfInstance.fitView` scoped to the new node ids with a short animation, so the view pans to the import.
   - Drop the prior `setTimeout`-based clear-then-add sequence.

2. Add an explicit clear-canvas action.

   - Extend `FlowCanvasHandle` with a `clearCanvas` method.
   - Implementation must use `onDelete({ nodes, edges })` from `useLiveblocksFlow`. Do not construct `type: "remove"` node/edge changes — `@liveblocks/react-flow` ignores those in `applyNodeChanges`/`applyEdgeChanges`, so they are silent no-ops.
   - In `components/editor/canvas-control-bar.tsx`, add a trash-icon button after the undo/redo group, separated by a divider. Gate it behind a `canClear` flag and require `window.confirm` before invoking `onClear`.
   - Wire `onClear` and `canClear` from `FlowCanvas` to the control bar; the canvas remains undoable via Cmd/Ctrl+Z after clear.

3. Fix the sidebar going stale after project mutations.

   In `hooks/useProjectActions.ts`:
   - `submitCreate`: after `router.push(/editor/<id>)`, also call `router.refresh()`.
   - `submitDelete`: always call `router.refresh()` after the dialog closes, regardless of whether the deleted project was the current path.
   - The editor layout fetches `getOwnedProjects` / `getSharedProjects` server-side, so `router.push` alone reuses the cached RSC payload and the sidebar misses the mutation. The refresh is mandatory, not redundant.

4. Add a loading screen for the project route.

   - Create `app/editor/[roomId]/loading.tsx`.
   - Render a navbar skeleton bar over a dotted-canvas backdrop, with a centered brand-colored spinner and an "Opening project" caption. Match the workspace's dark theme — use existing tokens (`bg-card`, `border-border`, `text-brand`, `text-muted-foreground`), no hardcoded colors.

5. Disable repeat clicks and surface per-link feedback in the project sidebar.

   In `components/editor/project-sidebar.tsx`:
   - In `ProjectList`, track a `navigatingId` state set on link click and cleared via `useEffect` when `pathname` matches `/editor/<navigatingId>`.
   - The pending link shows a small `Loader2` spinner inline next to the project name.
   - While any navigation is pending, all other project links get `pointer-events-none opacity-50`, and the inline rename/delete buttons hide.
   - The currently active link is always `pointer-events-none` so re-clicking the current project is a no-op.
   - Use `aria-disabled` and `tabIndex={-1}` on disabled links so keyboard users get the same gating.

## Scope Limits

- Don't add server persistence for templates, custom user templates, or template saving.
- Don't change node, edge, or shape rendering behaviour.
- Don't change the create / rename / delete API routes — these fixes are client-side.
- Don't change how the editor layout fetches projects; just refresh the existing route after mutations.
- Don't introduce a new global navigation state or router context for the sidebar; keep `navigatingId` local to `ProjectList`.

## Check When Done

- Importing a template onto an empty canvas centers the imported group; importing onto an existing canvas places the new template to the right of existing content with a visible gap and leaves prior nodes untouched.
- Re-importing the same template twice produces two distinct, side-by-side copies (no silent merge, no id collision).
- The newly imported nodes are auto-selected and can be dragged as a group; the view pans to fit them.
- The trash button in the canvas control bar prompts for confirmation, removes all nodes and edges from the canvas across all connected clients, and the result is undoable via Cmd/Ctrl+Z.
- Creating a new project from any sidebar state immediately shows the new project in the sidebar without a hard refresh.
- Deleting any project (current or otherwise) immediately removes it from the sidebar without a hard refresh.
- Clicking a project link shows an inline spinner on that link, dims and disables the other project links, and the `app/editor/[roomId]/loading.tsx` screen renders while the room route is loading.
- The current project's link is non-clickable.
- `npm run build` passes.
