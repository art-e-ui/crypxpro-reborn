import BannerSlideshow from "@/components/BannerSlideshow";
import FeatureCards from "@/components/FeatureCards";
import { LiveTickerMarquee } from "@/components/LiveTickerMarquee";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight, Shield, Globe, Diamond } from "lucide-react";
import { motion } from "motion/react";
import { Logo } from "@/components/shared/Logo";
import { CryptoAuthView } from "@/components/auth/CryptoAuthView";
import { useState } from "react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isMobileAuth, setIsMobileAuth] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileAuth(window.innerWidth < 1024); // lg breakpoint equivalent
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const hostname = window.location.hostname;
    const isDomainAdmin = hostname === 'admin.crypxpro.com' || hostname.startsWith('admin.');
    const searchParams = window.location.search;
    
    if (isDomainAdmin) {
      navigate(`/auth${searchParams}`, { replace: true });
      return;
    }

    if (!loading && user) {
      navigate("/app/home", { replace: true });
      return;
    }

    const urlParams = new URLSearchParams(searchParams);
    const ref = urlParams.get('ref');
    if (ref && !loading && !user) {
      navigate(`/auth?ref=${ref}`, { replace: true });
    }
  }, [user, loading, navigate]);

  const stats = [
    { label: "Quarterly Volume", value: "$42B+" },
    { label: "Global Clients", value: "1.2M+" },
    { label: "Execution Speed", value: "<5ms" },
    { label: "Secure Vaults", value: "Offline" },
  ];

  if (isMobileAuth && !user) {
    return <CryptoAuthView />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-hidden font-sans">
      {/* Premium Dark Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-primary/10 blur-[150px] opacity-70" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => navigate("/")}>
            <Logo size={48} variant="FULL" />
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            <a href="#" className="hover:text-primary transition-colors">Markets</a>
            <a href="#" className="hover:text-primary transition-colors">Institution</a>
            <a href="#" className="hover:text-primary transition-colors">Wealth</a>
            <a href="#" className="hover:text-primary transition-colors">Rewards</a>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            {!user ? (
              <button 
                onClick={() => navigate("/auth")}
                className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground hover:text-primary transition-colors"
              >
                Sign In
              </button>
            ) : null}
            <button 
              onClick={() => navigate("/auth")}
              className="px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl border border-primary/50 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-16 sm:pt-20 relative z-10">
        {/* Live Ticker */}
        <div className="border-b border-border bg-muted/40 overflow-hidden">
          <LiveTickerMarquee />
        </div>

        {/* Hero Section */}
        <section className="relative pt-16 sm:pt-32 pb-16 sm:pb-24 px-6">
          <div className="max-w-5xl mx-auto text-center relative z-10 px-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-border bg-card/40 text-muted-foreground text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mb-8 backdrop-blur-md"
            >
              <Diamond size={12} className="text-primary" />
              Private Wealth & Digital Assets
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-4xl sm:text-6xl md:text-7xl font-light tracking-tight leading-[1.1] text-foreground mb-8"
            >
              The Premier Standard <br className="hidden sm:block" />
              <span className="text-primary italic font-medium">for Digital Finance</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-muted-foreground text-sm sm:text-lg md:text-xl max-w-2xl mx-auto mb-12 sm:mb-16 font-light leading-relaxed"
            >
              Access institutional-grade liquidity, unparalleled security infrastructure, and professional execution mechanisms designed for the elite trader.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4"
            >
               <button 
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm tracking-widest uppercase shadow-brand transition-all hover:scale-105 active:scale-95"
              >
                Create Account
              </button>
              <button 
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto px-10 py-4 border border-border bg-card/50 text-foreground rounded-2xl font-bold text-sm tracking-widest uppercase transition-all hover:bg-muted"
              >
                Learn More
              </button>
            </motion.div>
          </div>
        </section>

        {/* Slideshow */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="max-w-6xl mx-auto px-4"
        >
          <BannerSlideshow />
        </motion.div>

        {/* Quick Stats */}
        <section className="py-32 border-y border-border bg-secondary/30 mt-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-16 text-center divide-x divide-border">
              {stats.map((stat, i) => (
                <motion.div 
                   key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 1 }}
                  className={i === 0 || i === 2 ? "border-none" : ""} 
                >
                  <p className="text-3xl md:text-4xl font-light tracking-tight mb-4 text-foreground">{stat.value}</p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <FeatureCards />

        {/* Trust Section */}
        <section className="py-32 px-6 relative overflow-hidden bg-secondary/50 border-y border-border">
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-10 leading-[1.2] text-foreground">
                  Uncompromising <br />
                  <span className="text-primary italic font-medium">Security Standards.</span>
                </h2>
                <div className="space-y-8">
                  <div className="flex gap-6 items-start">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0 border border-border text-foreground rounded-none">
                      <Shield size={20} strokeWidth={1} />
                    </div>
                    <div>
                      <h4 className="font-medium text-lg mb-2 text-foreground">Military-Grade Cold Storage</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed font-light">The vast majority of digital assets are continuously kept in geographically distributed offline vaults, protected by advanced cryptographic protocols.</p>
                    </div>
                  </div>
                  <div className="w-full h-px bg-border" />
                  <div className="flex gap-6 items-start">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0 border border-border text-foreground rounded-none">
                      <Globe size={20} strokeWidth={1} />
                    </div>
                    <div>
                      <h4 className="font-medium text-lg mb-2 text-foreground">Global Regulatory Compliance</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed font-light">Operating strictly within premier international jurisdictions. Fully licensed, routinely audited, and transparent.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="p-16 border border-border bg-card/60 backdrop-blur-xl">
                  <div className="text-center">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-16">Trusted by Industry Partners</p>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-16 text-muted-foreground/30">
                      <div className="flex items-center justify-center font-light text-2xl tracking-widest hover:text-primary transition-colors cursor-default">BINANCE</div>
                      <div className="flex items-center justify-center font-light text-2xl tracking-widest hover:text-primary transition-colors cursor-default">COINBASE</div>
                      <div className="flex items-center justify-center font-light text-2xl tracking-widest hover:text-primary transition-colors cursor-default">KRAKEN</div>
                      <div className="flex items-center justify-center font-light text-2xl tracking-widest hover:text-primary transition-colors cursor-default">BYBIT</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-40 px-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] -z-10"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-light tracking-tight mb-8 leading-[1.1] text-foreground">
              Elevate Your <br />
              <span className="text-foreground italic font-medium">Trading Experience</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg mb-16 font-light max-w-2xl mx-auto">
              Open an institutional-grade account today to access premier liquidity, personalized service, and professional trading architecture.
            </p>
            <button 
              onClick={() => navigate("/auth")}
              className="px-10 py-4 border border-foreground text-foreground hover:bg-foreground hover:text-background font-medium text-sm tracking-widest uppercase transition-all duration-500 mx-auto inline-block"
            >
              Apply For Account
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary py-24 px-6 border-t border-border relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
            <div className="md:col-span-2">
              <div className="mb-8 opacity-80">
                 <Logo size={62} variant="FULL" />
              </div>
              <p className="text-muted-foreground max-w-sm text-xs font-light leading-loose">
                CrypX-Pro provides institutional-grade digital asset infrastructure to professional traders, wealth managers, and corporate entities globally.
              </p>
            </div>
            
            <div>
              <h5 className="font-medium text-[10px] uppercase tracking-[0.2em] text-foreground/50 mb-8">Corporate & Legal</h5>
              <div className="flex flex-col gap-5 text-xs font-light text-muted-foreground">
                <a href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</a>
                <a href="/policies" className="hover:text-primary transition-colors">User Policies & Safeguards</a>
                <a href="/faq" className="hover:text-primary transition-colors">App FAQ & Guide</a>
                <a href="mailto:admin@crypxpro.com" className="hover:text-primary transition-colors">admin@crypxpro.com</a>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-[10px] uppercase tracking-[0.2em] text-foreground/50 mb-8">Client Service</h5>
              <div className="flex flex-col gap-5 text-xs font-light text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors">Wealth Support</a>
                <a href="#" className="hover:text-primary transition-colors">Institutional APIs</a>
                <a href="#" className="hover:text-primary transition-colors">Fee Structures</a>
                <a href="#" className="hover:text-primary transition-colors">System Status</a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em]">© {new Date().getFullYear()} CrypX-Pro Holdings. All Rights Reserved.</p>
            <div className="flex items-center gap-8">
               <span className="text-muted-foreground hover:text-primary transition-all cursor-pointer text-xs font-light tracking-widest uppercase">X</span>
               <span className="text-muted-foreground hover:text-primary transition-all cursor-pointer text-xs font-light tracking-widest uppercase">LinkedIn</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
