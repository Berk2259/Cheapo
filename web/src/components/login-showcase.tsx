import { SHOWCASE_CARDS, type ShowcaseCard } from "@/components/login-showcase-data";

function Card({ item }: { item: ShowcaseCard }) {
  return (
    <div className="lg-card">
      <div className="lg-top">
        <b>{item.name}</b>
        <span className="lg-cat">{item.category}</span>
      </div>
      <div className="lg-pr">{item.price}</div>
      <span className={`lg-chg ${item.tone}`}>{item.change}</span>
      <div className="lg-row2">
        <span className="lg-av">{item.avatar}</span>
        {item.source}
      </div>
    </div>
  );
}

// Aynı satır iki kez tekrarlanır, böylece kayma tam %50'de kusursuz döngü yapar.
function Lane({ items, className }: { items: ShowcaseCard[]; className: string }) {
  return (
    <div className={`lg-lane ${className}`}>
      {items.map((item, i) => (
        <Card key={`a-${i}`} item={item} />
      ))}
      {items.map((item, i) => (
        <Card key={`b-${i}`} item={item} />
      ))}
    </div>
  );
}

// Bir diziyi n kadar kaydırıp döndürür (satırlar birebir aynı sırada olmasın diye).
function rotate(items: ShowcaseCard[], n: number): ShowcaseCard[] {
  const i = n % items.length;
  return [...items.slice(i), ...items.slice(0, i)];
}

// Giriş ekranının arka planı: çapraz akan, sabit kurgu ürün kartları.
// Herkese açık bir sayfa olduğu için gerçek müşteri/ürün verisi kullanılmaz.
export function LoginShowcase() {
  const rows = [0, 2, 4, 6, 8, 10, 1, 3].map((offset, i) => ({
    items: rotate(SHOWCASE_CARDS, offset),
    className: `lg-l${(i % 2) + 1}`,
    reverse: i % 2 === 1,
  }));

  return (
    <>
      <div className="lg-frame" aria-hidden="true">
        {rows.map((row, i) => (
          <Lane
            key={i}
            items={row.reverse ? [...row.items].reverse() : row.items}
            className={row.className}
          />
        ))}
      </div>
      <div className="lg-veil" />
    </>
  );
}