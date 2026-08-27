export type ItemKind = 'link' | 'midi' | 'timer' | 'note';

export interface SessionItem {
  id: string;
  kind: ItemKind;
  title: string;
  detail: string;
  url?: string;
  duration?: number;
  createdAt: string;
}

export interface Layout {
  id: string;
  name: string;
  description: string;
  items: SessionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CapsuleExport {
  format: 'session-layout-capsule';
  version: 1;
  exportedAt: string;
  layouts: Layout[];
}
