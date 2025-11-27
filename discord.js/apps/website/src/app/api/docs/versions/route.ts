import { NextResponse, type NextRequest } from 'next/server';

import { fetchVersions } from '@/util/fetchVersions';

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;

    const packageName = searchParams.get('packageName');

	if (!packageName) {
		return NextResponse.json({
            error: 'parâmetros necessários ausentes'
        }, {
            status: 400
        });
	}

	const response = await fetchVersions(packageName);

	return NextResponse.json(response);
}