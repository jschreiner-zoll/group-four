/**
 * StatusIndicator - Shows patient overall status with color, icon, and text.
 */

import React from 'react';
import { CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const STATUS_CONFIG = {
  Normal: { icon: CheckCircle, labelKey: 'normal' },
  Warning: { icon: AlertTriangle, labelKey: 'warning' },
  Critical: { icon: AlertOctagon, labelKey: 'critical' },
};

export default function StatusIndicator({ status, size = 'md' }) {
  const { t } = useLanguage();
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Normal;
  const IconComponent = config.icon;
  const sizeClass = `status-indicator status-indicator--${status.toLowerCase()}`;

  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;

  return (
    <span className={sizeClass} data-testid={`status-indicator-${status.toLowerCase()}`}>
      <span className="status-indicator__dot" aria-hidden="true" />
      <IconComponent size={iconSize} aria-hidden="true" />
      <span>{t(config.labelKey)}</span>
    </span>
  );
}
