/**
 * TKA Studio — lib/exam-share.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { getSupabase } from '../supabase/client.js';

export async function publishExamToGithub(userId, judul, paketJson) {
  const client = await getSupabase();
  
  // Panggil Edge Function untuk upload ke GitHub
  const { data, error } = await client.functions.invoke('publish-exam', {
    body: { paketJson }
  });

  if (error) throw error;
  if (data.error) throw new Error(data.error);

  // Simpan Kode ke Database Supabase (hanya teks, sebagai arsip guru)
  const { data: dbData, error: dbError } = await client.from('exams').insert({
    user_id: userId,
    code: data.code,
    judul: judul
  }).select().single();

  if (dbError) throw dbError;
  return dbData;
}
