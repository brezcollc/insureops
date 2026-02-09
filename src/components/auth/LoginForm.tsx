import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full border-border/30 shadow-lg shadow-primary/5 rounded-xl bg-card/95 backdrop-blur-sm">
      <CardHeader className="text-center pb-2 pt-8">
        <div className="flex justify-center mb-5">
          <img src={logo} alt="InsureOps" className="h-14 w-auto" />
        </div>
        <CardTitle className="text-[1.65rem] font-bold tracking-tight">Welcome back</CardTitle>
        <CardDescription className="text-muted-foreground mt-1">
          Private access for insurance brokerages
        </CardDescription>
        <div className="mx-auto mt-4 w-10 h-[2px] rounded-full bg-primary/25" />
      </CardHeader>
      <CardContent className="px-7 pb-7 pt-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 rounded-lg border-border/50 bg-muted/30 transition-colors focus:bg-background"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11 rounded-lg border-border/50 bg-muted/30 transition-colors focus:bg-background"
                disabled={isLoading}
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full gap-2 h-11 rounded-lg mt-2 text-sm font-semibold transition-all duration-200 hover:shadow-md hover:shadow-primary/15"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <div className="flex items-center gap-2 justify-center mt-5 text-muted-foreground/40">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-[0.68rem] tracking-wide uppercase">Encrypted & Secure</span>
        </div>

        <div className="mt-5 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="text-primary hover:underline font-medium transition-colors"
          >
            Sign up
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
