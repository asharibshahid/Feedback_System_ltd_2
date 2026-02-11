export type HealthAnswerSet = Record<string, boolean>;

export type VisitPayload = {
  fullName: string;
  mobile: string;
  email: string;
  company?: string;
  visitType: string;
  hostName: string;
  purpose: string;
  purposeNotes?: string;
  entryLane: string;
  priority: number;
  escortRequired: boolean;
  smsUpdates: boolean;
  healthAnswers: HealthAnswerSet;
  selfieDataUrl?: string | null;
  consentGiven: boolean;
  date: string;
  status?: string;
};
