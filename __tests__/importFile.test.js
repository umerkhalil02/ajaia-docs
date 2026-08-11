const { isExtensionSupported, textToHtml } = require('../lib/importFile');

describe('isExtensionSupported', () => {
  test('accepts .txt and .md', () => {
    expect(isExtensionSupported('notes.txt')).toBe(true);
    expect(isExtensionSupported('README.md')).toBe(true);
  });

  test('rejects other extensions', () => {
    expect(isExtensionSupported('file.docx')).toBe(false);
    expect(isExtensionSupported('image.png')).toBe(false);
  });
});

describe('textToHtml', () => {
  test('converts markdown headings and bold/italic', () => {
    const html = textToHtml('# Title\nSome **bold** and *italic* text.', 'a.md');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  test('groups consecutive bullet lines into a single <ul>', () => {
    const html = textToHtml('- one\n- two\n- three', 'list.md');
    expect(html).toBe('<ul><li>one</li><li>two</li><li>three</li></ul>');
  });

  test('groups numbered lines into a single <ol>', () => {
    const html = textToHtml('1. first\n2. second', 'list.md');
    expect(html).toBe('<ol><li>first</li><li>second</li></ol>');
  });

  test('plain .txt content becomes paragraphs without markdown parsing', () => {
    const html = textToHtml('# not a heading\nline two', 'notes.txt');
    expect(html).toBe('<p># not a heading</p><p>line two</p>');
  });

  test('escapes HTML in the source to prevent injection', () => {
    const html = textToHtml('<script>alert(1)</script>', 'notes.txt');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
