"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Globe, KeyRound, Network, Terminal, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FlashProxyPlan } from "@/lib/plans/types";
import { normalizePlanProduct } from "@/lib/plans/presentation";
import type {
  ProxyConnectionInfoData,
  ProxyConnectionInfoItem,
} from "@/lib/proxies/types";

type ProxyConnectionHelperProps = {
  connectionInfo: ProxyConnectionInfoData | null;
  plan: FlashProxyPlan;
};

export function ProxyConnectionHelper({
  connectionInfo,
  plan,
}: ProxyConnectionHelperProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const connection = useMemo(
    () => buildConnectionDetails(plan, connectionInfo),
    [connectionInfo, plan]
  );

  async function handleCopy(key: string, value?: string | number | null) {
    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(String(value));
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? null : current));
    }, 1800);
  }

  return (
    <Card className="bg-card/86 shadow-[0_12px_34px_color-mix(in_oklch,var(--foreground)_5%,transparent)]">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Connection</CardTitle>
        <Button
          disabled={!connection.httpUrl}
          onClick={() => void handleCopy("http", connection.httpUrl)}
          size="sm"
          type="button"
          variant="outline"
        >
          {copiedKey === "http" ? (
            <Check className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}
          {copiedKey === "http" ? "Copied" : "Copy HTTP"}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-3 lg:grid-cols-2">
          <DetailCard
            action={
              <CopyButton
                copied={copiedKey === "username"}
                onClick={() => void handleCopy("username", plan.proxy_username)}
              />
            }
            icon={<User className="size-4 text-primary" />}
            label="Username"
            value={plan.proxy_username}
          />
          <DetailCard
            action={
              <CopyButton
                copied={copiedKey === "password"}
                onClick={() => void handleCopy("password", plan.proxy_password)}
              />
            }
            icon={<KeyRound className="size-4 text-primary" />}
            label="Password"
            value={maskSecret(plan.proxy_password)}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr]">
          <DetailCard
            action={
              <CopyButton
                copied={copiedKey === "host"}
                onClick={() => void handleCopy("host", connection.hostname)}
              />
            }
            icon={<Globe className="size-4 text-primary" />}
            label="Hostname"
            value={connection.hostname}
          />
          <DetailCard
            icon={<Network className="size-4 text-primary" />}
            label="HTTP port"
            value={formatNumber(connection.portHttp)}
          />
          <DetailCard
            icon={<Network className="size-4 text-primary" />}
            label="SOCKS port"
            value={formatNumber(connection.portSocks)}
          />
        </div>

        <div className="grid gap-3">
          <ConnectionString
            copied={copiedKey === "http-url"}
            label="HTTP"
            onCopy={() => void handleCopy("http-url", connection.httpUrl)}
            value={connection.httpUrl}
          />
          <ConnectionString
            copied={copiedKey === "socks-url"}
            label="SOCKS5"
            onCopy={() => void handleCopy("socks-url", connection.socksUrl)}
            value={connection.socksUrl}
          />
        </div>

        <Tabs defaultValue="curl">
          <TabsList>
            <TabsTrigger value="curl">curl</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="node">Node</TabsTrigger>
          </TabsList>
          <TabsContent value="curl">
            <CodeBlock
              copied={copiedKey === "curl"}
              onCopy={() => void handleCopy("curl", connection.examples.curl)}
              value={connection.examples.curl}
            />
          </TabsContent>
          <TabsContent value="python">
            <CodeBlock
              copied={copiedKey === "python"}
              onCopy={() => void handleCopy("python", connection.examples.python)}
              value={connection.examples.python}
            />
          </TabsContent>
          <TabsContent value="node">
            <CodeBlock
              copied={copiedKey === "node"}
              onCopy={() => void handleCopy("node", connection.examples.node)}
              value={connection.examples.node}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function DetailCard({
  action,
  icon,
  label,
  value,
}: {
  action?: React.ReactNode;
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-md border bg-background/56 px-3 py-2.5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="grid min-w-0 grid-cols-[32px_minmax(0,1fr)] items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-md border bg-background/70">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-0.5 truncate font-mono text-sm font-medium" title={value}>
              {value ?? "--"}
            </p>
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}

function CopyButton({
  copied,
  onClick,
}: {
  copied: boolean;
  onClick: () => void;
}) {
  return (
    <Button className="shrink-0" onClick={onClick} size="sm" type="button" variant="outline">
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
    </Button>
  );
}

function ConnectionString({
  copied,
  label,
  onCopy,
  value,
}: {
  copied: boolean;
  label: string;
  onCopy: () => void;
  value?: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border bg-background/56 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 truncate font-mono text-sm" title={value}>
          {value ?? "--"}
        </p>
      </div>
      <Button
        className="shrink-0"
        disabled={!value}
        onClick={onCopy}
        size="sm"
        type="button"
        variant="outline"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
      </Button>
    </div>
  );
}

function CodeBlock({
  copied,
  onCopy,
  value,
}: {
  copied: boolean;
  onCopy: () => void;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-background/56">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <Terminal className="size-4 text-muted-foreground" />
        <Button onClick={onCopy} size="sm" type="button" variant="outline">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="max-h-56 overflow-auto whitespace-pre p-3 text-xs leading-relaxed">
        <code>{value}</code>
      </pre>
    </div>
  );
}

function buildConnectionDetails(
  plan: FlashProxyPlan,
  connectionInfo: ProxyConnectionInfoData | null
) {
  const product = normalizePlanProduct(plan.product) ?? "";
  const reference = getProductConnectionInfo(connectionInfo, product);
  const hostname = plan.connection?.hostname ?? reference?.hostname;
  const portHttp = plan.connection?.port_http ?? reference?.port_http;
  const portSocks = plan.connection?.port_socks ?? reference?.port_socks;
  const username = plan.proxy_username;
  const password = plan.proxy_password;
  const auth = username && password ? `${username}:${password}` : undefined;
  const httpUrl =
    auth && hostname && portHttp
      ? `http://${auth}@${hostname}:${portHttp}`
      : plan.connection?.format;
  const socksUrl =
    auth && hostname && portSocks
      ? `socks5://${auth}@${hostname}:${portSocks}`
      : undefined;

  return {
    hostname,
    httpUrl,
    portHttp,
    portSocks,
    socksUrl,
    examples: {
      curl: httpUrl ? `curl -x "${httpUrl}" https://api.ipify.org` : "",
      python: httpUrl
        ? `import requests\n\nproxies = {\n    "http": "${httpUrl}",\n    "https": "${httpUrl}",\n}\n\nresponse = requests.get("https://api.ipify.org", proxies=proxies, timeout=30)\nprint(response.text)`
        : "",
      node:
        hostname && portHttp && username && password
          ? `import axios from "axios";\n\nconst response = await axios.get("https://api.ipify.org", {\n  proxy: {\n    protocol: "http",\n    host: "${hostname}",\n    port: ${portHttp},\n    auth: {\n      username: "${username}",\n      password: "${password}",\n    },\n  },\n});\n\nconsole.log(response.data);`
          : "",
    },
  };
}

function getProductConnectionInfo(
  data: ProxyConnectionInfoData | null,
  product: string
): ProxyConnectionInfoItem | undefined {
  if (!data) {
    return undefined;
  }

  return (
    data[product] ??
    data[product.replaceAll("_", "-")] ??
    data[product.replaceAll("-", "_")]
  );
}

function formatNumber(value?: number | null) {
  return typeof value === "number" ? String(value) : "--";
}

function maskSecret(value?: string | null) {
  if (!value) {
    return "--";
  }

  return "••••••••••••";
}
