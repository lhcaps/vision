import { absoluteApiUrl } from "./api-client";

export type TemplateSummary = {
  id: string;
  templateCode: string;
  templateNo: string | null;
  templateName: string;
  stageCode: string | null;
  renderScope: string;
  createdByOfficialId: string | null;
};

export async function fetchMyTemplates(): Promise<TemplateSummary[]> {
  const response = await fetch(absoluteApiUrl("/templates/mine"), {
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) return [];

  return (await response.json()) as TemplateSummary[];
}
