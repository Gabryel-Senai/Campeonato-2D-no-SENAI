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

  const [chaveamento, setChaveamento] = useState({
    quartas: [],
    semifinal: [],
    final: [],
    campeao: null,
  });

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

  useEffect(() => {
    const copaSalva = localStorage.getItem("copaAtual");

    if (copaSalva) {
      const data = JSON.parse(copaSalva);

      setMeuTime(data.meuTime);
      setFase(data.fase);
      setConfrontos(data.confrontos);
      setCampeao(data.campeao);
      setEliminado(data.eliminado);

      if (data.chaveamento) {
        setChaveamento(data.chaveamento);
      }
    }
  }, []);

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
        chaveamento,
      })
    );
  }, [meuTime, fase, confrontos, campeao, eliminado, chaveamento]);

  useEffect(() => {
    const resultadoSalvo = localStorage.getItem("resultadoCopa");

    if (!resultadoSalvo || times.length === 0 || confrontos.length === 0) return;

    const resultado = JSON.parse(resultadoSalvo);

    const novosConfrontos = confrontos.map((jogo) => {
      const jogoCerto =
        String(jogo.timeA.id) === String(resultado.timeA) &&
        String(jogo.timeB.id) === String(resultado.timeB);

      if (!jogoCerto) return jogo;

      const vencedorId =
        resultado.golsA > resultado.golsB ? resultado.timeA : resultado.timeB;

      const vencedor = times.find((t) => String(t.id) === String(vencedorId));

      return {
        ...jogo,
        golsA: resultado.golsA,
        golsB: resultado.golsB,
        vencedor,
      };
    });

    setConfrontos(novosConfrontos);

    if (fase === "Quartas de Final") {
      setChaveamento((prev) => ({ ...prev, quartas: novosConfrontos }));
    }

    if (fase === "Semifinal") {
      setChaveamento((prev) => ({ ...prev, semifinal: novosConfrontos }));
    }

    if (fase === "Final") {
      setChaveamento((prev) => ({ ...prev, final: novosConfrontos }));
    }

    localStorage.removeItem("resultadoCopa");
  }, [times, confrontos, fase]);

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
    const quartas = criarConfrontos(lista);

    setConfrontos(quartas);
    setFase("Quartas de Final");
    setCampeao(null);
    setEliminado(false);

    setChaveamento({
      quartas,
      semifinal: [],
      final: [],
      campeao: null,
    });

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

    if (fase === "Quartas de Final") {
      setChaveamento((prev) => ({ ...prev, quartas: jogosAtualizados }));
    }

    if (fase === "Semifinal") {
      setChaveamento((prev) => ({ ...prev, semifinal: jogosAtualizados }));
    }

    if (fase === "Final") {
      setChaveamento((prev) => ({ ...prev, final: jogosAtualizados }));
    }

    const todosFinalizados = jogosAtualizados.every((jogo) => jogo.vencedor);

    setConfrontos(jogosAtualizados);

    if (!todosFinalizados) return;

    const classificados = jogosAtualizados.map((jogo) => jogo.vencedor);

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

        setChaveamento((prev) => ({
          ...prev,
          campeao: classificados[0],
        }));

        return;
      }

      const novaFase = nomeFase(classificados.length);
      const novosJogos = criarConfrontos(classificados);

      setConfrontos(novosJogos);
      setFase(novaFase);

      if (novaFase === "Semifinal") {
        setChaveamento((prev) => ({
          ...prev,
          semifinal: novosJogos,
        }));
      }

      if (novaFase === "Final") {
        setChaveamento((prev) => ({
          ...prev,
          final: novosJogos,
        }));
      }
    }, 700);
  }

  function novaCopa() {
    localStorage.removeItem("copaAtual");
    localStorage.removeItem("resultadoCopa");

    setFase("Escolha seu time");
    setCampeao(null);
    setConfrontos([]);
    setEliminado(false);

    setChaveamento({
      quartas: [],
      semifinal: [],
      final: [],
      campeao: null,
    });
  }

  function CardTime({ time, lado = "esquerda" }) {
    if (!time) {
      return (
        <div className="bg-zinc-800/60 rounded-xl p-2 text-zinc-500 text-xs">
          Aguardando
        </div>
      );
    }

    return (
      <div
        className={`bg-zinc-800 rounded-xl p-2 flex items-center gap-2 ${
          lado === "direita" ? "justify-end" : ""
        }`}
      >
        {lado === "esquerda" && (
          <img
            src={escudoTime(time.nome)}
            alt={time.nome}
            className="w-5 h-5 object-contain"
          />
        )}

        <span className="text-xs truncate">{time.nome}</span>

        {lado === "direita" && (
          <img
            src={escudoTime(time.nome)}
            alt={time.nome}
            className="w-5 h-5 object-contain"
          />
        )}
      </div>
    );
  }

  function JogoChave({ jogo, lado = "esquerda" }) {
    return (
      <div className="space-y-2">
        <CardTime time={jogo?.timeA} lado={lado} />

        <div className="text-center text-xs text-zinc-400 font-bold">
          {jogo?.golsA === null || jogo?.golsA === undefined
            ? "x"
            : `${jogo.golsA} x ${jogo.golsB}`}
        </div>

        <CardTime time={jogo?.timeB} lado={lado} />

        {jogo?.vencedor && (
          <div className="text-center text-[11px] text-green-400">
            {jogo.vencedor.nome}
          </div>
        )}
      </div>
    );
  }

  function ChaveamentoVisual() {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
        <h2 className="text-xl font-bold mb-4 text-center">
          Chaveamento da Copa
        </h2>

        <div className="grid grid-cols-4 gap-4 items-center">
          <div className="space-y-4">
            <h3 className="text-center text-sm text-zinc-400">Quartas</h3>
            {chaveamento.quartas.map((jogo, index) => (
              <JogoChave key={index} jogo={jogo} />
            ))}
          </div>

          <div className="space-y-10">
            <h3 className="text-center text-sm text-zinc-400">Semi</h3>
            <JogoChave jogo={chaveamento.semifinal[0]} />
            <JogoChave jogo={chaveamento.semifinal[1]} />
          </div>

          <div className="space-y-10">
            <h3 className="text-center text-sm text-zinc-400">Final</h3>
            <JogoChave jogo={chaveamento.final[0]} />
          </div>

          <div className="text-center">
            <h3 className="text-sm text-zinc-400 mb-4">Campeão</h3>

            <div className="text-5xl mb-4">🏆</div>

            {chaveamento.campeao ? (
              <div className="bg-yellow-500 text-zinc-950 rounded-2xl p-3 font-bold">
                <img
                  src={escudoTime(chaveamento.campeao.nome)}
                  alt={chaveamento.campeao.nome}
                  className="w-10 h-10 object-contain mx-auto mb-2"
                />
                {chaveamento.campeao.nome}
              </div>
            ) : (
              <div className="bg-zinc-800 rounded-2xl p-3 text-zinc-400 text-sm">
                Aguardando
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold">Copa Mata-Mata</h1>

          <Link href="/" className="text-blue-400">
            Voltar
          </Link>
        </div>

        {fase === "Escolha seu time" && (
          <div className="bg-zinc-900 p-8 rounded-3xl max-w-3xl mx-auto">
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
              className="w-full bg-purple-600 py-4 rounded-xl font-bold"
            >
              Iniciar Copa
            </button>
          </div>
        )}

        {fase !== "Escolha seu time" && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_520px] gap-6">
            <section>
              <h2 className="text-2xl mb-4">{fase}</h2>

              {eliminado && !campeao && (
                <p className="text-red-400 mb-4">
                  Seu time foi eliminado. Agora os outros jogos serão simulados.
                </p>
              )}

              {campeao && (
                <p className="text-yellow-400 text-xl font-bold mb-4">
                  Campeão: {campeao.nome}
                </p>
              )}

              <div className="grid gap-4 mb-6">
                {confrontos.map((jogo, index) => {
                  const ehMeuTime =
                    String(jogo.timeA.id) === String(meuTime) ||
                    String(jogo.timeB.id) === String(meuTime);

                  return (
                    <div
                      key={index}
                      className="bg-zinc-900 p-5 rounded-2xl grid grid-cols-[1fr_80px_1fr_90px] items-center gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={escudoTime(jogo.timeA.nome)}
                          alt={jogo.timeA.nome}
                          className="w-8 h-8 object-contain shrink-0"
                        />
                        <span className="truncate">{jogo.timeA.nome}</span>
                      </div>

                      <strong className="text-center">
                        {jogo.golsA === null
                          ? "x"
                          : `${jogo.golsA} x ${jogo.golsB}`}
                      </strong>

                      <div className="flex items-center justify-end gap-3 min-w-0">
                        <span className="truncate">{jogo.timeB.nome}</span>
                        <img
                          src={escudoTime(jogo.timeB.nome)}
                          alt={jogo.timeB.nome}
                          className="w-8 h-8 object-contain shrink-0"
                        />
                      </div>

                      <div className="flex justify-end">
                        {ehMeuTime && jogo.golsA === null && !eliminado && (
                          <Link
                            href={`/jogo?modo=copa&timeA=${jogo.timeA.id}&timeB=${jogo.timeB.id}`}
                            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl font-semibold"
                          >
                            Jogar
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!campeao && (
                <button
                  onClick={jogarRodada}
                  className="w-full bg-green-600 py-4 rounded-xl font-bold"
                >
                  Avançar Rodada
                </button>
              )}

              <button
                onClick={novaCopa}
                className="w-full mt-3 bg-zinc-800 py-4 rounded-xl"
              >
                Nova Copa
              </button>
            </section>

            <aside>
              <ChaveamentoVisual />
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}