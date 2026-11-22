/*
 * Runs inside the Figma tab. Draws a board (out/board.json, produced by build.ts) with Figma's
 * plugin API: local colour and text styles, sections, one auto-layout frame per screen, captions,
 * prototype links and flow arrows. It makes no layout decisions: lower.ts already resolved them.
 *
 *   window.__gog.render(board)   start drawing; progress is in window.__gog.status
 */
(() => {
  'use strict';

  const FONT = 'Inter';
  const FONT_STYLE = { 400: 'Regular', 500: 'Medium', 600: 'Semi Bold', 700: 'Bold' };
  const TRANSITION = {
    push: {
      type: 'PUSH',
      direction: 'LEFT',
      matchLayers: false,
      easing: { type: 'EASE_OUT' },
      duration: 0.3,
    },
    modal: {
      type: 'MOVE_IN',
      direction: 'TOP',
      matchLayers: false,
      easing: { type: 'EASE_OUT' },
      duration: 0.35,
    },
    tab: null,
    replace: null,
  };

  const G = (window.__gog = window.__gog || {});
  G.images = G.images || {};
  G.status = G.status || { phase: 'idle' };

  // ----- paint helpers -----

  function parseColor(value) {
    if (!value || value === 'transparent') {
      return null;
    }
    const hex = value.slice(1);
    const at = (i) => parseInt(hex.slice(i, i + 2), 16) / 255;
    return { color: { r: at(0), g: at(2), b: at(4) }, opacity: hex.length === 8 ? at(6) : 1 };
  }

  function solid(value) {
    const parsed = parseColor(value);
    return parsed ? [{ type: 'SOLID', color: parsed.color, opacity: parsed.opacity }] : [];
  }

  const styleIdFor = (value) =>
    value && value.length === 7 ? G.paintStyle[value.toUpperCase()] : undefined;

  async function loadFonts() {
    for (const style of Object.values(FONT_STYLE)) {
      await figma.loadFontAsync({ family: FONT, style });
    }
  }

  /** Creates the local styles for the app's tokens, or updates the ones an earlier run made. */
  async function ensureStyles(tokens) {
    const paints = new Map(
      (await figma.getLocalPaintStylesAsync()).map((style) => [style.name, style]),
    );
    const texts = new Map(
      (await figma.getLocalTextStylesAsync()).map((style) => [style.name, style]),
    );
    G.paintStyle = {};
    G.textStyle = {};
    for (const [name, hex] of Object.entries(tokens.colors)) {
      const full = `Color/${name}`;
      let style = paints.get(full);
      if (!style) {
        style = figma.createPaintStyle();
        style.name = full;
      }
      style.paints = solid(hex);
      if (tokens.colorNotes && tokens.colorNotes[name]) {
        style.description = tokens.colorNotes[name];
      }
      const key = hex.toUpperCase();
      if (!(key in G.paintStyle)) {
        G.paintStyle[key] = style.id;
      }
    }
    for (const [name, type] of Object.entries(tokens.type)) {
      const full = `Type/${name}`;
      let style = texts.get(full);
      if (!style) {
        style = figma.createTextStyle();
        style.name = full;
      }
      style.fontName = { family: FONT, style: FONT_STYLE[type.fw] };
      style.fontSize = type.fs;
      style.lineHeight = { unit: 'PIXELS', value: type.lh };
      style.letterSpacing = { unit: 'PIXELS', value: type.ls || 0 };
      G.textStyle[name] = style.id;
    }
  }

  function image(url) {
    if (!G.images[url]) {
      G.images[url] = figma
        .createImageAsync(url)
        .then((img) => img.hash)
        .catch(() => null);
    }
    return G.images[url];
  }

  // ----- nodes -----

  const inAutoLayout = (parent) => 'layoutMode' in parent && parent.layoutMode !== 'NONE';

  function applySizing(node, spec, parent) {
    const flow = inAutoLayout(parent) && !spec.abs;
    const w = spec.sx === 'FIXED' && spec.w !== undefined ? Math.max(0.01, spec.w) : node.width;
    const h = spec.sy === 'FIXED' && spec.h !== undefined ? Math.max(0.01, spec.h) : node.height;
    if (w !== node.width || h !== node.height) {
      node.resize(w, h);
    }
    const horizontal = spec.sx === 'FILL' && !flow ? 'HUG' : spec.sx;
    const vertical = spec.sy === 'FILL' && !flow ? 'HUG' : spec.sy;
    node.layoutSizingHorizontal = horizontal;
    node.layoutSizingVertical = vertical;
  }

  async function makeFrame(spec, parent, ctx) {
    const frame = figma.createFrame();
    parent.appendChild(frame);
    frame.name = spec.n;
    frame.layoutMode = spec.d === 'H' ? 'HORIZONTAL' : 'VERTICAL';
    frame.itemSpacing = spec.g;
    if (spec.wrap) {
      frame.layoutWrap = 'WRAP';
      frame.counterAxisSpacing = spec.g;
    }
    [frame.paddingTop, frame.paddingRight, frame.paddingBottom, frame.paddingLeft] = spec.p;
    frame.counterAxisAlignItems = spec.ai;
    frame.primaryAxisAlignItems = spec.ji;
    frame.clipsContent = !!spec.clip;

    frame.fills = solid(spec.fill);
    const fillStyle = styleIdFor(spec.fill);
    if (fillStyle) {
      await frame.setFillStyleIdAsync(fillStyle);
    }

    if (spec.st) {
      frame.strokes = solid(spec.st.c);
      frame.strokeAlign = 'INSIDE';
      const [top, right, bottom, left] = spec.st.w;
      if (top === right && right === bottom && bottom === left) {
        frame.strokeWeight = top;
      } else {
        frame.strokeTopWeight = top;
        frame.strokeRightWeight = right;
        frame.strokeBottomWeight = bottom;
        frame.strokeLeftWeight = left;
      }
      frame.strokesIncludedInLayout = true;
      const strokeStyle = styleIdFor(spec.st.c);
      if (strokeStyle) {
        await frame.setStrokeStyleIdAsync(strokeStyle);
      }
    }
    if (spec.r) {
      const [tl, tr, br, bl] = spec.r;
      if (tl === tr && tr === br && br === bl) {
        frame.cornerRadius = tl;
      } else {
        frame.topLeftRadius = tl;
        frame.topRightRadius = tr;
        frame.bottomRightRadius = br;
        frame.bottomLeftRadius = bl;
      }
    }

    applySizing(frame, spec, parent);
    if (spec.minW !== undefined) {
      frame.minWidth = spec.minW;
    }
    if (spec.minH !== undefined) {
      frame.minHeight = spec.minH;
    }
    if (spec.maxW !== undefined) {
      frame.maxWidth = spec.maxW;
    }
    if (spec.maxH !== undefined) {
      frame.maxHeight = spec.maxH;
    }

    if (spec.img) {
      ctx.pending.push(
        image(spec.img).then((hash) => {
          if (hash) {
            frame.fills = [{ type: 'IMAGE', imageHash: hash, scaleMode: 'FILL' }];
          }
        }),
      );
    }

    const built = [];
    for (const child of spec.c) {
      built.push(await make(child, frame, ctx));
    }

    // alignSelf stand-ins fill the cross axis, and a filling child does not count towards a hugging
    // parent's size. Where the stand-in's content is the tallest thing in the row, let it hug instead,
    // so the row is as tall as React Native makes it.
    const horizontal = spec.d === 'H';
    if ((horizontal ? spec.sy : spec.sx) === 'HUG') {
      const cross = (node) => (horizontal ? node.height : node.width);
      spec.c.forEach((childSpec, index) => {
        if (!childSpec.aligner || childSpec.abs) {
          return;
        }
        const content = built[index].children[0];
        const others = built
          .filter((node, other) => other !== index && !spec.c[other].abs)
          .map(cross);
        if (content && cross(content) > Math.max(0, ...others) + 0.01) {
          if (horizontal) {
            built[index].layoutSizingVertical = 'HUG';
          } else {
            built[index].layoutSizingHorizontal = 'HUG';
          }
        }
      });
    }

    // alignItems: 'stretch' in a wrapping row: every cell of a line is as tall as the tallest.
    if (spec.stretchLines) {
      const lines = new Map();
      built.forEach((node, index) => {
        if (spec.c[index].abs) {
          return;
        }
        const key = Math.round(node.y);
        if (!lines.has(key)) {
          lines.set(key, []);
        }
        lines.get(key).push(node);
      });
      for (const nodes of lines.values()) {
        const tallest = Math.max(...nodes.map((node) => node.height));
        for (const node of nodes) {
          if (
            node.height < tallest - 0.01 &&
            'layoutSizingVertical' in node &&
            node.type !== 'TEXT'
          ) {
            node.layoutSizingVertical = 'FIXED';
            node.resize(node.width, tallest);
          }
        }
      }
    }

    if (spec.scroll) {
      ctx.scrolls.push({ viewport: frame, content: frame.children[0], axis: spec.scroll });
    }
    return frame;
  }

  async function makeText(spec, parent) {
    const text = figma.createText();
    parent.appendChild(text);
    text.fontName = { family: FONT, style: FONT_STYLE[spec.fw] };
    text.fontSize = spec.fs;
    text.lineHeight = { unit: 'PIXELS', value: spec.lh };
    text.letterSpacing = { unit: 'PIXELS', value: spec.ls };
    text.characters = spec.x;
    text.textAlignHorizontal = spec.ta;
    if (spec.style && G.textStyle[spec.style]) {
      await text.setTextStyleIdAsync(G.textStyle[spec.style]);
    }
    text.fills = solid(spec.c);
    const fillStyle = styleIdFor(spec.c);
    if (fillStyle) {
      await text.setFillStyleIdAsync(fillStyle);
    }

    const flow = inAutoLayout(parent) && !spec.abs;
    if (spec.sx === 'FILL' && flow) {
      text.layoutSizingHorizontal = 'FILL';
      text.textAutoResize = 'HEIGHT';
    } else if (spec.sx === 'FIXED' && spec.w !== undefined) {
      text.textAutoResize = 'HEIGHT';
      text.resize(Math.max(0.01, spec.w), text.height);
    } else {
      text.textAutoResize = 'WIDTH_AND_HEIGHT';
      // A hugging text in a column still wraps at the column's width, as React Native lays it out.
      if (flow && parent.layoutMode === 'VERTICAL' && parent.layoutSizingHorizontal !== 'HUG') {
        const border =
          parent.strokes.length > 0 && parent.strokesIncludedInLayout
            ? (typeof parent.strokeLeftWeight === 'number' ? parent.strokeLeftWeight : 0) +
              (typeof parent.strokeRightWeight === 'number' ? parent.strokeRightWeight : 0)
            : 0;
        const inner = parent.width - parent.paddingLeft - parent.paddingRight - border;
        if (inner > 1 && text.width > inner) {
          text.textAutoResize = 'HEIGHT';
          text.resize(inner, text.height);
          // React Native sizes a wrapped text to its widest line, and the column then centres that
          // block. Find that width: the narrowest box that keeps the same number of lines.
          if (parent.counterAxisAlignItems !== 'MIN' && spec.ta === 'LEFT') {
            const height = text.height;
            let low = 1;
            let high = inner;
            for (let step = 0; step < 10; step += 1) {
              const middle = (low + high) / 2;
              text.resize(middle, text.height);
              if (text.height > height + 0.5) {
                low = middle;
              } else {
                high = middle;
              }
            }
            text.resize(Math.ceil(high), text.height);
          }
        }
      }
    }
    if (spec.lines && text.textAutoResize !== 'WIDTH_AND_HEIGHT') {
      text.textTruncation = 'ENDING';
      text.maxLines = spec.lines;
    }
    return text;
  }

  function makeEllipse(spec, parent) {
    const ellipse = figma.createEllipse();
    parent.appendChild(ellipse);
    ellipse.resize(spec.w, spec.h);
    ellipse.fills = solid(spec.fill);
    if (spec.st) {
      ellipse.strokes = solid(spec.st.c);
      ellipse.strokeWeight = spec.st.w;
      ellipse.strokeAlign = 'INSIDE';
    }
    return ellipse;
  }

  function makeSvg(spec, parent) {
    const node = figma.createNodeFromSvg(spec.svg);
    parent.appendChild(node);
    node.clipsContent = false;
    return node;
  }

  async function make(spec, parent, ctx) {
    let node;
    if (spec.t === 'f') {
      node = await makeFrame(spec, parent, ctx);
    } else if (spec.t === 't') {
      node = await makeText(spec, parent);
    } else if (spec.t === 'e') {
      node = makeEllipse(spec, parent);
    } else {
      node = makeSvg(spec, parent);
    }
    node.name = spec.n;
    if (spec.op !== undefined) {
      node.opacity = spec.op;
    }
    if (spec.abs) {
      if (inAutoLayout(parent)) {
        node.layoutPositioning = 'ABSOLUTE';
      }
      ctx.abs.push({ node, parent, abs: spec.abs });
    }
    if (spec.go || spec.back) {
      ctx.links.push({ node, go: spec.go, how: spec.how, back: spec.back });
    }
    ctx.count += 1;
    return node;
  }

  function placeAbsolute(entries) {
    for (const { node, parent, abs } of entries) {
      const stretchX = abs.left !== undefined && abs.right !== undefined;
      const stretchY = abs.top !== undefined && abs.bottom !== undefined;
      if (stretchX || stretchY) {
        node.resize(
          stretchX ? Math.max(0.01, parent.width - abs.left - abs.right) : node.width,
          stretchY ? Math.max(0.01, parent.height - abs.top - abs.bottom) : node.height,
        );
      }
      node.x =
        abs.left !== undefined
          ? abs.left
          : abs.right !== undefined
            ? parent.width - node.width - abs.right
            : abs.centerX
              ? (parent.width - node.width) / 2
              : 0;
      node.y =
        abs.top !== undefined
          ? abs.top
          : abs.bottom !== undefined
            ? parent.height - node.height - abs.bottom
            : abs.centerY
              ? (parent.height - node.height) / 2
              : 0;
      if ('constraints' in node) {
        node.constraints = {
          horizontal: stretchX
            ? 'STRETCH'
            : abs.left !== undefined
              ? 'MIN'
              : abs.right !== undefined
                ? 'MAX'
                : abs.centerX
                  ? 'CENTER'
                  : 'MIN',
          vertical: stretchY
            ? 'STRETCH'
            : abs.top !== undefined
              ? 'MIN'
              : abs.bottom !== undefined
                ? 'MAX'
                : abs.centerY
                  ? 'CENTER'
                  : 'MIN',
        };
      }
    }
  }

  /** One screen: its frame at (x, y) in `parent`, grown to its scroll content when mode is 'full'. */
  async function drawScreen(screen, parent, x, y, links) {
    const ctx = { abs: [], links: [], scrolls: [], pending: [], count: 0 };
    const root = await make(screen.tree, parent, ctx);
    root.x = x;
    root.y = y;
    const vertical = ctx.scrolls.find((entry) => entry.axis === 'y');
    if (screen.mode === 'full' && vertical && vertical.content) {
      const overflow = vertical.content.height - vertical.viewport.height;
      if (overflow > 0.5) {
        root.resize(root.width, Math.ceil(root.height + overflow));
      }
    }
    for (const entry of ctx.scrolls) {
      if (!entry.content) {
        continue;
      }
      const overflows =
        entry.axis === 'y'
          ? entry.content.height > entry.viewport.height + 0.5
          : entry.content.width > entry.viewport.width + 0.5;
      if (overflows) {
        entry.viewport.overflowDirection = entry.axis === 'y' ? 'VERTICAL' : 'HORIZONTAL';
      }
    }
    placeAbsolute(ctx.abs);
    await Promise.all(ctx.pending);
    links.push(...ctx.links);
    return { root, layers: ctx.count };
  }

  async function plainText(parent, value, x, y, options) {
    const text = figma.createText();
    parent.appendChild(text);
    text.fontName = { family: FONT, style: FONT_STYLE[options.fw || 400] };
    text.fontSize = options.fs;
    text.lineHeight = { unit: 'PIXELS', value: options.lh || Math.round(options.fs * 1.4) };
    text.characters = value;
    text.fills = solid(options.c);
    if (options.w) {
      text.textAutoResize = 'HEIGHT';
      text.resize(options.w, text.height);
    }
    text.x = x;
    text.y = y;
    text.name = options.name || value.slice(0, 40);
    return text;
  }

  async function applyLinks(links) {
    let made = 0;
    const missing = new Set();
    for (const link of links) {
      let actions;
      if (link.back) {
        actions = [{ type: 'BACK' }];
      } else {
        const destination = G.frames[link.go];
        if (!destination) {
          missing.add(link.go);
          continue;
        }
        actions = [
          {
            type: 'NODE',
            destinationId: destination,
            navigation: 'NAVIGATE',
            transition: TRANSITION[link.how] || null,
            preserveScrollPosition: false,
          },
        ];
      }
      await link.node.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions }]);
      made += 1;
    }
    return { made, missing: [...missing] };
  }

  // ----- flow arrows -----

  const ARROW = {
    main: { color: '#C8FF4A', ink: '#0A0A0F', weight: 4, dash: [] },
    branch: { color: '#A6A6B7', ink: '#0A0A0F', weight: 3, dash: [12, 10] },
  };
  const EDGE = 16;
  const LANE = 56;

  async function arrowLabel(parent, value, style, cx, cy, maxWidth) {
    const chip = figma.createFrame();
    parent.appendChild(chip);
    chip.name = 'label';
    chip.layoutMode = 'VERTICAL';
    chip.paddingTop = chip.paddingBottom = 8;
    chip.paddingLeft = chip.paddingRight = 16;
    chip.cornerRadius = 20;
    chip.fills = solid(style.color);
    const text = figma.createText();
    chip.appendChild(text);
    text.fontName = { family: FONT, style: FONT_STYLE[600] };
    text.fontSize = 20;
    text.lineHeight = { unit: 'PIXELS', value: 26 };
    text.characters = value;
    text.textAlignHorizontal = 'CENTER';
    text.fills = solid(style.ink);
    if (text.width > maxWidth - 32) {
      text.textAutoResize = 'HEIGHT';
      text.resize(maxWidth - 32, text.height);
    }
    chip.layoutSizingHorizontal = 'HUG';
    chip.layoutSizingVertical = 'HUG';
    chip.x = Math.round(cx - chip.width / 2);
    chip.y = Math.round(cy - chip.height / 2);
    return chip;
  }

  /**
   * Draws each arrow as an orthogonal line with a rounded elbow, an arrowhead and a label.
   * Neighbours in a row get a straight line; a jump along a row runs in a lane above it;
   * a move to another row runs through the gap between the rows.
   */
  G.drawArrows = async function drawArrows(arrows) {
    const page = figma.currentPage;
    const sections = {};
    for (const node of page.children) {
      if (node.type === 'SECTION') {
        sections[node.id] = node;
      }
    }
    const lanes = {};
    let drawn = 0;
    const skipped = [];

    for (const arrow of arrows) {
      const a = G.boxes[arrow.from];
      const b = G.boxes[arrow.to];
      if (!a || !b) {
        skipped.push(`${arrow.from} -> ${arrow.to}`);
        continue;
      }
      const style = ARROW[arrow.kind || 'main'];
      const sameSection = a.section === b.section;
      const parent = sameSection ? sections[a.section] : page;
      const off = (box) =>
        sameSection ? { x: 0, y: 0 } : { x: sections[box.section].x, y: sections[box.section].y };
      const A = {
        x: a.x + off(a).x,
        y: a.y + off(a).y,
        w: a.w,
        h: a.h,
        bottom: a.bottom + off(a).y,
      };
      const B = {
        x: b.x + off(b).x,
        y: b.y + off(b).y,
        w: b.w,
        h: b.h,
        bottom: b.bottom + off(b).y,
      };
      const acx = A.x + A.w / 2;
      const bcx = B.x + B.w / 2;
      const sameRow = sameSection && Math.abs(A.y - B.y) < 1;
      let points;
      let labelAt;
      let labelWidth = 260;

      if (sameRow) {
        const between = Object.values(G.boxes).some(
          (box) =>
            box.section === a.section &&
            Math.abs(box.y - a.y) < 1 &&
            box.x > Math.min(a.x, b.x) &&
            box.x < Math.max(a.x, b.x),
        );
        if (!between && B.x > A.x) {
          const y = A.y + (arrow.at !== undefined ? arrow.at : 426);
          points = [
            [A.x + A.w + EDGE, y],
            [B.x - EDGE, y],
          ];
          labelWidth = B.x - (A.x + A.w) - 2 * EDGE;
          labelAt = [(A.x + A.w + B.x) / 2, y - 14, 'above'];
        } else {
          const rowKey = `${a.section}:${Math.round(a.y)}`;
          lanes[rowKey] = (lanes[rowKey] || 0) + 1;
          const y = A.y - 70 - lanes[rowKey] * LANE;
          // Leave and arrive near the frames' right corners, clear of the name tags at their left.
          const inset = 48 + (lanes[rowKey] - 1) * 28;
          const startX = A.x + A.w - inset;
          const endX = B.x + B.w - inset;
          points = [
            [startX, A.y - EDGE],
            [startX, y],
            [endX, y],
            [endX, B.y - EDGE],
          ];
          labelWidth = 420;
          labelAt = [(startX + endX) / 2, y, 'on'];
        }
      } else if (B.y > A.y) {
        const startY = A.bottom + EDGE;
        const endY = B.y - EDGE - 44;
        if (Math.abs(acx - bcx) < 1) {
          points = [
            [acx, startY],
            [acx, endY],
          ];
          labelAt = [acx, (startY + endY) / 2, 'on'];
        } else {
          const mid = Math.round(endY - 90);
          points = [
            [acx, startY],
            [acx, mid],
            [bcx, mid],
            [bcx, endY],
          ];
          labelWidth = 420;
          labelAt = [(acx + bcx) / 2, mid, 'on'];
        }
      } else {
        const startY = A.y - EDGE - 44;
        const endY = B.bottom + EDGE;
        if (Math.abs(acx - bcx) < 1) {
          points = [
            [acx + 70, startY],
            [acx + 70, endY],
          ];
          labelAt = [acx + 70, (startY + endY) / 2, 'on'];
        } else {
          const mid = Math.round(startY - 90);
          points = [
            [acx + 70, startY],
            [acx + 70, mid],
            [bcx + 70, mid],
            [bcx + 70, endY],
          ];
          labelWidth = 420;
          labelAt = [(acx + bcx) / 2 + 70, mid, 'on'];
        }
      }

      const minX = Math.min(...points.map((p) => p[0]));
      const minY = Math.min(...points.map((p) => p[1]));
      const vector = figma.createVector();
      parent.appendChild(vector);
      vector.name = 'line';
      await vector.setVectorNetworkAsync({
        vertices: points.map((p, index) => ({
          x: p[0] - minX,
          y: p[1] - minY,
          strokeCap: index === points.length - 1 ? 'ARROW_EQUILATERAL' : 'ROUND',
          cornerRadius: index > 0 && index < points.length - 1 ? 24 : 0,
        })),
        segments: points.slice(1).map((_, index) => ({ start: index, end: index + 1 })),
        regions: [],
      });
      vector.x = minX;
      vector.y = minY;
      vector.strokes = solid(style.color);
      vector.strokeWeight = style.weight;
      vector.strokeJoin = 'ROUND';
      if (style.dash.length) {
        vector.dashPattern = style.dash;
      }
      vector.fills = [];

      const parts = [vector];
      if (arrow.label) {
        const chip = await arrowLabel(
          parent,
          arrow.label,
          style,
          labelAt[0],
          labelAt[1],
          Math.max(140, labelWidth),
        );
        if (labelAt[2] === 'above') {
          chip.y = Math.round(labelAt[1] - chip.height);
        }
        parts.push(chip);
      }
      // A group, so Figma does not print the label frame's layer name on the canvas.
      const group = figma.group(parts, parent);
      group.name = `${arrow.from} → ${arrow.to}${arrow.label ? `: ${arrow.label}` : ''}`;
      drawn += 1;
    }
    return { drawn, skipped };
  };

  // ----- the board -----

  const PAD = 160;
  const GAP_X = 300;
  const GAP_Y = 420;
  const SECTION_GAP = 320;
  const PITCH = 393 + GAP_X;

  G.render = async function render(board) {
    const status = (G.status = {
      phase: 'fonts',
      done: 0,
      total: board.sections.reduce(
        (sum, section) => sum + section.rows.reduce((n, row) => n + row.length, 0),
        0,
      ),
      layers: 0,
      errors: [],
      startedAt: Date.now(),
    });
    try {
      await loadFonts();
      status.phase = 'styles';
      await ensureStyles(board.tokens);

      const page = figma.currentPage;
      page.name = board.page.name;
      page.backgrounds = solid(board.page.background);
      const mine = new Set([...board.sections.map((section) => section.name), 'Flow arrows']);
      // Everything an earlier run drew: its sections are named '<number> · <title>'.
      for (const node of [...page.children]) {
        if (mine.has(node.name) || /^\d+ · /.test(node.name)) {
          node.remove();
        }
      }

      G.frames = {};
      G.boxes = {};
      const links = [];
      let sectionY = 0;
      status.phase = 'screens';

      for (const spec of board.sections) {
        const section = figma.createSection();
        section.name = spec.name;
        section.fills = solid(spec.fill);
        section.x = 0;
        section.y = sectionY;

        const title = await plainText(section, spec.title, PAD, PAD, {
          fs: 96,
          lh: 110,
          fw: 700,
          c: spec.ink,
        });
        const subtitle = await plainText(section, spec.subtitle, PAD, PAD + title.height + 24, {
          fs: 36,
          lh: 50,
          c: spec.inkMuted,
          w: 2400,
        });
        let y = subtitle.y + subtitle.height + 320;
        let widest = PAD + 2400;

        for (const row of spec.rows) {
          let x = PAD;
          let rowHeight = 0;
          for (const screen of row) {
            status.current = screen.key;
            // A column index pins the frame under the same column of the row above.
            if (screen.col !== undefined) {
              x = PAD + screen.col * PITCH;
            }
            try {
              const drawn = await drawScreen(screen, section, x, y, links);
              const root = drawn.root;
              status.layers += drawn.layers;
              G.frames[screen.key] = root.id;
              const caption = await plainText(section, screen.name, x, y + root.height + 28, {
                fs: 28,
                lh: 36,
                fw: 600,
                c: spec.ink,
                w: root.width,
                name: `${screen.name} · caption`,
              });
              const route = await plainText(
                section,
                screen.route,
                x,
                caption.y + caption.height + 6,
                { fs: 20, lh: 28, c: spec.inkMuted, w: root.width, name: `${screen.name} · route` },
              );
              let bottom = route.y + route.height;
              if (screen.note) {
                const note = await plainText(section, screen.note, x, bottom + 10, {
                  fs: 20,
                  lh: 28,
                  c: spec.inkMuted,
                  w: root.width,
                  name: `${screen.name} · note`,
                });
                bottom = note.y + note.height;
              }
              G.boxes[screen.key] = {
                section: section.id,
                x,
                y,
                w: root.width,
                h: root.height,
                bottom,
              };
              rowHeight = Math.max(rowHeight, bottom - y);
              x += root.width + GAP_X;
              widest = Math.max(widest, x - GAP_X + PAD);
            } catch (error) {
              status.errors.push(
                `${screen.key}: ${error && error.message ? error.message : String(error)}`,
              );
            }
            status.done += 1;
          }
          y += rowHeight + GAP_Y;
        }
        section.resizeWithoutConstraints(widest, y - GAP_Y + PAD);
        sectionY += section.height + SECTION_GAP;
      }

      status.phase = 'links';
      status.links = await applyLinks(links);
      if (board.flowStart && G.frames[board.flowStart.key]) {
        page.flowStartingPoints = [
          { nodeId: G.frames[board.flowStart.key], name: board.flowStart.name },
        ];
      }
      if (G.drawArrows && board.arrows) {
        status.phase = 'arrows';
        status.arrows = await G.drawArrows(board.arrows);
      }
      figma.viewport.scrollAndZoomIntoView(page.children);
      status.phase = 'done';
      status.ms = Date.now() - status.startedAt;
    } catch (error) {
      status.phase = 'failed';
      status.errors.push(error && error.stack ? error.stack : String(error));
    }
    return status;
  };

  G.rendererLoaded = Date.now();
})();
