// Generate Table of Contents from headings
document.addEventListener('DOMContentLoaded', () => {
  const article = document.querySelector('.prose-custom');
  const toc = document.getElementById('toc');

  if (!article || !toc) return;

  const headings = article.querySelectorAll('h2, h3');

  if (headings.length === 0) {
    toc.innerHTML = '<p class="text-content-muted italic">Keine Abschnitte</p>';
    return;
  }

  const list = document.createElement('ul');
  list.className = 'space-y-2';

  headings.forEach((heading, index) => {
    // Add ID to heading if not present
    if (!heading.id) {
      heading.id = `section-${index}`;
    }

    const li = document.createElement('li');
    const a = document.createElement('a');

    a.href = `#${heading.id}`;
    a.textContent = heading.textContent;
    a.className = `block text-content-secondary no-underline hover:text-content-primary transition-colors ${
      heading.tagName === 'H3' ? 'pl-3 text-xs' : ''
    }`;

    li.appendChild(a);
    list.appendChild(li);
  });

  toc.innerHTML = '';
  toc.appendChild(list);
});
