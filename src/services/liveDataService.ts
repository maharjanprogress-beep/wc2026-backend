interface FDPlayer {
  id: number;
  name: string;
  position: string;
  dateOfBirth: string;
  nationality: string;
  shirtNumber?: number | null;
}

interface FDTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  squad: FDPlayer[];
}

interface FDTeamsResponse {
  teams: FDTeam[];
}

interface CachedSquads {
  fetchedAt: number;
  teams: FDTeam[];
}

const TTL_MS = 60 * 60 * 1000;
let cache: CachedSquads | null = null;

const NAME_MAP: Record<string, string> = {
  USA: "United States",
  Bosnia: "Bosnia and Herzegovina",
  "South Korea": "Korea Republic",
  "New Zealand": "New Zealand",
  "Saudi Arabia": "Saudi Arabia",
  "Costa Rica": "Costa Rica",
};

function fdName(appName: string): string {
  return NAME_MAP[appName] ?? appName;
}

async function fetchSquads(): Promise<FDTeam[]> {
  const apiKey = process.env["FOOTBALL_DATA_API_KEY"];
  if (!apiKey) return [];

  const now = Date.now();
  if (cache && now - cache.fetchedAt < TTL_MS) return cache.teams;

  try {
    const res = await fetch(
      "https://api.football-data.org/v4/competitions/WC/teams",
      {
        headers: { "X-Auth-Token": apiKey },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return cache?.teams ?? [];

    const data = (await res.json()) as FDTeamsResponse;
    const teams = data.teams ?? [];
    cache = { fetchedAt: now, teams };
    return teams;
  } catch {
    return cache?.teams ?? [];
  }
}

export interface TeamLiveContext {
  teamName: string;
  squad: Array<{ name: string; position: string; number: number | null }>;
  found: boolean;
}

export async function getTeamLiveContext(
  appTeamName: string
): Promise<TeamLiveContext> {
  const teams = await fetchSquads();
  if (teams.length === 0) {
    return { teamName: appTeamName, squad: [], found: false };
  }

  const target = fdName(appTeamName).toLowerCase();
  const team = teams.find(
    (t) =>
      t.name.toLowerCase() === target ||
      t.shortName.toLowerCase() === target ||
      t.tla.toLowerCase() === target.replace(/\s/g, "")
  );

  if (!team) {
    return { teamName: appTeamName, squad: [], found: false };
  }

  const squad = (team.squad ?? []).map((p) => ({
    name: p.name,
    position: p.position,
    number: p.shirtNumber ?? null,
  }));

  return { teamName: appTeamName, squad, found: true };
}

export function buildSquadContext(ctx: TeamLiveContext): string {
  if (!ctx.found || ctx.squad.length === 0) return "";

  const byPos: Record<string, string[]> = {};
  for (const p of ctx.squad) {
    const pos = p.position ?? "Unknown";
    if (!byPos[pos]) byPos[pos] = [];
    byPos[pos].push(p.number ? `${p.name} (#${p.number})` : p.name);
  }

  const lines = Object.entries(byPos).map(
    ([pos, players]) => `  ${pos}: ${players.join(", ")}`
  );

  return `${ctx.teamName} registered squad (live from football-data.org):\n${lines.join("\n")}`;
}
