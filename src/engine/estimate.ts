import type { SignalEvent, Params, Estimate, Factor } from './types';
import { generateRecommendations } from './recommendations';
import { EVENT_LABELS } from './defaults';
import { pluralRu, round2 } from './format';

function isActiveSignal(signal: SignalEvent): boolean {
  return signal.active !== false;
}

function isValidSignal(signal: SignalEvent): boolean {
  // Check count: finite number >= 0
  if (!Number.isFinite(signal.count) || signal.count < 0) {
    return false;
  }

  // Check intensity: finite number within 1..10
  if (!Number.isFinite(signal.intensity) || signal.intensity < 1 || signal.intensity > 10) {
    return false;
  }

  // Check location: non-empty after trim
  if (typeof signal.location !== 'string' || signal.location.trim() === '') {
    return false;
  }

  // Check event type
  const validTypes = ['missing_carrot', 'new_hole', 'motion_sensor', 'rustle_detected', 'footprints'];
  if (!validTypes.includes(signal.event)) {
    return false;
  }

  return true;
}

export function estimate(events: SignalEvent[], params: Params): Estimate {
  // Filter active and valid signals
  const activeSignals = events.filter((e) => isActiveSignal(e) && isValidSignal(e));

  // Calculate contributions
  const contributions = activeSignals.map((signal) => {
    const weight = params.typeWeights[signal.event];
    const intensityFactor = 0.5 + signal.intensity / 10;
    const value = signal.count * weight * intensityFactor;

    return {
      signalId: signal.id,
      value,
      signal,
    };
  });

  // Group by location and calculate per-location estimates
  const locationMap = new Map<
    string,
    {
      displayName: string;
      contributions: number[];
    }
  >();

  for (const { value, signal } of contributions) {
    const key = signal.location.trim().toLowerCase();
    const displayName = signal.location.trim();

    if (!locationMap.has(key)) {
      locationMap.set(key, {
        displayName,
        contributions: [],
      });
    }

    locationMap.get(key)!.contributions.push(value);
  }

  // Calculate location estimates using discount formula
  const locationEstimates = new Map<
    string,
    {
      displayName: string;
      estimate: number;
      signals: SignalEvent[];
    }
  >();

  for (const [key, { displayName, contributions: locContributions }] of locationMap) {
    // Sort contributions descending
    const sorted = [...locContributions].sort((a, b) => b - a);

    // Apply discount formula: c1 + c2*d + c3*d^2 + ...
    let locEstimate = 0;
    for (let i = 0; i < sorted.length; i++) {
      const discount = Math.pow(params.overlapDiscount, i);
      locEstimate += sorted[i] * discount;
    }

    const activeSignalsAtLocation = activeSignals.filter(
      (s) => s.location.trim().toLowerCase() === key,
    );

    locationEstimates.set(key, {
      displayName,
      estimate: locEstimate,
      signals: activeSignalsAtLocation,
    });
  }

  // Calculate raw estimate
  const rawEstimate = Array.from(locationEstimates.values()).reduce(
    (sum, data) => sum + data.estimate,
    0,
  );

  // Calculate rabbits count
  let rabbits = Math.round(rawEstimate);
  if (rabbits === 0 && activeSignals.length > 0) {
    rabbits = 1;
  }

  // Calculate confidence
  const distinctEventTypes = new Set(activeSignals.map((s) => s.event)).size;
  const locationsWithMultipleSignals = Array.from(locationEstimates.values()).filter(
    (data) => data.signals.length >= 2,
  ).length;
  const locationsWithAnySignals = locationEstimates.size;

  const diversity = distinctEventTypes / 5;
  const corroboration =
    locationsWithAnySignals > 0 ? locationsWithMultipleSignals / locationsWithAnySignals : 0;
  const volume = Math.min(activeSignals.length / 8, 1);
  const meanIntensity = activeSignals.length > 0
    ? activeSignals.reduce((sum, s) => sum + s.intensity, 0) / activeSignals.length
    : 0;
  const quality = meanIntensity / 10;

  const scoreRaw = 30 * diversity + 30 * corroboration + 25 * volume + 15 * quality;
  const confidenceScore = Math.round(scoreRaw);

  let confidenceLabel: 'низкая' | 'средняя' | 'высокая';
  if (confidenceScore < 40) {
    confidenceLabel = 'низкая';
  } else if (confidenceScore <= 70) {
    confidenceLabel = 'средняя';
  } else {
    confidenceLabel = 'высокая';
  }

  // Build factors
  const factorNames = ['Разнообразие улик', 'Перекрёстные сигналы', 'Объём наблюдений', 'Чёткость сигналов'];
  const factorWeights = [0.3, 0.3, 0.25, 0.15];
  const factorScores = [
    Math.round(diversity * 100),
    Math.round(corroboration * 100),
    Math.round(volume * 100),
    Math.round(quality * 100),
  ];

  const factors: Factor[] = [];

  // Diversity factor explanation
  const diversityExp = `${distinctEventTypes} ${pluralRu(distinctEventTypes, 'тип', 'типа', 'типов')} улик из 5.`;
  factors.push({
    name: factorNames[0],
    score: factorScores[0],
    weight: factorWeights[0],
    explanation: diversityExp,
  });

  // Corroboration factor explanation
  const corroborationExp = `${locationsWithMultipleSignals} ${pluralRu(locationsWithMultipleSignals, 'локация', 'локации', 'локаций')} из ${locationsWithAnySignals} с двумя и более сигналами.`;
  factors.push({
    name: factorNames[1],
    score: factorScores[1],
    weight: factorWeights[1],
    explanation: corroborationExp,
  });

  // Volume factor explanation
  const volumeExp = `${activeSignals.length} ${pluralRu(activeSignals.length, 'наблюдение', 'наблюдения', 'наблюдений')} из 8 желаемых.`;
  factors.push({
    name: factorNames[2],
    score: factorScores[2],
    weight: factorWeights[2],
    explanation: volumeExp,
  });

  // Quality factor explanation
  const qualityExp = `средняя интенсивность ${meanIntensity.toFixed(1)} из 10.`;
  factors.push({
    name: factorNames[3],
    score: factorScores[3],
    weight: factorWeights[3],
    explanation: qualityExp,
  });

  // Confidence explanation: top-2 factors by weight * score
  const factorContributions = factors.map((f) => ({
    factor: f,
    contribution: (f.weight * f.score) / 100,
  }));

  factorContributions.sort((a, b) => b.contribution - a.contribution);
  const top2 = factorContributions.slice(0, 2);

  let confidenceExplanation = '';
  if (activeSignals.length === 0) {
    confidenceExplanation = 'Сигналов нет.';
  } else {
    const top2Text = top2
      .map((fc) => `${fc.factor.name} (${fc.factor.score}%)`)
      .join(', ');
    confidenceExplanation = `Основной вклад в оценку: ${top2Text}.`;
  }

  // Calculate range
  let low = 0;
  let high = 0;

  if (activeSignals.length === 0) {
    low = 0;
    high = 0;
  } else {
    const w = (1 - scoreRaw / 100) * params.uncertaintyWidth;
    low = Math.floor(rabbits * (1 - w));
    high = Math.ceil(rabbits * (1 + w));

    // Enforce minimum width when rabbits >= 1
    if (rabbits >= 1) {
      if (low > rabbits - 1) {
        low = rabbits - 1;
      }
      if (high < rabbits + 1) {
        high = rabbits + 1;
      }
    }

    // Clamp low >= 0
    if (low < 0) {
      low = 0;
    }
  }

  // Build contributions array with explanations
  const contributionsArray = activeSignals.map((signal) => {
    const contrib = contributions.find((c) => c.signalId === signal.id);
    const value = contrib!.value;
    const totalContributions = contributions.reduce((sum, c) => sum + c.value, 0);
    const share = totalContributions > 0 ? value / totalContributions : 0;

    const eventLabel = EVENT_LABELS[signal.event];
    const intensityFactor = 0.5 + signal.intensity / 10;
    const weight = params.typeWeights[signal.event];

    const explanation = `${eventLabel}, «${signal.location}»: ${signal.count} шт. × вес ${round2(weight)} × интенсивность ${round2(intensityFactor)} = ${round2(value)} усл. кролика.`;

    return {
      signalId: signal.id,
      value,
      share,
      explanation,
    };
  });

  // Sort by value descending
  contributionsArray.sort((a, b) => b.value - a.value);

  // Include only top 10 contributions in output
  const topContributions = contributionsArray.slice(0, 10);

  // Build byLocation array with explanations
  const byLocationArray = Array.from(locationEstimates.values())
    .map((data) => {
      const signals = data.signals;
      const estimate = data.estimate;
      const roundedEstimate = Math.round(estimate * 100) / 100;

      // Generate explanation based on contributions at this location
      const locContributions = contributions.filter((c) =>
        signals.some((s) => s.id === c.signalId),
      );
      const sorted = locContributions
        .map((c) => c.value)
        .sort((a, b) => b - a);

      let explanation = '';
      if (sorted.length === 0) {
        explanation = '0 сигналов.';
      } else if (sorted.length === 1) {
        explanation = `1 сигнал: ${round2(sorted[0])}.`;
      } else {
        const parts: string[] = [];
        for (let i = 0; i < sorted.length; i++) {
          const discount = Math.pow(params.overlapDiscount, i);
          parts.push(round2(sorted[i] * discount).toString());
        }
        explanation = `${sorted.length} ${pluralRu(sorted.length, 'сигнал', 'сигнала', 'сигналов')}: ${parts.join(' + ')} = ${roundedEstimate}.`;
      }

      return {
        location: data.displayName,
        estimate,
        signals: signals.length,
        explanation,
      };
    })
    .sort((a, b) => b.estimate - a.estimate);

  // Generate recommendations
  const byLocationMapForRec = new Map(
    Array.from(locationEstimates.entries()).map(([key, data]) => [
      key,
      {
        estimate: data.estimate,
        signals: data.signals,
        displayName: data.displayName,
      },
    ]),
  );

  const recommendations = generateRecommendations({
    activeSignals,
    rabbits,
    confidence: confidenceScore,
    params,
    byLocationMap: byLocationMapForRec,
  });

  return {
    rabbits,
    range: [low, high],
    rawEstimate,
    confidence: {
      score: confidenceScore,
      label: confidenceLabel,
      factors,
      explanation: confidenceExplanation,
    },
    contributions: topContributions,
    byLocation: byLocationArray,
    recommendations,
  };
}
