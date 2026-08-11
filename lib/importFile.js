// lib/importFile.js
//
// Converts a small, explicitly-supported set of plain-text formats into the
// HTML the TipTap editor expects. This is intentionally not a full Markdown
// parser -- it covers the formatting our editor actually supports (headings,
// bold/italic, bullet & numbered lists, paragraphs) so imported files render
// usably rather than perfectly. Anything unsupported degrades to a plain
// paragraph, which is safer than silently dropping content.

const SUPPORTED_EXTENSIONS = ['.txt', '.md'];

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineMarkdown(text) {
  let out = escapeHtml(text);
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>');
  return out;
}

function isExtensionSupported(filename) {
  const lower = filename.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// Turns raw markdown/plain text into a block of HTML matching the editor's
// supported node types. Groups consecutive list lines into <ul>/<ol>.
function textToHtml(raw, filename) {
  const lower = filename.toLowerCase();
  const isMarkdown = lower.endsWith('.md');

  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const htmlParts = [];
  let listBuffer = [];
  let listType = null; // 'ul' | 'ol'

  function flushList() {
    if (listBuffer.length === 0) return;
    const tag = listType === 'ol' ? 'ol' : 'ul';
    htmlParts.push(
      `<${tag}>${listBuffer.map((li) => `<li>${li}</li>`).join('')}</${tag}>`
    );
    listBuffer = [];
    listType = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === '') {
      flushList();
      continue;
    }

    if (isMarkdown) {
      const heading = line.match(/^(#{1,3})\s+(.*)$/);
      if (heading) {
        flushList();
        const level = heading[1].length;
        htmlParts.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
        continue;
      }
      const bullet = line.match(/^[-*]\s+(.*)$/);
      if (bullet) {
        if (listType && listType !== 'ul') flushList();
        listType = 'ul';
        listBuffer.push(inlineMarkdown(bullet[1]));
        continue;
      }
      const numbered = line.match(/^\d+[.)]\s+(.*)$/);
      if (numbered) {
        if (listType && listType !== 'ol') flushList();
        listType = 'ol';
        listBuffer.push(inlineMarkdown(numbered[1]));
        continue;
      }
    }

    flushList();
    htmlParts.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  flushList();

  return htmlParts.join('') || '<p></p>';
}

module.exports = { isExtensionSupported, textToHtml, SUPPORTED_EXTENSIONS };
