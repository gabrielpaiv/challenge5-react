import { NextApiRequest, NextApiResponse } from 'next';
import { Document } from '@prismicio/client/types/documents';
import { getPrismicClient } from '../../services/prismic';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  function linkResolver(doc: Document): string {
    if (doc.type === 'posts') {
      return `/post/${doc.uid}`;
    }
    return '/';
  }

  const { token: ref, documentId } = req.query;
  const redirectUrl = await getPrismicClient(req)
    .getPreviewResolver(ref as string, documentId as string)
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({
    ref,
  });

  res.setPreviewData({ ref });

  res.write(
    `<!DOCTYPE html><html><head><meta http-equiv="Refresh" content="0; url=${redirectUrl}" />
    <script>window.location.href = '${redirectUrl}'</script>
    </head>`
  );
  res.end();
};
