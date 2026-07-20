import type { Metadata, Viewport } from "next";
import { Prata } from "next/font/google";
import "./globals.css";

const prata = Prata({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-prata",
  display: "swap",
});

// Metadata NEUTRO da marca — cada guia (/s/[slug]) sobrescreve com o seu via
// generateMetadata. Assim nenhuma página herda a identidade de um apartamento.
export const metadata: Metadata = {
  metadataBase: new URL("https://anfyi.com.br"),
  title: {
    default: "Anfyi · Guias digitais para anfitriões",
    template: "%s · Anfyi",
  },
  description:
    "Guias de hospedagem bonitos e bilíngues para o seu apartamento — check-in, Wi-Fi, regras e dicas locais, em um único link.",
  applicationName: "Anfyi",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "Anfyi",
    locale: "pt_BR",
    alternateLocale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Anfyi", statusBarStyle: "default" },
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
