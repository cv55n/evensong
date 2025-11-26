import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // todo: remover isso eventualmente
    if (request.nextUrl.pathname.startsWith('/guide/')) {
        const newUrl = request.nextUrl.clone();

        newUrl.pathname = newUrl.pathname.replace('/guide/', '/');

        return NextResponse.redirect(newUrl);
    }

    // redirecionar urls antigos para /legacy
    if (!request.nextUrl.pathname.startsWith('/legacy') && !request.nextUrl.pathname.startsWith('/voice')) {
        const newUrl = request.nextUrl.clone();

        newUrl.pathname = `/legacy${newUrl.pathname}`;

        return NextResponse.redirect(newUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next|api|og|.*\\..*|_static).*)'
    ]
};