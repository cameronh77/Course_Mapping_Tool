import axios from "axios";

const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3000/api";

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});
