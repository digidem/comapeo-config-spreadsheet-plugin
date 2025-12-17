/**
 * Centralized error collection system for icon processing
 *
 * Provides structured error tracking across the icon generation and import pipeline.
 * Errors are categorized by type and include actionable messages for users.
 */

/**
 * Types of errors that can occur during icon processing
 */
type IconErrorType =
  | "format"       // Invalid SVG format or structure
  | "permission"   // Drive access or permission issues
  | "api"          // External API failures
  | "drive"        // Drive file access or storage issues
  | "validation"   // SVG content validation failures
  | "network"      // Network connectivity issues
  | "timeout"      // Operation timeout
  | "unknown";     // Unclassified errors

/**
 * Structured error information for a single icon
 */
interface IconError {
  /** Name or identifier of the icon that failed */
  iconName: string;

  /** Category of the error */
  errorType: IconErrorType;

  /** Technical error message (for logging) */
  message: string;

  /** User-friendly explanation of what went wrong */
  userMessage: string;

  /** Actionable suggestion for how to fix the issue */
  suggestedAction: string;

  /** Whether a fallback icon was used */
  usedFallback: boolean;

  /** Optional context information (file ID, URL, etc.) */
  context?: Record<string, any>;
}

/**
 * Summary statistics for icon processing errors
 */
interface IconErrorSummary {
  /** Total number of icons processed */
  totalProcessed: number;

  /** Number of icons that succeeded */
  successCount: number;

  /** Number of icons that failed */
  errorCount: number;

  /** Number of icons using fallback */
  fallbackCount: number;

  /** Errors grouped by type */
  errorsByType: Map<IconErrorType, IconError[]>;

  /** All errors in order encountered */
  allErrors: IconError[];

  /** Whether any critical errors occurred */
  hasCriticalErrors: boolean;
}

/**
 * Collector class for aggregating icon processing errors
 */
class IconErrorCollector {
  private errors: IconError[] = [];
  private totalProcessed = 0;
  private successCount = 0;

  /**
   * Record a successful icon processing
   */
  recordSuccess(iconName: string): void {
    this.totalProcessed++;
    this.successCount++;
    console.log(`✓ Icon processed successfully: ${iconName}`);
  }

  /**
   * Record an error during icon processing
   */
  recordError(error: IconError): void {
    this.totalProcessed++;
    this.errors.push(error);

    const fallbackNote = error.usedFallback ? " (fallback used)" : "";
    console.warn(`✗ Icon error: ${error.iconName} - ${error.errorType}${fallbackNote}`);
    console.warn(`  Message: ${error.message}`);

    if (error.context) {
      console.warn(`  Context:`, error.context);
    }
  }

  /**
   * Create and record a format error
   */
  addFormatError(
    iconName: string,
    message: string,
    usedFallback = false,
    context?: Record<string, any>
  ): void {
    this.recordError({
      iconName,
      errorType: "format",
      message,
      userMessage: "Invalid SVG format",
      suggestedAction: "Check that the cell contains valid SVG code with proper XML structure",
      usedFallback,
      context,
    });
  }

  /**
   * Create and record a permission error
   */
  addPermissionError(
    iconName: string,
    message: string,
    usedFallback = false,
    context?: Record<string, any>
  ): void {
    this.recordError({
      iconName,
      errorType: "permission",
      message,
      userMessage: "Drive file not accessible",
      suggestedAction: "Verify the file exists and you have permission to access it",
      usedFallback,
      context,
    });
  }

  /**
   * Create and record an API error
   */
  addApiError(
    iconName: string,
    message: string,
    usedFallback = false,
    context?: Record<string, any>
  ): void {
    this.recordError({
      iconName,
      errorType: "api",
      message,
      userMessage: "Icon API request failed",
      suggestedAction: "Check internet connection and try again. If the issue persists, the API may be unavailable.",
      usedFallback,
      context,
    });
  }

  /**
   * Create and record a Drive error
   */
  addDriveError(
    iconName: string,
    message: string,
    usedFallback = false,
    context?: Record<string, any>
  ): void {
    this.recordError({
      iconName,
      errorType: "drive",
      message,
      userMessage: "Google Drive operation failed",
      suggestedAction: "Check Drive permissions and available storage space",
      usedFallback,
      context,
    });
  }

  /**
   * Create and record a validation error
   */
  addValidationError(
    iconName: string,
    message: string,
    usedFallback = false,
    context?: Record<string, any>
  ): void {
    this.recordError({
      iconName,
      errorType: "validation",
      message,
      userMessage: "SVG content validation failed",
      suggestedAction: "Ensure the SVG has proper namespace and valid structure",
      usedFallback,
      context,
    });
  }

  /**
   * Create and record a network error
   */
  addNetworkError(
    iconName: string,
    message: string,
    usedFallback = false,
    context?: Record<string, any>
  ): void {
    this.recordError({
      iconName,
      errorType: "network",
      message,
      userMessage: "Network request failed",
      suggestedAction: "Check your internet connection and try again",
      usedFallback,
      context,
    });
  }

  /**
   * Create and record a timeout error
   */
  addTimeoutError(
    iconName: string,
    message: string,
    usedFallback = false,
    context?: Record<string, any>
  ): void {
    this.recordError({
      iconName,
      errorType: "timeout",
      message,
      userMessage: "Operation timed out",
      suggestedAction: "The operation took too long. Try again or simplify the icon.",
      usedFallback,
      context,
    });
  }

  /**
   * Create and record an unknown/unclassified error
   */
  addUnknownError(
    iconName: string,
    message: string,
    usedFallback = false,
    context?: Record<string, any>
  ): void {
    this.recordError({
      iconName,
      errorType: "unknown",
      message,
      userMessage: "An unexpected error occurred",
      suggestedAction: "Please report this issue with the error details",
      usedFallback,
      context,
    });
  }

  /**
   * Check if any errors have been recorded
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Get the count of errors
   */
  getErrorCount(): number {
    return this.errors.length;
  }

  /**
   * Get the count of successful operations
   */
  getSuccessCount(): number {
    return this.successCount;
  }

  /**
   * Get all recorded errors
   */
  getAllErrors(): IconError[] {
    return [...this.errors];
  }

  /**
   * Get errors grouped by type
   */
  getErrorsByType(): Map<IconErrorType, IconError[]> {
    const grouped = new Map<IconErrorType, IconError[]>();

    for (const error of this.errors) {
      const existing = grouped.get(error.errorType) || [];
      existing.push(error);
      grouped.set(error.errorType, existing);
    }

    return grouped;
  }

  /**
   * Get count of icons that used fallback
   */
  getFallbackCount(): number {
    return this.errors.filter(e => e.usedFallback).length;
  }

  /**
   * Get comprehensive error summary
   */
  getSummary(): IconErrorSummary {
    const errorsByType = this.getErrorsByType();

    // Critical errors are permission, drive, and validation errors
    const criticalTypes: IconErrorType[] = ["permission", "drive", "validation"];
    const hasCriticalErrors = this.errors.some(e => criticalTypes.includes(e.errorType));

    return {
      totalProcessed: this.totalProcessed,
      successCount: this.successCount,
      errorCount: this.errors.length,
      fallbackCount: this.getFallbackCount(),
      errorsByType,
      allErrors: this.getAllErrors(),
      hasCriticalErrors,
    };
  }

  /**
   * Generate a user-friendly summary message
   */
  getSummaryMessage(): string {
    const summary = this.getSummary();

    if (summary.errorCount === 0) {
      return `✅ All ${summary.totalProcessed} icons processed successfully`;
    }

    const lines: string[] = [];
    lines.push(`Processed ${summary.totalProcessed} icon(s):`);
    lines.push(`  ✅ ${summary.successCount} successful`);
    lines.push(`  ⚠️  ${summary.errorCount} with issues`);

    if (summary.fallbackCount > 0) {
      lines.push(`  🔄 ${summary.fallbackCount} using fallback icon`);
    }

    // Group errors by type
    const errorsByType = summary.errorsByType;
    if (errorsByType.size > 0) {
      lines.push("\nIssues by type:");
      for (const [type, errors] of errorsByType) {
        lines.push(`  • ${type}: ${errors.length}`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Clear all recorded errors and reset counters
   */
  clear(): void {
    this.errors = [];
    this.totalProcessed = 0;
    this.successCount = 0;
  }

  /**
   * Export errors as CSV format for download
   */
  toCSV(): string {
    const headers = [
      "Icon Name",
      "Error Type",
      "User Message",
      "Technical Message",
      "Suggested Action",
      "Used Fallback"
    ];

    const rows = this.errors.map(error => [
      error.iconName,
      error.errorType,
      error.userMessage,
      error.message,
      error.suggestedAction,
      error.usedFallback ? "Yes" : "No"
    ]);

    // Escape CSV values
    const escape = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvLines = [
      headers.map(escape).join(","),
      ...rows.map(row => row.map(escape).join(","))
    ];

    return csvLines.join("\n");
  }
}

/**
 * Create a new error collector instance
 */
function createIconErrorCollector(): IconErrorCollector {
  return new IconErrorCollector();
}
