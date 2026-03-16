'use client';

import { createContext, useContext } from 'react';

export type PlayerUser = {
    id: string;
    username: string;
    displayName: string | null;
    role: string;
    points: number;
    totalPointsEarned: number;
    avatarUrl: string | null;
    avatarBg: string | null;
    themeColor: string | null;
    title: string | null;
};

type PlayerUserContextType = {
    user: PlayerUser | null;
    /** เรียกหลัง save profile เพื่อ refresh user data จาก layout */
    refreshUser: () => Promise<void>;
};

export const PlayerUserContext = createContext<PlayerUserContextType>({
    user: null,
    refreshUser: async () => { },
});

export const usePlayerUser = () => useContext(PlayerUserContext);
