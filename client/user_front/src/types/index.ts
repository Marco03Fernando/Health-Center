export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  clinic: string;
  fee: number;
  avatar: string;
  bio: string;
  experience: number;
  rating: number;
  availability: string[];
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  clinic: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  fee: number;
}

export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  doctorName: string;
  specialization: string;
  date: string;
  diagnosis: string;
  notes: string;
  medicines: PrescriptionMedicine[];
}

export type ProductCategory = 'otc' | 'prescription' | 'vitamins' | 'devices' | 'personal_care';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  stock: number;
  prescriptionRequired: boolean;
  image: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: OrderStatus;
  deliveryMethod: 'delivery' | 'pickup';
}
