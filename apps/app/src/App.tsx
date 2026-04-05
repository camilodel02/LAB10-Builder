import { formatTitle } from "./lib/formatTitle";

export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <h1 className="text-2xl font-semibold tracking-tight">{formatTitle("  LAB10 Builder - App: Dental Clinic Expense Extraction ")}</h1>
        <p className="mt-2 text-sm text-slate-400">
          Frontend listo. La API corre en <code className="text-slate-300">:8000</code>; Vite
          proxifica <code className="text-slate-300">/api</code>.
        </p>
      </div>
    </main>
  );
}
