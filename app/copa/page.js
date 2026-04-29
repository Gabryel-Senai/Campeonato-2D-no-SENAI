"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function CopaPage() {
  const [times, setTimes] = useState([]);
  const [meuTime, setMeuTime] = useState("");
  const [fase, setFase] = useState("Escolha seu time");
  const [confrontos, setConfrontos] = useState([]);
  const [campeao, setCampeao] = useState(null);
  const [eliminado, setEliminado] = useState(false);

  // 🔥 ESCUDOS
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

    if (data?.length > 0) {
      setMeuTime(data[0].id);
    }
  }

  useEffect(() => {
    carregarTimes();
  }, []);

  // 🔥 RECUPERA COPA
  useEffect(() => {
    const copaSalva = localStorage.getItem("copaAtual");

    if (copaSalva) {
      const data = JSON.parse(copaSalva);

      setMeuTime(data.meuTime);
      setFase(data.fase);
      setConfrontos(data.confrontos);
      setCampeao(data.campeao);
      setEliminado(data.eliminado);
    }
  }, []);

  // 🔥 SALVA COPA
  useEffect(() => {
    if (fase === "Escolha seu time") return;

    localStorage.setItem(
      "copaAtual",
      JSON.stringify({
        meuTime,
        fase,
        confrontos,
        campeao,
        eliminado,
      })
    );
  }, [meuTime, fase, confrontos, campeao, eliminado]);

  // 🔥 RECEBE RESULTADO DO JOGO
  useEffect(() => {
    const resultadoSalvo = localStorage.getItem("resultadoCopa");

    if (!resultadoSalvo || times.length === 0 || confrontos.length === 0)
      return;

    const resultado = JSON.parse(resultadoSalvo);

    const novosConfrontos = confrontos.map((jogo) => {
      const jogoCerto =
        String(jogo.timeA.id) === String(resultado.timeA) &&
        String(jogo.timeB.id) === String(resultado.timeB);

      if (!jogoCerto) return jogo;

      const vencedorId =
        resultado.golsA > resultado.golsB
          ? resultado.timeA
          : resultado.timeB;

      const vencedor = times.find(
        (t) => String(t.id) === String(vencedorId)
      );

      return {
        ...jogo,
        golsA: resultado.golsA,
        golsB: resultado.golsB,
        vencedor,
      };
    });

    setConfrontos(novosConfrontos);
    localStorage.removeItem("resultadoCopa");
  }, [times, confrontos]);

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
    if (times.length < 8) {
      alert("Você precisa ter 8 times cadastrados.");
      return;
    }

    const lista = embaralhar(times).slice(0, 8);

    setConfrontos(criarConfrontos(lista));
    setFase("Quartas de Final");
    setCampeao(null);
    setEliminado(false);

    localStorage.removeItem("resultadoCopa");
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
    const jogosAtualizados = confrontos.map((jogo) => {
      const ehMeuTime =
        String(jogo.timeA.id) === String(meuTime) ||
        String(jogo.timeB.id) === String(meuTime);

      if (jogo.vencedor) return jogo;

      if (ehMeuTime && !eliminado) {
        alert("Jogue sua partida no modo 2D.");
        return jogo;
      }

      return simularJogo(jogo);
    });

    const todosFinalizados = jogosAtualizados.every(
      (jogo) => jogo.vencedor
    );

    setConfrontos(jogosAtualizados);

    if (!todosFinalizados) return;

    const classificados = jogosAtualizados.map(
      (jogo) => jogo.vencedor
    );

    const usuarioContinua = classificados.some(
      (time) => String(time.id) === String(meuTime)
    );

    if (!usuarioContinua) {
      setEliminado(true);
    }

    setTimeout(() => {
      if (classificados.length === 1) {
        setCampeao(classificados[0]);
        setFase("Campeão");
        return;
      }

      setConfrontos(criarConfrontos(classificados));
      setFase(nomeFase(classificados.length));
    }, 700);
  }

  function novaCopa() {
    localStorage.removeItem("copaAtual");
    localStorage.removeItem("resultadoCopa");

    setFase("Escolha seu time");
    setCampeao(null);
    setConfrontos([]);
    setEliminado(false);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold">Copa Mata-Mata</h1>
          <Link href="/" className="text-blue-400">
            Voltar
          </Link>
        </div>

        {fase === "Escolha seu time" && (
          <div className="bg-zinc-900 p-8 rounded-3xl">
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
              className="w-full bg-purple-600 py-4 rounded-xl font-bold"
            >
              Iniciar Copa
            </button>
          </div>
        )}

        {fase !== "Escolha seu time" && (
          <>
            <h2 className="text-2xl mb-4">{fase}</h2>

            <div className="grid gap-4 mb-6">
              {confrontos.map((jogo, index) => {
                const ehMeuTime =
                  String(jogo.timeA.id) === String(meuTime) ||
                  String(jogo.timeB.id) === String(meuTime);

                return (
                  <div
                    key={index}
                    className="bg-zinc-900 p-5 rounded-2xl flex justify-between items-center"
                  >
                    {/* TIME A */}
                    <div className="flex items-center gap-3">
                      <img
                        src={escudoTime(jogo.timeA.nome)}
                        className="w-8 h-8"
                      />
                      {jogo.timeA.nome}
                    </div>

                    <strong>
                      {jogo.golsA === null
                        ? "x"
                        : `${jogo.golsA} x ${jogo.golsB}`}
                    </strong>

                    {/* TIME B */}
                    <div className="flex items-center gap-3">
                      {jogo.timeB.nome}
                      <img
                        src={escudoTime(jogo.timeB.nome)}
                        className="w-8 h-8"
                      />
                    </div>

                    {ehMeuTime && jogo.golsA === null && !eliminado && (
                      <Link
                        href={`/jogo?modo=copa&timeA=${jogo.timeA.id}&timeB=${jogo.timeB.id}`}
                        className="bg-purple-600 px-4 py-2 rounded-xl"
                      >
                        Jogar
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={jogarRodada}
              className="w-full bg-green-600 py-4 rounded-xl font-bold"
            >
              Avançar Rodada
            </button>

            <button
              onClick={novaCopa}
              className="w-full mt-3 bg-zinc-800 py-4 rounded-xl"
            >
              Nova Copa
            </button>
          </>
        )}
      </div>
    </main>
  );
}