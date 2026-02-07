import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  CheckCircle, 
  Users, 
  Building2, 
  Clock, 
  ArrowRight,
  Mail,
  Loader2,
  FileText,
  BarChart3
} from "lucide-react";
import logo from "@/assets/logo.png";

const LandingPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const timestamp = new Date().toISOString();
      
      const { error } = await supabase
        .from("interest_signups")
        .insert({ email: trimmedEmail });

      if (error) {
        if (error.code === "23505") {
          // Duplicate email
          toast({
            title: "Already registered",
            description: "This email is already on our early access list.",
          });
          setIsSubmitted(true);
        } else {
          throw error;
        }
      } else {
        setIsSubmitted(true);
        toast({
          title: "You're on the list!",
          description: "We'll reach out when access is available.",
        });
        
        // Send admin notification (fire and forget - don't block user experience)
        supabase.functions.invoke("notify-signup", {
          body: { email: trimmedEmail, timestamp },
        }).catch((err) => {
          console.error("Failed to send admin notification:", err);
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSignup = () => {
    document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-18 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="InsureOps Logo" className="h-11 w-auto" />
          </div>
          <Button 
            onClick={scrollToSignup} 
            size="sm" 
            className="bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
          >
            Request Access
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-36 pb-28 px-6 relative overflow-hidden">
        {/* Enhanced background treatment */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-background to-accent/[0.03] -z-10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        
        {/* Gradient orbs for visual interest */}
        <div className="absolute top-32 left-[15%] w-[500px] h-[500px] bg-primary/[0.07] rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 right-[10%] w-[400px] h-[400px] bg-accent/[0.07] rounded-full blur-[100px] -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/[0.02] to-accent/[0.02] rounded-full blur-[80px] -z-10" />
        
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img 
                src={logo} 
                alt="InsureOps" 
                className="h-48 md:h-56 lg:h-64 w-auto drop-shadow-2xl mix-blend-multiply" 
              />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight mb-7 leading-[1.1]">
            Automate Loss Run Requests
            <span className="block mt-2 bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
              Without the Chase
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            A simple operations platform for insurance brokerages to request, track, and manage loss runs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={scrollToSignup} 
              className="gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all duration-200 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 h-13 px-8 text-base font-medium"
            >
              Request Early Access
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} 
              className="border-border/60 hover:bg-muted/50 hover:border-border transition-all duration-200 h-13 px-8 text-base font-medium"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24 px-6 relative">
        {/* Subtle section background */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-muted/20 to-transparent -z-10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
        
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-5 tracking-tight">
              Everything you need to manage loss runs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Streamline your operations with tools designed specifically for insurance brokerages.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group border-border/40 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-primary/[0.08] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/20 rounded-2xl overflow-hidden">
              <CardContent className="pt-7 pb-6 px-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  <Send className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2.5 text-lg">Request in Bulk</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Send loss run requests across multiple carriers with a few clicks.
                </p>
              </CardContent>
            </Card>
            <Card className="group border-border/40 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-accent/[0.08] transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/20 rounded-2xl overflow-hidden">
              <CardContent className="pt-7 pb-6 px-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  <BarChart3 className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2.5 text-lg">Track Everything</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Monitor responses, documents, and follow-ups in one central place.
                </p>
              </CardContent>
            </Card>
            <Card className="group border-border/40 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-primary/[0.08] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/20 rounded-2xl overflow-hidden">
              <CardContent className="pt-7 pb-6 px-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-accent/5 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2.5 text-lg">Stay Organized</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Keep your book of business organized as it grows.
                </p>
              </CardContent>
            </Card>
            <Card className="group border-border/40 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-success/[0.08] transition-all duration-300 hover:-translate-y-1.5 hover:border-success/20 rounded-2xl overflow-hidden">
              <CardContent className="pt-7 pb-6 px-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success/15 to-success/5 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  <CheckCircle className="w-7 h-7 text-success" />
                </div>
                <h3 className="font-semibold text-foreground mb-2.5 text-lg">Built for Brokerages</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Designed around real brokerage workflows, not generic tools.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
        
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-5 tracking-tight">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="group text-center relative bg-card/40 backdrop-blur-sm rounded-2xl p-8 border border-border/30 hover:border-primary/20 hover:bg-card/60 transition-all duration-300 hover:shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform duration-300">
                1
              </div>
              <h3 className="font-semibold text-foreground mb-3 text-lg">Add Clients & Policies</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Set up your client database with their policy information and carrier details.
              </p>
              {/* Connector line */}
              <div className="hidden md:block absolute top-12 left-[65%] w-[70%] h-0.5 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
            </div>
            <div className="group text-center relative bg-card/40 backdrop-blur-sm rounded-2xl p-8 border border-border/30 hover:border-accent/20 hover:bg-card/60 transition-all duration-300 hover:shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/90 to-accent text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-accent/30 group-hover:scale-105 transition-transform duration-300">
                2
              </div>
              <h3 className="font-semibold text-foreground mb-3 text-lg">Send Requests</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Request loss runs and send follow-ups with templated emails.
              </p>
              {/* Connector line */}
              <div className="hidden md:block absolute top-12 left-[65%] w-[70%] h-0.5 bg-gradient-to-r from-accent/40 via-accent/20 to-transparent" />
            </div>
            <div className="group text-center bg-card/40 backdrop-blur-sm rounded-2xl p-8 border border-border/30 hover:border-success/20 hover:bg-card/60 transition-all duration-300 hover:shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-success text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-success/30 group-hover:scale-105 transition-transform duration-300">
                3
              </div>
              <h3 className="font-semibold text-foreground mb-3 text-lg">Track & Complete</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload documents, mark requests complete, and stay organized.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-24 px-6 relative">
        {/* Subtle section background */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-muted/15 to-transparent -z-10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-5 tracking-tight">
            Built for Insurance Operations
          </h2>
          <p className="text-lg text-muted-foreground mb-12">
            InsureOps is designed for teams who manage loss run workflows daily.
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            <div className="group flex items-center gap-4 bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl px-7 py-5 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <span className="text-foreground font-medium text-base">Independent Brokerages</span>
            </div>
            <div className="group flex items-center gap-4 bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl px-7 py-5 shadow-sm hover:shadow-lg hover:border-accent/20 transition-all duration-300 hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <span className="text-foreground font-medium text-base">Account Managers</span>
            </div>
            <div className="group flex items-center gap-4 bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl px-7 py-5 shadow-sm hover:shadow-lg hover:border-success/20 transition-all duration-300 hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/15 to-success/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <Clock className="w-6 h-6 text-success" />
              </div>
              <span className="text-foreground font-medium text-base">Renewal Teams</span>
            </div>
          </div>
        </div>
      </section>

      {/* Email Signup */}
      <section id="signup" className="py-28 px-6 relative overflow-hidden">
        {/* Enhanced background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-accent/[0.04] -z-10" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/[0.05] rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent/[0.05] rounded-full blur-[80px] -z-10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
        
        <div className="max-w-xl mx-auto text-center">
          <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/15 to-accent/20 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/10">
            <Mail className="w-9 h-9 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-5 tracking-tight">
            Get Early Access
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Join the waitlist and we'll reach out when access is available.
          </p>
          
          {isSubmitted ? (
            <div className="bg-success/10 border border-success/20 rounded-2xl p-10 shadow-lg">
              <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-7 h-7 text-success" />
              </div>
              <p className="text-foreground font-semibold text-xl">You're on the list!</p>
              <p className="text-muted-foreground mt-2">
                We'll reach out when access is available.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
              <Input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-13 bg-card/80 backdrop-blur-sm border-border/50 rounded-xl text-base focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                disabled={isSubmitting}
              />
              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting} 
                className="gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all duration-200 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 h-13 px-8 rounded-xl text-base font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Request Access"
                )}
              </Button>
            </form>
          )}
          <p className="text-sm text-muted-foreground/80 mt-6">
            We respect your privacy. No spam, ever.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-14 px-6 border-t border-border/30 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <img src={logo} alt="InsureOps" className="h-9 w-auto opacity-90" />
            </div>
            <p className="text-sm text-muted-foreground/80 text-center">
              Streamline loss run operations for insurance brokerages.
            </p>
            <div className="text-sm">
              <a 
                href="mailto:hello@insureops.com" 
                className="text-muted-foreground/80 hover:text-primary transition-colors duration-200"
              >
                hello@insureops.com
              </a>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} InsureOps. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground/60 max-w-md text-center md:text-right">
              This app helps manage loss run requests and documents. It does not analyze or interpret insurance data.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
