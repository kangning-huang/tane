import StudyApp from "@/components/StudyApp";
import { words, kanji, patterns, categories } from "@/lib/data";

export default function Page() {
  return (
    <StudyApp
      words={words}
      kanji={kanji}
      patterns={patterns}
      categories={categories}
    />
  );
}
