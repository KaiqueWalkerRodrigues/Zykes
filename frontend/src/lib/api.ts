export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  const url = typeof input === "string" ? input : input.toString();
  let access = localStorage.getItem("access_token");

  const res1 = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      "Content-Type": "application/json",
      Authorization: access ? `Bearer ${access}` : "",
    },
  });

  if (res1.status !== 401) return res1;

  // tentar refresh:
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return res1;

  const r = await fetch("http://localhost:81/api/auth/refresh.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  const data = await r.json();
  if (!r.ok || data.status === "error") {
    // refresh falhou -> limpar sessão
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return res1; // deixamos 401 subir
  }

  // guardamos novos tokens e repetimos a chamada original
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);

  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.access_token}`,
    },
  });
}
