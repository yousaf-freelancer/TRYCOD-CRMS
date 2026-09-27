import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MockDb } from '../../../core/mock/mock-db';
import { mockCompute } from '../../../core/mock/mock-response';
import { salaryStructureFor } from '../../../mock-data';
import {
  Department,
  Employee,
  EmployeeInput,
  EmployeeStatus,
  SalaryStructure,
  StaffRole,
} from '../../../models';

export interface EmployeeFilters {
  roles?: readonly StaffRole[];
  status?: EmployeeStatus | null;
  department?: string | null;
}

/** Employees. Later: `/api/employees`, `/api/departments`, `/api/employees/:id/salary`. */
@Injectable({ providedIn: 'root' })
export class EmployeesService {
  private readonly db = inject(MockDb);

  getEmployees(filters: EmployeeFilters = {}): Observable<Employee[]> {
    return mockCompute(() =>
      this.db.employees.filter(
        (e) =>
          (!filters.roles || filters.roles.includes(e.role)) &&
          (!filters.status || e.status === filters.status) &&
          (!filters.department || e.department === filters.department),
      ),
    );
  }

  getEmployee(id: string): Observable<Employee | null> {
    return mockCompute(() => this.db.employee(id) ?? null);
  }

  getDepartments(): Observable<Department[]> {
    return mockCompute(() => [...this.db.departments], 150);
  }

  getSalaryStructure(employeeId: string): Observable<SalaryStructure | null> {
    return mockCompute(
      () => this.db.salaryStructures.find((s) => s.employeeId === employeeId) ?? null,
    );
  }

  createEmployee(input: EmployeeInput, monthlyGross: number): Observable<Employee> {
    return mockCompute(() => {
      const employee: Employee = {
        ...input,
        id: this.db
          .nextId('EMP', this.db.employees)
          .replace(/-(\d)$/, '-00$1')
          .replace(/-(\d\d)$/, '-0$1'),
      };
      this.db.employees.push(employee);
      this.db.salaryStructures.push(salaryStructureFor(employee.id, monthlyGross));
      return employee;
    });
  }

  updateEmployee(id: string, input: EmployeeInput, monthlyGross?: number): Observable<Employee> {
    return mockCompute(() => {
      const employee = this.db.employee(id)!;
      Object.assign(employee, input);
      if (monthlyGross) {
        const idx = this.db.salaryStructures.findIndex((s) => s.employeeId === id);
        const structure = salaryStructureFor(id, monthlyGross);
        if (idx >= 0) this.db.salaryStructures[idx] = structure;
        else this.db.salaryStructures.push(structure);
      }
      return employee;
    });
  }

  setStatus(id: string, status: EmployeeStatus): Observable<Employee> {
    return mockCompute(() => {
      const employee = this.db.employee(id)!;
      employee.status = status;
      return employee;
    });
  }
}

export function grossOf(s: SalaryStructure): number {
  return s.basic + s.hra + s.conveyance + s.specialAllowance;
}
