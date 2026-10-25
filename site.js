const releaseList = document.querySelector('#release-list');
const releaseStatus = document.querySelector('#release-status');
const releaseFallback = document.querySelector('#release-fallback');

const platforms = [
  { label: 'Linux · x64', pattern: /linux-amd64/i },
  { label: 'macOS · ARM64', pattern: /darwin-arm64/i },
  { label: 'Windows · x64', pattern: /windows-amd64/i },
];

function makeLink(label, href, className) {
  const link = document.createElement('a');
  link.className = className;
  link.href = href;
  link.textContent = label;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

function renderRelease(release) {
  const row = document.createElement('article');
  row.className = 'release-row';

  const heading = document.createElement('h3');
  heading.className = 'release-version';
  heading.append(makeLink(release.name || release.tag_name, release.html_url, 'release-title-link'));
  if (release.prerelease) {
    const badge = document.createElement('span');
    badge.className = 'release-badge';
    badge.textContent = 'Pre-release';
    heading.append(badge);
  }

  const date = document.createElement('time');
  date.className = 'release-date';
  date.dateTime = release.published_at || release.created_at;
  date.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(release.published_at || release.created_at),
  );

  const downloads = document.createElement('div');
  downloads.className = 'release-downloads';
  downloads.setAttribute('aria-label', `${release.tag_name} downloads`);

  for (const platform of platforms) {
    const asset = release.assets.find(({ name }) => platform.pattern.test(name));
    if (asset) {
      downloads.append(makeLink(`${platform.label} ↓`, asset.browser_download_url, 'download-link'));
    }
  }

  if (downloads.childElementCount === 0) {
    const pending = document.createElement('span');
    pending.className = 'release-date';
    pending.textContent = 'Builds not attached';
    downloads.append(pending);
  }

  const notes = makeLink('Release notes ↗', release.html_url, 'release-notes-link');
  downloads.append(notes);
  row.append(heading, date, downloads);
  return row;
}

async function loadReleases() {
  try {
    const response = await fetch('https://api.github.com/repos/InvestiGenie/investigenie/releases?per_page=6', {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);

    const releases = (await response.json()).filter(({ draft }) => !draft).slice(0, 5);
    if (releases.length === 0) throw new Error('No published releases');

    releaseList.replaceChildren(...releases.map(renderRelease));
    releaseStatus.textContent = 'Recent builds and release notes from GitHub.';
  } catch {
    releaseStatus.hidden = true;
    releaseFallback.hidden = false;
  }
}

function renderDiagrams() {
  if (!window.mermaid) return;

  window.mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    themeVariables: {
      fontFamily: 'DM Mono, Consolas, monospace',
      fontSize: '12px',
      primaryColor: '#e4f6fa',
      primaryTextColor: '#121a35',
      primaryBorderColor: '#66a9b9',
      lineColor: '#566783',
      secondaryColor: '#e9eef9',
      tertiaryColor: '#f5f7fc',
    },
  });
  window.mermaid.run({ querySelector: '.mermaid' }).catch(() => {});
}

loadReleases();
renderDiagrams();
