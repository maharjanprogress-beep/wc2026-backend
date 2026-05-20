import { Router } from "express";
import { geminiModel } from "../gemini.js";
import { z } from "zod";
import { getTeamLiveContext, buildSquadContext } from "../services/liveDataService.js";

const router = Router();

const MatchPredictionRequestSchema = z.object({
  homeTeam: z.string().min(1),
  awayTeam: z.string().min(1),
  stage: z.string().min(1),
});

router.post("/predictions/match", async (req, res) => {
  const parsed = MatchPredictionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { homeTeam, awayTeam, stage } = parsed.data;

  const [homeCtx, awayCtx] = await Promise.all([
    getTeamLiveContext(homeTeam),
    getTeamLiveContext(awayTeam),
  ]);

  const homeSquadBlock = buildSquadContext(homeCtx);
  const awaySquadBlock = buildSquadContext(awayCtx);
  const hasLiveData = homeCtx.found || awayCtx.found;

  const liveDataSection = hasLiveData
    ? `\n\nLIVE SQUAD DATA (use these real players for lineups — prioritize this over your training data):\n${homeSquadBlock || `${homeTeam}: squad data unavailable, use your knowledge`}\n\n${awaySquadBlock || `${awayTeam}: squad data unavailable, use your knowledge`}\n`
    : "";

  const prompt = `You are an expert football analyst and data scientist specializing in FIFA World Cup predictions. Analyze the upcoming FIFA World Cup 2026 match and provide a detailed, realistic prediction based on recent form, squad quality, tactics, head-to-head records, and tournament context.

Match: ${homeTeam} vs ${awayTeam}
Tournament Stage: ${stage}
Tournament: FIFA World Cup 2026 (USA/Canada/Mexico)${liveDataSection}

Provide your prediction in the following JSON format exactly:
{
  "predictedHomeScore": <integer 0-5>,
  "predictedAwayScore": <integer 0-5>,
  "homeFormation": "<formation like 4-3-3>",
  "awayFormation": "<formation like 4-2-3-1>",
  "homeLineup": [
    {"name": "<real player name>", "position": "<GK|CB|LB|RB|CDM|CM|CAM|LW|RW|ST|LWB|RWB>", "number": <1-23>}
    ... 11 players total
  ],
  "awayLineup": [
    {"name": "<real player name>", "position": "<GK|CB|LB|RB|CDM|CM|CAM|LW|RW|ST|LWB|RWB>", "number": <1-23>}
    ... 11 players total
  ],
  "keyScorers": [
    {"name": "<player name>", "team": "${homeTeam} or ${awayTeam}", "probability": <0-95>, "predictedGoals": <1-3>, "reason": "<why this player is likely to score>"},
    ... 4-6 scorers total mixing both teams
  ],
  "keyFactors": [
    {"title": "<factor title>", "description": "<2-3 sentence analysis>", "impact": "high|medium|low", "favoredTeam": "home|away|neutral"},
    ... exactly 5 factors
  ],
  "analysis": "<3-4 sentence overall match analysis covering tactics, key battles, tournament context, and your reasoning for the prediction>",
  "confidence": <integer 55-90>,
  "prediction": "home_win|draw|away_win",
  "usedLiveData": ${hasLiveData}
}

${hasLiveData ? "IMPORTANT: Live squad data is provided above. Use those real players in the lineups. If a known key player appears injured or absent based on recent news, reflect that in your analysis." : "Use real player names for both squads based on your knowledge of their current national team rosters."}
Be realistic and specific. Base decisions on actual squad quality, recent form, and World Cup 2026 context.`;

  const result = await geminiModel.generateContent(prompt);
  const content = result.response.text();

  if (!content) {
    res.status(500).json({ error: "No response from AI" });
    return;
  }

  const prediction = JSON.parse(content);
  res.json(prediction);
});

export default router;
