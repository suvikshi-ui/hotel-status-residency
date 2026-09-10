import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HotelLogo } from "@/components/hotel-logo";
import { SUPABASE_URL } from "@/lib/supabase-config";
import { useStaffSession } from "@/lib/supabase-auth";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: LoginPage,
});

function LoginPage() {
  const { signIn, signUp, configured } = useStaffSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState("signin");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState("");

  async function onSignIn(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Enter email and password");
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
      toast.success("Signed in");
      void navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSignUp(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Enter your name");
      return;
    }
    if (!email.trim() || !password) {
      toast.error("Enter email and password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const result = await signUp(email, password, name);
      if (result === "confirm") {
        toast.success("Check your email to confirm, then sign in.");
        setTab("signin");
        setPassword("");
        setConfirm("");
      } else {
        toast.success("Account created");
        void navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg md:grid md:grid-cols-[minmax(0,18rem)_1fr]">
      <aside className="hidden flex-col justify-between bg-sidebar px-8 py-10 text-sidebar-fg md:flex">
        <div>
          <HotelLogo mark className="h-14 w-auto" />
          <p className="mt-8 text-xs font-medium uppercase tracking-[0.18em] text-sidebar-muted">
            Staff ledger
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight">
            Hotel Status Residency
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-sidebar-muted">
            Night audit, register and cash book — sign in with the hotel email
            to open your books.
          </p>
        </div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-sidebar-muted">
          Mahape
        </p>
      </aside>

      <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 flex flex-col items-center text-center md:hidden">
          <HotelLogo mark className="h-12 w-auto" />
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
            Hotel Status Residency
          </h1>
          <p className="mt-1 text-sm text-muted">Staff ledger · Mahape</p>
        </div>

        <div className="paper-card w-full max-w-md rounded-xl p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            {tab === "signup" ? "New staff" : "Welcome back"}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            {tab === "signup" ? "Create account" : "Sign in"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Email and password. Each account keeps its own ledger on this
            device.
          </p>

          {!configured ? (
            <p className="mt-5 rounded-lg bg-due/12 px-3 py-3 text-sm text-due">
              Project is connected at{" "}
              <span className="font-medium break-all">{SUPABASE_URL}</span>.
              Send the publishable (anon) key from Supabase → Settings → API
              to finish sign-in.
            </p>
          ) : null}

          <Tabs value={tab} onValueChange={setTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-5">
              <form className="grid gap-3" onSubmit={onSignIn}>
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="mt-2 w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="mt-5">
              <form className="grid gap-3" onSubmit={onSignUp}>
                <div className="grid gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email-up">Email</Label>
                  <Input
                    id="email-up"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="password-up">Password</Label>
                  <Input
                    id="password-up"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="mt-2 w-full" disabled={busy}>
                  {busy ? "Creating…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
