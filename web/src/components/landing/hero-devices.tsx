const messages = [
    {
        cls: "hv-tb-a",
        title: "🔔 Fiyat değişti",
        name: "Gazlı İçecek 1,5 L",
        old: "80,00 TL",
        now: "67,90 TL",
    },
    {
        cls: "hv-tb-b",
        title: "🎯 Hedefe ulaştı!",
        name: "Siyah Çay 1 Kg",
        old: null,
        now: "259,95 TL",
    },
    {
        cls: "hv-tb-c",
        title: "🔔 Fiyat değişti",
        name: "Bluetooth Kulaklık",
        old: "1.499 TL",
        now: "1.199 TL",
    },
];

const chats = [
    { av: "✈", name: "Cheapo", sub: "bot", on: true },
    { av: "A", name: "Ayşe", sub: "Tamamdır", on: false },
    { av: "M", name: "Market grubu", sub: "Süt aldın mı?", on: false },
    { av: "K", name: "Kaan", sub: "görüşürüz", on: false },
];

const cards = [
    {
        name: "Gazlı İçecek 1,5 L",
        note: "Hedef: 60,00 TL",
        price: "67,90 TL",
        drop: "↓ %15",
        flash: true,
    },
    {
        name: "Siyah Çay 1 Kg",
        note: "Hedef: 260,00 TL",
        price: "259,95 TL",
        drop: "↓ %37",
        flash: false,
    },
    {
        name: "Bluetooth Kulaklık",
        note: "Her değişimde bildir",
        price: "1.199 TL",
        drop: "↓ %20",
        flash: false,
    },
];

function ChatBubbles() {
    return (
        <>
            {messages.map((m) => (
                <div key={m.cls} className={`hv-tb ${m.cls}`}>
                    <b>{m.title}</b>
                    {m.name}
                    <br />
                    {m.old && (
                        <>
                            <span className="old">{m.old}</span> →{" "}
                        </>
                    )}
                    <span className="new">{m.now}</span>
                </div>
            ))}
        </>
    );
}

function MacBook() {
    return (
        <div className="hv-mac">
            <div className="hv-mac-lid hv-gloss">
                <div className="hv-mac-notch" />
                <div className="hv-mac-screen">
                    <div className="hv-mac-menu">
                        <span>
                            <b>Telegram</b>
                            <span>Dosya</span>
                            <span>Düzen</span>
                            <span>Görünüm</span>
                        </span>
                        <span>Cum 09:41</span>
                    </div>

                    <div className="hv-tg">
                        <div className="hv-tg-side">
                            <div className="hv-dots">
                                <i />
                                <i />
                                <i />
                            </div>
                            {chats.map((c) => (
                                <div
                                    key={c.name}
                                    className={c.on ? "hv-tg-chat on" : "hv-tg-chat"}
                                >
                                    <div className="av">{c.av}</div>
                                    <div>
                                        {c.name}
                                        <small>{c.sub}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="hv-tg-main">
                            <div className="hv-tg-head">
                                Cheapo<small>bot</small>
                            </div>
                            <div className="hv-tg-body">
                                <ChatBubbles />
                            </div>
                        </div>
                    </div>

                    <div className="hv-dock">
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                    </div>
                </div>
            </div>
            <div className="hv-mac-base" />
        </div>
    );
}

function IPad() {
    return (
        <div className="hv-ipad hv-gloss">
            <div className="hv-ipad-screen">
                <div className="hv-ipad-main">
                    <h4>Takip ettiğim ürünler</h4>
                    <p>Fiyat değiştiğinde Telegram&apos;dan haber alırsınız.</p>
                    {cards.map((c) => (
                        <div
                            key={c.name}
                            className={c.flash ? "hv-card hv-card-flash" : "hv-card"}
                        >
                            <div>
                                <b>{c.name}</b>
                                <small>{c.note}</small>
                            </div>
                            <div className="pr">
                                {c.price}
                                <small>{c.drop}</small>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hv-ipad-banner">
                    <div className="ic">✈</div>
                    <div>
                        <b>Cheapo</b>
                        🔔 Klavye
                        <br />
                        899 → <span className="font-extrabold text-[#16a34a]">749 TL</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function IPhone() {
    return (
        <div className="hv-phone">
            <div className="hv-phone-screen">
                <div className="hv-island" />
                <div className="hv-phone-head">
                    <div className="av">✈</div>
                    Cheapo
                </div>
                <div className="hv-phone-body">
                    <ChatBubbles />
                </div>
                <div className="hv-phone-banner">
                    <div className="ic">✈</div>
                    <div>
                        <b>Cheapo · şimdi</b>
                        🔔 Süt 1 L
                        <br />
                        32,90 → <span className="new">29,50 TL</span>
                    </div>
                </div>
                <div className="hv-home" />
            </div>
        </div>
    );
}

export function HeroDevices() {
    return (
        <div className="hv-lineup" aria-hidden="true">
            <MacBook />
            <IPad />
            <IPhone />
            <div className="hv-floor" />
        </div>
    );
}