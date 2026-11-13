async function request(method, path, body) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    // An expired Cloudflare Access session redirects to the login page on
    // another origin, which fetch reports as a network error.
    throw new Error('Could not reach the server. If your session expired, reload the page.')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const detail = data?.issues?.map((i) => `${i.path}: ${i.message}`).join('; ')
    throw new Error(detail || data?.error || `${res.status} ${res.statusText}`)
  }
  return res.status === 204 ? null : res.json()
}

export const api = {
  listArrangements: () => request('GET', '/arrangements').then((r) => r.arrangements),
  getArrangement: (id) => request('GET', `/arrangements/${id}`).then((r) => r.arrangement),
  createArrangement: (data) => request('POST', '/arrangements', data).then((r) => r.arrangement),
  updateArrangement: (id, data) => request('PUT', `/arrangements/${id}`, data).then((r) => r.arrangement),
  deleteArrangement: (id) => request('DELETE', `/arrangements/${id}`),

  listSetlists: () => request('GET', '/setlists').then((r) => r.setlists),
  getSetlist: (id) => request('GET', `/setlists/${id}`).then((r) => r.setlist),
  createSetlist: (data) => request('POST', '/setlists', data).then((r) => r.setlist),
  updateSetlist: (id, data) => request('PUT', `/setlists/${id}`, data).then((r) => r.setlist),
  setSetlistArchived: (id, archived) => request('PUT', `/setlists/${id}/archived`, { archived }).then((r) => r.setlist),
  saveSetlistItems: (id, items) => request('PUT', `/setlists/${id}/items`, { items }).then((r) => r.setlist),
  deleteSetlist: (id) => request('DELETE', `/setlists/${id}`),
}
