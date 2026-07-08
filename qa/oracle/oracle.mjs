#!/usr/bin/env node

/**
 * Oracle: spec-only reference model for expected values
 * Computes all golden dataset expected values from formulas in spec
 * No imports from product code — pure derivation
 */

// === PARAMETERS ===
const TYPE_WEIGHTS = {
  new_hole: 1.2,
  motion_sensor: 1.0,
  rustle_detected: 0.5,
  missing_carrot: 0.4,
  footprints: 0.3,
};

const DEFAULT_PARAMS = {
  overlapDiscount: 0.6,
  uncertaintyWidth: 0.5,
  lowConfidenceThreshold: 40,
};

// === FORMULAS ===

function contribution(count, eventType, intensity) {
  const weight = TYPE_WEIGHTS[eventType];
  const intensityFactor = 0.5 + intensity / 10;
  return count * weight * intensityFactor;
}

function perLocationEstimate(contributions, overlapDiscount) {
  const sorted = [...contributions].sort((a, b) => b - a);
  let estimate = 0;
  for (let i = 0; i < sorted.length; i++) {
    const discount = Math.pow(overlapDiscount, i);
    estimate += sorted[i] * discount;
  }
  return estimate;
}

function rabbitsCount(rawEstimate) {
  let rabbits = Math.round(rawEstimate);
  if (rabbits === 0 && rawEstimate > 0) {
    rabbits = 1; // min-1 rule
  }
  return rabbits;
}

function confidence(signals) {
  if (signals.length === 0) {
    return { score: 0, label: 'низкая' };
  }

  // Diversity: distinct event types / 5
  const distinctTypes = new Set(signals.map(s => s.event)).size;
  const diversity = distinctTypes / 5;

  // Corroboration: locations with >=2 signals / total locations
  const locationMap = new Map();
  for (const signal of signals) {
    const key = signal.location.trim().toLowerCase();
    if (!locationMap.has(key)) {
      locationMap.set(key, []);
    }
    locationMap.get(key).push(signal);
  }
  const locationsWithMulti = Array.from(locationMap.values()).filter(s => s.length >= 2).length;
  const totalLocs = locationMap.size;
  const corroboration = totalLocs > 0 ? locationsWithMulti / totalLocs : 0;

  // Volume: min(activeSignals / 8, 1)
  const volume = Math.min(signals.length / 8, 1);

  // Quality: mean intensity / 10
  const meanIntensity = signals.reduce((sum, s) => sum + s.intensity, 0) / signals.length;
  const quality = meanIntensity / 10;

  const scoreRaw = 30 * diversity + 30 * corroboration + 25 * volume + 15 * quality;
  const score = Math.round(scoreRaw);

  let label;
  if (score < 40) {
    label = 'низкая';
  } else if (score <= 70) {
    label = 'средняя';
  } else {
    label = 'высокая';
  }

  return { score, label, scoreRaw };
}

function range(rabbits, rawEstimate, confidenceScore, params) {
  if (rabbits === 0) {
    return [0, 0];
  }

  const w = (1 - confidenceScore / 100) * params.uncertaintyWidth;
  let low = Math.floor(rabbits * (1 - w));
  let high = Math.ceil(rabbits * (1 + w));

  // Enforce min width ±1
  if (rabbits >= 1) {
    if (low > rabbits - 1) low = rabbits - 1;
    if (high < rabbits + 1) high = rabbits + 1;
  }

  // Clamp low >= 0
  if (low < 0) low = 0;

  return [low, high];
}

// === GOLDEN DATASETS ===

function compute(signals, paramsOverride = {}) {
  const params = { ...DEFAULT_PARAMS, ...paramsOverride };

  // Per-signal contributions
  const contribMap = new Map();
  for (const signal of signals) {
    const c = contribution(signal.count, signal.event, signal.intensity);
    contribMap.set(signal.id, c);
  }

  // Per-location aggregation
  const locationMap = new Map();
  for (const signal of signals) {
    const key = signal.location.trim().toLowerCase();
    const displayName = signal.location.trim();
    if (!locationMap.has(key)) {
      locationMap.set(key, { displayName, contribs: [] });
    }
    const c = contribMap.get(signal.id);
    locationMap.get(key).contribs.push(c);
  }

  const locEstimates = new Map();
  for (const [key, { displayName, contribs }] of locationMap) {
    const est = perLocationEstimate(contribs, params.overlapDiscount);
    locEstimates.set(key, { displayName, estimate: est, count: contribs.length });
  }

  // Raw estimate
  const rawEstimate = Array.from(locEstimates.values()).reduce((sum, d) => sum + d.estimate, 0);

  // Rabbits
  const rabbits = rabbitsCount(rawEstimate);

  // Confidence
  const conf = confidence(signals, paramsOverride);

  // Range
  const [low, high] = range(rabbits, rawEstimate, conf.score, params);

  return {
    rabbits,
    rawEstimate,
    confidence: conf.score,
    confidenceLabel: conf.label,
    range: [low, high],
    locEstimates: Object.fromEntries(
      Array.from(locEstimates.values()).map(d => [d.displayName, d.estimate])
    ),
    contributions: Object.fromEntries(contribMap),
  };
}

// === GOLDEN DATASETS ===

const G0_SEED = [
  { id: 'evt_001', event: 'missing_carrot', location: 'Огород', count: 5, intensity: 4 },
  { id: 'evt_002', event: 'new_hole', location: 'У забора', count: 2, intensity: 7 },
  { id: 'evt_003', event: 'motion_sensor', location: 'Сарай', count: 1, intensity: 8 },
  { id: 'evt_004', event: 'rustle_detected', location: 'Сарай', count: 3, intensity: 5 },
  { id: 'evt_005', event: 'footprints', location: 'Теплица', count: 6, intensity: 6 },
];

const G1_EMPTY = [];

const G3_SINGLE = [
  { id: 'tiny', event: 'footprints', location: 'Test', count: 1, intensity: 1 },
];

const G4_HUGE = [
  { id: 'huge', event: 'missing_carrot', location: 'Huge', count: 9999, intensity: 10 },
];

// G9: Datasets engineered to land confidence EXACTLY at 40 and 70
// Confidence = 30*diversity + 30*corroboration + 25*volume + 15*quality
// At boundary 40: try different combinations
// At boundary 70: try different combinations

// G9_40 (EXACT, verified): 8 signals of 1 type in 8 distinct locations, intensity 6
// 30*(1/5) + 30*0 + 25*(8/8) + 15*(6/10) = 6 + 0 + 25 + 9 = 40.0 exactly
const G9_CONF_40 = Array.from({ length: 8 }, (_, i) => ({
  id: `b${i + 1}`, event: 'missing_carrot', location: `L${i + 1}`, count: 1, intensity: 6,
}));

// G9_70 (EXACT, verified): all 5 types in L1 + 3 extra missing_carrot in L2..L4, intensity 5
// 30*(5/5) + 30*(1/4) + 25*(8/8) + 15*(5/10) = 30 + 7.5 + 25 + 7.5 = 70.0 exactly
const G9_CONF_70 = [
  { id: 'h1', event: 'missing_carrot', location: 'L1', count: 1, intensity: 5 },
  { id: 'h2', event: 'new_hole', location: 'L1', count: 1, intensity: 5 },
  { id: 'h3', event: 'motion_sensor', location: 'L1', count: 1, intensity: 5 },
  { id: 'h4', event: 'rustle_detected', location: 'L1', count: 1, intensity: 5 },
  { id: 'h5', event: 'footprints', location: 'L1', count: 1, intensity: 5 },
  { id: 'h6', event: 'missing_carrot', location: 'L2', count: 1, intensity: 5 },
  { id: 'h7', event: 'missing_carrot', location: 'L3', count: 1, intensity: 5 },
  { id: 'h8', event: 'missing_carrot', location: 'L4', count: 1, intensity: 5 },
];

// === REPORT ===
console.log('=== ORACLE: GOLDEN DATASETS ===\n');

console.log('G0 (SEED + defaults):');
const g0 = compute(G0_SEED);
console.log(`  rabbits: ${g0.rabbits} (expected 9)`);
console.log(`  rawEstimate: ${g0.rawEstimate.toFixed(2)} (expected 8.94)`);
console.log(`  confidence: ${g0.confidence}% (expected 62%)`);
console.log(`  label: ${g0.confidenceLabel} (expected средняя)`);
console.log(`  range: [${g0.range[0]}, ${g0.range[1]}] (expected [7, 11])`);
console.log(`  locEstimates:`, g0.locEstimates);
console.log(`  contributions:`, g0.contributions);
console.log();

console.log('G1 (empty):');
const g1 = compute(G1_EMPTY);
console.log(`  rabbits: ${g1.rabbits} (expected 0)`);
console.log(`  confidence: ${g1.confidence}% (expected 0%)`);
console.log(`  label: ${g1.confidenceLabel} (expected низкая)`);
console.log(`  range: [${g1.range[0]}, ${g1.range[1]}] (expected [0, 0])`);
console.log();

console.log('G3 (single footprint):');
const g3 = compute(G3_SINGLE);
console.log(`  contribution: ${g3.contributions['tiny'].toFixed(2)} (0.3 * (0.5 + 0.1) = 0.18)`);
console.log(`  rawEstimate: ${g3.rawEstimate.toFixed(2)}`);
console.log(`  rabbits: ${g3.rabbits} (expected 1 due to min-1 rule)`);
console.log(`  confidence: ${g3.confidence}% (diversity 1/5=0.2 → 6, corroboration 0 → 0, volume 1/8=0.125 → 3.125, quality 0.1 → 1.5 = 10.625 → 11%)`);
console.log(`  label: ${g3.confidenceLabel} (expected низкая)`);
console.log(`  range: [${g3.range[0]}, ${g3.range[1]}]`);
console.log();

console.log('G4 (huge count):');
const g4 = compute(G4_HUGE);
console.log(`  contribution: ${g4.contributions['huge'].toFixed(2)} (9999 * 0.4 * 1.5 = 5999.4)`);
console.log(`  rawEstimate: ${g4.rawEstimate.toFixed(2)}`);
console.log(`  rabbits: ${g4.rabbits}`);
console.log(`  confidence: ${g4.confidence}%`);
console.log(`  range: [${g4.range[0]}, ${g4.range[1]}]`);
console.log();

console.log('G9_CONF_40 (boundary at exactly 40%):');
const g9_40 = compute(G9_CONF_40);
console.log(`  confidence: ${g9_40.confidence}% (target: exactly 40)`);
console.log(`  label: ${g9_40.confidenceLabel} (should be средняя)`);
console.log(`  calc: 30*(1/5) + 30*0 + 25*(8/8) + 15*(6/10) = 6 + 0 + 25 + 9 = 40.0 (actual: ${g9_40.confidence}%)`);
console.log();

console.log('G9_CONF_70 (boundary at exactly 70%):');
const g9_70 = compute(G9_CONF_70);
console.log(`  confidence: ${g9_70.confidence}% (target: exactly 70)`);
console.log(`  label: ${g9_70.confidenceLabel} (should be средняя)`);
console.log(`  calc: 30*(5/5) + 30*(1/4) + 25*(8/8) + 15*(5/10) = 30 + 7.5 + 25 + 7.5 = 70.0 (actual: ${g9_70.confidence}%)`);
console.log();

// === ENGINEERING G9 VARIANTS ===
console.log('=== ENGINEERING EXACT BOUNDARIES ===\n');

// For 40: try different intensity and signal counts
console.log('Searching for confidence = 40...');
for (let intensity = 1; intensity <= 10; intensity++) {
  for (let count = 1; count <= 8; count++) {
    const test = [
      { id: 'x1', event: 'missing_carrot', location: 'L1', count: 1, intensity },
      { id: 'x2', event: 'missing_carrot', location: 'L2', count: 1, intensity },
      { id: 'x3', event: 'missing_carrot', location: 'L3', count: 1, intensity },
    ];
    if (count > 3) {
      for (let i = 4; i <= count; i++) {
        test.push({ id: `x${i}`, event: 'missing_carrot', location: `L${i}`, count: 1, intensity });
      }
    }
    const result = compute(test);
    if (result.confidence === 40) {
      console.log(`Found G9_CONF_40: ${count} signals, intensity ${intensity} → ${result.confidence}%`);
      break;
    }
  }
}

console.log('\nSearching for confidence = 70...');
for (let multiCount = 1; multiCount <= 4; multiCount++) {
  for (let intensity = 1; intensity <= 10; intensity++) {
    const test = [];
    let id = 1;
    // All 5 types
    for (const type of ['missing_carrot', 'new_hole', 'motion_sensor', 'rustle_detected', 'footprints']) {
      test.push({ id: `y${id}`, event: type, location: 'L1', count: 1, intensity });
      id++;
    }
    // Add multiCount-1 more signals to different locations
    for (let i = 0; i < multiCount - 1; i++) {
      test.push({ id: `y${id}`, event: 'missing_carrot', location: `L${i+2}`, count: 1, intensity });
      id++;
    }
    const result = compute(test);
    if (result.confidence === 70) {
      console.log(`Found G9_CONF_70: 5 types + ${multiCount-1} multi = ${id-1} signals, intensity ${intensity} → ${result.confidence}%`);
      break;
    }
  }
}

console.log('\n=== END ORACLE ===');
