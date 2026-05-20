/**
 * LanguageSelector - Dropdown with country flags for language selection.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';

export default function LanguageSelector() {
  const { language, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <div className="language-selector" ref={ref} data-testid="language-selector">
      <button
        className="language-selector__trigger"
        onClick={() => setOpen(!open)}
        aria-label="Select language"
        aria-expanded={open}
      >
        <span className="language-selector__flag">{currentLang.flag}</span>
        <span className="language-selector__label">{currentLang.label}</span>
        <span className="language-selector__arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <ul className="language-selector__dropdown" role="listbox">
          {LANGUAGES.map((lang) => (
            <li
              key={lang.code}
              className={`language-selector__option ${lang.code === language ? 'language-selector__option--active' : ''}`}
              onClick={() => handleSelect(lang.code)}
              role="option"
              aria-selected={lang.code === language}
            >
              <span className="language-selector__flag">{lang.flag}</span>
              <span>{lang.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
