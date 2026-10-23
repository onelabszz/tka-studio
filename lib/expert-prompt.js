/**
 * TKA Studio — lib/expert-prompt.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { buildPrompt } from './prompt-template.js';

export function buildExpertPrompt(workspace, batchTarget, tipeSoal = 'campur') {
  const { mapel, kelas, topik, teks_wacana, soal } = workspace;
  
  // Ambil teks soal yang sudah ada agar AI tidak menduplikasi
  const soalTerdahulu = (soal || []).map((s, i) => {
    return `${i + 1}. [${s.tipe.toUpperCase()}] ${s.q.substring(0, 80)}... (Kunci: ${JSON.stringify(s.key)})`;
  }).join('\n');

  const konteksWacana = teks_wacana 
    ? `=== TEKS WACANA ACUAN ===\n"${teks_wacana}"\n\nSEMUA SOAL WAJIB MENGACU PADA TEKS DI ATAS.\n` 
    : '';

  const konteksDuplikasi = soalTerdahulu 
    ? `=== SOAL YANG SUDAH ADA (JANGAN BUAT SOAL YANG MIRIP/DUPLIKAT) ===\n${soalTerdahulu}\n` 
    : '';

  const tipeInstruksi = tipeSoal === 'campur' 
    ? 'Buat campuran tipe soal (PG, MCMA, BS).'
    : `SEMUA soal di batch ini HARUS bertipe "${tipeSoal}".`;

  // Base prompt dari template kita, tapi kita override dengan instruksi Expert
  const base = buildPrompt({
    mapel, kelas, topik,
    pg: tipeSoal === 'pg' ? batchTarget : 0,
    mcma: tipeSoal === 'mcma' ? batchTarget : 0,
    bs: tipeSoal === 'bs' ? batchTarget : 0,
    // Jika campur, kita biarkan AI membagi rata
    instruksiTambahan: 'Fokus pada kualitas tingkat tinggi (HOTS).'
  });

  // Sisipkan konteks Expert ke dalam prompt
  return `Anda adalah mesin pembuat soal TKA profesional. Anda sedang membantu guru menyusun soal secara bertahap.

${konteksWacana}
${konteksDuplikasi}

=== TUGAS BATCH INI ===
Buat TEPAT ${batchTarget} soal BARU.
${tipeInstruksi}
Topik: ${topik || 'Umum'}.

=== INSTRUKSI TEKNIS ===
1. JANGAN mengulang soal yang sudah ada di daftar "SOAL YANG SUDAH ADA".
2. Pastikan distribusi kunci jawaban (A, B, C, D) seimbang.
3. Berikan pembahasan yang mendidik.

${base.split('=== SPESIFIKASI SOAL ===')[1] || base}
`;
}
