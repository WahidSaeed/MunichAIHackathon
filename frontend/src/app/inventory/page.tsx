"use client";

import React, { useState, useEffect } from "react";
import { 
  Layers, 
  Search, 
  ArrowLeft, 
  RefreshCw, 
  Check, 
  SlidersHorizontal, 
  Info, 
  ChevronRight, 
  Plus, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Cpu,
  BadgeAlert
} from "lucide-react";

interface InventoryItem {
  id: string;
  item_name: string;
  b2b_code: string;
  min_price: number;
  max_price: number;
  technical_specs: string;
  image_path: string;
  category: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState<"name_asc" | "code_asc" | "price_asc" | "price_desc">("name_asc");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Live Deal Creator Inputs on sidebar
  const [customBudget, setCustomBudget] = useState<number>(0);
  const [creatingDeal, setCreatingDeal] = useState(false);
  const [dealSuccess, setDealSuccess] = useState(false);

  // Fetch Inventory items
  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://fat285w9p3.execute-api.eu-central-1.amazonaws.com/prod/api/inventory");
      if (!res.ok) {
        throw new Error(`Failed to load inventory: ${res.statusText}`);
      }
      const data = await res.json();
      setItems(data);
      if (data.length > 0) {
        // Auto-select first item
        setSelectedItem(data[0]);
        setCustomBudget(Math.round(data[0].max_price * 1.1));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while fetching inventory index.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Update budget field when item changes
  useEffect(() => {
    if (selectedItem) {
      setCustomBudget(Math.round(selectedItem.max_price * 1.1));
      setDealSuccess(false);
    }
  }, [selectedItem]);

  // Extract unique categories from actual items
  const categories = ["ALL", ...Array.from(new Set(items.map((i) => i.category)))];

  // Client-side search, filtering and sorting
  const filteredItems = items
    .filter((item) => {
      const matchesSearch = 
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.b2b_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.technical_specs || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "name_asc") {
        return a.item_name.localeCompare(b.item_name);
      }
      if (sortBy === "code_asc") {
        return a.b2b_code.localeCompare(b.b2b_code);
      }
      if (sortBy === "price_asc") {
        return a.min_price - b.min_price;
      }
      if (sortBy === "price_desc") {
        return b.min_price - a.min_price;
      }
      return 0;
    });

  // Action: Launch a dynamic trading round in the main workspace
  const handleCreateDeal = async () => {
    if (!selectedItem) return;
    setCreatingDeal(true);
    setDealSuccess(false);
    try {
      const payload = {
        item_name: selectedItem.item_name,
        current_buyer_budget: customBudget,
        perspective: "BUYER",
        image_url: selectedItem.image_path
      };

      const res = await fetch("https://fat285w9p3.execute-api.eu-central-1.amazonaws.com/prod/api/deals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Could not spawn live escrow negotiation lot.");
      }

      setDealSuccess(true);
      
      // Flash success, then redirect to the main trading interface
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);

    } catch (err: any) {
      alert(`Error initializing deal: ${err.message}`);
    } finally {
      setCreatingDeal(false);
    }
  };

  const formatEuro = (num: number) => {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="h-screen w-screen bg-[#fafafa] flex flex-col overflow-hidden font-sans text-[#111111] antialiased">
      
      {/* BRAND HEADER MODULE */}
      <header className="h-14 border-b border-[#111111] bg-white flex items-center justify-between px-4 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 bg-[#111111] flex items-center justify-center">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <span className="font-mono text-sm font-bold uppercase tracking-widest text-[#111111]">
            ATIRA | PROCUREMENT & INVENTORY CATALOG | V1.0
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchInventory}
            className="flex items-center gap-1.5 border border-gray-300 px-3 py-1 bg-white font-mono text-[10px] font-bold uppercase hover:border-[#111111] hover:text-black transition-colors duration-100"
            title="Refresh items inventory status"
          >
            <RefreshCw className="h-3 w-3" />
            SYNC CATALOG
          </button>
          <a
            href="/"
            className="flex items-center gap-1.5 border border-[#111111] px-3 py-1 bg-[#111111] text-white font-mono text-[10px] font-bold uppercase hover:bg-white hover:text-[#111111] transition-all duration-150 shadow-[2px_2px_0px_rgba(17,17,17,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <ArrowLeft className="h-3 w-3" />
            BACK TO TRADING ROOM
          </a>
        </div>
      </header>

      {/* SEARCH AND TABULAR SELECTION SYSTEM */}
      <section className="bg-white border-b border-[#111111] shrink-0 p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search Bar - Monospaced / Flat */}
        <div className="relative flex-1 max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH BRAND INDEX (E.G. PUMP, VALVE, INCONEL, B2B-CODE)..."
            className="w-full pl-9 pr-4 py-2 border border-[#111111] bg-[#fafafa] font-mono text-xs uppercase tracking-wide placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all duration-100"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center font-mono text-[10px] font-bold hover:text-red-600 uppercase"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Sort Trigger */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-gray-500" />
          <span className="font-mono text-[10px] font-bold uppercase text-gray-500">SORT BY:</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="border border-[#111111] px-2 py-1 bg-white font-mono text-[10px] font-bold uppercase focus:outline-none focus:bg-[#fafafa]"
          >
            <option value="name_asc">NAME: A - Z</option>
            <option value="code_asc">CODE: A - Z</option>
            <option value="price_asc">PRICE: LOW TO HIGH</option>
            <option value="price_desc">PRICE: HIGH TO LOW</option>
          </select>
        </div>
      </section>

      {/* SEGMENTED TAB CLASSIFICATION */}
      <section className="bg-white border-b border-[#111111] shrink-0 px-4 py-2 overflow-x-auto flex gap-1.5 scrollbar-thin">
        {categories.map((cat) => {
          const count = cat === "ALL" 
            ? items.length 
            : items.filter((i) => i.category === cat).length;
          const isSelected = selectedCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                // Select first item of newly selected category if exists
                const catItems = items.filter((i) => cat === "ALL" || i.category === cat);
                if (catItems.length > 0) {
                  setSelectedItem(catItems[0]);
                }
              }}
              className={`shrink-0 px-3 py-1 font-mono text-[10px] font-bold uppercase border transition-all duration-100 ${
                isSelected
                  ? "bg-[#111111] text-white border-[#111111]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#111111] hover:text-black"
              }`}
            >
              {cat === "ALL" ? "ALL HARDWARE" : cat} ({count})
            </button>
          );
        })}
      </section>

      {/* CORE SPLIT WORKSPACE */}
      <div className="flex-1 flex overflow-hidden w-full">
        
        {/* LEFT COMPONENT CATALOG GRID */}
        <main className="flex-1 overflow-y-auto p-4 bg-[#f5f5f5] min-w-0">
          {loading ? (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin h-8 w-8 border-2 border-t-transparent border-[#111111]"></div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-gray-500">
                LOADING MULTI-CATEGORY PROCUREMENT INDEX...
              </span>
            </div>
          ) : error ? (
            <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
              <div className="border border-[#111111] p-6 bg-white max-w-md shadow-[4px_4px_0px_rgba(17,17,17,1)]">
                <BadgeAlert className="h-8 w-8 text-red-600 mx-auto mb-3" />
                <h3 className="font-mono text-sm font-bold uppercase text-[#111111] mb-1">
                  CONNECTION FAILURE
                </h3>
                <p className="text-xs text-gray-600 font-mono uppercase mb-4">
                  {error}
                </p>
                <button
                  onClick={fetchInventory}
                  className="border border-[#111111] px-4 py-1.5 bg-[#111111] text-white font-mono text-xs font-bold uppercase hover:bg-white hover:text-[#111111] transition-colors"
                >
                  RETRY PROTOCOL
                </button>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
              <div className="border border-gray-300 p-6 bg-white max-w-sm">
                <Info className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <h3 className="font-mono text-xs font-bold uppercase text-gray-600 mb-1">
                  NO HARDWARE MATCHES
                </h3>
                <p className="text-[10px] text-gray-500 font-mono uppercase">
                  Adjust your search terms or select another category above.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-12">
              {filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`bg-white border cursor-pointer group flex flex-col transition-all duration-150 ${
                      isSelected
                        ? "border-2 border-[#111111] shadow-[4px_4px_0px_rgba(17,17,17,1)] -translate-x-[2px] -translate-y-[2px]"
                        : "border-[#e5e7eb] hover:border-[#111111] hover:shadow-[3px_3px_0px_rgba(17,17,17,0.4)]"
                    }`}
                  >
                    {/* Image Area - Solid White */}
                    <div className="aspect-square w-full bg-white relative overflow-hidden border-b border-gray-100 flex items-center justify-center p-4">
                      {/* Sub-label Code Overlay */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className="bg-[#111111] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-widest">
                          {item.b2b_code}
                        </span>
                      </div>
                      
                      {/* Generated Premium Image */}
                      <img
                        src={item.image_path}
                        alt={item.item_name}
                        className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                        onError={(e: any) => {
                          e.target.onerror = null;
                          e.target.src = "/inventory/placeholder.jpg";
                        }}
                      />
                    </div>

                    {/* Metadata text */}
                    <div className="p-3 flex-1 flex flex-col justify-between bg-white">
                      <div>
                        {/* Hardware Category */}
                        <div className="font-mono text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1 truncate">
                          {item.category}
                        </div>
                        {/* Name */}
                        <h4 className="font-sans text-xs font-bold text-[#111111] line-clamp-2 leading-snug group-hover:text-black mb-1.5">
                          {item.item_name}
                        </h4>
                        {/* Specs Strip */}
                        <p className="font-mono text-[10px] text-gray-500 line-clamp-2 leading-relaxed h-8 border-t border-dotted border-gray-100 pt-1.5">
                          {item.technical_specs}
                        </p>
                      </div>

                      {/* Procurement Tier price indicator */}
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="font-mono text-[9px] text-gray-400 font-bold uppercase">
                          PROCUREMENT RANGE:
                        </span>
                        <span className="font-mono text-[11px] font-bold text-[#111111]">
                          {formatEuro(item.min_price)} - {formatEuro(item.max_price)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* RIGHT SIDE-DRAWER DETAIL INSPECTOR */}
        <aside className="w-96 border-l border-[#111111] bg-white flex flex-col shrink-0 overflow-y-auto">
          {selectedItem ? (
            <div className="p-5 flex flex-col space-y-6">
              
              {/* Drawer Header branding */}
              <div className="border-b border-[#111111] pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold uppercase bg-amber-500 text-[#111111] px-1.5 py-0.5 tracking-wider">
                    SPECIFICATION INSPECT v1.0
                  </span>
                  <span className="font-mono text-[9px] font-bold text-gray-400">
                    B2B LEDGER COVENANT
                  </span>
                </div>
                <h3 className="font-sans text-base font-extrabold text-[#111111] uppercase tracking-tight mt-1 leading-snug">
                  {selectedItem.item_name}
                </h3>
                <div className="font-mono text-[11px] font-bold text-gray-500 mt-0.5">
                  B2B-CODE: <span className="text-[#111111] font-extrabold">{selectedItem.b2b_code}</span>
                </div>
              </div>

              {/* High-Resolution Photo Container */}
              <div className="aspect-square w-full bg-white border border-[#111111] flex items-center justify-center p-6 relative overflow-hidden group">
                <img
                  src={selectedItem.image_path}
                  alt={selectedItem.item_name}
                  className="max-h-full max-w-full object-contain mix-blend-multiply transition-all duration-300 group-hover:scale-105"
                  onError={(e: any) => {
                    e.target.onerror = null;
                    e.target.src = "/inventory/placeholder.jpg";
                  }}
                />
                
                {/* Visual Seal Overlay */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white border border-[#111111] px-2 py-0.5 font-mono text-[8px] font-bold text-[#111111]">
                  <ShieldCheck className="h-3 w-3 text-[#111111]" />
                  STABLE-FAL GENERATED
                </div>
              </div>

              {/* Hardware Categorization */}
              <div className="space-y-1 bg-[#fafafa] border border-[#111111] p-3 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-gray-500 uppercase">LEDGER CATEGORY:</span>
                  <span className="font-bold text-right uppercase max-w-[200px] truncate">{selectedItem.category}</span>
                </div>
                <div className="flex justify-between border-t border-dotted border-gray-200 pt-1.5 mt-1.5">
                  <span className="text-gray-500 uppercase">RELIABILITY INDEX:</span>
                  <span className="font-bold text-emerald-600">CLASS-A PREFERRED</span>
                </div>
                <div className="flex justify-between border-t border-dotted border-gray-200 pt-1.5 mt-1.5">
                  <span className="text-gray-500 uppercase">ESCROW REGULATION:</span>
                  <span className="font-bold">ACTIVE-SETTLEMENT (M1)</span>
                </div>
              </div>

              {/* Technical Specifications Breakdown */}
              <div className="space-y-2">
                <h4 className="font-mono text-xs font-bold uppercase text-gray-500 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-[#111111]" />
                  TECHNICAL PARAMETERS:
                </h4>
                
                <div className="border border-[#111111] bg-white text-xs divide-y divide-gray-100 font-mono">
                  {selectedItem.technical_specs.split(",").map((spec, index) => {
                    const parts = spec.split(":");
                    const hasKey = parts.length > 1;
                    const key = hasKey ? parts[0].trim() : `SPEC_${index + 1}`;
                    const value = hasKey ? parts.slice(1).join(":").trim() : parts[0].trim();

                    return (
                      <div key={index} className="p-2.5 flex items-stretch">
                        <div className="w-1/2 font-bold uppercase text-gray-500 pr-2 border-r border-dotted border-gray-200">
                          {key}
                        </div>
                        <div className="w-1/2 text-[#111111] pl-2 font-bold uppercase">
                          {value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Typical procurement tiers */}
              <div className="space-y-1 bg-white border border-[#111111] p-3.5 font-mono text-xs">
                <div className="flex justify-between text-gray-500 font-bold uppercase text-[9px] tracking-wider">
                  <span>PROCUREMENT TIER LIMITS:</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-[#111111] font-bold">MIN POINT:</span>
                  <span className="text-base font-extrabold text-gray-800">{formatEuro(selectedItem.min_price)}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-dotted border-gray-200 pt-1.5 mt-1.5">
                  <span className="text-[#111111] font-bold">MAX CEILING:</span>
                  <span className="text-base font-extrabold text-gray-800">{formatEuro(selectedItem.max_price)}</span>
                </div>
              </div>

              {/* INTEGRATED LIVE TRADING INITIATION */}
              <div className="border-t-2 border-dashed border-[#111111] pt-5 space-y-4">
                
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase text-gray-500 block">
                    1. ADJUST BUYER BUDGET (EUR):
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center font-mono text-xs font-bold text-gray-400">
                        EUR
                      </span>
                      <input
                        type="number"
                        value={customBudget}
                        onChange={(e) => setCustomBudget(parseInt(e.target.value) || 0)}
                        className="w-full pl-10 pr-3 py-1.5 border border-[#111111] font-mono text-xs font-extrabold focus:outline-none focus:bg-[#fafafa]"
                      />
                    </div>
                    {/* Preset buttons */}
                    <button
                      onClick={() => setCustomBudget(selectedItem.max_price)}
                      className="border border-[#111111] px-2 py-1 text-[9px] font-mono font-bold hover:bg-gray-100"
                      title="Set budget to item max price"
                    >
                      MAX
                    </button>
                    <button
                      onClick={() => setCustomBudget(Math.round(selectedItem.max_price * 1.25))}
                      className="border border-[#111111] px-2 py-1 text-[9px] font-mono font-bold hover:bg-gray-100"
                      title="Set budget to 125% of max price"
                    >
                      FAST
                    </button>
                  </div>
                  <span className="text-[9px] font-mono text-gray-400 uppercase leading-relaxed block mt-1">
                    * BUDGET DETERMINES YOUR STRATEGIC CEILING IN AUTOMATED AGENT ROUNDS.
                  </span>
                </div>

                {/* Initiate CTA */}
                {dealSuccess ? (
                  <div className="bg-emerald-50 border border-emerald-500 p-3 flex items-center gap-2.5 text-emerald-800 font-mono text-xs font-bold uppercase">
                    <div className="h-4 w-4 bg-emerald-500 rounded-full flex items-center justify-center text-white font-sans text-[10px]">
                      ✓
                    </div>
                    <span>ROOM SPARKED! LAUNCHING CONTRACT ROOM...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleCreateDeal}
                    disabled={creatingDeal || customBudget <= 0}
                    className="w-full border border-[#111111] py-3 bg-[#111111] text-white font-mono text-xs font-bold uppercase hover:bg-white hover:text-[#111111] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2 shadow-[4px_4px_0px_rgba(17,17,17,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <Plus className="h-4 w-4" />
                    {creatingDeal ? "SPARKING CONTRACT..." : "LAUNCH LIVE AGENTIC ESCROW"}
                  </button>
                )}
                
              </div>

            </div>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center text-gray-400">
              <Info className="h-8 w-8 mb-2 text-gray-300" />
              <p className="font-mono text-xs font-bold uppercase">
                NO HARDWARE SELECTED
              </p>
              <p className="font-mono text-[10px] text-gray-400 uppercase mt-1">
                Click any catalog item on the left to inspect technical parameters and spark contracts.
              </p>
            </div>
          )}
        </aside>

      </div>

    </div>
  );
}
