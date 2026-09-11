import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { codeOk } from "@/lib/pin";
import { useLedger } from "@/lib/store";

export type GateOpts = {
  title?: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  /** Default true when a code is set. Locking a day skips the code. */
  requireCode?: boolean;
};

const SecurityCtx = createContext<{
  gate: (fn: () => void, opts?: GateOpts) => void;
  hasCode: boolean;
  stored: string;
} | null>(null);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const stored = useLedger((s) => s.securityCode);
  const hasCode = Boolean(stored);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [opts, setOpts] = useState<GateOpts>({});
  const pending = useRef<(() => void) | null>(null);

  const gate = useCallback((fn: () => void, next?: GateOpts) => {
    pending.current = fn;
    setOpts(next ?? {});
    setValue("");
    setOpen(true);
  }, []);

  function close() {
    setOpen(false);
    pending.current = null;
    setValue("");
  }

  function run() {
    const needCode = opts.requireCode !== false && stored;
    if (needCode && !codeOk(stored, value)) {
      toast.error("Wrong security code");
      return;
    }
    const fn = pending.current;
    pending.current = null;
    setOpen(false);
    setValue("");
    fn?.();
  }

  return (
    <SecurityCtx.Provider value={{ gate, hasCode, stored }}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close();
          else setOpen(true);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{opts.title ?? "Are you sure?"}</DialogTitle>
            <DialogDescription>
              {opts.message ?? "Please confirm before continuing."}
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
          >
            {hasCode && opts.requireCode !== false ? (
              <div className="grid gap-1.5">
                <Label htmlFor="sec-code">Security code</Label>
                <Input
                  id="sec-code"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoFocus
                />
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={opts.danger ? "default" : "default"}
                className={
                  opts.danger
                    ? "bg-danger text-white hover:bg-danger/90"
                    : undefined
                }
              >
                {opts.confirmLabel ?? "Yes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </SecurityCtx.Provider>
  );
}

export function useGate() {
  const ctx = useContext(SecurityCtx);
  if (!ctx) {
    return {
      gate: (fn: () => void) => fn(),
      hasCode: false,
      stored: "",
    };
  }
  return ctx;
}
