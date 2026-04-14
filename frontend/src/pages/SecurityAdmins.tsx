import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldPlus, LoaderCircle, UserRound } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSecurityAdmin } from "@/lib/api";
import { useRole } from "@/context/RoleContext";

export default function SecurityAdmins() {
  const { user, isSecurityAdmin } = useRole();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const createMutation = useMutation({
    mutationFn: createSecurityAdmin,
    onSuccess: (createdUser) => {
      setMessageType("success");
      setMessage(`${createdUser.fullName} (${createdUser.username}) has been created as a Security Admin.`);
      setUsername("");
      setFullName("");
      setPassword("");
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Failed to create security admin");
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setMessageType("");
    createMutation.mutate({
      username: username.trim(),
      fullName: fullName.trim(),
      password,
    });
  };

  if (!isSecurityAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-8 bg-card rounded-lg border p-6 space-y-4">
        <h1 className="text-xl font-bold text-foreground">Security Admin Access Required</h1>
        <p className="text-sm text-muted-foreground">
          Switch to Security Admin from the top-right menu to sign in and manage Security Admin users.
        </p>
        <Button onClick={() => navigate("/login", { state: { from: { pathname: "/security-admins" } } })}>
          Go to Security Admin Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldPlus className="w-6 h-6 text-primary" />
          Security Admin Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Only Security Admin users can create another Security Admin.
        </p>
      </div>

      <div className="bg-card rounded-lg border p-6 space-y-6">
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Signed in as</p>
          <p>{user?.fullName}</p>
          <p>{user?.username}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-username" className="text-sm font-medium text-foreground">Username</label>
            <Input
              id="new-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="new.admin"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="new-full-name" className="text-sm font-medium text-foreground">Full name</label>
            <Input
              id="new-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="New Security Admin"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="new-password" className="text-sm font-medium text-foreground">Password</label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Strong password"
              required
            />
          </div>

          {message && (
            <div
              className={`rounded-md border px-4 py-3 text-sm ${
                messageType === "success"
                  ? "border-green-500/30 bg-green-500/10 text-green-700"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              {message}
            </div>
          )}

          <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
            {createMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
            Add Security Admin
          </Button>
        </form>
      </div>
    </div>
  );
}
