export function setCookie(name: string, value: string, days: number) {
  const d = new Date()
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000))
  const expires = "expires=" + d.toUTCString()
  document.cookie = name + "=" + value + ";" + expires + ";path=/"
}
