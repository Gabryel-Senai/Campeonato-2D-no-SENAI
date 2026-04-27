"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function SimuladorPage() {
  const [times, setTimes] = useState([]);
  const [timeCasa, setTimeCasa] = useState("");
  const [timeFora, setTimeFora] = useState("");
  const [resultado, setResultado] = useState(null);
  const [salvando, setSalvando] = useState(false);

  async function carregarTimes() {
    const { data } = await supabase
      .from("times")
      .select("*")
      .order("id", { ascending: true });

    setTimes(data || []);

    if (data?.length >= 2) {
      setTimeCasa(data[0].id);
      setTimeFora(data[1].id);
    }
  }

  useEffect(() => {
    carregarTimes();
  }, []);

  function gerarGols() {
    return Math.floor(Math.random() * 6);
  }

  async function atualizarTime(time, golsPro, golsContra) {
    let pontos = time.pontos;
    let vitorias = time.vitorias;
    let empates = time.empates;
    let derrotas = time.derrotas;

    if (golsPro > golsContra) {
      pontos += 3;
      vitorias += 1;
    } else if (golsPro === golsContra) {
      pontos += 1;
      empates += 1;
    } else {
      derrotas += 1;
    }

    await supabase
      .from("times")
      .update({
        pontos,
        vitorias,
        empates,
        derrotas,
        gols_pro: time.gols_pro + golsPro,
        gols_contra: time.gols_contra + golsContra,
      })
      .eq("id", time.id);
  }

  async function simularPartida() {
    if (timeCasa === timeFora) {
      alert("Escolha times diferentes.");
      return;
    }

    setSalvando(true);

    const casa = times.find((t) => String(t.id) === String(timeCasa));
    const fora = times.find((t) => String(t.id) === String(timeFora));

    const golsCasa = gerarGols();
    const golsFora = gerarGols();

    await supabase.from("partidas").insert({
      time_casa: casa.id,
      time_fora: fora.id,
      gols_casa: golsCasa,
      gols_fora: golsFora,
      status: "finalizada",
    });

    await atualizarTime(casa, golsCasa, golsFora);
    await atualizarTime(fora, golsFora, golsCasa);

    setResultado({
      casa: casa.nome,
      fora: fora.nome,
      golsCasa,
      golsFora,
    });

    await carregarTimes();
    setSalvando(false);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-3xl font-bold mb-2">Simulador IA vs IA</h1>
        <p className="text-zinc-400 mb-8">
          Escolha dois times e deixe a máquina gerar o resultado.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block mb-2">Time da casa</label>
            <select
              value={timeCasa}
              onChange={(e) => setTimeCasa(e.target.value)}
              className="w-full bg-zinc-800 p-3 rounded-xl"
            >
              {times.map((time) => (
                <option key={time.id} value={time.id}>
                  {time.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">Time visitante</label>
            <select
              value={timeFora}
              onChange={(e) => setTimeFora(e.target.value)}
              className="w-full bg-zinc-800 p-3 rounded-xl"
            >
              {times.map((time) => (
                <option key={time.id} value={time.id}>
                  {time.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={simularPartida}
          disabled={salvando}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 py-4 rounded-xl font-bold text-lg"
        >
          {salvando ? "Salvando resultado..." : "Simular Partida"}
        </button>

        {resultado && (
          <div className="mt-8 bg-zinc-800 rounded-2xl p-6 text-center">
            <p className="text-zinc-400 mb-2">Resultado final</p>
            <h2 className="text-3xl font-bold">
              {resultado.casa} {resultado.golsCasa} x {resultado.golsFora}{" "}
              {resultado.fora}
            </h2>
          </div>
        )}

        <Link
          href="/campeonato"
          className="block text-center mt-6 text-blue-400 hover:underline"
        >
          Ver tabela do campeonato
        </Link>
      </div>
    </main>
  );
}