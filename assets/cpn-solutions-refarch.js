/**
 * Use-case solution metadata — outcomes and per-product roles for REF_ARCH.
 * Merged into REF_ARCH at boot via __cpnSolutionsEnrichRefArch(refArch).
 */
(function () {
  "use strict";

  const UC_BUNDLES = {
    "Zero Trust Security": "Zero Trust Foundation",
    "Hybrid Work": "Hybrid Work Suite",
    "SD-WAN / SASE": "Cloud Branch (SASE)",
    "Data Center Modernization": "Data Center Modernization",
    "IoT / Industrial": "Industrial OT Security",
    "Contact Center": "Cloud Contact Center",
    "Threat Detection & Response": "Threat Defense Platform",
    "AI Networking": "AI-Ready Data Center Network",
    "Network Automation": null,
    "Cloud Migration": null,
    "Digital Transformation": null,
  };

  const META = {
    "Zero Trust Security": {
      outcome: "Verify every user and device before granting access — least privilege everywhere.",
      roles: [
        { id: "duo", layer: "Identity", role: "Primary identity verification — MFA and adaptive policy at sign-in." },
        { id: "ise", layer: "Posture", role: "Device posture and network admission control — who gets on which segment." },
        { id: "sf-branch", layer: "Enforce", role: "Branch perimeter enforcement — inspect and block unwanted traffic." },
        { id: "sf-enterprise", layer: "Enforce", role: "Data center and campus firewall — east-west and north-south policy." },
        { id: "secure-access", layer: "Access", role: "Cloud-delivered SSE — ZTNA and SWG without hair-pinning to the DC." },
        { id: "umbrella", layer: "Access", role: "DNS-layer first hop — block malicious destinations before connection." },
        { id: "secure-endpoint", layer: "Enforce", role: "Endpoint telemetry and containment on managed devices." },
        { id: "xdr", layer: "Observe", role: "Cross-domain correlation and automated response." },
        { id: "talos", layer: "Intel", role: "Threat intelligence feeding policies across the stack." },
        { id: "catalyst-access", layer: "Edge", role: "Campus access switching with identity-aware policy enforcement." },
      ],
    },
    "SD-WAN / SASE": {
      outcome: "Optimized branch connectivity with embedded security at the edge and in the cloud.",
      roles: [
        { id: "sdwan", layer: "Edge", role: "Application-aware routing across MPLS, broadband, and LTE." },
        { id: "meraki-mx", layer: "Edge", role: "Cloud-managed SD-WAN and security for lean branch sites." },
        { id: "isr-routers", layer: "Edge", role: "Integrated routing and SD-WAN for branch and small sites." },
        { id: "secure-access", layer: "Access", role: "SSE for branch breakout — secure direct-to-cloud." },
        { id: "umbrella", layer: "Access", role: "DNS-layer protection at first request." },
        { id: "duo", layer: "Identity", role: "Verify users before granting access to apps and networks." },
        { id: "thousandeyes", layer: "Observe", role: "Prove whether slowness is WAN, ISP, or SaaS." },
      ],
    },
    "Hybrid Work": {
      outcome: "Secure, consistent collaboration from office, home, and on the road.",
      roles: [
        { id: "webex-app", layer: "Collab", role: "Unified hub — messaging, meetings, calling, and AI assistant." },
        { id: "webex-calling", layer: "Collab", role: "Enterprise telephony in the cloud or hybrid — same dial plan everywhere." },
        { id: "webex-meetings", layer: "Collab", role: "Meetings platform with AI features and device interoperability." },
        { id: "room-systems", layer: "Collab", role: "RoomOS devices for huddle, board, and executive rooms." },
        { id: "desk-devices", layer: "Collab", role: "Personal collaboration devices for desks and home offices." },
        { id: "cisco-headsets", layer: "Collab", role: "Certified audio for Webex meetings and calling." },
        { id: "vidcast", layer: "Collab", role: "Async video updates — reduce meeting load for distributed teams." },
        { id: "slido", layer: "Collab", role: "Live audience engagement inside meetings and events." },
        { id: "duo", layer: "Identity", role: "Secure sign-in to Webex and corporate apps from any location." },
        { id: "secure-access", layer: "Access", role: "ZTNA for SaaS and private apps without full-tunnel VPN." },
        { id: "thousandeyes", layer: "Observe", role: "Monitor Webex, ISP, and SaaS paths — prove where quality drops." },
      ],
    },
    "AI Networking": {
      outcome: "AI-driven assurance and automation across campus and data center.",
      roles: [
        { id: "catalyst-center", layer: "Platform", role: "Intent-based automation and AI-guided troubleshooting for campus." },
        { id: "catalyst-access", layer: "Fabric", role: "AI-ready access switching with telemetry for assurance." },
        { id: "catalyst-core", layer: "Fabric", role: "High-performance core for east-west AI-adjacent traffic." },
        { id: "catalyst-wireless", layer: "Fabric", role: "Wi-Fi with RF intelligence and client insights." },
        { id: "nexus", layer: "Fabric", role: "Data center switching for high-bandwidth workloads." },
        { id: "silicon-one", layer: "Fabric", role: "High-performance, efficient ASICs for AI/ML traffic." },
        { id: "thousandeyes", layer: "Observe", role: "Digital experience monitoring beyond the network edge." },
      ],
    },
    "Data Center Modernization": {
      outcome: "Policy-driven fabric, modern compute, and cloud-operated lifecycle.",
      roles: [
        { id: "nexus", layer: "Fabric", role: "High-density leaf/spine for modern east-west traffic." },
        { id: "aci", layer: "Platform", role: "Intent-based policy across the data center fabric." },
        { id: "ucs", layer: "Compute", role: "Compute for virtualized and bare-metal workloads." },
        { id: "hyperflex", layer: "Compute", role: "Hyperconverged infrastructure for simpler operations." },
        { id: "intersight", layer: "Platform", role: "Cloud-delivered lifecycle for compute and fabric." },
        { id: "splunk", layer: "Observe", role: "ITOps observability and analytics across the stack." },
      ],
    },
    "IoT / Industrial": {
      outcome: "OT visibility, hardened connectivity, and zero-trust segmentation.",
      roles: [
        { id: "industrial-eth", layer: "Edge", role: "Rugged switching for plant floor and field networks." },
        { id: "cyber-vision", layer: "Observe", role: "Passive OT asset discovery and threat detection." },
        { id: "ise", layer: "Enforce", role: "Micro-segmentation between IT and OT zones." },
        { id: "sf-branch", layer: "Enforce", role: "Industrial site perimeter and zone enforcement." },
        { id: "catalyst-center", layer: "Platform", role: "Unified management for industrial and enterprise networks." },
      ],
    },
    "Network Automation": {
      outcome: "Intent-based operations across campus, WAN, DC, and compute.",
      roles: [
        { id: "catalyst-center", layer: "Platform", role: "Campus and branch automation, templates, and assurance." },
        { id: "sdwan", layer: "Platform", role: "WAN policy automation and centralized orchestration." },
        { id: "aci", layer: "Platform", role: "Data center policy automation and application-centric networking." },
        { id: "intersight", layer: "Platform", role: "Compute and cloud ops automation with AI recommendations." },
      ],
    },
    "Data Center Networking": {
      outcome: "High-performance fabric with intent-based policy and telemetry analytics.",
      roles: [
        { id: "nexus", layer: "Fabric", role: "Silicon One-powered switching for scale-out fabrics." },
        { id: "aci", layer: "Platform", role: "Intent-based segmentation and policy automation." },
        { id: "silicon-one", layer: "Fabric", role: "Efficient, programmable switching for AI workloads." },
        { id: "splunk", layer: "Observe", role: "Fabric telemetry analytics and ITOps correlation." },
      ],
    },
    "Operational Resilience": {
      outcome: "Unified asset intelligence, risk prioritization, and cross-domain troubleshooting.",
      roles: [
        { id: "cisco-iq", layer: "Platform", role: "CX intelligence layer — unified asset landscape and AI troubleshooting." },
        { id: "catalyst-center", layer: "Platform", role: "Campus lifecycle and assurance integration." },
        { id: "intersight", layer: "Platform", role: "Compute lifecycle and health integration." },
        { id: "thousandeyes", layer: "Observe", role: "End-to-end digital experience and path visibility." },
        { id: "vuln-mgmt", layer: "Observe", role: "Risk-based vulnerability prioritization." },
        { id: "xdr", layer: "Enforce", role: "Security operations correlation and response." },
        { id: "talos", layer: "Intel", role: "Threat intelligence for risk scoring." },
      ],
    },
    "Contact Center": {
      outcome: "Cloud-native omnichannel service with AI routing and secure agent access.",
      products: ["webex-cc", "webex-calling", "webex-connect", "webex-app", "duo"],
      desc: "Webex Contact Center for omnichannel routing + Webex Connect for digital channels + secure agent access via Duo.",
      roles: [
        { id: "webex-cc", layer: "Collab", role: "Cloud contact center — AI routing, WFM, and omnichannel queues." },
        { id: "webex-connect", layer: "Collab", role: "Digital channels and customer journey orchestration." },
        { id: "webex-calling", layer: "Collab", role: "Telephony backbone for agents and supervisors." },
        { id: "webex-app", layer: "Collab", role: "Agent and supervisor desktop — messaging, meetings, and context." },
        { id: "duo", layer: "Identity", role: "Secure agent and admin access from any location." },
      ],
    },
    "Threat Detection & Response": {
      outcome: "Detect and respond across endpoint, network, cloud, and SIEM.",
      products: ["sf-branch", "sf-enterprise", "secure-endpoint", "xdr", "talos", "splunk"],
      desc: "Secure Firewall and Secure Endpoint for detection + XDR for correlation + Splunk for SIEM/SOAR + Talos intel.",
      roles: [
        { id: "secure-endpoint", layer: "Enforce", role: "Endpoint detection, containment, and forensic telemetry." },
        { id: "sf-branch", layer: "Enforce", role: "Network intrusion prevention and encrypted traffic analytics." },
        { id: "sf-enterprise", layer: "Enforce", role: "Data center and campus threat inspection at scale." },
        { id: "xdr", layer: "Observe", role: "Cross-domain detection, investigation, and automated response." },
        { id: "splunk", layer: "Observe", role: "SIEM, SOAR, and security analytics platform." },
        { id: "talos", layer: "Intel", role: "Global threat intelligence for detection and hunting." },
      ],
    },
    "Cloud Migration": {
      outcome: "Secure, observable paths as workloads move to cloud and SaaS.",
      products: ["secure-access", "umbrella", "duo", "sdwan", "intersight", "thousandeyes", "splunk"],
      desc: "Secure Access and Umbrella for cloud-first security + SD-WAN for optimized paths + Intersight for hybrid compute ops + observability for migration validation.",
      roles: [
        { id: "secure-access", layer: "Access", role: "ZTNA and SSE for SaaS and private cloud apps." },
        { id: "umbrella", layer: "Access", role: "Secure DNS and cloud firewall for roaming users." },
        { id: "duo", layer: "Identity", role: "Identity verification for cloud admin and user access." },
        { id: "sdwan", layer: "Edge", role: "Optimized connectivity to IaaS and SaaS from branches." },
        { id: "intersight", layer: "Platform", role: "Hybrid cloud compute lifecycle and workload placement." },
        { id: "thousandeyes", layer: "Observe", role: "Validate app performance before and after migration." },
        { id: "splunk", layer: "Observe", role: "Cross-cloud logging and operational visibility." },
      ],
    },
    "Digital Transformation": {
      outcome: "Modern platforms for customer experience, automation, and business agility.",
      products: ["webex-app", "webex-cc", "appdynamics", "catalyst-center", "cloud-control", "splunk"],
      desc: "Webex for customer and employee experience + AppDynamics for app performance + automation and observability platforms for operational agility.",
      roles: [
        { id: "webex-app", layer: "Collab", role: "Digital workplace hub for employees and partners." },
        { id: "webex-cc", layer: "Collab", role: "Modern customer engagement and service channels." },
        { id: "appdynamics", layer: "Observe", role: "Application performance monitoring for critical digital services." },
        { id: "catalyst-center", layer: "Platform", role: "Automated, assured network operations at scale." },
        { id: "cloud-control", layer: "Platform", role: "Cross-domain context and AI-assisted investigation (Controlled Availability)." },
        { id: "splunk", layer: "Observe", role: "Operational analytics and business workflow insights." },
      ],
    },
  };

  function enrichRefArch(refArch) {
    if (!refArch || typeof refArch !== "object") return;
    Object.entries(META).forEach(([name, meta]) => {
      const arch = refArch[name];
      if (!arch) {
        refArch[name] = {
          products: meta.products || (meta.roles || []).map(r => r.id),
          desc: meta.desc || meta.outcome || "",
          outcome: meta.outcome,
          roles: meta.roles || [],
        };
        return;
      }
      if (meta.outcome) arch.outcome = meta.outcome;
      if (meta.roles?.length) arch.roles = meta.roles;
      if (meta.desc && !arch.desc) arch.desc = meta.desc;
      if (meta.products?.length && !arch.products?.length) arch.products = meta.products;
    });
  }

  window.__cpnSolutionsMeta = META;
  window.__cpnSolutionsBundles = UC_BUNDLES;
  window.__cpnSolutionsEnrichRefArch = enrichRefArch;
})();
