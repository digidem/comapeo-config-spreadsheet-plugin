/**
 * Version information for the compiled script
 * This file is automatically updated before each build
 */

const versionData = {
  "version": "2.0.0+a49cd39",
  "commit": "a49cd39",
  "branch": "integration/import-category-v2",
  "isDirty": false,
  "buildDate": "2025-11-26T10:41:45.657Z"
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
