(function () {
  'use strict';

  function columnCount(row) {
    var count = 0;
    var cells = row ? row.children : [];

    for (var i = 0; i < cells.length; i += 1) {
      var cell = cells[i];
      var span = parseInt(cell.getAttribute('colspan') || '1', 10);
      count += span > 0 ? span : 1;
    }

    return count;
  }

  function tableColumnCount(table) {
    var rows = table.rows;
    var max = 0;

    for (var i = 0; i < rows.length; i += 1) {
      var count = columnCount(rows[i]);
      if (count > max) {
        max = count;
      }
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
        frame.setAttribute('aria-label', 'Scrollable table');
      }
    }
  }

  function enhanceHeadings() {
    var headings = document.querySelectorAll('h2[id], h3[id]');

    for (var i = 0; i < headings.length; i += 1) {
      var heading = headings[i];

      if (heading.querySelector(':scope > a.heading-anchor')) {
        continue;
      }

      var anchor = document.createElement('a');
      anchor.className = 'heading-anchor';
      anchor.href = '#' + encodeURIComponent(heading.id);
      anchor.setAttribute('aria-label', 'Link to this section');
      anchor.setAttribute('title', 'Link to this section');
      heading.appendChild(anchor);
    }
  }

  function enhancePage() {
    enhanceTables();
    enhanceHeadings();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhancePage, { once: true });
  } else {
    enhancePage();
  }
}());
