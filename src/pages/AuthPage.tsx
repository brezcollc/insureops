import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { Loader2, Shield, FileCheck, ClipboardCheck } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, isLoading } = useAuth();

  if (user) {
    return <Navigate to="/app" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-muted via-background to-secondary/40 px-4 relative overflow-hidden">
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Soft ambient shapes */}
      <div className="absolute top-16 left-1/4 w-[28rem] h-[28rem] bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-16 right-1/4 w-[24rem] h-[24rem] bg-accent/5 rounded-full blur-3xl -z-10" />

      {/* Floating insurance icons */}
      <div className="absolute top-[12%] left-[8%] text-primary/[0.07] -z-10">
        <Shield className="w-24 h-24" strokeWidth={1} />
      </div>
      <div className="absolute bottom-[15%] right-[10%] text-accent/[0.07] -z-10">
        <FileCheck className="w-20 h-20" strokeWidth={1} />
      </div>
      <div className="absolute top-[18%] right-[12%] text-primary/[0.05] -z-10">
        <ClipboardCheck className="w-16 h-16" strokeWidth={1} />
      </div>

      {/* Main content */}
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
        ) : (
          <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
        )}

        {/* Trust signal */}
        <p className="text-center text-xs text-muted-foreground/60 mt-6 tracking-wide">
          Secure, invite-only access · Built for insurance brokerage workflows
        </p>
      </div>
    </div>
  );
}
