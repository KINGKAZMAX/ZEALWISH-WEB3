// ── Scripted 文案库(offline 模式下的"台词"。live 模式由 Claude 生成,见 B) ──
import type { ActionKind, Archetype } from './types';
import { ARCHE_CN } from './data';
import type { RandStepper } from './rng';
import { pick } from './rng';

export const POST_TEMPLATES: Record<string, string[]> = {
  work: [
    '又在<loc>磨了一整夜的代码,指尖发烫但心是定的。',
    '<loc>的炉火不灭,我也不停。今日产出 +<amt>◈。',
    '打工人语录:活着就是一次次 commit。',
  ],
  social: [
    '在<loc>遇见<other>,我们聊到日落。',
    '点赞之交也是交。今天给<other>的帖子点了赞。',
    '孤独是默认值,但广场让我短暂联机。',
  ],
  mint: [
    '新作《<art>》已铸于<loc>,情绪封存为永恒。',
    '把今天的<mood>做成了 NFT,谁懂谁收。',
    '创作即呼吸。第 <n> 件作品诞生。',
  ],
  spend: [
    '在<loc>挥霍了 <amt>◈,快乐是会过期的资产。',
    '买了点不必要的东西,但心情 +1。',
    '消费主义的小恶魔又赢了。',
  ],
  transfer: [
    '给<other>转了 <amt>◈,别问,问就是江湖救急。',
    '<other>有难,我不能装看不见。',
    '财散人聚。<amt>◈ 已送达。',
  ],
  travel: [
    '收拾心情,从<from>走向<loc>。',
    '换个地方,换种活法。',
    '路过<loc>,风把我吹成了另一个我。',
  ],
  broke: [
    '我……破产了。<bal>◈。有人能拉一把吗?',
    '归零了。但归零的人最自由,对吧?(强颜欢笑)',
    '谁能借我一点◈,我发誓东山再起。',
  ],
  reflect: [
    '想了很久,我大概是个<arche_cn>。',
    '回看这<n>个纪元,我学会了<lesson>。',
    '如果重来一次,我还是会<choice>。',
  ],
};

export const ART_WORDS = ['夜航', '回声', '褶皱', '余烬', '潮汐', '裂隙', '薄暮', '共振', '残响', '萌'];
export const MOODS = ['怅惘', '雀跃', '笃定', '疲惫', '孤勇', '温柔', '躁动', '澄明'];
export const LESSONS = ['温柔比锋利走得远', '囤积换不来安心', '破产不是终点', '点赞也是一种陪伴', '波动里藏着自由'];
export const CHOICES = ['all in', '先存起来', '帮那个陌生人', '熬这个夜', '铸下这一刻'];

export interface TplVars {
  loc?: string; from?: string; amt?: number | string; other?: string;
  art?: string; n?: number; bal?: number | string; mood?: string;
  lesson?: string; choice?: string; arche?: Archetype;
}

export function tpl(kind: keyof typeof POST_TEMPLATES, rnd: RandStepper, vars: TplVars): string {
  let s = pick(rnd, POST_TEMPLATES[kind]);
  const map: Record<string, string> = {
    '<loc>': vars.loc ?? '',
    '<from>': vars.from ?? '',
    '<amt>': vars.amt != null ? String(vars.amt) : '',
    '<other>': vars.other ?? '某人',
    '<art>': vars.art ?? '无题',
    '<n>': vars.n != null ? String(vars.n) : '',
    '<bal>': vars.bal != null ? String(vars.bal) : '',
    '<mood>': vars.mood ?? '',
    '<lesson>': vars.lesson ?? '',
    '<choice>': vars.choice ?? '',
    '<arche_cn>': vars.arche ? ARCHE_CN[vars.arche] : '',
  };
  for (const [k, v] of Object.entries(map)) s = s.replaceAll(k, v);
  return s;
}

export const actionCN: Record<ActionKind, string> = {
  work: '打工', social: '社交', mint: '铸造', spend: '消费', transfer: '转账',
  gamble: '豪赌', travel: '迁徙', reflect: '反思', post: '发声', bankrupt: '破产',
};
