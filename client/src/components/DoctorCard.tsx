import type { Doctor } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DoctorCard = ({ doctor }: { doctor: Doctor }) => {
  const navigate = useNavigate();
  return (
    <Card className="hover:shadow-md transition-shadow animate-fade-in">
      <CardContent className="p-5">
        <div className="flex gap-4">
          <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center text-2xl shrink-0">
            {doctor.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-foreground truncate">{doctor.name}</h3>
            <p className="text-sm text-primary font-medium">{doctor.specialization}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />{doctor.clinic}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-warning" />{doctor.rating}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {doctor.availability.join(", ")}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <span className="font-display font-semibold text-foreground">
            Rs. {doctor.fee.toLocaleString()}
          </span>
          <Button size="sm" onClick={() => navigate(`/user/doctors/${doctor.id}`)}>
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
