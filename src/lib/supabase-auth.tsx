import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./supabase-config";
import { getSupabase } from "./supabase";
import { setLedgerOwner } from "./store";

export type StaffUser = {
  id: string;
  email: string | null;
  name: string | null;
};

type AuthCtx = {
  user: StaffUser | null;
  isPending: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<"session" | "confirm">;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

function toStaff(user: User | null): StaffUser | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    null;
  return { id: user.id, email: user.email ?? null, name };
}

function friendlyAuthError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Wrong email or password.";
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "That email already has an account. Sign in instead.";
  }
  if (m.includes("password")) return message;
  if (m.includes("email")) return message;
  if (m.includes("not connected") || m.includes("not configured")) {
    return "Supabase is not connected. Add the project ID and publishable key.";
  }
  return message || "Could not complete sign-in.";
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<StaffUser | null>(null);
  const [isPending, setPending] = useState(configured);

  useEffect(() => {
    if (!configured) {
      setUser(null);
      setPending(false);
      return;
    }
    const supabase = getSupabase();
    let alive = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setUser(toStaff(data.session?.user ?? null));
      setPending(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (!alive) return;
        setUser(toStaff(session?.user ?? null));
        setPending(false);
      },
    );

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [configured]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error(friendlyAuthError("not connected"));
    }
    const { error } = await getSupabase().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw new Error(friendlyAuthError(error.message));
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      if (!isSupabaseConfigured()) {
        throw new Error(friendlyAuthError("not connected"));
      }
      const { data, error } = await getSupabase().auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: name.trim() },
        },
      });
      if (error) throw new Error(friendlyAuthError(error.message));
      return data.session ? "session" : "confirm";
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured()) {
      await getSupabase().auth.signOut();
    }
    setUser(null);
    await setLedgerOwner(null);
  }, []);

  const value = useMemo(
    () => ({ user, isPending, configured, signIn, signUp, signOut }),
    [user, isPending, configured, signIn, signUp, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStaffSession() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useStaffSession must be used inside SupabaseAuthProvider");
  }
  return ctx;
}
