export const doctorProfile = {
  id: "doc-001",
  userId: "usr-001",
  fullName: "Dr. Sarah Mitchell",
  email: "sarah.mitchell@healthcare.com",
  phone: "+1 (555) 234-5678",
  specialization: "Cardiology",
  clinic: "HeartCare Medical Center",
  fee: 150,
  centerId: "center-001",
  startTime: "09:00",
  endTime: "17:00",
  sessionTime: 30,
  isActive: true,
  mustChangePassword: false,
  role: "doctor" as const,
};

export const patients = [
  {
    id: "pat-001",
    name: "John Anderson",
    phone: "+1 (555) 111-2222",
    email: "john.anderson@email.com",
    age: 54,
    gender: "Male",
    bloodType: "A+",
    lastVisit: "2026-03-08",
    diagnosis: "Hypertension",
    medicalHistory: ["Hypertension (2022)", "High Cholesterol (2023)"],
  },
  {
    id: "pat-002",
    name: "Emily Carter",
    phone: "+1 (555) 333-4444",
    email: "emily.carter@email.com",
    age: 38,
    gender: "Female",
    bloodType: "O-",
    lastVisit: "2026-03-06",
    diagnosis: "Arrhythmia",
    medicalHistory: ["Arrhythmia (2025)", "Anxiety (2024)"],
  },
  {
    id: "pat-003",
    name: "Robert Kim",
    phone: "+1 (555) 555-6666",
    email: "robert.kim@email.com",
    age: 67,
    gender: "Male",
    bloodType: "B+",
    lastVisit: "2026-03-10",
    diagnosis: "Heart Failure",
    medicalHistory: ["Coronary Artery Disease (2020)", "Heart Failure (2024)", "Diabetes Type 2 (2018)"],
  },
  {
    id: "pat-004",
    name: "Maria Gonzales",
    phone: "+1 (555) 777-8888",
    email: "maria.gonzales@email.com",
    age: 45,
    gender: "Female",
    bloodType: "AB+",
    lastVisit: "2026-03-05",
    diagnosis: "Mitral Valve Prolapse",
    medicalHistory: ["Mitral Valve Prolapse (2023)"],
  },
];

export type PrescriptionStatus = "draft" | "issued" | "dispensed" | "cancelled";

export const prescriptions = [
  {
    id: "rx-001",
    prescriptionNo: "RX-2026-0451",
    centerId: "center-001",
    doctorId: "doc-001",
    patientId: "pat-001",
    patientName: "John Anderson",
    appointmentId: "apt-101",
    diagnosis: "Hypertension Stage 2",
    notes: "Blood pressure consistently above 140/90. Start medication and monitor weekly.",
    prescriptionItems: [
      { medicineName: "Amlodipine 5mg", quantity: 30 },
      { medicineName: "Lisinopril 10mg", quantity: 30 },
    ],
    status: "dispensed" as PrescriptionStatus,
    pharmacy: {
      dispensedAt: "2026-03-08T14:30:00",
      dispensedBy: "PharmaCare Central",
      remarks: "Patient counselled on side effects",
    },
    createdAt: "2026-03-08",
  },
  {
    id: "rx-002",
    prescriptionNo: "RX-2026-0452",
    centerId: "center-001",
    doctorId: "doc-001",
    patientId: "pat-002",
    patientName: "Emily Carter",
    appointmentId: "apt-102",
    diagnosis: "Supraventricular Tachycardia",
    notes: "Episodes of rapid heartbeat. Start beta-blocker therapy.",
    prescriptionItems: [
      { medicineName: "Metoprolol 25mg", quantity: 60 },
    ],
    status: "issued" as PrescriptionStatus,
    pharmacy: null,
    createdAt: "2026-03-06",
  },
  {
    id: "rx-003",
    prescriptionNo: "RX-2026-0453",
    centerId: "center-001",
    doctorId: "doc-001",
    patientId: "pat-003",
    patientName: "Robert Kim",
    appointmentId: "apt-103",
    diagnosis: "Congestive Heart Failure - NYHA Class III",
    notes: "Adjust diuretics. Schedule follow-up echo in 2 weeks.",
    prescriptionItems: [
      { medicineName: "Furosemide 40mg", quantity: 30 },
      { medicineName: "Spironolactone 25mg", quantity: 30 },
      { medicineName: "Carvedilol 12.5mg", quantity: 60 },
    ],
    status: "dispensed" as PrescriptionStatus,
    pharmacy: {
      dispensedAt: "2026-03-10T11:15:00",
      dispensedBy: "MedPlus Pharmacy",
      remarks: "Refill due in 30 days",
    },
    createdAt: "2026-03-10",
  },
  {
    id: "rx-004",
    prescriptionNo: "RX-2026-0454",
    centerId: "center-001",
    doctorId: "doc-001",
    patientId: "pat-004",
    patientName: "Maria Gonzales",
    appointmentId: "apt-104",
    diagnosis: "Mitral Valve Prolapse",
    notes: "Mild regurgitation. Conservative management for now.",
    prescriptionItems: [
      { medicineName: "Propranolol 20mg", quantity: 30 },
    ],
    status: "draft" as PrescriptionStatus,
    pharmacy: null,
    createdAt: "2026-03-11",
  },
  {
    id: "rx-005",
    prescriptionNo: "RX-2026-0440",
    centerId: "center-001",
    doctorId: "doc-001",
    patientId: "pat-001",
    patientName: "John Anderson",
    appointmentId: "apt-095",
    diagnosis: "Hypertension follow-up",
    notes: "Patient non-compliant. Cancelled and re-issued.",
    prescriptionItems: [
      { medicineName: "Amlodipine 5mg", quantity: 30 },
    ],
    status: "cancelled" as PrescriptionStatus,
    pharmacy: null,
    createdAt: "2026-02-20",
  },
];

export const generateTimeSlots = (startTime: string, endTime: string, sessionMinutes: number) => {
  const slots: { time: string; available: boolean }[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  const bookedSlots = [2, 5, 7, 10]; // mock booked indices
  let i = 0;
  while (current + sessionMinutes <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push({
      time: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
      available: !bookedSlots.includes(i),
    });
    current += sessionMinutes;
    i++;
  }
  return slots;
};
