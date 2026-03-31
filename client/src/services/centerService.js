import api from '../config/api';

const centerService = {
  getAllCenters: async () => {
    return await api.get('/centers');
  },

  getCenterById: async (id) => {
    return await api.get(`/centers/${id}`);
  },
};

export default centerService;
