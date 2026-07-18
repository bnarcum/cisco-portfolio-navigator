/**
 * Problems → Outcomes → Products layer (curated portfolio knowledge).
 *
 * This is the "why it matters" axis for the Portfolio Navigator. The tool already
 * models WHAT (families/products) and HOW (LINKS/bundles). This module adds the
 * business problem each family solves, the outcome, a directional proof point,
 * and persona-specific framing — then ties it back to the taxonomy the app
 * already maintains (useCases, BUNDLES names, dCloud path ids, One Cisco pillars).
 *
 * IMPORTANT: proof points are curated, directional talking points sourced from
 * Cisco solution positioning — NOT guarantees or live customer metrics. Treat
 * them as "commonly reported" outcomes for conversation, not contractual claims.
 *
 * Keys are intentionally reused so there is ONE source of truth:
 *   - families[]  → NODES ids (same ids products point at via .family)
 *   - bundles[]   → BUNDLES[].name strings
 *   - useCases[]  → NODES[].useCases / REF_ARCH keys
 *   - dcloudPath  → dcloud-links.json paths[].id
 *   - pillar      → ONE_CISCO.pillars[].id (+ "connectivity")
 *   - maturityNext→ another PROBLEMS id (expansion roadmap)
 */
(function () {
  "use strict";

  const PERSONAS = [
    { id: "netops", label: "NetOps", full: "Network / IT Operations" },
    { id: "cio", label: "CIO", full: "CIO / Business leader" },
    { id: "ciso", label: "CISO", full: "Security leader" }
  ];

  const DISCLAIMER =
    "Curated, directional talking points from Cisco solution positioning — not guarantees or live metrics.";

  const PROBLEMS = [
    /* ── Connectivity / Networking ─────────────────────────────────── */
    {
      id: "branch-app-experience",
      pillar: "connectivity",
      symptom: "Branch and remote users blame the network when SaaS, voice, and Webex feel slow.",
      outcome: "Consistent application experience from every site and home office.",
      proof: {
        metric: "Mean time to resolve app-vs-network issues",
        before: "Hours of finger-pointing with no shared evidence",
        after: "Minutes to pinpoint the failing hop",
        source: "Cisco SD-WAN + ThousandEyes positioning"
      },
      personas: {
        netops: {
          line: "Steer traffic around brownouts automatically and prove where loss occurs with per-hop evidence.",
          symptom: "Every SaaS slowdown becomes a network ticket you have to disprove by hand.",
          proof: { metric: "MTTR for app-vs-network issues", before: "Hours of finger-pointing with no shared evidence", after: "Minutes to pinpoint the failing hop with per-hop telemetry" }
        },
        cio: {
          line: "Protect workforce productivity across every branch without adding circuits.",
          symptom: "Slow apps at branches quietly drain workforce productivity everywhere.",
          proof: { metric: "Branch workforce productivity", before: "Users lose time to unpredictable app performance", after: "Consistent app experience without adding costly circuits" }
        },
        ciso: {
          line: "Reach cloud apps securely without backhauling traffic to the data center.",
          symptom: "Backhauling branch traffic for inspection adds latency and risk.",
          proof: { metric: "Secure branch-to-cloud access", before: "Traffic hair-pinned to the data center for inspection", after: "Direct, inspected cloud access at the branch edge (SASE)" }
        }
      },
      useCases: ["SD-WAN / SASE", "Hybrid Work", "Cloud Migration"],
      bundles: ["Cloud Branch (SASE)"],
      families: ["sdwan", "meraki-mx", "isr-routers", "secure-routers", "thousandeyes", "secure-access"],
      refArch: "SD-WAN / SASE",
      signals: { has: ["sdwan"], missing: ["thousandeyes"] },
      dcloudPath: "sdwan-sase",
      maturityNext: "observability-blindspots"
    },
    {
      id: "campus-manual-ops",
      pillar: "connectivity",
      symptom: "The network team spends its week on manual CLI changes, tickets, and firefighting.",
      outcome: "Automated, intent-based operations with AI assurance across campus and WAN.",
      proof: {
        metric: "Time spent on manual provisioning & troubleshooting",
        before: "Change windows measured in days; config drift everywhere",
        after: "Templated, closed-loop automation with proactive assurance",
        source: "Cisco Catalyst Center automation positioning"
      },
      personas: {
        netops: {
          line: "Push standardized changes fleet-wide and let assurance flag issues before users call.",
          symptom: "You're the bottleneck — every change is a manual, after-hours CLI push.",
          proof: { metric: "Provisioning & troubleshooting effort", before: "Change windows in days; config drift everywhere", after: "Templated, closed-loop automation with proactive assurance" }
        },
        cio: {
          line: "Free scarce network talent from repetitive toil to focus on the business.",
          symptom: "Skilled network engineers burn their week on repetitive toil, not the business.",
          proof: { metric: "Return on network talent", before: "Experts stuck on manual break-fix", after: "Teams freed for higher-value initiatives" }
        },
        ciso: {
          line: "Consistent policy everywhere means fewer misconfigurations to exploit.",
          symptom: "Manual, inconsistent configs are a steady source of exploitable gaps.",
          proof: { metric: "Config-driven exposure", before: "Drift and one-off changes create security holes", after: "Consistent, policy-based configuration everywhere" }
        }
      },
      useCases: ["Network Automation", "AI Networking"],
      bundles: [],
      families: ["catalyst-center", "catalyst-access", "catalyst-core", "meraki-switches", "intersight"],
      refArch: "Network Automation",
      signals: { has: ["catalyst-access"], missing: ["catalyst-center"] },
      dcloudPath: "network-automation",
      maturityNext: "observability-blindspots"
    },
    {
      id: "wifi-complaints",
      pillar: "workplaces",
      symptom: "\"The Wi-Fi is bad\" is a constant complaint, but no one can prove or fix the root cause.",
      outcome: "Reliable, self-optimizing wireless with client-level visibility.",
      proof: {
        metric: "Wireless issue triage time",
        before: "Guesswork and walk-arounds with a laptop",
        after: "Per-client health scores and AI-driven RF optimization",
        source: "Cisco / Meraki wireless assurance positioning"
      },
      personas: {
        netops: {
          line: "See every client's experience and let AI tune RF instead of manual surveys.",
          symptom: "Wi-Fi complaints send you walking the floor with a laptop, guessing at RF.",
          proof: { metric: "Wireless triage time", before: "Guesswork and manual site surveys", after: "Per-client health scores and AI-driven RF optimization" }
        },
        cio: {
          line: "Dependable connectivity for hybrid work, guests, and IoT in every space.",
          symptom: "Flaky Wi-Fi undermines hybrid work, guests, and every connected space.",
          proof: { metric: "Workplace connectivity reliability", before: "Unpredictable coverage and constant complaints", after: "Dependable, self-optimizing wireless everywhere" }
        },
        ciso: {
          line: "Identify and segment rogue and unmanaged devices on the air.",
          symptom: "Unmanaged and rogue devices on the air are an invisible attack surface.",
          proof: { metric: "Wireless device exposure", before: "Unknown clients and rogue APs on the network", after: "Identified, segmented, and monitored wireless clients" }
        }
      },
      useCases: ["Hybrid Work", "Network Automation", "AI Networking"],
      bundles: [],
      families: ["catalyst-wireless", "meraki-wireless", "catalyst-center"],
      refArch: "AI Networking",
      signals: { has: ["catalyst-wireless"], missing: ["catalyst-center"] },
      dcloudPath: "network-automation",
      maturityNext: "campus-manual-ops"
    },

    /* ── Security / Resilience ─────────────────────────────────────── */
    {
      id: "flat-network-breach",
      pillar: "resilience",
      symptom: "One infected laptop can reach everything — a flat network turns an incident into an outage.",
      outcome: "Zero-trust segmentation that contains threats to a single segment.",
      proof: {
        metric: "Blast radius of a compromised device",
        before: "Lateral movement across the whole network",
        after: "Contained to one segment via identity-based policy",
        source: "Cisco Zero Trust (ISE + Secure Firewall + Duo) positioning"
      },
      personas: {
        netops: {
          line: "Enforce who-talks-to-whom without redesigning the network by hand.",
          symptom: "Segmenting the network by hand means VLAN spaghetti no one wants to touch.",
          proof: { metric: "Effort to enforce segmentation", before: "Manual ACLs and VLANs that break things", after: "Identity-based policy pushed without redesign" }
        },
        cio: {
          line: "Reduce the business impact of the breach that will eventually happen.",
          symptom: "One infected device can escalate into a business-wide outage.",
          proof: { metric: "Business impact of a breach", before: "Lateral movement across the whole network", after: "Damage contained to a single segment" }
        },
        ciso: {
          line: "Identity-based micro-segmentation that stops lateral movement cold.",
          symptom: "Flat networks let attackers move laterally at will after the first foothold.",
          proof: { metric: "Blast radius of a compromised device", before: "Unrestricted lateral movement", after: "Contained to one segment via identity-based policy" }
        }
      },
      useCases: ["Zero Trust Security", "Network Automation"],
      bundles: ["Zero Trust Foundation"],
      families: ["ise", "sf-branch", "sf-enterprise", "duo", "secure-access", "secure-workload", "hypershield"],
      refArch: "Zero Trust Security",
      signals: { has: ["ise"], missing: ["duo"] },
      dcloudPath: "zero-trust",
      maturityNext: "threat-dwell-time"
    },
    {
      id: "vpn-overload",
      pillar: "connectivity",
      symptom: "Legacy VPN is slow, over-trusted, and doesn't scale to a hybrid workforce.",
      outcome: "Zero-trust access to any app, on-prem or cloud, without a full-tunnel VPN.",
      proof: {
        metric: "Remote access risk & user friction",
        before: "Broad network access once the VPN is up",
        after: "Per-app, identity- and posture-based access (ZTNA)",
        source: "Cisco Secure Access (SSE) positioning"
      },
      personas: {
        netops: {
          line: "Retire VPN concentrators for a cloud-delivered access edge.",
          symptom: "You're scaling and babysitting VPN concentrators that users still hate.",
          proof: { metric: "Remote access ops burden", before: "VPN concentrators to size, patch, and scale", after: "Cloud-delivered access edge, no concentrators" }
        },
        cio: {
          line: "Faster, simpler access for employees and third parties from anywhere.",
          symptom: "Clunky remote access slows down employees and partners every day.",
          proof: { metric: "Workforce access experience", before: "Slow, all-or-nothing VPN logins", after: "Fast, per-app access from anywhere" }
        },
        ciso: {
          line: "Least-privilege access replaces implicit trust in the VPN tunnel.",
          symptom: "Once the VPN is up, users get broad, implicit network trust.",
          proof: { metric: "Remote access trust model", before: "Broad network access once the tunnel is up", after: "Per-app, identity- and posture-based access (ZTNA)" }
        }
      },
      useCases: ["Zero Trust Security", "SD-WAN / SASE", "Hybrid Work"],
      bundles: ["Cloud Branch (SASE)", "Zero Trust Foundation"],
      families: ["secure-access", "duo", "umbrella", "secure-client"],
      refArch: "Zero Trust Security",
      signals: { has: ["secure-client"], missing: ["secure-access"] },
      dcloudPath: "zero-trust",
      maturityNext: "flat-network-breach"
    },
    {
      id: "threat-dwell-time",
      pillar: "resilience",
      symptom: "Attacks hide for weeks and the SOC drowns in disconnected alerts.",
      outcome: "Correlated detection and automated response across endpoint, network, and SIEM.",
      proof: {
        metric: "Threat dwell time & analyst effort",
        before: "Siloed tools; manual correlation across consoles",
        after: "One correlated incident with guided/automated response",
        source: "Cisco XDR + Splunk + Talos positioning"
      },
      personas: {
        netops: {
          line: "Fewer console swivel-chairs; network context feeds the investigation automatically.",
          symptom: "Security keeps pulling you into investigations across yet more consoles.",
          proof: { metric: "Network's role in investigations", before: "Manual pulls of network context per case", after: "Network telemetry auto-feeds the investigation" }
        },
        cio: {
          line: "Detect and contain incidents before they become headlines.",
          symptom: "Threats dwell for weeks — the next one could be the headline breach.",
          proof: { metric: "Incident containment speed", before: "Weeks of undetected dwell time", after: "Fast detection and contained incidents" }
        },
        ciso: {
          line: "Cross-domain correlation and Talos intel cut dwell time and analyst fatigue.",
          symptom: "Your SOC swivel-chairs across siloed tools while attackers dwell.",
          proof: { metric: "Threat dwell time & analyst effort", before: "Siloed tools; manual correlation across consoles", after: "One correlated incident with guided/automated response" }
        }
      },
      useCases: ["Zero Trust Security"],
      bundles: ["Threat Defense Platform"],
      families: ["xdr", "secure-endpoint", "splunk", "talos", "stealthwatch"],
      signals: { has: ["secure-endpoint"], missing: ["xdr"] },
      dcloudPath: "zero-trust",
      maturityNext: "unknown-assets"
    },
    {
      id: "phishing-email",
      pillar: "resilience",
      symptom: "Email is still the #1 way attackers get in — phishing and BEC slip past filters.",
      outcome: "Layered email defense that blocks phishing, malware, and account takeover.",
      proof: {
        metric: "Malicious email reaching inboxes",
        before: "Native filtering misses targeted phishing/BEC",
        after: "Threat intelligence-driven blocking with rapid remediation",
        source: "Cisco Secure Email Threat Defense positioning"
      },
      personas: {
        netops: {
          line: "Less malware to chase on endpoints and the network.",
          symptom: "Every phishing click becomes malware you chase across endpoints and the network.",
          proof: { metric: "Downstream malware cleanup", before: "Infections spread from clicked emails", after: "Threats blocked before they reach inboxes" }
        },
        cio: {
          line: "Protect the workforce from the most common breach entry point.",
          symptom: "Phishing and BEC target your people and your finances directly.",
          proof: { metric: "Exposure to email-borne fraud", before: "Targeted phishing/BEC reaching staff", after: "Layered defense against fraud and account takeover" }
        },
        ciso: {
          line: "Talos-backed detection of phishing, BEC, and malicious payloads.",
          symptom: "Native email filtering misses targeted phishing and BEC.",
          proof: { metric: "Malicious email reaching inboxes", before: "Native filtering misses targeted phishing/BEC", after: "Threat intelligence-driven blocking with rapid remediation" }
        }
      },
      useCases: ["Zero Trust Security"],
      bundles: ["Threat Defense Platform"],
      families: ["secure-email", "secure-endpoint", "secure-web", "talos"],
      signals: { has: ["secure-endpoint"], missing: ["secure-email"] },
      maturityNext: "threat-dwell-time"
    },
    {
      id: "identity-attacks",
      pillar: "resilience",
      symptom: "Stolen credentials and MFA fatigue are a top attack path into apps and infrastructure.",
      outcome: "Strong, phishing-resistant identity with continuous trust checks.",
      proof: {
        metric: "Credential-based intrusion risk",
        before: "Passwords + basic MFA that users click through",
        after: "Device trust, risk-based and phishing-resistant MFA",
        source: "Cisco Duo + Identity Intelligence positioning"
      },
      personas: {
        netops: {
          line: "One access policy engine across VPN, apps, and network.",
          symptom: "You maintain separate access rules across VPN, apps, and the network.",
          proof: { metric: "Access policy sprawl", before: "Different policy engines per access path", after: "One policy engine across VPN, apps, and network" }
        },
        cio: {
          line: "Reduce account-takeover risk without slowing employees down.",
          symptom: "Account-takeover risk grows, but employees won't tolerate more friction.",
          proof: { metric: "Account-takeover risk vs. friction", before: "Passwords + basic MFA users click through", after: "Strong identity that stays low-friction" }
        },
        ciso: {
          line: "Continuous, risk-based identity assurance and anomaly detection.",
          symptom: "Stolen credentials and MFA fatigue are the top path into your apps.",
          proof: { metric: "Credential-based intrusion risk", before: "Passwords + basic MFA that users click through", after: "Device trust, risk-based and phishing-resistant MFA" }
        }
      },
      useCases: ["Zero Trust Security", "Hybrid Work"],
      bundles: ["Zero Trust Foundation"],
      families: ["duo", "ise", "identity-intel", "secure-access"],
      refArch: "Zero Trust Security",
      signals: { has: ["duo"], missing: ["identity-intel"] },
      dcloudPath: "zero-trust",
      maturityNext: "flat-network-breach"
    },
    {
      id: "ai-app-security",
      pillar: "resilience",
      symptom: "New AI apps and models introduce risks that traditional security tools don't see.",
      outcome: "Guardrails and runtime protection purpose-built for AI workloads.",
      proof: {
        metric: "AI/workload attack surface",
        before: "AI apps deployed with no model- or prompt-level controls",
        after: "Validated models, protected runtime, and segmented workloads",
        source: "Cisco AI Defense + Hypershield positioning"
      },
      personas: {
        netops: {
          line: "Autonomous, kernel-level segmentation that keeps up with workload sprawl.",
          symptom: "AI workloads spin up faster than you can segment them by hand.",
          proof: { metric: "Keeping pace with workload sprawl", before: "Manual segmentation lags deployment", after: "Autonomous, kernel-level segmentation" }
        },
        cio: {
          line: "Adopt AI confidently without opening a new class of risk.",
          symptom: "The business wants AI now, but no one owns the new risk it creates.",
          proof: { metric: "Confidence to adopt AI", before: "AI apps deployed with no guardrails", after: "AI adopted with controls built in" }
        },
        ciso: {
          line: "Discover, validate, and protect AI apps and models end to end.",
          symptom: "AI apps and models are a blind spot for traditional security tools.",
          proof: { metric: "AI/workload attack surface", before: "AI apps deployed with no model- or prompt-level controls", after: "Validated models, protected runtime, and segmented workloads" }
        }
      },
      useCases: ["Zero Trust Security", "Data Center Modernization", "AI Networking"],
      bundles: [],
      families: ["ai-defense", "hypershield", "secure-workload", "multicloud-defense"],
      signals: { has: ["secure-workload"], missing: ["ai-defense"] },
      maturityNext: "ai-infra-ready"
    },

    /* ── Collaboration / Workplaces ────────────────────────────────── */
    {
      id: "hybrid-meeting-equity",
      pillar: "workplaces",
      symptom: "Remote attendees can't participate equally and expensive rooms sit underused.",
      outcome: "Equitable hybrid meetings with AI-powered rooms people actually book.",
      proof: {
        metric: "Meeting equity & room utilization",
        before: "In-room voices dominate; remote people are second-class",
        after: "AI framing, noise removal, and per-person audio for everyone",
        source: "Cisco Rooms + Webex positioning"
      },
      personas: {
        netops: {
          line: "Zero-touch devices managed centrally in Control Hub.",
          symptom: "Every room is a different config, and each glitch is a manual ticket.",
          proof: { metric: "Room device operations", before: "Per-site setup; a call for every room issue", after: "Zero-touch, fleet-managed rooms in Control Hub" }
        },
        cio: {
          line: "Get the return on real estate and make hybrid work feel fair.",
          symptom: "Expensive rooms sit empty while hybrid meetings feel unfair.",
          proof: { metric: "Real-estate ROI & meeting equity", before: "Underused rooms; remote people are second-class", after: "Booked rooms and equitable hybrid meetings" }
        },
        ciso: {
          line: "Managed, updatable endpoints instead of unmanaged BYO gear.",
          symptom: "Unmanaged BYO meeting gear is a blind spot in the room.",
          proof: { metric: "Meeting endpoint governance", before: "Shadow, unpatched BYO AV devices", after: "Managed, updatable, monitored endpoints" }
        }
      },
      useCases: ["Hybrid Work"],
      bundles: ["Hybrid Work Suite"],
      families: ["room-systems", "desk-devices", "webex-meetings", "webex-app", "cisco-headsets", "conf-phones"],
      refArch: "Hybrid Work",
      signals: { has: ["webex-app"], missing: ["room-systems"] },
      dcloudPath: "hybrid-work",
      maturityNext: "room-quality"
    },
    {
      id: "pbx-eol",
      pillar: "workplaces",
      symptom: "The aging PBX is end-of-life and on-prem telephony is costly to maintain.",
      outcome: "Cloud calling that unifies voice with meetings and messaging.",
      proof: {
        metric: "Telephony TCO & agility",
        before: "Hardware PBX, PSTN contracts, per-site maintenance",
        after: "Cloud calling with global reach in one app and admin plane",
        source: "Cisco Webex Calling positioning"
      },
      personas: {
        netops: {
          line: "Retire PBX hardware; manage calling from the cloud.",
          symptom: "You're keeping an end-of-life PBX and PSTN gear alive site by site.",
          proof: { metric: "Telephony maintenance burden", before: "Per-site PBX hardware to maintain", after: "Cloud calling managed from one plane" }
        },
        cio: {
          line: "Modern calling experience with predictable subscription cost.",
          symptom: "On-prem telephony is a shrinking, costly asset with no agility.",
          proof: { metric: "Telephony TCO & agility", before: "Hardware PBX, PSTN contracts, per-site maintenance", after: "Cloud calling with global reach in one app and admin plane" }
        },
        ciso: {
          line: "Centralized, encrypted calling with unified admin controls.",
          symptom: "Legacy telephony sprawls admin and lacks modern encryption.",
          proof: { metric: "Calling security & control", before: "Fragmented, hard-to-secure PBX admin", after: "Centralized, encrypted cloud calling" }
        }
      },
      useCases: ["Hybrid Work"],
      bundles: ["Hybrid Work Suite"],
      families: ["webex-calling", "webex-app", "ip-phones", "conf-phones"],
      refArch: "Hybrid Work",
      signals: { has: ["ip-phones"], missing: ["webex-calling"] },
      dcloudPath: "hybrid-work",
      maturityNext: "contact-center-cx"
    },
    {
      id: "contact-center-cx",
      pillar: "workplaces",
      symptom: "Customers wait on hold, repeat themselves, and can't reach you on digital channels.",
      outcome: "AI-powered, omnichannel customer experience with self-service.",
      proof: {
        metric: "Customer effort & handle time",
        before: "Voice-only queues; agents lack context",
        after: "AI routing, digital channels, and self-service deflection",
        source: "Cisco Webex Contact Center positioning"
      },
      personas: {
        netops: {
          line: "Cloud-delivered CC with no on-prem stack to babysit.",
          symptom: "The on-prem contact-center stack is a fragile thing you babysit.",
          proof: { metric: "Contact-center ops burden", before: "On-prem CC stack to maintain and patch", after: "Cloud-delivered CC with nothing to babysit" }
        },
        cio: {
          line: "Differentiate on customer experience and lower cost-to-serve.",
          symptom: "Poor customer experience raises cost-to-serve and drives churn.",
          proof: { metric: "Customer effort & cost-to-serve", before: "Voice-only queues; agents lack context", after: "AI routing, digital channels, and self-service deflection" }
        },
        ciso: {
          line: "Secure agent access and compliant, encrypted interactions.",
          symptom: "Agent access and customer data in the contact center must stay compliant.",
          proof: { metric: "CC access & data protection", before: "Broad agent access; compliance gaps", after: "Secure agent access and encrypted interactions" }
        }
      },
      useCases: ["Hybrid Work"],
      bundles: ["Cloud Contact Center"],
      families: ["webex-cc", "webex-connect", "webex-calling", "webex-app"],
      signals: { has: ["webex-calling"], missing: ["webex-cc"] },
      dcloudPath: "contact-center",
      maturityNext: "pbx-eol"
    },
    {
      id: "room-quality",
      pillar: "workplaces",
      symptom: "Executives complain that video is choppy and no one can explain why fast enough.",
      outcome: "Proactive meeting quality with cross-domain root cause in minutes.",
      proof: {
        metric: "Time to root-cause a bad meeting",
        before: "Blame bounces between collab, network, and ISP",
        after: "Correlated device + path evidence in one investigation",
        source: "Cisco Cloud Control / AI Canvas positioning"
      },
      personas: {
        netops: {
          line: "See device health and WAN path health side by side.",
          symptom: "A bad exec meeting means blame bounces between collab, network, and ISP — landing on you.",
          proof: { metric: "Time to root-cause a bad meeting", before: "Blame bounces between collab, network, and ISP", after: "Correlated device + path evidence in one investigation" }
        },
        cio: {
          line: "Reliable executive and all-hands experiences, every time.",
          symptom: "Choppy executive and all-hands meetings are visible, embarrassing failures.",
          proof: { metric: "Executive meeting reliability", before: "Unexplained quality issues in high-stakes meetings", after: "Reliable executive and all-hands experiences" }
        },
        ciso: {
          line: "Managed devices and visibility instead of shadow AV.",
          symptom: "When quality is poor, shadow AV and unmanaged tools creep in.",
          proof: { metric: "Meeting estate visibility", before: "Shadow AV workarounds outside IT", after: "Managed devices with full visibility" }
        }
      },
      useCases: ["Hybrid Work", "SD-WAN / SASE"],
      bundles: ["Hybrid Work Suite", "Cloud Control Platform"],
      families: ["room-systems", "thousandeyes", "cloud-control", "webex-meetings"],
      signals: { has: ["room-systems"], missing: ["thousandeyes"] },
      dcloudPath: "hybrid-work",
      maturityNext: "observability-blindspots"
    },

    /* ── Data Center / AI ──────────────────────────────────────────── */
    {
      id: "ai-infra-ready",
      pillar: "ai-dc",
      symptom: "The business wants AI/GPU workloads but the data center isn't built for them.",
      outcome: "An AI-ready fabric and compute foundation that scales GPU workloads.",
      proof: {
        metric: "Time-to-stand-up AI infrastructure",
        before: "Hand-built, congested fabrics that starve GPUs",
        after: "Validated AI-ready fabric + compute with lossless transport",
        source: "Cisco AI-Ready Data Center (Nexus + UCS + Silicon One) positioning"
      },
      personas: {
        netops: {
          line: "Non-blocking, low-latency fabric designed for RDMA/AI traffic.",
          symptom: "GPU clusters need lossless, low-latency fabric you can't hand-build.",
          proof: { metric: "AI fabric readiness", before: "Congested, hand-built fabrics that starve GPUs", after: "Validated non-blocking fabric for RDMA/AI traffic" }
        },
        cio: {
          line: "Stand up AI initiatives on infrastructure that won't be the bottleneck.",
          symptom: "AI initiatives stall because the data center isn't ready for them.",
          proof: { metric: "Time-to-stand-up AI infrastructure", before: "Infrastructure is the bottleneck for AI", after: "Validated AI-ready fabric + compute that scales" }
        },
        ciso: {
          line: "Segment and protect high-value AI data and workloads by design.",
          symptom: "High-value AI data and workloads need protection by design, not after.",
          proof: { metric: "AI data/workload protection", before: "AI workloads on flat, open infrastructure", after: "Segmented, protected AI workloads by design" }
        }
      },
      useCases: ["AI Networking", "Data Center Modernization", "Data Center Networking"],
      bundles: ["AI-Ready Data Center Network"],
      families: ["nexus", "nexus-one", "silicon-one", "ucs", "intersight"],
      refArch: "AI Networking",
      signals: { has: ["ucs"], missing: ["nexus"] },
      dcloudPath: "ai-networking",
      maturityNext: "ai-fabric-bottleneck"
    },
    {
      id: "dc-sprawl",
      pillar: "ai-dc",
      symptom: "The data center is a sprawl of legacy silos that are slow and costly to operate.",
      outcome: "A modern, policy-driven data center operated from the cloud.",
      proof: {
        metric: "Data center operational complexity",
        before: "Device-by-device management across disconnected silos",
        after: "Policy-based fabric + HCI with cloud operations",
        source: "Cisco Data Center Modernization positioning"
      },
      personas: {
        netops: {
          line: "Automate fabric and compute from a single operations plane.",
          symptom: "You manage the data center device-by-device across disconnected silos.",
          proof: { metric: "DC operational complexity", before: "Device-by-device management across silos", after: "Policy-based fabric + HCI with cloud operations" }
        },
        cio: {
          line: "Lower data center TCO and move faster on new services.",
          symptom: "The legacy data center is slow to change and expensive to run.",
          proof: { metric: "Data center TCO & agility", before: "Costly silos; slow to deliver new services", after: "Lower TCO and faster new services" }
        },
        ciso: {
          line: "Consistent policy and workload protection across the estate.",
          symptom: "Inconsistent policy across data-center silos leaves workloads exposed.",
          proof: { metric: "Workload policy consistency", before: "Uneven policy across disconnected silos", after: "Consistent workload protection across the estate" }
        }
      },
      useCases: ["Data Center Modernization", "Data Center Networking", "Network Automation"],
      bundles: ["Data Center Modernization"],
      families: ["nexus", "aci", "ucs", "hyperflex", "intersight", "multicloud-defense"],
      refArch: "Data Center Modernization",
      signals: { has: ["ucs"], missing: ["intersight"] },
      dcloudPath: "dc-modernization",
      maturityNext: "ai-infra-ready"
    },
    {
      id: "ai-fabric-bottleneck",
      pillar: "ai-dc",
      symptom: "GPU training jobs stall and no one can tell if the fabric is the bottleneck.",
      outcome: "Fabric telemetry that protects AI workloads and pinpoints congestion.",
      proof: {
        metric: "AI job throughput lost to congestion",
        before: "Blind to ECN/buffer pressure on the fabric",
        after: "Per-leaf telemetry and QoS that protects the AI class",
        source: "Cisco Nexus Dashboard / AI fabric positioning"
      },
      personas: {
        netops: {
          line: "See buffer/ECN pressure per switch and rebalance flows.",
          symptom: "When AI jobs stall, you're blind to ECN and buffer pressure on the fabric.",
          proof: { metric: "Fabric visibility for AI", before: "Blind to ECN/buffer pressure on the fabric", after: "Per-leaf telemetry and QoS that protect the AI class" }
        },
        cio: {
          line: "Protect expensive GPU cycles from network waste.",
          symptom: "Stalled GPU jobs waste some of your most expensive compute.",
          proof: { metric: "GPU cycles lost to congestion", before: "Expensive GPUs idle on network waste", after: "Protected AI throughput with less waste" }
        },
        ciso: {
          line: "Keep AI data on protected, observable paths.",
          symptom: "AI training data must stay on observable, protected paths.",
          proof: { metric: "AI data path assurance", before: "AI traffic on unobserved paths", after: "AI data on protected, observable paths" }
        }
      },
      useCases: ["AI Networking", "Data Center Networking"],
      bundles: ["AI-Ready Data Center Network"],
      families: ["nexus", "nexus-one", "intersight", "silicon-one"],
      signals: { has: ["nexus"], missing: ["thousandeyes"] },
      dcloudPath: "ai-networking",
      maturityNext: "observability-blindspots"
    },

    /* ── Industrial / IoT ──────────────────────────────────────────── */
    {
      id: "ot-blind",
      pillar: "resilience",
      symptom: "You can't see or secure the OT devices running the plant floor.",
      outcome: "Full OT visibility and zero-trust segmentation across IT/OT.",
      proof: {
        metric: "OT asset visibility & exposure",
        before: "Unknown industrial assets on flat OT networks",
        after: "Complete asset inventory with segmented, monitored OT",
        source: "Cisco Cyber Vision + Industrial Ethernet + ISE positioning"
      },
      personas: {
        netops: {
          line: "Ruggedized networking with built-in OT discovery.",
          symptom: "The plant floor needs rugged networking and you can't even see what's on it.",
          proof: { metric: "OT network operations", before: "Flat OT networks with unknown assets", after: "Ruggedized networking with built-in OT discovery" }
        },
        cio: {
          line: "Keep production running while connecting the plant safely.",
          symptom: "You must connect the plant without risking a production outage.",
          proof: { metric: "Safe plant connectivity", before: "Connecting OT risks downtime", after: "Production stays up while OT connects safely" }
        },
        ciso: {
          line: "See every OT asset and contain threats before they hit operations.",
          symptom: "Unseen OT assets on flat networks are a serious exposure.",
          proof: { metric: "OT asset visibility & exposure", before: "Unknown industrial assets on flat OT networks", after: "Complete asset inventory with segmented, monitored OT" }
        }
      },
      useCases: ["IoT / Industrial", "Zero Trust Security"],
      bundles: ["Industrial OT Security"],
      families: ["cyber-vision", "industrial-eth", "ise", "sf-branch", "secure-equipment"],
      refArch: "IoT / Industrial",
      signals: { has: ["industrial-eth"], missing: ["cyber-vision"] },
      dcloudPath: "iot-industrial",
      maturityNext: "flat-network-breach"
    },

    /* ── Operations / Observability (cross-cutting) ────────────────── */
    {
      id: "observability-blindspots",
      pillar: "resilience",
      symptom: "When something breaks, teams argue in a war room because no one owns the full picture.",
      outcome: "Cross-domain observability that ends finger-pointing and shortens MTTR.",
      proof: {
        metric: "Mean time to resolution (cross-team)",
        before: "War rooms; each team sees only its own slice",
        after: "One correlated view across app, network, and internet",
        source: "Cisco ThousandEyes + Splunk + AgenticOps positioning"
      },
      personas: {
        netops: {
          line: "Prove it's not the network — or fix it fast when it is.",
          symptom: "In every outage war room, you're stuck proving it isn't the network.",
          proof: { metric: "Cross-team MTTR", before: "War rooms; each team sees only its own slice", after: "One correlated view; prove it or fix it fast" }
        },
        cio: {
          line: "Less downtime and fewer costly war rooms.",
          symptom: "Outages drag on in costly war rooms with no clear owner.",
          proof: { metric: "Downtime & war-room cost", before: "Frequent, drawn-out war rooms", after: "Less downtime and faster resolution" }
        },
        ciso: {
          line: "Telemetry everywhere means investigations aren't blind.",
          symptom: "Blind spots between domains mean investigations start in the dark.",
          proof: { metric: "Investigation visibility", before: "Telemetry gaps across domains", after: "Telemetry everywhere for investigations" }
        }
      },
      useCases: ["AI Networking", "SD-WAN / SASE", "Data Center Modernization"],
      bundles: ["Cloud Control Platform"],
      families: ["thousandeyes", "splunk", "fso", "appdynamics", "cloud-control"],
      signals: { has: ["thousandeyes"], missing: ["cloud-control"] },
      dcloudPath: "ai-networking",
      maturityNext: "tool-sprawl-ops"
    },
    {
      id: "tool-sprawl-ops",
      pillar: "resilience",
      symptom: "Operators juggle a dozen dashboards and still can't answer a simple question fast.",
      outcome: "A unified, AI-native operations plane across domains (AgenticOps).",
      proof: {
        metric: "Consoles per investigation",
        before: "Swivel-chair across many disconnected tools",
        after: "One AI-assisted canvas correlating every domain",
        source: "Cisco Cloud Control / AI Canvas positioning"
      },
      personas: {
        netops: {
          line: "Ask a question once and let agents assemble the evidence.",
          symptom: "You swivel-chair across a dozen tools to answer one simple question.",
          proof: { metric: "Consoles per investigation", before: "Swivel-chair across many disconnected tools", after: "One AI-assisted canvas correlating every domain" }
        },
        cio: {
          line: "Operational efficiency and faster answers for the business.",
          symptom: "Tool sprawl slows answers and inflates operational cost.",
          proof: { metric: "Operational efficiency", before: "Fragmented tooling slows the business", after: "Unified, AI-native operations" }
        },
        ciso: {
          line: "Security context joins the same investigation surface.",
          symptom: "Security context lives apart from the ops investigation surface.",
          proof: { metric: "Security-ops convergence", before: "Security siloed from ops tooling", after: "Security context on one investigation surface" }
        }
      },
      useCases: ["Network Automation", "AI Networking"],
      bundles: ["Cloud Control Platform", "Cisco IQ Operations"],
      families: ["cloud-control", "cisco-iq", "intersight", "catalyst-center"],
      signals: { has: ["catalyst-center"], missing: ["cloud-control"] },
      dcloudPath: "ai-networking",
      maturityNext: "unknown-assets"
    },
    {
      id: "unknown-assets",
      pillar: "resilience",
      symptom: "You don't have a reliable inventory of your Cisco estate or its risk exposure.",
      outcome: "A unified asset landscape with AI troubleshooting and risk prioritization.",
      proof: {
        metric: "Time to answer \"what do we have and what's at risk?\"",
        before: "Spreadsheets and stale CMDB data",
        after: "Live asset landscape with prioritized vulnerabilities",
        source: "Cisco IQ + Vulnerability Management positioning"
      },
      personas: {
        netops: {
          line: "Know exactly what's deployed and what needs attention.",
          symptom: "You can't reliably say what's deployed or what needs attention.",
          proof: { metric: "Estate inventory accuracy", before: "Spreadsheets and stale CMDB data", after: "Live asset landscape with prioritized attention" }
        },
        cio: {
          line: "Governance and lifecycle clarity across the Cisco investment.",
          symptom: "There's no clear governance or lifecycle view of the Cisco investment.",
          proof: { metric: "Estate governance clarity", before: "No unified lifecycle view", after: "Clear governance across the Cisco estate" }
        },
        ciso: {
          line: "Prioritize the vulnerabilities that actually matter to your estate.",
          symptom: "Without an accurate inventory, you can't prioritize real risk.",
          proof: { metric: "Risk prioritization", before: "Unknown exposure across the estate", after: "Prioritized vulnerabilities that actually matter" }
        }
      },
      useCases: ["Network Automation"],
      bundles: ["Cisco IQ Operations"],
      families: ["cisco-iq", "vuln-mgmt", "xdr", "intersight"],
      refArch: "Operational Resilience",
      signals: { has: ["catalyst-center"], missing: ["cisco-iq"] },
      maturityNext: "observability-blindspots"
    },
    {
      id: "app-performance",
      pillar: "resilience",
      symptom: "A critical app is slow and dev and ops blame each other with no shared truth.",
      outcome: "Full-stack observability that ties app performance to infrastructure.",
      proof: {
        metric: "Time to isolate app performance issues",
        before: "Dev vs ops standoff with separate tools",
        after: "Correlated app, infra, and network telemetry",
        source: "Cisco AppDynamics / FSO + Splunk positioning"
      },
      personas: {
        netops: {
          line: "See whether the app or the infrastructure is at fault.",
          symptom: "When the app is slow, you're on the hook to prove the infrastructure is fine.",
          proof: { metric: "Time to isolate app issues", before: "Dev vs ops standoff with separate tools", after: "Correlated app, infra, and network telemetry" }
        },
        cio: {
          line: "Protect revenue-driving digital experiences.",
          symptom: "Slow critical apps put revenue and digital experience at risk.",
          proof: { metric: "Digital experience & revenue", before: "Slow apps quietly hurt the business", after: "Protected, performant digital experiences" }
        },
        ciso: {
          line: "Spot anomalies that signal abuse or compromise in the app tier.",
          symptom: "App-tier anomalies that signal abuse go unnoticed without correlation.",
          proof: { metric: "App-tier threat visibility", before: "No correlated view of app behavior", after: "Anomalies surfaced across app and infrastructure" }
        }
      },
      useCases: ["Data Center Modernization", "Cloud Migration"],
      bundles: ["Cloud Control Platform"],
      families: ["appdynamics", "fso", "splunk", "thousandeyes"],
      signals: { has: ["splunk"], missing: ["appdynamics"] },
      maturityNext: "observability-blindspots"
    }
  ];

  // Fast lookups
  const BY_ID = {};
  const BY_FAMILY = {};
  PROBLEMS.forEach(p => {
    BY_ID[p.id] = p;
    (p.families || []).forEach(f => {
      (BY_FAMILY[f] = BY_FAMILY[f] || []).push(p);
    });
  });

  // Symptom-first discovery: plain-language pains → problem id.
  const SYMPTOMS = PROBLEMS.map(p => ({ id: p.id, text: p.symptom, problem: p.id }));

  /* ── Resolvers ─────────────────────────────────────────────────── */
  function getProblem(id) {
    return id && BY_ID[id] ? BY_ID[id] : null;
  }
  function problemsForFamily(familyId) {
    return (familyId && BY_FAMILY[familyId]) ? BY_FAMILY[familyId].slice() : [];
  }
  function problemsForProduct(productId, familyId) {
    return problemsForFamily(familyId);
  }
  function topProblemForFamily(familyId) {
    const list = problemsForFamily(familyId);
    return list.length ? list[0] : null;
  }
  function hasProblems(familyId) {
    return !!(familyId && BY_FAMILY[familyId] && BY_FAMILY[familyId].length);
  }
  function problemsForStack(familyIds) {
    const seen = new Set();
    const out = [];
    (familyIds || []).forEach(fid => {
      problemsForFamily(fid).forEach(p => {
        if (!seen.has(p.id)) { seen.add(p.id); out.push(p); }
      });
    });
    // preserve catalog order for stable display
    return PROBLEMS.filter(p => seen.has(p.id));
  }
  function problemsForBundle(name) {
    return PROBLEMS.filter(p => (p.bundles || []).indexOf(name) >= 0);
  }
  function topProblemForBundle(name) {
    const list = problemsForBundle(name);
    return list.length ? list[0] : null;
  }
  function problemsForUseCase(uc) {
    return PROBLEMS.filter(p => (p.useCases || []).indexOf(uc) >= 0);
  }

  // For a set of family ids, which curated outcomes are addressed vs. adjacent-open.
  // "open" is filtered to problems that share a useCase with the stack so we only
  // surface relevant gaps, not the entire catalog.
  function outcomeCoverage(familyIds) {
    const fam = new Set(familyIds || []);
    const stackUC = new Set();
    fam.forEach(f => {
      problemsForFamily(f).forEach(p => (p.useCases || []).forEach(u => stackUC.add(u)));
    });
    const addressed = [];
    const open = [];
    PROBLEMS.forEach(p => {
      const by = (p.families || []).filter(f => fam.has(f));
      if (by.length) {
        addressed.push({ problem: p, by });
      } else if ((p.useCases || []).some(u => stackUC.has(u))) {
        open.push({ problem: p, gapFamilies: (p.families || []).slice(0, 3) });
      }
    });
    return { addressed, open };
  }

  /**
   * Normalize a problem to a persona-specific view. A persona entry may be:
   *   - a string        → framed outcome line only (symptom/proof fall back)
   *   - an object        → { symptom?, line?, proof? } with per-field fallback
   * The returned proof merges the shared problem.proof with any persona overrides,
   * so metric/source stay consistent while before/after can be persona-specific.
   */
  function personaView(problem, persona) {
    if (!problem) return { symptom: "", line: "", proof: null };
    const base = {
      symptom: problem.symptom || "",
      line: problem.outcome || "",
      proof: problem.proof || null
    };
    const entry = persona && problem.personas ? problem.personas[persona] : null;
    if (!entry) return base;
    if (typeof entry === "string") return { ...base, line: entry };
    return {
      symptom: entry.symptom || base.symptom,
      line: entry.line || base.line,
      proof: entry.proof ? { ...(base.proof || {}), ...entry.proof } : base.proof
    };
  }

  function personaLine(problem, persona) {
    return personaView(problem, persona).line;
  }

  // Customer-ready narrative for the AI assistant / exports.
  function problemNarrative(familyIds, persona) {
    const cov = outcomeCoverage(familyIds);
    const lines = [];
    if (cov.addressed.length) {
      const tops = cov.addressed.slice(0, 4)
        .map(a => `• ${a.problem.outcome} (${a.by.map(nameOr).join(", ")})`);
      lines.push("Problems this stack already addresses:");
      lines.push(...tops);
    }
    if (cov.open.length) {
      const gap = cov.open[0];
      lines.push(
        `Biggest unaddressed outcome: ${gap.problem.outcome} — consider ${gap.gapFamilies.map(nameOr).join(", ")}.`
      );
    }
    if (persona && cov.addressed.length) {
      const pl = personaLine(cov.addressed[0].problem, persona);
      if (pl) lines.push(`For a ${personaLabel(persona)}: ${pl}`);
    }
    return lines.join("\n");
  }

  function personaLabel(id) {
    const p = PERSONAS.find(x => x.id === id);
    return p ? p.label : id;
  }

  // Resolve a family id to a human name if the host app exposes nodeById; else the id.
  function nameOr(familyId) {
    try {
      if (window.nodeById && window.nodeById[familyId] && window.nodeById[familyId].name) {
        return window.nodeById[familyId].name;
      }
    } catch (e) { /* noop */ }
    return familyId;
  }

  window.__cpnProblems = {
    PROBLEMS,
    PERSONAS,
    SYMPTOMS,
    DISCLAIMER,
    getProblem,
    problemsForFamily,
    problemsForProduct,
    topProblemForFamily,
    hasProblems,
    problemsForStack,
    problemsForBundle,
    topProblemForBundle,
    problemsForUseCase,
    outcomeCoverage,
    personaView,
    personaLine,
    personaLabel,
    problemNarrative,
    nameOr
  };
})();
