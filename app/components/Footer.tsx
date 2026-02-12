'use client';

import React from 'react';

export const Footer = () => (
  <div className="py-8 flex flex-col items-center gap-4">
    <a
      href="https://www.web-seo.pro/en/contact-us/" target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-5 py-2.5 font-bold transition-opacity hover:opacity-90"
      style={{ background: 'linear-gradient(90deg, #1d4ed8 0%, #ff00ff 100%)', color: '#ffffff', borderRadius: '25px' }}
    >
      Book your SEO optimisation consultation
    </a>
    <div className="text-center text-white/60 text-sm">
      SEO Audit Tool • Complete Technical & On-Page Analysis • {new Date().getFullYear()}
    </div>
  </div>
);
