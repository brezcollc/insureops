import { useState } from "react";
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
            onClick={() => setDemoOpen(true)} 
            size="sm" 
            className="text-sm font-semibold px-6 h-9 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
            style={{ 
              background: 'linear-gradient(135deg, hsl(205 80% 50%), hsl(205 85% 42%))',
              color: 'white',
              boxShadow: '0 2px 12px hsla(205, 80%, 45%, 0.35)'
            }}
          >
            Request a Demo
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsla(210, 20%, 30%, 0.15) 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }} />
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
            Streamline Loss Run
            <span className="block mt-1" style={{ 
              background: 'linear-gradient(135deg, hsl(205 80% 60%), hsl(180 50% 50%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Operations
            </span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed" style={{ color: 'hsl(210 15% 58%)' }}>
            Purpose-built software for insurance brokerages to request, track, and manage loss runs — eliminating the manual chase.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setDemoOpen(true)} 
              className="gap-2.5 h-14 px-10 text-base font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
              style={{ 
                background: 'linear-gradient(135deg, hsl(205 80% 50%), hsl(205 85% 42%))',
                color: 'white',
                boxShadow: '0 6px 24px hsla(205, 80%, 45%, 0.35)',
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
              className="h-14 px-8 text-base font-medium rounded-xl transition-all duration-200"
              style={{ 
                color: 'hsl(210 15% 50%)',
                background: 'transparent'
              }}
            >
              See How It Works
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
              { icon: Layers, title: "Request in Bulk", desc: "Send loss run requests across multiple carriers with a few clicks.", accent: '205 80% 55%', featured: true },
              { icon: Activity, title: "Track Everything", desc: "Monitor responses, documents, and follow-ups in one central place.", accent: '180 50% 45%', featured: false },
              { icon: FolderOpen, title: "Stay Organized", desc: "Keep your book of business organized as it grows.", accent: '205 80% 55%', featured: false },
              { icon: ShieldCheck, title: "Built for Brokerages", desc: "Designed around real brokerage workflows, not generic tools.", accent: '152 55% 42%', featured: false },
            ].map((item, i) => (
              <Card key={i} className={`group border rounded-2xl transition-all duration-300 hover:-translate-y-1 ${i === 0 ? 'md:col-span-2 lg:col-span-1' : ''}`} style={{ 
                background: item.featured 
                  ? 'linear-gradient(160deg, hsl(215 40% 13%), hsl(215 35% 10%))' 
                  : 'hsl(215 40% 12%)',
                borderColor: item.featured ? 'hsl(205 60% 25%)' : 'hsl(215 30% 18%)',
                boxShadow: item.featured ? '0 4px 24px hsla(205, 60%, 30%, 0.08)' : 'none',
              }}>
                <CardContent className="pt-7 pb-6 px-6">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105 border" style={{
                    background: `hsla(${item.accent}, 0.08)`,
                    borderColor: `hsla(${item.accent}, 0.15)`,
                  }}>
                    <item.icon className="w-5 h-5" style={{ color: `hsl(${item.accent})` }} strokeWidth={1.75} />
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
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-6 transition-transform duration-300 group-hover:scale-105 border" style={{
                  background: `linear-gradient(145deg, hsl(${step.accent}), hsl(${step.accent} / 0.75))`,
                  borderColor: `hsl(${step.accent} / 0.4)`,
                  color: 'white',
                  boxShadow: `0 4px 16px hsl(${step.accent} / 0.2), inset 0 1px 0 hsl(0 0% 100% / 0.1)`
                }}>
                  {step.num}
                </div>
                <h3 className="font-semibold mb-3 text-lg" style={{ color: 'hsl(210 20% 90%)' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(210 15% 52%)' }}>
                  {step.desc}
                </p>
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
              { icon: CalendarClock, label: "Renewal Teams", accent: '152 55% 42%' },
            ].map((item, i) => (
              <div key={i} className="group flex items-center gap-4 rounded-2xl px-7 py-5 border transition-all duration-300 hover:-translate-y-0.5" style={{
                background: 'linear-gradient(160deg, hsl(215 40% 13%), hsl(215 40% 11%))',
                borderColor: 'hsl(215 30% 18%)',
              }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105 border" style={{
                  background: `hsla(${item.accent}, 0.08)`,
                  borderColor: `hsla(${item.accent}, 0.15)`,
                }}>
                  <item.icon className="w-5 h-5" style={{ color: `hsl(${item.accent})` }} strokeWidth={1.75} />
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

      {/* CTA Section */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full -z-10" style={{
          background: 'radial-gradient(ellipse, hsla(205, 80%, 55%, 0.06) 0%, transparent 70%)'
        }} />
        
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: 'hsl(210 20% 93%)' }}>
            Ready to simplify your loss run workflow?
          </h2>
          <p className="text-lg mb-10" style={{ color: 'hsl(210 15% 55%)' }}>
            See how InsureOps helps brokerages save time and stay organized.
          </p>
          <Button
            size="lg"
            onClick={() => setDemoOpen(true)}
            className="gap-2.5 h-14 px-10 text-base font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, hsl(205 80% 50%), hsl(205 85% 42%))',
              color: 'white',
              boxShadow: '0 6px 24px hsla(205, 80%, 45%, 0.35)',
              letterSpacing: '0.01em'
            }}
          >
            Request a Demo
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-sm mt-6" style={{ color: 'hsl(210 15% 40%)' }}>
            No commitment required. We'll walk you through the platform.
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
              Loss run operations software for insurance brokerages.
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

      {/* Demo Request Modal */}
      <DemoRequestModal open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  );
};

export default LandingPage;
