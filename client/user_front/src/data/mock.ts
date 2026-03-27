import { Doctor, Appointment, Prescription, Product, Order } from '@/types';

export const mockDoctors: Doctor[] = [
  { id: '1', name: 'Dr. Sarah Mitchell', specialization: 'Cardiologist', clinic: 'City Heart Center', fee: 3500, avatar: '👩‍⚕️', bio: 'Board-certified cardiologist with 15 years of experience in interventional cardiology.', experience: 15, rating: 4.9, availability: ['Mon', 'Wed', 'Fri'] },
  { id: '2', name: 'Dr. James Cooper', specialization: 'Dermatologist', clinic: 'SkinCare Plus', fee: 2500, avatar: '👨‍⚕️', bio: 'Specializing in medical and cosmetic dermatology with a focus on skin cancer prevention.', experience: 12, rating: 4.8, availability: ['Tue', 'Thu', 'Sat'] },
  { id: '3', name: 'Dr. Priya Sharma', specialization: 'Pediatrician', clinic: 'Children\'s Wellness', fee: 2000, avatar: '👩‍⚕️', bio: 'Dedicated pediatrician caring for children from newborns to adolescents.', experience: 10, rating: 4.7, availability: ['Mon', 'Tue', 'Thu', 'Fri'] },
  { id: '4', name: 'Dr. Michael Chen', specialization: 'Orthopedic', clinic: 'Joint & Bone Clinic', fee: 4000, avatar: '👨‍⚕️', bio: 'Expert in sports medicine and joint replacement surgery.', experience: 18, rating: 4.9, availability: ['Mon', 'Wed', 'Sat'] },
  { id: '5', name: 'Dr. Emily Watson', specialization: 'Neurologist', clinic: 'NeuroHealth Institute', fee: 5000, avatar: '👩‍⚕️', bio: 'Specialized in treating complex neurological disorders and headache management.', experience: 20, rating: 4.8, availability: ['Tue', 'Wed', 'Fri'] },
  { id: '6', name: 'Dr. Raj Patel', specialization: 'General Physician', clinic: 'HealthFirst Clinic', fee: 1500, avatar: '👨‍⚕️', bio: 'Comprehensive primary care physician with a holistic approach to patient health.', experience: 8, rating: 4.6, availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
];

export const mockAppointments: Appointment[] = [
  { id: 'A001', doctorId: '1', doctorName: 'Dr. Sarah Mitchell', specialization: 'Cardiologist', clinic: 'City Heart Center', date: '2026-03-28', time: '10:00 AM', status: 'confirmed', fee: 3500 },
  { id: 'A002', doctorId: '3', doctorName: 'Dr. Priya Sharma', specialization: 'Pediatrician', clinic: 'Children\'s Wellness', date: '2026-03-30', time: '2:00 PM', status: 'pending', fee: 2000 },
  { id: 'A003', doctorId: '6', doctorName: 'Dr. Raj Patel', specialization: 'General Physician', clinic: 'HealthFirst Clinic', date: '2026-03-20', time: '11:00 AM', status: 'completed', fee: 1500 },
  { id: 'A004', doctorId: '2', doctorName: 'Dr. James Cooper', specialization: 'Dermatologist', clinic: 'SkinCare Plus', date: '2026-03-15', time: '3:00 PM', status: 'cancelled', fee: 2500 },
];

export const mockPrescriptions: Prescription[] = [
  {
    id: 'P001', doctorName: 'Dr. Raj Patel', specialization: 'General Physician', date: '2026-03-20',
    diagnosis: 'Seasonal Flu', notes: 'Rest for 3 days. Drink plenty of fluids. Follow up if symptoms persist.',
    medicines: [
      { name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Three times daily', duration: '5 days' },
      { name: 'Cetirizine 10mg', dosage: '1 tablet', frequency: 'Once daily at night', duration: '7 days' },
      { name: 'Vitamin C 1000mg', dosage: '1 tablet', frequency: 'Once daily', duration: '14 days' },
    ],
  },
  {
    id: 'P002', doctorName: 'Dr. Sarah Mitchell', specialization: 'Cardiologist', date: '2026-03-10',
    diagnosis: 'Mild Hypertension', notes: 'Reduce salt intake. Regular exercise 30 min/day. Monitor BP daily.',
    medicines: [
      { name: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'Once daily morning', duration: '30 days' },
      { name: 'Aspirin 75mg', dosage: '1 tablet', frequency: 'Once daily after lunch', duration: '30 days' },
    ],
  },
];

export const mockProducts: Product[] = [
  { id: 'M001', name: 'Paracetamol 500mg', description: 'Pain reliever and fever reducer. Pack of 20 tablets.', price: 120, category: 'otc', stock: 150, prescriptionRequired: false, image: '💊' },
  { id: 'M002', name: 'Cetirizine 10mg', description: 'Antihistamine for allergies. Pack of 10 tablets.', price: 85, category: 'otc', stock: 200, prescriptionRequired: false, image: '💊' },
  { id: 'M003', name: 'Amlodipine 5mg', description: 'Blood pressure medication. Pack of 30 tablets.', price: 350, category: 'prescription', stock: 80, prescriptionRequired: true, image: '💊' },
  { id: 'M004', name: 'Vitamin D3 1000IU', description: 'Supports bone health and immunity. 60 softgels.', price: 450, category: 'vitamins', stock: 120, prescriptionRequired: false, image: '🔶' },
  { id: 'M005', name: 'Digital Thermometer', description: 'Fast and accurate digital thermometer with memory recall.', price: 650, category: 'devices', stock: 45, prescriptionRequired: false, image: '🌡️' },
  { id: 'M006', name: 'Hand Sanitizer 500ml', description: 'Alcohol-based sanitizer with moisturizer.', price: 280, category: 'personal_care', stock: 300, prescriptionRequired: false, image: '🧴' },
  { id: 'M007', name: 'Omega-3 Fish Oil', description: 'Heart health supplement. 90 softgels.', price: 780, category: 'vitamins', stock: 60, prescriptionRequired: false, image: '🔶' },
  { id: 'M008', name: 'Blood Pressure Monitor', description: 'Automatic upper arm BP monitor with large display.', price: 3200, category: 'devices', stock: 25, prescriptionRequired: false, image: '🩺' },
  { id: 'M009', name: 'Aspirin 75mg', description: 'Low-dose aspirin for heart health. Pack of 30.', price: 95, category: 'prescription', stock: 100, prescriptionRequired: true, image: '💊' },
  { id: 'M010', name: 'Multivitamin Complex', description: 'Daily essential vitamins and minerals. 60 tablets.', price: 560, category: 'vitamins', stock: 90, prescriptionRequired: false, image: '🔶' },
  { id: 'M011', name: 'Antiseptic Cream 30g', description: 'For minor cuts and wounds.', price: 180, category: 'personal_care', stock: 140, prescriptionRequired: false, image: '🧴' },
  { id: 'M012', name: 'Pulse Oximeter', description: 'Fingertip SpO2 and heart rate monitor.', price: 1800, category: 'devices', stock: 35, prescriptionRequired: false, image: '🩺' },
];

export const mockOrders: Order[] = [
  { id: 'ORD-001', date: '2026-03-22', items: [{ name: 'Paracetamol 500mg', quantity: 2, price: 120 }, { name: 'Vitamin D3 1000IU', quantity: 1, price: 450 }], total: 690, status: 'delivered', deliveryMethod: 'delivery' },
  { id: 'ORD-002', date: '2026-03-25', items: [{ name: 'Blood Pressure Monitor', quantity: 1, price: 3200 }], total: 3200, status: 'shipped', deliveryMethod: 'delivery' },
];

export const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
];
