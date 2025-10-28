/**
 * Version information for the compiled script
 * This file is automatically updated before each build
 */

const versionData = {
  "version": "1.0.0+5680f69",
  "commit": "5680f69",
  "branch": "import-category",
  "isDirty": true,
  "buildDate": "2025-10-28T17:29:09.679Z"
};

/**
 * Gets the version info string
 * @returns Version string with commit and branch info
 */
function getVersionInfo(): string {
  const dirty = versionData.isDirty ? ' (dirty)' : '';
  return `${versionData.version}${dirty} (${versionData.commit} on ${versionData.branch})`;
}

/**
 * Gets the full version info with build date
 * @returns Full version string with build timestamp
 */
function getFullVersionInfo(): string {
  return `Compiled using ${versionData.version} at ${versionData.buildDate}`;
}

/**
 * Global version constants
 * These are available throughout the Apps Script project
 */
const VERSION = versionData.version;
const COMMIT = versionData.commit;
const BRANCH = versionData.branch;
