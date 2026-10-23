import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../core/http/api-client';
import {
  AdmissionStatus,
  AdmissionView,
  ConvertAdmissionDto,
  EnquiryInput,
  EnquiryView,
  FollowUp,
  FollowUpView,
  FunnelStats,
  LeadInput,
  LeadView,
} from '../../domain/models';

export interface AssigneeFilter {
  assignedTo?: string | null;
}

export type NewFollowUp = Omit<FollowUp, 'id' | 'status' | 'completedOn' | 'notes'>;

const EMPTY_FUNNEL: FunnelStats = { leads: 0, enquiries: 0, admissions: 0 };

/**
 * Admissions pipeline: leads → enquiries → follow-ups → admissions.
 * Endpoints: `/leads`, `/enquiries`, `/follow-ups`, `/admissions`.
 */
@Injectable({ providedIn: 'root' })
export class AdmissionsService {
  private readonly api = inject(ApiClient);

  // ------------------------------------------------------------ leads
  getLeads(filter: AssigneeFilter = {}): Observable<LeadView[]> {
    return this.api.get<LeadView[]>('leads', [], { ...filter });
  }

  createLead(input: LeadInput): Observable<LeadView> {
    return this.api.post<LeadView>('leads', input);
  }

  updateLead(id: string, changes: Partial<LeadInput>): Observable<LeadView> {
    return this.api.patch<LeadView>(`leads/${id}`, changes);
  }

  deleteLead(id: string): Observable<void> {
    return this.api.delete(`leads/${id}`);
  }

  /** Moves a lead into the enquiry stage. */
  createEnquiryFromLead(leadId: string, assignedTo: string): Observable<EnquiryView> {
    return this.api.post<EnquiryView>(`leads/${leadId}/enquiry`, { assignedTo });
  }

  // -------------------------------------------------------- enquiries
  getEnquiries(filter: AssigneeFilter = {}): Observable<EnquiryView[]> {
    return this.api.get<EnquiryView[]>('enquiries', [], { ...filter });
  }

  createEnquiry(input: EnquiryInput): Observable<EnquiryView> {
    return this.api.post<EnquiryView>('enquiries', input);
  }

  updateEnquiry(id: string, changes: Partial<EnquiryInput>): Observable<EnquiryView> {
    return this.api.patch<EnquiryView>(`enquiries/${id}`, changes);
  }

  deleteEnquiry(id: string): Observable<void> {
    return this.api.delete(`enquiries/${id}`);
  }

  // ------------------------------------------------------- follow-ups
  getFollowUps(filter: AssigneeFilter = {}): Observable<FollowUpView[]> {
    return this.api.get<FollowUpView[]>('follow-ups', [], { ...filter });
  }

  createFollowUp(input: NewFollowUp): Observable<FollowUpView> {
    return this.api.post<FollowUpView>('follow-ups', input);
  }

  completeFollowUp(id: string, note: string, by: string): Observable<FollowUpView> {
    return this.api.post<FollowUpView>(`follow-ups/${id}/complete`, { note, by });
  }

  rescheduleFollowUp(
    id: string,
    dueDate: string,
    dueTime: string,
    by: string,
  ): Observable<FollowUpView> {
    return this.api.post<FollowUpView>(`follow-ups/${id}/reschedule`, { dueDate, dueTime, by });
  }

  addFollowUpNote(id: string, text: string, by: string): Observable<FollowUpView> {
    return this.api.post<FollowUpView>(`follow-ups/${id}/notes`, { text, by });
  }

  // ------------------------------------------------------- admissions
  getAdmissions(
    filter: { advisorId?: string | null; from?: string | null; to?: string | null } = {},
  ): Observable<AdmissionView[]> {
    return this.api.get<AdmissionView[]>('admissions', [], { ...filter });
  }

  updateAdmissionStatus(id: string, status: AdmissionStatus): Observable<AdmissionView> {
    return this.api.patch<AdmissionView>(`admissions/${id}/status`, { status });
  }

  /** Creates the student, fee plan and admission record, and closes the source lead / enquiry. */
  convertToAdmission(dto: ConvertAdmissionDto): Observable<AdmissionView> {
    return this.api.post<AdmissionView>('admissions', dto);
  }

  getFunnel(from?: string | null, to?: string | null): Observable<FunnelStats> {
    return this.api.get<FunnelStats>('admissions/funnel', { ...EMPTY_FUNNEL }, { from, to });
  }
}
