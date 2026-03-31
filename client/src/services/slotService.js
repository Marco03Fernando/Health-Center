import api from '../config/api';

const slotService = {

  getAllSlots: async () => {
    return await api.get('/slots');
  },

  getAvailableSlotsByCenter: async (centerId) => {
    return await api.get(`/getAvailableAppointmentSlots/${centerId}`);
  },

  getSlotsByCenter: async (centerId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    return await api.get(`/getSlotsByCenter/${centerId}${queryString ? `?${queryString}` : ''}`);
  },

  getSlotsByType: async (centerId, type) => {
    return await api.get(`/getSlotsByCenter/${centerId}?type=${type}`);
  },

  updateSlot: async (id, slotData) => {
    return await api.put(`/updateSlot/${id}`, slotData);
  },

  deleteSlot: async (id) => {
    return await api.delete(`/deleteSlot/${id}`);
  },

  deleteExpiredUnbookedSlots: async (centerId, date) => {
    const params = new URLSearchParams({ centerId });
    if (date) params.append('date', date);
    return await api.delete(`/deleteExpiredUnbooked?${params.toString()}`);
  },

  deleteUpcomingUnbookedSlots: async (centerId, date) => {
    const params = new URLSearchParams({ centerId });
    if (date) params.append('date', date);
    return await api.delete(`/deleteUpcomingUnbooked?${params.toString()}`);
  },
 
  // { healthCenterId, startDateStr, numberOfDays, slotMinutes }
  generateSlots: async (payload) => {
    return await api.post('/generateSlots', payload);
  },
};

export default slotService;
