export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const today = () => new Date().toISOString().slice(0, 10);
