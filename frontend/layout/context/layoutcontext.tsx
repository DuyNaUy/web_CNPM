'use client';
import React, { useState, createContext, useEffect } from 'react';
import { LayoutState, ChildContainerProps, LayoutConfig, LayoutContextProps } from '@/types';
export const LayoutContext = createContext({} as LayoutContextProps);

export const LayoutProvider = ({ children }: ChildContainerProps) => {
    const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
        ripple: false,
        inputStyle: 'outlined',
        menuMode: 'static',
        colorScheme: 'light',
        theme: 'lara-light-pink',
        scale: 14
    });

    const [layoutState, setLayoutState] = useState<LayoutState>({
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        profileSidebarVisible: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false
    });

    // Keep initial role deterministic to avoid hydration mismatch.
    const [role, setRole] = useState<'admin' | 'customer'>('customer');
    const [roleHydrated, setRoleHydrated] = useState(false);
    
    // Cart count state for real-time topbar updates
    const [cartCount, setCartCount] = useState(0);

    // Load role from localStorage on mount (source of truth after hydration)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    if (user.role === 'admin' || user.role === 'customer') {
                        setRole(user.role);
                    }
                } catch (error) {
                    console.error('Error parsing user from localStorage:', error);
                }
            }
            setRoleHydrated(true);
        }
    }, []);

    const onMenuToggle = () => {
        if (isOverlay()) {
            setLayoutState((prevLayoutState) => ({ ...prevLayoutState, overlayMenuActive: !prevLayoutState.overlayMenuActive }));
        }

        if (isDesktop()) {
            setLayoutState((prevLayoutState) => ({ ...prevLayoutState, staticMenuDesktopInactive: !prevLayoutState.staticMenuDesktopInactive }));
        } else {
            setLayoutState((prevLayoutState) => ({ ...prevLayoutState, staticMenuMobileActive: !prevLayoutState.staticMenuMobileActive }));
        }
    };

    const showProfileSidebar = () => {
        setLayoutState((prevLayoutState) => ({ ...prevLayoutState, profileSidebarVisible: !prevLayoutState.profileSidebarVisible }));
    };

    const isOverlay = () => {
        return layoutConfig.menuMode === 'overlay';
    };

    const isDesktop = () => {
        return window.innerWidth > 991;
    };

    const value: LayoutContextProps = {
        layoutConfig,
        setLayoutConfig,
        layoutState,
        setLayoutState,
        onMenuToggle,
        showProfileSidebar,
        role,
        setRole,
        roleHydrated,
        cartCount,
        setCartCount
    };

    return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};
