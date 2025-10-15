export const LANGUAGES = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  mr: { name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' }
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

export const COUNTRY_LANGUAGES: Record<string, LanguageCode[]> = {
  IN: ['hi', 'kn', 'ta', 'te', 'mr', 'bn', 'gu', 'ml', 'pa', 'en'],
  US: ['en'],
  GB: ['en'],
  CA: ['en'],
  AU: ['en'],
  NZ: ['en']
};

export const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Auth
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.phone': 'Phone Number',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.fullName': 'Full Name',
    'auth.loginButton': 'Login',
    'auth.signupButton': 'Create Account',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    'auth.selectLanguage': 'Select Language',

    // Navigation
    'nav.home': 'Home',
    'nav.calendar': 'Calendar',
    'nav.search': 'Search',
    'nav.messages': 'Messages',

    // Home
    'home.welcome': 'Welcome',
    'home.employees': 'Employees',
    'home.scanQR': 'Scan QR',
    'home.myQR': 'My QR Code',
    'home.refer': 'Refer Friend',
    'home.profile': 'Profile',
    'home.logout': 'Logout',

    // Profile
    'profile.edit': 'Edit Profile',
    'profile.save': 'Save Changes',
    'profile.cancel': 'Cancel',
    'profile.profession': 'Profession',
    'profile.selectProfession': 'Select Profession',
    'profile.uploadPhoto': 'Upload Photo',
    'profile.currency': 'Currency',
    'profile.language': 'Language',

    // Employees
    'employees.title': 'Manage Employees',
    'employees.wages': 'Wages',
    'employees.performance': 'Performance',
    'employees.attendance': 'Attendance',
    'employees.loans': 'Loans',
    'employees.bonuses': 'Bonuses',

    // Wages
    'wages.title': 'Employee Wages',
    'wages.daily': 'Daily Wage',
    'wages.paymentDate': 'Payment Date',
    'wages.save': 'Save Wage',
    'wages.viewStatement': 'View Statement',

    // Statement
    'statement.title': 'Wage Statement',
    'statement.employee': 'Employee',
    'statement.employer': 'Employer',
    'statement.period': 'Period',
    'statement.dailyWage': 'Daily Wage',
    'statement.daysWorked': 'Days Worked',
    'statement.totalWages': 'Total Wages',
    'statement.loans': 'Loans',
    'statement.bonuses': 'Bonuses',
    'statement.netAmount': 'Net Amount',
    'statement.date': 'Date',
    'statement.download': 'Download',
    'statement.close': 'Close',

    // Loans
    'loans.title': 'Employee Loans',
    'loans.amount': 'Amount',
    'loans.remaining': 'Remaining',
    'loans.grant': 'Grant Loan',
    'loans.deduct': 'Deduct',
    'loans.foreclose': 'Foreclose',

    // Bonuses
    'bonuses.title': 'Employee Bonuses',
    'bonuses.amount': 'Amount',
    'bonuses.comment': 'Comment',
    'bonuses.give': 'Give Bonus',

    // Search
    'search.title': 'Search',
    'search.placeholder': 'Search by name, phone, or profession',
    'search.noResults': 'No results found',

    // Messages
    'messages.title': 'Messages',
    'messages.noMessages': 'No messages yet',

    // Calendar
    'calendar.title': 'Calendar',
    'calendar.today': 'Today',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.close': 'Close',
    'common.back': 'Back'
  },

  hi: {
    // Auth
    'auth.login': 'लॉगिन',
    'auth.signup': 'साइन अप',
    'auth.email': 'ईमेल',
    'auth.phone': 'फोन नंबर',
    'auth.password': 'पासवर्ड',
    'auth.confirmPassword': 'पासवर्ड की पुष्टि करें',
    'auth.fullName': 'पूरा नाम',
    'auth.loginButton': 'लॉगिन करें',
    'auth.signupButton': 'खाता बनाएं',
    'auth.noAccount': 'खाता नहीं है?',
    'auth.haveAccount': 'पहले से खाता है?',
    'auth.selectLanguage': 'भाषा चुनें',

    // Navigation
    'nav.home': 'होम',
    'nav.calendar': 'कैलेंडर',
    'nav.search': 'खोज',
    'nav.messages': 'संदेश',

    // Home
    'home.welcome': 'स्वागत है',
    'home.employees': 'कर्मचारी',
    'home.scanQR': 'QR स्कैन करें',
    'home.myQR': 'मेरा QR कोड',
    'home.refer': 'दोस्त को रेफर करें',
    'home.profile': 'प्रोफाइल',
    'home.logout': 'लॉगआउट',

    // Profile
    'profile.edit': 'प्रोफाइल संपादित करें',
    'profile.save': 'परिवर्तन सहेजें',
    'profile.cancel': 'रद्द करें',
    'profile.profession': 'पेशा',
    'profile.selectProfession': 'पेशा चुनें',
    'profile.uploadPhoto': 'फोटो अपलोड करें',
    'profile.currency': 'मुद्रा',
    'profile.language': 'भाषा',

    // Employees
    'employees.title': 'कर्मचारियों का प्रबंधन',
    'employees.wages': 'वेतन',
    'employees.performance': 'प्रदर्शन',
    'employees.attendance': 'उपस्थिति',
    'employees.loans': 'ऋण',
    'employees.bonuses': 'बोनस',

    // Wages
    'wages.title': 'कर्मचारी वेतन',
    'wages.daily': 'दैनिक वेतन',
    'wages.paymentDate': 'भुगतान तिथि',
    'wages.save': 'वेतन सहेजें',
    'wages.viewStatement': 'विवरण देखें',

    // Statement
    'statement.title': 'वेतन विवरण',
    'statement.employee': 'कर्मचारी',
    'statement.employer': 'नियोक्ता',
    'statement.period': 'अवधि',
    'statement.dailyWage': 'दैनिक वेतन',
    'statement.daysWorked': 'काम के दिन',
    'statement.totalWages': 'कुल वेतन',
    'statement.loans': 'ऋण',
    'statement.bonuses': 'बोनस',
    'statement.netAmount': 'शुद्ध राशि',
    'statement.date': 'तिथि',
    'statement.download': 'डाउनलोड करें',
    'statement.close': 'बंद करें',

    // Loans
    'loans.title': 'कर्मचारी ऋण',
    'loans.amount': 'राशि',
    'loans.remaining': 'शेष',
    'loans.grant': 'ऋण दें',
    'loans.deduct': 'कटौती करें',
    'loans.foreclose': 'बंद करें',

    // Bonuses
    'bonuses.title': 'कर्मचारी बोनस',
    'bonuses.amount': 'राशि',
    'bonuses.comment': 'टिप्पणी',
    'bonuses.give': 'बोनस दें',

    // Search
    'search.title': 'खोज',
    'search.placeholder': 'नाम, फोन या पेशे से खोजें',
    'search.noResults': 'कोई परिणाम नहीं मिला',

    // Messages
    'messages.title': 'संदेश',
    'messages.noMessages': 'अभी तक कोई संदेश नहीं',

    // Calendar
    'calendar.title': 'कैलेंडर',
    'calendar.today': 'आज',

    // Common
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.confirm': 'पुष्टि करें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.view': 'देखें',
    'common.close': 'बंद करें',
    'common.back': 'वापस'
  },

  kn: {
    // Auth
    'auth.login': 'ಲಾಗಿನ್',
    'auth.signup': 'ಸೈನ್ ಅಪ್',
    'auth.email': 'ಇಮೇಲ್',
    'auth.phone': 'ಫೋನ್ ಸಂಖ್ಯೆ',
    'auth.password': 'ಪಾಸ್‌ವರ್ಡ್',
    'auth.confirmPassword': 'ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ',
    'auth.fullName': 'ಪೂರ್ಣ ಹೆಸರು',
    'auth.loginButton': 'ಲಾಗಿನ್ ಮಾಡಿ',
    'auth.signupButton': 'ಖಾತೆ ರಚಿಸಿ',
    'auth.noAccount': 'ಖಾತೆ ಇಲ್ಲವೇ?',
    'auth.haveAccount': 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?',
    'auth.selectLanguage': 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ',

    // Navigation
    'nav.home': 'ಮುಖಪುಟ',
    'nav.calendar': 'ಕ್ಯಾಲೆಂಡರ್',
    'nav.search': 'ಹುಡುಕಿ',
    'nav.messages': 'ಸಂದೇಶಗಳು',

    // Home
    'home.welcome': 'ಸ್ವಾಗತ',
    'home.employees': 'ಉದ್ಯೋಗಿಗಳು',
    'home.scanQR': 'QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    'home.myQR': 'ನನ್ನ QR ಕೋಡ್',
    'home.refer': 'ಸ್ನೇಹಿತರನ್ನು ರೆಫರ್ ಮಾಡಿ',
    'home.profile': 'ಪ್ರೊಫೈಲ್',
    'home.logout': 'ಲಾಗ್ಔಟ್',

    // Profile
    'profile.edit': 'ಪ್ರೊಫೈಲ್ ಎಡಿಟ್ ಮಾಡಿ',
    'profile.save': 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
    'profile.cancel': 'ರದ್ದುಮಾಡಿ',
    'profile.profession': 'ವೃತ್ತಿ',
    'profile.selectProfession': 'ವೃತ್ತಿ ಆಯ್ಕೆಮಾಡಿ',
    'profile.uploadPhoto': 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    'profile.currency': 'ಕರೆನ್ಸಿ',
    'profile.language': 'ಭಾಷೆ',

    // Employees
    'employees.title': 'ಉದ್ಯೋಗಿಗಳ ನಿರ್ವಹಣೆ',
    'employees.wages': 'ವೇತನ',
    'employees.performance': 'ಕಾರ್ಯನಿರ್ವಹಣೆ',
    'employees.attendance': 'ಹಾಜರಾತಿ',
    'employees.loans': 'ಸಾಲಗಳು',
    'employees.bonuses': 'ಬೋನಸ್',

    // Wages
    'wages.title': 'ಉದ್ಯೋಗಿ ವೇತನ',
    'wages.daily': 'ದೈನಂದಿನ ವೇತನ',
    'wages.paymentDate': 'ಪಾವತಿ ದಿನಾಂಕ',
    'wages.save': 'ವೇತನ ಉಳಿಸಿ',
    'wages.viewStatement': 'ಹೇಳಿಕೆ ನೋಡಿ',

    // Statement
    'statement.title': 'ವೇತನ ಹೇಳಿಕೆ',
    'statement.employee': 'ಉದ್ಯೋಗಿ',
    'statement.employer': 'ಉದ್ಯೋಗದಾತ',
    'statement.period': 'ಅವಧಿ',
    'statement.dailyWage': 'ದೈನಂದಿನ ವೇತನ',
    'statement.daysWorked': 'ಕೆಲಸ ಮಾಡಿದ ದಿನಗಳು',
    'statement.totalWages': 'ಒಟ್ಟು ವೇತನ',
    'statement.loans': 'ಸಾಲಗಳು',
    'statement.bonuses': 'ಬೋನಸ್',
    'statement.netAmount': 'ನಿವ್ವಳ ಮೊತ್ತ',
    'statement.date': 'ದಿನಾಂಕ',
    'statement.download': 'ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
    'statement.close': 'ಮುಚ್ಚಿ',

    // Loans
    'loans.title': 'ಉದ್ಯೋಗಿ ಸಾಲಗಳು',
    'loans.amount': 'ಮೊತ್ತ',
    'loans.remaining': 'ಉಳಿದಿದೆ',
    'loans.grant': 'ಸಾಲ ನೀಡಿ',
    'loans.deduct': 'ಕಡಿತ ಮಾಡಿ',
    'loans.foreclose': 'ಮುಚ್ಚಿ',

    // Bonuses
    'bonuses.title': 'ಉದ್ಯೋಗಿ ಬೋನಸ್',
    'bonuses.amount': 'ಮೊತ್ತ',
    'bonuses.comment': 'ಟಿಪ್ಪಣಿ',
    'bonuses.give': 'ಬೋನಸ್ ನೀಡಿ',

    // Search
    'search.title': 'ಹುಡುಕಿ',
    'search.placeholder': 'ಹೆಸರು, ಫೋನ್ ಅಥವಾ ವೃತ್ತಿಯಿಂದ ಹುಡುಕಿ',
    'search.noResults': 'ಯಾವುದೇ ಫಲಿತಾಂಶಗಳು ಸಿಗಲಿಲ್ಲ',

    // Messages
    'messages.title': 'ಸಂದೇಶಗಳು',
    'messages.noMessages': 'ಇನ್ನೂ ಯಾವುದೇ ಸಂದೇಶಗಳಿಲ್ಲ',

    // Calendar
    'calendar.title': 'ಕ್ಯಾಲೆಂಡರ್',
    'calendar.today': 'ಇಂದು',

    // Common
    'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    'common.error': 'ದೋಷ',
    'common.success': 'ಯಶಸ್ಸು',
    'common.confirm': 'ದೃಢೀಕರಿಸಿ',
    'common.delete': 'ಅಳಿಸಿ',
    'common.edit': 'ಎಡಿಟ್ ಮಾಡಿ',
    'common.view': 'ನೋಡಿ',
    'common.close': 'ಮುಚ್ಚಿ',
    'common.back': 'ಹಿಂದೆ'
  },

  ta: {
    // Auth
    'auth.login': 'உள்நுழைவு',
    'auth.signup': 'பதிவு செய்க',
    'auth.email': 'மின்னஞ்சல்',
    'auth.phone': 'தொலைபேசி எண்',
    'auth.password': 'கடவுச்சொல்',
    'auth.confirmPassword': 'கடவுச்சொல்லை உறுதிப்படுத்தவும்',
    'auth.fullName': 'முழு பெயர்',
    'auth.loginButton': 'உள்நுழைக',
    'auth.signupButton': 'கணக்கை உருவாக்கவும்',
    'auth.noAccount': 'கணக்கு இல்லையா?',
    'auth.haveAccount': 'ஏற்கனவே கணக்கு உள்ளதா?',
    'auth.selectLanguage': 'மொழியைத் தேர்ந்தெடுக்கவும்',

    // Navigation
    'nav.home': 'முகப்பு',
    'nav.calendar': 'நாட்காட்டி',
    'nav.search': 'தேடல்',
    'nav.messages': 'செய்திகள்',

    // Home
    'home.welcome': 'வரவேற்பு',
    'home.employees': 'ஊழியர்கள்',
    'home.scanQR': 'QR ஸ்கேன் செய்க',
    'home.myQR': 'எனது QR குறியீடு',
    'home.refer': 'நண்பரை பரிந்துரைக்கவும்',
    'home.profile': 'சுயவிவரம்',
    'home.logout': 'வெளியேறு',

    // Profile
    'profile.edit': 'சுயவிவரத்தைத் திருத்து',
    'profile.save': 'மாற்றங்களைச் சேமி',
    'profile.cancel': 'ரத்துசெய்',
    'profile.profession': 'தொழில்',
    'profile.selectProfession': 'தொழிலைத் தேர்ந்தெடுக்கவும்',
    'profile.uploadPhoto': 'புகைப்படம் பதிவேற்று',
    'profile.currency': 'நாணயம்',
    'profile.language': 'மொழி',

    // Employees
    'employees.title': 'ஊழியர் மேலாண்மை',
    'employees.wages': 'ஊதியம்',
    'employees.performance': 'செயல்திறன்',
    'employees.attendance': 'வருகை',
    'employees.loans': 'கடன்கள்',
    'employees.bonuses': 'போனஸ்',

    // Wages
    'wages.title': 'ஊழியர் ஊதியம்',
    'wages.daily': 'தினசரி ஊதியம்',
    'wages.paymentDate': 'செலுத்தும் தேதி',
    'wages.save': 'ஊதியத்தைச் சேமி',
    'wages.viewStatement': 'அறிக்கையைக் காண்க',

    // Statement
    'statement.title': 'ஊதிய அறிக்கை',
    'statement.employee': 'ஊழியர்',
    'statement.employer': 'முதலாளி',
    'statement.period': 'காலம்',
    'statement.dailyWage': 'தினசரி ஊதியம்',
    'statement.daysWorked': 'வேலை செய்த நாட்கள்',
    'statement.totalWages': 'மொத்த ஊதியம்',
    'statement.loans': 'கடன்கள்',
    'statement.bonuses': 'போனஸ்',
    'statement.netAmount': 'நிகர தொகை',
    'statement.date': 'தேதி',
    'statement.download': 'பதிவிறக்கு',
    'statement.close': 'மூடு',

    // Loans
    'loans.title': 'ஊழியர் கடன்கள்',
    'loans.amount': 'தொகை',
    'loans.remaining': 'மீதமுள்ளது',
    'loans.grant': 'கடன் வழங்கு',
    'loans.deduct': 'கழித்தல்',
    'loans.foreclose': 'மூடு',

    // Bonuses
    'bonuses.title': 'ஊழியர் போனஸ்',
    'bonuses.amount': 'தொகை',
    'bonuses.comment': 'கருத்து',
    'bonuses.give': 'போனஸ் வழங்கு',

    // Search
    'search.title': 'தேடல்',
    'search.placeholder': 'பெயர், தொலைபேசி அல்லது தொழில் மூலம் தேடுங்கள்',
    'search.noResults': 'முடிவுகள் இல்லை',

    // Messages
    'messages.title': 'செய்திகள்',
    'messages.noMessages': 'இன்னும் செய்திகள் இல்லை',

    // Calendar
    'calendar.title': 'நாட்காட்டி',
    'calendar.today': 'இன்று',

    // Common
    'common.loading': 'ஏற்றுகிறது...',
    'common.error': 'பிழை',
    'common.success': 'வெற்றி',
    'common.confirm': 'உறுதிப்படுத்து',
    'common.delete': 'நீக்கு',
    'common.edit': 'திருத்து',
    'common.view': 'பார்',
    'common.close': 'மூடு',
    'common.back': 'பின்னால்'
  },

  te: {
    // Auth
    'auth.login': 'లాగిన్',
    'auth.signup': 'సైన్ అప్',
    'auth.email': 'ఇమెయిల్',
    'auth.phone': 'ఫోన్ నంబర్',
    'auth.password': 'పాస్‌వర్డ్',
    'auth.confirmPassword': 'పాస్‌వర్డ్ నిర్ధారించండి',
    'auth.fullName': 'పూర్తి పేరు',
    'auth.loginButton': 'లాగిన్ చేయండి',
    'auth.signupButton': 'ఖాతా సృష్టించండి',
    'auth.noAccount': 'ఖాతా లేదా?',
    'auth.haveAccount': 'ఇప్పటికే ఖాతా ఉందా?',
    'auth.selectLanguage': 'భాషను ఎంచుకోండి',

    // Navigation
    'nav.home': 'హోమ్',
    'nav.calendar': 'క్యాలెండర్',
    'nav.search': 'శోధన',
    'nav.messages': 'సందేశాలు',

    // Home
    'home.welcome': 'స్వాగతం',
    'home.employees': 'ఉద్యోగులు',
    'home.scanQR': 'QR స్కాన్ చేయండి',
    'home.myQR': 'నా QR కోడ్',
    'home.refer': 'స్నేహితుడిని సూచించండి',
    'home.profile': 'ప్రొఫైల్',
    'home.logout': 'లాగ్అవుట్',

    // Profile
    'profile.edit': 'ప్రొఫైల్ సవరించండి',
    'profile.save': 'మార్పులను సేవ్ చేయండి',
    'profile.cancel': 'రద్దు చేయండి',
    'profile.profession': 'వృత్తి',
    'profile.selectProfession': 'వృత్తిని ఎంచుకోండి',
    'profile.uploadPhoto': 'ఫోటో అప్‌లోడ్ చేయండి',
    'profile.currency': 'కరెన్సీ',
    'profile.language': 'భాష',

    // Employees
    'employees.title': 'ఉద్యోగుల నిర్వహణ',
    'employees.wages': 'వేతనాలు',
    'employees.performance': 'పనితీరు',
    'employees.attendance': 'హాజరు',
    'employees.loans': 'రుణాలు',
    'employees.bonuses': 'బోనస్‌లు',

    // Wages
    'wages.title': 'ఉద్యోగుల వేతనాలు',
    'wages.daily': 'రోజువారీ వేతనం',
    'wages.paymentDate': 'చెల్లింపు తేదీ',
    'wages.save': 'వేతనం సేవ్ చేయండి',
    'wages.viewStatement': 'స్టేట్‌మెంట్ చూడండి',

    // Statement
    'statement.title': 'వేతన స్టేట్‌మెంట్',
    'statement.employee': 'ఉద్యోగి',
    'statement.employer': 'యజమాని',
    'statement.period': 'కాలం',
    'statement.dailyWage': 'రోజువారీ వేతనం',
    'statement.daysWorked': 'పనిచేసిన రోజులు',
    'statement.totalWages': 'మొత్తం వేతనం',
    'statement.loans': 'రుణాలు',
    'statement.bonuses': 'బోనస్‌లు',
    'statement.netAmount': 'నికర మొత్తం',
    'statement.date': 'తేదీ',
    'statement.download': 'డౌన్‌లోడ్ చేయండి',
    'statement.close': 'మూసివేయండి',

    // Loans
    'loans.title': 'ఉద్యోగుల రుణాలు',
    'loans.amount': 'మొత్తం',
    'loans.remaining': 'మిగిలినది',
    'loans.grant': 'రుణం ఇవ్వండి',
    'loans.deduct': 'తీసివేయండి',
    'loans.foreclose': 'మూసివేయండి',

    // Bonuses
    'bonuses.title': 'ఉద్యోగుల బోనస్‌లు',
    'bonuses.amount': 'మొత్తం',
    'bonuses.comment': 'వ్యాఖ్య',
    'bonuses.give': 'బోనస్ ఇవ్వండి',

    // Search
    'search.title': 'శోధన',
    'search.placeholder': 'పేరు, ఫోన్ లేదా వృత్తి ద్వారా శోధించండి',
    'search.noResults': 'ఫలితాలు లేవు',

    // Messages
    'messages.title': 'సందేశాలు',
    'messages.noMessages': 'ఇంకా సందేశాలు లేవు',

    // Calendar
    'calendar.title': 'క్యాలెండర్',
    'calendar.today': 'ఈరోజు',

    // Common
    'common.loading': 'లోడ్ అవుతోంది...',
    'common.error': 'లోపం',
    'common.success': 'విజయం',
    'common.confirm': 'నిర్ధారించండి',
    'common.delete': 'తొలగించండి',
    'common.edit': 'సవరించండి',
    'common.view': 'చూడండి',
    'common.close': 'మూసివేయండి',
    'common.back': 'వెనక్కి'
  },

  mr: {
    // Auth
    'auth.login': 'लॉगिन',
    'auth.signup': 'साइन अप',
    'auth.email': 'ईमेल',
    'auth.phone': 'फोन नंबर',
    'auth.password': 'पासवर्ड',
    'auth.confirmPassword': 'पासवर्ड पुष्टी करा',
    'auth.fullName': 'पूर्ण नाव',
    'auth.loginButton': 'लॉगिन करा',
    'auth.signupButton': 'खाते तयार करा',
    'auth.noAccount': 'खाते नाही?',
    'auth.haveAccount': 'आधीच खाते आहे?',
    'auth.selectLanguage': 'भाषा निवडा',

    // Navigation
    'nav.home': 'मुख्यपृष्ठ',
    'nav.calendar': 'कॅलेंडर',
    'nav.search': 'शोध',
    'nav.messages': 'संदेश',

    // Home
    'home.welcome': 'स्वागत',
    'home.employees': 'कर्मचारी',
    'home.scanQR': 'QR स्कॅन करा',
    'home.myQR': 'माझा QR कोड',
    'home.refer': 'मित्राला रेफर करा',
    'home.profile': 'प्रोफाइल',
    'home.logout': 'लॉगआउट',

    // Profile
    'profile.edit': 'प्रोफाइल संपादित करा',
    'profile.save': 'बदल जतन करा',
    'profile.cancel': 'रद्द करा',
    'profile.profession': 'व्यवसाय',
    'profile.selectProfession': 'व्यवसाय निवडा',
    'profile.uploadPhoto': 'फोटो अपलोड करा',
    'profile.currency': 'चलन',
    'profile.language': 'भाषा',

    // Employees
    'employees.title': 'कर्मचारी व्यवस्थापन',
    'employees.wages': 'वेतन',
    'employees.performance': 'कामगिरी',
    'employees.attendance': 'उपस्थिती',
    'employees.loans': 'कर्ज',
    'employees.bonuses': 'बोनस',

    // Wages
    'wages.title': 'कर्मचारी वेतन',
    'wages.daily': 'दैनिक वेतन',
    'wages.paymentDate': 'देयक तारीख',
    'wages.save': 'वेतन जतन करा',
    'wages.viewStatement': 'विवरण पहा',

    // Statement
    'statement.title': 'वेतन विवरण',
    'statement.employee': 'कर्मचारी',
    'statement.employer': 'नियोक्ता',
    'statement.period': 'कालावधी',
    'statement.dailyWage': 'दैनिक वेतन',
    'statement.daysWorked': 'काम केलेले दिवस',
    'statement.totalWages': 'एकूण वेतन',
    'statement.loans': 'कर्ज',
    'statement.bonuses': 'बोनस',
    'statement.netAmount': 'निव्वळ रक्कम',
    'statement.date': 'तारीख',
    'statement.download': 'डाउनलोड करा',
    'statement.close': 'बंद करा',

    // Loans
    'loans.title': 'कर्मचारी कर्ज',
    'loans.amount': 'रक्कम',
    'loans.remaining': 'शिल्लक',
    'loans.grant': 'कर्ज द्या',
    'loans.deduct': 'वजा करा',
    'loans.foreclose': 'बंद करा',

    // Bonuses
    'bonuses.title': 'कर्मचारी बोनस',
    'bonuses.amount': 'रक्कम',
    'bonuses.comment': 'टिप्पणी',
    'bonuses.give': 'बोनस द्या',

    // Search
    'search.title': 'शोध',
    'search.placeholder': 'नाव, फोन किंवा व्यवसायाने शोधा',
    'search.noResults': 'कोणतेही परिणाम सापडले नाहीत',

    // Messages
    'messages.title': 'संदेश',
    'messages.noMessages': 'अद्याप कोणतेही संदेश नाहीत',

    // Calendar
    'calendar.title': 'कॅलेंडर',
    'calendar.today': 'आज',

    // Common
    'common.loading': 'लोड होत आहे...',
    'common.error': 'त्रुटी',
    'common.success': 'यश',
    'common.confirm': 'पुष्टी करा',
    'common.delete': 'हटवा',
    'common.edit': 'संपादित करा',
    'common.view': 'पहा',
    'common.close': 'बंद करा',
    'common.back': 'परत'
  },

  bn: {
    // Auth
    'auth.login': 'লগইন',
    'auth.signup': 'সাইন আপ',
    'auth.email': 'ইমেইল',
    'auth.phone': 'ফোন নম্বর',
    'auth.password': 'পাসওয়ার্ড',
    'auth.confirmPassword': 'পাসওয়ার্ড নিশ্চিত করুন',
    'auth.fullName': 'পূর্ণ নাম',
    'auth.loginButton': 'লগইন করুন',
    'auth.signupButton': 'অ্যাকাউন্ট তৈরি করুন',
    'auth.noAccount': 'অ্যাকাউন্ট নেই?',
    'auth.haveAccount': 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
    'auth.selectLanguage': 'ভাষা নির্বাচন করুন',

    // Navigation
    'nav.home': 'হোম',
    'nav.calendar': 'ক্যালেন্ডার',
    'nav.search': 'অনুসন্ধান',
    'nav.messages': 'বার্তা',

    // Home
    'home.welcome': 'স্বাগতম',
    'home.employees': 'কর্মচারী',
    'home.scanQR': 'QR স্ক্যান করুন',
    'home.myQR': 'আমার QR কোড',
    'home.refer': 'বন্ধুকে রেফার করুন',
    'home.profile': 'প্রোফাইল',
    'home.logout': 'লগআউট',

    // Profile
    'profile.edit': 'প্রোফাইল সম্পাদনা করুন',
    'profile.save': 'পরিবর্তন সংরক্ষণ করুন',
    'profile.cancel': 'বাতিল করুন',
    'profile.profession': 'পেশা',
    'profile.selectProfession': 'পেশা নির্বাচন করুন',
    'profile.uploadPhoto': 'ফটো আপলোড করুন',
    'profile.currency': 'মুদ্রা',
    'profile.language': 'ভাষা',

    // Employees
    'employees.title': 'কর্মচারী ব্যবস্থাপনা',
    'employees.wages': 'মজুরি',
    'employees.performance': 'কর্মক্ষমতা',
    'employees.attendance': 'উপস্থিতি',
    'employees.loans': 'ঋণ',
    'employees.bonuses': 'বোনাস',

    // Wages
    'wages.title': 'কর্মচারী মজুরি',
    'wages.daily': 'দৈনিক মজুরি',
    'wages.paymentDate': 'পেমেন্ট তারিখ',
    'wages.save': 'মজুরি সংরক্ষণ করুন',
    'wages.viewStatement': 'বিবৃতি দেখুন',

    // Statement
    'statement.title': 'মজুরি বিবৃতি',
    'statement.employee': 'কর্মচারী',
    'statement.employer': 'নিয়োগকর্তা',
    'statement.period': 'সময়কাল',
    'statement.dailyWage': 'দৈনিক মজুরি',
    'statement.daysWorked': 'কাজ করা দিন',
    'statement.totalWages': 'মোট মজুরি',
    'statement.loans': 'ঋণ',
    'statement.bonuses': 'বোনাস',
    'statement.netAmount': 'নিট পরিমাণ',
    'statement.date': 'তারিখ',
    'statement.download': 'ডাউনলোড করুন',
    'statement.close': 'বন্ধ করুন',

    // Loans
    'loans.title': 'কর্মচারী ঋণ',
    'loans.amount': 'পরিমাণ',
    'loans.remaining': 'অবশিষ্ট',
    'loans.grant': 'ঋণ প্রদান করুন',
    'loans.deduct': 'কাটুন',
    'loans.foreclose': 'বন্ধ করুন',

    // Bonuses
    'bonuses.title': 'কর্মচারী বোনাস',
    'bonuses.amount': 'পরিমাণ',
    'bonuses.comment': 'মন্তব্য',
    'bonuses.give': 'বোনাস দিন',

    // Search
    'search.title': 'অনুসন্ধান',
    'search.placeholder': 'নাম, ফোন বা পেশা দিয়ে অনুসন্ধান করুন',
    'search.noResults': 'কোন ফলাফল পাওয়া যায়নি',

    // Messages
    'messages.title': 'বার্তা',
    'messages.noMessages': 'এখনও কোন বার্তা নেই',

    // Calendar
    'calendar.title': 'ক্যালেন্ডার',
    'calendar.today': 'আজ',

    // Common
    'common.loading': 'লোড হচ্ছে...',
    'common.error': 'ত্রুটি',
    'common.success': 'সফলতা',
    'common.confirm': 'নিশ্চিত করুন',
    'common.delete': 'মুছুন',
    'common.edit': 'সম্পাদনা করুন',
    'common.view': 'দেখুন',
    'common.close': 'বন্ধ করুন',
    'common.back': 'পিছনে'
  },

  gu: {
    // Auth
    'auth.login': 'લૉગિન',
    'auth.signup': 'સાઇન અપ',
    'auth.email': 'ઇમેઇલ',
    'auth.phone': 'ફોન નંબર',
    'auth.password': 'પાસવર્ડ',
    'auth.confirmPassword': 'પાસવર્ડ કન્ફર્મ કરો',
    'auth.fullName': 'પૂરું નામ',
    'auth.loginButton': 'લૉગિન કરો',
    'auth.signupButton': 'એકાઉન્ટ બનાવો',
    'auth.noAccount': 'એકાઉન્ટ નથી?',
    'auth.haveAccount': 'પહેલેથી એકાઉન્ટ છે?',
    'auth.selectLanguage': 'ભાષા પસંદ કરો',

    // Navigation
    'nav.home': 'હોમ',
    'nav.calendar': 'કેલેન્ડર',
    'nav.search': 'શોધ',
    'nav.messages': 'સંદેશાઓ',

    // Home
    'home.welcome': 'સ્વાગત',
    'home.employees': 'કર્મચારીઓ',
    'home.scanQR': 'QR સ્કેન કરો',
    'home.myQR': 'મારો QR કોડ',
    'home.refer': 'મિત્રને રેફર કરો',
    'home.profile': 'પ્રોફાઇલ',
    'home.logout': 'લૉગઆઉટ',

    // Profile
    'profile.edit': 'પ્રોફાઇલ સંપાદિત કરો',
    'profile.save': 'ફેરફારો સાચવો',
    'profile.cancel': 'રદ કરો',
    'profile.profession': 'વ્યવસાય',
    'profile.selectProfession': 'વ્યવસાય પસંદ કરો',
    'profile.uploadPhoto': 'ફોટો અપલોડ કરો',
    'profile.currency': 'ચલણ',
    'profile.language': 'ભાષા',

    // Employees
    'employees.title': 'કર્મચારી વ્યવસ્થાપન',
    'employees.wages': 'વેતન',
    'employees.performance': 'કાર્યક્ષમતા',
    'employees.attendance': 'હાજરી',
    'employees.loans': 'લોન',
    'employees.bonuses': 'બોનસ',

    // Wages
    'wages.title': 'કર્મચારી વેતન',
    'wages.daily': 'દૈનિક વેતન',
    'wages.paymentDate': 'ચુકવણી તારીખ',
    'wages.save': 'વેતન સાચવો',
    'wages.viewStatement': 'સ્ટેટમેન્ટ જુઓ',

    // Statement
    'statement.title': 'વેતન સ્ટેટમેન્ટ',
    'statement.employee': 'કર્મચારી',
    'statement.employer': 'એમ્પ્લોયર',
    'statement.period': 'સમયગાળો',
    'statement.dailyWage': 'દૈનિક વેતન',
    'statement.daysWorked': 'કામ કર્યા દિવસો',
    'statement.totalWages': 'કુલ વેતન',
    'statement.loans': 'લોન',
    'statement.bonuses': 'બોનસ',
    'statement.netAmount': 'ચોખ્ખી રકમ',
    'statement.date': 'તારીખ',
    'statement.download': 'ડાઉનલોડ કરો',
    'statement.close': 'બંધ કરો',

    // Loans
    'loans.title': 'કર્મચારી લોન',
    'loans.amount': 'રકમ',
    'loans.remaining': 'બાકી',
    'loans.grant': 'લોન આપો',
    'loans.deduct': 'કાપો',
    'loans.foreclose': 'બંધ કરો',

    // Bonuses
    'bonuses.title': 'કર્મચારી બોનસ',
    'bonuses.amount': 'રકમ',
    'bonuses.comment': 'ટિપ્પણી',
    'bonuses.give': 'બોનસ આપો',

    // Search
    'search.title': 'શોધ',
    'search.placeholder': 'નામ, ફોન અથવા વ્યવસાયથી શોધો',
    'search.noResults': 'કોઈ પરિણામ મળ્યા નથી',

    // Messages
    'messages.title': 'સંદેશાઓ',
    'messages.noMessages': 'હજુ સુધી કોઈ સંદેશાઓ નથી',

    // Calendar
    'calendar.title': 'કેલેન્ડર',
    'calendar.today': 'આજે',

    // Common
    'common.loading': 'લોડ થઈ રહ્યું છે...',
    'common.error': 'ભૂલ',
    'common.success': 'સફળતા',
    'common.confirm': 'પુષ્ટિ કરો',
    'common.delete': 'કાઢી નાખો',
    'common.edit': 'સંપાદિત કરો',
    'common.view': 'જુઓ',
    'common.close': 'બંધ કરો',
    'common.back': 'પાછળ'
  },

  ml: {
    // Auth
    'auth.login': 'ലോഗിൻ',
    'auth.signup': 'സൈൻ അപ്പ്',
    'auth.email': 'ഇമെയിൽ',
    'auth.phone': 'ഫോൺ നമ്പർ',
    'auth.password': 'പാസ്‌വേഡ്',
    'auth.confirmPassword': 'പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക',
    'auth.fullName': 'പൂർണ്ണ നാമം',
    'auth.loginButton': 'ലോഗിൻ ചെയ്യുക',
    'auth.signupButton': 'അക്കൗണ്ട് സൃഷ്ടിക്കുക',
    'auth.noAccount': 'അക്കൗണ്ട് ഇല്ലേ?',
    'auth.haveAccount': 'ഇതിനകം അക്കൗണ്ട് ഉണ്ടോ?',
    'auth.selectLanguage': 'ഭാഷ തിരഞ്ഞെടുക്കുക',

    // Navigation
    'nav.home': 'ഹോം',
    'nav.calendar': 'കലണ്ടർ',
    'nav.search': 'തിരയൽ',
    'nav.messages': 'സന്ദേശങ്ങൾ',

    // Home
    'home.welcome': 'സ്വാഗതം',
    'home.employees': 'ജീവനക്കാർ',
    'home.scanQR': 'QR സ്കാൻ ചെയ്യുക',
    'home.myQR': 'എന്റെ QR കോഡ്',
    'home.refer': 'സുഹൃത്തിനെ റഫർ ചെയ്യുക',
    'home.profile': 'പ്രൊഫൈൽ',
    'home.logout': 'ലോഗൗട്ട്',

    // Profile
    'profile.edit': 'പ്രൊഫൈൽ എഡിറ്റ് ചെയ്യുക',
    'profile.save': 'മാറ്റങ്ങൾ സേവ് ചെയ്യുക',
    'profile.cancel': 'റദ്ദാക്കുക',
    'profile.profession': 'തൊഴിൽ',
    'profile.selectProfession': 'തൊഴിൽ തിരഞ്ഞെടുക്കുക',
    'profile.uploadPhoto': 'ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക',
    'profile.currency': 'കറൻസി',
    'profile.language': 'ഭാഷ',

    // Employees
    'employees.title': 'ജീവനക്കാരുടെ മാനേജ്മെന്റ്',
    'employees.wages': 'വേതനം',
    'employees.performance': 'പ്രകടനം',
    'employees.attendance': 'ഹാജർ',
    'employees.loans': 'വായ്പകൾ',
    'employees.bonuses': 'ബോണസുകൾ',

    // Wages
    'wages.title': 'ജീവനക്കാരുടെ വേതനം',
    'wages.daily': 'പ്രതിദിന വേതനം',
    'wages.paymentDate': 'പേയ്‌മെന്റ് തീയതി',
    'wages.save': 'വേതനം സേവ് ചെയ്യുക',
    'wages.viewStatement': 'സ്റ്റേറ്റ്‌മെന്റ് കാണുക',

    // Statement
    'statement.title': 'വേതന സ്റ്റേറ്റ്‌മെന്റ്',
    'statement.employee': 'ജീവനക്കാരൻ',
    'statement.employer': 'തൊഴിൽദാതാവ്',
    'statement.period': 'കാലയളവ്',
    'statement.dailyWage': 'പ്രതിദിന വേതനം',
    'statement.daysWorked': 'ജോലി ചെയ്ത ദിവസങ്ങൾ',
    'statement.totalWages': 'മൊത്തം വേതനം',
    'statement.loans': 'വായ്പകൾ',
    'statement.bonuses': 'ബോണസുകൾ',
    'statement.netAmount': 'നെറ്റ് തുക',
    'statement.date': 'തീയതി',
    'statement.download': 'ഡൗൺലോഡ് ചെയ്യുക',
    'statement.close': 'അടയ്ക്കുക',

    // Loans
    'loans.title': 'ജീവനക്കാരുടെ വായ്പകൾ',
    'loans.amount': 'തുക',
    'loans.remaining': 'ബാക്കി',
    'loans.grant': 'വായ്പ നൽകുക',
    'loans.deduct': 'കുറയ്ക്കുക',
    'loans.foreclose': 'അടയ്ക്കുക',

    // Bonuses
    'bonuses.title': 'ജീവനക്കാരുടെ ബോണസുകൾ',
    'bonuses.amount': 'തുക',
    'bonuses.comment': 'അഭിപ്രായം',
    'bonuses.give': 'ബോണസ് നൽകുക',

    // Search
    'search.title': 'തിരയൽ',
    'search.placeholder': 'പേര്, ഫോൺ അല്ലെങ്കിൽ തൊഴിൽ പ്രകാരം തിരയുക',
    'search.noResults': 'ഫലങ്ങളൊന്നും കണ്ടെത്തിയില്ല',

    // Messages
    'messages.title': 'സന്ദേശങ്ങൾ',
    'messages.noMessages': 'ഇതുവരെ സന്ദേശങ്ങളൊന്നുമില്ല',

    // Calendar
    'calendar.title': 'കലണ്ടർ',
    'calendar.today': 'ഇന്ന്',

    // Common
    'common.loading': 'ലോഡ് ചെയ്യുന്നു...',
    'common.error': 'പിശക്',
    'common.success': 'വിജയം',
    'common.confirm': 'സ്ഥിരീകരിക്കുക',
    'common.delete': 'ഇല്ലാതാക്കുക',
    'common.edit': 'എഡിറ്റ് ചെയ്യുക',
    'common.view': 'കാണുക',
    'common.close': 'അടയ്ക്കുക',
    'common.back': 'തിരികെ'
  },

  pa: {
    // Auth
    'auth.login': 'ਲੌਗਇਨ',
    'auth.signup': 'ਸਾਈਨ ਅੱਪ',
    'auth.email': 'ਈਮੇਲ',
    'auth.phone': 'ਫੋਨ ਨੰਬਰ',
    'auth.password': 'ਪਾਸਵਰਡ',
    'auth.confirmPassword': 'ਪਾਸਵਰਡ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ',
    'auth.fullName': 'ਪੂਰਾ ਨਾਮ',
    'auth.loginButton': 'ਲੌਗਇਨ ਕਰੋ',
    'auth.signupButton': 'ਖਾਤਾ ਬਣਾਓ',
    'auth.noAccount': 'ਖਾਤਾ ਨਹੀਂ ਹੈ?',
    'auth.haveAccount': 'ਪਹਿਲਾਂ ਤੋਂ ਖਾਤਾ ਹੈ?',
    'auth.selectLanguage': 'ਭਾਸ਼ਾ ਚੁਣੋ',

    // Navigation
    'nav.home': 'ਹੋਮ',
    'nav.calendar': 'ਕੈਲੰਡਰ',
    'nav.search': 'ਖੋਜ',
    'nav.messages': 'ਸੁਨੇਹੇ',

    // Home
    'home.welcome': 'ਸਵਾਗਤ ਹੈ',
    'home.employees': 'ਕਰਮਚਾਰੀ',
    'home.scanQR': 'QR ਸਕੈਨ ਕਰੋ',
    'home.myQR': 'ਮੇਰਾ QR ਕੋਡ',
    'home.refer': 'ਦੋਸਤ ਨੂੰ ਰੈਫਰ ਕਰੋ',
    'home.profile': 'ਪ੍ਰੋਫਾਈਲ',
    'home.logout': 'ਲੌਗਆਉਟ',

    // Profile
    'profile.edit': 'ਪ੍ਰੋਫਾਈਲ ਸੰਪਾਦਿਤ ਕਰੋ',
    'profile.save': 'ਤਬਦੀਲੀਆਂ ਸੁਰੱਖਿਅਤ ਕਰੋ',
    'profile.cancel': 'ਰੱਦ ਕਰੋ',
    'profile.profession': 'ਪੇਸ਼ਾ',
    'profile.selectProfession': 'ਪੇਸ਼ਾ ਚੁਣੋ',
    'profile.uploadPhoto': 'ਫੋਟੋ ਅੱਪਲੋਡ ਕਰੋ',
    'profile.currency': 'ਮੁਦਰਾ',
    'profile.language': 'ਭਾਸ਼ਾ',

    // Employees
    'employees.title': 'ਕਰਮਚਾਰੀ ਪ੍ਰਬੰਧਨ',
    'employees.wages': 'ਤਨਖਾਹ',
    'employees.performance': 'ਕਾਰਗੁਜ਼ਾਰੀ',
    'employees.attendance': 'ਹਾਜ਼ਰੀ',
    'employees.loans': 'ਕਰਜ਼ੇ',
    'employees.bonuses': 'ਬੋਨਸ',

    // Wages
    'wages.title': 'ਕਰਮਚਾਰੀ ਤਨਖਾਹ',
    'wages.daily': 'ਰੋਜ਼ਾਨਾ ਤਨਖਾਹ',
    'wages.paymentDate': 'ਭੁਗਤਾਨ ਮਿਤੀ',
    'wages.save': 'ਤਨਖਾਹ ਸੁਰੱਖਿਅਤ ਕਰੋ',
    'wages.viewStatement': 'ਬਿਆਨ ਵੇਖੋ',

    // Statement
    'statement.title': 'ਤਨਖਾਹ ਬਿਆਨ',
    'statement.employee': 'ਕਰਮਚਾਰੀ',
    'statement.employer': 'ਮਾਲਕ',
    'statement.period': 'ਮਿਆਦ',
    'statement.dailyWage': 'ਰੋਜ਼ਾਨਾ ਤਨਖਾਹ',
    'statement.daysWorked': 'ਕੰਮ ਕੀਤੇ ਦਿਨ',
    'statement.totalWages': 'ਕੁੱਲ ਤਨਖਾਹ',
    'statement.loans': 'ਕਰਜ਼ੇ',
    'statement.bonuses': 'ਬੋਨਸ',
    'statement.netAmount': 'ਸ਼ੁੱਧ ਰਕਮ',
    'statement.date': 'ਮਿਤੀ',
    'statement.download': 'ਡਾਊਨਲੋਡ ਕਰੋ',
    'statement.close': 'ਬੰਦ ਕਰੋ',

    // Loans
    'loans.title': 'ਕਰਮਚਾਰੀ ਕਰਜ਼ੇ',
    'loans.amount': 'ਰਕਮ',
    'loans.remaining': 'ਬਾਕੀ',
    'loans.grant': 'ਕਰਜ਼ਾ ਦਿਓ',
    'loans.deduct': 'ਕਟੌਤੀ ਕਰੋ',
    'loans.foreclose': 'ਬੰਦ ਕਰੋ',

    // Bonuses
    'bonuses.title': 'ਕਰਮਚਾਰੀ ਬੋਨਸ',
    'bonuses.amount': 'ਰਕਮ',
    'bonuses.comment': 'ਟਿੱਪਣੀ',
    'bonuses.give': 'ਬੋਨਸ ਦਿਓ',

    // Search
    'search.title': 'ਖੋਜ',
    'search.placeholder': 'ਨਾਮ, ਫੋਨ ਜਾਂ ਪੇਸ਼ੇ ਨਾਲ ਖੋਜੋ',
    'search.noResults': 'ਕੋਈ ਨਤੀਜੇ ਨਹੀਂ ਮਿਲੇ',

    // Messages
    'messages.title': 'ਸੁਨੇਹੇ',
    'messages.noMessages': 'ਅਜੇ ਤੱਕ ਕੋਈ ਸੁਨੇਹੇ ਨਹੀਂ',

    // Calendar
    'calendar.title': 'ਕੈਲੰਡਰ',
    'calendar.today': 'ਅੱਜ',

    // Common
    'common.loading': 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...',
    'common.error': 'ਗਲਤੀ',
    'common.success': 'ਸਫਲਤਾ',
    'common.confirm': 'ਪੁਸ਼ਟੀ ਕਰੋ',
    'common.delete': 'ਮਿਟਾਓ',
    'common.edit': 'ਸੰਪਾਦਿਤ ਕਰੋ',
    'common.view': 'ਵੇਖੋ',
    'common.close': 'ਬੰਦ ਕਰੋ',
    'common.back': 'ਵਾਪਸ'
  }
};

export const getTranslation = (key: string, language: LanguageCode = 'en'): string => {
  return translations[language]?.[key] || translations.en[key] || key;
};

export const detectLanguageFromCountry = (countryCode: string): LanguageCode[] => {
  return COUNTRY_LANGUAGES[countryCode] || ['en'];
};