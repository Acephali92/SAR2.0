import { convertLexicalToHTMLAsync, type HTMLConvertersAsync } from '@payloadcms/richtext-lexical/html-async';
import { getPayloadPopulateFn } from '@payloadcms/richtext-lexical';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Payload } from 'payload';

/**
 * Konvertiert Lexical-Rich-Text-JSON zu statischem HTML fuer den Astro-Build.
 *
 * Nutzt bewusst die *Async*-Variante mit `populate`: der Editor erlaubt eingebettete Bilder
 * (UploadFeature, siehe editorConfig.ts) - ohne Populate wuerden solche Referenzen nur als rohe
 * Media-ID im HTML landen statt als echtes <img src="..."> mit URL/Alt-Text.
 *
 * Sicherheitsgrenze: das Payload-Editor-Feature-Set laesst bewusst KEINE HTML-Block- oder
 * Embed-Features zu, daher kann diese Konvertierung keine <script>-Tags oder Inline-Event-Handler
 * produzieren - die Eingabe ist strukturell dazu nicht in der Lage. Trotzdem: neue Editor-Features
 * nur nach Ruecksprache aktivieren, da check-csp.mjs im Astro-Repo darauf vertraut, dass hier
 * niemals Inline-Scripts entstehen.
 */
// Nur Groessen mit fit: 'inside' (Seitenverhaeltnis bleibt erhalten, siehe collections/Media.ts).
// 'og' ist ein fester 1200x630-Zuschnitt fuer Social-Media-Vorschauen und hat im Fliesstext nichts verloren.
const SEITENVERHAELTNIS_TREUE_GROESSEN = ['thumbnail', 'card'] as const;

type MedienDokument = {
  alt?: null | string;
  filename?: null | string;
  height?: null | number;
  mimeType?: null | string;
  sizes?: Record<string, { url?: null | string; width?: null | number } | undefined>;
  url?: null | string;
  width?: null | number;
};

const esc = (wert: unknown) =>
  String(wert ?? '').replace(/[&<>"']/g, (z) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[z]!);

/**
 * Ersetzt Payloads Standard-Upload-Konverter. Der Standard baut ein <picture> mit einer <source> je
 * Bildgroesse - einschliesslich des beschnittenen 'og'-Formats, das der Browser dann auf mittleren
 * Bildschirmbreiten auswaehlt (beobachtet: 1000 px Viewport zeigte den 1200x630-Zuschnitt eines
 * 1600x490-Banners, rund 40 % der Bildbreite fehlten).
 */
const uploadKonverter: HTMLConvertersAsync['upload'] = async ({ node, populate, providedStyleTag }) => {
  const dok = (
    typeof node.value === 'object' ? node.value : populate ? await populate({ collectionSlug: node.relationTo, id: node.value }) : null
  ) as MedienDokument | null;
  if (!dok?.url) return '';

  if (!dok.mimeType?.startsWith('image')) {
    return `<a${providedStyleTag} href="${esc(dok.url)}" rel="noopener noreferrer">${esc(dok.filename)}</a>`;
  }

  const kandidaten = [...SEITENVERHAELTNIS_TREUE_GROESSEN.map((name) => dok.sizes?.[name]), { url: dok.url, width: dok.width }]
    .filter((k): k is { url: string; width: number } => Boolean(k?.url && k.width));
  const srcset = kandidaten.map((k) => `${esc(k.url)} ${k.width}w`).join(', ');
  const src = dok.sizes?.card?.url ?? dok.url;

  return `<img${providedStyleTag} alt="${esc(node.fields?.alt || dok.alt)}" src="${esc(src)}" srcset="${srcset}" sizes="(max-width: 48rem) 100vw, 48rem" width="${esc(dok.width)}" height="${esc(dok.height)}" loading="lazy" decoding="async" />`;
};

export async function lexicalToHtml(
  content: SerializedEditorState | null | undefined,
  payload: Payload
): Promise<string> {
  if (!content) return '';
  return convertLexicalToHTMLAsync({
    converters: ({ defaultConverters }) => ({ ...defaultConverters, upload: uploadKonverter }),
    data: content,
    populate: await getPayloadPopulateFn({ currentDepth: 0, depth: 1, payload }),
  });
}
