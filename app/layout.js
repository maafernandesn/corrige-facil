export const metadata = {
  title: "CorrigeFácil",
  description: "App de correção de provas com IA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body style={{ margin: 0, fontFamily: "Arial" }}>
        {children}
      </body>
    </html>
  );
}
