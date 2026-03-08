import { signIn } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form action={signIn} className="card w-full max-w-md space-y-4 p-6">
        <h1 className="text-2xl font-semibold">KitchenFlow Login</h1>
        <p className="text-sm text-muted">Sign in to manage daily restaurant operations.</p>
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <Input name="email" type="email" required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <Input name="password" type="password" required />
        </div>
        <Button className="w-full">Sign In</Button>
      </form>
    </div>
  );
}
