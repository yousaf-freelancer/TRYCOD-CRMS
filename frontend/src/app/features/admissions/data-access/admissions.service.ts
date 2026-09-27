import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MockDb } from '../../../core/mock/mock-db';
import { mockCompute } from '../../../core/mock/mock-response';
import { buildInstallments } from '../../../mock-data';
import {
  Admission,
  AdmissionStatus,
  AdmissionView,
  ConvertAdmissionDto,
  Enquiry,
  EnquiryInput,
  EnquiryView,
  FollowUp,
  FollowUpBucket,
  FollowUpView,
  FunnelStats,
  Lead,
  LeadInput,
  LeadView,
  Student,
} from '../../../models';
import { hmFromMinutes, inRange, nowMinutes, todayIso } from '../../../shared/utils/date.util';

export interface AssigneeFilter {
  assignedTo?: string | null;
}

export type NewFollowUp = Omit<FollowUp, 'id' | 'status' | 'completedOn' | 'notes'>;

/**
 * Admissions pipeline: leads → enquiries → follow-ups → admissions.
 * Later: `/api/leads`, `/api/enquiries`, `/api/follow-ups`, `/api/admissions`.
 */
@Injectable({ providedIn: 'root' })
export class AdmissionsService {
  private readonly db = inject(MockDb);

  // ------------------------------------------------------------ leads
  getLeads(filter: AssigneeFilter = {}): Observable<LeadView[]> {
    return mockCompute(() =>
      this.db.leads
        .filter((l) => !filter.assignedTo || l.assignedTo === filter.assignedTo)
        .sort((a, b) => b.createdOn.localeCompare(a.createdOn) || b.id.localeCompare(a.id))
        .map((l) => this.leadView(l)),
    );
  }

  createLead(input: LeadInput): Observable<LeadView> {
    return mockCompute(() => {
      const lead: Lead = {
        ...input,
        id: this.db.nextId('LD', this.db.leads),
        createdOn: todayIso(),
      };
      this.db.leads.unshift(lead);
      return this.leadView(lead);
    });
  }

  updateLead(id: string, changes: Partial<LeadInput>): Observable<LeadView> {
    return mockCompute(() => {
      const lead = this.db.leads.find((l) => l.id === id)!;
      Object.assign(lead, changes);
      return this.leadView(lead);
    });
  }

  deleteLead(id: string): Observable<void> {
    return mockCompute(() => {
      this.db.leads.splice(
        this.db.leads.findIndex((l) => l.id === id),
        1,
      );
    });
  }

  /** Moves a lead into the enquiry stage. */
  createEnquiryFromLead(leadId: string, assignedTo: string): Observable<EnquiryView> {
    return mockCompute(() => {
      const lead = this.db.leads.find((l) => l.id === leadId)!;
      lead.status = 'Qualified';
      const enquiry: Enquiry = {
        id: this.db.nextId('ENQ', this.db.enquiries),
        leadId: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        courseId: lead.courseId,
        source: lead.source,
        assignedTo,
        status: 'New',
        enquiryDate: todayIso(),
        nextFollowUp: null,
        remarks: lead.notes,
      };
      this.db.enquiries.unshift(enquiry);
      return this.enquiryView(enquiry);
    });
  }

  // -------------------------------------------------------- enquiries
  getEnquiries(filter: AssigneeFilter = {}): Observable<EnquiryView[]> {
    return mockCompute(() =>
      this.db.enquiries
        .filter((e) => !filter.assignedTo || e.assignedTo === filter.assignedTo)
        .sort((a, b) => b.enquiryDate.localeCompare(a.enquiryDate) || b.id.localeCompare(a.id))
        .map((e) => this.enquiryView(e)),
    );
  }

  createEnquiry(input: EnquiryInput): Observable<EnquiryView> {
    return mockCompute(() => {
      const enquiry: Enquiry = { ...input, id: this.db.nextId('ENQ', this.db.enquiries) };
      this.db.enquiries.unshift(enquiry);
      return this.enquiryView(enquiry);
    });
  }

  updateEnquiry(id: string, changes: Partial<EnquiryInput>): Observable<EnquiryView> {
    return mockCompute(() => {
      const enquiry = this.db.enquiries.find((e) => e.id === id)!;
      Object.assign(enquiry, changes);
      return this.enquiryView(enquiry);
    });
  }

  deleteEnquiry(id: string): Observable<void> {
    return mockCompute(() => {
      this.db.enquiries.splice(
        this.db.enquiries.findIndex((e) => e.id === id),
        1,
      );
    });
  }

  // ------------------------------------------------------- follow-ups
  getFollowUps(filter: AssigneeFilter = {}): Observable<FollowUpView[]> {
    return mockCompute(() =>
      this.db.followUps
        .filter((f) => !filter.assignedTo || f.assignedTo === filter.assignedTo)
        .map((f) => this.followUpView(f))
        .sort((a, b) => (a.dueDate + a.dueTime).localeCompare(b.dueDate + b.dueTime)),
    );
  }

  createFollowUp(input: NewFollowUp): Observable<FollowUpView> {
    return mockCompute(() => {
      const followUp: FollowUp = {
        ...input,
        id: this.db.nextId('FU', this.db.followUps),
        status: 'Pending',
        completedOn: null,
        notes: [],
      };
      this.db.followUps.push(followUp);
      this.syncNextFollowUp(followUp);
      return this.followUpView(followUp);
    });
  }

  completeFollowUp(id: string, note: string, by: string): Observable<FollowUpView> {
    return mockCompute(() => {
      const f = this.followUp(id);
      f.status = 'Completed';
      f.completedOn = todayIso();
      if (note.trim()) f.notes.push({ text: note.trim(), at: this.now(), by });
      return this.followUpView(f);
    });
  }

  rescheduleFollowUp(
    id: string,
    dueDate: string,
    dueTime: string,
    by: string,
  ): Observable<FollowUpView> {
    return mockCompute(() => {
      const f = this.followUp(id);
      f.notes.push({ text: `Rescheduled to ${dueDate} ${dueTime}`, at: this.now(), by });
      Object.assign(f, { dueDate, dueTime, status: 'Pending', completedOn: null });
      this.syncNextFollowUp(f);
      return this.followUpView(f);
    });
  }

  addFollowUpNote(id: string, text: string, by: string): Observable<FollowUpView> {
    return mockCompute(() => {
      const f = this.followUp(id);
      f.notes.push({ text: text.trim(), at: this.now(), by });
      return this.followUpView(f);
    });
  }

  // ------------------------------------------------------- admissions
  getAdmissions(
    filter: { advisorId?: string | null; from?: string | null; to?: string | null } = {},
  ): Observable<AdmissionView[]> {
    return mockCompute(() =>
      this.db.admissions
        .filter(
          (a) =>
            (!filter.advisorId || a.advisorId === filter.advisorId) &&
            inRange(a.admissionDate, filter.from, filter.to),
        )
        .sort((a, b) => b.admissionDate.localeCompare(a.admissionDate) || b.id.localeCompare(a.id))
        .map((a) => this.admissionView(a)),
    );
  }

  updateAdmissionStatus(id: string, status: AdmissionStatus): Observable<AdmissionView> {
    return mockCompute(() => {
      const admission = this.db.admissions.find((a) => a.id === id)!;
      admission.status = status;
      const student = this.db.student(admission.studentId);
      if (student && status === 'Cancelled') student.status = 'Dropped';
      return this.admissionView(admission);
    });
  }

  /** Creates the student, fee plan and admission record, and closes the source lead / enquiry. */
  convertToAdmission(dto: ConvertAdmissionDto): Observable<AdmissionView> {
    return mockCompute(() => {
      const course = this.db.course(dto.courseId)!;
      const student: Student = {
        id: this.db.nextId('STU', this.db.students),
        name: dto.name,
        gender: dto.gender,
        dob: dto.dob,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        qualification: dto.qualification,
        guardian: dto.guardian,
        courseId: dto.courseId,
        batchId: dto.batchId,
        admissionDate: dto.admissionDate,
        status: 'Active',
      };
      this.db.students.push(student);

      const net = course.fee - dto.discount;
      const count = dto.planType === 'Full' ? 1 : dto.installments;
      this.db.feePlans.push({
        studentId: student.id,
        courseId: course.id,
        planType: dto.planType,
        totalFee: course.fee,
        discount: dto.discount,
        installments: buildInstallments(student.id, net, count, dto.admissionDate),
      });

      const admission: Admission = {
        id: this.db.nextId('ADM', this.db.admissions),
        studentId: student.id,
        studentName: student.name,
        courseId: dto.courseId,
        batchId: dto.batchId,
        admissionDate: dto.admissionDate,
        advisorId: dto.advisorId,
        status: 'Pending Documents',
        feePlan: dto.planType,
        sourceRef: dto.sourceId,
      };
      this.db.admissions.unshift(admission);

      if (dto.sourceType === 'Lead') {
        const lead = this.db.leads.find((l) => l.id === dto.sourceId);
        if (lead) lead.status = 'Converted';
      } else if (dto.sourceType === 'Enquiry') {
        const enquiry = this.db.enquiries.find((e) => e.id === dto.sourceId);
        if (enquiry) {
          enquiry.status = 'Converted';
          enquiry.nextFollowUp = null;
          const lead = this.db.leads.find((l) => l.id === enquiry.leadId);
          if (lead) lead.status = 'Converted';
        }
      }
      this.db.followUps
        .filter((f) => f.relatedId === dto.sourceId && f.status === 'Pending')
        .forEach((f) => Object.assign(f, { status: 'Completed', completedOn: todayIso() }));

      return this.admissionView(admission);
    }, 700);
  }

  getFunnel(from?: string | null, to?: string | null): Observable<FunnelStats> {
    return mockCompute(() => ({
      leads: this.db.leads.filter((l) => inRange(l.createdOn, from, to)).length,
      enquiries: this.db.enquiries.filter((e) => inRange(e.enquiryDate, from, to)).length,
      admissions: this.db.admissions.filter((a) => inRange(a.admissionDate, from, to)).length,
    }));
  }

  // ---------------------------------------------------------- helpers
  private followUp(id: string): FollowUp {
    return this.db.followUps.find((f) => f.id === id)!;
  }

  private syncNextFollowUp(f: FollowUp): void {
    if (f.relatedType === 'Enquiry') {
      const enquiry = this.db.enquiries.find((e) => e.id === f.relatedId);
      if (enquiry) enquiry.nextFollowUp = f.dueDate;
    } else {
      const lead = this.db.leads.find((l) => l.id === f.relatedId);
      if (lead && (lead.status === 'New' || lead.status === 'Contacted')) lead.status = 'Follow-up';
    }
  }

  private now(): string {
    return `${todayIso()}T${hmFromMinutes(nowMinutes())}:00`;
  }

  private leadView(l: Lead): LeadView {
    return {
      ...l,
      courseName: this.db.courseName(l.courseId),
      assignedToName: this.db.employeeName(l.assignedTo),
    };
  }

  private enquiryView(e: Enquiry): EnquiryView {
    return {
      ...e,
      courseName: this.db.courseName(e.courseId),
      assignedToName: this.db.employeeName(e.assignedTo),
    };
  }

  private followUpView(f: FollowUp): FollowUpView {
    const today = todayIso();
    const bucket: FollowUpBucket =
      f.status === 'Completed'
        ? 'Completed'
        : f.dueDate === today
          ? 'Today'
          : f.dueDate < today
            ? 'Overdue'
            : 'Upcoming';
    return {
      ...f,
      courseName: this.db.courseName(f.courseId),
      assignedToName: this.db.employeeName(f.assignedTo),
      bucket,
    };
  }

  private admissionView(a: Admission): AdmissionView {
    const plan = this.db.feePlans.find((p) => p.studentId === a.studentId);
    return {
      ...a,
      courseName: this.db.courseName(a.courseId),
      batchCode: this.db.batchCode(a.batchId),
      advisorName: this.db.employeeName(a.advisorId),
      netFee: plan ? plan.totalFee - plan.discount : 0,
    };
  }
}
