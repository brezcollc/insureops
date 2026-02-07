import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, isLoading } = useAuth();

  // Redirect if already authenticated
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4">
      {/* Background decoration */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl -z-10" />
      
      {isLogin ? (
        <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
      ) : (
        <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
}
