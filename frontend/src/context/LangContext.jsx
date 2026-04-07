import { createContext, useContext, useState } from 'react';
import { translations } from '../i18n';

const LangContext = createContext({});

export function LangProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'pt');

  const t = (key) => translations[lang][key] || key;

  const toggleLang = () => {
    const next = lang === 'pt' ? 'en' : 'pt';
    setLang(next);
    localStorage.setItem('lang', next);
  };

  return (
    <LangContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
