/* eslint-disable @next/next/no-img-element */

import React, { useContext, useEffect, useState } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import { AppMenuItem } from '@/types';
import { orderAPI } from '@/services/api';
import { usePathname } from 'next/navigation';

const ADMIN_ORDERS_LAST_SEEN_KEY = 'admin_orders_last_seen_at';

const AppMenu = () => {
    const { role, roleHydrated } = useContext(LayoutContext);
    const [newOrderCount, setNewOrderCount] = useState(0);
    const [consultationAlertCount, setConsultationAlertCount] = useState(0);
    const pathname = usePathname();

    useEffect(() => {
        if (!roleHydrated || role !== 'admin') return;
        if (!pathname?.startsWith('/admin/orders')) return;

        const nowIso = new Date().toISOString();
        localStorage.setItem(ADMIN_ORDERS_LAST_SEEN_KEY, nowIso);
        setNewOrderCount(0);
    }, [roleHydrated, role, pathname]);

    useEffect(() => {
        if (!roleHydrated || role !== 'admin') return;

        const loadAdminNotifications = async () => {
            try {
                const ordersResponse = await orderAPI.getAllOrders();
                const orders = Array.isArray(ordersResponse)
                    ? ordersResponse
                    : Array.isArray(ordersResponse?.data)
                    ? ordersResponse.data
                    : [];

                const lastSeenRaw = localStorage.getItem(ADMIN_ORDERS_LAST_SEEN_KEY);
                const lastSeenAt = lastSeenRaw ? new Date(lastSeenRaw).getTime() : 0;

                const unseenNewOrders = orders.filter((order: any) => {
                    const createdAt = new Date(order?.created_at || '').getTime();
                    return Number.isFinite(createdAt) && createdAt > lastSeenAt;
                }).length;

                setNewOrderCount(unseenNewOrders);
            } catch (error) {
                console.error('Error loading order notifications:', error);
            }

            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    setConsultationAlertCount(0);
                    return;
                }
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${apiUrl}/api/ai/conversations/?limit=200`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                const conversations = Array.isArray(data) ? data : data?.results || [];
                const unreadCount = conversations.filter((item: any) => item?.human_support_unread_for_admin).length;
                setConsultationAlertCount(unreadCount);
            } catch (error) {
                console.error('Error loading consultation notifications:', error);
            }
        };

        void loadAdminNotifications();
        const interval = setInterval(() => {
            void loadAdminNotifications();
        }, 5000);

        return () => clearInterval(interval);
    }, [roleHydrated, role]);

    // Admin menu - Full access
    const adminModel: AppMenuItem[] = [
        {
            label: 'Quản Lý & Thống Kê',
            items: [
                { label: 'Quản Lý Tài Khoản', icon: 'pi pi-fw pi-users', to: '/admin/accounts' },
                { label: 'Quản Lý Danh Mục', icon: 'pi pi-fw pi-tags', to: '/admin/categories' },
                { label: 'Quản Lý Sản Phẩm', icon: 'pi pi-fw pi-shopping-bag', to: '/admin/products' },
                { label: 'Quản Lý Đơn Hàng', icon: 'pi pi-fw pi-shopping-cart', to: '/admin/orders', badgeValue: newOrderCount > 0 ? 'Mới' : undefined },
                { label: 'Tư Vấn Bán Hàng', icon: 'pi pi-fw pi-comments', to: '/admin/consultations', badgeValue: consultationAlertCount },
                { label: 'Thống Kê Báo Cáo', icon: 'pi pi-fw pi-chart-line', to: '/admin/reports' }
            ]
        }
    ];

    // Customer menu is in topbar
    const customerModel: AppMenuItem[] = [];

    // Select model based on role
    const filteredModel = role === 'admin' ? adminModel : customerModel;

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {filteredModel.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
