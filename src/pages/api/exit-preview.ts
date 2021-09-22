import { NextApiResponse } from 'next';

export default async function exit(_, res: NextApiResponse) {
  res.clearPreviewData();

  res.writeHead(307, { location: '/' });
  res.end();
}
