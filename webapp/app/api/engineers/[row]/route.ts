import { NextRequest, NextResponse } from 'next/server';
import { updateEngineer, deleteEngineer } from '@/lib/googleSheets';
import { EngineerInput } from '@/types/engineer';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ row: string }> }
) {
  try {
    const { row } = await params;
    const rowIndex = parseInt(row, 10);
    if (isNaN(rowIndex) || rowIndex < 2) {
      return NextResponse.json({ error: '無効な行番号です' }, { status: 400 });
    }

    const body = await request.json();
    const data = body as EngineerInput;

    await updateEngineer(rowIndex, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`PUT /api/engineers/[row] error:`, error);
    return NextResponse.json(
      { error: 'エンジニアの更新に失敗しました', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ row: string }> }
) {
  try {
    const { row } = await params;
    const rowIndex = parseInt(row, 10);
    if (isNaN(rowIndex) || rowIndex < 2) {
      return NextResponse.json({ error: '無効な行番号です' }, { status: 400 });
    }

    await deleteEngineer(rowIndex);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/engineers/[row] error:`, error);
    return NextResponse.json(
      { error: 'エンジニアの削除に失敗しました', details: String(error) },
      { status: 500 }
    );
  }
}
