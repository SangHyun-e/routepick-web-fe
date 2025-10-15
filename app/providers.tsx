"use client";

import { store } from "@/lib/store";
import { Provider as ReduxProvider } from "react-redux";

interface ChildrenProps {
  children: React.ReactNode;
}

function ClientMiddleware({ children }: ChildrenProps) {
  return <>{children}</>;
}

export default function Providers({ children }: ChildrenProps) {
  return (
    <ReduxProvider store={store}>
      <ClientMiddleware>{children}</ClientMiddleware>
    </ReduxProvider>
  );
}
