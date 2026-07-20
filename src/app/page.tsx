import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Guide from "@/components/Guide";
import { getApartment } from "@/data/apartments";
import { slugFromHost } from "@/lib/tenant";

export default async function Page() {
  // multi-apê por subdomínio: o slug vem do host (ex.: 1305c.anfyi.com.br → "1305c").
  // Sem subdomínio de marca (apex, *.vercel.app, localhost) cai no apê padrão.
  const host = (await headers()).get("host");
  const slug = slugFromHost(host);
  const apartment = getApartment(slug ?? undefined);
  if (!apartment) notFound(); // subdomínio de marca ainda sem apartamento cadastrado
  return <Guide apartment={apartment} />;
}
