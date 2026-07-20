import { notFound } from "next/navigation";
import Guide from "@/components/Guide";
import { DEFAULT_SLUG, getApartment } from "@/data/apartments";

export default function Page() {
  // multi-apê pronto: por ora fixa o slug padrão; no futuro vem do host/rota.
  const apartment = getApartment(DEFAULT_SLUG);
  if (!apartment) notFound();
  return <Guide apartment={apartment} />;
}
