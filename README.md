# 🏆 Campeonato 2D no SENAI (Liga dos Campeões)

[![Acessar o Jogo](https://img.shields.io/badge/Jogar_Agora-Acessar_Site-success?style=for-the-badge&logo=vercel)](https://campeonato-2-d-no-senai-sffk-lay4yl713-gabryel-senais-projects.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

Bem-vindo ao **Campeonato 2D no SENAI**, um simulador interativo de **futebol de botão digital**. Girando em torno da clássica mecânica de botões, aqui você pode gerenciar o seu time, disputar campeonatos completos, jogar online com amigos e acompanhar todas as estatísticas em tempo real!

---

## 🌟 Sobre o Projeto e a sua História

Este projeto nasceu como um desafio acadêmico no curso de **JavaScript com IA do SENAI**. O objetivo inicial do professor era criar uma estrutura base, mas o projeto evoluiu muito além disso. 

Hoje, é uma plataforma completa que une a nostalgia do **clássico futebol de botão (jogo 2D)** com tecnologias modernas de desenvolvimento web. O sistema conta com inteligência artificial para simular partidas automaticamente e um banco de dados em nuvem para guardar o progresso dos campeonatos e permitir partidas online entre diferentes jogadores.

---

## 🎓 Formação e Aplicação de IA

As mecânicas avançadas e a simulação deste projeto foram diretamente fundamentadas nos conhecimentos adquiridos no curso de **Inteligências Artificiais Generativas Aplicada à Programação - ChatGPT**, realizado no SENAI com duração de 48 horas. 

Através das competências desenvolvidas nesta formação, este projeto aplica:
* **Estruturação e codificação de soluções utilizando IA**: Essencial para a criação do modo autônomo "Simular Partida" (IA vs IA).
* **Refatoração e correção de erros (Scripts, Builds e Deploys)**: Utilização de IA generativa para otimizar o código do jogo, melhorando o desempenho da física dos botões e a arquitetura da aplicação.
* **Raciocínio lógico e atenção aos detalhes**: Habilidades aplicadas na construção complexa da tabela de classificação, cálculo de saldo de gols e cruzamento de chaves eliminatórias.

---

## 🎮 Como Funciona? (Modos de Jogo e Funcionalidades)

A plataforma possui um painel super completo (estilo as telas principais da franquia FIFA/EA FC). Aqui está a explicação detalhada de cada funcionalidade:

### 📊 1. Ver Campeonato (Modo Liga)
Funciona como o "Brasileirão". É um campeonato de pontos corridos com **8 times**.
* **A Tabela:** Mostra em tempo real a Posição, Nome do Time, Pontos, Vitórias, Empates, Derrotas, Gols Pró (feitos), Gols Contra (sofridos) e o Saldo de Gols.
* **Dinâmica:** Você pode acompanhar a evolução rodada a rodada e ver quem será o grande campeão com base na consistência ao longo de todos os jogos.

### 👥 2. Crie o seu Campeonato com Amigos
Em vez de jogar contra o computador, chame a sua galera para o gramado de mesa!
* **Como funciona:** Você cria as chaves do campeonato e a tabela, mas cada time (cada conjunto de botões) será controlado por um amigo seu de verdade. 
* É o modo perfeito para fazer torneios presenciais ou organizados online, onde a habilidade de cada amigo define quem sobe na classificação.

### 🏆 3. Copa Mata-Mata
O clássico modo eliminatório, no melhor estilo Copa do Mundo ou Champions League.
* **As Chaves:** O sistema sorteia os confrontos. Quem ganha passa para a fase seguinte (Fase 1 ➡️ Fase 2 ➡️ Fase 3 ➡️ Grande Final). Quem perde é eliminado.
* O campeão recebe uma comemoração especial na tela final!

### 🔗 4. Jogar Online com Amigo (Modo 1 vs 1)
Quer resolver uma rivalidade rápida numa mesa de futebol de botão virtual sem precisar criar um campeonato inteiro?
* **Como funciona:** Você escolhe o seu time, o sistema gera um **Link Exclusivo**, e você envia esse link para o seu amigo.
* Assim que ele entrar, vocês jogam uma partida de **futebol de botão 2D em tempo real**, cada um no seu computador, arrastando e chutando os seus botões rumo ao gol.

### 🤖 5. Simular Partida (IA vs IA)
Se quer apenas assistir ou precisa adiantar algumas rodadas do campeonato, o modo de simulação resolve isso.
* O sistema utiliza algoritmos automáticos (IA) para calcular o andamento da partida e gerar um resultado aleatório e dinâmico, simulando o embate tático sem que ninguém precise controlar os botões.

---

## 🛠️ Tecnologias Utilizadas (A Magia por Trás)

Para fazer tudo isto funcionar em tempo real, com a física de colisão correta para os botões e de forma fluida, foram utilizadas as seguintes tecnologias:

* **[Next.js](https://nextjs.org/):** Framework React que constrói toda a interface do usuário (UI), rotas e a experiência imersiva que vê na tela.
* **JavaScript / Lógica 2D:** Responsável por toda a **física, atrito e movimentação do nosso futebol de botão**, além de gerenciar a lógica matemática do torneio.
* **Inteligência Artificial:** Aplicação de IA generativa e lógica autônoma para simulação de jogos e otimização de código.
* **[Supabase](https://supabase.com/):** O nosso banco de dados em nuvem. É ele que armazena quem ganhou, saldo de gols, chaves da Copa e permite a conexão P2P (jogador contra jogador) no modo online.

---
🏗️ Arquitetura do Projeto
---
O projeto é dividido em duas partes principais: o Front-end (Next.js) e o Banco de Dados (PostgreSQL). Abaixo está a estrutura detalhada de ambos.

1. Estrutura de Diretórios (Código-fonte)

° app/page.js: Tela inicial e lógica principal do simulador do campeonato e tabela de classificação.

° app/jogo-online/page.js: Interface dedicada para as partidas, animações e mecânicas do jogo online.

° public/escudos/: Diretório contendo os recursos visuais e imagens PNG/SVG dos escudos dos times.

° schema.sql: Script de inicialização estrutural para criar as tabelas no banco de dados e inserir os times iniciais.

2. Estrutura do Banco de Dados

O banco de dados é composto por duas tabelas principais que se relacionam para formar o campeonato:

Tabela: times
Armazena as informações e o desempenho de cada equipe no campeonato.

° id (Primary Key): Identificador único do time.

° nome (Text): Nome do clube (ex: Corinthians, Palmeiras).

° cor (Text): Código hexadecimal da cor do time.

° pontos, vitorias, empates, derrotas: Estatísticas de pontuação (Iniciam em 0).

° gols_pro, gols_contra: Saldo de gols do time (Iniciam em 0).

Tabela: partidas: Registra os confrontos, quem jogou e o placar final.

° id (Primary Key): Identificador único da partida.

° time_casa (Foreign Key): ID do time mandante (referencia a tabela times).

° time_fora (Foreign Key): ID do time visitante (referencia a tabela times).

° gols_casa, gols_fora: Placar do jogo.

° status: Define se o jogo está em andamento ou finalizado (Padrão: 'finalizada').

(Nota: O banco possui ON DELETE CASCADE, garantindo que se um time for excluído, seu histórico de partidas também será apagado de forma segura).
---
## 🚀 Como Executar o Projeto na Sua Máquina

Se você é desenvolvedor e quer rodar este projeto localmente, siga os passos abaixo:

**1. Clone este repositório:**
```bash
git clone https://github.com/Gabryel-Senai/Campeonato-2D-no-SENAI.git
```

**2. Acesse a pasta do projeto:**
```bash
cd Campeonato-2D-no-SENAI
```

**3. Instale as dependências (Node.js necessário):**
```bash
npm install
```

**4. Configure o Banco de Dados (Supabase):**
* Crie um arquivo chamado `.env.local` na raiz do projeto.
* Adicione as suas chaves do Supabase (URL e API Key) conforme a documentação.

**5. Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```
* Agora é só abrir `http://localhost:3000` no seu navegador e preparar os dedos para o futebol de botão! ⚽

---

## 👨‍💻 Autor

Criado e desenvolvido por **Gabryel Meirelles Batista**. 
Apoio e formação: SENAI SP.

*Gostou do projeto? Deixe uma ⭐ neste repositório!*
