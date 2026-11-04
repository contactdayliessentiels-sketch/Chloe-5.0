import React, { useState, useEffect } from 'react';
import { MCPServerConfig, MCPToolInfo, MCPCallLog, AgentInfo, AgentId } from '../../shared/types.ts';
import {
  Server,
  Plus,
  Play,
  RotateCw,
  Power,
  Trash2,
  Edit,
  Code2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileJson,
  Sparkles,
  Layers,
  Search,
  ExternalLink,
  Shield,
  Send,
  Sliders,
  Terminal,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface MCPViewProps {
  servers: MCPServerConfig[];
  onAddServer: (server: Partial<MCPServerConfig>) => Promise<MCPServerConfig>;
  onUpdateServer: (id: string, updates: Partial<MCPServerConfig>) => Promise<MCPServerConfig>;
  onDeleteServer: (id: string) => Promise<void>;
  onToggleServer: (id: string, enabled: boolean) => Promise<MCPServerConfig>;
  onToggleTool: (serverId: string, toolName: string, enabled: boolean) => Promise<MCPServerConfig>;
  onDiscoverServer: (id: string) => Promise<{ success: boolean; message: string; toolsCount: number }>;
  onCallTool: (serverId: string, toolName: string, args: Record<string, any>) => Promise<any>;
  agents: AgentInfo[];
}

export const MCPView: React.FC<MCPViewProps> = ({
  servers,
  onAddServer,
  onUpdateServer,
  onDeleteServer,
  onToggleServer,
  onToggleTool,
  onDiscoverServer,
  onCallTool,
  agents,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTransport, setFilterTransport] = useState<string>('all');
  const [expandedServerId, setExpandedServerId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServerConfig | null>(null);
  const [testingServerId, setTestingServerId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

  // Tool Execution State
  const [executingTool, setExecutingTool] = useState<{ serverId: string; toolName: string } | null>(null);
  const [toolArgsJson, setToolArgsJson] = useState<string>('{}');
  const [execResult, setExecResult] = useState<{ success: boolean; data: any; durationMs: number } | null>(null);
  const [executingLoading, setExecutingLoading] = useState(false);

  // Logs Modal
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logs, setLogs] = useState<MCPCallLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formId, setFormId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTransport, setFormTransport] = useState<'http' | 'sse' | 'streamable_http' | 'streamable-http' | 'stdio'>('http');
  const [formUrl, setFormUrl] = useState('');
  const [formCommand, setFormCommand] = useState('');
  const [formArgs, setFormArgs] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formHeaders, setFormHeaders] = useState<string>('{}');
  const [formAssignedAgents, setFormAssignedAgents] = useState<AgentId[]>(['chloe_orchestrator', 'dev_agent']);
  const [jsonConfigInput, setJsonConfigInput] = useState('');
  const [jsonImportError, setJsonImportError] = useState('');

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/mcp/logs').then(r => r.json());
      setLogs(res || []);
    } catch (e) {
      console.error('Failed to load MCP logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingServer(null);
    setFormName('');
    setFormId('');
    setFormDescription('');
    setFormTransport('http');
    setFormUrl('https://api.github.com');
    setFormCommand('');
    setFormArgs('');
    setFormApiKey('');
    setFormHeaders('{}');
    setFormAssignedAgents(['chloe_orchestrator', 'dev_agent']);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (server: MCPServerConfig) => {
    setEditingServer(server);
    setFormName(server.name);
    setFormId(server.id);
    setFormDescription(server.description);
    setFormTransport(server.transport);
    setFormUrl(server.url || '');
    setFormCommand(server.command || '');
    setFormArgs((server.args || []).join(' '));
    setFormApiKey(server.apiKey || '');
    setFormHeaders(JSON.stringify(server.headers || {}, null, 2));
    setFormAssignedAgents(server.assignedAgents || []);
    setIsModalOpen(true);
  };

  const handleSaveServer = async (e: React.FormEvent) => {
    e.preventDefault();
    let parsedHeaders = {};
    try {
      parsedHeaders = formHeaders.trim() ? JSON.parse(formHeaders) : {};
    } catch {
      alert('Erreur: Le format JSON des Headers personnalisés est invalide.');
      return;
    }

    const payload: Partial<MCPServerConfig> = {
      name: formName.trim() || 'Serveur MCP',
      description: formDescription.trim(),
      transport: formTransport,
      url: formUrl.trim() || undefined,
      command: formCommand.trim() || undefined,
      args: formArgs.trim() ? formArgs.split(' ').map(s => s.trim()).filter(Boolean) : undefined,
      apiKey: formApiKey.trim() || undefined,
      headers: parsedHeaders,
      assignedAgents: formAssignedAgents,
      enabled: true,
    };

    if (editingServer) {
      await onUpdateServer(editingServer.id, payload);
    } else {
      payload.id = formId.trim() || `mcp_${Date.now()}`;
      await onAddServer(payload);
    }
    setIsModalOpen(false);
  };

  const handleImportJson = async () => {
    setJsonImportError('');
    try {
      const parsed = JSON.parse(jsonConfigInput);
      const mcpServers = parsed.mcpServers || parsed;
      let count = 0;

      for (const [key, cfg] of Object.entries<any>(mcpServers)) {
        const s: Partial<MCPServerConfig> = {
          id: `mcp_${key.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`,
          name: cfg.name || key,
          description: cfg.description || `Serveur MCP importé (${key})`,
          transport: cfg.command ? 'stdio' : (cfg.transport || 'http'),
          url: cfg.url,
          command: cfg.command,
          args: cfg.args,
          headers: cfg.headers || (cfg.env ? { ...cfg.env } : {}),
          enabled: true,
          assignedAgents: ['chloe_orchestrator', 'dev_agent'],
        };
        await onAddServer(s);
        count++;
      }

      setIsJsonModalOpen(false);
      setJsonConfigInput('');
      alert(`${count} serveur(s) MCP importé(s) avec succès.`);
    } catch (err: any) {
      setJsonImportError(`Erreur d'analyse JSON: ${err.message}`);
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingServerId(id);
    setTestResult(null);
    try {
      const res = await onDiscoverServer(id);
      setTestResult({ id, success: res.success, message: res.message });
    } catch (e: any) {
      setTestResult({ id, success: false, message: e.message || 'Échec de connexion' });
    } finally {
      setTestingServerId(null);
    }
  };

  const handleOpenToolRunner = (serverId: string, tool: MCPToolInfo) => {
    setExecutingTool({ serverId, toolName: tool.name });
    // Build default JSON based on schema properties
    const defaultArgs: Record<string, any> = {};
    if (tool.inputSchema?.properties) {
      for (const [propName, propDef] of Object.entries<any>(tool.inputSchema.properties)) {
        defaultArgs[propName] = propDef.default !== undefined ? propDef.default : (propDef.type === 'number' ? 0 : propDef.type === 'boolean' ? false : '');
      }
    }
    setToolArgsJson(JSON.stringify(defaultArgs, null, 2));
    setExecResult(null);
  };

  const handleExecuteTool = async () => {
    if (!executingTool) return;
    setExecutingLoading(true);
    setExecResult(null);
    try {
      let parsed = {};
      try {
        parsed = toolArgsJson.trim() ? JSON.parse(toolArgsJson) : {};
      } catch {
        alert('Format des arguments JSON invalide.');
        setExecutingLoading(false);
        return;
      }
      const res = await onCallTool(executingTool.serverId, executingTool.toolName, parsed);
      setExecResult(res);
    } catch (e: any) {
      setExecResult({ success: false, data: { error: e.message || 'Erreur inconnue' }, durationMs: 0 });
    } finally {
      setExecutingLoading(false);
    }
  };

  const filteredServers = servers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTransport = filterTransport === 'all' || s.transport === filterTransport;
    return matchesSearch && matchesTransport;
  });

  const totalTools = servers.reduce((acc, s) => acc + (s.tools?.length || 0), 0);
  const activeServers = servers.filter(s => s.enabled && s.status === 'connected').length;

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24 text-slate-100 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-400" />
              MCP Manager
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950/70 text-purple-300 border border-purple-500/30 font-medium">
              Model Context Protocol
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gérez vos serveurs MCP, connectez des outils distants et déléguez des capacités aux agents de CHLOÉ AI.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setLogsModalOpen(true); loadLogs(); }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Historique ({logs.length})</span>
          </button>
          <button
            onClick={() => setIsJsonModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <FileJson className="w-3.5 h-3.5 text-purple-400" />
            <span>Importer JSON</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ajouter un serveur MCP</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#0f1428] border border-purple-900/40 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 font-medium block">Serveurs configurés</span>
          <span className="text-lg font-bold text-white mt-0.5 block">{servers.length}</span>
        </div>
        <div className="bg-[#0f1428] border border-purple-900/40 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 font-medium block">Serveurs connectés</span>
          <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{activeServers} / {servers.length}</span>
        </div>
        <div className="bg-[#0f1428] border border-purple-900/40 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 font-medium block">Outils découverts</span>
          <span className="text-lg font-bold text-purple-300 mt-0.5 block">{totalTools} outils</span>
        </div>
        <div className="bg-[#0f1428] border border-purple-900/40 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 font-medium block">Protocole</span>
          <span className="text-xs font-mono text-cyan-300 mt-1.5 block">JSON-RPC 2.0 / SSE</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher un serveur MCP ou un outil..."
            className="w-full pl-9 pr-3 py-2 bg-[#0b0e1c] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1 shrink-0">
          {['all', 'http', 'sse', 'streamable-http', 'stdio'].map(tr => (
            <button
              key={tr}
              onClick={() => setFilterTransport(tr)}
              className={`px-2.5 py-1.5 rounded-lg text-xs capitalize transition-colors ${
                filterTransport === tr
                  ? 'bg-purple-600 text-white font-medium'
                  : 'bg-[#0f1428] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tr === 'all' ? 'Tous Transports' : tr.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Server Cards List */}
      <div className="space-y-3">
        {filteredServers.length === 0 ? (
          <div className="p-8 text-center bg-[#0a0d1a] border border-slate-800 rounded-2xl">
            <Server className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">Aucun serveur MCP correspondant</p>
            <p className="text-xs text-slate-500 mt-1">Cliquez sur « + Ajouter un serveur MCP » pour connecter votre premier endpoint.</p>
          </div>
        ) : (
          filteredServers.map(server => {
            const isExpanded = expandedServerId === server.id;
            const isConnected = server.status === 'connected';
            const isError = server.status === 'error';
            const toolsCount = server.tools?.length || 0;
            const resourcesCount = server.resources?.length || 0;
            const promptsCount = server.prompts?.length || 0;

            return (
              <div
                key={server.id}
                className={`rounded-2xl border transition-all ${
                  server.enabled
                    ? 'bg-[#0f1428] border-purple-900/40 shadow-sm'
                    : 'bg-[#0a0d1a] border-slate-800/70 opacity-80'
                }`}
              >
                {/* Main Row */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        isConnected
                          ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400'
                          : isError
                          ? 'bg-red-950/60 border border-red-500/40 text-red-400'
                          : 'bg-purple-950/40 border border-purple-500/30 text-purple-300'
                      }`}>
                        <Server className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-white text-sm truncate">{server.name}</h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700">
                            {server.transport.toUpperCase()}
                          </span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isConnected
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-700/50'
                              : isError
                              ? 'bg-red-950/60 text-red-400 border border-red-700/50'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : isError ? 'bg-red-400' : 'bg-slate-400'}`} />
                            {isConnected ? 'Connecté' : isError ? 'Erreur' : 'Déconnecté'}
                            {server.latencyMs !== undefined && isConnected && (
                              <span className="text-slate-400">({server.latencyMs}ms)</span>
                            )}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                          {server.description || 'Aucune description fournie.'}
                        </p>

                        <div className="mt-2 text-[11px] text-slate-400 font-mono truncate flex items-center gap-1.5">
                          {server.transport === 'stdio' ? (
                            <span><Terminal className="w-3 h-3 inline mr-1 text-slate-500" />{server.command} {server.args?.join(' ')}</span>
                          ) : (
                            <span><ExternalLink className="w-3 h-3 inline mr-1 text-slate-500" />{server.url}</span>
                          )}
                          {server.maskedKey && (
                            <span className="bg-slate-800/80 px-1.5 py-0.2 rounded text-[10px] text-slate-400">
                              Clé: {server.maskedKey}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Enable Toggle */}
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={server.enabled}
                          onChange={e => onToggleServer(server.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Badges & Assigned Agents */}
                  <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-900/40 text-[10px]">
                        {toolsCount} outil(s)
                      </span>
                      {resourcesCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-900/40 text-[10px]">
                          {resourcesCount} ressource(s)
                        </span>
                      )}
                      {promptsCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-900/40 text-[10px]">
                          {promptsCount} prompt(s)
                        </span>
                      )}
                      {server.assignedAgents && server.assignedAgents.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <span className="text-slate-500">Agents :</span>
                          {server.assignedAgents.map(aId => (
                            <span key={aId} className="bg-slate-800/80 px-1.5 py-0.5 rounded text-purple-300">
                              {aId.replace('_agent', '').replace('chloe_', '')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTestConnection(server.id)}
                        disabled={testingServerId === server.id || !server.enabled}
                        className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-medium flex items-center gap-1 disabled:opacity-40 transition-colors"
                        title="Tester la connexion et découvrir les outils"
                      >
                        <RotateCw className={`w-3 h-3 ${testingServerId === server.id ? 'animate-spin' : ''}`} />
                        <span>{testingServerId === server.id ? 'Scan...' : 'Tester / Scan'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(server)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Modifier le serveur"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Supprimer le serveur MCP "${server.name}" ?`)) {
                            onDeleteServer(server.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setExpandedServerId(isExpanded ? null : server.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Détails et outils"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Test Feedback */}
                  {testResult && testResult.id === server.id && (
                    <div className={`mt-2.5 p-2 rounded-lg text-xs flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40'
                        : 'bg-red-950/50 text-red-300 border border-red-800/40'
                    }`}>
                      {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>

                {/* Expanded Details & Tools Discovery */}
                {isExpanded && (
                  <div className="p-4 bg-black/40 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-purple-400" />
                        Outils MCP Découverts ({toolsCount})
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        Activez/désactivez individuellement les permissions des outils
                      </span>
                    </div>

                    {toolsCount === 0 ? (
                      <div className="p-4 text-center bg-slate-900/40 rounded-xl border border-slate-800/50 text-xs text-slate-400">
                        Aucun outil découvert pour l'instant. Cliquez sur <span className="text-purple-300 font-semibold">« Tester / Scan »</span> ci-dessus pour interroger le serveur via JSON-RPC.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {server.tools.map(tool => {
                          const isToolEnabled = tool.enabled !== false;
                          return (
                            <div
                              key={tool.name}
                              className={`p-3 rounded-xl border transition-all ${
                                isToolEnabled
                                  ? 'bg-[#0d1124] border-slate-800 hover:border-purple-800/50'
                                  : 'bg-black/30 border-slate-800/40 opacity-60'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="font-mono text-xs font-semibold text-purple-300 block truncate">
                                    {tool.name}
                                  </span>
                                  <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">
                                    {tool.description || 'Pas de description'}
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isToolEnabled}
                                  onChange={e => onToggleTool(server.id, tool.name, e.target.checked)}
                                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700 cursor-pointer shrink-0 mt-0.5"
                                  title="Autoriser / Révoquer cet outil"
                                />
                              </div>

                              {/* Schema preview & Call Button */}
                              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 text-[10px]">
                                <span className="text-slate-500 truncate font-mono">
                                  {tool.inputSchema?.properties ? `${Object.keys(tool.inputSchema.properties).length} arg(s)` : '0 arg'}
                                </span>
                                <button
                                  onClick={() => handleOpenToolRunner(server.id, tool)}
                                  disabled={!isToolEnabled || !server.enabled}
                                  className="px-2 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-medium disabled:opacity-40"
                                >
                                  <Play className="w-2.5 h-2.5" />
                                  <span>Tester l'outil</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Resources & Prompts Info if available */}
                    {(resourcesCount > 0 || promptsCount > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
                        {resourcesCount > 0 && (
                          <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/50">
                            <span className="text-[11px] font-semibold text-blue-300 block mb-1">Ressources accessibles</span>
                            <div className="space-y-1">
                              {server.resources?.map(r => (
                                <div key={r.uri} className="font-mono text-[10px] text-slate-300 truncate">
                                  {r.name} ({r.uri})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {promptsCount > 0 && (
                          <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/50">
                            <span className="text-[11px] font-semibold text-amber-300 block mb-1">Prompts MCP disponibles</span>
                            <div className="space-y-1">
                              {server.prompts?.map(p => (
                                <div key={p.name} className="text-[10px] text-slate-300 truncate">
                                  <span className="font-semibold text-amber-200">{p.name}</span> : {p.description}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ADD / EDIT MCP SERVER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-[#0b0e1c] border border-purple-900/50 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-400" />
                {editingServer ? 'Modifier le serveur MCP' : 'Ajouter un nouveau serveur MCP'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveServer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nom du serveur *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ex: GitHub MCP, Postgres MCP, Web Fetcher..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {!editingServer && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Identifiant unique (ID) *</label>
                  <input
                    type="text"
                    value={formId}
                    onChange={e => setFormId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    placeholder="Ex: mcp_github, mcp_database..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Description des fonctionnalités apportées à CHLOÉ AI..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Type de transport</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'http', label: 'HTTP / JSON-RPC', desc: 'Standard universel web/mobile' },
                    { id: 'sse', label: 'SSE (Server-Sent Events)', desc: 'Flux continu temps-réel' },
                    { id: 'streamable-http', label: 'Streamable HTTP', desc: 'Streaming bi-directionnel' },
                    { id: 'stdio', label: 'STDIO Local', desc: 'Process local (Desktop/Daemon)' },
                  ].map(item => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setFormTransport(item.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        formTransport === item.id
                          ? 'bg-purple-950/60 border-purple-500/80 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-semibold text-xs block text-purple-200">{item.label}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formTransport === 'stdio' ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Commande exécutable *</label>
                    <input
                      type="text"
                      value={formCommand}
                      onChange={e => setFormCommand(e.target.value)}
                      placeholder="Ex: npx, docker, python, /bin/sh"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Arguments de commande (séparés par un espace)</label>
                    <input
                      type="text"
                      value={formArgs}
                      onChange={e => setFormArgs(e.target.value)}
                      placeholder="Ex: -y @modelcontextprotocol/server-github"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <p className="text-[10px] text-amber-300/90 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Note Android : Le transport STDIO s'exécute sur le runtime Node.js hôte. Sur mobile strict, préférez HTTP/SSE.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">URL de connexion MCP *</label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={e => setFormUrl(e.target.value)}
                    placeholder="Ex: https://mon-serveur-mcp.org/mcp ou http://localhost:8080/sse"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Clé API / Token Bearer (Optionnel)</label>
                <input
                  type="password"
                  value={formApiKey}
                  onChange={e => setFormApiKey(e.target.value)}
                  placeholder="ghp_xxx ou Bearer token..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Stocké de façon sécurisée côté serveur. Jamais exposé en clair au client.</p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Headers personnalisés (Format JSON)</label>
                <textarea
                  rows={2}
                  value={formHeaders}
                  onChange={e => setFormHeaders(e.target.value)}
                  placeholder='{"X-Custom-Header": "value"}'
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Agents autorisés à utiliser ce serveur</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  {agents.map(agent => {
                    const checked = formAssignedAgents.includes(agent.id);
                    return (
                      <button
                        type="button"
                        key={agent.id}
                        onClick={() => {
                          setFormAssignedAgents(prev =>
                            checked ? prev.filter(x => x !== agent.id) : [...prev, agent.id]
                          );
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                          checked
                            ? 'bg-purple-900/60 text-purple-200 border-purple-500/50'
                            : 'bg-slate-800/60 text-slate-400 border-slate-700'
                        }`}
                      >
                        {agent.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md shadow-purple-900/40"
                >
                  {editingServer ? 'Enregistrer les modifications' : 'Créer le serveur MCP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT JSON MCP CONFIG */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#0b0e1c] border border-purple-900/50 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <FileJson className="w-5 h-5 text-purple-400" />
                Importer une configuration JSON MCP
              </h3>
              <button onClick={() => setIsJsonModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Collez un extrait de configuration standard Model Context Protocol (comme <code className="text-purple-300">claude_desktop_config.json</code>).
            </p>

            <textarea
              rows={8}
              value={jsonConfigInput}
              onChange={e => setJsonConfigInput(e.target.value)}
              placeholder={`{\n  "mcpServers": {\n    "github": {\n      "command": "npx",\n      "args": ["-y", "@modelcontextprotocol/server-github"],\n      "env": { "GITHUB_TOKEN": "ghp_xxx" }\n    }\n  }\n}`}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-500"
            />

            {jsonImportError && (
              <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800/40 text-red-300 text-xs">
                {jsonImportError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsJsonModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
              >
                Annuler
              </button>
              <button
                onClick={handleImportJson}
                disabled={!jsonConfigInput.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs disabled:opacity-40"
              >
                Importer la configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TOOL RUNNER / EXECUTION TEST */}
      {executingTool && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#0b0e1c] border border-purple-900/50 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5 font-mono">
                  <Play className="w-4 h-4 text-purple-400" />
                  tools/call : {executingTool.toolName}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Serveur ID : {executingTool.serverId}
                </span>
              </div>
              <button onClick={() => setExecutingTool(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Arguments de l'outil (JSON)
              </label>
              <textarea
                rows={4}
                value={toolArgsJson}
                onChange={e => setToolArgsJson(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Execution Result */}
            {execResult && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className={execResult.success ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                    {execResult.success ? '✓ Succès d\'exécution' : '✕ Erreur d\'exécution'}
                  </span>
                  <span className="text-slate-400 font-mono">{execResult.durationMs}ms</span>
                </div>
                <pre className="max-h-40 overflow-y-auto p-2.5 bg-black/60 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-200">
                  {JSON.stringify(execResult.data, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setExecutingTool(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                Fermer
              </button>
              <button
                onClick={handleExecuteTool}
                disabled={executingLoading}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1.5 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{executingLoading ? 'Exécution...' : 'Lancer l\'appel MCP'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MCP CALL LOGS */}
      {logsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#0b0e1c] border border-purple-900/50 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Historique des appels d'outils MCP
              </h3>
              <button onClick={() => setLogsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2">
              {loadingLogs ? (
                <div className="text-center py-8 text-xs text-slate-400">Chargement de l'historique...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">Aucun appel d'outil MCP enregistré.</div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className="font-mono font-semibold text-purple-300">{log.toolName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({log.serverId})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{log.durationMs}ms</span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Agent: {log.agentId || 'Système'}</span>
                      <span>{new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                    </div>

                    {log.error && (
                      <div className="p-1.5 bg-red-950/40 rounded text-[11px] text-red-300 font-mono">
                        {log.error}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setLogsModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
