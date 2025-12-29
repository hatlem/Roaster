// Internationalization Type Definitions

export type SupportedLocale = 'no' | 'en' | 'es' | 'fr' | 'de' | 'pl' | 'sv';

export interface CommonTranslations {
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  create: string;
  close: string;
  yes: string;
  no: string;
  loading: string;
  error: string;
  success: string;
  search: string;
  filter: string;
  clear: string;
  submit: string;
  back: string;
  next: string;
  previous: string;
  confirm: string;
  actions: string;
  settings: string;
  help: string;
  home: string;
  view: string;
  download: string;
  upload: string;
  refresh: string;
  add: string;
  remove: string;
  update: string;
  select: string;
  selectAll: string;
  deselectAll: string;
  noResults: string;
  required: string;
  optional: string;
  enabled: string;
  disabled: string;
  active: string;
  inactive: string;
  status: string;
  date: string;
  time: string;
  from: string;
  to: string;
  all: string;
  none: string;
}

export interface AuthTranslations {
  login: string;
  logout: string;
  register: string;
  email: string;
  password: string;
  confirmPassword: string;
  forgotPassword: string;
  resetPassword: string;
  invalidCredentials: string;
  accountCreated: string;
  accountExists: string;
  passwordMismatch: string;
  passwordReset: string;
  passwordResetSent: string;
  sessionExpired: string;
  unauthorized: string;
  welcome: string;
  signIn: string;
  signUp: string;
  signOut: string;
  rememberMe: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  role: string;
  admin: string;
  manager: string;
  employee: string;
  profile: string;
  changePassword: string;
  currentPassword: string;
  newPassword: string;
}

export interface RosterTranslations {
  title: string;
  create: string;
  publish: string;
  draft: string;
  published: string;
  startDate: string;
  endDate: string;
  shifts: string;
  addShift: string;
  editShift: string;
  deleteShift: string;
  publishWarning: string;
  latePublicationWarning: string;
  weeklyView: string;
  dailyView: string;
  monthlyView: string;
  today: string;
  thisWeek: string;
  nextWeek: string;
  previousWeek: string;
  shiftDetails: string;
  shiftStart: string;
  shiftEnd: string;
  shiftDuration: string;
  shiftType: string;
  morningShift: string;
  afternoonShift: string;
  eveningShift: string;
  nightShift: string;
  openShift: string;
  assignShift: string;
  unassignShift: string;
  swapShift: string;
  copyRoster: string;
  deleteRoster: string;
  rosterCreated: string;
  rosterPublished: string;
  rosterDeleted: string;
  noShiftsScheduled: string;
  totalHours: string;
  scheduledHours: string;
  overtimeHours: string;
  department: string;
  location: string;
  position: string;
  notes: string;
  breakTime: string;
  paidBreak: string;
  unpaidBreak: string;
}

export interface ComplianceTranslations {
  violation: string;
  warning: string;
  compliant: string;
  restPeriodViolation: string;
  dailyHoursViolation: string;
  weeklyHoursViolation: string;
  overtimeViolation: string;
  fourteenDayRule: string;
  minDailyRest: string;
  minWeeklyRest: string;
  complianceCheck: string;
  complianceStatus: string;
  violationsFound: string;
  noViolations: string;
  criticalViolation: string;
  minorViolation: string;
  resolveViolation: string;
  ignoreWarning: string;
  laborLaw: string;
  workingHoursAct: string;
  collectiveAgreement: string;
  maxDailyHours: string;
  maxWeeklyHours: string;
  maxOvertimeDaily: string;
  maxOvertimeWeekly: string;
  minRestBetweenShifts: string;
  consecutiveWorkDays: string;
  nightWorkRestrictions: string;
  underageRestrictions: string;
  pregnantWorkerRules: string;
  sundayWorkRules: string;
  holidayWorkRules: string;
  compensatoryRest: string;
  averagingPeriod: string;
}

export interface EmployeeTranslations {
  employees: string;
  schedule: string;
  preferences: string;
  notifications: string;
  availability: string;
  timeOff: string;
  shifts: string;
  employeeList: string;
  addEmployee: string;
  editEmployee: string;
  deleteEmployee: string;
  employeeDetails: string;
  contractType: string;
  fullTime: string;
  partTime: string;
  temporary: string;
  seasonal: string;
  hourlyRate: string;
  salary: string;
  startDateEmployment: string;
  endDateEmployment: string;
  department: string;
  manager: string;
  team: string;
  skills: string;
  certifications: string;
  training: string;
  performanceReview: string;
  documents: string;
  emergencyContact: string;
  vacationDays: string;
  sickDays: string;
  workingHoursPerWeek: string;
  employeeNumber: string;
  active: string;
  onLeave: string;
  terminated: string;
  pendingApproval: string;
  approved: string;
  rejected: string;
  submitRequest: string;
  cancelRequest: string;
  requestTimeOff: string;
  viewSchedule: string;
  setAvailability: string;
  updatePreferences: string;
  notificationSettings: string;
  emailNotifications: string;
  smsNotifications: string;
  pushNotifications: string;
}

export interface Translations {
  common: CommonTranslations;
  auth: AuthTranslations;
  roster: RosterTranslations;
  compliance: ComplianceTranslations;
  employee: EmployeeTranslations;
}

export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  currencySymbol: string;
  direction: 'ltr' | 'rtl';
}

export const localeConfigs: Record<SupportedLocale, LocaleConfig> = {
  no: {
    code: 'no',
    name: 'Norwegian',
    nativeName: 'Norsk',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    currency: 'NOK',
    currencySymbol: 'kr',
    direction: 'ltr',
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    currency: 'NOK',
    currencySymbol: 'kr',
    direction: 'ltr',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Espa\u00f1ol',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'NOK',
    currencySymbol: 'kr',
    direction: 'ltr',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Fran\u00e7ais',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'NOK',
    currencySymbol: 'kr',
    direction: 'ltr',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    currency: 'NOK',
    currencySymbol: 'kr',
    direction: 'ltr',
  },
  pl: {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    currency: 'NOK',
    currencySymbol: 'kr',
    direction: 'ltr',
  },
  sv: {
    code: 'sv',
    name: 'Swedish',
    nativeName: 'Svenska',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
    currency: 'NOK',
    currencySymbol: 'kr',
    direction: 'ltr',
  },
};
