// Copyright (c) Nohuto (N.B.)
export function copyText(textToCopy) {
  if (!textToCopy) return Promise.reject(new Error("no text"));

  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(textToCopy);
  }

  const el = document.createElement("textarea");
  el.value = textToCopy;
  el.setAttribute("readonly", "");
  el.className = "hidden";
  document.body.appendChild(el);
  el.select();

  try {
    document.execCommand("copy");
    document.body.removeChild(el);
    return Promise.resolve();
  } catch (err) {
    document.body.removeChild(el);
    return Promise.reject(err);
  }
}
