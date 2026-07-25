import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
// eslint-disable-next-line no-unused-vars
const supabase = (url && key) ? createClient(url, key) : null

// Bỏ created_at trước khi insert (auto-generated bởi Supabase)
function clean(row) {
  // eslint-disable-next-line no-unused-vars
  const { created_at, ...rest } = row
  return rest
}

async function saveTable(table, rows) {
  const { error: delErr } = await supabase.from(table).delete().neq('id', '')
  if (delErr) throw new Error(delErr.message)
  if (rows.length > 0) {
    const { error } = await supabase.from(table).insert(rows.map(clean))
    if (error) throw new Error(error.message)
  }
}

export const api = {
  getPackages: async () => {
    const { data, error } = await supabase.from('packages').select('*').order('created_at')
    if (error) throw new Error(error.message)
    return (data ?? []).map(p => ({ ...p, cost: Number(p.cost) || 0 }))
  },
  savePackages: (rows) => saveTable('packages', rows),

  getMembers: async () => {
    const { data, error } = await supabase.from('members').select('*').order('created_at')
    if (error) throw new Error(error.message)
    return (data ?? []).map(m => ({
      ...m,
      paymentAmount: Number(m.paymentAmount) || 0,
      totalPaid: Number(m.totalPaid) || 0,
      packageId: m.packageId ?? '',
      archived: m.archived === true,   // đảm bảo boolean, không phải string
    }))
  },
  saveMembers: (rows) => saveTable('members', rows),
}
