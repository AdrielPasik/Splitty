import { useEffect, useState } from 'react';
import * as groupsApi from '../api/groups';
import * as friendsApi from '../api/friends';
import { Alert } from 'react-native';

export function useInvitarMiembro(grupoId?: string) {
  const [inviteData, setInviteData] = useState<any | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  const fetchInvite = async () => {
    if (!grupoId) return;
    setLoadingInvite(true);
    try {
      const res = await groupsApi.createInviteLink(grupoId, 43200);
      setInviteData(res);
    } catch (e) {
      console.error('createInviteLink error', e);
      // Friendly message when forbidden (not admin)
      const status = (e as any)?.response?.status;
      if (status === 403) {
        Alert.alert('Sin permisos', 'Solo los administradores del grupo pueden generar links de invitacion');
      }
      setInviteData(null);
    } finally {
      setLoadingInvite(false);
    }
  };

  const fetchGroupMembers = async () => {
    if (!grupoId) return;
    try {
      const res = await groupsApi.getGroupMembers(grupoId);
      const members = Array.isArray(res) ? res : res?.members ?? [];
      setGroupMembers(members);
    } catch (e) {
      console.error('getGroupMembers error', e);
      setGroupMembers([]);
    }
  };

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const res = await friendsApi.getFriends();
      const arr = Array.isArray(res) ? res : res?.friends ?? [];

      // Filtrar amigos que ya son miembros del grupo
      const memberIds = new Set(groupMembers.map((m: any) => m.id || m.usuario_id));
      const availableFriends = arr.filter((friend: any) => !memberIds.has(friend.id));

      setFriends(availableFriends);
    } catch (e) {
      console.error('getFriends error', e);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  useEffect(() => {
    fetchInvite();
    fetchGroupMembers();
  }, [grupoId]);

  useEffect(() => {
    if (groupMembers.length >= 0) {
      fetchFriends();
    }
  }, [groupMembers]);

  const addMember = async (friendId: string) => {
    if (!grupoId) throw new Error('NO_GROUP_ID');
    const result = await groupsApi.addMembers(grupoId, [friendId]);
    // Refrescar miembros del grupo y lista de amigos después de agregar
    await fetchGroupMembers();
    return result;
  };

  return { 
    inviteData, 
    loadingInvite, 
    friends, 
    loadingFriends, 
    fetchInvite, 
    fetchFriends, 
    addMember 
  };
}