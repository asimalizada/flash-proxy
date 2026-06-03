export type ProxyConnectionInfoItem = {
  hostname?: string;
  port_http?: number;
  port_socks?: number | null;
  format?: string;
  targeting?: string;
};

export type ProxyConnectionInfoData = Record<string, ProxyConnectionInfoItem>;
