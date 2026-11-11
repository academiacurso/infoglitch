import type { ReactNode } from "react";

export const metadata = {
  title: "infoglitch playground",
  description: "Genera infografías de programación con IA",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
