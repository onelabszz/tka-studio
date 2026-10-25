/**
 * TKA Studio — lib/expert-workspace.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { getSupabase } from '../supabase/client.js';

export async function createWorkspace(userId, data) {
  const client = await getSupabase();
  const { data: result, error } = await client.from('expert_workspaces').insert({
    user_id: userId,
    judul: data.judul,
    mapel: data.mapel,
    kelas: data.kelas,
    topik: data.topik,
    target_soal: data.target_soal,
    soal_per_batch: data.soal_per_batch,
    teks_wacana: data.teks_wacana || null,
    tipe_fokus: data.tipe_fokus || 'campur',
    level_kognitif: data.level_kognitif || 'auto',
    kompetensi: data.kompetensi || null,
    sertakan_gambar: data.sertakan_gambar || false,
    status: 'draft',
    soal: []
  }).select().single();

  if (error) throw error;
  return result;
}

export async function getWorkspaces(userId) {
  const client = await getSupabase();
  const { data, error } = await client
    .from('expert_workspaces')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
}

export async function getWorkspaceById(id) {
  const client = await getSupabase();
  const { data, error } = await client
    .from('expert_workspaces')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
}

export async function updateWorkspaceSoal(id, soalBaru, status = null) {
  const client = await getSupabase();
  
  // Ambil data saat ini untuk digabung
  const current = await getWorkspaceById(id);
  const gabunganSoal = [...(current.soal || []), ...soalBaru];
  
  // Normalisasi ID soal agar urut s1, s2, s3...
  const reindexedSoal = gabunganSoal.map((s, i) => ({ ...s, id: `s${i + 1}` }));

  const updatePayload = {
    soal: reindexedSoal,
    updated_at: new Date().toISOString()
  };
  
  if (status) updatePayload.status = status;

  const { data, error } = await client
    .from('expert_workspaces')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTeksWacana(id, teks) {
  const client = await getSupabase();
  const { error } = await client
    .from('expert_workspaces')
    .update({ teks_wacana: teks, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteWorkspace(id) {
  const client = await getSupabase();
  const { error } = await client.from('expert_workspaces').delete().eq('id', id);
  if (error) throw error;
}
