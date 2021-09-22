import { NextApiResponse } from 'next';

export default async function exit(_: unknown, res: NextApiResponse) {
  res.clearPreviewData();

  res.writeHead(307, { Location: '/' });
  res.end();
}
