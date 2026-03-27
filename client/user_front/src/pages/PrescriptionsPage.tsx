import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Download, ShoppingBag } from "lucide-react";
import { apiFetch } from "@/lib/api";

type PrescriptionMedicine = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
};

type PrescriptionItemFromApi = {
  medicineName?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  quantity?: number;
};

type PrescriptionApi = {
  _id?: string;
  id?: string;
  prescriptionNo?: string;
  diagnosis?: string;
  status?: string;
  notes?: string;
  createdAt?: string;

  doctorId?:
    | {
        _id?: string;
        id?: string;
        name?: string;
        specialization?: string;
      }
    | string;

  appointmentId?:
    | {
        _id?: string;
        id?: string;
      }
    | string;

  items?: PrescriptionItemFromApi[];
};

type PrescriptionUi = {
  id: string;
  prescriptionNo: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  date: string;
  diagnosis: string;
  status: string;
  notes: string;
  medicines: PrescriptionMedicine[];
};

function getArrayFromResponse(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.prescriptions)) return data.prescriptions;
  return [];
}

function formatDate(value?: string) {
  if (!value) return "Not available";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toISOString().split("T")[0];
}

function mapPrescription(rx: PrescriptionApi): PrescriptionUi {
  const doctor =
    typeof rx.doctorId === "object" && rx.doctorId !== null ? rx.doctorId : null;

  const items = Array.isArray(rx.items) ? rx.items : [];

  return {
    id: rx._id || rx.id || "",
    prescriptionNo: rx.prescriptionNo || rx._id || rx.id || "",
    doctorId: doctor?._id || doctor?.id || "",
    doctorName: doctor?.name || "Doctor not available",
    specialization: doctor?.specialization || "Not available",
    date: formatDate(rx.createdAt),
    diagnosis: rx.diagnosis || "Not available",
    status: rx.status || "issued",
    notes: rx.notes || "",
    medicines: items.map((m) => ({
      name: m.medicineName || "Medicine",
      dosage: m.dosage || "Not available",
      frequency: m.frequency || "Not available",
      duration: m.duration || "Not available",
      instructions: m.instructions || "",
      quantity: m.quantity || 0,
    })),
  };
}

const PrescriptionDetail = ({
  rx,
  onBack,
}: {
  rx: PrescriptionUi;
  onBack: () => void;
}) => {
  const navigate = useNavigate();

  const handleOrderMedicines = () => {
    navigate("/marketplace", {
      state: {
        fromPrescription: rx.id,
        medicines: rx.medicines.map((m) => m.name),
      },
    });
  };

  const handleDownloadPdf = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8081/api";
      const token = localStorage.getItem("token");

      const response = await fetch(`${apiBase}/prescriptions/${rx.id}/pdf`, {
        method: "GET",
        credentials: "include",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${rx.prescriptionNo || "prescription"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to download PDF");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Prescription #{rx.prescriptionNo}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Doctor</span>
              <p className="font-medium text-foreground">{rx.doctorName}</p>
            </div>

            <div>
              <span className="text-muted-foreground">Specialization</span>
              <p className="text-foreground">{rx.specialization}</p>
            </div>

            <div>
              <span className="text-muted-foreground">Date</span>
              <p className="text-foreground">{rx.date}</p>
            </div>

            <div>
              <span className="text-muted-foreground">Diagnosis</span>
              <p className="text-foreground">{rx.diagnosis}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-2">Medicines</h3>
            <div className="space-y-2">
              {rx.medicines.map((m, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted">
                  <p className="font-medium text-sm text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.dosage} · {m.frequency} · {m.duration}
                  </p>
                  {m.instructions ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {m.instructions}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {rx.notes ? (
            <div>
              <h3 className="font-medium text-foreground mb-1">Notes</h3>
              <p className="text-sm text-muted-foreground">{rx.notes}</p>
            </div>
          ) : null}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleDownloadPdf}>
              <Download className="w-4 h-4 mr-1" />
              Download PDF
            </Button>

            <Button className="flex-1" onClick={handleOrderMedicines}>
              <ShoppingBag className="w-4 h-4 mr-1" />
              Order Medicines
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionUi[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRx, setSelectedRx] = useState<PrescriptionUi | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  async function loadPrescriptions() {
    try {
      setLoading(true);
      setError("");

      const res = await apiFetch("/prescriptions");
      const items = getArrayFromResponse(res);

      setPrescriptions(items.map(mapPrescription));
    } catch (err: any) {
      setPrescriptions([]);
      setError(err.message || "Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  }

  async function loadPrescriptionDetail(id: string) {
    try {
      setLoadingDetail(true);
      setError("");

      const res = await apiFetch(`/prescriptions/${id}`);
      const raw = res?.data || res?.prescription || res;
      setSelectedRx(mapPrescription(raw));
    } catch (err: any) {
      setError(err.message || "Failed to load prescription");
      setSelectedId(null);
      setSelectedRx(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    loadPrescriptions();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedRx(null);
      return;
    }

    loadPrescriptionDetail(selectedId);
  }, [selectedId]);

  if (selectedId && selectedRx) {
    return (
      <PrescriptionDetail
        rx={selectedRx}
        onBack={() => {
          setSelectedId(null);
          setSelectedRx(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Prescriptions
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          View your prescription history
        </p>
      </div>

      {error ? <div className="text-sm text-red-500">{error}</div> : null}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading prescriptions...
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No prescriptions yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {prescriptions.map((rx) => (
            <Card
              key={rx.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedId(rx.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">
                      {rx.doctorName}
                    </h3>
                    <p className="text-sm text-primary">{rx.specialization}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{rx.date}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-2">
                  Diagnosis: {rx.diagnosis}
                </p>

                <p className="text-xs text-muted-foreground">
                  {rx.medicines.length} medicine(s) prescribed
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loadingDetail ? (
        <div className="text-center py-4 text-muted-foreground">
          Loading prescription details...
        </div>
      ) : null}
    </div>
  );
};

export default PrescriptionsPage;