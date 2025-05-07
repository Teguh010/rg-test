"use client";
import { useEffect, useState } from 'react';
import LayoutLoader from "@/components/layout-loader";
import { usePathname } from 'next/navigation';

const withAuth = (WrappedComponent) => {
    const Wrapper = (props) => {
        const [userData, setUserData] = useState(null);
        const pathname = usePathname();

        useEffect(() => {
            const storedUserData = JSON.parse(localStorage.getItem('userData'));
            setUserData(storedUserData);

            if (pathname.includes('/manager') && !pathname.includes('/manager/login')) {
                if (!storedUserData?.token) {
                    window.location.assign("/manager/login");
                    return;
                }
                if (storedUserData?.role !== 'manager') {
                    window.location.assign("/manager/login");
                    return;
                }
            } else if (!pathname.includes('/manager/login')) {
                if (!storedUserData?.token) {
                    window.location.assign("/");
                    return;
                }
            }
        }, [pathname]);

        if (pathname.includes('/manager/login')) {
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

