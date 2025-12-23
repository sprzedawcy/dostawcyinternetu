import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- SERVER ACTIONS (możesz je wynieść do osobnego pliku, ale tu będzie szybciej) ---
async function approveSpeedtest(formData: FormData) {
  "use server";
  const id = parseInt(formData.get("id") as string);
  await prisma.operatorSpeedtest.update({ where: { id }, data: { zatwierdzone: true } });
  revalidatePath("/admin/zgloszenia");
}

async function deleteSpeedtest(formData: FormData) {
  "use server";
  const id = parseInt(formData.get("id") as string);
  await prisma.operatorSpeedtest.delete({ where: { id } });
  revalidatePath("/admin/zgloszenia");
}

async function approveOutage(formData: FormData) {
  "use server";
  const id = parseInt(formData.get("id") as string);
  await prisma.operatorOutage.update({ where: { id }, data: { zatwierdzone: true } });
  revalidatePath("/admin/zgloszenia");
}

async function deleteOutage(formData: FormData) {
  "use server";
  const id = parseInt(formData.get("id") as string);
  await prisma.operatorOutage.delete({ where: { id } });
  revalidatePath("/admin/zgloszenia");
}
// --------------------------------------------------------------------------------

export default async function ZgloszeniaPage() {
  // Pobieramy TYLKO niezatwierdzone (do moderacji)
  const pendingSpeedtests = await prisma.operatorSpeedtest.findMany({
    where: { zatwierdzone: false },
    include: { operator: true },
    orderBy: { data_zgloszenia: 'desc' }
  });

  const pendingOutages = await prisma.operatorOutage.findMany({
    where: { zatwierdzone: false },
    include: { operator: true },
    orderBy: { data_zgloszenia: 'desc' }
  });

  return (
    <div className="space-y-12">
      <h1 className="text-2xl font-bold text-gray-900">Zgłoszenia użytkowników do moderacji</h1>

      {/* SEKCJA 1: SPEEDTESTY */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          🚀 Speedtesty <span className="text-sm font-normal text-gray-500">({pendingSpeedtests.length})</span>
        </h2>
        
        {pendingSpeedtests.length === 0 ? (
          <p className="text-gray-400 italic">Brak nowych wyników do sprawdzenia.</p>
        ) : (
          <div className="space-y-4">
            {pendingSpeedtests.map((item) => (
              <div key={item.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gray-50 rounded-lg border border-gray-100 gap-4">
                <div>
                  <div className="font-bold text-blue-600">{item.operator.nazwa}</div>
                  <div className="text-sm text-gray-700">
                    DL: <strong>{item.download_mbps}</strong> Mb/s | 
                    UL: <strong>{item.upload_mbps}</strong> Mb/s | 
                    Ping: <strong>{item.ping_ms}</strong> ms
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Lokalizacja: {item.miejscowosc} • User: {item.zgloszenie_user || 'Anonim'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <form action={approveSpeedtest}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Zatwierdź</button>
                  </form>
                  <form action={deleteSpeedtest}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="bg-red-100 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-200">Usuń</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SEKCJA 2: AWARIE */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          ⚠️ Awarie <span className="text-sm font-normal text-gray-500">({pendingOutages.length})</span>
        </h2>

        {pendingOutages.length === 0 ? (
          <p className="text-gray-400 italic">Brak zgłoszonych awarii.</p>
        ) : (
          <div className="space-y-4">
            {pendingOutages.map((item) => (
              <div key={item.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-red-50 rounded-lg border border-red-100 gap-4">
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{item.operator.nazwa}</div>
                  <div className="text-sm font-medium text-red-800 mt-1">"{item.opis}"</div>
                  <div className="text-xs text-gray-500 mt-2">
                    Lokalizacja: {item.miejscowosc} • User: {item.zgloszenie_user || 'Anonim'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <form action={approveOutage}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Zatwierdź</button>
                  </form>
                  <form action={deleteOutage}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="bg-white border border-red-200 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-50">Odrzuć</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}