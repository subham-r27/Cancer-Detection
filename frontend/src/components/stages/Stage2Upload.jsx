import { motion } from "framer-motion";
import { Upload, Cpu, ScanSearch, Activity } from "lucide-react";

// Updated background: New SVG with purple color (#390986) and higher opacity
const svgBg =
  "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h16v2h-6v6h6v8H8v-6H2v6H0V0zm4 4h2v2H4V4zm8 8h2v2h-2v-2zm-8 0h2v2H4v-2zm8-8h2v2h-2V4z' fill='%23390986' fill-opacity='0.58' fill-rule='evenodd'/%3E%3C/svg%3E\")";

const Stage2Upload = ({ onFileChange, uploadedFile, processing, fetchError }) => {
  return (
    <section
      className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden text-white"
      style={{
        backgroundColor: "#000000", 
        backgroundImage: svgBg,
        backgroundSize: "12px", 
        backgroundRepeat: "repeat",
      }}
    >
      <div className="absolute top-8 left-8 z-20 flex flex-col">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#6e42c6] font-bold">Checkpoint</p>
        <p className="text-lg font-black uppercase tracking-widest">Medical <span className="text-[#6e42c6]">AI</span></p>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,black_95%)] pointer-events-none" />

      {/* HEADER CONTENT */}
      <div className="relative z-10 flex flex-col items-center mb-16">
        <h1 className="text-[60px] md:text-[90px] font-black tracking-tighter text-[#390989] leading-none drop-shadow-[0_0_25px_rgba(35,165,89,0.2)]">
          DATA UPLOAD
        </h1>
        <p className="text-slate-400 text-sm text-[#6e42c6] uppercase tracking-[0.5em] mt-4">
          Neural Pipeline Initialization
        </p>
        
        <div className="flex gap-8 mt-8 text-[#E6E6FA]/60">
          <Cpu size={20} />
          <ScanSearch size={20} />
          <Activity size={20} />
        </div>
      </div>

      {/* UPLOAD INTERFACE */}
      <label className="relative z-10 cursor-pointer">
        <input
          type="file"
          accept="image/*,.dcm"
          className="hidden"
          onChange={onFileChange}
        />

        <div className="group relative">
          <div className="absolute inset-0 translate-x-[6px] translate-y-[6px] bg-[#ffffff]/20 transition-transform group-hover:translate-x-[8px] group-hover:translate-y-[8px]" />
          
          <div className="relative flex flex-col items-center justify-center w-[400px] h-[180px] border border-[#390986]/50 bg-black/80 backdrop-blur-sm transition-all group-hover:border-[#ffffff]">
            <Upload size={32} className="text-[#390986] mb-4 group-hover:scale-110 transition-transform" />
            <span className="text-[#390986] font-black tracking-[0.4em] text-xs uppercase">
              Upload CT Sequence
            </span>
          </div>
        </div>

        {/* Selected file info */}
        {uploadedFile && !processing && !fetchError && (
          <div className="absolute -bottom-12 left-0 right-0 text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              Ready: <span className="text-white font-bold">{uploadedFile.name}</span>
            </p>
          </div>
        )}

        {/* Backend error (e.g. 422) */}
        {fetchError && (
          <div className="absolute -bottom-24 left-0 right-0 text-center px-4">
            <p className="text-xs text-red-400 font-medium max-w-md mx-auto">{fetchError}</p>
          </div>
        )}

        {/* Processing Overlay */}
        {processing && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
            <p className="text-[10px] tracking-[0.4em] text-[#390986] mb-6 font-bold uppercase">
              Neural Processing
            </p>
            <div className="relative h-[2px] w-48 overflow-hidden bg-[#390986]/20">
              <motion.div
                className="absolute inset-y-0 w-1/2 bg-[#390986] shadow-[0_0_15px_#390986]"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </div>
        )}
      </label>
    </section>
  );
};

export default Stage2Upload;