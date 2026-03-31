import { Badge } from "@/components/ui/badge";
import type { PrescriptionStatus } from "@/data/mockData";

const statusConfig: Record<PrescriptionStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-warning/15 text-warning border-warning/30" },
  issued: { label: "Issued", className: "bg-info/15 text-info border-info/30" },
  dispensed: { label: "Dispensed", className: "bg-success/15 text-success border-success/30" },
  cancelled: { label: "Cancelled", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export default function StatusBadge({ status }: { status: PrescriptionStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
