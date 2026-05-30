# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Database / Backend Foundation

## Current Goal

- AI design generation end-to-end (prompt → Gemini → live canvas updates with AI presence/status)

## Completed

- Design system and UI primitive components setup (01-design-system.md):
  - Installed shadcn/ui with Radix + Nova preset
  - Added components: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea
  - Installed lucide-react (v1.16.0) for icons
  - Created lib/utils.ts with cn() helper (uses clsx + tailwind-merge)
  - Dark theme configured in app/globals.css (`.dark` CSS class selector)
  - Applied `.dark` class to html element in app/layout.tsx for dark theme activation
  - All components import without errors, TypeScript validation passed
  - ✓ Dark theme visually verified: dark backgrounds (oklch 0.145), light text (oklch 0.985)
  - ✓ All button variants working (Primary, Outline, Secondary, Ghost, Destructive)
  - ✓ Cards, inputs, and all components render with correct dark colors

- Editor chrome components setup (02-editor.md):
  - Created `components/editor/editor-navbar.tsx`:
    - Fixed-height (h-16) top navbar with left, center, right sections
    - Sidebar toggle button with PanelLeftOpen/PanelLeftClose icons
    - Dark background (bg-card) with subtle bottom border
    - UserButton added to right section for profile settings and logout
  - Created `components/editor/project-sidebar.tsx`:
    - Floating overlay sidebar (z-40) that slides in from left
    - Accepts isOpen and onClose props with smooth transitions
    - Header with "Projects" title and close button (X icon)
    - shadcn Tabs component with "My Projects" and "Shared" tabs
    - Empty placeholder state in both tabs
    - Full-width "New Project" button at bottom with Plus icon
  - Created `components/editor/dialog-pattern.tsx`:
    - Reusable dialog pattern supporting title, description, and footer actions
    - Uses dark background with rounded-3xl radius (modal radius scale)
    - Color tokens from globals.css applied via shadcn theming
  - All components compile without TypeScript errors
  - No ESLint warnings or errors

- Authentication setup (03-auth.md):
  - Installed @clerk/ui dependency
  - Created `proxy.ts` at project root with clerkMiddleware
    - Public routes: /sign-in, /sign-up and their catch-all routes
    - All other routes protected by default
  - Wrapped root layout with ClerkProvider in `app/layout.tsx`
  - Created sign-in page (`app/sign-in/[[...sign-in]]/page.tsx`):
    - Two-panel layout on large screens with rounded border and shadow
    - Left panel: gradient background (indigo-purple to cyan), compelling headline, motivational tagline, "A WISE QUOTE" label
    - Right panel: elevated dark surface with centered Clerk SignIn component
    - Form-only layout on small screens (full width with dark background)
  - Created sign-up page (`app/sign-up/[[...sign-up]]/page.tsx`):
    - Same layout as sign-in page
    - Centered Clerk SignUp component
  - Updated root page (`app/page.tsx`) to redirect:
    - Authenticated users to `/editor`
    - Unauthenticated users to `/sign-in`
  - Added UserButton to editor navbar for profile and logout
  - ✓ Build passes without errors (npm run build successful)

- Editor layout integration:
  - Created `app/editor/layout.tsx`:
    - Manages sidebar open/close state
    - Integrates EditorNavbar component with toggle functionality
    - Integrates ProjectSidebar with overlay and close handlers
    - Main content area with proper padding for fixed navbar
  - Created `app/editor/page.tsx`:
    - Welcome message placeholder
    - Prompt to create new project
  - ✓ Editor page accessible at `/editor`
  - ✓ Build passes (npm run build successful)

- Project dialogs and sidebar actions (04-project-dialogs.md):
  - Created `hooks/useProjectDialogs.ts`:
    - Manages dialog state (create, rename, delete)
    - Manages form state (name, auto-generated slug)
    - Provides dialog open/close handlers
    - Auto-generates URL slug from project name
  - Created `components/editor/create-project-dialog.tsx`:
    - Project name input
    - Live slug preview that updates as user types
    - Cancel and Create buttons
  - Created `components/editor/rename-project-dialog.tsx`:
    - Prefilled project name input
    - Current project name shown in description
    - Input auto-focuses on dialog open
    - Enter key submits the form
    - Cancel and Rename buttons
  - Created `components/editor/delete-project-dialog.tsx`:
    - Destructive confirmation dialog (no input)
    - Shows project name in description
    - Cancel and Delete buttons (Delete uses destructive styling)
  - Updated `components/editor/project-sidebar.tsx`:
    - Added mock project data (2 owned, 1 shared)
    - Wired "New Project" button to Create dialog
    - Added project list items with hover state
    - Added dropdown menu with Rename/Delete actions
    - Actions visible only for owned projects
    - Actions hidden for shared/collaborator projects
    - Mobile backdrop scrim (visible only on mobile, hidden with `md:hidden`)
    - Click outside sidebar closes it
    - Escape key closes sidebar
  - Updated `components/editor/create-project-dialog.tsx` and sidebar to use dropdown-menu component
  - Updated `app/editor/page.tsx`:
    - Shows centered heading: "Create a project or open an existing one"
    - Shows description: "Start a new architecture workspace, or choose a project from the sidebar."
    - New Project button with Plus icon wired to Create dialog
    - Minimal layout, no cards
  - Updated `app/editor/layout.tsx`:
    - Integrated all three dialog components
    - Wired sidebar and home page actions to dialog handlers
    - Dialog state managed by useProjectDialogs hook
  - Installed `@base-ui/react/menu` for dropdown-menu component via shadcn
  - ✓ Build passes without errors (npm run build successful)
  - ✓ All TypeScript errors fixed
  - ✓ All ESLint warnings fixed (no errors, no warnings)
  - ✓ Mock project data shows in sidebar tabs
  - ✓ Slug preview works in Create dialog
  - ✓ All dialogs are wired correctly

- Prisma database models and client (05-prisma.md):
  - Created `prisma/models/project.prisma` with `Project` and `ProjectCollaborator` models
    - `Project`: ownerId (Clerk user), name, optional description, status enum (DRAFT/ARCHIVED), canvasJsonPath, timestamps, indexes on ownerId and createdAt
    - `ProjectCollaborator`: projectId FK with cascade delete, collaboratorEmail, createdAt, unique constraint on (projectId, collaboratorEmail), indexes on collaboratorEmail and (projectId, createdAt)
  - Created `lib/prisma.ts` as a cached singleton:
    - Branches on `DATABASE_URL` prefix: `prisma+postgres://` → Accelerate, otherwise `@prisma/adapter-pg`
    - Caches client on `globalThis` in development for hot-reload safety
    - Installed `@prisma/extension-accelerate` for Accelerate support
  - Migration `20260522154634_init_project_models` applied successfully to hosted Prisma Postgres
  - Client generated to `app/generated/prisma`
  - ✓ Build passes (npm run build successful)
  - Note: Prisma CLI requires Node 22+ (nvm v22.22.3) due to ESM bug in @prisma/dev@7.8.0 on Node 20

- Project API routes (06-project-apis.md):
  - Created `app/api/projects/route.ts`:
    - `GET /api/projects` — returns current user's projects ordered by createdAt desc
    - `POST /api/projects` — creates project; defaults name to "Untitled Project" if missing
  - Created `app/api/projects/[projectId]/route.ts`:
    - `PATCH /api/projects/[projectId]` — renames project; 403 for non-owners
    - `DELETE /api/projects/[projectId]` — deletes project; 403 for non-owners
  - All routes return 401 for unauthenticated requests
  - Owner checked via Clerk userId match before any mutation
  - ✓ Build passes (npm run build successful)

- Editor home wired to real API (07-wire-editor-home.md):
  - Created `lib/projects.ts` with `getOwnedProjects` and `getSharedProjects` server helpers (Prisma, select id+name only)
  - Created `hooks/useProjectActions.ts` (replaces useProjectDialogs.ts):
    - Manages dialog state and form state
    - `openCreateDialog`: generates short random suffix; roomId preview = `{slug}-{suffix}`
    - `submitCreate`: POST /api/projects → navigate to `/editor/{project.id}`
    - `submitRename`: PATCH /api/projects/[id] → router.refresh()
    - `submitDelete`: DELETE /api/projects/[id] → redirect to /editor if on active workspace, else refresh
  - Created `components/editor/editor-client.tsx`: client wrapper with sidebar state, useProjectActions, all dialogs
  - Converted `app/editor/layout.tsx` to async server component: fetches ownedProjects + sharedProjects, passes to EditorClient
  - Updated `components/editor/project-sidebar.tsx`: accepts real ProjectData[] props, removed mock data
  - Updated all three dialog components with `onSubmit` prop wired to hook mutations; create dialog shows Room ID preview
  - Created `components/editor/new-project-button.tsx`: client island for the home page CTA
  - Converted `app/editor/page.tsx` to server component; uses NewProjectButton client island
  - ✓ Build passes (npm run build successful)

- Editor workspace shell (08-editor-workspace-shell.md):
  - Created `lib/project-access.ts` with `getCurrentIdentity` and `checkProjectAccess` helpers
    - `getCurrentIdentity`: returns Clerk `userId` + primary email
    - `checkProjectAccess`: verifies project ownership or collaborator membership
  - Created `components/editor/access-denied.tsx`:
    - Centered layout with lock icon, short message, and "Back to editor" link
    - Used for missing projects or unauthorized access
  - Created `app/editor/[roomId]/page.tsx` (server component):
    - Unauthenticated users redirect to `/sign-in`
    - Missing or unauthorized projects render `AccessDenied`
    - Authorized users render `WorkspaceShell` with project context
  - Created `components/editor/workspace-shell.tsx` (client component):
    - Workspace toolbar: project name, Share button (placeholder), AI sidebar toggle
    - Canvas placeholder area (dark `bg-background`)
    - AI sidebar placeholder (toggleable, w-80)
  - Updated `components/editor/project-sidebar.tsx`:
    - Project items are now `Link` components navigating to `/editor/{id}`
    - Active project highlighted via `usePathname()` comparison
  - ✓ Build passes (npm run build successful)
  - ✓ No TypeScript errors

- Share dialog (09-share-dialog.md):
  - Created `app/api/projects/[projectId]/collaborators/route.ts`:
    - `GET` — lists collaborators; accessible to owners and collaborators; enriched with Clerk display name + avatar
    - `POST` — invites collaborator by email; owner-only; 409 on duplicate
    - `DELETE` — removes collaborator by email (body); owner-only
  - Created `components/editor/share-dialog.tsx`:
    - Owner view: email invite input (Enter or button), collaborator list with remove buttons, copy-link row
    - Collaborator view: read-only collaborator list + copy-link row
    - Clerk name/avatar enrichment with email fallback
    - Temporary "Copied!" feedback on copy button
  - Updated `components/editor/workspace-shell.tsx`:
    - Share button opens ShareDialog
    - Accepts `isOwner` prop and passes it through to dialog
  - Updated `app/editor/[roomId]/page.tsx`:
    - Computes `isOwner` from `project.ownerId === userId` and passes to WorkspaceShell
  - ✓ Build passes (npm run build successful)
  - ✓ No TypeScript errors

- Liveblocks realtime infrastructure setup (10-liveblocks-setup.md):
  - Installed `@liveblocks/node` (server SDK)
  - Updated `liveblocks.config.ts`: Presence (`cursor: {x,y}|null`, `isThinking: boolean`), UserMeta (`id`, `info: { name, avatar, color }`)
  - Created `lib/liveblocks.ts`: lazy-cached Liveblocks node client via `getLiveblocks()` + `userIdToColor()` deterministic color helper (8-color palette, hash of userId)
  - Created `app/api/liveblocks-auth/route.ts` (POST):
    - Requires Clerk authentication (401 if unauthenticated)
    - Verifies project access via `checkProjectAccess` (403 for unauthorized)
    - Ensures room exists via `getOrCreateRoom` (private by default)
    - Returns session token with user name, avatar, and deterministic cursor color
  - `LIVEBLOCKS_SECRET_KEY` placeholder added to `.env.local` — must be filled in from Liveblocks dashboard
  - ✓ Build passes (`npm run build` successful)

- Base canvas (11-base-canvas.md):
  - Installed `react-error-boundary`
  - Created `types/canvas.ts`: `NodeData` (label, color?, shape?), `CanvasNode` (Node<NodeData, "canvasNode">), `CanvasEdge` (Edge<{}, "canvasEdge">)
  - Created `components/editor/flow-canvas.tsx`:
    - Uses `useLiveblocksFlow` with `suspense: true` and empty initial nodes/edges
    - Renders `ReactFlow` with `ConnectionMode.Loose`, `fitView`, `MiniMap`, dot-pattern `Background`, and `Cursors`
    - Imports all required CSS: `@xyflow/react`, `@liveblocks/react-ui`, `@liveblocks/react-flow`
  - Created `components/editor/canvas-wrapper.tsx`:
    - `LiveblocksProvider` pointing at `/api/liveblocks-auth`
    - `RoomProvider` with `initialPresence: { cursor: null, isThinking: false }`
    - `ErrorBoundary` wrapping a `ClientSideSuspense` loading state
    - Renders `FlowCanvas` when connected
  - Updated `components/editor/workspace-shell.tsx`: canvas placeholder replaced with `<CanvasWrapper roomId={projectId} />`
  - ✓ Build passes (`npm run build` successful)

- Shape panel (12-shape-panel.md):
  - Updated `types/canvas.ts`: added `ShapeType` union (rectangle, diamond, circle, pill, cylinder, hexagon), `DragPayload` (shape, width, height)
  - Created `components/editor/canvas-node.tsx`: basic renderer for `canvasNode` type — bordered rectangle with centered label, handles on all 4 sides (top/right/bottom/left as source, compatible with `ConnectionMode.Loose`), border highlights when selected
  - Created `components/editor/shape-panel.tsx`: floating pill toolbar at canvas bottom-center — lucide icons per shape, `draggable` buttons with `onDragStart` setting `application/canvas-shape` payload (shape + default dimensions); sensible defaults: rectangle 160×80, diamond 120×120, circle 96×96, pill 160×64, cylinder 100×120, hexagon 110×110
  - Updated `components/editor/flow-canvas.tsx`:
    - Typed `useLiveblocksFlow<CanvasNode, CanvasEdge>` to fix inference
    - Added `nodeTypes = { canvasNode: CanvasNodeComponent }` (module-level stable ref)
    - Captures ReactFlow instance via `onInit` to access `screenToFlowPosition` (avoids `useReactFlow` context limitation)
    - `onDragOver`: prevents default, sets `dropEffect = "move"`
    - `onDrop`: reads payload, converts screen → canvas position, centers node on drop point, calls `onNodesChange([{ type: "add", item }])`
    - Node IDs generated as `{shape}-{timestamp}-{counter}`
    - `ShapePanel` rendered via React Flow's `<Panel position="bottom-center">`
  - ✓ Build passes (`npm run build` successful, no type errors)

- Node shape rendering and drag preview (13-node-shape.md):
  - Updated `components/editor/canvas-node.tsx`:
    - CSS shapes (rectangle, pill, circle): `rounded-md` / `rounded-full` border styling; subtle `border-border` at rest, brighter `border-primary` when selected
    - SVG shapes (diamond, hexagon, cylinder): inline SVG fills `w-full h-full` of the node container; `preserveAspectRatio="none"` for diamond and cylinder, `xMidYMid meet` for hexagon; stroke weight increases on selection
    - Cylinder rendered with rect body + side lines + top filled ellipse + bottom stroke-only ellipse for 3D appearance
  - Updated `components/editor/shape-panel.tsx`:
    - Added drag state tracking (`shape, width, height, x, y`)
    - `onDragStart`: suppresses browser's native ghost via 1×1 transparent canvas `setDragImage`; initialises drag state
    - `onDrag`: updates cursor position (skips `0,0` off-screen events)
    - `onDragEnd`: clears drag state
    - `ShapePreview` renders the matching shape at 60% scale, centered on cursor, via `createPortal` to `document.body` (`z-index: 9999`)
  - ✓ Build passes (`npm run build` successful, no type errors)

- Node editing (14-node-editing.md):
  - Created `contexts/canvas-actions.ts`: `NodeLabelContext` providing `updateLabel(id, label)` to node components; consumed via `useUpdateNodeLabel()` hook
  - Updated `components/editor/flow-canvas.tsx`:
    - Defined `updateLabel` callback: finds node in the `nodes` array, fires `onNodesChange([{ type: "replace", id, item: { ...node, data: { ...node.data, label } } }])` — the only `NodeChange` type that syncs data updates through Liveblocks
    - Wrapped the canvas `<div>` with `NodeLabelContext.Provider`
  - Updated `components/editor/canvas-node.tsx`:
    - Added `NodeResizer` to all shape variants: `isVisible={selected}`, `minWidth={60}`, `minHeight={40/60}`; subtle line (`opacity: 0.4`) and small handle (8×8px, card fill, primary border) styled to match dark UI
    - Resizing works via Liveblocks' `dimensions` change handler which stores root-level `width`/`height` (React Flow gives these priority over `style.width/height` in `getNodeInlineStyleDimensions`)
    - Added `NodeLabel` sub-component: double-click to start edit; `<textarea>` with `defaultValue={label}` overlays the label in the same centered position; `nodrag nowheel nopan` classes prevent canvas drag/pan/zoom while typing; `onBlur` saves via `updateLabel`; `Escape` sets `cancelRef=true` before calling `blur()` so the blur handler skips the update (cancel without save); `stopPropagation` on `mousedown/click/pointerdown` prevents canvas interactions
    - Placeholder text (`"Label"` in italic/30% opacity) shown when label is empty
  - ✓ Build passes (`npm run build` successful, no type errors)

- Node color toolbar (15-node-color-toolbar.md):
  - Updated `types/canvas.ts`: added `NodeColorPair` type and `NODE_COLORS` constant (8 bg/text pairs from ui-context.md); added `textColor?` field to `NodeData`
  - Updated `contexts/canvas-actions.ts`: added `NodeColorContext` providing `updateColor(id, bg, text)` and `useUpdateNodeColor()` hook
  - Updated `components/editor/flow-canvas.tsx`:
    - Added `updateColor` callback using `onNodesChange` replace to sync `color` + `textColor` through Liveblocks
    - Wrapped canvas tree with `NodeColorContext.Provider`
  - Created `components/editor/node-color-toolbar.tsx`:
    - Uses React Flow's `NodeToolbar` (position Top, offset 10) — renders outside the node DOM so it never overlaps or interferes with drag/pan
    - Shows only when node is `selected`
    - 8 circular swatches (18px), one per `NODE_COLORS` pair
    - Active swatch: colored border + subtle ring using the pair's text color
    - Hover: tight glow (`box-shadow: 0 0 5px 1px {text}50`) — controlled, not blurred
    - `stopPropagation` on mousedown/click/pointerdown prevents canvas drag/pan
  - Updated `components/editor/canvas-node.tsx`:
    - All shape variants (CSS and SVG) render `NodeColorToolbar` when selected
    - SVG shapes (diamond, hexagon, cylinder) accept `fill` prop; use `data.color ?? var(--card)` instead of hardcoded `var(--card)`
    - CSS shapes use `style={{ backgroundColor: nodeBg }}` instead of `bg-card` class
    - `NodeLabel` accepts `textColor?` prop; applies as inline style (overrides `var(--foreground)` fallback)
  - ✓ Build passes (`npm run build` successful, no type errors)

- Edge behaviour (16-edge-behaviour.md):
  - Updated `types/canvas.ts`: added `EdgeData` type `{ label?: string }`, changed `CanvasEdge` to use `EdgeData` instead of `Record<string, never>`
  - Updated `contexts/canvas-actions.ts`: added `EdgeLabelContext` and `useUpdateEdgeLabel()` hook — mirrors node label/color pattern
  - Updated `components/editor/canvas-node.tsx`:
    - Added `group` class to both container variants (SVG shapes and CSS shapes)
    - Handles styled: 10px white dots with dark border (`!border-neutral-900`), `!opacity-0` at rest, `group-hover:!opacity-100` fade in, 150ms transition
    - All four handles (Top/Right/Bottom/Left) consistent across all shape types
  - Created `components/editor/canvas-edge.tsx`:
    - `getSmoothStepPath` with `borderRadius: 10` for clean right-angle routing
    - Dimmed at rest (opacity 0.5), brightens to 1 on hover or selection; stroke color shifts to `--primary` when selected
    - Wide transparent path (strokeWidth 15) for easy hover and click without thick visible line
    - Per-edge SVG `<defs>` arrowhead marker whose fill tracks the current stroke color
    - `EdgeLabelRenderer` positions label div at path midpoint using `[labelX, labelY]` from `getSmoothStepPath` — no manual calculation
    - Double-click anywhere on edge or label area opens inline `<input>` editor
    - Input width grows with label length; saves on blur or Enter; Escape cancels without saving
    - Saved labels render as pill badges (`rounded-full` border, muted text)
    - When edge is hovered/selected but has no label, shows faint `+label` hint
    - `stopPropagation` on mousedown/click/pointerdown prevents canvas drag/pan during label edit
  - Updated `components/editor/flow-canvas.tsx`:
    - Registered `edgeTypes = { canvasEdge: CanvasEdgeComponent }` (module-level stable ref)
    - Added `defaultEdgeOptions = { type: "canvasEdge" }` so all new connections use custom renderer
    - Added `updateEdgeLabel` callback using `onEdgesChange` with `type: "replace"` to sync labels through Liveblocks
    - Wrapped canvas tree with `EdgeLabelContext.Provider`
  - ✓ Build passes (`npm run build` successful, no type errors)

- Canvas ergonomics (17-canvas-ergonomics.md):
  - Removed MiniMap from the canvas
  - Created `components/editor/canvas-control-bar.tsx`:
    - Pill-shaped floating bar rendered via React Flow `<Panel position="bottom-left">`
    - Zoom group: zoom out, fit view, zoom in — all wired to React Flow instance with 200ms animation
    - Thin divider between zoom and history groups
    - History group: undo and redo — wired to Liveblocks `useUndo`/`useRedo`
    - Disabled state (opacity-40, no hover) when `useCanUndo`/`useCanRedo` returns false
  - Created `hooks/useKeyboardShortcuts.ts`:
    - Receives RF instance + undo/redo handlers
    - Skips shortcuts when target is `input`, `textarea`, or `contentEditable`
    - `+`/`=` → zoom in, `-` → zoom out (200ms duration)
    - `Cmd/Ctrl+Z` → undo, `Cmd/Ctrl+Shift+Z` → redo, `Cmd/Ctrl+Y` → redo
  - Updated `components/editor/flow-canvas.tsx`: hooks wired, control bar rendered
  - ✓ Build passes (`npm run build` successful, no type errors)

- Starter template library (18-starter-template.md):
  - Created `components/editor/starter-templates.ts`:
    - `CanvasTemplate` type with id, name, description, nodes, edges
    - `CANVAS_TEMPLATES` array with three templates using shared `CanvasNode` / `CanvasEdge` types and `NODE_COLORS` palette
    - **Microservices**: API gateway → 4 services (rectangle) → 4 databases (cylinder); blue/purple/teal palette
    - **CI/CD Pipeline**: 8-stage linear flow from code commit to production deploy; green/blue/orange palette
    - **Event-Driven System**: Diamond producer → hexagon event bus → 3 consumers + dead-letter queue; purple/teal/red palette
  - Created `components/editor/starter-templates-modal.tsx`:
    - `Dialog`-based modal with scrollable 3-column grid of template cards
    - Lightweight SVG preview per card: calculates bounds, scales/fits to 240×150 viewport, renders edges as dashed lines, nodes as their actual shapes (diamond, hexagon, cylinder, ellipse, rect)
    - Import button calls `onImport(template)` then closes modal
  - Updated `components/editor/flow-canvas.tsx`:
    - Converted to `forwardRef` exporting `FlowCanvasHandle` with a `loadTemplate` method
    - `loadTemplate` clears all existing nodes/edges then adds template nodes/edges via `onNodesChange`/`onEdgesChange`, then `fitView` after 50 ms
    - Internal `loadTemplateFnRef` keeps the latest closure without breaking the stable `useImperativeHandle` handle
  - Updated `components/editor/canvas-wrapper.tsx`: accepts `canvasRef?: React.Ref<FlowCanvasHandle>` and threads it down to `FlowCanvas`
  - Updated `components/editor/workspace-shell.tsx`:
    - `canvasRef = useRef<FlowCanvasHandle>(null)` wired to `CanvasWrapper`
    - **Templates** button (LayoutTemplate icon) in workspace navbar opens modal
    - `onImport` calls `canvasRef.current?.loadTemplate(template)`
  - ✓ Build passes (`npm run build` successful, no type errors)

- Issue triage from `context/current-issue.md` (clear canvas, sidebar refresh, project nav loading):
  - **Clear canvas was a no-op.** Inspection of `node_modules/@liveblocks/react-flow/dist/lib/flow.js` confirmed `applyNodeChanges` ignores `type: "remove"` changes (falls through with empty `break`). The Liveblocks-blessed delete path is `onDelete({ nodes, edges })`, which mutates the LiveMap directly. Rewired `clearCanvas` in `components/editor/flow-canvas.tsx` to call `onDelete({ nodes, edges })`; dropped the `onNodesChange`/`onEdgesChange` remove arrays.
  - **Sidebar stale after create/delete.** Commit 01d5de0 had dropped `router.refresh()` calling it "redundant" — but the editor layout fetches `ownedProjects`/`sharedProjects` server-side, so a pure `router.push` reuses the cached RSC payload and the sidebar misses the mutation. In `hooks/useProjectActions.ts`:
    - `submitCreate`: re-added `router.refresh()` after `router.push(/editor/<id>)`.
    - `submitDelete`: always `router.refresh()`, whether or not the deleted project is the current path.
  - **Project navigation feedback.** Added `app/editor/[roomId]/loading.tsx` rendering a navbar skeleton over a dotted canvas backdrop with a centered brand spinner and "Opening project" caption.
  - **Sidebar click hardening.** `components/editor/project-sidebar.tsx`: `ProjectList` now tracks a `navigatingId` state set onClick, cleared via `useEffect` when `pathname` matches the target. While navigating, the pending link shows a `Loader2` spinner, all other links get `pointer-events-none opacity-50`, and rename/delete buttons hide. The active link is also `pointer-events-none` so re-clicking the current project is a no-op.
  - ✓ Build passes (`npm run build` successful, no type errors).

- Template import UX rework (insert-mode):
  - Reworked `loadTemplate` in `components/editor/flow-canvas.tsx` to additive insert (no canvas wipe):
    - Generates a fresh id per import (`${template.id}-${tag}-${origId}`) for every node and edge, with edge `source`/`target` rewritten through an `idMap`. Fixes silent merges caused by hardcoded ids colliding on re-import.
    - Computes existing-canvas and incoming-template bboxes via new `nodesBounds` helper, offsets the template so its bbox sits `IMPORT_GAP = 80px` right of existing content (top-aligned); zero offset when the canvas is empty.
    - Deselects currently-selected nodes via `select` changes and inserts new nodes with `selected: true`, so the import lands as a single draggable group.
    - Calls `rfInstance.fitView({ nodes: newNodes, padding: 0.2, duration: 300 })` post-commit to pan to the import.
    - Dropped the prior `setTimeout`-based clear-then-add sequence — no more races against Liveblocks sync.
  - Added `clearCanvas` to `FlowCanvasHandle` for explicit destructive reset (removes all edges then nodes; no-op on empty canvas).
  - Updated `components/editor/canvas-control-bar.tsx`: new `Trash2` button with `window.confirm` guard, gated by a `canClear` flag, sitting in its own divider segment after undo/redo. Plumbed `onClear`/`canClear` props.
  - ✓ Build passes (`npm run build` successful, no type errors)

- AI sidebar UI (21-ai-sidebar.md):
  - Created `components/editor/ai-sidebar.tsx`:
    - Fixed floating sidebar that slides in from the right (`fixed right-0 top-12`, `transition-transform duration-300`, always rendered for smooth animation)
    - Header: Bot icon, "AI Workspace" title, "Collaborate with Ghost AI" subtitle, close button
    - shadcn `Tabs` with "AI Architect" and "Specs" tabs; active tab uses `bg-brand/15 text-brand` styling
    - **AI Architect tab**: empty state with bot icon, description, and 3 starter prompt chips; scrollable chat area; user messages right-aligned (`bg-brand/15 border-brand/50`); assistant messages left-aligned (`bg-muted border-border`); auto-resizing textarea (72px min, 160px max); send button (`bg-brand text-black`); Enter submits, Shift+Enter inserts newline
    - **Specs tab**: "Generate Spec" button (`bg-brand text-black`); demo spec card with file icon, title, snippet, and disabled Download button
  - Updated `components/editor/workspace-shell.tsx`: replaced inline AI sidebar placeholder with `<AiSidebar>` component
  - ✓ Build passes (`npm run build` successful, no type errors)

- Presence avatars and live cursors (20-presence-avatars-cursor.md):
  - Updated `liveblocks.config.ts`: renamed `isThinking` → `thinking` in Presence type
  - Updated `components/editor/canvas-wrapper.tsx`: `initialPresence` updated to `{ cursor: null, thinking: false }`
  - Created `components/editor/presence-avatars.tsx`:
    - Uses `useOthers` (suspense) with `shallow` selector for performant join/leave updates
    - Filters collaborators by `o.id !== userId` (Clerk user ID from `useAuth()`) to exclude the current user
    - Shows up to 5 overlapping collaborator avatars with colored border ring (using `info.color` from UserMeta)
    - Falls back to initials when no avatar image is available
    - +N overflow chip when more than 5 collaborators are present
    - Divider between collaborator group and Clerk UserButton — only rendered when collaborators exist
    - Clerk `UserButton` with `!w-7 !h-7` to match the 28px avatar size
    - Floating pill UI (`bg-card/80 backdrop-blur-sm`) rendered inside React Flow Panel
  - Updated `components/editor/flow-canvas.tsx`:
    - Added `useMyPresence` from `@liveblocks/react` to broadcast cursor position
    - `onCanvasMouseMove`: converts screen coords to flow coords via `rfInstance.screenToFlowPosition`, calls `updateMyPresence({ cursor: pos })`
    - `onCanvasMouseLeave`: calls `updateMyPresence({ cursor: null })`
    - Both handlers attached to the canvas wrapper div
    - `<Panel position="top-right"><PresenceAvatars /></Panel>` added — renders inside the canvas, separate from the workspace navbar
    - Existing `<Cursors />` from `@liveblocks/react-flow` renders other participants' cursors using their `info.color` and presence cursor position
  - ✓ Build passes (`npm run build` successful, no type errors)

- Canvas autosave and persistence (22-canvas-auto-save.md):
  - Renamed `canvasJsonPath` → `canvasBlobUrl` on the `Project` model; migration `20260528162242_rename_canvas_blob_url` applied and client regenerated
  - Installed `@vercel/blob`
  - Created `app/api/projects/[projectId]/canvas/route.ts`:
    - `PUT` — receives canvas JSON, uploads to Vercel Blob (`canvas/{projectId}.json`), stores blob URL on the Prisma project record
    - `GET` — reads `canvasBlobUrl` from Prisma, fetches and returns the saved canvas JSON from Vercel Blob; returns `{ canvas: null }` when none saved
  - Created `hooks/useCanvasAutoSave.ts`:
    - Accepts `projectId`, `nodes`, `edges`, optional `onStatusChange` callback
    - 2-second debounce; skips first-mount render
    - Tracks status: `idle | saving | saved | error`
  - Updated `components/editor/flow-canvas.tsx`:
    - Accepts `projectId` and `onSaveStatusChange` props
    - Calls `useCanvasAutoSave` to debounce saves on node/edge changes
    - On first mount: if room is empty (Liveblocks suspense resolves before render), fetches saved canvas from API and inserts nodes/edges, then `fitView`; skips load if room already has content
  - Updated `components/editor/canvas-wrapper.tsx`: threads `projectId` and `onSaveStatusChange` down to `FlowCanvas`
  - Updated `components/editor/workspace-shell.tsx`:
    - Tracks `saveStatus` state; passes `onSaveStatusChange` to `CanvasWrapper`
    - Inline save indicator in workspace navbar: spinner + "Saving…" / checkmark + "Saved" / alert + "Save failed"
  - ✓ Build passes (`npm run build` successful, no type errors)

- Issue triage from `context/current-issue.md` (save button, delete, handles, first-drop zoom, avatar hostname):
  - **Save button**: already wired in `workspace-shell.tsx` to `canvasRef.current?.saveNow()` via `FlowCanvasHandle`; workspace-only (editor home navbar unchanged). ✓
  - **Canvas route PUT access**: already `access: "private"` in Vercel Blob put call. ✓
  - **Canvas route GET handler**: replaced raw `fetch(blobUrl)` with `head(blobUrl)` from `@vercel/blob` SDK to obtain a pre-authenticated `downloadUrl`, then fetches that. Handles private blob access correctly.
  - **Delete / Backspace**: added `useEffect` in `flow-canvas.tsx` after `useLiveblocksFlow` that listens for Delete/Backspace on `document`, skips inputs/textareas/contenteditable, filters selected nodes and edges, and calls `onDelete` via Liveblocks collaborative state. Added `deleteKeyCode={null}` to `<ReactFlow>` to disable React Flow's built-in delete behavior.
  - **Node connection handles (all 4 sides)**: removed `z-10` from `NodeLabel` container div in `canvas-node.tsx`. With no explicit z-index, React Flow's handles (z-index 5+ from library CSS) are now above the label overlay at the node edges, making right/bottom/left source handles accessible for connection dragging. Double-click in the node center still works because no handle occupies the center.
  - **Auto-zoom on first node drop**: removed `fitView` prop from `<ReactFlow>`. Added a guard in `onInit` that calls `instance.fitView` only when nodes already exist in the room. Empty-canvas drops no longer trigger viewport zoom. Blob-loaded canvases still fit via the existing `useEffect` setTimeout.
  - **Collaborator avatar image error**: added `img.clerk.com` to `images.remotePatterns` in `next.config.ts`.
  - **UserButton in workspace navbar**: already absent from `workspace-shell.tsx`; `editor-navbar.tsx` (editor home) still has it. ✓
  - ✓ Build passes (`npm run build` successful, no type errors)

- Design agent API wiring (23-design-agent-api.md):
  - Created `prisma/models/task-run.prisma` with `TaskRun` model:
    - Fields: `runId` (unique), `projectId`, `userId`, `createdAt`
    - Index on `runId`, compound index on `userId` + `projectId`
    - Schema pushed via `prisma db push`; client regenerated
  - Created `trigger/design-agent.ts`:
    - Exports `designAgentTask` using `task()` from `@trigger.dev/sdk/v3`
    - Accepts `{ prompt, roomId }` payload; logs and echoes input (no AI logic yet)
  - Created `app/api/ai/design/route.ts` (`POST /api/ai/design`):
    - Requires Clerk auth (401 if unauthenticated)
    - Accepts `{ prompt, roomId, projectId }` body (400 if missing)
    - Triggers `design-agent` task via `tasks.trigger` from Trigger.dev SDK
    - Creates `TaskRun` record in Prisma
    - Returns `{ runId }` with 201
  - Created `app/api/ai/design/token/route.ts` (`POST /api/ai/design/token`):
    - Requires Clerk auth (401 if unauthenticated)
    - Accepts `{ runId }` body; 400 if missing
    - Verifies ownership via `TaskRun` record (403 if not found or wrong user)
    - Generates Trigger.dev public token scoped to that run via `auth.createPublicToken`
    - Returns `{ token }`
  - ✓ Build passes (`npm run build` successful, no type errors)

- AI design agent logic (24-implement-ai-logic.md):
  - Created `types/ai.ts` (shared by the Trigger.dev task and client overlay):
    - `AiStatus` (a `type`, not `interface`, so it satisfies Liveblocks' LSON check): `{ state, message, cursor, updatedAt }`
    - `AI_PALETTE` (named color → `NodeColorPair` from `NODE_COLORS`), `PALETTE_NAMES`, `ALLOWED_SHAPES`, `SHAPE_DIMENSIONS`
    - `DesignAction` union (addNode/moveNode/resizeNode/updateNode/deleteNode/addEdge/deleteEdge) and `DesignPlan`
  - Updated `liveblocks.config.ts`: added optional `ai?: AiStatus | null` to `Storage` (optional keeps react-flow's lazy storage + RoomProvider `initialStorage` unaffected)
  - Implemented `trigger/design-agent.ts` (full agent):
    - Interprets the prompt via `@openrouter/sdk` (`openrouter.chat.send`) using `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` (NVIDIA Nemotron 3 Nano Omni, free); JSON is requested in the system prompt and extracted by a tolerant parser (strips `<think>` traces / ``` fences / takes the first `{...}` block — no forced `responseFormat`, since this is a reasoning model); key from `OPENROUTER_API_KEY ?? OPENAI_API_KEY`
    - Mutates the collaborative canvas through the official server helper `mutateFlow` from `@liveblocks/react-flow/node` (same storage key as the client's `useLiveblocksFlow`) — supports add/move/resize/update/delete node and add/delete edge; model-local node ids remapped to `ai-{runId}-{id}` with edge endpoints resolved through the map; dangling edges pruned on node delete
    - Enforces design rules: shapes clamped to `ALLOWED_SHAPES`, colors mapped through `AI_PALETTE`, grid-based spacing (260×160) with coordinate fallback and per-shape default dimensions
    - Publishes a shared status feed + AI presence into Liveblocks storage `ai` key via the node client's `mutateStorage` — `thinking` → `working` (with ghost-cursor sweep as each node is added) → `done`/`error`, then clears presence after a short delay
    - Errors handled gracefully: status set to `error`, presence cleared, error rethrown for Trigger.dev retry/visibility
  - Created `components/editor/ai-overlay.tsx`: `AiCursor` (ghost cursor in flow space via `ViewportPortal`) and `AiStatusBanner`, both driven by `useStorage(root => root.ai)` so every participant sees the same AI presence/progress
  - Updated `components/editor/flow-canvas.tsx`: renders `<AiCursor />` and a top-center `<Panel>` with `<AiStatusBanner />`
  - Wired `components/editor/ai-sidebar.tsx`: `sendMessage` now POSTs to `/api/ai/design` with `{ prompt, roomId, projectId }` (roomId = projectId), with `isSending` guard and assistant ack/error messages; `projectId` prop threaded from `workspace-shell.tsx`
  - ✓ Build passes (`npm run build` successful, no type errors)
  - Note: the Trigger.dev task needs `OPENROUTER_API_KEY` (or `OPENAI_API_KEY`) and `LIVEBLOCKS_SECRET_KEY` available in its runtime env (Trigger dev/deploy), and the `design-agent` task must be deployed/running for triggers to execute

- Shared AI present state (25-ai-present-state.md):
  - Created `types/tasks.ts` with `AiStatusFeedPayload` type (`{ text?: string }`) and `isAiStatusFeedPayload` runtime guard
  - Updated `liveblocks.config.ts`: added `aiStatusFeed?: AiStatusFeedPayload | null` to Storage alongside the existing `ai` key
  - Updated `components/editor/canvas-wrapper.tsx`: added `children?: React.ReactNode` prop rendered inside `RoomProvider` (but outside Suspense) — gives sibling components access to Liveblocks hooks
  - Updated `components/editor/workspace-shell.tsx`: moved `<AiSidebar>` from the content row into `<CanvasWrapper>` children so it lives inside the `RoomProvider`
  - Updated `components/editor/ai-sidebar.tsx`:
    - Imports `useStorage` (non-suspense) from `@liveblocks/react` to read shared room state
    - `aiState` from `Storage.ai.state`; `isGenerating = isSending || aiState === "thinking" | "working"`
    - Header bot icon shows a pulsing brand dot when `isGenerating`; subtitle switches to "Ghost AI is working…"
    - Textarea disabled + border tinted brand when `isGenerating`; placeholder changes to "AI is working on the canvas…"
    - Send button shows `Loader2` spinner while `isSending`, disabled when `isGenerating`
    - `feedText` read from `Storage.aiStatusFeed` via `isAiStatusFeedPayload` guard; shown as a slim status bar above the input area
  - Updated `components/editor/flow-canvas.tsx`:
    - Added `ThinkingCursor` component — custom cursor SVG + name badge that shows `Loader2` spinner when `useOther(connectionId, o => o.presence.thinking)` is true
    - `cursorsComponents = { Cursor: ThinkingCursor }` stable module-level ref passed to `<Cursors components={cursorsComponents} />`
  - ✓ Build passes (`npm run build` successful, no type errors)

- Sidebar chat feed (26-sidebar-chat-feed.md):
  - Added `ChatMessage` Zod schema and type to `types/tasks.ts`:
    - Fields: `id` (UUID), `sender` (display name), `role` (`"user"` literal), `content` (non-empty string), `timestamp` (number)
    - `isChatMessage` runtime guard validates feed items before rendering
  - Updated `liveblocks.config.ts`: added `aiChat?: LiveList<ChatMessage> | null` to Storage — room-scoped, separate from `aiStatusFeed`
  - Updated `components/editor/ai-sidebar.tsx`:
    - Added **Chat** tab between AI Architect and Specs tabs
    - `RoomChatPanel` component: reads `aiChat` via `useStorage`, writes via `useMutation` (lazy-initialises `LiveList` on first send if absent)
    - `useSelf()` provides the current user's display name as `sender`
    - `RoomChatBubble`: own messages right-aligned (`bg-brand/10`), others left-aligned (`bg-muted`) with sender name + time shown
    - Input and send button follow the same pattern as the AI Architect tab; Shift+Enter for newlines, Enter to send
    - `sendError` state shows a small error message below the input if the mutation throws
    - `ChatEmptyState` shown when no messages exist
  - `ai-chat` feed remains fully separate from `aiStatusFeed`; no AI-generated replies wired in this spec
  - ✓ Build passes (`npm run build` successful, no TypeScript errors)

- Design agent frontend wiring (27-design-agent-frontend.md):
  - Updated `app/api/ai/design/route.ts`: generates and returns `publicToken` (Trigger.dev public run-scoped token) alongside `runId` in the same 201 response — eliminates a second round-trip for the token
  - Updated `components/editor/ai-sidebar.tsx`:
    - AI Architect tab now reads/writes `ai-chat` Liveblocks feed (`useStorage` + `useMutation`) instead of local state — messages are collaborative and visible across clients
    - `sendMessage` posts user message to `ai-chat` feed, calls `/api/ai/design`, stores returned `runId` + `publicToken` in local state
    - `RunTracker` component: mounts while a run is in-flight, uses `useRealtimeRun(runId, { accessToken: publicToken })` from `@trigger.dev/react-hooks`; on terminal status (`COMPLETED`/`FAILED`/etc.) posts a final AI message to `ai-chat` and clears run state
    - `isRunActive` flag (`isSending || runId !== null || aiState === "thinking/working"`) disables textarea and dims send button while AI is running
    - Send button uses `#62C073` green when enabled; shows `Loader2` spinner while `isSending`
    - Status strip (animated ping dot + `feedText`) renders above input only when `isRunActive` and status feed has content
    - `ArchitectBubble`: user bubbles use `#62C073` background with dark text; AI bubbles use `bg-muted` dark background with light text
    - Errors appended to `ai-chat` feed (collaborative) instead of local toast
  - Canvas updates remain Liveblocks-driven via `useLiveblocksFlow` — no manual sync
  - ✓ Build passes (`npm run build` successful, no TypeScript errors)

## In Progress

- None.

## Next Up

- Spec generation background task (canvas graph → Markdown spec saved to Vercel Blob + DB record)

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- ClerkProvider wraps root layout without custom appearance config (uses defaults with dark theme CSS inheritance from .dark class)
- Auth middleware uses proxy.ts instead of middleware.ts per Clerk recommendations
- Root page uses client-side useAuth hook with useRouter for redirects

## Session Notes

- Auth implementation complete per 03-auth.md specification
- All routes protected except /sign-in and /sign-up
- CSS variables from globals.css naturally apply to Clerk components through dark theme inheritance
