import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-zinc-900 rounded-3xl p-8 shadow-xl border border-zinc-800">
        <h1 className="text-4xl font-bold mb-4">Campeonato 8 Times</h1>
        <p className="text-zinc-300 mb-8">
          Simule partidas, acompanhe a tabela e veja os resultados do campeonato.
        </p>

        <div className="flex gap-4">
          <Link href="/campeonato" className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold">
            Ver Campeonato
          </Link>

          <Link href="/simulador" className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-semibold">
            Simular Partida
          </Link>
        </div>
      </div>
    </main>
  );
}