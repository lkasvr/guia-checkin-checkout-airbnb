import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ApartmentWizard } from "@/app/admin/apartments/wizard";

export const dynamic = "force-dynamic";

export default async function NewApartmentPage({
  searchParams,
}: {
  searchParams: Promise<{ hostId?: string }>;
}) {
  const { hostId } = await searchParams;
  if (!hostId) notFound();

  const host = await prisma.user.findFirst({
    where: { id: hostId, role: "HOST" },
    select: { id: true, name: true, email: true },
  });
  if (!host) notFound();

  return <ApartmentWizard mode="create" hostId={host.id} hostName={host.name ?? host.email} />;
}
