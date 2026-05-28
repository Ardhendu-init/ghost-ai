"use client";

import { Plus, X, Trash2, Edit2, LayoutGrid, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ProjectData } from "@/lib/projects";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProject: () => void;
  onRenameProject: (projectId: string, projectName: string) => void;
  onDeleteProject: (projectId: string, projectName: string) => void;
  ownedProjects: ProjectData[];
  sharedProjects: ProjectData[];
}

export function ProjectSidebar({
  isOpen,
  onClose,
  onNewProject,
  onRenameProject,
  onDeleteProject,
  ownedProjects,
  sharedProjects,
}: ProjectSidebarProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 z-40 flex flex-col bg-card border-r border-border transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <LayoutGrid className="h-4 w-4 text-brand" />
              <span className="text-xs font-semibold uppercase tracking-wider text-brand">
                Projects
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Create a project or jump into an existing room.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 mt-0.5 h-7 w-7 shrink-0 flex items-center justify-center rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Create project button */}
        <div className="px-4 pb-3">
          <Button
            className="w-full bg-brand hover:bg-brand/90 text-background font-medium"
            onClick={onNewProject}
          >
            <Plus className="h-4 w-4" />
            Create project
          </Button>
        </div>

        {/* Tabs + project list */}
        <ScrollArea className="flex-1">
          <Tabs defaultValue="my-projects" className="w-full">
            <div className="px-4">
              <TabsList className="w-full grid grid-cols-2 bg-muted/50">
                <TabsTrigger value="my-projects">My Projects</TabsTrigger>
                <TabsTrigger value="shared">Shared</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="my-projects" className="px-4 py-3">
              {ownedProjects.length > 0 ? (
                <ProjectList
                  projects={ownedProjects}
                  onRename={onRenameProject}
                  onDelete={onDeleteProject}
                />
              ) : (
                <EmptyState />
              )}
            </TabsContent>

            <TabsContent value="shared" className="px-4 py-3">
              {sharedProjects.length > 0 ? (
                <ProjectList
                  projects={sharedProjects}
                  onRename={onRenameProject}
                  onDelete={onDeleteProject}
                  hideActions
                />
              ) : (
                <EmptyState />
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </aside>
    </>
  );
}

interface ProjectListProps {
  projects: ProjectData[];
  onRename: (projectId: string, projectName: string) => void;
  onDelete: (projectId: string, projectName: string) => void;
  hideActions?: boolean;
}

function ProjectList({
  projects,
  onRename,
  onDelete,
  hideActions,
}: ProjectListProps) {
  const pathname = usePathname();
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  // Clear pending state once navigation lands on the requested project,
  // or any other path change cancels the spinner.
  useEffect(() => {
    if (navigatingId && pathname === `/editor/${navigatingId}`) {
      setNavigatingId(null);
    }
  }, [pathname, navigatingId]);

  const isNavigating = navigatingId !== null;

  return (
    <div className="space-y-2">
      {projects.map((project) => {
        const isActive = pathname === `/editor/${project.id}`;
        const isPending = navigatingId === project.id;
        const isDisabled = isNavigating && !isPending;
        return (
          <div
            key={project.id}
            className={`flex items-center justify-between p-3 rounded-xl group border transition-colors ${
              isActive
                ? "bg-muted border-border"
                : "bg-muted/30 hover:bg-muted/60 border-border/50"
            } ${isDisabled ? "opacity-50" : ""}`}
          >
            <Link
              href={`/editor/${project.id}`}
              className={`flex-1 min-w-0 flex items-center gap-2 ${
                isActive || isNavigating ? "pointer-events-none" : ""
              }`}
              aria-disabled={isActive || isNavigating}
              tabIndex={isActive || isNavigating ? -1 : undefined}
              onClick={() => {
                if (isActive || isNavigating) return;
                setNavigatingId(project.id);
              }}
            >
              <p
                className={`text-sm font-semibold truncate ${isActive ? "text-foreground" : "text-foreground/60"}`}
              >
                {project.name}
              </p>
              {isPending && (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand" />
              )}
            </Link>
            {!hideActions && (
              <div
                className={`flex gap-1 transition-opacity ml-2 shrink-0 ${
                  isNavigating
                    ? "opacity-0 pointer-events-none"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(project.id, project.name);
                  }}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Rename project"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id, project.name);
                  }}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Delete project"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="text-center text-sm text-muted-foreground">
        No projects yet. Create one to get started.
      </p>
    </div>
  );
}
