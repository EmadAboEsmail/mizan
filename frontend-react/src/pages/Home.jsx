import AppCard from "@/components/AppCard.jsx";
import styles from "./Home.module.scss";

const APPS = [
  {
    id: "zekr",
    name: "ذِكر",
    description: "سبحة إلكترونية بأذكار متنوعة وإحصائيات",
    path: "/zekr",
    icon: "📿",
    available: true,
  },
  {
    id: "bubble-sort",
    name: "ترتيب الفقاعات",
    description: "تصور بصري لخوارزمية Bubble Sort",
    path: "/bubble-sort",
    icon: "🔢",
    available: false,
  },
  {
    id: "selection-sort",
    name: "ترتيب الاختيار",
    description: "تصور بصري لخوارزمية Selection Sort",
    path: "/selection-sort",
    icon: "📊",
    available: false,
  },
];

function Home() {
  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <h1 className={styles.title}>تطبيقاتي</h1>
        <p className={styles.subtitle}>مجموعة أدوات صغيرة</p>
      </header>

      <main className={styles.grid}>
        {APPS.map((app, i) => (
          <AppCard key={app.id} app={app} index={i} />
        ))}
      </main>

      <footer className={styles.footer}>
        <span>صُنع بـ 💛</span>
      </footer>
    </div>
  );
}

export default Home;
