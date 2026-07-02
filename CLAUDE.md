# CLAUDE.md

## 站点结构

- GitHub Pages + Jekyll：`_layouts/default.html` + `assets/css/site.css` + `assets/js/page.js` 是全部展示层，报告本身是纯 Markdown。
- 依赖 GitHub Pages 默认启用的两个插件：`jekyll-optional-front-matter`（约半数报告没有 front matter，但仍会成为 page，Liquid 的上一日/下一日导航和首页归档靠 `site.pages` 枚举它们）和 `jekyll-readme-index`（README.md 即首页，`page.url == '/'`）。本地裸 `jekyll build` 不会复现这两个行为。
- 报告页都在日期子目录（如 `2026-07/`）下，布局里用 `page.dir != '/'` 区分报告页和首页。

## Lessons

- 2026-07-02：用户明确否掉了米色+金色的"奢华纸张"模板风格（衬线标题、卡片浮层、香槟色表格）。现行方向是扁平高对比的"交易台日报"风：正文窄栏 + 宽表 breakout，结构层纯墨色，页面上唯一的颜色是行情数据。改样式时不要往华丽装饰方向走。
- 2026-07-02 用户纠正：报告标的以美股为主，涨跌配色遵循**西方惯例（绿=涨，红=跌）**，不要用 A 股的红涨绿跌。
- 2026-07-02 用户纠正：站点读者**不在**中国大陆，可以使用 Google Fonts 等外部 CDN。当前正文/标题用 Noto Sans SC，数据/纸带用 IBM Plex Mono。
- `page.js` 会自动给表格/正文里的 `±x.x%` 着色（绿涨红跌）；正负号本身保留在文本里，颜色只是冗余编码，不要改成只靠颜色区分。
