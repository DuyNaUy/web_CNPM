import { Metadata } from 'next';
import Layout from '../../layout/layout';
import React from 'react';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'Teddy Shop - Cửa Hàng Gấu Bông',
    description: 'Hệ thống bán gấu bông trực tuyến - Chất lượng cao, giao hàng nhanh'
};

export default function MainLayout({ children }: MainLayoutProps) {
    return <Layout>{children}</Layout>;
}