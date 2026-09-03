import { Category, Brand, Product, UserProfile, RoleName, PermissionCode, SystemSettings } from '../../types';

export const INITIAL_SETTINGS: SystemSettings = {
  exchange_rate_usd_to_ngn: 1500,
  free_shipping_enabled: true,
  free_shipping_threshold_usd: 0,
  company_name: "SPINEL DISTRIBUTION",
  company_email: "spineldistribution@gmail.com",
  company_phone: "+1 (800) 774-6350",
  company_logo: "https://i.ibb.co/nNS90SKj/pokecutweb-1788465862994.png"
};

export const INITIAL_ROLES: { name: RoleName; description: string; permissions: PermissionCode[] }[] = [
  {
    name: 'super_admin',
    description: 'Full system privileges across all modules, settings, and audits',
    permissions: [
      'catalog.read', 'catalog.create', 'catalog.update', 'catalog.delete', 'catalog.import',
      'orders.read', 'orders.update',
      'customers.read', 'customers.update',
      'users.read', 'users.update',
      'imports.create', 'imports.cancel',
      'settings.read', 'settings.update'
    ]
  },
  {
    name: 'admin',
    description: 'System administrator with management access',
    permissions: [
      'catalog.read', 'catalog.create', 'catalog.update', 'catalog.delete', 'catalog.import',
      'orders.read', 'orders.update',
      'customers.read', 'customers.update',
      'users.read',
      'imports.create', 'imports.cancel',
      'settings.read'
    ]
  },
  {
    name: 'catalog_manager',
    description: 'Manages products, categories, brands, inventory and product imports',
    permissions: [
      'catalog.read', 'catalog.create', 'catalog.update', 'catalog.delete', 'catalog.import',
      'imports.create', 'imports.cancel'
    ]
  },
  {
    name: 'order_manager',
    description: 'Manages customer orders, order fulfillment, and invoices',
    permissions: [
      'orders.read', 'orders.update',
      'customers.read'
    ]
  },
  {
    name: 'customer',
    description: 'Standard registered customer with access to profile, cart, and orders',
    permissions: [
      'catalog.read'
    ]
  }
];

export const INITIAL_USERS: (UserProfile & { password_hash: string })[] = [
  {
    id: 'user-admin-01',
    email: 'spineldistribution@gmail.com',
    first_name: 'Spinel',
    last_name: 'Director',
    phone: '+1-800-774-6350',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    is_active: true,
    email_verified: true,
    roles: ['super_admin', 'admin'],
    permissions: [
      'catalog.read', 'catalog.create', 'catalog.update', 'catalog.delete', 'catalog.import',
      'orders.read', 'orders.update',
      'customers.read', 'customers.update',
      'users.read', 'users.update',
      'imports.create', 'imports.cancel',
      'settings.read', 'settings.update'
    ],
    password_hash: 'admin123',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-manager-01',
    email: 'catalog@spineldistribution.com',
    first_name: 'Marcus',
    last_name: 'Vance',
    phone: '+1-800-774-6351',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    is_active: true,
    email_verified: true,
    roles: ['catalog_manager'],
    permissions: [
      'catalog.read', 'catalog.create', 'catalog.update', 'catalog.delete', 'catalog.import',
      'imports.create', 'imports.cancel'
    ],
    password_hash: 'catalog123',
    created_at: '2026-01-05T00:00:00Z',
    updated_at: '2026-01-05T00:00:00Z'
  },
  {
    id: 'user-customer-01',
    email: 'customer@example.com',
    first_name: 'David',
    last_name: 'Adeleke',
    phone: '+234-803-555-0199',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    is_active: true,
    email_verified: true,
    roles: ['customer'],
    permissions: ['catalog.read'],
    password_hash: 'customer123',
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-networking',
    name: 'Networking & Telecomm',
    slug: 'networking-telecomm',
    description: 'Enterprise switches, optical routing, wireless access points, and rack cabinets',
    icon: 'Network',
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    display_order: 1
  },
  {
    id: 'cat-servers',
    name: 'Servers & Data Storage',
    slug: 'servers-data-storage',
    description: 'High-density rack servers, SAN/NAS arrays, enterprise NVMe storage and SAS drives',
    icon: 'Server',
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    display_order: 2
  },
  {
    id: 'cat-power',
    name: 'Power & Solar Inverters',
    slug: 'power-solar-inverters',
    description: 'Industrial Smart-UPS, solar hybrid inverters, LiFePO4 rack batteries, and surge protection',
    icon: 'Zap',
    image_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    display_order: 3
  },
  {
    id: 'cat-security',
    name: 'Security & Surveillance',
    slug: 'security-surveillance',
    description: 'IP cameras, AI facial recognition NVRs, biometric access control and intrusion alarms',
    icon: 'ShieldCheck',
    image_url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    display_order: 4
  },
  {
    id: 'cat-computing',
    name: 'Commercial Computing',
    slug: 'commercial-computing',
    description: 'Enterprise workstations, business laptops, thin clients, and industrial grade monitors',
    icon: 'Laptop',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    display_order: 5
  },
  {
    id: 'cat-cabling',
    name: 'Cabling & Infrastructure',
    slug: 'cabling-infrastructure',
    description: 'Cat6A/Cat7 copper reels, single-mode fiber optic patch cords, PDU power strips',
    icon: 'Cpu',
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    display_order: 6
  }
];

export const INITIAL_BRANDS: Brand[] = [
  {
    id: 'brand-cisco',
    name: 'Cisco Systems',
    slug: 'cisco-systems',
    logo_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=150&q=80',
    description: 'Global leader in enterprise routing, switching, and collaborative security hardware',
    is_active: true
  },
  {
    id: 'brand-dell',
    name: 'Dell Technologies',
    slug: 'dell-technologies',
    logo_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=150&q=80',
    description: 'Enterprise PowerEdge servers, Precision workstations, and storage platforms',
    is_active: true
  },
  {
    id: 'brand-ubiquiti',
    name: 'Ubiquiti Inc.',
    slug: 'ubiquiti',
    logo_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80',
    description: 'UniFi software-defined networking, Wi-Fi 7 access points, and routing gateways',
    is_active: true
  },
  {
    id: 'brand-schneider',
    name: 'Schneider Electric APC',
    slug: 'schneider-electric-apc',
    logo_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=150&q=80',
    description: 'Uninterruptible power supplies, critical power distribution, and modular data center systems',
    is_active: true
  },
  {
    id: 'brand-hikvision',
    name: 'Hikvision Digital',
    slug: 'hikvision',
    logo_url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=150&q=80',
    description: 'High performance video surveillance, ColorVu cameras, and deep learning NVR systems',
    is_active: true
  },
  {
    id: 'brand-victron',
    name: 'Victron Energy',
    slug: 'victron-energy',
    logo_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=150&q=80',
    description: 'World-renowned blue solar power electronics, MultiPlus inverter-chargers, and MPPTs',
    is_active: true
  },
  {
    id: 'brand-lenovo',
    name: 'Lenovo Enterprise',
    slug: 'lenovo-enterprise',
    logo_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=150&q=80',
    description: 'ThinkSystem servers and ThinkPad commercial business mobile workstations',
    is_active: true
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-cisco-9300-48p',
    sku: 'CS-C9300-48P-A',
    name: 'Cisco Catalyst 9300 48-Port PoE+ Managed Enterprise Switch',
    slug: 'cisco-catalyst-9300-switch',
    category_id: 'cat-networking',
    category_name: 'Networking & Telecomm',
    brand_id: 'brand-cisco',
    brand_name: 'Cisco Systems',
    description: 'The Cisco Catalyst 9300 Series is the foundational building block for software-defined access (SD-Access). Featuring 48 Gigabit Ethernet PoE+ ports with 715W AC power supply, StackWise-480 architecture with 480 Gbps stacking bandwidth, and dual redundant power supply support.',
    short_description: '48-Port Gigabit PoE+ Enterprise Switch with 480 Gbps Stacking and Network Advantage',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    additional_images: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
    ],
    price_usd: 4850.00,
    compare_at_price_usd: 5400.00,
    stock_quantity: 42,
    availability: 'IN_STOCK',
    status: 'ACTIVE',
    condition: 'NEW',
    weight_kg: 7.45,
    dimensions: '44.5 x 4.4 x 44.5 cm (1U Rackmount)',
    manufacturer: 'Cisco Systems, Inc.',
    country_of_origin: 'Mexico',
    warranty: 'Enhanced Limited Lifetime Hardware Warranty (E-LLW)',
    specifications: {
      "Ports": "48 x 10/100/1000 Gigabit Ethernet with PoE+",
      "PoE Budget": "715W AC Power Supply (up to 437W PoE)",
      "Stacking Bandwidth": "480 Gbps StackWise",
      "Switching Capacity": "256 Gbps",
      "DRAM": "16 GB",
      "Flash Memory": "16 GB",
      "Form Factor": "1U Rackmount",
      "Layer Support": "Layer 2 & Layer 3 Routing"
    },
    seo_title: 'Buy Cisco Catalyst 9300 48-Port PoE+ Switch | Spinel Distribution',
    seo_description: 'Order authentic Cisco Catalyst 9300 Series 48-port PoE+ managed switch CS-C9300-48P-A at Spinel Distribution. Free shipping and official warranty.',
    rating: 4.9,
    review_count: 148,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z'
  },
  {
    id: 'prod-dell-r750-server',
    sku: 'DELL-R750-2X8358',
    name: 'Dell PowerEdge R750 2U Rack Server (2x Intel Xeon Gold 6330, 128GB RAM, 8x 1.92TB NVMe)',
    slug: 'dell-poweredge-r750-rack-server',
    category_id: 'cat-servers',
    category_name: 'Servers & Data Storage',
    brand_id: 'brand-dell',
    brand_name: 'Dell Technologies',
    description: 'The Dell PowerEdge R750 is a full-featured enterprise server powered by dual 3rd Generation Intel Xeon Scalable processors. Engineered to handle demanding workloads such as virtualization, hyperconverged infrastructure (HCI), high-performance database analytics, and SAP environments.',
    short_description: '2U Dual Xeon Gold 28-Core, 128GB DDR4 ECC, Enterprise NVMe Hot-Plug Storage',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    additional_images: [
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80'
    ],
    price_usd: 8950.00,
    compare_at_price_usd: 10200.00,
    stock_quantity: 18,
    availability: 'IN_STOCK',
    status: 'ACTIVE',
    condition: 'NEW',
    weight_kg: 28.5,
    dimensions: '86.8 x 434.0 x 736.2 mm',
    manufacturer: 'Dell Inc.',
    country_of_origin: 'United States',
    warranty: '3-Year ProSupport Plus Next Business Day Onsite Service',
    specifications: {
      "Processors": "2x Intel Xeon Gold 6330 (28 Cores / 56 Threads, 2.0 GHz Base / 3.1 GHz Turbo)",
      "Memory": "128GB (4x 32GB) RDIMM 3200MT/s Dual Rank",
      "Storage": "8x 1.92TB Read Intensive NVMe PCIe Gen4 Hot-Plug Solid State Drives",
      "RAID Controller": "PERC H755 Front SAS/SATA/NVMe with 8GB NV Cache",
      "Network Daughter Card": "Quad Port 10GbE SFP+ & Dual Port 1GbE BASE-T",
      "Power Supplies": "Dual 1400W Hot-Plug Redundant Titanium (200-240VAC)",
      "Remote Management": "iDRAC9 Enterprise with OpenManage Lifecycle Controller"
    },
    seo_title: 'Dell PowerEdge R750 Rack Server Dual Xeon Gold | Spinel Distribution',
    seo_description: 'High-performance Dell PowerEdge R750 2U rack server with 128GB ECC RAM and NVMe enterprise drives. Fast international shipping.',
    rating: 4.8,
    review_count: 86,
    created_at: '2026-01-12T10:00:00Z',
    updated_at: '2026-01-12T10:00:00Z'
  },
  {
    id: 'prod-apc-smartups-3000',
    sku: 'APC-SMT3000RMI2U',
    name: 'Schneider Electric APC Smart-UPS 3000VA LCD RM 2U 230V with SmartConnect',
    slug: 'apc-smartups-3000va-lcd-rm-2u',
    category_id: 'cat-power',
    category_name: 'Power & Solar Inverters',
    brand_id: 'brand-schneider',
    brand_name: 'Schneider Electric APC',
    description: 'Intelligent and efficient network power protection from entry level to scaleable runtime. Ideal UPS for servers, point-of-sale, routers, switches, hubs and other network devices. Features pure sine wave output, intuitive LCD interface, and cloud-enabled SmartConnect remote monitoring.',
    short_description: '3000VA / 2700W Line-Interactive Pure Sine Wave 2U Rackmount UPS with Cloud Management',
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    additional_images: [
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80'
    ],
    price_usd: 1820.00,
    compare_at_price_usd: 2100.00,
    stock_quantity: 35,
    availability: 'IN_STOCK',
    status: 'ACTIVE',
    condition: 'NEW',
    weight_kg: 44.28,
    dimensions: '86 x 480 x 683 mm (2U)',
    manufacturer: 'Schneider Electric SE',
    country_of_origin: 'Philippines',
    warranty: '3 years repair or replace (excluding battery) and 2 years for battery',
    specifications: {
      "Output Capacity": "3000VA / 2700 Watts",
      "Nominal Output Voltage": "230V Pure Sine Wave",
      "Efficiency at Full Load": "98.0%",
      "Battery Type": "Lead-acid maintenance-free with suspended electrolyte (leakproof)",
      "Typical Recharge Time": "3 hours",
      "Interface Ports": "SmartSlot, USB, RJ-45 Serial",
      "Network Card": "Pre-installed APC Network Management Card 3 with Environmental Monitoring"
    },
    seo_title: 'APC Smart-UPS 3000VA RM 2U Pure Sine Wave | Spinel Distribution',
    seo_description: 'Buy Schneider APC Smart-UPS 3000VA 2700W rackmount server battery backup unit at Spinel Distribution. Free shipping and enterprise warranty.',
    rating: 4.9,
    review_count: 215,
    created_at: '2026-01-14T11:00:00Z',
    updated_at: '2026-01-14T11:00:00Z'
  },
  {
    id: 'prod-ubiquiti-udm-pro',
    sku: 'UBI-UDM-SE',
    name: 'Ubiquiti UniFi Dream Machine Special Edition (UDM-SE) 2.5G PoE Gateway',
    slug: 'ubiquiti-unifi-dream-machine-se',
    category_id: 'cat-networking',
    category_name: 'Networking & Telecomm',
    brand_id: 'brand-ubiquiti',
    brand_name: 'Ubiquiti Inc.',
    description: 'Enterprise-grade, rack-mount UniFi Cloud Gateway with integrated PoE switch and 2.5 GbE WAN port. Hosts the entire UniFi software suite (Network, Protect, Access, Talk, Identity) and delivers 3.5+ Gbps routing throughput with full IDS/IPS intrusion prevention enabled.',
    short_description: 'All-in-one 1U Gateway with 2.5G WAN, 10G SFP+, 8-port PoE Switch, and 128GB Integrated SSD',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    additional_images: [
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80'
    ],
    price_usd: 599.00,
    compare_at_price_usd: 680.00,
    stock_quantity: 64,
    availability: 'IN_STOCK',
    status: 'ACTIVE',
    condition: 'NEW',
    weight_kg: 4.95,
    dimensions: '442.4 x 43.7 x 285.6 mm (1U)',
    manufacturer: 'Ubiquiti Inc.',
    country_of_origin: 'Taiwan',
    warranty: '2-Year Manufacturer Limited Warranty',
    specifications: {
      "WAN Ports": "1x 2.5 GbE RJ45 & 1x 10G SFP+",
      "LAN Ports": "8x Gigabit RJ45 (6x PoE 802.3af, 2x PoE+ 802.3at) & 1x 10G SFP+",
      "IDS/IPS Throughput": "3.5 Gbps",
      "Storage": "Integrated 128 GB SSD for UniFi OS + 3.5\" HDD Bay for Protect video recording",
      "Display": "1.3\" LCM Touchscreen for real-time traffic statistics",
      "Power Redundancy": "UniFi SmartPower RPS DC input"
    },
    seo_title: 'Ubiquiti UniFi UDM-SE Dream Machine Special Edition | Spinel Distribution',
    seo_description: 'Purchase authentic Ubiquiti UniFi Dream Machine SE gateway with PoE and 10G SFP+. Fast worldwide shipping by Spinel Distribution.',
    rating: 5.0,
    review_count: 312,
    created_at: '2026-01-15T09:30:00Z',
    updated_at: '2026-01-15T09:30:00Z'
  },
  {
    id: 'prod-victron-multiplus-ii',
    sku: 'VIC-MPII-48-5000',
    name: 'Victron Energy MultiPlus-II 48V / 5000VA / 70A-50A Pure Sine Inverter Charger',
    slug: 'victron-multiplus-ii-48v-5000va',
    category_id: 'cat-power',
    category_name: 'Power & Solar Inverters',
    brand_id: 'brand-victron',
    brand_name: 'Victron Energy',
    description: 'The MultiPlus-II combines the functions of the MultiPlus and the MultiGrid. It has all the features of the MultiPlus, plus an external current transformer option to implement PowerControl and PowerAssist and to optimize self-consumption with external current sensing.',
    short_description: '48V 5kVA Pure Sine Inverter with 70A Adaptive Charger and 50A Transfer Switch',
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    price_usd: 1450.00,
    compare_at_price_usd: 1650.00,
    stock_quantity: 24,
    availability: 'IN_STOCK',
    status: 'ACTIVE',
    condition: 'NEW',
    weight_kg: 30.0,
    dimensions: '565 x 320 x 149 mm',
    manufacturer: 'Victron Energy B.V.',
    country_of_origin: 'Netherlands',
    warranty: '5-Year International Manufacturer Warranty',
    specifications: {
      "DC Input Voltage": "38V - 66V (48V Nominal)",
      "Output Continuous Power": "5000VA / 4000 Watts at 25°C",
      "Peak Power": "9000 Watts",
      "Charge Current": "70 Amps",
      "Transfer Switch": "50 Amps",
      "Maximum Efficiency": "96%",
      "Communication": "VE.Bus port, Dual AC outputs for non-critical loads"
    },
    seo_title: 'Victron MultiPlus-II 48/5000/70 Inverter Charger | Spinel Distribution',
    seo_description: 'Authorized Victron MultiPlus-II 48V 5000VA inverter charger for commercial solar and backup power. Buy at Spinel Distribution.',
    rating: 4.9,
    review_count: 94,
    created_at: '2026-01-18T14:00:00Z',
    updated_at: '2026-01-18T14:00:00Z'
  },
  {
    id: 'prod-hikvision-4k-colorvu',
    sku: 'HIK-DS-2CD2387G2-LU',
    name: 'Hikvision 8MP 4K ColorVu AcuSense Fixed Turret Network IP Camera (2.8mm, Mic)',
    slug: 'hikvision-4k-colorvu-acusense-turret-camera',
    category_id: 'cat-security',
    category_name: 'Security & Surveillance',
    brand_id: 'brand-hikvision',
    brand_name: 'Hikvision Digital',
    description: 'High quality imaging with 8 MP (3840 × 2160) 4K resolution. ColorVu technology provides 24/7 vivid colorful images even in ultra-low lighting conditions down to 0.0005 Lux. Deep learning AcuSense AI classifies human and vehicle targets, dramatically reducing false alarms.',
    short_description: '8MP 4K Ultra HD 24/7 Color Night Vision IP Camera with Built-in Microphone and AcuSense AI',
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    price_usd: 245.00,
    compare_at_price_usd: 290.00,
    stock_quantity: 110,
    availability: 'IN_STOCK',
    status: 'ACTIVE',
    condition: 'NEW',
    weight_kg: 0.85,
    dimensions: 'Ø 138.3 mm × 125.2 mm',
    manufacturer: 'Hikvision Digital Technology Co., Ltd.',
    country_of_origin: 'China',
    warranty: '3-Year Official Replacement Warranty',
    specifications: {
      "Resolution": "8 Megapixel (3840 x 2160) at 20fps",
      "Lens": "2.8 mm Fixed Focal, Horizontal FOV 102°",
      "Low-Light Performance": "0.0005 Lux @ (F1.0, AGC ON), 0 Lux with White Light",
      "Supplement Light Range": "Up to 30 meters Warm White Light",
      "Video Compression": "H.265+ / H.265 / H.264+ / H.264",
      "Audio": "Built-in High Sensitivity Microphone",
      "Weather Resistance": "IP67 Water and Dust Resistant",
      "Power": "12 VDC ± 25% or PoE (802.3af, class 3)"
    },
    seo_title: 'Hikvision 8MP ColorVu AcuSense 4K IP Camera | Spinel Distribution',
    seo_description: 'Shop Hikvision 8MP 4K ColorVu security camera DS-2CD2387G2-LU with built-in mic and AI human vehicle detection at Spinel Distribution.',
    rating: 4.8,
    review_count: 178,
    created_at: '2026-01-20T12:15:00Z',
    updated_at: '2026-01-20T12:15:00Z'
  },
  {
    id: 'prod-lenovo-p16-workstation',
    sku: 'LEN-THINK-P16-G2',
    name: 'Lenovo ThinkPad P16 Gen 2 16" Mobile Workstation (i9-13980HX, 64GB RAM, RTX 4000 Ada 12GB, 2TB SSD)',
    slug: 'lenovo-thinkpad-p16-gen-2-workstation',
    category_id: 'cat-computing',
    category_name: 'Commercial Computing',
    brand_id: 'brand-lenovo',
    brand_name: 'Lenovo Enterprise',
    description: 'Built for the modern power user on the go, the Lenovo ThinkPad P16 Gen 2 (16" Intel) mobile workstation is a powerhouse powerhouse. Featuring the ultra-fast 24-core Intel Core i9-13980HX processor and professional NVIDIA RTX 4000 Ada Generation graphics with 12GB GDDR6 VRAM.',
    short_description: '16" 4K OLED Touch, Intel Core i9-13980HX, 64GB DDR5, NVIDIA RTX 4000 Ada 12GB',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    price_usd: 3980.00,
    compare_at_price_usd: 4450.00,
    stock_quantity: 12,
    availability: 'IN_STOCK',
    status: 'ACTIVE',
    condition: 'NEW',
    weight_kg: 2.95,
    dimensions: '364 x 266 x 30.2 mm',
    manufacturer: 'Lenovo Group Ltd.',
    country_of_origin: 'United States',
    warranty: '3-Year Premier Support with Accidental Damage Protection',
    specifications: {
      "Processor": "Intel Core i9-13980HX (24 Cores / 32 Threads, up to 5.6 GHz, 36MB Cache)",
      "Graphics": "NVIDIA RTX 4000 Ada Generation Laptop GPU 12GB GDDR6",
      "Display": "16\" WQUXGA (3840 x 2400) OLED, 400 nits, 100% DCI-P3, HDR 500 True Black, Factory Color Calibrated",
      "Memory": "64 GB DDR5-5600MHz (2x 32GB, 4 SO-DIMM slots, up to 192GB)",
      "Storage": "2 TB PCIe Gen4 NVMe M.2 2280 Performance SSD",
      "Ports": "2x Thunderbolt 4 / USB4 40Gbps, 1x USB-C 3.2 Gen 2, 2x USB-A 3.2 Gen 1, HDMI 2.1, SD Express 7.0 Reader",
      "Security": "dTPM 2.0, Match-on-Chip Fingerprint Reader, FHD IR Camera with Privacy Shutter"
    },
    seo_title: 'Lenovo ThinkPad P16 Gen 2 i9 RTX 4000 Ada Workstation | Spinel Distribution',
    seo_description: 'Order Lenovo ThinkPad P16 Gen 2 mobile workstation with Core i9 and RTX 4000 Ada GPU at Spinel Distribution. Best price & warranty.',
    rating: 4.9,
    review_count: 52,
    created_at: '2026-01-22T16:45:00Z',
    updated_at: '2026-01-22T16:45:00Z'
  },
  {
    id: 'prod-cisco-c9200-24t',
    sku: 'CS-C9200L-24T-4G-A',
    name: 'Cisco Catalyst 9200L 24-Port Data Switch with 4x 1G SFP Uplinks',
    slug: 'cisco-catalyst-9200l-24-port-switch',
    category_id: 'cat-networking',
    category_name: 'Networking & Telecomm',
    brand_id: 'brand-cisco',
    brand_name: 'Cisco Systems',
    description: 'Extend the power of intent-based networking with Cisco Catalyst 9200 Series switches. Featuring 24 x 10/100/1000 Gigabit data ports and 4 fixed 1G SFP optical uplink ports. Exceptional reliability with FRU power supplies and fans, modular uplinks, and cold patching.',
    short_description: '24-Port Gigabit Ethernet Managed Switch with 4x 1G SFP Uplinks and Network Advantage',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    price_usd: 1950.00,
    compare_at_price_usd: 2300.00,
    stock_quantity: 50,
    availability: 'IN_STOCK',
    status: 'ACTIVE',
    condition: 'NEW',
    weight_kg: 4.35,
    dimensions: '4.4 x 44.5 x 28.8 cm (1U)',
    manufacturer: 'Cisco Systems, Inc.',
    country_of_origin: 'China',
    warranty: 'Enhanced Limited Lifetime Warranty (E-LLW)',
    specifications: {
      "Downlink Ports": "24x 10/100/1000 Gigabit Ethernet",
      "Uplink Ports": "4x 1G SFP Fixed",
      "Switching Bandwidth": "56 Gbps",
      "Forwarding Rate": "41.66 Mpps",
      "DRAM": "2 GB",
      "Flash Memory": "4 GB"
    },
    seo_title: 'Cisco Catalyst 9200L 24-Port Switch CS-C9200L-24T-4G-A | Spinel Distribution',
    seo_description: 'Genuine Cisco Catalyst 9200L 24-port switch available with worldwide delivery from Spinel Distribution.',
    rating: 4.7,
    review_count: 63,
    created_at: '2026-01-25T11:00:00Z',
    updated_at: '2026-01-25T11:00:00Z'
  }
];
