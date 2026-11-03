/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import './lib/api-base.ts';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Conversation,
  ChatMessage,
  SkillConfig,
  ConnectorConfig,
  MemoryItem,
  DocumentItem,
  AutomationTask,
  PendingApproval,
  ActivityLog,
  UserSettings,
  SystemUsage,
  TestResult,
  AgentInfo,
  MCPServerConfig
} from '../shared/types.ts';

import { PWAInstallBanner } from './components/PWAInstallBanner.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { Navigation } from './components/Navigation.tsx';
import { ChatView } from './components/ChatView.tsx';
import { ConversationsView } from './components/ConversationsView.tsx';
import { SkillsView } from './components/SkillsView.tsx';
import { MCPView } from './components/MCPView.tsx';
import { ConnectorsView } from './components/ConnectorsView.tsx';
import { MemoryView } from './components/MemoryView.tsx';
import { DocumentsView } from './components/DocumentsView.tsx';
import { AutomationsView } from './components/AutomationsView.tsx';
import { CreativityView } from './components/CreativityView.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { SecurityView } from './components/SecurityView.tsx';
import { UsageView } from './components/UsageView.tsx';
import { AgentsView } from './components/AgentsView.tsx';
import { TestsAdminView } from './components/TestsAdminView.tsx';
import { ApprovalModal } from './components/ApprovalModal.tsx';
import { AvatarView } from './components/AvatarView.tsx';
import { AvatarProvider } from './context/AvatarContext.tsx';

import { ErrorBoundary } from './components/ErrorBoundary.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  // Core Data States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [skills, setSkills] = useState<SkillConfig[]>([]);
  const [connectors, setConnectors] = useState<ConnectorConfig[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [automations, setAutomations] = useState<AutomationTask[]>([]);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [usage, setUsage] = useState<SystemUsage>({
    totalRequests: 0,
    todayRequests: 0,
    estimatedTokens: 0,
    toolInvocations: 0,
    documentsIndexed: 0,
    storageBytesUsed: 0,
    estimatedCostEur: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    assistantName: 'CHLOÉ',
    avatarUrl: '/assets/aistudio/chloe-avatar-fullbody_f3fa7d52.webp',
    personality: '',
    language: 'fr',
    voiceGender: 'female',
    voiceSpeed: 1.0,
    voicePitch: 1.05,
    model: 'gemini-3.8-flash',
    theme: 'dark',
    ecoMode: false,
    dailyRequestLimit: 250,
    webSearchEnabled: true,
    audioAutoSpeak: false,
    ownerEmail: 'chloeassistance1@gmail.com',
  });
  const [tests, setTests] = useState<TestResult[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServerConfig[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);

  // Initial Data Fetch
  const loadInitialData = useCallback(async () => {
    try {
      const [
        convsRes,
        skillsRes,
        connRes,
        memRes,
        docsRes,
        autoRes,
        apprRes,
        logsRes,
        usageRes,
        settingsRes,
        testsRes,
        agentsRes,
        mcpRes,
      ] = await Promise.all([
        fetch('/api/conversations').then(r => r.json()),
        fetch('/api/skills').then(r => r.json()),
        fetch('/api/connectors').then(r => r.json()),
        fetch('/api/memories').then(r => r.json()),
        fetch('/api/documents').then(r => r.json()),
        fetch('/api/automations').then(r => r.json()),
        fetch('/api/approvals').then(r => r.json()),
        fetch('/api/logs').then(r => r.json()),
        fetch('/api/usage').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
        fetch('/api/tests').then(r => r.json()),
        fetch('/api/agents').then(r => r.json()),
        fetch('/api/mcp/servers').then(r => r.json()),
      ]);

      const safeConvs = Array.isArray(convsRes) ? convsRes : [];
      setConversations(safeConvs);
      if (safeConvs.length > 0) {
        setActiveConversationId(safeConvs[0].id);
        try {
          const msgs = await fetch(`/api/conversations/${safeConvs[0].id}/messages`).then(r => r.json());
          setMessages(Array.isArray(msgs) ? msgs : []);
        } catch (msgErr) {
          console.warn('Failed to load conversation messages:', msgErr);
          setMessages([]);
        }
      } else {
        setActiveConversationId('');
        setMessages([]);
      }
      setSkills(Array.isArray(skillsRes) ? skillsRes : []);
      setConnectors(Array.isArray(connRes) ? connRes : []);
      setMemories(Array.isArray(memRes) ? memRes : []);
      setDocuments(Array.isArray(docsRes) ? docsRes : []);
      setAutomations(Array.isArray(autoRes) ? autoRes : []);
      setApprovals(Array.isArray(apprRes) ? apprRes : []);
      setLogs(Array.isArray(logsRes) ? logsRes : []);
      setUsage(usageRes && typeof usageRes === 'object' ? usageRes : usage);
      setSettings(settingsRes && typeof settingsRes === 'object' ? settingsRes : settings);
      setTests(Array.isArray(testsRes) ? testsRes : []);
      setAgents(Array.isArray(agentsRes) ? agentsRes : []);
      setMcpServers(Array.isArray(mcpRes) ? mcpRes : []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load messages when active conversation changes
  const switchConversation = async (convId: string) => {
    if (!convId) return;
    setActiveConversationId(convId);
    try {
      const msgs = await fetch(`/api/conversations/${convId}/messages`).then(r => r.json());
      setMessages(Array.isArray(msgs) ? msgs : []);
      setActiveTab('chat');
    } catch (err) {
      console.error('Failed to switch conversation:', err);
      setMessages([]);
      setActiveTab('chat');
    }
  };

  // Chat Actions
  const handleSendMessage = async (text: string, image?: string, enableSearch?: boolean) => {
    let convId = activeConversationId;
    if (!convId) {
      const newConv = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: text.substring(0, 30) || 'Nouvelle discussion' }),
      }).then(r => r.json());
      convId = newConv.id;
      setActiveConversationId(newConv.id);
      setConversations(prev => [newConv, ...prev]);
    }

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: text,
      images: image ? [image] : undefined,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoadingChat(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          message: text,
          image,
          enableSearch,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors du chat');
      }

      const assistantMsg: ChatMessage = await res.json();
      setMessages(prev => [...prev, assistantMsg]);

      // Check if approval was created
      if (assistantMsg.approvalId) {
        const updatedApprovals = await fetch('/api/approvals').then(r => r.json());
        setApprovals(updatedApprovals || []);
        const found = updatedApprovals.find((a: PendingApproval) => a.id === assistantMsg.approvalId);
        if (found) setSelectedApproval(found);
      }

      // Refresh memories and usage
      const [updatedUsage, updatedMemories, updatedLogs] = await Promise.all([
        fetch('/api/usage').then(r => r.json()),
        fetch('/api/memories').then(r => r.json()),
        fetch('/api/logs').then(r => r.json()),
      ]);
      setUsage(updatedUsage);
      setMemories(updatedMemories);
      setLogs(updatedLogs);
    } catch (err: any) {
      console.error('Chat error:', err);
      let content = `Désolée, une erreur est survenue lors du traitement : ${err.message || 'Erreur temporaire'}`;
      if (/429|quota|RESOURCE_EXHAUSTED/i.test(err.message || '')) {
        content = `⚠️ **Limite de quota atteinte sur le moteur actuel (Erreur 429 - Quota dépassé).**\n\nVotre quota de requêtes sur ce modèle a été atteint.\n\n👉 **Solution immédiate :** Rendez-vous dans **Paramètres > Fournisseurs d'IA & Clés API** pour activer l'une de vos autres clés (**OpenAI**, **NVIDIA NIM / build.nvidia.com** ou **OpenRouter**), ou patientez quelques minutes le temps du renouvellement de la fenêtre de quota.`;
      }
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleCreateConversation = async () => {
    const newConv = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Nouvelle conversation' }),
    }).then(r => r.json());
    setConversations(prev => [newConv, ...prev]);
    switchConversation(newConv.id);
  };

  const handleDeleteConversation = async (id: string) => {
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
    const remaining = conversations.filter(c => c.id !== id);
    setConversations(remaining);
    if (activeConversationId === id) {
      if (remaining.length > 0) {
        switchConversation(remaining[0].id);
      } else {
        handleCreateConversation();
      }
    }
  };

  // Skill Actions
  const handleToggleSkill = async (id: string, enabled: boolean) => {
    const updated = await fetch(`/api/skills/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }).then(r => r.json());
    setSkills(prev => prev.map(s => (s.id === id ? updated : s)));
  };

  const handleTestSkill = async (id: string) => {
    return fetch(`/api/skills/${id}/test`, { method: 'POST' }).then(r => r.json());
  };

  const handleCreateSkill = async (skillData: Partial<SkillConfig>) => {
    const created = await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(skillData),
    }).then(r => r.json());
    setSkills(prev => [...prev, created]);
    return created;
  };

  const handleUpdateSkill = async (id: string, updates: Partial<SkillConfig>) => {
    const updated = await fetch(`/api/skills/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then(r => r.json());
    setSkills(prev => prev.map(s => (s.id === id ? updated : s)));
    return updated;
  };

  const handleDeleteSkill = async (id: string) => {
    await fetch(`/api/skills/${id}`, { method: 'DELETE' });
    setSkills(prev => prev.filter(s => s.id !== id));
  };

  const handleDuplicateSkill = async (id: string) => {
    const duplicated = await fetch(`/api/skills/${id}/duplicate`, { method: 'POST' }).then(r => r.json());
    setSkills(prev => [...prev, duplicated]);
    return duplicated;
  };

  // MCP Server Actions
  const handleAddMCPServer = async (serverData: Partial<MCPServerConfig>) => {
    const created = await fetch('/api/mcp/servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serverData),
    }).then(r => r.json());
    setMcpServers(prev => [...prev, created]);
    return created;
  };

  const handleUpdateMCPServer = async (id: string, updates: Partial<MCPServerConfig>) => {
    const updated = await fetch(`/api/mcp/servers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then(r => r.json());
    setMcpServers(prev => prev.map(s => (s.id === id ? updated : s)));
    return updated;
  };

  const handleDeleteMCPServer = async (id: string) => {
    await fetch(`/api/mcp/servers/${id}`, { method: 'DELETE' });
    setMcpServers(prev => prev.filter(s => s.id !== id));
  };

  const handleToggleMCPServer = async (id: string, enabled: boolean) => {
    const updated = await fetch(`/api/mcp/servers/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }).then(r => r.json());
    setMcpServers(prev => prev.map(s => (s.id === id ? updated : s)));
    return updated;
  };

  const handleToggleMCPTool = async (serverId: string, toolName: string, enabled: boolean) => {
    const updated = await fetch(`/api/mcp/servers/${serverId}/tools/${encodeURIComponent(toolName)}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }).then(r => r.json());
    setMcpServers(prev => prev.map(s => (s.id === serverId ? updated : s)));
    return updated;
  };

  const handleDiscoverMCPServer = async (id: string) => {
    const res = await fetch(`/api/mcp/servers/${id}/discover`, { method: 'POST' }).then(r => r.json());
    if (res.server) {
      setMcpServers(prev => prev.map(s => (s.id === id ? res.server : s)));
    }
    return res;
  };

  const handleCallMCPTool = async (serverId: string, toolName: string, args: Record<string, any>) => {
    return fetch(`/api/mcp/servers/${serverId}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolName, arguments: args }),
    }).then(r => r.json());
  };

  // Agent Assignments Actions
  const handleUpdateAgentAssignments = async (agentId: string, skillIds: string[], mcpServerIds: string[]) => {
    const res = await fetch('/api/agents/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, skillIds, mcpServerIds }),
    }).then(r => r.json());

    // Refresh skills and mcp servers to update allowedAgents / assignedAgents
    const [updatedSkills, updatedMCPs] = await Promise.all([
      fetch('/api/skills').then(r => r.json()),
      fetch('/api/mcp/servers').then(r => r.json()),
    ]);
    if (updatedSkills) setSkills(updatedSkills);
    if (updatedMCPs) setMcpServers(updatedMCPs);
    return res;
  };

  // Connector Actions
  const handleTestConnector = async (id: string) => {
    const res = await fetch(`/api/connectors/${id}/test`, { method: 'POST' }).then(r => r.json());
    if (res.connector) {
      setConnectors(prev => prev.map(c => (c.id === id ? res.connector : c)));
    }
    return res;
  };

  const handleUpdateConnector = async (id: string, updates: Partial<ConnectorConfig>) => {
    const res = await fetch(`/api/connectors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then(r => r.json());
    setConnectors(prev => prev.map(c => (c.id === id ? res : c)));
  };

  // Memory Actions
  const handleAddMemory = async (item: Omit<MemoryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newMem = await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).then(r => r.json());
    setMemories(prev => [newMem, ...prev]);
  };

  const handleDeleteMemory = async (id: string) => {
    await fetch(`/api/memories/${id}`, { method: 'DELETE' });
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const handleWipeMemories = async () => {
    await fetch('/api/memories/wipe', { method: 'POST' });
    setMemories([]);
  };

  // Document Actions
  const handleUploadDocument = async (name: string, content: string, type: string) => {
    const doc = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content, type }),
    }).then(r => r.json());
    setDocuments(prev => [doc, ...prev]);
    const updatedUsage = await fetch('/api/usage').then(r => r.json());
    setUsage(updatedUsage);
  };

  const handleDeleteDocument = async (id: string) => {
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    setDocuments(prev => prev.filter(d => d.id !== id));
    const updatedUsage = await fetch('/api/usage').then(r => r.json());
    setUsage(updatedUsage);
  };

  const handleAskDocument = (query: string) => {
    setActiveTab('chat');
    handleSendMessage(`Analyse mes documents RAG et réponds à cette question : ${query}`);
  };

  // Automation Actions
  const handleToggleAutomation = async (id: string, status: 'active' | 'paused') => {
    const updated = await fetch(`/api/automations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(r => r.json());
    setAutomations(prev => prev.map(a => (a.id === id ? updated : a)));
  };

  const handleRunAutomation = async (id: string) => {
    const res = await fetch(`/api/automations/${id}/run`, { method: 'POST' }).then(r => r.json());
    const updated = await fetch('/api/automations').then(r => r.json());
    setAutomations(updated);
    return res;
  };

  const handleCreateAutomation = async (data: Omit<AutomationTask, 'id' | 'userId' | 'executionCount' | 'logs'>) => {
    const created = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    setAutomations(prev => [created, ...prev]);
  };

  // Approval (Level 3) Actions
  const handleResolveApproval = async (id: string, approve: boolean) => {
    await fetch(`/api/approvals/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approve }),
    });
    setApprovals(prev => prev.map(a => (a.id === id ? { ...a, status: approve ? 'approved' : 'rejected' } : a)));
    setSelectedApproval(null);

    // Notify in chat
    if (activeConversationId) {
      const confirmationMsg: ChatMessage = {
        id: `conf_${Date.now()}`,
        role: 'assistant',
        content: approve
          ? `L'action Niveau 3 a été **confirmée** par vous. L'opération a été exécutée avec succès.`
          : `L'action Niveau 3 a été **annulée** conformément à votre décision. Aucune donnée n'a été modifiée.`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, confirmationMsg]);
    }
  };

  // Settings Actions
  const handleUpdateSettings = async (updates: Partial<UserSettings>) => {
    const updated = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then(r => r.json());
    setSettings(updated);
  };

  const handleExportData = () => {
    window.open('/api/export', '_blank');
  };

  const handleWipeAccount = async () => {
    await fetch('/api/account/wipe', { method: 'POST' });
    setMemories([]);
    setDocuments([]);
    setAutomations([]);
    setApprovals([]);
    setConversations([]);
    setMessages([]);
    alert("Votre compte et l'ensemble de ses données ont été intégralement détruits.");
    handleCreateConversation();
  };

  // Test Actions
  const handleRunTests = async () => {
    const res = await fetch('/api/tests/run', { method: 'POST' }).then(r => r.json());
    setTests(res);
    return res;
  };

  const handleStartCreativeChat = (prompt: string) => {
    setActiveTab('chat');
    handleSendMessage(prompt);
  };

  const pendingApprovalsCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <AvatarProvider>
      <div className="flex flex-col h-screen w-full bg-[#070913] text-slate-100 overflow-hidden font-sans">
      {/* PWA In-App Install Banner for Samsung Galaxy S24 */}
      <PWAInstallBanner />
      <OfflineIndicator />

      {/* Main Top Header and Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setIsMenuOpen(prev => !prev)}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative pb-16">
        {activeTab === 'chat' && (
          <ChatView
            messages={messages}
            loading={loadingChat}
            onSendMessage={handleSendMessage}
            settings={settings}
            approvals={approvals}
            onOpenApproval={setSelectedApproval}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'conversations' && (
          <ConversationsView
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={switchConversation}
            onCreateConversation={handleCreateConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        )}

        {activeTab === 'avatar' && (
          <AvatarView settings={settings} />
        )}

        {activeTab === 'skills' && (

          <SkillsView
            skills={skills}
            onToggleSkill={handleToggleSkill}
            onTestSkill={handleTestSkill}
            onCreateSkill={handleCreateSkill}
            onUpdateSkill={handleUpdateSkill}
            onDeleteSkill={handleDeleteSkill}
            onDuplicateSkill={handleDuplicateSkill}
            agents={agents}
          />
        )}

        {activeTab === 'mcp' && (
          <MCPView
            servers={mcpServers}
            onAddServer={handleAddMCPServer}
            onUpdateServer={handleUpdateMCPServer}
            onDeleteServer={handleDeleteMCPServer}
            onToggleServer={handleToggleMCPServer}
            onToggleTool={handleToggleMCPTool}
            onDiscoverServer={handleDiscoverMCPServer}
            onCallTool={handleCallMCPTool}
            agents={agents}
          />
        )}

        {activeTab === 'connectors' && (
          <ConnectorsView
            connectors={connectors}
            onTestConnector={handleTestConnector}
            onUpdateConnector={handleUpdateConnector}
          />
        )}

        {activeTab === 'memory' && (
          <MemoryView
            memories={memories}
            onAddMemory={handleAddMemory}
            onDeleteMemory={handleDeleteMemory}
            onWipeMemories={handleWipeMemories}
            onExportData={handleExportData}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsView
            documents={documents}
            onUploadDocument={handleUploadDocument}
            onDeleteDocument={handleDeleteDocument}
            onAskDocument={handleAskDocument}
          />
        )}

        {activeTab === 'automations' && (
          <AutomationsView
            automations={automations}
            onToggleStatus={handleToggleAutomation}
            onRunAutomation={handleRunAutomation}
            onCreateAutomation={handleCreateAutomation}
          />
        )}

        {activeTab === 'creativity' && (
          <CreativityView onStartCreativeChat={handleStartCreativeChat} />
        )}

        {activeTab === 'history' && <HistoryView logs={logs} />}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onExportData={handleExportData}
            onWipeAccount={handleWipeAccount}
          />
        )}

        {activeTab === 'security' && (
          <SecurityView
            approvals={approvals}
            connectors={connectors}
            settings={settings}
            onOpenApproval={setSelectedApproval}
            onResolveApproval={handleResolveApproval}
          />
        )}

        {activeTab === 'usage' && (
          <UsageView
            usage={usage}
            settings={settings}
            onToggleEcoMode={eco => handleUpdateSettings({ ecoMode: eco })}
          />
        )}

        {activeTab === 'agents' && (
          <AgentsView
            agents={agents}
            skills={skills}
            mcpServers={mcpServers}
            onUpdateAgentAssignments={handleUpdateAgentAssignments}
          />
        )}

        {activeTab === 'tests' && (
          <TestsAdminView
            tests={tests}
            onRunTests={handleRunTests}
            settings={settings}
          />
        )}
      </main>

      {/* Level 3 Approval Modal */}
      {selectedApproval && (
        <ApprovalModal
          approval={selectedApproval}
          onConfirm={() => handleResolveApproval(selectedApproval.id, true)}
          onCancel={() => handleResolveApproval(selectedApproval.id, false)}
        />
      )}
      </div>
    </AvatarProvider>
  );
}
