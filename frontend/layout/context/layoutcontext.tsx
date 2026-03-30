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

    // role can be 'admin' or 'customer'. Load from localStorage if available.
    const [role, setRole] = useState<'admin' | 'customer'>('customer');
    const [roleHydrated, setRoleHydrated] = useState(false);
    
    // Cart count state for real-time topbar updates
    const [cartCount, setCartCount] = useState(0);

    // Load role from localStorage/token on mount.
    // If local user data is missing but token still exists, fetch profile to avoid
    // defaulting admin sessions to customer after browser refresh.
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const hydrateRole = async () => {
            const token = localStorage.getItem('access_token');
            const storedUser = localStorage.getItem('user');

            if (storedUser && token) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    if (parsedUser.role === 'admin' || parsedUser.role === 'customer') {
                        setRole(parsedUser.role);
                        setRoleHydrated(true);
                        return;
                    }
                } catch (error) {
                    console.error('Error parsing user from localStorage:', error);
                }
            }

            if (!token) {
                setRole('customer');
                setRoleHydrated(true);
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${apiUrl}/api/auth/profile/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');
                    setRole('customer');
                    setRoleHydrated(true);
                    return;
                }

                const data = await response.json();
                const profile = data?.data || data;

                if (profile && (profile.role === 'admin' || profile.role === 'customer')) {
                    setRole(profile.role);
                    localStorage.setItem('user', JSON.stringify(profile));
                } else {
                    setRole('customer');
                }
            } catch (error) {
                console.error('Error hydrating role from profile API:', error);
                setRole('customer');
            } finally {
                setRoleHydrated(true);
            }
        };

        void hydrateRole();
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
        roleHydrated,
        setRole,
        cartCount,
        setCartCount
    };

    return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};
