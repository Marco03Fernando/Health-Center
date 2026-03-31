import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, UserRound, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Center = {
  _id: string;
  id?: string;
  name: string;
  address?: string;
  district?: string;
  phone?: string;
  isActive?: boolean;
};

type Doctor = {
  _id: string;
  id?: string;
  name: string;
  specialization: string;
  clinic?: string;
  fee?: number;
  phone?: string;
  centerId?: string | { _id?: string; id?: string; name?: string };
  isActive?: boolean;
};

function getArrayFromResponse(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

const DoctorsPage = () => {
  const navigate = useNavigate();

  const [centerSearch, setCenterSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [searched, setSearched] = useState(false);

  const [centers, setCenters] = useState<Center[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadCenters() {
      try {
        setLoadingCenters(true);
        const res = await apiFetch("/centers");
        const items = getArrayFromResponse(res);

        if (!ignore) {
          setCenters(
            items.map((c: any) => ({
              _id: c._id || c.id,
              id: c.id || c._id,
              name: c.name || "",
              address: c.address || "",
              district: c.district || "",
              phone: c.phone || "",
              isActive: c.isActive,
            }))
          );
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.message || "Failed to load centers");
        }
      } finally {
        if (!ignore) {
          setLoadingCenters(false);
        }
      }
    }

    loadCenters();

    return () => {
      ignore = true;
    };
  }, []);

  const centerNameMap = useMemo(() => {
    const map = new Map<string, string>();

    centers.forEach((center) => {
      map.set(center._id, center.name);
      if (center.id) map.set(center.id, center.name);
    });

    return map;
  }, [centers]);

  const centerSuggestions = useMemo(() => {
    return centers
      .map((c) => c.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [centers]);

  const doctorSuggestions = useMemo(() => {
    return doctors.filter((d) => {
      const centerName =
        typeof d.centerId === "object"
          ? d.centerId?.name || d.clinic || ""
          : d.clinic || centerNameMap.get(d.centerId || "") || "";

      const matchCenter = centerSearch
        ? centerName.toLowerCase().includes(centerSearch.toLowerCase())
        : true;

      const matchDoctor = doctorSearch
        ? d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
          d.specialization.toLowerCase().includes(doctorSearch.toLowerCase())
        : true;

      return matchCenter && matchDoctor;
    });
  }, [doctors, centerSearch, doctorSearch, centerNameMap]);

  const filteredDoctors = useMemo(() => {
    if (!searched) return [];

    return doctors.filter((d) => {
      const centerName =
        typeof d.centerId === "object"
          ? d.centerId?.name || d.clinic || ""
          : d.clinic || centerNameMap.get(d.centerId || "") || "";

      const matchCenter = centerSearch
        ? centerName.toLowerCase().includes(centerSearch.toLowerCase())
        : true;

      const matchDoctor = doctorSearch
        ? d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
          d.specialization.toLowerCase().includes(doctorSearch.toLowerCase())
        : true;

      return matchCenter && matchDoctor;
    });
  }, [doctors, searched, centerSearch, doctorSearch, centerNameMap]);

  async function handleSearch() {
    try {
      setError("");
      setLoadingDoctors(true);

      const params = new URLSearchParams();

      if (doctorSearch.trim()) {
        params.set("q", doctorSearch.trim());
      }

      const url = params.toString() ? `/doctors?${params.toString()}` : "/doctors";
      const res = await apiFetch(url);
      const items = getArrayFromResponse(res);

      setDoctors(
        items.map((d: any) => ({
          _id: d._id || d.id,
          id: d.id || d._id,
          name: d.name || "",
          specialization: d.specialization || "",
          clinic: d.clinic || "",
          fee: d.fee,
          phone: d.phone || "",
          centerId: d.centerId,
          isActive: d.isActive,
        }))
      );

      setSearched(true);
    } catch (err: any) {
      setError(err.message || "Failed to load doctors");
      setSearched(true);
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center animate-fade-in">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Book a Consultation
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Search by center and doctor
          </p>
        </div>

        <Card className="border bg-card/80 backdrop-blur-sm shadow-sm">
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Center</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    list="center-options"
                    value={centerSearch}
                    onChange={(e) => setCenterSearch(e.target.value)}
                    placeholder={loadingCenters ? "Loading centers..." : "Search center..."}
                    className="pl-10 h-11"
                  />
                  <datalist id="center-options">
                    {centerSuggestions.map((center) => (
                      <option key={center} value={center} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Doctor</label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    list="doctor-options"
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    placeholder="Search doctor or specialization..."
                    className="pl-10 h-11"
                  />
                  <datalist id="doctor-options">
                    {doctorSuggestions.map((doctor) => (
                      <option
                        key={doctor._id}
                        value={doctor.name}
                      >{`${doctor.name} - ${doctor.specialization}`}</option>
                    ))}
                  </datalist>
                </div>
              </div>

              <Button
                onClick={handleSearch}
                className="h-11 px-6 w-full md:w-auto"
                disabled={loadingDoctors}
              >
                {loadingDoctors ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <div className="text-center text-sm text-red-500">{error}</div>
        ) : null}

        {searched && (
          <div className="space-y-4">
            {loadingDoctors ? (
              <div className="text-center py-12 text-muted-foreground">Loading doctors...</div>
            ) : filteredDoctors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No doctors found for your search.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredDoctors.map((doctor) => {
                  const centerName =
                    typeof doctor.centerId === "object"
                      ? doctor.centerId?.name || doctor.clinic || "Center not available"
                      : doctor.clinic ||
                        centerNameMap.get(doctor.centerId || "") ||
                        "Center not available";

                  return (
                    <Card key={doctor._id} className="border shadow-sm">
                      <CardContent className="p-5 space-y-3">
                        <div>
                          <h2 className="text-lg font-semibold text-foreground">{doctor.name}</h2>
                          <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{centerName}</span>
                        </div>

                        <p className="text-sm font-medium text-foreground">
                          Fee: Rs. {Number(doctor.fee || 0).toLocaleString()}
                        </p>

                        <Button
                          className="w-full"
                          onClick={() => navigate(`/doctors/${doctor._id}`)}
                        >
                          View Available Slots
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorsPage;