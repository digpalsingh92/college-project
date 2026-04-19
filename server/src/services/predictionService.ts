type PatientPredictionInput = {
  previousNoShows: number;
  totalPastAppointments: number;
  leadHours: number;
  hasPriorVisits: boolean;
};

const clampProbability = (value: number): number => {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return Number(value.toFixed(3));
};

export const predictNoShow = (patientData: PatientPredictionInput): number => {
  const noShowRatio =
    patientData.totalPastAppointments > 0
      ? patientData.previousNoShows / patientData.totalPastAppointments
      : 0.15;

  let probability = 0.1 + noShowRatio * 0.6;

  if (patientData.leadHours <= 6) {
    probability += 0.08;
  } else if (patientData.leadHours >= 72) {
    probability += 0.03;
  }

  if (!patientData.hasPriorVisits) {
    probability += 0.07;
  }

  return clampProbability(probability);
};

export const calculateExpectedPatients = (noShowProbabilities: number[]): number => {
  const expected = noShowProbabilities.reduce((sum, probability) => sum + (1 - probability), 0);
  return Number(expected.toFixed(2));
};

export const calculateWaitTime = (
  expectedPatients: number,
  avgConsultationTime: number
): number => {
  const wait = expectedPatients * avgConsultationTime;
  return Math.max(0, Math.round(wait));
};
