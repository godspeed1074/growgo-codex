export function readLeonardBirdhouseEntry(data: Record<string, unknown> | undefined, uid: string) {
  if (!data || data.schemaVersion !== 1 || data.uid !== uid || data.id !== 'leonard-introduction-dove'
    || data.species !== 'dove' || data.sourceQuestId !== 'a-little-help-from-my-friends') return null;
  for (const key of ['level','xp','questsCompleted'] as const) {
    if (!Number.isSafeInteger(data[key]) || (data[key] as number) < (key === 'level' ? 1 : 0)) return null;
  }
  return { id: 'leonard-introduction-dove', name: 'Dove', species: 'dove',
    level: data.level as number, xp: data.xp as number, questsCompleted: data.questsCompleted as number,
    canDeploy: false, status: 'Deployment not connected yet' };
}
