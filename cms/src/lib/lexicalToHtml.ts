import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

/**
 * Konvertiert Lexical-Rich-Text-JSON zu statischem HTML fuer den Astro-Build.
 *
 * Sicherheitsgrenze: das Payload-Editor-Feature-Set (siehe Beitraege.ts/Termine.ts) laesst
 * bewusst KEINE HTML-Block- oder Embed-Features zu, daher kann diese Konvertierung keine
 * <script>-Tags oder Inline-Event-Handler produzieren - die Eingabe ist strukturell dazu
 * nicht in der Lage. Trotzdem: neue Editor-Features nur nach Ruecksprache aktivieren, da
 * check-csp.mjs im Astro-Repo darauf vertraut, dass hier niemals Inline-Scripts entstehen.
 */
export async function lexicalToHtml(content: SerializedEditorState | null | undefined): Promise<string> {
  if (!content) return '';
  return convertLexicalToHTML({ data: content });
}
