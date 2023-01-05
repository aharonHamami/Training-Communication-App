import axios from 'axios';

const axiosServer = axios.create({
    baseURL: 'http://localhost:3005'
});

export default axiosServer;