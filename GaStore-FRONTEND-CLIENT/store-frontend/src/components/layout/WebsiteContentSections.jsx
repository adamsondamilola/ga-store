export default function WebsiteContentSections({ content = "" }) {
  const lines = String(content || "").split("\n");
  const sections = [];
  let currentSection = { title: "", paragraphs: [] };
  let currentParagraph = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      currentSection.paragraphs.push(currentParagraph.join(" ").trim());
      currentParagraph = [];
    }
  };

  const flushSection = () => {
    flushParagraph();
    if (currentSection.title || currentSection.paragraphs.length > 0) {
      sections.push(currentSection);
    }
    currentSection = { title: "", paragraphs: [] };
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushSection();
      currentSection.title = trimmed.replace(/^##\s*/, "");
      return;
    }

    currentParagraph.push(trimmed);
  });

  flushSection();

  return (
    <div className="space-y-6">
      {sections.map((section, index) => (
        <section key={`${section.title || "section"}-${index}`}>
          {section.title ? (
            <h2 className="text-xl font-semibold text-gray-800 mb-3">{section.title}</h2>
          ) : null}
          <div className="space-y-3">
            {section.paragraphs.map((paragraph, paragraphIndex) => (
              <p key={`${index}-${paragraphIndex}`} className="text-gray-700">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
