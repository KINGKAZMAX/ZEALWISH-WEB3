# 活世界 · 轻后端(B / C)

把"切真 LLM / 真链"两档点亮。**密钥只留在这里**,前端纯静态、永远拿不到密钥。未配置对应密钥时接口返回 503,前端自动回退到离线引擎(A),世界照常运行。

## 跑起来

```bash
cd living-oc/server
npm i
cp .env.example .env      # 然后编辑 .env 填密钥
npm start                 # 监听 http://localhost:8788
```

前端默认连 `http://localhost:8788`;如需改地址,在 `living-oc/.env` 里设 `VITE_LIVE_API=...` 后重启前端 dev。

## 配置(`.env`)

| 变量 | 作用 |
|---|---|
| `ANTHROPIC_API_KEY` | **B**:真 Claude。在 console.anthropic.com 申请。留空 → `/api/cognition/*` 返回 503。 |
| `CROWD_MODEL` / `DIRECTOR_MODEL` | 群演(逐 tick 决策,默认 `claude-haiku-4-5`)/ 导演(反思,默认 `claude-opus-4-8`)。 |
| `DEPLOYER_PRIVATE_KEY` | **C**:一个有 Base Sepolia 测试币的钱包私钥。[水龙头](https://www.alchemy.com/faucets/base-sepolia)。留空 → `/api/chain/*` 返回 503。 |
| `BASE_SEPOLIA_RPC_URL` | Base Sepolia RPC(默认公共节点 `https://sepolia.base.org`)。 |
| `NFT_CONTRACT_ADDRESS` | 可选:已部署的 `mint(address,string)` ERC-721 合约;留空走 calldata 记录降级。 |
| `PORT` / `ALLOW_ORIGIN` | 端口(默认 8788)/ 允许跨域来源(默认前端 dev `http://localhost:5276`)。 |

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 探活,回报 B/C 是否已配置。 |
| POST | `/api/cognition/decide` | 群演:给定角色+上下文,Claude 返回一个动作决策 `{action,targetName,destKind,text}`。 |
| POST | `/api/cognition/reflect` | 导演:给定当日事件,opus 返回一段第一人称日记。 |
| POST | `/api/chain/transfer` | Base Sepolia 真实交易,calldata 记录转账意图,返回真实 `txHash`。 |
| POST | `/api/chain/mint` | 配了合约则调 `mint`,否则 calldata 记录,返回真实 `txHash`。 |

## 说明 / 边界

- **C 为演示级**:转账/铸造用后端钱包发"带 calldata 的极小自交易",产生**可在区块浏览器验证的真实 txHash**,但不在不同 OC 地址间真正转移资产。生产化:换成 ERC-4337 智能账户 + USDC(x402)或部署 ERC-721 后填 `NFT_CONTRACT_ADDRESS`。
- **成本/延迟**:B 开启后每 tick 每个 agent 一次 Claude 调用(haiku),会比离线引擎慢、且按量计费——按需开关。
- **安全**:`.env` 已被 `.gitignore` 忽略;切勿把私钥/密钥提交进仓库。
