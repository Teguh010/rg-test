import { NextResponse, NextRequest } from 'next/server';
import { i18nRouter } from 'next-i18n-router';
import i18nConfig from '@/app/i18nConfig';

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    return i18nRouter(request, i18nConfig);
}

export const config = {
    matcher: [
        '/((?!api|static|.*\\..*|_next).*)',
        '/api/:path*'
    ]
};