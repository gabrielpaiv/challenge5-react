import { NextApiRequest, NextApiResponse } from 'next';
import { getPrismicClient } from '../../services/prismic';

import { Document } from '@prismicio/client/types/documents';

function linkResolver(doc: Document): string {
  if (doc.type === 'post') {
    return `/post/${doc.uid}`;
  }
  return '/';
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { token: ref, documentId } = req.query;

  const url = await getPrismicClient()
    .getPreviewResolver(String(ref), String(documentId))
    .resolve(linkResolver, '/');

  if (!url) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({
    ref,
  });

  res.write(
    `<!DOCTYPE html><html><head><meta http-equiv="Refresh" content="0; url=${url}" />
    <script>window.location.href = '${url}'</script>
    </head>`
  );
  res.end();
};
