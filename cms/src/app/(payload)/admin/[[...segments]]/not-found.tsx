import { NotFoundPage } from '@payloadcms/next/views';
import config from '@payload-config';
import { importMap } from '../importMap.js';

type Args = {
  params: Promise<{ segments?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function NotFound({ params, searchParams }: Args) {
  return NotFoundPage({ config, params, searchParams, importMap });
}
