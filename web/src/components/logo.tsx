export function Logo({
  size = 32,
  rounded = 10,
}: {
  size?: number;
  rounded?: number;
}) {
  return (
    <img
      src="/logo.png"
      alt="Cheapo"
      width={size}
      height={size}
      className="object-cover"
      style={{ width: size, height: size, borderRadius: rounded }}
    />
  );
}