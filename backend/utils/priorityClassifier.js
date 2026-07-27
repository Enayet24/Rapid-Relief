/**
 * Weighted priority scoring for emergency requests.
 * Produces a numeric score (0-100) and maps it to a priority level.
 * Tune the WEIGHTS below as your team refines the model — nothing here
 * is hardcoded per-request, it's computed from the actual submitted data.
 */

const WEIGHTS = {
  disasterType: {
    fire: 25,
    earthquake: 25,
    flood: 20,
    cyclone: 20,
    landslide: 20,
    other: 10,
  },
  assistanceType: {
    rescue: 25,
    medical: 25,
    water: 10,
    food: 10,
    shelter: 15,
    other: 5,
  },
  // Keyword flags scanned from the free-text description (case-insensitive)
  urgentKeywords: ["trapped", "injured", "unconscious", "child", "elderly", "bleeding", "drowning"],
};

function scoreAffectedCount(count) {
  if (count >= 50) return 25;
  if (count >= 20) return 18;
  if (count >= 5) return 10;
  return 5;
}

function scoreKeywords(description = "") {
  const text = description.toLowerCase();
  const hits = WEIGHTS.urgentKeywords.filter((word) => text.includes(word)).length;
  return Math.min(hits * 5, 15); // cap contribution at 15
}

function classifyPriority({ disasterType, assistanceTypeRequired, numberOfAffectedIndividuals, description }) {
  const score =
    (WEIGHTS.disasterType[disasterType] || 0) +
    (WEIGHTS.assistanceType[assistanceTypeRequired] || 0) +
    scoreAffectedCount(numberOfAffectedIndividuals) +
    scoreKeywords(description);

  let level = "low";
  if (score >= 60) level = "critical";
  else if (score >= 40) level = "high";
  else if (score >= 20) level = "medium";

  return { priorityScore: score, priorityLevel: level };
}

module.exports = { classifyPriority };
