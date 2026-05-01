"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const WIDTH = 1920;
const HEIGHT = 1080;
const GOAL_TOP = HEIGHT / 2 - HEIGHT * 0.06;
const GOAL_BOTTOM = HEIGHT / 2 + HEIGHT * 0.06;
const GOAL_CENTER_Y = HEIGHT / 2;

export default function JogoOnlinePage() {
  const params = useParams();
  const sala = params.sala;

  const canvasRef = useRef(null);
  const channelRef = useRef(null);
  const animationRef = useRef(null);

  const roleRef = useRef(null);
  const keys = useRef({});
  const remoteInput = useRef({});
  const lastSend = useRef(0);

  const [role, setRole] = useState(null);
  const [status, setStatus] = useState("Escolha seu lado para entrar na sala");
  const [placar, setPlacar] = useState({ home: 0, away: 0 });

  const game = useRef({
    homeControlado: 4,
    awayControlado: 4,
    ball: {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      r: 8,
      vx: 0,
      vy: 0,
      ownerTeam: "home",
      owner: 4,
      ignorePickupUntil: 0,
    },
    home: [],
    away: [],
  });

  function criarJogadores() {
    const meioY = HEIGHT / 2;

    game.current.home = [
      { nome: "GOL", x: 120, y: meioY, baseX: 120, baseY: meioY, r: 14, speed: 3 },
      { nome: "ZAG", x: 360, y: meioY - 180, baseX: 360, baseY: meioY - 180, r: 14, speed: 3 },
      { nome: "LAT", x: 360, y: meioY + 180, baseX: 360, baseY: meioY + 180, r: 14, speed: 3 },
      { nome: "MEI", x: 620, y: meioY - 80, baseX: 620, baseY: meioY - 80, r: 14, speed: 3.2 },
      { nome: "ATA", x: 760, y: meioY + 90, baseX: 760, baseY: meioY + 90, r: 14, speed: 3.3 },
    ];

    game.current.away = [
      { nome: "GOL", x: WIDTH - 120, y: meioY, baseX: WIDTH - 120, baseY: meioY, r: 14, speed: 3 },
      { nome: "ZAG", x: WIDTH - 360, y: meioY - 180, baseX: WIDTH - 360, baseY: meioY - 180, r: 14, speed: 3 },
      { nome: "LAT", x: WIDTH - 360, y: meioY + 180, baseX: WIDTH - 360, baseY: meioY + 180, r: 14, speed: 3 },
      { nome: "MEI", x: WIDTH - 620, y: meioY - 80, baseX: WIDTH - 620, baseY: meioY - 80, r: 14, speed: 3.2 },
      { nome: "ATA", x: WIDTH - 760, y: meioY + 90, baseX: WIDTH - 760, baseY: meioY + 90, r: 14, speed: 3.3 },
    ];
  }

  function resetarCampo(posse = "home") {
    criarJogadores();

    game.current.homeControlado = 4;
    game.current.awayControlado = 4;

    game.current.ball = {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      r: 8,
      vx: 0,
      vy: 0,
      ownerTeam: posse,
      owner: 4,
      ignorePickupUntil: performance.now() + 400,
    };
  }

  useEffect(() => {
    criarJogadores();
    resetarCampo("home");
  }, []);

  useEffect(() => {
    function down(e) {
      const k = e.key.toLowerCase();

      if (["w", "a", "s", "d", "q", "h", "j", "k"].includes(k)) {
        e.preventDefault();
      }

      keys.current[k] = true;
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

  function entrarComo(lado) {
    setRole(lado);
    roleRef.current = lado;
    setStatus(lado === "home" ? "Você é o Player 1 - Azul" : "Você é o Player 2 - Vermelho");
  }

  useEffect(() => {
    if (!role) return;

    const channel = supabase.channel(`jogo-online-${sala}`, {
      config: {
        broadcast: {
          self: false,
        },
      },
    });

    channel.on("broadcast", { event: "input" }, ({ payload }) => {
      if (roleRef.current === "home" && payload.player === "away") {
        remoteInput.current = payload.keys;
      }
    });

    channel.on("broadcast", { event: "state" }, ({ payload }) => {
      if (roleRef.current === "away") {
        game.current = payload.game;
        setPlacar(payload.placar);
      }
    });

    channel.subscribe((s) => {
      if (s === "SUBSCRIBED") {
        setStatus(
          roleRef.current === "home"
            ? "Sala criada. Envie o link para seu amigo."
            : "Conectado na sala. Aguardando o Player 1."
        );
      }
    });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, sala]);

  useEffect(() => {
    if (!role) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function distance(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function limitarCampo(p) {
      p.x = Math.max(30, Math.min(WIDTH - 30, p.x));
      p.y = Math.max(30, Math.min(HEIGHT - 30, p.y));
    }

    function moveTo(obj, tx, ty, speed) {
      const dx = tx - obj.x;
      const dy = ty - obj.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 1) {
        obj.x += (dx / dist) * speed;
        obj.y += (dy / dist) * speed;
      }
    }

    function getInputLocal() {
      return {
        up: !!keys.current["w"],
        down: !!keys.current["s"],
        left: !!keys.current["a"],
        right: !!keys.current["d"],
        switch: !!keys.current["q"],
        pass: !!keys.current["h"],
        shoot: !!keys.current["j"],
        steal: !!keys.current["k"],
      };
    }

    function enviarInputSeForAway() {
      if (roleRef.current !== "away") return;
      if (!channelRef.current) return;

      const now = performance.now();

      if (now - lastSend.current < 33) return;
      lastSend.current = now;

      channelRef.current.send({
        type: "broadcast",
        event: "input",
        payload: {
          player: "away",
          keys: getInputLocal(),
        },
      });
    }

    function inputHome() {
      return roleRef.current === "home" ? getInputLocal() : {};
    }

    function inputAway() {
      if (roleRef.current === "home") return remoteInput.current || {};
      return getInputLocal();
    }

    function trocarJogador(team) {
      const b = game.current.ball;
      const lista = game.current[team];

      let menor = Infinity;
      let escolhido = game.current[`${team}Controlado`];

      lista.forEach((p, i) => {
        const d = distance(p, b);

        if (d < menor) {
          menor = d;
          escolhido = i;
        }
      });

      game.current[`${team}Controlado`] = escolhido;
    }

    function moverJogador(team, input) {
      const idx = game.current[`${team}Controlado`];
      const p = game.current[team][idx];
      if (!p) return;

      if (input.up) p.y -= p.speed;
      if (input.down) p.y += p.speed;
      if (input.left) p.x -= p.speed;
      if (input.right) p.x += p.speed;

      limitarCampo(p);
    }

    function atualizarBolaNoDono() {
      const b = game.current.ball;

      if (b.ownerTeam === "home") {
        const dono = game.current.home[b.owner];
        if (!dono) return;
        b.x = dono.x + 14;
        b.y = dono.y + 6;
      }

      if (b.ownerTeam === "away") {
        const dono = game.current.away[b.owner];
        if (!dono) return;
        b.x = dono.x - 14;
        b.y = dono.y + 6;
      }
    }

    function dominarBola() {
      const b = game.current.ball;
      if (b.ownerTeam) return;
      if (performance.now() < b.ignorePickupUntil) return;

      ["home", "away"].forEach((team) => {
        if (b.ownerTeam) return;

        game.current[team].forEach((p, i) => {
          if (distance(p, b) < p.r + b.r + 22) {
            b.ownerTeam = team;
            b.owner = i;
            b.vx = 0;
            b.vy = 0;
            b.ignorePickupUntil = performance.now() + 200;
          }
        });
      });
    }

    function escolherPasse(team) {
      const idx = game.current[`${team}Controlado`];
      const dono = game.current[team][idx];
      const lista = game.current[team];

      let melhor = idx;
      let melhorDist = Infinity;

      lista.forEach((p, i) => {
        if (i === idx || i === 0) return;

        const d = Math.abs(p.x - dono.x) + Math.abs(p.y - dono.y);

        if (d < melhorDist) {
          melhorDist = d;
          melhor = i;
        }
      });

      return melhor;
    }

    function passar(team) {
      const b = game.current.ball;
      const idx = game.current[`${team}Controlado`];
      const dono = game.current[team][idx];

      if (!dono) return;

      if (b.ownerTeam !== team) {
        if (distance(dono, b) < dono.r + b.r + 40) {
          b.ownerTeam = team;
          b.owner = idx;
          b.vx = 0;
          b.vy = 0;
        } else {
          return;
        }
      }

      const alvoIdx = escolherPasse(team);
      const alvo = game.current[team][alvoIdx];

      if (!alvo) return;

      game.current[`${team}Controlado`] = alvoIdx;

      b.ownerTeam = null;
      b.owner = null;
      b.ignorePickupUntil = performance.now() + 180;

      const dx = alvo.x - dono.x;
      const dy = alvo.y - dono.y;
      const dist = Math.hypot(dx, dy) || 1;
      const velocidadePasse = 6.8;

      b.x = dono.x + (team === "home" ? 22 : -22);
      b.y = dono.y + 4;
      b.vx = (dx / dist) * velocidadePasse;
      b.vy = (dy / dist) * velocidadePasse;
    }

    function chutar(team) {
      const b = game.current.ball;
      const idx = game.current[`${team}Controlado`];
      const dono = game.current[team][idx];

      if (!dono) return;

      if (b.ownerTeam !== team) {
        if (distance(dono, b) < dono.r + b.r + 40) {
          b.ownerTeam = team;
          b.owner = idx;
          b.vx = 0;
          b.vy = 0;
        } else {
          return;
        }
      }

      b.ownerTeam = null;
      b.owner = null;
      b.ignorePickupUntil = performance.now() + 600;

      const direcao = team === "home" ? 1 : -1;
      const alvoY = GOAL_CENTER_Y;
      const forca = 24;

      b.x = dono.x + direcao * 28;
      b.y = dono.y + 4;
      b.vx = forca * direcao;
      b.vy = (alvoY - dono.y) * 0.055;
    }

    function roubar(team) {
      const b = game.current.ball;
      const idx = game.current[`${team}Controlado`];
      const jogador = game.current[team][idx];

      if (!jogador) return;

      const outro = team === "home" ? "away" : "home";

      if (b.ownerTeam === outro) {
        const donoOutro = game.current[outro][b.owner];

        if (donoOutro && distance(jogador, donoOutro) < 95) {
          b.ownerTeam = team;
          b.owner = idx;
          b.vx = 0;
          b.vy = 0;
          b.ignorePickupUntil = performance.now() + 300;
        }
      }

      if (!b.ownerTeam && distance(jogador, b) < 95) {
        b.ownerTeam = team;
        b.owner = idx;
        b.vx = 0;
        b.vy = 0;
        b.ignorePickupUntil = performance.now() + 300;
      }
    }

    let travaHome = {};
    let travaAway = {};

    function executarAcoes(team, input, trava) {
      if (input.switch && !trava.switch) trocarJogador(team);
      if (input.pass && !trava.pass) passar(team);
      if (input.shoot && !trava.shoot) chutar(team);
      if (input.steal) roubar(team);

      trava.switch = input.switch;
      trava.pass = input.pass;
      trava.shoot = input.shoot;
    }

    function moverSemControle() {
      const b = game.current.ball;

      ["home", "away"].forEach((team) => {
        game.current[team].forEach((p, i) => {
          if (i === game.current[`${team}Controlado`]) return;

          let tx = p.baseX;
          let ty = p.baseY;

          if (b.ownerTeam === team && i !== b.owner) {
            tx = p.baseX + (team === "home" ? 120 : -120);
          }

          if (b.ownerTeam && b.ownerTeam !== team) {
            tx = p.baseX + (team === "home" ? -40 : 40);
          }

          moveTo(p, tx, ty, 0.7);
          limitarCampo(p);
        });
      });
    }

    function moverBola() {
      const b = game.current.ball;

      if (b.ownerTeam) {
        atualizarBolaNoDono();
        return;
      }

      b.x += b.vx;
      b.y += b.vy;

      const atrito = Math.abs(b.vx) > 18 ? 0.992 : 0.975;
      b.vx *= atrito;
      b.vy *= atrito;

      if (b.y < 30 || b.y > HEIGHT - 30) {
        b.vy *= -1;
      }

      if (b.x <= 0) {
        if (b.y >= GOAL_TOP && b.y <= GOAL_BOTTOM) {
          setPlacar((p) => ({ ...p, away: p.away + 1 }));
          resetarCampo("home");
          return;
        }

        b.x = 35;
        b.vx *= -0.6;
      }

      if (b.x >= WIDTH) {
        if (b.y >= GOAL_TOP && b.y <= GOAL_BOTTOM) {
          setPlacar((p) => ({ ...p, home: p.home + 1 }));
          resetarCampo("away");
          return;
        }

        b.x = WIDTH - 35;
        b.vx *= -0.6;
      }

      dominarBola();
    }

    function enviarEstado() {
      if (roleRef.current !== "home") return;
      if (!channelRef.current) return;

      const now = performance.now();

      if (now - lastSend.current < 33) return;
      lastSend.current = now;

      channelRef.current.send({
        type: "broadcast",
        event: "state",
        payload: {
          game: game.current,
          placar,
        },
      });
    }

    function drawField() {
      ctx.fillStyle = "#15803d";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;

      const margem = 25;
      const meioX = WIDTH / 2;
      const meioY = HEIGHT / 2;

      ctx.strokeRect(margem, margem, WIDTH - margem * 2, HEIGHT - margem * 2);

      ctx.beginPath();
      ctx.moveTo(meioX, margem);
      ctx.lineTo(meioX, HEIGHT - margem);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(meioX, meioY, HEIGHT * 0.13, 0, Math.PI * 2);
      ctx.stroke();

      const areaW = WIDTH * 0.12;
      const areaH = HEIGHT * 0.28;
      const areaY = meioY - areaH / 2;

      ctx.strokeRect(margem, areaY, areaW, areaH);
      ctx.strokeRect(WIDTH - margem - areaW, areaY, areaW, areaH);

      ctx.fillStyle = "#111827";
      ctx.fillRect(0, GOAL_TOP, margem, GOAL_BOTTOM - GOAL_TOP);
      ctx.fillRect(WIDTH - margem, GOAL_TOP, margem, GOAL_BOTTOM - GOAL_TOP);
    }

    function drawPlayer(p, color, selected) {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      if (selected) {
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = "white";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.fillText(p.nome, p.x, p.y - 28);
    }

    function drawBall() {
      const b = game.current.ball;

      ctx.beginPath();
      ctx.fillStyle = "white";
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    function draw() {
      drawField();

      game.current.home.forEach((p, i) => {
        drawPlayer(p, "#2563eb", i === game.current.homeControlado);
      });

      game.current.away.forEach((p, i) => {
        drawPlayer(p, "#dc2626", i === game.current.awayControlado);
      });

      drawBall();
    }

    function loop() {
      enviarInputSeForAway();

      if (roleRef.current === "home") {
        const hInput = inputHome();
        const aInput = inputAway();

        moverJogador("home", hInput);
        moverJogador("away", aInput);

        executarAcoes("home", hInput, travaHome);
        executarAcoes("away", aInput, travaAway);

        moverSemControle();
        moverBola();
        enviarEstado();
      }

      draw();

      animationRef.current = requestAnimationFrame(loop);
    }

    loop();

    return () => cancelAnimationFrame(animationRef.current);
  }, [role, placar, sala]);

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/jogo-online/${sala}`
      : "";

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-5">
          <h1 className="text-3xl font-bold">Jogo Online</h1>
          <p className="text-zinc-400">
            Sala: <strong>{sala}</strong>
          </p>
          <p className="text-zinc-400">{status}</p>
        </div>

        {!role && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
            <p className="mb-4 text-zinc-300">
              Envie este link para seu amigo entrar na mesma sala:
            </p>

            <div className="bg-zinc-800 rounded-xl p-3 mb-5 break-all">
              {inviteLink}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => entrarComo("home")}
                className="bg-blue-600 hover:bg-blue-700 rounded-xl py-4 font-bold"
              >
                Entrar como Player 1 - Azul
              </button>

              <button
                onClick={() => entrarComo("away")}
                className="bg-red-600 hover:bg-red-700 rounded-xl py-4 font-bold"
              >
                Entrar como Player 2 - Vermelho
              </button>
            </div>
          </div>
        )}

        {role && (
          <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4 flex justify-between items-center text-xl font-bold">
              <span>Azul: {placar.home}</span>
              <span>{role === "home" ? "Você é o Azul" : "Você é o Vermelho"}</span>
              <span>Vermelho: {placar.away}</span>
            </div>

            <p className="mb-3 text-zinc-400">
              Controles: W A S D move • Q troca jogador • H passa • J chuta • K rouba
            </p>

            <canvas
              ref={canvasRef}
              width={1920}
              height={1080}
              className="w-full bg-green-700 rounded-2xl border border-zinc-700"
            />
          </>
        )}
      </div>
    </main>
  );
}