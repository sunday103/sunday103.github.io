---
title: Hello World（听说是程序员梦的开始）
date: 2026-09-15 20:09:03
tags: [自用]
---
欢迎来到 [Hexo](https://hexo.io/)! 这是你的第一篇博文. 点击 [documentation](https://hexo.io/docs/) 了解更多信息. If you get any problems when using Hexo, you can find the answer in [troubleshooting](https://hexo.io/docs/troubleshooting.html) or you can ask me on [GitHub](https://github.com/hexojs/hexo/issues).

## 快速开始（可忽略）

### 创建新帖子

``` bash
$ hexo new "My New Post"
```

更多信息: [Writing](https://hexo.io/docs/writing.html)

### 运行服务器

``` bash
$ hexo server
```

更多信息: [Server](https://hexo.io/docs/server.html)

### Generate static files

``` bash
$ hexo generate
```

更多信息: [Generating](https://hexo.io/docs/generating.html)

### Deploy to remote sites

``` bash
$ hexo deploy
```

更多信息: [Deployment](https://hexo.io/docs/one-command-deployment.html)

## 如何写博文

文件开头被两个 `---` 包住的部分叫 **front-matter**，用来写文章的元信息。

### 正确格式

```markdown
---
title: 我的第一篇博客
date: 2026-09-15 20:09:03
date: 2026-09-15 16:45:36
tags: [随笔, 学习]
categories: [记录]
---

正文从这里开始。支持 **加粗**、*斜体*、`代码`、[链接](https://hexo.io)。

## 二级标题

- 列表项
- 列表项
```

### 各字段说明

| 字段 | 说明 | 是否必填 |
|---|---|---|
| `title` | 文章标题 | 建议填 |
| `date` | 发布时间，决定排序 | 建议填 |
| `tags` | 标签，**方括号数组** | 选填 |
| `categories` | 分类，**方括号数组** | 选填 |
| `description` | 摘要，用于首页卡片和搜索引擎 | 选填 |
| `cover` | 封面图，如 `/img/cover.jpg` | 选填 |
| `top` | 设为 `true` 则置顶 | 选填 |

### 五个必须遵守的规则

1. **冒号后必须有一个空格** —— `title: 我的博客` 
2. **标签用方括号包裹** —— `tags: [随笔, 学习]` 
3. **多个标签用英文逗号分隔** —— `[随笔, 学习]` 
4. **`---` 必须单独占一行**，且是第一行（前面不能有空行）
5. **不要用 Tab 缩进**，YAML 只认空格

---

## 完整写作流程

### 第 1 步：新建文章

```powershell
cd "E:\博客\myblog"
npx hexo new "文章标题"
```

会在 `source\_posts\` 下生成 `文章标题.md`，并自动填好 front-matter 框架。

> 也可以手动在 `E:\博客\myblog\source\_posts\` 里新建 `.md` 文件，效果一样。

### 第 2 步：写内容

用 VS Code 打开编辑。注意遵守第二节的五条规则，特别是**冒号后要有空格**。

### 第 3 步：本地预览（推荐）

```powershell
cd "E:\博客\myblog"
npx hexo server
```

浏览器打开 <http://localhost:4000> 查看效果。按 `Ctrl + C` 停止。

> 如果 front-matter 写错了，这一步就会报错并告诉你第几行——不用等到推送后才发现。

### 第 4 步：发布

```powershell
cd "E:\博客\myblog"
npx hexo clean
npx hexo generate
npx hexo deploy
```

| 命令 | 作用 | 何时需要 |
|---|---|---|
| `npx hexo clean` | 清缓存和 `public\` | **建议每次都跑** |
| `npx hexo generate` | 生成静态文件到 `public\` | 每次都跑 |
| `npx hexo deploy` | 推送到 GitHub | 每次都跑 |

看到 `INFO  Deploy done: git` 即成功。等 1～3 分钟（GitHub Pages 有 CDN 缓存），刷新 https://sunday103.github.io 即可看到。

## 其他

### 1.常用命令速查

```powershell
npx hexo new "标题"          # 新建文章
npx hexo new page about      # 新建独立页面
npx hexo new draft "草稿"    # 新建草稿（暂不发布）
npx hexo publish "草稿"      # 把草稿转为正式文章
npx hexo server              # 本地预览 :4000
npx hexo clean               # 清缓存
npx hexo generate            # 生成（可简写 npx hexo g）
npx hexo deploy              # 部署（可简写 npx hexo d）
npx hexo version             # 查看版本
```

### 2.创建「标签」「分类」「关于」页面

导航里想加这些页面，需要先创建对应的页面文件：

```powershell
npx hexo new page tags
npx hexo new page categories
npx hexo new page about
```

然后编辑生成的文件，**`type` 字段必须写对**，否则页面空白：

`source\tags\index.md`：
```markdown
---
title: 标签
date: 2026-09-15 20:09:03
date: 2026-09-15 15:30:00
type: tags
---
```

`source\categories\index.md`：
```markdown
---
title: 分类
date: 2026-09-15 20:09:03
date: 2026-09-15 15:30:00
type: categories
---
```

`source\about\index.md` 不需要 `type`，直接写自我介绍即可。

最后在 `_config.landscape.yml` 的 `menu` 里加上对应链接。

### 3.修改站点信息

编辑 `E:\博客\myblog\_config.yml`，**只能用支持 UTF-8 的编辑器改**：

```yaml
title: sunday103 的博客      # 站点标题（左上角）|
date: 2026-09-15 20:09:03
subtitle: '记录与思考'        # 副标题
description: '一个普通人的技术笔记'   # 描述（SEO 用）
author: sunday103
language: zh-CN
```

> ⚠️ **绝对不要用 PowerShell 的 `Get-Content` / `Set-Content` 改这个文件！**
> PowerShell 5.1 的这两个命令默认按 GBK 读取 UTF-8 文件，会导致中文损坏、换行符丢失

> ps:以上内容为ai创建
