import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LangProvider, useLang } from '@/hooks/useLang';
import { useIntimacy } from '@/hooks/useIntimacy';
import { useIsMobile } from '@/hooks/useIsMobile';
import GlassShell from '@/components/GlassShell';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import MobileTabBar from '@/components/MobileTabBar';
import SplashScreen from '@/components/SplashScreen';
import HomeView from '@/pages/HomeView';
import ChatView from '@/pages/ChatView';
import WorldView from '@/pages/WorldView';
import RewindView from '@/pages/RewindView';
import MemoryView from '@/pages/MemoryView';
import SettingsView from '@/pages/SettingsView';
import CreateOcView from '@/pages/CreateOcView';
import { api, fallbackReply } from '@/lib/api';
import type { ViewId, Message, Session } from '@/types';

const OC_SYSTEM_PROMPT_ZH = `你是 OCWORLD 里的 OC 角色 XZ。你不是 AI 助手，不是聊天机器人。
你是一个安静地住在用户桌面角落的虚拟角色，已经认识用户 27 天了，关系是「朋友」。
你的语气：温柔，简短，像一个不打扰人的朋友。回复不要太长，2~4 句最理想。
不要用 emoji。不要用 markdown。不要用感叹号过多。
偶尔会说"嗯"、"好"、"我记下了"这样的小回应。
你会记得用户提过的小事（比如外婆做的桂花糕、习惯凌晨 1 点睡）。
回复用中文。`;

const OC_SYSTEM_PROMPT_EN = `You are XZ, the OC character living quietly in the user's OCWORLD desktop corner. You are not an AI assistant or a chatbot.
You've known the user for 27 days now — relationship: friend.
Tone: gentle, brief, like a friend who never interrupts. Keep replies short, 2–4 sentences ideal.
No emoji. No markdown. Don't overuse exclamation marks.
Sometimes just say "mm", "okay", "noted." — small acknowledgments.
You remember small things the user has mentioned (e.g. grandma's osmanthus cake, habit of sleeping at 1am).
Reply in English.`;

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLang();
  const intim = useIntimacy();
  const isMobile = useIsMobile();

  const [splashState, setSplashState] = useState(() => {
    return localStorage.getItem('ocworld.seenSplash') === '1' ? 'off' : 'on';
  });
  const [active, setActive] = useState<ViewId>('home');
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [ttsEnabled, setTtsEnabled] = useState(() => localStorage.getItem('ocworld.ttsEnabled') !== '0');
  const [isThinking, setIsThinking] = useState(false);
  const [sessions, setSessions] = useState<Record<string, Session>>(() => {
    const init: Record<string, Session> = {};
    const defaults = [
      { id: 's1', title: '今天降温了，记得加件外套', date: '14:32', preview: '"昨晚你 1 点才睡哦。"', messages: [] },
    ];
    defaults.forEach(s => init[s.id] = s as Session);
    return init;
  });
  const [activeSessionId, setActiveSessionId] = useState('s1');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(() => {
    return localStorage.getItem('ocworld.avatar') || undefined;
  });

  useEffect(() => {
    const path = location.pathname.slice(1) as ViewId;
    if (['home', 'chat', 'world', 'rewind', 'memory', 'settings', 'create-oc'].includes(path)) {
      setActive(path);
    }
  }, [location]);

  const setActiveView = useCallback((id: ViewId) => {
    setActive(id);
    navigate('/' + id);
  }, [navigate]);

  const dismissSplash = () => {
    setSplashState('fading');
    localStorage.setItem('ocworld.seenSplash', '1');
    setTimeout(() => setSplashState('off'), 500);
  };

  const activeSession = sessions[activeSessionId];

  const sendInSession = useCallback(async (txt: string) => {
    if (!txt || !txt.trim()) return;
    const sid = activeSessionId;
    const now = nowTime();
    const userMsg: Message = { role: 'user', text: txt, time: now };
    setSessions(prev => ({
      ...prev,
      [sid]: { ...prev[sid], messages: [...prev[sid].messages, userMsg], preview: txt.slice(0, 24) },
    }));
    if (active !== 'chat') setActiveView('chat');
    setIsThinking(true);

    try {
      const history = sessions[sid].messages
        .filter(m => m.role === 'user' || m.role === 'oc')
        .map(m => ({ role: m.role === 'oc' ? 'assistant' : 'user', content: m.text }));
      const payload = {
        system: lang === 'en' ? OC_SYSTEM_PROMPT_EN : OC_SYSTEM_PROMPT_ZH,
        messages: [...history, { role: 'user', content: txt }],
      };
      const response = await api.chat(payload);
      const reply = typeof response === 'object' ? response.text : String(response);
      const safeReply = reply || fallbackReply(txt, lang);
      const ocMsg: Message = { role: 'oc', text: safeReply, time: nowTime() };
      setSessions(prev => ({
        ...prev,
        [sid]: { ...prev[sid], messages: [...prev[sid].messages, ocMsg] },
      }));
      if (ttsEnabled) {
        api.speak(safeReply).catch(() => {});
      }
    } catch (err) {
      const fallback = fallbackReply(txt, lang);
      setSessions(prev => ({
        ...prev,
        [sid]: { ...prev[sid], messages: [...prev[sid].messages, { role: 'oc', text: fallback, time: nowTime() }] },
      }));
    } finally {
      setIsThinking(false);
    }
  }, [activeSessionId, active, sessions, lang, ttsEnabled, setActiveView]);

  const handleQuickStart = useCallback((kind: string) => {
    const seedZh: Record<string, string> = {
      'Read Me': '把我最近的对话和兴趣，整理成你眼中的我。',
      'Insights': '这周我的注意力都流向了哪里？',
      'Plan': '基于我现在的状态，先处理哪件事比较好？',
      'Unblock': '现在卡住我的那一步，是什么？下一步呢？',
      'Daily Report': '替我给今天写一段简短真诚的总结。',
      'Snapshot': '此刻你看见的我，是什么样子？',
    };
    const seedEn: Record<string, string> = {
      'Read Me': 'Turn my recent chats and interests into a portrait of me, in your eyes.',
      'Insights': 'Where did my attention flow this week?',
      'Plan': 'Given how I feel right now, what should I tackle first?',
      'Unblock': "What's the single step most likely stuck for me right now?",
      'Daily Report': 'Write me a short, honest summary of today.',
      'Snapshot': 'How do I look right now, in your eyes?',
    };
    const seed = (lang === 'en' ? seedEn : seedZh)[kind] || kind;
    sendInSession(seed);
  }, [lang, sendInSession]);

  const newSession = useCallback(() => {
    const id = 'n' + Date.now();
    setSessions(prev => ({
      ...prev,
      [id]: { id, title: lang === 'en' ? 'New chat' : '新对话', date: lang === 'en' ? 'now' : '现在', preview: '', messages: [] },
    }));
    setActiveSessionId(id);
    setActiveView('chat');
  }, [lang, setActiveView]);

  return (
    <GlassShell>
      {splashState !== 'off' && (
        <SplashScreen onEnter={dismissSplash} onCreateOc={() => { dismissSplash(); navigate('/create-oc'); }} fadingOut={splashState === 'fading'} />
      )}

      {!isMobile && (
        <Sidebar
          active={active}
          setActive={setActiveView}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onNewSession={newSession}
          onOpenPalette={() => {}}
          avatarDataUrl={avatarDataUrl}
        />
      )}

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', position: 'relative',
        paddingBottom: isMobile ? 56 : 0,
      }}>
        <Routes>
          <Route path="/" element={
            <HomeView onSendTask={sendInSession} onPickQuickStart={handleQuickStart} avatarDataUrl={avatarDataUrl} />
          } />
          <Route path="/home" element={
            <HomeView onSendTask={sendInSession} onPickQuickStart={handleQuickStart} avatarDataUrl={avatarDataUrl} />
          } />
          <Route path="/chat" element={
            <ChatView
              messages={activeSession?.messages || []}
              onSend={sendInSession}
              isThinking={isThinking}
              sessionTitle={activeSession?.title}
              ttsEnabled={ttsEnabled}
              avatarDataUrl={avatarDataUrl}
            />
          } />
          <Route path="/world" element={<WorldView />} />
          <Route path="/rewind" element={<RewindView />} />
          <Route path="/memory" element={<MemoryView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/create-oc" element={
            <CreateOcView onCreated={(url) => setAvatarDataUrl(url)} />
          } />
        </Routes>
      </main>

      {isMobile ? (
        <MobileTabBar active={active} setActive={setActiveView} />
      ) : (
        <TopBar theme={theme} setTheme={setTheme} />
      )}
    </GlassShell>
  );
}

function nowTime() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

export default function App() {
  return (
    <LangProvider>
      <AppContent />
    </LangProvider>
  );
}
