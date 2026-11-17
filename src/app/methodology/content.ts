/**
 * Content for the Methodology page: the financial concepts behind every
 * module, and worked examples run through the terminal's actual rules.
 * Kept separate from page.tsx so the page stays about layout.
 */

export interface Concept {
  term: string;
  what: string;
  why?: string;
  read?: string;
  watch?: string;
}

export interface Example {
  title: string;
  body: string;
}

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* ------------------------------------------------------------------ */
/* Concepts                                                            */
/* ------------------------------------------------------------------ */

export const CONCEPTS: Record<string, Concept[]> = {
  pipeline: [
    {
      term: "Delayed quotes",
      what: "Free market data can lag the exchange by up to 15 minutes. NSE data is near real time when it is reachable; Yahoo-derived prices can be delayed.",
      why: "Every panel shows when its data was last refreshed so you know how fresh a number is.",
      read: "Fine for research, investing and swing decisions. Not suitable for scalping or second-by-second trading.",
    },
    {
      term: "Source fallback",
      what: "When the primary source for a number fails, the server tries the next source instead of leaving the panel empty.",
      why: "Free sources are unreliable. Fallbacks keep the terminal usable when one of them blocks or times out.",
      watch: "A fallback source can be slower or slightly different, for example index data from Yahoo instead of NSE.",
    },
  ],

  indicators: [
    {
      term: "Simple moving average (SMA)",
      what: "The average closing price over the last n trading days. Each day the oldest price drops out and the newest is added, so the line follows the stock but smooths out daily noise.",
      why: "Moving averages define the trend. The 50-day average tracks the medium-term trend and the 200-day the long-term one; many institutions treat the 200-day as a simple bull or bear line.",
      read: "Price above a rising average is an uptrend; below a falling average is a downtrend. Price far above its average can mean the move is stretched.",
      watch: "Averages lag by construction. They confirm trends late and give whipsaw signals in sideways markets.",
    },
    {
      term: "Exponential moving average (EMA)",
      what: "A moving average that gives more weight to recent prices, using a smoothing factor k = 2 ÷ (n + 1).",
      why: "It reacts faster than an SMA, so it is used for short-term signals: inside MACD here, and as the 20-period trend filter on the intraday chart.",
      read: "Read it like an SMA: price above the EMA means short-term strength.",
    },
    {
      term: "Golden cross and death cross",
      what: "A golden cross is the 50-day average crossing above the 200-day average. A death cross is the reverse.",
      why: "A widely watched sign that the long-term trend regime has changed. It is one of the three checks in the Momentum pillar.",
      watch: "Very lagging: by the time the cross happens, much of the move is often over.",
    },
    {
      term: "Relative Strength Index (RSI)",
      what: "A momentum oscillator from 0 to 100 that compares the size of recent gains with recent losses over 14 days, using Wilder smoothing.",
      why: "Shows whether buying or selling pressure is in control and whether a move looks stretched.",
      read: "Above 70 is usually called overbought and below 30 oversold. 45 to 65 is a healthy trend zone, which the Momentum pillar rewards most.",
      watch: "In strong trends RSI can stay overbought for weeks. Overbought on its own is not a sell signal.",
    },
    {
      term: "MACD histogram",
      what: "MACD is the gap between the 12-day and 26-day EMAs. Its signal line is a 9-day EMA of MACD, and the histogram is MACD minus the signal line.",
      why: "Shows whether momentum is accelerating or fading.",
      read: "A positive and rising histogram means upward momentum is building; a negative one means momentum is fading or turning down.",
    },
    {
      term: "Trailing returns",
      what: "The percentage price change over the last 21, 63 or 126 trading days, roughly 1, 3 and 6 months.",
      why: "Momentum is one of the most persistent effects in equity research: stocks that outperformed over the past 3 to 12 months have tended to keep outperforming in the near term.",
      watch: "Momentum can reverse sharply at market turning points.",
    },
    {
      term: "Volatility (annualised)",
      what: "The standard deviation of daily returns, scaled to a year by multiplying by √252, because there are about 252 trading days a year and the spread of returns grows with the square root of time.",
      why: "The standard measure of how violently a stock swings. It feeds the Risk pillar and sizes the fallback scenario band.",
      read: "Large, steady Indian blue chips often run at roughly 15 to 25%; small and mid caps at 30% and above.",
      watch: "It treats up and down moves the same and assumes the recent size of swings continues.",
    },
    {
      term: "Volume ratio",
      what: "The average traded volume of the last 5 days divided by the average of the last 20.",
      why: "A price move on heavy volume carries more conviction than one on thin volume.",
      read: "Above 1.4 is flagged on the chart as a volume surge.",
    },
    {
      term: "Support and resistance",
      what: "Price zones where buying (support) or selling (resistance) has repeatedly appeared. In the indicator set they are simplified to the lowest and highest close of the last 60 sessions.",
      why: "They give natural reference points for stops and targets.",
      watch: "A simplification. The pattern detector and the intraday pivots give more precise levels.",
    },
    {
      term: "52-week high and low",
      what: "The highest and lowest closing price over the past year, and how far today's price sits from each.",
      why: "Distance from the high is a clean read of trend health and drawdown. Stocks trading near their 52-week high have historically tended to show continued strength.",
      read: "Within 5% of the high signals strength. More than 25% below it counts as a meaningful drawdown in the Risk pillar.",
    },
  ],

  score: [
    {
      term: "Multi-factor investing",
      what: "Judging a stock on several independent dimensions (value, quality, growth, momentum, financial strength, sentiment and risk) instead of a single number such as P/E.",
      why: "Each factor works in some market phases and fails in others. Combining them makes the overall read more robust than any single lens.",
    },
    {
      term: "Weighted average with re-normalisation",
      what: "Each pillar score is multiplied by its weight, the results are added, and the total is divided by the combined weight of the pillars that actually have data.",
      why: "A stock with missing data is judged on what is known, instead of being penalised or having the gap guessed.",
    },
    {
      term: "Stance",
      what: "A one-word summary (Constructive, Balanced or Cautious) derived from the overall score.",
      why: "It summarises the evidence on the page. It is never a buy or sell instruction, and it is always derived from the score, not the other way around.",
    },
    {
      term: "Score confidence",
      what: "How many of the seven pillars had enough data to score.",
      why: "A score built on three pillars deserves less trust than one built on seven.",
    },
  ],

  valuation: [
    {
      term: "Price to earnings (P/E)",
      what: "Share price divided by earnings per share over the last 12 months. It is how many years of current profit you pay for the business.",
      why: "The most widely used valuation yardstick.",
      read: "Lower is cheaper, but only against comparable companies: banks often trade at 10 to 20 times earnings, consumer brands at 40 to 70 times.",
      watch: "Meaningless when earnings are negative and misleading when they are temporarily depressed or inflated.",
    },
    {
      term: "Price to book (P/B)",
      what: "Share price divided by book value per share, where book value is shareholders' equity on the balance sheet.",
      why: "Most useful for asset-heavy businesses such as banks, where book value is close to the real asset base.",
      read: "Below 1 means the market values the company below its accounting net worth: either cheap or in trouble.",
      watch: "Weak for asset-light companies such as software or consumer brands, whose value is not on the balance sheet.",
    },
    {
      term: "PEG ratio",
      what: "P/E divided by the earnings growth rate in percent.",
      why: "Adjusts valuation for growth. A P/E of 40 can be reasonable for a company growing earnings 40% a year.",
      read: "Below 1 suggests growth is cheap; above about 2.5 suggests you are paying heavily for it.",
      watch: "Only meaningful when growth is positive and likely to last.",
    },
    {
      term: "Sector-relative valuation",
      what: "Comparing a stock's multiple with the median multiple of its own sector, instead of a fixed market-wide threshold.",
      why: "Different industries deserve different multiples. Judging relatively avoids punishing quality compounders and rewarding value traps.",
      read: "A ratio of 0.8 means the stock trades 20% below its sector's typical multiple.",
    },
    {
      term: "Analyst target price",
      what: "The average 12-month price target published by brokerage analysts covering the stock.",
      why: "A crowd estimate of fair value; the gap to today's price is the implied upside.",
      watch: "Targets tend to follow the share price and lean optimistic.",
    },
    {
      term: "Value trap",
      what: "A stock that looks cheap on its multiples because its business is deteriorating.",
      why: "The reason Valuation is never read alone: cheap combined with weak quality and falling growth is a warning, not a bargain.",
    },
  ],

  growth: [
    {
      term: "Compound annual growth rate (CAGR)",
      what: "The constant yearly rate that takes a value from its first level to its last: (last ÷ first) raised to 1 ÷ years, minus 1.",
      why: "It smooths out lumpy years, so it reveals the durable rate of growth.",
      read: "Revenue CAGR above roughly 12% is strong for a large company.",
    },
    {
      term: "Year-on-year (YoY) growth",
      what: "The change versus the same period a year earlier.",
      why: "Used when fewer than three years of statements are available.",
      watch: "A single period can be distorted by a weak base year, a one-off gain or an acquisition.",
    },
    {
      term: "Growth consistency",
      what: "The share of years in which revenue actually grew.",
      why: "Steady compounders tend to be higher-quality businesses than companies that grow in spurts.",
    },
  ],

  quality: [
    {
      term: "Return on capital employed (ROCE)",
      what: "Operating profit (EBIT) divided by capital employed, which is total assets minus current liabilities.",
      why: "Measures the profit earned on all the long-term money tied up in the business, from both shareholders and lenders. It is the headline quality metric among Indian investors.",
      read: "Above 15% is strong. A ROCE that stays below the cost of borrowing means the business destroys value as it grows.",
    },
    {
      term: "Return on equity (ROE)",
      what: "Net profit divided by shareholders' equity.",
      why: "Shows the return generated on the owners' money.",
      watch: "Debt inflates ROE because equity becomes small relative to the assets it controls. That is why ROCE leads the Quality pillar and ROE only supports it.",
    },
    {
      term: "Operating and net margin",
      what: "Operating profit and net profit as a percentage of revenue.",
      why: "Margins reveal pricing power and cost control. High and stable margins usually mean a stronger business.",
      read: "Compare within an industry: a 5% margin is normal for a retailer and weak for a software company.",
    },
    {
      term: "Cash conversion",
      what: "Free cash flow divided by net profit.",
      why: "Profit is an accounting estimate; cash is a fact. Low or negative conversion can signal aggressive accounting, heavy investment, or money stuck in receivables and inventory.",
      read: "Above 80% is healthy. Persistently below 50% deserves investigation.",
    },
  ],

  strength: [
    {
      term: "Debt to equity",
      what: "Total debt divided by shareholders' equity.",
      why: "The core measure of leverage. Debt magnifies returns in good years and losses in bad ones, and raises the risk of financial distress.",
      read: "Below 0.5 is conservative and above 2 is heavily leveraged. Banks and lenders naturally run much higher, because borrowing is their business.",
    },
    {
      term: "Cash coverage of debt",
      what: "Cash and equivalents divided by total debt.",
      why: "Shows how much of the debt could be repaid immediately.",
      read: "Above 1 means the company holds more cash than debt (net cash).",
    },
  ],

  sentimentPillar: [
    {
      term: "Analyst consensus rating",
      what: "The average recommendation across brokerages covering the stock, from strong buy to sell.",
      why: "A summary of professional opinion.",
      watch: "Sell ratings are rare, so the scale leans heavily toward buy.",
    },
    {
      term: "Estimate revisions",
      what: "How many analysts raised or cut their earnings estimate for the current year over the last 30 days.",
      why: "A leading signal: rising estimates have tended to precede rising prices, and the direction of revisions often persists for a while.",
    },
    {
      term: "News sentiment",
      what: "Whether recent headlines about the company are positive or negative, read by the AI models or by the keyword method.",
      why: "Captures new information before it reaches the financial statements.",
    },
  ],

  risk: [
    {
      term: "Beta",
      what: "How much a stock tends to move for each 1% move in the NIFTY 50.",
      why: "Measures market (systematic) risk, the part that diversification cannot remove.",
      read: "1 moves with the market, above 1 amplifies it and below 1 dampens it.",
    },
    {
      term: "Drawdown",
      what: "How far the price sits below a previous peak, here the 52-week high.",
      why: "A large drawdown signals a broken trend or a fundamental problem.",
    },
    {
      term: "Institutional crowding",
      what: "A high share of the stock held by large institutions.",
      why: "If many big holders sell at once the exit is crowded and the fall can be sharp.",
    },
  ],

  screener: [
    {
      term: "Quantitative screening",
      what: "Filtering a universe of stocks with fixed rules instead of picking them one by one.",
      why: "Narrows a long list to a short one worth researching in depth.",
    },
    {
      term: "Dividend yield",
      what: "Annual dividends per share divided by the share price.",
      why: "The cash you receive just for holding the stock, often a sign of a mature, cash-generating business.",
      watch: "A very high yield can mean the price has collapsed or the dividend is at risk.",
    },
    {
      term: "Absolute vs relative bands",
      what: "The screener scores every name against the same fixed bands, while the stock page scores valuation against the stock's own sector.",
      why: "Fixed bands make the whole market comparable in one table; relative bands give a fairer verdict on a single stock.",
    },
    {
      term: "Screening universe",
      what: "The roughly 130 liquid names in the curated NSE index lists: the NIFTY 50, the NIFTY Next 50 and the sector indices.",
      watch: "Small and micro caps outside these lists are not covered.",
    },
  ],

  peers: [
    {
      term: "Comparable company analysis (comps)",
      what: "Judging a company by comparing its multiples and returns with similar listed companies.",
      why: "The standard way analysts decide whether a stock is cheap or expensive.",
    },
    {
      term: "Median",
      what: "The middle value of a sorted list.",
      why: "Unlike the average, one extreme value (say a P/E of 200) cannot drag it.",
    },
    {
      term: "Peer rank",
      what: "A company's position among its peers on one metric, where 1 is best.",
      watch: "Sector labels are broad. A conglomerate can be grouped with peers it barely resembles.",
    },
  ],

  financials: [
    {
      term: "The three financial statements",
      what: "The income statement (revenue, costs and profit), the balance sheet (assets, liabilities and equity) and the cash flow statement (cash coming in and going out).",
      why: "Together they show whether a business is profitable, solvent and generating cash.",
    },
    {
      term: "Revenue",
      what: "Total sales for the year, often called the top line.",
    },
    {
      term: "EBIT",
      what: "Earnings before interest and tax: the operating profit of the core business.",
      why: "It strips out financing choices and tax, so companies with different debt levels can be compared fairly.",
    },
    {
      term: "Net income (PAT)",
      what: "Profit after all costs, interest and tax, often called the bottom line.",
    },
    {
      term: "Capital employed",
      what: "Total assets minus current liabilities: the long-term capital, from shareholders and lenders, that the business runs on.",
    },
    {
      term: "Operating cash flow and capex",
      what: "Operating cash flow is the cash generated by the business itself. Capital expenditure (capex) is cash spent on long-term assets such as plants, machinery and technology.",
    },
    {
      term: "Free cash flow (FCF)",
      what: "Operating cash flow minus capex.",
      why: "The cash left for dividends, buybacks, paying down debt or growth. Many investors value businesses on it.",
      watch: "It is lumpy: a year of heavy investment can make FCF negative even for a strong company.",
    },
    {
      term: "Indian fiscal year",
      what: "Indian companies report on an April to March year. FY26 runs from April 2025 to March 2026.",
    },
  ],

  estimates: [
    {
      term: "Consensus EPS estimate",
      what: "The average earnings-per-share forecast across the analysts covering a company, for a given fiscal year.",
      why: "It is what the market expects. Prices react to results relative to this expectation, not to the results alone.",
    },
    {
      term: "Forward vs trailing figures",
      what: "Trailing figures use the last 12 months of actual results; forward figures use estimates for the coming year.",
    },
    {
      term: "Earnings surprise",
      what: "How far reported EPS beat or missed the consensus estimate.",
      why: "Surprises move prices, and positive surprises have tended to be followed by further drift in the same direction, an effect known as post-earnings drift.",
    },
  ],

  ownership: [
    {
      term: "Promoter",
      what: "In India, the founders or controlling group of a listed company, disclosed separately in its filings.",
      why: "Promoters know the business best. A rising stake signals confidence; a falling stake can signal selling, dilution or financial stress.",
    },
    {
      term: "Public shareholding",
      what: "Shares held by everyone else: foreign and domestic institutions, mutual funds, insurers and retail investors.",
      why: "SEBI rules require listed companies to keep at least 25% of their shares in public hands.",
    },
    {
      term: "Promoter pledge",
      what: "Promoter shares given to lenders as collateral for loans.",
      why: "If the share price falls, lenders can sell pledged shares, which can deepen the fall. A widely tracked red flag.",
      watch: "Not available in the free data used here, so it is neither shown nor scored.",
    },
    {
      term: "Shareholding pattern",
      what: "The quarterly ownership breakdown every listed company files with the exchange.",
    },
  ],

  patterns: [
    {
      term: "Swing high and swing low",
      what: "A local peak or trough: a candle whose high (or low) is the most extreme within a set number of candles on either side, 5 here.",
      why: "Swing points are the building blocks of trendlines.",
    },
    {
      term: "Least-squares trendline",
      what: "The straight line that best fits a set of points, found by minimising the squared vertical distance from each point to the line.",
      why: "An objective trendline: anyone running the same data gets the same line.",
    },
    {
      term: "Triangle",
      what: "Price squeezed between two converging lines. Ascending: flat top, rising bottom. Descending: falling top, flat bottom. Symmetrical: both lines converge.",
      why: "Shows buyers and sellers reaching a balance before a decisive move.",
      read: "Ascending triangles usually resolve upward, descending ones downward, and symmetrical ones either way.",
    },
    {
      term: "Wedge",
      what: "Both lines slope the same way and converge.",
      read: "A rising wedge often resolves lower and a falling wedge higher, because the trend is losing force.",
    },
    {
      term: "Channel",
      what: "Two roughly parallel lines sloping up or down.",
      read: "Price tends to oscillate between the two rails until one of them breaks.",
    },
    {
      term: "Double top and double bottom",
      what: "Two peaks (or two troughs) at about the same level, separated by a dip (or a bounce).",
      why: "A classic reversal pattern: failing twice at the same level suggests the trend is exhausted.",
      read: "The neckline is the level between the two; a close beyond it confirms the pattern.",
    },
    {
      term: "Breakout and measured move",
      what: "A breakout is a decisive close beyond a pattern's boundary. The measured move projects the pattern's height from the breakout to estimate a target.",
      watch: "False breakouts are common. Patterns describe probabilities, not certainties, and targets are rough guides.",
    },
  ],

  scenario: [
    {
      term: "Scenario analysis",
      what: "Describing a range of outcomes (bear, base and bull) instead of one point forecast.",
      why: "Markets are uncertain. A range is more honest than a single target and shows whether upside or downside is larger.",
    },
    {
      term: "Model ensemble",
      what: "Asking several independent models the same question and combining their answers.",
      why: "Averaging cancels part of each model's errors, and disagreement between the models is itself useful: it signals uncertainty.",
    },
    {
      term: "Drift and volatility band",
      what: "Drift is the average daily direction implied by recent momentum. The band is one standard deviation of price movement expected over the horizon.",
      why: "A statistical baseline used when AI is unavailable. The band grows with the square root of time, hence √(horizon ÷ 252).",
    },
    {
      term: "Projection horizon",
      what: "The period a scenario covers, in trading sessions: 12 on the 1M chart, 22 on 6M and 45 on 1Y.",
      watch: "Scaling a 45-session view down to a shorter horizon assumes a steady path; real prices do not move in straight lines.",
    },
  ],

  sentiment: [
    {
      term: "Lexicon-based sentiment",
      what: "Scoring text by counting words from fixed positive and negative word lists.",
      why: "Free, fast, transparent and repeatable.",
      watch: "It misses negation, context and how material the news is, which is why the AI read is preferred when available.",
    },
    {
      term: "Materiality",
      what: "How much a piece of news could change a company's value. Results, guidance, orders and regulatory action matter far more than routine coverage.",
      why: "The AI read is asked to weight headlines by materiality.",
    },
  ],

  intraday: [
    {
      term: "Floor-trader pivot points",
      what: "Support and resistance levels for a session computed from the previous session's high, low and close. P is the pivot; R1 to R3 sit above it and S1 to S3 below.",
      why: "So many traders watch them that they become partly self-fulfilling.",
      read: "Trading above P favours buyers; below P favours sellers.",
    },
    {
      term: "Central pivot range (CPR)",
      what: "The band around the pivot between BC = (H + L) ÷ 2 and TC = 2P minus BC.",
      why: "Its width hints at the type of day ahead.",
      read: "A narrow CPR often precedes a trending day; a wide CPR, a sideways one.",
    },
    {
      term: "Opening range",
      what: "The high and low of the first 15 minutes of trading.",
      why: "The opening range breakout is a classic intraday strategy: a move beyond the range often sets the direction for the day.",
    },
    {
      term: "Index futures and options",
      what: "Derivative contracts on an index. A future tracks the index; an option gives the right to buy (call) or sell (put) at a fixed strike price.",
      read: "An at-the-money option moves roughly half as much as the index, which is called a delta of about 0.5.",
    },
    {
      term: "Lot size",
      what: "The minimum contract quantity set by the exchange, for example 75 units for NIFTY.",
      why: "Converts index points into rupees: profit or loss equals points times lot size.",
      watch: "Lot sizes change with exchange circulars, so verify before trading.",
    },
    {
      term: "Stop loss and risk to reward",
      what: "A stop is the price that proves a trade wrong. Risk to reward compares the distance to the target with the distance to the stop.",
      why: "It fixes the possible loss before entering. A ratio below 1 to 1 means risking more than the expected gain.",
    },
  ],

  options: [
    {
      term: "Open interest (OI)",
      what: "The number of option contracts outstanding at a strike, opened and not yet closed or expired.",
      why: "Shows where large positions sit. Unlike volume, it counts positions held, not trades made.",
    },
    {
      term: "Option writers",
      what: "Sellers of options, usually large institutions, who collect a premium and lose if the price moves through their strike.",
      why: "Writers defend their strikes, so heavy call OI tends to act as resistance and heavy put OI as support.",
    },
    {
      term: "Put-call ratio (PCR)",
      what: "Total put open interest divided by total call open interest.",
      read: "Above about 1.3 puts dominate (writers expect support below); below about 0.75 calls dominate (resistance above). Extreme readings are often treated as contrarian signals.",
    },
    {
      term: "Max pain",
      what: "The strike at which option buyers as a group would lose the most, and writers pay out the least, at expiry.",
      why: "A popular theory holds that price tends to drift toward max pain as expiry approaches.",
      watch: "Debated and unreliable on its own. Treat it as a reference level, not a prediction.",
    },
    {
      term: "Expiry",
      what: "The date option contracts settle. NIFTY options have weekly expiries.",
      why: "Open interest and max pain matter most in the days just before expiry.",
    },
  ],

  rotation: [
    {
      term: "Relative strength (RS)",
      what: "A sector's return minus the benchmark's return over the same period. Not the same thing as RSI.",
      why: "Shows whether a sector is leading or lagging the market regardless of which way the market itself is moving.",
    },
    {
      term: "Sector rotation",
      what: "Money moving between sectors as the economic and market cycle shifts, for example into defensive sectors when growth slows.",
    },
    {
      term: "Relative Rotation Graph (RRG)",
      what: "A chart, developed by Julius de Kempenaer, that plots relative strength against the momentum of that relative strength.",
      read: "Sectors tend to move clockwise through the quadrants: Improving, then Leading, then Weakening, then Lagging.",
    },
    {
      term: "Benchmark",
      what: "The index everything is measured against, here the NIFTY 50.",
    },
  ],

  market: [
    {
      term: "Market breadth",
      what: "How many stocks rose versus how many fell (advances against declines).",
      why: "A rally led by a few heavyweights on weak breadth is fragile; broad participation is healthier.",
    },
    {
      term: "India VIX",
      what: "The market's expected volatility over the next 30 days, derived from NIFTY option prices and quoted as an annualised percentage.",
      read: "Below about 15 is calm and above 20 is fearful. Divide by √252 for the implied one-day move: a VIX of 15 implies about 0.95% a day.",
    },
    {
      term: "FII and DII flows",
      what: "Net buying or selling by foreign institutional investors and by domestic institutions such as mutual funds and insurers, published daily by NSE.",
      why: "Large, persistent flows move the market, and domestic buying often absorbs foreign selling.",
    },
    {
      term: "Global cues",
      what: "Overnight moves in US, European and Asian markets, US futures, crude oil, the rupee and US bond yields.",
      why: "Indian markets often open in the direction these cues point.",
    },
    {
      term: "Heatmap",
      what: "A grid of stocks coloured by their move, with deeper colour for bigger moves.",
      why: "Shows at a glance whether a move is broad or driven by a handful of stocks.",
    },
  ],

  portfolio: [
    {
      term: "Portfolio weight",
      what: "Each position's value as a share of the whole portfolio.",
    },
    {
      term: "Concentration risk",
      what: "Too much of the portfolio sitting in one stock or one sector.",
      why: "A single bad outcome can then dominate the results of the whole portfolio.",
    },
    {
      term: "Herfindahl-Hirschman Index (HHI)",
      what: "The sum of squared portfolio weights, a measure borrowed from competition economics.",
      why: "Turns concentration into a single number: the higher it is, the more concentrated the portfolio.",
    },
    {
      term: "Effective number of positions",
      what: "1 ÷ HHI: the number of equal-sized positions the portfolio behaves like.",
      read: "Ten holdings dominated by one large position might behave like only three or four.",
    },
    {
      term: "Diversification",
      what: "Holding assets that do not all move together.",
      why: "It reduces company-specific risk. Market risk, captured by beta, remains.",
    },
    {
      term: "Portfolio beta",
      what: "The weighted average beta of the holdings.",
      read: "1.2 means the portfolio tends to move 1.2% for each 1% move in the NIFTY 50.",
    },
    {
      term: "Covariance and variance",
      what: "Covariance measures how two return series move together; variance measures how much one series moves on its own. Beta is their ratio: covariance with the market divided by the market's variance.",
      why: "This ratio is the slope of the best-fit line through daily stock returns plotted against daily NIFTY returns.",
    },
    {
      term: "Unrealised and day P&L",
      what: "Unrealised P&L is current value minus cost. Day P&L is today's price change times the quantity held.",
      watch: "Excludes brokerage, taxes and corporate actions such as splits or bonuses.",
    },
  ],

  scans: [
    {
      term: "Composite technical score",
      what: "A single number that adds up several technical signals using fixed weights.",
      why: "Lets a whole index be ranked quickly on trend and momentum.",
    },
    {
      term: "Event study",
      what: "Measuring how a stock moved around a specific event, here its quarterly results.",
      why: "Shows how the market usually reacts to this company's results and how large the move tends to be.",
      watch: "Uses the raw price change, not adjusted for the market's own move on the same day.",
    },
    {
      term: "Hit rate",
      what: "The share of past results reactions that were positive.",
    },
    {
      term: "Average absolute move",
      what: "The typical size of the results-day move, ignoring direction.",
      why: "Useful for sizing positions, and for options strategies, around results.",
    },
  ],

  watchlist: [
    {
      term: "Price alert",
      what: "A level you set, checked against every live quote, that triggers when price crosses it.",
    },
    {
      term: "Big mover",
      what: "A stock that has moved 3% or more in a day.",
    },
    {
      term: "Near a 52-week extreme",
      what: "Trading within 3% of the 52-week high or low.",
      why: "Breakouts to new highs and breakdowns to new lows are often where trends begin or accelerate.",
    },
  ],
};

/** Which page section each concept group is rendered in (for the glossary). */
export const CONCEPT_SECTION: Record<string, string> = {
  pipeline: "pipeline",
  indicators: "indicators",
  score: "score",
  valuation: "score",
  growth: "score",
  quality: "score",
  strength: "score",
  sentimentPillar: "score",
  risk: "score",
  screener: "screener",
  peers: "peers",
  financials: "financials",
  estimates: "estimates",
  ownership: "ownership",
  patterns: "patterns",
  scenario: "scenario",
  sentiment: "sentiment",
  intraday: "intraday",
  options: "options",
  rotation: "rotation",
  market: "market",
  portfolio: "portfolio",
  scans: "scans",
  watchlist: "watchlist",
};

/* ------------------------------------------------------------------ */
/* Worked examples (illustrative numbers, run through the real rules)  */
/* ------------------------------------------------------------------ */

export const EXAMPLES: Record<string, Example[]> = {
  indicators: [
    {
      title: "Annualising volatility",
      body: `
Standard deviation of daily returns     1.5%
Annualised                              1.5% × √252 = 1.5% × 15.87 = 23.8%
`,
    },
  ],

  score: [
    {
      title: "Valuation pillar",
      body: `
P/E 30, sector median 25          30 ÷ 25 = 1.20       →  "< 1.4×"    →  40
PEG with EPS growth of 20%        30 ÷ 20 = 1.50       →  "< 2.5"     →  50    (1.50 is not below 1.5)
P/B 4, sector median 5            4 ÷ 5 = 0.80         →  "< 0.95×"   →  64
Target ₹1,150, price ₹1,000       upside 15%           →  50 + 15 × 1.8 = 77
Valuation pillar                  (40 + 50 + 64 + 77) ÷ 4 = 57.75  →  58
`,
    },
    {
      title: "Momentum pillar",
      body: `
Price 1,100 · 50-DMA 1,050 · 200-DMA 1,000      30 + 25 + 30 + 7 = 92
3-month return +10%                             50 + 10 × 2.2 = 72
RSI 58 (inside 45 to 65)                        75
Momentum pillar                                 (92 + 72 + 75) ÷ 3 = 79.7  →  80
`,
    },
    {
      title: "Overall score",
      body: `
Pillar          score    weight    contribution
Valuation         58      0.15         8.70
Growth            60      0.15         9.00
Quality           70      0.15        10.50
Momentum          80      0.20        16.00
Strength          68      0.10         6.80
Sentiment         55      0.10         5.50
Risk              40      0.15         9.00      (enters as 100 - 40 = 60)
Total                     1.00        65.50  →  66  →  Balanced (Constructive needs 68)

If Sentiment had no data       (65.50 - 5.50) ÷ 0.90 = 66.7  →  67
`,
    },
  ],

  screener: [
    {
      title: "Momentum factor",
      body: `
10% above the 200-DMA          50 + 10 × 1.6 = 66
5% below the 52-week high      90 + (-5) × 1.2 = 84
Momentum factor                (66 + 84) ÷ 2 = 75
`,
    },
  ],

  peers: [
    {
      title: "Premium and rank",
      body: `
P/E 30, sector median 25                       (30 ÷ 25 - 1) × 100 = +20%   (a 20% premium)
ROE 18%, and 3 of 11 peers have a higher ROE   rank = 1 + 3 = 4 of 12
`,
    },
  ],

  financials: [
    {
      title: "ROCE, cash conversion and CAGR",
      body: `
EBIT ₹200 Cr · total assets ₹1,500 Cr · current liabilities ₹500 Cr
Capital employed     1,500 - 500 = ₹1,000 Cr
ROCE                 200 ÷ 1,000 = 20%    →  "> 15%"  →  76     (exactly 20% is not above 20%)

Operating cash flow ₹180 Cr · capex -₹60 Cr · net income ₹120 Cr
Free cash flow       180 + (-60) = ₹120 Cr
Cash conversion      120 ÷ 120 = 100%     →  "> 80%"  →  84

Revenue ₹100 Cr growing to ₹133.1 Cr over 3 years
CAGR                 (133.1 ÷ 100)^(1 ÷ 3) - 1 = 10%    →  "> 7%"  →  58
`,
    },
  ],

  estimates: [
    {
      title: "Revision score",
      body: `
15 analysts raised their estimate, 19 cut it     net = -4  →  falling
Pillar input                                     50 + (15 - 19) ÷ 34 × 42 = 45.1  →  45
`,
    },
  ],

  ownership: [
    {
      title: "Promoter trend",
      body: `
Promoter 50.11% five quarters ago, 50.00% now     change -0.11 pts   →  stable
Promoter 62.0% five quarters ago, 58.5% now       change -3.5 pts    →  falling, a red flag
`,
    },
  ],

  patterns: [
    {
      title: "Descending triangle target",
      body: `
Flat support at ₹1,300, pattern height ₹211, price ₹1,293
Trigger      a daily close below ₹1,300
Target       1,300 - 211 = ₹1,089     (1,089 ÷ 1,293 - 1 = -15.8%)
`,
    },
  ],

  scenario: [
    {
      title: "Scaling and the fallback model",
      body: `
AI base case +6.0% over 45 sessions, chart set to 1M (12 sessions)
Scaled base       6.0 × 12 ÷ 45 = +1.6%

Fallback on the 1Y chart (45 sessions): R3M +12%, R1M +3%, R6M +18%, volatility 24%
Daily drift       0.5 × 12 ÷ 63 + 0.3 × 3 ÷ 21 + 0.2 × 18 ÷ 126 = 0.167% a day
Base              0.167 × 45 = +7.5%
Band              24 × √(45 ÷ 252) = 24 × 0.423 = 10.1%
Bull / bear       +17.6% / -2.6%
`,
    },
  ],

  sentiment: [
    {
      title: "Keyword score",
      body: `
18 headlines: 5 positive, 1 negative, 12 neutral    (5 - 1) ÷ max(6, 3) = +0.67
A single positive headline                         (1 - 0) ÷ max(1, 3) = +0.33   (the floor stops it reaching +1)
`,
    },
  ],

  intraday: [
    {
      title: "Levels and a trade plan",
      body: `
Basis session: H 24,000 · L 23,700 · C 23,900
P      (24,000 + 23,700 + 23,900) ÷ 3      = 23,866.67
BC     (24,000 + 23,700) ÷ 2               = 23,850.00
TC     2 × 23,866.67 - 23,850              = 23,883.33
R1     2 × 23,866.67 - 23,700              = 24,033.33      S1   2 × 23,866.67 - 24,000   = 23,733.33
R2     23,866.67 + 300                     = 24,166.67      S2   23,866.67 - 300          = 23,566.67
CPR width     33.33 ÷ 23,866.67 = 0.14%   →  narrow, trend-day potential

Price 23,950, above P, TC and the EMA   →  bullish · opening range 23,860 to 23,940
Entry     max(23,950, 23,940)                   = 23,950
Stop      highest of 23,850, 23,860, 23,733.33  = 23,860
T1        entry is below R1, so T1 = R1         = 24,033.33       T2 = R2 = 24,166.67
Risk 90 pts · reward 83.33 pts · R:R 0.93       (below 1:1, a marginal trade)
Per NIFTY lot of 75: about +₹6,250 at T1 and -₹6,750 at the stop
`,
    },
  ],

  options: [
    {
      title: "PCR and max pain",
      body: `
Put OI 30.6 lakh · call OI 17.6 lakh       PCR = 30.6 ÷ 17.6 = 1.74  →  put-heavy

Strike     call OI    put OI
23,500       100        400
23,600       200        200
23,700       400        100

pain(23,500) = puts  200 × 100 + 100 × 200          = 40,000
pain(23,600) = calls 100 × 100 + puts 100 × 100     = 20,000    ← lowest
pain(23,700) = calls 100 × 200 + 200 × 100          = 40,000
Max pain = 23,600
`,
    },
  ],

  rotation: [
    {
      title: "Placing a sector on the RRG",
      body: `
Sector 3M +8%, NIFTY 3M +2%      RS3M = +6     (x axis: right of centre)
Sector 1M +1%, NIFTY 1M +2%      RS1M = -1
Momentum                          -1 - 6 = -7   (y axis: below centre)
Quadrant                          RS ≥ 0 and momentum < 0  →  Weakening
`,
    },
  ],

  market: [
    {
      title: "Breadth, VIX and an anomaly",
      body: `
37 advancing, 12 declining        37 ÷ 49 = 75.5%   →  Risk-on
India VIX 15                      15 ÷ √252 = 0.94% expected daily move
Brent +2.7% (threshold 2.5%)      flagged as medium; high would need 2.5 × 1.8 = 4.5%
`,
    },
  ],

  portfolio: [
    {
      title: "Concentration and beta",
      body: `
Four positions at 25% each          HHI = 4 × 0.25² = 0.25            effective N = 4.0
Positions at 70%, 10%, 10%, 10%     HHI = 0.49 + 3 × 0.01 = 0.52      effective N = 1.9
Half in beta 1.2, half in beta 0.6  portfolio beta = 0.5 × 1.2 + 0.5 × 0.6 = 0.90
`,
    },
  ],

  scans: [
    {
      title: "Top-picks score",
      body: `
Price above both averages, 50-DMA above 200-DMA     +0.20 + 0.15 + 0.15 = +0.50
3-month return +12.5%                               (12.5 ÷ 25) × 0.25  = +0.125
RSI 55, neither oversold nor overbought             0
MACD histogram positive                             +0.10
Score                                               +0.725
`,
    },
    {
      title: "Results reaction statistics",
      body: `
Close before results ₹1,000, first close after ₹1,050    reaction = +5.0%

Last 8 reactions: +5, -2, +3, +1, -4, +6, +2, -1
Average   10 ÷ 8 = +1.25%
Median    +2.0%   (with an even count, the upper of the two middle values)
Positive  5 of 8 = 63%      best +6%      worst -4%
Typical   (5 + 2 + 3 + 1 + 4 + 6 + 2 + 1) ÷ 8 = ±3.0%
`,
    },
  ],

  watchlist: [
    {
      title: "Signals and alerts",
      body: `
52-week high ₹1,000, price ₹975            975 ≥ 970 (97% of 1,000)   →  near 52-week high
Alert: crosses above ₹1,250, price ₹1,293                             →  triggered
`,
    },
  ],
};
