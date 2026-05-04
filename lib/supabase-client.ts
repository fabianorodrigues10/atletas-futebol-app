import { createClient } from '@supabase/supabase-js'

// Use process.env for Expo (with EXPO_PUBLIC_ prefix)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

let supabase: ReturnType<typeof createClient> | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.error('Missing Supabase environment variables. Expected EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY')
}

export { supabase }

// Helper function to ensure supabase is initialized
export function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase not initialized. Check environment variables.')
  }
  return supabase
}

// Tipos para o banco de dados
export interface Atleta {
  id: number
  user_id: string
  nome: string
  posicao: string | null
  segunda_posicao: string | null
  clube: string | null
  data_nascimento: string | null
  idade: number | null
  altura: string | null
  pe: string | null
  valencia: string | null
  ogol_id: number | null
  created_at: string
  updated_at: string
}

export interface Midia {
  id: number
  atleta_id: number
  url: string | null
  descricao: string | null
  tipo: string | null
  created_at: string
}

// Funções auxiliares
export async function signUp(email: string, password: string) {
  const sb = getSupabase()
  return sb.auth.signUp({
    email,
    password,
  })
}

export async function signIn(email: string, password: string) {
  const sb = getSupabase()
  return sb.auth.signInWithPassword({
    email,
    password,
  })
}

export async function signOut() {
  const sb = getSupabase()
  return sb.auth.signOut()
}

export async function getCurrentUser() {
  const sb = getSupabase()
  const { data: { user } } = await sb.auth.getUser()
  return user
}

export async function getAtletas() {
  const user = await getCurrentUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  const sb = getSupabase()
  return sb
    .from('atletas')
    .select('*')
    .eq('user_id', user.id)
    .order('nome', { ascending: true })
}

export async function createAtleta(atleta: Omit<Atleta, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const user = await getCurrentUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const sb = getSupabase()
  return sb
    .from('atletas')
    .insert([{
      ...atleta,
      user_id: user.id,
    }])
    .select()
    .single()
}

export async function updateAtleta(id: number, updates: Partial<Atleta>) {
  const sb = getSupabase()
  return sb
    .from('atletas')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
}

export async function deleteAtleta(id: number) {
  const sb = getSupabase()
  return sb
    .from('atletas')
    .delete()
    .eq('id', id)
}

export async function getMidias(atletaId: number) {
  const sb = getSupabase()
  return sb
    .from('midias')
    .select('*')
    .eq('atleta_id', atletaId)
    .order('created_at', { ascending: false })
}

export async function createMidia(midia: Omit<Midia, 'id' | 'created_at'>) {
  const sb = getSupabase()
  return sb
    .from('midias')
    .insert([midia])
    .select()
    .single()
}

export async function deleteMidia(id: number) {
  const sb = getSupabase()
  return sb
    .from('midias')
    .delete()
    .eq('id', id)
}
