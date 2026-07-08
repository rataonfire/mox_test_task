#!/usr/bin/env node

/**
 * Grid: extended oracle for convergence testing
 */

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
    rabbits = 1;
  }
  return rabbits;
}

function confidence(signals) {
  if (signals.length === 0) {
    return { score: 0, label: 'низкая' };
  }

  const distinctTypes = new Set(signals.map(s => s.event)).size;
  const diversity = distinctTypes / 5;

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

  const volume = Math.min(signals.length / 8, 1);
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

  if (rabbits >= 1) {
    if (low > rabbits - 1) low = rabbits - 1;
    if (high < rabbits + 1) high = rabbits + 1;
  }

  if (low < 0) low = 0;

  return [low, high];
}

function compute(signals, paramsOverride = {}) {
  const params = { ...DEFAULT_PARAMS, ...paramsOverride };

  const contribMap = new Map();
  for (const signal of signals) {
    const c = contribution(signal.count, signal.event, signal.intensity);
    contribMap.set(signal.id, c);
  }

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

  const rawEstimate = Array.from(locEstimates.values()).reduce((sum, d) => sum + d.estimate, 0);
  const rabbits = rabbitsCount(rawEstimate);
  const conf = confidence(signals, paramsOverride);
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
  };
}

// Datasets
const G0_SEED = [
  { id: 'evt_001', event: 'missing_carrot', location: 'Огород', count: 5, intensity: 4 },
  { id: 'evt_002', event: 'new_hole', location: 'У забора', count: 2, intensity: 7 },
  { id: 'evt_003', event: 'motion_sensor', location: 'Сарай', count: 1, intensity: 8 },
  { id: 'evt_004', event: 'rustle_detected', location: 'Сарай', count: 3, intensity: 5 },
  { id: 'evt_005', event: 'footprints', location: 'Теплица', count: 6, intensity: 6 },
];

const G1_EMPTY = [];
const G3_SINGLE = [{ id: 'tiny', event: 'footprints', location: 'Test', count: 1, intensity: 1 }];
const G4_HUGE = [{ id: 'huge', event: 'missing_carrot', location: 'Huge', count: 9999, intensity: 10 }];

const G9_CONF_40 = Array.from({ length: 8 }, (_, i) => ({
  id: `b${i + 1}`, event: 'missing_carrot', location: `L${i + 1}`, count: 1, intensity: 6,
}));

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

// Test datasets
const datasets = [
  { name: 'G0 (defaults)', signals: G0_SEED, params: {} },
  { name: 'G0 (d=0.3)', signals: G0_SEED, params: { overlapDiscount: 0.3 } },
  { name: 'G0 (d=1.0)', signals: G0_SEED, params: { overlapDiscount: 1.0 } },
  { name: 'G1 (empty)', signals: G1_EMPTY, params: {} },
  { name: 'G3 (single tiny)', signals: G3_SINGLE, params: {} },
  { name: 'G4 (huge)', signals: G4_HUGE, params: {} },
  { name: 'G9_40 (confidence=40)', signals: G9_CONF_40, params: {} },
  { name: 'G9_70 (confidence=70)', signals: G9_CONF_70, params: {} },
];

console.log('=== ORACLE CONVERGENCE GRID ===\n');
for (const { name, signals, params } of datasets) {
  const result = compute(signals, params);
  console.log(`${name}:`);
  console.log(`  rabbits=${result.rabbits}, confidence=${result.confidence}%, label=${result.confidenceLabel}, range=[${result.range[0]}, ${result.range[1]}]`);
  if (Object.keys(result.locEstimates).length > 0) {
    console.log(`  locations: ${JSON.stringify(result.locEstimates)}`);
  }
}
