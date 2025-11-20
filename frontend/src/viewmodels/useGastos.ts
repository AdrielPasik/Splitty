import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getMyGroupsOffline, getGroupExpensesOffline, getUserProfileOffline } from '../api/offlineApi';

interface EnrichedExpense extends Record<string, any> {
  groupId: string;
  groupName?: string;
  participantes?: Array<any>;
  owedAmount?: number;
}

export function useGastos() {
  const [data, setData] = useState<EnrichedExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get groups (with offline fallback)
        const gruposResult = await getMyGroupsOffline();
        const grupos: any[] = Array.isArray(gruposResult.data) ? gruposResult.data : [];
        setFromCache(Boolean(gruposResult.fromCache));

        // Get current user from offline cache
        let currentUser: any = null;
        try {
          const userResult = await getUserProfileOffline();
          currentUser = userResult.data;
          if (userResult.fromCache) setFromCache(true);
        } catch (e) {
          console.warn('No se pudo obtener el usuario actual:', e);
        }

        // Si no tenemos usuario, no podemos filtrar correctamente, entonces no mostramos gastos
        if (!currentUser || !currentUser.id) {
          console.warn('No hay usuario actual, no se pueden mostrar gastos');
          if (mounted) setData([]);
          return;
        }

        const allEnriched: EnrichedExpense[] = [];

        for (const g of grupos) {
          let list: any[] = [];
          try {
            const expensesResult = await getGroupExpensesOffline(g.id);
            list = Array.isArray(expensesResult.data) ? expensesResult.data : [];
            if (expensesResult.fromCache) setFromCache(true);
          } catch (e) {
            console.warn('Error obteniendo gastos para grupo', g.id, e?.message || e);
            list = [];
          }

          // 🚀 OPTIMIZACIÓN: Hacer peticiones de detalles en paralelo
          const detailPromises = list.map(async (exp) => {
            try {
              const detailRes = await api.get(`/groups/${g.id}/expenses/${exp.id}`);
              return { success: true, detail: detailRes.data, exp };
            } catch (e) {
              return { success: false, detail: null, exp };
            }
          });

          const detailResults = await Promise.all(detailPromises);

          for (const result of detailResults) {
            const exp = result.exp;
            const detail = result.success ? result.detail : exp;

            try {
              const enriched: EnrichedExpense = { ...detail, groupId: g.id, groupName: g.nombre };

              const meId = currentUser.id;

              // Verificar si el usuario es participante (pagador o debe)
              const isParticipant = enriched.pagador_id === meId ||
                (enriched.participantes || []).some((p: any) => p.usuarioId === meId);

              if (!isParticipant) {
                continue; // Saltar este gasto si no somos participantes
              }

              // Calcular owedAmount
              if (enriched.pagador_id === meId) {
                const othersShare = (enriched.participantes || []).reduce((sum: number, p: any) => {
                  if (p.usuarioId === meId) return sum;
                  return sum + (p.parte_importe || 0);
                }, 0);
                enriched.owedAmount = othersShare;
              } else {
                const mePart = (enriched.participantes || []).find((p: any) => p.usuarioId === meId);
                enriched.owedAmount = mePart ? -Math.abs(mePart.parte_importe || 0) : 0;
              }

              allEnriched.push(enriched);
            } catch (e) {
              // Si falla el procesamiento, usar el item de la lista si somos participantes
              const isParticipant = exp.pagador_id === currentUser.id ||
                (exp.participantes || []).some((p: any) => p.usuarioId === currentUser.id);

              if (isParticipant) {
                allEnriched.push({ ...exp, groupId: g.id, groupName: g.nombre });
              }
            }
          }
        }

        if (mounted) setData(allEnriched || []);
      } catch (e) {
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();

    return () => { mounted = false; };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const gruposResult = await getMyGroupsOffline();
      const grupos: any[] = Array.isArray(gruposResult.data) ? gruposResult.data : [];
      if (gruposResult.fromCache) setFromCache(true);

      // Get current user from offline cache
      let currentUser: any = null;
      try {
        const userResult = await getUserProfileOffline();
        currentUser = userResult.data;
        if (userResult.fromCache) setFromCache(true);
      } catch (e) {
        console.warn('No se pudo obtener el usuario actual:', e);
      }

      // Si no tenemos usuario, no podemos filtrar correctamente
      if (!currentUser || !currentUser.id) {
        console.warn('No hay usuario actual, no se pueden mostrar gastos');
        setData([]);
        return;
      }

      const allEnriched: EnrichedExpense[] = [];
      for (const g of grupos) {
        let list: any[] = [];
        try {
          const expensesResult = await getGroupExpensesOffline(g.id);
          list = Array.isArray(expensesResult.data) ? expensesResult.data : [];
          if (expensesResult.fromCache) setFromCache(true);
        } catch (e) { list = []; }

        // 🚀 OPTIMIZACIÓN: Hacer peticiones de detalles en paralelo
        const detailPromises = list.map(async (exp) => {
          try {
            const detailRes = await api.get(`/groups/${g.id}/expenses/${exp.id}`);
            return { success: true, detail: detailRes.data, exp };
          } catch (e) {
            return { success: false, detail: null, exp };
          }
        });

        const detailResults = await Promise.all(detailPromises);

        for (const result of detailResults) {
          const exp = result.exp;
          const detail = result.success ? result.detail : exp;

          try {
            const enriched: EnrichedExpense = { ...detail, groupId: g.id, groupName: g.nombre };

            const meId = currentUser.id;

            // Verificar si el usuario es participante (pagador o debe)
            const isParticipant = enriched.pagador_id === meId ||
              (enriched.participantes || []).some((p: any) => p.usuarioId === meId);

            if (!isParticipant) {
              continue; // Saltar este gasto si no somos participantes
            }

            // Calcular owedAmount
            if (enriched.pagador_id === meId) {
              const othersShare = (enriched.participantes || []).reduce((sum: number, p: any) => {
                if (p.usuarioId === meId) return sum;
                return sum + (p.parte_importe || 0);
              }, 0);
              enriched.owedAmount = othersShare;
            } else {
              const mePart = (enriched.participantes || []).find((p: any) => p.usuarioId === meId);
              enriched.owedAmount = mePart ? -Math.abs(mePart.parte_importe || 0) : 0;
            }

            allEnriched.push(enriched);
          } catch (e) {
            // Si falla el procesamiento, usar el item de la lista si somos participantes
            const isParticipant = exp.pagador_id === currentUser.id ||
              (exp.participantes || []).some((p: any) => p.usuarioId === currentUser.id);

            if (isParticipant) {
              allEnriched.push({ ...exp, groupId: g.id, groupName: g.nombre });
            }
          }
        }
      }

      setData(allEnriched || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refresh, fromCache };
}

