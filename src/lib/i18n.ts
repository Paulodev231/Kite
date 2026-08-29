// Translations for everything a member sees. The language follows the phone's
// own setting automatically; a member can override it on their dashboard.
//
// Scope: member-facing screens (navigation, Noticeboard, Rooms, DMs, Dashboard,
// sign-in). The Admin Panel stays in English — it is operated by you and your
// admins, not by members.

export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];

/** Arabic is written right-to-left; the layout flips for it. */
export function isRtl(lang: Lang): boolean {
  return lang === "ar";
}

const en = {
  // navigation & chrome
  navNoticeboard: "Noticeboard",
  navRooms: "Rooms",
  navDms: "DMs",
  navDashboard: "Dashboard",
  adminPanel: "Admin Panel",
  signOut: "Sign out",
  activeNow: "Active Now",
  inRoom: "In room",
  offline: "Offline — you can keep reading and typing. Messages send when you reconnect.",

  // sign in
  signInTitle: "Private workspace · Access by invitation only",
  email: "Email address",
  password: "Password",
  signIn: "Sign In",
  signingIn: "Signing in…",
  signInFailed: "Sign-in failed. Check the email and password given to you by your Admin.",
  noAccount:
    "No account? Access to this platform is provisioned by your administrator. Contact them for credentials.",

  // noticeboard
  noticeboard: "Noticeboard",
  noticeboardEmpty:
    "Announcements will appear here. React with an emoji to let the team know you have seen them.",
  readOnlyNotice: "🔒 Only Admins post here — tap an emoji to respond",
  pinned: "Pinned",
  edited: "edited",

  // rooms
  rooms: "Project Rooms",
  roomsEmpty: "You haven’t been added to any project rooms yet. Your Admin controls room access.",
  fillIn: "Fill in →",
  messageRoom: "Message",

  // direct messages
  directMessages: "Direct Messages",
  dmsEmpty: "No conversations yet. Tap any handle or avatar in a room to start a private chat.",
  privateConversation: "Private conversation with",
  messageSomeone: "Message",
  dmLoadError:
    "Could not load your conversations. Check your connection, and make sure the latest security rules have been published.",

  // dashboard
  myDashboard: "My Dashboard",
  myProfile: "My Profile",
  noteForYou: "A note for you",
  fromAdmin: "From your administrator",
  alertsTitle: "Alerts from your administrator",
  myMilestones: "My project milestones",
  delivered: "delivered",
  daysToGo: "days to go",
  dueToday: "due today",
  milestonesFootnote:
    "Milestones are recorded by your administrator. Message them in a room or by direct message if something needs updating.",

  // funding
  fundingStatus: "Funding status",
  funded: "Funded",
  notFunded: "Not funded",
  confirmationCode: "Confirmation code",
  confirmationCodeHint: "Enter the code your administrator gave you.",
  confirm: "Confirm",
  saved: "Saved",
  fundingFootnote: "Funding is set by your administrator. Message them if something looks wrong.",

  // bank details
  bankDetails: "Bank details",
  bankName: "Bank name",
  bankWebsite: "Bank website",
  bankLogin: "Login",
  bankPassword: "Password",
  show: "Show",
  hide: "Hide",
  copy: "Copy",
  copied: "Copied",
  bankFootnote:
    "Provided by your administrator. Keep these private — never share them with anyone.",
  noBankDetails: "Your administrator has not added bank details yet.",

  // settings
  notifications: "Notifications",
  notificationsHint:
    "Get alerted about new direct messages and announcements while the app is open or in the background.",
  turnOnNotifications: "Turn on notifications",
  notificationsOn: "Notifications are on for this device.",
  changeHandle: "Change my handle",
  changeHandleHint: "This is the name others see. Admins are notified of handle changes.",
  saveHandle: "Save handle",
  changePassword: "Change my password",
  currentPassword: "Current password",
  newPassword: "New password (min 6 characters)",
  updatePassword: "Update password",
  language: "Language",
  languageHint: "Follows your phone automatically. Change it here if you prefer another.",
  automatic: "Automatic",
} as const;

export type TranslationKey = keyof typeof en;

const fr: Record<TranslationKey, string> = {
  navNoticeboard: "Annonces",
  navRooms: "Salles",
  navDms: "Messages",
  navDashboard: "Tableau",
  adminPanel: "Panneau d’administration",
  signOut: "Se déconnecter",
  activeNow: "Actifs",
  inRoom: "Dans la salle",
  offline:
    "Hors ligne — vous pouvez continuer à lire et à écrire. Vos messages partiront à la reconnexion.",
  signInTitle: "Espace privé · Accès sur invitation uniquement",
  email: "Adresse e-mail",
  password: "Mot de passe",
  signIn: "Se connecter",
  signingIn: "Connexion…",
  signInFailed:
    "Échec de la connexion. Vérifiez l’e-mail et le mot de passe fournis par votre administrateur.",
  noAccount:
    "Pas de compte ? L’accès à cette plateforme est fourni par votre administrateur. Contactez-le pour obtenir vos identifiants.",
  noticeboard: "Annonces",
  noticeboardEmpty:
    "Les annonces apparaîtront ici. Réagissez avec un emoji pour indiquer que vous les avez vues.",
  readOnlyNotice: "🔒 Seuls les administrateurs publient ici — touchez un emoji pour répondre",
  pinned: "Épinglé",
  edited: "modifié",
  rooms: "Salles de projet",
  roomsEmpty:
    "Vous n’avez encore été ajouté à aucune salle de projet. Votre administrateur gère les accès.",
  fillIn: "Remplir →",
  messageRoom: "Message",
  directMessages: "Messages privés",
  dmsEmpty:
    "Aucune conversation. Touchez un nom ou un avatar dans une salle pour démarrer une discussion privée.",
  privateConversation: "Conversation privée avec",
  messageSomeone: "Message",
  dmLoadError:
    "Impossible de charger vos conversations. Vérifiez votre connexion et que les règles de sécurité ont bien été publiées.",
  myDashboard: "Mon tableau de bord",
  myProfile: "Mon profil",
  noteForYou: "Une note pour vous",
  fromAdmin: "De votre administrateur",
  alertsTitle: "Alertes de votre administrateur",
  myMilestones: "Mes jalons de projet",
  delivered: "réalisés",
  daysToGo: "jours restants",
  dueToday: "échéance aujourd’hui",
  milestonesFootnote:
    "Les jalons sont enregistrés par votre administrateur. Écrivez-lui dans une salle ou en message privé si quelque chose doit être mis à jour.",
  fundingStatus: "Statut de financement",
  funded: "Financé",
  notFunded: "Non financé",
  confirmationCode: "Code de confirmation",
  confirmationCodeHint: "Saisissez le code fourni par votre administrateur.",
  confirm: "Confirmer",
  saved: "Enregistré",
  fundingFootnote:
    "Le financement est défini par votre administrateur. Contactez-le si quelque chose semble incorrect.",
  bankDetails: "Coordonnées bancaires",
  bankName: "Nom de la banque",
  bankWebsite: "Site web de la banque",
  bankLogin: "Identifiant",
  bankPassword: "Mot de passe",
  show: "Afficher",
  hide: "Masquer",
  copy: "Copier",
  copied: "Copié",
  bankFootnote:
    "Fournies par votre administrateur. Gardez-les privées — ne les partagez avec personne.",
  noBankDetails: "Votre administrateur n’a pas encore ajouté de coordonnées bancaires.",
  notifications: "Notifications",
  notificationsHint:
    "Soyez averti des nouveaux messages et annonces lorsque l’application est ouverte ou en arrière-plan.",
  turnOnNotifications: "Activer les notifications",
  notificationsOn: "Les notifications sont activées sur cet appareil.",
  changeHandle: "Modifier mon nom",
  changeHandleHint:
    "C’est le nom que les autres voient. Les administrateurs sont informés des changements.",
  saveHandle: "Enregistrer",
  changePassword: "Modifier mon mot de passe",
  currentPassword: "Mot de passe actuel",
  newPassword: "Nouveau mot de passe (6 caractères min.)",
  updatePassword: "Mettre à jour",
  language: "Langue",
  languageHint: "Suit automatiquement votre téléphone. Changez-la ici si vous préférez.",
  automatic: "Automatique",
};

const es: Record<TranslationKey, string> = {
  navNoticeboard: "Anuncios",
  navRooms: "Salas",
  navDms: "Mensajes",
  navDashboard: "Panel",
  adminPanel: "Panel de administración",
  signOut: "Cerrar sesión",
  activeNow: "Activos",
  inRoom: "En la sala",
  offline:
    "Sin conexión — puedes seguir leyendo y escribiendo. Los mensajes se enviarán al reconectar.",
  signInTitle: "Espacio privado · Acceso solo por invitación",
  email: "Correo electrónico",
  password: "Contraseña",
  signIn: "Iniciar sesión",
  signingIn: "Iniciando sesión…",
  signInFailed:
    "No se pudo iniciar sesión. Revisa el correo y la contraseña que te dio tu administrador.",
  noAccount:
    "¿Sin cuenta? El acceso a esta plataforma lo concede tu administrador. Contáctalo para obtener tus credenciales.",
  noticeboard: "Anuncios",
  noticeboardEmpty:
    "Los anuncios aparecerán aquí. Reacciona con un emoji para indicar que los has visto.",
  readOnlyNotice: "🔒 Solo los administradores publican aquí — toca un emoji para responder",
  pinned: "Fijado",
  edited: "editado",
  rooms: "Salas de proyecto",
  roomsEmpty:
    "Todavía no te han añadido a ninguna sala de proyecto. Tu administrador gestiona el acceso.",
  fillIn: "Rellenar →",
  messageRoom: "Mensaje",
  directMessages: "Mensajes privados",
  dmsEmpty:
    "Aún no hay conversaciones. Toca cualquier nombre o avatar en una sala para iniciar un chat privado.",
  privateConversation: "Conversación privada con",
  messageSomeone: "Mensaje",
  dmLoadError:
    "No se pudieron cargar tus conversaciones. Revisa tu conexión y que se hayan publicado las reglas de seguridad.",
  myDashboard: "Mi panel",
  myProfile: "Mi perfil",
  noteForYou: "Una nota para ti",
  fromAdmin: "De tu administrador",
  alertsTitle: "Avisos de tu administrador",
  myMilestones: "Mis hitos del proyecto",
  delivered: "completados",
  daysToGo: "días restantes",
  dueToday: "vence hoy",
  milestonesFootnote:
    "Los hitos los registra tu administrador. Escríbele en una sala o por mensaje privado si algo debe actualizarse.",
  fundingStatus: "Estado de financiación",
  funded: "Financiado",
  notFunded: "Sin financiación",
  confirmationCode: "Código de confirmación",
  confirmationCodeHint: "Introduce el código que te dio tu administrador.",
  confirm: "Confirmar",
  saved: "Guardado",
  fundingFootnote:
    "La financiación la define tu administrador. Contáctalo si algo no parece correcto.",
  bankDetails: "Datos bancarios",
  bankName: "Nombre del banco",
  bankWebsite: "Sitio web del banco",
  bankLogin: "Usuario",
  bankPassword: "Contraseña",
  show: "Mostrar",
  hide: "Ocultar",
  copy: "Copiar",
  copied: "Copiado",
  bankFootnote:
    "Proporcionados por tu administrador. Mantenlos privados — no los compartas con nadie.",
  noBankDetails: "Tu administrador aún no ha añadido datos bancarios.",
  notifications: "Notificaciones",
  notificationsHint:
    "Recibe avisos de mensajes y anuncios nuevos mientras la app esté abierta o en segundo plano.",
  turnOnNotifications: "Activar notificaciones",
  notificationsOn: "Las notificaciones están activadas en este dispositivo.",
  changeHandle: "Cambiar mi nombre",
  changeHandleHint:
    "Es el nombre que ven los demás. Se avisa a los administradores de los cambios.",
  saveHandle: "Guardar",
  changePassword: "Cambiar mi contraseña",
  currentPassword: "Contraseña actual",
  newPassword: "Nueva contraseña (mín. 6 caracteres)",
  updatePassword: "Actualizar",
  language: "Idioma",
  languageHint: "Sigue automáticamente tu teléfono. Cámbialo aquí si lo prefieres.",
  automatic: "Automático",
};

const pt: Record<TranslationKey, string> = {
  navNoticeboard: "Avisos",
  navRooms: "Salas",
  navDms: "Mensagens",
  navDashboard: "Painel",
  adminPanel: "Painel de administração",
  signOut: "Terminar sessão",
  activeNow: "Ativos",
  inRoom: "Na sala",
  offline:
    "Sem ligação — pode continuar a ler e a escrever. As mensagens seguem quando voltar a ligar-se.",
  signInTitle: "Espaço privado · Acesso apenas por convite",
  email: "Endereço de e-mail",
  password: "Palavra-passe",
  signIn: "Entrar",
  signingIn: "A entrar…",
  signInFailed:
    "Não foi possível entrar. Verifique o e-mail e a palavra-passe fornecidos pelo seu administrador.",
  noAccount:
    "Sem conta? O acesso a esta plataforma é concedido pelo seu administrador. Contacte-o para obter credenciais.",
  noticeboard: "Avisos",
  noticeboardEmpty:
    "Os avisos aparecerão aqui. Reaja com um emoji para mostrar que os viu.",
  readOnlyNotice: "🔒 Só os administradores publicam aqui — toque num emoji para responder",
  pinned: "Fixado",
  edited: "editado",
  rooms: "Salas de projeto",
  roomsEmpty:
    "Ainda não foi adicionado a nenhuma sala de projeto. O seu administrador gere os acessos.",
  fillIn: "Preencher →",
  messageRoom: "Mensagem",
  directMessages: "Mensagens privadas",
  dmsEmpty:
    "Ainda não há conversas. Toque num nome ou avatar numa sala para iniciar uma conversa privada.",
  privateConversation: "Conversa privada com",
  messageSomeone: "Mensagem",
  dmLoadError:
    "Não foi possível carregar as suas conversas. Verifique a ligação e se as regras de segurança foram publicadas.",
  myDashboard: "O meu painel",
  myProfile: "O meu perfil",
  noteForYou: "Uma nota para si",
  fromAdmin: "Do seu administrador",
  alertsTitle: "Alertas do seu administrador",
  myMilestones: "Os meus marcos do projeto",
  delivered: "concluídos",
  daysToGo: "dias restantes",
  dueToday: "termina hoje",
  milestonesFootnote:
    "Os marcos são registados pelo seu administrador. Escreva-lhe numa sala ou por mensagem privada se algo precisar de ser atualizado.",
  fundingStatus: "Estado do financiamento",
  funded: "Financiado",
  notFunded: "Sem financiamento",
  confirmationCode: "Código de confirmação",
  confirmationCodeHint: "Introduza o código que o seu administrador lhe deu.",
  confirm: "Confirmar",
  saved: "Guardado",
  fundingFootnote:
    "O financiamento é definido pelo seu administrador. Contacte-o se algo parecer errado.",
  bankDetails: "Dados bancários",
  bankName: "Nome do banco",
  bankWebsite: "Site do banco",
  bankLogin: "Utilizador",
  bankPassword: "Palavra-passe",
  show: "Mostrar",
  hide: "Ocultar",
  copy: "Copiar",
  copied: "Copiado",
  bankFootnote:
    "Fornecidos pelo seu administrador. Mantenha-os privados — não os partilhe com ninguém.",
  noBankDetails: "O seu administrador ainda não adicionou dados bancários.",
  notifications: "Notificações",
  notificationsHint:
    "Receba avisos de novas mensagens e anúncios enquanto a aplicação estiver aberta ou em segundo plano.",
  turnOnNotifications: "Ativar notificações",
  notificationsOn: "As notificações estão ativas neste dispositivo.",
  changeHandle: "Alterar o meu nome",
  changeHandleHint:
    "É o nome que os outros veem. Os administradores são notificados das alterações.",
  saveHandle: "Guardar",
  changePassword: "Alterar a minha palavra-passe",
  currentPassword: "Palavra-passe atual",
  newPassword: "Nova palavra-passe (mín. 6 caracteres)",
  updatePassword: "Atualizar",
  language: "Idioma",
  languageHint: "Segue automaticamente o seu telemóvel. Altere aqui se preferir.",
  automatic: "Automático",
};

const ar: Record<TranslationKey, string> = {
  navNoticeboard: "الإعلانات",
  navRooms: "الغرف",
  navDms: "الرسائل",
  navDashboard: "لوحتي",
  adminPanel: "لوحة الإدارة",
  signOut: "تسجيل الخروج",
  activeNow: "المتصلون",
  inRoom: "في الغرفة",
  offline: "غير متصل — يمكنك متابعة القراءة والكتابة. ستُرسل رسائلك عند عودة الاتصال.",
  signInTitle: "مساحة خاصة · الدخول بالدعوة فقط",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  signIn: "تسجيل الدخول",
  signingIn: "جارٍ تسجيل الدخول…",
  signInFailed: "تعذّر تسجيل الدخول. تحقّق من البريد وكلمة المرور اللذين منحك إياهما المسؤول.",
  noAccount: "ليس لديك حساب؟ الوصول إلى هذه المنصة يمنحه المسؤول. تواصل معه للحصول على بياناتك.",
  noticeboard: "الإعلانات",
  noticeboardEmpty: "ستظهر الإعلانات هنا. تفاعل برمز تعبيري لتُعلم الفريق أنك اطّلعت عليها.",
  readOnlyNotice: "🔒 المسؤولون فقط ينشرون هنا — اضغط رمزًا تعبيريًا للرد",
  pinned: "مثبّت",
  edited: "معدّل",
  rooms: "غرف المشاريع",
  roomsEmpty: "لم تُضف إلى أي غرفة مشروع بعد. المسؤول هو من يمنح الوصول.",
  fillIn: "املأ النموذج ←",
  messageRoom: "رسالة",
  directMessages: "الرسائل الخاصة",
  dmsEmpty: "لا توجد محادثات بعد. اضغط على أي اسم أو صورة في غرفة لبدء محادثة خاصة.",
  privateConversation: "محادثة خاصة مع",
  messageSomeone: "رسالة",
  dmLoadError: "تعذّر تحميل محادثاتك. تحقّق من الاتصال ومن نشر قواعد الأمان.",
  myDashboard: "لوحتي",
  myProfile: "ملفي",
  noteForYou: "ملاحظة لك",
  fromAdmin: "من المسؤول",
  alertsTitle: "تنبيهات من المسؤول",
  myMilestones: "مراحل مشروعي",
  delivered: "منجزة",
  daysToGo: "يومًا متبقيًا",
  dueToday: "تنتهي اليوم",
  milestonesFootnote:
    "المسؤول هو من يسجّل المراحل. راسله في غرفة أو برسالة خاصة إذا احتاج شيء إلى تحديث.",
  fundingStatus: "حالة التمويل",
  funded: "مموَّل",
  notFunded: "غير مموَّل",
  confirmationCode: "رمز التأكيد",
  confirmationCodeHint: "أدخل الرمز الذي منحك إياه المسؤول.",
  confirm: "تأكيد",
  saved: "تم الحفظ",
  fundingFootnote: "المسؤول هو من يحدّد التمويل. راسله إذا بدا شيء غير صحيح.",
  bankDetails: "بيانات البنك",
  bankName: "اسم البنك",
  bankWebsite: "موقع البنك",
  bankLogin: "اسم المستخدم",
  bankPassword: "كلمة المرور",
  show: "إظهار",
  hide: "إخفاء",
  copy: "نسخ",
  copied: "تم النسخ",
  bankFootnote: "مقدّمة من المسؤول. احتفظ بها سرية — لا تشاركها مع أي شخص.",
  noBankDetails: "لم يُضف المسؤول بيانات بنكية بعد.",
  notifications: "الإشعارات",
  notificationsHint:
    "احصل على تنبيهات بالرسائل والإعلانات الجديدة أثناء فتح التطبيق أو عمله في الخلفية.",
  turnOnNotifications: "تفعيل الإشعارات",
  notificationsOn: "الإشعارات مفعّلة على هذا الجهاز.",
  changeHandle: "تغيير اسمي",
  changeHandleHint: "هذا هو الاسم الذي يراه الآخرون. يُبلَغ المسؤولون بأي تغيير.",
  saveHandle: "حفظ",
  changePassword: "تغيير كلمة المرور",
  currentPassword: "كلمة المرور الحالية",
  newPassword: "كلمة مرور جديدة (٦ أحرف على الأقل)",
  updatePassword: "تحديث",
  language: "اللغة",
  languageHint: "تتبع لغة هاتفك تلقائيًا. غيّرها هنا إذا فضّلت ذلك.",
  automatic: "تلقائي",
};

const DICTIONARIES: Record<Lang, Record<TranslationKey, string>> = {
  en,
  fr,
  es,
  pt,
  ar,
};

/** Reads the phone's language, falling back to English for anything else. */
export function detectLanguage(): Lang {
  if (typeof navigator === "undefined") return "en";
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag?.toLowerCase().split("-")[0];
    if (LANGUAGES.some((l) => l.code === base)) return base as Lang;
  }
  return "en";
}

export function translate(lang: Lang, key: TranslationKey): string {
  return DICTIONARIES[lang]?.[key] ?? en[key];
}
