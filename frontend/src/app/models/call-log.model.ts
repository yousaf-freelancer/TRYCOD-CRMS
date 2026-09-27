import { ISODate, ISODateTime } from './common.model';

export type CallDirection = 'Incoming' | 'Outgoing';
export type CallStatus = 'Answered' | 'Missed';

export interface CallLog {
  id: string;
  at: ISODateTime;
  salespersonId: string;
  phone: string;
  leadId: string | null;
  leadName: string | null;
  direction: CallDirection;
  status: CallStatus;
  durationSec: number;
}

export interface CallLogView extends CallLog {
  salespersonName: string;
}

export interface CallFilters {
  from?: ISODate | null;
  to?: ISODate | null;
  salespersonId?: string | null;
  direction?: CallDirection | null;
  status?: CallStatus | null;
}

export interface CallStats {
  salespersonId: string;
  salespersonName: string;
  total: number;
  answered: number;
  missed: number;
  incoming: number;
  outgoing: number;
  avgDurationSec: number;
  talkTimeSec: number;
}
