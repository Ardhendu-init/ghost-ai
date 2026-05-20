"use client";

import { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
      />
      <ProjectSidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
      <main className="pt-16 min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
