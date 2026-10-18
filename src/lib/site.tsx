import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { setMeterEnabled } from './quotaMeter';
import { useAuth } from './auth';
import { DEFAULT_CONFIG, useAppConfig, useMyRole, type AppConfig, type RoleState } from './admin';

interface SiteState {
  config: AppConfig;
  /** Đã tải xong cấu hình chung từ database. */
  configLoaded: boolean;
  role: RoleState;
  /** Người dùng hiện tại có được tạo / sửa nội dung không (khớp với canWrite() trong rules). */
  canWrite: boolean;
}

const SiteContext = createContext<SiteState>({
  config: DEFAULT_CONFIG,
  configLoaded: false,
  role: { isAdmin: false, isModerator: false, isRoot: false, banned: false, loading: true },
  canWrite: false,
});

export function SiteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { config, loaded: configLoaded } = useAppConfig();
  // Đếm quota ước tính chỉ khi admin bật (và đã tải xong cấu hình).
  useEffect(() => setMeterEnabled(configLoaded && config.quotaTracking), [configLoaded, config.quotaTracking]);
  const role = useMyRole(user);
  const canWrite = !!user && (role.isAdmin || (!role.banned && !config.readOnly));
  return <SiteContext.Provider value={{ config, configLoaded, role, canWrite }}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
