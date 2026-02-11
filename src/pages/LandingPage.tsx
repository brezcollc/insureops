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
  BarChart3,
  Shield,
  Zap
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
    <div className="landing-dark min-h-screen" style={{ background: 'hsl(215 50% 8%)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b" style={{ 
        background: 'hsla(215, 50%, 8%, 0.92)', 
        backdropFilter: 'blur(16px)',
        borderColor: 'hsl(215 30% 18%)'
      }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="InsureOps Logo" className="h-10 w-auto" />
          </div>
          <Button 
            onClick={scrollToSignup} 
            size="sm" 
            className="text-sm font-medium px-5 h-9 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
            style={{ 
              background: 'hsl(205 80% 55%)', 
              color: 'white',
              boxShadow: '0 2px 12px hsla(205, 80%, 55%, 0.25)'
            }}
          >
            Request Access
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-28 px-6 relative overflow-hidden">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 -z-10" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsla(210, 20%, 30%, 0.15) 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }} />
        {/* Soft glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full -z-10" style={{
          background: 'radial-gradient(ellipse, hsla(205, 80%, 55%, 0.08) 0%, transparent 70%)'
        }} />
        
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <img 
              src={logo} 
              alt="InsureOps" 
              className="h-40 md:h-48 lg:h-56 w-auto" 
              style={{ filter: 'drop-shadow(0 4px 24px hsla(205, 80%, 55%, 0.15))' }}
            />
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.08]" style={{ color: 'hsl(210 20% 95%)' }}>
            Automate Loss Run
            <span className="block mt-1" style={{ 
              background: 'linear-gradient(135deg, hsl(205 80% 60%), hsl(180 50% 50%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Operations
            </span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed" style={{ color: 'hsl(210 15% 58%)' }}>
            A purpose-built platform for insurance brokerages to request, track, and manage loss runs — without the manual chase.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={scrollToSignup} 
              className="gap-2 h-13 px-8 text-base font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
              style={{ 
                background: 'hsl(205 80% 55%)', 
                color: 'white',
                boxShadow: '0 4px 20px hsla(205, 80%, 55%, 0.3)'
              }}
            >
              Request Early Access
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} 
              className="h-13 px-8 text-base font-medium rounded-xl transition-all duration-200"
              style={{ 
                borderColor: 'hsl(215 30% 25%)',
                color: 'hsl(210 15% 65%)',
                background: 'transparent'
              }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, hsl(215 30% 20%), transparent)' }} />
      </div>

      {/* Value Proposition */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: 'hsl(210 20% 93%)' }}>
              Everything you need to manage loss runs
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'hsl(210 15% 55%)' }}>
              Streamline your operations with tools designed specifically for insurance brokerages.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Send, title: "Request in Bulk", desc: "Send loss run requests across multiple carriers with a few clicks.", accent: '205 80% 55%' },
              { icon: BarChart3, title: "Track Everything", desc: "Monitor responses, documents, and follow-ups in one central place.", accent: '180 50% 45%' },
              { icon: FileText, title: "Stay Organized", desc: "Keep your book of business organized as it grows.", accent: '205 80% 55%' },
              { icon: Shield, title: "Built for Brokerages", desc: "Designed around real brokerage workflows, not generic tools.", accent: '152 55% 42%' },
            ].map((item, i) => (
              <Card key={i} className="group border rounded-2xl transition-all duration-300 hover:-translate-y-1" style={{ 
                background: 'hsl(215 40% 12%)',
                borderColor: 'hsl(215 30% 18%)',
              }}>
                <CardContent className="pt-7 pb-6 px-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105" style={{
                    background: `hsla(${item.accent}, 0.1)`,
                  }}>
                    <item.icon className="w-6 h-6" style={{ color: `hsl(${item.accent})` }} />
                  </div>
                  <h3 className="font-semibold mb-2 text-base" style={{ color: 'hsl(210 20% 90%)' }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'hsl(210 15% 52%)' }}>
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, hsl(215 30% 20%), transparent)' }} />
      </div>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: 'hsl(210 20% 93%)' }}>
              How It Works
            </h2>
            <p className="text-lg" style={{ color: 'hsl(210 15% 55%)' }}>
              Get started in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {[
              { num: "1", title: "Add Clients & Policies", desc: "Set up your client database with their policy information and carrier details.", accent: '205 80% 55%' },
              { num: "2", title: "Send Requests", desc: "Request loss runs and send follow-ups with templated emails.", accent: '195 65% 50%' },
              { num: "3", title: "Track & Complete", desc: "Upload documents, mark requests complete, and stay organized.", accent: '180 50% 45%' },
            ].map((step, i) => (
              <div key={i} className="group text-center relative rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1" style={{
                background: 'hsl(215 40% 11%)',
                borderColor: 'hsl(215 30% 18%)',
              }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-6 transition-transform duration-300 group-hover:scale-105" style={{
                  background: `linear-gradient(135deg, hsl(${step.accent}), hsl(${step.accent} / 0.7))`,
                  color: 'white',
                  boxShadow: `0 4px 16px hsl(${step.accent} / 0.25)`
                }}>
                  {step.num}
                </div>
                <h3 className="font-semibold mb-3 text-lg" style={{ color: 'hsl(210 20% 90%)' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(210 15% 52%)' }}>
                  {step.desc}
                </p>
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-11 left-[65%] w-[70%] h-px" style={{
                    background: `linear-gradient(to right, hsl(${step.accent} / 0.3), transparent)`
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, hsl(215 30% 20%), transparent)' }} />
      </div>

      {/* Who It's For */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: 'hsl(210 20% 93%)' }}>
            Built for Insurance Operations
          </h2>
          <p className="text-lg mb-12" style={{ color: 'hsl(210 15% 55%)' }}>
            InsureOps is designed for teams who manage loss run workflows daily.
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            {[
              { icon: Building2, label: "Independent Brokerages", accent: '205 80% 55%' },
              { icon: Users, label: "Account Managers", accent: '180 50% 45%' },
              { icon: Clock, label: "Renewal Teams", accent: '152 55% 42%' },
            ].map((item, i) => (
              <div key={i} className="group flex items-center gap-4 rounded-2xl px-7 py-5 border transition-all duration-300 hover:-translate-y-0.5" style={{
                background: 'hsl(215 40% 12%)',
                borderColor: 'hsl(215 30% 18%)',
              }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105" style={{
                  background: `hsla(${item.accent}, 0.1)`,
                }}>
                  <item.icon className="w-5 h-5" style={{ color: `hsl(${item.accent})` }} />
                </div>
                <span className="font-medium text-base" style={{ color: 'hsl(210 20% 88%)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, hsl(215 30% 20%), transparent)' }} />
      </div>

      {/* Email Signup */}
      <section id="signup" className="py-28 px-6 relative overflow-hidden">
        {/* Soft glow behind form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full -z-10" style={{
          background: 'radial-gradient(ellipse, hsla(205, 80%, 55%, 0.06) 0%, transparent 70%)'
        }} />
        
        <div className="max-w-xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{
            background: 'hsla(205, 80%, 55%, 0.1)',
            boxShadow: '0 4px 20px hsla(205, 80%, 55%, 0.08)'
          }}>
            <Mail className="w-8 h-8" style={{ color: 'hsl(205 80% 55%)' }} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: 'hsl(210 20% 93%)' }}>
            Get Early Access
          </h2>
          <p className="text-lg mb-10" style={{ color: 'hsl(210 15% 55%)' }}>
            Join the waitlist and we'll reach out when access is available.
          </p>
          
          {isSubmitted ? (
            <div className="rounded-2xl p-10 border" style={{
              background: 'hsla(152, 55%, 42%, 0.08)',
              borderColor: 'hsla(152, 55%, 42%, 0.2)',
            }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{
                background: 'hsla(152, 55%, 42%, 0.15)',
              }}>
                <CheckCircle className="w-7 h-7" style={{ color: 'hsl(152 55% 45%)' }} />
              </div>
              <p className="font-semibold text-xl" style={{ color: 'hsl(210 20% 93%)' }}>You're on the list!</p>
              <p className="mt-2" style={{ color: 'hsl(210 15% 55%)' }}>
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
                className="flex-1 h-13 rounded-xl text-base transition-all duration-200"
                style={{
                  background: 'hsl(215 40% 12%)',
                  borderColor: 'hsl(215 30% 22%)',
                  color: 'hsl(210 20% 90%)',
                }}
                disabled={isSubmitting}
              />
              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting} 
                className="gap-2 h-13 px-8 rounded-xl text-base font-semibold transition-all duration-200 hover:-translate-y-0.5"
                style={{ 
                  background: 'hsl(205 80% 55%)', 
                  color: 'white',
                  boxShadow: '0 4px 20px hsla(205, 80%, 55%, 0.3)'
                }}
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
          <p className="text-sm mt-6" style={{ color: 'hsl(210 15% 40%)' }}>
            We respect your privacy. No spam, ever.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-14 px-6 border-t" style={{ borderColor: 'hsl(215 30% 15%)', background: 'hsl(215 50% 6%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <img src={logo} alt="InsureOps" className="h-9 w-auto opacity-80" />
            </div>
            <p className="text-sm text-center" style={{ color: 'hsl(210 15% 45%)' }}>
              Streamline loss run operations for insurance brokerages.
            </p>
            <div className="text-sm">
              <a 
                href="mailto:hello@insureops.com" 
                className="transition-colors duration-200"
                style={{ color: 'hsl(210 15% 45%)' }}
              >
                hello@insureops.com
              </a>
            </div>
          </div>
          <div className="mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTopColor: 'hsl(215 30% 13%)', borderTopWidth: '1px' }}>
            <p className="text-xs" style={{ color: 'hsl(210 15% 35%)' }}>
              © {new Date().getFullYear()} InsureOps. All rights reserved.
            </p>
            <p className="text-xs max-w-md text-center md:text-right" style={{ color: 'hsl(210 15% 35%)' }}>
              This app helps manage loss run requests and documents. It does not analyze or interpret insurance data.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
