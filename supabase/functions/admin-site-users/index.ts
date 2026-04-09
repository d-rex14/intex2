/**
 * Browser callers: `getSession()`, then POST with JSON `body: { action: '…' }`, header
 * `Authorization: Bearer <access_token>`, and (recommended) `X-Supabase-Access-Token: <same_jwt>`
 * plus `apikey: <anon/publishable key>` so the gateway accepts the request.
 *
 * This Edge handler runs on Deno (not Node): use `Deno.env`, not `process.env`. It does not
 * call `invoke` on itself. Identity is the incoming Bearer access JWT, validated with the
 * service-role client via `auth.getUser(jwt)` — not `SUPABASE_ANON_KEY` / anon client here.
 */
import {
  createClient,
  type SupabaseClient,
  type User,
} from "npm:@supabase/supabase-js"

type UserMetadata = Record<string, unknown>

function displayNameFromUser(user: { user_metadata?: UserMetadata | null }): string {
  const m = user.user_metadata ?? {}
  const v = m.full_name ?? m.name ?? m.display_name
  return typeof v === "string" ? v : ""
}

function corsHeaders(req: Request): Record<string, string> {
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const origin = req.headers.get("Origin") ?? ""
  const wildcard = allowed.includes("*")
  // Echo caller origin when explicitly allowed (or wildcard enabled) so browser CORS preflight succeeds.
  // Fallback to "*" for non-browser clients / empty Origin header.
  const allow = origin && (wildcard || allowed.includes(origin)) ? origin : wildcard ? "*" : allowed[0] ?? "*"
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-access-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  }
}

function json(
  req: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  })
}

/**
 * User access JWT for this handler. Prefer `Authorization: Bearer …`; some deployments
 * validate JWT at the edge but do not forward `Authorization` to the worker, so we also
 * accept `X-Supabase-Access-Token` (raw JWT, no `Bearer ` prefix).
 */
function accessTokenFromRequest(req: Request): string | null {
  const auth = (req.headers.get("Authorization") ?? "").trim()
  const fromAuth = /^Bearer\s+(.+)$/i.exec(auth)?.[1]?.trim()
  if (fromAuth) return fromAuth

  const alt = (req.headers.get("X-Supabase-Access-Token") ?? "").trim()
  if (alt) return alt

  return null
}

/**
 * Resolve the signed-in user from their **access JWT** using the service-role key.
 * This validates the token server-side; it is not the anon role.
 */
async function userFromAuthenticatedJwt(
  supabaseUrl: string,
  serviceRoleKey: string,
  accessToken: string,
): Promise<{ user: User; admin: SupabaseClient } | { error: string }> {
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const {
    data: { user },
    error,
  } = await admin.auth.getUser(accessToken)
  if (error || !user) {
    return { error: "Invalid session" }
  }
  return { user, admin }
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors })
  }
  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!supabaseUrl || !serviceKey) {
    return json(req, { error: "Server misconfiguration" }, 500)
  }

  const accessToken = accessTokenFromRequest(req)
  if (!accessToken) {
    return json(req, {
      error:
        "Missing user JWT: send Authorization: Bearer <access_token> and/or X-Supabase-Access-Token",
    }, 401)
  }

  const authResult = await userFromAuthenticatedJwt(supabaseUrl, serviceKey, accessToken)
  if ("error" in authResult) {
    return json(req, { error: authResult.error }, 401)
  }
  const { user, admin: adminClient } = authResult

  // Resolve admin role ID by name so this function works even if role IDs differ by environment.
  const { data: adminRoleRow, error: adminRoleErr } = await adminClient
    .from("roles")
    .select("id")
    .ilike("name", "admin")
    .maybeSingle()
  if (adminRoleErr) {
    return json(req, { error: `Failed to resolve admin role: ${adminRoleErr.message}` }, 500)
  }
  const adminRoleId = adminRoleRow?.id as number | undefined
  if (!adminRoleId) {
    return json(req, { error: "Admin role not found in roles table" }, 500)
  }

  const { data: adminRow } = await adminClient
    .from("user_roles")
    .select("role_id")
    .eq("user_id", user.id)
    .eq("role_id", adminRoleId)
    .maybeSingle()

  if (!adminRow) {
    return json(req, { error: "Forbidden: admin role required" }, 403)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json(req, { error: "Invalid JSON body" }, 400)
  }

  const action = body.action as string

  try {
    switch (action) {
      case "list": {
        const page = Math.max(1, Number(body.page) || 1)
        const perPage = Math.min(200, Math.max(1, Number(body.perPage) || 50))
        const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({
          page,
          perPage,
        })
        if (listError) throw listError
        const users = listData?.users ?? []
        const ids = users.map((u) => u.id)

        const roleMap = new Map<string, { role_id: number; role_name: string }[]>()
        if (ids.length > 0) {
          const { data: assignments, error: aErr } = await adminClient
            .from("user_roles")
            .select("user_id, role_id, roles(name)")
            .in("user_id", ids)
          if (aErr) throw aErr
          for (const row of assignments ?? []) {
            const uid = row.user_id as string
            const roleId = row.role_id as number
            const roleName = (row.roles as { name: string } | null)?.name ?? ""
            if (!roleMap.has(uid)) roleMap.set(uid, [])
            roleMap.get(uid)!.push({ role_id: roleId, role_name: roleName })
          }
        }

        const payload = users.map((u) => {
          const roles = roleMap.get(u.id) ?? []
          const primary = roles[0]
          return {
            user_id: u.id,
            email: u.email ?? "",
            display_name: displayNameFromUser(u),
            role_id: primary?.role_id ?? null,
            role_name: primary?.role_name ?? null,
            roles,
          }
        })

        const { data: roleCatalog, error: rcErr } = await adminClient
          .from("roles")
          .select("id, name")
          .order("id")
        if (rcErr) throw rcErr

        return json(req, { users: payload, page, perPage, roles: roleCatalog ?? [] })
      }

      case "update_profile": {
        const target_user_id = body.target_user_id as string | undefined
        const email = body.email as string | undefined
        const display_name = body.display_name as string | undefined
        if (!target_user_id) {
          return json(req, { error: "target_user_id required" }, 400)
        }

        const { data: existing, error: getErr } = await adminClient.auth.admin.getUserById(
          target_user_id,
        )
        if (getErr || !existing.user) {
          return json(req, { error: getErr?.message ?? "User not found" }, 400)
        }

        const meta: UserMetadata = { ...(existing.user.user_metadata ?? {}) }
        if (display_name !== undefined) {
          meta.full_name = display_name
        }

        const updates: { email?: string; user_metadata?: UserMetadata } = {
          user_metadata: meta,
        }
        if (email !== undefined && email.trim() !== "") {
          updates.email = email.trim()
        }

        const { error: upErr } = await adminClient.auth.admin.updateUserById(target_user_id, updates)
        if (upErr) throw upErr
        return json(req, { ok: true })
      }

      case "set_role": {
        const target_user_id = body.target_user_id as string | undefined
        const role_id = Number(body.role_id)
        if (!target_user_id || !Number.isInteger(role_id)) {
          return json(req, { error: "target_user_id and integer role_id required" }, 400)
        }

        const { data: r, error: roleErr } = await adminClient
          .from("roles")
          .select("id")
          .eq("id", role_id)
          .maybeSingle()
        if (roleErr) throw roleErr
        if (!r) {
          return json(req, { error: "Invalid role_id" }, 400)
        }

        const { error: delErr } = await adminClient.from("user_roles").delete().eq(
          "user_id",
          target_user_id,
        )
        if (delErr) throw delErr

        const { error: insErr } = await adminClient.from("user_roles").insert({
          user_id: target_user_id,
          role_id,
        })
        if (insErr) throw insErr
        return json(req, { ok: true })
      }

      case "remove_role": {
        const target_user_id = body.target_user_id as string | undefined
        if (!target_user_id) {
          return json(req, { error: "target_user_id required" }, 400)
        }
        const { error: delErr } = await adminClient.from("user_roles").delete().eq(
          "user_id",
          target_user_id,
        )
        if (delErr) throw delErr
        return json(req, { ok: true })
      }

      case "delete_account": {
        const target_user_id = body.target_user_id as string | undefined
        if (!target_user_id) {
          return json(req, { error: "target_user_id required" }, 400)
        }
        if (target_user_id === user.id) {
          return json(req, { error: "Cannot delete your own account" }, 400)
        }

        const { error: delRolesErr } = await adminClient.from("user_roles").delete().eq(
          "user_id",
          target_user_id,
        )
        if (delRolesErr) throw delRolesErr

        const { error: delUserErr } = await adminClient.auth.admin.deleteUser(target_user_id)
        if (delUserErr) throw delUserErr
        return json(req, { ok: true })
      }

      case "create_resident": {
        const payload = (body.payload ?? {}) as Record<string, unknown>
        const { data: inserted, error: insertErr } = await adminClient
          .from("residents")
          .insert({
            safehouse_id: (payload.safehouse_id as number | null) ?? null,
            case_status: (payload.case_status as string | null) ?? null,
            sex: (payload.sex as string | null) ?? null,
            case_category: (payload.case_category as string | null) ?? null,
            date_of_admission: (payload.date_of_admission as string | null) ?? null,
            assigned_social_worker: (payload.assigned_social_worker as string | null) ?? null,
            referral_source: (payload.referral_source as string | null) ?? null,
            referring_agency_person: (payload.referring_agency_person as string | null) ?? null,
            reintegration_type: (payload.reintegration_type as string | null) ?? null,
            reintegration_status: (payload.reintegration_status as string | null) ?? null,
            current_risk_level: (payload.current_risk_level as string | null) ?? null,
            initial_risk_level: (payload.current_risk_level as string | null) ?? null,
            sub_cat_trafficked: Boolean(payload.sub_cat_trafficked),
            sub_cat_physical_abuse: Boolean(payload.sub_cat_physical_abuse),
            sub_cat_sexual_abuse: Boolean(payload.sub_cat_sexual_abuse),
            sub_cat_child_labor: Boolean(payload.sub_cat_child_labor),
            sub_cat_orphaned: Boolean(payload.sub_cat_orphaned),
            sub_cat_at_risk: Boolean(payload.sub_cat_at_risk),
            is_pwd: Boolean(payload.is_pwd),
            pwd_type: (payload.pwd_type as string | null) ?? null,
            has_special_needs: Boolean(payload.has_special_needs),
            special_needs_diagnosis: (payload.special_needs_diagnosis as string | null) ?? null,
            family_is_4ps: Boolean(payload.family_is_4ps),
            family_solo_parent: Boolean(payload.family_solo_parent),
            family_indigenous: Boolean(payload.family_indigenous),
            family_informal_settler: Boolean(payload.family_informal_settler),
            case_control_no: (payload.case_control_no as string | null) ?? null,
          })
          .select("resident_id")
          .single()
        if (insertErr || !inserted?.resident_id) {
          return json(req, { error: insertErr?.message ?? "Failed to create resident" }, 400)
        }
        const residentId = inserted.resident_id as number
        const internalCode = `LS-${String(residentId).padStart(4, "0")}`
        const { error: codeErr } = await adminClient
          .from("residents")
          .update({ internal_code: internalCode })
          .eq("resident_id", residentId)
        if (codeErr) {
          return json(req, { error: codeErr.message }, 400)
        }
        return json(req, { ok: true, resident_id: residentId, internal_code: internalCode })
      }

      default:
        return json(req, { error: "Unknown action" }, 400)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return json(req, { error: msg }, 500)
  }
})
