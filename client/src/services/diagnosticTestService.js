import api from '../config/api';

const diagnosticTestService = {
  getAllTests: async () => {
    return await api.get('/diagnostic-tests');
  },
};

export default diagnosticTestService;
