/**
 * Language context for i18n support.
 * Supported: English, Japanese, German, French, Italian, Spanish
 */

import React, { createContext, useContext, useState } from 'react';

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸', tempUnit: '°F' },
  { code: 'ja', label: '日本語', flag: '🇯🇵', tempUnit: '°C' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', tempUnit: '°C' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', tempUnit: '°C' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', tempUnit: '°C' },
  { code: 'es', label: 'Español', flag: '🇪🇸', tempUnit: '°C' },
];

const translations = {
  en: {
    title: 'Connected Care — Remote Patient Monitoring',
    connected: 'Connected',
    disconnected: 'Disconnected',
    alerts: 'Alerts',
    noActiveAlerts: 'No active alerts',
    acknowledged: 'Acknowledged',
    acknowledge: 'Acknowledge',
    submit: 'Submit',
    cancel: 'Cancel',
    enterNote: 'Enter note...',
    noteRequired: 'Note is required',
    waitingForData: 'Waiting for patient data...',
    currentVitals: 'Current Vitals',
    activeAlerts: 'Active Alerts',
    simulationControls: 'Simulation Controls',
    returnToNormal: 'Reset',
    muteAlerts: 'Mute alerts',
    unmuteAlerts: 'Unmute alerts',
    light: 'Light',
    dark: 'Dark',
    ecgWaveform: 'ECG Waveform',
    hr: 'HR', bpSys: 'BP Sys', bpDia: 'BP Dia', spo2: 'SpO2',
    temp: 'Temp', rr: 'RR', bg: 'BG',
    normal: 'Normal', warning: 'Warning', critical: 'Critical',
    tachycardia: 'Tachycardia', bradycardia: 'Bradycardia',
    hypoxia: 'Hypoxia', hyperthermia: 'Hyperthermia',
    hypotension: 'Hypotension', hyperglycemia: 'Hyperglycemia',
    age: 'Age', escalated: 'ESCALATED', threshold: 'threshold',
    tempUnit: '°F',
  },
  ja: {
    title: 'コネクテッドケア — 遠隔患者モニタリング',
    connected: '接続中',
    disconnected: '切断',
    alerts: 'アラート',
    noActiveAlerts: 'アクティブなアラートはありません',
    acknowledged: '確認済み',
    acknowledge: '確認',
    submit: '送信',
    cancel: 'キャンセル',
    enterNote: 'メモを入力...',
    noteRequired: 'メモは必須です',
    waitingForData: '患者データを待機中...',
    currentVitals: '現在のバイタル',
    activeAlerts: 'アクティブアラート',
    simulationControls: 'シミュレーション制御',
    returnToNormal: 'リセット',
    muteAlerts: 'アラート消音',
    unmuteAlerts: 'アラート消音解除',
    light: 'ライト',
    dark: 'ダーク',
    ecgWaveform: '心電図波形',
    hr: '心拍数', bpSys: '収縮期血圧', bpDia: '拡張期血圧', spo2: 'SpO2',
    temp: '体温', rr: '呼吸数', bg: '血糖値',
    normal: '正常', warning: '警告', critical: '危険',
    tachycardia: '頻脈', bradycardia: '徐脈',
    hypoxia: '低酸素症', hyperthermia: '高体温',
    hypotension: '低血圧', hyperglycemia: '高血糖',
    age: '年齢', escalated: 'エスカレート', threshold: '閾値',
    tempUnit: '°C',
  },
  de: {
    title: 'Connected Care — Fernüberwachung von Patienten',
    connected: 'Verbunden',
    disconnected: 'Getrennt',
    alerts: 'Alarme',
    noActiveAlerts: 'Keine aktiven Alarme',
    acknowledged: 'Bestätigt',
    acknowledge: 'Bestätigen',
    submit: 'Senden',
    cancel: 'Abbrechen',
    enterNote: 'Notiz eingeben...',
    noteRequired: 'Notiz ist erforderlich',
    waitingForData: 'Warte auf Patientendaten...',
    currentVitals: 'Aktuelle Vitalwerte',
    activeAlerts: 'Aktive Alarme',
    simulationControls: 'Simulationssteuerung',
    returnToNormal: 'Zurücksetzen',
    muteAlerts: 'Alarme stummschalten',
    unmuteAlerts: 'Alarme aktivieren',
    light: 'Hell',
    dark: 'Dunkel',
    ecgWaveform: 'EKG-Wellenform',
    hr: 'HF', bpSys: 'BD Sys', bpDia: 'BD Dia', spo2: 'SpO2',
    temp: 'Temp', rr: 'AF', bg: 'BZ',
    normal: 'Normal', warning: 'Warnung', critical: 'Kritisch',
    tachycardia: 'Tachykardie', bradycardia: 'Bradykardie',
    hypoxia: 'Hypoxie', hyperthermia: 'Hyperthermie',
    hypotension: 'Hypotonie', hyperglycemia: 'Hyperglykämie',
    age: 'Alter', escalated: 'ESKALIERT', threshold: 'Schwelle',
    tempUnit: '°C',
  },
  fr: {
    title: 'Connected Care — Surveillance à distance des patients',
    connected: 'Connecté',
    disconnected: 'Déconnecté',
    alerts: 'Alertes',
    noActiveAlerts: 'Aucune alerte active',
    acknowledged: 'Acquittée',
    acknowledge: 'Acquitter',
    submit: 'Envoyer',
    cancel: 'Annuler',
    enterNote: 'Saisir une note...',
    noteRequired: 'La note est obligatoire',
    waitingForData: 'En attente des données patient...',
    currentVitals: 'Signes vitaux actuels',
    activeAlerts: 'Alertes actives',
    simulationControls: 'Contrôles de simulation',
    returnToNormal: 'Réinitialiser',
    muteAlerts: 'Couper les alertes',
    unmuteAlerts: 'Activer les alertes',
    light: 'Clair',
    dark: 'Sombre',
    ecgWaveform: 'Tracé ECG',
    hr: 'FC', bpSys: 'PA Sys', bpDia: 'PA Dia', spo2: 'SpO2',
    temp: 'Temp', rr: 'FR', bg: 'Glyc',
    normal: 'Normal', warning: 'Attention', critical: 'Critique',
    tachycardia: 'Tachycardie', bradycardia: 'Bradycardie',
    hypoxia: 'Hypoxie', hyperthermia: 'Hyperthermie',
    hypotension: 'Hypotension', hyperglycemia: 'Hyperglycémie',
    age: 'Âge', escalated: 'ESCALADÉE', threshold: 'seuil',
    tempUnit: '°C',
  },
  it: {
    title: 'Connected Care — Monitoraggio remoto dei pazienti',
    connected: 'Connesso',
    disconnected: 'Disconnesso',
    alerts: 'Allarmi',
    noActiveAlerts: 'Nessun allarme attivo',
    acknowledged: 'Confermato',
    acknowledge: 'Conferma',
    submit: 'Invia',
    cancel: 'Annulla',
    enterNote: 'Inserisci nota...',
    noteRequired: 'La nota è obbligatoria',
    waitingForData: 'In attesa dei dati del paziente...',
    currentVitals: 'Parametri vitali attuali',
    activeAlerts: 'Allarmi attivi',
    simulationControls: 'Controlli simulazione',
    returnToNormal: 'Ripristina',
    muteAlerts: 'Silenzia allarmi',
    unmuteAlerts: 'Attiva allarmi',
    light: 'Chiaro',
    dark: 'Scuro',
    ecgWaveform: 'Tracciato ECG',
    hr: 'FC', bpSys: 'PA Sis', bpDia: 'PA Dia', spo2: 'SpO2',
    temp: 'Temp', rr: 'FR', bg: 'Glic',
    normal: 'Normale', warning: 'Attenzione', critical: 'Critico',
    tachycardia: 'Tachicardia', bradycardia: 'Bradicardia',
    hypoxia: 'Ipossia', hyperthermia: 'Ipertermia',
    hypotension: 'Ipotensione', hyperglycemia: 'Iperglicemia',
    age: 'Età', escalated: 'ESCALATO', threshold: 'soglia',
    tempUnit: '°C',
  },
  es: {
    title: 'Connected Care — Monitoreo remoto de pacientes',
    connected: 'Conectado',
    disconnected: 'Desconectado',
    alerts: 'Alertas',
    noActiveAlerts: 'Sin alertas activas',
    acknowledged: 'Confirmada',
    acknowledge: 'Confirmar',
    submit: 'Enviar',
    cancel: 'Cancelar',
    enterNote: 'Ingrese nota...',
    noteRequired: 'La nota es obligatoria',
    waitingForData: 'Esperando datos del paciente...',
    currentVitals: 'Signos vitales actuales',
    activeAlerts: 'Alertas activas',
    simulationControls: 'Controles de simulación',
    returnToNormal: 'Restablecer',
    muteAlerts: 'Silenciar alertas',
    unmuteAlerts: 'Activar alertas',
    light: 'Claro',
    dark: 'Oscuro',
    ecgWaveform: 'Trazado ECG',
    hr: 'FC', bpSys: 'PA Sis', bpDia: 'PA Dia', spo2: 'SpO2',
    temp: 'Temp', rr: 'FR', bg: 'Gluc',
    normal: 'Normal', warning: 'Advertencia', critical: 'Crítico',
    tachycardia: 'Taquicardia', bradycardia: 'Bradicardia',
    hypoxia: 'Hipoxia', hyperthermia: 'Hipertermia',
    hypotension: 'Hipotensión', hyperglycemia: 'Hiperglucemia',
    age: 'Edad', escalated: 'ESCALADA', threshold: 'umbral',
    tempUnit: '°C',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const setLang = (code) => {
    setLanguage(code);
    localStorage.setItem('language', code);
  };

  const convertTemp = (fahrenheit) => {
    const langConfig = LANGUAGES.find((l) => l.code === language);
    if (langConfig && langConfig.tempUnit === '°C') {
      return Math.round(((fahrenheit - 32) * 5 / 9) * 10) / 10;
    }
    return fahrenheit;
  };

  const tempUnit = () => {
    const langConfig = LANGUAGES.find((l) => l.code === language);
    return langConfig?.tempUnit || '°F';
  };

  return (
    <LanguageContext.Provider value={{ language, t, setLang, convertTemp, tempUnit }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
