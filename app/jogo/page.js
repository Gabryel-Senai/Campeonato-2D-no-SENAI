"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const WIDTH = 800;
const HEIGHT = 450;
const GOAL_TOP = 175;
const GOAL_BOTTOM = 275;
const GOAL_CENTER_Y = (GOAL_TOP + GOAL_BOTTOM) / 2;

function JogoContent() {
  const searchParams = useSearchParams();

  const modo = searchParams.get("modo");
  const timeAParam = searchParams.get("timeA");
  const timeBParam = searchParams.get("timeB");

  const canvasRef = useRef(null);
  const keys = useRef({});
  const animationRef = useRef(null);
  const lastAction = useRef(0);

  const [times, setTimes] = useState([]);
  const [timeCasa, setTimeCasa] = useState("");
  const [timeFora, setTimeFora] = useState("");
  const [jogoIniciado, setJogoIniciado] = useState(false);
  const [placar, setPlacar] = useState({ casa: 0, fora: 0 });
  const [tempo, setTempo] = useState(90);
  const [fim, setFim] = useState(false);
  const [controlado, setControlado] = useState(0);

  const game = useRef({
    ball: {
      x: 400,
      y: 225,
      r: 7,
      vx: 0,
      vy: 0,
      ownerTeam: null,
      owner: null,
    },
    home: [],
    away: [],
  });

  const nomeCasa =
    times.find((t) => String(t.id) === String(timeCasa))?.nome || "Seu Time";

  const nomeFora =
    times.find((t) => String(t.id) === String(timeFora))?.nome || "IA";

  async function carregarTimes() {
    const { data } = await supabase.from("times").select("*").order("nome");

    setTimes(data || []);

    if (modo === "copa" && timeAParam && timeBParam) {
      setTimeCasa(timeAParam);
      setTimeFora(timeBParam);

      setTimeout(() => {
        iniciarJogo();
      }, 300);

      return;
    }

    if (data?.length >= 2) {
      setTimeCasa(data[0].id);
      setTimeFora(data[1].id);
    }
  }

  useEffect(() => {
    carregarTimes();
  }, []);

  function criarJogadores() {
    game.current.home = [
      { nome: "Goleiro", x: 90, y: 225, baseX: 90, baseY: 225, r: 12, speed: 3.2 },
      { nome: "Zagueiro", x: 210, y: 120, baseX: 210, baseY: 120, r: 12, speed: 3.3 },
      { nome: "Lateral", x: 210, y: 330, baseX: 210, baseY: 330, r: 12, speed: 3.3 },
      { nome: "Meia", x: 360, y: 170, baseX: 360, baseY: 170, r: 12, speed: 3.5 },
      { nome: "Atacante", x: 430, y: 280, baseX: 430, baseY: 280, r: 12, speed: 3.8 },
    ];

    game.current.away = [
      { nome: "Goleiro IA", x: 710, y: 225, baseX: 710, baseY: 225, r: 12, speed: 2.0 },
      { nome: "Zagueiro IA", x: 590, y: 120, baseX: 590, baseY: 120, r: 12, speed: 2.0 },
      { nome: "Lateral IA", x: 590, y: 330, baseX: 590, baseY: 330, r: 12, speed: 2.0 },
      { nome: "Meia IA", x: 440, y: 170, baseX: 440, baseY: 170, r: 12, speed: 2.2 },
      { nome: "Atacante IA", x: 390, y: 280, baseX: 390, baseY: 280, r: 12, speed: 2.4 },
    ];
  }

  function resetarCampo() {
    criarJogadores();

    game.current.ball = {
      x: 400,
      y: 225,
      r: 7,
      vx: 0,
      vy: 0,
      ownerTeam: null,
      owner: null,
    };
  }

  function iniciarJogo() {
    if (timeCasa === timeFora) return;

    window._voltandoParaCopa = false;

    setPlacar({ casa: 0, fora: 0 });
    setTempo(90);
    setFim(false);
    setControlado(0);
    setJogoIniciado(true);
    resetarCampo();
  }

  useEffect(() => {
    function down(e) {
      keys.current[e.key.toLowerCase()] = true;
    }

    function up(e) {
      keys.current[e.key.toLowerCase()] = false;
    }

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    if (!jogoIniciado || fim) return;

    const timer = setInterval(() => {
      setTempo((t) => {
        if (t <= 1) {
          setFim(true);
          return 0;
        }

        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [jogoIniciado, fim]);

  useEffect(() => {
    if (!jogoIniciado) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function distance(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function moveTo(obj, targetX, targetY, speed) {
      const dx = targetX - obj.x;
      const dy = targetY - obj.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 1) {
        obj.x += (dx / dist) * speed;
        obj.y += (dy / dist) * speed;
      }
    }

    function limitarCampo(obj) {
      obj.x = Math.max(20, Math.min(WIDTH - 20, obj.x));
      obj.y = Math.max(20, Math.min(HEIGHT - 20, obj.y));
    }

    function atualizarBolaNoDono() {
      const b = game.current.ball;

      if (b.ownerTeam === "home") {
        const dono = game.current.home[b.owner];
        if (!dono) return;

        b.x = dono.x + 15;
        b.y = dono.y;
      }

      if (b.ownerTeam === "away") {
        const dono = game.current.away[b.owner];
        if (!dono) return;

        b.x = dono.x - 15;
        b.y = dono.y;
      }
    }

    function dominarBola() {
      const b = game.current.ball;

      if (b.ownerTeam) return;

      game.current.home.forEach((p, i) => {
        if (distance(p, b) < p.r + b.r + 6) {
          b.ownerTeam = "home";
          b.owner = i;
          b.vx = 0;
          b.vy = 0;
          setControlado(i);
        }
      });

      game.current.away.forEach((p, i) => {
        if (distance(p, b) < p.r + b.r + 6) {
          b.ownerTeam = "away";
          b.owner = i;
          b.vx = 0;
          b.vy = 0;
        }
      });
    }

    function movePlayer() {
      const p = game.current.home[controlado];
      if (!p) return;

      // CONTROLES NOVOS
      // W = cima | A = esquerda | S = baixo | D = direita
      if (keys.current["w"]) p.y -= p.speed;
      if (keys.current["s"]) p.y += p.speed;
      if (keys.current["a"]) p.x -= p.speed;
      if (keys.current["d"]) p.x += p.speed;

      limitarCampo(p);

      game.current.home.forEach((j, i) => {
        if (i !== controlado) {
          moveTo(j, j.baseX, j.baseY, 0.55);
        }
      });
    }

    function escolherCompanheiroParaPasse(donoIndex) {
      let alvoIndex = null;
      let melhorPontuacao = -9999;
      const dono = game.current.home[donoIndex];

      game.current.home.forEach((p, i) => {
        if (i === donoIndex) return;

        const avanco = p.x;
        const distancia = distance(dono, p);
        const pontuacao = avanco - distancia * 0.25;

        if (pontuacao > melhorPontuacao) {
          melhorPontuacao = pontuacao;
          alvoIndex = i;
        }
      });

      return alvoIndex ?? 0;
    }

    function passarBola() {
      const now = Date.now();
      if (now - lastAction.current < 350) return;

      const b = game.current.ball;

      if (b.ownerTeam !== "home") return;

      lastAction.current = now;

      const donoIndex = b.owner;
      const dono = game.current.home[donoIndex];
      const alvoIndex = escolherCompanheiroParaPasse(donoIndex);
      const alvo = game.current.home[alvoIndex];

      // troca automaticamente para quem vai receber o passe
      setControlado(alvoIndex);

      b.ownerTeam = null;
      b.owner = null;
      b.vx = (alvo.x - dono.x) * 0.09;
      b.vy = (alvo.y - dono.y) * 0.09;
    }

    function chutarBola() {
      const now = Date.now();
      if (now - lastAction.current < 350) return;

      const b = game.current.ball;

      if (b.ownerTeam !== "home") return;

      lastAction.current = now;

      const dono = game.current.home[b.owner];

      // chute corrigido:
      // agora chuta forte para o gol inimigo mesmo estando no campo adversário
      b.ownerTeam = null;
      b.owner = null;
      b.vx = 12;
      b.vy = (GOAL_CENTER_Y - dono.y) * 0.045;
    }

    function tentarRoubar() {
      const now = Date.now();
      if (now - lastAction.current < 300) return;

      const b = game.current.ball;
      const jogador = game.current.home[controlado];

      if (b.ownerTeam !== "away") return;

      lastAction.current = now;

      const donoIA = game.current.away[b.owner];

      if (donoIA && distance(jogador, donoIA) < 38) {
        b.ownerTeam = "home";
        b.owner = controlado;
        b.vx = 0;
        b.vy = 0;
      }
    }

    function inteligenciaIA() {
      const b = game.current.ball;

      if (b.ownerTeam === "away") {
        const dono = game.current.away[b.owner];
        if (!dono) return;

        if (dono.x < 170) {
          b.ownerTeam = null;
          b.owner = null;
          b.vx = -10;
          b.vy = (GOAL_CENTER_Y - dono.y) * 0.045;
          return;
        }

        moveTo(dono, 80, GOAL_CENTER_Y, dono.speed);
      } else {
        let maisPerto = game.current.away[0];

        game.current.away.forEach((p) => {
          if (distance(p, b) < distance(maisPerto, b)) {
            maisPerto = p;
          }
        });

        moveTo(maisPerto, b.x, b.y, maisPerto.speed);

        game.current.away.forEach((p) => {
          if (p !== maisPerto) {
            moveTo(p, p.baseX, p.baseY, 0.5);
          }
        });
      }

      game.current.away.forEach(limitarCampo);
    }

    function moverBolaLivre() {
      const b = game.current.ball;

      if (b.ownerTeam) {
        atualizarBolaNoDono();
        return;
      }

      b.x += b.vx;
      b.y += b.vy;

      b.vx *= 0.985;
      b.vy *= 0.985;

      if (b.y < 20 || b.y > HEIGHT - 20) {
        b.vy *= -1;
      }

      // Gol da IA no lado esquerdo
      if (b.x <= 0) {
        if (b.y >= GOAL_TOP && b.y <= GOAL_BOTTOM) {
          setPlacar((p) => ({ ...p, fora: p.fora + 1 }));
          resetarCampo();
        } else {
          b.x = 25;
          b.vx *= -0.6;
        }
      }

      // Gol do jogador no lado direito
      if (b.x >= WIDTH) {
        if (b.y >= GOAL_TOP && b.y <= GOAL_BOTTOM) {
          setPlacar((p) => ({ ...p, casa: p.casa + 1 }));
          resetarCampo();
        } else {
          b.x = WIDTH - 25;
          b.vx *= -0.6;
        }
      }

      dominarBola();
    }

    function comandos() {
      // H = toca a bola
      if (keys.current["h"]) passarBola();

      // J = chuta a bola para o gol
      if (keys.current["j"]) chutarBola();

      // K = rouba a bola
      if (keys.current["k"]) tentarRoubar();
    }

    function drawField() {
      ctx.fillStyle = "#15803d";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;

      ctx.strokeRect(20, 20, 760, 410);

      ctx.beginPath();
      ctx.moveTo(400, 20);
      ctx.lineTo(400, 430);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(400, 225, 60, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeRect(20, 155, 90, 140);
      ctx.strokeRect(690, 155, 90, 140);

      ctx.fillStyle = "#111827";
      ctx.fillRect(0, GOAL_TOP, 12, GOAL_BOTTOM - GOAL_TOP);
      ctx.fillRect(WIDTH - 12, GOAL_TOP, 12, GOAL_BOTTOM - GOAL_TOP);
    }

    function drawPlayer(obj, color, selected = false) {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
      ctx.fill();

      if (selected) {
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.r + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = "white";
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(obj.nome, obj.x, obj.y - 18);
    }

    function drawBall() {
      const b = game.current.ball;

      ctx.beginPath();
      ctx.fillStyle = "white";
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#111";
      ctx.stroke();
    }

    function loop() {
      if (!fim) {
        movePlayer();
        inteligenciaIA();
        comandos();
        moverBolaLivre();
      }

      drawField();

      game.current.home.forEach((p, i) => {
        drawPlayer(p, "#2563eb", i === controlado);
      });

      game.current.away.forEach((p) => {
        drawPlayer(p, "#dc2626");
      });

      drawBall();

      if (fim && modo === "copa") {
        if (!window._voltandoParaCopa) {
          window._voltandoParaCopa = true;

          localStorage.setItem(
            "resultadoCopa",
            JSON.stringify({
              timeA: timeAParam,
              timeB: timeBParam,
              golsA: placar.casa,
              golsB: placar.fora,
            })
          );

          setTimeout(() => {
            window.location.href = "/copa";
          }, 2000);
        }
      }

      animationRef.current = requestAnimationFrame(loop);
    }

    loop();

    return () => cancelAnimationFrame(animationRef.current);
  }, [jogoIniciado, fim, controlado, placar, modo, timeAParam, timeBParam]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-3xl font-bold">Jogo 2D</h1>
            <p className="text-zinc-400">
              W cima • A esquerda • S baixo • D direita • H passa • J chuta • K rouba
            </p>
          </div>

          <Link href="/campeonato" className="text-blue-400 hover:underline">
            Voltar
          </Link>
        </div>

        {!jogoIniciado && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-6">
            <h2 className="text-2xl font-bold mb-5">Escolher Times</h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block mb-2">Seu time</label>
                <select
                  value={timeCasa}
                  onChange={(e) => setTimeCasa(e.target.value)}
                  className="w-full bg-zinc-800 p-3 rounded-xl"
                  disabled={modo === "copa"}
                >
                  {times.map((time) => (
                    <option key={time.id} value={time.id}>
                      {time.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2">Adversário IA</label>
                <select
                  value={timeFora}
                  onChange={(e) => setTimeFora(e.target.value)}
                  className="w-full bg-zinc-800 p-3 rounded-xl"
                  disabled={modo === "copa"}
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
              onClick={iniciarJogo}
              className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-xl font-bold text-lg"
            >
              Começar Jogo 2D
            </button>
          </div>
        )}

        {jogoIniciado && (
          <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4 flex justify-between text-xl font-bold">
              <span>{nomeCasa}: {placar.casa}</span>
              <span>Tempo: {tempo}s</span>
              <span>{nomeFora}: {placar.fora}</span>
            </div>

            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              className="w-full bg-green-700 rounded-2xl border border-zinc-700"
            />
          </>
        )}

        {fim && (
          <div className="mt-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
            <h2 className="text-2xl font-bold mb-2">Fim de jogo!</h2>

            <p className="mb-4">
              Placar final: {nomeCasa} {placar.casa} x {placar.fora} {nomeFora}
            </p>

            {modo !== "copa" && (
              <button
                onClick={iniciarJogo}
                className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-bold"
              >
                Jogar novamente
              </button>
            )}

            {modo === "copa" && (
              <p className="text-zinc-400">Voltando para a Copa...</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function JogoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-zinc-950 text-white p-6">
          Carregando jogo...
        </main>
      }
    >
      <JogoContent />
    </Suspense>
  );
}