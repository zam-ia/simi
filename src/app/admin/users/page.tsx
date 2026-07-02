import { createClientUserAction, deleteClientUserAction, updateClientUserAction } from "@/lib/actions";
import { requireAdmin, requireModuleAccess } from "@/lib/auth";
import { adminModules, businessRoleDescriptions, businessRoleLabels, businessRoles, configurableModules, defaultRolePermissions } from "@/lib/permissions";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import type { Client, ClientUser } from "@/types/menu";

export const dynamic = "force-dynamic";

function PermissionChecks({ defaults }: { defaults: Record<string, boolean> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {configurableModules.map((module) => (
        <label key={module} className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-sm">
          <input type="checkbox" name={`module_${module}`} defaultChecked={Boolean(defaults[module])} className="mt-1" />
          <span>
            <span className="block font-medium text-[var(--text)]">{adminModules[module].label}</span>
            <span className="mt-1 block text-xs text-[var(--text-muted)]">{adminModules[module].description}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function RoleSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">Rol</span>
      <select className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="role" defaultValue={defaultValue || "business_admin"}>
        {businessRoles.map((role) => (
          <option key={role} value={role}>
            {businessRoleLabels[role]}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const context = await requireAdmin();
  requireModuleAccess(context, "users");
  const { supabase, role, client } = context;

  const [{ data: clients }, { data: users, error: usersError }] = await Promise.all([
    role === "super_admin" ? supabase.from("clients").select("*").order("name", { ascending: true }) : supabase.from("clients").select("*").eq("id", client!.id),
    role === "super_admin" ? supabase.from("client_users").select("*").order("created_at", { ascending: false }) : supabase.from("client_users").select("*").eq("client_id", client!.id).order("created_at", { ascending: false })
  ]);

  const clientRows = (clients || []) as Client[];
  const userRows = (users || []) as ClientUser[];
  const clientById = new Map(clientRows.map((item) => [item.id, item]));
  const defaultCreateRole = role === "super_admin" ? "business_owner" : "business_admin";

  return (
    <div className="grid gap-6">
      <section className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
        <p className="text-sm text-[var(--text-muted)]">Administracion</p>
        <h2 className="mt-2 text-2xl font-medium">Usuarios, roles y permisos</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Crea accesos para caja, cocina, reparto o administracion. Cada usuario ve solo los modulos asignados.
        </p>
        {resolvedSearchParams.saved ? <p className="mt-3 text-sm text-green-700 dark:text-green-300">Cambios guardados correctamente.</p> : null}
        {resolvedSearchParams.error ? <p className="mt-3 text-sm text-red-700 dark:text-red-300">{resolvedSearchParams.error}</p> : null}
        {usersError ? <p className="mt-3 text-sm text-red-700 dark:text-red-300">No se pudo cargar usuarios. Aplica la migracion 008 en Supabase.</p> : null}
      </section>

      <form action={createClientUserAction} className="grid gap-5 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
        <div>
          <h3 className="text-lg font-medium">Crear usuario</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">La contrasena temporal solo se usa para crear el acceso en Supabase Auth; no se guarda en SIMI.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {role === "super_admin" ? (
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Negocio</span>
              <select className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="client_id" required>
                <option value="">Selecciona negocio</option>
                {clientRows.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" name="client_id" value={client!.id} />
          )}
          <Input label="Nombre" name="full_name" placeholder="Encargado de cocina" />
          <Input label="Correo" name="email" type="email" required placeholder="cocina@negocio.com" />
          <Input label="Contrasena temporal" name="password" type="password" placeholder="Minimo 8 caracteres" hint="Si el usuario ya existe en Supabase, puedes dejarla vacia y solo asignar permisos." />
          <RoleSelect defaultValue={defaultCreateRole} />
        </div>

        <div className="grid gap-3">
          <h4 className="text-sm font-medium">Modulos visibles</h4>
          <PermissionChecks defaults={defaultRolePermissions[defaultCreateRole]} />
        </div>

        <div className="flex justify-end">
          <Button type="submit">Crear usuario</Button>
        </div>
      </form>

      <section className="grid gap-4">
        <div>
          <h3 className="text-lg font-medium">Usuarios actuales</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Puedes cambiar rol, permisos o desactivar un acceso.</p>
        </div>

        {userRows.length === 0 ? (
          <div className="rounded-[var(--radius-panel)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)]">Aun no hay usuarios registrados para este negocio.</div>
        ) : (
          userRows.map((item) => {
            const updateAction = updateClientUserAction.bind(null, item.id);
            const deleteAction = deleteClientUserAction.bind(null, item.id);
            const currentPermissions = item.module_permissions || {};
            const currentRole = item.role || "business_admin";

            return (
              <article key={item.id} className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">{clientById.get(item.client_id)?.name || "Negocio"}</p>
                    <h4 className="text-lg font-medium">{item.full_name || item.email}</h4>
                    <p className="text-sm text-[var(--text-muted)]">{item.email}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.is_active ? "bg-green-50 text-green-700 dark:bg-green-950/35 dark:text-green-200" : "bg-red-50 text-red-700 dark:bg-red-950/35 dark:text-red-200"}`}>
                    {item.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <form action={updateAction} className="grid gap-4">
                  <input type="hidden" name="client_id" value={item.client_id} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Nombre" name="full_name" defaultValue={item.full_name || ""} />
                    <RoleSelect defaultValue={currentRole} />
                  </div>
                  <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 text-xs text-[var(--text-muted)]">{businessRoleDescriptions[currentRole]}</p>
                  <PermissionChecks defaults={currentPermissions} />
                  <label className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-sm">
                    <input type="checkbox" name="is_active" defaultChecked={item.is_active} />
                    <span>Usuario activo</span>
                  </label>
                  <div className="flex flex-wrap justify-end gap-3">
                    <Button type="submit" variant="secondary">Guardar permisos</Button>
                  </div>
                </form>

                <form action={deleteAction} className="flex justify-end">
                  <input type="hidden" name="client_id" value={item.client_id} />
                  <Button type="submit" variant="danger">Desactivar</Button>
                </form>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
