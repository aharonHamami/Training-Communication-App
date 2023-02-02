import axios from 'axios';

const axiosServer = axios.create({
    baseURL: 'http://'+window.location.hostname+':3005'
});

export default axiosServer;