import { Metadata } from 'next';
import Layout from '../../layout/layout';
import React from 'react';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'Web Bán Thực Phẩm',
    description: 'Hệ thống bán thực phẩm trực tuyến'
};

export default function MainLayout({ children }: MainLayoutProps) {
    return <Layout>{children}</Layout>;
}