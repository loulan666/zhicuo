# 知错：本地编程学习平台

独立实现的 React + TypeScript 学习平台，Node.js 后端。本项目没有复制 DeepTutor 源码。

## 启动

需要 Node.js 22+。安装依赖 `npm ci`，构建 `npm run build`，启动 `npm start`，访问 http://127.0.0.1:3180/。本机暂无全局 npm 时可使用开发工具目录中的 `node work/npm/package/bin/npm-cli.js`。打包源码不包含该工具，其他电脑应安装标准 Node.js。

Windows 可运行 scripts/start-local.ps1 后台启动。关闭电脑后需要重新启动。旧版实验入口为 /legacy，旧版测评为 /learning。

## 功能

- 七种语言：Python、JavaScript、TypeScript、Java、C、C++、Go。
- React + TypeScript 统一界面：总览、课程/知识依赖图、基础测评、实验、资料库、画像、环境检查。
- 42 道基础阅读测评，保存每次结果及历史；雷达呈现最近一次的六维正确率。
- 每种语言 4 类函数实验，后台包装输入输出，逐用例执行并存证。
- 容器执行禁网、非 root、只读根目录、无主机挂载，限制内存/CPU/进程/输出/时间，结束强制清理容器。不自动回退到主机裸跑。
- 本地保存资料、提交和测评；支持完整 JSON 导出。浏览器草稿独立保存。
- PDF/DOCX/TXT/Markdown 导入、分段索引、按语言检索、来源片段展示、DeepSeek 结合资料答疑和分级提示。

## 多语言执行准备

安装并启动 Docker Desktop（Windows 需要 WSL2/虚拟化支持，首次可能需要重启及接受许可）。运行 `powershell -ExecutionPolicy Bypass -File scripts/setup-runtimes.ps1` 下载 5 个语言镜像。使用 `node scripts/verify-runtimes.mjs` 对七种语言实际编译执行正常和空数组测试。

容器软件和镜像未就绪时，界面会如实报告不可执行。自动化单元测试通过不代表编译运行已验证。该服务仅绑定回环地址，面向个人本地学习，不是公网多租户执行服务。容器仍需保持更新，不是绝对安全保证。

## DeepSeek

复制 .env.example 为 .env，填写 AI_API_KEY、AI_MODEL=deepseek-chat、AI_BASE_URL=https://api.deepseek.com，重启。密钥仅在服务端使用，不进入 Git。未配置时预设提示明确标识为规则提示，不模拟模型回复。

调用受请求大小、输出 token、速率和超时限制。只在主动提问时发送当前问题、代码与检索片段。模型输出按纯文本显示，不自动执行。

## 资料与画像边界

PDF 只支持可提取文本，扫描件需先 OCR，最多处理100页；文件上限5 MB，提取文本最多150000字，资料最多30份。当前检索采用分段关键词相关度排序，不是向量检索。引用显示实际匹配来源，模型回答仍需核对原文。

每个测评维度目前只有一道题，所以仅用于入门筛查。图谱为六个核心知识点的先修依赖图，课程不覆盖所有语言高级特性。画像依据真实阅读测评和实验记录，不推断智力、天赋或学习速度；重复相同题目存在记忆效应。当前个人学习数据不具有防作弊认证效力。

## 验证

`npm test` 执行单元/接口测试；`npm run typecheck` 检查前端类型；`npm run build` 构建界面；`node scripts/verify-runtimes.mjs` 单独执行真实多语言集成验证。

数据位置：local-data/learning.json，已被 Git 忽略。该文件和 .env 应分别备份。源码、开发记录与测试须如实提交，不将规划功能宣称已完成。
