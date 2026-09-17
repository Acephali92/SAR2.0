import { convertLexicalToHTMLAsync } from '@payloadcms/richtext-lexical/html-async';
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
export async function lexicalToHtml(
  content: SerializedEditorState | null | undefined,
  payload: Payload
): Promise<string> {
  if (!content) return '';
  return convertLexicalToHTMLAsync({
    data: content,
    populate: await getPayloadPopulateFn({ currentDepth: 0, depth: 1, payload }),
  });
}
