import React, { useState, useCallback } from 'react';
import { CustomAlert, CustomAlertButton, CustomAlertProps } from '@/components/CustomAlert';

interface AlertConfig {
  title: string;
  message?: string;
  buttons?: CustomAlertButton[];
  icon?: React.ReactNode;
}

export function useCustomAlert() {
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const showAlert = useCallback((
    title: string,
    message?: string,
    buttons?: CustomAlertButton[],
    icon?: React.ReactNode,
  ) => {
    setConfig({ title, message, buttons, icon });
  }, []);

  const hideAlert = useCallback(() => {
    setConfig(null);
  }, []);

  const alertElement = config ? (
    <CustomAlert
      visible={true}
      title={config.title}
      message={config.message}
      buttons={config.buttons}
      icon={config.icon}
      onDismiss={hideAlert}
    />
  ) : null;

  return { showAlert, hideAlert, alertElement };
}
