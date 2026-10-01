// ZEALWISH v3 — i18n dictionary + LangContext.
// Two locales: 'zh' (default), 'en'. Strings used across views/sidebar/splash.

const I18N = {
  zh: {
    // app frame
    'app.tagline':       '桌面的住人',
    'app.subtitle':      'ZEALWISH · v0.3 · Glass',

    // nav
    'nav.home':          '广场',
    'nav.chat':          '对话',
    'nav.world':        '世界',
    'nav.rewind':        '回溯',
    'nav.memory':        '记录',
    'nav.settings':      '设置',

    // onboarding ritual
    'onboard.replay':    '重新举行入住仪式',
    'onboard.replay.hint':'让 TA 重新搬来一次',

    // intimacy
    'intimacy.label':    '亲密度',

    // theme picker
    'theme.preset.oz':       'OZ 红',
    'theme.preset.magenta':  'OC 品红',
    'theme.preset.cyan':     '海雾青',
    'theme.preset':          '主题色',

    // sidebar misc
    'sidebar.chats':     '对话',
    'sidebar.new':       '开始新对话',
    'sidebar.search':    '搜索 / ⌘K',
    'sidebar.today':     '今天',
    'sidebar.earlier':   '更早',
    'sidebar.affinity':  '亲密度',
    'sidebar.day':       'DAY',

    // home / plaza
    'home.greeting.kicker': 'TA 今天对你说',
    'home.greeting.line1':  '今天没什么大事，',
    'home.greeting.line2':  '但我注意到你昨晚很晚才睡。',
    'home.greeting.log':    '14:32 · LOG #0427',
    'home.quick.title':     '快速入口',
    'home.quick.count':     '06 ROOMS',
    'home.placeholder':     '说点什么，或交给 TA 一件小事…',
    'home.status':          'TA 安静在桌面角落 · 不会打扰你',
    'home.affinity':        'AFFINITY 412 / 1000',

    // quick gates
    'gate.readme.label':    'Read Me',
    'gate.readme.body':     '把最近的对话和兴趣，整理成 TA 眼中的你。',
    'gate.insights.label':  'Insights',
    'gate.insights.body':   '看看这周的注意力都流向了哪里。',
    'gate.plan.label':      'Plan',
    'gate.plan.body':       '基于你当前的状态，决定先处理哪件事。',
    'gate.unblock.label':   'Unblock',
    'gate.unblock.body':    '找出最可能卡住你的那一步。',
    'gate.daily.label':     'Daily Report',
    'gate.daily.body':      '给今天写一段简短而真诚的总结。',
    'gate.snapshot.label':  'Snapshot',
    'gate.snapshot.body':   '此刻 TA 看见的你，是什么样子。',

    // chat
    'chat.empty.title':     '说点什么',
    'chat.empty.sub':       'TA IS LISTENING · 慢慢来',
    'chat.placeholder':     '今天怎么样…',
    'chat.send':            '发送',
    'chat.opener.tired':    '今天有点累',
    'chat.opener.organize': '帮我整理一下思路',
    'chat.opener.happy':    '聊点开心的',
    'chat.opener.delay':    '我又拖延了…',
    'chat.subtitle':        'TALK',
    'chat.new':             '新对话',
    'chat.count':           '条',

    // rewind
    'rewind.title':         '回溯',
    'rewind.subtitle':      'REWIND · 27 天的相处',
    'rewind.note.kicker':   'NOTE',
    'rewind.note.body':     '这里不是日记，也不是档案。是 TA 在和你相处的过程里，悄悄留下来的一些小事。',

    // record
    'record.title':         '记录',
    'record.subtitle':      'RECORD · TA 替你记得的事',
    'record.search':        '搜索：人、事、感受…',
    'record.items':         'ITEMS',
    'record.group.you':     '关于你',
    'record.group.people':  '你提过的人',
    'record.group.thoughts':'挂念的事',

    // settings
    'settings.title':       '设置',
    'settings.subtitle':    'SETTINGS · 个性化',
    'settings.section.character': '角色',
    'settings.section.ui':        '界面',
    'settings.section.demo':      '演示',
    'settings.name':        '名字',
    'settings.name.hint':   '给 TA 一个名字',
    'settings.callme':      'TA 怎么称呼你',
    'settings.callme.hint': '默认是「你」',
    'settings.hue':         '主色调',
    'settings.hue.hint':    'OZ 红 → 移动到喜欢的颜色',
    'settings.replay':      '重新播放欢迎画面',
    'settings.replay.hint': '再看一遍开场',
    'settings.replay.btn':  '重播',

    // splash
    'splash.subhead':       '角落的住人',
    'splash.body':          'ZEALWISH 为你生成一个 OC——不是 app，也不是聊天机器人。TA 住在你屏幕的边缘，不抢你的注意力，只在该出现时出现。',
    'splash.enter':         '进入',

    // topbar
    'topbar.lang':          '语言',
    'topbar.theme.light':   '浅色',
    'topbar.theme.dark':    '深色',
  },
  en: {
    'app.tagline':       'Desktop dweller',
    'app.subtitle':      'ZEALWISH · v0.3 · Glass',

    'nav.home':          'Plaza',
    'nav.chat':          'Talk',
    'nav.world':        'World',
    'nav.rewind':        'Rewind',
    'nav.memory':        'Record',
    'nav.settings':      'Settings',

    'onboard.replay':    'Re-stage move-in ritual',
    'onboard.replay.hint':'Let them move in again',

    'intimacy.label':    'Intimacy',

    'theme.preset.oz':       'OZ Red',
    'theme.preset.magenta':  'OC Magenta',
    'theme.preset.cyan':     'Sea Mist',
    'theme.preset':          'Accent preset',

    'sidebar.chats':     'Chats',
    'sidebar.new':       'New chat',
    'sidebar.search':    'Search / ⌘K',
    'sidebar.today':     'Today',
    'sidebar.earlier':   'Earlier',
    'sidebar.affinity':  'Affinity',
    'sidebar.day':       'DAY',

    'home.greeting.kicker': 'They told you today',
    'home.greeting.line1':  'Nothing big today,',
    'home.greeting.line2':  'but I noticed you stayed up late last night.',
    'home.greeting.log':    '14:32 · LOG #0427',
    'home.quick.title':     'Quick gates',
    'home.quick.count':     '06 ROOMS',
    'home.placeholder':     'Say something, or hand them a small task…',
    'home.status':          'They wait quietly in your corner · never interrupt',
    'home.affinity':        'AFFINITY 412 / 1000',

    'gate.readme.label':    'Read Me',
    'gate.readme.body':     'Turn recent chats into a portrait of you, in their eyes.',
    'gate.insights.label':  'Insights',
    'gate.insights.body':   'See where your attention flowed this week.',
    'gate.plan.label':      'Plan',
    'gate.plan.body':       'Pick what to handle first, given how you feel right now.',
    'gate.unblock.label':   'Unblock',
    'gate.unblock.body':    'Find the single step most likely to be stuck.',
    'gate.daily.label':     'Daily Report',
    'gate.daily.body':      'A short, honest summary of today.',
    'gate.snapshot.label':  'Snapshot',
    'gate.snapshot.body':   'How you look right now, in their eyes.',

    'chat.empty.title':     'Say something',
    'chat.empty.sub':       'TA IS LISTENING · take your time',
    'chat.placeholder':     'How is today…',
    'chat.send':            'Send',
    'chat.opener.tired':    "I'm a bit tired",
    'chat.opener.organize': 'Help me think this through',
    'chat.opener.happy':    "Let's talk about something nice",
    'chat.opener.delay':    "I've been procrastinating…",
    'chat.subtitle':        'TALK',
    'chat.new':             'New chat',
    'chat.count':           'msgs',

    'rewind.title':         'Rewind',
    'rewind.subtitle':      'REWIND · 27 days together',
    'rewind.note.kicker':   'NOTE',
    'rewind.note.body':     'Not a diary, not an archive. Just little things they kept while you were busy living.',

    'record.title':         'Record',
    'record.subtitle':      "RECORD · what they remember for you",
    'record.search':        'Search: people, things, feelings…',
    'record.items':         'ITEMS',
    'record.group.you':     'About you',
    'record.group.people':  'People you mentioned',
    'record.group.thoughts':'On your mind',

    'settings.title':       'Settings',
    'settings.subtitle':    'SETTINGS · personalization',
    'settings.section.character': 'Character',
    'settings.section.ui':        'Interface',
    'settings.section.demo':      'Demo',
    'settings.name':        'Name',
    'settings.name.hint':   'Give them a name',
    'settings.callme':      'They call you',
    'settings.callme.hint': 'default: "you"',
    'settings.hue':         'Accent hue',
    'settings.hue.hint':    'OZ red → drag to your favorite',
    'settings.replay':      'Replay opening',
    'settings.replay.hint': 'see the intro again',
    'settings.replay.btn':  'Replay',

    'splash.subhead':       'Dweller in the corner',
    'splash.body':          "ZEALWISH generates an OC for you — not an app, not a chatbot. They live at the edge of your screen, never grabbing for attention, appearing only when they should.",
    'splash.enter':         'Enter',

    'topbar.lang':          'Language',
    'topbar.theme.light':   'Light',
    'topbar.theme.dark':    'Dark',
  }
};

const LangContext = React.createContext({ lang: 'en', t: (k) => k, setLang: () => {} });

function useT() {
  return React.useContext(LangContext);
}

window.I18N = I18N;
window.LangContext = LangContext;
window.useT = useT;
