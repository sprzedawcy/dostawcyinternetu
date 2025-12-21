import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LeadDetails from "./LeadDetails";

export const dynamic = 'force-dynamic';

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const lead = await prisma.lead.findUnique({
    where: { id: parseInt(id) },
    include: {
      operator: { select: { id: true, nazwa: true, slug: true } },
      oferta: { select: { id: true, nazwa: true, custom_url: true } },
      kontakty: { orderBy: { data: 'desc' } }
    }
  });

  if (!lead) {
    notFound();
  }

  const serializedLead = JSON.parse(JSON.stringify(lead));

  return <LeadDetails lead={serializedLead} />;
}
