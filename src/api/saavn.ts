import axios from "axios";

export type SaavnSong = {
  id: string;
  name: string;
  artists: string;
  imageUrl: string;
  audioUrl: string;
};

const api = axios.create({
  baseURL: "https://saavn.sumit.co",
  timeout: 20000,
});

function pickLastUrl(arr: any[], fallback = ""): string {
  if (!Array.isArray(arr) || arr.length === 0) return fallback;
  const last = arr[arr.length - 1];
  // different wrappers use different keys (url/link)
  if (typeof last === "string") return last;
  return last?.url || last?.link || last?.uri || fallback;
}

export async function searchSongs(
  query: string,
  page = 0,
  limit = 10
): Promise<SaavnSong[]> {
  const res = await api.get("/api/search/songs", {
    params: { query, page, limit },
  });
  const list = res?.data?.data?.results ?? [];

  return list
    .map((it: any) => {
      const imageUrl = pickLastUrl(it?.image, "");
      const audioUrl = pickLastUrl(it?.downloadUrl, "");
      const artists =
        it?.primaryArtists ||
        it?.artists?.primary?.map((a: any) => a?.name).join(", ") ||
        "Unknown";

      return {
        id: String(it?.id ?? ""),
        name: String(it?.name ?? "Unknown"),
        artists: String(artists),
        imageUrl,
        audioUrl,
      };
    })
    .filter((x: SaavnSong) => !!x.audioUrl);
}
