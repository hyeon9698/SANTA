import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 30000, // 10초
  headers: {
    "Content-Type": "application/json",
  },
});

