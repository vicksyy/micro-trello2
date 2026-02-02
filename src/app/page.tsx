export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-500">
              Micro Kanban
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Control de tareas con auditoria
            </h1>
          </div>
          <div className="text-sm text-slate-500">
            Next.js + Shadcn UI
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-600">
          Aqui vivira el tablero Kanban, filtros y auditoria.
        </section>
      </main>
    </div>
  );
}
