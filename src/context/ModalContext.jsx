import { createContext, useContext } from 'react';

// Provided by <Layout>; lets a SheetCard anywhere open the shared post modal.
export const ModalContext = createContext({ openPost: () => {} });

export function useModal() {
  return useContext(ModalContext);
}
