import { motion } from "motion/react";
import { Logo } from "@/components/shared/Logo";
import { AuthForm } from "./AuthForm";

export const CryptoAuthView = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background">
      {/* Immersive Crypto Background */}
      <div 
        className="absolute inset-0 z-0 opacity-5 grayscale pointer-events-none"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1644024276273-4b901946849a?auto=format&fit=crop&q=80&w=2000")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 opacity-20 blur-[100px] dark:opacity-10"
          style={{
            background: `
              radial-gradient(circle at 15% 20%, var(--primary) 0%, transparent 40%),
              radial-gradient(circle at 85% 80%, var(--accent) 0%, transparent 40%),
              radial-gradient(circle at 50% 50%, var(--muted) 0%, transparent 60%)
            `
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg px-6 pt-40 pb-12 flex flex-col items-center">
        {/* Logo and Tagline */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <Logo size={80} variant="SYMBOL" className="mb-6 mx-auto drop-shadow-[0_0_25px_rgba(255,191,0,0.2)]" />
          <h2 className="text-foreground text-2xl font-light tracking-[0.4em] uppercase">CrypX Pro</h2>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] mt-2 font-medium">Digital Assets Elite</p>
        </motion.div>

        {/* Ultra-Transparent Glassmorphic Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full relative p-10 rounded-[48px] border border-border bg-card/40 backdrop-blur-[30px] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.08)] transition-all"
        >
          {/* Subtle Inner Glow */}
          <div className="absolute inset-0 rounded-[48px] bg-gradient-to-br from-white/10 to-transparent pointer-events-none dark:from-white/5" />
          
          <AuthForm isInsideModal={true} />
        </motion.div>

        {/* Footer info in glass mode */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-[10px] text-foreground uppercase tracking-[0.2em] whitespace-nowrap font-medium"
        >
          Secured by Military-Grade Encryption
        </motion.p>
      </div>
    </div>
  );
};
