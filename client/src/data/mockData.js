export const patients = [
  { _id: "p1", name: "Sarah Johnson", age: 34, gender: "Female", contact: "555-0101" },
  { _id: "p2", name: "Michael Chen", age: 58, gender: "Male", contact: "555-0102" },
  { _id: "p3", name: "Emily Rodriguez", age: 27, gender: "Female", contact: "555-0103" },
  { _id: "p4", name: "James Williams", age: 45, gender: "Male", contact: "555-0104" },
  { _id: "p5", name: "Priya Patel", age: 62, gender: "Female", contact: "555-0105" },
  { _id: "p6", name: "David Kim", age: 39, gender: "Male", contact: "555-0106" },
];

export const testTypes = [
  {
    _id: "tt1",
    testCode: "BS-001",
    name: "Blood Sugar Test",
    description: "Measures glucose levels in blood",
    category: "Biochemistry",
    price: 150,
    sampleTypes: ["Blood"],
    instructions: "Patient must fast for 8-12 hours before the test.",
    isActive: true,
    parameters: [
      { name: "Glucose", unit: "mg/dL", normalMinValue: 70, normalMaxValue: 100 },
    ],
  },
  {
    _id: "tt2",
    testCode: "BP-002",
    name: "Blood Pressure Panel",
    description: "Measures systolic and diastolic blood pressure",
    category: "Cardiology",
    price: 200,
    sampleTypes: ["Blood"],
    instructions: "Rest for 5 minutes before measurement.",
    isActive: true,
    parameters: [
      { name: "Systolic", unit: "mmHg", normalMinValue: 90, normalMaxValue: 120 },
      { name: "Diastolic", unit: "mmHg", normalMinValue: 60, normalMaxValue: 80 },
    ],
  },
  {
    _id: "tt3",
    testCode: "CBC-003",
    name: "Complete Blood Count",
    description: "Comprehensive blood cell analysis",
    category: "Hematology",
    price: 350,
    sampleTypes: ["Blood"],
    instructions: "No special preparation required.",
    isActive: true,
    parameters: [
      { name: "Hemoglobin", unit: "g/dL", normalMinValue: 12, normalMaxValue: 17 },
      { name: "WBC Count", unit: "cells/mcL", normalMinValue: 4500, normalMaxValue: 11000 },
      { name: "Platelet Count", unit: "cells/mcL", normalMinValue: 150000, normalMaxValue: 400000 },
    ],
  },
  {
    _id: "tt4",
    testCode: "LP-004",
    name: "Lipid Panel",
    description: "Measures cholesterol and triglycerides",
    category: "Biochemistry",
    price: 400,
    sampleTypes: ["Blood"],
    instructions: "Fast for 9-12 hours. Water is permitted.",
    isActive: true,
    parameters: [
      { name: "Total Cholesterol", unit: "mg/dL", normalMinValue: 0, normalMaxValue: 200 },
      { name: "HDL Cholesterol", unit: "mg/dL", normalMinValue: 40, normalMaxValue: 60 },
      { name: "LDL Cholesterol", unit: "mg/dL", normalMinValue: 0, normalMaxValue: 100 },
      { name: "Triglycerides", unit: "mg/dL", normalMinValue: 0, normalMaxValue: 150 },
    ],
  },
  {
    _id: "tt5",
    testCode: "TF-005",
    name: "Thyroid Function Test",
    description: "Measures thyroid hormone levels",
    category: "Endocrinology",
    price: 500,
    sampleTypes: ["Blood"],
    instructions: "No special preparation. Inform about thyroid medications.",
    isActive: true,
    parameters: [
      { name: "TSH", unit: "mIU/L", normalMinValue: 0.4, normalMaxValue: 4.0 },
      { name: "T3", unit: "ng/dL", normalMinValue: 80, normalMaxValue: 200 },
      { name: "T4", unit: "mcg/dL", normalMinValue: 4.5, normalMaxValue: 12.0 },
    ],
  },
];

export const doctors = [
  { _id: "d1", name: "Dr. Amanda Foster" },
  { _id: "d2", name: "Dr. Robert Singh" },
  { _id: "d3", name: "Dr. Lisa Chang" },
];

export const appointments = [
  { _id: "a1", patientId: "p1", doctorId: "d1", testTypeId: "tt1", appointmentDate: "2026-02-25T09:00:00", status: "pending" },
  { _id: "a2", patientId: "p2", doctorId: "d2", testTypeId: "tt3", appointmentDate: "2026-02-25T10:30:00", status: "pending" },
  { _id: "a3", patientId: "p3", doctorId: "d1", testTypeId: "tt2", appointmentDate: "2026-02-24T14:00:00", status: "undergoing" },
  { _id: "a4", patientId: "p4", doctorId: "d3", testTypeId: "tt4", appointmentDate: "2026-02-24T11:00:00", status: "undergoing" },
  { _id: "a5", patientId: "p5", doctorId: "d2", testTypeId: "tt5", appointmentDate: "2026-02-23T08:30:00", status: "completed" },
  { _id: "a6", patientId: "p6", doctorId: "d3", testTypeId: "tt1", appointmentDate: "2026-02-23T15:00:00", status: "completed" },
  { _id: "a7", patientId: "p1", doctorId: "d2", testTypeId: "tt4", appointmentDate: "2026-02-26T09:00:00", status: "pending" },
  { _id: "a8", patientId: "p3", doctorId: "d1", testTypeId: "tt5", appointmentDate: "2026-02-25T16:00:00", status: "undergoing" },
];
