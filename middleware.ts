import { NextResponse, NextRequest } from 'next/server';
import { i18nRouter } from 'next-i18n-router';
import i18nConfig from '@/app/i18nConfig';

export async function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    if (request.nextUrl.pathname.includes('/manager')) {
        const country = request.geo?.country || '';
        
        const blockedCountries = [
            'SG', // Singapure
            'CN'  // China
        ];
        
        if (country && blockedCountries.includes(country)) {
            console.log('Access denied for blocked country:', country);
            
            const locale = request.nextUrl.pathname.split('/')[1] || 'en';
            return NextResponse.redirect(new URL(`/${locale}`, request.url));
        }
    }

    return i18nRouter(request, i18nConfig);
}

export const config = {
    matcher: [
        '/((?!api|static|.*\\..*|_next).*)',
        '/api/:path*'
    ]
};
