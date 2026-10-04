import { CommunicationChannel } from '@/types/communication';

export function calculateLatencyFactor(latencyMs: number): number {
  if (latencyMs < 100) return 1.00;
  if (latencyMs < 300) return 0.90;
  if (latencyMs < 600) return 0.75;
  if (latencyMs < 1000) return 0.60;
  if (latencyMs < 2000) return 0.40;
  return 0.20;
}

export function calculateChannelQuality(channel: Pick<CommunicationChannel, 'availability' | 'packetLoss' | 'latencyMs' | 'bandwidthFactor'>): number {
  const lf = calculateLatencyFactor(channel.latencyMs);
  const effectiveAvailability = Math.max(0, Math.min(1, channel.availability));
  const effectivePacketLoss = Math.max(0, Math.min(1, channel.packetLoss));
  const effectiveBandwidth = Math.max(0, Math.min(1, channel.bandwidthFactor));

  const q = effectiveAvailability * (1 - effectivePacketLoss) * lf * effectiveBandwidth;
  return Math.max(0, Math.min(1, parseFloat(q.toFixed(4))));
}

export function calculateAggregateCommHealth(channels: Record<string, CommunicationChannel>): number {
  const channelList = Object.values(channels);
  if (channelList.length === 0) return 1.0;
  const sum = channelList.reduce((acc, ch) => acc + ch.channelQuality, 0);
  return Math.max(0, Math.min(1, parseFloat((sum / channelList.length).toFixed(4))));
}
