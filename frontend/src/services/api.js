const API_BASE_URL = "http://127.0.0.1:8000"

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })

  const data = await response.json()

  if (!response.ok) {
    let message = "Something went wrong"

    if (typeof data.detail === "string") {
      message = data.detail
    } else if (data.detail?.message) {
      message = data.detail.message
    } else if (data.detail) {
      message = JSON.stringify(data.detail)
    } else if (data.message) {
      message =
        typeof data.message === "string"
          ? data.message
          : JSON.stringify(data.message)
    }

    throw new Error(message)
  }

  return data
}