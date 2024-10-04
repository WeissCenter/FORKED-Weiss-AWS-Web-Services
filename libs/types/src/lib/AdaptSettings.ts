export interface FooterLinks {
  label: string;
  url: string;
  external: boolean;
  target: 'newTab' | 'sameTab' | 'newWindow';
  icon?: string;
}

export interface AdaptSettings {
  logo: string;
  copyright: string;
  idleMinutes: number;
  warningMinutes: number;
  timeoutMinutes: number;
  footerLinks?: FooterLinks[];
}

export interface UpdateAdaptSettingsInput {
  logo?: string;
  copyright?: string;
  idleMinutes?: number;
  warningMinutes?: number;
  timeoutMinutes?: number;
  footerLinks?: FooterLinks[];
}
