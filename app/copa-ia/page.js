"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function CopaIAPage() {
  const [times, setTimes] = useState([]);
  const [quartas, setQuartas] = useState([]);
  const [semifinal, setSemifinal] = useState([]);
  const [final, setFinal] = useState([]);
  const [campeao, setCampeao] = useState(null);
  const [simulando, setSimulando] = useState(false);
  const [copaFinalizada, setCopaFinalizada] = useState(false);

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

  async function carregarTimes() {
    const { data } = await supabase.from("times").select("*").order("nome");
    setTimes(data || []);
  }

  useEffect(() => {
    carregarTimes();
  }, []);

  function embaralhar(lista) {
    return [...lista].sort(() => Math.random() - 0.5);
  }

  function gerarGols() {
    return Math.floor(Math.random() * 5);
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

  async function simularCopa() {
    if (simulando || copaFinalizada) return;

    if (times.length < 8) {
      alert("Você precisa ter 8 times cadastrados.");
      return;
    }

    setSimulando(true);
    setCopaFinalizada(false);
    setCampeao(null);
    setQuartas([]);
    setSemifinal([]);
    setFinal([]);

    const selecionados = embaralhar(times).slice(0, 8);

    const jogosQuartas = criarConfrontos(selecionados);
    const quartasSimuladas = jogosQuartas.map(simularJogo);
    setQuartas(quartasSimuladas);

    await new Promise((resolve) => setTimeout(resolve, 900));

    const classificadosSemi = quartasSimuladas.map((jogo) => jogo.vencedor);
    const jogosSemi = criarConfrontos(classificadosSemi);
    const semiSimulada = jogosSemi.map(simularJogo);
    setSemifinal(semiSimulada);

    await new Promise((resolve) => setTimeout(resolve, 900));

    const classificadosFinal = semiSimulada.map((jogo) => jogo.vencedor);
    const jogosFinal = criarConfrontos(classificadosFinal);
    const finalSimulada = jogosFinal.map(simularJogo);
    setFinal(finalSimulada);

    await new Promise((resolve) => setTimeout(resolve, 900));

    setCampeao(finalSimulada[0].vencedor);
    setCopaFinalizada(true);
    setSimulando(false);
  }

  function novaCopa() {
    setQuartas([]);
    setSemifinal([]);
    setFinal([]);
    setCampeao(null);
    setCopaFinalizada(false);
    setSimulando(false);
  }

  function JogoCard({ jogo }) {
    if (!jogo) {
      return (
        <div className="bg-zinc-800 rounded-2xl p-4 text-zinc-500 text-center">
          Aguardando
        </div>
      );
    }

    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={escudoTime(jogo.timeA.nome)}
              alt={jogo.timeA.nome}
              className="w-7 h-7 object-contain"
            />
            <span className="truncate">{jogo.timeA.nome}</span>
          </div>

          <strong className="text-lg">
            {jogo.golsA === null ? "x" : `${jogo.golsA} x ${jogo.golsB}`}
          </strong>

          <div className="flex items-center gap-2 min-w-0 justify-end">
            <span className="truncate">{jogo.timeB.nome}</span>
            <img
              src={escudoTime(jogo.timeB.nome)}
              alt={jogo.timeB.nome}
              className="w-7 h-7 object-contain"
            />
          </div>
        </div>

        {jogo.vencedor && (
          <p className="text-green-400 text-center mt-3 text-sm">
            Classificado: {jogo.vencedor.nome}
          </p>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Copa IA Automática</h1>
            <p className="text-zinc-400">
              Todos os jogos são simulados automaticamente pela IA.
            </p>
          </div>

          <Link href="/" className="text-blue-400 hover:underline">
            Voltar
          </Link>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
          {!copaFinalizada ? (
            <button
              onClick={simularCopa}
              disabled={simulando}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg"
            >
              {simulando ? "Simulando Copa..." : "Simular Copa IA"}
            </button>
          ) : (
            <button
              onClick={novaCopa}
              className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-xl font-bold text-lg"
            >
              Nova Copa IA
            </button>
          )}
        </div>

        {campeao && (
          <div className="bg-yellow-500 text-zinc-950 rounded-3xl p-6 text-center mb-6">
            <div className="text-5xl mb-3">🏆</div>
            <h2 className="text-2xl font-bold">Campeão da Copa IA</h2>
            <div className="flex justify-center items-center gap-3 mt-3 font-bold text-xl">
              <img
                src={escudoTime(campeao.nome)}
                alt={campeao.nome}
                className="w-12 h-12 object-contain"
              />
              {campeao.nome}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <section>
            <h2 className="text-xl font-bold mb-4">Quartas de Final</h2>
            <div className="grid gap-4">
              {quartas.length === 0
                ? [1, 2, 3, 4].map((item) => <JogoCard key={item} />)
                : quartas.map((jogo, index) => (
                    <JogoCard key={index} jogo={jogo} />
                  ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Semifinal</h2>
            <div className="grid gap-4">
              {semifinal.length === 0
                ? [1, 2].map((item) => <JogoCard key={item} />)
                : semifinal.map((jogo, index) => (
                    <JogoCard key={index} jogo={jogo} />
                  ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Final</h2>
            <div className="grid gap-4">
              {final.length === 0 ? (
                <JogoCard />
              ) : (
                final.map((jogo, index) => <JogoCard key={index} jogo={jogo} />)
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}