import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  return supabase.auth.signUp({
    email,
    password,
  })
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getAtletas() {
  const user = await getCurrentUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  return supabase
    .from('atletas')
    .select('*')
    .eq('user_id', user.id)
    .order('nome', { ascending: true })
}

export async function createAtleta(atleta: Omit<Atleta, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const user = await getCurrentUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  return supabase
    .from('atletas')
    .insert([{
      ...atleta,
      user_id: user.id,
    }])
    .select()
    .single()
}

export async function updateAtleta(id: number, updates: Partial<Atleta>) {
  return supabase
    .from('atletas')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
}

export async function deleteAtleta(id: number) {
  return supabase
    .from('atletas')
    .delete()
    .eq('id', id)
}

export async function getMidias(atletaId: number) {
  return supabase
    .from('midias')
    .select('*')
    .eq('atleta_id', atletaId)
    .order('created_at', { ascending: false })
}

export async function createMidia(midia: Omit<Midia, 'id' | 'created_at'>) {
  return supabase
    .from('midias')
    .insert([midia])
    .select()
    .single()
}

export async function deleteMidia(id: number) {
  return supabase
    .from('midias')
    .delete()
    .eq('id', id)
}
