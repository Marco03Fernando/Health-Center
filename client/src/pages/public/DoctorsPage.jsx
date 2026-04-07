import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchDoctors } from "@/services/public.service";
import {
  Stethoscope,
  Search,
  Star,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

const SPECIALIZATIONS = [
  "All",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Orthopedics",
  "Neurology",
  "General Medicine",
  "Gynecology",
  "Ophthalmology",
  "ENT",
];

const DAYS_SHORT = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

const DoctorCard = ({ doctor }) => (
  <div className="card-healthcare flex flex-col">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
      <Stethoscope className="h-7 w-7" />
    </div>
    <h3 className="font-bold text-foreground">{doctor.name}</h3>
    <p className="text-sm font-medium text-primary">{doctor.specialization}</p>

    {doctor.centerId?.name && (
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3 shrink-0" />
        {doctor.centerId.name}
        {doctor.centerId.location ? ` — ${doctor.centerId.location}` : ""}
      </p>
    )}

    {doctor.workingDays?.length > 0 && (
      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3 shrink-0" />
        {doctor.workingDays.map((d) => DAYS_SHORT[d] ?? d).join(", ")}
        {doctor.startTime && doctor.endTime
          ? ` · ${doctor.startTime}–${doctor.endTime}`
          : ""}
      </p>
    )}

    <div className="mt-auto flex items-center justify-between pt-4">
      <span className="text-lg font-bold text-foreground">
        {doctor.fee != null ? `LKR ${doctor.fee}` : "—"}
      </span>
      <Button size="sm" asChild>
        <Link to="/user">Book Now</Link>
      </Button>
    </div>
  </div>
);

const DoctorsPage = () => {
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [specialization, setSpecialization] = useState(
    () => searchParams.get("specialization") ?? "All"
  );
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDoctors({
        q: activeSearch || undefined,
        specialization: specialization !== "All" ? specialization : undefined,
        page,
        limit: 8,
      });
      setDoctors(data.items ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeSearch, specialization, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = () => {
    setPage(1);
    setActiveSearch(search);
  };

  const handleSpecialization = (spec) => {
    setPage(1);
    setSpecialization(spec);
  };

  return (
    <div className="section-padding">
      <div className="section-container">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            Our <span className="text-gradient">Doctors</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Browse verified specialists and book your consultation instantly.
          </p>
        </div>

        {/* Search */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by doctor name..."
              className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button onClick={handleSearch} size="lg">
            Search
          </Button>
        </div>

        {/* Specialization filter chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {SPECIALIZATIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSpecialization(s)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                specialization === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="mt-10">
          {loading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-medium text-foreground">Failed to load doctors</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={load} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && doctors.length === 0 && (
            <div className="py-24 text-center text-muted-foreground">
              No doctors found. Try adjusting your search.
            </div>
          )}

          {!loading && !error && doctors.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {doctors.map((d) => (
                <DoctorCard key={d._id} doctor={d} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorsPage;
