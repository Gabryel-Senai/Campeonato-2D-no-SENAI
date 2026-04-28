"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function JogoPage() {
  const canvasRef = useRef(null);
  const keys = useRef({});
  const animationRef = useRef(null);

  const [placar, setPlacar] = useState({ casa: 0, fora: 0 });
  const [tempo, setTempo] = useState(60);
  const [fim, setFim] = useState(false);

  const game = useRef({
    player: { x: 180, y: 220, r: 14, color: "#2563eb", speed: 4 },
    enemy: { x: 620, y: 220, r: 14, color: "#dc2626", speed: 2.2 },
    ball: { x: 400, y: 225, r: 8, vx: 0, vy: 0 },
  });

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
    if (fim) return;

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
  }, [fim]);

  useEffect(() => {
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

    function drawPlayer(obj) {
      ctx.beginPath();
      ctx.fillStyle = obj.color;
      ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("⚽", obj.x, obj.y + 4);
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
      drawPlayer(game.current.player);
      drawPlayer(game.current.enemy);
      drawBall();

      animationRef.current = requestAnimationFrame(loop);
    }

    loop();

    return () => cancelAnimationFrame(animationRef.current);
  }, [fim]);

  function reiniciar() {
    setPlacar({ casa: 0, fora: 0 });
    setTempo(60);
    setFim(false);

    game.current.player.x = 180;
    game.current.player.y = 220;
    game.current.enemy.x = 620;
    game.current.enemy.y = 220;
    game.current.ball.x = 400;
    game.current.ball.y = 225;
    game.current.ball.vx = 0;
    game.current.ball.vy = 0;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-3xl font-bold">Jogo 2D</h1>
            <p className="text-zinc-400">
              Use W A S D ou as setas para controlar o time azul.
            </p>
          </div>

          <Link href="/" className="text-blue-400 hover:underline">
            Voltar
          </Link>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4 flex justify-between text-xl font-bold">
          <span>Time Azul: {placar.casa}</span>
          <span>Tempo: {tempo}s</span>
          <span>Time Vermelho: {placar.fora}</span>
        </div>

        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full bg-green-700 rounded-2xl border border-zinc-700"
        />

        {fim && (
          <div className="mt-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
            <h2 className="text-2xl font-bold mb-2">Fim de jogo!</h2>
            <p className="mb-4">
              Placar final: Time Azul {placar.casa} x {placar.fora} Time
              Vermelho
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