/**
 * Version information for the compiled script
 * This file is automatically updated before each build
 */

const versionData = {
  "version": "2.0.0+1ea49fd",
  "commit": "1ea49fd",
  "branch": "integration/import-category-v2",
  "isDirty": false,
  "buildDate": "2025-11-26T10:53:17.876Z"
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
