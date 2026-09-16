// Intersection Observer for active ToC highlighting
document.addEventListener('DOMContentLoaded', () => {
  const tocLinks = document.querySelectorAll('[data-toc-link]');
  const sections = document.querySelectorAll('.chapter, .subsection, #quellenverzeichnis');

  if (!tocLinks.length || !sections.length) return;

  // Track which sections are visible
  const visibleSections = new Set();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        if (entry.isIntersecting) {
          visibleSections.add(id);
        } else {
          visibleSections.delete(id);
        }
      });

      // Find the topmost visible section
      let activeId = null;
      for (const section of sections) {
        if (visibleSections.has(section.id)) {
          activeId = section.id;
          break;
        }
      }

      // Update active states
      tocLinks.forEach((link) => {
        const linkId = link.getAttribute('data-toc-link');
        const isActive = linkId === activeId;

        // Also check if this is a parent chapter of an active subsection
        const isParentActive = activeId &&
          linkId?.startsWith('kapitel-') &&
          document.getElementById(activeId)?.closest(`#${linkId}`);

        if (isActive || isParentActive) {
          link.classList.add('is-active');
        } else {
          link.classList.remove('is-active');
        }
      });
    },
    {
      rootMargin: '-80px 0px -60% 0px',
      threshold: 0,
    }
  );

  sections.forEach((section) => observer.observe(section));
});
