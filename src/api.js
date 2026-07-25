import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = (url && key) ? createClient(url, key) : null

async function saveTable(table, rows) {
  // Xóa toàn bộ rồi insert lại
  await supabase.from(table).delete().neq('id', '')
  if (rows.length > 0) {
    const { error } = await supabase.from(table).insert(rows)
    if (error) throw new Error(error.message)
  }
}

export const api = {
  getPackages: async () => {
    const { data, error } = await supabase.from('packages').select('*').order('created_at')
    if (error) throw new Error(error.message)
    return data ?? []
  },
  savePackages: (rows) => saveTable('packages', rows),

  getMembers: async () => {
    const { data, error } = await supabase.from('members').select('*').order('created_at')
    if (error) throw new Error(error.message)
    return data ?? []
  },
  saveMembers: (rows) => saveTable('members', rows),
}
