# ATIRAA: Autonomous B2B Procurement, Escrow & Multi-Variable Settlement Platform

ATIRAA is a production-grade, dual-perspective bilateral B2B procurement, escrow, and automated contract settlement platform. Designed for high-volume enterprise supply chains, ATIRAA leverages advanced **autonomous multi-agent negotiation loops**, **unstructured multi-modal RFQ ingestion with visual VLM reasoning**, **live market search grounding**, and a **real-time LLM observability dashboard powered by Fastino and Pioneer**.

Enterprise operators can view active negotiation pipelines, toggle strategic posturing (Transactional Distributive vs. Collaborative Integrative), intervene via a mathematical **Tactical Cognitive Response Board**, handle deadlocks with administrative overrides, and export legally binding vector PDF escrow contracts.

![Main Screen for Agents to dicuss & Negotiate](https://github.com/WahidSaeed/MunichAIHackathon/blob/main/atiraa_main_screen_agent_negotiation.png)

![LOT Full Contract Specs](https://github.com/WahidSaeed/MunichAIHackathon/blob/main/lot_full_contract_specs.png)

![Agents Activity Dashboard](https://github.com/WahidSaeed/MunichAIHackathon/blob/main/atiraa_agents_dashboard.png)

![Inventory Catalogs for Buyer Agents](https://github.com/WahidSaeed/MunichAIHackathon/blob/main/inventory_catalogs.png)

---

## 🏗️ System Architecture

The following diagram illustrates the lifecycle of a B2B procurement lot, from multi-modal ingestion to bilateral agent-led settlement, human operator CLI intervention, and real-time observability tracking:

```mermaid
graph TD
    %% Ingestion Layer
    subgraph Ingestion ["1. Multi-Modal Ingestion"]
        RFQ_Text["Unstructured Text RFQ<br/>(Pasted Emails / Texts)"] --> Inbound["Unified Ingestion Box"]
        RFQ_File["RFQ Documents & Images<br/>(PDF, PNG, JPG, Docx)"] --> DragDrop["Drag & Drop Catch Overlay"]
        DragDrop --> Inbound
    end

    %% Parsing & Grounding Layer
    subgraph Parsing ["2. Extraction & Live Grounding"]
        Inbound --> |Multi-part Form / Text| Router{"Parser Router"}
        Router --> |Text Input| Fastino["Fastino Ingestion Parser<br/>(Gemini-2.5-Flash Extractions)"]
        Router --> |Image / Document| VLM["Fal.ai Multimodal VLM<br/>(Bagel-Understand / Any-LLM)"]
        
        Fastino --> Tavily["Tavily Live Pricing Grounding<br/>(Search Benchmarks & Costs)"]
        VLM --> Tavily
    end

    %% State Layer
    subgraph Storage ["3. PostgreSQL Persistence"]
        Tavily --> Seed["Database Seeder Engine"]
        Seed --> |Create Lot & Seed Participants| PG[("PostgreSQL Database<br/>(ATIRAA_postgres_db)")]
    end

    %% Core Settlement Layer
    subgraph Settlement ["4. Multi-Agent Negotiation & Escrow"]
        PG --> |Fetch Deals / Active Timeline| WS["Next.js Workspace UI"]
        WS --> |Trigger Step TURN| StepController{"FastAPI Settlement Engine"}
        StepController --> |Active Chat History + Private Bounds| AgentBuyer["AI Buyer Agent<br/>(Logical Bid Bounds)"]
        StepController --> |Active Chat History + Private Bounds| AgentSeller["AI Seller Agent<br/>(Logical Floor Bounds)"]
        
        AgentBuyer --> MatchCalc{"Bilateral Match Calculator"}
        AgentSeller --> MatchCalc
        
        MatchCalc --> |"Bid >= Ask"| Match["[MATCHED]<br/>Settle Contract at Ask Price"]
        MatchCalc --> |"Spread <= 50 EUR"| SoftComp["[MATCHED COMPROMISE]<br/>Settle at Midpoint"]
        MatchCalc --> |"Saturated Bounds"| Deadlock["[DEADLOCK]<br/>Halt Auto-Negotiation"]
    end

    %% Human-In-The-Loop Layer
    subgraph Intervention ["5. Human-In-The-Loop Overrides"]
        Deadlock --> Alert["Visual Warning Ping (Roster & Workspace)"]
        Alert --> RespBoard["Tactical Cognitive Response Board<br/>(Calculated Bid Suggestions)"]
        Alert --> CLI["Operator CLI Override Console"]
        
        RespBoard --> |"Click Counter-Proposal"| StepController
        CLI --> |"approve (Budget +100)"| PG
        CLI --> |"terminate"| PG
    end

    %% Observability Layer
    subgraph Observability ["6. Telemetry & Continuous Tuning"]
        StepController --> |Log Real-Time Trace| Pioneer["Fastino Pioneer Telemetry Stream"]
        Pioneer --> |Fetch Stream Events| ObsPanel["Real-Time Observability Panel"]
        Pioneer --> |Deadlock Detected| LoRA["Continuous Learning Adapter Trigger<br/>(Simulated Backpropagation & Tuning)"]
        LoRA --> ObsPanel
    end

    style Inbound fill:#111111,stroke:#ffffff,stroke-width:2px,color:#ffffff
    style PG fill:#22c55e,stroke:#111111,stroke-width:2px,color:#ffffff
    style MatchCalc fill:#eab308,stroke:#111111,stroke-width:2px,color:#000000
    style Match fill:#22c55e,stroke:#111111,stroke-width:2px,color:#ffffff
    style SoftComp fill:#3b82f6,stroke:#111111,stroke-width:2px,color:#ffffff
    style Deadlock fill:#ef4444,stroke:#111111,stroke-width:2px,color:#ffffff
    style ObsPanel fill:#111111,stroke:#a855f7,stroke-width:2px,color:#ffffff
```

---

## 🛠️ Tech Stack & Key Technologies

### **Backend Frameworks & AI Tooling**
* **FastAPI (Python 3.14 compatible)**: Direct, high-performance asynchronous REST API routing and CORS headers gateway.
* **SQLAlchemy & Psycopg v3**: Direct PostgreSQL connection pooling with native Binary-compatible drivers, executing non-blocking transactions.
* **Google GenAI SDK (`Gemini-2.5-Flash`)**: Powers task-specific unstructured text extraction, B2B bilateral bargaining, and cognitive strategic logic under strict Pydantic schemas.
* **Fal.ai client SDK (`fal-ai/bagel/understand` / `any-llm`)**: Advanced Multimodal Visual Language Models (VLM) which analyze uploaded component schematics or spec sheets to extract technical parameters and budget thresholds.
* **Tavily Search API**: Live index grounding providing market should-cost metrics and replacement cost indices.

### **Frontend & Visual Architecture**
* **Next.js 15 & React 19**: Modernized React framework compiling fully optimized static bundles with hydration mismatch guards.
* **Vanilla CSS / Tailwind CSS v4.0 (Beta 1)**: Modern styling framework with a customized monochrome, minimalist, 0px border-radius design system.
* **Lucide React Icons**: Unified monospace iconography.
* **Interactive Flexbox Viewports**: Implemented responsive, internalized scrolling mechanics preventing vertical overflow beyond the viewport height (`h-screen min-h-0`).

---

## 📂 Project Directory Structure

```text
ATIRAA-procurement/
├── backend/
│   ├── database.py       # DB Engine, Session Local context & pool configuration
│   ├── models.py         # SQLAlchemy schemas (Deal, Participant, Message, Inventory)
│   ├── agents.py         # Google GenAI, Fal.ai VLM & Tavily search scripts
│   ├── main.py           # FastAPI server routes, Settlement Engine & Pioneer Stream
│   └── requirements.txt  # Core python packages list
├── frontend/
│   ├── package.json      # React 19, Next.js 15 & Tailwind v4.0 configs
│   ├── next.config.js    # Static asset tracing & workspace boundary options
│   └── src/app/
│       ├── page.tsx      # Main Bilateral Room dashboard & Inbound Terminal
│       ├── layout.tsx    # Plus Jakarta Sans & Inter professional typography setups
│       ├── globals.css   # Custom Scrollbars & flat borders system
│       └── observability/# Dedicated standalone Fastino Pioneer monitoring console
├── reset_db.py           # Database migration & dual-perspective lot seeder
├── test_api.py           # Comprehensive end-to-end integration test suite
└── README.md             # This technical system manual
```

---

## 🚀 Installation & Setup Instructions

### **Prerequisites**
Before launching the services, ensure you have the following installed on your system:
* **Docker Desktop**: For running the PostgreSQL instance.
* **Python**: Python 3.10 or higher (Python 3.14 recommended).
* **Node.js**: Node 18 or higher (Node 22+ recommended) and `npm`.

---

### **1. Spin Up PostgreSQL Docker Database**
ATIRAA expects a persistent PostgreSQL database instance. Spin up the dedicated alpine container:
```bash
docker run -d \
  --name ATIRAA_postgres_db \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ATIRAA_procurement \
  postgres:15-alpine
```

---

### **2. Setup and Configure Backend**

1. Navigate to the root directory and create a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
2. Install the backend dependencies:
   ```bash
   pip install --upgrade pip
   pip install -r backend/requirements.txt
   ```
3. Configure the environment secrets. Create a `.env` file in the **root** folder (which is read by both the backend and our reset script):
   ```ini
   # Database URI targeting our container
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ATIRAA_procurement

   # API Gateways (Required for live executions)
   GEMINI_API_KEY=your_google_gemini_api_key
   TAVILY_API_KEY=your_tavily_api_key
   FAL_KEY=your_fal_ai_api_key
   ```

4. **Initialize and Seed the Tables**:
   Execute the migration and seeder script. This drops any stale tables, compiles current columns (including `image_url` and `negotiation_style`), queries live benchmarks via Tavily, and pre-seeds standard bilateral lot workspaces:
   ```bash
   python3 reset_db.py
   ```

5. **Start the FastAPI Backend Server**:
   ```bash
   uvicorn backend.main:app --host 0.0.0.0 --port 8080 --reload
   ```
   The backend API will be live on `http://localhost:8080`.

---

### **3. Setup and Configure Frontend**

1. Open a new terminal tab and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Clean cache and spin up the Next.js development server:
   ```bash
   rm -rf .next
   npm run dev -- -p 3001
   ```
   The application dashboard will compile and be live on `http://localhost:3001`.

---

## 🧪 Automated Testing

We have built a comprehensive, end-to-end Python integration test suite `test_api.py` that bypasses the client UI and tests database queries, multi-agent negotiation turns, match conditions, soft compromises, and administrative overrides directly against the API:

To run the test suite (ensure backend server is active):
```bash
python3 test_api.py
```

### **Expected Terminal Output**:
```text
--------------------------------------------------
STARTING B2B PROCUREMENT PLATFORM INTEGRATION TEST
--------------------------------------------------

[TEST 1] Fetching initial deals list...
Success. Active deals retrieved: 6

[TEST 2] Creating a new procurement lot for Inconel 718 Blades...
Success. Server Response: {"status": "SUCCESS", "deal_id": "830eacb9-903b-4f50-bf83-936c8c8a73fb"}

[TEST 3] Fetching updated deals list...
Success. Active deals: 7

[TEST 4] Triggering STEP_EXCHANGE_ROUND (Round 1 negotiation)...
Success. Step execution result: {"status": "ACTIVE", "deal_status": "ACTIVE"}

[TEST 5] Checking room log timeline post-negotiation round...
Status: ACTIVE
Total messages in timeline: 4

=== RECENT TRANSCRIPTS ===
[System Settlement | SYSTEM]: BUYER-PERSPECTIVE EXCHANGE ARMED. YOU ARE THE BUYER (Counter-Offers trigger Seller Agent turns).
[Seller Agent | SELLER]: [Offer: 920 EUR | 1Yr Warranty | Net 30 | SLA: 99.0%] Our initial offer for this lot is 920 EUR.
==========================

[TEST 6] Testing administrative operator override ('approve' command)...
Success. Operator Response status: {"status": "SUCCESS", "deal_status": "ACTIVE"}

--------------------------------------------------
ALL API LOGIC INTEGRITY TESTS PASSED SUCCESSFULLY!
--------------------------------------------------
```

---

## 📡 Core API REST Documentation

| Endpoint | Method | Payload Description | Success Response Sample |
| :--- | :--- | :--- | :--- |
| `/api/deals` | `GET` | Fetches all seeded and ingested deal lots, participants, and trade messages. | `[{"id": "uuid", "item_name": "Inconel Blades", "status": "ACTIVE", "participants": [...], "messages": [...]}]` |
| `/api/deals/create` | `POST` | Manually creates a new B2B procurement lot. Starts live Tavily research immediately. | `{"status": "SUCCESS", "deal_id": "uuid"}` |
| `/api/deals/ingest` | `POST` | Ingests unstructured RFQs (via text or Fal.ai pre-parsed vision models) and auto-seeds the postgres records. | `{"status": "SUCCESS", "deal_id": "uuid"}` |
| `/api/deals/ingest-file` | `POST` | Multi-part Form upload accepting PDFs or PNG/JPG images. Routes images through Fal.ai VLMs for full structured mapping. | `{"status": "SUCCESS", "deal_id": "uuid"}` |
| `/api/deals/update-style` | `POST` | Swaps the negotiation strategy (`"DISTRIBUTIVE"` vs `"INTEGRATIVE"`) for a specific deal dynamically. | `{"status": "SUCCESS", "style": "INTEGRATIVE"}` |
| `/api/negotiate/step` | `POST` | Invokes the bilateral settlement engine, forcing whichever agent is currently on turn to submit a bid. | `{"status": "SUCCESS", "deal_status": "ACTIVE"}` |
| `/api/negotiate/message` | `POST` | Intercepts standard free-text chat or clicks on the Strategic Response board. Triggers downstream agent response turns. | `{"status": "SUCCESS", "deal_status": "ACTIVE"}` |
| `/api/observability/pioneer-stream`| `GET` | Pulls live transaction trace statistics and returns anomaly block logs during deadlocks. | `{"logs": [...], "anomalies": [...], "learning_adapters": true}` |

---

## 🧠 Strategic Sourcing Dimensions (Distributive vs. Integrative)

ATIRAA features two mathematically modeled, completely separate strategic bargaining postures:

### **1. Distributive Strategy (Transactional & Value-Capturing)**
* **Posture**: Aggressive, Zero-Sum, Win-Lose bargaining focusing solely on raw pricing margins.
* **Mechanics**: Agents use their alternative **BATNA** (Best Alternative to a Negotiated Agreement) limits, competitive benchmarks, and unyielding leverage to force concessions.
* **Locked Variables**: Under Distributive mode, other sourcing dimensions are locked to the following rigid standard terms:
  * **Warranty**: 1 Year Standard
  * **Payment Terms**: Net 30 Window
  * **SLA Uptime**: 99.0% Availability

---

### **2. Integrative Strategy (Collaborative & Value-Creating)**
* **Posture**: Creative, Multi-Variable, Win-Win bargaining where agents trade concessions along 5 dimensions to unblock deadlocks.
* **Sourcing Dimensions**:
  1. **Base Price (EUR)**: Adjusted fluidly in exchange for complementary contract benefits.
  2. **Extended Warranty (1 to 5 Years)**: Seller grants extended warranty in exchange for higher prices.
  3. **Payment Window (Net 30, Net 45, Net 60, Net 90)**: Flexible cash-flow adjustments.
  4. **SLA Reliability (99.0% to 99.9% Uptime)**: Premium uptime guarantees.
  5. **Scale Discount (Concession Rates)**: Activating bulk or volume discounts (such as a `-12% Concession` pricing factor).
* **TCO Chip Formatting**: Integrative offers are automatically prepended with standardized parameter tags `[Offer: Price EUR | WarrantyYr | Payment | SLA: uptime%]`. The frontend parses these tags, hides the bracketed text, and displays a clean visual grid of **Interactive Parameter Chips** right in the chat room.

---

## 📊 Real-Time Fastino Pioneer Observability & LoRA Tuning

The `/observability` module simulates a high-fidelity continuous learning loop utilizing **Fastino task-routing** and **Pioneer log tracing**:

* **Low-Latency Metrics**: Panel C displays comparative statistics. Fastino optimizes inference latencies down to **12.4 ms** (representing a `-95.58%` reduction compared to heavy, generic LLM models) with an enterprise accuracy rate of **99.42%**.
* **Anomaly Interception**: Whenever an active room hits a **DEADLOCK** status (e.g. buyer hit budget cap and seller refuses to drop prices), the telemetry stream (`GET /api/observability/pioneer-stream`) returns an active anomaly flag:
  ```json
  {
    "is_anomaly": true,
    "automated_lora_trigger": true,
    "optimization_route": "SLM-NEGOTIATION-ADAPTER-V2"
  }
  ```
  The observability board immediately catches this flag, flashes a visual red alert, and starts a live terminal output stream simulating continuous-epoch training gradients representing the fine-tuning of local LoRA weights.

---

## 👩‍⚖️ Jury Evaluation Step-by-Step Walkthrough

To experience the complete power of the ATIRAA platform during your jury evaluation, follow these guided steps:

### **Step 1: Paste a Messy RFQ Email**
1. Copy the following unstructured, messy email snippet:
   ```text
   Hi Procurement, we need to order an industrial CNC Spindle Assembly. Must support water-cooling, tool interface of BT30, and max RPM of 24000. Under our capital expenditure rules we have a absolute ceiling of 1650 EUR for this unit. Please research pricing and set up the negotiation room. Best, Abdul.
   ```
2. On the Left Sidebar, paste it into the **Monospace Inbound Terminal Box**.
3. Click **INGEST & SEED POSTGRES**.
4. **Observe**: The terminal instantly calls Fastino and Tavily, extracts the target parameters, runs live Google-grounded pricing checks, creates the deal record, auto-seeds participants, and adds a subchannel named `# cnc-spindle-assembly` under `BUYER CHANNELS` automatically!

### **Step 2: Swap Sourcing Styles & Auto-Negotiate**
1. Click your newly created `# cnc-spindle-assembly` channel.
2. In the Left Sidebar, note that the Sourcing Style defaults to **DISTRIBUTIVE (Win-Lose)**. 
3. Click the **STEP NEGOTIATION ROUND** button 2 or 3 times. Observe the distributive, rigid bargaining exchange.
4. Now, click **INTEGRATIVE (Win-Win)** on the left sidebar.
5. Click **STEP NEGOTIATION ROUND** again. Observe that the chat dynamically adapts. The negotiations now trade concessions based on Warranties, Net 60 payment terms, and 99.9% SLAs, visualised through premium monochrome **parameter chips**!

### **Step 3: Leverage the Tactical Cognitive Response Board**
1. Expand the **Tactical Cognitive Response Board** (click the `BrainCircuit` header icon directly above the input box).
2. Observe the calculated, real-time bid options dynamically formatted (e.g., `COMPROMISE @ 1420 EUR`, `SLA PREMIUM @ 1580 EUR`, `STAND FIRM`).
3. Click any suggest button. Watch as it instantly dispatches a structured proposal into the timeline and triggers an immediate counter-concession turn from the AI Agent.

### **Step 4: Check Live Observability & Deadlocks**
1. Click **STEP NEGOTIATION ROUND** until the participants saturate their limits and trigger a **DEADLOCK** (indicated by an active alert on the roster and a red pulsing warning badge).
2. Click the **Observability** menu button in the top-right header.
3. Observe **Panel B** displaying the high-density anomaly traceback, and watch **Panel C**'s console light up, streaming live backpropagation learning gradients to represent the auto-triggered LoRA fine-tuning process.
4. Click **Return to Workspace**.
5. In the CLI Input bar, type `/approve` to administratively increase the buyer's cap by `+100` EUR, and watch the deadlock state resolve!

### **Step 5: Export Legal Vector PDF**
1. Click the **Maximize Contract [Square Icon]** inside the right-hand sidebar.
2. Review the structured, fullscreen markdown specifications.
3. Click the **Download Vector PDF** icon.
4. Review the pixel-perfect, double-bordered legal contract print layout, complete with your transaction hashes and the **ATIRAA Escrow Stamp**!

---

## 📄 License & Intellectual Property
ATIRAA is developed as a high-fidelity enterprise reference architecture. All codebases, database systems, visual layout definitions, and multi-agent settlement engines are the sole intellectual property of the engineering team. For support or custom continuous fine-tuning adapters integrations, contact your ATIRAA enterprise operations lead.
