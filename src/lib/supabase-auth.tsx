import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { StaffUser } from "./staff-user";

export type { StaffUser } from "./staff-user";

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
const offline = (): Promise<never> =>
  Promise.reject(new Error("This book is offline. There is no sign-in."));

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const signIn = useCallback((): Promise<void> => offline(), []);
  const signUp = useCallback(
    (): Promise<"session" | "confirm"> => offline(),
    [],
  );
  const signOut = useCallback(async () => {}, []);
  const value = useMemo(
    () => ({
      user: null,
      isPending: false,
      configured: false,
      signIn,
      signUp,
      signOut,
    }),
    [signIn, signUp, signOut],
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
