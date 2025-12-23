'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- ZGŁASZANIE SPEEDTESTU ---
export async function submitSpeedtest(formData: FormData) {
  // Debug: Sprawdź w terminalu co przyszło
  console.log("📥 Server Action: submitSpeedtest", Object.fromEntries(formData));

  const operatorIdRaw = formData.get('operatorId');
  const downloadRaw = formData.get('download');
  const uploadRaw = formData.get('upload');
  const pingRaw = formData.get('ping');
  const location = formData.get('location') as string;
  const user = formData.get('user') as string;

  // Walidacja i konwersja
  if (!operatorIdRaw || !downloadRaw) {
    console.error("❌ Brak wymaganych danych speedtestu");
    return { error: 'Brak wymaganych danych' };
  }

  const operatorId = parseInt(operatorIdRaw.toString());
  const download = parseFloat(downloadRaw.toString());
  const upload = parseFloat(uploadRaw.toString()) || 0;
  const ping = parseInt(pingRaw?.toString() || '0');

  try {
    await prisma.operatorSpeedtest.create({
      data: {
        operator_id: operatorId,
        download_mbps: download,
        upload_mbps: upload,
        ping_ms: ping,
        miejscowosc: location || 'Nieznana',
        simc: '',
        source: 'user',
        zgloszenie_user: user || 'Anonim',
        zatwierdzone: false // Wymaga moderacji
      }
    });
    
    console.log("✅ Zapisano speedtest do bazy!");
    return { success: true, message: 'Wynik wysłany do weryfikacji!' };
  } catch (e) {
    console.error("❌ Błąd zapisu speedtestu:", e);
    return { error: 'Błąd bazy danych' };
  }
}

// --- ZGŁASZANIE AWARII ---
export async function submitOutage(formData: FormData) {
  console.log("📥 Server Action: submitOutage", Object.fromEntries(formData));

  const operatorIdRaw = formData.get('operatorId');
  const description = formData.get('description') as string;
  const location = formData.get('location') as string;
  const user = formData.get('user') as string;

  if (!operatorIdRaw || !description || !location) {
    return { error: 'Wypełnij wszystkie pola' };
  }

  const operatorId = parseInt(operatorIdRaw.toString());

  try {
    await prisma.operatorOutage.create({
      data: {
        operator_id: operatorId,
        miejscowosc: location,
        simc: '',
        opis: description,
        data_start: new Date(),
        status: 'aktywna',
        zgloszenie_user: user || 'Anonim',
        zatwierdzone: false
      }
    });
    
    console.log("✅ Zgłoszono awarię!");
    return { success: true, message: 'Awaria zgłoszona.' };
  } catch (e) {
    console.error("❌ Błąd zapisu awarii:", e);
    return { error: 'Nie udało się zgłosić awarii' };
  }
}