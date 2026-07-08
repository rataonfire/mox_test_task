import type { SignalEvent, Params, Recommendation } from './types';

interface RecommendationContext {
  activeSignals: SignalEvent[];
  rabbits: number;
  confidence: number;
  params: Params;
  byLocationMap: Map<
    string,
    {
      estimate: number;
      signals: SignalEvent[];
      displayName: string;
    }
  >;
}

export function generateRecommendations(context: RecommendationContext): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (context.activeSignals.length === 0) {
    recommendations.push({
      text: 'Сигналов нет. Либо кроликов нет, либо они стали ещё невидимее — проверьте датчики.',
      reason: 'активных сигналов: 0.',
      severity: 'info',
    });
    return recommendations;
  }

  let maxEstimate = -1;
  let hotspotName = '';
  let hotspotSignals = 0;

  for (const [, data] of context.byLocationMap) {
    if (data.estimate > maxEstimate) {
      maxEstimate = data.estimate;
      hotspotName = data.displayName;
      hotspotSignals = data.signals.length;
    }
  }

  if (hotspotName && hotspotSignals > 0) {
    const roundedEstimate = Math.round(maxEstimate * 10) / 10;
    recommendations.push({
      text: `Установите камеру или датчик: «${hotspotName}».`,
      reason: `там максимальная активность — сигналов: ${hotspotSignals}, оценка ≈ ${roundedEstimate}.`,
      severity: 'info',
    });
  }

  const newHoleLocations = new Set<string>();
  let newHoleCount = 0;

  for (const signal of context.activeSignals) {
    if (signal.event === 'new_hole') {
      newHoleCount += signal.count;
      const locationData = context.byLocationMap.get(signal.location.trim().toLowerCase());
      if (locationData) {
        newHoleLocations.add(locationData.displayName);
      }
    }
  }

  if (newHoleLocations.size > 0) {
    recommendations.push({
      text: `Осмотрите и заделайте ямки: ${Array.from(newHoleLocations).join(', ')}.`,
      reason: `свежие подкопы ведут под забор — новых ямок: ${newHoleCount}.`,
      severity: 'warn',
    });
  }

  let totalMissingCarrot = 0;
  const missingCarrotLocations = new Set<string>();

  for (const signal of context.activeSignals) {
    if (signal.event === 'missing_carrot') {
      if (signal.count >= 3) {
        totalMissingCarrot += signal.count;
        const locationData = context.byLocationMap.get(signal.location.trim().toLowerCase());
        if (locationData) {
          missingCarrotLocations.add(locationData.displayName);
        }
      }
    }
  }

  if (totalMissingCarrot > 0) {
    recommendations.push({
      text: `Накройте грядки сеткой: ${Array.from(missingCarrotLocations).join(', ')}.`,
      reason: `пропало морковок: ${totalMissingCarrot}.`,
      severity: 'warn',
    });
  }

  if (context.confidence < context.params.lowConfidenceThreshold) {
    recommendations.push({
      text: 'Оценка ненадёжна — добавьте датчики или наблюдения.',
      reason: `уверенность всего ${context.confidence}% — сигналов мало или они однотипны.`,
      severity: 'alert',
    });
  }

  if (context.rabbits >= 10) {
    recommendations.push({
      text: 'Похоже на нашествие: усильте периметр и пересчитайте запасы моркови.',
      reason: `оценка ≈ ${context.rabbits} кроликов.`,
      severity: 'alert',
    });
  }

  return recommendations.slice(0, 5);
}
