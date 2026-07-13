export function trackById<T extends { id: any }>() {
  return (index: number, item: T) => item.id;
}

export function trackByKey<T>(key: keyof T) {
  return (index: number, item: T) => item[key];
}
