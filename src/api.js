const BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL

async function fetchSheet(sheet) {
  const res = await fetch(`${BASE_URL}?sheet=${sheet}`)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error)
  return json.data
}

async function saveSheet(sheet, data) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    body: JSON.stringify({ sheet, data }),
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error)
}

export const api = {
  getPackages: () => fetchSheet('Packages'),
  savePackages: (data) => saveSheet('Packages', data),
  getMembers: () => fetchSheet('Members'),
  saveMembers: (data) => saveSheet('Members', data),
}
