/**
 * Configuration constants for the CoMapeo Config Spreadsheet Plugin
 *
 * IMPORTANT: Update these values for your deployment
 */

/**
 * CoMapeo Config API base URL
 *
 * This is the endpoint where the plugin will send build requests.
 * Update this to point to your CoMapeo Config API server.
 *
 * Examples:
 * - Local development: "http://localhost:3000"
 * - Production: "http://your-server.com:3000"
 *
 * Note: HTTP is acceptable for trusted networks. Use HTTPS for public deployments.
 */
export const API_BASE_URL = "http://137.184.153.36:3000";

/**
 * API retry configuration
 */
export const RETRY_CONFIG = {
  /** Maximum number of retry attempts for API requests */
  MAX_RETRIES: 3,
  /** Base delay in milliseconds between retries (uses exponential backoff) */
  BASE_DELAY_MS: 1000,
  /** Maximum total timeout for all retry attempts in milliseconds (2 minutes) */
  MAX_TOTAL_TIMEOUT_MS: 120000
};

/**
 * Plugin identification
 */
export const PLUGIN_INFO = {
  NAME: "comapeo-config-spreadsheet-plugin",
  VERSION: "2.0.0"
};
