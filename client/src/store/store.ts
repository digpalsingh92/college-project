import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { api } from "@/store/apiSlice";
import { authReducer, hydrateFromStorage } from "@/store/authSlice";
import { updateContext } from "@/services/assistant/context.service";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

// Hydrate auth state from localStorage SYNCHRONOUSLY at store creation,
// before any React component renders and fires RTK Query requests.
// This prevents the race condition where queries fire with no token on refresh.
store.dispatch(hydrateFromStorage());

setupListeners(store.dispatch);

// If a user was hydrated and has an age, push it into assistant context
try {
  const state = store.getState();
  const user = state.auth.user;
  if (user && user.id && (user as any).age) {
    updateContext(user.id, { entities: { age: (user as any).age } });
  }
} catch {}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
