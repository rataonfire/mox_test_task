export type EventType =
  | 'missing_carrot'
  | 'new_hole'
  | 'motion_sensor'
  | 'rustle_detected'
  | 'footprints';

export interface SignalEvent {
  id: string;
  event: EventType;
  location: string;
  count: number;
  intensity: number;
  time: string;
  active?: boolean;
}

export interface Params {
  typeWeights: Record<EventType, number>;
  overlapDiscount: number;
  uncertaintyWidth: number;
  lowConfidenceThreshold: number;
}

export interface Factor {
  name: string;
  score: number;
  weight: number;
  explanation: string;
}

export interface Recommendation {
  text: string;
  reason: string;
  severity: 'info' | 'warn' | 'alert';
}

export interface Estimate {
  rabbits: number;
  range: [number, number];
  rawEstimate: number;
  confidence: {
    score: number;
    label: 'низкая' | 'средняя' | 'высокая';
    factors: Factor[];
    explanation: string;
  };
  contributions: {
    signalId: string;
    value: number;
    share: number;
    explanation: string;
  }[];
  byLocation: {
    location: string;
    estimate: number;
    signals: number;
    explanation: string;
  }[];
  recommendations: Recommendation[];
}
