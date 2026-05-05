import Link from "next/link";

export default function Home() {
  const campeonatoCriado = false;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="min-h-screen bg-[radial-gradient(circle_at_top,#12315f,transparent_45%),linear-gradient(to_bottom,#020617,#09090b)]">
        <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-black">🏆 LIGA DOS CAMPEÕES</h1>
            <p className="text-blue-400 font-bold">8 TIMES</p>
          </div>

          <nav className="hidden md:flex gap-8 text-zinc-300 font-semibold">
            <Link href="/">Início</Link>
            <Link href="/campeonato">Tabela</Link>
            <Link href="/jogo">Jogos</Link>
            <Link href="/resultados">Resultados</Link>
            <Link href="/sobre">Sobre</Link>
          </nav>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="text-center mb-10">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-5xl md:text-7xl font-black">
              LIGA DOS <span className="text-blue-500">CAMPEÕES</span>
            </h2>
            <p className="text-2xl font-bold mt-3">⭐ 8 TIMES ⭐</p>
            <p className="text-zinc-300 mt-4 text-lg">
              Crie seu campeonato, defina os times e acompanhe a disputa pelo título.
            </p>
          </div>

          {!campeonatoCriado ? (
            <div className="max-w-3xl mx-auto bg-black/40 border border-blue-500/30 rounded-3xl p-8 text-center shadow-2xl">
              <h3 className="text-3xl font-black mb-3">
                Nenhum campeonato criado ainda
              </h3>

              <p className="text-zinc-300 mb-8">
                Os nomes dos times, tabela, jogos e resultados só aparecerão
                depois que você criar um campeonato.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <Link
                  href="/criar-campeonato"
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-5 rounded-2xl font-black text-lg"
                >
                  🏆 Criar Campeonato
                </Link>

                <Link
                  href="/jogo"
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-5 rounded-2xl font-black text-lg"
                >
                  🎮 Jogar 2D
                </Link>

                <Link
                  href="/copa"
                  className="bg-yellow-600 hover:bg-yellow-700 px-6 py-5 rounded-2xl font-black text-lg"
                >
                  🏆 Copa Mata-Mata
                </Link>

                <Link
                  href="/copa-ia"
                  className="bg-cyan-600 hover:bg-cyan-700 px-6 py-5 rounded-2xl font-black text-lg"
                >
                  🧠 Copa Mata-Mata IA
                </Link>

                <Link
                  href="/simulador"
                  className="bg-green-600 hover:bg-green-700 px-6 py-5 rounded-2xl font-black text-lg md:col-span-2"
                >
                  ⚽ Simular Partida
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                  <p className="text-zinc-400">Temporada atual</p>
                  <h3 className="text-xl font-bold">Temporada 1 - 2024</h3>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                  <p className="text-zinc-400">Rodada atual</p>
                  <h3 className="text-4xl font-black text-blue-400">1 / 14</h3>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                  <p className="text-zinc-400">Líder da competição</p>
                  <h3 className="text-2xl font-black text-yellow-400">Time A</h3>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-5 mb-8">
                <Link href="/campeonato" className="bg-blue-700 p-6 rounded-2xl font-black">
                  🏆 Ver Campeonato
                </Link>

                <Link href="/resultados" className="bg-purple-700 p-6 rounded-2xl font-black">
                  🎮 Definir Resultado
                </Link>

                <Link
                  href={`/jogo-online/${Math.random().toString(36).substring(2, 8)}`}
                  className="bg-green-700 p-6 rounded-2xl font-black"
                >
                  🌐 Jogar Online com Amigo
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                  <h3 className="font-black mb-4">Próximos Jogos</h3>
                  <p className="text-zinc-400">Os jogos aparecerão aqui.</p>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                  <h3 className="font-black mb-4">Classificação</h3>
                  <p className="text-zinc-400">A tabela aparecerá aqui.</p>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                  <h3 className="font-black mb-4">Artilheiros</h3>
                  <p className="text-zinc-400">Os artilheiros aparecerão aqui.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}