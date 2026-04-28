import { getClientInstanceHeaders } from "@/api/http";

function getFilename(response, fallbackFilename) {
  const disposition = response.headers.get("Content-Disposition") || "";
  const matchedName = disposition.match(/filename="?([^";]+)"?/i);
  return matchedName ? decodeURIComponent(matchedName[1]) : fallbackFilename;
}

export async function postDownload(url, payload, fallbackFilename) {
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...getClientInstanceHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.message || "导出失败。");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = getFilename(response, fallbackFilename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
