/**
 * Indian IPO pipeline dossiers — editorially researched (last review below),
 * enriched at runtime with live news per company. Valuations and structures
 * change with each filing; the linked live news is the real-time layer.
 */

export const IPO_DATA_AS_OF = "2026-06-12";

export interface IpoDossier {
  id: string;
  company: string;
  sector: string;
  status: string;
  expectedTimeline: string;
  valuation: string;
  issueSize: string;
  structure: string;
  expectedListingGain: string;
  gainSentiment: "positive" | "neutral" | "caution";
  metrics: Array<[string, string]>;
  drhpFlags: string[];
  newsQuery: string;
}

export const IPO_PIPELINE: IpoDossier[] = [
  {
    id: "reliance-jio",
    company: "Reliance Jio Platforms",
    sector: "Telecom / Digital Services",
    status: "DRHP imminent (filing expected H2 2026)",
    expectedTimeline: "Listing seen slipping to H2 FY27",
    valuation: "₹10.8–14.1 lakh Cr ($130–170B) banker range",
    issueSize: "₹25,000 Cr fresh issue (OFS route dropped Mar 2026)",
    structure: "100% fresh issue under the new 2.5% minimum-float rule for ₹5L Cr+ companies",
    expectedListingGain:
      "GMP not active — price band not announced. Street view: India's largest-ever listing, demand likely strong but priced-to-perfection.",
    gainSentiment: "neutral",
    metrics: [
      ["Promoter", "Reliance Industries"],
      ["Float at listing", "~2.5–3%"],
      ["Use of proceeds", "Debt repayment, AI & network capex"],
      ["FY basis", "FY26 financials"],
    ],
    drhpFlags: [
      "Valuation band implies rich multiples vs global telecom peers — little priced-in margin of safety.",
      "Tiny 2.5% public float means thin liquidity and delayed index inclusion; price discovery may be volatile.",
      "Part of fresh-issue proceeds earmarked for debt repayment rather than pure growth capex.",
      "Timeline has already slipped once (H1 2026 → H2 FY27) — execution-date risk.",
    ],
    newsQuery: "Reliance Jio IPO",
  },
  {
    id: "nse",
    company: "National Stock Exchange (NSE)",
    sector: "Financial Infrastructure / Exchange",
    status: "Awaiting final SEBI clearance after settlement",
    expectedTimeline: "Widely expected FY27 window",
    valuation: "~₹4.75 lakh Cr (unlisted-market implied)",
    issueSize: "~10% equity ≈ ₹47,500 Cr (OFS by existing holders)",
    structure: "Pure offer-for-sale; would list on rival exchange BSE",
    expectedListingGain:
      "Heavily traded in the unlisted market at robust premiums; listing-pop potential high if priced below grey-market levels, but supply from OFS is large.",
    gainSentiment: "positive",
    metrics: [
      ["Market position", "~93% equity derivatives share"],
      ["Profitability", "Among world's most profitable exchanges"],
      ["Listing venue", "BSE (cross-listing rule)"],
      ["Overhang", "SEBI settlement conditions"],
    ],
    drhpFlags: [
      "Legacy co-location / dark-fibre case and governance history — settled, but reputational overhang persists in the DRHP risk factors.",
      "Regulatory action on index-derivatives volumes (expiry-day curbs) directly hits its largest revenue line.",
      "Pure OFS — no fresh capital enters the business; existing holders are exiting.",
      "Single-regulator dependence: SEBI both regulates and must approve its listing — unusual conflict structure.",
    ],
    newsQuery: "NSE IPO National Stock Exchange listing",
  },
  {
    id: "phonepe",
    company: "PhonePe",
    sector: "Fintech / Payments",
    status: "Confidential DRHP filed; IPO paused Mar 2026, pushed to ≥ Jun 2026",
    expectedTimeline: "H2 2026 if markets stabilise",
    valuation: "~$15B targeted at listing",
    issueSize: "$1.2–1.5B",
    structure: "Mix of fresh issue + OFS (Walmart partial exit)",
    expectedListingGain:
      "GMP not active. Caution: fintech listings (Paytm precedent) have a weak listing-day record when priced off private-market marks.",
    gainSentiment: "caution",
    metrics: [
      ["Largest holder", "Walmart"],
      ["Core market", "UPI payments (#1 share)"],
      ["Monetisation", "Financial services distribution, ads"],
      ["Last private mark", "$12B (2023)"],
    ],
    drhpFlags: [
      "Core UPI business earns zero MDR by regulation — monetisation depends on newer, unproven lending/insurance lines.",
      "NPCI market-share cap (30%) remains a standing regulatory threat to its #1 UPI position.",
      "IPO already paused once on geopolitical volatility — timing risk is live.",
      "OFS component means part of the raise exits to Walmart rather than funding growth.",
      "Listing valuation ($15B) is only ~25% above the 2023 private round — limited private-investor cushion suggests aggressive pricing.",
    ],
    newsQuery: "PhonePe IPO",
  },
  {
    id: "boat",
    company: "boAt (Imagine Marketing)",
    sector: "Consumer Electronics / Wearables",
    status: "Updated DRHP filed with SEBI",
    expectedTimeline: "2026 window, dates not announced",
    valuation: "Reported ~₹12,000–15,000 Cr target (media estimates)",
    issueSize: "₹1,500 Cr (₹500 Cr fresh + ₹1,000 Cr OFS)",
    structure: "OFS-heavy: two-thirds of the issue is existing holders selling",
    expectedListingGain:
      "GMP not active. Mid-cap consumer brand with strong recall; gain hinges on pricing discipline — previous 2022 attempt was shelved on weak markets.",
    gainSentiment: "neutral",
    metrics: [
      ["Brand", "#1 Indian audio wearables by volume"],
      ["Backers", "Warburg Pincus, Qualcomm Ventures"],
      ["Prior attempt", "2022 IPO withdrawn"],
      ["Category", "Audio, smartwatches, accessories"],
    ],
    drhpFlags: [
      "Two-thirds of the issue is OFS — limited fresh capital into the business.",
      "Indian wearables category growth has decelerated sharply; smartwatch segment in volume decline.",
      "Thin margins with heavy dependence on China-linked supply chains.",
      "Second attempt at listing after the 2022 withdrawal — market-window dependence.",
    ],
    newsQuery: "boAt Imagine Marketing IPO",
  },
  {
    id: "meesho",
    company: "Meesho",
    sector: "E-commerce",
    status: "DRHP preparation reported",
    expectedTimeline: "2026 pipeline",
    valuation: "Last private mark ~$3.9–5B; listing target reported higher",
    issueSize: "Not yet announced",
    structure: "Expected mix of fresh + OFS",
    expectedListingGain:
      "GMP not active. Profitability turn (recent quarters) is the bull case; e-commerce listing record in India is mixed.",
    gainSentiment: "neutral",
    metrics: [
      ["Model", "Zero-commission marketplace"],
      ["Edge", "Tier-2/3 value commerce"],
      ["Backers", "SoftBank, Prosus, Meta"],
      ["Watch", "Order growth vs take-rate"],
    ],
    drhpFlags: [
      "Competes directly with Flipkart/Amazon scale and quick-commerce encroachment on value categories.",
      "Low take-rate model leaves little room for monetisation missteps.",
      "Long loss-making history; profitability is recent and must prove durability through a public-market cycle.",
    ],
    newsQuery: "Meesho IPO",
  },
  {
    id: "zepto",
    company: "Zepto",
    sector: "Quick Commerce",
    status: "IPO preparation reported",
    expectedTimeline: "2026 pipeline",
    valuation: "Last private round ~$5B+",
    issueSize: "Not yet announced",
    structure: "Expected mix of fresh + OFS; domicile flip completed",
    expectedListingGain:
      "GMP not active. Quick-commerce is the market's hottest theme but also its most cash-hungry — listing reception will track sector sentiment.",
    gainSentiment: "caution",
    metrics: [
      ["Model", "10-minute delivery dark stores"],
      ["Rivals", "Blinkit (Eternal), Instamart (Swiggy)"],
      ["Burn", "Industry-wide negative unit economics"],
      ["Watch", "Contribution margin per store"],
    ],
    drhpFlags: [
      "Severe cash burn across the quick-commerce industry; profitability timeline unproven.",
      "Listed rivals (Eternal/Blinkit, Swiggy/Instamart) give the market a daily mark-to-market on sector economics — direct valuation anchor.",
      "Dark-store expansion economics deteriorate outside the top-8 cities.",
    ],
    newsQuery: "Zepto IPO",
  },
  {
    id: "sbi-mf",
    company: "SBI Mutual Fund (AMC)",
    sector: "Asset Management",
    status: "Listing long-planned by SBI + Amundi",
    expectedTimeline: "2026–27 window",
    valuation: "Expected to list as India's largest AMC by AUM",
    issueSize: "Not yet announced (OFS by SBI/Amundi expected)",
    structure: "Offer-for-sale by parents",
    expectedListingGain:
      "GMP not active. Listed AMC peers (HDFC AMC, Nippon) provide a clean valuation anchor — pop depends on discount to peers at pricing.",
    gainSentiment: "positive",
    metrics: [
      ["Scale", "#1 AMC by AUM in India"],
      ["Parents", "SBI (63%), Amundi (37%)"],
      ["Peer anchors", "HDFC AMC, Nippon Life AMC"],
      ["Tailwind", "SIP flows at record highs"],
    ],
    drhpFlags: [
      "SEBI's TER (fee) compression agenda is a structural margin headwind for the whole AMC sector.",
      "Heavy dependence on equity-market cycle — AUM and fees compress exactly when markets fall.",
      "Pure OFS structure expected — no growth capital raised.",
    ],
    newsQuery: "SBI Mutual Fund IPO AMC",
  },
];
