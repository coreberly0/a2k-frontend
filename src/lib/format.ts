export const money = (n: number | string | null | undefined) =>
  '₹' + Number(n ?? 0).toLocaleString('en-IN')

export const todayStr = () => new Date().toLocaleDateString('en-CA')

export const orNull = (s: string) => {
  const t = s.trim()
  return t === '' ? null : t
}