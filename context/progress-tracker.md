# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Database / Backend Foundation

## Current Goal

- Add editor canvas/workspace area (Liveblocks + React Flow)

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

## In Progress

- None.

## Next Up

- Add editor canvas/workspace area (Liveblocks + React Flow)

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
