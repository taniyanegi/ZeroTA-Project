import axios from "axios";

// Use explicit IPv4 host to avoid potential IPv6/localhost resolution issues
const API_BASE_URL = "http://127.0.0.1:8000";

export const signup = async (username, password, email) => {
  const response = await axios.post(`${API_BASE_URL}/signup`, {
    username: username,
    password: password,
    email: email,
  });
  return response.data;
};

export const loginRisk = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/login-risk`, payload);
  return response.data;
};
