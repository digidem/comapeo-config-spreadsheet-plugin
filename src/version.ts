/**
 * Version information for the compiled script
 * This file is automatically updated before each build
 */

const versionData = {
  "version": "2.0.0+0632eb8",
  "commit": "0632eb8",
  "branch": "integration/import-category-v2",
  "isDirty": true,
  "buildDate": "2025-11-26T19:21:22.090Z"
};

export function getVersionInfo(): string {
  const dirty = versionData.isDirty ? ' (dirty)' : '';
  return `${versionData.version}${dirty} (${versionData.commit} on ${versionData.branch})`;
}

export function getFullVersionInfo(): string {
  return `Compiled using ${versionData.version} at ${versionData.buildDate}`;
}

export const VERSION = versionData.version;
export const COMMIT = versionData.commit;
export const BRANCH = versionData.branch;
