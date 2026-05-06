import Link from "next/link";

export default function Home() {
  const campeonatoCriado = false;

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <section className="relative min-h-screen overflow-hidden">
        
        {/* BACKGROUND */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/stadium.jpg')",
          }}
        />

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-black/60" />

        {/* LIGHTS */}
        <img
          src="/lights.png"
          alt=""
          className="lights-layer"
        />

        {/* CONTENT */}
        <div className="relative z-10">

          {/* HEADER */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-5 md:px-10 py-5 border-b border-white/10 bg-black/30">
            
            <div className="flex items-center gap-3">
              <div className="text-4xl md:text-5xl">
                🏆
              </div>

              <div>
                <h1 className="text-xl md:text-2xl font-black">
                  LIGA DOS CAMPEÕES
                </h1>

                <p className="text-blue-400 font-bold">
                  8 TIMES
                </p>
              </div>
            </div>

            <nav className="flex overflow-x-auto gap-5 md:gap-10 text-sm md:text-base font-bold pb-2 md:pb-0">
              <Link href="/">🏠 Início</Link>
              <Link href="/tabela">▦ Tabela</Link>
              <Link href="/jogos">🎮 Jogos</Link>
              <Link href="/resultados">📊 Resultados</Link>
              <Link href="/amigos">👥 Amigos</Link>
              <Link href="/sobre">ⓘ Sobre</Link>
            </nav>
          </header>

          {/* MAIN */}
          <div className="w-full max-w-[1600px] mx-auto px-6 xl:px-16 py-10">

            {/* TOP */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-5 md:gap-8 items-start">

              {/* LEFT CARD */}
              <div className="rounded-2xl border border-blue-400/30 bg-black/50 p-5 md:p-6 shadow-2xl backdrop-blur-md">
                
                <p className="text-sm text-zinc-300">
                  TEMPORADA ATUAL
                </p>

                <h2 className="text-lg md:text-xl font-bold mt-2">
                  {campeonatoCriado
                    ? "Temporada 1 - 2024"
                    : "Aguardando"}
                </h2>

                <div className="h-px bg-white/10 my-5" />

                <p className="text-sm text-zinc-300">
                  RODADA ATUAL
                </p>

                <h2 className="text-4xl md:text-5xl font-black text-blue-400 mt-2">
                  {campeonatoCriado ? "4" : "0"}
                  <span className="text-xl md:text-2xl text-white">
                    {" "}
                    / 14
                  </span>
                </h2>

                <div className="h-px bg-white/10 my-5" />

                <p className="text-sm text-zinc-300">
                  FASE
                </p>

                <h2 className="text-cyan-400 font-bold mt-2">
                  {campeonatoCriado
                    ? "Pontos Corridos"
                    : "Não iniciado"}
                </h2>
              </div>

              {/* CENTER */}
              <div className="text-center">
                
                <div className="text-5xl md:text-6xl mb-2">
                  🏆
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-none">
                  LIGA DOS
                </h1>

                <h1 className="text-5xl sm:text-6xl md:text-8xl font-black leading-none text-blue-500 drop-shadow-[0_0_25px_rgba(59,130,246,0.9)]">
                  CAMPEÕES
                </h1>

                <p className="mt-4 text-xl md:text-3xl font-black">
                  ⭐ 8 TIMES ⭐
                </p>

                <p className="mt-4 text-sm md:text-lg text-zinc-300 max-w-3xl mx-auto">
                  Defina manualmente os resultados dos jogos com seus amigos
                  e acompanhe a disputa pelo título!
                </p>
              </div>

              {/* RIGHT CARD */}
              <div className="rounded-2xl border border-yellow-400/30 bg-black/50 p-5 md:p-6 shadow-2xl backdrop-blur-md">
                
                <p className="text-sm text-zinc-300">
                  LÍDER DA COMPETIÇÃO
                </p>

                {campeonatoCriado ? (
                  <>
                    <h2 className="text-3xl font-black text-yellow-400 mt-3">
                      Time A
                    </h2>

                    <div className="mt-5">
                      <p className="text-5xl font-black">
                        9
                      </p>

                      <p className="text-zinc-300">
                        PONTOS
                      </p>

                      <p className="mt-2 text-zinc-300">
                        3V • 0E • 1D
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="mt-6 text-zinc-400">
                    Crie um campeonato para aparecer o líder.
                  </div>
                )}

                <Link
                  href="/tabela"
                  className="block mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-4 font-bold hover:bg-white/10 transition"
                >
                  Ver Tabela Completa →
                </Link>
              </div>
            </div>

            {/* MAIN BUTTONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mt-8">

              <Link
                href="/campeonato"
                className="card-main border-blue-500"
              >
                <span>🏆</span>
                <strong>Ver Campeonato</strong>
                <b>›</b>
              </Link>

              <Link
                href="/resultados"
                className="card-main border-purple-500"
              >
                <span>🎮</span>
                <strong>
                  Crie seu Campeonato de FIFA com Amigos
                </strong>
                <b>›</b>
              </Link>

              <Link
                href="/online"
                className="card-main border-green-500"
              >
                <span>🌐</span>
                <strong>Jogar Online com Amigo</strong>
                <b>›</b>
              </Link>
            </div>

            {/* SMALL BUTTONS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4 mt-5">
              
              {[
                ["🏆", "Copa Mata-Mata"],
                ["🧠", "Copa Mata-Mata IA"],
                ["⚽", "Simular Partida"],
                ["🏆", "Ver Tabela"],
                ["📅", "Ver Jogos"],
                ["📊", "Ver Estatísticas"],
                ["👥", "Meus Amigos"],
                ["💬", "Conversar Grupo"],
              ].map(([icon, text]) => (
                <button
                  key={text}
                  className="small-card"
                >
                  <div className="text-3xl md:text-4xl">
                    {icon}
                  </div>

                  <p>{text}</p>
                </button>
              ))}
            </div>

            {/* INFO CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">

              {/* JOGOS */}
              <div className="info-card">
                <div className="flex justify-between items-center mb-4">
                  <h3>📅 PRÓXIMOS JOGOS</h3>
                  <span className="text-blue-400 text-sm">
                    Ver todos
                  </span>
                </div>

                {campeonatoCriado ? (
                  <div className="space-y-3">
                    <p>Time A x Time B</p>
                    <p>Time C x Time D</p>
                  </div>
                ) : (
                  <div className="empty-list">
                    Nenhum jogo criado ainda.
                  </div>
                )}
              </div>

              {/* CLASSIFICAÇÃO */}
              <div className="info-card">
                <div className="flex justify-between items-center mb-4">
                  <h3>📊 CLASSIFICAÇÃO</h3>

                  <span className="text-blue-400 text-sm">
                    Ver tabela completa
                  </span>
                </div>

                {campeonatoCriado ? (
                  <div className="space-y-3">
                    <p>1. Time A - 9 pts</p>
                    <p>2. Time B - 7 pts</p>
                    <p>3. Time C - 6 pts</p>
                  </div>
                ) : (
                  <div className="empty-list">
                    Nenhum time cadastrado ainda.
                  </div>
                )}
              </div>

              {/* ARTILHEIROS */}
              <div className="info-card">
                <div className="flex justify-between items-center mb-4">
                  <h3>⭐ ARTILHEIROS</h3>

                  <span className="text-blue-400 text-sm">
                    Ver todos
                  </span>
                </div>

                {campeonatoCriado ? (
                  <div className="space-y-3">
                    <p>Jogador A - 5 gols</p>
                    <p>Jogador B - 4 gols</p>
                    <p>Jogador C - 3 gols</p>
                  </div>
                ) : (
                  <div className="empty-list">
                    Nenhum artilheiro ainda.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}