export function initFolds(): void {
  const open = () => {
    const target = document.getElementById(location.hash.slice(1));
    if (target instanceof HTMLDetailsElement) target.open = true;
  };
  addEventListener('hashchange', open);
  open();
}
