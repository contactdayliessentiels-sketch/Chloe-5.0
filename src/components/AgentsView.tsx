import React, { useState } from 'react';
import { AgentInfo, SkillConfig, MCPServerConfig } from '../../shared/types.ts';
import {
  Users,
  Search,
  Code2,
  FileText,
  Mail,
  UserCheck,
  Workflow,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  Server,
  Brain,
  Sliders,
  Check
} from 'lucide-react';

interface AgentsViewProps {
  agents: AgentInfo[];
  skills?: SkillConfig[];
  mcpServers?: MCPServerConfig[];
  onUpdateAgentAssignments?: (agentId: string, skillIds: string[], mcpServerIds: string[]) => Promise<any>;
}

const AGENT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  chloe_orchestrator: Users,
  search_agent: Search,
  dev_agent: Code2,
  docs_agent: FileText,
  comm_agent: Mail,
  personal_agent: UserCheck,
  automation_agent: Workflow,
  creative_agent: Sparkles,
  security_agent: ShieldCheck,
  quality_agent: CheckCircle2,
};

export const AgentsView: React.FC<AgentsViewProps> = ({
  agents,
  skills = [],
  mcpServers = [],
  onUpdateAgentAssignments,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [assignedSkills, setAssignedSkills] = useState<string[]>([]);
  const [assignedMCPs, setAssignedMCPs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleOpenConfig = (agent: AgentInfo) => {
    setSelectedAgent(agent);
    // Find skills assigned to this agent
    const matchingSkills = skills
      .filter(s => s.allowedAgents && s.allowedAgents.includes(agent.id))
      .map(s => s.id);
    setAssignedSkills(matchingSkills);

    // Find MCP servers assigned to this agent
    const matchingMCPs = mcpServers
      .filter(m => m.assignedAgents && m.assignedAgents.includes(agent.id))
      .map(m => m.id);
    setAssignedMCPs(matchingMCPs);
  };

  const handleSaveAssignments = async () => {
    if (!selectedAgent || !onUpdateAgentAssignments) return;
    setSaving(true);
    try {
      await onUpdateAgentAssignments(selectedAgent.id, assignedSkills, assignedMCPs);
      setSelectedAgent(null);
    } catch (e) {
      console.error('Failed to update agent assignments:', e);
      alert('Erreur lors de la sauvegarde des attributions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24 text-slate-100 font-sans">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Système Multi-Agents Intelligent
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950/70 text-purple-300 border border-purple-500/30 font-medium">
            {agents.length} Agents Spécialisés
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Attribuez dynamiquement des compétences et des serveurs MCP à chaque agent expert de CHLOÉ AI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {agents.map(agent => {
          const Icon = AGENT_ICONS[agent.id] || Users;
          const isActive = agent.status === 'active';
          const agentSkills = skills.filter(s => s.allowedAgents && s.allowedAgents.includes(agent.id));
          const agentMCPs = mcpServers.filter(m => m.assignedAgents && m.assignedAgents.includes(agent.id));

          return (
            <div
              key={agent.id}
              className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-[#0f1428] border-purple-900/50 shadow-md'
                  : 'bg-[#0b0e1c] border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-purple-600/30 border border-purple-500/40 text-purple-300'
                        : 'bg-slate-800/60 border border-slate-700/60 text-slate-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{agent.name}</h3>
                      <p className="text-[11px] text-purple-300 font-medium">{agent.role}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    isActive
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {isActive ? 'Actif' : 'En veille'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                  {agent.description}
                </p>

                {/* Assigned Skills & MCP Badges */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                      <Brain className="w-3 h-3 text-purple-400" />
                      Skills ({agentSkills.length}) :
                    </span>
                    {agentSkills.slice(0, 3).map(s => (
                      <span key={s.id} className="bg-purple-950/50 text-purple-300 px-1.5 py-0.2 rounded text-[10px] border border-purple-800/40">
                        {s.name}
                      </span>
                    ))}
                    {agentSkills.length > 3 && (
                      <span className="text-[10px] text-slate-500">+{agentSkills.length - 3}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                      <Server className="w-3 h-3 text-cyan-400" />
                      MCP ({agentMCPs.length}) :
                    </span>
                    {agentMCPs.slice(0, 2).map(m => (
                      <span key={m.id} className="bg-cyan-950/50 text-cyan-300 px-1.5 py-0.2 rounded text-[10px] border border-cyan-800/40">
                        {m.name}
                      </span>
                    ))}
                    {agentMCPs.length > 2 && (
                      <span className="text-[10px] text-slate-500">+{agentMCPs.length - 2}</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-purple-400">
                    <Cpu className="w-3.5 h-3.5" />
                    {agent.model}
                  </span>

                  <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">
                    {agent.executionCount} requêtes
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/50 flex justify-end">
                  <button
                    onClick={() => handleOpenConfig(agent)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs flex items-center gap-1 transition-colors"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Attributions & MCP</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ASSIGN SKILLS & MCP TO AGENT */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-[#0b0e1c] border border-purple-900/50 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-400" />
                  Attributions : {selectedAgent.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{selectedAgent.role}</p>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            {/* Skills selection */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 mb-1 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                Compétences (Skills) autorisées ({assignedSkills.length})
              </label>
              <div className="max-h-40 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                {skills.map(skill => {
                  const checked = assignedSkills.includes(skill.id);
                  return (
                    <div
                      key={skill.id}
                      onClick={() => {
                        setAssignedSkills(prev =>
                          checked ? prev.filter(x => x !== skill.id) : [...prev, skill.id]
                        );
                      }}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        checked
                          ? 'bg-purple-950/50 border-purple-500/50 text-white'
                          : 'bg-black/20 border-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-medium block truncate">{skill.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono block truncate">{skill.id}</span>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        checked ? 'bg-purple-600 border-purple-500' : 'border-slate-700 bg-slate-800'
                      }`}>
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MCP Servers selection */}
            <div>
              <label className="block text-xs font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" />
                Serveurs MCP autorisés ({assignedMCPs.length})
              </label>
              <div className="max-h-40 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                {mcpServers.length === 0 ? (
                  <div className="text-center py-3 text-xs text-slate-500">Aucun serveur MCP configuré.</div>
                ) : (
                  mcpServers.map(server => {
                    const checked = assignedMCPs.includes(server.id);
                    return (
                      <div
                        key={server.id}
                        onClick={() => {
                          setAssignedMCPs(prev =>
                            checked ? prev.filter(x => x !== server.id) : [...prev, server.id]
                          );
                        }}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          checked
                            ? 'bg-cyan-950/50 border-cyan-500/50 text-white'
                            : 'bg-black/20 border-slate-800/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-medium block truncate">{server.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono block truncate">{server.transport.toUpperCase()} · {server.tools?.length || 0} outil(s)</span>
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          checked ? 'bg-cyan-600 border-cyan-500' : 'border-slate-700 bg-slate-800'
                        }`}>
                          {checked && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveAssignments}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-all disabled:opacity-40"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer les attributions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
