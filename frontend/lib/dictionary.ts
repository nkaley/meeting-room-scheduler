export type Locale = "en" | "ru" | "es" | "fr" | "de" | "zh" | "pt";

export const SUPPORTED_LOCALES: Locale[] = ["en", "ru", "es", "fr", "de", "zh", "pt"];
export const DEFAULT_LOCALE: Locale = "en";

const en: Record<string, string> = {
  appName: "Meeting Rooms",
  navCalendar: "Calendar",
  navLogout: "Log out",
  adminBookings: "Bookings",
  adminRooms: "Rooms",
  adminUsers: "Users",
  adminSettings: "Settings",
  schedule: "Schedule",
  roomsTitle: "Rooms",
  today: "Today",
  yesterday: "Yesterday",
  tomorrow: "Tomorrow",
  free: "Free",
  busy: "Busy",
  bookSlot: "Book",
  newBooking: "New booking",
  book: "Book",
  cancelBooking: "Cancel booking",
  myBooking: "My booking",
  booking: "Booking",
  duration: "Duration",
  durationMin: "min",
  durationHour: "h",
  description: "Description",
  descriptionPlaceholder: "e.g. Project sync",
  start: "Start",
  time: "Time",
  close: "Close",
  login: "Sign in",
  loginButton: "Sign in",
  register: "Sign up",
  registerButton: "Sign up",
  noAccount: "No account?",
  hasAccount: "Already have an account?",
  email: "Email",
  password: "Password",
  name: "First name",
  surname: "Last name",
  emailPlaceholder: "you@company.com",
  loginErrorCredentials: "Invalid email or password",
  loading: "Loading…",
  loginButtonLoading: "Signing in…",
  registerButtonLoading: "Signing up…",
  registerError: "Registration failed",
  registerNextStep: "Next",
  verificationCode: "Verification code",
  verificationCodePlaceholder: "000000",
  verificationCodeSent: "We sent a code to your email. Enter it below.",
  confirmRegistration: "Confirm",
  resendCode: "Resend code",
  resendCodeIn: "Resend in {sec}s",
  networkOrRefreshError: "Network or refresh error. Please reload the page (F5).",
  weekendUnavailable: "Weekends are not available for booking. Choose a weekday in the calendar above.",
  noRooms: "No rooms yet.",
  noRoomsAdminIntro: "Add rooms in the ",
  noRoomsAdminLink: "Rooms section",
  noRoomsAdminEnd: ".",
  noRoomsUser: "Contact your administrator.",
  adminRoomsTitle: "Rooms",
  adminUsersTitle: "Users",
  adminBookingsTitle: "All bookings",
  add: "Add",
  cancel: "Cancel",
  save: "Save",
  delete: "Delete",
  edit: "Edit",
  editRoom: "Edit room",
  addRoom: "Add room",
  roomName: "Name",
  roomDescription: "Description",
  actions: "Actions",
  status: "Status",
  active: "Active",
  hidden: "Hidden",
  activeRoomHint: "Active — room is visible in the calendar and available for booking",
  roomActiveTitle: "Room is available for booking",
  roomHiddenTitle: "Hidden from calendar",
  deleteRoomConfirm: "Delete room «{name}»?",
  deleteRoomConfirmDesc: "Are you sure? All bookings for this room will be permanently deleted.",
  dateTime: "Date & time",
  descriptionColumn: "Description",
  room: "Room",
  user: "User",
  deleteBookingConfirm: "Delete booking?",
  deleteBookingConfirmDesc: "This booking will be permanently deleted.",
  deleting: "Deleting…",
  deleteUserConfirm: "Delete user?",
  deleteUserConfirmDesc: "Are you sure? This user and all their bookings will be permanently deleted.",
  admin: "Admin",
  userRole: "User",
  roleLabel: "Role",
  fullName: "Full name",
  adminSettingsTitle: "Schedule settings",
  workStartHour: "Work day start (hour)",
  workEndHour: "Work day end (hour)",
  timezone: "Timezone",
  bookingStepMinutes: "Time grid step (min)",
  workDays: "Work days",
  maxBookingDistanceDays: "Book ahead (days)",
  maxBookingDurationMinutes: "Max booking duration (min)",
  requireDescription: "Require meeting description",
  settingsSaved: "Settings saved",
  settingsErrorEndBeforeStart: "End hour cannot be before start hour",
  dayMon: "Mon",
  dayTue: "Tue",
  dayWed: "Wed",
  dayThu: "Thu",
  dayFri: "Fri",
  daySat: "Sat",
  daySun: "Sun",
};

const ru: Record<string, string> = { ...en,
  appName: "Переговорки",
  navCalendar: "Календарь",
  navLogout: "Выход",
  adminBookings: "Бронирования",
  adminRooms: "Комнаты",
  adminUsers: "Пользователи",
  adminSettings: "Настройки",
  roomsTitle: "Переговорные",
  today: "Сегодня",
  noRooms: "Нет ни одной комнаты.",
  noRoomsAdminIntro: "Добавьте комнаты в ",
  noRoomsAdminLink: "разделе «Комнаты»",
  noRoomsUser: "Обратитесь к администратору.",
  login: "Вход",
  loginButton: "Войти",
  loginErrorCredentials: "Неверный Email или Пароль",
};

const es: Record<string, string> = { ...en, login: "Iniciar sesión", roomsTitle: "Salas" };
const fr: Record<string, string> = { ...en, login: "Connexion", roomsTitle: "Salles" };
const de: Record<string, string> = { ...en, login: "Anmelden", roomsTitle: "Räume" };
const zh: Record<string, string> = { ...en, login: "登录", roomsTitle: "房间" };
const pt: Record<string, string> = { ...en, login: "Entrar", roomsTitle: "Salas" };

export const dictionary: Record<Locale, Record<string, string>> = { en, ru, es, fr, de, zh, pt };

const STORAGE_KEY = "meetings-room-locale";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) return stored as Locale;
  return DEFAULT_LOCALE;
}

export function setStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, locale);
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  zh: "中文",
  pt: "Português",
};
