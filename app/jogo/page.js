"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function JogoPage() {
  const canvasRef = useRef(null);
  const keys = useRef({});
  const animationRef = useRef(null);

  const [times, setTimes] = useState([]);
  const [timeCasa, setTimeCasa] = useState("");
  const [timeFora, setTimeFora] = useState("");
  const [jogoIniciado, setJogoIniciado] = useState(false);
  const [placar, setPlacar] = useState({ casa: 0, fora: 0 });
  const [tempo, setTempo] = useState(60);
  const [fim, setFim] = useState(false);

  const game = useRef({
    player: { x: 180, y: 220, r: 14, color: "#2563eb", speed: 4 },
    enemy: { x: 620, y: 220, r: 14, color: "#dc2626", speed: 2.2 },
    ball: { x: 400, y: 225, r: 8, vx: 0, vy: 0 },
  });

  const nomeCasa = times.find((t) => String(t.id) === String(timeCasa))?.nome || "Seu Time";
  const nomeFora = times.find((t) => String(t.id) === String(timeFora))?.nome || "Adversário";

  async function carregarTimes() {
    const { data } = await supabase
      .from("times")
      .select("*")
      .order("nome", { ascending: true });

    setTimes(data || []);

    if (data?.length >= 2) {
      setTimeCasa(data[0].id);
      setTimeFora(data[1].id);
    }
  }

  useEffect(() => {
    carregarTimes();
  }, []);

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

    function resetBall() {
      game.current.ball.x = 400;
      game.current.ball.y = 225;
      game.current.ball.vx = 0;
      game.current.ball.vy = 0;

      game.current.player.x = 180;
      game.current.player.y = 220;

      game.current.enemy.x = 620;
      game.current.enemy.y = 220;
    }

    function distance(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function movePlayer() {
      const p = game.current.player;

      if (keys.current["w"] || keys.current["arrowup"]) p.y -= p.speed;
      if (keys.current["s"] || keys.current["arrowdown"]) p.y += p.speed;
      if (keys.current["a"] || keys.current["arrowleft"]) p.x -= p.speed;
      if (keys.current["d"] || keys.current["arrowright"]) p.x += p.speed;

      p.x = Math.max(20, Math.min(780, p.x));
      p.y = Math.max(20, Math.min(430, p.y));
    }

    function moveEnemy() {
      const e = game.current.enemy;
      const b = game.current.ball;

      const dx = b.x - e.x;
      const dy = b.y - e.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 1) {
        e.x += (dx / dist) * e.speed;
        e.y += (dy / dist) * e.speed;
      }
    }

    function moveBall() {
      const b = game.current.ball;

      b.x += b.vx;
      b.y += b.vy;

      b.vx *= 0.97;
      b.vy *= 0.97;

      if (b.y < 10 || b.y > 440) b.vy *= -1;

      if (b.x < 0) {
        setPlacar((p) => ({ ...p, fora: p.fora + 1 }));
        resetBall();
      }

      if (b.x > 800) {
        setPlacar((p) => ({ ...p, casa: p.casa + 1 }));
        resetBall();
      }
    }

    function checkKick() {
      const p = game.current.player;
      const e = game.current.enemy;
      const b = game.current.ball;

      if (distance(p, b) < p.r + b.r + 6) {
        b.vx = (b.x - p.x) * 0.22;
        b.vy = (b.y - p.y) * 0.22;
      }

      if (distance(e, b) < e.r + b.r + 6) {
        b.vx = (b.x - e.x) * 0.18;
        b.vy = (b.y - e.y) * 0.18;
      }
    }

    function drawField() {
      ctx.fillStyle = "#15803d";
      ctx.fillRect(0, 0, 800, 450);

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
      ctx.fillRect(0, 175, 12, 100);
      ctx.fillRect(788, 175, 12, 100);
    }

    function drawPlayer(obj, label) {
      ctx.beginPath();
      ctx.fillStyle = obj.color;
      ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.font = "11px Arial";
      ctx.textAlign = "center";
      ctx.fillText(label, obj.x, obj.y - 20);
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
        moveEnemy();
        checkKick();
        moveBall();
      }

      drawField();
      drawPlayer(game.current.player, nomeCasa);
      drawPlayer(game.current.enemy, nomeFora);
      drawBall();

      animationRef.current = requestAnimationFrame(loop);
    }

    loop();

    return () => cancelAnimationFrame(animationRef.current);
  }, [jogoIniciado, fim, nomeCasa, nomeFora]);

  function iniciarJogo() {
    if (timeCasa === timeFora) {
      alert("Escolha times diferentes.");
      return;
    }

    setPlacar({ casa: 0, fora: 0 });
    setTempo(60);
    setFim(false);
    setJogoIniciado(true);

    game.current.player.x = 180;
    game.current.player.y = 220;
    game.current.enemy.x = 620;
    game.current.enemy.y = 220;
    game.current.ball.x = 400;
    game.current.ball.y = 225;
    game.current.ball.vx = 0;
    game.current.ball.vy = 0;
  }

  function reiniciar() {
    iniciarJogo();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-3xl font-bold">Jogo 2D</h1>
            <p className="text-zinc-400">
              Escolha seu time e jogue usando W A S D ou as setas.
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

            <button
              onClick={reiniciar}
              className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-bold"
            >
              Jogar novamente
            </button>
          </div>
        )}
      </div>
    </main>
  );
}