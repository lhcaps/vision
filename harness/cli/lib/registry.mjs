// Load the skills registry (registry/skills.yaml) and provide lookup helpers.

import { readIfExists } from './fsx.mjs';
import { REGISTRY_FILE } from './paths.mjs';
import { parse } from './yaml.mjs';

let cache = null;

export async function loadRegistry() {
  if (cache) return cache;
  const raw = await readIfExists(REGISTRY_FILE);
  if (!raw) {
    cache = { skills: [], groups: [] };
    return cache;
  }
  cache = parse(raw) ?? { skills: [], groups: [] };
  return cache;
}

export async function getSkill(skillId) {
  const reg = await loadRegistry();
  return reg.skills.find((s) => s.id === skillId) ?? null;
}

export async function listAvailable() {
  const reg = await loadRegistry();
  return reg.skills;
}
