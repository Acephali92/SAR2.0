/**
 * Bewusst minimaler Markdown->Lexical-Konverter, NUR fuer die Einmalmigration in
 * scripts/seed-import.ts gedacht (siehe docs/ARCHITEKTUR.md, Abschnitt Content-Migration).
 * Deckt genau das ab, was die drei zu migrierenden Bestandsartikel nutzen: Ueberschriften
 * (##/###), Absaetze, "- "-Listen und **fett**. Fuer die redaktionelle Alltagsarbeit ist das
 * NICHT relevant - Redakteur:innen schreiben direkt im Rich-Text-Editor, nicht in Markdown.
 */

type LexicalNode = Record<string, unknown>;

function textNode(text: string, bold = false): LexicalNode {
  return {
    type: 'text',
    text,
    format: bold ? 1 : 0,
    detail: 0,
    mode: 'normal',
    style: '',
    version: 1,
  };
}

function parseInline(line: string): LexicalNode[] {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part) => {
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    return boldMatch ? textNode(boldMatch[1], true) : textNode(part);
  });
}

function paragraphNode(line: string): LexicalNode {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children: parseInline(line),
  };
}

function headingNode(tag: 'h2' | 'h3', line: string): LexicalNode {
  return {
    type: 'heading',
    tag,
    format: '',
    indent: 0,
    version: 1,
    children: parseInline(line),
  };
}

function listNode(items: string[]): LexicalNode {
  return {
    type: 'list',
    listType: 'bullet',
    tag: 'ul',
    start: 1,
    format: '',
    indent: 0,
    version: 1,
    children: items.map((item) => ({
      type: 'listitem',
      value: 1,
      format: '',
      indent: 0,
      version: 1,
      children: parseInline(item),
    })),
  };
}

export function markdownToLexical(markdown: string): Record<string, unknown> {
  const lines = markdown.split('\n');
  const children: LexicalNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      children.push(listNode(listBuffer));
      listBuffer = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      children.push(headingNode('h3', line.slice(4)));
    } else if (line.startsWith('## ')) {
      flushList();
      children.push(headingNode('h2', line.slice(3)));
    } else if (line.startsWith('- ')) {
      listBuffer.push(line.slice(2));
    } else {
      flushList();
      children.push(paragraphNode(line));
    }
  }
  flushList();

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children,
      direction: 'ltr',
    },
  };
}
