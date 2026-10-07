import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { testR2Connection, getR2Config, type R2Config } from '@/lib/storage/r2';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await req.json().catch(() => ({}))) as Partial<R2Config>;

    let config: R2Config | null = null;

    if (body.accountId && body.accessKeyId && body.secretAccessKey && body.bucketName) {
      config = {
        accountId: body.accountId,
        accessKeyId: body.accessKeyId,
        secretAccessKey: body.secretAccessKey,
        bucketName: body.bucketName,
        publicDomain: body.publicDomain || '',
      };
    } else {
      config = await getR2Config();
    }

    if (!config) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing Cloudflare R2 credentials. Please enter Account ID, Access Key ID, Secret Access Key, and Bucket Name.',
        },
        { status: 400 }
      );
    }

    const result = await testR2Connection(config);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
