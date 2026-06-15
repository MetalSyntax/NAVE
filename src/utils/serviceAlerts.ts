import { ServiceSchedule } from '../db/database';

export type AlertLevel = 'due' | 'soon' | 'ok';

export interface ServiceAlert {
  schedule: ServiceSchedule;
  nextKm: number;     // km en que toca el próximo servicio
  remaining: number;  // km restantes (negativo = vencido)
  level: AlertLevel;
}

/**
 * Calcula el estado de cada programa de servicio respecto al odómetro actual.
 * - `due`: ya vencido (remaining <= 0)
 * - `soon`: dentro del umbral de aviso (remaining <= soonThreshold)
 * - `ok`: aún lejos
 */
export function computeServiceAlerts(
  schedules: ServiceSchedule[],
  currentOdo: number,
  soonThreshold = 500,
): ServiceAlert[] {
  return schedules
    .filter(s => s.enabled && s.intervalKm > 0)
    .map(s => {
      const nextKm = s.lastServiceKm + s.intervalKm;
      const remaining = nextKm - currentOdo;
      let level: AlertLevel = 'ok';
      if (remaining <= 0) level = 'due';
      else if (remaining <= soonThreshold) level = 'soon';
      return { schedule: s, nextKm, remaining, level };
    })
    .sort((a, b) => a.remaining - b.remaining);
}
