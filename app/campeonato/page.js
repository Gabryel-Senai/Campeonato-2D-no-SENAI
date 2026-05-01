"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

function escudoTime(nome) {
  const escudos = {
    Corinthians: "/escudos/corinthians.png",
    Palmeiras: "/escudos/palmeiras.png",
    "São Paulo": "/escudos/sao-paulo.png",
    Santos: "/escudos/santos.png",
    Flamengo: "/escudos/flamengo.png",
    Vasco: "/escudos/vasco.png",
    Grêmio: "/escudos/gremio.png",
    Internacional: "/escudos/internacional.png",
  };

  return escudos[nome] || "/escudos/default.png";
}

export default function CampeonatoPage() {
  const [times, setTimes] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [loading, setLoading] = useState(true);

  async function carregarDados() {
    setLoading(true);

    const { data: timesData, error: timesError } = await supabase
      .from("times")
      .select("*")
      .order("pontos", { ascending: false })
      .order("vitorias", { ascending: false })
      .order("gols_pro", { ascending: false });

    const { data: partidasData } = await supabase
      .from("partidas")
      .select(`
        *,
        casa:time_casa(nome),
        fora:time_fora(nome)
      `)
      .order("created_at", { ascending: false });

    if (!timesError) setTimes(timesData || []);
    setPartidas(partidasData || []);
    setLoading(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Tabela do Campeonato</h1>
            <p className="text-zinc-400">8 times disputando o título.</p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/jogo"
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl font-semibold"
            >
              Jogar 2D
            </Link>

            <Link
              href="/copa"
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-xl font-semibold"
            >
              Copa Mata-Mata
            </Link>

            <Link
              href="/simulador"
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-semibold"
            >
              Simular jogo
            </Link>
            
          </div>
        </div>

        {loading ? (
          <p>Carregando...</p>
        ) : (
          <>
            <div className="overflow-x-auto bg-zinc-900 rounded-2xl border border-zinc-800 mb-8">
              <table className="w-full text-left">
                <thead className="bg-zinc-800">
                  <tr>
                    <th className="p-3">Pos</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Pts</th>
                    <th className="p-3">V</th>
                    <th className="p-3">E</th>
                    <th className="p-3">D</th>
                    <th className="p-3">GP</th>
                    <th className="p-3">GC</th>
                    <th className="p-3">SG</th>
                  </tr>
                </thead>

                <tbody>
                  {times.map((time, index) => (
                    <tr key={time.id} className="border-t border-zinc-800">
                      <td className="p-3 font-semibold">{index + 1}</td>

                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: time.cor }}
                          />

                          <img
                            src={escudoTime(time.nome)}
                            alt={time.nome}
                            className="w-7 h-7 object-contain"
                          />

                          <span className="font-medium">{time.nome}</span>
                        </div>
                      </td>

                      <td className="p-3 font-bold">{time.pontos}</td>
                      <td className="p-3">{time.vitorias}</td>
                      <td className="p-3">{time.empates}</td>
                      <td className="p-3">{time.derrotas}</td>
                      <td className="p-3">{time.gols_pro}</td>
                      <td className="p-3">{time.gols_contra}</td>
                      <td className="p-3">{time.gols_pro - time.gols_contra}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold mb-4">Últimos Resultados</h2>

            <div className="grid gap-3">
              {partidas.map((partida) => (
                <div
                  key={partida.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 grid grid-cols-[1fr_100px_1fr] items-center"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={escudoTime(partida.casa?.nome)}
                      alt={partida.casa?.nome || "Time casa"}
                      className="w-7 h-7 object-contain"
                    />
                    <span>{partida.casa?.nome}</span>
                  </div>

                  <strong className="text-center">
                    {partida.gols_casa} x {partida.gols_fora}
                  </strong>

                  <div className="flex items-center justify-end gap-3">
                    <span>{partida.fora?.nome}</span>
                    <img
                      src={escudoTime(partida.fora?.nome)}
                      alt={partida.fora?.nome || "Time fora"}
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                </div>
              ))}

              {partidas.length === 0 && (
                <p className="text-zinc-400">
                  Nenhuma partida registrada ainda.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}