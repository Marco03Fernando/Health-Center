import api from '../config/api';

const appointmentService = {

  getAppointmentById: async (id) => {
    return await api.get(`/appointment/${id}`);
  },

  getAppointmentsByUser: async (userId, status = null) => {
    const url = status 
      ? `/user-appointments/${userId}?status=${status}`
      : `/user-appointments/${userId}`;
    return await api.get(url);
  },

  bookAppointment: async (appointmentData) => {
    return await api.post('/bookappointment', appointmentData);
  },

  updateAppointment: async (id, appointmentData) => {
    return await api.put(`/updateappointment/${id}`, appointmentData);
  },

  getCenterAppointments: async (centerId, params = {}) => {
    const qs = Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '';
    return await api.get(`/getappointments/${centerId}${qs}`);
  },

  cancelAppointment: async (id) => {
    return await api.put(`/updateappointment/${id}`, { status: 'CANCELLED' });
  },

  deleteAppointment: async (id) => {
    return await api.delete(`/appointments/${id}`);
    },
  
};

export default appointmentService;
