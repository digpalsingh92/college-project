import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { api } from "@/store/apiSlice";
import { authReducer, hydrateFromStorage } from "@/store/authSlice";

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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
