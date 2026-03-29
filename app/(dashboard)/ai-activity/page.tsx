'use client';

import { useState, useEffect, useCallback } from 'react';
import { BrainCircuit, Activity, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface AgentOutput {
  id: string;
  agentType: string;
  outputJson: string;
  inputSnapshotJson: string;
  confidenceScore: number;
  createdAt: string;
}

interface AuditLog {
  id: string;
  actionType: string;
  entityType: string;
  afterStateJson: string;
  timestamp: string;
}

export default function AIActivityPage() {
  const { token } = useAuth();
  const [agentOutputs, setAgentOutputs] = useState<AgentOutput[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/ai-activity', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAgentOutputs(data.agentOutputs || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (error) {
      console.error('Failed to fetch AI activity:', error);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchActivity();
    }
  }, [token, fetchActivity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Combine and sort logs
  const combinedLogs = [
    ...agentOutputs.map(output => ({
      id: output.id,
      type: 'agent_output',
      agent: output.agentType,
      data: JSON.parse(output.outputJson || '{}'),
      input: JSON.parse(output.inputSnapshotJson || '{}'),
      timestamp: new Date(output.createdAt),
      score: output.confidenceScore
    })),
    ...auditLogs.map(log => ({
      id: log.id,
      type: 'audit_log',
      action: log.actionType,
      entity: log.entityType,
      data: JSON.parse(log.afterStateJson || '{}'),
      timestamp: new Date(log.timestamp)
    }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Determine agent status based on recent activity
  const isAgentActive = (agentName: string) => {
    return combinedLogs.some(log => 
      (log.type === 'agent_output' && ('agent' in log && log.agent === agentName) && (new Date().getTime() - log.timestamp.getTime() < 3600000))
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-headline font-bold tracking-tight text-on-surface">Agent Activity Logs</h2>
          <p className="text-on-surface-variant font-body mt-1">Real-time monitoring of AI orchestration and decisions.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-medium hover:bg-surface-container-highest transition-all flex items-center gap-2">
            <Activity className="w-4 h-4" /> System Health
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Agents Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5">
            <h3 className="text-sm font-bold text-outline uppercase tracking-widest mb-6">Agent Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface-container-high rounded-lg border border-outline-variant/10">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isAgentActive('background_insight') ? 'bg-secondary animate-pulse' : 'bg-tertiary'}`}></div>
                  <span className="text-sm font-bold text-on-surface">Background Insight</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${isAgentActive('background_insight') ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
                  {isAgentActive('background_insight') ? 'Active' : 'Idle'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-container-high rounded-lg border border-outline-variant/10">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isAgentActive('smart_upload') ? 'bg-secondary animate-pulse' : 'bg-tertiary'}`}></div>
                  <span className="text-sm font-bold text-on-surface">Smart Upload Mapper</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${isAgentActive('smart_upload') ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
                  {isAgentActive('smart_upload') ? 'Active' : 'Idle'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-container-high rounded-lg border border-outline-variant/10">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isAgentActive('chat_coordinator') ? 'bg-secondary animate-pulse' : 'bg-tertiary'}`}></div>
                  <span className="text-sm font-bold text-on-surface">Chat Coordinator</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${isAgentActive('chat_coordinator') ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
                  {isAgentActive('chat_coordinator') ? 'Active' : 'Idle'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-primary/10 to-primary-container/10 p-6 rounded-xl border border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <BrainCircuit className="w-6 h-6 text-primary" />
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Compute Metrics</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-variant">AI Tasks Completed</span>
                <span className="text-sm font-mono font-bold text-on-surface">{combinedLogs.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-variant">Avg Confidence</span>
                <span className="text-sm font-mono font-bold text-on-surface">
                  {agentOutputs.length > 0 
                    ? `${Math.round((agentOutputs.reduce((acc, curr) => acc + curr.confidenceScore, 0) / agentOutputs.length) * 100)}%` 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Activity Log */}
        <div className="lg:col-span-2 bg-surface-container-low rounded-xl border border-outline-variant/5 flex flex-col h-[600px]">
          <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
            <h3 className="text-lg font-bold font-headline">Live Execution Trace</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Streaming</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {combinedLogs.length === 0 ? (
              <div className="text-center text-on-surface-variant py-12">
                <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No AI activity recorded yet.</p>
              </div>
            ) : (
              combinedLogs.map((log, index) => {
                const isLast = index === combinedLogs.length - 1;
                
                if (log.type === 'agent_output' && 'agent' in log) {
                  return (
                    <div key={log.id} className={`relative pl-6 ${isLast ? 'border-l-2 border-transparent' : 'border-l-2 border-outline-variant/20 pb-6'}`}>
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-surface-container-highest border-2 border-secondary flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-secondary" />
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded uppercase font-bold tracking-wider mr-2">Task Complete</span>
                          <span className="text-xs font-bold text-on-surface-variant">{log.agent}</span>
                        </div>
                        <span className="text-[10px] font-mono text-outline">{log.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-on-surface font-medium mb-2">
                        {log.data.title || `Generated output for ${log.agent}`}
                      </p>
                      <div className="p-3 bg-surface-container-highest rounded-lg border border-outline-variant/10">
                        <p className="text-xs font-mono text-on-surface-variant leading-relaxed">
                          {log.data.message || JSON.stringify(log.data, null, 2)}
                        </p>
                        {log.data.recommendedOrders && (
                          <div className="mt-2 text-xs font-mono text-secondary">
                            Generated {log.data.recommendedOrders.length} purchase order recommendations.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } else if ('action' in log) {
                  // Audit Log
                  return (
                    <div key={log.id} className={`relative pl-6 ${isLast ? 'border-l-2 border-transparent' : 'border-l-2 border-outline-variant/20 pb-6'}`}>
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-surface-container-highest border-2 border-tertiary flex items-center justify-center">
                        <Activity className="w-3 h-3 text-tertiary" />
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] px-2 py-0.5 bg-tertiary/10 text-tertiary rounded uppercase font-bold tracking-wider mr-2">System Action</span>
                          <span className="text-xs font-bold text-on-surface-variant">{log.action}</span>
                        </div>
                        <span className="text-[10px] font-mono text-outline">{log.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-on-surface font-medium mb-2">
                        Action performed on {log.entity}.
                      </p>
                      <div className="p-3 bg-surface-container-highest rounded-lg border border-outline-variant/10">
                        <pre className="text-xs font-mono text-on-surface-variant leading-relaxed overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  );
                }
                return null;
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
