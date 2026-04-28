export const metadata = {
  title: "Campeonato",
  description: "Projeto de futebol",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}