/**
 * Version information for the compiled script
 * This file is automatically updated before each build
 */

const versionData = {
  "version": "1.0.0+6262150",
  "commit": "6262150",
  "branch": "import-category",
  "isDirty": true,
  "buildDate": "2025-10-09T01:14:38.363Z"
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
