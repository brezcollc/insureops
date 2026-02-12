import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Send, 
  Users, 
  Building2, 
  Clock, 
  ArrowRight,
  FileText,
  BarChart3,
  Shield,
} from "lucide-react";
import logo from "@/assets/logo.png";
import DemoRequestModal from "@/components/DemoRequestModal";

const LandingPage = () => {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/92 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="InsureOps Logo" className="h-10 w-auto" />
          </div>
          <Button 
            onClick={() => setDemoOpen(true)} 
            size="sm" 
            className="text-sm font-semibold px-6 h-9 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            Request a Demo
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(200 25% 88% / 0.4) 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }} />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full -z-10" style={{
          background: 'radial-gradient(ellipse, hsl(200 80% 35% / 0.06) 0%, transparent 70%)'
        }} />
        
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <img 
              src={logo} 
              alt="InsureOps" 
              className="h-40 md:h-48 lg:h-56 w-auto" 
              style={{ filter: 'drop-shadow(0 4px 24px hsl(200 80% 35% / 0.12))' }}
            />
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.08] text-foreground">
            Streamline Loss Run
            <span className="block mt-1 text-primary">
              Operations
            </span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed text-muted-foreground">
            Purpose-built software for insurance brokerages to request, track, and manage loss runs — eliminating the manual chase.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setDemoOpen(true)} 
              className="gap-2.5 h-14 px-10 text-base font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
              style={{ 
                boxShadow: '0 6px 24px hsl(200 80% 35% / 0.25)',
                letterSpacing: '0.01em'
              }}
            >
              Request a Demo
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              size="lg" 
              variant="ghost" 
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} 
              className="h-14 px-8 text-base font-medium rounded-xl text-muted-foreground"
            >
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-border" />
      </div>

      {/* Value Proposition */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground">
              Everything you need to manage loss runs
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed text-muted-foreground">
              Streamline your operations with tools designed specifically for insurance brokerages.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Send, title: "Request in Bulk", desc: "Send loss run requests across multiple carriers with a few clicks.", color: "text-primary" },
              { icon: BarChart3, title: "Track Everything", desc: "Monitor responses, documents, and follow-ups in one central place.", color: "text-accent" },
              { icon: FileText, title: "Stay Organized", desc: "Keep your book of business organized as it grows.", color: "text-primary" },
              { icon: Shield, title: "Built for Brokerages", desc: "Designed around real brokerage workflows, not generic tools.", color: "text-success" },
            ].map((item, i) => (
              <Card key={i} className="group rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                <CardContent className="pt-7 pb-6 px-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105 ${
                    item.color === "text-primary" ? "bg-primary/10" : 
                    item.color === "text-accent" ? "bg-accent/10" : "bg-success/10"
                  }`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h3 className="font-semibold mb-2 text-base text-foreground">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
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
        <div className="h-px bg-border" />
      </div>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {[
              { num: "1", title: "Add Clients & Policies", desc: "Set up your client database with their policy information and carrier details.", bgClass: "bg-primary" },
              { num: "2", title: "Send Requests", desc: "Request loss runs and send follow-ups with templated emails.", bgClass: "bg-primary" },
              { num: "3", title: "Track & Complete", desc: "Upload documents, mark requests complete, and stay organized.", bgClass: "bg-accent" },
            ].map((step, i) => (
              <div key={i} className="group text-center relative rounded-2xl p-8 border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-6 transition-transform duration-300 group-hover:scale-105 ${step.bgClass} text-primary-foreground`}
                  style={{ boxShadow: `0 4px 16px hsl(200 80% 35% / 0.2)` }}
                >
                  {step.num}
                </div>
                <h3 className="font-semibold mb-3 text-lg text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-11 left-[65%] w-[70%] h-px bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-border" />
      </div>

      {/* Who It's For */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground">
            Built for Insurance Operations
          </h2>
          <p className="text-lg mb-12 text-muted-foreground">
            InsureOps is designed for teams who manage loss run workflows daily.
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            {[
              { icon: Building2, label: "Independent Brokerages", color: "text-primary", bg: "bg-primary/10" },
              { icon: Users, label: "Account Managers", color: "text-accent", bg: "bg-accent/10" },
              { icon: Clock, label: "Renewal Teams", color: "text-success", bg: "bg-success/10" },
            ].map((item, i) => (
              <div key={i} className="group flex items-center gap-4 rounded-2xl px-7 py-5 border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${item.bg}`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="font-medium text-base text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-border" />
      </div>

      {/* CTA Section */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full -z-10" style={{
          background: 'radial-gradient(ellipse, hsl(200 80% 35% / 0.05) 0%, transparent 70%)'
        }} />
        
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground">
            Ready to simplify your loss run workflow?
          </h2>
          <p className="text-lg mb-10 text-muted-foreground">
            See how InsureOps helps brokerages save time and stay organized.
          </p>
          <Button
            size="lg"
            onClick={() => setDemoOpen(true)}
            className="gap-2.5 h-14 px-10 text-base font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            style={{
              boxShadow: '0 6px 24px hsl(200 80% 35% / 0.25)',
              letterSpacing: '0.01em'
            }}
          >
            Request a Demo
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-sm mt-6 text-muted-foreground/60">
            No commitment required. We'll walk you through the platform.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-14 px-6 border-t border-border bg-muted">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <img src={logo} alt="InsureOps" className="h-9 w-auto opacity-80" />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Loss run operations software for insurance brokerages.
            </p>
            <div className="text-sm">
              <a 
                href="mailto:hello@insureops.com" 
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                hello@insureops.com
              </a>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} InsureOps. All rights reserved.
            </p>
            <p className="text-xs max-w-md text-center md:text-right text-muted-foreground/60">
              This app helps manage loss run requests and documents. It does not analyze or interpret insurance data.
            </p>
          </div>
        </div>
      </footer>

      {/* Demo Request Modal */}
      <DemoRequestModal open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  );
};

export default LandingPage;
