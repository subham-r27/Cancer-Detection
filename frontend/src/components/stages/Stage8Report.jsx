import { useMemo, useState } from 'react';
import { Download, ShieldCheck, FileText, Zap, LayoutGrid, Focus, Maximize2, X, ChevronLeft } from "lucide-react";

// Updated background with #e56607 color
const svgBg = "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h16v2h-6v6h6v8H8v-6H2v6H0V0zm4 4h2v2H4V4zm8 8h2v2h-2v-2zm-8 0h2v2H4v-2zm8-8h2v2h-2V4z' fill='%23e56607' fill-opacity='0.55' fill-rule='evenodd'/%3E%3C/svg%3E\")";

const Stage8Report = ({ data, processedImages = [], heatmapUrl = null, onBack }) => {
    const [patientName, setPatientName] = useState("");
    const [patientDob, setPatientDob] = useState("");
    const [fullscreenView, setFullscreenView] = useState(null);

    const reportId = useMemo(() => {
        return `REP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    }, []);

    const volume = ((data.detectedDiameter ?? 0) * 1.4).toFixed(1);

    // Prevent generation if name is missing
    const canGenerate = patientName.trim().length > 0;

    return (
        <section
            className="relative min-h-screen w-full flex items-center justify-center text-white py-8 px-6 overflow-hidden"
            style={{
                backgroundColor: "#000000",
                backgroundImage: svgBg,
                backgroundSize: "12px",
                backgroundRepeat: "repeat",
            }}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,black_95%)]" />

            <div className="relative z-10 w-full max-w-6xl">
                {/* Header & Go Back */}
                <div className="flex justify-between items-end mb-6 border-b border-[#e56607]/40 pb-4">
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.4em] text-[#e56607] font-bold">Checkpoint AI</p>
                            <h1 className="text-2xl font-black uppercase tracking-widest">
                                Diagnostic <span className="text-[#e56607]">Summary</span>
                            </h1>
                        </div>
                    </div>
                    <div className="text-right font-mono">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none mb-1">Report Serial</p>
                        <p className="text-[10px] text-white font-bold uppercase tracking-widest">{reportId}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    
                    {/* Column 1: Identity & Metrics */}
                    <div className="flex flex-col gap-3">
                        <div className="bg-[#e56607]/10 border border-[#e56607]/40 p-4">
                            <input 
                                type="text" 
                                placeholder="ENTER NAME..."
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                                className="w-full bg-black/50 border border-[#e56607]/30 p-2 text-xs font-bold uppercase tracking-widest text-white focus:outline-none focus:border-[#e56607] mb-2 no-print"
                            />
                            {/* Visible for printing */}
                            <p className="hidden print:block text-sm font-bold uppercase tracking-widest mb-2">{patientName || "N/A"}</p>
                            
                            <input 
                                type="date" 
                                value={patientDob}
                                onChange={(e) => setPatientDob(e.target.value)}
                                className="w-full bg-black/50 border border-[#e56607]/30 p-2 text-xs font-mono font-bold text-white [color-scheme:dark] no-print"
                            />
                            {/* Visible for printing */}
                            <p className="hidden print:block text-sm font-mono font-bold">{patientDob || "N/A"}</p>
                        </div>

                        <div className="bg-black/80 border border-[#e56607]/30 p-6">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[#e56607] mb-1">Target Organ</p>
                            <h2 className="text-lg font-bold uppercase">{data.selectedOrgan || "Lung"}</h2>
                        </div>

                        <div className="bg-black/80 border border-[#e56607]/30 p-6">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[#e56607] mb-1">Measurements</p>
                            <div className="text-xl font-bold">{(data.detectedDiameter ?? 0).toFixed(1)}<span className="text-[10px] ml-1 opacity-50">MM Ø</span></div>
                            <div className="text-sm font-bold text-slate-400">{volume}<span className="text-[10px] ml-1 opacity-50">CM³ VOL</span></div>
                        </div>

                        <div className="bg-black/80 border border-[#e56607]/30 p-6">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[#e56607] mb-1">Density</p>
                            <div className="text-xl font-bold">{(data.pixelCount ?? 0).toLocaleString()}<span className="text-[10px] ml-1 opacity-50">PX</span></div>
                        </div>
                    </div>

                    {/* Column 2 & 3: Multi-Panel + Download */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="bg-black/80 border border-[#e56607]/30 p-4 relative">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <LayoutGrid size={14} className="text-[#e56607]" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Multi-Panel Visualizer</span>
                                </div>
                                <button onClick={() => setFullscreenView('panels')} className="text-[#e56607] hover:text-white no-print">
                                    <Maximize2 size={14} />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[0, 1, 2, 3].map((i) => (
                                    <div key={i} className="relative aspect-video bg-[#e56607]/5 border border-[#e56607]/20 overflow-hidden group">
                                        {processedImages[i] && <img src={processedImages[i]} className="w-full h-full object-cover opacity-80" alt="" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            disabled={!canGenerate}
                            onClick={() => window.print()}
                            className={`flex items-center justify-center gap-2 p-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all no-print 
                                ${canGenerate 
                                    ? "bg-[#e56607] hover:bg-white hover:text-black shadow-[0_0_15px_rgba(229,102,7,0.3)]" 
                                    : "bg-gray-800 cursor-not-allowed opacity-50"}`}
                        >
                            <Download size={14} />
                            {canGenerate ? "Generate Diagnostic PDF" : "Enter Name to Generate Report"}
                        </button>
                    </div>

                    {/* Column 4: Severity & Grad-CAM */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-[#e56607]/10 border border-[#e56607]/30 p-6 flex flex-col items-center justify-center text-center relative">
                            <p className="text-[9px] uppercase tracking-[0.3em] text-[#e56607] font-bold mb-2">Risk Assessment</p>
                            <div className="text-5xl font-black text-[#e56607] leading-none mb-2">{data.severityScore ?? "—"}</div>
                            <div className="px-4 py-1 bg-[#e56607] text-black text-[8px] font-black uppercase tracking-[0.2em] mb-2">
                                {data.severityTag} RISK
                            </div>
                            {data.stage != null && data.stage !== "—" && (
                                <p className="text-[9px] uppercase tracking-widest text-white/90">Stage: {data.stage}</p>
                            )}
                        </div>

                        <div className="bg-black/80 border border-[#e56607]/30 p-4 flex flex-col items-center relative">
                            <div className="flex justify-between items-center mb-3 w-full">
                                <div className="flex items-center gap-2">
                                    <Focus size={12} className="text-[#e56607]" />
                                    <span className="text-[8px] uppercase tracking-widest font-bold">Interpretability</span>
                                </div>
                                <button onClick={() => setFullscreenView('gradcam')} className="text-[#e56607] hover:text-white no-print">
                                    <Maximize2 size={12} />
                                </button>
                            </div>
                            <div className="w-full aspect-square bg-[#e56607]/10 border border-[#e56607]/10 overflow-hidden">
                                {heatmapUrl && <img src={heatmapUrl} className="w-full h-full object-cover" alt="" />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fullscreen Overlay */}
            {fullscreenView && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col p-10 animate-in fade-in zoom-in duration-300">
                    <button 
                        onClick={() => setFullscreenView(null)}
                        className="absolute top-10 right-10 text-[#e56607] hover:text-white flex items-center gap-2 uppercase text-[10px] tracking-widest font-bold"
                    >
                        <X size={24} /> Close
                    </button>
                    
                    <div className="w-full h-full flex items-center justify-center mt-6">
                        {fullscreenView === 'panels' ? (
                            <div className="grid grid-cols-2 gap-4 w-full max-w-5xl h-full max-h-[80vh]">
                                {processedImages.map((img, i) => (
                                    <img key={i} src={img} className="w-full h-full object-contain border border-[#e56607]/50" alt="" />
                                ))}
                            </div>
                        ) : (
                            <img src={heatmapUrl} className="max-w-full max-h-[85vh] object-contain border border-[#e56607] shadow-[0_0_50px_rgba(229,102,7,0.2)]" alt="" />
                        )}
                    </div>
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body { background: #000000 !important; color: white !important; -webkit-print-color-adjust: exact; }
                    section { padding: 0 !important; background-image: ${svgBg} !important; }
                    .no-print { display: none !important; }
                    input { display: none !important; }
                    .print-visible { display: block !important; }
                }
            `}} />
        </section>
    );
};

export default Stage8Report;