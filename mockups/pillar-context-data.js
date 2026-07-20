/** Shared pillar copy for context mockups */
const PILLAR_CTX = {
  "ai-dc": {
    label: "AI-Ready Data Centers",
    color: "#0a60ff",
    icon: "../assets/deck/slide12-ai-dc.svg",
    familyCount: 7,
    cols: 4,
    families: [
      { id: "aci", label: "ACI", abbr: "ACI" },
      { id: "intersight", label: "Intersight", abbr: "IS" },
      { id: "nexus-dashboard", label: "Nexus Dashboard", abbr: "ND" },
      { id: "nexus-one", label: "Nexus One", abbr: "N1" },
      { id: "nexus", label: "Nexus Switches", abbr: "NX" },
      { id: "silicon-one", label: "Silicon One", abbr: "Si" },
      { id: "ucs", label: "UCS Servers", abbr: "UC" }
    ],
    promise: "Transform data centers to power AI workloads anywhere",
    scope: "Public and private clouds, edge, on-premises",
    highlights: [
      { title: "Comprehensive infrastructure", body: "Integrated networking, compute, and storage for every workload", icon: "⬡" },
      { title: "Unified operations", body: "One management layer across traditional and AI environments", icon: "◎" },
      { title: "Security everywhere", body: "Protect hyper-distributed workloads from ground to cloud", icon: "◈" }
    ]
  },
  workplaces: {
    label: "Future-Proofed Workplaces",
    color: "#2dce5c",
    icon: "../assets/deck/slide12-workplaces.svg",
    familyCount: 24,
    cols: 6,
    families: [
      { id: "webex-app", label: "Webex Suite", abbr: "Wx" },
      { id: "room-systems", label: "Room Systems", abbr: "Rm" },
      { id: "catalyst-access", label: "Catalyst Access", abbr: "CA" },
      { id: "catalyst-wireless", label: "Catalyst Wireless", abbr: "CW" },
      { id: "sdwan", label: "Cisco SD-WAN", abbr: "SD" },
      { id: "meraki-mx", label: "Meraki MX", abbr: "MX" },
      { id: "ip-phones", label: "IP Phones", abbr: "IP" },
      { id: "webex-calling", label: "Webex Calling", abbr: "WC" }
    ],
    promise: "Modernize everywhere people work and serve customers",
    scope: "Campuses, branches, factories, homes, and beyond",
    highlights: [
      { title: "Intelligent infrastructure", body: "Secure networking with real-time insights and automation", icon: "⬡" },
      { title: "User protection", body: "Frictionless zero-trust access from any location", icon: "◎" },
      { title: "Smart buildings", body: "Secure, sustainable workplaces with actionable insights", icon: "◈" },
      { title: "Collaboration devices", body: "Immersive experiences for every workspace", icon: "◇" },
      { title: "Hybrid work software", body: "Employee and customer experiences that scale", icon: "○" }
    ]
  },
  resilience: {
    label: "Digital Resilience",
    color: "#ff9000",
    icon: "../assets/deck/slide12-resilience.svg",
    gradient: true,
    familyCount: 26,
    cols: 6,
    families: [
      { id: "hypershield", label: "Hypershield", abbr: "HS" },
      { id: "ise", label: "Cisco ISE", abbr: "IS" },
      { id: "umbrella", label: "Umbrella", abbr: "Um" },
      { id: "duo", label: "Duo", abbr: "Du" },
      { id: "xdr", label: "XDR", abbr: "XD" },
      { id: "thousandeyes", label: "ThousandEyes", abbr: "TE" },
      { id: "secure-access", label: "Secure Access", abbr: "SA" },
      { id: "splunk", label: "Splunk", abbr: "Sp" }
    ],
    promise: "Stay secure, reliable, and performing across your entire digital footprint",
    scope: null,
    highlights: [
      { title: "Security", body: "Threat prevention, detection, and response at any maturity", icon: "⬡" },
      { title: "Assurance", body: "End-to-end connectivity to assure application delivery", icon: "◎" },
      { title: "Observability", body: "Visibility across owned and unowned environments", icon: "◈" }
    ]
  }
};

const PILLAR_ORDER = ["ai-dc", "workplaces", "resilience"];
