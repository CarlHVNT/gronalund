/* @ds-bundle: {"format":4,"namespace":"ReadySetDesignSystem_e20b21","components":[],"sourceHashes":{"doc-page.js":"371bab66f42d","video/animations.jsx":"ebe6809a6cbe","video/movie.jsx":"2dcde91fc6a0"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ReadySetDesignSystem_e20b21 = window.ReadySetDesignSystem_e20b21 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// doc-page.js
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).
/* BEGIN USAGE */
/**
 * <doc-page> — paged-document shell for printable HTML.
 *
 * FIRST, decide how the document paginates — up front, before building:
 *
 * - FLOWING document (the default): write the whole document as one
 *   normal HTML flow inside <doc-page>; the browser's print engine
 *   splits it onto pages at export. Use for long-form documents with a
 *   single text flow: reports, memos, letters, essays.
 * - EXPLICIT pagination: a fixed set of pre-paginated pages, one
 *   <section class="page"> child per page. Use when the user asks for a
 *   specific page count, or the design implies one: a one-page resume, a
 *   two-sided flier, a poster, a certificate, a brochure — any richly
 *   laid-out document without a single text flow.
 * - If in doubt, ask the user as part of the build.
 *
 * PAGE SIZING — paper differs by country (letter vs A4), so the printed
 * sheet is not one fixed truth:
 * - FLOWING documents pin NO paper size: the print engine paginates
 *   onto the user's real paper, and the content reflows to it.
 * - EXPLICITLY PAGINATED documents print each page at a FIXED page box
 *   with overflow hidden — letter by default, size="a4" for a clearly
 *   metric user, the user's chosen paper when they export. Design each
 *   page to FILL that box, fitting letter and A4 alike without overlap.
 * - width/height pin an explicit fixed size, ONLY when the user gives
 *   one.
 * Never write your own @page rule or hard-code paper dimensions in the
 * content.
 *
 * Sizing modes (attributes):
 *   (none)                      — portrait: flowing docs use the user's
 *           paper; explicitly paginated pages use the named size box
 *           (letter unless size="a4")
 *   orientation="landscape"     — the same, landscape
 *   width / height              — explicit fixed size, ONLY when the user
 *           gives one (e.g. width="22in" height="30in" for a 22×30
 *           poster): the page IS the design's size, printed at true
 *           dimensions (or scaled onto the user's paper at print time).
 *           Any absolute CSS length: px/in/mm/cm/pt/pc.
 * The component announces the chosen mode to the host app at runtime (a
 * meta tag it injects), so the print path can inject the user's true
 * paper size.
 *
 * On screen the document renders on a desk background: a flowing
 * document as one tall scrolling sheet (Google Docs' pageless view);
 * explicitly paginated documents as one card per page.
 *
 * EXPLICIT pagination usage:
 *   <style>doc-page:not(:defined){visibility:hidden}</style>
 *   <doc-page>
 *     <section class="page" id="p1">…one page's design…</section>
 *     <section class="page" id="p2">…</section>
 *   </doc-page>
 *   <script src="doc-page.js"></script>
 * How the page box works, concretely: each .page prints as ONE full-bleed
 * sheet at a FIXED physical size — letter by default (set size="a4" for
 * a clearly metric user), the user's chosen paper when they export —
 * with overflow hidden. Nothing scrolls and nothing reflows onto a next
 * sheet: content that misses the box is CLIPPED. Design each page to
 * FILL that page box, and to fit it — letter and A4 alike — without
 * overlap. Each page is a size container; don't size anything in
 * viewport units (they track the window, not the page), and never set
 * width or height on the .page section itself (the component sizes the
 * page box; an authored height like 100% is meaningless at print and is
 * overridden). The component owns the page box, the screen card chrome,
 * and the page breaks (never add your own break-before/after). Don't mix
 * .page sections with flowing content or header/footer slots in the same
 * document.
 *
 * FLOWING usage:
 *   <style>doc-page:not(:defined){visibility:hidden}</style>
 *   <doc-page margin="0.75in">
 *     <h1>Title</h1>
 *     <p>…body…</p>
 *   </doc-page>
 *   <script src="doc-page.js"></script>
 * There is no manual page-splitting — the browser's print engine
 * paginates at export. Standard break-hygiene rules (`break-inside:
 * avoid` on figures, code blocks, images and table rows; `orphans/
 * widows: 3`) are applied so paragraphs and groups split cleanly. On
 * screen and at print, headings default to `text-wrap: balance` and
 * body text to `text-wrap: pretty`; the defaults have zero specificity,
 * so any text-wrap you declare wins.
 *
 * Other attributes:
 *   size    — letter | a4 | legal (default letter). Flowing documents:
 *           preview proportion only — it does NOT pin their printed
 *           paper (the print dialog's paper governs); leave it alone
 *           there. Explicitly paginated documents: it sets the page box
 *           the cards and the pinned @page share (the export dialog's
 *           choice overrides both at print) — set size="a4" for a
 *           clearly metric user. Scaled-fit: names the sheet the fit is
 *           computed against, same a4-for-metric-users advice.
 *   content-width / content-height — the design's own fixed dimensions
 *           (CSS lengths), for scaling a fixed-size design ONTO the
 *           named sheet: content lays out at exactly this size, and the
 *           component scales it to fit that sheet's printable area
 *           (centered horizontally, top-aligned; the export dialog
 *           re-fits to the user's actual paper choice where available).
 *           Both must be set; they do not change the page box. For pages
 *           WITHOUT running header/footer slots.
 *   margin  — printable inset on every page of a FLOWING document
 *           (default 0.75in); margin="0" makes pages full-bleed.
 *           Explicitly paginated pages are always full-bleed.
 *
 * Running header/footer (flowing documents only): give an element
 * `slot="header"` or `slot="footer"` and it repeats on every printed
 * page via `position: fixed`. To keep body text from sliding under it,
 * the component prints inside a single-cell table whose <thead>/<tfoot>
 * are spacers sized to the header/footer height — browsers repeat
 * thead/tfoot on every page, so each sheet's content starts below the
 * header and ends above the footer. On screen the header/footer render
 * once at the top/bottom of the sheet.
 *
 * At print the component injects `@page { margin: 0 }` (which leaves
 * Chrome no margin box to draw its date/URL/page-count header in) and
 * moves the visual margin onto the sheet's own padding. It also marks
 * the document as owning its print CSS (a
 * `meta[name="omelette-owns-print"]` it injects at runtime), so the
 * PDF export never injects page-geometry CSS of its own on top.
 *
 * Print best practices for the content you author:
 * - Multi-column text: use CSS columns (`column-count` +
 *   `column-gap`), never side-by-side flex/grid columns — only real
 *   CSS columns flow and break across pages. `column-span: all` lets
 *   a heading span the columns; `hyphens: auto` (needs `lang` on
 *   the html element) keeps narrow columns readable.
 * - Page breaks in flowing documents: `break-before: page` on an
 *   element that must start a new page (a chapter, an appendix). Add
 *   your own kept-together blocks (callouts, stat tiles, cards) to a
 *   `break-inside: avoid` rule, and keep each one shorter than a page.
 * - Extend `orphans: 3; widows: 3` to any custom text blocks you add
 *   (p and li are covered by default).
 * - Give long tables a <thead> — browsers repeat it on every printed
 *   page.
 * - No `position: fixed`/`sticky` and no viewport units in content:
 *   fixed elements stamp every printed page (running headers/footers go
 *   in the component's slots) and `100vh` mis-sizes at print.
 *
 * Author content as static HTML so the user can click-to-edit any text
 * directly. Do not set width/padding/background on the document body —
 * the component owns the sheet box.
 */
/* END USAGE */

(() => {
  const PAPER = {
    letter: ['8.5in', '11in'],
    a4: ['210mm', '297mm'],
    legal: ['8.5in', '14in']
  };
  const CSS_LENGTH = /^\d+(\.\d+)?(px|in|mm|cm|pt|pc)$/;
  // Unitless "0" is a valid CSS length and the natural way to write
  // margin="0"; normalise it to 0px so max()/calc() (which reject a bare
  // number) keep working.
  const safeLen = (v, fb) => {
    v = (v || '').trim();
    return v === '0' ? '0px' : CSS_LENGTH.test(v) ? v : fb;
  };
  // WebKit (Safari and every iOS browser shell) never repeats a table's
  // thead/tfoot on printed pages (WebKit bug 17205), so the spacer-borne
  // vertical margins of a FLOWING document reach only the first page
  // there. Engine check, not browser check: vendor is 'Apple Computer,
  // Inc.' exactly for WebKit and 'Google Inc.' for Blink.
  const WK_PRINT = /apple/i.test(navigator.vendor || '');
  // CSS length → px number (CSS absolute units are exact: 1in = 96px).
  // Returns NaN for anything safeLen would reject — callers gate on it.
  const PX_PER = {
    px: 1,
    in: 96,
    mm: 96 / 25.4,
    cm: 96 / 2.54,
    pt: 96 / 72,
    pc: 16
  };
  const toPx = v => {
    const m = /^(\d+(?:\.\d+)?)(px|in|mm|cm|pt|pc)$/.exec((v || '').trim());
    return m ? parseFloat(m[1]) * PX_PER[m[2]] : NaN;
  };
  const stylesheet = `
    :host {
      position: relative;
      display: block;
      /* When the viewport is narrower than the page, grow to wrap the
       * sheet (plus this padding) instead of staying viewport-width, so
       * the desk background and right margin reach the sheet's far edge
       * in the horizontal scroll. */
      min-width: max-content;
      min-height: 100vh;
      background: #f5f5f4;
      padding: 48px 24px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      --doc-page-w: 8.5in;
      --doc-page-h: 11in;
      --doc-page-margin: 0.75in;
      --doc-hdr-h: 0px;
      --doc-ftr-h: 0px;
      --doc-hdr-pad: 0px;
      --doc-ftr-pad: 0px;
    }
    .sheet {
      width: var(--doc-page-w);
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 2px 10px rgba(20, 20, 19, 0.12);
      border-radius: 7px;
      box-sizing: border-box;
      padding: var(--doc-page-margin);
    }
    .frame { width: 100%; border-collapse: collapse; }
    /* Scaled-fit mode (content-width/content-height): the inner .fit box
     * lays the content out at its authored fixed size and scales it onto
     * the printable area; .fit-box reserves the scaled footprint in flow
     * (transforms don't affect layout) and centers it. Without the mode,
     * both divs are unstyled block pass-throughs. */
    /* Explicit pagination: direct .page children are the pages. The sheet
     * becomes a transparent stack and each page carries the card look on
     * screen; at print each page is exactly one full-bleed sheet. The
     * ::slotted defaults are deliberately weak (document CSS wins), so
     * authored page styling can override any of this. */
    .sheet.paginated {
      background: transparent;
      box-shadow: none;
      border-radius: 0;
      padding: 0;
    }
    .paginated ::slotted(.page) {
      position: relative;
      display: block;
      width: 100%;
      aspect-ratio: var(--doc-page-ar);
      container-type: size;
      overflow: hidden;
      box-sizing: border-box;
      background: #fff;
      border-radius: 7px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
      break-inside: avoid;
    }
    .paginated ::slotted(.page:not(:first-child)) { margin-top: 1rem; }
    @media print {
      .sheet.paginated { padding: 0; }
      /* The flowing-document vertical inset lives on the repeating
       * thead/tfoot spacers, not the sheet padding — they must go too,
       * or each full-sheet .page is pushed ~margin down and spills onto
       * a second sheet. Paginated pages are full-bleed by definition
       * (content owns its insets). */
      .sheet.paginated .hdr-space,
      .sheet.paginated .ftr-space { height: 0; }
      .paginated ::slotted(.page) {
        border-radius: 0 !important;
        box-shadow: none !important;
        margin: 0 !important;
        /* Physical page-box sizing, no viewport units: Safari resolves
         * 100vh against the window, not the page box, so a vh-sized card
         * paginates wrong there. --doc-page-w/h are the named size by
         * default and are overridden to the user's chosen paper by the
         * export path, so every card is exactly one sheet either way.
         * Width + height (same source values as @page size) rather than
         * width + aspect-ratio: the ratio is a 6-decimal rounding of the
         * same division, and a few millionths of overflow would spill a
         * blank sheet after every page. The screen-only aspect-ratio
         * (preview proportions) must not leak into print. cqh typography
         * tracks the same box.
         *
         * Every declaration is !important: per CSS Scoping, unimportant
         * shadow ::slotted rules LOSE to the document context, so a page
         * section's authored inline style would silently beat this print
         * geometry. A model-authored height:100% did exactly that — the
         * percentage resolves as auto in the all-auto print ancestry, the
         * base rule's size containment turns auto into ZERO, and
         * overflow:hidden then paints nothing: a blank PDF with perfect
         * page boxes. At print the component's geometry is the design's
         * whole contract, so it must win over any authored sizing. */
        aspect-ratio: auto !important;
        width: var(--doc-page-w) !important;
        height: var(--doc-page-h) !important;
        overflow: hidden !important;
      }
      .paginated ::slotted(.page:not(:first-child)) {
        break-before: page !important;
        margin-top: 0 !important;
      }
    }
    .fit-mode .fit-box {
      width: calc(var(--doc-fit-w) * var(--doc-fit-scale));
      height: calc(var(--doc-fit-h) * var(--doc-fit-scale));
      margin: 0 auto;
      break-inside: avoid;
    }
    .fit-mode .fit {
      width: var(--doc-fit-w);
      height: var(--doc-fit-h);
      transform: scale(var(--doc-fit-scale));
      transform-origin: top left;
    }
    .frame td, .frame th { padding: 0; text-align: left; font-weight: inherit; }
    .hdr-space { height: var(--doc-hdr-h); }
    .ftr-space { height: var(--doc-ftr-h); }
    ::slotted([slot="header"]),
    ::slotted([slot="footer"]) { display: block; box-sizing: border-box; }
    @media print {
      :host { background: none; padding: 0; min-width: 0; min-height: 0; }
      .sheet {
        width: auto; margin: 0; box-shadow: none; border-radius: 0;
        padding: 0 var(--doc-page-margin);
      }
      /* The thead/tfoot spacers repeat on every page, so they carry the
       * vertical page margin (which the sheet's own padding cannot, since
       * that padding is consumed once on the first/last page). The running
       * header/footer are fixed inside that band. */
      /* The 0.35in is breathing room between a running header/footer and
       * the body; without one the spacer is exactly the page margin, so a
       * margin="0" full-bleed document gets truly full-bleed pages. */
      .hdr-space { height: max(var(--doc-page-margin), calc(var(--doc-hdr-h) + var(--doc-hdr-pad))); }
      .ftr-space { height: max(var(--doc-page-margin), calc(var(--doc-ftr-h) + var(--doc-ftr-pad))); }
      /* WebKit flowing documents: @page carries the vertical margin (see
       * _syncPrintPageRule), so the spacers keep only whatever a running
       * header/footer needs BEYOND it — page 1 would otherwise double its
       * top inset. Paginated sheets already zero their spacers above. */
      .sheet.wk-print:not(.paginated) .hdr-space { height: max(0px, calc(max(var(--doc-page-margin), calc(var(--doc-hdr-h) + var(--doc-hdr-pad))) - var(--doc-page-margin))); }
      .sheet.wk-print:not(.paginated) .ftr-space { height: max(0px, calc(max(var(--doc-page-margin), calc(var(--doc-ftr-h) + var(--doc-ftr-pad))) - var(--doc-page-margin))); }
      ::slotted([slot="header"]) {
        position: fixed; top: 0; left: 0; right: 0; margin: 0;
        padding: calc(var(--doc-page-margin) * 0.45) var(--doc-page-margin) 0;
      }
      ::slotted([slot="footer"]) {
        position: fixed; bottom: 0; left: 0; right: 0; margin: 0;
        padding: 0 var(--doc-page-margin) calc(var(--doc-page-margin) * 0.45);
      }
    }
  `;
  class DocPage extends HTMLElement {
    static get observedAttributes() {
      return ['size', 'width', 'height', 'margin', 'orientation', 'content-width', 'content-height'];
    }
    constructor() {
      super();
      this._root = this.attachShadow({
        mode: 'open'
      });
      this._mo = typeof MutationObserver === 'function' ? new MutationObserver(() => this._scheduleMeasure()) : null;
    }

    /** The named paper's [w, h], swapped when orientation="landscape".
     *  Only the named size swaps — explicit width/height are exact values
     *  the author already oriented. */
    _paperSize() {
      const named = PAPER[(this.getAttribute('size') || '').toLowerCase()] || PAPER.letter;
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      return landscape ? [named[1], named[0]] : named;
    }
    get pageWidth() {
      return safeLen(this.getAttribute('width'), this._paperSize()[0]);
    }
    get pageHeight() {
      return safeLen(this.getAttribute('height'), this._paperSize()[1]);
    }
    get pageMargin() {
      return safeLen(this.getAttribute('margin'), '0.75in');
    }

    /** Scaled-fit mode's content box [w, h] as CSS lengths, or null when
     *  the mode is off (either attribute missing/invalid/zero — a partial
     *  declaration falls back to normal flow rather than guessing). */
    _contentFit() {
      const w = safeLen(this.getAttribute('content-width'), null);
      const h = safeLen(this.getAttribute('content-height'), null);
      if (!w || !h) return null;
      const wPx = toPx(w),
        hPx = toPx(h);
      return wPx > 0 && hPx > 0 ? [w, h, wPx, hPx] : null;
    }
    connectedCallback() {
      if (!this._sheet) this._render();
      this._syncSize();
      this._syncPrintPageRule();
      this._ensureTextWrapDefaults();
      this._ensureOwnsPrintMeta();
      this._syncFixedSizeMeta();
      this._syncPrintSizingMeta();
      if (this._mo) this._mo.observe(this, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true
      });
      this._onResize = () => this._scheduleMeasure();
      window.addEventListener('resize', this._onResize);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => this._scheduleMeasure());
      }
      this._scheduleMeasure();
    }
    disconnectedCallback() {
      window.removeEventListener('resize', this._onResize);
      if (this._mo) this._mo.disconnect();
      if (this._raf) {
        cancelAnimationFrame(this._raf);
        this._raf = null;
      }
      // Drop the head rules when the last doc-page leaves, so a deleted
      // document's @page geometry and text-wrap defaults can't apply to
      // whatever replaces it.
      const survivor = document.querySelector('doc-page');
      if (!survivor) {
        ['doc-page-print', 'doc-page-text-wrap', 'doc-page-owns-print', 'doc-page-fixed-size', 'doc-page-print-sizing'].forEach(id => {
          const tag = document.getElementById(id);
          if (tag) tag.remove();
        });
        // A live deck-stage deferred its own print-sizing meta to ours —
        // hand the page-global meta over so the deck isn't left unmarked.
        const deck = document.querySelector('deck-stage');
        if (deck && typeof deck._ensurePrintSizingMeta === 'function') {
          deck._ensurePrintSizingMeta();
        }
      } else {
        // A departed owner hands each page-global meta to whatever
        // doc-page remains (or it's removed).
        if (typeof survivor._syncFixedSizeMeta === 'function') {
          survivor._syncFixedSizeMeta();
        }
        if (typeof survivor._syncPrintSizingMeta === 'function') {
          survivor._syncPrintSizingMeta();
        }
      }
    }
    attributeChangedCallback() {
      if (!this._sheet) return;
      this._syncSize();
      this._syncPrintPageRule();
      this._syncFixedSizeMeta();
      this._syncPrintSizingMeta();
      this._scheduleMeasure();
    }
    _render() {
      this._root.innerHTML = `
        <style>${stylesheet}</style>
        <style id="vars"></style>
        <div class="sheet" data-screen-label="Document">
          <table class="frame" role="presentation">
            <thead><tr><th><div class="hdr-space"><slot name="header"></slot></div></th></tr></thead>
            <tbody><tr><td class="body"><div class="fit-box"><div class="fit"><slot></slot></div></div></td></tr></tbody>
            <tfoot><tr><td><div class="ftr-space"><slot name="footer"></slot></div></td></tr></tfoot>
          </table>
        </div>`;
      this._sheet = this._root.querySelector('.sheet');
      this._vars = this._root.getElementById('vars');
    }

    /** Runtime sizing lives in a shadow <style> :host rule, never on the
     *  light-DOM host element, so serialize-persist can't write it back. */
    _syncSize(hdrH, ftrH) {
      // Scaled-fit mode: content at its authored size, scaled onto the
      // printable area (page minus margins on both axes). The factor is a
      // plain number var so calc(length * number) stays valid; 4 decimals
      // keeps the shadow style stable across re-measures. Upscaling is
      // allowed — print transforms are vector, so text and CSS stay crisp
      // (raster images soften, which the catalog bullet warns about).
      const fit = this._contentFit();
      let fitVars = '';
      if (fit) {
        const marginPx = toPx(this.pageMargin) || 0;
        const availW = toPx(this.pageWidth) - 2 * marginPx;
        const availH = toPx(this.pageHeight) - 2 * marginPx;
        const scale = Math.min(availW / fit[2], availH / fit[3]);
        if (scale > 0 && Number.isFinite(scale)) {
          fitVars = '--doc-fit-w:' + fit[0] + ';' + '--doc-fit-h:' + fit[1] + ';' + '--doc-fit-scale:' + scale.toFixed(4) + ';';
        }
      }
      this._sheet.classList.toggle('fit-mode', !!fitVars);
      // Numeric w/h ratio for the paginated page cards' aspect-ratio —
      // aspect-ratio takes a number, not a length ratio, so compute it
      // here (CSS length division isn't portable). 6 decimals keeps the
      // shadow style stable across re-syncs.
      const arW = toPx(this.pageWidth);
      const arH = toPx(this.pageHeight);
      const ar = arW > 0 && arH > 0 ? (arW / arH).toFixed(6) : '0.772727';
      this._vars.textContent = ':host{' + fitVars + '--doc-page-ar:' + ar + ';' + '--doc-page-w:' + this.pageWidth + ';' + '--doc-page-h:' + this.pageHeight + ';' + '--doc-page-margin:' + this.pageMargin + ';' + '--doc-hdr-h:' + (hdrH || 0) + 'px;' + '--doc-ftr-h:' + (ftrH || 0) + 'px;' + '--doc-hdr-pad:' + (hdrH ? '0.35in' : '0px') + ';' + '--doc-ftr-pad:' + (ftrH ? '0.35in' : '0px') + '}';
    }

    /** @page is a no-op inside shadow DOM, so the rule lives in <head>.
     *  Re-appended on every sync so it stays last in source order — the
     *  @page cascade is source-order per descriptor, so this rule wins
     *  over any other @page rule in the document.
     *
     *  The @page SIZE is pinned where the page box IS part of the design:
     *  explicit-fixed-size mode (width + height authored), scaled-fit
     *  mode (the named sheet the fit targets), and explicit pagination
     *  (the named size the cards share — so card and sheet agree on
     *  every print path, and the export path's chosen paper overrides
     *  BOTH with one later rule). For FLOWING documents no paper size is
     *  emitted at all — the true size comes from the user's preference,
     *  injected by the export path or chosen in the print dialog — so a
     *  flowing document never fights the paper it lands on.
     *  margin: 0 is emitted in every mode: it leaves Chrome no margin box
     *  to draw its date/URL/page-count header in, and the visual margin
     *  lives on the sheet's own padding. */
    _syncPrintPageRule() {
      const id = 'doc-page-print';
      let tag = document.getElementById(id);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = id;
      }
      document.head.appendChild(tag);
      // Three print-geometry regimes:
      // - true-size: the page IS the design — pin its exact size.
      // - scaled-fit (content-width/height): the fit factor is computed
      //   against the NAMED paper's printable area, so that paper must
      //   stay pinned or the scaled content overflows a smaller sheet
      //   (the export path re-fits and re-pins at print time on top).
      // - default modes: no paper size — but landscape still needs the
      //   paper-agnostic 'size: landscape' keyword, because the size
      //   descriptor is what carries orientation; without it a landscape
      //   document prints portrait whenever nothing injects a size.
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      // Explicit pagination pins the page box to the SAME values that
      // size the cards (the named size by default, the export path's
      // chosen paper when its later rule overrides both) — card and
      // sheet agree on every print path, and a mismatched real paper
      // shrinks-to-fit in the dialog instead of clipping a Letter card
      // on A4. Declared before the paginated read below so both derive
      // from one check.
      const paginatedNow = this.querySelector(':scope > .page') !== null;
      const sizeDescriptor = this._trueSizePx() ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : this._contentFit() ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : paginatedNow ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : landscape ? 'size: landscape; ' : '';
      // WebKit never repeats the thead/tfoot spacers that carry a flowing
      // document's vertical page margins (see WK_PRINT above), so pages
      // after the first print edge-to-edge there. Carry the VERTICAL
      // margins on @page for WebKit instead, and the shadow print CSS
      // trims the first-page spacers by the same amount (.sheet.wk-print
      // rules). Horizontal inset stays on the sheet's own padding in
      // every engine. Blink keeps margin: 0 (a nonzero margin there
      // re-opens the box Chrome draws its header furniture in). One cost,
      // learned in testing: Safari's own date/URL headers are a USER
      // dialog setting ("Print headers and footers") that renders in the
      // margin area when room exists — margin: 0 only suppressed it by
      // leaving no room, and no CSS controls it. The export dialog's
      // Safari guide teaches turning the setting off for flowing
      // documents. Explicitly paginated and fixed-size documents keep
      // margin: 0 everywhere: their pages ARE the sheet.
      const wkFlowing = WK_PRINT && !paginatedNow && !this._trueSizePx() && !this._contentFit();
      const marginDescriptor = wkFlowing ? 'margin: ' + this.pageMargin + ' 0; ' : 'margin: 0; ';
      // Shadow-internal marker (never serialized), kept in lockstep with
      // the @page decision above: the print CSS trims the first-page
      // spacers ONLY while @page actually carries the margins — a
      // true-size or scaled-fit sheet keeps margin: 0 and must keep its
      // spacers too. Re-synced here so attribute changes and pagination
      // flips move both together.
      if (this._sheet) this._sheet.classList.toggle('wk-print', wkFlowing);
      tag.textContent = '@page { ' + sizeDescriptor + marginDescriptor + '} ' + '@media print { html, body { margin: 0 !important; padding: 0 !important; background: none !important; height: auto !important; overflow: visible !important; } ' + 'h1,h2,h3,h4,h5,h6 { break-after: avoid; } ' + 'figure,pre,blockquote,img,svg,tr { break-inside: avoid; } ' + 'p,li { orphans: 3; widows: 3; } ' + '* { -webkit-print-color-adjust: exact; print-color-adjust: exact; ' + 'backdrop-filter: none !important; -webkit-backdrop-filter: none !important; } ' + '*, *::before, *::after { animation-delay: -99s !important; animation-duration: .001s !important; ' + 'animation-iteration-count: 1 !important; animation-fill-mode: both !important; ' + 'animation-play-state: running !important; transition-duration: 0s !important; } }';
    }

    /** Typographic defaults for document text: balance headings, avoid
     *  widowed/orphaned words in body copy (browsers without text-wrap
     *  support drop the declarations). Zero-specificity via :where() so
     *  any text-wrap authored on those elements wins; document-level so the
     *  rules reach the slotted (light DOM) content — shadow styles can't.
     *  data-omelette-injected marks the tag for the host editor to strip
     *  at serialize, so it is never written back as authored source. */
    _ensureTextWrapDefaults() {
      if (document.getElementById('doc-page-text-wrap')) return;
      const tag = document.createElement('style');
      tag.id = 'doc-page-text-wrap';
      tag.setAttribute('data-omelette-injected', '');
      tag.textContent = ':where(h1,h2,h3,h4,h5,h6){text-wrap:balance}' + ':where(p,li,blockquote,figcaption){text-wrap:pretty}';
      document.head.appendChild(tag);
    }

    /** Declares that this document owns its print CSS. The instant-PDF
     *  export checks for the meta by NAME PRESENCE alone (content is
     *  ignored) and skips its automatic print-CSS injections, so the
     *  component's @page geometry is never overridden by a heuristic.
     *  data-omelette-injected keeps it out of serialized source. */
    _ensureOwnsPrintMeta() {
      if (document.getElementById('doc-page-owns-print')) return;
      const tag = document.createElement('meta');
      tag.id = 'doc-page-owns-print';
      tag.name = 'omelette-owns-print';
      tag.content = 'true';
      tag.setAttribute('data-omelette-injected', '');
      document.head.appendChild(tag);
    }

    /** This page's valid true-size page box (explicit width AND height)
     *  as [w, h] px ints, or null when the mode is off. */
    _trueSizePx() {
      if (!safeLen(this.getAttribute('width'), null) || !safeLen(this.getAttribute('height'), null)) return null;
      const w = Math.round(toPx(this.pageWidth));
      const h = Math.round(toPx(this.pageHeight));
      return w > 0 && h > 0 ? [w, h] : null;
    }

    /** True-size pages (explicit width AND height) also declare the page
     *  box as the preview size: the in-app preview reads
     *  meta[name="omelette-fixed-size"] (content "W,H" in px ints) and
     *  scales the sheet into view — without it an 18in poster previews at
     *  true size with scrollbars. Never overrides an author-set meta
     *  (only the component's own id is managed). The meta is page-global
     *  while doc-page instances are not, so every sync recomputes the
     *  page-wide owner — the first connected true-size doc-page — and a
     *  non-true-size sibling's sync can never delete the owner's meta.
     *  Removed when no true-size page remains (the owner's disconnect
     *  re-syncs via any survivor) or when an author-set meta exists. */
    _syncFixedSizeMeta() {
      const id = 'doc-page-fixed-size';
      const own = document.getElementById(id);
      const authored = document.querySelector('meta[name="omelette-fixed-size"]:not([data-omelette-injected])');
      // The page-wide owner, not this instance: an upgraded true-size page
      // anywhere in the document keeps the meta alive and sized.
      let box = null;
      for (const el of document.querySelectorAll('doc-page')) {
        box = typeof el._trueSizePx === 'function' ? el._trueSizePx() : null;
        if (box) break;
      }
      if (!box || authored) {
        if (own) own.remove();
        return;
      }
      const tag = own || document.createElement('meta');
      tag.id = id;
      tag.name = 'omelette-fixed-size';
      tag.content = box[0] + ',' + box[1];
      tag.setAttribute('data-omelette-injected', '');
      if (!own) document.head.appendChild(tag);
    }

    /** This page's print-sizing mode: 'fixed' when an explicit width AND
     *  height are authored (the page is the design's own size), else the
     *  default paper in the authored orientation. */
    _printSizingMode() {
      if (this._trueSizePx()) return 'fixed';
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      return landscape ? 'default-landscape' : 'default-portrait';
    }

    /** Announces the print-sizing mode to the host app:
     *  meta[name="omelette-print-sizing"] with content 'default-portrait',
     *  'default-landscape', or 'fixed' (fixed pages also carry the
     *  omelette-fixed-size meta with the page box in px). The export path
     *  probes it to decide what true paper size to inject at print time —
     *  in the default modes the component emits no paper size of its own.
     *  Same page-global ownership rules as the fixed-size meta above:
     *  first connected doc-page owns it, an authored meta is never
     *  overridden, removed when no doc-page remains. */
    _syncPrintSizingMeta() {
      const id = 'doc-page-print-sizing';
      const own = document.getElementById(id);
      const authored = document.querySelector('meta[name="omelette-print-sizing"]:not([data-omelette-injected])');
      // A fixed page wins outright (mirroring the fixed-size loop above,
      // so the two metas can never contradict each other in a mixed
      // multi-page document); otherwise the first page's mode holds.
      let mode = null;
      for (const el of document.querySelectorAll('doc-page')) {
        if (typeof el._printSizingMode !== 'function') continue;
        const m = el._printSizingMode();
        if (m === 'fixed') {
          mode = m;
          break;
        }
        if (mode === null) mode = m;
      }
      if (!mode || authored) {
        if (own) own.remove();
        return;
      }
      // A deck-stage that connected first injected its own meta and
      // defers to any existing one — take it over, or the document ends
      // up with two conflicting injected metas (a doc-page page is the
      // document; the deck re-ensures its meta if every doc-page leaves).
      const deckMeta = document.getElementById('deck-stage-print-sizing');
      if (deckMeta) deckMeta.remove();
      const tag = own || document.createElement('meta');
      tag.id = id;
      tag.name = 'omelette-print-sizing';
      tag.content = mode;
      tag.setAttribute('data-omelette-injected', '');
      if (!own) document.head.appendChild(tag);
    }
    _scheduleMeasure() {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = null;
        this._measure();
      });
    }

    /** Slot heights feed the print spacers (--doc-hdr-h / --doc-ftr-h), so
     *  they re-measure on content mutation, resize, and font load. The
     *  same pass detects explicit pagination (direct .page children) and
     *  toggles the sheet between the flowing-document card and the
     *  page-per-card stack — content edits can add or remove pages at any
     *  time, so this tracks the same mutations the measurement does. */
    _measure() {
      const hdr = this.querySelector(':scope > [slot="header"]');
      const ftr = this.querySelector(':scope > [slot="footer"]');
      const wasPaginated = this._sheet.classList.contains('paginated');
      this._sheet.classList.toggle('paginated', this.querySelector(':scope > .page') !== null);
      // The WebKit @page margin is flowing-only, so a pagination flip
      // must re-emit the rule (content edits can add or remove .page
      // sections at any time).
      if (this._sheet.classList.contains('paginated') !== wasPaginated) {
        this._syncPrintPageRule();
      }
      this._syncSize(hdr ? hdr.offsetHeight : 0, ftr ? ftr.offsetHeight : 0);
    }
  }
  if (!customElements.get('doc-page')) {
    customElements.define('doc-page', DocPage);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "doc-page.js", error: String((e && e.message) || e) }); }

// video/animations.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// animations.jsx
// Reusable animation starter: Stage, Timeline, Sprite, easing helpers.
// Exports (to window): Stage, Sprite, PlaybackBar, TextSprite, ImageSprite, RectSprite,
//   useTime, useTimeline, useSprite, Easing, interpolate, animate, clamp.
//
// Usage (in an HTML file that loads React + Babel):
//
//   <Stage width={1280} height={720} duration={10} background="#f6f4ef">
//     <MyScene />
//   </Stage>
//
// <Stage> auto-scales to the viewport and provides the scrubber, play/pause,
// ←/→ seek, space, and 0-to-reset controls, and persists the playhead.
// Inside <Stage>, any child can call useTime() to read the current
// playhead (seconds). Or wrap content in <Sprite start={1} end={4}>...</Sprite>
// to only render during that window -- children receive a `localTime` and
// `progress` via the useSprite() hook. Use Easing + interpolate()/animate()
// for tweens; TextSprite / ImageSprite / RectSprite have built-in entry/exit.
// Build YOUR scenes by composing Sprites inside a Stage.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

// ── Easing functions (hand-rolled, Popmotion-style) ─────────────────────────
// All easings take t ∈ [0,1] and return eased t ∈ [0,1] (may overshoot for back/elastic).
const Easing = {
  linear: t => t,
  // Quad
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  // Cubic
  easeInCubic: t => t * t * t,
  easeOutCubic: t => --t * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  // Quart
  easeInQuart: t => t * t * t * t,
  easeOutQuart: t => 1 - --t * t * t * t,
  easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
  // Expo
  easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return 0.5 * Math.pow(2, 20 * t - 10);
    return 1 - 0.5 * Math.pow(2, -20 * t + 10);
  },
  // Sine
  easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: t => Math.sin(t * Math.PI / 2),
  easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  // Back (overshoot)
  easeOutBack: t => {
    const c1 = 1.70158,
      c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInBack: t => {
    const c1 = 1.70158,
      c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeInOutBack: t => {
    const c1 = 1.70158,
      c2 = c1 * 1.525;
    return t < 0.5 ? Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  // Elastic
  easeOutElastic: t => {
    const c4 = 2 * Math.PI / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

// ── Core interpolation helpers ──────────────────────────────────────────────

// Clamp a value to [min, max]
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// interpolate([0, 0.5, 1], [0, 100, 50], ease?) -> fn(t)
// Popmotion-style: linearly maps t across input keyframes to output values,
// with optional easing per segment (single fn or array of fns).
function interpolate(input, output, ease = Easing.linear) {
  return t => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        const easeFn = Array.isArray(ease) ? ease[i] || Easing.linear : ease;
        const eased = easeFn(local);
        return output[i] + (output[i + 1] - output[i]) * eased;
      }
    }
    return output[output.length - 1];
  };
}

// animate({from, to, start, end, ease})(t) — simpler single-segment tween.
// Returns `from` before `start`, `to` after `end`.
function animate({
  from = 0,
  to = 1,
  start = 0,
  end = 1,
  ease = Easing.easeInOutCubic
}) {
  return t => {
    if (t <= start) return from;
    if (t >= end) return to;
    const local = (t - start) / (end - start);
    return from + (to - from) * ease(local);
  };
}

// ── Timeline context ────────────────────────────────────────────────────────

const TimelineContext = React.createContext({
  time: 0,
  duration: 10,
  playing: false
});
const useTime = () => React.useContext(TimelineContext).time;
const useTimeline = () => React.useContext(TimelineContext);

// ── Sprite ──────────────────────────────────────────────────────────────────
// Renders children only when the playhead is inside [start, end]. Provides
// a sub-context with `localTime` (seconds since start) and `progress` (0..1).
//
//   <Sprite start={2} end={5}>
//     {({ localTime, progress }) => <Thing x={progress * 100} />}
//   </Sprite>
//
// Or as a plain wrapper — children can call useSprite() themselves.

const SpriteContext = React.createContext({
  localTime: 0,
  progress: 0,
  duration: 0
});
const useSprite = () => React.useContext(SpriteContext);
function Sprite({
  start = 0,
  end = Infinity,
  children,
  keepMounted = false
}) {
  const {
    time
  } = useTimeline();
  const visible = time >= start && time <= end;
  if (!visible && !keepMounted) return null;
  const duration = end - start;
  const localTime = Math.max(0, time - start);
  const progress = duration > 0 && isFinite(duration) ? clamp(localTime / duration, 0, 1) : 0;
  const value = {
    localTime,
    progress,
    duration,
    visible
  };
  return /*#__PURE__*/React.createElement(SpriteContext.Provider, {
    value: value
  }, typeof children === 'function' ? children(value) : children);
}

// ── Sample sprite components ────────────────────────────────────────────────

// TextSprite: fades/slides text in on entry, holds, then fades out on exit.
// Props: text, x, y, size, color, font, entryDur, exitDur, align
function TextSprite({
  text,
  x = 0,
  y = 0,
  size = 48,
  color = '#111',
  font = 'Inter, system-ui, sans-serif',
  weight = 600,
  entryDur = 0.45,
  exitDur = 0.35,
  entryEase = Easing.easeOutBack,
  exitEase = Easing.easeInCubic,
  align = 'left',
  letterSpacing = '-0.01em'
}) {
  const {
    localTime,
    duration
  } = useSprite();
  const exitStart = Math.max(0, duration - exitDur);
  let opacity = 1;
  let ty = 0;
  if (localTime < entryDur) {
    const t = entryEase(clamp(localTime / entryDur, 0, 1));
    opacity = t;
    ty = (1 - t) * 16;
  } else if (localTime > exitStart) {
    const t = exitEase(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    ty = -t * 8;
  }
  const translateX = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(${translateX}, ${ty}px)`,
      opacity,
      fontFamily: font,
      fontSize: size,
      fontWeight: weight,
      color,
      letterSpacing,
      whiteSpace: 'pre',
      lineHeight: 1.1,
      willChange: 'transform, opacity'
    }
  }, text);
}

// ImageSprite: scales + fades in; optional Ken Burns drift during hold.
function ImageSprite({
  src,
  x = 0,
  y = 0,
  width = 400,
  height = 300,
  entryDur = 0.6,
  exitDur = 0.4,
  kenBurns = false,
  kenBurnsScale = 1.08,
  radius = 12,
  fit = 'cover',
  placeholder = null // {label: string} for striped placeholder
}) {
  const {
    localTime,
    duration
  } = useSprite();
  const exitStart = Math.max(0, duration - exitDur);
  let opacity = 1;
  let scale = 1;
  if (localTime < entryDur) {
    const t = Easing.easeOutCubic(clamp(localTime / entryDur, 0, 1));
    opacity = t;
    scale = 0.96 + 0.04 * t;
  } else if (localTime > exitStart) {
    const t = Easing.easeInCubic(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    scale = (kenBurns ? kenBurnsScale : 1) + 0.02 * t;
  } else if (kenBurns) {
    const holdSpan = exitStart - entryDur;
    const holdT = holdSpan > 0 ? (localTime - entryDur) / holdSpan : 0;
    scale = 1 + (kenBurnsScale - 1) * holdT;
  }
  const content = placeholder ? /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'repeating-linear-gradient(135deg, #e9e6df 0 10px, #dcd8cf 10px 20px)',
      color: '#6b6458',
      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      fontSize: 13,
      letterSpacing: '0.04em',
      textTransform: 'uppercase'
    }
  }, placeholder.label || 'image') : /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: fit,
      display: 'block'
    }
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      borderRadius: radius,
      overflow: 'hidden',
      willChange: 'transform, opacity'
    }
  }, content);
}

// RectSprite: simple rectangle that animates position/size/color via props.
// Useful demo primitive — takes a `render` fn for per-frame customization.
function RectSprite({
  x = 0,
  y = 0,
  width = 100,
  height = 100,
  color = '#111',
  radius = 8,
  entryDur = 0.4,
  exitDur = 0.3,
  render // optional: (ctx) => style overrides
}) {
  const spriteCtx = useSprite();
  const {
    localTime,
    duration
  } = spriteCtx;
  const exitStart = Math.max(0, duration - exitDur);
  let opacity = 1;
  let scale = 1;
  if (localTime < entryDur) {
    const t = Easing.easeOutBack(clamp(localTime / entryDur, 0, 1));
    opacity = clamp(localTime / entryDur, 0, 1);
    scale = 0.4 + 0.6 * t;
  } else if (localTime > exitStart) {
    const t = Easing.easeInQuad(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    scale = 1 - 0.15 * t;
  }
  const overrides = render ? render(spriteCtx) : {};
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      background: color,
      borderRadius: radius,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      willChange: 'transform, opacity',
      ...overrides
    }
  });
}
function Stage({
  width = 1280,
  height = 720,
  duration = 10,
  background = '#f6f4ef',
  fps = 60,
  loop = true,
  autoplay = true,
  persistKey = 'animstage',
  children
}) {
  const [time, setTime] = React.useState(() => {
    try {
      const v = parseFloat(localStorage.getItem(persistKey + ':t') || '0');
      return isFinite(v) ? clamp(v, 0, duration) : 0;
    } catch {
      return 0;
    }
  });
  const [playing, setPlaying] = React.useState(autoplay);
  const [hoverTime, setHoverTime] = React.useState(null);
  const [scale, setScale] = React.useState(1);
  const stageRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(null);

  // Persist playhead
  React.useEffect(() => {
    try {
      localStorage.setItem(persistKey + ':t', String(time));
    } catch {}
  }, [time, persistKey]);

  // Auto-scale to fit viewport
  React.useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const barH = 44; // playback bar height
      const s = Math.min(el.clientWidth / width, (el.clientHeight - barH) / height);
      setScale(Math.max(0.05, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [width, height]);

  // Animation loop
  React.useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      return;
    }
    const step = ts => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime(t => {
        let next = t + dt;
        if (next >= duration) {
          if (loop) next = next % duration;else {
            next = duration;
            setPlaying(false);
          }
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [playing, duration, loop]);

  // Keyboard: space = play/pause, ← → = seek
  React.useEffect(() => {
    const onKey = e => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying(p => !p);
      } else if (e.code === 'ArrowLeft') {
        setTime(t => clamp(t - (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.code === 'ArrowRight') {
        setTime(t => clamp(t + (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.key === '0' || e.code === 'Home') {
        setTime(0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duration]);
  const displayTime = hoverTime != null ? hoverTime : time;
  const ctxValue = React.useMemo(() => ({
    time: displayTime,
    duration,
    playing,
    setTime,
    setPlaying
  }), [displayTime, duration, playing]);
  return /*#__PURE__*/React.createElement("div", {
    ref: stageRef,
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: '#0a0a0a',
      fontFamily: 'Inter, system-ui, sans-serif'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: canvasRef,
    style: {
      width,
      height,
      background,
      position: 'relative',
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      flexShrink: 0,
      boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(TimelineContext.Provider, {
    value: ctxValue
  }, children))), /*#__PURE__*/React.createElement(PlaybackBar, {
    time: displayTime,
    actualTime: time,
    duration: duration,
    playing: playing,
    onPlayPause: () => setPlaying(p => !p),
    onReset: () => {
      setTime(0);
    },
    onSeek: t => setTime(t),
    onHover: t => setHoverTime(t)
  }));
}

// ── Playback bar ────────────────────────────────────────────────────────────
// Play/pause, return-to-begin, scrub track, time display.
// Uses fixed-width time fields so layout doesn't thrash.

function PlaybackBar({
  time,
  duration,
  playing,
  onPlayPause,
  onReset,
  onSeek,
  onHover
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const timeFromEvent = React.useCallback(e => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    return x * duration;
  }, [duration]);
  const onTrackMove = e => {
    if (!trackRef.current) return;
    const t = timeFromEvent(e);
    if (dragging) {
      onSeek(t);
    } else {
      onHover(t);
    }
  };
  const onTrackLeave = () => {
    if (!dragging) onHover(null);
  };
  const onTrackDown = e => {
    setDragging(true);
    const t = timeFromEvent(e);
    onSeek(t);
    onHover(null);
  };
  React.useEffect(() => {
    if (!dragging) return;
    const onUp = () => setDragging(false);
    const onMove = e => {
      if (!trackRef.current) return;
      const t = timeFromEvent(e);
      onSeek(t);
    };
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, [dragging, timeFromEvent, onSeek]);
  const pct = duration > 0 ? time / duration * 100 : 0;
  const fmt = t => {
    const total = Math.max(0, t);
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    const cs = Math.floor(total * 100 % 100);
    return `${String(m).padStart(1, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };
  const mono = 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 16px',
      background: 'rgba(20,20,20,0.92)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',
      borderRadius: 8,
      color: '#f6f4ef',
      fontFamily: 'Inter, system-ui, sans-serif',
      userSelect: 'none',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    onClick: onReset,
    title: "Return to start (0)"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 2v10M12 2L5 7l7 5V2z",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }))), /*#__PURE__*/React.createElement(IconButton, {
    onClick: onPlayPause,
    title: "Play/pause (space)"
  }, playing ? /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "2",
    width: "3",
    height: "10",
    fill: "currentColor"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "8",
    y: "2",
    width: "3",
    height: "10",
    fill: "currentColor"
  })) : /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 2l9 5-9 5V2z",
    fill: "currentColor"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: mono,
      fontSize: 12,
      fontVariantNumeric: 'tabular-nums',
      width: 64,
      textAlign: 'right',
      color: '#f6f4ef'
    }
  }, fmt(time)), /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    onMouseMove: onTrackMove,
    onMouseLeave: onTrackLeave,
    onMouseDown: onTrackDown,
    style: {
      flex: 1,
      height: 22,
      position: 'relative',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 4,
      background: 'rgba(255,255,255,0.12)',
      borderRadius: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      width: `${pct}%`,
      height: 4,
      background: 'oklch(72% 0.12 250)',
      borderRadius: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: `${pct}%`,
      top: '50%',
      width: 12,
      height: 12,
      marginLeft: -6,
      marginTop: -6,
      background: '#fff',
      borderRadius: 6,
      boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: mono,
      fontSize: 12,
      fontVariantNumeric: 'tabular-nums',
      width: 64,
      textAlign: 'left',
      color: 'rgba(246,244,239,0.55)'
    }
  }, fmt(duration)));
}
function IconButton({
  children,
  onClick,
  title
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    title: title,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: 28,
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 6,
      color: '#f6f4ef',
      cursor: 'pointer',
      padding: 0,
      transition: 'background 120ms'
    }
  }, children);
}
Object.assign(window, {
  Easing,
  interpolate,
  animate,
  clamp,
  TimelineContext,
  useTime,
  useTimeline,
  Sprite,
  SpriteContext,
  useSprite,
  TextSprite,
  ImageSprite,
  RectSprite,
  Stage,
  PlaybackBar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "video/animations.jsx", error: String((e && e.message) || e) }); }

// video/movie.jsx
try { (() => {
// movie.jsx — Silverstone Lap of Lights case-study video
// Scenes composed from window.{Stage,Sprite,useTime,useTimeline,Easing,interpolate,animate,clamp}
// Exports SilverstoneMovie + AudioTrack to window.

const NIGHT = '#14102E';
const NIGHT2 = '#241A52';
const TEAL = '#4FB4C6';
const TEAL_DEEP = '#2C8294';
const PINK = '#F2469A';
const BLUE = '#3B6BF0';
const INK = '#122A31';
const INK_SOFT = '#46606A';
const CREAM = '#FBFEFE';
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const R = typeof window !== 'undefined' && window.__resources || {};
const IMG = {
  hero: R.hero || 'https://playreadyset.com/assets/silverstone-hero-DkRTkNps.jpg',
  map: R.map || 'https://playreadyset.com/assets/festive-map-BjeJF7q1.png',
  avatar: R.avatar || 'https://playreadyset.com/assets/screen-avatar-B7obikbg.png',
  completed: R.completed || 'https://playreadyset.com/assets/screen-completed-C2CQfE8s.png',
  atmo: R.atmo || 'https://playreadyset.com/assets/silverstone-atmosphere-BqqMR29o.jpg',
  alex: R.alex || 'https://playreadyset.com/assets/alex-ashworth-BeuiSB1O.png'
};

// ── Audio sync ───────────────────────────────────────────────────────────────
function AudioTrack({
  src,
  volume = 0.85
}) {
  const {
    time,
    playing,
    duration
  } = window.useTimeline();
  const ref = React.useRef(null);
  const playingRef = React.useRef(playing);
  playingRef.current = playing;
  React.useEffect(() => {
    if (ref.current) ref.current.volume = volume;
  }, [volume]);
  React.useEffect(() => {
    const a = ref.current;
    if (!a) return;
    if (playing) {
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  }, [playing]);

  // Autoplay policy: browsers block audio until a user gesture. Unlock on ANY
  // interaction (button, scrubber, key, tap) — not just play/pause toggles.
  React.useEffect(() => {
    const tryPlay = () => {
      const a = ref.current;
      if (!a) return;
      if (playingRef.current && a.paused) a.play().catch(() => {});
    };
    const evts = ['pointerdown', 'mousedown', 'click', 'keydown', 'touchstart'];
    evts.forEach(e => window.addEventListener(e, tryPlay, {
      passive: true
    }));
    return () => evts.forEach(e => window.removeEventListener(e, tryPlay));
  }, []);
  React.useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const len = a.duration && isFinite(a.duration) ? a.duration : duration || 60;
    const target = time % len;
    if (Math.abs(a.currentTime - target) > 0.28) {
      try {
        a.currentTime = target;
      } catch (e) {}
    }
  }, [time, duration]);
  return React.createElement('audio', {
    ref,
    src,
    preload: 'auto'
  });
}

// ── Brand mark (pinwheel) ──────────────────────────────────────────────────────
function BrandMark({
  size = 100,
  circle = TEAL,
  figure = '#fff',
  spin = 0
}) {
  const t = window.useTime();
  const rot = spin ? t * spin % 360 : 0;
  const uid = React.useMemo(() => 'm' + Math.random().toString(36).slice(2, 7), []);
  const P = "M 8.309 0.086 C 7.844 -0.1 7.494 0.012 7.195 0.448 C 6.884 0.901 5.732 3.648 5.353 4.512 C 5.246 4.759 5.138 5.012 4.973 5.23 C 4.778 5.486 4.579 5.606 4.383 5.613 C 4.188 5.606 3.989 5.486 3.793 5.23 C 3.628 5.011 3.521 4.759 3.413 4.512 C 3.033 3.648 1.881 0.901 1.57 0.448 C 1.271 0.012 0.923 -0.1 0.456 0.086 C 0.181 0.196 -0.008 0.518 0 0.837 C 0.01 1.198 0.116 1.536 0.251 1.862 C 1.009 3.718 1.773 5.571 2.544 7.422 C 2.798 8.03 3.037 8.645 3.317 9.243 C 3.503 9.64 3.743 9.997 4.12 10.236 C 4.202 10.275 4.292 10.293 4.382 10.29 C 4.472 10.293 4.562 10.275 4.644 10.236 C 5.021 9.997 5.261 9.64 5.447 9.243 C 5.727 8.645 5.966 8.03 6.22 7.422 C 6.995 5.572 7.76 3.719 8.515 1.862 C 8.649 1.536 8.755 1.198 8.764 0.837 C 8.773 0.518 8.584 0.196 8.309 0.086 Z";
  const blade = deg => React.createElement('use', {
    key: deg,
    href: `#${uid}`,
    transform: `rotate(${deg} 50 50) translate(50 50) rotate(28) scale(3.5) translate(-4.382 -10.29)`
  });
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 100 100',
    fill: 'none',
    style: {
      transform: `rotate(${rot}deg)`,
      display: 'block'
    }
  }, React.createElement('defs', null, React.createElement('g', {
    id: uid,
    fill: figure
  }, React.createElement('path', {
    d: P
  }), React.createElement('circle', {
    cx: 4.37,
    cy: 2.31,
    r: 1.169
  }))), React.createElement('circle', {
    cx: 50,
    cy: 50,
    r: 50,
    fill: circle
  }), [0, 90, 180, 270].map(blade));
}

// ── Drifting light trails (long-exposure motif) ────────────────────────────────
function LightTrails({
  opacity = 1
}) {
  const t = window.useTime();
  const bars = [{
    y: 140,
    c: PINK,
    w: 520,
    dur: 7,
    delay: 0,
    h: 5
  }, {
    y: 300,
    c: BLUE,
    w: 680,
    dur: 9,
    delay: 2,
    h: 4
  }, {
    y: 520,
    c: TEAL,
    w: 460,
    dur: 6,
    delay: 1,
    h: 6
  }, {
    y: 700,
    c: PINK,
    w: 600,
    dur: 8,
    delay: 3,
    h: 4
  }, {
    y: 880,
    c: BLUE,
    w: 540,
    dur: 7.5,
    delay: 0.5,
    h: 5
  }, {
    y: 980,
    c: TEAL,
    w: 420,
    dur: 6.5,
    delay: 2.5,
    h: 4
  }];
  return React.createElement('div', {
    style: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      opacity,
      pointerEvents: 'none'
    }
  }, bars.map((b, i) => {
    const p = (t + b.delay) % b.dur / b.dur;
    const x = -b.w + p * (1920 + b.w * 2);
    const fade = Math.sin(p * Math.PI);
    return React.createElement('div', {
      key: i,
      style: {
        position: 'absolute',
        left: x,
        top: b.y,
        width: b.w,
        height: b.h,
        borderRadius: 99,
        transform: 'rotate(-8deg)',
        background: `linear-gradient(90deg, transparent, ${b.c}, transparent)`,
        opacity: 0.55 * fade,
        filter: 'blur(0.5px)',
        boxShadow: `0 0 24px ${b.c}`
      }
    });
  }));
}

// ── Full-stage background ───────────────────────────────────────────────────────
function SceneBG({
  children,
  background
}) {
  return React.createElement('div', {
    style: {
      position: 'absolute',
      inset: 0,
      background,
      overflow: 'hidden'
    }
  }, children);
}

// ── Kicker pill ─────────────────────────────────────────────────────────────────
function Kicker({
  children,
  color = TEAL,
  dark = false
}) {
  return React.createElement('div', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: FONT,
      fontSize: 19,
      fontWeight: 700,
      letterSpacing: '.22em',
      textTransform: 'uppercase',
      color
    }
  }, React.createElement('span', {
    style: {
      width: 9,
      height: 9,
      borderRadius: 99,
      background: color
    }
  }), children);
}

// ── Phone frame ───────────────────────────────────────────────────────────────
function Phone({
  src,
  w = 300,
  accent = TEAL
}) {
  const h = w * 2.06;
  return React.createElement('div', {
    style: {
      width: w,
      height: h,
      borderRadius: w * 0.13,
      background: '#0b0a16',
      padding: w * 0.028,
      boxShadow: `0 30px 70px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.06)`,
      position: 'relative'
    }
  }, React.createElement('div', {
    style: {
      position: 'absolute',
      top: w * 0.06,
      left: '50%',
      transform: 'translateX(-50%)',
      width: w * 0.34,
      height: w * 0.045,
      borderRadius: 99,
      background: '#000',
      zIndex: 2
    }
  }), React.createElement('div', {
    style: {
      width: '100%',
      height: '100%',
      borderRadius: w * 0.105,
      overflow: 'hidden',
      background: NIGHT
    }
  }, React.createElement('img', {
    src,
    alt: '',
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  })));
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 1 — Cold open (0–7)
// ════════════════════════════════════════════════════════════════════════════
function SceneOpen() {
  const {
    progress,
    localTime
  } = window.useSprite();
  const markScale = window.animate({
    from: 0.2,
    to: 1,
    start: 0.2,
    end: 1.4,
    ease: window.Easing.easeOutBack
  })(localTime);
  const markOpac = window.clamp(localTime / 0.5, 0, 1);
  return React.createElement(SceneBG, {
    background: `radial-gradient(120% 120% at 50% 35%, ${NIGHT2} 0%, ${NIGHT} 60%, #0c0920 100%)`
  }, React.createElement(LightTrails, {
    opacity: 0.9
  }), React.createElement('div', {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0
    }
  }, React.createElement('div', {
    style: {
      opacity: markOpac,
      transform: `scale(${markScale})`,
      marginBottom: 34
    }
  }, React.createElement(BrandMark, {
    size: 150,
    spin: 26
  })), React.createElement(window.Sprite, {
    start: 1.0,
    end: 7
  }, React.createElement(window.TextSprite, {
    text: 'ReadySet',
    x: 960,
    y: 588,
    align: 'center',
    size: 86,
    weight: 800,
    color: '#fff',
    font: FONT,
    letterSpacing: '-.03em'
  })), React.createElement(window.Sprite, {
    start: 1.9,
    end: 7
  }, React.createElement(window.TextSprite, {
    text: 'The world is your playground.',
    x: 960,
    y: 700,
    align: 'center',
    size: 30,
    weight: 500,
    color: 'rgba(255,255,255,.7)',
    font: FONT,
    letterSpacing: '.01em'
  }))));
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 2 — Establish (7–18)
// ════════════════════════════════════════════════════════════════════════════
function StatBlock({
  value,
  suffix = '',
  label,
  color = '#fff',
  progress
}) {
  const n = Math.round(value * window.Easing.easeOutCubic(progress));
  const display = n.toLocaleString('en-US');
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, React.createElement('div', {
    style: {
      fontFamily: FONT,
      fontSize: 76,
      fontWeight: 800,
      color,
      letterSpacing: '-.03em',
      lineHeight: 1
    }
  }, display + suffix), React.createElement('div', {
    style: {
      fontFamily: FONT,
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: '.16em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,.66)'
    }
  }, label));
}
function SceneEstablish() {
  const {
    localTime,
    duration
  } = window.useSprite();
  const kb = 1.16 - 0.16 * window.Easing.easeInOutSine(window.clamp(localTime / duration, 0, 1));
  const enter = window.clamp(localTime / 0.7, 0, 1);
  const exit = window.clamp((duration - localTime) / 0.5, 0, 1);
  return React.createElement('div', {
    style: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      background: NIGHT
    }
  }, React.createElement('img', {
    src: IMG.hero,
    alt: '',
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transform: `scale(${kb})`,
      opacity: enter * exit
    }
  }), React.createElement('div', {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(12,9,30,.55) 0%, rgba(12,9,30,.05) 32%, rgba(12,9,30,.45) 66%, rgba(12,9,30,.92) 100%)'
    }
  }), React.createElement('div', {
    style: {
      position: 'absolute',
      left: 110,
      top: 96
    }
  }, React.createElement(window.Sprite, {
    start: 7.6,
    end: 18
  }, React.createElement(window.TextSprite, {
    text: 'Case Study · Branded Activation',
    x: 0,
    y: 0,
    size: 19,
    weight: 700,
    color: TEAL,
    font: FONT,
    letterSpacing: '.22em'
  }))), React.createElement('div', {
    style: {
      position: 'absolute',
      left: 110,
      right: 110,
      top: 560
    }
  }, React.createElement(window.Sprite, {
    start: 8.0,
    end: 18
  }, React.createElement(window.TextSprite, {
    text: "Silverstone's Lap of Lights,",
    x: 0,
    y: 0,
    size: 86,
    weight: 800,
    color: '#fff',
    font: FONT,
    letterSpacing: '-.03em'
  })), React.createElement(window.Sprite, {
    start: 8.25,
    end: 18
  }, React.createElement(window.TextSprite, {
    text: 'made fully playable.',
    x: 0,
    y: 100,
    size: 86,
    weight: 800,
    color: TEAL,
    font: FONT,
    letterSpacing: '-.03em'
  }))), React.createElement('div', {
    style: {
      position: 'absolute',
      left: 110,
      bottom: 88,
      display: 'flex',
      gap: 110
    }
  }, React.createElement(window.Sprite, {
    start: 12.4,
    end: 18
  }, ({
    progress
  }) => React.createElement(StatBlock, {
    value: 21,
    suffix: '',
    label: 'Nights Live',
    color: '#fff',
    progress
  })), React.createElement(window.Sprite, {
    start: 12.9,
    end: 18
  }, ({
    progress
  }) => React.createElement(StatBlock, {
    value: 10000,
    suffix: '+',
    label: 'Visitors Played',
    color: '#fff',
    progress
  })), React.createElement(window.Sprite, {
    start: 13.4,
    end: 18
  }, ({
    progress
  }) => React.createElement(StatBlock, {
    value: 6,
    suffix: '',
    label: 'Weeks To Build',
    color: '#fff',
    progress
  }))));
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 3 — The Challenge (18–29)
// ════════════════════════════════════════════════════════════════════════════
function ChallengeRow({
  head,
  body,
  idx
}) {
  const start = 19.4 + idx * 0.6;
  return React.createElement(window.Sprite, {
    start,
    end: 29
  }, ({
    localTime
  }) => {
    const e = window.Easing.easeOutCubic(window.clamp(localTime / 0.5, 0, 1));
    return React.createElement('div', {
      style: {
        display: 'flex',
        gap: 22,
        alignItems: 'flex-start',
        opacity: e,
        transform: `translateX(${(1 - e) * 40}px)`,
        paddingBottom: 26,
        borderBottom: `1px solid ${'rgba(18,42,49,.10)'}`,
        marginBottom: 26
      }
    }, React.createElement('div', {
      style: {
        width: 16,
        height: 16,
        borderRadius: 5,
        background: TEAL,
        marginTop: 8,
        flexShrink: 0
      }
    }), React.createElement('div', null, React.createElement('div', {
      style: {
        fontFamily: FONT,
        fontSize: 30,
        fontWeight: 800,
        color: INK,
        letterSpacing: '-.02em',
        marginBottom: 6
      }
    }, head), React.createElement('div', {
      style: {
        fontFamily: FONT,
        fontSize: 21,
        fontWeight: 500,
        color: INK_SOFT,
        lineHeight: 1.45,
        maxWidth: 760
      }
    }, body)));
  });
}
function SceneChallenge() {
  const {
    localTime,
    duration
  } = window.useSprite();
  const exit = window.clamp((duration - localTime) / 0.5, 0, 1);
  return React.createElement(SceneBG, {
    background: '#F4FAFB'
  }, React.createElement('div', {
    style: {
      position: 'absolute',
      inset: 0,
      opacity: exit,
      padding: '110px 130px'
    }
  }, React.createElement('div', {
    style: {
      marginBottom: 18
    }
  }, React.createElement(window.Sprite, {
    start: 18.2,
    end: 29
  }, React.createElement(window.TextSprite, {
    text: 'The Challenge',
    x: 0,
    y: 0,
    size: 19,
    weight: 700,
    color: TEAL_DEEP,
    font: FONT,
    letterSpacing: '.22em'
  }))), React.createElement('div', {
    style: {
      marginBottom: 60,
      maxWidth: 1100
    }
  }, React.createElement(window.Sprite, {
    start: 18.45,
    end: 29
  }, React.createElement(window.TextSprite, {
    text: 'A historic circuit, and a brand to bring alive.',
    x: 0,
    y: 0,
    size: 58,
    weight: 800,
    color: INK,
    font: FONT,
    letterSpacing: '-.025em'
  }))), React.createElement('div', {
    style: {
      marginTop: 130
    }
  }, React.createElement(ChallengeRow, {
    idx: 0,
    head: 'Turn passengers into players',
    body: 'Give every car something to actively play — not just watch — from the moment they roll onto the circuit.'
  }), React.createElement(ChallengeRow, {
    idx: 1,
    head: 'Keep the immersion intact',
    body: 'Anything generic on-screen would shatter the world. The atmosphere had to hold, night after night.'
  }), React.createElement(ChallengeRow, {
    idx: 2,
    head: 'Brand it end-to-end',
    body: 'Custom identity on every surface across a 21-night run — without a multi-month standalone app build.'
  }))));
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 4 — The Experience (29–44)
// ════════════════════════════════════════════════════════════════════════════
function PingDot({
  x,
  y,
  color,
  delay
}) {
  const t = window.useTime();
  const lt = (t - delay) % 2.4;
  const p = window.clamp(lt / 1.1, 0, 1);
  if (lt < 0) return null;
  return React.createElement('div', {
    style: {
      position: 'absolute',
      left: x,
      top: y
    }
  }, React.createElement('div', {
    style: {
      position: 'absolute',
      width: 14,
      height: 14,
      borderRadius: 99,
      background: color,
      transform: 'translate(-50%,-50%)',
      boxShadow: `0 0 14px ${color}`
    }
  }), React.createElement('div', {
    style: {
      position: 'absolute',
      width: 14 + p * 56,
      height: 14 + p * 56,
      borderRadius: 99,
      border: `2px solid ${color}`,
      transform: 'translate(-50%,-50%)',
      opacity: 1 - p
    }
  }));
}
function ScenePhones() {
  const {
    localTime,
    duration
  } = window.useSprite();
  const exit = window.clamp((duration - localTime) / 0.5, 0, 1);
  const phoneIn = delay => {
    const e = window.Easing.easeOutCubic(window.clamp((localTime - delay) / 0.7, 0, 1));
    return e;
  };
  return React.createElement(SceneBG, {
    background: `radial-gradient(130% 110% at 70% 20%, ${NIGHT2} 0%, ${NIGHT} 55%, #0c0920 100%)`
  }, React.createElement(LightTrails, {
    opacity: 0.4
  }), React.createElement('div', {
    style: {
      position: 'absolute',
      inset: 0,
      opacity: exit
    }
  },
  // header text
  React.createElement('div', {
    style: {
      position: 'absolute',
      left: 110,
      top: 92
    }
  }, React.createElement(window.Sprite, {
    start: 29.2,
    end: 44
  }, React.createElement(window.TextSprite, {
    text: 'The Experience',
    x: 0,
    y: 0,
    size: 19,
    weight: 700,
    color: TEAL,
    font: FONT,
    letterSpacing: '.22em'
  })), React.createElement(window.Sprite, {
    start: 29.45,
    end: 44
  }, React.createElement(window.TextSprite, {
    text: 'One event code, and the circuit',
    x: 0,
    y: 40,
    size: 50,
    weight: 800,
    color: '#fff',
    font: FONT,
    letterSpacing: '-.025em'
  })), React.createElement(window.Sprite, {
    start: 29.6,
    end: 44
  }, React.createElement(window.TextSprite, {
    text: 'became a treasure hunt.',
    x: 0,
    y: 100,
    size: 50,
    weight: 800,
    color: TEAL,
    font: FONT,
    letterSpacing: '-.025em'
  }))),
  // map card (landscape) behind, left
  (() => {
    const e = phoneIn(30.2);
    return React.createElement('div', {
      style: {
        position: 'absolute',
        left: 90,
        top: 360,
        width: 720,
        height: 470,
        borderRadius: 22,
        overflow: 'hidden',
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px) rotate(-3deg)`,
        boxShadow: '0 40px 90px rgba(0,0,0,.5)',
        border: '1px solid rgba(255,255,255,.08)'
      }
    }, React.createElement('img', {
      src: IMG.map,
      alt: '',
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block'
      }
    }), React.createElement(PingDot, {
      x: 230,
      y: 150,
      color: PINK,
      delay: 31
    }), React.createElement(PingDot, {
      x: 470,
      y: 250,
      color: TEAL,
      delay: 31.8
    }), React.createElement(PingDot, {
      x: 340,
      y: 340,
      color: BLUE,
      delay: 32.5
    }), React.createElement('div', {
      style: {
        position: 'absolute',
        left: 22,
        bottom: 18,
        fontFamily: FONT,
        fontSize: 17,
        fontWeight: 700,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        color: '#fff',
        textShadow: '0 1px 8px rgba(0,0,0,.6)'
      }
    }, 'The board · 13 checkpoints'));
  })(),
  // phones, right
  (() => {
    const e = phoneIn(31.0);
    return React.createElement('div', {
      style: {
        position: 'absolute',
        left: 880,
        top: 300,
        opacity: e,
        transform: `translateY(${(1 - e) * 70}px) rotate(4deg)`
      }
    }, React.createElement(Phone, {
      src: IMG.completed,
      w: 300
    }));
  })(), (() => {
    const e = phoneIn(30.5);
    return React.createElement('div', {
      style: {
        position: 'absolute',
        left: 1180,
        top: 250,
        opacity: e,
        transform: `translateY(${(1 - e) * 80}px) rotate(-2deg)`,
        zIndex: 3
      }
    }, React.createElement(Phone, {
      src: IMG.avatar,
      w: 340
    }));
  })(),
  // caption chips
  React.createElement('div', {
    style: {
      position: 'absolute',
      left: 110,
      bottom: 90,
      display: 'flex',
      gap: 14
    }
  }, ['Branded end-to-end', 'In, in seconds', 'Track becomes the board'].map((c, i) => React.createElement(window.Sprite, {
    key: i,
    start: 33.6 + i * 0.4,
    end: 44
  }, ({
    localTime
  }) => {
    const ee = window.clamp(localTime / 0.4, 0, 1);
    return React.createElement('div', {
      style: {
        fontFamily: FONT,
        fontSize: 19,
        fontWeight: 700,
        color: '#fff',
        opacity: ee,
        transform: `translateY(${(1 - ee) * 14}px)`,
        padding: '12px 22px',
        borderRadius: 99,
        border: '1px solid rgba(255,255,255,.18)',
        background: 'rgba(255,255,255,.06)',
        backdropFilter: 'blur(6px)'
      }
    }, c);
  })))));
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 5 — Outcomes + Quote (44–54)
// ════════════════════════════════════════════════════════════════════════════
function SceneQuote() {
  const {
    localTime,
    duration
  } = window.useSprite();
  const kb = 1.0 + 0.12 * window.Easing.easeInOutSine(window.clamp(localTime / duration, 0, 1));
  const enter = window.clamp(localTime / 0.6, 0, 1);
  const exit = window.clamp((duration - localTime) / 0.5, 0, 1);
  return React.createElement('div', {
    style: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      background: NIGHT
    }
  }, React.createElement('img', {
    src: IMG.atmo,
    alt: '',
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transform: `scale(${kb})`,
      opacity: enter * exit
    }
  }), React.createElement('div', {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(90deg, rgba(12,9,30,.92) 0%, rgba(12,9,30,.72) 40%, rgba(12,9,30,.25) 100%)'
    }
  }), React.createElement('div', {
    style: {
      position: 'absolute',
      left: 120,
      top: 230,
      right: 760
    }
  }, React.createElement(window.Sprite, {
    start: 44.4,
    end: 54
  }, ({
    localTime: lt
  }) => {
    const e = window.Easing.easeOutCubic(window.clamp(lt / 0.6, 0, 1));
    return React.createElement('div', {
      style: {
        opacity: e,
        transform: `translateY(${(1 - e) * 22}px)`
      }
    }, React.createElement('div', {
      style: {
        fontFamily: FONT,
        fontSize: 120,
        fontWeight: 800,
        color: TEAL,
        lineHeight: .5,
        marginBottom: 14
      }
    }, '\u201C'), React.createElement('div', {
      style: {
        fontFamily: FONT,
        fontSize: 46,
        fontWeight: 700,
        color: '#fff',
        lineHeight: 1.3,
        letterSpacing: '-.02em'
      }
    }, 'ReadySet transformed Lap of Lights into an interactive adventure with strong engagement, high completion rates, and excellent guest feedback.'));
  }), React.createElement(window.Sprite, {
    start: 45.6,
    end: 54
  }, ({
    localTime: lt
  }) => {
    const e = window.clamp(lt / 0.5, 0, 1);
    return React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginTop: 40,
        opacity: e
      }
    }, React.createElement('img', {
      src: IMG.alex,
      alt: '',
      style: {
        width: 64,
        height: 64,
        borderRadius: 99,
        objectFit: 'cover',
        border: `2px solid ${TEAL}`
      }
    }), React.createElement('div', null, React.createElement('div', {
      style: {
        fontFamily: FONT,
        fontSize: 24,
        fontWeight: 700,
        color: '#fff'
      }
    }, 'Alex Ashworth'), React.createElement('div', {
      style: {
        fontFamily: FONT,
        fontSize: 19,
        fontWeight: 500,
        color: 'rgba(255,255,255,.65)'
      }
    }, 'Senior Creative Producer · ADI.TV')));
  })));
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 6 — CTA (54–60)
// ════════════════════════════════════════════════════════════════════════════
function SceneCTA() {
  const {
    localTime
  } = window.useSprite();
  const e = window.Easing.easeOutCubic(window.clamp(localTime / 0.7, 0, 1));
  return React.createElement(SceneBG, {
    background: `radial-gradient(120% 120% at 50% 40%, ${NIGHT2} 0%, ${NIGHT} 60%, #0c0920 100%)`
  }, React.createElement(LightTrails, {
    opacity: 0.9
  }), React.createElement('div', {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, React.createElement('div', {
    style: {
      opacity: e,
      transform: `scale(${0.7 + 0.3 * e})`,
      marginBottom: 30
    }
  }, React.createElement(BrandMark, {
    size: 96,
    spin: 26
  })), React.createElement(window.Sprite, {
    start: 54.7,
    end: 60
  }, React.createElement(window.TextSprite, {
    text: 'Your venue. Your brand. Our engine.',
    x: 960,
    y: 560,
    align: 'center',
    size: 60,
    weight: 800,
    color: '#fff',
    font: FONT,
    letterSpacing: '-.03em'
  })), React.createElement(window.Sprite, {
    start: 55.4,
    end: 60
  }, React.createElement(window.TextSprite, {
    text: 'playreadyset.com',
    x: 960,
    y: 662,
    align: 'center',
    size: 28,
    weight: 600,
    color: TEAL,
    font: FONT,
    letterSpacing: '.04em'
  }))));
}

// ── Timestamp label (for commenting) ───────────────────────────────────────────
function ClockLabel() {
  const t = window.useTime();
  React.useEffect(() => {
    const root = document.getElementById('video-root');
    if (root) root.setAttribute('data-screen-label', `t=${Math.floor(t)}s`);
  }, [Math.floor(t)]);
  return null;
}

// ── Movie ───────────────────────────────────────────────────────────────────────
function SilverstoneMovie() {
  return React.createElement(React.Fragment, null, React.createElement(ClockLabel), React.createElement(window.Sprite, {
    start: 0,
    end: 7.2
  }, React.createElement(SceneOpen)), React.createElement(window.Sprite, {
    start: 7,
    end: 18.2
  }, React.createElement(SceneEstablish)), React.createElement(window.Sprite, {
    start: 18,
    end: 29.2
  }, React.createElement(SceneChallenge)), React.createElement(window.Sprite, {
    start: 29,
    end: 44.2
  }, React.createElement(ScenePhones)), React.createElement(window.Sprite, {
    start: 44,
    end: 54.2
  }, React.createElement(SceneQuote)), React.createElement(window.Sprite, {
    start: 54,
    end: 60
  }, React.createElement(SceneCTA)));
}
Object.assign(window, {
  SilverstoneMovie,
  AudioTrack,
  BrandMark
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "video/movie.jsx", error: String((e && e.message) || e) }); }

})();
