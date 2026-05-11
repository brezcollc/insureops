import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Layers, 
  Users, 
  Building2, 
  CalendarClock, 
  ArrowRight,
  FolderOpen,
  Activity,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import logo from "@/assets/logo.png";
import DemoRequestModal from "@/components/DemoRequestModal";

const LandingPage = () => {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="landing-dark min-h-screen" style={{ background: '#0A0D12', color: '#FFFFFF' }}>
      {/* Top accent bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[3px]" style={{ background: '#4F46E5' }} />
      {/* Header */}
      <header className="fixed left-0 right-0 z-50 border-b" style={{ 
        top: '3px',
        background: 'rgba(10, 13, 18, 0.92)', 
        backdropFilter: 'blur(16px)',
        borderColor: '#1E2230'
      }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="InsureOps Logo" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/auth"
              className="text-sm font-medium transition-colors duration-200 hover:opacity-100"
              style={{ color: '#8B92A5', opacity: 0.9 }}
            >
              Existing Clients – Login
            </Link>
            <Button 
              onClick={() => setDemoOpen(true)} 
              size="sm" 
              className="text-sm font-bold px-6 h-9 rounded-md transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
              style={{ 
                background: '#4F46E5',
                color: 'white',
                boxShadow: '0 2px 14px rgba(79, 70, 229, 0.45)'
              }}
            >
              Request a Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-grid-institutional" />
        <div className="absolute inset-0 -z-10" style={{
          background: 'linear-gradient(180deg, transparent 0%, #0A0D12 80%)'
        }} />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full -z-10" style={{
          background: 'radial-gradient(ellipse, rgba(79, 70, 229, 0.18) 0%, transparent 70%)'
        }} />
        
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <img 
              src={logo} 
              alt="InsureOps" 
              className="h-32 md:h-40 lg:h-44 w-auto" 
              style={{ filter: 'drop-shadow(0 4px 24px rgba(79, 70, 229, 0.25))' }}
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border" style={{
            background: 'rgba(79, 70, 229, 0.08)',
            borderColor: 'rgba(79, 70, 229, 0.3)',
            borderRadius: '4px'
          }}>
            <span className="w-1.5 h-1.5" style={{ background: '#C9A84C' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#C9A84C', letterSpacing: '0.15em' }}>
              Institutional-Grade Operations Platform
            </span>
          </div>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-[0.98]" style={{ color: '#FFFFFF', letterSpacing: '-0.035em' }}>
            Loss Run Operations,
            <span className="block mt-2" style={{ color: '#4F46E5' }}>Industrialized.</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-snug font-medium" style={{ color: '#8B92A5' }}>
            Purpose-built software for insurance brokerages to request, track, and manage loss runs — eliminating the manual chase.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setDemoOpen(true)} 
              className="gap-2.5 h-14 px-10 text-base font-bold rounded-md transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
              style={{ 
                background: '#4F46E5',
                color: 'white',
                boxShadow: '0 8px 28px rgba(79, 70, 229, 0.5)',
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
              className="h-14 px-8 text-base font-semibold rounded-md transition-all duration-200 border"
              style={{ 
                color: '#FFFFFF',
                background: 'transparent',
                borderColor: '#1E2230'
              }}
            >
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, #1E2230, transparent)' }} />
      </div>

      {/* Value Proposition */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Everything you need to manage loss runs
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-snug" style={{ color: '#8B92A5' }}>
              Streamline your operations with tools designed specifically for insurance brokerages.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Layers, title: "Request in Bulk", desc: "Send loss run requests across multiple carriers with a few clicks." },
              { icon: Activity, title: "Track Everything", desc: "Monitor responses, documents, and follow-ups in one central place." },
              { icon: FolderOpen, title: "Stay Organized", desc: "Keep your book of business organized as it grows." },
              { icon: ShieldCheck, title: "Built for Brokerages", desc: "Designed around real brokerage workflows, not generic tools." },
            ].map((item, i) => (
              <Card key={i} className="group border transition-all duration-300 hover:-translate-y-1" style={{ 
                background: '#111318',
                borderColor: '#1E2230',
                borderRadius: '6px',
              }}>
                <CardContent className="pt-7 pb-6 px-6">
                  <div className="w-11 h-11 flex items-center justify-center mb-5 border" style={{
                    background: 'rgba(79, 70, 229, 0.1)',
                    borderColor: 'rgba(79, 70, 229, 0.25)',
                    borderRadius: '4px',
                  }}>
                    <item.icon className="w-5 h-5" style={{ color: '#4F46E5' }} strokeWidth={2} />
                  </div>
                  <h3 className="font-bold mb-2 text-base" style={{ color: '#FFFFFF', letterSpacing: '-0.01em' }}>{item.title}</h3>
                  <p className="text-sm leading-snug" style={{ color: '#8B92A5' }}>
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
        <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, #1E2230, transparent)' }} />
      </div>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              How It Works
            </h2>
            <p className="text-lg" style={{ color: '#8B92A5' }}>
              Get started in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: "01 / Onboard", title: "Add Clients & Policies", desc: "Set up your client database with their policy information and carrier details." },
              { label: "02 / Dispatch", title: "Send Requests", desc: "Request loss runs and send follow-ups with templated emails." },
              { label: "03 / Resolve", title: "Track & Complete", desc: "Upload documents, mark requests complete, and stay organized." },
            ].map((step, i) => (
              <div key={i} className="group relative p-7 border-l-2 border transition-all duration-300 hover:-translate-y-1" style={{
                background: '#111318',
                borderColor: '#1E2230',
                borderLeftColor: '#4F46E5',
                borderLeftWidth: '3px',
                borderRadius: '6px',
              }}>
                <div className="text-xs font-bold uppercase mb-4 font-mono" style={{ color: '#4F46E5', letterSpacing: '0.12em' }}>
                  {step.label}
                </div>
                <h3 className="font-bold mb-3 text-xl" style={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}>{step.title}</h3>
                <p className="text-sm leading-snug" style={{ color: '#8B92A5' }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, #1E2230, transparent)' }} />
      </div>

      {/* Who It's For */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Built for Insurance Operations
          </h2>
          <p className="text-lg mb-12" style={{ color: '#8B92A5' }}>
            InsureOps is designed for teams who manage loss run workflows daily.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Building2, label: "Independent Brokerages", desc: "Run a tighter book with fewer dropped renewals." },
              { icon: Users, label: "Account Managers", desc: "Keep every carrier follow-up on schedule." },
              { icon: CalendarClock, label: "Renewal Teams", desc: "Hit renewal deadlines without the scramble." },
            ].map((item, i) => (
              <div key={i} className="group text-left p-6 border transition-all duration-300 hover:-translate-y-1" style={{
                background: '#111318',
                borderColor: '#1E2230',
                borderLeftColor: '#C9A84C',
                borderLeftWidth: '3px',
                borderRadius: '6px',
              }}>
                <div className="w-10 h-10 flex items-center justify-center mb-4 border" style={{
                  background: 'rgba(201, 168, 76, 0.1)',
                  borderColor: 'rgba(201, 168, 76, 0.3)',
                  borderRadius: '4px',
                }}>
                  <item.icon className="w-5 h-5" style={{ color: '#C9A84C' }} strokeWidth={2} />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#FFFFFF', letterSpacing: '-0.01em' }}>{item.label}</h3>
                <p className="text-sm" style={{ color: '#8B92A5' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, #1E2230, transparent)' }} />
      </div>

      {/* CTA Section */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full -z-10" style={{
          background: 'radial-gradient(ellipse, rgba(79, 70, 229, 0.12) 0%, transparent 70%)'
        }} />
        
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Ready to simplify your loss run workflow?
          </h2>
          <p className="text-lg mb-10" style={{ color: '#8B92A5' }}>
            See how InsureOps helps brokerages save time and stay organized.
          </p>
          <Button
            size="lg"
            onClick={() => setDemoOpen(true)}
            className="gap-2.5 h-14 px-10 text-base font-bold rounded-md transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
            style={{
              background: '#4F46E5',
              color: 'white',
              boxShadow: '0 8px 28px rgba(79, 70, 229, 0.5)',
              letterSpacing: '0.01em'
            }}
          >
            Request a Demo
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-sm mt-6" style={{ color: '#8B92A5', opacity: 0.7 }}>
            No commitment required. We'll walk you through the platform.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-14 px-6 border-t" style={{ borderColor: '#1E2230', background: '#06080C' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <img src={logo} alt="InsureOps" className="h-9 w-auto opacity-80" />
            </div>
            <p className="text-sm text-center" style={{ color: '#8B92A5' }}>
              Loss run operations software for insurance brokerages.
            </p>
            <div className="text-sm">
              <a 
                href="mailto:hello@insureops.com" 
                className="transition-colors duration-200"
                style={{ color: '#8B92A5' }}
              >
                hello@insureops.com
              </a>
            </div>
          </div>
          <div className="mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTopColor: '#1E2230', borderTopWidth: '1px' }}>
            <p className="text-xs" style={{ color: '#8B92A5', opacity: 0.6 }}>
              © {new Date().getFullYear()} InsureOps. All rights reserved.
            </p>
            <p className="text-xs max-w-md text-center md:text-right" style={{ color: '#8B92A5', opacity: 0.6 }}>
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
