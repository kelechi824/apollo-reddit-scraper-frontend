# localStorage Quota Management Fix

## Problem
The BrandKitPage was throwing `QuotaExceededError` in production when users filled out large text fields (especially writing samples, brand descriptions, etc.). This happened because:

1. localStorage has size limits (typically 5-10MB per origin)
2. Production users tend to input more comprehensive data than in development
3. The JSON.stringify() data exceeded browser storage quotas

## Solution
Implemented comprehensive localStorage quota management with the following features:

### 1. Quota Checking (`checkLocalStorageQuota`)
- Calculates current localStorage usage
- Estimates total size after adding new data
- Uses conservative 4MB limit to prevent quota errors
- Returns detailed size information for debugging

### 2. Data Compression (`compressTextData`)
- Trims whitespace from all string fields
- Recursively processes nested objects and arrays
- Reduces storage size without losing data integrity

### 3. Safe Storage Operations (`safeSetLocalStorage`)
- Checks quota before attempting to save
- Provides consistent error handling
- Returns detailed success/error information

### 4. Storage Usage Monitoring (`getStorageUsage`)
- Real-time storage consumption tracking
- Visual progress bar with color-coded warnings
- User-friendly KB/percentage display

### 5. Graceful Error Handling
- Auto-save disables when quota exceeded
- Clear user feedback with actionable messages
- Fallback strategies for storage failures

## Implementation Details

### BrandKitPage Changes
- Added storage usage indicator with progress bar
- Implemented quota-aware auto-save with debouncing
- Enhanced manual save with compression and validation
- User feedback for storage issues

### Utility Functions (`utils/localStorage.ts`)
- Reusable localStorage management functions
- Centralized quota checking and error handling
- Can be used across other components with similar needs

## Usage Example
```typescript
import { safeSetLocalStorage, getStorageUsage } from '../utils/localStorage';

// Safe storage with quota checking
const result = safeSetLocalStorage('my_key', JSON.stringify(data));
if (!result.success) {
  console.error('Save failed:', result.error);
}

// Monitor storage usage
const usage = getStorageUsage();
console.log(`Using ${usage.used}KB of ${usage.total}KB (${usage.percentage}%)`);
```

## Benefits
1. **Prevents crashes**: No more QuotaExceededError in production
2. **User awareness**: Visual feedback about storage consumption
3. **Data preservation**: Compression reduces storage needs without data loss
4. **Graceful degradation**: Auto-save disables when needed, manual save still works
5. **Reusable**: Utility functions can be used in other components

## Testing
- Test with large text inputs (>1MB writing samples)
- Verify storage usage indicator updates correctly
- Confirm graceful handling when quota exceeded
- Check that compressed data loads correctly
