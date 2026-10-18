import { createContext, useContext } from 'react';

/** Kiểu chú cú đang dùng (grad, herbal, chill, medic, yhct, party) – tách riêng để tránh vòng import. */
export const SkinContext = createContext<string>('grad');
export const useSkinId = () => useContext(SkinContext);
