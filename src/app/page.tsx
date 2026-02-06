import KanbanApp from "@/components/kanban/KanbanApp";
import ThemeToggle from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground bg-[linear-gradient(180deg,_rgba(248,250,252,0.95)_0%,_rgba(241,245,249,0.7)_40%,_rgba(248,250,252,1)_100%)] dark:bg-[radial-gradient(120%_60%_at_50%_0%,_rgba(59,130,246,0.22),_rgba(2,6,23,0)_60%)]">
      <header className="border-b border-slate-200 bg-transparent dark:border-slate-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400">
              Micro Kanban
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Control de tareas con auditoria
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <KanbanApp />
      </main>
    </div>
  );
}
