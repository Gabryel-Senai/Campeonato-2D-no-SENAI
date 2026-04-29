"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const WIDTH = 1000;
const HEIGHT = 560;
const GOAL_TOP = 220;
const GOAL_BOTTOM = 340;
const GOAL_CENTER_Y = (GOAL_TOP + GOAL_BOTTOM) / 2;

function JogoContent() {
  const searchParams = useSearchParams();

  const modo = searchParams.get("modo");
  const timeAParam = searchParams.get("timeA");
  const timeBParam = searchParams.get("timeB");

  const canvasRef = useRef(null);
  const keys = useRef({});
  const actions = useRef({ pass: false, shoot: false, steal: false });
  const animationRef = useRef(null);
  const replayFrames = useRef([]);
  const replayIndex = useRef(0);
  const pausadoPorGol = useRef(false);

  const [times, setTimes] = useState([]);
  const [timeCasa, setTimeCasa] = useState("");
  const [timeFora, setTimeFora] = useState("");
  const [jogoIniciado, setJogoIniciado] = useState(false);
  const [placar, setPlacar] = useState({ casa: 0, fora: 0 });
  const [tempo, setTempo] = useState(90);
  const [fim, setFim] = useState(false);
  const [controlado, setControlado] = useState(0);
  const [mensagemGol, setMensagemGol] = useState("");
  const [emReplay, setEmReplay] = useState(false);

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

  function tocarAudioGol() {
    const audio = new Audio("/audio/gol.mp3");
    audio.volume = 0.8;
    audio.play().catch(() => {});
  }

  async function carregarTimes() {
    const { data } = await supabase.from("times").select("*").order("nome");

    setTimes(data || []);

    if (modo === "copa" && timeAParam && timeBParam) {
      setTimeCasa(timeAParam);
      setTimeFora(timeBParam);

      setTimeout(() => {
        iniciarJogo(timeAParam, timeBParam);
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
      { nome: "Goleiro", x: 90, y: 225, baseX: 90, baseY: 225, r: 12, speed: 2.0, role: "GK" },
      { nome: "Zagueiro", x: 210, y: 120, baseX: 210, baseY: 120, r: 12, speed: 2.0, role: "DEF" },
      { nome: "Lateral", x: 210, y: 330, baseX: 210, baseY: 330, r: 12, speed: 2.0, role: "DEF" },
      { nome: "Meia", x: 360, y: 170, baseX: 360, baseY: 170, r: 12, speed: 2.0, role: "MEI" },
      { nome: "Atacante", x: 430, y: 280, baseX: 430, baseY: 280, r: 12, speed: 2.6, role: "ATA" },
    ];

    game.current.away = [
      { nome: "Goleiro IA", x: 710, y: 225, baseX: 710, baseY: 225, r: 12, speed: 2.0, role: "GK" },
      { nome: "Zagueiro IA", x: 590, y: 120, baseX: 590, baseY: 120, r: 12, speed: 2.0, role: "DEF" },
      { nome: "Lateral IA", x: 590, y: 330, baseX: 590, baseY: 330, r: 12, speed: 2.0, role: "DEF" },
      { nome: "Meia IA", x: 440, y: 170, baseX: 440, baseY: 170, r: 12, speed: 2.2, role: "MEI" },
      { nome: "Atacante IA", x: 390, y: 280, baseX: 390, baseY: 280, r: 12, speed: 2.4, role: "ATA" },
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

    replayFrames.current = [];
    replayIndex.current = 0.35;
    pausadoPorGol.current = false;

    setMensagemGol("");
    setEmReplay(false);
  }

  function iniciarJogo(casaId = timeCasa, foraId = timeFora) {
    if (String(casaId) === String(foraId)) return;

    window._voltandoParaCopa = false;

    setTimeCasa(casaId);
    setTimeFora(foraId);
    setPlacar({ casa: 0, fora: 0 });
    setTempo(90);
    setFim(false);
    setControlado(0);
    setJogoIniciado(true);
    resetarCampo();
  }

  useEffect(() => {
    function down(e) {
      const key = e.key.toLowerCase();

      if (["h", "j", "k", " "].includes(key)) {
        e.preventDefault();
      }

      if (key === "h") actions.current.pass = true;
      if (key === "j") actions.current.shoot = true;
      if (key === "k") actions.current.steal = true;

      keys.current[key] = true;
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
    if (!jogoIniciado || fim || mensagemGol) return;

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
  }, [jogoIniciado, fim, mensagemGol]);

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

    function bolaPertoDoJogador(jogador) {
      return distance(jogador, game.current.ball) < jogador.r + game.current.ball.r + 18;
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

      if (keys.current["w"]) p.y -= p.speed;
      if (keys.current["s"]) p.y += p.speed;
      if (keys.current["a"]) p.x -= p.speed;
      if (keys.current["d"]) p.x += p.speed;

      limitarCampo(p);
    }

    function moverCompanheirosInteligentes() {
      const b = game.current.ball;
      const homeHasBall = b.ownerTeam === "home";
      const awayHasBall = b.ownerTeam === "away";

      game.current.home.forEach((j, i) => {
        if (i === controlado) return;

        let targetX = j.baseX;
        let targetY = j.baseY;

        if (homeHasBall) {
          const dono = game.current.home[b.owner];

          if (j.role === "ATA") {
            targetX = Math.min(690, dono.x + 150);
            targetY = dono.y < HEIGHT / 2 ? 315 : 135;
          } else if (j.role === "MEI") {
            targetX = Math.min(610, dono.x + 90);
            targetY = dono.y < HEIGHT / 2 ? 260 : 190;
          } else if (j.role === "DEF") {
            targetX = Math.max(150, dono.x - 120);
            targetY = j.baseY;
          }

          const marcadorPerto = game.current.away.some((ia) => distance(ia, j) < 45);
          if (marcadorPerto) {
            targetY += j.y < HEIGHT / 2 ? 35 : -35;
          }
        }

        if (awayHasBall) {
          if (j.role === "ATA" || j.role === "MEI") {
            targetX = Math.max(230, b.x + 40);
            targetY = b.y;
          } else if (j.role === "DEF") {
            targetX = Math.max(120, b.x - 80);
            targetY = j.baseY;
          }
        }

        if (!homeHasBall && !awayHasBall) {
          const pertoDaBola = distance(j, b) < 140;
          if (pertoDaBola) {
            targetX = b.x;
            targetY = b.y;
          }
        }

        moveTo(j, targetX, targetY, 1.15);
        limitarCampo(j);
      });
    }

    function escolherCompanheiroParaPasse(donoIndex) {
      let alvoIndex = null;
      let melhorPontuacao = -9999;
      const dono = game.current.home[donoIndex];

      game.current.home.forEach((p, i) => {
        if (i === donoIndex) return;

        const distancia = distance(dono, p);
        const livre = game.current.away.every((ia) => distance(ia, p) > 38);
        const avanco = p.x;
        const pontuacao = avanco + (livre ? 120 : 0) - distancia * 0.35;

        if (pontuacao > melhorPontuacao) {
          melhorPontuacao = pontuacao;
          alvoIndex = i;
        }
      });

      return alvoIndex ?? 0;
    }

    function passarBola() {
      const b = game.current.ball;
      const jogador = game.current.home[controlado];

      if (b.ownerTeam !== "home") {
        if (bolaPertoDoJogador(jogador)) {
          b.ownerTeam = "home";
          b.owner = controlado;
          b.vx = 0;
          b.vy = 0;
        } else {
          return;
        }
      }

      const donoIndex = b.owner;
      const dono = game.current.home[donoIndex];
      const alvoIndex = escolherCompanheiroParaPasse(donoIndex);
      const alvo = game.current.home[alvoIndex];

      setControlado(alvoIndex);

      b.ownerTeam = null;
      b.owner = null;
      b.vx = (alvo.x - dono.x) * 0.105;
      b.vy = (alvo.y - dono.y) * 0.105;
    }

    function chutarBola() {
      const b = game.current.ball;
      const jogador = game.current.home[controlado];

      if (b.ownerTeam !== "home") {
        if (bolaPertoDoJogador(jogador)) {
          b.ownerTeam = "home";
          b.owner = controlado;
          b.vx = 0;
          b.vy = 0;
        } else {
          return;
        }
      }

      const dono = game.current.home[b.owner] || jogador;

      b.ownerTeam = null;
      b.owner = null;

      const forca = dono.x > 600 ? 10.5 : dono.x > 400 ? 12 : 14;
      b.vx = forca;
      b.vy = (GOAL_CENTER_Y - dono.y) * 0.055;
    }

    function tentarRoubar() {
      const b = game.current.ball;
      const jogador = game.current.home[controlado];

      if (b.ownerTeam === "away") {
        const donoIA = game.current.away[b.owner];

        if (donoIA && distance(jogador, donoIA) < 42) {
          b.ownerTeam = "home";
          b.owner = controlado;
          b.vx = 0;
          b.vy = 0;
        }

        return;
      }

      if (!b.ownerTeam && bolaPertoDoJogador(jogador)) {
        b.ownerTeam = "home";
        b.owner = controlado;
        b.vx = 0;
        b.vy = 0;
      }
    }

    function executarAcoes() {
      if (actions.current.pass) {
        passarBola();
        actions.current.pass = false;
      }

      if (actions.current.shoot) {
        chutarBola();
        actions.current.shoot = false;
      }

      if (actions.current.steal) {
        tentarRoubar();
        actions.current.steal = false;
      }
    }

    function escolherPasseIA(donoIndex) {
  let alvoIndex = null;
  let melhorPontuacao = -9999;
  const dono = game.current.away[donoIndex];

  game.current.away.forEach((p, i) => {
    if (i === donoIndex) return;

    const distancia = distance(dono, p);
    const livre = game.current.home.every((j) => distance(j, p) > 45);
    const avanco = WIDTH - p.x;

    const pontuacao = avanco + (livre ? 120 : 0) - distancia * 0.35;

    if (pontuacao > melhorPontuacao) {
      melhorPontuacao = pontuacao;
      alvoIndex = i;
    }
  });

  return alvoIndex ?? 0;
}

function inteligenciaIA() {
  const b = game.current.ball;

  // IA tentando roubar se o jogador está com a bola
  if (b.ownerTeam === "home") {
    const donoHumano = game.current.home[b.owner];

    let marcador = game.current.away[0];

    game.current.away.forEach((ia) => {
      if (distance(ia, donoHumano) < distance(marcador, donoHumano)) {
        marcador = ia;
      }
    });

    moveTo(marcador, donoHumano.x, donoHumano.y, marcador.speed + 0.7);

    if (distance(marcador, donoHumano) < 34) {
      b.ownerTeam = "away";
      b.owner = game.current.away.indexOf(marcador);
      b.vx = 0;
      b.vy = 0;
    }

    game.current.away.forEach((ia) => {
      if (ia !== marcador) {
        let tx = ia.baseX;
        let ty = ia.baseY;

        if (ia.role === "DEF") {
          tx = Math.max(450, donoHumano.x + 80);
          ty = ia.baseY;
        }

        if (ia.role === "MEI" || ia.role === "ATA") {
          tx = Math.max(350, donoHumano.x + 40);
          ty = donoHumano.y + (ia.baseY < HEIGHT / 2 ? -50 : 50);
        }

        moveTo(ia, tx, ty, 0.8);
      }
    });

    game.current.away.forEach(limitarCampo);
    return;
  }

  // IA com a bola: ela decide chutar, tocar ou avançar
  if (b.ownerTeam === "away") {
    const dono = game.current.away[b.owner];
    if (!dono) return;

    const pertoDoGol = dono.x < 230;
    const pressionado = game.current.home.some((j) => distance(j, dono) < 45);

    // Chute da IA
    if (pertoDoGol) {
      b.ownerTeam = null;
      b.owner = null;
      b.vx = -12;
      b.vy = (GOAL_CENTER_Y - dono.y) * 0.055;
      return;
    }

    // Passe da IA se estiver pressionada
    if (pressionado && Math.random() < 0.05) {
      const alvoIndex = escolherPasseIA(b.owner);
      const alvo = game.current.away[alvoIndex];

      b.ownerTeam = null;
      b.owner = null;
      b.vx = (alvo.x - dono.x) * 0.105;
      b.vy = (alvo.y - dono.y) * 0.105;
      return;
    }

    // Avança em direção ao gol
    moveTo(dono, 80, GOAL_CENTER_Y, dono.speed + 0.4);

    // Companheiros se movimentam para receber
    game.current.away.forEach((ia, i) => {
      if (i === b.owner) return;

      let tx = ia.baseX;
      let ty = ia.baseY;

      if (ia.role === "ATA") {
        tx = Math.max(90, dono.x - 140);
        ty = dono.y < HEIGHT / 2 ? 315 : 135;
      }

      if (ia.role === "MEI") {
        tx = Math.max(160, dono.x - 90);
        ty = dono.y < HEIGHT / 2 ? 260 : 190;
      }

      if (ia.role === "DEF") {
        tx = Math.min(650, dono.x + 120);
        ty = ia.baseY;
      }

      moveTo(ia, tx, ty, 0.9);
    });

    game.current.away.forEach(limitarCampo);
    return;
  }

  // Bola livre: IA tenta dominar
  if (!b.ownerTeam) {
    let maisPerto = game.current.away[0];

    game.current.away.forEach((ia) => {
      if (distance(ia, b) < distance(maisPerto, b)) {
        maisPerto = ia;
      }
    });

    moveTo(maisPerto, b.x, b.y, maisPerto.speed + 0.5);

    if (distance(maisPerto, b) < maisPerto.r + b.r + 8) {
      b.ownerTeam = "away";
      b.owner = game.current.away.indexOf(maisPerto);
      b.vx = 0;
      b.vy = 0;
    }

    game.current.away.forEach((ia) => {
      if (ia !== maisPerto) {
        moveTo(ia, ia.baseX, ia.baseY, 0.65);
      }
    });
  }

  game.current.away.forEach(limitarCampo);
}

    function registrarFrameReplay() {
      const frame = {
        ball: { ...game.current.ball },
        home: game.current.home.map((p) => ({ ...p })),
        away: game.current.away.map((p) => ({ ...p })),
      };

      replayFrames.current.push(frame);

      if (replayFrames.current.length > 180) {
        replayFrames.current.shift();
      }
    }

    function iniciarReplayGol(tipo) {
      if (pausadoPorGol.current) return;

      pausadoPorGol.current = true;
      replayIndex.current = 0;

      setMensagemGol(tipo === "casa" ? "GOOOOOOL!" : "GOL DA IA!");
      setEmReplay(true);
      tocarAudioGol();

      if (tipo === "casa") {
        setPlacar((p) => ({ ...p, casa: p.casa + 1 }));
      } else {
        setPlacar((p) => ({ ...p, fora: p.fora + 1 }));
      }

      setTimeout(() => {
        resetarCampo();
      }, 10000);
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

      if (b.x <= 0) {
        if (b.y >= GOAL_TOP && b.y <= GOAL_BOTTOM) {
          iniciarReplayGol("fora");
        } else {
          b.x = 25;
          b.vx *= -0.6;
        }
      }

      if (b.x >= WIDTH) {
        if (b.y >= GOAL_TOP && b.y <= GOAL_BOTTOM) {
          iniciarReplayGol("casa");
        } else {
          b.x = WIDTH - 25;
          b.vx *= -0.6;
        }
      }

      dominarBola();
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

    function drawBall(ball = game.current.ball) {
      ctx.beginPath();
      ctx.fillStyle = "white";
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#111";
      ctx.stroke();
    }

    function drawFrame(frame) {
      drawField();

      frame.home.forEach((p, i) => {
        drawPlayer(p, "#2563eb", i === controlado);
      });

      frame.away.forEach((p) => {
        drawPlayer(p, "#dc2626");
      });

      drawBall(frame.ball);

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, WIDTH, 55);

      ctx.fillStyle = "#facc15";
      ctx.font = "bold 26px Arial";
      ctx.textAlign = "center";
      ctx.fillText("REPLAY DO GOL", WIDTH / 2, 36);
    }

    function drawAtual() {
      drawField();

      game.current.home.forEach((p, i) => {
        drawPlayer(p, "#2563eb", i === controlado);
      });

      game.current.away.forEach((p) => {
        drawPlayer(p, "#dc2626");
      });

      drawBall();
    }

    function loop() {
      if (pausadoPorGol.current && replayFrames.current.length > 300) {
        const frame = replayFrames.current[replayIndex.current];

        if (frame) {
          drawFrame(frame);
          replayIndex.current += 1;
        } else {
          replayIndex.current = 0;
        }

        animationRef.current = requestAnimationFrame(loop);
        return;
      }

      if (!fim) {
        movePlayer();
        moverCompanheirosInteligentes();
        inteligenciaIA();
        executarAcoes();
        moverBolaLivre();
        registrarFrameReplay();
      }

      drawAtual();

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
              onClick={() => iniciarJogo()}
              className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-xl font-bold text-lg"
            >
              Começar Jogo 2D
            </button>
          </div>
        )}

        {jogoIniciado && (
          <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4 flex justify-between items-center text-xl font-bold">
              <span className="flex items-center gap-3">
                <img
                  src={escudoTime(nomeCasa)}
                  alt={nomeCasa}
                  className="w-9 h-9 object-contain"
                />
                {nomeCasa}: {placar.casa}
              </span>

              <span>Tempo: {tempo}s</span>

              <span className="flex items-center gap-3">
                {nomeFora}: {placar.fora}
                <img
                  src={escudoTime(nomeFora)}
                  alt={nomeFora}
                  className="w-9 h-9 object-contain"
                />
              </span>
            </div>

            {mensagemGol && (
              <div className="mb-4 bg-yellow-500 text-zinc-950 text-center text-4xl font-black rounded-2xl py-6 animate-pulse">
                {mensagemGol} {emReplay ? "• REPLAY" : ""}
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={1000}
              height={560}
              className="w-full bg-green-700 rounded-2xl border border-zinc-700"
            />
          </>
        )}

        {fim && (
          <div className="mt-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
            <h2 className="text-2xl font-bold mb-2">Fim de jogo!</h2>

            <p className="mb-4 flex justify-center items-center gap-3">
              <img
                src={escudoTime(nomeCasa)}
                alt={nomeCasa}
                className="w-8 h-8 object-contain"
              />
              {nomeCasa} {placar.casa} x {placar.fora} {nomeFora}
              <img
                src={escudoTime(nomeFora)}
                alt={nomeFora}
                className="w-8 h-8 object-contain"
              />
            </p>

            {modo !== "copa" && (
              <button
                onClick={() => iniciarJogo()}
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