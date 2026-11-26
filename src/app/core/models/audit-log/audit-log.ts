export interface AuditLog {
  id: number;
  eventUuid: string;
  userId: number | null;
  userName: string;
  storeId: number | null;
  storeName: string | null;
  module: string;
  entityType: string;
  entityId: string | null;
  action: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  description: string | null;
  origin: string;
  createdAt: string;
}

export interface AuditLogPage {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface AuditLogFilters {
  module?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  storeId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}
