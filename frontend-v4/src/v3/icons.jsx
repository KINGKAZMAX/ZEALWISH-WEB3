// Stroke-based icons matching the reference's lucide-like style.
// All accept size + color via props. 1.5px stroke by default.

const Icon = ({ children, size = 16, color = 'currentColor', strokeWidth = 1.6, style = {} }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0, ...style }}
  >
    {children}
  </svg>
);

const IconHome = (p) => <Icon {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5"/><path d="M10 20v-5h4v5"/></Icon>;
const IconAgent = (p) => <Icon {...p}><polyline points="4 7 9 12 4 17"/><line x1="12" y1="17" x2="20" y2="17"/></Icon>;
const IconRewind = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></Icon>;
const IconTasks = (p) => <Icon {...p}><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></Icon>;
const IconSidebar = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/></Icon>;
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.5" y2="16.5"/></Icon>;
const IconFolder = (p) => <Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></Icon>;
const IconPlus = (p) => <Icon {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>;
const IconChevron = (p) => <Icon {...p}><polyline points="9 6 15 12 9 18"/></Icon>;
const IconSparkle = (p) => <Icon {...p}><path d="M12 3l1.8 5 5 1.8-5 1.8L12 17l-1.8-5.4-5-1.8 5-1.8z"/><path d="M19 4l.6 1.6L21 6l-1.4.4L19 8l-.6-1.6L17 6l1.4-.4z"/></Icon>;
const IconAttach = (p) => <Icon {...p}><path d="M21 11.5 13 19.5a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7-7"/></Icon>;
const IconCloud = (p) => <Icon {...p}><path d="M7 18h11a4 4 0 0 0 .8-7.9 6 6 0 0 0-11.6-.6A4.5 4.5 0 0 0 7 18z"/></Icon>;
const IconBars = (p) => <Icon {...p}><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></Icon>;
const IconArrowUp = (p) => <Icon {...p}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="6 11 12 5 18 11"/></Icon>;
const IconBolt = (p) => <Icon {...p}><polygon points="13 2 4 14 11 14 10 22 20 10 13 10"/></Icon>;
const IconRefresh = (p) => <Icon {...p}><polyline points="3 9 3 4 8 4"/><path d="M3 9a8 8 0 0 1 14-3l3 3"/><polyline points="21 15 21 20 16 20"/><path d="M21 15a8 8 0 0 1-14 3l-3-3"/></Icon>;
const IconBook = (p) => <Icon {...p}><path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></Icon>;
const IconChart = (p) => <Icon {...p}><line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="11" width="3" height="7"/><rect x="11" y="6" width="3" height="12"/><rect x="16" y="14" width="3" height="4"/></Icon>;
const IconCompass = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><polygon points="14.5 9.5 9 14.5 9.5 14.5 14.5 9.5 14.5 14.5 9.5 9.5"/></Icon>;
const IconUnblock = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><line x1="6.5" y1="6.5" x2="17.5" y2="17.5"/></Icon>;
const IconReport = (p) => <Icon {...p}><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></Icon>;
const IconCamera = (p) => <Icon {...p}><path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/></Icon>;
const IconGift = (p) => <Icon {...p}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H8a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4a2.5 2.5 0 0 0 0-5c-3 0-4 5-4 5z"/></Icon>;
const IconChat = (p) => <Icon {...p}><path d="M4 5h16v11H8l-4 4z"/></Icon>;
const IconClose = (p) => <Icon {...p}><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></Icon>;
const IconCheck = (p) => <Icon {...p}><polyline points="4 12 10 18 20 6"/></Icon>;

Object.assign(window, {
  Icon, IconHome, IconAgent, IconRewind, IconTasks, IconSidebar,
  IconSearch, IconFolder, IconPlus, IconChevron, IconSparkle,
  IconAttach, IconCloud, IconBars, IconArrowUp, IconBolt, IconRefresh,
  IconBook, IconChart, IconCompass, IconUnblock, IconReport, IconCamera,
  IconGift, IconChat, IconClose, IconCheck,
});
