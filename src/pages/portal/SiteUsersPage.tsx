import { useCallback, useEffect, useState } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { Copy, Pencil, ShieldOff, Trash2 } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

type RoleOption = { id: number; name: string }

export type SiteUserRow = {
  user_id: string
  email: string
  display_name: string
  role_id: number | null
  role_name: string | null
  roles: { role_id: number; role_name: string }[]
}

type ListResponse = {
  users: SiteUserRow[]
  page: number
  perPage: number
  roles: RoleOption[]
}

async function invokeAdmin<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<{ ok: true; data: T } | { ok: false; error: string; forbidden?: boolean }> {
  if (!supabase) {
    return { ok: false, error: 'Supabase is not configured.' }
  }
  const { data, error } = await supabase.functions.invoke('admin-site-users', {
    body: { action, ...payload },
  })

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const status = error.context.status
      try {
        const j = (await error.context.json()) as { error?: string }
        const msg = j.error ?? error.message
        return { ok: false, error: msg, forbidden: status === 403 }
      } catch {
        return { ok: false, error: error.message, forbidden: status === 403 }
      }
    }
    return { ok: false, error: error.message }
  }

  if (data && typeof data === 'object' && data !== null && 'error' in data) {
    return { ok: false, error: String((data as { error: string }).error) }
  }

  return { ok: true, data: data as T }
}

function truncateId(id: string) {
  if (id.length <= 12) return id
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

export function SiteUsersPage() {
  const [rows, setRows] = useState<SiteUserRow[]>([])
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [editUser, setEditUser] = useState<SiteUserRow | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editName, setEditName] = useState('')

  const [roleUser, setRoleUser] = useState<SiteUserRow | null>(null)
  const [rolePick, setRolePick] = useState<number>(5)

  const [removeTarget, setRemoveTarget] = useState<SiteUserRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SiteUserRow | null>(null)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      setError('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to use this page.')
      return
    }
    setLoading(true)
    setError(null)
    setForbidden(false)
    const res = await invokeAdmin<ListResponse>('list', { page: 1, perPage: 100 })
    setLoading(false)
    if (!res.ok) {
      if (res.forbidden) setForbidden(true)
      else setError(res.error)
      setRows([])
      setRoleOptions([])
      return
    }
    setRows(res.data.users)
    setRoleOptions(res.data.roles.map(r => ({ id: r.id, name: r.name })))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const copyId = (id: string) => {
    void navigator.clipboard.writeText(id)
    setNotice('User ID copied.')
    setTimeout(() => setNotice(null), 2000)
  }

  const openEdit = (u: SiteUserRow) => {
    setEditUser(u)
    setEditEmail(u.email)
    setEditName(u.display_name)
  }

  const submitEdit = async () => {
    if (!editUser) return
    setBusy(true)
    setNotice(null)
    const res = await invokeAdmin('update_profile', {
      target_user_id: editUser.user_id,
      email: editEmail.trim(),
      display_name: editName.trim(),
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setEditUser(null)
    setNotice('Profile updated.')
    await load()
  }

  const openRole = (u: SiteUserRow) => {
    setRoleUser(u)
    setRolePick(u.role_id ?? 5)
  }

  const submitRole = async () => {
    if (!roleUser) return
    setBusy(true)
    setNotice(null)
    const res = await invokeAdmin('set_role', {
      target_user_id: roleUser.user_id,
      role_id: rolePick,
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setRoleUser(null)
    setNotice('Role updated.')
    await load()
  }

  const submitRemoveRole = async () => {
    if (!removeTarget) return
    setBusy(true)
    setNotice(null)
    const res = await invokeAdmin('remove_role', {
      target_user_id: removeTarget.user_id,
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setRemoveTarget(null)
    setNotice('Role assignment removed.')
    await load()
  }

  const submitDelete = async () => {
    if (!deleteTarget) return
    if (deleteConfirmEmail.trim().toLowerCase() !== deleteTarget.email.toLowerCase()) {
      setError('Email does not match. Type the user’s email to confirm deletion.')
      return
    }
    setBusy(true)
    setNotice(null)
    const res = await invokeAdmin('delete_account', {
      target_user_id: deleteTarget.user_id,
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setDeleteTarget(null)
    setDeleteConfirmEmail('')
    setNotice('Account deleted.')
    await load()
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        <p className="text-sm text-[var(--wt-text-2)]">Supabase environment variables are not set.</p>
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-8 text-center max-w-lg mx-auto">
        <p className="text-sm uppercase tracking-widest text-[var(--wt-accent)] font-medium mb-2">
          Site Users
        </p>
        <h2 className="text-lg font-semibold text-[var(--wt-text)] mb-2">Admins only</h2>
        <p className="text-sm text-[var(--wt-text-2)]">
          Your account does not have the admin role in the database. Site user management is restricted to
          administrators.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--wt-text)]">Site Users</h1>
        <p className="text-sm text-[var(--wt-text-2)] mt-1">
          Manage accounts, display names, and role assignments. Changes apply through secure server functions.
        </p>
      </div>

      {notice && (
        <div className="rounded-lg border border-[color-mix(in_srgb,var(--wt-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--wt-accent)_12%,transparent)] px-4 py-2 text-sm text-[var(--wt-text)]">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-[#dc2626]/40 bg-[#dc2626]/10 px-4 py-2 text-sm text-[#dc2626] flex justify-between gap-4 items-center">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 text-xs font-semibold uppercase tracking-wide hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-[var(--wt-text-2)] text-sm">
            <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
            Loading users…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--wt-border)] text-[var(--wt-text-2)] uppercase text-[10px] tracking-widest">
                  <th className="px-4 py-3 font-medium">User ID</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Display name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(u => (
                  <tr
                    key={u.user_id}
                    className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-[var(--wt-text)]">{truncateId(u.user_id)}</code>
                        <button
                          type="button"
                          onClick={() => copyId(u.user_id)}
                          className="p-1 rounded text-[var(--wt-text-2)] hover:text-[var(--wt-accent)]"
                          aria-label="Copy user ID"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--wt-text)]">{u.email || '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)]">{u.display_name || '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)]">
                      {u.role_name ?? (u.roles.length === 0 ? '—' : u.roles.map(r => r.role_name).join(', '))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--wt-text-2)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_22%,transparent)] hover:text-[var(--wt-text)]"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openRole(u)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--wt-text-2)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_22%,transparent)] hover:text-[var(--wt-text)]"
                        >
                          Role
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemoveTarget(u)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--wt-text-2)] hover:bg-[color-mix(in_srgb,#dc2626_12%,transparent)] hover:text-[#dc2626]"
                        >
                          <ShieldOff size={14} /> Remove role
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget(u)
                            setDeleteConfirmEmail('')
                          }}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--wt-text-2)] hover:bg-[color-mix(in_srgb,#dc2626_12%,transparent)] hover:text-[#dc2626]"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="text-sm text-[var(--wt-text-2)] px-4 py-8 text-center">No users returned.</p>
            )}
          </div>
        )}
      </div>

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--wt-text)] mb-4">Edit user</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--wt-text-2)] mb-1">
                  Email
                </label>
                <input
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  type="email"
                  className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--wt-text-2)] mb-1">
                  Display name
                </label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  type="text"
                  className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--wt-text-2)] hover:text-[var(--wt-text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitEdit()}
                className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {roleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--wt-text)] mb-4">Assign role</h3>
            <p className="text-xs text-[var(--wt-text-2)] mb-3">
              Replaces existing role rows for this user with a single assignment.
            </p>
            <select
              value={rolePick}
              onChange={e => setRolePick(Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]"
            >
              {roleOptions.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.id})
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setRoleUser(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--wt-text-2)] hover:text-[var(--wt-text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || roleOptions.length === 0}
                onClick={() => void submitRole()}
                className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] disabled:opacity-60"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--wt-text)] mb-2">Remove role assignment</h3>
            <p className="text-sm text-[var(--wt-text-2)] mb-6">
              Clear all <code className="text-xs">user_roles</code> rows for{' '}
              <strong className="text-[var(--wt-text)]">{removeTarget.email}</strong>. The auth account remains.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--wt-text-2)] hover:text-[var(--wt-text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitRemoveRole()}
                className="rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                Remove roles
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--wt-text)] mb-2">Delete account</h3>
            <p className="text-sm text-[var(--wt-text-2)] mb-3">
              Permanently delete the auth user for{' '}
              <strong className="text-[var(--wt-text)]">{deleteTarget.email}</strong>. This cannot be undone.
            </p>
            <p className="text-xs text-[var(--wt-text-2)] mb-2">Type the user&apos;s email to confirm:</p>
            <input
              value={deleteConfirmEmail}
              onChange={e => setDeleteConfirmEmail(e.target.value)}
              type="email"
              placeholder={deleteTarget.email}
              className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)] mb-6"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null)
                  setDeleteConfirmEmail('')
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--wt-text-2)] hover:text-[var(--wt-text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitDelete()}
                className="rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
