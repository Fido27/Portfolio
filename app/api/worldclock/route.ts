import { NextRequest } from "next/server";
import { Client, Databases, Models, Query } from "node-appwrite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CountryDoc = {
  $id: string;
  code?: string;
  name?: string;
  population?: number;
  capital?: string;
  area_km2?: number;
  gdp_usd?: number;
  flag_id?: string;
  timezone?: string;
  utc_offset_min?: number;
  weather_summary?: string;
};

type ListResponse = { total: number; items: CountryDoc[] };

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function numOrU(val: unknown): number | undefined {
  if (val == null) return undefined;
  if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
  if (typeof val === "string" && val.trim() !== "") {
    const n = Number(val.replace(/[$,\s_]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function getField<T>(doc: Models.Document, key: string): T | undefined {
  return (doc as unknown as Record<string, any>)[key] as T | undefined;
}

export async function GET(_req: NextRequest) {
  try {
    const endpoint = getEnv("APPWRITE_WORLDCLOCK_ENDPOINT");
    const projectId = getEnv("APPWRITE_WORLDCLOCK_PROJECT");
    const databaseId = getEnv("APPWRITE_WORLDCLOCK_DB_ID");
    const collectionId = getEnv("APPWRITE_WORLDCLOCK_COLL_ID");

    const client = new Client().setEndpoint(endpoint).setProject(projectId);
    const databases = new Databases(client);

    // Single call, no pagination/anonymous sessions. Order by name for stable UI.
    const docs = await databases.listDocuments(databaseId, collectionId, [
      Query.orderAsc("name"),
      Query.limit(100),
    ] as any);

    const items: CountryDoc[] = (docs.documents as Models.Document[]).map((d) => ({
      $id: d.$id,
      code: getField<string>(d, "code"),
      name: getField<string>(d, "name"),
      population: numOrU(getField<any>(d, "population")),
      capital: getField<string>(d, "capital"),
      area_km2: numOrU(getField<any>(d, "area_km2")),
      gdp_usd: numOrU(getField<any>(d, "gdp_usd")),
      flag_id: getField<string>(d, "flag_id"),
      timezone: getField<string>(d, "timezone"),
      utc_offset_min: numOrU(getField<any>(d, "utc_offset_min")),
      weather_summary: getField<string>(d, "weather_summary"),
    }));

    const res: ListResponse = { total: (docs as any).total ?? items.length, items };

    return new Response(JSON.stringify(res), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers: { "content-type": "application/json" } });
  }
}


