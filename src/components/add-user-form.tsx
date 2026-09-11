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
import { createHotelUser, listHotelUsers, type HotelUser } from "@/lib/hotel-users";
import { APP_ROLES, ROLE_LABEL, type AppRole } from "@/lib/roles";

export function AddUserCard() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState<HotelUser[]>([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("housekeeping");

  async function refresh() {
    try {
      setUsers(await listHotelUsers());
    } catch {
      setUsers([]);
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

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const row = await createHotelUser({ name, username, password, role });
      toast.success(`${row.name} saved as ${ROLE_LABEL[row.role]}`);
      reset();
      setOpen(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save user");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Users</CardTitle>
            <p className="text-sm text-muted">
              Add a login. They sign in with username and password.
            </p>
          </div>
          <Button type="button" onClick={() => setOpen(true)}>
            Add user
          </Button>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted">No staff logins yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-bg-warm/60 px-3 py-2"
                >
                  <span className="font-medium">{u.name}</span>
                  <span className="text-sm tabular text-muted">{u.username}</span>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">
                    {ROLE_LABEL[u.role]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>
              Name, username, password and role. Saved to the hotel database.
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
                      {ROLE_LABEL[id]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
