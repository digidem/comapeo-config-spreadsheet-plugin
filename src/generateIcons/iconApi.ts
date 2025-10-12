/**
 * Cache keys and TTL for icon searches
 */
const ICON_SEARCH_CACHE_PREFIX = "icon_search_";
const ICON_GENERATE_CACHE_PREFIX = "icon_generate_";
const ICON_CACHE_TTL = 21600; // 6 hours (max for CacheService)

function fetchSearchData(param: string): any[] | null {
  // Try to get from cache first
  const cache = CacheService.getScriptCache();
  const cacheKey = `${ICON_SEARCH_CACHE_PREFIX}${param}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    console.log(`[ICON-API] Using cached search data for ${param}`);
    try {
      return JSON.parse(cachedData);
    } catch (parseError) {
      console.warn(`[ICON-API] Failed to parse cached search data for ${param}, fetching fresh data`);
      // Continue to fetch fresh data
    }
  }

  console.log(`[ICON-API] Fetching fresh search data for ${param}`);
  const searchUrl = `https://icons.earthdefenderstoolkit.com/api/search?s=${encodeURIComponent(param)}&l=en`;
  const searchOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: "get",
    muteHttpExceptions: true,
  };

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s, 4s
        const waitTime = 1000 * Math.pow(2, attempt - 1);
        console.log(`[ICON-API] Retrying fetchSearchData for ${param} (attempt ${attempt}/${maxRetries}) after ${waitTime}ms`);
        Utilities.sleep(waitTime);
      }

      const searchResponse = UrlFetchApp.fetch(searchUrl, searchOptions);
      const responseCode = searchResponse.getResponseCode();

      // Check for successful response codes (200-299)
      if (responseCode >= 200 && responseCode < 300) {
        const searchData = JSON.parse(searchResponse.getContentText());

        // Cache the successful result
        try {
          cache.put(cacheKey, JSON.stringify(searchData), ICON_CACHE_TTL);
          console.log(`[ICON-API] Cached search data for ${param} (6 hours)`);
        } catch (cacheError) {
          console.warn(`[ICON-API] Failed to cache search data for ${param}:`, cacheError);
          // Continue even if caching fails
        }

        return searchData;
      }

      // Log non-success status codes for retry
      console.warn(`[ICON-API] API returned status ${responseCode} for ${param}`);
      lastError = new Error(`API returned status ${responseCode}`);

      // Don't retry on 404 (not found) or 4xx client errors
      if (responseCode === 404 || (responseCode >= 400 && responseCode < 500)) {
        console.warn(`[ICON-API] Client error ${responseCode}, not retrying for ${param}`);
        return null;
      }
    } catch (error) {
      lastError = error;
      console.warn(`[ICON-API] Attempt ${attempt + 1}/${maxRetries + 1} failed for ${param}:`, error.message);
    }
  }

  console.warn(`[ICON-API] Failed to fetch icon data for ${param} after ${maxRetries + 1} attempts:`, lastError?.message);
  return null;
}

function getGenerateData(pngUrl: string, color: string): any[] | null {
  // Try to get from cache first
  const cache = CacheService.getScriptCache();
  const colorHex = color.split("#")[1];
  const cacheKey = `${ICON_GENERATE_CACHE_PREFIX}${pngUrl}_${colorHex}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    console.log(`[ICON-API] Using cached generate data for ${pngUrl} (color: ${colorHex})`);
    try {
      return JSON.parse(cachedData);
    } catch (parseError) {
      console.warn(`[ICON-API] Failed to parse cached generate data, fetching fresh data`);
      // Continue to fetch fresh data
    }
  }

  console.log(`[ICON-API] Fetching fresh generate data for ${pngUrl} (color: ${colorHex})`);
  const generateUrl = `https://icons.earthdefenderstoolkit.com/api/generate?image=${encodeURIComponent(pngUrl)}&color=${encodeURIComponent(colorHex)}`;
  const generateOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: "get",
    muteHttpExceptions: true,
  };

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s, 4s
        const waitTime = 1000 * Math.pow(2, attempt - 1);
        console.log(`[ICON-API] Retrying getGenerateData (attempt ${attempt}/${maxRetries}) after ${waitTime}ms`);
        Utilities.sleep(waitTime);
      }

      const generateResponse = UrlFetchApp.fetch(generateUrl, generateOptions);
      const responseCode = generateResponse.getResponseCode();

      // Check for successful response codes (200-299)
      if (responseCode >= 200 && responseCode < 300) {
        const generateData = JSON.parse(generateResponse.getContentText());
        if (
          Array.isArray(generateData) &&
          generateData.length > 0 &&
          generateData[0].svg
        ) {
          // Cache the successful result
          try {
            cache.put(cacheKey, JSON.stringify(generateData), ICON_CACHE_TTL);
            console.log(`[ICON-API] Cached generate data for ${pngUrl} (color: ${colorHex}) (6 hours)`);
          } catch (cacheError) {
            console.warn(`[ICON-API] Failed to cache generate data:`, cacheError);
            // Continue even if caching fails
          }

          return generateData;
        }
        // If response is 2xx but data is invalid, log and retry
        console.warn(`[ICON-API] Valid response but invalid data format for icon generation`);
        lastError = new Error('Invalid data format in response');
      } else {
        // Log non-success status codes for retry
        console.warn(`[ICON-API] API returned status ${responseCode} for icon generation`);
        lastError = new Error(`API returned status ${responseCode}`);

        // Don't retry on 404 (not found) or 4xx client errors
        if (responseCode === 404 || (responseCode >= 400 && responseCode < 500)) {
          console.warn(`[ICON-API] Client error ${responseCode}, not retrying icon generation`);
          return null;
        }
      }
    } catch (error) {
      lastError = error;
      console.warn(`[ICON-API] Attempt ${attempt + 1}/${maxRetries + 1} failed for icon generation:`, error.message);
    }
  }

  console.warn(`[ICON-API] Failed to generate icon after ${maxRetries + 1} attempts:`, lastError?.message);
  return null;
}
