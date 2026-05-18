import { NextRequest, NextResponse } from 'next/server';
import { getEngineers, addEngineer, ensureHeaders } from '@/lib/googleSheets';
import { EngineerInput } from '@/types/engineer';

export async function GET() {
  try {
    const engineers = await getEngineers();
    return NextResponse.json({ engineers });
  } catch (error) {
    console.error('GET /api/engineers error:', error);
    return NextResponse.json(
      { error: 'エンジニアデータの取得に失敗しました', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = body as EngineerInput;

    await ensureHeaders();
    await addEngineer(data);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/engineers error:', error);
    return NextResponse.json(
      { error: 'エンジニアの追加に失敗しました', details: String(error) },
      { status: 500 }
    );
  }
}
