import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 构建产物输出到主站 frontend-v4/world,作为 ZEALWISH 站点不可分割的一段(/world)。
// dev 用根路径 '/';build 用相对 './' 以便在 /world/ 子路径下正确加载资源。
// 运行时素材路径用 import.meta.env.BASE_URL 拼接(见 WorldView)。
// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react()],
  build: {
    outDir: '../frontend-v4/world',
    emptyOutDir: true,
  },
}))
