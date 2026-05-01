"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const WIDTH = 1920;
const HEIGHT = 1080;
const GOAL_TOP = HEIGHT / 2 - HEIGHT * 0.06;
const GOAL_BOTTOM = HEIGHT / 2 + HEIGHT * 0.06;
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
  const audioGolRef = useRef(null);

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
      x: WIDTH / 2,
      y: HEIGHT / 2,
      r: 8,
      vx: 0,
      vy: 0,
      ownerTeam: null,
      owner: null,
      ignorePickupUntil: 0,
      lastKickerTeam: null,
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

  function prepararAudioGol() {
    if (!audioGolRef.current) {
      audioGolRef.current = new Audio("/audio/gol.mp3");
      audioGolRef.current.volume = 0.9;
      audioGolRef.current.load();
    }
  }

  function tocarAudioGol() {
    prepararAudioGol();

    if (!audioGolRef.current) return;

    audioGolRef.current.currentTime = 0;
    audioGolRef.current.play().catch((err) => {
      console.log("Áudio bloqueado ou não encontrado:", err);
    });
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
    const meioY = HEIGHT / 2;

    game.current.home = [
      { nome: "Goleiro", x: 120, y: meioY, baseX: 120, baseY: meioY, r: 14, speed: 2.4, role: "GK" },
      { nome: "Zagueiro", x: 360, y: meioY - 180, baseX: 360, baseY: meioY - 180, r: 14, speed: 2.5, role: "DEF" },
      { nome: "Lateral", x: 360, y: meioY + 180, baseX: 360, baseY: meioY + 180, r: 14, speed: 2.5, role: "DEF" },
      { nome: "Meia", x: 620, y: meioY - 80, baseX: 620, baseY: meioY - 80, r: 14, speed: 2.7, role: "MEI" },
      { nome: "Atacante", x: 760, y: meioY + 90, baseX: 760, baseY: meioY + 90, r: 14, speed: 2.8, role: "ATA" },
    ];

    game.current.away = [
      { nome: "Goleiro IA", x: WIDTH - 120, y: meioY, baseX: WIDTH - 120, baseY: meioY, r: 14, speed: 2.2, role: "GK" },
      { nome: "Zagueiro IA", x: WIDTH - 360, y: meioY - 180, baseX: WIDTH - 360, baseY: meioY - 180, r: 14, speed: 2.2, role: "DEF" },
      { nome: "Lateral IA", x: WIDTH - 360, y: meioY + 180, baseX: WIDTH - 360, baseY: meioY + 180, r: 14, speed: 2.2, role: "DEF" },
      { nome: "Meia IA", x: WIDTH - 620, y: meioY - 80, baseX: WIDTH - 620, baseY: meioY - 80, r: 14, speed: 2.4, role: "MEI" },
      { nome: "Atacante IA", x: WIDTH - 760, y: meioY + 90, baseX: WIDTH - 760, baseY: meioY + 90, r: 14, speed: 2.5, role: "ATA" },
    ];
  }

  function resetarCampo(posseInicial = null) {
    criarJogadores();

    game.current.ball = {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      r: 8,
      vx: 0,
      vy: 0,
      ownerTeam: null,
      owner: null,
      ignorePickupUntil: 0,
      lastKickerTeam: null,
    };

    if (posseInicial === "home") {
  game.current.ball.ownerTeam = "home";
  game.current.ball.owner = 4; // atacante real
  setControlado(4);
}

if (posseInicial === "away") {
  game.current.ball.ownerTeam = "away";
  game.current.ball.owner = 4;
}
    replayFrames.current = [];
    replayIndex.current = 0;
    pausadoPorGol.current = false;

    setMensagemGol("");
    setEmReplay(false);
  }

  function iniciarJogo(casaId = timeCasa, foraId = timeFora) {
    if (String(casaId) === String(foraId)) return;

    prepararAudioGol();

    window._voltandoParaCopa = false;

    setTimeCasa(casaId);
    setTimeFora(foraId);
    setPlacar({ casa: 0, fora: 0 });
    setTempo(90);
    setFim(false);
    setControlado(0);
    setJogoIniciado(true);
    resetarCampo("home"); // começa com você no meio
  }

  useEffect(() => {
    function down(e) {
      const key = e.key.toLowerCase();

      if (["h", "j", "k", "q"].includes(key)) {
        e.preventDefault();
      }

      if (key === "h") actions.current.pass = true;
      if (key === "j") actions.current.shoot = true;
      if (key === "k") actions.current.steal = true;
      if (key === "q") {trocarJogadorMaisProximo();
}
      keys.current[key] = true;
      function trocarJogadorMaisProximo() {
  const b = game.current.ball;

  let menorDist = Infinity;
  let index = controlado;

  game.current.home.forEach((p, i) => {
    const dist = Math.hypot(p.x - b.x, p.y - b.y);

    if (dist < menorDist) {
      menorDist = dist;
      index = i;
    }
  });

  setControlado(index);
}
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
      obj.x = Math.max(30, Math.min(WIDTH - 30, obj.x));
      obj.y = Math.max(30, Math.min(HEIGHT - 30, obj.y));
    }

    function bolaPertoDoJogador(jogador) {
      return (
        distance(jogador, game.current.ball) <
        jogador.r + game.current.ball.r + 24
      );
    }

    function atualizarBolaNoDono() {
      const b = game.current.ball;

      if (b.ownerTeam === "home") {
        const dono = game.current.home[b.owner];
        if (!dono) return;

        b.x = dono.x + 18;
        b.y = dono.y;
      }

      if (b.ownerTeam === "away") {
        const dono = game.current.away[b.owner];
        if (!dono) return;

        b.x = dono.x - 18;
        b.y = dono.y;
      }
    }

    function dominarBola() {
      const b = game.current.ball;

      if (b.ownerTeam) return;

      const agora = performance.now();

      game.current.home.forEach((p, i) => {
        const dist = distance(p, b);
        const raioDominio = b.lastKickerTeam === "home" ? p.r + b.r + 34 : p.r + b.r + 12;

        if (dist < raioDominio && agora > b.ignorePickupUntil) {
          b.ownerTeam = "home";
          b.owner = i;
          b.vx = 0;
          b.vy = 0;
          setControlado(i);
        }
      });

      game.current.away.forEach((p, i) => {
        const dist = distance(p, b);
        const raioDominio = b.lastKickerTeam === "away" ? p.r + b.r + 34 : p.r + b.r + 12;

        if (dist < raioDominio && agora > b.ignorePickupUntil) {
          b.ownerTeam = "away";
          b.owner = i;
          b.vx = 0;
          b.vy = 0;
        }
      });

      game.current.away.forEach((p, i) => {
        if (distance(p, b) < p.r + b.r + 8) {
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
            targetX = Math.min(WIDTH - 300, dono.x + 260);
            targetY = dono.y < HEIGHT / 2 ? HEIGHT * 0.7 : HEIGHT * 0.3;
          } else if (j.role === "MEI") {
            targetX = Math.min(WIDTH - 420, dono.x + 180);
            targetY = dono.y < HEIGHT / 2 ? HEIGHT * 0.58 : HEIGHT * 0.42;
          } else if (j.role === "DEF") {
            targetX = Math.max(250, dono.x - 180);
            targetY = j.baseY;
          }

          const marcadorPerto = game.current.away.some(
            (ia) => distance(ia, j) < 70
          );

          if (marcadorPerto) {
            targetY += j.y < HEIGHT / 2 ? 65 : -65;
          }
        }

        if (awayHasBall) {
          if (j.role === "ATA" || j.role === "MEI") {
            targetX = Math.max(300, b.x + 70);
            targetY = b.y;
          } else if (j.role === "DEF") {
            targetX = Math.max(160, b.x - 120);
            targetY = j.baseY;
          }
        }

        if (!homeHasBall && !awayHasBall) {
          const pertoDaBola = distance(j, b) < 210;

          if (pertoDaBola && performance.now() > b.ignorePickupUntil) {
            targetX = b.x;
            targetY = b.y;
          }
        }

        moveTo(j, targetX, targetY, 1.05);
        limitarCampo(j);
      });
    }

    function escolherCompanheiroParaPasse(donoIndex) {
      const dono = game.current.home[donoIndex];

      let dirX = 0;
      let dirY = 0;

      if (keys.current["w"]) dirY -= 1;
      if (keys.current["s"]) dirY += 1;
      if (keys.current["a"]) dirX -= 1;
      if (keys.current["d"]) dirX += 1;

      let alvoIndex = null;
      let melhorPontuacao = -999999;

      game.current.home.forEach((p, i) => {
        if (i === donoIndex) return;

        const dx = p.x - dono.x;
        const dy = p.y - dono.y;
        const distancia = Math.hypot(dx, dy);

        if (distancia === 0) return;

        const livre = game.current.away.every((ia) => distance(ia, p) > 75);

        let direcaoBonus = 0;

        if (dirX !== 0 || dirY !== 0) {
          const mag = Math.hypot(dirX, dirY);
          const ndx = dirX / mag;
          const ndy = dirY / mag;

          const pdx = dx / distancia;
          const pdy = dy / distancia;

          direcaoBonus = (ndx * pdx + ndy * pdy) * 350;
        }

        const pontuacao =
          direcaoBonus + (livre ? 220 : 0) - distancia * 0.25 + p.x * 0.15;

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
      b.ignorePickupUntil = performance.now() + 450;
      b.lastKickerTeam = "home";

      b.x = dono.x + (alvo.x > dono.x ? 30 : -30);
      b.y = dono.y;

      b.vx = (alvo.x - dono.x) * 0.08;
      b.vy = (alvo.y - dono.y) * 0.08;
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
      b.ignorePickupUntil = performance.now() + 550;
      b.lastKickerTeam = "home";

      const distanciaGol = WIDTH - dono.x;
      const forca = distanciaGol > 1100 ? 18 : distanciaGol > 650 ? 15 : 13;

      b.x = dono.x + 38;
      b.y = dono.y;
      b.vx = forca;
      b.vy = (GOAL_CENTER_Y - dono.y) * 0.045;
    }

    function tentarRoubar() {
      const b = game.current.ball;
      const jogador = game.current.home[controlado];

      if (!jogador) return;

      // 🔥 ROUBAR DA IA (melhorado)
      if (b.ownerTeam === "away") {
        const donoIA = game.current.away[b.owner];
        if (!donoIA) return;

        const dist = distance(jogador, donoIA);

        if (dist < 110) { // 👈 aumentei alcance
          b.ownerTeam = "home";
          b.owner = controlado;
          b.vx = 0;
          b.vy = 0;
          b.ignorePickupUntil = 0;
          b.lastKickerTeam = "home";

          // cola a bola no pé
          b.x = jogador.x + 18;
          b.y = jogador.y;

          return;
        }
      }

      // 🔥 PEGAR BOLA SOLTA (melhorado)
      if (!b.ownerTeam) {
        const dist = distance(jogador, b);

        if (dist < 110) {
          b.ownerTeam = "home";
          b.owner = controlado;
          b.vx = 0;
          b.vy = 0;
          b.ignorePickupUntil = 0;
          b.lastKickerTeam = "home";

          b.x = jogador.x + 18;
          b.y = jogador.y;
        }
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

      if (actions.current.steal || keys.current["k"]) {
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
        const livre = game.current.home.every((j) => distance(j, p) > 75);
        const avanco = WIDTH - p.x;
        const pontuacao = avanco + (livre ? 200 : 0) - distancia * 0.3;

        if (pontuacao > melhorPontuacao) {
          melhorPontuacao = pontuacao;
          alvoIndex = i;
        }
      });

      return alvoIndex ?? 0;
    }

    function inteligenciaIA() {
      const b = game.current.ball;

      if (b.ownerTeam === "home") {
        const donoHumano = game.current.home[b.owner];
        if (!donoHumano) return;

        let marcador = game.current.away[0];

        game.current.away.forEach((ia) => {
          if (distance(ia, donoHumano) < distance(marcador, donoHumano)) {
            marcador = ia;
          }
        });

        moveTo(marcador, donoHumano.x, donoHumano.y, marcador.speed + 0.3);

        if (distance(marcador, donoHumano) < 44) {
          b.ownerTeam = "away";
          b.owner = game.current.away.indexOf(marcador);
          b.vx = 0;
          b.vy = 0;
          b.ignorePickupUntil = performance.now() + 400; // evita ficar roubando em loop
        }

        game.current.away.forEach((ia) => {
          if (ia !== marcador) {
            let tx = ia.baseX;
            let ty = ia.baseY;

            if (ia.role === "DEF") {
              tx = Math.max(WIDTH * 0.55, donoHumano.x + 120);
              ty = ia.baseY;
            }

            if (ia.role === "MEI" || ia.role === "ATA") {
              tx = Math.max(WIDTH * 0.42, donoHumano.x + 90);
              ty = donoHumano.y + (ia.baseY < HEIGHT / 2 ? -90 : 90);
            }

            moveTo(ia, tx, ty, 0.75);
          }
        });

        game.current.away.forEach(limitarCampo);
        return;
      }

      if (b.ownerTeam === "away") {
        const dono = game.current.away[b.owner];
        if (!dono) return;

        const pertoDoGol = dono.x < WIDTH * 0.26;
        const pressionado = game.current.home.some((j) => distance(j, dono) < 75);

        if (pertoDoGol) {
          b.ownerTeam = null;
          b.owner = null;
          b.ignorePickupUntil = performance.now() + 650;
          b.lastKickerTeam = "away";

          b.x = dono.x - 38;
          b.y = dono.y;
          b.vx = -16;
          b.vy = (GOAL_CENTER_Y - dono.y) * 0.045;
          return;
        }

        if (pressionado || Math.random() < 0.025) {
          const alvoIndex = escolherPasseIA(b.owner);
          const alvo = game.current.away[alvoIndex];

          if (alvo) {
            b.ownerTeam = null;
            b.owner = null;
            b.ignorePickupUntil = performance.now() + 180;
            b.lastKickerTeam = "away";

            b.x = dono.x + (alvo.x > dono.x ? 30 : -30);
            b.y = dono.y;
            b.vx = (alvo.x - dono.x) * 0.005;
            b.vy = (alvo.y - dono.y) * 0.005;
            return;
          }
        }

        moveTo(dono, WIDTH * 0.08, GOAL_CENTER_Y, dono.speed);

        game.current.away.forEach((ia, i) => {
          if (i === b.owner) return;

          let tx = ia.baseX;
          let ty = ia.baseY;

          if (ia.role === "ATA") {
            tx = Math.max(160, dono.x - 260);
            ty = dono.y < HEIGHT / 2 ? HEIGHT * 0.68 : HEIGHT * 0.32;
          }

          if (ia.role === "MEI") {
            tx = Math.max(260, dono.x - 180);
            ty = dono.y < HEIGHT / 2 ? HEIGHT * 0.58 : HEIGHT * 0.42;
          }

          if (ia.role === "DEF") {
            tx = Math.min(WIDTH - 260, dono.x + 220);
            ty = ia.baseY;
          }

          moveTo(ia, tx, ty, 0.8);
        });

        game.current.away.forEach(limitarCampo);
        return;
      }

      if (!b.ownerTeam) {
        const agora = performance.now();
        if (agora < b.ignorePickupUntil) {
          game.current.away.forEach((ia) => {
            moveTo(ia, ia.baseX, ia.baseY, 0.55);
          });
          return;
        }

        let maisPerto = game.current.away[0];

        game.current.away.forEach((ia) => {
          if (distance(ia, b) < distance(maisPerto, b)) {
            maisPerto = ia;
          }
        });

        moveTo(maisPerto, b.x, b.y, maisPerto.speed + 0.25);

        if (distance(maisPerto, b) < maisPerto.r + b.r + 12) {
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

        game.current.away.forEach(limitarCampo);
      }
    }

    function registrarFrameReplay() {
      const frame = {
        ball: { ...game.current.ball },
        home: game.current.home.map((p) => ({ ...p })),
        away: game.current.away.map((p) => ({ ...p })),
      };

      replayFrames.current.push(frame);

      if (replayFrames.current.length > 300) {
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
        if (tipo === "casa") {
          resetarCampo("away");
        } else {
          resetarCampo("home");
        }
      }, 6000);
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

      if (b.y < 30 || b.y > HEIGHT - 30) {
        b.vy *= -1;
      }

      if (b.x <= 0) {
        if (b.y >= GOAL_TOP && b.y <= GOAL_BOTTOM) {
          iniciarReplayGol("fora");
        } else {
          b.x = 35;
          b.vx *= -0.6;
        }
      }

      if (b.x >= WIDTH) {
        if (b.y >= GOAL_TOP && b.y <= GOAL_BOTTOM) {
          iniciarReplayGol("casa");
        } else {
          b.x = WIDTH - 35;
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

      const margem = 25;
      const campoW = WIDTH - margem * 2;
      const campoH = HEIGHT - margem * 2;
      const meioX = WIDTH / 2;
      const meioY = HEIGHT / 2;

      ctx.strokeRect(margem, margem, campoW, campoH);

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

      const pequenaAreaW = WIDTH * 0.055;
      const pequenaAreaH = HEIGHT * 0.15;
      const pequenaAreaY = meioY - pequenaAreaH / 2;

      ctx.strokeRect(margem, pequenaAreaY, pequenaAreaW, pequenaAreaH);
      ctx.strokeRect(
        WIDTH - margem - pequenaAreaW,
        pequenaAreaY,
        pequenaAreaW,
        pequenaAreaH
      );

      const golH = HEIGHT * 0.12;
      const golY = meioY - golH / 2;

      ctx.fillStyle = "#111827";
      ctx.fillRect(0, golY, margem, golH);
      ctx.fillRect(WIDTH - margem, golY, margem, golH);
    }

    function drawPlayer(obj, color, selected = false) {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
      ctx.fill();

      if (selected) {
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.r + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = "white";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.fillText(obj.nome, obj.x, obj.y - 26);
    }

    function drawBall(ball = game.current.ball) {
      ctx.beginPath();
      ctx.fillStyle = "white";
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
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
      ctx.fillRect(0, 0, WIDTH, 90);

      ctx.fillStyle = "#facc15";
      ctx.font = "bold 44px Arial";
      ctx.textAlign = "center";
      ctx.fillText("REPLAY DO GOL", WIDTH / 2, 60);
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
      if (pausadoPorGol.current && replayFrames.current.length > 0) {
        const frame = replayFrames.current[Math.floor(replayIndex.current)];

        if (frame) {
          drawFrame(frame);
          replayIndex.current += 0.35;
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
      <div className="max-w-7xl mx-auto">
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
              width={1920}
              height={1080}
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

