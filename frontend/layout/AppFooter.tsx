/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import { LayoutContext } from './context/layoutcontext';

const AppFooter = () => {
    const { layoutConfig } = useContext(LayoutContext);

    return (
        <div className="layout-footer">
            <div className="footer-content">
                <img src="/layout/images/logo1.png" alt="Logo" height="20" className="mr-2" />
                <span className="font-medium">Teddy Shop 🧸</span>
            </div>
            <div className="footer-contact">
                <div className="contact-item">
                    <i className="pi pi-envelope mr-2"></i>
                    <a href="mailto:luongtrongduy06112004@gmail.com">luongtrongduy06112004@gmail.com</a>
                </div>
                <div className="contact-item">
                    <i className="pi pi-phone mr-2"></i>
                    <a href="tel:0899456004">0899456004</a>
                </div>
                <div className="contact-item">
                    <i className="pi pi-map-marker mr-2"></i>
                    <span>Mỹ Đình, Hà Nội, Việt Nam</span>
                </div>
            </div>
        </div>
    );
};

export default AppFooter;
