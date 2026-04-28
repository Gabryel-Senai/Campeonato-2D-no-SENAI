"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function CopaPage() {
  const [times, setTimes] = useState([]);
  const [meuTime, setMeuTime] = useState("");
  const [fase, setFase] = useState("Escolha seu time");
  const [participantes, setParticipantes] = useState([]);
  const [confrontos, setConfrontos] = useState([]);
  const [campeao, setCampeao] = useState(null);
  const [eliminado, setEliminado] = useState(false);

  async function carregarTimes() {
    const { data } = await supabase.from("times").select("*").order("nome");
    setTimes(data || []);

    if (data?.length > 0) {
      setMeuTime(data[0].id);
    }
  }

  useEffect(() => {
    carregarTimes();
  }, []);

  function embaralhar(lista) {
    return [...lista].sort(() => Math.random() - 0.5);
  }

  function criarConfrontos(listaTimes) {
    const jogos = [];

    for (let i = 0; i < listaTimes.length; i += 2) {
      jogos.push({
        timeA: listaTimes[i],
        timeB: listaTimes[i + 1],
        golsA: null,
        golsB: null,
        vencedor: null,
      });
    }

    return jogos;
  }

  function nomeFase(qtdTimes) {
    if (qtdTimes === 8) return "Quartas de Final";
    if (qtdTimes === 4) return "Semifinal";
    if (qtdTimes === 2) return "Final";
    return "Campeão";
  }

  function iniciarCopa() {
    const lista = embaralhar(times);

    setParticipantes(lista);
    setConfrontos(criarConfrontos(lista));
    setFase("Quartas de Final");
    setCampeao(null);
    setEliminado(false);
  }

  function gerarGols() {
    return Math.floor(Math.random() * 5);
  }

  function simularJogo(jogo) {
    let golsA = gerarGols();
    let golsB = gerarGols();

    while (golsA === golsB) {
      golsA = gerarGols();
      golsB = gerarGols();
    }

    const vencedor = golsA > golsB ? jogo.timeA : jogo.timeB;

    return {
      ...jogo,
      golsA,
      golsB,
      vencedor,
    };
  }

  function jogarRodada() {
    const jogosSimulados = confrontos.map(simularJogo);
    const classificados = jogosSimulados.map((jogo) => jogo.vencedor);

    const meuTimeObjeto = times.find((t) => String(t.id) === String(meuTime));
    const usuarioContinua = classificados.some(
      (time) => String(time.id) === String(meuTimeObjeto.id)
    );

    setConfrontos(jogosSimulados);

    if (!usuarioContinua) {
      setEliminado(true);
    }

    setTimeout(() => {
      if (classificados.length === 1) {
        setCampeao(classificados[0]);
        setFase("Campeão");
        return;
      }

      setParticipantes(classificados);
      setConfrontos(criarConfrontos(classificados));
      setFase(nomeFase(classificados.length));
    }, 900);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Copa Mata-Mata</h1>
            <p className="text-zinc-400">
              Escolha um time e tente ser campeão.
            </p>
          </div>

          <Link href="/" className="text-blue-400 hover:underline">
            Voltar
          </Link>
        </div>

        {fase === "Escolha seu time" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-5">Escolha seu time</h2>

            <select
              value={meuTime}
              onChange={(e) => setMeuTime(e.target.value)}
              className="w-full bg-zinc-800 p-4 rounded-xl mb-5"
            >
              {times.map((time) => (
                <option key={time.id} value={time.id}>
                  {time.nome}
                </option>
              ))}
            </select>

            <button
              onClick={iniciarCopa}
              className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-xl font-bold text-lg"
            >
              Iniciar Copa
            </button>
          </div>
        )}

        {fase !== "Escolha seu time" && (
          <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
              <h2 className="text-2xl font-bold">{fase}</h2>

              {eliminado && !campeao && (
                <p className="text-red-400 mt-2">
                  Seu time foi eliminado. A copa continua automaticamente.
                </p>
              )}

              {campeao && (
                <p className="text-yellow-400 mt-2 text-xl font-bold">
                  Campeão: {campeao.nome}
                </p>
              )}
            </div>

            <div className="grid gap-4 mb-6">
              {confrontos.map((jogo, index) => (
                <div
                  key={index}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                >
                  <div className="flex justify-between items-center">
                    <span>{jogo.timeA.nome}</span>

                    <strong className="text-xl">
                      {jogo.golsA === null
                        ? "x"
                        : `${jogo.golsA} x ${jogo.golsB}`}
                    </strong>

                    <span>{jogo.timeB.nome}</span>
                  </div>

                  {jogo.vencedor && (
                    <p className="text-green-400 text-center mt-3">
                      Classificado: {jogo.vencedor.nome}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {!campeao && (
              <button
                onClick={jogarRodada}
                className="w-full bg-green-600 hover:bg-green-700 py-4 rounded-xl font-bold text-lg"
              >
                Jogar Rodada
              </button>
            )}

            {campeao && (
              <button
                onClick={() => {
                  setFase("Escolha seu time");
                  setCampeao(null);
                  setConfrontos([]);
                  setEliminado(false);
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-xl font-bold text-lg"
              >
                Nova Copa
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}