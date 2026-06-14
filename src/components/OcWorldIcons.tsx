import type { CSSProperties, ReactNode } from "react";

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
};

function Icon({
  children,
  size = 16,
  color = "currentColor",
  strokeWidth = 1.6,
  style,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: IconProps) => (
  <Icon {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10.5V20h14v-9.5" /><path d="M10 20v-5h4v5" /></Icon>
);

export const IconAgent = (p: IconProps) => (
  <Icon {...p}><polyline points="4 7 9 12 4 17" /><line x1="12" y1="17" x2="20" y2="17" /></Icon>
);

export const IconRewind = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></Icon>
);

export const IconTasks = (p: IconProps) => (
  <Icon {...p}><line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></Icon>
);

export const IconSidebar = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="9" y1="4" x2="9" y2="20" /></Icon>
);

export const IconSearch = (p: IconProps) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.5" y2="16.5" /></Icon>
);

export const IconFolder = (p: IconProps) => (
  <Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Icon>
);

export const IconPlus = (p: IconProps) => (
  <Icon {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon>
);

export const IconChevron = (p: IconProps) => (
  <Icon {...p}><polyline points="9 6 15 12 9 18" /></Icon>
);

export const IconSparkle = (p: IconProps) => (
  <Icon {...p}><path d="M12 3l1.8 5 5 1.8-5 1.8L12 17l-1.8-5.4-5-1.8 5-1.8z" /><path d="M19 4l.6 1.6L21 6l-1.4.4L19 8l-.6-1.6L17 6l1.4-.4z" /></Icon>
);

export const IconAttach = (p: IconProps) => (
  <Icon {...p}><path d="M21 11.5 13 19.5a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7-7" /></Icon>
);

export const IconCloud = (p: IconProps) => (
  <Icon {...p}><path d="M7 18h11a4 4 0 0 0 .8-7.9 6 6 0 0 0-11.6-.6A4.5 4.5 0 0 0 7 18z" /></Icon>
);

export const IconBars = (p: IconProps) => (
  <Icon {...p}><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></Icon>
);

export const IconArrowUp = (p: IconProps) => (
  <Icon {...p}><line x1="12" y1="19" x2="12" y2="5" /><polyline points="6 11 12 5 18 11" /></Icon>
);

export const IconBolt = (p: IconProps) => (
  <Icon {...p}><polygon points="13 2 4 14 11 14 10 22 20 10 13 10" /></Icon>
);

export const IconRefresh = (p: IconProps) => (
  <Icon {...p}><polyline points="3 9 3 4 8 4" /><path d="M3 9a8 8 0 0 1 14-3l3 3" /><polyline points="21 15 21 20 16 20" /><path d="M21 15a8 8 0 0 1-14 3l-3-3" /></Icon>
);

export const IconBook = (p: IconProps) => (
  <Icon {...p}><path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /></Icon>
);

export const IconChart = (p: IconProps) => (
  <Icon {...p}><line x1="4" y1="20" x2="20" y2="20" /><rect x="6" y="11" width="3" height="7" /><rect x="11" y="6" width="3" height="12" /><rect x="16" y="14" width="3" height="4" /></Icon>
);

export const IconCompass = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><polygon points="14.5 9.5 9 14.5 9.5 14.5 14.5 9.5 14.5 14.5 9.5 9.5" /></Icon>
);

export const IconUnblock = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><line x1="6.5" y1="6.5" x2="17.5" y2="17.5" /></Icon>
);

export const IconReport = (p: IconProps) => (
  <Icon {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" /></Icon>
);

export const IconCamera = (p: IconProps) => (
  <Icon {...p}><path d="M3 8h4l2-3h6l2 3h4v11H3z" /><circle cx="12" cy="13" r="3.5" /></Icon>
);

export const IconGift = (p: IconProps) => (
  <Icon {...p}><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H8a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4a2.5 2.5 0 0 0 0-5c-3 0-4 5-4 5z" /></Icon>
);

export const IconChat = (p: IconProps) => (
  <Icon {...p}><path d="M4 5h16v11H8l-4 4z" /></Icon>
);

export const IconClose = (p: IconProps) => (
  <Icon {...p}><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></Icon>
);

export const IconCheck = (p: IconProps) => (
  <Icon {...p}><polyline points="4 12 10 18 20 6" /></Icon>
);

export const IconSettings = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></Icon>
);

export const IconMic = (p: IconProps) => (
  <Icon {...p}><rect x="9" y="2" width="6" height="10" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><line x1="12" y1="17" x2="12" y2="22" /></Icon>
);

export const IconSave = (p: IconProps) => (
  <Icon {...p}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><polyline points="11 2 15 6 11 10" /></Icon>
);

export const IconGlobe = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M3.6 9h14.8M3.6 15h14.8M8.5 3a15 15 0 0 1 0 18M15.5 3a15 15 0 0 0 0 18" /></Icon>
);
