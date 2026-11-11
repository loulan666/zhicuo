# 知错 · AI 编程诊断与补弱平台

知错是“七场五点八二拉菲”团队面向编程初学者的学习平台：先测基础，再运行代码，以真实失败证据驱动 AI 诊断和专项出题，最后通过复测验证改进。

- 仓库：https://github.com/loulan666/zhicuo
- 版本：1.0.0，本地运行版；网页不部署公网。
- 技术：React / TypeScript / Node.js / Docker / DeepSeek。

## 核心功能

1. **基础验证与课程**：Python、JavaScript、TypeScript、Java、C、C++、Go；126 道阅读、推演与排错题，分节答题与草稿恢复；错题可跳转课程目标、步骤、误区和自检。
2. **真实编程实验**：每种语言四类实验与四组固定复测。容器返回真实输出、错误与通过状态；新提交保存源码和编号，旧记录继续保留。
3. **AI 诊断工作台**：Function Calling 读取测评、代码、测试与练习进展，按需检索课程资料，保存实际工具轨迹和报告。
4. **AI 专项训练**：选一条包含源码的失败提交；AI 定位行号、引用原代码与失败用例，设计条件变式并生成参考函数。后端独立计算答案，在 Docker 中验证参考实现，通过后才发布题目。
5. **补弱效果追踪**：原题与新题分开记录；同一变式的首次、最近提交和通过数由程序计算，AI 解释代码变化并建议下一步。报告绑定具体提交，不覆盖更新后的事实。
6. **学习画像与资料**：雷达展示真实答对题数和分母；知识图谱表示先修关系。支持文本 PDF / DOCX / TXT / Markdown 导入、关键词检索、来源展示、本地数据保存和完整导出。

## 快速运行

需要 Node.js 22+，安装时包含 npm。先在项目目录执行：

```sh
npm ci
npm run build
```

复制 `.env.example` 为 `.env`，在本机填入自己的 DeepSeek `AI_API_KEY`。模板已配置 `AI_MODEL=deepseek-chat` 和服务地址。不要将真实密钥提交到仓库。

```sh
npm start
```

打开 http://127.0.0.1:3180/ 。Windows 安装依赖后也可双击 `start.cmd`，后台启动并检查服务是否就绪。再次启动会提示服务已存在；修改后端或 `.env` 后需要重启服务。

关闭电脑后需要重新启动服务。启动失败查看 `work/server-error.log`，确认端口 3180 未被其他程序占用。

### Docker 与语言镜像

Windows 需要 Docker Desktop、WSL2 及虚拟化支持。安装并手动启动 Docker 后，在 PowerShell 执行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-runtimes.ps1
npm run check:ready
```

首次下载语言镜像需要联网。容器执行学生代码时禁网、非 root、只读根目录、不挂载主机目录，限制 CPU、内存、进程、输出和时间，结束后清理容器。单个用例最多 20 秒（含编译）。Docker 未就绪时不能运行代码或发布 AI 新题；不回退到主机直接执行。

### 推荐体验顺序

基础测评 → 课程 → 编程实验 → 提交一份错误实现 → 点击“AI 定位错因并生成练习” → 核对引用代码与失败用例 → 等待生成题校验通过 → 提交变式 → 修正后再提交 → “AI 分析复测效果”。

原题可以使用“统计正数”。故意写成 `>= 0` 可演示零值边界问题，录制时说明这是演示用错误代码。不要假装生成题固定不变或预先知道模型答案。

## AI 如何参与

诊断工作台的只读工具：`read_evidence`、`get_practice_plan`、`search_materials`、`get_learning_outcomes`。最多四轮请求，90 秒总超时，支持取消。

专项出题使用 JSON 输出约束。题目限制为整数数组，元素 -20 到 20，长度 0 到 12；支持条件筛选后的计数、求和、最大值。新题保留原题聚合目标、改变过滤条件或阈值，并拒绝与原题语义相同的题目。

校验包括行号/原文引用、失败用例、参数范围、语义去重、空输入/边界/负数等用例及 Docker 参考代码执行。预期结果由独立规则计算，不使用模型给出的答案。格式或题意校验失败时，最多请模型修正一次，仍不合格则拒绝发布；不会无限重试或重试额度错误。每次生成最多 240 秒，最多保存 50 道题。验证是有限用例检查，不是数学证明。

复测次数、通过数与改进标志由后端生成；模型不能修改成绩。模型解释仍可能错误，应核对代码与真实结果。原题和新题不同，不直接比较正确率，不据此认证长期掌握。

## 运行与数据边界

- 本版本仅供个人本机使用，没有多用户认证，勿直接暴露到公网。Docker 不是绝对安全保证。
- DeepSeek 需要网络和可用额度；模型调用仅在主动请求时发生，所选代码、学习证据或匹配资料片段会发给模型服务。取消不保证已经产生的费用退回。
- 无模型密钥时仍能使用基础测评、课程、画像、资料检索和已配置 Docker 的固定实验；AI 功能明确报未配置。
- 资料检索是关键词分段检索，不是向量数据库；没有 MCP 或多模态理解。扫描 PDF 需要先 OCR；文件最多 5 MB，资料最多 30 份。
- 新版每维三题，旧版每维一题，分别保留版本和分母；重复做题有记忆效应，不是防作弊考试。课程聚焦入门，不覆盖全部高级特性。
- 学习记录、源码快照和 AI 报告在 `local-data/learning.json`；浏览器草稿另存。可在学习画像导出备份。`.env`、`local-data`、`work` 均不进入 Git。

## 验证

```sh
npm test
npm run typecheck
npm run build
node scripts/verify-runtimes.mjs
node scripts/verify-submissions.mjs
npm run test:browser
npm run test:adaptive
npm run test:languages
```

浏览器测试前运行 `npx playwright install chromium`。`test:browser` 与 `test:adaptive` 使用临时数据目录，不覆盖个人学习记录；它们及 `test:languages` 会真实调用 Docker 和 DeepSeek，产生少量模型费用。

只验收界面时，在 PowerShell 设置 `$env:UI_ONLY='1'` 后运行 `npm run test:browser`；完整验收前执行 `Remove-Item Env:UI_ONLY`。

详细结果、已知限制与复现命令见 [验收记录](docs/verification.md)。

## 参赛材料与团队

- [技术说明 PDF](output/pdf/知错-技术说明.pdf)
- [6 分 30 秒演示脚本](docs/demo-script.md)，视频由团队自行录制。
- [赛题对照与提交清单](docs/competition.md)

学校：广东东软学院；组别：B 组。团队：七场五点八二拉菲。

成员：陈凯奕、邝鸿毅、龚栩敏。指导教师：杨雨倩。

开发使用 AI 辅助，依赖清单和版本见 `package-lock.json`；团队应理解实现并如实答辩。开发记录保留在 Git 历史中。

提交前保持 Git 工作区干净，运行 `npm run package:release`，在 `output/releases/` 生成源码 ZIP 和保留提交历史的 Git bundle。ZIP 用于源码备份；参赛仓库仍应使用上面的公开地址。在离线备份所在目录执行 `git clone zhicuo-1.0.0-history.bundle` 可恢复历史。
