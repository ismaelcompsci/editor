import CanvasEditor from "@/components/editor/canvas-editor";
import ThemeToggle from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col justify-between p-8 font-[family-name:var(--font-geist-sans)] sm:p-20">
      <div className="absolute top-2 right-2">
        <ThemeToggle />
      </div>
      <CanvasEditor />
    </div>
  );
}
