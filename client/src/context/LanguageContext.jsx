import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    home: 'Home', login: 'Login', signup: 'Sign up', write: 'Write', profile: 'Profile',
    saved: 'Saved', analytics: 'Analytics', playground: 'Playground', logout: 'Logout',
    search: 'Search', semantic: 'Semantic', allPosts: 'All posts', following: 'Following',
    recommended: 'Recommended for you', latestPosts: 'Latest posts', noPosts: 'No posts yet.',
    comments: 'Comments', readTime: 'min read', share: 'Share', copy: 'Copy', copied: 'Copied!',
    toc: 'Table of contents', filters: 'Filters', from: 'From', to: 'To', minRead: 'Min read (min)',
    clear: 'Clear', writePost: 'Write a new post', title: 'Title', publish: 'Publish',
    scanCode: 'Scan code', noVuln: 'No vulnerabilities detected',
  },
  es: {
    home: 'Inicio', login: 'Entrar', signup: 'Registrarse', write: 'Escribir', profile: 'Perfil',
    saved: 'Guardados', analytics: 'Analítica', playground: 'Playground', logout: 'Salir',
    search: 'Buscar', semantic: 'Semántico', allPosts: 'Todas las publicaciones', following: 'Siguiendo',
    recommended: 'Recomendado para ti', latestPosts: 'Últimas publicaciones', noPosts: 'Sin publicaciones aún.',
    comments: 'Comentarios', readTime: 'min de lectura', share: 'Compartir', copy: 'Copiar', copied: '¡Copiado!',
    toc: 'Tabla de contenidos', filters: 'Filtros', from: 'Desde', to: 'Hasta', minRead: 'Lectura mín (min)',
    clear: 'Limpiar', writePost: 'Escribir nueva publicación', title: 'Título', publish: 'Publicar',
    scanCode: 'Escanear código', noVuln: 'Sin vulnerabilidades detectadas',
  },
  hi: {
    home: 'होम', login: 'लॉगिन', signup: 'साइन अप', write: 'लिखें', profile: 'प्रोफ़ाइल',
    saved: 'सहेजे गए', analytics: 'एनालिटिक्स', playground: 'प्लेग्राउंड', logout: 'लॉगआउट',
    search: 'खोज', semantic: 'सिमेंटिक', allPosts: 'सभी पोस्ट', following: 'फ़ॉलोइंग',
    recommended: 'आपके लिए अनुशंसित', latestPosts: 'नवीनतम पोस्ट', noPosts: 'अभी तक कोई पोस्ट नहीं।',
    comments: 'टिप्पणियाँ', readTime: 'मिनट पढ़ें', share: 'शेयर', copy: 'कॉपी', copied: 'कॉपी हो गया!',
    toc: 'विषय सूची', filters: 'फ़िल्टर', from: 'से', to: 'तक', minRead: 'न्यूनतम पढ़ें (मिनट)',
    clear: 'साफ़ करें', writePost: 'नई पोस्ट लिखें', title: 'शीर्षक', publish: 'प्रकाशित करें',
    scanCode: 'कोड स्कैन करें', noVuln: 'कोई भेद्यता नहीं मिली',
  },
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);
  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;
  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
};

export const useLang = () => useContext(LanguageContext);