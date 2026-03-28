export type Role = "admin" | "member";
export type ProjectType = "法人請け" | "個人請け" | "社内案件";
export type ProjectStatus = "未着手" | "進行中" | "完了" | "キャンセル" | "保留";
export type BillingStatus = "未請求" | "請求済" | "入金";
export type PaymentStatus = "未払い" | "支払済";
export type MilestoneType = string;
export type HistoryAction = "created" | "updated" | "deleted";

export interface Profile {
  id: string;
  name: string;
  role: Role;
  guarantee_rate: number | null;
  created_at: string;
}

export interface ProjectCost {
  name: string;
  amount: number;
}

export interface Project {
  id: string;
  parent_id: string | null;
  member_id: string;
  name: string;
  client: string | null;
  project_type: ProjectType | null;
  status: ProjectStatus;
  billing_status: BillingStatus;
  payment_status: PaymentStatus;
  start_date: string | null;
  delivery_date: string | null;
  memo: string | null;
  color: string | null;
  order_amount: number | null;
  copyright_registration: boolean;
  costs: ProjectCost[];
  guarantee_rate: number | null;
  guarantee_amount: number | null;
  is_archived: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  member?: Profile;
  milestones?: Milestone[];
  children?: Project[];
}

export interface Milestone {
  id: string;
  project_id: string;
  type: MilestoneType;
  date: string;
  memo: string | null;
  created_at: string;
}

export interface ProjectHistory {
  id: string;
  project_id: string;
  action: HistoryAction;
  changed_by: string | null;
  changes: Record<string, { before: unknown; after: unknown }> | null;
  created_at: string;
  changer?: Profile;
}
