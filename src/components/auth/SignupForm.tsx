import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, ArrowRight, CheckCircle, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure your passwords match.", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password);
    setIsLoading(false);

    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full border-border/30 shadow-lg shadow-primary/5 rounded-xl bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </div>
          <CardTitle className="text-[1.65rem] font-bold tracking-tight">Check your email</CardTitle>
          <CardDescription className="mt-1">
            We've sent a verification link to <strong>{email}</strong>.
            Please check your inbox and click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-7 pb-7">
          <Button variant="outline" className="w-full h-11 rounded-lg" onClick={onSwitchToLogin}>
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  const inputClasses = "pl-10 h-11 rounded-lg border-border/50 bg-muted/30 transition-colors focus:bg-background";
  const labelClasses = "text-xs font-medium uppercase tracking-wider text-muted-foreground";

  return (
    <Card className="w-full border-border/30 shadow-lg shadow-primary/5 rounded-xl bg-card/95 backdrop-blur-sm">
      <CardHeader className="text-center pb-2 pt-8">
        <div className="flex justify-center mb-5">
          <img src={logo} alt="InsureOps" className="h-14 w-auto" />
        </div>
        <CardTitle className="text-[1.65rem] font-bold tracking-tight">Create an account</CardTitle>
        <CardDescription className="text-muted-foreground mt-1">
          Get started with InsureOps
        </CardDescription>
        <div className="mx-auto mt-4 w-10 h-[2px] rounded-full bg-primary/25" />
      </CardHeader>
      <CardContent className="px-7 pb-7 pt-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className={labelClasses}>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} disabled={isLoading} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className={labelClasses}>Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} disabled={isLoading} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className={labelClasses}>Confirm password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClasses} disabled={isLoading} />
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
                Creating account...
              </>
            ) : (
              <>
                Create account
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
          Already have an account?{" "}
          <button type="button" onClick={onSwitchToLogin} className="text-primary hover:underline font-medium transition-colors">
            Sign in
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
