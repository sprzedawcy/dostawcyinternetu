import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // LOGOWANIE - sprawdzamy co przychodzi
    console.log("=== LEAD DATA ===");
    console.log(JSON.stringify(body, null, 2));
    console.log("=================");
    
    const { imie_nazwisko, telefon, email, oferta_id, operator_id, miejscowosc, ulica, nr, upominek, zrodlo } = body;
    
    if (!imie_nazwisko || !telefon || !email) {
      return NextResponse.json({ error: "Brakuje wymaganych pol" }, { status: 400 });
    }
    
    const lead = await prisma.lead.create({
      data: {
        imie_nazwisko,
        telefon,
        email,
        oferta_id: oferta_id ? parseInt(oferta_id) : null,
        operator_id: operator_id ? parseInt(operator_id) : null,
        miejscowosc: miejscowosc || null,
        ulica: ulica || null,
        nr: nr || null,
        upominek,
        zrodlo: zrodlo || "strona",
        status: "nowy"
      },
      include: {
        operator: { select: { nazwa: true, email_handlowca: true } },
        oferta: { select: { nazwa: true } }
      }
    });
    
    await sendNotification(lead);
    
    return NextResponse.json({ success: true, id: lead.id });
    
  } catch (error) {
    console.error("Blad zapisu leada:", error);
    return NextResponse.json({ error: "Blad serwera" }, { status: 500 });
  }
}

async function sendNotification(lead: any) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  
  const adminUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/admin/sprzedaz/${lead.id}`;
  
  const mailContent = `
Nowy lead #${lead.id}

Miejscowosc: ${lead.miejscowosc || "nie podano"}
Operator: ${lead.operator?.nazwa || "nie przypisano"}
Oferta: ${lead.oferta?.nazwa || "nie wybrano"}

Zobacz szczegoly: ${adminUrl}

---
DostawcyInternetu.pl
  `.trim();
  
  const recipients = ["kontakt@dostawcyinternetu.pl"];
  
  if (lead.operator?.email_handlowca) {
    recipients.push(lead.operator.email_handlowca);
  }
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@dostawcyinternetu.pl",
      to: recipients.join(", "),
      subject: `Nowy lead z ${lead.miejscowosc || "strony"} - ${lead.operator?.nazwa || "DostawcyInternetu"}`,
      text: mailContent,
    });
  } catch (emailError) {
    console.error("Blad wysylania emaila:", emailError);
  }
}
