export function getCorsHeaders() {
  const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS") || "*";
  
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requested-with",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  if (allowedOrigins === "*") {
    headers["Access-Control-Allow-Origin"] = "*";
  } else {
    headers["Access-Control-Allow-Origin"] = allowedOrigins;
    headers["Vary"] = "Origin";
  }

  return headers;
}

export function corsResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(),
    },
  });
}

export function corsError(message: string, status = 400) {
  return corsResponse({ error: message }, status);
}
