import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadLeaderboardModule() {
  return import(path.join(repoRoot, "functions/lib/api/getLeaderboard.js"));
}

function player(name, xp, country, region = "oceania") {
  return {
    schemaVersion: 1,
    displayName: name,
    avatarUrl: null,
    region,
    country,
    state: "Victoria",
    gender: "female",
    profileComplete: true,
    level: 1,
    xp,
    coins: 0,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    lastLoginAt: new Date("2026-01-01T00:00:00.000Z")
  };
}

function candidate(uid, playerData, scores = {}) {
  return {
    uid,
    player: playerData,
    scores: {
      daily: scores.daily || { key: null, points: 0 },
      seasonal: scores.seasonal || { key: null, points: 0 },
      achievementPoints: scores.achievementPoints || 0
    }
  };
}

test("leaderboard filters by country, uses competition ranks, and keeps the caller server-owned", async () => {
  const { buildLeaderboardResult } = await loadLeaderboardModule();
  const me = player("Me", 50, "Australia");
  const result = buildLeaderboardResult({
    scope: "local",
    period: "all-time",
    currentPlayerId: "me",
    currentPlayer: me,
    candidates: [
      candidate("me", me),
      candidate("winner", player("Winner", 70, "Australia")),
      candidate("tied", player("Tied", 50, "Australia")),
      candidate("other-country", player("Elsewhere", 999, "Canada", "north-america")),
      candidate("fourth", player("Fourth", 30, "Australia"))
    ],
    refreshedAt: "2026-08-27T00:00:00.000Z"
  });

  assert.equal(result.period, "all-time");
  assert.deepEqual(
    result.entries.map(({ rank, name, score, me: isMe }) => ({ rank, name, score, me: isMe })),
    [
      { rank: 1, name: "Winner", score: 70, me: false },
      { rank: 2, name: "Me", score: 50, me: true },
      { rank: 2, name: "Tied", score: 50, me: false },
      { rank: 4, name: "Fourth", score: 30, me: false }
    ]
  );
  assert.deepEqual(result.currentPlayer, { rank: 2, name: "Me", score: 50, me: true });
});

test("daily and seasonal leaderboards use server period keys instead of lifetime XP", async () => {
  const { buildLeaderboardResult } = await loadLeaderboardModule();
  const me = player("Me", 400, "Australia");
  const winner = player("Winner", 20, "Australia");
  const candidates = [
    candidate("me", me, {
      daily: { key: "2026-08-27", points: 20 },
      seasonal: { key: "summer-2026", points: 120 }
    }),
    candidate("winner", winner, {
      daily: { key: "2026-08-27", points: 30 },
      seasonal: { key: "summer-2026", points: 180 }
    })
  ];

  const daily = buildLeaderboardResult({
    scope: "global",
    period: "daily",
    currentPlayerId: "me",
    currentPlayer: me,
    candidates,
    refreshedAt: "2026-08-27T12:00:00.000Z"
  });
  const seasonal = buildLeaderboardResult({
    scope: "global",
    period: "seasonal",
    currentPlayerId: "me",
    currentPlayer: me,
    candidates,
    refreshedAt: "2026-08-27T12:00:00.000Z"
  });

  assert.equal(daily.periodKey, "2026-08-27");
  assert.deepEqual(daily.entries.map(({ name, score }) => ({ name, score })), [
    { name: "Winner", score: 30 },
    { name: "Me", score: 20 }
  ]);
  assert.equal(seasonal.periodLabel, "Summer 2026");
  assert.deepEqual(seasonal.entries.map(({ name, score }) => ({ name, score })), [
    { name: "Winner", score: 180 },
    { name: "Me", score: 120 }
  ]);
});

test("leaderboard includes a player's shared profile picture when one exists", async () => {
  const { buildLeaderboardResult } = await loadLeaderboardModule();
  const me = player("Me", 10, "Australia");
  const friend = {
    ...player("Picture Player", 20, "Australia"),
    avatarUrl: "https://firebasestorage.googleapis.com/v0/b/growgo-development.firebasestorage.app/o/player-avatars%2Ffriend%2Fprofile-1234567890.jpg?alt=media&token=demo"
  };
  const result = buildLeaderboardResult({
    scope: "global",
    period: "all-time",
    currentPlayerId: "me",
    currentPlayer: me,
    candidates: [candidate("me", me), candidate("friend", friend)],
    refreshedAt: "2026-08-27T00:00:00.000Z"
  });

  assert.equal(result.entries[0].name, "Picture Player");
  assert.equal(result.entries[0].avatarUrl, friend.avatarUrl);
});

test("achievement points use the permanent server score across every leaderboard scope", async () => {
  const { buildLeaderboardResult } = await loadLeaderboardModule();
  const me = player("Me", 999, "Australia");
  const result = buildLeaderboardResult({
    metric: "achievements",
    scope: "local",
    period: "all-time",
    currentPlayerId: "me",
    currentPlayer: me,
    candidates: [
      candidate("me", me, { achievementPoints: 20 }),
      candidate("leader", player("Leader", 1, "Australia"), { achievementPoints: 70 }),
      candidate("outside", player("Outside", 1, "Canada", "north-america"), { achievementPoints: 500 })
    ],
    refreshedAt: "2026-08-27T00:00:00.000Z"
  });

  assert.equal(result.metric, "achievements");
  assert.deepEqual(result.entries.map(({ rank, name, score }) => ({ rank, name, score })), [
    { rank: 1, name: "Leader", score: 70 },
    { rank: 2, name: "Me", score: 20 }
  ]);
});

test("records retain the highest completed daily performances and filter them by scope", async () => {
  const { buildRecordsLeaderboardResult } = await loadLeaderboardModule();
  const me = player("Me", 100, "Australia");
  const result = buildRecordsLeaderboardResult({
    scope: "local",
    period: "daily",
    currentPlayerId: "me",
    currentPlayer: me,
    records: [
      {
        kind: "daily",
        periodKey: "2026-08-27",
        periodLabel: "2026-08-27",
        playerUid: "me",
        name: "Me",
        avatarUrl: null,
        country: "Australia",
        region: "oceania",
        score: 80,
        achievedAt: new Date("2026-08-28T00:00:00.000Z")
      },
      {
        kind: "daily",
        periodKey: "2026-08-25",
        periodLabel: "2026-08-25",
        playerUid: "winner",
        name: "Winner",
        avatarUrl: null,
        country: "Australia",
        region: "oceania",
        score: 100,
        achievedAt: new Date("2026-08-26T00:00:00.000Z")
      },
      {
        kind: "daily",
        periodKey: "2026-08-26",
        periodLabel: "2026-08-26",
        playerUid: "outside",
        name: "Outside",
        avatarUrl: null,
        country: "Canada",
        region: "north-america",
        score: 999,
        achievedAt: new Date("2026-08-27T00:00:00.000Z")
      }
    ],
    refreshedAt: "2026-08-28T03:00:00.000Z"
  });

  assert.equal(result.metric, "records");
  assert.deepEqual(result.entries.map(({ rank, name, score, recordPeriodLabel }) => ({
    rank, name, score, recordPeriodLabel
  })), [
    { rank: 1, name: "Winner", score: 100, recordPeriodLabel: "2026-08-25" },
    { rank: 2, name: "Me", score: 80, recordPeriodLabel: "2026-08-27" }
  ]);
});

test("records use live verified scores until a period has its first completed archive", async () => {
  const { buildLiveLeaderboardRecordsFromCandidates, buildRecordsLeaderboardResult } = await loadLeaderboardModule();
  const me = player("Me", 120, "Australia");
  const result = buildRecordsLeaderboardResult({
    scope: "global",
    period: "daily",
    currentPlayerId: "me",
    currentPlayer: me,
    records: buildLiveLeaderboardRecordsFromCandidates({
      period: "daily",
      refreshedAt: new Date("2026-08-28T08:00:00.000Z"),
      candidates: [
        candidate("me", me, { daily: { key: "2026-08-28", points: 35 } }),
        candidate("leader", player("Leader", 200, "Australia"), {
          daily: { key: "2026-08-28", points: 50 }
        })
      ]
    }),
    refreshedAt: "2026-08-28T08:00:00.000Z"
  });

  assert.deepEqual(result.entries.map(({ name, score, recordPeriodLabel }) => ({
    name, score, recordPeriodLabel
  })), [
    { name: "Leader", score: 50, recordPeriodLabel: "Live 2026-08-28" },
    { name: "Me", score: 35, recordPeriodLabel: "Live 2026-08-28" }
  ]);
});
