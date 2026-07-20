import type { Metadata, Viewport } from "next";
import { Prata } from "next/font/google";
import "./globals.css";

const prata = Prata({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-prata",
  display: "swap",
});

const DESC_PT =
  "Check-in, Wi-Fi, regras da casa e dicas de Brasília — o guia completo do Apartamento 1305C, Residencial DF Plaza, Águas Claras.";
const DESC_SHARE =
  "Check-in, Wi-Fi, regras da casa e dicas de Brasília — tudo o que você precisa na chegada, em PT e EN.";

export const metadata: Metadata = {
  metadataBase: new URL("https://1305c.anfyi.com.br"),
  title: "Guia da Casa · Ap 1305C",
  description: DESC_PT,
  applicationName: "Guia da Casa · Ap 1305C",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    url: "https://1305c.anfyi.com.br",
    siteName: "Guia da Casa · Ap 1305C",
    title: "Guia da Casa · Apartamento 1305C",
    description: DESC_SHARE,
    locale: "pt_BR",
    alternateLocale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guia da Casa · Apartamento 1305C",
    description: DESC_SHARE,
  },
  appleWebApp: {
    capable: true,
    title: "Ap 1305C",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf5ee",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={prata.variable}>
      <body>{children}</body>
    </html>
  );
}
