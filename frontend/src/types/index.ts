export type UserRole = 'Admin' | 'Manager' | 'Technician' | 'Customer';

export type RequestStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'Accepted'
  | 'In Progress'
  | 'Awaiting Verification'
  | 'Reopened'
  | 'Closed'
  | 'Cancelled';

export type RequestPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  is_verified: boolean;
  organization_id?: string | null;
  organization_name?: string | null;
  role?: UserRole | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  settings?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  organization_id: string;
  role: UserRole;
  title?: string | null;
  department?: string | null;
  is_active: boolean;
  joined_at: string;
  user?: User;
}

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole | string;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  building?: string | null;
  floor?: string | null;
  room?: string | null;
  address?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Asset {
  id: string;
  organization_id: string;
  location_id?: string | null;
  name: string;
  asset_tag: string;
  category: string;
  manufacturer?: string | null;
  model?: string | null;
  serial_number?: string | null;
  installation_date?: string | null;
  warranty_expiration?: string | null;
  status: 'Operational' | 'Degraded' | 'In Repair' | 'Decommissioned';
  criticality: 'Low' | 'Medium' | 'High' | 'Critical';
  notes?: string | null;
  created_at: string;
  location?: Location | null;
}

export interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  url: string;
  attachment_type: string;
  created_at: string;
  uploaded_by_id: string;
}

export interface WorkLog {
  id: string;
  request_id: string;
  technician_id: string;
  diagnosis?: string | null;
  actions_taken: string;
  hours_spent: number;
  created_at: string;
  technician?: User;
}

export interface MaterialUsage {
  id: string;
  request_id: string;
  technician_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  cost?: number | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  request_id: string;
  customer_id: string;
  rating: number;
  comments?: string | null;
  created_at: string;
  customer?: User;
}

export interface StatusHistory {
  id: string;
  request_id: string;
  actor_id?: string | null;
  from_status?: string | null;
  to_status: string;
  action: string;
  comment?: string | null;
  created_at: string;
  actor?: User;
}

export interface MaintenanceRequest {
  id: string;
  organization_id: string;
  request_number: string;
  title: string;
  description: string;
  category: string;
  priority: RequestPriority;
  status: RequestStatus;
  requester_id: string;
  location_id?: string | null;
  location_details?: string | null;
  asset_id?: string | null;
  assigned_technician_id?: string | null;
  due_date?: string | null;
  manager_instructions?: string | null;
  completion_summary?: string | null;
  reopen_reason?: string | null;
  reopen_count: number;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;

  requester?: User;
  assigned_technician?: User;
  location?: Location;
  asset?: Asset;
  attachments?: Attachment[];
  work_logs?: WorkLog[];
  materials?: MaterialUsage[];
  status_history?: StatusHistory[];
  feedback?: Feedback;
}

export interface AppNotification {
  id: string;
  organization_id: string;
  recipient_id: string;
  title: string;
  message: string;
  notification_type: string;
  request_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface PreventivePlan {
  id: string;
  organization_id: string;
  title: string;
  description?: string | null;
  asset_id?: string | null;
  location_id?: string | null;
  frequency: string;
  assigned_technician_id?: string | null;
  checklist?: string | null;
  is_active: boolean;
  next_due_date: string;
  last_generated_at?: string | null;
  created_at: string;
  asset?: Asset;
  location?: Location;
  assigned_technician?: User;
}

export interface ReportSummary {
  total_requests: number;
  open_requests: number;
  unassigned_requests: number;
  in_progress_requests: number;
  awaiting_verification: number;
  closed_requests: number;
  reopened_requests: number;
  reopen_rate_percent: number;
  avg_resolution_hours: number;
  avg_response_hours: number;
  avg_rating: number;
  total_ratings_count: number;
  technicians_workload: {
    technician_id: string;
    technician_name: string;
    avatar_url?: string | null;
    active_jobs: number;
    completed_jobs: number;
    avg_hours_per_job: number;
  }[];
  categories_breakdown: {
    category: string;
    count: number;
    percentage: number;
  }[];
  status_breakdown: {
    status: string;
    count: number;
  }[];
  generated_at: string;
}

export interface AuditEvent {
  id: string;
  organization_id: string;
  actor_id?: string | null;
  entity_type: string;
  entity_id?: string | null;
  action: string;
  details?: string | null;
  ip_address?: string | null;
  created_at: string;
  actor?: User;
}
