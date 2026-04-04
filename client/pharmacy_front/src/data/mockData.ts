export interface Doctor {
  id: string;
  name: string;
  centerId: string;
  specialization: string;
  clinic: string;
  fee: number;
  phone: string;
  startTime: string;
  endTime: string;
  sessionTime: number;
  isActive: boolean;
}

export interface Prescription {
  id: string;
  prescriptionNo: string;
  centerId: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  diagnosis: string;
  prescriptionItems: { medicineName: string; quantity: number }[];
  status: "draft" | "issued" | "dispensed" | "cancelled";
  date: string;
}

export interface Center {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  isFeatured: boolean;
}

export const doctors: Doctor[] = [
  { id: "1", name: "Dr. Ahmed Khan", centerId: "1", specialization: "Cardiology", clinic: "Heart Care Clinic", fee: 500, phone: "+1234567890", startTime: "09:00", endTime: "17:00", sessionTime: 30, isActive: true },
  { id: "2", name: "Dr. Fatima Ali", centerId: "2", specialization: "Dermatology", clinic: "Skin Solutions", fee: 400, phone: "+1234567891", startTime: "10:00", endTime: "16:00", sessionTime: 20, isActive: true },
  { id: "3", name: "Dr. Omar Siddiqui", centerId: "1", specialization: "Orthopedics", clinic: "Bone & Joint Center", fee: 600, phone: "+1234567892", startTime: "08:00", endTime: "14:00", sessionTime: 30, isActive: false },
  { id: "4", name: "Dr. Ayesha Malik", centerId: "3", specialization: "Pediatrics", clinic: "Kids Health Clinic", fee: 350, phone: "+1234567893", startTime: "09:00", endTime: "15:00", sessionTime: 20, isActive: true },
  { id: "5", name: "Dr. Hassan Raza", centerId: "2", specialization: "Neurology", clinic: "Brain & Spine Center", fee: 700, phone: "+1234567894", startTime: "11:00", endTime: "18:00", sessionTime: 40, isActive: true },
  { id: "6", name: "Dr. Zainab Hussain", centerId: "1", specialization: "Cardiology", clinic: "Heart Care Clinic", fee: 550, phone: "+1234567895", startTime: "08:00", endTime: "16:00", sessionTime: 30, isActive: true },
];

export const prescriptions: Prescription[] = [
  { id: "1", prescriptionNo: "RX-2024-001", centerId: "1", doctorId: "1", doctorName: "Dr. Ahmed Khan", patientName: "Ali Hassan", diagnosis: "Hypertension", prescriptionItems: [{ medicineName: "Amlodipine 5mg", quantity: 30 }, { medicineName: "Aspirin 75mg", quantity: 30 }], status: "issued", date: "2024-03-10" },
  { id: "2", prescriptionNo: "RX-2024-002", centerId: "2", doctorId: "2", doctorName: "Dr. Fatima Ali", patientName: "Sara Ahmed", diagnosis: "Eczema", prescriptionItems: [{ medicineName: "Hydrocortisone Cream", quantity: 1 }], status: "dispensed", date: "2024-03-09" },
  { id: "3", prescriptionNo: "RX-2024-003", centerId: "1", doctorId: "6", doctorName: "Dr. Zainab Hussain", patientName: "Usman Tariq", diagnosis: "Arrhythmia", prescriptionItems: [{ medicineName: "Metoprolol 50mg", quantity: 30 }, { medicineName: "Warfarin 5mg", quantity: 30 }], status: "draft", date: "2024-03-11" },
  { id: "4", prescriptionNo: "RX-2024-004", centerId: "3", doctorId: "4", doctorName: "Dr. Ayesha Malik", patientName: "Bilal Khan (Child)", diagnosis: "Common Cold", prescriptionItems: [{ medicineName: "Paracetamol Syrup", quantity: 1 }, { medicineName: "Cetirizine Drops", quantity: 1 }], status: "cancelled", date: "2024-03-08" },
  { id: "5", prescriptionNo: "RX-2024-005", centerId: "2", doctorId: "5", doctorName: "Dr. Hassan Raza", patientName: "Nadia Pervez", diagnosis: "Migraine", prescriptionItems: [{ medicineName: "Sumatriptan 50mg", quantity: 10 }], status: "issued", date: "2024-03-11" },
];

export const centers: Center[] = [
  { id: "1", name: "City Medical Center", location: "123 Main Street, Downtown", isActive: true, isFeatured: true },
  { id: "2", name: "Westside Health Hub", location: "456 West Avenue, Suburbs", isActive: true, isFeatured: false },
  { id: "3", name: "Children's Care Hospital", location: "789 Park Road, North Side", isActive: true, isFeatured: true },
  { id: "4", name: "Southview Clinic", location: "321 South Blvd, South End", isActive: false, isFeatured: false },
];
