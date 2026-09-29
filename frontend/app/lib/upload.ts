import { getToken } from "./auth";
import { ApiError } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function uploadImage<T>(path: string, file: File): Promise<T> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    let message = "Impossible d'envoyer l'image";
    try {
      const body = await response.json();
      if (body.detail) message = body.detail;
    } catch {
      // pas de corps JSON, on garde le message par défaut
    }
    throw new ApiError(response.status, message);
  }

  return response.json();
}