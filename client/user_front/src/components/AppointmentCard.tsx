import { Appointment } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface Props {
  appointment: Appointment;
  onCancel?: (id: string) => void;
}

export const AppointmentCard = ({ appointment, onCancel }: Props) => (
  <Card className="animate-fade-in">
    <CardContent className="p-5">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-display font-semibold text-foreground">{appointment.doctorName}</h3>
          <p className="text-sm text-primary">{appointment.specialization}</p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>
      <div className="space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{appointment.clinic}</div>
        <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />{appointment.date}</div>
        <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" />{appointment.time}</div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <span className="text-sm font-medium text-foreground">Rs. {appointment.fee.toLocaleString()}</span>
        {(appointment.status === 'pending' || appointment.status === 'confirmed') && onCancel && (
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => onCancel(appointment.id)}>Cancel</Button>
        )}
      </div>
    </CardContent>
  </Card>
);
