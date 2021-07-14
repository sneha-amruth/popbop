import axios from "axios";
import dotenv from 'dotenv';

dotenv.config();

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL });

API.interceptors.request.use((req) => {
  if (localStorage.getItem('user')) {
    req.headers.Authorization = `${JSON.parse(localStorage.getItem('user'))?.token}`;
  }

  return req;
});

export const restAPICalls = () => {
    
    const request = async ({ method, endpoint, body = {} }) => {
      try {
        switch (method) {
          case "GET": {
            const res = await API.get(endpoint, body);
            return res.data;
          }
          case "POST": {
            const res = await API.post(endpoint, body);
            return res.data;
          }
          case "PUT": {
            const res = await API.put(endpoint, body);
            return res.data;
          }
          case "DELETE": {
            const res = await API.delete(endpoint);
            return res.data;
          }
          default:
            return null;
        }
      } catch (error) {
        console.error(error);
      }
    };
    return { request };
  };