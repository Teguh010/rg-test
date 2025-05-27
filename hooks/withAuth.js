"use client";
import { useEffect, useState } from 'react';
import LayoutLoader from "@/components/layout-loader";
import { usePathname, useRouter } from 'next/navigation';

const withAuth = (WrappedComponent) => {
    const Wrapper = (props) => {
        const [userData, setUserData] = useState(null);
        const pathname = usePathname();
        const router = useRouter();

        useEffect(() => {
            // Determine which storage to use based on path
            const isManagerPath = pathname.includes('/manager');
            const storageKey = isManagerPath ? 'userData-manager' : 'userData-client';
            
            const storedUserData = JSON.parse(localStorage.getItem(storageKey) || 'null');
            setUserData(storedUserData);

            if (pathname.includes('/manager') && !pathname.includes('/manager/login')) {
                if (!storedUserData?.token) {
                    router.push("/manager/login");
                    return;
                }
                if (storedUserData?.role !== 'manager') {
                    router.push("/manager/login");
                    return;
                }
            } else if (!pathname.includes('/manager/login') && !pathname.includes('/login')) {
                if (!storedUserData?.token) {
                    router.push("/");
                    return;
                }
            }
        }, [pathname, router]);

        if (pathname.includes('/manager/login') || pathname.includes('/login')) {
            return <WrappedComponent {...props} />;
        }

        if (!userData) {
            return <LayoutLoader />;
        }

        return userData?.token ? <WrappedComponent {...props} /> : null;
    };

    if (WrappedComponent.getInitialProps) {
        Wrapper.getInitialProps = WrappedComponent.getInitialProps;
    }

    return Wrapper;
};

export default withAuth;

