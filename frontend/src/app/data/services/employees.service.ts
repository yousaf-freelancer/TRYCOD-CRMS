import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../core/http/api-client';
import {
  Department,
  Employee,
  EmployeeInput,
  EmployeeStatus,
  SalaryStructure,
  StaffRole,
} from '../../domain/models';

export interface EmployeeFilters {
  roles?: readonly StaffRole[];
  status?: EmployeeStatus | null;
  department?: string | null;
}

/** Employees: `/employees`, `/departments`, `/employees/:id/salary`. */
@Injectable({ providedIn: 'root' })
export class EmployeesService {
  private readonly api = inject(ApiClient);

  getEmployees(filters: EmployeeFilters = {}): Observable<Employee[]> {
    return this.api.get<Employee[]>('employees', [], { ...filters });
  }

  getEmployee(id: string): Observable<Employee | null> {
    return this.api.get<Employee | null>(`employees/${id}`, null);
  }

  getDepartments(): Observable<Department[]> {
    return this.api.get<Department[]>('departments', []);
  }

  getSalaryStructure(employeeId: string): Observable<SalaryStructure | null> {
    return this.api.get<SalaryStructure | null>(`employees/${employeeId}/salary`, null);
  }

  createEmployee(input: EmployeeInput, monthlyGross: number): Observable<Employee> {
    return this.api.post<Employee>('employees', { ...input, monthlyGross });
  }

  updateEmployee(id: string, input: EmployeeInput, monthlyGross?: number): Observable<Employee> {
    return this.api.patch<Employee>(`employees/${id}`, { ...input, monthlyGross });
  }

  setStatus(id: string, status: EmployeeStatus): Observable<Employee> {
    return this.api.patch<Employee>(`employees/${id}/status`, { status });
  }
}

export function grossOf(s: SalaryStructure): number {
  return s.basic + s.hra + s.conveyance + s.specialAllowance;
}
