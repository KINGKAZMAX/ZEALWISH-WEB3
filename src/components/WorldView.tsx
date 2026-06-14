import { useEffect, useRef, useCallback } from "react";
import type { CharacterConfig, Relationship } from "../types";
import { stageLabel } from "./shared";

// Phaser is loaded dynamically at runtime via <script> tag.
// We use a minimal type alias to avoid requiring the phaser npm package.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PhaserGame = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PhaserScene = any;

// ─── 布局配置（与 Star-Office-UI layout.js 一致）────────────────
const LAYOUT = {
  game: { width: 1280, height: 720 },
  areas: {
    door: { x: 640, y: 550 },
    writing: { x: 320, y: 360 },
    researching: { x: 320, y: 360 },
    error: { x: 1066, y: 180 },
    breakroom: { x: 640, y: 360 },
  } as Record<string, { x: number; y: number }>,
  furniture: {
    sofa: { x: 670, y: 144, origin: { x: 0, y: 0 }, depth: 10 },
    desk: { x: 218, y: 417, origin: { x: 0.5, y: 0.5 }, depth: 1000 },
    flower: { x: 310, y: 390, origin: { x: 0.5, y: 0.5 }, depth: 1100, scale: 0.8 },
    starWorking: { x: 217, y: 333, origin: { x: 0.5, y: 0.5 }, depth: 900, scale: 1.32 },
    plants: [
      { x: 565, y: 178, depth: 5 },
      { x: 230, y: 185, depth: 5 },
      { x: 977, y: 496, depth: 5 },
    ],
    poster: { x: 252, y: 66, depth: 4 },
    coffeeMachine: { x: 659, y: 397, origin: { x: 0.5, y: 0.5 }, depth: 99 },
    serverroom: { x: 1021, y: 142, origin: { x: 0.5, y: 0.5 }, depth: 2 },
    errorBug: { x: 1007, y: 221, origin: { x: 0.5, y: 0.5 }, depth: 50, scale: 0.9, pingPong: { leftX: 1007, rightX: 1111, speed: 0.6 } },
    syncAnim: { x: 1157, y: 592, origin: { x: 0.5, y: 0.5 }, depth: 40 },
    cat: { x: 94, y: 557, origin: { x: 0.5, y: 0.5 }, depth: 2000 },
  },
  plaque: { x: 640, y: 720 - 36, width: 420, height: 44 },
} as const;

// 状态定义
const STATES: Record<string, { name: string; area: string }> = {
  idle: { name: "待命", area: "breakroom" },
  writing: { name: "整理文档", area: "writing" },
  researching: { name: "搜索信息", area: "researching" },
  executing: { name: "执行任务", area: "writing" },
  syncing: { name: "同步备份", area: "writing" },
  error: { name: "出错了", area: "error" },
};

const BUBBLE_TEXTS: Record<string, string[]> = {
  idle: ["待命中：耳朵竖起来了", "我在这儿，随时可以开工", "先把桌面收拾干净再说", "呼——给大脑放个风", "今天也要优雅地高效"],
  writing: ["进入专注模式：勿扰", "先把关键路径跑通", "我来把复杂变简单", "写到一半，先保存", "稳住，我们能赢"],
  researching: ["我在挖证据链", "让我把信息熬成结论", "找到了：关键在这里", "先定位，再优化"],
  executing: ["执行中：不要眨眼", "把任务切成小块逐个击破", "让结果自己说话"],
  syncing: ["同步中：把今天锁进云里", "备份不是仪式，是安全感", "写入中…别断电"],
  error: ["警报响了：先别慌", "先复现，再谈修复", "错误不是敌人，是线索"],
  cat: ["喵~", "咕噜咕噜…", "尾巴摇一摇", "晒太阳最开心", "我是这个办公室的吉祥物"],
};

const ASSET_BASE = "/star-office";

export function WorldView({
  character,
  relationship,
}: {
  character: CharacterConfig | null;
  relationship: Relationship | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<PhaserGame | null>(null);
  const mountedRef = useRef(true);

  const initGame = useCallback(() => {
    if (!containerRef.current || gameRef.current) return;

    // 动态加载 Phaser
    const script = document.createElement("script");
    script.src = `${ASSET_BASE}/vendor/phaser-3.80.1.min.js`;
    script.onload = () => {
      if (!mountedRef.current || !containerRef.current) return;

      // Phaser is loaded globally via script tag
      const Phaser = window.Phaser;
      if (!Phaser) return;

      // 状态变量（挂载到 window 上供 game loop 使用）
      const state: Record<string, unknown> = {
        currentState: "idle",
        lastBubble: 0,
        lastCatBubble: 0,
        bubble: null,
        catBubble: null,
        errorBugDir: 1,
      };

      const config: Record<string, unknown> = {
        type: Phaser.AUTO,
        width: LAYOUT.game.width,
        height: LAYOUT.game.height,
        parent: containerRef.current!,
        pixelArt: true,
        backgroundColor: "#1a1a2e",
        scene: {
          preload(this: PhaserScene) {
            this.load.image("office_bg", `${ASSET_BASE}/office_bg_small.webp`);
            this.load.spritesheet("star_idle", `${ASSET_BASE}/star-idle-v5.png`, { frameWidth: 128, frameHeight: 128 });
            this.load.image("sofa_idle", `${ASSET_BASE}/sofa-idle-v3.png`);
            this.load.spritesheet("plants", `${ASSET_BASE}/plants-spritesheet.webp`, { frameWidth: 160, frameHeight: 160 });
            this.load.spritesheet("posters", `${ASSET_BASE}/posters-spritesheet.webp`, { frameWidth: 160, frameHeight: 160 });
            this.load.spritesheet("coffee_machine", `${ASSET_BASE}/coffee-machine-v3-grid.webp`, { frameWidth: 230, frameHeight: 230 });
            this.load.spritesheet("serverroom", `${ASSET_BASE}/serverroom-spritesheet.webp`, { frameWidth: 180, frameHeight: 251 });
            this.load.spritesheet("error_bug", `${ASSET_BASE}/error-bug-spritesheet-grid.webp`, { frameWidth: 180, frameHeight: 180 });
            this.load.spritesheet("cats", `${ASSET_BASE}/cats-spritesheet.webp`, { frameWidth: 160, frameHeight: 160 });
            this.load.image("desk", `${ASSET_BASE}/desk-v3.webp`);
            this.load.spritesheet("star_working", `${ASSET_BASE}/star-working-spritesheet-grid.webp`, { frameWidth: 230, frameHeight: 144 });
            this.load.spritesheet("sync_anim", `${ASSET_BASE}/sync-animation-v3-grid.webp`, { frameWidth: 256, frameHeight: 256 });
            this.load.spritesheet("flowers", `${ASSET_BASE}/flowers-bloom-v2.webp`, { frameWidth: 65, frameHeight: 65 });
          },

          create(this: PhaserScene) {
            const game = this.game;
            const cam = this.cameras.main;

            // 背景
            this.add.image(640, 360, "office_bg");

            // 沙发
            const sofa = this.add.sprite(LAYOUT.furniture.sofa.x, LAYOUT.furniture.sofa.y, "sofa_idle")
              .setOrigin(0, 0)
              .setDepth(LAYOUT.furniture.sofa.depth);

            // 植物
            for (let i = 0; i < LAYOUT.furniture.plants.length; i++) {
              const p = LAYOUT.furniture.plants[i];
              const plant = this.add.sprite(p.x, p.y, "plants", Math.floor(Math.random() * 16))
                .setOrigin(0.5).setDepth(p.depth);
              plant.setInteractive({ useHandCursor: true });
              plant.on("pointerdown", () => plant.setFrame(Math.floor(Math.random() * 16)));
            }

            // 海报
            const poster = this.add.sprite(LAYOUT.furniture.poster.x, LAYOUT.furniture.poster.y, "posters", Math.floor(Math.random() * 32))
              .setOrigin(0.5).setDepth(LAYOUT.furniture.poster.depth);
            poster.setInteractive({ useHandCursor: true });
            poster.on("pointerdown", () => poster.setFrame(Math.floor(Math.random() * 32)));

            // 小猫
            const cat = this.add.sprite(LAYOUT.furniture.cat.x, LAYOUT.furniture.cat.y, "cats", Math.floor(Math.random() * 16))
              .setOrigin(0.5, 0.5).setDepth(LAYOUT.furniture.cat.depth);
            cat.setInteractive({ useHandCursor: true });
            cat.on("pointerdown", () => cat.setFrame(Math.floor(Math.random() * 16)));
            (state as Record<string, unknown>).catSprite = cat;

            // 咖啡机动画
            this.anims.create({
              key: "coffee_machine",
              frames: this.anims.generateFrameNumbers("coffee_machine", { start: 0, end: 95 }),
              frameRate: 12.5,
              repeat: -1,
            });
            const coffeeMachine = this.add.sprite(
              LAYOUT.furniture.coffeeMachine.x,
              LAYOUT.furniture.coffeeMachine.y,
              "coffee_machine",
            ).setOrigin(0.5, 0.5).setDepth(LAYOUT.furniture.coffeeMachine.depth);
            coffeeMachine.anims.play("coffee_machine", true);

            // 服务器区动画
            this.anims.create({
              key: "serverroom_on",
              frames: this.anims.generateFrameNumbers("serverroom", { start: 0, end: 39 }),
              frameRate: 6,
              repeat: -1,
            });
            const serverroom = this.add.sprite(
              LAYOUT.furniture.serverroom.x,
              LAYOUT.furniture.serverroom.y,
              "serverroom",
              0,
            ).setOrigin(0.5, 0.5).setDepth(LAYOUT.furniture.serverroom.depth);
            (state as Record<string, unknown>).serverroom = serverroom;

            // 办公桌
            this.add.image(LAYOUT.furniture.desk.x, LAYOUT.furniture.desk.y, "desk")
              .setOrigin(0.5, 0.5).setDepth(LAYOUT.furniture.desk.depth);

            // 花盆
            const flower = this.add.sprite(
              LAYOUT.furniture.flower.x,
              LAYOUT.furniture.flower.y,
              "flowers",
              Math.floor(Math.random() * 16),
            ).setOrigin(0.5, 0.5).setScale(LAYOUT.furniture.flower.scale || 1)
              .setDepth(LAYOUT.furniture.flower.depth);
            flower.setInteractive({ useHandCursor: true });
            flower.on("pointerdown", () => flower.setFrame(Math.floor(Math.random() * 16)));

            // Star 工作动画
            this.anims.create({
              key: "star_working",
              frames: this.anims.generateFrameNumbers("star_working", { start: 0, end: 191 }),
              frameRate: 12,
              repeat: -1,
            });

            // 错误 bug 动画
            this.anims.create({
              key: "error_bug",
              frames: this.anims.generateFrameNumbers("error_bug", { start: 0, end: 95 }),
              frameRate: 12,
              repeat: -1,
            });
            const errorBug = this.add.sprite(
              LAYOUT.furniture.errorBug.x,
              LAYOUT.furniture.errorBug.y,
              "error_bug",
              0,
            ).setOrigin(0.5, 0.5).setDepth(LAYOUT.furniture.errorBug.depth)
              .setVisible(false).setScale(LAYOUT.furniture.errorBug.scale || 0.9);
            errorBug.anims.play("error_bug", true);
            (state as Record<string, unknown>).errorBug = errorBug;

            // 同步动画
            this.anims.create({
              key: "sync_anim",
              frames: this.anims.generateFrameNumbers("sync_anim", { start: 1, end: 52 }),
              frameRate: 12,
              repeat: -1,
            });
            const syncAnimSprite = this.add.sprite(
              LAYOUT.furniture.syncAnim.x,
              LAYOUT.furniture.syncAnim.y,
              "sync_anim",
              0,
            ).setOrigin(0.5, 0.5).setDepth(LAYOUT.furniture.syncAnim.depth);
            syncAnimSprite.anims.stop();
            (state as Record<string, unknown>).syncAnimSprite = syncAnimSprite;

            // Star 在桌前工作
            const starWorking = this.add.sprite(
              LAYOUT.furniture.starWorking.x,
              LAYOUT.furniture.starWorking.y,
              "star_working",
              0,
            ).setOrigin(0.5, 0.5).setVisible(false)
              .setScale(LAYOUT.furniture.starWorking.scale || 1.32)
              .setDepth(LAYOUT.furniture.starWorking.depth);
            (state as Record<string, unknown>).starWorking = starWorking;

            // 牌匾
            const plaqueX = LAYOUT.plaque.x;
            const plaqueY = LAYOUT.plaque.y;
            const ocName = character?.name?.trim() || "OC";
            this.add.rectangle(plaqueX, plaqueY, LAYOUT.plaque.width, LAYOUT.plaque.height, 0x5d4037)
              .setStrokeStyle(3, 0x3e2723);
            this.add.text(plaqueX, plaqueY, `${ocName} 的世界`, {
              fontFamily: "monospace",
              fontSize: "18px",
              fill: "#ffd700",
              fontWeight: "bold",
              stroke: "#000",
              strokeThickness: 2,
            }).setOrigin(0.5);
            this.add.text(plaqueX - 190, plaqueY, "\u2B50", { fontFamily: "monospace", fontSize: "20px" }).setOrigin(0.5);
            this.add.text(plaqueX + 190, plaqueY, "\u2B50", { fontFamily: "monospace", fontSize: "20px" }).setOrigin(0.5);

            // 关系状态标签
            const stageText = stageLabel(relationship?.stage);
            const intimacyText = `亲密度 ${relationship?.intimacy ?? 0}`;
            this.add.text(plaqueX, plaqueY + 36, `${stageText} \u00B7 ${intimacyText}`, {
              fontFamily: "monospace",
              fontSize: "13px",
              fill: "#c8b896",
            }).setOrigin(0.5);

            // 将状态引用保存到组件作用域
            (state as Record<string, unknown>).game = game;
            (state as Record<string, unknown>).sofa = sofa;
          },

          update(this: PhaserScene, time: number) {
            const s = state as Record<string, unknown>;
            const serverroom = s.serverroom as PhaserGame | undefined;
            const errorBug = s.errorBug as PhaserGame | undefined;
            const syncAnimSprite = s.syncAnimSprite as PhaserGame | undefined;
            const catSprite = s.catSprite as PhaserGame | undefined;
            const currentStatus = s.currentState as string;

            // 服务器区：非 idle 时运转
            if (serverroom) {
              if (currentStatus === "idle") {
                if (serverroom.anims.isPlaying) { serverroom.anims.stop(); serverroom.setFrame(0); }
              } else {
                if (!serverroom.anims.isPlaying) { serverroom.anims.play("serverroom_on", true); }
              }
            }

            // Error bug
            if (errorBug) {
              if (currentStatus === "error") {
                errorBug.setVisible(true);
                if (!errorBug.anims.isPlaying || errorBug.anims.currentAnim?.key !== "error_bug") {
                  errorBug.anims.play("error_bug", true);
                }
                const pp = LAYOUT.furniture.errorBug.pingPong;
                const dir = (s.errorBugDir as number) || 1;
                errorBug.x += pp.speed * dir;
                if (errorBug.x >= pp.rightX) { errorBug.x = pp.rightX; s.errorBugDir = -1; }
                else if (errorBug.x <= pp.leftX) { errorBug.x = pp.leftX; s.errorBugDir = 1; }
              } else {
                errorBug.setVisible(false);
                errorBug.anims.stop();
              }
            }

            // 同步动画
            if (syncAnimSprite) {
              if (currentStatus === "syncing") {
                if (!syncAnimSprite.anims.isPlaying) { syncAnimSprite.anims.play("sync_anim", true); }
              } else {
                if (syncAnimSprite.anims.isPlaying) { syncAnimSprite.anims.stop(); syncAnimSprite.setFrame(0); }
              }
            }

            // 气泡
            if (time - (s.lastBubble as number) > 8000) {
              showBubble(s, this, currentStatus);
              s.lastBubble = time;
            }

            // 猫咪气泡
            if (time - (s.lastCatBubble as number) > 18000) {
              showCatBubble(s, this, catSprite);
              s.lastCatBubble = time;
            }
          },
        },
      };

      gameRef.current = new (window.Phaser as unknown as { Game: new (c: Record<string, unknown>) => PhaserGame }).Game(config);
      (window as unknown as Record<string, unknown>).__worldState = state;
    };

    document.head.appendChild(script);
  }, [character?.name, relationship?.stage, relationship?.intimacy]);

  useEffect(() => {
    mountedRef.current = true;
    initGame();

    return () => {
      mountedRef.current = false;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      // 清理全局状态
      delete (window as unknown as Record<string, unknown>).__worldState;
    };
  }, [initGame]);

  // 外部可调用的状态切换方法
  useEffect(() => {
    const gs = (window as unknown as Record<string, unknown>).__worldState as Record<string, unknown> | undefined;
    if (!gs) return;

    const newState = deriveOCState(character, relationship);
    gs.currentState = newState;
  }, [character, relationship]);

  return (
    <div className="oc-world-page">
      {/* 信息面板 */}
      <section className="oc-world-info-bar">
        <div className="oc-world-info-bar__left">
          <span className="oc-world-info-bar__kicker mono">PIXEL WORLD</span>
          <h2 className="oc-world-info-bar__title serif">{character?.name?.trim() || "OC"} 的世界</h2>
        </div>
        <div className="oc-world-info-bar__right">
          <span className="oc-badge">{stageLabel(relationship?.stage)}</span>
          <span className="oc-badge">亲密度 {relationship?.intimacy ?? 0}</span>
        </div>
      </section>

      {/* Phaser 游戏容器 */}
      <div
        ref={containerRef}
        className="oc-world-canvas-wrap"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 1280,
          aspectRatio: "1280 / 720",
          margin: "0 auto",
          borderRadius: 18,
          overflow: "hidden",
          border: "4px solid #64477d",
          imageRendering: "pixelated",
          background: "#1a1a2e",
        }}
      >
        {/* 加载骨架屏 */}
        <div className="oc-world-skeleton">
          <div className="oc-world-skeleton__pulse" />
          <p className="oc-world-skeleton__text mono">正在加载像素世界...</p>
        </div>
      </div>

      {/* 底部说明 */}
      <section className="oc-world-footer">
        <p className="oc-page-copy" style={{ textAlign: "center", fontSize: 13 }}>
          基于{" "}
          <a
            href="https://github.com/ringhyacinth/Star-Office-UI"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--accent-deep)", textDecoration: "underline" }}
          >
            Star Office UI
          </a>{" "}
          · 像素风 AI 办公室看板 · OC 在这里生活、工作、等待你
        </p>
      </section>
    </div>
  );
}

// ─── 辅助函数 ────────────────────────────────────────────────

function deriveOCState(character: CharacterConfig | null, relationship: Relationship | null): string {
  // 根据 OC 当前状态推导显示状态
  // 默认 idle，后续可以根据聊天/任务状态动态调整
  if (!character?.name?.trim()) return "idle";

  // 如果亲密度很低，显示 researching（在探索关系）
  if ((relationship?.intimacy ?? 0) < 10) return "researching";
  // 中等亲密度显示 writing（在写回忆/记忆）
  if ((relationship?.intimacy ?? 0) < 50) return "writing";
  // 高亲密度显示 idle（舒适待命）
  return "idle";
}

function showBubble(state: Record<string, unknown>, scene: PhaserScene, currentState: string) {
  const texts = BUBBLE_TEXTS[currentState] || BUBBLE_TEXTS.idle;
  if (currentState === "idle") return;

  let anchorX = 640;
  let anchorY = 360;

  const syncAnim = state.syncAnimSprite as PhaserGame | undefined;
  const errorBug = state.errorBug as PhaserGame | undefined;
  const starWorking = state.starWorking as PhaserGame | undefined;

  if (currentState === "syncing" && syncAnim?.visible) { anchorX = syncAnim.x; anchorY = syncAnim.y; }
  else if (currentState === "error" && errorBug?.visible) { anchorX = errorBug.x; anchorY = errorBug.y; }
  else if (starWorking?.visible) { anchorX = starWorking.x; anchorY = starWorking.y; }

  const text = texts[Math.floor(Math.random() * texts.length)];
  const bubbleY = anchorY - 70;
  const bg = scene.add.rectangle(anchorX, bubbleY, text.length * 10 + 20, 28, 0xffffff, 0.95);
  bg.setStrokeStyle(2, 0x000000);
  const txt = scene.add.text(anchorX, bubbleY, text, {
    fontFamily: "monospace",
    fontSize: "12px",
    fill: "#000",
    align: "center",
  }).setOrigin(0.5);
  const bubble = scene.add.container(0, 0, [bg, txt]);
  bubble.setDepth(1200);

  // 销毁旧气泡
  if (state.bubble) { (state.bubble as PhaserGame).destroy(); }
  state.bubble = bubble;

  scene.time.delayedCall(3000, () => {
    if (state.bubble === bubble) { bubble.destroy(); state.bubble = null; }
  });
}

function showCatBubble(state: Record<string, unknown>, scene: PhaserScene, catSprite?: PhaserGame) {
  if (!catSprite) return;
  const texts = BUBBLE_TEXTS.cat || ["\u55E5~"];
  const text = texts[Math.floor(Math.random() * texts.length)];
  const anchorX = catSprite.x;
  const anchorY = catSprite.y - 60;
  const bg = scene.add.rectangle(anchorX, anchorY, text.length * 10 + 20, 24, 0xfffbeb, 0.95);
  bg.setStrokeStyle(2, 0xd4a574);
  const txt = scene.add.text(anchorX, anchorY, text, {
    fontFamily: "monospace",
    fontSize: "11px",
    fill: "#8b6914",
    align: "center",
  }).setOrigin(0.5);
  const catBubble = scene.add.container(0, 0, [bg, txt]);
  catBubble.setDepth(2100);

  if (state.catBubble) { (state.catBubble as PhaserGame).destroy(); }
  state.catBubble = catBubble;

  scene.time.delayedCall(4000, () => {
    if (state.catBubble === catBubble) { catBubble.destroy(); state.catBubble = null; }
  });
}
