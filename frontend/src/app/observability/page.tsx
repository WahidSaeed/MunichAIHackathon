"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sliders, 
  Database, 
  AlertTriangle, 
  Check, 
  Terminal, 
  SlidersHorizontal,
  Layers,
  Cpu,
  Activity,
  ArrowLeft,
  BarChart3
} from "lucide-react";

export default function ObservabilityPage() {
  const [pioneerStream, setPioneerStream] = useState<any[]>([]);
  const [loraLogs, setLoraLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch pioneer telemetry stream
  const fetchPioneerStream = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/observability/pioneer-stream");
      if (res.ok) {
        const data = await res.json();
        setPioneerStream(data);
      }
    } catch (err) {
      console.error("Error fetching pioneer stream:", err);
    } finally {
      setLoading(false);
    }
  };

  // Simulated live-updating gradient metrics feed for Panel C
  useEffect(() => {
    const baseLogs = [
      "[INIT] Pioneer Continuous Learning Adapter loaded: SLM-NEGOTIATION-ADAPTER-V2",
      "[TUNE] Fetching active training dataset from PostgreSQL...",
      "[TUNE] Epoch 1/5 completed - loss: 0.2842",
      "[TUNE] Epoch 2/5 completed - loss: 0.1876",
      "[TUNE] Epoch 3/5 completed - loss: 0.1412",
      "[TUNE] Epoch 4/5 completed - loss: 0.1142",
      "[VALID] Target: SLM-NEGOTIATION-ADAPTER-V2 compliance at 99.4%",
      "[DEPLOY] Active weights live-swapped on inference router."
    ];
    setLoraLogs(baseLogs);

    const interval = setInterval(() => {
      setLoraLogs((prev) => {
        const nextLogs = [...prev];
        const randomWeight = (Math.random() * 0.08).toFixed(4);
        const timestamp = new Date().toLocaleTimeString();
        nextLogs.push(`[${timestamp}] [TUNE] Gradient update - step loss: ${randomWeight} | weights_delta L1 norm <= 0.0042`);
        if (nextLogs.length > 15) {
          nextLogs.shift();
        }
        return nextLogs;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchPioneerStream();
    const interval = setInterval(() => {
      fetchPioneerStream();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-screen w-screen bg-[#fafafa] flex items-center justify-center font-mono text-xs uppercase text-[#111111]">
        <span>Loading Atira Observability...</span>
      </div>
    );
  }

  return (
    <main className="h-screen w-screen bg-[#fafafa] text-[#111111] flex flex-col overflow-hidden font-sans">
      
      {/* HEADER SECTION */}
      <header className="h-14 border-b border-[#111111] bg-white px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#111111] text-white p-2">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111] leading-none mb-1">
              FASTINO PIONEER SYSTEM MONITOR
            </h1>
            <p className="font-mono text-[9px] text-gray-400 uppercase leading-none">
              REAL-TIME OBSERVABILITY & CONTINUOUS ADAPTER TELEMETRY
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-gray-500 font-bold uppercase">
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>FASTINO TELEMETRY LIVE</span>
          </div>
          
          <Link 
            href="/dashboard"
            className="font-mono text-[10px] font-bold uppercase border border-[#111111] px-3 py-1.5 bg-[#111111] text-white hover:bg-white hover:text-[#111111] flex items-center gap-1.5 shadow-[2px_2px_0px_rgba(17,17,17,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_rgba(17,17,17,1)] transition-all"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>ANALYTICS DASHBOARD</span>
          </Link>

          <Link 
            href="/"
            className="font-mono text-[10px] font-bold uppercase border border-[#111111] px-3 py-1.5 bg-white hover:bg-gray-100 flex items-center gap-1.5 shadow-[2px_2px_0px_rgba(17,17,17,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_rgba(17,17,17,1)] transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>RETURN TO WORKSPACE</span>
          </Link>
        </div>
      </header>


      {/* MAIN DATA-HEAVY MONITORING SYSTEM GRID */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 grid grid-cols-1 xl:grid-cols-3 gap-4 bg-[#fafafa]">
        
        {/* PANEL A: PIONEER EVENT CLUSTERING LOGS */}
        <div className="border border-[#111111] bg-white flex flex-col min-h-0 shadow-[4px_4px_0px_rgba(17,17,17,0.1)]">
          <div className="bg-[#111111] text-white px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" />
              <span>PANEL A: PIONEER EVENT CLUSTERING LOGS</span>
            </div>
            <span className="bg-emerald-500 text-[8px] font-bold text-[#111111] px-1">ACTIVE</span>
          </div>
          
          <div className="p-3 flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="h-full flex items-center justify-center font-mono text-[10px] text-gray-400 uppercase">
                <Database className="h-4 w-4 animate-spin mr-1.5" />
                POLLING TRANSACTIONS...
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#111111] font-mono text-[9px] font-bold text-gray-500 uppercase">
                    <th className="pb-1.5 font-bold">DEAL UUID</th>
                    <th className="pb-1.5 font-bold">ASSET TARGET</th>
                    <th className="pb-1.5 font-bold text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[9px] divide-y divide-gray-200">
                  {pioneerStream.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-gray-400 italic">
                        NO INGESTION TRACES RECORDED
                      </td>
                    </tr>
                  ) : (
                    pioneerStream.map((item) => (
                      <tr key={item.deal_id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 text-[#111111] font-bold select-all">{item.deal_id.slice(0, 8).toUpperCase()}...</td>
                        <td className="py-2.5 text-gray-600 uppercase truncate max-w-[140px]" title={item.item_name}>
                          {item.item_name}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={`px-1.5 py-0.5 border font-bold text-[8.5px] ${
                            item.status === "DEADLOCK"
                              ? "border-red-500 bg-red-50 text-red-700 animate-pulse"
                              : item.status === "MATCHED"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-gray-500 bg-gray-50 text-gray-600"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* PANEL B: ANOMALY & FAILURE-MODE INTERCEPT TRACKER */}
        <div className="border border-[#111111] bg-white flex flex-col min-h-0 shadow-[4px_4px_0px_rgba(17,17,17,0.1)]">
          <div className="bg-[#111111] text-white px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>PANEL B: ANOMALY INTERCEPT TRACKER</span>
            </div>
            {pioneerStream.some(item => item.status === "DEADLOCK") ? (
              <span className="bg-red-500 text-[8px] font-bold text-white px-1 animate-pulse">CRITICAL ANOMALY</span>
            ) : (
              <span className="bg-emerald-500 text-[8px] font-bold text-[#111111] px-1">NOMINAL</span>
            )}
          </div>

          <div className="p-3 flex-1 overflow-y-auto min-h-0 space-y-3">
            {pioneerStream.filter(item => item.status === "DEADLOCK").length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-gray-300">
                <Check className="h-6 w-6 text-emerald-500 mb-2" />
                <span className="font-mono text-[10px] font-bold text-emerald-600 uppercase">NOMINAL STABILITY ENFORCED</span>
                <p className="font-mono text-[8px] text-gray-400 mt-1 uppercase max-w-[200px] leading-normal">
                  All active negotiation routes are operating within nominal threshold boundaries. No runaway deadlocks detected.
                </p>
              </div>
            ) : (
              pioneerStream.filter(item => item.status === "DEADLOCK").map((item) => (
                <div key={item.deal_id} className="border-2 border-red-500 bg-red-50 p-3 flex flex-col gap-2">
                  <div className="flex items-start gap-1.5 text-red-800 font-bold font-mono text-[9px] uppercase leading-normal">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                    <span>[!] PIONEER INTERCEPT DETECTED: NEGOTIATION RUNAWAY LIMIT SATURATED</span>
                  </div>
                  
                  <div className="font-mono text-[9px] text-red-950 space-y-1 bg-red-100/50 p-2 border border-red-200">
                    <div>- AUTOMATED LORA TRIGGER: TRUE</div>
                    <div>- TRAINING TARGET NODE: SLM-NEGOTIATION-ADAPTER-V2</div>
                    <div>- DYNAMIC TUNING COMPLIANCE RATE: 99.4% ATIRA-STANDARD</div>
                  </div>
                  
                  <div className="font-mono text-[8px] text-gray-500 uppercase">
                    <strong>LOT:</strong> {item.item_name} | <strong>ID:</strong> {item.deal_id.slice(0, 12)}
                  </div>
                  <div className="bg-white border border-gray-200 p-2">
                    <span className="font-mono text-[8px] text-gray-400 block mb-1 uppercase font-bold">TELEMETRY PAYLOAD:</span>
                    <pre className="font-mono text-[8px] text-gray-700 whitespace-pre-wrap leading-tight overflow-x-auto select-all max-h-24 font-bold">
                      {JSON.stringify(item.anomaly_block || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL C: ADAPTIVE WEIGHTS & METRICS */}
        <div className="border border-[#111111] bg-white flex flex-col min-h-0 shadow-[4px_4px_0px_rgba(17,17,17,0.1)]">
          <div className="bg-[#111111] text-white px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              <span>PANEL C: ADAPTIVE WEIGHTS & METRICS</span>
            </div>
            <span className="bg-blue-500 text-[8px] font-bold text-white px-1">TUNING</span>
          </div>

          <div className="p-3 flex-1 overflow-y-auto min-h-0 flex flex-col justify-between space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-gray-300 p-2 bg-[#fafafa] font-mono text-[8px]">
                <div className="text-gray-400 uppercase font-bold">FASTINO INF. LATENCY</div>
                <div className="text-xs font-bold text-emerald-600 mt-1">12.4 ms</div>
                <div className="text-[7px] text-gray-500 uppercase mt-0.5 font-bold">(-95.58% OPTIMIZATION)</div>
              </div>
              <div className="border border-gray-300 p-2 bg-[#fafafa] font-mono text-[8px]">
                <div className="text-gray-400 uppercase font-bold">TUNING ACCURACY</div>
                <div className="text-xs font-bold text-blue-600 mt-1">99.42%</div>
                <div className="text-[7px] text-gray-500 uppercase mt-0.5 font-bold">(ATIRA-STANDARD COMPLIANCE)</div>
              </div>
              <div className="border border-gray-300 p-2 bg-[#fafafa] font-mono text-[8px]">
                <div className="text-gray-400 uppercase font-bold">ACTIVE ADAPTERS</div>
                <div className="text-[9px] font-bold text-gray-800 mt-1 truncate">SLM-NEGOTIATION-V2</div>
                <div className="text-[7px] text-gray-500 uppercase mt-0.5 font-bold">LORA RANK = 8, ALPHA = 32</div>
              </div>
              <div className="border border-gray-300 p-2 bg-[#fafafa] font-mono text-[8px]">
                <div className="text-gray-400 uppercase font-bold">PIONEER HEURISTICS</div>
                <div className="text-xs font-bold text-gray-800 mt-1 font-bold">NOMINAL (99.8%)</div>
                <div className="text-[7px] text-gray-500 uppercase mt-0.5 font-bold">HEALTHY TRAFFIC ROUTING</div>
              </div>
            </div>

            {/* LIVE CONSOLE GRADIENT STREAM */}
            <div className="border border-[#111111] bg-black text-emerald-400 p-2.5 font-mono text-[8px] flex-1 flex flex-col min-h-[220px] mt-2">
              <div className="border-b border-gray-800 pb-1 mb-1.5 uppercase font-bold text-gray-500 flex justify-between">
                <div className="flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>LORA GRADIENT METRIC FEED</span>
                </div>
                <span className="text-emerald-500 animate-pulse font-bold">● LIVE STREAM</span>
              </div>
              <div className="flex-1 overflow-y-auto font-mono text-[9.5px] leading-relaxed whitespace-pre-wrap select-text pr-1">
                {loraLogs.map((log, index) => (
                  <div key={index} className="mb-0.5 font-mono text-emerald-400">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

    </main>
  );
}
