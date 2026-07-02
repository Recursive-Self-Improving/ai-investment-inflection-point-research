(function () {
  'use strict';

  /* ------------------------------------------------------------------
   * 宽表格：包进横向滚动容器，列数多的标记为 table-wide。
   * ---------------------------------------------------------------- */

  function columnCount(row) {
    var count = 0;
    var cells = row ? row.children : [];
    for (var i = 0; i < cells.length; i += 1) {
      var span = parseInt(cells[i].getAttribute('colspan') || '1', 10);
      count += span > 0 ? span : 1;
    }
    return count;
  }

  function tableColumnCount(table) {
    var max = 0;
    for (var i = 0; i < table.rows.length; i += 1) {
      var count = columnCount(table.rows[i]);
      if (count > max) max = count;
    }
    return max;
  }

  function enhanceTables() {
    var tables = document.querySelectorAll('table');
    for (var i = 0; i < tables.length; i += 1) {
      var table = tables[i];
      var frame = table.parentElement && table.parentElement.classList.contains('table-frame')
        ? table.parentElement
        : null;

      if (!frame) {
        frame = document.createElement('div');
        frame.className = 'table-frame';
        table.parentNode.insertBefore(frame, table);
        frame.appendChild(table);
      }

      if (tableColumnCount(table) >= 7) {
        table.classList.add('table-wide');
      }
      if (!frame.hasAttribute('tabindex')) {
        frame.setAttribute('tabindex', '0');
      }
      if (!frame.hasAttribute('aria-label')) {
        frame.setAttribute('aria-label', '可横向滚动的表格');
      }
    }
  }

  /* ------------------------------------------------------------------
   * 章节编号：报告的 h2 以 "3. " 开头，把编号包成红色等宽标记。
   * ---------------------------------------------------------------- */

  var SECTION_NUM = /^\s*(\d{1,3}[.、．])\s*/;

  function markSectionNumbers() {
    var headings = document.querySelectorAll('.report h2');
    for (var i = 0; i < headings.length; i += 1) {
      var node = headings[i].firstChild;
      if (!node || node.nodeType !== Node.TEXT_NODE) continue;
      var match = node.nodeValue.match(SECTION_NUM);
      if (!match) continue;
      var mark = document.createElement('span');
      mark.className = 'sec-num';
      mark.textContent = match[1];
      node.nodeValue = node.nodeValue.slice(match[0].length);
      headings[i].insertBefore(mark, node);
    }
  }

  /* ------------------------------------------------------------------
   * 红涨绿跌：给 ±x.x% 上色（A 股惯例：红=涨，绿=跌）。
   * 只匹配前面不是字母/数字的带符号百分比，避免误伤 "10-20%" 这类区间。
   * ---------------------------------------------------------------- */

  var PCT = /(^|[^0-9A-Za-z%.−+-])([+\-−]\d+(?:\.\d+)?%)/g;

  function colorizePercents() {
    var root = document.querySelector('.report');
    if (!root || typeof document.createTreeWalker !== 'function') return;

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!/[+\-−]\d/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        var parent = node.parentElement;
        if (!parent || parent.closest('a, code, pre, script, style, .pct')) {
          return NodeFilter.FILTER_REJECT;
        }
        if (!parent.closest('td, th, p, li')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var targets = [];
    while (walker.nextNode()) targets.push(walker.currentNode);

    for (var i = 0; i < targets.length; i += 1) {
      var node = targets[i];
      var text = node.nodeValue;
      var fragment = document.createDocumentFragment();
      var lastIndex = 0;
      var found = false;
      var match;

      PCT.lastIndex = 0;
      while ((match = PCT.exec(text)) !== null) {
        found = true;
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex, match.index) + match[1])
        );
        var span = document.createElement('span');
        span.className = match[2].charAt(0) === '+' ? 'pct pct-up' : 'pct pct-down';
        span.textContent = match[2];
        fragment.appendChild(span);
        lastIndex = match.index + match[0].length;
      }

      if (found) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        node.parentNode.replaceChild(fragment, node);
      }
    }
  }

  /* ------------------------------------------------------------------
   * 目录：从 h2 生成，宽屏时显示为左侧粘性导航。
   * ---------------------------------------------------------------- */

  function buildToc() {
    var toc = document.getElementById('toc');
    if (!toc) return;

    var headings = [];
    var candidates = document.querySelectorAll('.report h2[id]');
    for (var i = 0; i < candidates.length; i += 1) {
      if (!candidates[i].closest('.footnotes')) headings.push(candidates[i]);
    }
    if (headings.length < 3) return;

    var list = toc.querySelector('.toc-list');
    var linkById = {};

    for (var j = 0; j < headings.length; j += 1) {
      var heading = headings[j];
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.href = '#' + encodeURIComponent(heading.id);

      var text = heading.textContent.trim();
      var match = text.match(/^(\d{1,3})[.、．]\s*(.*)$/);
      if (match) {
        var num = document.createElement('span');
        num.className = 'toc-num';
        num.textContent = match[1];
        link.appendChild(num);
        link.appendChild(document.createTextNode(match[2]));
      } else {
        link.textContent = text;
      }

      item.appendChild(link);
      list.appendChild(item);
      linkById[heading.id] = link;
    }

    toc.hidden = false;

    if ('IntersectionObserver' in window) {
      var active = null;
      var observer = new IntersectionObserver(function (entries) {
        for (var k = 0; k < entries.length; k += 1) {
          if (!entries[k].isIntersecting) continue;
          var link = linkById[entries[k].target.id];
          if (!link) continue;
          if (active) active.classList.remove('active');
          link.classList.add('active');
          active = link;
        }
      }, { rootMargin: '-64px 0px -70% 0px' });

      for (var m = 0; m < headings.length; m += 1) {
        observer.observe(headings[m]);
      }
    }
  }

  /* ------------------------------------------------------------------
   * 标题锚点。
   * ---------------------------------------------------------------- */

  function enhanceHeadings() {
    var headings = document.querySelectorAll('h2[id], h3[id]');
    for (var i = 0; i < headings.length; i += 1) {
      var heading = headings[i];
      if (heading.querySelector(':scope > a.heading-anchor')) continue;
      var anchor = document.createElement('a');
      anchor.className = 'heading-anchor';
      anchor.href = '#' + encodeURIComponent(heading.id);
      anchor.textContent = '#';
      anchor.setAttribute('aria-label', '本节链接');
      anchor.setAttribute('title', '本节链接');
      heading.appendChild(anchor);
    }
  }

  function enhancePage() {
    try { enhanceTables(); } catch (e) { /* 增强失败不影响阅读 */ }
    try { markSectionNumbers(); } catch (e) { /* 同上 */ }
    try { colorizePercents(); } catch (e) { /* 同上 */ }
    try { buildToc(); } catch (e) { /* 同上 */ }
    try { enhanceHeadings(); } catch (e) { /* 同上 */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhancePage, { once: true });
  } else {
    enhancePage();
  }
}());
