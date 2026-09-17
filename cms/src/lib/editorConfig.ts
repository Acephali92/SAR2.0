import {
  BoldFeature,
  ItalicFeature,
  LinkFeature,
  BlockquoteFeature,
  UnorderedListFeature,
  OrderedListFeature,
  HeadingFeature,
  UploadFeature,
  ParagraphFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical';

/**
 * Bewusste Feature-Allowlist statt defaultFeatures: keine HTML-Block-/Embed-Features, damit
 * sich strukturell keine <script>-Tags oder rohes HTML einschleusen lassen. Das ist
 * die eigentliche Sicherheitsgrenze fuer die CSP-Konformitaet des oeffentlichen Builds (M7), nicht
 * erst die HTML-Konvertierung in lexicalToHtml.ts.
 */
export const editorConfig = lexicalEditor({
  features: [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    BoldFeature(),
    ItalicFeature(),
    LinkFeature(),
    BlockquoteFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    UploadFeature({ collections: { media: { fields: [] } } }),
    InlineToolbarFeature(),
  ],
});
