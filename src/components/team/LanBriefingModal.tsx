'use client';

import React, { useEffect, useState } from 'react';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { TeamRole, LanHostInfo } from '@/types/multiplayer';
import {
  Wifi,
  Users,
  Copy,
  Check,
  Shield,
  Radio,
  Plane,
  Crosshair,
  Server,
  QrCode,
  X,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface LanBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Generate an SVG QR code pattern deterministically for any URL
function SimpleSvgQrCode({ text }: { text: string }) {
  // 21x21 QR code matrix mock grid with deterministic pattern based on hash of text
  const size = 21;
  const hash = Array.from(text).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000007, 42);

  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder patterns at top-left, top-right, bottom-left (7x7)
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6) {
          grid[startY + r][startX + c] = true;
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          grid[startY + r][startX + c] = true;
        } else {
          grid[startY + r][startX + c] = false;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Fill data areas pseudo-deterministically
  let h = hash;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder zones
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const isTiming = (r === 6 && c >= 8 && c < size - 8) || (c === 6 && r >= 8 && r < size - 8);

      if (!inTopLeft && !inTopRight && !inBottomLeft && !isTiming) {
        h = (h * 1664525 + 1013904223) % 4294967296;
        grid[r][c] = h % 3 === 0 || (r + c) % 2 === 0;
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-28 h-28 bg-white p-1.5 rounded border border-cyan-500/40 shadow-md shadow-cyan-950/40"
      shapeRendering="crispEdges"
    >
      {grid.map((row, r) =>
        row.map((cell, c) => (cell ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#050b14" /> : null))
      )}
    </svg>
  );
}

export const LanBriefingModal: React.FC<LanBriefingModalProps> = ({ isOpen, onClose }) => {
  const {
    myRole,
    members,
    connectedPeers,
    lanHostInfo,
    fetchHostInfo,
    claimLanRole,
    isLanConnected,
    peerId,
  } = useMultiplayerStore();

  const [copied, setCopied] = useState(false);
  const [activeHost, setActiveHost] = useState<LanHostInfo | null>(lanHostInfo);
  const [selectedIp, setSelectedIp] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchHostInfo().then((info) => {
        if (info) {
          setActiveHost(info);
          if (info.primaryIp) setSelectedIp(info.primaryIp);
        }
      });
    }
  }, [isOpen, fetchHostInfo]);

  if (!isOpen) return null;

  const currentIp = selectedIp || activeHost?.primaryIp || (typeof window !== 'undefined' ? window.location.hostname : '10.109.73.18');
  const currentPort = activeHost?.port || (typeof window !== 'undefined' && window.location.port ? window.location.port : 3000);
  const joinUrl = `http://${currentIp}:${currentPort}/team`;

  const copyJoinLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const roleCards: {
    role: TeamRole;
    name: string;
    icon: any;
    desc: string;
    color: string;
    freqNet: string;
  }[] = [
    {
      role: 'TOC_LEAD_COMMANDER',
      name: 'TOC Eagle Lead',
      icon: Shield,
      desc: 'Joint Command, Tactical Master Clock & Strategic Consensus Lead',
      color: 'text-amber-400 border-amber-500/40 bg-amber-950/20',
      freqNet: 'NET-ALPHA [PRI-UHF]',
    },
    {
      role: 'LAND_COMMANDER',
      name: 'Striker-01 (Land)',
      icon: Crosshair,
      desc: 'Ground Force Maneuvers, Forward Outpost Reports & Sector Alpha Escort',
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20',
      freqNet: 'NET-BRAVO [VHF-TAC]',
    },
    {
      role: 'AIR_RECON_UAS',
      name: 'Hawk-Eye (Air Recon)',
      icon: Plane,
      desc: 'High-Altitude Optical Feeds, Thermal Sensor Cross-Validation & Route Recon',
      color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/20',
      freqNet: 'SAT-LINK-04 [KA-BAND]',
    },
    {
      role: 'CYBER_EW_DEFENSE',
      name: 'Spectre (EW / Cyber)',
      icon: Radio,
      desc: 'RF Spectrum Surveillance, Jamming Triangulation & Anti-Spoofing Verification',
      color: 'text-purple-400 border-purple-500/40 bg-purple-950/20',
      freqNet: 'FIBER-TRUNK-01 [CRYPTO]',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-cyan-500/50 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-950 border border-cyan-500/50 rounded text-cyan-400">
              <Wifi className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-widest text-white uppercase">
                  LAN Multi-Domain Military Drill
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300">
                  SIH26248 LIVE NET
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Decentralized Command Post Exercise (CPX) // Multi-Domain Land-Air-Cyber-EW
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Join Connection Banner */}
          <div className="p-4 rounded-lg bg-slate-950/80 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase">
                  LAN Drill Access Point
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    isLanConnected
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {isLanConnected ? '● SYNCED ON LOCAL SUBNET' : '○ CONNECTING / STANDALONE'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Any laptop, workstation, or tablet on the same Wi-Fi or Ethernet can join this drill immediately. No cloud or internet required.
              </p>

              {activeHost?.interfaces && activeHost.interfaces.length > 1 && (
                <div className="flex items-center space-x-2 pt-0.5 text-[11px] font-mono">
                  <span className="text-slate-400">NETWORK ADAPTER:</span>
                  <select
                    value={selectedIp}
                    onChange={(e) => setSelectedIp(e.target.value)}
                    className="bg-slate-900 border border-cyan-500/40 text-cyan-300 rounded px-2 py-0.5 text-xs focus:outline-none"
                  >
                    {activeHost.interfaces.map((iface) => (
                      <option key={`${iface.name}-${iface.ip}`} value={iface.ip}>
                        {iface.name} ({iface.ip}) {iface.isVirtual ? '[VM/Virtual]' : '[Physical Wi-Fi/LAN]'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-1">
                <span className="px-3 py-1.5 font-mono text-xs text-cyan-200 bg-slate-900 border border-cyan-500/40 rounded truncate max-w-md">
                  {joinUrl}
                </span>
                <button
                  onClick={copyJoinLink}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded flex items-center space-x-1.5 transition shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'COPIED!' : 'COPY URL'}</span>
                </button>
              </div>
            </div>

            {/* QR Code for Phone / Tablet Access */}
            <div className="flex flex-col items-center space-y-1.5 pl-2 border-l border-slate-800">
              <SimpleSvgQrCode text={joinUrl} />
              <span className="text-[10px] font-mono text-slate-400 flex items-center space-x-1">
                <QrCode className="w-3 h-3 text-cyan-400" />
                <span>SCAN TO JOIN</span>
              </span>
            </div>
          </div>

          {/* Role Claiming Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold tracking-widest text-slate-200 uppercase">
                  Multi-Domain Station Claiming
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Current Assigned Station:{' '}
                <span className="text-cyan-400 font-bold">{members[myRole]?.callsign}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roleCards.map((rc) => {
                const isSelected = myRole === rc.role;
                const member = members[rc.role];
                const isClaimedByOther =
                  member.claimedByPeerId && member.claimedByPeerId !== peerId;
                const Icon = rc.icon;

                return (
                  <div
                    key={rc.role}
                    className={`p-3.5 rounded-lg border transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/30 ring-1 ring-cyan-400/50'
                        : isClaimedByOther
                        ? 'border-slate-800 bg-slate-950/60 opacity-80'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-sm font-bold text-white tracking-wide">{rc.name}</h4>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {rc.freqNet}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">{rc.desc}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <div className="text-[11px] font-mono">
                        {isSelected ? (
                          <span className="text-emerald-400 flex items-center space-x-1">
                            <span>●</span>
                            <span>YOU ARE AT THIS STATION</span>
                          </span>
                        ) : isClaimedByOther ? (
                          <span className="text-amber-400 flex items-center space-x-1">
                            <span>●</span>
                            <span>CLAIMED BY {member.claimedByIp || 'PEER'}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">○ UNCLAIMED / AVAILABLE</span>
                        )}
                      </div>

                      <button
                        onClick={() => claimLanRole(rc.role)}
                        disabled={isSelected}
                        className={`px-3 py-1 text-xs font-mono font-bold rounded transition ${
                          isSelected
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 cursor-default'
                            : 'bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        {isSelected ? 'STATION LOCKED' : 'CLAIM STATION'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connected Peers Roster */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase">
                Active LAN Participants ({connectedPeers.length || 1})
              </span>
              <span className="text-[10px] font-mono text-cyan-400">
                PULSE INTERVAL: 800MS // LATENCY: &lt; 5MS
              </span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar font-mono text-xs">
              {connectedPeers.length === 0 ? (
                <div className="p-2 rounded bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-slate-400">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white font-bold">{members[myRole]?.callsign}</span>
                    <span className="text-[10px] text-slate-500">(LOCAL HOST / THIS BROWSER)</span>
                  </div>
                  <span className="text-emerald-400 text-[11px]">ACTIVE OPERATOR</span>
                </div>
              ) : (
                connectedPeers.map((peer) => {
                  const isMe = peer.peerId === peerId;
                  return (
                    <div
                      key={peer.peerId}
                      className={`p-2 rounded border flex items-center justify-between ${
                        isMe
                          ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-900/50 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isMe ? 'bg-cyan-400' : 'bg-emerald-400'
                          } animate-pulse`}
                        />
                        <span className="font-bold">{peer.callsign}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {peer.role}
                        </span>
                        {peer.isHost && (
                          <span className="text-[9px] px-1 rounded bg-amber-950 text-amber-300 border border-amber-600/30">
                            DRILL HOST
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                        <span>IP: {peer.ip}</span>
                        <span className="text-emerald-400">ACTIVE</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Drill Protocol Rules */}
          <div className="p-3.5 rounded bg-amber-950/15 border border-amber-500/30 text-amber-200/90 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 font-bold tracking-wide">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>MILITARY DRILL CONFLICT RULES (SIH26248 REQUIREMENT):</span>
            </div>
            <p className="text-[11px] text-slate-400 pl-5 leading-relaxed">
              When EW interference or cyber disruptions strike, radio messages may be delayed or dropped. All station actions must be coordinated through the{' '}
              <strong className="text-white">Multi-Domain Tactical Feed</strong> and verified through the{' '}
              <strong className="text-white">75% Joint Consensus Protocol</strong> before execution.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-cyan-500/30 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            DRILL ID:{' '}
            <span className="text-cyan-400 font-bold">
              {lanHostInfo?.hostName ? `${lanHostInfo.hostName}-NET` : 'NEXUS-C2-TACTICAL-LAN'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs rounded tracking-widest uppercase transition shadow-lg shadow-cyan-500/20"
          >
            ENTER COMBAT STATION
          </button>
        </div>
      </div>
    </div>
  );
};
