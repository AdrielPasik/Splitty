import { useEffect, useState } from 'react';
import * as groupsApi from '../api/groups';

export function useAddGasto(grupoId?: string) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchMembers = async () => {
    if (!grupoId) return;
    setLoading(true);
    try {
      const res = await groupsApi.getGroupMembers(grupoId);
      const arr = Array.isArray(res) ? res : res?.members ?? [];
      setMembers(arr);
    } catch (e) {
      console.error('getGroupMembers', e);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [grupoId]);

  return { members, loading, refreshMembers: fetchMembers };
}
