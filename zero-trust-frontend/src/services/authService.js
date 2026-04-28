const API_URL = "http://127.0.0.1:8000";

export async function loginRisk(username, password) {
  const response = await fetch(`${API_URL}/login-risk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return response.json();
}
