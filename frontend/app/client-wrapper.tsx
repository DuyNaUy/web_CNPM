'use client';

import { LayoutProvider } from '../layout/context/layoutcontext';
import { PrimeReactProvider } from 'primereact/api';
import dynamic from 'next/dynamic';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';
import '../styles/admin/admin.scss';
import '../styles/demo/Demos.scss';

const FloatingChatButton = dynamic(() => import('@/components/FloatingChatButton'), {
    ssr: false
});

interface ClientWrapperProps {
    children: React.ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
    return (
        <PrimeReactProvider>
            <LayoutProvider>
                {children}
                <FloatingChatButton />
            </LayoutProvider>
        </PrimeReactProvider>
    );
}
