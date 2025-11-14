import { useEffect, useState } from 'react';
import * as groupsApi from '../api/groups';

export function useInicio() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await groupsApi.getMyGroups();
      let groupsArr = Array.isArray(res) ? res : [];
      try {
        const { loadGroupEmojis } = await import('../utils/groupEmoji');
        const map = await loadGroupEmojis();
        groupsArr = groupsArr.map((g: any) => ({ ...g, emoji: map[g.id] ?? g.emoji ?? '✈️' }));
      } catch (e) {
        groupsArr = groupsArr.map((g: any) => ({ ...g, emoji: g.emoji ?? '✈️' }));
      }
      setGroups(groupsArr);
    } catch (e: any) {
      console.error('getMyGroups error', e);
      setError('Error cargando grupos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return { groups, loading, error, refresh: fetchGroups };
}
