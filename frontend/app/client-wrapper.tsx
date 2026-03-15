'use client';

import { LayoutProvider } from '../layout/context/layoutcontext';
import { PrimeReactProvider } from 'primereact/api';
import FloatingChatButton from '@/components/FloatingChatButton';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';
import '../styles/admin/admin.scss';
import '../styles/demo/Demos.scss';

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
