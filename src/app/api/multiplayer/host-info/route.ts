import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET() {
  const interfaces = os.networkInterfaces();
  
  interface AdapterInfo {
    name: string;
    ip: string;
    isVirtual: boolean;
    isWifi: boolean;
    priority: number;
  }

  const detectedAdapters: AdapterInfo[] = [];

  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (!netList) continue;

    const lowerName = name.toLowerCase();
    const isVirtual =
      lowerName.includes('vmware') ||
      lowerName.includes('virtual') ||
      lowerName.includes('vbox') ||
      lowerName.includes('vethernet') ||
      lowerName.includes('wsl') ||
      lowerName.includes('hyper-v') ||
      lowerName.includes('tap') ||
      lowerName.includes('tun') ||
      lowerName.includes('docker') ||
      lowerName.includes('loopback');

    const isWifi =
      lowerName.includes('wi-fi') ||
      lowerName.includes('wifi') ||
      lowerName.includes('wireless') ||
      lowerName.includes('wlan') ||
      lowerName.includes('802.11');

    for (const net of netList) {
      if (net.family === 'IPv4' && !net.internal) {
        // Priority ranking:
        // 1. Real Wi-Fi (Priority 10)
        // 2. Real physical Ethernet (Priority 5)
        // 3. Virtual adapters (Priority 0)
        let priority = 5;
        if (isVirtual) {
          priority = 0;
        } else if (isWifi) {
          priority = 10;
        }

        detectedAdapters.push({
          name,
          ip: net.address,
          isVirtual,
          isWifi,
          priority,
        });
      }
    }
  }

  // Sort adapters highest priority first
  detectedAdapters.sort((a, b) => b.priority - a.priority);

  const primaryIp = detectedAdapters[0]?.ip || '127.0.0.1';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const joinUrl = `http://${primaryIp}:${port}/team`;

  return NextResponse.json({
    hostIps: detectedAdapters.map((a) => a.ip),
    primaryIp,
    port,
    joinUrl,
    hostName: os.hostname() || 'NEXUS-C2-TOC',
    interfaces: detectedAdapters.map((a) => ({
      name: a.name,
      ip: a.ip,
      isVirtual: a.isVirtual,
    })),
  });
}
