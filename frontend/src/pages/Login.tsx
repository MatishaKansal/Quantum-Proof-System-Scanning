import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRole } from "@/context/RoleContext";

export default function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin@123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, loading, login } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";

  if (!loading && user?.role === "security_admin") {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const currentUser = await login(username.trim(), password);
      if (currentUser.role !== "security_admin") {
        throw new Error("This portal is restricted to Security Admin users.");
      }
      navigate(from, { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,199,44,0.18),_transparent_35%),linear-gradient(135deg,_rgba(128,0,0,0.96),_rgba(35,35,35,0.98))] flex items-center justify-center px-4 py-4">
      <div className="w-full max-w-4xl max-h-[calc(100vh-2rem)] grid lg:grid-cols-[1.05fr_0.95fr] overflow-hidden rounded-2xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur">
        <div className="relative hidden lg:flex flex-col justify-between p-8 text-primary-foreground bg-primary">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,199,44,0.28),_transparent_35%)]" />
          <div className="relative space-y-8">
            <div className="flex items-center gap-3">
              <img src="/pnb_logo.jpg" alt="Punjab National Bank logo" className="h-12 w-12 rounded-xl object-cover bg-white" />
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-primary-foreground/70">Security Access</p>
                <h1 className="text-xl font-bold">Punjab National Bank</h1>
              </div>
            </div>
            <div className="max-w-md space-y-3">
              <p className="text-3xl font-semibold leading-tight">Security Admin Portal</p>
              <p className="text-sm text-primary-foreground/80 leading-5">
                Sign in with the Security Admin account to run scans, export reports, and create additional Security Admin users.
              </p>
            </div>
          </div>
          <div className="relative space-y-3 text-sm text-primary-foreground/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-pnb-gold" />
              Demo credential: <span className="font-semibold text-primary-foreground">admin / admin@123</span>
            </div>
            <p>Only Security Admin users can add another Security Admin.</p>
          </div>
        </div>

        <div className="p-5 sm:p-6 lg:p-7 bg-card overflow-y-auto">
          <div className="mb-6 lg:hidden flex items-center gap-3">
            <img src="/pnb_logo.jpg" alt="Punjab National Bank logo" className="h-12 w-12 rounded-lg object-cover bg-white" />
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Security Access</p>
              <h1 className="text-xl font-bold">Security Admin Portal</h1>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <LockKeyhole className="h-3.5 w-3.5" />
              Restricted access
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign in to continue</h2>
            <p className="text-sm text-muted-foreground">
              Use your Security Admin credentials to access the quantum security dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-foreground">Username</label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="h-11"
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground" disabled={submitting}>
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Sign in
            </Button>
          </form>

          <div className="mt-6 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground space-y-1.5">
            <p className="font-medium text-foreground">Demo credentials</p>
            <p>Username: admin</p>
            <p>Password: admin@123</p>
            <p>Role: Security Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
