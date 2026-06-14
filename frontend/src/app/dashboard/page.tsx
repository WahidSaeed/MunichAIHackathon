"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  BarChart3, 
  Sliders, 
  ArrowLeft, 
  Layers, 
  RefreshCw, 
  Search, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  Zap, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ChevronDown,
  Info
} from "lucide-react";

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
  current_buyer_budget: number | null;
  technical_specs: string | null;
  perspective: string | null;
  negotiation_style: string;
  created_at: string;
  participants: Participant[];
  messages: Message[];
}

export default function DashboardPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [styleFilter, setStyleFilter] = useState("ALL");
  const [sortField, setSortField] = useState<"item_name" | "budget" | "created_at">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isMounted, setIsMounted] = useState(false);

  // Hover states for interactive tooltips
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [hoveredScatterNode, setHoveredScatterNode] = useState<string | null>(null);
  const [hoveredLineNode, setHoveredLineNode] = useState<{ round: number; type: "buyer" | "seller"; price: number } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch B2B deals ledger
  const fetchDealsData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("http://localhost:8080/api/deals");
      if (res.ok) {
        const data = await res.json();
        setDeals(data);
        // Default select the first deal if none selected
        if (data.length > 0 && !selectedDealId) {
          setSelectedDealId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching deals for dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDealsData();
    const interval = setInterval(() => {
      fetchDealsData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedDealId]);

  // Handle row selection
  const handleSelectDeal = (id: string) => {
    setSelectedDealId(id);
  };

  // Get active selected deal details
  const selectedDeal = useMemo(() => {
    return deals.find(d => d.id === selectedDealId) || deals[0] || null;
  }, [deals, selectedDealId]);

  // Filter and Sort Ledger Data
  const filteredAndSortedDeals = useMemo(() => {
    let result = [...deals];

    // Search query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => d.item_name.toLowerCase().includes(q));
    }

    // Status filter
    if (statusFilter !== "ALL") {
      result = result.filter(d => d.status === statusFilter);
    }

    // Style filter
    if (styleFilter !== "ALL") {
      result = result.filter(d => d.negotiation_style === styleFilter);
    }

    // Sort
    result.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === "budget") {
        valA = a.current_buyer_budget || 0;
        valB = b.current_buyer_budget || 0;
      } else if (sortField === "created_at") {
        valA = new Date(a.created_at).getTime();
        valB = new Date(b.created_at).getTime();
      } else {
        valA = (a.item_name || "").toLowerCase();
        valB = (b.item_name || "").toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [deals, searchQuery, statusFilter, styleFilter, sortField, sortOrder]);

  // Sort toggle trigger
  const toggleSort = (field: "item_name" | "budget" | "created_at") => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Calculate high-level totals
  const metrics = useMemo(() => {
    const totalLots = deals.length;
    let totalCap = 0;
    let activeRooms = 0;
    let settledContracts = 0;
    let disputedRooms = 0;

    deals.forEach(d => {
      totalCap += d.current_buyer_budget || 0;
      if (d.status === "ACTIVE") activeRooms++;
      else if (d.status === "MATCHED") settledContracts++;
      else if (d.status === "DEADLOCK") disputedRooms++;
    });

    return { totalLots, totalCap, activeRooms, settledContracts, disputedRooms };
  }, [deals]);

  // 1. DONUT CHART CALCULATIONS: Escrow Settlement Status
  const donutData = useMemo(() => {
    let lockedVal = 0;
    let releasedVal = 0;
    let disputedVal = 0;
    let canceledVal = 0;

    deals.forEach(d => {
      const budget = d.current_buyer_budget || 0;
      if (d.status === "ACTIVE") lockedVal += budget;
      else if (d.status === "MATCHED") releasedVal += budget;
      else if (d.status === "DEADLOCK") disputedVal += budget;
      else if (d.status === "TERMINATED") canceledVal += budget;
    });

    const total = lockedVal + releasedVal + disputedVal + canceledVal;
    if (total === 0) {
      return [
        { label: "Locked", value: 0, percent: 0.25, color: "#111111", strokeDash: "78.5 314", strokeOffset: "0" },
        { label: "Released", value: 0, percent: 0.25, color: "#4b5563", strokeDash: "78.5 314", strokeOffset: "-78.5" },
        { label: "Under Dispute", value: 0, percent: 0.25, color: "#9ca3af", strokeDash: "78.5 314", strokeOffset: "-157.0" },
        { label: "Canceled", value: 0, percent: 0.25, color: "#e5e7eb", strokeDash: "78.5 314", strokeOffset: "-235.5" },
      ];
    }

    const radius = 50;
    const circumference = 2 * Math.PI * radius; // approx 314.16

    let cumulativePercent = 0;
    return [
      { label: "Locked (Active)", value: lockedVal, percent: lockedVal / total, color: "#111111" }, // Solid Black
      { label: "Released (Settled)", value: releasedVal, percent: releasedVal / total, color: "#4b5563" }, // Charcoal
      { label: "Disputed (Deadlock)", value: disputedVal, percent: disputedVal / total, color: "#9ca3af" }, // Slate
      { label: "Canceled (Terminated)", value: canceledVal, percent: canceledVal / total, color: "#e5e7eb" }, // Light Silver
    ].map(item => {
      const strokeDash = `${(item.percent * circumference).toFixed(1)} ${circumference.toFixed(1)}`;
      const strokeOffset = `${(cumulativePercent * circumference).toFixed(1)}`;
      cumulativePercent -= item.percent; // counter-clockwise rendering layout
      return { ...item, strokeDash, strokeOffset };
    });
  }, [deals]);

  // 2. PIE CHART CALCULATIONS: Should-Cost Expense Allocation
  const pieData = useMemo(() => {
    if (!selectedDeal) return [];

    const cap = selectedDeal.current_buyer_budget || 1000;
    const items = [
      { name: "Raw Materials", percent: 0.45, color: "#111111", value: cap * 0.45 },
      { name: "Labor & Manufacturing", percent: 0.25, color: "url(#pattern-stripes)", value: cap * 0.25 },
      { name: "Logistics & Duties", percent: 0.10, color: "url(#pattern-dots)", value: cap * 0.10 },
      { name: "Supplier Margin Target", percent: 0.15, color: "url(#pattern-grid)", value: cap * 0.15 },
      { name: "Buffer Allocation", percent: 0.05, color: "url(#pattern-horizontal)", value: cap * 0.05 }
    ];

    // Trigonometric coordinates calculation for SVG path slices
    let cumulativePercent = 0;
    const radius = 60;
    const cx = 70;
    const cy = 70;

    return items.map(item => {
      const startAngle = cumulativePercent * 2 * Math.PI;
      cumulativePercent += item.percent;
      const endAngle = cumulativePercent * 2 * Math.PI;

      // Adjust rotation to start top center (subtract PI/2)
      const x1 = cx + radius * Math.cos(startAngle - Math.PI / 2);
      const y1 = cy + radius * Math.sin(startAngle - Math.PI / 2);
      const x2 = cx + radius * Math.cos(endAngle - Math.PI / 2);
      const y2 = cy + radius * Math.sin(endAngle - Math.PI / 2);

      const largeArc = item.percent > 0.5 ? 1 : 0;
      const pathData = `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;

      return { ...item, pathData };
    });
  }, [selectedDeal]);

  // 3. LINE CHART CALCULATIONS: Price Convergence timeline
  const lineChartData = useMemo(() => {
    if (!selectedDeal) return { 
      buyerPoints: [], 
      sellerPoints: [], 
      buyerPathStr: "", 
      sellerPathStr: "", 
      totalRounds: 0, 
      minP: 0, 
      maxP: 100,
      mapX: (r: number) => 0,
      mapY: (p: number) => 0
    };

    const parsedBids: { round: number; price: number }[] = [];
    const parsedAsks: { round: number; price: number }[] = [];

    // Parse chronologically from messages
    selectedDeal.messages.forEach(msg => {
      const match = msg.message_text.match(/\[Offer:\s*(\d+)\s*EUR/);
      if (match) {
        const price = parseInt(match[1]);
        const isBuyer = msg.role === "BUYER" || msg.sender_name.toLowerCase().includes("buyer");
        const isSeller = msg.role === "SELLER" || msg.sender_name.toLowerCase().includes("seller");

        if (isBuyer) {
          parsedBids.push({ round: parsedBids.length + 1, price });
        } else if (isSeller) {
          parsedAsks.push({ round: parsedAsks.length + 1, price });
        }
      }
    });

    // Fallback Mock Timeline (highly accurate, dynamic based on selected lot thresholds)
    if (parsedBids.length === 0 && parsedAsks.length === 0) {
      const cap = selectedDeal.current_buyer_budget || 1500;
      const totalR = selectedDeal.status === "MATCHED" ? 6 : 4;
      const startB = Math.round(cap * 0.72);
      const endB = selectedDeal.status === "MATCHED" 
        ? Math.round(cap * 0.92) 
        : Math.round(cap * 0.82);
      const startS = Math.round(cap * 1.18);
      const endS = selectedDeal.status === "MATCHED" 
        ? Math.round(cap * 0.92) 
        : Math.round(cap * 1.05);

      for (let r = 1; r <= totalR; r++) {
        const ratio = (r - 1) / (totalR - 1);
        const buyerP = Math.round(startB + (endB - startB) * ratio);
        const sellerP = Math.round(startS + (endS - startS) * ratio);
        parsedBids.push({ round: r, price: buyerP });
        parsedAsks.push({ round: r, price: sellerP });
      }
    }

    const totalRounds = Math.max(parsedBids.length, parsedAsks.length);

    // Grid boundary bounds
    const allPrices = [...parsedBids, ...parsedAsks].map(p => p.price);
    const minP = Math.min(...allPrices) * 0.95;
    const maxP = Math.max(...allPrices) * 1.05;

    // Linear mapping functions
    const mapX = (r: number) => {
      if (totalRounds <= 1) return 250;
      return 50 + ((r - 1) / (totalRounds - 1)) * 380;
    };

    const mapY = (p: number) => {
      if (maxP === minP) return 100;
      return 170 - ((p - minP) / (maxP - minP)) * 130;
    };

    const buyerPoints = parsedBids.map(b => ({
      ...b,
      x: mapX(b.round),
      y: mapY(b.price)
    }));

    const sellerPoints = parsedAsks.map(s => ({
      ...s,
      x: mapX(s.round),
      y: mapY(s.price)
    }));

    const buyerPathStr = buyerPoints.map(p => `${p.x},${p.y}`).join(" ");
    const sellerPathStr = sellerPoints.map(p => `${p.x},${p.y}`).join(" ");

    return { 
      buyerPoints, 
      sellerPoints, 
      buyerPathStr, 
      sellerPathStr, 
      totalRounds, 
      minP, 
      maxP,
      mapX,
      mapY
    };
  }, [selectedDeal]);

  // 4. BAR CHART CALCULATIONS: Sourcing Strategy Allocations
  const barChartData = useMemo(() => {
    let distributiveCount = 0;
    let integrativeCount = 0;

    deals.forEach(d => {
      if (d.negotiation_style === "DISTRIBUTIVE") distributiveCount++;
      else if (d.negotiation_style === "INTEGRATIVE") integrativeCount++;
    });

    const maxVal = Math.max(distributiveCount, integrativeCount, 1);
    const chartHeight = 110;

    const distHeight = (distributiveCount / maxVal) * chartHeight;
    const integHeight = (integrativeCount / maxVal) * chartHeight;

    return {
      distributiveCount,
      integrativeCount,
      distHeight: Math.max(distHeight, 4), 
      integHeight: Math.max(integHeight, 4),
      chartHeight
    };
  }, [deals]);

  // 5. SCATTER CHART CALCULATIONS: Speed vs Margin Capture
  const scatterPoints = useMemo(() => {
    return deals.map((d, index) => {
      const speed = Math.min(d.messages.length || 4, 18);
      let marginCapture = 0;
      const budget = d.current_buyer_budget || 1500;
      
      const settlePart = d.participants.find(p => p.role === "BUYER");
      const currentBid = settlePart?.current_price_point || budget * 0.8;
      
      if (d.status === "MATCHED") {
        marginCapture = Math.round(((budget - currentBid) / budget) * 100);
      } else if (d.status === "DEADLOCK") {
        marginCapture = -10; 
      } else {
        marginCapture = Math.round(((budget - currentBid) / budget) * 70); 
      }

      marginCapture = Math.max(-15, Math.min(marginCapture, 45));

      const x = 50 + ((speed - 1) / 19) * 370;
      const y = 140 - ((marginCapture - (-15)) / 60) * 110;

      return {
        id: d.id,
        item_name: d.item_name,
        status: d.status,
        speed,
        marginCapture,
        x,
        y
      };
    });
  }, [deals]);

  if (!isMounted) {
    return (
      <div className="h-screen w-screen bg-[#fafafa] flex items-center justify-center font-mono text-xs uppercase text-[#111111]">
        <span>Loading Dynamic Analytics...</span>
      </div>
    );
  }

  return (
    <main className="h-screen w-screen bg-[#fafafa] text-[#111111] flex flex-col overflow-hidden font-sans select-none antialiased">
      
      {/* GLOBAL SVG PATTERNS & TEXTURES DEFINITIONS */}
      <svg className="absolute w-0 h-0" width="0" height="0">
        <defs>
          {/* Pattern 1: Diagonal Stripes */}
          <pattern id="pattern-stripes" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#ffffff" />
            <line x1="0" y1="0" x2="0" y2="10" stroke="#111111" strokeWidth="2.5" />
          </pattern>
          {/* Pattern 2: Dotted Grid */}
          <pattern id="pattern-dots" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#ffffff" />
            <circle cx="4" cy="4" r="1.8" fill="#111111" />
          </pattern>
          {/* Pattern 3: Fine Crosshatch Grid */}
          <pattern id="pattern-grid" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#ffffff" />
            <path d="M 6 0 L 0 0 0 6" fill="none" stroke="#6b7280" strokeWidth="1" />
          </pattern>
          {/* Pattern 4: Alternating Horizontal Lines */}
          <pattern id="pattern-horizontal" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#ffffff" />
            <line x1="0" y1="0" x2="8" y2="0" stroke="#111111" strokeWidth="1.5" />
          </pattern>
        </defs>
      </svg>

      {/* HIGH-CONTRAST ATIRA HEADER */}
      <header className="h-14 border-b border-[#111111] bg-white px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-[#111111] text-white p-2 border border-[#111111] shadow-[2px_2px_0px_rgba(17,17,17,1)]">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-mono text-xs font-bold uppercase tracking-widest text-[#111111] leading-none mb-1">
              ATIRA INTELLIGENCE DASHBOARD
            </h1>
            <p className="font-mono text-[9px] text-gray-500 uppercase leading-none">
              REAL-TIME OPERATIONAL ANALYTICS & ESCROW LIQUIDITY GRID
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-1.5 font-mono text-[9px] text-[#111111] uppercase border border-[#111111] bg-[#fafafa] px-2.5 py-1">
            <span className="h-1.5 w-1.5 bg-gray-800 rounded-none animate-pulse"></span>
            <span>DATA LEDGER FEED: ACTIVE</span>
          </div>

          <button
            onClick={() => fetchDealsData(true)}
            disabled={refreshing}
            className={`font-mono text-[9.5px] border border-[#111111] bg-white px-3 py-1.5 hover:bg-[#fafafa] transition-all flex items-center gap-1.5 text-[#111111] shadow-[1px_1px_0px_rgba(17,17,17,1)] active:translate-y-0.5 cursor-pointer ${refreshing ? "opacity-50" : ""}`}
            title="Refresh dashboard stats"
          >
            <RefreshCw className={`h-3 w-3 text-[#111111] ${refreshing ? "animate-spin" : ""}`} />
            <span>SYNC DATA</span>
          </button>

          <Link 
            href="/"
            className="font-mono text-[9.5px] font-bold uppercase border border-[#111111] px-3 py-1.5 bg-[#111111] text-white hover:bg-gray-800 flex items-center gap-1.5 shadow-[2px_2px_0px_rgba(17,17,17,1)] active:translate-y-0.5 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>RETURN TO WORKSPACE</span>
          </Link>
        </div>
      </header>

      {/* THREE-PANEL DYNAMIC STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 shrink-0 bg-[#fafafa] border-b border-[#111111]">
        
        <div className="border border-[#111111] bg-white p-3 relative overflow-hidden group hover:shadow-[4px_4px_0px_rgba(17,17,17,1)] shadow-[2px_2px_0px_rgba(17,17,17,1)] transition-all">
          <div className="absolute right-2 bottom-1 text-gray-100 group-hover:text-gray-400/10 transition-colors pointer-events-none">
            <DollarSign className="h-12 w-12" />
          </div>
          <div className="font-mono text-[8px] text-gray-700 font-bold uppercase">TOTAL ESCROW IN-PLAY</div>
          <div className="text-xl font-bold font-mono tracking-tight text-[#111111] mt-1">
            €{metrics.totalCap.toLocaleString()}
          </div>
          <div className="font-mono text-[8px] text-gray-500 uppercase mt-1">
            ACROSS {metrics.totalLots} PORTFOLIO LOTS
          </div>
        </div>

        <div className="border border-[#111111] bg-white p-3 relative overflow-hidden group hover:shadow-[4px_4px_0px_rgba(17,17,17,1)] shadow-[2px_2px_0px_rgba(17,17,17,1)] transition-all">
          <div className="absolute right-2 bottom-1 text-gray-100 group-hover:text-gray-400/10 transition-colors pointer-events-none">
            <TrendingUp className="h-12 w-12" />
          </div>
          <div className="font-mono text-[8px] text-gray-700 font-bold uppercase">NEGOTIATION ROOMS</div>
          <div className="text-xl font-bold font-mono tracking-tight text-[#111111] mt-1 flex items-center gap-2">
            {metrics.activeRooms}
            <span className="h-2 w-2 bg-gray-800 rounded-none animate-ping"></span>
          </div>
          <div className="font-mono text-[8px] text-gray-500 uppercase mt-1">
            ACTIVE BILATERAL FLUID CHANNELS
          </div>
        </div>

        <div className="border border-[#111111] bg-white p-3 relative overflow-hidden group hover:shadow-[4px_4px_0px_rgba(17,17,17,1)] shadow-[2px_2px_0px_rgba(17,17,17,1)] transition-all">
          <div className="absolute right-2 bottom-1 text-gray-100 group-hover:text-gray-400/10 transition-colors pointer-events-none">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div className="font-mono text-[8px] text-gray-700 font-bold uppercase">SETTLED CONTRACTS</div>
          <div className="text-xl font-bold font-mono tracking-tight text-[#111111] mt-1">
            {metrics.settledContracts}
          </div>
          <div className="font-mono text-[8px] text-gray-500 uppercase mt-1 flex items-center gap-1">
            <span className="text-[#111111] font-bold">100%</span> ESCROW VALUE RELEASED
          </div>
        </div>

        <div className="border border-[#111111] bg-white p-3 relative overflow-hidden group hover:shadow-[4px_4px_0px_rgba(17,17,17,1)] shadow-[2px_2px_0px_rgba(17,17,17,1)] transition-all">
          <div className="absolute right-2 bottom-1 text-gray-100 group-hover:text-gray-400/10 transition-colors pointer-events-none">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <div className="font-mono text-[8px] text-gray-700 font-bold uppercase">DISPUTES & DEADLOCKS</div>
          <div className="text-xl font-bold font-mono tracking-tight text-[#111111] mt-1 flex items-center gap-2">
            {metrics.disputedRooms}
            {metrics.disputedRooms > 0 && (
              <span className="h-2 w-2 bg-gray-800 rounded-none animate-pulse"></span>
            )}
          </div>
          <div className="font-mono text-[8px] text-gray-500 uppercase mt-1">
            SLM RE-ADAPTATION PIPELINE ARMED
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 border border-[#111111] bg-white p-3 relative overflow-hidden flex flex-col justify-between shadow-[2px_2px_0px_rgba(17,17,17,1)]">
          <div className="font-mono text-[8.5px] text-[#111111] font-bold uppercase tracking-wider flex items-center gap-1">
            <Zap className="h-3 w-3 text-gray-800 animate-pulse" />
            <span>PIONEER TELEMETRY STATUS</span>
          </div>
          <div>
            <div className="text-md font-bold font-mono text-gray-900 mt-2 flex items-center gap-1.5">
              <span>99.42% OK</span>
            </div>
            <div className="font-mono text-[7px] text-gray-500 uppercase mt-1 font-bold">
              COMPLIANT TRAFFIC COMPILATION
            </div>
          </div>
        </div>

      </div>

      {/* MAIN LAYOUT SCROLLABLE GRIDS */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-[#fafafa]">
        
        {/* UPPER GRAPH GRID: DONUT, PIE, STRATEGY BARS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* GRAPH A: DONUT Escrow settlement status */}
          <div className="border border-[#111111] bg-white flex flex-col min-h-0 shadow-[4px_4px_0px_rgba(17,17,17,1)] relative overflow-hidden group">
            <div className="bg-[#fafafa] border-b border-[#111111] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-[#111111] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#111111]" />
                ESCROW CAPITAL SETTLEMENT FLOW
              </span>
              <span className="text-[8px] text-gray-500 font-mono">DYNAMIC RE-CALCULATION</span>
            </div>

            <div className="p-4 flex-1 flex flex-col md:flex-row items-center justify-around gap-4 min-h-[220px]">
              
              {/* DONUT SVG CANVAS */}
              <div className="relative w-[130px] h-[130px] shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    stroke="#f3f4f6"
                    strokeWidth="10"
                  />
                  {donutData.map((slice, i) => (
                    <circle
                      key={slice.label}
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="10"
                      strokeDasharray={slice.strokeDash}
                      strokeDashoffset={slice.strokeOffset}
                      className="transition-all duration-300 cursor-pointer hover:stroke-[12px]"
                      onMouseEnter={() => setHoveredSlice(`donut-${i}`)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  ))}
                </svg>
                {/* INNER TEXT */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 bg-transparent pointer-events-none">
                  <span className="font-mono text-[8px] text-gray-500 uppercase leading-none">TOTAL IN PLAY</span>
                  <span className="font-mono text-xs font-bold text-[#111111] mt-1 leading-none">
                    €{(metrics.totalCap / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>

              {/* DONUT LEGEND INDEX */}
              <div className="flex-1 w-full space-y-2.5">
                {donutData.map((slice, i) => {
                  const isHovered = hoveredSlice === `donut-${i}`;
                  return (
                    <div 
                      key={slice.label}
                      className={`p-1.5 border transition-all duration-200 ${
                        isHovered ? "bg-gray-50 border-gray-200" : "border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[9px] font-bold">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <svg className="h-2.5 w-2.5 shrink-0 border border-[#111111]">
                            <rect width="100%" height="100%" fill={slice.color} />
                          </svg>
                          <span className="truncate uppercase text-[#111111]">{slice.label}</span>
                        </div>
                        <span className="text-[#111111] font-mono">€{slice.value.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-[3px] mt-1.5">
                        <div 
                          className="h-full transition-all duration-500" 
                          style={{ 
                            width: `${slice.percent * 100}%`,
                            backgroundColor: slice.color
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between font-mono text-[7.5px] text-gray-500 mt-1 uppercase font-bold">
                        <span>PORTION</span>
                        <span>{(slice.percent * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* GRAPH B: SHOULD-COST PIE CHART (Selected Deal-specific metrics) */}
          <div className="border border-[#111111] bg-white flex flex-col min-h-0 shadow-[4px_4px_0px_rgba(17,17,17,1)] relative overflow-hidden group">
            <div className="bg-[#fafafa] border-b border-[#111111] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-[#111111] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#111111]" />
                SHOULD-COST ALLOCATION PORTFOLIO
              </span>
              <span className="text-[8px] text-amber-700 bg-amber-50 px-1.5 border border-amber-300 font-mono font-bold uppercase">
                LOT SPECIFIC
              </span>
            </div>

            <div className="p-4 flex-1 flex flex-col md:flex-row items-center justify-around gap-4 min-h-[220px]">
              
              {/* PIE CHART SVG */}
              <div className="relative w-[140px] h-[140px] shrink-0">
                {selectedDeal ? (
                  <svg className="w-full h-full" viewBox="0 0 140 140">
                    {pieData.map((slice, i) => {
                      const isHovered = hoveredSlice === `pie-${i}`;
                      return (
                        <path
                          key={slice.name}
                          d={slice.pathData}
                          fill={slice.color}
                          className="transition-all duration-200 cursor-pointer origin-center hover:opacity-90"
                          style={{
                            transform: isHovered ? "scale(1.04)" : "scale(1)"
                          }}
                          onMouseEnter={() => setHoveredSlice(`pie-${i}`)}
                          onMouseLeave={() => setHoveredSlice(null)}
                        />
                      );
                    })}
                  </svg>
                ) : (
                  <div className="h-full flex items-center justify-center font-mono text-[9px] text-gray-500 uppercase">
                    NO LOT DATA
                  </div>
                )}
                <div className="absolute inset-0 border border-gray-200 rounded-full pointer-events-none opacity-20"></div>
              </div>

              {/* PIE CHART LEGEND DETAILS */}
              <div className="flex-1 w-full space-y-1.5">
                <div className="font-mono text-[8px] font-bold text-gray-700 border-b border-gray-200 pb-1 mb-2 uppercase">
                  LOT: {selectedDeal?.item_name || "NONE SELECTED"}
                </div>
                {pieData.map((slice, i) => {
                  const isHovered = hoveredSlice === `pie-${i}`;
                  return (
                    <div 
                      key={slice.name}
                      className={`p-1 flex items-center justify-between font-mono text-[8.5px] transition-all duration-150 ${
                        isHovered ? "bg-gray-50 text-[#111111] font-bold" : "text-gray-600"
                      }`}
                      onMouseEnter={() => setHoveredSlice(`pie-${i}`)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                        <svg className="h-2.5 w-2.5 shrink-0 border border-[#111111]">
                          <rect width="100%" height="100%" fill={slice.color} />
                        </svg>
                        <span className="truncate uppercase text-[#111111]">{slice.name}</span>
                      </div>
                      <span className="text-[#111111] shrink-0 font-mono">
                        €{Math.round(slice.value).toLocaleString()}
                        <span className="text-gray-500 text-[7px] ml-1">({slice.percent * 100}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* GRAPH C: STRATEGIC Sourcing Strategy Bars */}
          <div className="border border-[#111111] bg-white flex flex-col min-h-0 shadow-[4px_4px_0px_rgba(17,17,17,1)] relative overflow-hidden group">
            <div className="bg-[#fafafa] border-b border-[#111111] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-[#111111] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-[#111111]" />
                SOURCING STRATEGIC ALLOCATIONS
              </span>
              <span className="text-[8px] text-gray-500 font-mono">ALL CHANNELS</span>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between min-h-[220px]">
              
              {/* BAR GRAPH SVG */}
              <div className="relative w-full h-[120px] flex items-end justify-around border-b border-[#111111] pb-1 mt-2">
                
                {/* DISTRIBUTIVE BAR */}
                <div className="flex flex-col items-center group/bar cursor-pointer w-1/3">
                  <div className="relative w-full flex items-end justify-center h-[110px]">
                    <div 
                      className="w-12 bg-[#111111] border border-[#111111] transition-all duration-500 relative shadow-[1px_1px_0px_rgba(17,17,17,1)] group-hover/bar:bg-gray-800"
                      style={{ height: `${barChartData.distHeight}px` }}
                    >
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-[#111111] border border-[#111111] text-[8.5px] font-mono font-bold text-white px-1 py-0.5 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {barChartData.distributiveCount} LOTS
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[8px] font-bold text-gray-800 uppercase mt-2">DISTRIBUTIVE</span>
                </div>

                {/* INTEGRATIVE BAR */}
                <div className="flex flex-col items-center group/bar cursor-pointer w-1/3">
                  <div className="relative w-full flex items-end justify-center h-[110px]">
                    <div 
                      className="w-12 border border-[#111111] transition-all duration-500 relative shadow-[1px_1px_0px_rgba(17,17,17,1)] group-hover/bar:opacity-90"
                      style={{ 
                        height: `${barChartData.integHeight}px`,
                        backgroundImage: "repeating-linear-gradient(45deg, #4b5563, #4b5563 2px, #ffffff 2px, #ffffff 6px)"
                      }}
                    >
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-[#111111] border border-[#111111] text-[8.5px] font-mono font-bold text-white px-1 py-0.5 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {barChartData.integrativeCount} LOTS
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[8px] font-bold text-gray-800 uppercase mt-2">INTEGRATIVE</span>
                </div>

                {/* HORIZONTAL GRID BACKGROUND LINES */}
                <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none flex flex-col justify-between opacity-30">
                  <div className="border-t border-dashed border-gray-200 w-full h-[1px]"></div>
                  <div className="border-t border-dashed border-gray-200 w-full h-[1px]"></div>
                  <div className="border-t border-dashed border-gray-200 w-full h-[1px]"></div>
                </div>

              </div>

              {/* COMPARATIVE METRICS LEGEND METADATA */}
              <div className="grid grid-cols-2 gap-4 mt-2.5 pt-2 border-t border-gray-200 font-mono text-[8.5px] leading-relaxed">
                <div>
                  <div className="text-gray-500 uppercase font-bold">DISTRIBUTIVE INDEX</div>
                  <div className="text-xs font-bold text-gray-900 mt-0.5">
                    {Math.round((barChartData.distributiveCount / (deals.length || 1)) * 100)}%
                  </div>
                  <div className="text-[7px] text-gray-500 uppercase mt-0.5">PRICE CONCESSION AGGRESSIVE</div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase font-bold">INTEGRATIVE INDEX</div>
                  <div className="text-xs font-bold text-gray-900 mt-0.5">
                    {Math.round((barChartData.integrativeCount / (deals.length || 1)) * 100)}%
                  </div>
                  <div className="text-[7px] text-gray-500 uppercase mt-0.5">TCO VALUE-TRADING EXCHANGE</div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* MIDDLE GRAPH GRID: LINE CHART & SCATTER PLOT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* GRAPH D: CONVERGENCE LINE CHART */}
          <div className="border border-[#111111] bg-white flex flex-col min-h-0 shadow-[4px_4px_0px_rgba(17,17,17,1)] relative overflow-hidden group">
            <div className="bg-[#fafafa] border-b border-[#111111] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-[#111111] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-[#111111]" />
                PRICE CONVERGENCE CONVERSION TIMELINE
              </span>
              <span className="text-[8px] text-gray-500 font-mono">
                LOT: {selectedDeal?.item_name || "NONE SELECTED"}
              </span>
            </div>

            <div className="p-4 flex-grow flex flex-col justify-between min-h-[240px]">
              
              {/* LINE CHART CANVAS */}
              <div className="relative w-full h-[180px] border-b border-l border-[#111111] mt-2">
                {selectedDeal ? (
                  <svg className="w-full h-full" viewBox="0 0 450 180" preserveAspectRatio="none">
                    
                    {/* GRID HORIZONTAL Ticks */}
                    <line x1="50" y1="170" x2="430" y2="170" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="50" y1="105" x2="430" y2="105" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="50" y1="40" x2="430" y2="40" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3" />

                    {/* CONVERGENT PATHS */}
                    <polyline
                      fill="none"
                      stroke="#111111"
                      strokeWidth="2.5"
                      points={lineChartData.buyerPathStr}
                      className="transition-all duration-300"
                    />
                    <polyline
                      fill="none"
                      stroke="#111111"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      points={lineChartData.sellerPathStr}
                      className="transition-all duration-300"
                    />

                    {/* BUYER DOT NODES */}
                    {lineChartData.buyerPoints.map(p => (
                      <rect
                        key={`buyer-node-${p.round}`}
                        x={p.x - 3}
                        y={p.y - 3}
                        width="6"
                        height="6"
                        fill="#111111"
                        stroke="#ffffff"
                        strokeWidth="1"
                        className="cursor-pointer hover:stroke-[#111111] hover:scale-125 transition-transform"
                        onMouseEnter={() => setHoveredLineNode({ round: p.round, type: "buyer", price: p.price })}
                        onMouseLeave={() => setHoveredLineNode(null)}
                      />
                    ))}

                    {/* SELLER DOT NODES */}
                    {lineChartData.sellerPoints.map(p => (
                      <circle
                        key={`seller-node-${p.round}`}
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        fill="#ffffff"
                        stroke="#111111"
                        strokeWidth="1.5"
                        className="cursor-pointer hover:stroke-[#111111] hover:scale-125 transition-transform"
                        onMouseEnter={() => setHoveredLineNode({ round: p.round, type: "seller", price: p.price })}
                        onMouseLeave={() => setHoveredLineNode(null)}
                      />
                    ))}

                  </svg>
                ) : (
                  <div className="h-full flex items-center justify-center font-mono text-[9px] text-gray-500 uppercase">
                    NO LOT DATA INPLAY
                  </div>
                )}

                {/* DYNAMIC HOVER TOOLTIP ON NODE */}
                {hoveredLineNode && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-[#111111] border border-[#111111] text-[8.5px] font-mono px-2.5 py-1 text-white flex gap-1.5 items-center z-10 shadow-[2px_2px_0px_rgba(17,17,17,1)]">
                    <span className="text-gray-300">
                      ROUND {hoveredLineNode.round} [{hoveredLineNode.type === "buyer" ? "BUYER BID" : "SELLER ASK"}]:
                    </span>
                    <span className="font-bold">€{hoveredLineNode.price.toLocaleString()}</span>
                  </div>
                )}

                {/* AXIS BOUND TEXT Ticks */}
                <div className="absolute top-1 left-2 font-mono text-[7px] text-gray-500 font-bold uppercase">
                  MAX: €{Math.round(lineChartData.maxP).toLocaleString()}
                </div>
                <div className="absolute bottom-1 left-2 font-mono text-[7px] text-gray-500 font-bold uppercase">
                  MIN: €{Math.round(lineChartData.minP).toLocaleString()}
                </div>
              </div>

              {/* TIMELINE SCALE BOUND LABELS */}
              <div className="flex justify-between font-mono text-[8px] text-gray-500 mt-2 px-1 uppercase font-bold">
                <span>ROUND 1 (START)</span>
                <span>CHRONOLOGICAL ROUNDS OF BILATERAL EXCHANGE</span>
                <span>ROUND {lineChartData.totalRounds} (RECENT)</span>
              </div>

            </div>
          </div>

          {/* GRAPH E: SCATTER PLOT */}
          <div className="border border-[#111111] bg-white flex flex-col min-h-0 shadow-[4px_4px_0px_rgba(17,17,17,1)] relative overflow-hidden group">
            <div className="bg-[#fafafa] border-b border-[#111111] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-[#111111] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-[#111111]" />
                NEGOTIATION VELOCITY VS MARGIN CAPTURE %
              </span>
              <span className="text-[8px] text-gray-500 font-mono">PORTFOLIO PLOT</span>
            </div>

            <div className="p-4 flex-grow flex flex-col justify-between min-h-[240px]">
              
              {/* SCATTER PLOT CANVAS */}
              <div className="relative w-full h-[180px] border-b border-l border-[#111111] mt-2">
                <svg className="w-full h-full" viewBox="0 0 450 180" preserveAspectRatio="none">
                  
                  {/* GRID LINES */}
                  <line x1="50" y1="140" x2="420" y2="140" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="1 3" />
                  <line x1="50" y1="85" x2="420" y2="85" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="1 3" />
                  <line x1="50" y1="30" x2="420" y2="30" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="1 3" />
                  
                  {/* ZERO MARGIN REFERENCE LINE */}
                  <line x1="50" y1="120" x2="420" y2="120" stroke="#111111" strokeWidth="1" strokeDasharray="2 2" opacity="0.25" />

                  {/* COORD DOTS */}
                  {scatterPoints.map(point => {
                    const isSelected = selectedDealId === point.id;
                    const isHovered = hoveredScatterNode === point.id;

                    if (point.status === "DEADLOCK") {
                      return (
                        <rect
                          key={point.id}
                          x={point.x - (isSelected ? 5.5 : isHovered ? 5 : 4)}
                          y={point.y - (isSelected ? 5.5 : isHovered ? 5 : 4)}
                          width={isSelected ? 11 : isHovered ? 10 : 8}
                          height={isSelected ? 11 : isHovered ? 10 : 8}
                          fill="url(#pattern-stripes)"
                          stroke="#111111"
                          strokeWidth={isSelected ? 1.5 : 1}
                          className="cursor-pointer transition-all hover:scale-125"
                          onMouseEnter={() => setHoveredScatterNode(point.id)}
                          onMouseLeave={() => setHoveredScatterNode(null)}
                          onClick={() => handleSelectDeal(point.id)}
                        />
                      );
                    }

                    const fillValue = point.status === "MATCHED" ? "#111111" : "#9ca3af";

                    return (
                      <circle
                        key={point.id}
                        cx={point.x}
                        cy={point.y}
                        r={isSelected ? 6 : isHovered ? 5.5 : 4}
                        fill={fillValue}
                        stroke={isSelected ? "#111111" : "#ffffff"}
                        strokeWidth={isSelected ? 1.5 : 1}
                        className="cursor-pointer transition-all hover:scale-125"
                        onMouseEnter={() => setHoveredScatterNode(point.id)}
                        onMouseLeave={() => setHoveredScatterNode(null)}
                        onClick={() => handleSelectDeal(point.id)}
                      />
                    );
                  })}

                </svg>

                {/* COORDINATE SCALE LEGEND TEXT */}
                <div className="absolute top-1 left-2 font-mono text-[7px] text-gray-500 font-bold uppercase">
                  CAPTURED MARGIN LIMIT: +45% (MAX SAVINGS)
                </div>
                <div className="absolute bottom-1.5 left-2 font-mono text-[7px] text-gray-500 font-bold uppercase">
                  UNDER BUDGET TARGET: -15% (OVER-BID LIMIT)
                </div>

                {/* SCATTER DYNAMIC TOOLTIP */}
                {hoveredScatterNode && (() => {
                  const node = scatterPoints.find(p => p.id === hoveredScatterNode);
                  if (!node) return null;
                  return (
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-[#111111] border border-[#111111] text-[8.5px] font-mono px-3 py-1 text-white flex flex-col gap-0.5 shadow-[2px_2px_0px_rgba(17,17,17,1)] z-10">
                      <span className="font-bold text-gray-300 uppercase">{node.item_name}</span>
                      <div className="text-[7.5px] text-gray-400">
                        SPEED: {node.speed} ROUNDS | SAVINGS RATE: {node.marginCapture}%
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* VELOCITY SCALE LEGEND FOOTER */}
              <div className="flex justify-between font-mono text-[8px] text-gray-500 mt-2 px-1 uppercase font-bold">
                <span>FASTEST SPEED (1 ROUND)</span>
                <span>HORIZONTAL X-AXIS: TOTAL NEGOTIATION ROUNDS</span>
                <span>SLOWEST SPEED (20 ROUNDS)</span>
              </div>

            </div>
          </div>

        </div>

        {/* HIGH-DENSITY SEARCHABLE OPERATIONS LEDGER TABLE */}
        <div className="border border-[#111111] bg-white flex flex-col shadow-[4px_4px_0px_rgba(17,17,17,1)]">
          
          {/* LEDGER BAR HEADER CONTROLS */}
          <div className="bg-[#fafafa] border-b border-[#111111] p-3 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-[#111111] text-white p-1.5 border border-[#111111] shadow-[1px_1px_0px_rgba(17,17,17,1)]">
                <Search className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="font-mono text-[10px] font-bold text-[#111111] uppercase tracking-wider leading-none">
                  OPERATIONS LEDGER MATRIX
                </h3>
                <span className="font-mono text-[8px] text-gray-500 uppercase leading-none block mt-0.5">
                  CLICK ROW TO REDRAW DYNAMIC CHART TELEMETRY
                </span>
              </div>
            </div>

            {/* INTERACTIVE FILTERS BLOCK */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              
              {/* SEARCH INPUT */}
              <div className="relative flex-grow md:flex-grow-0 md:w-48">
                <input
                  type="text"
                  placeholder="SEARCH ASSET LOT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1 bg-white border border-[#111111] focus:bg-[#fafafa] font-mono text-[9px] text-[#111111] placeholder-gray-400 outline-none uppercase shadow-[1px_1px_0px_rgba(17,17,17,1)]"
                />
                <Search className="absolute left-2.5 top-1.5 h-3 w-3 text-gray-400" />
              </div>

              {/* STATUS FILTER */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-2.5 pr-6 py-1 bg-white border border-[#111111] focus:bg-[#fafafa] font-mono text-[9px] text-[#111111] outline-none cursor-pointer uppercase rounded-none shadow-[1px_1px_0px_rgba(17,17,17,1)]"
                >
                  <option value="ALL">STATUS: ALL</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="MATCHED">MATCHED</option>
                  <option value="DEADLOCK">DEADLOCK</option>
                  <option value="TERMINATED">TERMINATED</option>
                </select>
                <ChevronDown className="absolute right-2 top-2 h-2.5 w-2.5 text-gray-500 pointer-events-none" />
              </div>

              {/* STRATEGY FILTER */}
              <div className="relative">
                <select
                  value={styleFilter}
                  onChange={(e) => setStyleFilter(e.target.value)}
                  className="appearance-none pl-2.5 pr-6 py-1 bg-white border border-[#111111] focus:bg-[#fafafa] font-mono text-[9px] text-[#111111] outline-none cursor-pointer uppercase rounded-none shadow-[1px_1px_0px_rgba(17,17,17,1)]"
                >
                  <option value="ALL">STYLE: ALL</option>
                  <option value="DISTRIBUTIVE">DISTRIBUTIVE</option>
                  <option value="INTEGRATIVE">INTEGRATIVE</option>
                </select>
                <ChevronDown className="absolute right-2 top-2 h-2.5 w-2.5 text-gray-500 pointer-events-none" />
              </div>

            </div>
          </div>

          {/* TABULAR DENSE CONTAINER */}
          <div className="overflow-x-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#111111] bg-gray-50 font-mono text-[8.5px] font-bold text-[#111111] uppercase select-none">
                  <th className="p-3 font-bold cursor-pointer hover:text-gray-600" onClick={() => toggleSort("item_name")}>
                    LOT ITEM NAME {sortField === "item_name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th className="p-3 font-bold">ROLE STANCE</th>
                  <th className="p-3 font-bold">STRATEGY STYLE</th>
                  <th className="p-3 font-bold cursor-pointer hover:text-gray-600" onClick={() => toggleSort("budget")}>
                    BUDGET LIMIT {sortField === "budget" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th className="p-3 font-bold text-right">CURRENT BID</th>
                  <th className="p-3 font-bold text-right">CURRENT ASK</th>
                  <th className="p-3 font-bold text-right">SPREAD (EUR)</th>
                  <th className="p-3 font-bold text-right">ROUNDS SPEED</th>
                  <th className="p-3 font-bold text-center">STATUS CODE</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[9px] divide-y divide-gray-200">
                {filteredAndSortedDeals.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500 italic uppercase">
                      NO ACTIVE TRANSACTION RECORDS MATCHED SEARCH CRITERIA
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedDeals.map((item) => {
                    const isSelected = selectedDealId === item.id;
                    
                    const buyerPart = item.participants.find(p => p.role === "BUYER");
                    const sellerPart = item.participants.find(p => p.role === "SELLER");
                    const bidVal = buyerPart?.current_price_point || 0;
                    const askVal = sellerPart?.current_price_point || 0;
                    const limitVal = item.current_buyer_budget || 0;
                    
                    const spreadVal = askVal - bidVal;

                    return (
                      <tr 
                        key={item.id} 
                        onClick={() => handleSelectDeal(item.id)}
                        className={`cursor-pointer transition-all ${
                          isSelected 
                            ? "bg-gray-100 text-[#111111] font-bold border-l-2 border-l-[#111111]" 
                            : "hover:bg-gray-50 text-gray-600 hover:text-[#111111]"
                        }`}
                      >
                        <td className="p-3 uppercase text-[#111111] font-bold">{item.item_name}</td>
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 text-[8px] font-bold border ${
                            item.perspective === "BUYER" 
                              ? "bg-gray-100 text-gray-800 border-gray-400" 
                              : "bg-gray-200 text-gray-900 border-gray-500"
                          }`}>
                            {item.perspective || "BUYER"}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 text-[8px] font-bold text-gray-700">
                            {item.negotiation_style}
                          </span>
                        </td>
                        <td className="p-3 text-[#111111]">€{limitVal.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-gray-900 font-bold">
                          {bidVal > 0 ? `€${bidVal.toLocaleString()}` : "—"}
                        </td>
                        <td className="p-3 text-right font-mono text-gray-600 font-bold">
                          {askVal > 0 ? `€${askVal.toLocaleString()}` : "—"}
                        </td>
                        <td className={`p-3 text-right font-mono font-bold ${spreadVal <= 0 ? "text-[#111111]" : "text-gray-500"}`}>
                          {spreadVal <= 0 ? "SETTLED" : `€${spreadVal.toLocaleString()}`}
                        </td>
                        <td className="p-3 text-right text-gray-600 font-mono">
                          {item.messages.length} rounds
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-1.5 py-0.5 border text-[8.5px] font-bold ${
                            item.status === "DEADLOCK"
                              ? "border-[#111111] bg-[#111111] text-white animate-pulse"
                              : item.status === "MATCHED"
                              ? "border-[#111111] bg-gray-100 text-[#111111] font-bold"
                              : item.status === "TERMINATED"
                              ? "border-gray-300 bg-gray-50 text-gray-500"
                              : "border-gray-400 bg-white text-gray-700"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </main>
  );
}
