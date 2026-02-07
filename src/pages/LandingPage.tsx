import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Send, 
  CheckCircle, 
  Users, 
  Building2, 
  Clock, 
  ArrowRight,
  Mail,
  Loader2
} from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">InsureOps</span>
          </div>
          <Button onClick={scrollToSignup} size="sm">
            Request Access
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6">
            Automate Loss Run Requests
            <span className="block text-primary">Without the Chase</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            A simple operations platform for insurance brokerages to request, track, and manage loss runs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={scrollToSignup} className="gap-2">
              Request Early Access
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground mb-12">
            Everything you need to manage loss runs
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border/50 bg-card">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Send className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Request in Bulk</h3>
                <p className="text-sm text-muted-foreground">
                  Send loss run requests across multiple carriers with a few clicks.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Track Everything</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor responses, documents, and follow-ups in one central place.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Stay Organized</h3>
                <p className="text-sm text-muted-foreground">
                  Keep your book of business organized as it grows.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-5 h-5 text-primary" />
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
          <p className="text-center text-muted-foreground mb-12">
            Get started in three simple steps
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-foreground mb-2">Add Clients & Policies</h3>
              <p className="text-sm text-muted-foreground">
                Set up your client database with their policy information and carrier details.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-foreground mb-2">Send Requests</h3>
              <p className="text-sm text-muted-foreground">
                Request loss runs and send follow-ups with templated emails.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold mx-auto mb-4">
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
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Built for Insurance Operations
          </h2>
          <p className="text-muted-foreground mb-10">
            InsureOps is designed for teams who manage loss run workflows daily.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-5 py-3">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="text-foreground font-medium">Independent Brokerages</span>
            </div>
            <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-5 py-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-foreground font-medium">Account Managers</span>
            </div>
            <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-5 py-3">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-foreground font-medium">Renewal Teams</span>
            </div>
          </div>
        </div>
      </section>

      {/* Email Signup */}
      <section id="signup" className="py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Get Early Access
          </h2>
          <p className="text-muted-foreground mb-8">
            Join the waitlist and we'll reach out when access is available.
          </p>
          
          {isSubmitted ? (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
              <CheckCircle className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-foreground font-medium">You're on the list!</p>
              <p className="text-sm text-muted-foreground mt-1">
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
                className="flex-1 h-12"
                disabled={isSubmitting}
              />
              <Button type="submit" size="lg" disabled={isSubmitting} className="gap-2">
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
          <p className="text-xs text-muted-foreground mt-4">
            We respect your privacy. No spam, ever.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <FileText className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">InsureOps</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Streamline loss run operations for insurance brokerages.
            </p>
            <div className="text-sm text-muted-foreground">
              <a href="mailto:hello@insureops.com" className="hover:text-foreground transition-colors">
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
