"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
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
  BarChart3,
  Send,
  Sparkles,
  ShoppingBag,
  Tag,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Maximize2,
  Minimize2,
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  Paperclip,
  Download,
  MoreVertical,
  Archive,
  Trash2,
  BrainCircuit
} from "lucide-react";


const parseInlineMarkdown = (text: string) => {
  let parts: React.ReactNode[] = [text];
  let keyCounter = 0;
  
  // Parse **bold**
  parts = parts.flatMap((part) => {
    if (typeof part !== "string") return part;
    const pieces = part.split(/\*\*([^*]+)\*\*/g);
    return pieces.map((piece, i) => (i % 2 === 1 ? <strong key={`b-${keyCounter++}`} className="font-bold text-[#111111]">{piece}</strong> : piece));
  });

  // Parse *italic*
  parts = parts.flatMap((part) => {
    if (typeof part !== "string") return part;
    const pieces = part.split(/\*([^*]+)\*/g);
    return pieces.map((piece, i) => (i % 2 === 1 ? <em key={`it-${keyCounter++}`} className="italic text-gray-800">{piece}</em> : piece));
  });

  // Parse __underline__
  parts = parts.flatMap((part) => {
    if (typeof part !== "string") return part;
    const pieces = part.split(/__([^_]+)__/g);
    return pieces.map((piece, i) => (i % 2 === 1 ? <span key={`u2-${keyCounter++}`} className="underline decoration-[#111111] underline-offset-2">{piece}</span> : piece));
  });

  // Parse _italic_
  parts = parts.flatMap((part) => {
    if (typeof part !== "string") return part;
    const pieces = part.split(/_([^_]+)_/g);
    return pieces.map((piece, i) => (i % 2 === 1 ? <em key={`u1-${keyCounter++}`} className="italic text-gray-800">{piece}</em> : piece));
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
  negotiation_style: string;
  is_archived: boolean;
  confidence_score?: number;
}

const renderFormattedText = (text: string) => {
  if (!text) return null;

  let parts: React.ReactNode[] = [text];
  let keyCounter = 0;

  // 1. Parse highlight: ==highlight==
  parts = parts.flatMap((part) => {
    if (typeof part !== "string") return part;
    const pieces = part.split(/==([^=]+)==/g);
    return pieces.map((piece, i) =>
      i % 2 === 1 ? (
        <mark
          key={`hl-${keyCounter++}`}
          className="bg-yellow-200 text-black px-1 font-bold border-b border-yellow-500 rounded-none inline-block leading-none"
        >
          {piece}
        </mark>
      ) : (
        piece
      )
    );
  });

  // 2. Parse bold: **bold**
  parts = parts.flatMap((part) => {
    if (typeof part !== "string") return part;
    const pieces = part.split(/\*\*([^*]+)\*\*/g);
    return pieces.map((piece, i) =>
      i % 2 === 1 ? (
        <strong key={`b-${keyCounter++}`} className="font-bold text-[#111111]">
          {piece}
        </strong>
      ) : (
        piece
      )
    );
  });

  // 3. Parse strikethrough: ~~strikethrough~~
  parts = parts.flatMap((part) => {
    if (typeof part !== "string") return part;
    const pieces = part.split(/~~([^~]+)~~/g);
    return pieces.map((piece, i) =>
      i % 2 === 1 ? (
        <span key={`st-${keyCounter++}`} className="line-through opacity-60">
          {piece}
        </span>
      ) : (
        piece
      )
    );
  });

  // 4. Parse double underscore: __underline__
  parts = parts.flatMap((part) => {
    if (typeof part !== "string") return part;
    const pieces = part.split(/__([^_]+)__/g);
    return pieces.map((piece, i) =>
      i % 2 === 1 ? (
        <span key={`u2-${keyCounter++}`} className="underline decoration-[#111111] underline-offset-2 font-semibold">
          {piece}
        </span>
      ) : (
        piece
      )
    );
  });

  // 5. Parse single underscore: _underline_
  parts = parts.flatMap((part) => {
    if (typeof part !== "string") return part;
    const pieces = part.split(/_([^_]+)_/g);
    return pieces.map((piece, i) =>
      i % 2 === 1 ? (
        <span key={`u1-${keyCounter++}`} className="underline decoration-[#111111] underline-offset-2">
          {piece}
        </span>
      ) : (
        piece
      )
    );
  });

  return <>{parts}</>;
};

const isWaitingForHuman = (d: Deal) => {
  if (d.status !== "ACTIVE" || d.is_archived) return false;
  const hasHuman = (d.participants || []).some(p => p.name.includes("(You)"));
  if (!hasHuman) return false;

  // If confidence score is high (>= 0.8), we do NOT wait for a human.
  // The AI will automatically negotiate on behalf of the human operator!
  if (d.confidence_score !== undefined && d.confidence_score !== null && d.confidence_score >= 0.8) {
    return false;
  }

  const messages = d.messages || [];
  if (messages.length === 0) return false;

  const lastMsg = messages[messages.length - 1];
  
  if (d.perspective === "BUYER") {
    return lastMsg.role === "SELLER";
  } else if (d.perspective === "SELLER") {
    return lastMsg.role === "BUYER";
  }
  return false;
};

function HomeContent() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [newLotName, setNewLotName] = useState("");
  const [newBudget, setNewBudget] = useState(1200);
  const [newPerspective, setNewPerspective] = useState("BUYER");
  const [operatorMsg, setOperatorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [stepping, setStepping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLotForm, setShowLotForm] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<"BUYER" | "SELLER" | null>("BUYER");
  const [showArchivedBuyer, setShowArchivedBuyer] = useState(false);
  const [showArchivedSeller, setShowArchivedSeller] = useState(false);
  const [openMenuDealId, setOpenMenuDealId] = useState<string | null>(null);
  const [confirmDeleteDealId, setConfirmDeleteDealId] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuDealId) return;
    const handleOutsideClick = () => {
      setOpenMenuDealId(null);
      setConfirmDeleteDealId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [openMenuDealId]);
  const [rfqText, setRfqText] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parseStep, setParseStep] = useState("");
  const [isIngestionExpanded, setIsIngestionExpanded] = useState(true);
  const [isIngestionFullView, setIsIngestionFullView] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevActiveDealIdRef = useRef<string | null>(null);
  const prevMessageCountRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);

  const [typingDeals, setTypingDeals] = useState<Record<string, boolean>>({});
  const [isStrategicBoardOpen, setIsStrategicBoardOpen] = useState(true);
  const backgroundTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const backgroundProcessingRef = useRef<Record<string, boolean>>({});

  // Real-time telemetry monitoring states
  const [pioneerStream, setPioneerStream] = useState<any[]>([]);
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(false);

  // Close overlay modals on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSpecsExpanded(false);
        setIsIngestionFullView(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeDeal = deals.find(d => d.id === activeDealId) || null;

  // Strategic board calculations & presets
  const humanPart = activeDeal?.participants?.find(p => p.name.includes("(You)"));
  const aiPart = activeDeal?.participants?.find(p => !p.name.includes("(You)"));

  const humanPrice = humanPart?.current_price_point || 0;
  const aiPrice = aiPart?.current_price_point || 0;
  const isBuyerStance = activeDeal?.perspective === "BUYER";
  const hasHumanParticipant = !!humanPart;

  // Calculates math values
  const compromisePrice = Math.round((humanPrice + aiPrice) / 2) || 0;
  
  // Concession (Buyer steps up, Seller steps down by ~30% of spread)
  const concessionPrice = isBuyerStance 
    ? Math.round(humanPrice + (aiPrice - humanPrice) * 0.3)
    : Math.round(humanPrice - (humanPrice - aiPrice) * 0.3);

  // Extreme concession request
  const extremePrice = isBuyerStance
    ? Math.max(humanPrice, Math.round(aiPrice * 0.95))
    : Math.min(humanPrice, Math.round(aiPrice * 1.05));

  // SLA Premium Offer (Paying closer to counterpart ask, but demanding high SLA)
  const premiumSlaPrice = isBuyerStance
    ? Math.round(aiPrice * 0.98)
    : Math.round(aiPrice * 1.02);

  // Structured presets
  const agreePreset = isBuyerStance ? {
    label: `SETTLE @ ${aiPrice} EUR`,
    text: `We accept your latest offer of ${aiPrice} EUR under the proposed terms.`,
    tooltip: `Accepts the counterpart's latest pricing proposal of ${aiPrice} EUR.`
  } : {
    label: `SETTLE @ ${aiPrice} EUR`,
    text: `We accept your latest proposal of ${aiPrice} EUR under the proposed terms.`,
    tooltip: `Accepts the counterpart's latest pricing proposal of ${aiPrice} EUR.`
  };

  const standFirmPreset = {
    label: `STAND FIRM @ ${humanPrice} EUR`,
    text: `Our current proposal of ${humanPrice} EUR is fully justified by our strict parameters. We stand firm on our position.`,
    tooltip: `Declares that you will not concede your current position.`
  };

  const concessionPreset = {
    label: `CONCEDE TO ${concessionPrice} EUR`,
    text: `We can make a minor concession and adjust our pricing offer to ${concessionPrice} EUR under standard warranty and payment terms.`,
    tooltip: `Offers a minor price adjustment to move closer to agreement.`
  };

  const extremePreset = isBuyerStance ? {
    label: `DEMAND ${extremePrice} EUR`,
    text: `To make this deal viable, we request that you adjust your price offer to ${extremePrice} EUR to align with typical market benchmarks.`,
    tooltip: `Demands a substantial price reduction from the counterpart.`
  } : {
    label: `DEMAND ${extremePrice} EUR`,
    text: `We request that you raise your bid to ${extremePrice} EUR to better align with high-performance hardware specs.`,
    tooltip: `Demands a substantial price increase from the counterpart.`
  };

  const tcoCompromisePreset = isBuyerStance ? {
    label: `COMPROMISE @ ${compromisePrice} EUR (TCO)`,
    text: `[Offer: ${compromisePrice} EUR | 3Yr Warranty | Net 60 | SLA: 99.5%] We can meet at a midpoint compromise of ${compromisePrice} EUR if we trade for an extended 3-year warranty and deferred Net 60 terms.`,
    tooltip: `Trades a higher price in exchange for warranty and payment term expansions.`
  } : {
    label: `COMPROMISE @ ${compromisePrice} EUR (TCO)`,
    text: `[Offer: ${compromisePrice} EUR | 3Yr Warranty | Net 45 | SLA: 99.0%] We can compromise at a midpoint price of ${compromisePrice} EUR if we offer an extended 3-year warranty under a standard Net 45 payment window.`,
    tooltip: `Lowers your price in exchange for extended warranty and accelerated payment terms.`
  };

  const slaPremiumPreset = isBuyerStance ? {
    label: `SLA PREMIUM @ ${premiumSlaPrice} EUR`,
    text: `[Offer: ${premiumSlaPrice} EUR | 1Yr Warranty | Net 30 | SLA: 99.9%] We are willing to authorize a premium price of ${premiumSlaPrice} EUR, strictly conditional on a guaranteed 99.9% uptime SLA commitment.`,
    tooltip: `Offers a high price, strictly conditional on a strict 99.9% SLA guarantee.`
  } : {
    label: `SLA PREMIUM @ ${premiumSlaPrice} EUR`,
    text: `[Offer: ${premiumSlaPrice} EUR | 2Yr Warranty | Net 30 | SLA: 99.9%] We can authorize ${premiumSlaPrice} EUR with a premium 99.9% uptime SLA commitment.`,
    tooltip: `Offers a high-value proposal with premium uptime guarantees.`
  };

  const isHaltedOrFinished = activeDeal?.status === "TERMINATED" || activeDeal?.status === "MATCHED";

  const handleDownloadPDF = () => {
    if (!activeDeal) return;

    // Create a hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.zIndex = "-1000";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const convertMarkdownToHtml = (text: string) => {
      if (!text) return "";
      
      const parseInline = (str: string) => {
        let html = str;
        html = html
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
          
        // ==highlight==
        html = html.replace(/==([^=]+)==/g, "<mark style='background-color: #fef08a; border-bottom: 2px solid #eab308; font-weight: bold; color: #000; padding: 0 4px;'>$1</mark>");
        // **bold**
        html = html.replace(/\*\*([^*]+)\*\*/g, "<strong style='font-weight: bold; color: #111;'>$1</strong>");
        // __underline__
        html = html.replace(/__([^_]+)__/g, "<u style='text-decoration: underline; text-underline-offset: 2px;'>$1</u>");
        // *italic*
        html = html.replace(/\*([^*]+)\*/g, "<em style='font-style: italic; color: #374151;'>$1</em>");
        // _italic_
        html = html.replace(/_([^_]+)_/g, "<em style='font-style: italic; color: #374151;'>$1</em>");
        // ~~strikethrough~~
        html = html.replace(/~~([^~]+)~~/g, "<del style='text-decoration: line-through; color: #9ca3af;'>$1</del>");
        
        return html;
      };

      const lines = text.split("\n");
      let result = "";
      
      lines.forEach((line) => {
        let trimmed = line.trim();
        if (!trimmed) {
          result += "<br/>";
          return;
        }
        
        // Horizontal Rule
        if (trimmed.startsWith("===") || trimmed.startsWith("---")) {
          result += "<hr style='border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;' />";
          return;
        }
        
        // Headings
        if (trimmed.startsWith("# ")) {
          result += `<h1 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #111111; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #111111; padding-bottom: 4px; font-family: monospace;">${parseInline(trimmed.slice(2))}</h1>`;
          return;
        }
        if (trimmed.startsWith("## ")) {
          result += `<h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #111111; margin-top: 20px; margin-bottom: 8px; border-left: 3px solid #111111; padding-left: 8px; font-family: monospace;">${parseInline(trimmed.slice(3))}</h2>`;
          return;
        }
        if (trimmed.startsWith("### ")) {
          result += `<h3 style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #4b5563; margin-top: 16px; margin-bottom: 4px; letter-spacing: 0.05em; font-family: monospace;">${parseInline(trimmed.slice(4))}</h3>`;
          return;
        }
        
        // Bullet Points
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          result += `<div style="display: flex; align-items: start; margin-left: 8px; margin-top: 4px; margin-bottom: 4px; font-family: monospace;">
            <span style="font-weight: bold; color: #6b7280; margin-right: 6px;">•</span>
            <span style="font-size: 10px; color: #374151; line-height: 1.5; font-family: monospace;">${parseInline(trimmed.slice(2))}</span>
          </div>`;
          return;
        }
        
        // Default line
        result += `<p style="font-size: 10px; line-height: 1.5; color: #374151; margin-top: 4px; margin-bottom: 4px; font-family: monospace;">${parseInline(line)}</p>`;
      });
      
      return result;
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>LOT SPECIFICATIONS - ${activeDeal.item_name}</title>
        <style>
          @media print {
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #111111;
            }
            @page {
              size: letter portrait;
              margin: 20mm 15mm;
            }
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            color: #111111;
            line-height: 1.5;
            font-size: 11px;
            background: #ffffff;
            padding: 0;
            margin: 0;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header-title {
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
            padding-bottom: 5px;
            border-bottom: 4px solid #111111;
          }
          .header-subtitle {
            font-size: 10px;
            font-weight: bold;
            color: #666666;
            margin-top: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .meta-box {
            border: 1px solid #111111;
            padding: 12px;
            margin-top: 20px;
            margin-bottom: 25px;
            background-color: #ffffff;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px 20px;
          }
          .meta-item {
            font-size: 10px;
          }
          .meta-label {
            font-weight: bold;
            color: #555555;
            text-transform: uppercase;
            display: inline-block;
            width: 140px;
          }
          .meta-value {
            font-weight: bold;
            color: #111111;
          }
          .specs-title {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: 1px;
            border-bottom: 1px double #111111;
            padding-bottom: 3px;
          }
          .content {
            margin-top: 15px;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #111111;
            padding-top: 10px;
            font-size: 8px;
            color: #777777;
            text-transform: uppercase;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
          }
          .stamp-box {
            border: 2px dashed #111111;
            padding: 10px;
            margin-top: 30px;
            text-align: center;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
            font-size: 9px;
            background: #fbfbfb;
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div>
            <div class="header-title">ATIRAA PROCUREMENT COVENANT SPECIFICATION</div>
            <div class="header-subtitle">Official Transaction Room Asset Dossier & Protocol Record</div>
          </div>
          
          <div class="meta-box">
            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">TRANSACTION UUID:</span>
                <span class="meta-value">${activeDeal.id.toUpperCase()}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">TIMESTAMP:</span>
                <span class="meta-value">${new Date().toLocaleString("en-US", { timeZoneName: "short" })}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">ASSET CODE:</span>
                <span class="meta-value">${activeDeal.item_name}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">STATUS KEY:</span>
                <span class="meta-value">${activeDeal.status}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">STANCE / PERSPECTIVE:</span>
                <span class="meta-value">${activeDeal.perspective === "BUYER" ? "BUYER PERSPECTIVE" : "SELLER PERSPECTIVE"}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">SECURITY CLEARANCE:</span>
                <span class="meta-value">LEVEL 4 ROOT ESCROW OPERATOR</span>
              </div>
            </div>
          </div>
          
          <div class="specs-title">INJECTED LOT CONTRACT SPECIFICATIONS REPORT</div>
          <div class="content">
            ${convertMarkdownToHtml(activeDeal.technical_specs)}
          </div>
          
          <div class="stamp-box">
            ESCROW STATUS SECURED // VERIFIED BY ATIRAA PROCUREMENT INDEX PROTOCOL v1.0 // NO REFUNDS OR RETRACTIONS ALLOWED AFTER BID/ASK MATCHING
          </div>
          
          <div class="footer">
            <span>SYSTEM REFERENCE: ${activeDeal.id.slice(0, 16).toUpperCase()}</span>
            <span>ATIRAA INTELLECTUAL PROPERTY &copy; ${new Date().getFullYear()}</span>
          </div>
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Give style elements a moment to register/load
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      // Remove iframe from DOM after the print dialog closes (or standard timeout)
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  // Fetch all deals from backend API
  const fetchDeals = async (selectFirst = false) => {
    try {
      const res = await fetch("https://fat285w9p3.execute-api.eu-central-1.amazonaws.com/prod/api/deals");
      if (!res.ok) throw new Error("Backend connection offline.");
      const data = await res.json();
      setDeals(data);
      if (data.length > 0) {
        if (selectFirst || !activeDealId) {
          const activeOnly = data.filter((d: Deal) => !d.is_archived);
          if (activeOnly.length > 0) {
            setActiveDealId(activeOnly[0].id);
          } else {
            setActiveDealId(data[0].id);
          }
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
      const res = await fetch("https://fat285w9p3.execute-api.eu-central-1.amazonaws.com/prod/api/observability/pioneer-stream");
      if (res.ok) {
        const data = await res.json();
        setPioneerStream(data);
      }
    } catch (err) {
      console.error("Error fetching pioneer stream:", err);
    }
  };

  // Update active deal sourcing style
  const handleUpdateStyle = async (style: string) => {
    if (!activeDealId || !activeDeal) return;
    if (activeDeal.status !== "ACTIVE") {
      console.warn("Negotiation style can only be updated for active rooms.");
      return;
    }
    try {
      const res = await fetch("https://fat285w9p3.execute-api.eu-central-1.amazonaws.com/prod/api/deals/update-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_id: activeDealId,
          negotiation_style: style,
        }),
      });
      if (res.ok) {
        await fetchDeals();
      } else {
        console.error("Failed to update style:", await res.text());
      }
    } catch (e) {
      console.error("Error updating style:", e);
    }
  };

  // Archive/Unarchive a deal environment
  const handleArchiveDeal = async (dealId: string, archive: boolean) => {
    try {
      const res = await fetch(`https://fat285w9p3.execute-api.eu-central-1.amazonaws.com/prod/api/deals/${dealId}/archive?is_archived=${archive}`, {
        method: "PUT",
      });
      if (res.ok) {
        // If the archived deal was currently active, shift focus to another active deal
        if (archive && activeDealId === dealId) {
          const remainingDeals = deals.filter(d => d.id !== dealId && !d.is_archived);
          if (remainingDeals.length > 0) {
            setActiveDealId(remainingDeals[0].id);
          } else {
            setActiveDealId(null);
          }
        }
        await fetchDeals();
      } else {
        console.error("Failed to archive deal:", await res.text());
      }
    } catch (e) {
      console.error("Error archiving deal:", e);
    }
  };

  // Permanently delete a deal environment
  const handleDeleteDeal = async (dealId: string) => {
    try {
      const res = await fetch(`https://fat285w9p3.execute-api.eu-central-1.amazonaws.com/prod/api/deals/${dealId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // If the deleted deal was currently active, shift focus to another active deal
        if (activeDealId === dealId) {
          const remainingDeals = deals.filter(d => d.id !== dealId && !d.is_archived);
          if (remainingDeals.length > 0) {
            setActiveDealId(remainingDeals[0].id);
          } else {
            setActiveDealId(null);
          }
        }
        await fetchDeals();
      } else {
        console.error("Failed to delete deal:", await res.text());
      }
    } catch (e) {
      console.error("Error deleting deal:", e);
    }
  };



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

  // Automated continuous negotiation loop with simulated typing delay
  useEffect(() => {
    if (!activeDealId || !activeDeal) {
      setIsTyping(false);
      isProcessingRef.current = false;
      return;
    }

    if (activeDeal.status !== "ACTIVE" || isProcessingRef.current || stepping) {
      return;
    }

    const messages = activeDeal.messages;
    if (!messages || messages.length === 0) {
      return;
    }

    const lastMsg = messages[messages.length - 1];
    const perspective = activeDeal.perspective;
    const hasHuman = (activeDeal.participants || []).some(p => p.name.includes("(You)"));

    // AI agent should respond if the deal is active and we are NOT waiting for a human intervention.
    const shouldAiRespond = !isWaitingForHuman(activeDeal);

    if (shouldAiRespond) {
      isProcessingRef.current = true;
      setIsTyping(true);
      // Use a slightly faster typing delay for automated simulation or high confidence (1.5 to 4s) vs human (1 to 10s)
      const isAutoNegotiating = !hasHuman || (activeDeal.confidence_score !== undefined && activeDeal.confidence_score !== null && activeDeal.confidence_score >= 0.8);
      const delay = isAutoNegotiating 
        ? Math.floor(Math.random() * 2500) + 1500 
        : Math.floor(Math.random() * 9000) + 1000;

      const timer = setTimeout(async () => {
        try {
          if (activeDealId) {
            setStepping(true);
            const res = await fetch("https://fat285w9p3.execute-api.eu-central-1.amazonaws.com/prod/api/negotiate/step", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ deal_id: activeDealId })
            });
            await fetchDeals();
          }
        } catch (e) {
          console.error("Error in continuous negotiation loop step:", e);
        } finally {
          setStepping(false);
          setIsTyping(false);
          isProcessingRef.current = false;
        }
      }, delay);

      return () => {
        clearTimeout(timer);
        isProcessingRef.current = false;
        setIsTyping(false);
      };
    }
  }, [activeDealId, activeDeal?.status, activeDeal?.messages?.length, activeDeal?.perspective, activeDeal?.participants, stepping]);

  // Component unmount cleanup for background timers
  useEffect(() => {
    return () => {
      Object.values(backgroundTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  // Background continuous negotiation loops for unselected channels
  useEffect(() => {
    // 1. Clean up timers for any deal that is now the active deal, or is archived/not active
    const unselectedActiveDealIds = new Set(
      deals
        .filter(d => d.id !== activeDealId && d.status === "ACTIVE" && !d.is_archived)
        .map(d => d.id)
    );

    // Cancel timers for deals that are no longer unselected active deals
    Object.keys(backgroundTimersRef.current).forEach((id) => {
      if (!unselectedActiveDealIds.has(id)) {
        clearTimeout(backgroundTimersRef.current[id]);
        delete backgroundTimersRef.current[id];
        delete backgroundProcessingRef.current[id];
        setTypingDeals(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      }
    });

    // 2. Start timers for any unselected active deals that need a response and don't have a timer yet
    deals.forEach((d) => {
      if (d.id === activeDealId || d.status !== "ACTIVE" || d.is_archived) {
        return;
      }

      // Check if a timer or process is already active for this deal
      if (backgroundTimersRef.current[d.id] || backgroundProcessingRef.current[d.id]) {
        return;
      }

      const messages = d.messages || [];
      if (messages.length === 0) return;

      const lastMsg = messages[messages.length - 1];
      const hasHuman = (d.participants || []).some(p => p.name.includes("(You)"));

      // AI agent should respond if the deal is active and we are NOT waiting for a human intervention.
      const shouldAiRespond = !isWaitingForHuman(d);

      if (shouldAiRespond) {
        // Mark as processing and set typing indicator
        backgroundProcessingRef.current[d.id] = true;
        setTypingDeals(prev => ({ ...prev, [d.id]: true }));

        const delay = Math.floor(Math.random() * 2500) + 2500; // Staggered 2.5s to 5s delay

        const timer = setTimeout(async () => {
          try {
            const res = await fetch("https://fat285w9p3.execute-api.eu-central-1.amazonaws.com/prod/api/negotiate/step", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ deal_id: d.id })
            });
            if (res.ok) {
              await fetchDeals();
            }
          } catch (e) {
            console.error("Error in background negotiation step:", d.id, e);
          } finally {
            // Clean up flags
            delete backgroundProcessingRef.current[d.id];
            delete backgroundTimersRef.current[d.id];
            setTypingDeals(prev => {
              const updated = { ...prev };
              delete updated[d.id];
              return updated;
            });
          }
        }, delay);

        backgroundTimersRef.current[d.id] = timer;
      }
    });
  }, [deals, activeDealId]);

  // Auto-scroll chat feed to the bottom ONLY on active deal change or actual new messages
  useEffect(() => {
    if (!activeDeal) return;

    const currentMessageCount = activeDeal?.messages?.length || 0;
    const dealChanged = activeDeal?.id !== prevActiveDealIdRef.current;
    const newMessageAdded = currentMessageCount > prevMessageCountRef.current;

    if (dealChanged || newMessageAdded || isTyping) {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
      prevActiveDealIdRef.current = activeDeal?.id || null;
      prevMessageCountRef.current = currentMessageCount;
    } else {
      prevMessageCountRef.current = currentMessageCount;
    }
  }, [activeDeal?.messages, activeDeal?.id, isTyping]);

  // Create a new B2B Lot (Deal Channel)
  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLotName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("https://fat285w9p3.execute-api.eu-central-1.amazonaws.com/prod/api/deals/create", {
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
    
    // Simulate real-time progress steps for beautiful console indicators
    setParseStep("SCANNING");
    await new Promise(r => setTimeout(r, 800));
    
    setParseStep("EXTRACTING");
    await new Promise(r => setTimeout(r, 1000));
    
    setParseStep("RESEARCH");
    await new Promise(r => setTimeout(r, 1000));
    
    setParseStep("SEEDING");
    
    try {
      const res = await fetch("https://fat285w9p3.execute-api.eu-central-1.amazonaws.com/prod/api/deals/ingest", {
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
        setParseStep("");
        await fetchDeals();
        setActiveDealId(data.deal_id);
        setActiveDrawer("BUYER");
        setIsIngestionFullView(false);
      } else {
        alert("Ingestion failed: " + (data.detail || "Unknown error"));
        setParseStep("");
      }
    } catch (err) {
      console.error("Error during unstructured RFQ ingestion:", err);
      alert("Error occurred during RFQ ingestion. Please check if the backend is running.");
      setParseStep("");
    } finally {
      setIngesting(false);
    }
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Ingest Document / Image File RFQ
  const handleIngestFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || ingesting) return;
    setIngesting(true);
    
    // Simulate real-time progress steps for beautiful console indicators
    setParseStep("SCANNING");
    await new Promise(r => setTimeout(r, 1000));
    
    setParseStep("EXTRACTING");
    await new Promise(r => setTimeout(r, 1200));
    
    setParseStep("RESEARCH");
    await new Promise(r => setTimeout(r, 1200));
    
    setParseStep("SEEDING");
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const res = await fetch("https://fat285w9p3.execute-api.eu-central-1.amazonaws.com/prod/api/deals/ingest-file", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) throw new Error("Failed to parse file or register deal.");
      
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setSelectedFile(null);
        setParseStep("");
        await fetchDeals();
        setActiveDealId(data.deal_id);
        setActiveDrawer("BUYER");
        setIsIngestionFullView(false);
      } else {
        alert("Ingestion failed: " + (data.detail || "Unknown error"));
        setParseStep("");
      }
    } catch (err: any) {
      console.error("Error during file ingestion:", err);
      alert("Error occurred during file ingestion: " + err.message);
      setParseStep("");
    } finally {
      setIngesting(false);
    }
  };


  // Unified submission handler for text and file ingestion
  const handleSubmitCombined = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      await handleIngestFile(e);
    } else {
      await handleIngestRFQ(e);
    }
  };


  // Step the multi-agent negotiation loop
  const handleStepExchange = async () => {
    if (!activeDealId || stepping) return;
    setStepping(true);
    try {
      const res = await fetch("https://fat285w9p3.execute-api.eu-central-1.amazonaws.com/prod/api/negotiate/step", {
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
      await fetch(("https://fat285w9p3.execute-api.eu-central-1.amazonaws.com/prod/api/negotiate/message"), {
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

  // Predefined Preset Message Dispatcher
  const handleSendPreset = async (msgText: string) => {
    if (!activeDealId || !msgText.trim()) return;
    try {
      await fetch("https://fat285w9p3.execute-api.eu-central-1.amazonaws.com/prod/api/negotiate/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_id: activeDealId,
          message_text: msgText
        })
      });
      await fetchDeals();
    } catch (e) {
      console.error("Error submitting predefined preset response:", e);
    }
  };

  // Calculate pricing matrices and spreads
  const getLiquidityLedger = () => {
    if (!activeDeal) return { bids: [], asks: [], spread: "N/A" };
    const buyers = (activeDeal?.participants || []).filter(p => p.role === "BUYER");
    const sellers = (activeDeal?.participants || []).filter(p => p.role === "SELLER");

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

  const deadlockedDeals = deals.filter(d => d.status === "DEADLOCK" && !d.is_archived);
  const awaitingHumanDeals = deals.filter(d => isWaitingForHuman(d));

  const buyerDeals = deals.filter(d => (d.perspective === "BUYER" || !d.perspective) && !d.is_archived);
  const sellerDeals = deals.filter(d => d.perspective === "SELLER" && !d.is_archived);
  const archivedBuyerDeals = deals.filter(d => (d.perspective === "BUYER" || !d.perspective) && d.is_archived);
  const archivedSellerDeals = deals.filter(d => d.perspective === "SELLER" && d.is_archived);

  const renderDealChannel = (d: Deal) => {
    const isActive = d.id === activeDealId;
    const formattedName = d.item_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const isDeadlocked = d.status === "DEADLOCK";
    const isAwaitingHuman = isWaitingForHuman(d);
    
    let borderStyles = "";
    if (isDeadlocked) {
      borderStyles = isActive 
        ? "border-[#E11D48] bg-[#FFF1F2] shadow-[2px_2px_0px_rgba(225,29,72,1)]" 
        : "border-[#FDA4AF] bg-white hover:border-[#E11D48] hover:shadow-[1px_1px_0px_rgba(225,29,72,0.4)]";
    } else if (isAwaitingHuman) {
      borderStyles = isActive
        ? "border-amber-500 bg-[#FFFBEB] shadow-[2px_2px_0px_rgba(245,158,11,1)]"
        : "border-amber-300 bg-white hover:border-amber-500 hover:shadow-[1px_1px_0px_rgba(245,158,11,0.4)]";
    } else {
      borderStyles = isActive
        ? "border-[#111111] bg-white shadow-[2px_2px_0px_rgba(17,17,17,1)]"
        : "border-gray-200 bg-white hover:border-[#111111]";
    }

    return (
      <div
        key={d.id}
        onClick={() => {
          setActiveDealId(d.id);
          setShowLotForm(false);
        }}
        className={`w-full border p-2 text-left transition-all duration-100 flex flex-col gap-1 cursor-pointer relative group ${borderStyles}`}
      >
        {isDeadlocked && (
          <div className="bg-[#E11D48] text-white font-mono text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider mb-1 flex items-center justify-between animate-pulse">
            <span>[!] HARD DEADLOCK HALT</span>
            <span>MANUAL OVERRIDE REQ</span>
          </div>
        )}
        {isAwaitingHuman && (
          <div className="bg-amber-500 text-amber-950 font-mono text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider mb-1 flex items-center justify-between border border-amber-600 animate-pulse">
            <span>[!] HITL INTERCEPT REQ</span>
            <span>MANUAL INPUT</span>
          </div>
        )}
        <div className="flex justify-between items-center w-full relative">
          <span className="font-mono text-xs font-bold text-[#111111] truncate max-w-[150px] flex items-center gap-1">
            <span className="text-gray-400 font-normal">#</span>
            {formattedName}
            {typingDeals[d.id] && (
              <span className="text-rose-600 animate-pulse text-[9px] font-normal font-mono shrink-0 ml-1">
                (typing...)
              </span>
            )}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
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
            
            {/* Options button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setOpenMenuDealId(openMenuDealId === d.id ? null : d.id);
                setConfirmDeleteDealId(null);
              }}
              className="p-1 hover:bg-gray-100 text-[#111111] border border-transparent hover:border-[#111111] transition-all cursor-pointer bg-white"
            >
              <MoreVertical className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center w-full font-mono text-[8px] text-gray-400">
          <span>BUDGET: {d.current_buyer_budget} EUR</span>
          <span className="flex items-center gap-0.5" suppressHydrationWarning>
            <Clock className="h-2 w-2" />
            {new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Monospace contextual dropdown menu */}
        {openMenuDealId === d.id && (
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="absolute right-2 top-8 z-50 border border-[#111111] bg-white p-1 text-[9px] font-mono shadow-[2px_2px_0px_rgba(17,17,17,1)] flex flex-col w-28 text-left animate-fade-in"
          >
            {d.is_archived ? (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleArchiveDeal(d.id, false);
                  setOpenMenuDealId(null);
                }}
                className="hover:bg-gray-100 px-1.5 py-1 text-left flex items-center gap-1 cursor-pointer w-full text-gray-700 font-bold"
              >
                <RefreshCw className="h-2.5 w-2.5 text-gray-500" />
                <span>UNARCHIVE</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleArchiveDeal(d.id, true);
                  setOpenMenuDealId(null);
                }}
                className="hover:bg-gray-100 px-1.5 py-1 text-left flex items-center gap-1 cursor-pointer w-full text-gray-700 font-bold"
              >
                <Archive className="h-2.5 w-2.5 text-gray-500" />
                <span>ARCHIVE</span>
              </button>
            )}

            {confirmDeleteDealId === d.id ? (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleDeleteDeal(d.id);
                  setOpenMenuDealId(null);
                  setConfirmDeleteDealId(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-1.5 py-1 text-left flex items-center gap-1 cursor-pointer w-full border border-red-700"
              >
                <AlertTriangle className="h-2.5 w-2.5 text-white animate-pulse" />
                <span>CONFIRM PURGE</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteDealId(d.id);
                }}
                className="hover:bg-red-50 text-red-600 px-1.5 py-1 text-left flex items-center gap-1 cursor-pointer w-full font-bold"
              >
                <Trash2 className="h-2.5 w-2.5 text-red-600" />
                <span>DELETE</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <main 
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className="h-screen w-screen flex flex-col font-sans select-none antialiased bg-white relative"
    >
      {dragActive && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 border-4 border-dashed border-emerald-500 font-mono p-4 text-center select-none"
        >
          <Upload className="h-12 w-12 text-emerald-500 animate-bounce mb-4" />
          <h2 className="text-emerald-500 text-xl font-bold uppercase tracking-wider mb-2">
            DROP RFQ FILE TO INGEST
          </h2>
          <p className="text-gray-400 text-xs uppercase max-w-md">
            Supported formats: DOCX, PDF, XLSX, TXT, PNG, JPG, WEBP, GIF
          </p>
        </div>
      )}
      
      {/* GLOBAL HIGH-CONTRAST HEADER */}
      <header className="h-14 border-b border-[#111111] bg-white flex items-center justify-between px-4 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 bg-[#111111] flex items-center justify-center">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <span className="font-mono text-sm font-bold uppercase tracking-widest text-[#111111]">
            ATIRAA | PROCUREMENT & ESCROW PLATFORM | V1.0
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 bg-emerald-500"></div>
            <span className="font-mono text-[10px] font-bold text-gray-600 uppercase">
              POSTGRES DATABASE: CONNECTED
            </span>
          </div>
          <Link
            href="/inventory"
            className="flex items-center gap-1.5 border border-[#111111] px-3 py-1 bg-[#111111] text-white font-mono text-[10px] font-bold uppercase hover:bg-white hover:text-[#111111] transition-all duration-100"
          >
            <ShoppingBag className="h-3 w-3" />
            VIEW HARDWARE CATALOG
          </Link>
          <button 
            onClick={() => fetchDeals()}
            className="flex items-center gap-1.5 border border-[#111111] px-3 py-1 bg-white font-mono text-[10px] font-bold uppercase hover:bg-[#111111] hover:text-white transition-colors duration-100"
          >
            <RefreshCw className="h-3 w-3" />
            REFRESH LEDGER
          </button>
        </div>
      </header>

      {/* GLOBAL NOTIFICATION BLINKING STRIP */}
      {(deadlockedDeals.length > 0 || awaitingHumanDeals.length > 0) && (
        <div className={`border-b border-[#111111] px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-10 shrink-0 font-mono text-[10px] ${
          deadlockedDeals.length > 0 
            ? "bg-[#FFF1F2] border-rose-600 text-rose-950" 
            : "bg-[#FFFBEB] border-amber-600 text-amber-950"
        }`}>
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 shrink-0 animate-pulse ${
              deadlockedDeals.length > 0 ? "bg-[#E11D48]" : "bg-amber-500"
            }`}></span>
            <span className="font-bold uppercase tracking-wider">
              {deadlockedDeals.length > 0 
                ? `[!] MANUAL OPERATOR COMMAND REQUIRED | ${deadlockedDeals.length} LOTS DEADLOCKED` 
                : `[!] HUMAN-IN-THE-LOOP INTERCEPT REQUIRED | ${awaitingHumanDeals.length} DEALS PENDING YOUR OFFER`}
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto max-w-full">
            {awaitingHumanDeals.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setActiveDealId(d.id);
                  setShowLotForm(false);
                }}
                className="flex items-center gap-1 border border-amber-600 bg-amber-50 text-amber-950 px-2.5 py-0.5 font-bold uppercase hover:bg-amber-500 hover:text-white transition-all text-[9px]"
              >
                <span>[HITL] {d.item_name.toUpperCase()}</span>
              </button>
            ))}
            {deadlockedDeals.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setActiveDealId(d.id);
                  setShowLotForm(false);
                }}
                className="flex items-center gap-1 border border-rose-600 bg-rose-50 text-rose-950 px-2.5 py-0.5 font-bold uppercase hover:bg-[#E11D48] hover:text-white transition-all text-[9px]"
              >
                <span>[DEADLOCK] {d.item_name.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* THREE-COLUMN WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* LEFT WORKSPACE SIDEBAR PANEL */}
        <aside className="w-80 min-h-0 border-r border-[#111111] bg-white flex flex-col shrink-0">
          
          <div className="p-3 border-b border-[#111111] bg-white">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              ACTIVE TRADING ROOMS
            </span>
            <div className="font-mono text-xs font-bold text-[#111111] flex items-center gap-2">
              <span className="text-[#111111]">#</span> M1-BILATERAL-ESCROW
            </div>
          </div>

          {/* HISTORICAL SESSIONS LIST INDEX */}
          <div className="flex-1 flex flex-col p-2 space-y-2 bg-white min-h-0">
            
            {/* MULTIMODAL INGESTION TERMINAL BOX */}
            <div className="border border-[#111111] bg-white flex flex-col shrink-0">
              <div className="w-full bg-[#111111] text-white px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-between text-left">
                <div className="flex items-center gap-1.5 flex-1 text-left">
                  <Terminal className="h-3 w-3 text-white animate-pulse shrink-0" />
                  <span>INGESTION TERMINAL</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIngestionFullView(true)}
                  className="p-1 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 bg-transparent text-white transition-all flex items-center justify-center shrink-0 ml-1.5 cursor-pointer"
                  title="Expand Ingestion Terminal to Full View"
                >
                  <Maximize2 className="h-2.5 w-2.5 text-white" />
                </button>
              </div>

              {ingesting ? (
                    /* PROGRESS SCANNER MODULE */
                    <div className="p-3 bg-black text-[#00ff00] font-mono text-[9px] leading-relaxed space-y-1.5 border-t border-[#111111]">
                      <div className="flex items-center gap-1.5">
                        <span className="animate-ping h-1.5 w-1.5 bg-[#00ff00] rounded-none"></span>
                        <span>INGESTION PROTOCOL INITIATED...</span>
                      </div>
                      
                      {/* Step 1: SCANNING */}
                      <div className="flex items-center justify-between">
                        <span className={parseStep === "SCANNING" ? "animate-pulse font-bold" : ""}>
                          {parseStep === "SCANNING" ? "[◷]" : ["EXTRACTING", "RESEARCH", "SEEDING"].includes(parseStep) || parseStep === "" ? "[✔]" : "[ ]"} STAGE 1: SCANNING FILE
                        </span>
                        {parseStep === "SCANNING" && <span className="text-[8px] animate-pulse">PROCESSING...</span>}
                      </div>

                      {/* Step 2: EXTRACTING */}
                      <div className="flex items-center justify-between">
                        <span className={parseStep === "EXTRACTING" ? "animate-pulse font-bold" : ""}>
                          {parseStep === "EXTRACTING" ? "[◷]" : ["RESEARCH", "SEEDING"].includes(parseStep) || parseStep === "" ? "[✔]" : "[ ]"} STAGE 2: FIELDS EXTRACTION
                        </span>
                        {parseStep === "EXTRACTING" && <span className="text-[8px] animate-pulse">PROCESSING...</span>}
                      </div>

                      {/* Step 3: RESEARCH */}
                      <div className="flex items-center justify-between">
                        <span className={parseStep === "RESEARCH" ? "animate-pulse font-bold" : ""}>
                          {parseStep === "RESEARCH" ? "[◷]" : ["SEEDING"].includes(parseStep) || parseStep === "" ? "[✔]" : "[ ]"} STAGE 3: TAVILY MARKET GROUNDING
                        </span>
                        {parseStep === "RESEARCH" && <span className="text-[8px] animate-pulse">PROCESSING...</span>}
                      </div>

                      {/* Step 4: SEEDING */}
                      <div className="flex items-center justify-between">
                        <span className={parseStep === "SEEDING" ? "animate-pulse font-bold" : ""}>
                          {parseStep === "SEEDING" ? "[◷]" : parseStep === "" ? "[✔]" : "[ ]"} STAGE 4: PG SEEDING & PIONEER TRACE
                        </span>
                        {parseStep === "SEEDING" && <span className="text-[8px] animate-pulse">COMMIT...</span>}
                      </div>
                    </div>
                  ) : (
                    <>
                    <form onSubmit={handleSubmitCombined} className="p-2 flex flex-col bg-white space-y-2">
                      <div className="relative">
                        <textarea
                          rows={3}
                          value={rfqText}
                          onChange={(e) => setRfqText(e.target.value)}
                          placeholder="PASTE MESSY RFQ EMAIL, DRAG & DROP FILE, OR ATTACH..."
                          className="w-full border border-[#111111] bg-white p-2 pr-8 font-mono text-[9px] text-[#111111] focus:outline-none placeholder-gray-400 leading-normal resize-none focus:bg-white"
                          disabled={ingesting}
                          style={{ minHeight: "55px" }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById("rfq-file-input")?.click()}
                          className="absolute bottom-2 right-2 p-1 hover:bg-gray-100 text-gray-500 hover:text-[#111111] transition-all m-0"
                          title="Attach RFQ document or image"
                          disabled={ingesting}
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="file"
                          id="rfq-file-input"
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".docx,.pdf,.xlsx,.xls,.txt,.png,.jpg,.jpeg,.webp,.gif"
                          disabled={ingesting}
                        />
                      </div>

                      {selectedFile && (
                        /* FILE PREVIEW CONTAINER */
                        <div className="border border-[#111111] p-2 bg-white flex flex-col gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-white border border-[#111111] flex items-center justify-center shrink-0">
                              {(() => {
                                const ext = selectedFile.name.split(".").pop()?.toLowerCase();
                                if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "")) {
                                  return <FileImage className="h-5 w-5 text-[#111111]" />;
                                }
                                if (["xlsx", "xls"].includes(ext || "")) {
                                  return <FileSpreadsheet className="h-5 w-5 text-[#111111]" />;
                                }
                                return <FileText className="h-5 w-5 text-[#111111]" />;
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-[9px] font-bold text-[#111111] truncate uppercase">
                                {selectedFile.name}
                              </div>
                              <div className="font-mono text-[7px] text-gray-400 uppercase mt-0.5">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedFile(null)}
                              className="p-1 hover:bg-gray-200 border border-[#111111] bg-white transition-all text-[#111111]"
                              title="Remove selected file"
                              disabled={ingesting}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={ingesting || (!selectedFile && !rfqText.trim())}
                        className="w-full bg-[#111111] text-white font-mono text-[9px] font-bold uppercase py-1.5 hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-1.5 border border-[#111111] transition-all duration-100"
                      >
                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                        <span>{selectedFile ? "INGEST ATTACHED FILE" : "INGEST & SEED POSTGRES"}</span>
                      </button>
                    </form>
                    </>
                  )}
            </div>

            {/* ACTIVE SOURCING STYLE TOGGLE */}
            {activeDeal && (
              <div className="border border-[#111111] bg-white p-2 flex flex-col space-y-1.5 font-mono shrink-0">
                <div className="flex items-center justify-between text-[8px] font-bold text-gray-500 uppercase tracking-wider">
                  <span>ACTIVE SOURCING STYLE</span>
                  <span className="text-[#111111] bg-gray-100 px-1 border border-[#111111] text-[7px] leading-tight">
                    {activeDeal.negotiation_style || "DISTRIBUTIVE"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    disabled={activeDeal.status !== "ACTIVE"}
                    onClick={() => handleUpdateStyle("DISTRIBUTIVE")}
                    className={`py-1 text-[8px] font-bold uppercase border transition-all duration-100 ${
                      activeDeal.status !== "ACTIVE"
                        ? (activeDeal.negotiation_style || "DISTRIBUTIVE") === "DISTRIBUTIVE"
                          ? "bg-gray-400 text-white border-gray-400 cursor-not-allowed opacity-60"
                          : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                        : (activeDeal.negotiation_style || "DISTRIBUTIVE") === "DISTRIBUTIVE"
                        ? "bg-[#111111] text-white border-[#111111] cursor-pointer"
                        : "bg-white text-gray-500 border-gray-200 hover:border-[#111111] hover:text-[#111111] cursor-pointer"
                    }`}
                  >
                    DISTRIBUTIVE
                  </button>
                  <button
                    type="button"
                    disabled={activeDeal.status !== "ACTIVE"}
                    onClick={() => handleUpdateStyle("INTEGRATIVE")}
                    className={`py-1 text-[8px] font-bold uppercase border transition-all duration-100 ${
                      activeDeal.status !== "ACTIVE"
                        ? activeDeal.negotiation_style === "INTEGRATIVE"
                          ? "bg-gray-400 text-white border-gray-400 cursor-not-allowed opacity-60"
                          : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                        : activeDeal.negotiation_style === "INTEGRATIVE"
                        ? "bg-[#111111] text-white border-[#111111] cursor-pointer"
                        : "bg-white text-gray-500 border-gray-200 hover:border-[#111111] hover:text-[#111111] cursor-pointer"
                    }`}
                  >
                    INTEGRATIVE
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="p-4 text-center font-mono text-xs text-gray-400 shrink-0">
                LOADING DATABASE CHANNELS...
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 border border-[#111111] bg-white">
                
                {/* SIDEBAR NAVIGATION MENU */}
                <div className="flex border-b border-[#111111] shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveDrawer("BUYER")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 font-mono text-[8px] font-bold uppercase tracking-wider text-center transition-all duration-100 cursor-pointer border-r border-[#111111] ${
                      activeDrawer === "BUYER"
                        ? "bg-[#111111] text-white"
                        : "bg-white text-gray-500 hover:bg-white hover:text-[#111111]"
                    }`}
                  >
                    <ShoppingBag className="h-3 w-3" />
                    <span>BUY ({buyerDeals.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDrawer("SELLER")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 font-mono text-[8px] font-bold uppercase tracking-wider text-center transition-all duration-100 cursor-pointer ${
                      activeDrawer === "SELLER"
                        ? "bg-[#111111] text-white"
                        : "bg-white text-gray-500 hover:bg-white hover:text-[#111111]"
                    }`}
                  >
                    <Tag className="h-3 w-3" />
                    <span>SELL ({sellerDeals.length})</span>
                  </button>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  {/* Action/Sub-header Bar */}
                  <div className="w-full flex justify-between items-center px-3 py-1.5 bg-white border-b border-[#111111] text-[#111111] font-mono text-[8px] font-bold uppercase tracking-wider">
                    <span className="text-gray-500 font-mono text-[8px]">
                      {activeDrawer === "BUYER" ? "ACTIVE BUY CHANNELS" : "ACTIVE SELL CHANNELS"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewPerspective(activeDrawer === "BUYER" ? "BUYER" : "SELLER");
                        setShowLotForm(true);
                      }}
                      className="font-mono text-[8px] font-bold hover:underline cursor-pointer text-[#111111] uppercase"
                    >
                      [+] Create Channel
                    </button>
                  </div>

                  {/* Scrollable list */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-white">
                    {showLotForm && newPerspective === activeDrawer && (
                      <form onSubmit={handleCreateLot} className="border border-[#111111] p-3 bg-white space-y-3 shrink-0 mb-2 animate-fade-in">
                        <div className="font-mono text-[10px] font-bold border-b border-[#111111] pb-1 uppercase flex justify-between items-center">
                          <span>INITIALIZE {newPerspective} LOT</span>
                          <button type="button" onClick={() => setShowLotForm(false)} className="hover:opacity-70">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div>
                          <label className="font-mono text-[8px] font-bold text-gray-500 block mb-1 uppercase">
                            ASSET LOT DESCRIPTOR / ITEM NAME
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="E.G. TITANIUM ROTOR ASSEMBLY"
                            value={newLotName}
                            onChange={(e) => setNewLotName(e.target.value)}
                            className="w-full border border-[#111111] bg-white px-2 py-1.5 font-mono text-[10px] focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-mono text-[8px] font-bold text-gray-500 block mb-1 uppercase">
                            TARGET POOL BUDGET (EUR)
                          </label>
                          <input
                            type="number"
                            required
                            min={500}
                            max={5000}
                            value={newBudget}
                            onChange={(e) => setNewBudget(parseInt(e.target.value))}
                            className="w-full border border-[#111111] bg-white px-2 py-1.5 font-mono text-[10px] focus:outline-none focus:bg-white"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full bg-[#111111] text-white font-mono text-[9px] font-bold uppercase py-1.5 hover:bg-gray-800 disabled:opacity-50"
                        >
                          {submitting ? "RUNNING TAVILY RESEARCH..." : "SPAWN ESCROW ROOM"}
                        </button>
                      </form>
                    )}

                    {activeDrawer === "BUYER" ? (
                      <div className="space-y-1.5 w-full">
                        {buyerDeals.length === 0 ? (
                          <div className="p-4 text-center font-mono text-[9px] text-gray-400 italic">
                            NO ACTIVE BUYER CHANNELS
                          </div>
                        ) : (
                          buyerDeals.map((d) => renderDealChannel(d))
                        )}

                        {archivedBuyerDeals.length > 0 && (
                          <div className="mt-4 border-t border-dashed border-gray-300 pt-2 shrink-0 w-full">
                            <button
                              type="button"
                              onClick={() => setShowArchivedBuyer(!showArchivedBuyer)}
                              className="w-full flex justify-between items-center px-1.5 py-1 text-left font-mono text-[8px] font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-50 hover:text-[#111111] transition-all cursor-pointer border border-transparent hover:border-[#111111]"
                            >
                              <span>{showArchivedBuyer ? "[-] Hide Archived" : "[+] Show Archived"} ({archivedBuyerDeals.length})</span>
                              {showArchivedBuyer ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                            {showArchivedBuyer && (
                              <div className="space-y-1.5 mt-1.5 pl-1 border-l border-[#111111]">
                                {archivedBuyerDeals.map((d) => renderDealChannel(d))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5 w-full">
                        {sellerDeals.length === 0 ? (
                          <div className="p-4 text-center font-mono text-[9px] text-gray-400 italic">
                            NO ACTIVE SELLER CHANNELS
                          </div>
                        ) : (
                          sellerDeals.map((d) => renderDealChannel(d))
                        )}

                        {archivedSellerDeals.length > 0 && (
                          <div className="mt-4 border-t border-dashed border-gray-300 pt-2 shrink-0 w-full">
                            <button
                              type="button"
                              onClick={() => setShowArchivedSeller(!showArchivedSeller)}
                              className="w-full flex justify-between items-center px-1.5 py-1 text-left font-mono text-[8px] font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-50 hover:text-[#111111] transition-all cursor-pointer border border-transparent hover:border-[#111111]"
                            >
                              <span>{showArchivedSeller ? "[-] Hide Archived" : "[+] Show Archived"} ({archivedSellerDeals.length})</span>
                              {showArchivedSeller ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                            {showArchivedSeller && (
                              <div className="space-y-1.5 mt-1.5 pl-1 border-l border-[#111111]">
                                {archivedSellerDeals.map((d) => renderDealChannel(d))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* ADMIN OPERATOR BADGE MODULE */}
          <div className="border-t border-[#111111] p-3 bg-white shrink-0">
            <div className="border border-[#111111] p-2.5 bg-white flex flex-col gap-1.5">
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
        <section className="flex-1 min-h-0 flex flex-col bg-white">
          
          {/* ACTIVE LOT CONTEXT BAR */}
          <div className="h-11 border-b border-[#111111] bg-white px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {activeDeal ? (
                <div className="flex items-center gap-2 min-w-0">
                  <Terminal className="h-4 w-4 text-[#111111] shrink-0" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111] truncate">
                    EXCHANGE FEED | LOT: {activeDeal.item_name}
                  </span>
                  <span className="font-mono text-[9px] font-bold px-2 py-0.5 border border-amber-500 bg-amber-100 text-amber-900 shrink-0">
                    ROLE: {activeDeal.perspective === "BUYER" ? "BUYER" : "SELLER"}
                  </span>
                </div>
              ) : (
                <span className="font-mono text-xs font-bold text-gray-400 uppercase truncate">
                  NO ACTIVE LOT ELECTED. INITIALIZE OR CHOOSE FROM PANEL.
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 shrink-0">
              {activeDeal && (
                <div className="hidden md:flex items-center gap-1.5 font-mono text-[9px] text-gray-500 font-bold uppercase">
                  <span>DEAL ID:</span>
                  <span className="text-gray-700 select-all">{activeDeal.id.slice(0, 8).toUpperCase()}...</span>
                </div>
              )}
              
              <Link
                href="/dashboard"
                className="font-mono text-[10px] font-bold uppercase border border-[#111111] px-2.5 py-1 bg-white text-[#111111] hover:bg-[#111111] hover:text-white flex items-center gap-1.5 shadow-[2px_2px_0px_rgba(17,17,17,1)] hover:shadow-[2px_2px_0px_rgba(17,17,17,0.1)] transition-all relative animate-fade-in"
                title="Interactive Data Analytics Dashboard"
              >
                <BarChart3 className="h-3.5 w-3.5 text-[#111111] hover:text-white" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/observability"
                className="font-mono text-[10px] font-bold uppercase border border-[#111111] px-2.5 py-1 bg-[#111111] text-white hover:bg-white hover:text-[#111111] flex items-center gap-1.5 shadow-[2px_2px_0px_rgba(17,17,17,1)] hover:shadow-[2px_2px_0px_rgba(17,17,17,0.1)] transition-all relative animate-fade-in"
                title="System Observability Dashboard"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Observability</span>
                {pioneerStream.some(item => item.status === "DEADLOCK") && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </Link>
            </div>
          </div>

          <>
              {/* CHAT MESSAGES SCROLL VIEW */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                {activeDeal ? (
                  <>
                    {activeDeal.messages.map((m) => {
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

                    // Parse TCO parameters
                    const tcoRegex = /^\[Offer:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]\s*(.*)$/s;
                    const match = m.message_text.match(tcoRegex);
                    
                    let displayMessage = m.message_text;
                    let tcoParams = null;
                    
                    if (match) {
                      tcoParams = {
                        offer: match[1].trim(),
                        warranty: match[2].trim(),
                        payment: match[3].trim(),
                        sla: match[4].trim()
                      };
                      displayMessage = match[5].trim();
                    }

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
                            <span className="font-mono text-[8px] opacity-60" suppressHydrationWarning>
                              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          
                          {/* TCO CHIPS GRID */}
                          {tcoParams && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5 font-mono">
                              <div className="border border-current p-1.5 flex flex-col opacity-90">
                                <span className="text-[6.5px] font-bold uppercase tracking-wider opacity-60">OFFER PRICE</span>
                                <span className="text-[9.5px] font-bold">{tcoParams.offer}</span>
                              </div>
                              <div className="border border-current p-1.5 flex flex-col opacity-90">
                                <span className="text-[6.5px] font-bold uppercase tracking-wider opacity-60">WARRANTY</span>
                                <span className="text-[9.5px] font-bold">{tcoParams.warranty}</span>
                              </div>
                              <div className="border border-current p-1.5 flex flex-col opacity-90">
                                <span className="text-[6.5px] font-bold uppercase tracking-wider opacity-60">PAYMENT</span>
                                <span className="text-[9.5px] font-bold">{tcoParams.payment}</span>
                              </div>
                              <div className="border border-current p-1.5 flex flex-col opacity-90">
                                <span className="text-[6.5px] font-bold uppercase tracking-wider opacity-60">DELIVERY SLA</span>
                                <span className="text-[9.5px] font-bold">{tcoParams.sla}</span>
                              </div>
                            </div>
                          )}
                          
                          {/* BODY CONTENT */}
                          <p className="text-xs font-mono leading-relaxed whitespace-pre-wrap">
                            {renderFormattedText(displayMessage)}
                          </p>
                        </div>

                      </div>
                    );
                  })}

                    {isTyping && (
                      <div className="flex gap-3 items-start animate-fade-in">
                        {/* AVATAR TOKEN */}
                        <div className="h-8 w-8 shrink-0 flex items-center justify-center font-mono text-[10px] font-bold border bg-white text-gray-800 border-gray-400">
                          [{activeDeal.perspective === "BUYER" ? "SL" : "BY"}]
                        </div>

                        {/* MESSAGE BUBBLE */}
                        <div className="flex-1 border p-3 bg-white border-gray-300 text-gray-800 max-w-[200px]">
                          {/* HEADER */}
                          <div className="flex justify-between items-center mb-1 border-b border-dashed border-current pb-1 opacity-80">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                              {activeDeal.perspective === "BUYER" ? "Seller Agent" : "Buyer Agent"} | {activeDeal.perspective === "BUYER" ? "SELLER" : "BUYER"}
                            </span>
                          </div>
                          
                          {/* BODY CONTENT */}
                          <div className="flex items-center gap-1.5 py-1">
                            <span className="font-mono text-[9px] text-[#111111] uppercase tracking-wider font-bold">WRITING</span>
                            <span className="flex gap-1 items-center">
                              <span className="h-1.5 w-1.5 bg-[#111111] animate-pulse" style={{ animationDelay: "0ms" }}></span>
                              <span className="h-1.5 w-1.5 bg-[#111111] animate-pulse" style={{ animationDelay: "150ms" }}></span>
                              <span className="h-1.5 w-1.5 bg-[#111111] animate-pulse" style={{ animationDelay: "300ms" }}></span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
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
                {activeDeal?.status === "DEADLOCK" && (
                  <div className="border border-[#E11D48] bg-[#FFF1F2] p-4 text-left font-mono my-3 flex flex-col gap-3 animate-fade-in shadow-[2px_2px_0px_rgba(225,29,72,1)] rounded-none">
                    <div className="flex items-center gap-2 border-b border-[#E11D48] pb-2 text-[#E11D48]">
                      <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce" />
                      <span className="text-[11px] font-bold tracking-wide uppercase">[!] MULTI-PARTY SETTLEMENT DEADLOCK HALT</span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-[#9F1239]">
                      Calculations have stalled. All Buyers have hit their maximum authorized budget caps, and all Sellers have reached their absolute floor price thresholds. No overlapping agreement window exists. Autonomous trade calculation has been suspended until an authorized operator issues a command override.
                    </p>
                    <div className="bg-[#FFE4E6] p-2.5 border border-[#FDA4AF] text-[9.5px]">
                      <span className="font-bold text-[#E11D48] uppercase block mb-1">OPERATOR CONTROL PROTOCOL INSTRUCTIONS:</span>
                      <ul className="list-disc pl-4 space-y-1 text-[#9F1239]">
                        <li>Type <strong className="font-bold text-[#BE123C]">"approve"</strong> below to authorize a <strong className="font-bold text-[#BE123C]">+100 EUR budget expansion</strong>. This raises all Buyer budget ceilings and reactivates the trade engine.</li>
                        <li>Type <strong className="font-bold text-[#BE123C]">"terminate"</strong> below to forcefully cancel and close this deal channel forever.</li>
                        <li>Type any message containing a price point (e.g. <strong className="font-bold text-[#BE123C]">"1200 EUR"</strong>) to inject a manual pricing offer on behalf of your perspective.</li>
                      </ul>
                    </div>
                  </div>
                )}
                {activeDeal && isWaitingForHuman(activeDeal) && (
                  <div className="border border-amber-500 bg-[#FFFBEB] p-4 text-left font-mono my-3 flex flex-col gap-3 animate-fade-in shadow-[2px_2px_0px_rgba(245,158,11,1)] rounded-none">
                    <div className="flex items-center gap-2 border-b border-amber-500 pb-2 text-amber-700">
                      <Terminal className="h-4 w-4 shrink-0 animate-pulse" />
                      <span className="text-[11px] font-bold tracking-wide uppercase">[!] HUMAN-IN-THE-LOOP INTERCEPT REQUIRED</span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-amber-900">
                      The automated trading system has paused to let you steer the negotiation. As the <strong className="font-bold text-amber-950">{activeDeal.perspective === "BUYER" ? "BUYER" : "SELLER"}</strong>, you are currently holding the turn. The counterparty agent is awaiting your pricing or specifications directive.
                    </p>
                    <div className="bg-[#FEF3C7] p-2.5 border border-amber-300 text-[9.5px]">
                      <span className="font-bold text-amber-800 uppercase block mb-1">TACTICAL INTERACTION OPTIONS:</span>
                      <ul className="list-disc pl-4 space-y-1 text-amber-900">
                        <li>Use the **Tactical Cognitive Response Board** below to quick-send pre-formulated tactical concessions.</li>
                        <li>Type your custom counter-offer price (e.g. <strong className="font-bold text-amber-950">"1100 EUR"</strong>) in the free-text input and press Send.</li>
                        <li>Type <strong className="font-bold text-amber-950">"terminate"</strong> below if you wish to forcefully abort the negotiation.</li>
                      </ul>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* BOTTOM TERMINAL OVERRIDE & STEP BAR */}
              <div className="border-t border-[#111111] bg-white p-3 shrink-0">
                {activeDeal && (
                  <div className="flex flex-col gap-2">
                      
                      {/* STRATEGIC COGNITIVE RESPONSE BOARD */}
                      <div className="border border-[#111111] bg-white transition-all duration-150">
                        {/* Header */}
                        <div 
                          onClick={() => setIsStrategicBoardOpen(!isStrategicBoardOpen)}
                          className="flex justify-between items-center px-3 py-1.5 bg-gray-50 border-b border-[#111111] cursor-pointer hover:bg-gray-100 select-none"
                        >
                          <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-[#111111]">
                            <BrainCircuit className="h-3 w-3 text-rose-600 animate-pulse" />
                            <span>TACTICAL COGNITIVE RESPONSE BOARD</span>
                          </div>
                          <span className="font-mono text-[8px] text-gray-500 font-bold">
                            {isStrategicBoardOpen ? "[-] HIDE BOARD" : "[+] EXPAND BOARD"}
                          </span>
                        </div>

                        {isStrategicBoardOpen && (
                          <div className="p-2 grid grid-cols-1 md:grid-cols-4 gap-2 bg-white text-[10px]">
                            {hasHumanParticipant ? (
                              <>
                                {/* Group 1: Settlement & Alignment */}
                                <div className="flex flex-col gap-1 border border-dashed border-gray-200 p-1.5">
                                  <span className="font-mono text-[7.5px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5 border-b border-gray-100 pb-0.5">
                                    [01] Settle & Stand Firm
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleSendPreset(agreePreset.text)}
                                    disabled={isHaltedOrFinished}
                                    title={agreePreset.tooltip}
                                    className="w-full text-left font-mono text-[8.5px] font-bold py-0.5 px-1 border border-[#111111] bg-white hover:bg-gray-100 text-[#111111] truncate transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {agreePreset.label}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSendPreset(standFirmPreset.text)}
                                    disabled={isHaltedOrFinished}
                                    title={standFirmPreset.tooltip}
                                    className="w-full text-left font-mono text-[8.5px] font-bold py-0.5 px-1 border border-[#111111] bg-white hover:bg-gray-100 text-[#111111] truncate transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {standFirmPreset.label}
                                  </button>
                                </div>

                                {/* Group 2: Distributive Leverage */}
                                <div className="flex flex-col gap-1 border border-dashed border-gray-200 p-1.5">
                                  <span className="font-mono text-[7.5px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5 border-b border-gray-100 pb-0.5">
                                    [02] Concession Leverage
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleSendPreset(concessionPreset.text)}
                                    disabled={isHaltedOrFinished}
                                    title={concessionPreset.tooltip}
                                    className="w-full text-left font-mono text-[8.5px] font-bold py-0.5 px-1 border border-[#111111] bg-white hover:bg-gray-100 text-[#111111] truncate transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {concessionPreset.label}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSendPreset(extremePreset.text)}
                                    disabled={isHaltedOrFinished}
                                    title={extremePreset.tooltip}
                                    className="w-full text-left font-mono text-[8.5px] font-bold py-0.5 px-1 border border-[#111111] bg-white hover:bg-gray-100 text-[#111111] truncate transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {extremePreset.label}
                                  </button>
                                </div>

                                {/* Group 3: Integrative TCO Trades */}
                                <div className="flex flex-col gap-1 border border-dashed border-gray-200 p-1.5">
                                  <span className="font-mono text-[7.5px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5 border-b border-gray-100 pb-0.5">
                                    [03] Integrative TCO Trades
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleSendPreset(tcoCompromisePreset.text)}
                                    disabled={isHaltedOrFinished}
                                    title={tcoCompromisePreset.tooltip}
                                    className="w-full text-left font-mono text-[8.5px] font-bold py-0.5 px-1 border border-[#111111] bg-white hover:bg-gray-100 text-[#111111] truncate transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {tcoCompromisePreset.label}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSendPreset(slaPremiumPreset.text)}
                                    disabled={isHaltedOrFinished}
                                    title={slaPremiumPreset.tooltip}
                                    className="w-full text-left font-mono text-[8.5px] font-bold py-0.5 px-1 border border-[#111111] bg-white hover:bg-gray-100 text-[#111111] truncate transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {slaPremiumPreset.label}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="md:col-span-3 flex items-center justify-center border border-dashed border-gray-200 p-3 text-gray-400 font-mono text-[8.5px] uppercase">
                                Autonomous simulation lane: Conversational presets inactive.
                              </div>
                            )}

                            {/* Group 4: Administrative Control */}
                            <div className="flex flex-col gap-1 border border-dashed border-gray-200 p-1.5">
                              <span className="font-mono text-[7.5px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5 border-b border-gray-100 pb-0.5">
                                [04] Admin Overrides
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSendPreset("approve")}
                                disabled={activeDeal.status === "TERMINATED" || activeDeal.status === "MATCHED"}
                                className="w-full text-left font-mono text-[8.5px] font-bold py-0.5 px-1 border border-[#E11D48] bg-white hover:bg-[#FFE4E6] text-[#E11D48] truncate transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                BUMP BUDGET (+100)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSendPreset("terminate")}
                                disabled={activeDeal.status === "TERMINATED" || activeDeal.status === "MATCHED"}
                                className="w-full text-left font-mono text-[8.5px] font-bold py-0.5 px-1 border border-[#111111] bg-white hover:bg-gray-100 text-[#111111] truncate transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                HALT & TERMINATE
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    
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
                      <form onSubmit={handleSendOperatorMessage} className={`flex-1 flex border transition-all duration-150 ${
                        activeDeal.status === "DEADLOCK" 
                          ? "border-[#E11D48] shadow-[0_0_8px_rgba(225,29,72,0.15)] bg-[#FFF1F2]" 
                          : isWaitingForHuman(activeDeal)
                          ? "border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.15)] bg-[#FFFBEB]"
                          : "border-[#111111]"
                      }`}>
                        <div className={`border-r px-3 flex items-center transition-colors duration-150 ${
                          activeDeal.status === "DEADLOCK" 
                            ? "border-[#E11D48] bg-[#FFF1F2]" 
                            : isWaitingForHuman(activeDeal)
                            ? "border-amber-500 bg-[#FFFBEB]"
                            : "border-[#111111] bg-white"
                        }`}>
                          <Terminal className={`h-3.5 w-3.5 transition-colors duration-150 ${
                            activeDeal.status === "DEADLOCK" 
                              ? "text-[#E11D48]" 
                              : isWaitingForHuman(activeDeal)
                              ? "text-amber-600"
                              : "text-gray-500"
                          }`} />
                        </div>
                        <input
                          type="text"
                          disabled={activeDeal.status === "TERMINATED" || activeDeal.status === "MATCHED"}
                          placeholder={
                            activeDeal.status === "MATCHED" 
                              ? "DEAL SETTLED. COMMENCING ESCROW."
                              : activeDeal.status === "TERMINATED"
                              ? "POOL FORCEFULLY TERMINATED."
                              : activeDeal.status === "DEADLOCK"
                              ? "ENGINE HALTED. COMMAND OVERRIDE PROTOCOL ACTIVATED: TYPE 'approve'..."
                              : isWaitingForHuman(activeDeal)
                              ? "HUMAN TURN: TYPE PRICE / DIRECTIVE (e.g. '1200 EUR') or TYPE 'terminate'..."
                              : "INJECT DIRECT OVERRIDE MESSAGE COMMAND OR TYPE 'approve'..."
                          }
                          value={operatorMsg}
                          onChange={(e) => setOperatorMessage(e.target.value)}
                          className={`flex-1 px-3 py-2.5 font-mono text-xs uppercase focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors duration-150 ${
                            activeDeal.status === "DEADLOCK" 
                              ? "bg-[#FFF1F2] text-[#9F1239] placeholder-[#FDA4AF]" 
                              : isWaitingForHuman(activeDeal)
                              ? "bg-[#FFFBEB] text-amber-900 placeholder-amber-400"
                              : "bg-white text-[#111111]"
                          }`}
                        />
                        <button
                          type="submit"
                          disabled={!operatorMsg.trim() || activeDeal.status === "TERMINATED" || activeDeal.status === "MATCHED"}
                          className={`border-l px-4 font-mono text-xs font-bold uppercase transition-all duration-100 disabled:opacity-50 flex items-center ${
                            activeDeal.status === "DEADLOCK" 
                              ? "border-[#E11D48] bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#E11D48]" 
                              : isWaitingForHuman(activeDeal)
                              ? "border-amber-500 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-amber-700"
                              : "border-[#111111] bg-white hover:bg-gray-100 text-[#111111]"
                          }`}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </form>

                      {/* AUTO-NEGOTIATING ENGINE STATUS CHIP */}
                      <div
                        className={`px-5 py-2.5 font-mono text-xs font-bold uppercase border flex items-center gap-2 select-none transition-all duration-150 ${
                          activeDeal.status === "ACTIVE" 
                            ? isWaitingForHuman(activeDeal)
                              ? "border-amber-500 bg-amber-500 text-amber-950 shadow-[2px_2px_0px_rgba(245,158,11,1)]"
                              : "border-[#111111] bg-slate-50 text-[#111111] shadow-[2px_2px_0px_rgba(17,17,17,1)]" 
                            : activeDeal.status === "DEADLOCK"
                            ? "border-[#E11D48] bg-[#E11D48] text-white shadow-[2px_2px_0px_rgba(225,29,72,1)]"
                            : "bg-gray-100 border-gray-300 text-gray-400"
                        }`}
                      >
                        {activeDeal.status === "ACTIVE" ? (
                          isWaitingForHuman(activeDeal) ? (
                            <>
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full bg-amber-200 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 bg-amber-950"></span>
                              </span>
                              <span>WAITING FOR YOU</span>
                            </>
                          ) : (
                            <>
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <span>AUTO-NEGOTIATING</span>
                            </>
                          )
                        ) : activeDeal.status === "DEADLOCK" ? (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full bg-rose-200 opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 bg-white"></span>
                            </span>
                            <span className="animate-pulse">ENGINE HALTED</span>
                          </>
                        ) : (
                          <>
                            <span className="h-2 w-2 bg-gray-400"></span>
                            <span>ENGINE INACTIVE</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>

        </section>

        {/* RIGHT HAND LIQUIDITY DEPTH SIDEBAR */}
        <aside className="w-96 min-h-0 border-l border-[#111111] bg-white p-4 shrink-0 flex flex-col gap-4 overflow-hidden">
          
          <div className="border-b border-[#111111] pb-2 shrink-0">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111] block mb-0.5">
              LIQUIDITY DEPTH LEDGER
            </span>
            <span className="font-mono text-[9px] text-gray-400 uppercase leading-none">
              REAL-TIME SPREAD CALCULATOR
            </span>
          </div>

          {activeDeal ? (
            <>
              {/* BLOCK 1: ACTIVE STRATEGY */}
              <div className="border border-[#111111] bg-white p-3 font-mono shrink-0">
                <div className="flex justify-between items-center border-b border-[#111111] pb-1.5 mb-1.5">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">ACTIVE NEGOTIATION STYLE</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 border ${
                    activeDeal.negotiation_style === "INTEGRATIVE"
                      ? "bg-[#111111] text-white border-[#111111]"
                      : "bg-white text-[#111111] border-[#111111]"
                  }`}>
                    {activeDeal.negotiation_style || "DISTRIBUTIVE"}
                  </span>
                </div>
                <div className="text-[9px] leading-relaxed text-gray-600 uppercase">
                  {activeDeal.negotiation_style === "INTEGRATIVE" ? (
                    <span>
                      COLLABORATIVE WIN-WIN MODE. AGENTS ENGAGE IN MULTI-VARIABLE TRADING (WARRANTIES, TERMS, SLAS) TO MAXIMIZE VALUE AND OVERCOME PRICE IMPASSES.
                    </span>
                  ) : (
                    <span>
                      TRANSACTIONAL WIN-LOSE MODE. AGENTS FOCUS SOLELY ON DIRECT COST REDUCTION, MAXIMUM BUDGET CAPS, AND RETALIATORY CONCESSION PATTERNS.
                    </span>
                  )}
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

              {/* BLOCK 2: COGNITIVE SOURCING STRATEGY PARAMETERS */}
              <div className="border border-[#111111] bg-white p-3 font-mono shrink-0 flex flex-col space-y-2">
                <div className="font-mono text-[9px] font-bold text-[#111111] border-b border-dashed border-gray-400 pb-1 uppercase tracking-wider">
                  COGNITIVE SHOULD-COST CALCULATOR
                </div>
                
                {/* Math Table */}
                <table className="w-full text-[8px] border-collapse font-mono border border-gray-300 bg-white">
                  <thead>
                    <tr className="bg-gray-100 text-[#111111] border-b border-gray-300">
                      <th className="p-1 text-left uppercase font-bold">SEGMENT</th>
                      <th className="p-1 text-right uppercase font-bold font-mono">RATIO</th>
                      <th className="p-1 text-right uppercase font-bold">VALUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="p-1 text-left">RAW MATERIALS</td>
                      <td className="p-1 text-right">45%</td>
                      <td className="p-1 text-right font-bold text-gray-900">{((activeDeal?.current_buyer_budget || 0) * 0.45).toFixed(1)} EUR</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-1 text-left">LABOR & OVERHEAD</td>
                      <td className="p-1 text-right">25%</td>
                      <td className="p-1 text-right font-bold text-gray-900">{((activeDeal?.current_buyer_budget || 0) * 0.25).toFixed(1)} EUR</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-1 text-left">LOGISTICS & DUTY</td>
                      <td className="p-1 text-right">10%</td>
                      <td className="p-1 text-right font-bold text-gray-900">{((activeDeal?.current_buyer_budget || 0) * 0.10).toFixed(1)} EUR</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-1 text-left">SUPPLIER MARGIN</td>
                      <td className="p-1 text-right">15%</td>
                      <td className="p-1 text-right font-bold text-gray-900">{((activeDeal?.current_buyer_budget || 0) * 0.15).toFixed(1)} EUR</td>
                    </tr>
                    <tr className="bg-gray-50 border-t border-gray-300">
                      <td className="p-1 text-left font-bold text-[#111111]">FAIR TARGET VALUE</td>
                      <td className="p-1 text-right font-bold">95%</td>
                      <td className="p-1 text-right font-bold text-[#111111]">{((activeDeal?.current_buyer_budget || 0) * 0.95).toFixed(1)} EUR</td>
                    </tr>
                  </tbody>
                </table>

                {/* BATNA & CONCESSIONS INFO */}
                <div className="space-y-1 border-t border-dashed border-gray-300 pt-2 text-[8px] leading-tight text-gray-500 uppercase">
                  <div className="flex justify-between">
                    <span>BATNA THRESHOLD:</span>
                    <span className="font-bold text-gray-800 select-all">
                      {activeDeal?.current_buyer_budget || 0} EUR
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span>VOLUME CONCESSION PROMISE:</span>
                    {activeDeal.negotiation_style === "INTEGRATIVE" ? (
                      <span className="font-bold text-emerald-700 text-right">
                        ACTIVE (-12% SCALE DISCOUNT SECURED)
                      </span>
                    ) : (
                      <span className="font-bold text-gray-400 text-right">
                        INACTIVE (TRANSACTIONAL ASSET PRICING)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* BLOCK 3: SPREAD & TRADING LEDGERS */}
              <div className="border border-[#111111] bg-white p-3 font-mono flex-1 flex flex-col min-h-0 min-h-[160px] overflow-hidden">
                <div className="flex justify-between items-center border-b border-[#111111] pb-1.5 mb-2 shrink-0">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">LOB BID / ASK SPREAD</span>
                  <span className="text-[10px] font-bold text-[#111111] bg-gray-50 border border-[#111111] px-1 select-all">
                    {spread}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 text-[9px]">
                  {/* BIDS */}
                  <div className="space-y-1">
                    <span className="font-bold text-gray-400 text-[8px] uppercase tracking-wider block">BUYER BIDS (LIMITS)</span>
                    {bids.map((b) => {
                      const isHumanBid = b.name === "Buyer (You)";
                      return (
                        <div key={b.id} className={`border p-1.5 flex justify-between items-center leading-normal ${
                          isHumanBid ? "border-amber-500 bg-amber-50/10 font-bold" : "border-blue-200 bg-blue-50/10"
                        }`}>
                          <div className="flex flex-col">
                            <span className="font-bold">{b.name}</span>
                            <span className="text-[7.5px] opacity-60">CAP: {b.hidden_floor_ceil} EUR</span>
                          </div>
                          <span className="font-bold border border-current px-1 bg-white">
                            {b.current_price_point ? `${b.current_price_point} EUR` : "NO OFFER"}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* ASKS */}
                  <div className="space-y-1">
                    <span className="font-bold text-gray-400 text-[8px] uppercase tracking-wider block">SELLER ASKS (RESERVATIONS)</span>
                    {asks.map((s) => {
                      const isHumanAsk = s.name === "Seller (You)";
                      return (
                        <div key={s.id} className={`border p-1.5 flex justify-between items-center leading-normal ${
                          isHumanAsk ? "border-amber-500 bg-amber-50/10 font-bold" : "border-gray-200 bg-gray-50/10"
                        }`}>
                          <div className="flex flex-col">
                            <span className="font-bold">{s.name}</span>
                            <span className="text-[7.5px] opacity-60">FLOOR: {s.hidden_floor_ceil} EUR</span>
                          </div>
                          <span className="font-bold border border-current px-1 bg-white">
                            {s.current_price_point ? `${s.current_price_point} EUR` : "NO OFFER"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* BLOCK 4: COMPACT SPECIFICATIONS PANEL */}
              <div className="border border-[#111111] bg-white p-3 font-mono shrink-0 flex flex-col h-[28%] min-h-[140px] overflow-hidden">
                <div className="flex justify-between items-center border-b border-[#111111] pb-1.5 mb-1.5 shrink-0">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">LOT SPECIFICATIONS</span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={handleDownloadPDF}
                      className="p-1 border border-gray-300 hover:bg-gray-100 bg-white text-[#111111] transition-all flex items-center justify-center shrink-0 cursor-pointer"
                      title="Download Contract as PDF"
                    >
                      <Download className="h-2.5 w-2.5" />
                    </button>
                    <button 
                      onClick={() => setIsSpecsExpanded(true)}
                      className="p-1 border border-gray-300 hover:bg-[#111111] hover:text-white bg-white text-[#111111] transition-all flex items-center justify-center shrink-0 cursor-pointer"
                      title="Expand Specifications to Full View"
                    >
                      <Maximize2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto font-mono text-[9px] leading-relaxed text-gray-700 select-text pr-1">
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

      {/* FULL SCREEN CONTRACT SPECIFICATIONS OVERLAY MODAL */}
      {isSpecsExpanded && activeDeal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 animate-fade-in backdrop-blur-sm">
          <div className="w-full max-w-4xl h-[85vh] bg-white border-2 border-[#111111] flex flex-col shadow-[8px_8px_0px_rgba(17,17,17,1)] overflow-hidden">
            {/* Modal Header */}
            <div className="h-14 bg-[#111111] text-white px-4 flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider shrink-0 border-b border-[#111111]">
              <div className="flex items-center gap-2">
                <Terminal className="h-4.5 w-4.5 text-white" />
                <span>LOT: {activeDeal.item_name} — FULL CONTRACT SPECIFICATIONS</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  className="border border-white p-2 bg-white text-[#111111] hover:bg-gray-100 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                  title="Download Contract as PDF"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setIsSpecsExpanded(false)}
                  className="border border-white p-2 bg-transparent text-white hover:bg-white/10 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                  title="Collapse to sidebar [ESC]"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 font-mono text-xs text-gray-800 leading-relaxed select-text bg-white space-y-4">
              <div className="max-w-3xl mx-auto space-y-2">
                {renderMarkdown(activeDeal.technical_specs)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="h-10 bg-white border-t border-[#111111] px-4 flex items-center justify-between shrink-0 font-mono text-[9px] text-gray-500 uppercase font-bold">
              <span>SECURITY AUTH: LEVEL 4 ROOT ESCROW OPERATOR</span>
              <span>ATIRAA PROCUREMENT CONTRACT INDEX PROTOCOL v1.0</span>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN MULTIMODAL INGESTION TERMINAL OVERLAY MODAL */}
      {isIngestionFullView && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 animate-fade-in backdrop-blur-sm">
          <div className="w-full max-w-5xl h-[85vh] bg-white border-2 border-[#111111] flex flex-col shadow-[8px_8px_0px_rgba(17,17,17,1)] overflow-hidden">
            {/* Modal Header */}
            <div className="h-14 bg-[#111111] text-white px-4 flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider shrink-0 border-b border-[#111111]">
              <div className="flex items-center gap-2">
                <Terminal className="h-4.5 w-4.5 text-white animate-pulse" />
                <span>MULTIMODAL INGESTION TERMINAL (FULL VIEW)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsIngestionFullView(false)}
                className="border border-white p-2 bg-white text-[#111111] hover:bg-gray-100 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                title="Collapse to sidebar [ESC]"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
            </div>
            
            {/* Modal Body */}
            {ingesting ? (
              /* PROGRESS SCANNER CONSOLE (MAXIMIZED VIEW) */
              <div className="flex-1 bg-black text-[#00ff00] p-10 font-mono text-xs leading-relaxed flex flex-col justify-center overflow-y-auto">
                <div className="max-w-2xl mx-auto w-full space-y-6 p-8 border border-[#00ff00]/30 bg-black shadow-[0_0_30px_rgba(0,255,0,0.07)]">
                  <div className="flex items-center gap-3 text-sm font-bold border-b border-[#00ff00]/30 pb-4 mb-4">
                    <span className="animate-ping h-2.5 w-2.5 bg-[#00ff00] rounded-none shrink-0"></span>
                    <span>INGESTION PROTOCOL INITIATED — RUNNING AUTOMATED EXTRACTION...</span>
                  </div>
                  
                  {/* Step 1: SCANNING */}
                  <div className="flex items-center justify-between p-2.5 border border-transparent hover:border-[#00ff00]/20 transition-all">
                    <span className={parseStep === "SCANNING" ? "animate-pulse font-bold text-sm" : ""}>
                      {parseStep === "SCANNING" ? "[◷]" : ["EXTRACTING", "RESEARCH", "SEEDING"].includes(parseStep) || parseStep === "" ? "[✔]" : "[ ]"} STAGE 1: SCANNING FILE METADATA & INTEGRITY
                    </span>
                    {parseStep === "SCANNING" && <span className="text-[10px] animate-pulse font-bold">PROCESSING...</span>}
                  </div>

                  {/* Step 2: EXTRACTING */}
                  <div className="flex items-center justify-between p-2.5 border border-transparent hover:border-[#00ff00]/20 transition-all">
                    <span className={parseStep === "EXTRACTING" ? "animate-pulse font-bold text-sm" : ""}>
                      {parseStep === "EXTRACTING" ? "[◷]" : ["RESEARCH", "SEEDING"].includes(parseStep) || parseStep === "" ? "[✔]" : "[ ]"} STAGE 2: FIELDS EXTRACTION (FAL.AI BAGEL VISION VLM)
                    </span>
                    {parseStep === "EXTRACTING" && <span className="text-[10px] animate-pulse font-bold">PROCESSING...</span>}
                  </div>

                  {/* Step 3: RESEARCH */}
                  <div className="flex items-center justify-between p-2.5 border border-transparent hover:border-[#00ff00]/20 transition-all">
                    <span className={parseStep === "RESEARCH" ? "animate-pulse font-bold text-sm" : ""}>
                      {parseStep === "RESEARCH" ? "[◷]" : ["SEEDING"].includes(parseStep) || parseStep === "" ? "[✔]" : "[ ]"} STAGE 3: TAVILY MARKET GROUNDING & SPEC BENCHMARKS
                    </span>
                    {parseStep === "RESEARCH" && <span className="text-[10px] animate-pulse font-bold">PROCESSING...</span>}
                  </div>

                  {/* Step 4: SEEDING */}
                  <div className="flex items-center justify-between p-2.5 border border-transparent hover:border-[#00ff00]/20 transition-all">
                    <span className={parseStep === "SEEDING" ? "animate-pulse font-bold text-sm" : ""}>
                      {parseStep === "SEEDING" ? "[◷]" : parseStep === "" ? "[✔]" : "[ ]"} STAGE 4: PG SEEDING & FASTINO PIONEER OBSERVABILITY TRACE
                    </span>
                    {parseStep === "SEEDING" && <span className="text-[10px] animate-pulse font-bold text-[#00ff00]">COMMIT...</span>}
                  </div>
                </div>
              </div>
            ) : (
              /* INPUT AND DRAG-DROP WORKSPACE (MAXIMIZED VIEW) */
              <form onSubmit={handleSubmitCombined} className="flex-1 flex flex-col min-h-0 bg-white">
                <div className="flex-1 flex p-6 gap-6 min-h-0">
                  {/* Left Column: Spacious Monospace Textarea */}
                  <div className="flex-1 flex flex-col gap-2 min-h-0">
                    <label className="font-mono text-[10px] font-bold text-gray-500 uppercase shrink-0">
                      PASTE MESSY RFQ EMAIL OR UNSTRUCTURED TEXT COPIES:
                    </label>
                    <textarea
                      value={rfqText}
                      onChange={(e) => setRfqText(e.target.value)}
                      placeholder="PASTE MESSY EMAIL CHAINS, PROCUREMENT PDF SPECIFICATIONS, REQ SHEETS OR DRAG FILES OVER..."
                      className="w-full flex-1 border border-[#111111] bg-white p-4 font-mono text-xs text-[#111111] focus:outline-none placeholder-gray-400 leading-relaxed resize-none focus:bg-white"
                      disabled={ingesting}
                    />
                  </div>
                  
                  {/* Right Column: High-Fidelity Drag and Drop + Action Panel */}
                  <div className="w-96 flex flex-col gap-4 border-l border-gray-200 pl-6 shrink-0 min-h-0 justify-between">
                    <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto">
                      <div className="flex flex-col gap-2 shrink-0">
                        <label className="font-mono text-[10px] font-bold text-gray-500 uppercase">
                          ATTACH DOCUMENTS OR IMAGES:
                        </label>
                        <div 
                          onClick={() => document.getElementById("rfq-file-input-full")?.click()}
                          className="border-2 border-dashed border-gray-300 hover:border-[#111111] bg-white hover:bg-gray-50 transition-all duration-150 p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px] shrink-0"
                        >
                          <Paperclip className="h-6 w-6 text-gray-400 mb-2 animate-pulse" />
                          <span className="font-mono text-[10px] font-bold text-[#111111] uppercase">
                            DRAG & DROP FILE OR CLICK TO BROWSE
                          </span>
                          <span className="font-mono text-[8px] text-gray-400 uppercase mt-1 leading-normal">
                            SUPPORTS PDF, DOCX, XLSX, TXT, PNG, JPG, JPEG, WEBP
                          </span>
                        </div>
                        <input
                          type="file"
                          id="rfq-file-input-full"
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".docx,.pdf,.xlsx,.xls,.txt,.png,.jpg,.jpeg,.webp,.gif"
                          disabled={ingesting}
                        />
                      </div>
                      
                      {selectedFile && (
                        /* FILE PREVIEW COMPONENT */
                        <div className="border border-[#111111] p-3 bg-white flex flex-col gap-2 shadow-[4px_4px_0px_rgba(17,17,17,1)] shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white border border-[#111111] flex items-center justify-center shrink-0">
                              {(() => {
                                const ext = selectedFile.name.split(".").pop()?.toLowerCase();
                                if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "")) {
                                  return <FileImage className="h-6 w-6 text-[#111111]" />;
                                }
                                if (["xlsx", "xls"].includes(ext || "")) {
                                  return <FileSpreadsheet className="h-6 w-6 text-[#111111]" />;
                                }
                                return <FileText className="h-6 w-6 text-[#111111]" />;
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-[10px] font-bold text-[#111111] truncate uppercase">
                                {selectedFile.name}
                              </div>
                              <div className="font-mono text-[8px] text-gray-400 uppercase mt-0.5">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(null);
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 font-mono text-xs font-bold transition-all hover:bg-gray-50 border border-transparent hover:border-gray-200 cursor-pointer"
                              title="Remove attached file"
                            >
                              [X]
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Primary Trigger Ingest */}
                    <div className="shrink-0 pt-4 border-t border-gray-100">
                      <button
                        type="submit"
                        disabled={ingesting || (!rfqText.trim() && !selectedFile)}
                        className="w-full bg-[#111111] text-white font-mono text-xs font-bold uppercase py-3.5 hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_rgba(0,0,0,0.15)] cursor-pointer"
                      >
                        <Terminal className="h-4 w-4 text-white shrink-0 animate-pulse" />
                        <span>INGEST & SEED POSTGRES ROOM</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
            
            {/* Modal Footer */}
            <div className="h-10 bg-white border-t border-[#111111] px-4 flex items-center justify-between shrink-0 font-mono text-[9px] text-gray-500 uppercase font-bold">
              <span>SECURITY AUTH: LEVEL 4 ROOT ESCROW OPERATOR</span>
              <span>ATIRAA MULTIMODAL INBOUND PARSER PIPELINE v1.0</span>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center font-mono text-xs uppercase text-[#111111]">
        <span>Loading ATIRAA Portal...</span>
      </div>
    );
  }

  return <HomeContent />;
}

