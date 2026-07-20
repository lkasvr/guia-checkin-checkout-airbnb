import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anfyi · Guias digitais para anfitriões",
  description:
    "Guias de hospedagem bonitos e bilíngues para o seu apartamento — check-in, Wi-Fi, regras e dicas locais, tudo em um link.",
  robots: { index: true, follow: true },
};

export default function Marketing() {
  return (
    <main className="mx-auto flex min-h-svh max-w-[720px] flex-col items-center justify-center px-6 text-center">
      <p className="text-[12px] font-bold uppercase tracking-[0.34em] text-coffee">
        Anfyi
      </p>
      <h1 className="mt-4 font-display text-[clamp(44px,10vw,72px)] font-normal leading-[1.02]">
        Guias digitais para <span className="text-terra">anfitriões</span>
      </h1>
      <p className="mt-5 max-w-[46ch] text-[17px] text-soft">
        Um link elegante e bilíngue para cada apartamento: check-in, Wi-Fi,
        regras da casa e dicas locais — sempre à mão do seu hóspede.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <a
          href="https://app.anfyi.com.br"
          className="rounded-full border-[1.5px] border-ink bg-ink px-7 py-3.5 text-[15.5px] font-bold text-bg no-underline transition-transform active:scale-95"
        >
          Área do anfitrião
        </a>
        <a
          href="https://1305c.anfyi.com.br"
          className="rounded-full border-[1.5px] border-ink bg-transparent px-7 py-3.5 text-[15.5px] font-bold text-ink no-underline transition-transform active:scale-95"
        >
          Ver um exemplo
        </a>
      </div>
    </main>
  );
}
