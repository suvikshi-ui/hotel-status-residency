import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HOUSE_STAFF_PRESETS,
  createHotelUser,
  loadHotelUsers,
  missingHouseStaff,
  type HotelUser,
} from "@/lib/hotel-users";
import { APP_ROLES, ROLE_LABEL, roleAccess, type AppRole } from "@/lib/roles";
import {
  SUPABASE_SQL_EDITOR,
  SUPABASE_TABLE_EDITOR,
} from "@/lib/supabase-config";
import hotelUsersSql from "../../supabase/migrations/0002_hotel_users.sql?raw";
import appUsersSql from "../../supabase/migrations/0003_public_users.sql?raw";

const USERS_SQL = `${hotelUsersSql}\n\n${appUsersSql}`;

export function AddUserCard() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<HotelUser[]>([]);
  const [usersTableOn, setUsersTableOn] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("housekeeping");

  async function refresh() {
    try {
      const load = await loadHotelUsers();
      setUsers(load.users);
      setUsersTableOn(load.usersTableOn);
    } catch {
      setUsers([]);
      setUsersTableOn(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  function reset() {
    setName("");
    setUsername("");
    setPassword("");
    setRole("housekeeping");
  }

  function openAdd(preset?: { name: string; username: string; role: AppRole }) {
    if (preset) {
      setName(preset.name);
      setUsername(preset.username);
      setPassword("");
      setRole(preset.role);
    } else {
      reset();
    }
    setOpen(true);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const row = await createHotelUser({ name, username, password, role });
      toast.success(
        `${row.name} saved · ${ROLE_LABEL[row.role]} · ${roleAccess(row.role)}`,
      );
      reset();
      setOpen(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save user");
    } finally {
      setBusy(false);
    }
  }

  function copyUsersSql() {
    void navigator.clipboard.writeText(USERS_SQL).then(
      () =>
        toast.success(
          "Users table SQL copied. Paste it in the SQL editor, run it, then retry.",
        ),
      () => toast.error("Could not copy SQL"),
    );
  }

  const suggested = missingHouseStaff(users);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Users</CardTitle>
            <p className="text-sm text-muted">
              Live Supabase table. Kali, House and Housekeeping sign in here.
              Kali opens Complaints and Inventory.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                usersTableOn
                  ? "rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-primary"
                  : "rounded-full bg-danger/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-danger"
              }
            >
              {usersTableOn ? "Table on" : "Table off"}
            </span>
            <Button type="button" onClick={() => openAdd()}>
              Add user
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!usersTableOn ? (
            <div className="rounded-lg border border-border bg-bg-warm/60 px-3 py-3">
              <p className="text-sm font-medium">Turn on the users table</p>
              <p className="mt-1 text-sm text-muted">
                Copy the SQL, run it in Supabase, then open the table. Add user
                writes Kali, House and Housekeeping into that table.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" onClick={copyUsersSql}>
                  Copy users SQL
                </Button>
                <Button type="button" variant="outline" asChild>
                  <a href={SUPABASE_SQL_EDITOR} target="_blank" rel="noreferrer">
                    Open SQL editor
                  </a>
                </Button>
                <Button type="button" variant="outline" asChild>
                  <a href={SUPABASE_TABLE_EDITOR} target="_blank" rel="noreferrer">
                    Open table
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setLoading(true);
                    void refresh();
                  }}
                >
                  {loading ? "Checking…" : "Table is ready"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" asChild>
                <a href={SUPABASE_TABLE_EDITOR} target="_blank" rel="noreferrer">
                  Open table
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  void refresh();
                }}
              >
                Refresh
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {HOUSE_STAFF_PRESETS.map((p) => (
              <Button
                key={p.username}
                type="button"
                variant="outline"
                onClick={() => openAdd(p)}
              >
                Add {p.name}
              </Button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr className="border-y border-border">
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Username</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Access</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id || u.username} className="border-b border-border/70">
                    <td className="px-4 py-2.5 font-medium">{u.name || "—"}</td>
                    <td className="px-3 py-2.5 tabular text-muted">{u.username || "—"}</td>
                    <td className="px-3 py-2.5">{ROLE_LABEL[u.role]}</td>
                    <td className="px-3 py-2.5">{roleAccess(u.role)}</td>
                    <td className="px-3 py-2.5 text-right text-xs text-muted">
                      Saved
                    </td>
                  </tr>
                ))}
                {suggested.map((p) => (
                  <tr key={`suggest-${p.username}`} className="border-b border-border/70">
                    <td className="px-4 py-2.5 font-medium text-muted">{p.name}</td>
                    <td className="px-3 py-2.5 tabular text-muted">{p.username}</td>
                    <td className="px-3 py-2.5 text-muted">{ROLE_LABEL[p.role]}</td>
                    <td className="px-3 py-2.5 text-muted">{roleAccess(p.role)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openAdd(p)}
                      >
                        Add
                      </Button>
                    </td>
                  </tr>
                ))}
                {!loading && users.length === 0 && suggested.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-sm text-muted">
                      No staff logins yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>
              Saved to the Supabase users table. Housekeeping (Kali) can open
              Complaints and Inventory.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-3" onSubmit={(e) => void onSave(e)}>
            <div className="grid gap-1.5">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="user-username">Username</Label>
              <Input
                id="user-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger aria-label="Role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APP_ROLES.map((id) => (
                    <SelectItem key={id} value={id}>
                      {ROLE_LABEL[id]} · {roleAccess(id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted">{roleAccess(role)}</p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save to table"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
