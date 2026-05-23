import { NewProjectButton } from "@/components/editor/new-project-button";

export default function EditorPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Create a project or open an existing one
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Start a new architecture workspace, or choose a project from the
          sidebar.
        </p>
        <NewProjectButton />
      </div>
    </div>
  );
}
