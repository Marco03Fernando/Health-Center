import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  slots: string[];
  selected: string | null;
  onSelect: (slot: string) => void;
  bookedSlots?: string[];
}

export const SlotPicker = ({ slots, selected, onSelect, bookedSlots = [] }: Props) => (
  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
    {slots.map(slot => {
      const booked = bookedSlots.includes(slot);
      return (
        <Button
          key={slot}
          variant={selected === slot ? 'default' : 'outline'}
          size="sm"
          disabled={booked}
          className={cn('text-xs', booked && 'opacity-40')}
          onClick={() => onSelect(slot)}
        >
          {slot}
        </Button>
      );
    })}
  </div>
);
