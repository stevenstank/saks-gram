const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL || API_URL.trim() === "") {
  throw new Error("Missing NEXT_PUBLIC_API_URL");
}

export default API_URL.replace(/\/$/, "");