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
      const { error } = await supabase
        .from("interest_signups")
        .insert({ email: email.trim().toLowerCase() });

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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="InsureOps Logo" className="h-10 w-auto" />
          </div>
          <Button onClick={scrollToSignup} size="sm" className="bg-primary hover:bg-primary/90">
            Request Access
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Gradient orbs for visual interest */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-10">
            <div className="relative">
              <img 
                src={logo} 
                alt="InsureOps" 
                className="h-48 md:h-56 lg:h-64 w-auto drop-shadow-xl mix-blend-multiply" 
              />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6">
            Automate Loss Run Requests
            <span className="block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Without the Chase
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            A simple operations platform for insurance brokerages to request, track, and manage loss runs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={scrollToSignup} className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
              Request Early Access
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="border-border hover:bg-muted">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-6 bg-gradient-to-b from-muted/30 to-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground mb-4">
            Everything you need to manage loss runs
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Streamline your operations with tools designed specifically for insurance brokerages.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                  <Send className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Request in Bulk</h3>
                <p className="text-sm text-muted-foreground">
                  Send loss run requests across multiple carriers with a few clicks.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Track Everything</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor responses, documents, and follow-ups in one central place.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Stay Organized</h3>
                <p className="text-sm text-muted-foreground">
                  Keep your book of business organized as it grows.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Built for Brokerages</h3>
                <p className="text-sm text-muted-foreground">
                  Designed around real brokerage workflows, not generic tools.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-center text-muted-foreground mb-14">
            Get started in three simple steps
          </p>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-5 shadow-lg shadow-primary/30">
                1
              </div>
              <h3 className="font-semibold text-foreground mb-2">Add Clients & Policies</h3>
              <p className="text-sm text-muted-foreground">
                Set up your client database with their policy information and carrier details.
              </p>
              {/* Connector line */}
              <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-accent/30" />
            </div>
            <div className="text-center relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/90 to-accent text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-5 shadow-lg shadow-accent/30">
                2
              </div>
              <h3 className="font-semibold text-foreground mb-2">Send Requests</h3>
              <p className="text-sm text-muted-foreground">
                Request loss runs and send follow-ups with templated emails.
              </p>
              {/* Connector line */}
              <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-accent/30 to-success/30" />
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-success text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-5 shadow-lg shadow-success/30">
                3
              </div>
              <h3 className="font-semibold text-foreground mb-2">Track & Complete</h3>
              <p className="text-sm text-muted-foreground">
                Upload documents, mark requests complete, and stay organized.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-6 bg-gradient-to-b from-muted/20 to-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Built for Insurance Operations
          </h2>
          <p className="text-muted-foreground mb-10">
            InsureOps is designed for teams who manage loss run workflows daily.
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            <div className="flex items-center gap-3 bg-card border border-border/60 rounded-xl px-6 py-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <span className="text-foreground font-medium">Independent Brokerages</span>
            </div>
            <div className="flex items-center gap-3 bg-card border border-border/60 rounded-xl px-6 py-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <span className="text-foreground font-medium">Account Managers</span>
            </div>
            <div className="flex items-center gap-3 bg-card border border-border/60 rounded-xl px-6 py-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-success" />
              </div>
              <span className="text-foreground font-medium">Renewal Teams</span>
            </div>
          </div>
        </div>
      </section>

      {/* Email Signup */}
      <section id="signup" className="py-24 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 -z-10" />
        
        <div className="max-w-xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Get Early Access
          </h2>
          <p className="text-muted-foreground mb-8">
            Join the waitlist and we'll reach out when access is available.
          </p>
          
          {isSubmitted ? (
            <div className="bg-success/10 border border-success/20 rounded-xl p-8">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <p className="text-foreground font-semibold text-lg">You're on the list!</p>
              <p className="text-sm text-muted-foreground mt-2">
                We'll reach out when access is available.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12 bg-card border-border/60"
                disabled={isSubmitting}
              />
              <Button type="submit" size="lg" disabled={isSubmitting} className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
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
          <p className="text-xs text-muted-foreground mt-5">
            We respect your privacy. No spam, ever.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="InsureOps" className="h-8 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Streamline loss run operations for insurance brokerages.
            </p>
            <div className="text-sm text-muted-foreground">
              <a href="mailto:hello@insureops.com" className="hover:text-primary transition-colors">
                hello@insureops.com
              </a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} InsureOps. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground max-w-md text-center md:text-right">
              This app helps manage loss run requests and documents. It does not analyze or interpret insurance data.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
