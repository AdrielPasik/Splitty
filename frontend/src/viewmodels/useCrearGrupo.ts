import { useState } from 'react';
import * as groupsApi from '../api/groups';
import { getCurrentUser } from '../api/client';
import { saveGroupEmoji } from '../utils/groupEmoji';
import { useAuth } from '../contexts/AuthContext';

export function useCrearGrupo() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createGroup = async ({ nombre, descripcion, emoji }: { nombre: string; descripcion: string; emoji: string; }) => {
    setLoading(true);
    try {
      let initialMembers: string[] = [];
      try {
        const me = await getCurrentUser();
        const backendId = me?.id || me?.userId || me?.uid;
        if (backendId) {
          initialMembers = [backendId];
        } else if (user?.uid) {
          initialMembers = [user.uid];
        }
      } catch (meErr) {
        console.warn('Could not fetch /users/me', meErr);
        if (user?.uid) initialMembers = [user.uid];
      }

      const res = await groupsApi.createGroup({ nombre: nombre.trim(), descripcion: descripcion.trim(), initialMembers, emoji } as any);
      const grupoId = res?.id || res?._id || res?.grupoId || null;
      if (grupoId && emoji) {
        try { await saveGroupEmoji(grupoId, emoji); } catch (_) { /* ignore */ }
      }
      return grupoId;
    } finally {
      setLoading(false);
    }
  };

  const createInviteLink = async (grupoId: string, ttl?: number) => {
    return groupsApi.createInviteLink(grupoId, ttl);
  };

  return { loading, createGroup, createInviteLink };
}
