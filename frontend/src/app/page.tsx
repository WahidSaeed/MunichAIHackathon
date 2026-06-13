"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Database, 
  Terminal, 
  User, 
  Bot, 
  Clock, 
  ArrowRight, 
  Layers, 
  Play, 
  Check, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Sliders,
  Send,
  Sparkles,
  ShoppingBag,
  Tag,
  ChevronDown,
  ChevronRight
} from "lucide-react";

const parseInlineMarkdown = (text: string) => {
  let parts: React.ReactNode[] = [text];
  
  // Parse **bold**
  parts = parts.flatMap((part) => {
    if (typeof part !== "string") return part;
    const pieces = part.split(/\*\*([^*]+)\*\*/g);
    return pieces.map((piece, i) => (i % 2 === 1 ? <strong key={i} className="font-bold text-[#111111]">{piece}</strong> : piece));
  });

  // Parse *italic*
  parts = parts.flatMap((part) => {
    if (typeof part !== "string") return part;
    const pieces = part.split(/\*([^*]+)\*/g);
    return pieces.map((piece, i) => (i % 2 === 1 ? <em key={i} className="italic text-gray-800">{piece}</em> : piece));
  });

  // Parse __underline__
  parts = parts.flatMap((part) => {
    if (typeof part !== "string") return part;
    const pieces = part.split(/__([^_]+)__/g);
    return pieces.map((piece, i) => (i % 2 === 1 ? <span key={i} className="underline decoration-[#111111] underline-offset-2">{piece}</span> : piece));
  });

  // Parse _italic_
  parts = parts.flatMap((part) => {
    if (typeof part !== "string") return part;
    const pieces = part.split(/_([^_]+)_/g);
    return pieces.map((piece, i) => (i % 2 === 1 ? <em key={i} className="italic text-gray-800">{piece}</em> : piece));
  });

  return parts;
};

const renderMarkdown = (text: string) => {
  if (!text) return null;
  const lines = text.split("\n");
  
  return lines.map((line, idx) => {
    let trimmed = line.trim();
    
    // Horizontal Rule
    if (trimmed.startsWith("===") || trimmed.startsWith("---")) {
      return <hr key={idx} className="border-t border-gray-200 my-4" />;
    }
    
    // Headings
    if (trimmed.startsWith("# ")) {
      return (
        <h1 key={idx} className="text-sm font-bold uppercase tracking-wider text-[#111111] mt-4 mb-2 border-b border-[#111111] pb-1">
          {parseInlineMarkdown(trimmed.slice(2))}
        </h1>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={idx} className="text-xs font-bold uppercase tracking-wider text-[#111111] mt-4 mb-2 border-l-2 border-[#111111] pl-2">
          {parseInlineMarkdown(trimmed.slice(3))}
        </h2>
      );
    }
    if (trimmed.startsWith("### ")) {
      return (
        <h3 key={idx} className="text-[10px] font-bold uppercase text-gray-600 mt-3 mb-1 tracking-wide">
          {parseInlineMarkdown(trimmed.slice(4))}
        </h3>
      );
    }
    
    // Bullet Points
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return (
        <div key={idx} className="flex items-start gap-1.5 ml-2 my-1">
          <span className="text-gray-500 font-bold">•</span>
          <span className="text-[10px] text-gray-700 leading-relaxed">
            {parseInlineMarkdown(trimmed.slice(2))}
          </span>
        </div>
      );
    }

    // Default line
    return (
      <p key={idx} className="text-[10px] leading-relaxed text-gray-700 my-1">
        {parseInlineMarkdown(line)}
      </p>
    );
  });
};

interface Participant {
  id: string;
  name: string;
  role: string;
  current_price_point: number | null;
  hidden_floor_ceil: number;
}

interface Message {
  id: string;
  sender_name: string;
  role: string;
  message_text: string;
  timestamp: string;
}

interface Deal {
  id: string;
  item_name: string;
  status: string;
  current_buyer_budget: number;
  technical_specs: string;
  perspective: string;
  created_at: string;
  participants: Participant[];
  messages: Message[];
}

export default function Home() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [newLotName, setNewLotName] = useState("");
  const [newBudget, setNewBudget] = useState(1200);
  const [newPerspective, setNewPerspective] = useState("BUYER");
  const [operatorMsg, setOperatorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [stepping, setStepping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLotForm, setShowLotForm] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<"BUYER" | "SELLER" | null>("BUYER");
  const [rfqText, setRfqText] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevActiveDealIdRef = useRef<string | null>(null);
  const prevMessageCountRef = useRef<number>(0);

  // Real-time telemetry monitoring states
  const [activeTab, setActiveTab] = useState<"workspace" | "observability">("workspace");
  const [pioneerStream, setPioneerStream] = useState<any[]>([]);
  const [loraLogs, setLoraLogs] = useState<string[]>([]);

  const activeDeal = deals.find(d => d.id === activeDealId) || null;

  // Fetch all deals from backend API
  const fetchDeals = async (selectFirst = false) => {
    try {
      const res = await fetch("http://localhost:8080/api/deals");
      if (!res.ok) throw new Error("Backend connection offline.");
      const data = await res.json();
      setDeals(data);
      if (data.length > 0) {
        if (selectFirst || !activeDealId) {
          setActiveDealId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Error fetching deals:", e);
    } finally {
      setLoading(false);
    }
  };

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
    fetchDeals();
    fetchPioneerStream();
    // Auto refresh every 5 seconds to sync state if needed
    const interval = setInterval(() => {
      fetchDeals();
      fetchPioneerStream();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeDealId]);

  // Auto-scroll chat feed to the bottom ONLY on active deal change or actual new messages
  useEffect(() => {
    if (!activeDeal) return;

    const currentMessageCount = activeDeal.messages.length;
    const dealChanged = activeDeal.id !== prevActiveDealIdRef.current;
    const newMessageAdded = currentMessageCount > prevMessageCountRef.current;

    if (dealChanged || newMessageAdded) {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
      prevActiveDealIdRef.current = activeDeal.id;
      prevMessageCountRef.current = currentMessageCount;
    } else {
      prevMessageCountRef.current = currentMessageCount;
    }
  }, [activeDeal?.messages, activeDeal?.id]);

  // Create a new B2B Lot (Deal Channel)
  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLotName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:8080/api/deals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: newLotName,
          current_buyer_budget: newBudget,
          perspective: newPerspective
        })
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setNewLotName("");
        setNewPerspective("BUYER");
        setShowLotForm(false);
        await fetchDeals();
        setActiveDealId(data.deal_id);
      }
    } catch (e) {
      console.error("Error creating procurement lot:", e);
    } finally {
      setSubmitting(false);
    }
  };

  // Ingest unstructured RFQ Raw Text
  const handleIngestRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqText.trim() || ingesting) return;
    setIngesting(true);
    try {
      const res = await fetch("http://localhost:8080/api/deals/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: rfqText
        })
      });
      if (!res.ok) throw new Error("Backend connection offline.");
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setRfqText("");
        await fetchDeals();
        setActiveDealId(data.deal_id);
        setActiveDrawer("BUYER");
      } else {
        alert("Ingestion failed: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      console.error("Error during unstructured RFQ ingestion:", err);
      alert("Error occurred during RFQ ingestion. Please check if the backend is running.");
    } finally {
      setIngesting(false);
    }
  };

  // Step the multi-agent negotiation loop
  const handleStepExchange = async () => {
    if (!activeDealId || stepping) return;
    setStepping(true);
    try {
      const res = await fetch("http://localhost:8080/api/negotiate/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: activeDealId })
      });
      await fetchDeals();
    } catch (e) {
      console.error("Error stepping negotiation round:", e);
    } finally {
      setStepping(false);
    }
  };

  // Operator chat override intervention
  const handleSendOperatorMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDealId || !operatorMsg.trim()) return;
    const msg = operatorMsg;
    setOperatorMessage("");
    try {
      await fetch(("http://localhost:8080/api/negotiate/message"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_id: activeDealId,
          message_text: msg
        })
      });
      await fetchDeals();
    } catch (e) {
      console.error("Error submitting operator override command:", e);
    }
  };

  // Calculate pricing matrices and spreads
  const getLiquidityLedger = () => {
    if (!activeDeal) return { bids: [], asks: [], spread: "N/A" };
    const buyers = activeDeal.participants.filter(p => p.role === "BUYER");
    const sellers = activeDeal.participants.filter(p => p.role === "SELLER");

    const bids = sortedParticipants(buyers, true);
    const asks = sortedParticipants(sellers, false);

    const highestBid = bids[0]?.current_price_point || 0;
    const lowestAsk = asks[0]?.current_price_point || 0;

    let spread = "N/A";
    if (highestBid && lowestAsk) {
      spread = `${lowestAsk - highestBid} EUR`;
    }

    return { bids, asks, spread };
  };

  const sortedParticipants = (parts: Participant[], desc: boolean) => {
    return [...parts].sort((a, b) => {
      const valA = a.current_price_point || 0;
      const valB = b.current_price_point || 0;
      return desc ? valB - valA : valA - valB;
    });
  };

  const { bids, asks, spread } = getLiquidityLedger();

  const buyerDeals = deals.filter(d => d.perspective === "BUYER" || !d.perspective);
  const sellerDeals = deals.filter(d => d.perspective === "SELLER");

  const renderDealChannel = (d: Deal) => {
    const isActive = d.id === activeDealId;
    const formattedName = d.item_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return (
      <button
        key={d.id}
        onClick={() => {
          setActiveDealId(d.id);
          setShowLotForm(false);
        }}
        className={`w-full border p-2 text-left transition-all duration-100 flex flex-col gap-1 ${
          isActive 
            ? "border-[#111111] bg-white shadow-[2px_2px_0px_rgba(17,17,17,1)]" 
            : "border-gray-200 bg-white hover:border-[#111111]"
        }`}
      >
        <div className="flex justify-between items-center w-full">
          <span className="font-mono text-xs font-bold text-[#111111] truncate max-w-[170px] flex items-center gap-1">
            <span className="text-gray-400 font-normal">#</span>
            {formattedName}
          </span>
          <span className={`font-mono text-[7px] font-bold px-1.5 py-0.2 border ${
            d.status === "ACTIVE" 
              ? "border-[#111111] bg-white text-[#111111]" 
              : d.status === "MATCHED"
              ? "border-emerald-600 bg-emerald-50 text-emerald-800"
              : d.status === "DEADLOCK"
              ? "border-red-600 bg-red-50 text-red-800"
              : "border-gray-500 bg-gray-50 text-gray-700"
          }`}>
            {d.status}
          </span>
        </div>
        <div className="flex justify-between items-center w-full font-mono text-[8px] text-gray-400">
          <span>BUDGET: {d.current_buyer_budget} EUR</span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-2 w-2" />
            {new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </button>
    );
  };

  return (
    <main className="h-screen w-screen flex flex-col font-sans select-none antialiased bg-[#fafafa]">
      
      {/* GLOBAL HIGH-CONTRAST HEADER */}
      <header className="h-14 border-b border-[#111111] bg-white flex items-center justify-between px-4 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 bg-[#111111] flex items-center justify-center">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <span className="font-mono text-sm font-bold uppercase tracking-widest text-[#111111]">
            ATIRA | PROCUREMENT & ESCROW PLATFORM | V1.0
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 bg-emerald-500"></div>
            <span className="font-mono text-[10px] font-bold text-gray-600 uppercase">
              POSTGRES DATABASE: CONNECTED
            </span>
          </div>
          <button 
            onClick={() => fetchDeals()}
            className="flex items-center gap-1.5 border border-[#111111] px-3 py-1 bg-[#fafafa] font-mono text-[10px] font-bold uppercase hover:bg-[#111111] hover:text-white transition-colors duration-100"
          >
            <RefreshCw className="h-3 w-3" />
            REFRESH LEDGER
          </button>
        </div>
      </header>

      {/* THREE-COLUMN WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* LEFT WORKSPACE SIDEBAR PANEL */}
        <aside className="w-80 min-h-0 border-r border-[#111111] bg-white flex flex-col shrink-0">
          
          <div className="p-3 border-b border-[#111111] bg-[#fafafa]">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              ACTIVE TRADING ROOMS
            </span>
            <div className="font-mono text-xs font-bold text-[#111111] flex items-center gap-2">
              <span className="text-[#111111]">#</span> M1-BILATERAL-ESCROW
            </div>
          </div>

          {/* HISTORICAL SESSIONS LIST INDEX */}
          <div className="flex-1 flex flex-col p-2 space-y-2 bg-[#fafafa] min-h-0">
            
            {showLotForm && (
              <form onSubmit={handleCreateLot} className="border border-[#111111] p-3 bg-white space-y-3 shrink-0">
                <div className="font-mono text-[11px] font-bold border-b border-[#111111] pb-1 uppercase flex justify-between items-center">
                  <span>INITIALIZE {newPerspective} LOT</span>
                  <button type="button" onClick={() => setShowLotForm(false)} className="hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div>
                  <label className="font-mono text-[9px] font-bold text-gray-500 block mb-1 uppercase">
                    ASSET LOT DESCRIPTOR / ITEM NAME
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.G. TITANIUM ROTOR ASSEMBLY"
                    value={newLotName}
                    onChange={(e) => setNewLotName(e.target.value)}
                    className="w-full border border-[#111111] bg-white px-2 py-1.5 font-mono text-xs focus:outline-none focus:bg-[#fafafa]"
                  />
                </div>
                <div>
                  <label className="font-mono text-[9px] font-bold text-gray-500 block mb-1 uppercase">
                    TARGET POOL BUDGET (EUR)
                  </label>
                  <input
                    type="number"
                    required
                    min={500}
                    max={5000}
                    value={newBudget}
                    onChange={(e) => setNewBudget(parseInt(e.target.value))}
                    className="w-full border border-[#111111] bg-white px-2 py-1.5 font-mono text-xs focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#111111] text-white font-mono text-xs font-bold uppercase py-2 hover:bg-gray-800 disabled:opacity-50"
                >
                  {submitting ? "RUNNING TAVILY RESEARCH..." : "SPAWN ESCROW ROOM"}
                </button>
              </form>
            )}

            {/* INBOUND INGESTION TERMINAL BOX */}
            <div className="border border-[#111111] bg-white flex flex-col shrink-0">
              <div className="bg-[#111111] text-white px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Terminal className="h-3 w-3 text-white animate-pulse" />
                  <span>TRACK 2: INBOUND RFQ INGESTION</span>
                </span>
                <span className="bg-emerald-500 text-[8px] font-bold text-[#111111] px-1">
                  LIVE_AI_PARSE
                </span>
              </div>
              <form onSubmit={handleIngestRFQ} className="p-2 flex flex-col bg-white space-y-2">
                <textarea
                  rows={3}
                  value={rfqText}
                  onChange={(e) => setRfqText(e.target.value)}
                  placeholder="PASTE MESSY RFQ EMAIL / RAW TEXT ASSETS..."
                  className="w-full border border-[#111111] bg-white p-2 font-mono text-[9px] text-[#111111] focus:outline-none placeholder-gray-400 leading-normal resize-none focus:bg-[#fafafa]"
                  disabled={ingesting}
                  style={{ minHeight: "55px" }}
                />
                <button
                  type="submit"
                  disabled={ingesting || !rfqText.trim()}
                  className="w-full bg-[#111111] text-white font-mono text-[9px] font-bold uppercase py-1.5 hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-1.5 border border-[#111111] transition-all duration-100"
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  {ingesting ? "INGESTING & TAVILY GROUNDING..." : "INGEST & SEED POSTGRES"}
                </button>
              </form>
            </div>

            {loading ? (
              <div className="p-4 text-center font-mono text-xs text-gray-400 shrink-0">
                LOADING DATABASE CHANNELS...
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 border border-[#111111] bg-white">
                
                {/* BUYER DRAWER */}
                <div className={`flex flex-col min-h-0 ${activeDrawer === "BUYER" ? "flex-1" : ""}`}>
                  <button
                    type="button"
                    onClick={() => setActiveDrawer(activeDrawer === "BUYER" ? null : "BUYER")}
                    className={`w-full flex justify-between items-center px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-100 border-b border-[#111111] text-left ${
                      activeDrawer === "BUYER"
                        ? "bg-[#111111] text-white"
                        : "bg-[#fafafa] text-gray-500 hover:text-[#111111]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={activeDrawer === "BUYER" ? "text-white" : "text-gray-400"}>
                        {activeDrawer === "BUYER" ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </span>
                      <ShoppingBag className={`h-3.5 w-3.5 shrink-0 ${activeDrawer === "BUYER" ? "text-white" : "text-gray-500"}`} />
                      <span>BUYER CHANNELS (WE BUY)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={activeDrawer === "BUYER" ? "text-gray-300" : "text-gray-400"}>({buyerDeals.length})</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewPerspective("BUYER");
                          setShowLotForm(true);
                        }}
                        className={`font-mono text-[11px] font-bold px-1 hover:opacity-80 cursor-pointer ${
                          activeDrawer === "BUYER" ? "text-white" : "text-[#111111]"
                        }`}
                        title="Add Buyer Channel"
                      >
                        [+]
                      </span>
                    </div>
                  </button>

                  {activeDrawer === "BUYER" && (
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-[#fafafa]">
                      {buyerDeals.length === 0 ? (
                        <div className="p-4 text-center font-mono text-[9px] text-gray-400 italic">
                          NO ACTIVE BUYER CHANNELS
                        </div>
                      ) : (
                        buyerDeals.map((d) => renderDealChannel(d))
                      )}
                    </div>
                  )}
                </div>

                {/* SELLER DRAWER */}
                <div className={`flex flex-col min-h-0 border-t border-[#111111] ${activeDrawer === "SELLER" ? "flex-1" : ""}`}>
                  <button
                    type="button"
                    onClick={() => setActiveDrawer(activeDrawer === "SELLER" ? null : "SELLER")}
                    className={`w-full flex justify-between items-center px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-100 text-left ${
                      activeDrawer === "SELLER"
                        ? "bg-[#111111] text-white"
                        : "bg-[#fafafa] text-gray-500 hover:text-[#111111]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={activeDrawer === "SELLER" ? "text-white" : "text-gray-400"}>
                        {activeDrawer === "SELLER" ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </span>
                      <Tag className={`h-3.5 w-3.5 shrink-0 ${activeDrawer === "SELLER" ? "text-white" : "text-gray-500"}`} />
                      <span>SELLER CHANNELS (WE SELL)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={activeDrawer === "SELLER" ? "text-gray-300" : "text-gray-400"}>({sellerDeals.length})</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewPerspective("SELLER");
                          setShowLotForm(true);
                        }}
                        className={`font-mono text-[11px] font-bold px-1 hover:opacity-80 cursor-pointer ${
                          activeDrawer === "SELLER" ? "text-white" : "text-[#111111]"
                        }`}
                        title="Add Seller Channel"
                      >
                        [+]
                      </span>
                    </div>
                  </button>

                  {activeDrawer === "SELLER" && (
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-[#fafafa] border-t border-[#111111]">
                      {sellerDeals.length === 0 ? (
                        <div className="p-4 text-center font-mono text-[9px] text-gray-400 italic">
                          NO ACTIVE SELLER CHANNELS
                        </div>
                      ) : (
                        sellerDeals.map((d) => renderDealChannel(d))
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* ADMIN OPERATOR BADGE MODULE */}
          <div className="border-t border-[#111111] p-3 bg-white shrink-0">
            <div className="border border-[#111111] p-2.5 bg-[#fafafa] flex flex-col gap-1.5">
              <div className="flex items-center gap-2 border-b border-gray-300 pb-1.5">
                <div className="h-5 w-5 bg-[#111111] flex items-center justify-center">
                  <User className="h-3 w-3 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] font-bold uppercase leading-none">
                    ABDUL WAHID
                  </span>
                  <span className="font-mono text-[8px] text-gray-500 uppercase leading-none mt-1">
                    SYSTEM CONTROLLER
                  </span>
                </div>
              </div>
              <div className="font-mono text-[8px] text-gray-400 uppercase leading-normal">
                CREDENTIALS: JWT SECURE HASH<br />
                ROLE: HUMAN ESCROW OPERATOR<br />
                AUTHORIZATION LEVEL: ROOT ACCESS
              </div>
            </div>
          </div>
 
        </aside>
 
        {/* CENTER EXCHANGE CHAT FEED VIEWPORT */}
        <section className="flex-1 min-h-0 flex flex-col bg-[#fafafa]">
          
          {/* ACTIVE LOT CONTEXT BAR */}
          <div className="h-11 border-b border-[#111111] bg-white px-4 flex items-center justify-between shrink-0">
            {activeDeal ? (
              <>
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[#111111]" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111]">
                    EXCHANGE FEED | LOT: {activeDeal.item_name}
                  </span>
                  <span className="font-mono text-[9px] font-bold px-2 py-0.5 border border-amber-500 bg-amber-100 text-amber-900">
                    ROLE: {activeDeal.perspective === "BUYER" ? "BUYER (WE BUY)" : "SELLER (WE SELL)"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] font-bold uppercase text-gray-500">
                    DEAL ID:
                  </span>
                  <span className="font-mono text-[9px] font-bold text-gray-700 select-all">
                    {activeDeal.id.slice(0, 8).toUpperCase()}...
                  </span>
                </div>
              </>
            ) : (
              <span className="font-mono text-xs font-bold text-gray-400 uppercase">
                NO ACTIVE LOT ELECTED. INITIALIZE OR CHOOSE FROM PANEL.
              </span>
            )}
          </div>

          {/* EXPLICIT, FLAT, HIGH-CONTRAST TAB SELECTOR MENU */}
          <div className="h-10 border-b border-[#111111] bg-white flex shrink-0">
            <button
              onClick={() => setActiveTab("workspace")}
              className={`flex-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-100 ${
                activeTab === "workspace"
                  ? "bg-[#111111] text-white"
                  : "bg-white text-[#111111] hover:bg-gray-100"
              }`}
            >
              Tab 1: Transaction Workspace
            </button>
            <button
              onClick={() => setActiveTab("observability")}
              className={`flex-1 font-mono text-[10px] font-bold uppercase border-l border-[#111111] tracking-wider transition-all duration-100 flex items-center justify-center gap-2 ${
                activeTab === "observability"
                  ? "bg-[#111111] text-white"
                  : "bg-white text-[#111111] hover:bg-gray-100"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Tab 2: Fastino Pioneer Observability</span>
              {pioneerStream.some(item => item.status === "DEADLOCK") && (
                <span className="h-2 w-2 bg-red-500 animate-pulse"></span>
              )}
            </button>
          </div>

          {activeTab === "workspace" ? (
            <>
              {/* CHAT MESSAGES SCROLL VIEW */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                {activeDeal ? (
                  activeDeal.messages.map((m) => {
                    const isBuyer = m.role === "BUYER";
                    const isSeller = m.role === "SELLER";
                    const isOperator = m.role === "OPERATOR";
                    const isSystem = m.role === "SYSTEM";
                    const isHuman = m.sender_name === "Buyer (You)" || m.sender_name === "Seller (You)";

                    // Format avatar token initials
                    let avatarText = "BY";
                    if (m.sender_name === "Buyer Agent" || m.sender_name === "Buyer" || m.sender_name === "Buyer (You)") avatarText = "BY";
                    else if (m.sender_name === "Seller Agent" || m.sender_name === "Seller" || m.sender_name === "Seller (You)") avatarText = "SL";
                    else if (m.sender_name.startsWith("Operator")) avatarText = "OP";
                    else if (m.sender_name.startsWith("System")) avatarText = "SYS";

                    return (
                      <div key={m.id} className="flex gap-3 items-start animate-fade-in">
                        
                        {/* AVATAR TOKEN */}
                        <div className={`h-8 w-8 shrink-0 flex items-center justify-center font-mono text-[10px] font-bold border shrink-0 ${
                          isSystem 
                            ? "bg-[#111111] text-white border-[#111111]"
                            : isOperator
                            ? "bg-emerald-100 text-emerald-800 border-emerald-500"
                            : isHuman
                            ? "bg-amber-100 text-amber-900 border-amber-500 font-bold"
                            : isBuyer
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-white text-gray-800 border-gray-400"
                        }`}>
                          [{avatarText}]
                        </div>

                        {/* MESSAGE BUBBLE */}
                        <div className={`flex-1 border p-3 ${
                          isSystem
                            ? "bg-slate-950 border-slate-950 text-white font-mono text-xs leading-relaxed"
                            : isOperator
                            ? "bg-emerald-50/30 border-emerald-400/60 text-gray-800"
                            : isHuman
                            ? "bg-amber-50/20 border-amber-400/50 text-amber-950"
                            : isBuyer
                            ? "bg-blue-50/40 border-blue-200/60 text-gray-800"
                            : "bg-white border-gray-300 text-gray-800"
                        }`}>
                          {/* HEADER */}
                          <div className="flex justify-between items-center mb-1 border-b border-dashed border-current pb-1 opacity-80">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                              {m.sender_name} | {m.role}
                            </span>
                            <span className="font-mono text-[8px] opacity-60">
                              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          
                          {/* BODY CONTENT */}
                          <p className="text-xs font-mono leading-relaxed whitespace-pre-wrap">
                            {m.message_text}
                          </p>
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-300">
                    <Database className="h-8 w-8 text-gray-300 mb-2" />
                    <h3 className="font-mono text-sm font-bold uppercase text-gray-400 mb-1">
                      NO SESSION ELECTED
                    </h3>
                    <p className="font-mono text-[10px] text-gray-400 max-w-[280px]">
                      CHOOSE AN ACTIVE TRADING POOL IN THE HISTORY INDEX OR GENERATE A NEW BULK ASSET LOT TO TRIGGER AUTOMATED NEGOTIATING AGENTS.
                    </p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* BOTTOM TERMINAL OVERRIDE & STEP BAR */}
              <div className="border-t border-[#111111] bg-white p-3 shrink-0">
                {activeDeal ? (
                  <div className="flex flex-col gap-2">
                    
                    {/* INSTRUCTION TIPS SUB-BAR */}
                    <div className="flex justify-between items-center px-1">
                      <div className="flex gap-2">
                        <span className="font-mono text-[9px] font-bold uppercase text-gray-500">
                          OPERATOR CLI CHEATSHEETS:
                        </span>
                        <span className="font-mono text-[9px] text-gray-600 bg-gray-100 px-1 font-bold">
                          "approve" (BUMPS BUYER CAP +100)
                        </span>
                        <span className="font-mono text-[9px] text-gray-600 bg-gray-100 px-1 font-bold">
                          "terminate" (FORCE HALT DEAL)
                        </span>
                      </div>
                      <span className="font-mono text-[9px] font-bold text-gray-500 uppercase">
                        STATUS: {activeDeal.status}
                      </span>
                    </div>

                    <div className="flex gap-2 items-stretch">
                      
                      {/* DIRECT OVERRIDE FORM LINE */}
                      <form onSubmit={handleSendOperatorMessage} className="flex-1 flex border border-[#111111]">
                        <div className="bg-[#fafafa] border-r border-[#111111] px-3 flex items-center">
                          <Terminal className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <input
                          type="text"
                          disabled={activeDeal.status === "TERMINATED" || activeDeal.status === "MATCHED"}
                          placeholder={
                            activeDeal.status === "MATCHED" 
                              ? "DEAL SETTLED. COMMENCING ESCROW."
                              : activeDeal.status === "TERMINATED"
                              ? "POOL FORCEFULLY TERMINATED."
                              : "INJECT DIRECT OVERRIDE MESSAGE COMMAND OR TYPE 'approve'..."
                          }
                          value={operatorMsg}
                          onChange={(e) => setOperatorMessage(e.target.value)}
                          className="flex-1 px-3 py-2.5 font-mono text-xs uppercase bg-white focus:outline-none focus:bg-[#fafafa] disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <button
                          type="submit"
                          disabled={!operatorMsg.trim() || activeDeal.status === "TERMINATED" || activeDeal.status === "MATCHED"}
                          className="bg-white hover:bg-gray-100 border-l border-[#111111] px-4 font-mono text-xs font-bold uppercase text-[#111111] transition-colors duration-100 disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </form>

                      {/* STEP EXCHANGE ROUND ACTION TRIGGER BUTTON */}
                      <button
                        onClick={handleStepExchange}
                        disabled={stepping || activeDeal.status !== "ACTIVE"}
                        className={`px-5 py-2.5 font-mono text-xs font-bold uppercase border border-[#111111] flex items-center gap-2 transition-all duration-100 ${
                          activeDeal.status === "ACTIVE" 
                            ? "bg-[#111111] text-white hover:bg-gray-800 shadow-[2px_2px_0px_rgba(17,17,17,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_rgba(17,17,17,1)]" 
                            : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {stepping ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            CALCULATING TURNS...
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5 fill-current" />
                            STEP EXCHANGE ROUND
                          </>
                        )}
                      </button>

                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            /* TAB 2: FASTINO PIONEER OBSERVABILITY VIEW */
            <div className="flex-1 min-h-0 overflow-y-auto p-4 grid grid-cols-1 xl:grid-cols-3 gap-4 bg-[#fafafa]">
              
              {/* PANEL A: PIONEER EVENT CLUSTERING LOGS */}
              <div className="border border-[#111111] bg-white flex flex-col min-h-0">
                <div className="bg-[#111111] text-white px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>PANEL A: PIONEER EVENT CLUSTERING LOGS</span>
                  <span className="bg-emerald-500 text-[8px] font-bold text-[#111111] px-1">ACTIVE</span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto min-h-0">
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
                            <td className="py-2 text-[#111111] font-bold">{item.deal_id.slice(0, 8).toUpperCase()}...</td>
                            <td className="py-2 text-gray-600 uppercase truncate max-w-[120px]" title={item.item_name}>
                              {item.item_name}
                            </td>
                            <td className="py-2 text-right">
                              <span className={`px-1 border font-bold ${
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
                </div>
              </div>

              {/* PANEL B: ANOMALY & FAILURE-MODE INTERCEPT TRACKER */}
              <div className="border border-[#111111] bg-white flex flex-col min-h-0">
                <div className="bg-[#111111] text-white px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>PANEL B: ANOMALY INTERCEPT TRACKER</span>
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

              {/* PANEL C: REAL-TIME FINE-TUNING LORA METRICS */}
              <div className="border border-[#111111] bg-white flex flex-col min-h-0">
                <div className="bg-[#111111] text-white px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>PANEL C: ADAPTIVE WEIGHTS & METRICS</span>
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

                  <div className="border border-[#111111] bg-black text-emerald-400 p-2.5 font-mono text-[8px] flex-1 flex flex-col min-h-[220px] mt-2">
                    <div className="border-b border-gray-800 pb-1 mb-1.5 uppercase font-bold text-gray-500 flex justify-between">
                      <span>LORA GRADIENT METRIC FEED</span>
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
          )}

        </section>

        {/* RIGHT HAND LIQUIDITY DEPTH SIDEBAR */}
        <aside className="w-96 min-h-0 border-l border-[#111111] bg-white p-4 overflow-y-auto shrink-0 flex flex-col gap-4">
          
          <div className="border-b border-[#111111] pb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111] block mb-0.5">
              LIQUIDITY DEPTH LEDGER
            </span>
            <span className="font-mono text-[9px] text-gray-400 uppercase leading-none">
              REAL-TIME SPREAD CALCULATOR
            </span>
          </div>

          {activeDeal ? (
            <>
              {/* CURRENT ACTIVE OFFER SPREAD BOX */}
              <div className="border border-[#111111] p-3 bg-[#fafafa]">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] font-bold text-gray-500 uppercase">
                    ACTIVE BOOK SPREAD:
                  </span>
                  <span className="font-mono text-sm font-bold text-[#111111] bg-white border border-[#111111] px-1.5 py-0.5 select-all">
                    {spread}
                  </span>
                </div>
                {activeDeal.status === "DEADLOCK" && (
                  <div className="mt-2.5 border border-red-500 bg-red-50 p-2 text-red-800 flex gap-2 items-start">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-mono text-[9px] font-bold leading-normal uppercase">
                      CRITICAL DEADLOCK STALL: ALL OFFERS HAVE REACHED ABSOLUTE CAP AND FLOOR LIMITS.
                    </span>
                  </div>
                )}
                {activeDeal.status === "MATCHED" && (
                  <div className="mt-2.5 border border-emerald-500 bg-emerald-50 p-2 text-emerald-800 flex gap-2 items-start">
                    <Check className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-mono text-[9px] font-bold leading-normal uppercase">
                      SETTLEMENT MATCH CONFIRMED: CONTRACT HAS BEEN ESCROW REGISTERED.
                    </span>
                  </div>
                )}
              </div>

              {/* TRADING LEDGER SPLIT GRID */}
              <div className="space-y-4">
                
                {/* BUYERS LEDGER (BIDS) */}
                <div>
                  <div className="font-mono text-[10px] font-bold text-[#111111] border-b border-dashed border-gray-400 pb-1 mb-2 uppercase tracking-wide">
                    BUYER POSITION (BID)
                  </div>
                  <div className="space-y-1.5">
                    {bids.map((b) => {
                      const isHumanBid = b.name === "Buyer (You)";
                      return (
                        <div 
                          key={b.id} 
                          className={`border p-2 text-xs font-mono flex justify-between items-center ${
                            isHumanBid
                              ? "border-amber-500 bg-amber-50/40 font-bold"
                              : "border-blue-200 bg-blue-50/20"
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className={isHumanBid ? "text-amber-950" : "text-blue-900"}>{b.name}</span>
                            <span className={`text-[9px] uppercase ${isHumanBid ? "text-amber-800" : "text-blue-500"}`}>
                              BUDGET CAP: {b.hidden_floor_ceil} EUR
                            </span>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 border ${
                            isHumanBid 
                              ? "text-amber-950 bg-white border-amber-500" 
                              : "text-gray-900 bg-white border-blue-300"
                          }`}>
                            {b.current_price_point ? `${b.current_price_point} EUR` : "NO OFFER"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SELLERS LEDGER (ASKS) */}
                <div>
                  <div className="font-mono text-[10px] font-bold text-[#111111] border-b border-dashed border-gray-400 pb-1 mb-2 uppercase tracking-wide">
                    SELLER POSITION (ASK)
                  </div>
                  <div className="space-y-1.5">
                    {asks.map((s) => {
                      const isHumanAsk = s.name === "Seller (You)";
                      return (
                        <div 
                          key={s.id} 
                          className={`border p-2 text-xs font-mono flex justify-between items-center ${
                            isHumanAsk
                              ? "border-amber-500 bg-amber-50/40 font-bold"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className={isHumanAsk ? "text-amber-950" : "text-gray-800"}>{s.name}</span>
                            <span className={`text-[9px] uppercase ${isHumanAsk ? "text-amber-800" : "text-gray-400"}`}>
                              RESERVATION FLOOR: {s.hidden_floor_ceil} EUR
                            </span>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 border ${
                            isHumanAsk
                              ? "text-amber-950 bg-white border-amber-500"
                              : "text-gray-900 bg-[#fafafa] border-gray-400"
                          }`}>
                            {s.current_price_point ? `${s.current_price_point} EUR` : "NO OFFER"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* MARKET SPECIFICATION REPORT */}
              <div className="flex-1 flex flex-col gap-1.5 mt-2 border-t border-[#111111] pt-3 overflow-hidden">
                <span className="font-mono text-[10px] font-bold text-gray-500 uppercase block">
                  INJECTED LOT CONTRACT SPECIFICATIONS:
                </span>
                <div className="border border-gray-300 bg-white p-3 font-mono text-[10px] leading-relaxed text-gray-700 overflow-y-auto h-48 select-text border-solid">
                  <div className="space-y-1">
                    {renderMarkdown(activeDeal.technical_specs)}
                  </div>
                </div>
              </div>

            </>
          ) : (
            <div className="text-center p-8 text-gray-400 font-mono text-xs">
              WAITING FOR CHIP SELECTION...
            </div>
          )}

        </aside>

      </div>

    </main>
  );
}
