import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const stats = {
    operatorzy: await prisma.operator.count(),
    oferty: await prisma.oferta.count(),
    leady: await prisma.lead.count(),
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Operatorzy"
          value={stats.operatorzy}
          icon="📡"
          href="/admin/operatorzy"
        />
        <StatCard
          title="Oferty"
          value={stats.oferty}
          icon="💰"
          href="/admin/oferty"
        />
        <StatCard
          title="Leady"
          value={stats.leady}
          icon="📧"
          href="/admin/leady"
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, href }: any) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </Link>
  );
}
