import os
import re
import sys
import uuid
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from urllib.parse import urlparse, urlunparse

# Add root to python path for importing database and models
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Load environment variables
load_dotenv(dotenv_path="backend/.env", override=True)

from backend.database import engine, Base, SessionLocal
from backend.models import InventoryItem

# Define the 100 items
ITEMS = [
    # CATEGORY 1: HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS (ITEMS 1–20)
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Variable Displacement Axial Piston Pump",
        "b2b_code": "PUMP-AX-V70-H4",
        "tier": "1,200 EUR - 3,500 EUR",
        "specs": "Max operating pressure: $P_{\\text{max}} = 350 \\text{ Bar}$, Max volumetric displacement: $V_{\\text{disp}} = 70 \\text{ cc/rev}$, Control: Electro-hydraulic load-sensing."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Double-Acting Hydraulic Cylinder",
        "b2b_code": "CYL-HYD-DA-100",
        "tier": "900 EUR - 2,200 EUR",
        "specs": "Bore: $D_{\\text{bore}} = 100 \\text{ mm}$, Stroke: $L_{\\text{stroke}} = 500 \\text{ mm}$, Medium: Mineral oil based hydraulic fluid matching ISO VG 46."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Proportional Directional Control Valve",
        "b2b_code": "VALVE-PROP-DIR-10",
        "tier": "750 EUR - 1,800 EUR",
        "specs": "Max flow rate: $Q_{\\text{max}} = 120 \\text{ L/min}$, Control voltage: $V_{\\text{coil}} = 24 \\text{ V DC}$, Hysteresis: $\\le 1.5\\%$."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "High-Pressure Hydraulic Accumulator (Bladder Type)",
        "b2b_code": "ACCUM-BLAD-20L",
        "tier": "1,100 EUR - 2,900 EUR",
        "specs": "Nominal volume: $V_{\\text{nom}} = 20 \\text{ L}$, Pre-charge pressure: $P_0 = 150 \\text{ Bar}$, Shell material: High-tensile forged carbon steel."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Hydraulic Gear Motor",
        "b2b_code": "MOTOR-HYD-GR45",
        "tier": "550 EUR - 1,400 EUR",
        "specs": "Max speed: $n_{\\text{limit}} = 3,000 \\text{ RPM}$, Output torque: $\\tau_{\\text{max}} = 250 \\text{ Nm}$ at operating pressure $P = 210 \\text{ Bar}$."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "High-Pressure Duplex Oil Filter System",
        "b2b_code": "FILT-DUP-HP150",
        "tier": "650 EUR - 1,500 EUR",
        "specs": "Absolute filtration rating: $\\beta_{10} \\ge 200$, Nominal flow rate: $Q_{\\text{nom}} = 150 \\text{ L/min}$, Max design pressure: $P_{\\text{design}} = 420 \\text{ Bar}$."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Hydraulic Power Unit (HPU) Micro-Pack",
        "b2b_code": "HPU-MICRO-5HP",
        "tier": "3,000 EUR - 7,500 EUR",
        "specs": "Reservoir volume: $V_{\\text{tank}} = 40 \\text{ L}$, Motor rating: $P_{\\text{motor}} = 3.7 \\text{ kW}$, Flow: $Q = 12 \\text{ L/min}$ at $P = 200 \\text{ Bar}$."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Hydraulic Solenoid Sandwiched Block",
        "b2b_code": "VALVE-MAN-SAND10",
        "tier": "400 EUR - 950 EUR",
        "specs": "Multi-station modular layout: ISO 4401 Size 03, Pilot signal interface: $24 \\text{ V DC}$ with integrated LED indicator couplers."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Radial Piston Hydraulic Motor",
        "b2b_code": "MOTOR-HYD-RAD500",
        "tier": "4,500 EUR - 12,000 EUR",
        "specs": "High torque output: $\\tau = 8,500 \\text{ Nm}$ at operating pressure $P = 315 \\text{ Bar}$, Specific displacement: $V_{\\text{disp}} = 500 \\text{ cc/rev}$."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Hydraulic Oil Cooler with AC Fan",
        "b2b_code": "COOL-HYD-AC400",
        "tier": "850 EUR - 2,100 EUR",
        "specs": "Heat dissipation capacity: $P_{\\text{cool}} = 45 \\text{ kW}$ at temperature differential $\\Delta T = 40 \\text{ }^{\\circ}\\text{C}$, Fan voltage: $3\\text{-Phase } 400\\text{ V AC}$."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Hydraulic Flow Control Valve (Pressure Compensated)",
        "b2b_code": "VALVE-FLOW-PC16",
        "tier": "350 EUR - 780 EUR",
        "specs": "Nominal size: DN 16, Regulated flow range: $Q = 0.5 \\text{ to } 80 \\text{ L/min}$, Fluid viscosity range: $10 \\text{ to } 500 \\text{ mm}^2/\\text{s}$."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Digital Hydraulic Pressure Switch",
        "b2b_code": "SENS-PRES-DIGI400",
        "tier": "280 EUR - 650 EUR",
        "specs": "Pressure range: $0 \\text{ to } 400 \\text{ Bar}$, Accuracy: $\\le \\pm 0.5\\% \\text{ FS}$, Output signals: Dual PNP transistors plus $4\\text{-}20 \\text{ mA}$ output."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Heavy-Duty Rotary Joint (Hydraulic Union)",
        "b2b_code": "ROUT-JT-HYD4WAY",
        "tier": "1,400 EUR - 3,200 EUR",
        "specs": "Channels layout: 4 independent paths, Max rotational velocity: $n_{\\text{limit}} = 250 \\text{ RPM}$, Port sizing: $G 1/2 \\text{ BSPP}$ female."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Multi-Section Hydraulic Gear Pump Array",
        "b2b_code": "PUMP-GR-MULT-V3",
        "tier": "950 EUR - 2,400 EUR",
        "specs": "Configuration: Triple-stage inline, Displacement array: $V = [45, 32, 16] \\text{ cc/rev}$, Inter-stage flange coupling: SAE 2-bolt standard."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Pilot Operated Pressure Relief Valve",
        "b2b_code": "VALVE-HP-RELIEF-32",
        "tier": "600 EUR - 1,350 EUR",
        "specs": "Nominal diameter: DN 32, Adjustable crack pressure range: $P = 50 \\text{ to } 350 \\text{ Bar}$, Max flow capability: $Q = 650 \\text{ L/min}$."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "High-Pressure Hydraulic Swivel Joint",
        "b2b_code": "SWIV-HYD-HP16",
        "tier": "450 EUR - 980 EUR",
        "specs": "Nominal pressure rating: $P = 420 \\text{ Bar}$, Dynamic angular rotation: $360\\text{ }^{\\circ}$ continuous, Seals: Viton with backup PTFE support rings."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Heavy-Duty Hydraulic Hose Assembly (Spiral Steel Wire)",
        "b2b_code": "HOSE-HYD-SP6-DN25",
        "tier": "180 EUR - 450 EUR",
        "specs": "Size: DN 25 (1 inch), Reinforcement: 6 high-tensile steel wire spirals, Working pressure: $P_{\\text{work}} = 450 \\text{ Bar}$."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Water-Glycol Resistant Hydraulic Cylinder Seals Set",
        "b2b_code": "SEAL-KIT-HFC100",
        "tier": "150 EUR - 380 EUR",
        "specs": "Nominal cylinder bore fit: $D = 100 \\text{ mm}$, Fluid compatibility: ISO HFC fluid, Temperature range: $-30 \\text{ }^{\\circ}\\text{C} \\text{ to } +120 \\text{ }^{\\circ}\\text{C}$."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Hydraulic Ball Valve (Carbon Steel)",
        "b2b_code": "VALVE-BALL-HP50",
        "tier": "220 EUR - 580 EUR",
        "specs": "Size: G 2 inch thread connection, Housing rating: $P = 315 \\text{ Bar}$, Seat materials: POM with Nitrile elastomer backup rings."
    },
    {
        "category": "HYDRAULIC SYSTEMS & HIGH-PRESSURE COMPONENTS",
        "item_name": "Hydraulic Inline Flowmeter (Turbine Type)",
        "b2b_code": "FLOW-HYD-TURB100",
        "tier": "1,200 EUR - 2,800 EUR",
        "specs": "Sensed range: $Q = 10 \\text{ to } 250 \\text{ L/min}$, Frequency signal output: Square wave $24 \\text{ V DC}$ pulses, Viscosity rating: $10 \\text{ to } 100 \\text{ cSt}$."
    },

    # CATEGORY 2: PNEUMATICS & MOTION CONTROL (ITEMS 21–40)
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Double-Acting Pneumatic Cylinder",
        "b2b_code": "ACTUATOR-PNEU-B12",
        "tier": "350 EUR - 950 EUR",
        "specs": "Bore size: $D = 100 \\text{ mm}$, Stroke: $L = 450 \\text{ mm}$, Magnetic piston ring: Integrated for limit switch sensor band tracking."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Solenoid Valve Manifold Block",
        "b2b_code": "VALVE-MAN-8WAY",
        "tier": "600 EUR - 1,400 EUR",
        "specs": "Configuration: 8-way configurable $5/2$ bi-stable solenoid layout, Communication: IO-Link integrated fieldbus, Voltage: $24 \\text{ V DC}$."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "High-Precision Pneumatic Regulator",
        "b2b_code": "REG-PNEU-PREC08",
        "tier": "180 EUR - 420 EUR",
        "specs": "Inlet pressure range: $P_{\\text{in}} = 0.5 \\text{ to } 10 \\text{ Bar}$, Output regulation: $P_{\\text{out}} \\pm 0.05 \\text{ Bar}$, Connection: $G 1/4$ female threads."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Heavy-Duty Pneumatic Rotary Actuator",
        "b2b_code": "ROT-ACT-PNEU180",
        "tier": "450 EUR - 1,100 EUR",
        "specs": "Rotation angle: $180\\text{ }^{\\circ}$ rack and pinion style, Output torque: $\\tau = 120 \\text{ Nm}$ at operating pressure $P = 6 \\text{ Bar}$."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Desiccant Compressed Air Dryer",
        "b2b_code": "DRYER-PNEU-DES50",
        "tier": "2,200 EUR - 5,600 EUR",
        "specs": "Flow capacity: $Q = 50 \\text{ Nm}^3/\\text{hr}$, Pressure dewpoint performance: $T_{\\text{dp}} = -40 \\text{ }^{\\circ}\\text{C}$, Regenerative cycle style: Heatless twin-tower."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Pneumatic Rod Lock Safety Device",
        "b2b_code": "LOCK-ROD-PNEU25",
        "tier": "300 EUR - 720 EUR",
        "specs": "Matching cylinder rod size: $d = 25 \\text{ mm}$, Clamping force rating: $F_{\\text{lock}} = 4,500 \\text{ N}$ at $P = 0 \\text{ Bar}$ (spring-clamped, pneumatic release)."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Vacuum Ejector Generator (Multi-Stage)",
        "b2b_code": "VAC-EJECT-MS30",
        "tier": "250 EUR - 580 EUR",
        "specs": "Vacuum level: $V = -85 \\text{ kPa}$ max, Suction rate capacity: $Q = 140 \\text{ Nl/min}$, Integrated air-saving regulation solenoid valves."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Pneumatic Diaphragm Pump (AODD)",
        "b2b_code": "PUMP-PNEU-DIA50",
        "tier": "1,100 EUR - 2,800 EUR",
        "specs": "Fluid ports sizing: $2 \\text{ inch}$ ANSI standard flanges, Max fluid delivery rate: $Q_{\\text{fluid}} = 550 \\text{ L/min}$, Material: Stainless steel 316."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "High-Speed Pneumatic Gripper (2-Jaw Parallel)",
        "b2b_code": "GRIP-PNEU-PAR32",
        "tier": "400 EUR - 920 EUR",
        "specs": "Jaw stroke limit: $s = 16 \\text{ mm}$ per jaw side, Gripping force sum: $F = 380 \\text{ N}$ at operating pressure $P = 6 \\text{ Bar}$."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Pneumatic Lubricator & Filter Combination (FRL Unit)",
        "b2b_code": "FRL-UNIT-DN25",
        "tier": "280 EUR - 620 EUR",
        "specs": "Nominal size: DN 25, Nominal flow rating: $Q_{\\text{nom}} = 3,500 \\text{ Nl/min}$, Micro-filter element rating: $\\beta = 5 \\text{ }\\mu\\text{m}$."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Digital Electropneumatic Regulator",
        "b2b_code": "REG-E-PNEU420",
        "tier": "520 EUR - 1,200 EUR",
        "specs": "Electronic command: $4\\text{-}20 \\text{ mA}$ control signal, Regulated pressure range: $P = 0.05 \\text{ to } 9 \\text{ Bar}$, Accuracy: $\\le \\pm 1\\% \\text{ FS}$."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Pneumatic Exhaust Silencer (Sintered Bronze)",
        "b2b_code": "SIL-PNEU-DN50",
        "tier": "45 EUR - 120 EUR",
        "specs": "Thread size: G 2 inch male BSPP, Noise damping efficiency: $\\Delta L_W \\ge 35 \\text{ dB(A)}$, Core element: 50 micron sintered bronze mesh."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Pneumatic Solenoid Valve (Namur Standard)",
        "b2b_code": "VALVE-PNEU-NAM52",
        "tier": "110 EUR - 280 EUR",
        "specs": "Function configuration: $5/2$ bi-stable standard, Interface mount: ISO standard VDI/VDE 3845, Control voltage: $24 \\text{ V DC}$ coil pack."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Rotary indexing table (Pneumatic drive)",
        "b2b_code": "INDEX-PNEU-TAB4",
        "tier": "2,500 EUR - 5,800 EUR",
        "specs": "Divisible step indexing count: 4, 6, 8, 12 positions, Load capacity: $m_{\\text{load}} = 150 \\text{ kg}$, Positioning accuracy: $\\pm 0.05 \\text{ mm}$."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Quick Exhaust Pneumatic Valve",
        "b2b_code": "VALVE-PNEU-QEX20",
        "tier": "80 EUR - 190 EUR",
        "specs": "Body thread size: $G 3/4$ female threads, Nominal flow output capability: $Q = 2,100 \\text{ Nl/min}$, Seat sealing element: Polyurethane."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Multi-Tube Pneumatic Umbilical Cord",
        "b2b_code": "TUBE-UMB-PNEU8",
        "tier": "150 EUR - 380 EUR",
        "specs": "Internal tubes quantity: 8, Tube diameter: $8 \\text{ mm}$ OD / $5.5 \\text{ mm}$ ID, Material: Polyurethane resistant to cooling oil degradation."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Air booster regulator (Pressure Doubler)",
        "b2b_code": "BST-PNEU-RATIO2",
        "tier": "650 EUR - 1,550 EUR",
        "specs": "Intensifying ratio: $2:1$, Inlet supply pressure: $P_{\\text{in}} = 2 \\text{ to } 8 \\text{ Bar}$, Dynamic flow delivery capability: $Q = 1,000 \\text{ Nl/min}$."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Pneumatic Slide Table Actuator",
        "b2b_code": "SLD-PNEU-TBL20",
        "tier": "420 EUR - 980 EUR",
        "specs": "Slide carriage stroke length: $L = 150 \\text{ mm}$, Guided bearing: Precision recirculating linear ball guides, Sensor interface slot: Dual slots."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Non-Return Pneumatic Check Valve",
        "b2b_code": "VALVE-PNEU-CHK12",
        "tier": "60 EUR - 140 EUR",
        "specs": "Connection ports: G 1/2 inch female, Crack pressure differential: $dP \\le 0.1 \\text{ Bar}$, Dynamic capacity rating: $Q = 1,800 \\text{ Nl/min}$."
    },
    {
        "category": "PNEUMATICS & MOTION CONTROL",
        "item_name": "Pneumatic Logic Dual-Hand Controller Valve",
        "b2b_code": "CTRL-PNEU-2H",
        "tier": "350 EUR - 820 EUR",
        "specs": "Logic function: Standard dual-hand safety actuation monitoring EN 574 Typ III C, Supply pressure limit: $P = 3 \\text{ to } 8 \\text{ Bar}$."
    },

    # CATEGORY 3: MECHANICAL DRIVE & POWER TRANSMISSION (ITEMS 41–60)
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Heavy-Duty Industrial Helical Gearbox",
        "b2b_code": "GEAR-HEL-H300",
        "tier": "2,500 EUR - 6,000 EUR",
        "specs": "Output torque capacity: $\\tau_{\\text{max}} = 12,000 \\text{ Nm}$, Gear reduction ratio: $i = 45:1$, Configuration: Solid parallel shaft DIN 6885/1 keyway."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Ceramic Hybrid Spherical Roller Bearing",
        "b2b_code": "BRG-HYB-SR220",
        "tier": "800 EUR - 1,800 EUR",
        "specs": "Static load rating: $C_0 = 450 \\text{ kN}$, Limiting rotational velocity: $n_{\\text{limit}} = 6,500 \\text{ RPM}$, Lubrication interface: Fully integrated synthetic."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Torque Limiting Safety Clutch (Friction Disc)",
        "b2b_code": "CLUTCH-TQR-LIM400",
        "tier": "950 EUR - 2,200 EUR",
        "specs": "Slipping torque range: $\\tau_{\\text{slip}} = 150 \\text{ to } 600 \\text{ Nm}$ adjustable, Matching shaft diameter: $d = 55 \\text{ mm}$ H7 bore size."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Precision Planetary Low-Backlash Gearbox",
        "b2b_code": "GEAR-PLAN-LOW05",
        "tier": "1,200 EUR - 2,800 EUR",
        "specs": "Torsional backlash: $\\delta_{\\text{back}} \\le 3 \\text{ arcmin}$, Output torque rating: $\\tau_{\\text{nom}} = 850 \\text{ Nm}$, Ratio reduction factor: $i = 10:1$."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Double-Flex Disc Coupling (Steel Elements)",
        "b2b_code": "COUP-DISC-FLX80",
        "tier": "320 EUR - 780 EUR",
        "specs": "Nominal torque capability: $\\tau = 1,200 \\text{ Nm}$, Allowed angular misalignment: $\\alpha = 1.5\\text{ }^{\\circ}$, Material: High-tensile carbon steel."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "High-Speed Precision Spindle Bearings Set (Matched Quad)",
        "b2b_code": "BRG-SPIN-AC-SET4",
        "tier": "1,500 EUR - 3,800 EUR",
        "specs": "Contact angle: $\\alpha = 15\\text{ }^{\\circ}$ design, Shaft bore size: $d = 85 \\text{ mm}$, Precision accuracy tolerance: ISO class P2 (ABEC-9 level)."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Heavy Industrial Fluid Coupling",
        "b2b_code": "COUP-FLUID-TRQ75",
        "tier": "4,500 EUR - 11,000 EUR",
        "specs": "Target transmission power: $P = 75 \\text{ kW}$, Operating liquid volume: $V_{\\text{fill}} = 14 \\text{ L}$ mineral turbine oil, Fuse plug release: $140 \\text{ }^{\\circ}\\text{C}$."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Precision Ground Ball Screw Axis (Recirculating)",
        "b2b_code": "SCREW-BALL-P25",
        "tier": "650 EUR - 1,500 EUR",
        "specs": "Ball screw diameter: $D_{\\text{screw}} = 25 \\text{ mm}$, Thread lead pitch: $L = 10 \\text{ mm}$, Accuracy tolerance class: ISO ground C5 steel."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Segmented Worm Gear Speed Reducer",
        "b2b_code": "GEAR-WRM-S80",
        "tier": "750 EUR - 1,800 EUR",
        "specs": "Output shaft config: Hollow bore sleeve $d = 40 \\text{ mm}$, Speed reduction ratio: $i = 30:1$, Max output torque: $\\tau = 550 \\text{ Nm}$."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Stainless Steel Roller Chain (Duplex ANSI Standard)",
        "b2b_code": "CHN-RLR-DUP100",
        "tier": "250 EUR - 650 EUR",
        "specs": "ANSI Chain size code: 100-2 duplex, Core material: Martensitic stainless steel AISI 420, Ultimate tensile strength: $F_{\\text{break}} \\ge 220 \\text{ kN}$."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Mechanical Locking Assembly (Shaft-to-Hub Keyless)",
        "b2b_code": "LOCK-ASY-KLS80",
        "tier": "120 EUR - 290 EUR",
        "specs": "Internal bore contact: $d = 80 \\text{ mm}$, Transmissible torque capability: $\\tau = 5,600 \\text{ Nm}$, Tightening screw: 12.9 class alloy."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Pillow Block Bearing Unit (Cast Iron Housing)",
        "b2b_code": "BRG-PLW-UNIT60",
        "tier": "180 EUR - 420 EUR",
        "specs": "Internal shaft insert size: $d_{\\text{shaft}} = 60 \\text{ mm}$, Housing compound: Gray cast iron EN-GJL-250, Relubrication port: Aligned grease nipple."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Curved Jaw Flexible Shaft Coupling",
        "b2b_code": "COUP-JAW-ELAST50",
        "tier": "90 EUR - 220 EUR",
        "specs": "Coupling size: Rotex 50, Insert spider elastomer rating: 98 Shore-A polyurethane, Nominal torque transmissible: $\\tau = 350 \\text{ Nm}$."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Heavy-Duty Cardan Shaft (Universal Drive Joint)",
        "b2b_code": "CARD-SHFT-HD120",
        "tier": "1,800 EUR - 4,200 EUR",
        "specs": "Nominal length: $L = 1,200 \\text{ mm}$ with $200 \\text{ mm}$ expansion spline, Max deflection angle: $\\beta = 15\\text{ }^{\\circ}$, Flange size: SAE 180."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Multi-Groove V-Belt Sheave (Cast Iron Pulley)",
        "b2b_code": "SHEAVE-VBELT-8GR",
        "tier": "300 EUR - 750 EUR",
        "specs": "Nominal pitch diameter: $D_p = 500 \\text{ mm}$, Belt groove quantity: 8, Standard profile compatibility: SPC belt class, Hub: Taper-Lock sleeve."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Precision Slipper Torque Limiter Clutch",
        "b2b_code": "CLUTCH-SLP-SPINDLE",
        "tier": "1,100 EUR - 2,500 EUR",
        "specs": "Dynamic slip setting range: $\\tau = 100 \\text{ to } 400 \\text{ Nm}$, Response time: instant slippage protection, Clamping spring: Disc Belleville spring."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Heavy Duty Slat Conveyor Drive Sprocket",
        "b2b_code": "SPKT-DRV-SLAT12",
        "tier": "400 EUR - 950 EUR",
        "specs": "Teeth count: $z = 12$, Pitch diameter: $D_p = 380 \\text{ mm}$ hardened tooth profile induction hardened to $55 \\text{ HRC}$, Bore style: Taper keyway."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "High-Precision Linear Recirculating Guide Rail",
        "b2b_code": "RAIL-LIN-PREC35",
        "tier": "480 EUR - 1,150 EUR",
        "specs": "Size width: $35 \\text{ mm}$, Carriage layout compatibility: Flanged heavy load block, Dynamic load capacity rating: $C = 58 \\text{ kN}$."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Spiral Bevel Gear Set (Matched Crown & Pinion)",
        "b2b_code": "GEAR-BEV-MATCH3",
        "tier": "1,200 EUR - 2,900 EUR",
        "specs": "Module sizing: $M = 3.5$, Speed ratio reduction: $2:1$, Gear tooth style: Klingelnberg cyclo-palloid system, Material: $18\\text{CrNiMo7-6}$ carburized."
    },
    {
        "category": "MECHANICAL DRIVE & POWER TRANSMISSION",
        "item_name": "Flexible Grid Shaft Coupling",
        "b2b_code": "COUP-GRID-STEEL",
        "tier": "280 EUR - 650 EUR",
        "specs": "Nominal torque capability: $\\tau = 1,800 \\text{ Nm}$, Grid insert material: Alloy steel shot-peened spring grid, Cover housing: Horizontal split aluminum."
    },

    # CATEGORY 4: ELECTRICAL SYSTEMS, INVERTERS & SPINDLES (ITEMS 61–80)
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "High-Power Variable Frequency Drive (VFD)",
        "b2b_code": "VFD-DRIVE-X9",
        "tier": "1,100 EUR - 4,500 EUR",
        "specs": "Rated motor output power: $P_{\\text{out}} = 75 \\text{ kW}$, Input grid voltage: $3\\text{-Phase } 380 \\text{ to } 480 \\text{ V AC } (50/60 \\text{ Hz})$, Overload: $150\\%$ current for $60 \\text{ seconds}$."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "Precision Motorized Milling Spindle Core",
        "b2b_code": "SPIN-MOT-HSC77",
        "tier": "3,000 EUR - 8,500 EUR",
        "specs": "Max speed: $n_{\\text{max}} = 24,000 \\text{ RPM}$, Tool clamping holder interface: HSK-E32 tapered collet system, Balancing grade: $G \\le 0.4 \\text{ mm/s}$."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "Industrial Three-Phase Servo Motor (High Torque)",
        "b2b_code": "MOTOR-SER-HT400",
        "tier": "1,800 EUR - 4,200 EUR",
        "specs": "Continuous output torque: $\\tau_{\\text{cont}} = 38 \\text{ Nm}$ at standstill, Rated speed: $n = 3,000 \\text{ RPM}$, Feedback sensor encoder: 24-bit Absolute."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "Modular Programmable Logic Controller (PLC) Main Rack",
        "b2b_code": "PLC-CPU-MOD-S7",
        "tier": "1,500 EUR - 3,900 EUR",
        "specs": "Processing execution time: $0.01 \\text{ }\\mu\\text{s}$ per bit operation, Communication ports: Dual port Profinet Switch interface, RAM: $4 \\text{ MB}$."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "Brushless DC Motor with Integrated Controller",
        "b2b_code": "MOTOR-BLDC-INT400",
        "tier": "450 EUR - 980 EUR",
        "specs": "Rated power capability: $P = 400 \\text{ W}$, Nominal voltage supply: $V_{\\text{dc}} = 48 \\text{ V DC}$, Communication protocol interface: CANopen or Modbus."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "High-Voltage Modular Contactor Panel Pack",
        "b2b_code": "ELECT-SWITCH-HV300",
        "tier": "1,150 EUR - 2,800 EUR",
        "specs": "Current capacity rating: $I = 300 \\text{ A}$ continuous under voltage $U = 1,000 \\text{ V AC}$, Auxiliary logic switches config: $2 \\text{ NO} + 2 \\text{ NC}$."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "Industrial Uninterruptible Power Supply (UPS) Rail Module",
        "b2b_code": "UPS-RAIL-24V40A",
        "tier": "380 EUR - 950 EUR",
        "specs": "Output system voltage: $24 \\text{ V DC}$, Max output current flow: $I_{\\text{max}} = 40 \\text{ A}$, Battery chemistry support: LiFePO4 or lead-acid blocks."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "Absolute Heavy Industrial Shaft Encoder",
        "b2b_code": "ENC-ABS-MULT-19",
        "tier": "320 EUR - 750 EUR",
        "specs": "Sensor resolution: 19-bit Singleturn plus 12-bit Multiturn, Digital protocol standard: SSI / BiSS-C encoder interface, Shaft: Hollow blind $d=12\\text{mm}$."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "Active Power Filter harmonic Compensator",
        "b2b_code": "ELECT-FILT-APF100",
        "tier": "4,500 EUR - 11,000 EUR",
        "specs": "Compensating current rating: $I = 100 \\text{ A}$ per phase, Harmonics targeting range: 2nd to 50th order component, Grid frequency: $50/60\\text{Hz}$ auto."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "Dry-Type Three-Phase Isolation Transformer",
        "b2b_code": "XFMR-DRY-3PH-40KVA",
        "tier": "1,800 EUR - 4,200 EUR",
        "specs": "Apparent capacity: $40 \\text{ kVA}$, Primary/Secondary voltage windings: $400 \\text{ V AC}$ Delta to $400 \\text{ V AC}$ Star neutral configuration."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "Explosion-Proof Induction Motor (ATEX Standard)",
        "b2b_code": "MOTOR-ATEX-EX15",
        "tier": "1,400 EUR - 3,500 EUR",
        "specs": "Power rating: $P = 15 \\text{ kW}$, Explosion safety mark: II 2G Ex db IIC T4 Gb compliance, Enclosure protective standard: IP66."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "Regenerative Braking Unit module",
        "b2b_code": "VFD-REGEN-B30",
        "tier": "900 EUR - 2,100 EUR",
        "specs": "Continuous feedback recovery power: $P_{\\text{regen}} = 30 \\text{ kW}$, Line voltage coupling: $3\\text{-Phase } 380\\text{-}480 \\text{ V AC}$, Peak efficiency: $\\eta \\ge 98\\%$."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "Industrial Heat Trace Heating Cable (Self-Regulating)",
        "b2b_code": "CABLE-HT-SELF30",
        "tier": "350 EUR - 850 EUR",
        "specs": "Output heating power density: $30 \\text{ W/m}$ at base temperature $10 \\text{ }^{\\circ}\\text{C}$, Max exposure threshold: $T_{\\text{max}} = 200 \\text{ }^{\\circ}\\text{C}$."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "Rugged Industrial Field Switch (Managed Ethernet)",
        "b2b_code": "NET-SW-IND-8P",
        "tier": "650 EUR - 1,450 EUR",
        "specs": "Ethernet ports density: 8-Port Gigabit RJ45 plus 2 Gigabit SFP fiber slots, Input voltage standard: Dual $24 \\text{ V DC}$ redundancy."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "Linear Electromagnetic Motor Actuator",
        "b2b_code": "MOT-LIN-MAG40",
        "tier": "1,800 EUR - 4,600 EUR",
        "specs": "Peak linear thrust capability: $F_{\\text{peak}} = 1,200 \\text{ N}$, Effective travel stroke: $L = 600 \\text{ mm}$, Max velocity: $v_{\\text{max}} = 4 \\text{ m/s}$."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "High-Accuracy Laser Distance Measurement Sensor",
        "b2b_code": "SENS-DIS-LSR100",
        "tier": "450 EUR - 1,100 EUR",
        "specs": "Measurable range scale: $0.1 \\text{ to } 100 \\text{ m}$, Output interface protocol: Profinet or SSI, System resolution: $\\delta \\le 0.1 \\text{ mm}$."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "Safety Laser Scanner (Industrial Guarding)",
        "b2b_code": "SAFE-SCAN-LIDAR4",
        "tier": "1,800 EUR - 4,200 EUR",
        "specs": "Active protection field range radius: $r = 4 \\text{ m}$ safety envelope, Scanning angle: $275\\text{ }^{\\circ}$, Safety standards rating: SIL 2 / Type 3 PL d."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "Digital Coriolis Mass Flowmeter Panel",
        "b2b_code": "FLOW-CORIOLIS-DN25",
        "tier": "3,500 EUR - 8,200 EUR",
        "specs": "Port connection size: DN 25 flanged, Measurement accuracy rating: $\\pm 0.1\\%$ of flow mass rate, Enclosure protection standard: IP67."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "High-Load Solid-State Thyristor Power Controller",
        "b2b_code": "ELECT-THYR-SCR200",
        "tier": "680 EUR - 1,600 EUR",
        "specs": "Current handling rating: $I = 200 \\text{ A}$ continuous phase angle control, Supply input: $3\\text{-Phase } 480 \\text{ V AC}$, Control: $4\\text{-}20 \\text{ mA}$ interface."
    },
    {
        "category": "ELECTRICAL SYSTEMS, INVERTERS & SPINDLES",
        "item_name": "Rugged Field Remote Terminal Unit (RTU)",
        "b2b_code": "TELEM-RTU-GRID-X",
        "tier": "1,300 EUR - 3,100 EUR",
        "specs": "System ports density: 4 isolated RS-485 serial ports plus 2 native RJ-45 lines, I/O density: 16 Analog Inputs ($4\\text{-}20 \\text{ mA}$ standard), 8 DI."
    },

    # CATEGORY 5: THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS (ITEMS 81–100)
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "High-Pressure Gas Turbine Blades",
        "b2b_code": "BLADE-INC-718",
        "tier": "4,500 EUR - 12,000 EUR",
        "specs": "Structural base material: Nickel-chromium superalloy Inconel 718, Thermal operational threshold: $T_{\\text{max}} = 700 \\text{ }^{\\circ}\\text{C}$, Certification: DIN EN 10204 3.1."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "Plate Heat Exchanger (Gasketed Stainless Steel)",
        "b2b_code": "HEAT-EXCH-PLT80",
        "tier": "1,600 EUR - 4,200 EUR",
        "specs": "Heat transfer area sum: $A = 12 \\text{ m}^2$, Max design pressure: $P_{\\text{design}} = 16 \\text{ Bar}$, Plates profile material: AISI 316L, Gaskets: NBR."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "Forged Manganese Steel Wear Plate",
        "b2b_code": "WEAR-PLT-MN13",
        "tier": "350 EUR - 850 EUR",
        "specs": "Plate dimension size: $1,000 \\times 1,000 \\times 20 \\text{ mm}$, Hardness: $500 \\text{ HBW}$ after mechanical work-hardening, Material: Hadfield manganese steel."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "Segmented Graphite Crucible (Ultra-High Temp)",
        "b2b_code": "CRUC-GRAPH-T1600",
        "tier": "620 EUR - 1,500 EUR",
        "specs": "Thermal breakdown boundary: $T = 1,600 \\text{ }^{\\circ}\\text{C}$ inside inert environment, Outer capacity volume: $V_{\\text{vol}} = 50 \\text{ L}$ molten copper equivalent."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "Stainless Steel Segmented Flanged Ball Valve",
        "b2b_code": "VALVE-FLNG-SS100",
        "tier": "1,200 EUR - 2,900 EUR",
        "specs": "Nominal pipeline size: DN 100, Pipeline pressure rating: PN 40 flanged, Body/Ball metallurgy: Cast stainless steel CF8M (AISI 316)."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "Industrial Burner Control Unit controller",
        "b2b_code": "BURNER-CTRL-BCU50",
        "tier": "780 EUR - 1,850 EUR",
        "specs": "Standard certifications compliance: EN 298 gas burner safety controller, Monitoring: Integrated UV flame sensor, Voltage: $230 \\text{ V AC}$."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "Thermodynamic Steam Trap Assembly",
        "b2b_code": "TRAP-STEAM-TD25",
        "tier": "220 EUR - 480 EUR",
        "specs": "Connection sizing: $1 \\text{ inch}$ socket weld, Max operating pressure threshold: $P = 42 \\text{ Bar}$, Material: Forged stainless steel body."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "Forged Tungsten Carbide Rotary Drill Bit",
        "b2b_code": "DRILL-BIT-TC12",
        "tier": "950 EUR - 2,300 EUR",
        "specs": "Drill head diameter: $D = 300 \\text{ mm}$, Cutter configuration: Tungsten carbide matrix inserts (grade K30), Thread: API standard box."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "Ceramic Fiber Insulation Blanket Roll",
        "b2b_code": "INS-BLNK-CF1400",
        "tier": "180 EUR - 420 EUR",
        "specs": "Max exposure limit: $T = 1,430 \\text{ }^{\\circ}\\text{C}$, Density rating: $\\rho = 128 \\text{ kg/m}^3$, Roll dimensions: $7,200 \\times 610 \\times 25 \\text{ mm}$."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "Forged Chrome-Moly Alloy Steel Shaft",
        "b2b_code": "SHFT-FORG-42CRMO",
        "tier": "2,200 EUR - 5,500 EUR",
        "specs": "Structural raw bar material: $42\\text{CrMo4}$ steel hardened and tempered, Sizing: $D = 180 \\text{ mm} \\times L = 2,500 \\text{ mm}$ length."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "High-Temperature Expansion Bellows Joint",
        "b2b_code": "BLW-EXP-SS321-200",
        "tier": "850 EUR - 1,980 EUR",
        "specs": "Nominal size: DN 200, Bellows multi-ply element: Stainless Steel 321, Temperature operational rating: up to $T = 550 \\text{ }^{\\circ}\\text{C}$."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "Titanium Alloy Shell & Tube Heat Exchanger",
        "b2b_code": "HEAT-EXCH-TI300",
        "tier": "8,500 EUR - 22,000 EUR",
        "specs": "Tube bundle metallurgy: Grade 2 Titanium alloy seamless tubes, Heat exchange area: $A = 35 \\text{ m}^2$, Media: Corrosive saltwater coolant."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "High-Alumina Refractory Castable Mix",
        "b2b_code": "REF-CAST-AL80",
        "tier": "450 EUR - 950 EUR",
        "specs": "Alumina base concentration: $\\text{Al}_2\\text{O}_3 \\ge 80\\%$, Max service temperature threshold: $T = 1,700 \\text{ }^{\\circ}\\text{C}$, Bulk density: $2.6 \\text{ g/cm}^3$."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "Heavy-Duty Rotary Vane Air Compressor Air End",
        "b2b_code": "COMP-VANE-AE100",
        "tier": "3,800 EUR - 9,200 EUR",
        "specs": "Dynamic air delivery capacity: $Q = 15 \\text{ m}^3/\\text{min}$, Max discharge pressure limit: $P = 10 \\text{ Bar}$, Power equivalent input: $110 \\text{ kW}$."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "Submersible Slurry Pump (Hardened Alloy)",
        "b2b_code": "PUMP-SUB-SLRY15",
        "tier": "5,500 EUR - 14,000 EUR",
        "specs": "Dynamic pump casing: High-chrome white iron alloy ($27\\% \\text{ Cr}$, hardness $600 \\text{ HBW}$), Flow delivery capability: $Q_{\\text{fluid}} = 250 \\text{ m}^3/\\text{hr}$."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "High-Temperature Industrial Process fan",
        "b2b_code": "FAN-IND-HI-TEMP",
        "tier": "3,200 EUR - 7,800 EUR",
        "specs": "Gas handling temperature limit: $T = 300 \\text{ }^{\\circ}\\text{C}$, Motor size: $P = 45 \\text{ kW}$, Impeller wheel metallurgy: Structural Corten steel."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "Cast Iron Dual-Flanged Pipe Spool (Lined)",
        "b2b_code": "PIPE-SPLO-FLG150",
        "tier": "320 EUR - 780 EUR",
        "specs": "Sizing: DN 150 flanged spool $L = 1,500 \\text{ mm}$ length, Inner protective lining material: Polyurethane elastomer abrasion-resistant lining."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "PEEK Engineered Polymer Structural Rods",
        "b2b_code": "ROID-PEEK-PURE50", # Fixed spelling to match prompt standard code ROD-PEEK-PURE50
        "tier": "400 EUR - 950 EUR",
        "specs": "Sizing: $50 \\text{ mm}$ diameter $\times 1,000 \\text{ mm}$ length rods, Density: $1.32 \\text{ g/cm}^3$, Tensile strength at break: $\\sigma_{\\text{break}} = 97 \\text{ MPa}$."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "High-Pressure Diaphragm Control Valve (Air Actuated)",
        "b2b_code": "VALVE-DIA-PNEU80",
        "tier": "1,600 EUR - 3,900 EUR",
        "specs": "Body nominal pipeline size: DN 80 flanged, Diaphragm actuator signal: $0.2 \\text{ to } 1.0 \\text{ Bar}$ air control, Body: Cast iron."
    },
    {
        "category": "THERMAL, PROCESS & HEAVY STRUCTURAL ALLOY PARTS",
        "item_name": "Hardened Steel Shaker Deck screen",
        "b2b_code": "SCR-SHKR-MND10",
        "tier": "650 EUR - 1,400 EUR",
        "specs": "Sifting perforation profile size: $10 \\times 10 \\text{ mm}$ square openings, Sheet thickness: $8 \\text{ mm}$, Material: Wear-resistant Hardox 500 steel."
    }
]

# Ensure correct code for PEEK is used
for it in ITEMS:
    if it["b2b_code"] == "ROID-PEEK-PURE50":
        it["b2b_code"] = "ROD-PEEK-PURE50"

def clean_latex(text: str) -> str:
    """
    Cleans LaTeX symbols and mathematical syntax into readable, standard text.
    """
    if not text:
        return ""
    # Replace \text{...} with contents
    text = re.sub(r'\\text\s*\{([^}]+)\}', r'\1', text)
    # Replace _{...} with _...
    text = re.sub(r'_\s*\{([^}]+)\}', r'_\1', text)
    # Replace ^{\circ} with °
    text = re.sub(r'\^\{\s*\\circ\s*\}', r'°', text)
    # Replace other symbols
    text = text.replace(r'\le', '<=')
    text = text.replace(r'\ge', '>=')
    text = text.replace(r'\pm', '+-')
    text = text.replace(r'\sigma', 'sigma')
    text = text.replace(r'\tau', 'tau')
    text = text.replace(r'\delta', 'delta')
    text = text.replace(r'\beta', 'beta')
    text = text.replace(r'\rho', 'rho')
    text = text.replace(r'\mu', 'micro')
    text = text.replace(r'\eta', 'eta')
    text = text.replace(r'\Delta', 'delta')
    text = text.replace(r'\times', 'x')
    text = text.replace(r'\circ', '°')
    # Remove math wrappers
    text = text.replace('$', '')
    # Remove leftover backslashes
    text = text.replace('\\', '')
    # Condense white space
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def parse_prices(tier_str: str):
    """
    Parses min_price and max_price out of typical procurement tier string (e.g. 1,200 EUR - 3,500 EUR).
    """
    matches = re.findall(r'([\d,]+)', tier_str)
    if len(matches) >= 2:
        min_price = int(matches[0].replace(',', ''))
        max_price = int(matches[1].replace(',', ''))
        return min_price, max_price
    elif len(matches) == 1:
        val = int(matches[0].replace(',', ''))
        return val, val
    return 100, 1000

def build_validated_url(base_url: str) -> str:
    try:
        # Minimal path validation
        if "/../" in base_url or re.search(r"/%2e%2e/", base_url, re.IGNORECASE):
            raise ValueError("Invalid path")
        
        parsed = urlparse(base_url)
        
        # Protocol + host checks
        if parsed.scheme not in ("http", "https"):
            raise ValueError("Invalid protocol")
        if not parsed.hostname:
            raise ValueError("Invalid host")
        allowed_domains = ["example.com"]  # add your allowed domains here
        if parsed.hostname.lower() not in allowed_domains:
            raise ValueError("Invalid host")
        
        return urlunparse(parsed)
    except Exception:
        raise ValueError("Invalid URL")

def download_image(url: str, save_path: str) -> bool:
    """
    Downloads an image from a URL and saves it locally.
    """
    try:
        base_dir = "frontend/public/inventory"
        base_real = os.path.realpath(base_dir)
        target_real = os.path.realpath(save_path)
        if os.path.commonpath([base_real, target_real]) != base_real:
            raise Exception("Invalid file path")
        os.makedirs(os.path.dirname(target_real), exist_ok=True)
        req = urllib.request.Request(
            validated_url,
            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}
        )
        with urllib.request.urlopen(req) as response:
            with open(target_real, 'wb') as f:
                f.write(response.read())
        return True
    except Exception as e:
        print(f"[DOWNLOAD ERROR] Failed to save {url} to {save_path}: {e}")
        return False

def generate_and_save_item(item, idx):
    """
    Generates Fal.ai image for a single item, cleans its specs, and downloads it locally.
    """
    import fal_client
    
    b2b_code = item["b2b_code"]
    item_name = item["item_name"]
    category = item["category"]
    raw_specs = item["specs"]
    tier_str = item["tier"]

    # 1. Clean specs
    clean_specs = clean_latex(raw_specs)
    min_price, max_price = parse_prices(tier_str)

    print(f"[{idx}/100] Ingesting {b2b_code}: {item_name} ({category})...")

    # 2. Invoke fal_client to generate high-contrast studio white-background photo
    prompt = (
        f"A professional studio catalog photograph of {item_name}, "
        f"B2B Standard Code: {b2b_code}, high-resolution, industrial machinery, "
        f"isolated on a pure, solid white background, high contrast, clean shot."
    )
    
    local_rel_path = f"/inventory/{b2b_code}.jpg"
    local_abs_path = f"frontend/public/inventory/{b2b_code}.jpg"

    max_retries = 3
    success = False
    cdn_url = ""

    for attempt in range(1, max_retries + 1):
        try:
            handler = fal_client.submit(
                "fal-ai/flux/schnell",
                arguments={
                    "prompt": prompt,
                    "image_size": "square_hd"
                }
            )
            result = handler.get()
            cdn_url = result["images"][0]["url"]
            # Download locally
            if download_image(cdn_url, local_abs_path):
                success = True
                print(f" -> Generated and downloaded image for {b2b_code}")
                break
        except Exception as e:
            print(f" -> [Attempt {attempt}/{max_retries}] Error generating image for {b2b_code}: {e}")

    # Fallback to local default if fal fail or rate-limit
    if not success:
        print(f" -> [FALLBACK] Fal failed for {b2b_code}. Using local default placeholder path.")
        local_rel_path = "/inventory/placeholder.jpg"

    return {
        "item_name": item_name,
        "b2b_code": b2b_code,
        "min_price": min_price,
        "max_price": max_price,
        "technical_specs": clean_specs,
        "image_path": local_rel_path,
        "category": category
    }

def main():
    print("--------------------------------------------------")
    print("Atira B2B Procurement 100-Item Catalog Ingest Tool")
    print("--------------------------------------------------")

    # Recreate the PostgreSQL tables (this will register the new 'inventory' table)
    print("Syncing PostgreSQL database tables...")
    Base.metadata.create_all(bind=engine)
    print("PostgreSQL tables successfully synchronized.")

    # We will use concurrent thread pools to speed up Fal generation
    print("Starting parallelized image generation and ingestion (Max workers: 8)...")
    
    results = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(generate_and_save_item, item, i + 1): item for i, item in enumerate(ITEMS)}
        for future in as_completed(futures):
            try:
                res = future.result()
                results.append(res)
            except Exception as e:
                print(f"[FATAL WORKER ERROR] Worker thread raised an exception: {e}")

    # Ingest all parsed records into database
    print("\nPersisting records to PostgreSQL database...")
    db: Session = SessionLocal()
    try:
        # Delete existing entries in 'inventory' table first to make it a fresh import
        db.query(InventoryItem).delete()
        
        for r in results:
            new_item = InventoryItem(
                id=uuid.uuid4(),
                item_name=r["item_name"],
                b2b_code=r["b2b_code"],
                min_price=r["min_price"],
                max_price=r["max_price"],
                technical_specs=r["technical_specs"],
                image_path=r["image_path"],
                category=r["category"]
            )
            db.add(new_item)
        db.commit()
        print(f"Success! {len(results)} items successfully parsed, images generated/saved, and seeded to table 'inventory'.")
    except Exception as e:
        db.rollback()
        print(f"Failed to persist records to PostgreSQL database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
