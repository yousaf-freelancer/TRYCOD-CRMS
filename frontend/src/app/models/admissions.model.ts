import { ISODate, ISODateTime } from './common.model';
import { FeePlanType } from './fee.model';
import { Gender, Guardian } from './student.model';

export type LeadStatus = 'New' | 'Contacted' | 'Follow-up' | 'Qualified' | 'Converted' | 'Lost';
export type LeadSource =
  | 'Website'
  | 'Instagram'
  | 'Facebook'
  | 'Google Ads'
  | 'Walk-in'
  | 'Referral'
  | 'WhatsApp'
  | 'JustDial';

export const LEAD_STATUSES: readonly LeadStatus[] = [
  'New',
  'Contacted',
  'Follow-up',
  'Qualified',
  'Converted',
  'Lost',
];
export const LEAD_SOURCES: readonly LeadSource[] = [
  'Website',
  'Instagram',
  'Facebook',
  'Google Ads',
  'Walk-in',
  'Referral',
  'WhatsApp',
  'JustDial',
];

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  courseId: string;
  source: LeadSource;
  assignedTo: string;
  status: LeadStatus;
  createdOn: ISODate;
  notes: string;
}

export interface LeadView extends Lead {
  courseName: string;
  assignedToName: string;
}

export type EnquiryStatus = 'New' | 'Counselling' | 'Follow-up' | 'Converted' | 'Closed';
export const ENQUIRY_STATUSES: readonly EnquiryStatus[] = [
  'New',
  'Counselling',
  'Follow-up',
  'Converted',
  'Closed',
];

export interface Enquiry {
  id: string;
  leadId: string | null;
  name: string;
  phone: string;
  email: string;
  courseId: string;
  source: LeadSource;
  assignedTo: string;
  status: EnquiryStatus;
  enquiryDate: ISODate;
  nextFollowUp: ISODate | null;
  remarks: string;
}

export interface EnquiryView extends Enquiry {
  courseName: string;
  assignedToName: string;
}

export type FollowUpStatus = 'Pending' | 'Completed';
export type FollowUpChannel = 'Call' | 'WhatsApp' | 'Visit' | 'Email';
export type FollowUpBucket = 'Today' | 'Upcoming' | 'Overdue' | 'Completed';

export interface FollowUpNote {
  text: string;
  at: ISODateTime;
  by: string;
}

export interface FollowUp {
  id: string;
  relatedType: 'Lead' | 'Enquiry';
  relatedId: string;
  name: string;
  phone: string;
  courseId: string;
  assignedTo: string;
  dueDate: ISODate;
  dueTime: string;
  channel: FollowUpChannel;
  purpose: string;
  status: FollowUpStatus;
  completedOn: ISODate | null;
  notes: FollowUpNote[];
}

export interface FollowUpView extends FollowUp {
  courseName: string;
  assignedToName: string;
  bucket: FollowUpBucket;
}

export type AdmissionStatus = 'Confirmed' | 'Pending Documents' | 'Cancelled';

export interface Admission {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  batchId: string;
  admissionDate: ISODate;
  advisorId: string;
  status: AdmissionStatus;
  feePlan: FeePlanType;
  sourceRef: string | null;
}

export interface AdmissionView extends Admission {
  courseName: string;
  batchCode: string;
  advisorName: string;
  netFee: number;
}

export interface ConvertAdmissionDto {
  sourceType: 'Lead' | 'Enquiry' | 'Direct';
  sourceId: string | null;
  name: string;
  gender: Gender;
  dob: ISODate;
  phone: string;
  email: string;
  address: string;
  city: string;
  qualification: string;
  guardian: Guardian;
  courseId: string;
  batchId: string;
  admissionDate: ISODate;
  advisorId: string;
  planType: FeePlanType;
  discount: number;
  installments: number;
}

export interface FunnelStats {
  leads: number;
  enquiries: number;
  admissions: number;
}

export type LeadInput = Omit<Lead, 'id' | 'createdOn'>;
export type EnquiryInput = Omit<Enquiry, 'id'>;
