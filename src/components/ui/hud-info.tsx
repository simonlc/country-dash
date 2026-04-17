export function HudInfo({ title, value }) {
  return (
    <div className="flex flex-col">
      <div>{title}</div>
      <div>{value}</div>
    </div>
  );
}
