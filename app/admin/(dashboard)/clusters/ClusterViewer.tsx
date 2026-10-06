'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Keyword } from '@/lib/types';

interface ClusterSummary {
  name: string;
  count: number;
  primaryCount: number;
  mergeCount: number;
  p1Count: number;
  p2Count: number;
  totalVolume: number;
  targetUrl: string;
  targetUrlId: string;
  keywords: Keyword[];
}

interface ClusterViewerProps {
  keywords: Keyword[];
}

export function ClusterViewer({ keywords }: ClusterViewerProps) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [q, setQ] = useState('');

  // Group keywords into clusters
  const clusterMap = new Map<string, Keyword[]>();
  for (const kw of keywords) {
    const cName = kw.cluster || 'General';
    const list = clusterMap.get(cName) || [];
    list.push(kw);
    clusterMap.set(cName, list);
  }

  const clusters: ClusterSummary[] = Array.from(clusterMap.entries()).map(([name, kws]) => {
    let primaryCount = 0;
    let mergeCount = 0;
    let p1Count = 0;
    let p2Count = 0;
    let totalVolume = 0;
    let targetUrl = '';
    let targetUrlId = '';

    for (const k of kws) {
      if (k.action === 'PRIMARY') primaryCount++;
      else mergeCount++;

      if (k.priority === 'P1') p1Count++;
      else p2Count++;

      totalVolume += k.volume || 0;
      if (!targetUrl && k.target_path) targetUrl = k.target_path;
      if (!targetUrlId && k.target_url_id) targetUrlId = k.target_url_id;
    }

    return {
      name,
      count: kws.length,
      primaryCount,
      mergeCount,
      p1Count,
      p2Count,
      totalVolume,
      targetUrl,
      targetUrlId,
      keywords: kws,
    };
  });

  // Filter clusters by search
  const filteredClusters = clusters.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.targetUrl.toLowerCase().includes(q.toLowerCase())
  );

  const activeClusterData = clusters.find((c) => c.name === selectedCluster);

  return (
    <div>
      {/* Search Bar */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Filter clusters (e.g. Mamá, Cumpleaños, Navidad)..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            minWidth: '320px',
            fontSize: '0.92rem',
          }}
        />
        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Total: <strong>{clusters.length} Clusters</strong> across {keywords.length} Master Keywords
        </span>
      </div>

      {/* Grid of Clusters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {filteredClusters.map((c) => (
          <div
            key={c.name}
            style={{
              background: '#ffffff',
              border: selectedCluster === c.name ? '2px solid #0284c7' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => setSelectedCluster(selectedCluster === c.name ? null : c.name)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {c.name}
              </h2>
              <span
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  padding: '3px 8px',
                  borderRadius: '999px',
                }}
              >
                {c.count} KWs
              </span>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Primary Target Route:
              </span>
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#0284c7', marginTop: '2px' }}>
                {c.targetUrl}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem', marginBottom: '16px', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Primary:</span> <strong>{c.primaryCount}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Merge:</span> <strong>{c.mergeCount}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Priority:</span> <strong>{c.p1Count} P1</strong> / {c.p2Count} P2
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Volumen:</span> <strong>~{(c.totalVolume / 1000).toFixed(0)}k/mo</strong>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 600 }}>
                {selectedCluster === c.name ? '▲ Close Details' : '▼ Inspect Keywords'}
              </span>
              <a
                href={c.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ fontSize: '0.82rem', color: '#64748b', textDecoration: 'none' }}
              >
                Open Live ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Active Cluster Details Drawer / Modal */}
      {activeClusterData && (
        <div className="admin-card" style={{ marginBottom: '40px', border: '2px solid #0284c7', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Cluster Details: {activeClusterData.name} ({activeClusterData.count} Keywords)
              </h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                Mapped to URL: <code style={{ color: '#0284c7' }}>{activeClusterData.targetUrl}</code> ({activeClusterData.targetUrlId})
              </p>
            </div>
            <button
              onClick={() => setSelectedCluster(null)}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              Close
            </button>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Primary Keyword</th>
                <th>Intent</th>
                <th>Action</th>
                <th>Target URL Path</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeClusterData.keywords.map((kw) => (
                <tr key={kw.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>
                    {kw.id}
                  </td>
                  <td>
                    <strong style={{ color: '#0f172a' }}>{kw.keyword}</strong>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                    {kw.intent}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: kw.action === 'PRIMARY' ? '#eff6ff' : '#f1f5f9',
                        color: kw.action === 'PRIMARY' ? '#1d4ed8' : '#64748b',
                      }}
                    >
                      {kw.action}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                    <a href={kw.target_path} target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', textDecoration: 'none' }}>
                      {kw.target_path}
                    </a>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: kw.priority === 'P1' ? '#fee2e2' : '#f1f5f9',
                        color: kw.priority === 'P1' ? '#991b1b' : '#475569',
                      }}
                    >
                      {kw.priority}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
                      {kw.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
