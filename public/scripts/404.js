// Copyright (c) nohuto (N.B.)
const ACTIVE_PAGE_KEY = "kf-active-page-path";
const NOT_FOUND_KEY = "kf-not-found-path";

try {
  sessionStorage.setItem(NOT_FOUND_KEY, `${location.pathname}${location.search}${location.hash}`);
  const lastPage = sessionStorage.getItem(ACTIVE_PAGE_KEY);
  const target = lastPage && lastPage.startsWith("/") && lastPage !== location.pathname ? lastPage : "/index.html";
  location.replace(target);
} catch (_) {
}
