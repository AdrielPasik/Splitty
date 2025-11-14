import * as groupsApi from '../api/groups';

export function useUnirseGrupo() {
  const joinByInvite = async (token: string) => {
    return groupsApi.joinByInvite(token);
  };

  const joinGroup = async (grupoId: string) => {
    return groupsApi.joinGroup(grupoId);
  };

  return { joinByInvite, joinGroup };
}
