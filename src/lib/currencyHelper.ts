/**
 * Detect user's currency based on their location
 */

const CURRENCY_BY_COUNTRY: Record<string, string> = {
  US: 'USD',
  GB: 'GBP',
  EU: 'EUR',
  IN: 'INR',
  CA: 'CAD',
  AU: 'AUD',
  JP: 'JPY',
  CN: 'CNY',
  BR: 'BRL',
  MX: 'MXN',
  ZA: 'ZAR',
  NG: 'NGN',
  KE: 'KES',
  GH: 'GHS',
  UG: 'UGX',
  TZ: 'TZS',
  RW: 'RWF',
  ET: 'ETB',
  EG: 'EGP',
  MA: 'MAD'
};

/**
 * Detect currency from browser/system
 * Returns a promise that resolves to the currency code
 */
export async function detectCurrency(): Promise<string> {
  try {
    // Try to get currency from Intl API
    const locale = navigator.language || 'en-US';
    const regionCode = locale.split('-')[1] || locale.toUpperCase();

    // Check if we have a mapping for this region
    if (CURRENCY_BY_COUNTRY[regionCode]) {
      return CURRENCY_BY_COUNTRY[regionCode];
    }

    // Try to use Intl.NumberFormat to detect currency
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
    });

    const resolvedOptions = formatter.resolvedOptions();
    if (resolvedOptions.currency) {
      return resolvedOptions.currency;
    }

    // Try geolocation API as fallback
    const currency = await detectCurrencyFromGeolocation();
    if (currency) {
      return currency;
    }

    // Default fallback
    return 'USD';
  } catch (error) {
    console.error('Error detecting currency:', error);
    return 'USD';
  }
}

/**
 * Detect currency from geolocation (if available)
 */
async function detectCurrencyFromGeolocation(): Promise<string | null> {
  try {
    // Try to get approximate location from timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Map common timezones to currencies
    const timezoneMap: Record<string, string> = {
      'America/New_York': 'USD',
      'America/Chicago': 'USD',
      'America/Denver': 'USD',
      'America/Los_Angeles': 'USD',
      'Europe/London': 'GBP',
      'Europe/Paris': 'EUR',
      'Europe/Berlin': 'EUR',
      'Asia/Kolkata': 'INR',
      'Asia/Tokyo': 'JPY',
      'Asia/Shanghai': 'CNY',
      'Australia/Sydney': 'AUD',
      'Africa/Lagos': 'NGN',
      'Africa/Nairobi': 'KES',
      'Africa/Johannesburg': 'ZAR',
      'Africa/Cairo': 'EGP',
      'Africa/Casablanca': 'MAD'
    };

    if (timezone && timezoneMap[timezone]) {
      return timezoneMap[timezone];
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    GBP: '£',
    EUR: '€',
    INR: '₹',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    CNY: '¥',
    BRL: 'R$',
    MXN: '$',
    ZAR: 'R',
    NGN: '₦',
    KES: 'KSh',
    GHS: '₵',
    UGX: 'USh',
    TZS: 'TSh',
    RWF: 'RF',
    ETB: 'Br',
    EGP: 'E£',
    MAD: 'DH'
  };

  return symbols[currencyCode] || currencyCode;
}
