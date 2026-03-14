import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { motion } from 'framer-motion';

const svgBg = "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h16v2h-6v6h6v8H8v-6H2v6H0V0zm4 4h2v2H4V4zm8 8h2v2h-2v-2zm-8 0h2v2H4v-2zm8-8h2v2h-2V4z' fill='%23a3b307' fill-opacity='0.55' fill-rule='evenodd'/%3E%3C/svg%3E\")";

const Stage5Severity = ({ onNext, score = 0, tag = "—", stage = "—" }) => {
  const scope = useRef(null);
  const scoreRef = useRef(null);

  useGSAP(() => {
    if (!scoreRef.current) return;

    gsap.fromTo(scoreRef.current,
      { innerText: '0' },
      {
        innerText: score,
        duration: 2,
        ease: 'power3.out',
        snap: { innerText: 0.1 },
        modifiers: {
          innerText: (v) => `${Number(v).toFixed(1)}`,
        },
      }
    );
  }, { scope });

  return (
    <section
      ref={scope}
      className="relative h-screen w-full flex items-center justify-center text-white overflow-hidden"
      style={{
        backgroundColor: "#000",
        backgroundImage: svgBg,
        backgroundSize: "12px",
        backgroundRepeat: "repeat",
      }}
    >
      {/* Branding Header */}
      <div className="absolute top-8 left-8 z-20 flex flex-col">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#c0d111] font-bold">Checkpoint</p>
        <p className="text-lg font-black uppercase tracking-widest">Medical <span className="text-[#c0d111]">AI</span></p>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,black_95%)]" />

      <div className="relative z-10 flex items-center gap-16 px-12 max-w-6xl w-full">

        {/* Left Side: Status and Bar */}
        <div className="flex flex-col gap-4 w-full max-w-md">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#c0d111] font-bold">
              Risk Level Analysis
            </p>
            
            <div className="flex justify-between w-full">
              {tag.toUpperCase().split('').map((char, i) => (
                <span key={i} className="text-5xl font-black leading-none text-white">
                  {char}
                </span>
              ))}
            </div>
          </div>

          {/* Horizontal Bar Container */}
          <div className="relative h-6 w-full bg-white/5 border border-red-900/30 overflow-hidden">
            <div className="absolute inset-0 bg-red-900/10 animate-pulse" />

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="h-full bg-[#c0d111] shadow-[0_0_20px_rgba(192,209,17,0.6)] relative"
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] w-28 animate-[scan_2s_linear_infinite]" />
            </motion.div>
          </div>
        </div>

        {/* Right Side: Content and Metrics */}
        <div className="flex flex-col gap-8 flex-grow border-l border-white/10 pl-16">

          <div className="flex flex-col gap-1">
            <p className="text-[14px] font-bold uppercase tracking-[0.4em] text-white opacity-80">
              Clinical Severity Score
            </p>
            <div className="flex items-end gap-2">
              <span
                ref={scoreRef}
                className="text-[100px] silkscreen-bold text-[#c0d111] drop-shadow-[0_0_30px_rgba(192,209,17,0.4)] leading-none"
              >
                0
              </span>
              <span className="text-white font-bold text-lg mb-4 font-mono">/ 100</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">Diagnosis Stage</p>
            <p className="text-xl font-bold text-[#c0d111]">{stage}</p>
          </div>
          <div className="flex flex-col gap-6">
            <p className="text-white text-xs font-medium uppercase tracking-[0.2em] max-w-md border-l-2 border-[#c0d111] pl-4 py-1 leading-relaxed">
              Final diagnostic computation complete. Severity score is determined by morphological growth patterns and tissue density variance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stage5Severity;