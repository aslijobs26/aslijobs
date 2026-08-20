import type { QueryClient } from "@tanstack/react-query";

import type { OperationsAuthUser } from "../types/operations-auth";

import {

  clearOperationsAuthSession,

  setOperationsAuthSession,

  setOperationsAuthUser,

} from "./operations-auth-storage";



export const OPERATIONS_AUTH_QUERY_KEY = ["operations", "auth", "session"] as const;



export async function establishOperationsClientSession(

  queryClient: QueryClient,

  session: {

    accessToken: string;

    refreshToken: string;

    user: OperationsAuthUser;

  },

) {

  setOperationsAuthSession(session);

  setOperationsAuthUser(session.user);

  queryClient.setQueryData(OPERATIONS_AUTH_QUERY_KEY, { user: session.user });

}



export function clearOperationsClientSession(queryClient: QueryClient) {

  clearOperationsAuthSession();

  queryClient.removeQueries({ queryKey: OPERATIONS_AUTH_QUERY_KEY });

}


