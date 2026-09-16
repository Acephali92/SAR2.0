// Generate Table of Contents from headings
document.addEventListener('DOMContentLoaded', () => {
  const article = document.querySelector('.prose-argument');
  const tocDesktop = document.getElementById('toc');
  const tocMobile = document.getElementById('toc-mobile');

  if (!article) return;

  const headings = article.querySelectorAll('h2, h3');

  if (headings.length === 0) {
    if (tocDesktop) tocDesktop.innerHTML = '<p class="toc-empty">Keine Abschnitte</p>';
    if (tocMobile) tocMobile.innerHTML = '<p class="toc-empty">Keine Abschnitte</p>';
    return;
  }

  // Create ToC list
  const createTocList = (isMobile = false) => {
    const list = document.createElement('ul');
    list.className = isMobile ? 'toc-mobile-list' : 'toc-list';

    headings.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = `section-${index}`;
      }

      const li = document.createElement('li');
      const a = document.createElement('a');

      a.href = `#${heading.id}`;
      a.textContent = heading.textContent;
      a.setAttribute('data-toc-link', heading.id);

      if (isMobile) {
        a.className = `toc-mobile-link ${heading.tagName === 'H3' ? 'toc-mobile-link-sub' : ''}`;
      } else {
        a.className = `toc-link ${heading.tagName === 'H3' ? 'toc-link-sub' : ''}`;
      }

      li.appendChild(a);
      list.appendChild(li);
    });

    return list;
  };

  if (tocDesktop) {
    tocDesktop.innerHTML = '';
    tocDesktop.appendChild(createTocList(false));
  }

  if (tocMobile) {
    tocMobile.innerHTML = '';
    tocMobile.appendChild(createTocList(true));
  }

  // Intersection Observer for active highlighting (desktop only)
  if (tocDesktop) {
    const tocLinks = tocDesktop.querySelectorAll('[data-toc-link]');
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

        // Find topmost visible section
        let activeId = null;
        for (const heading of headings) {
          if (visibleSections.has(heading.id)) {
            activeId = heading.id;
            break;
          }
        }

        // Update active states
        tocLinks.forEach((link) => {
          const linkId = link.getAttribute('data-toc-link');
          if (linkId === activeId) {
            link.classList.add('is-active');
          } else {
            link.classList.remove('is-active');
          }
        });
      },
      {
        rootMargin: '-100px 0px -60% 0px',
        threshold: 0,
      }
    );

    headings.forEach((heading) => observer.observe(heading));
  }
});
