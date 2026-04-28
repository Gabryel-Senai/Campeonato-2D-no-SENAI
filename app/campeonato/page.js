"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

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
          <Link
            href="/jogo"
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl font-semibold"
          >
            Jogar 2D
          </Link>
          <Link
            href="/copa"
            className="bg-yellow-600 hover:bg-yellow-700 px-5 py-3 rounded-xl font-semibold"
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
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3 flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: time.cor }}
                        />
                        {time.nome}
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
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex justify-between"
                >
                  <span>{partida.casa?.nome}</span>
                  <strong>
                    {partida.gols_casa} x {partida.gols_fora}
                  </strong>
                  <span>{partida.fora?.nome}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}