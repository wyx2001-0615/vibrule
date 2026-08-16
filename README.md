# Watch 独立部署版

这是低代码振动信号故障诊断平台的独立 React/Vite 版本，不依赖 ChatGPT，也不调用 GPT API。

## 本地运行

```bash
npm install
npm run dev
```

## Vercel 部署

1. 将本项目全部文件上传到一个 GitHub 仓库。
2. 登录 Vercel，选择 **Add New → Project**。
3. 导入刚才的 GitHub 仓库。
4. Framework Preset 选择 **Vite**。
5. Build Command 使用 `npm run build`。
6. Output Directory 使用 `dist`。
7. 点击 **Deploy**。

网站计算均在访客浏览器本地执行，TXT/CSV 振动数据不会上传到服务器。
