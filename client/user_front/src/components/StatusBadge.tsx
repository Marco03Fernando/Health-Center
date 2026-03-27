import { cn } from '@/lib/utils';
import { AppointmentStatus, OrderStatus } from '@/types';

type BadgeStatus = AppointmentStatus | OrderStatus | 'prescription_required' | 'pending_review' | 'approved' | 'rejected';

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-warning/15 text-warning border-warning/20' },
  confirmed: { label: 'Confirmed', className: 'bg-info/15 text-info border-info/20' },
  completed: { label: 'Completed', className: 'bg-success/15 text-success border-success/20' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/15 text-destructive border-destructive/20' },
  no_show: { label: 'No Show', className: 'bg-muted text-muted-foreground border-muted' },
  processing: { label: 'Processing', className: 'bg-info/15 text-info border-info/20' },
  shipped: { label: 'Shipped', className: 'bg-warning/15 text-warning border-warning/20' },
  delivered: { label: 'Delivered', className: 'bg-success/15 text-success border-success/20' },
  prescription_required: { label: 'Rx Required', className: 'bg-destructive/15 text-destructive border-destructive/20' },
  pending_review: { label: 'Pending Review', className: 'bg-warning/15 text-warning border-warning/20' },
  approved: { label: 'Approved', className: 'bg-success/15 text-success border-success/20' },
  rejected: { label: 'Rejected', className: 'bg-destructive/15 text-destructive border-destructive/20' },
};

export const StatusBadge = ({ status }: { status: BadgeStatus }) => {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', config.className)}>
      {config.label}
    </span>
  );
};
