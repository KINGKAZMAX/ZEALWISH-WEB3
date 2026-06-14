import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const rootIndexPath = join(root, "index.html");
const indexPath = join(root, "frontend-v4", "index.html");
const webPath = join(root, "frontend-v4", "web.html");
const landingPath = join(root, "frontend-v4", "src", "v5", "zealwish-landing.jsx");
const landingBundlePath = join(root, "frontend-v4", "src", "v5", "zealwish-landing.js");
const webAppPath = join(root, "frontend-v4", "src", "v6", "zealwish-web-app.jsx");
const webAppBundlePath = join(root, "frontend-v4", "src", "v6", "zealwish-web-app.js");
const walletPath = join(root, "frontend-v4", "src", "v4", "wallet-service.jsx");
const walletRuntimePath = join(root, "frontend-v4", "src", "v4", "wallet-service.js");
const webBundleScriptPath = join(root, "scripts", "build-zealwish-web-app.mjs");
const landingBundleScriptPath = join(root, "scripts", "build-zealwish-landing.mjs");
const architecturePath = join(root, "docs", "architecture", "web-architecture.md");
const webServerPath = join(root, "ocworld-web", "server.js");
const vercelConfigPath = join(root, "vercel.json");
const chinesePattern = /[一-鿿]/;
const cacheBusterPattern = /\?v=\d{8}-\d{4}/;
const expectedMainCharacterHash = "c8b5166f56b2fbb5e58999cea670732a5e6516f8b9a4b2f07aa1ae6ffe11cf4c";

const apiFunctionNames = [
  "chat.js",
  "speak.js",
  "generate-image.js",
  "analyze-photo.js",
  "detect-gender.js",
  "health.js",
];

describe("frontend-v4 ZEALWISH voice-first web product", () => {
  it("keeps the Vite/root entry branded as ZEALWISH English-only", () => {
    const rootIndex = readFileSync(rootIndexPath, "utf8");

    expect(rootIndex).toContain('lang="en"');
    expect(rootIndex).toContain("ZEALWISH");
    expect(rootIndex).not.toContain("OC World");
    expect(rootIndex).not.toContain("OCWORLD");
    expect(rootIndex).not.toMatch(chinesePattern);
  });

  it("ships the landing with vendored React and precompiled bundles — no unpkg, no in-browser Babel", () => {
    const index = readFileSync(indexPath, "utf8");

    expect(index).toContain("ZEALWISH");
    expect(index).toContain('src="vendor/react.production.min.js"');
    expect(index).toContain('src="vendor/react-dom.production.min.js"');
    expect(index).toMatch(/src="src\/v4\/wallet-service\.js\?v=\d{8}-\d{4}"/);
    expect(index).toMatch(/src="src\/v5\/zealwish-landing\.js\?v=\d{8}-\d{4}"/);
    expect(index).not.toContain("unpkg.com");
    expect(index).not.toContain("@babel/standalone");
    expect(index).not.toContain('type="text/babel"');
    expect(index).not.toContain('src="src/v4/wallet-service.jsx"');
    expect(index).not.toContain('src="src/v5/zealwish-landing.jsx"');
    expect(index).not.toMatch(/ocworld/i);
    expect(index).not.toMatch(chinesePattern);
  });

  it("positions the landing as a voice-first companion with working workspace CTAs", () => {
    expect(existsSync(landingPath)).toBe(true);
    expect(existsSync(landingBundlePath)).toBe(true);
    const landing = readFileSync(landingPath, "utf8");

    expect(landing).toContain("remembers");
    expect(landing).toContain("Start talking");
    expect(landing).toContain("web.html#/talk");
    expect(landing).toContain("web.html#/create");
    expect(landing).toContain("web.html#/home");
    expect(landing).toContain("Open ZEALWISH Web");
    expect(landing).toContain("NFT is not the product. Ownership is.");
    expect(landing).toContain("Built for ownership, not speculation");
    expect(landing).toContain("Connect OKX Wallet");
    expect(landing).toContain("handleConnectWallet");
    expect(landing).toContain("assets/zealwish-main-character.png");
    expect(landing).not.toContain("OCWORLD");
    expect(landing).not.toMatch(chinesePattern);
  });

  it("ships the Web workspace with vendored React and a versioned compiled bundle", () => {
    expect(existsSync(webPath)).toBe(true);
    expect(existsSync(webAppBundlePath)).toBe(true);
    const web = readFileSync(webPath, "utf8");
    const compiled = readFileSync(webAppBundlePath, "utf8");
    const webBundleScript = readFileSync(webBundleScriptPath, "utf8");
    const landingBundleScript = readFileSync(landingBundleScriptPath, "utf8");

    expect(web).toContain("ZEALWISH Web");
    expect(web).toContain('src="vendor/react.production.min.js"');
    expect(web).toContain('src="vendor/react-dom.production.min.js"');
    expect(web).toMatch(/src="src\/v4\/wallet-service\.js\?v=\d{8}-\d{4}"/);
    expect(web).toMatch(/src="src\/v6\/zealwish-web-app\.js\?v=\d{8}-\d{4}"/);
    expect(web).not.toContain("unpkg.com");
    expect(web).not.toContain("react.development.js");
    expect(web).not.toContain("@babel/standalone");
    expect(web).not.toContain('type="text/babel"');
    expect(web).not.toContain('src="src/v4/wallet-service.jsx"');
    expect(web).not.toMatch(/ocworld/i);
    expect(web).not.toMatch(chinesePattern);

    expect(compiled).not.toContain("require(");
    expect(compiled).not.toContain("react/jsx-runtime");
    // ethers verifyMessage is bundled (EIP-191 prefix is embedded by hashMessage).
    expect(compiled).toContain("Ethereum Signed Message");
    expect(webBundleScript).toContain('jsxFactory: "React.createElement"');
    expect(webBundleScript).toContain("cache buster");
    expect(landingBundleScript).toContain("zealwish-landing.jsx");
  });

  it("keeps hash navigation across all workspace modules", () => {
    const webApp = readFileSync(webAppPath, "utf8");

    expect(webApp).toContain("data-zealwish-web-app");
    expect(webApp).toContain("const WEB_APP_MODULES");
    for (const moduleId of ["home", "create", "talk", "memory", "world", "rewind", "settings"]) {
      expect(webApp).toContain(`id: '${moduleId}'`);
      expect(webApp).toContain(`'#/${moduleId}'`);
    }
    expect(webApp).toContain("hashchange");
    expect(webApp).not.toMatch(/ocworld/i);
    expect(webApp).not.toMatch(chinesePattern);
  });

  it("streams chat over SSE with speak-on-first-sentence and a labeled deterministic fallback", () => {
    const webApp = readFileSync(webAppPath, "utf8");

    expect(webApp).toContain("async function streamChat");
    expect(webApp).toContain("text/event-stream");
    expect(webApp).toContain("stream: true");
    expect(webApp).toContain("function firstSentence");
    expect(webApp).toContain("queueSpeech");
    expect(webApp).toContain("WEB_CHAT_FALLBACKS");
    expect(webApp).toContain("source = 'fallback'");
    expect(webApp).toContain("message.source === 'fallback'");
    expect(webApp).toContain("offline echo");
    expect(webApp).toContain("getFallbackReply");
  });

  it("runs a voice-first Talk surface: mic input, auto-speak, toggle, gender voice, presence states", () => {
    const webApp = readFileSync(webAppPath, "utf8");
    const web = readFileSync(webPath, "utf8");

    expect(webApp).toContain("SpeechRecognition");
    expect(webApp).toContain("webkitSpeechRecognition");
    expect(webApp).toContain("resolveVoiceGender");
    expect(webApp).toContain("VOICE_PREF_KEY");
    expect(webApp).toContain("speechSynthesis");
    expect(webApp).toContain("/speak");
    expect(webApp).toContain("audioBase64");
    expect(webApp).toContain("PresenceAvatar");
    expect(webApp).toContain("Waveform");
    expect(web).toContain(".talk-mic-hero");
    expect(web).toContain(".presence");
    expect(web).toContain(".waveform");
    expect(web).toContain("presenceBreath");
    expect(web).toContain("prefers-reduced-motion");
  });

  it("keeps a visible memory vault: facts, episodes, relationship, recall highlight", () => {
    const webApp = readFileSync(webAppPath, "utf8");
    const web = readFileSync(webPath, "utf8");

    expect(webApp).toContain("zealwish.web.vault");
    expect(webApp).toContain("selectRecalledFacts");
    expect(webApp).toContain("recalledAt");
    expect(webApp).toContain("RECALLED JUST NOW");
    expect(webApp).toContain("relationshipScore");
    expect(webApp).toContain("relationshipLevel");
    expect(webApp).toContain("extractFactCandidate");
    expect(webApp).toContain("episodes");
    expect(webApp).toContain("milestones");
    // Legacy keys stay readable for older exports.
    expect(webApp).toContain("zealwish.web.passport");
    expect(webApp).toContain("zealwish.web.memories");
    expect(web).toContain(".recall-flash");
    expect(web).toContain(".bond-meter");
    expect(web).toContain(".episode-row");
  });

  it("builds, signs, verifies, and exports the wallet passport v1", () => {
    const webApp = readFileSync(webAppPath, "utf8");
    const wallet = readFileSync(walletPath, "utf8");

    expect(webApp).toContain("zealwish.passport/v1");
    expect(webApp).toContain("traits_hash");
    expect(webApp).toContain("memory_vault_hash");
    expect(webApp).toContain("passport_id");
    expect(webApp).toContain("owner_address");
    expect(webApp).toContain("issued_at");
    expect(webApp).toContain("sha256Hex");
    expect(webApp).toContain('import { verifyMessage } from "ethers"');
    expect(webApp).toContain("signMessage");
    expect(webApp).toContain("Verified");
    expect(webApp).toContain("zealwish.export/v1");
    expect(webApp).toContain("URL.createObjectURL");
    expect(wallet).toContain("personal_sign");
    expect(wallet).toContain("signMessage");
  });

  it("creates characters with image generation, surprise seed, and a non-blocking fallback", () => {
    const webApp = readFileSync(webAppPath, "utf8");

    expect(webApp).toContain("SURPRISE_NAMES");
    expect(webApp).toContain("SURPRISE_ARCHETYPES");
    expect(webApp).toContain("/generate-image");
    expect(webApp).toContain("/detect-gender");
    expect(webApp).toContain("ZEALWISH_BROWSER_AVATAR_FALLBACK");
    expect(webApp).toContain("3000");
    expect(webApp).toContain("defaultIdentity");
  });

  it("encapsulates portrait styling: style picker, look seeds, photo auto-detect, single action row", () => {
    const webApp = readFileSync(webAppPath, "utf8");
    const web = readFileSync(webPath, "utf8");

    expect(webApp).toContain("const ART_STYLES");
    expect(webApp).toContain("Pixel Art");
    expect(webApp).toContain("Anime");
    expect(webApp).toContain("Cyber Mech");
    expect(webApp).toContain("3D Figure");
    expect(webApp).toContain("Comic Ink");
    expect(webApp).toContain("Arcade");
    expect(webApp).toContain("const LOOK_SEEDS");
    expect(webApp).toContain("buildPortraitPrompt");
    expect(webApp).toContain("/analyze-photo");
    expect(webApp).toContain("downscaleImage");
    expect(web).toContain(".style-chip");
    expect(web).toContain(".seed-chip");
    expect(web).toContain(".photo-drop");
    expect(web).toContain(".create-actions { display: flex; flex-wrap: wrap;");
  });

  it("generates a 4-up portrait grid and a custom backdrop-color picker", () => {
    const webApp = readFileSync(webAppPath, "utf8");
    const web = readFileSync(webPath, "utf8");
    const apiImage = readFileSync(join(root, "api", "generate-image.js"), "utf8");

    // 4-up generation + selection.
    expect(webApp).toContain("count: 4");
    expect(webApp).toContain("portraitCandidates");
    expect(webApp).toContain("onSelectPortrait");
    expect(webApp).toContain("dataUrls");
    expect(web).toContain(".portrait-grid");
    expect(web).toContain(".portrait-option");
    expect(web).toContain(".portrait-skeleton");
    // API fans out to up to 4 images.
    expect(apiImage).toContain("count");
    expect(apiImage).toContain("dataUrls");
    expect(apiImage).toMatch(/Math\.min\(4/);
    // Custom backdrop color.
    expect(webApp).toContain("BACKDROP_PRESETS");
    expect(webApp).toContain("backdropPromptFor");
    expect(webApp).toContain('type="color"');
    expect(web).toContain(".backdrop-swatch");
    // Generated portraits can be saved to disk.
    expect(webApp).toContain("downloadDataUrl");
    expect(webApp).toContain("Save image");
    expect(web).toContain(".portrait-save");
    // Cursor-style staged progress rail turns voice dead-air into a pipeline.
    expect(webApp).toContain("const STAGES");
    expect(webApp).toContain("stage-rail");
    expect(webApp).toContain("stage-pill");
    expect(web).toContain(".stage-pill.is-active");
  });

  it("presents a bento home with presence, latest memory, and passport status", () => {
    const webApp = readFileSync(webAppPath, "utf8");
    const web = readFileSync(webPath, "utf8");

    expect(webApp).toContain("data-zealwish-web-dashboard");
    expect(webApp).toContain("Latest memory");
    expect(webApp).toContain("Passport");
    expect(web).toContain(".bento-grid");
    expect(web).toContain(".bento-presence");
    expect(web).toContain(".glass-panel");
  });

  it("keeps the mobile workspace free of horizontal overflow", () => {
    const web = readFileSync(webPath, "utf8");

    expect(web).toContain("overflow-x: hidden");
    expect(web).toContain(":focus-visible");
    expect(web).toContain("@media (max-width: 820px)");
    expect(web).toContain(".module-nav { display: flex; overflow-x: auto;");
    expect(web).toContain(".web-app-shell, .app-sidebar, .app-main, .app-topbar, .workspace { width: 100%; max-width: 100vw; }");
    expect(web).toContain(".app-inspector { display: none; }");
    expect(web).toContain(".bento-grid { grid-template-columns: 1fr; }");
    expect(web).toContain(".talk-stage { grid-template-columns: 1fr; }");
  });

  it("resolves the API base to same-origin /api off localhost and the local server in dev", () => {
    const wallet = readFileSync(walletPath, "utf8");
    const walletRuntime = readFileSync(walletRuntimePath, "utf8");

    expect(wallet).toContain('"http://127.0.0.1:7291/api"');
    expect(wallet).toContain('return "/api"');
    expect(wallet).toContain("window.okxwallet");
    expect(wallet).toContain("eip6963:requestProvider");
    expect(wallet).toContain("eth_requestAccounts");
    expect(wallet).toContain("eth_chainId");
    expect(wallet).not.toMatch(chinesePattern);
    expect(walletRuntime).toContain("ZEALWISH_API");
    expect(walletRuntime).toContain("personal_sign");
  });

  it("ships Vercel serverless functions with StepFun keys read from env only", () => {
    for (const name of apiFunctionNames) {
      const filePath = join(root, "api", name);
      expect(existsSync(filePath), `api/${name} should exist`).toBe(true);
      const source = readFileSync(filePath, "utf8");
      expect(source).toContain("export default");
      expect(source).not.toMatch(/sk-[A-Za-z0-9_-]{20,}/);
      expect(source).not.toMatch(chinesePattern);
    }
    const chat = readFileSync(join(root, "api", "chat.js"), "utf8");
    expect(chat).toContain("supportsResponseStreaming");
    expect(chat).toContain("text/event-stream");
    const lib = readFileSync(join(root, "api", "_lib", "stepfun.js"), "utf8");
    expect(lib).toContain("process.env");
    expect(lib).toContain("api.stepfun.com");
    expect(lib).not.toMatch(/sk-[A-Za-z0-9_-]{20,}/);
  });

  it("configures the Vercel project for static frontend + /api functions", () => {
    expect(existsSync(vercelConfigPath)).toBe(true);
    const config = JSON.parse(readFileSync(vercelConfigPath, "utf8"));

    expect(config.outputDirectory).toBe("frontend-v4");
    expect(config.functions["api/*.js"].maxDuration).toBeGreaterThanOrEqual(30);
    const allHeaders = JSON.stringify(config.headers);
    expect(allHeaders).toContain("X-Content-Type-Options");
    expect(allHeaders).toContain("microphone=(self)");
    expect(existsSync(join(root, ".vercelignore"))).toBe(true);
  });

  it("keeps the local dev server in StepFun parity with streaming and no hardcoded keys", () => {
    const server = readFileSync(webServerPath, "utf8");

    expect(server).not.toMatch(/sk-[A-Za-z0-9_-]{20,}/);
    expect(server).toContain("api.stepfun.com");
    expect(server).toContain("step-3.7-flash");
    expect(server).toContain("stepaudio-2.5-tts");
    expect(server).toContain("text/event-stream");
    expect(server).not.toMatch(chinesePattern);
  });

  it("locks the product to English and ships no emoji glyphs", () => {
    const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
    const index = readFileSync(indexPath, "utf8");
    const web = readFileSync(webPath, "utf8");
    const webApp = readFileSync(webAppPath, "utf8");
    const landing = readFileSync(landingPath, "utf8");

    expect(index).toContain('translate="no"');
    expect(web).toContain('translate="no"');
    expect(index).toContain('content="notranslate"');
    expect(web).toContain('content="notranslate"');
    expect(webApp).not.toMatch(emojiPattern);
    expect(landing).not.toMatch(emojiPattern);
    expect(webApp).toContain("Always answer in English");
    // Controls use inline SVG icons instead of emoji.
    expect(webApp).toContain("function IconMic");
    expect(webApp).toContain("function IconSpeaker");
  });

  it("keeps every world route live: skins restyle, scenes wrap Talk, tasks brief the character", () => {
    const webApp = readFileSync(webAppPath, "utf8");
    const web = readFileSync(webPath, "utf8");

    expect(webApp).toContain("WORLD_SCENES");
    expect(webApp).toContain("AGENT_TASKS");
    expect(webApp).toContain("CREATOR_SKINS");
    expect(webApp).toContain("handleEnterScene");
    expect(webApp).toContain("handleRunTask");
    expect(webApp).toContain("handleApplySkin");
    expect(webApp).toContain("zealwish.web.scene");
    expect(webApp).toContain("Current scene:");
    expect(web).toContain(".world-grid");
    expect(web).toContain(".scene-chip");
  });

  it("keeps the conversation loop frictionless: hands-free mode, starter prompts, memory control", () => {
    const webApp = readFileSync(webAppPath, "utf8");
    const web = readFileSync(webPath, "utf8");
    const index = readFileSync(indexPath, "utf8");

    // Hands-free voice loop: mic re-opens after the character finishes speaking.
    expect(webApp).toContain("const startListening");
    expect(webApp).toContain("Hands-free");
    expect(webApp).toContain("zealwish.handsfree");
    // Conversation survives reloads; IME Enter never sends mid-composition; live captions.
    expect(webApp).toContain("zealwish.web.chatlog");
    expect(webApp).toContain("persistChatLog");
    expect(webApp).toContain("isComposing");
    expect(webApp).toContain("interimResults = true");
    expect(webApp).toContain("interimText");
    // Zero-friction conversation starters and user control over memory.
    expect(webApp).toContain("STARTER_PROMPTS");
    expect(webApp).toContain("onForgetFact");
    expect(webApp).toContain("compressDataUrl");
    expect(web).toContain(".starter-chip");
    expect(web).toContain(".forget-link");
    expect(web).toContain(".handsfree-dot");
    // Shareable product metadata on both pages.
    expect(web).toContain('property="og:title"');
    expect(index).toContain('property="og:title"');
    expect(web).toContain('name="theme-color"');
    expect(index).toContain('name="theme-color"');
  });

  it("ships product-grade polish: boot screen, scrollbar, entrance motion, WebP hero, 404, shortcuts", () => {
    const web = readFileSync(webPath, "utf8");
    const webApp = readFileSync(webAppPath, "utf8");
    const index = readFileSync(indexPath, "utf8");
    const landing = readFileSync(landingPath, "utf8");
    const notFoundPath = join(root, "frontend-v4", "404.html");
    const heroWebpPath = join(root, "frontend-v4", "assets", "zealwish-main-character.webp");

    // No-black-flash boot skeleton + structural entrance motion (reduced-motion guarded).
    expect(web).toContain(".boot-screen");
    expect(web).toContain('class="boot-screen"');
    expect(web).toContain("@keyframes viewEnter");
    expect(web).toContain("@keyframes msgEnter");
    expect(web).toContain("prefers-reduced-motion: no-preference");
    // OLED-grade scrollbar + selection styling.
    expect(web).toContain("::-webkit-scrollbar-thumb");
    expect(web).toContain("::selection");
    // Message timestamps + flexible chat-log height + keyboard shortcuts.
    expect(webApp).toContain("msg-time");
    expect(webApp).toContain("chatInputRef");
    expect(webApp).toContain("event.key === '/'");
    expect(web).toContain("max-height: min(58vh, 640px)");
    // Compressed WebP hero shipped + referenced via <picture>, PNG fallback intact.
    expect(existsSync(heroWebpPath)).toBe(true);
    expect(landing).toContain("zealwish-main-character.webp");
    expect(landing).toContain("assets/zealwish-main-character.png");
    expect(index).toContain('rel="preload"');
    expect(webApp).toContain("assets/zealwish-main-character.webp");
    expect(webApp).toContain("isBundledAvatar");
    // Branded 404 page for unknown deploy routes.
    expect(existsSync(notFoundPath)).toBe(true);
    const notFound = readFileSync(notFoundPath, "utf8");
    expect(notFound).toContain("ZEAL");
    expect(notFound).toContain("/web.html#/home");
    expect(notFound).not.toMatch(chinesePattern);

    // A render throw recovers gracefully instead of white-screening.
    expect(webApp).toContain("class AppErrorBoundary");
    expect(webApp).toContain("getDerivedStateFromError");
    expect(webApp).toContain("Reload workspace");
    expect(web).toContain(".app-crash");
  });

  it("documents the preview and architecture contract in English", () => {
    expect(existsSync(architecturePath)).toBe(true);
    const architecture = readFileSync(architecturePath, "utf8");

    expect(architecture).toContain("Current Preview Contract");
    expect(architecture).toContain("All user-facing product copy must be English.");
    expect(architecture).not.toMatch(chinesePattern);
  });

  it("main visual uses the transparent character PNG", () => {
    const landing = readFileSync(landingPath, "utf8");
    const assetPath = join(root, "frontend-v4", "assets", "zealwish-main-character.png");
    const png = readFileSync(assetPath);

    expect(landing).toContain("assets/zealwish-main-character.png");
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(createHash("sha256").update(png).digest("hex")).toBe(expectedMainCharacterHash);
  });
});
