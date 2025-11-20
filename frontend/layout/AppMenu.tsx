/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import Link from 'next/link';
import { AppMenuItem } from '@/types';
import { Button } from 'primereact/button';

const AppMenu = () => {
    const { layoutConfig, role, setRole } = useContext(LayoutContext);

    // Admin menu - Full access
    const adminModel: AppMenuItem[] = [
        {
            label: 'Quản Lý & Thống Kê',
            items: [
                { label: 'Quản Lý Tài Khoản', icon: 'pi pi-fw pi-users', to: '/admin/accounts' },
                { label: 'Quản Lý Danh Mục', icon: 'pi pi-fw pi-tags', to: '/admin/categories' },
                { label: 'Quản Lý Sản Phẩm', icon: 'pi pi-fw pi-shopping-bag', to: '/admin/products' },
                { label: 'Quản Lý Đơn Hàng', icon: 'pi pi-fw pi-shopping-cart', to: '/admin/orders' },
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
