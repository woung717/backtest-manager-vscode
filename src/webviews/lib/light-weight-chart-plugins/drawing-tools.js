var O = Object.defineProperty;
var S = (n, t, e) => t in n ? O(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var s = (n, t, e) => S(n, typeof t != "symbol" ? t + "" : t, e);
import { isBusinessDay as T } from "lightweight-charts";
function a(n) {
  if (n === void 0)
    throw new Error("Value is undefined");
  return n;
}
function C(n, t, e) {
  const i = Math.round(e * n), o = Math.round(e * t);
  return {
    position: Math.min(i, o),
    length: Math.abs(o - i) + 1
  };
}
class P {
  constructor() {
    s(this, "_chart");
    s(this, "_series");
    s(this, "_requestUpdate");
    // This method is a class property to maintain the
    // lexical 'this' scope (due to the use of the arrow function)
    // and to ensure its reference stays the same, so we can unsubscribe later.
    s(this, "_fireDataUpdated", (t) => {
      this.dataUpdated && this.dataUpdated(t);
    });
  }
  requestUpdate() {
    this._requestUpdate && this._requestUpdate();
  }
  attached({ chart: t, series: e, requestUpdate: i }) {
    this._chart = t, this._series = e, this._series.subscribeDataChanged(this._fireDataUpdated), this._requestUpdate = i, this.requestUpdate();
  }
  detached() {
    var t;
    (t = this._series) == null || t.unsubscribeDataChanged(this._fireDataUpdated), this._chart = void 0, this._series = void 0, this._requestUpdate = void 0;
  }
  get chart() {
    return a(this._chart);
  }
  get series() {
    return a(this._series);
  }
}
const M = {
  lineColor: "rgba(0 , 0, 0, 1)",
  previewLineColor: "rgba(0, 0, 0, 0.5)",
  lineWidth: 2,
  labelColor: "rgba(0, 0, 0, 1)",
  labelTextColor: "white",
  showLabels: !0,
  priceLabelFormatter: (n) => n.toFixed(2),
  timeLabelFormatter: (n) => typeof n == "string" ? n : (T(n) ? new Date(n.year, n.month - 1, n.day) : new Date(n * 1e3)).toLocaleDateString()
}, E = {
  fillColor: "rgba(200, 50, 100, 0.35)",
  previewFillColor: "rgba(200, 50, 100, 0.25)",
  labelColor: "rgba(200, 50, 100, 1)",
  labelTextColor: "white",
  showLabels: !0,
  priceLabelFormatter: (n) => n.toFixed(2),
  timeLabelFormatter: (n) => typeof n == "string" ? n : (T(n) ? new Date(n.year, n.month - 1, n.day) : new Date(n * 1e3)).toLocaleDateString()
};
class H {
  constructor(t, e, i) {
    s(this, "_p1");
    s(this, "_p2");
    s(this, "_fillColor");
    this._p1 = t, this._p2 = e, this._fillColor = i;
  }
  draw(t) {
    t.useBitmapCoordinateSpace((e) => {
      if (this._p1.x === null || this._p1.y === null || this._p2.x === null || this._p2.y === null)
        return;
      const i = e.context, o = C(
        this._p1.x,
        this._p2.x,
        e.horizontalPixelRatio
      ), r = C(
        this._p1.y,
        this._p2.y,
        e.verticalPixelRatio
      );
      i.fillStyle = this._fillColor, i.fillRect(
        o.position,
        r.position,
        o.length,
        r.length
      );
    });
  }
}
class F {
  constructor(t, e, i, o) {
    s(this, "_p1");
    s(this, "_p2");
    s(this, "_fillColor");
    s(this, "_vertical", !1);
    this._p1 = t, this._p2 = e, this._fillColor = i, this._vertical = o;
  }
  draw(t) {
    t.useBitmapCoordinateSpace((e) => {
      if (this._p1 === null || this._p2 === null) return;
      const i = e.context;
      i.globalAlpha = 0.5;
      const o = C(
        this._p1,
        this._p2,
        this._vertical ? e.verticalPixelRatio : e.horizontalPixelRatio
      );
      i.fillStyle = this._fillColor, this._vertical ? i.fillRect(0, o.position, 15, o.length) : i.fillRect(o.position, 0, o.length, 15);
    });
  }
}
class I {
  constructor(t) {
    s(this, "_source");
    s(this, "_p1", { x: null, y: null });
    s(this, "_p2", { x: null, y: null });
    this._source = t;
  }
  update() {
    const t = this._source.series, e = t.priceToCoordinate(this._source._p1.price), i = t.priceToCoordinate(this._source._p2.price), o = this._source.chart.timeScale(), r = o.timeToCoordinate(this._source._p1.time), h = o.timeToCoordinate(this._source._p2.time);
    this._p1 = { x: r, y: e }, this._p2 = { x: h, y: i };
  }
  renderer() {
    return new H(
      this._p1,
      this._p2,
      this._source._options.fillColor
    );
  }
}
class V {
  constructor(t, e) {
    s(this, "_source");
    s(this, "_p1", null);
    s(this, "_p2", null);
    s(this, "_vertical", !1);
    this._source = t, this._vertical = e;
  }
  update() {
    [this._p1, this._p2] = this.getPoints();
  }
  renderer() {
    return new F(
      this._p1,
      this._p2,
      this._source._options.fillColor,
      this._vertical
    );
  }
  zOrder() {
    return "bottom";
  }
}
class U extends V {
  getPoints() {
    const t = this._source.series, e = t.priceToCoordinate(this._source._p1.price), i = t.priceToCoordinate(this._source._p2.price);
    return [e, i];
  }
}
class q extends V {
  getPoints() {
    const t = this._source.chart.timeScale(), e = t.timeToCoordinate(this._source._p1.time), i = t.timeToCoordinate(this._source._p2.time);
    return [e, i];
  }
}
class D {
  constructor(t, e) {
    s(this, "_source");
    s(this, "_p");
    s(this, "_pos", null);
    this._source = t, this._p = e;
  }
  coordinate() {
    return this._pos ?? -1;
  }
  visible() {
    return this._source._options.showLabels;
  }
  tickVisible() {
    return this._source._options.showLabels;
  }
  textColor() {
    return this._source._options.labelTextColor;
  }
  backColor() {
    return this._source._options.labelColor;
  }
  movePoint(t) {
    this._p = t, this.update();
  }
}
class v extends D {
  update() {
    const t = this._source.chart.timeScale();
    this._pos = t.timeToCoordinate(this._p.time);
  }
  text() {
    return this._source._options.timeLabelFormatter(this._p.time);
  }
}
class b extends D {
  update() {
    const t = this._source.series;
    this._pos = t.priceToCoordinate(this._p.price);
  }
  text() {
    return this._source._options.priceLabelFormatter(this._p.price);
  }
}
class L extends P {
  constructor(e, i, o = {}) {
    super();
    s(this, "_id");
    s(this, "_options");
    s(this, "_p1");
    s(this, "_p2");
    s(this, "_paneViews");
    s(this, "_timeAxisViews");
    s(this, "_priceAxisViews");
    s(this, "_priceAxisPaneViews");
    s(this, "_timeAxisPaneViews");
    this._id = w.getNextId(), this._p1 = e, this._p2 = i, this._options = {
      ...E,
      ...o
    }, this._paneViews = [new I(this)], this._timeAxisViews = [
      new v(this, e),
      new v(this, i)
    ], this._priceAxisViews = [
      new b(this, e),
      new b(this, i)
    ], this._priceAxisPaneViews = [new U(this, !0)], this._timeAxisPaneViews = [new q(this, !1)];
  }
  updateAllViews() {
    this._paneViews.forEach((e) => e.update()), this._timeAxisViews.forEach((e) => e.update()), this._priceAxisViews.forEach((e) => e.update()), this._priceAxisPaneViews.forEach((e) => e.update()), this._timeAxisPaneViews.forEach((e) => e.update());
  }
  priceAxisViews() {
    return this._priceAxisViews;
  }
  timeAxisViews() {
    return this._timeAxisViews;
  }
  paneViews() {
    return this._paneViews;
  }
  priceAxisPaneViews() {
    return this._priceAxisPaneViews;
  }
  timeAxisPaneViews() {
    return this._timeAxisPaneViews;
  }
  applyOptions(e) {
    this._options = { ...this._options, ...e }, this.requestUpdate();
  }
  hitTest(e, i) {
    if (!this._paneViews || !this._paneViews[0])
      return null;
    const o = this._paneViews[0]._p1, r = this._paneViews[0]._p2;
    if (o.x === null || o.y === null || r.x === null || r.y === null)
      return null;
    const h = Math.min(o.x, r.x), p = Math.max(o.x, r.x), x = Math.min(o.y, r.y), u = Math.max(o.y, r.y);
    return e >= h && e <= p && i >= x && i <= u ? {
      externalId: this._id,
      zOrder: "top",
      cursorStyle: "pointer"
    } : null;
  }
}
class z extends L {
  constructor(t, e, i = {}) {
    super(t, e, i), this._options.fillColor = this._options.previewFillColor;
  }
  updateEndPoint(t) {
    this._p2 = t, this._paneViews[0].update(), this._timeAxisViews[1].movePoint(t), this._priceAxisViews[1].movePoint(t), this.requestUpdate();
  }
}
class N {
  constructor(t, e, i, o) {
    s(this, "_chart");
    s(this, "_series");
    s(this, "_defaultOptions");
    s(this, "_rectangles");
    s(this, "_previewRectangle");
    s(this, "_points", []);
    s(this, "_drawing", !1);
    s(this, "_onDrawingCompleteCallback");
    s(this, "_clickHandler", (t) => this._onClick(t));
    s(this, "_moveHandler", (t) => this._onMouseMove(t));
    s(this, "_dblClickHandler", (t) => this._onDblClick(t));
    this._chart = t, this._series = e, this._defaultOptions = i, this._onDrawingCompleteCallback = o, this._rectangles = [], this._chart.subscribeClick(this._clickHandler), this._chart.subscribeCrosshairMove(this._moveHandler), this._chart.subscribeDblClick(this._dblClickHandler);
  }
  get options() {
    return this._defaultOptions;
  }
  remove() {
    this._rectangles.forEach((t) => this._removeRectangle(t)), this.stopDrawing(), this._chart.unsubscribeClick(this._clickHandler), this._chart.unsubscribeCrosshairMove(this._moveHandler), this._rectangles.forEach((t) => {
      this._removeRectangle(t);
    }), this._rectangles = [], this._removePreviewRectangle(), this._chart.unsubscribeDblClick(this._dblClickHandler);
  }
  startDrawing() {
    this._drawing = !0, this._points = [];
  }
  stopDrawing() {
    this._drawing = !1, this._points = [], this._removePreviewRectangle();
  }
  isDrawing() {
    return this._drawing;
  }
  _onClick(t) {
    if (!this._drawing || !t.point || !t.time || !this._series) return;
    const e = this._series.coordinateToPrice(t.point.y);
    e !== null && this._addPoint({
      time: t.time,
      price: e
    });
  }
  _onMouseMove(t) {
    if (!this._drawing || !t.point || !t.time || !this._series) return;
    const e = this._series.coordinateToPrice(t.point.y);
    e !== null && this._previewRectangle && this._previewRectangle.updateEndPoint({
      time: t.time,
      price: e
    });
  }
  _onDblClick(t) {
    if (this._drawing) return;
    const e = t.hoveredObjectId;
    if (!e) return;
    const i = this._rectangles.findIndex((o) => o._id === e);
    if (i !== -1) {
      const o = this._rectangles[i];
      this._removeRectangle(o), this._rectangles.splice(i, 1);
    }
  }
  _addPoint(t) {
    this._points.push(t), this._points.length >= 2 && (this._addNewRectangle(this._points[0], this._points[1]), this.stopDrawing(), this._onDrawingCompleteCallback && this._onDrawingCompleteCallback()), this._points.length === 1 && this._addPreviewRectangle(this._points[0]);
  }
  _addNewRectangle(t, e) {
    const i = new L(t, e, { ...this._defaultOptions });
    this._rectangles.push(i), a(this._series).attachPrimitive(i);
  }
  _removeRectangle(t) {
    a(this._series).detachPrimitive(t);
  }
  _addPreviewRectangle(t) {
    this._previewRectangle = new z(t, t, {
      ...this._defaultOptions
    }), a(this._series).attachPrimitive(this._previewRectangle);
  }
  _removePreviewRectangle() {
    this._previewRectangle && (a(this._series).detachPrimitive(this._previewRectangle), this._previewRectangle = void 0);
  }
}
class W {
  constructor(t, e, i, o) {
    s(this, "_p1");
    s(this, "_p2");
    s(this, "_lineColor");
    s(this, "_lineWidth");
    this._p1 = t, this._p2 = e, this._lineColor = i, this._lineWidth = o;
  }
  draw(t) {
    t.useBitmapCoordinateSpace((e) => {
      if (this._p1.x === null || this._p1.y === null || this._p2.x === null || this._p2.y === null)
        return;
      const i = e.context, o = this._p1.x * e.horizontalPixelRatio, r = this._p1.y * e.verticalPixelRatio, h = this._p2.x * e.horizontalPixelRatio, p = this._p2.y * e.verticalPixelRatio;
      i.strokeStyle = this._lineColor, i.lineWidth = this._lineWidth * e.horizontalPixelRatio, i.lineCap = "round", i.lineJoin = "round", i.beginPath(), i.moveTo(o, r), i.lineTo(h, p), i.stroke();
    });
  }
}
class $ {
  constructor(t) {
    s(this, "_source");
    s(this, "_p1", { x: null, y: null });
    s(this, "_p2", { x: null, y: null });
    this._source = t;
  }
  update() {
    const t = this._source.series, e = t.priceToCoordinate(this._source._p1.price), i = t.priceToCoordinate(this._source._p2.price), o = this._source.chart.timeScale(), r = o.timeToCoordinate(this._source._p1.time), h = o.timeToCoordinate(this._source._p2.time);
    this._p1 = { x: r, y: e }, this._p2 = { x: h, y: i };
  }
  renderer() {
    return new W(
      this._p1,
      this._p2,
      this._source._options.lineColor,
      this._source._options.lineWidth
    );
  }
}
class A {
  constructor(t, e) {
    s(this, "_source");
    s(this, "_p");
    s(this, "_pos", null);
    this._source = t, this._p = e;
  }
  coordinate() {
    return this._pos ?? -1;
  }
  visible() {
    return this._source._options.showLabels;
  }
  tickVisible() {
    return this._source._options.showLabels;
  }
  textColor() {
    return this._source._options.labelTextColor;
  }
  backColor() {
    return this._source._options.labelColor;
  }
  movePoint(t) {
    this._p = t, this.update();
  }
}
class f extends A {
  update() {
    const t = this._source.chart.timeScale();
    this._pos = t.timeToCoordinate(this._p.time);
  }
  text() {
    return this._source._options.timeLabelFormatter(this._p.time);
  }
}
class y extends A {
  update() {
    const t = this._source.series;
    this._pos = t.priceToCoordinate(this._p.price);
  }
  text() {
    return this._source._options.priceLabelFormatter(this._p.price);
  }
}
class R extends P {
  constructor(e, i, o = {}) {
    super();
    s(this, "_id");
    s(this, "_options");
    s(this, "_p1");
    s(this, "_p2");
    s(this, "_paneViews");
    s(this, "_timeAxisViews");
    s(this, "_priceAxisViews");
    this._id = w.getNextId(), this._p1 = e, this._p2 = i, this._options = {
      ...M,
      ...o
    }, this._paneViews = [new $(this)], this._timeAxisViews = [
      new f(this, e),
      new f(this, i)
    ], this._priceAxisViews = [
      new y(this, e),
      new y(this, i)
    ];
  }
  updateAllViews() {
    this._paneViews.forEach((e) => e.update()), this._timeAxisViews.forEach((e) => e.update()), this._priceAxisViews.forEach((e) => e.update());
  }
  priceAxisViews() {
    return this._priceAxisViews;
  }
  timeAxisViews() {
    return this._timeAxisViews;
  }
  paneViews() {
    return this._paneViews;
  }
  applyOptions(e) {
    this._options = { ...this._options, ...e }, this.requestUpdate();
  }
  hitTest(e, i) {
    if (!this._paneViews || !this._paneViews[0])
      return null;
    const o = this._paneViews[0]._p1, r = this._paneViews[0]._p2;
    if (o.x === null || o.y === null || r.x === null || r.y === null)
      return null;
    const x = ((_, l, c) => {
      if (_.x === null || _.y === null || l.x === null || l.y === null || c.x === null || c.y === null)
        return 1 / 0;
      const m = (l.x - c.x) ** 2 + (l.y - c.y) ** 2;
      if (m === 0) return (_.x - l.x) ** 2 + (_.y - l.y) ** 2;
      let d = ((_.x - l.x) * (c.x - l.x) + (_.y - l.y) * (c.y - l.y)) / m;
      d = Math.max(0, Math.min(1, d));
      const k = l.x + d * (c.x - l.x), B = l.y + d * (c.y - l.y);
      return (_.x - k) ** 2 + (_.y - B) ** 2;
    })({ x: e, y: i }, o, r), u = this._options.lineWidth / 2 + 2;
    return x <= u * u ? {
      externalId: this._id,
      zOrder: "top",
      cursorStyle: "pointer"
    } : null;
  }
}
class j extends R {
  constructor(t, e, i = {}) {
    super(t, e, i), this._options.lineColor = this._options.previewLineColor;
  }
  updateEndPoint(t) {
    this._p2 = t, this._paneViews[0].update(), this._timeAxisViews[1].movePoint(t), this._priceAxisViews[1].movePoint(t), this.requestUpdate();
  }
}
class X {
  constructor(t, e, i, o) {
    s(this, "_chart");
    s(this, "_series");
    s(this, "_defaultOptions");
    s(this, "_lines");
    s(this, "_previewLine");
    s(this, "_points", []);
    s(this, "_drawing", !1);
    s(this, "_onDrawingCompleteCallback");
    s(this, "_clickHandler", (t) => this._onClick(t));
    s(this, "_moveHandler", (t) => this._onMouseMove(t));
    s(this, "_dblClickHandler", (t) => this._onDblClick(t));
    this._chart = t, this._series = e, this._defaultOptions = i, this._onDrawingCompleteCallback = o, this._lines = [], this._chart.subscribeClick(this._clickHandler), this._chart.subscribeCrosshairMove(this._moveHandler), this._chart.subscribeDblClick(this._dblClickHandler);
  }
  get options() {
    return this._defaultOptions;
  }
  remove() {
    this._lines.forEach((t) => this._removeLine(t)), this.stopDrawing(), this._chart.unsubscribeClick(this._clickHandler), this._chart.unsubscribeCrosshairMove(this._moveHandler), this._lines.forEach((t) => {
      this._removeLine(t);
    }), this._lines = [], this._removePreviewLine(), this._chart.unsubscribeDblClick(this._dblClickHandler);
  }
  startDrawing() {
    this._drawing = !0, this._points = [];
  }
  stopDrawing() {
    this._drawing = !1, this._points = [], this._removePreviewLine();
  }
  isDrawing() {
    return this._drawing;
  }
  _onClick(t) {
    if (!this._drawing || !t.point || !t.time || !this._series) return;
    const e = this._series.coordinateToPrice(t.point.y);
    e !== null && this._addPoint({
      time: t.time,
      price: e
    });
  }
  _onMouseMove(t) {
    if (!this._drawing || !t.point || !t.time || !this._series) return;
    const e = this._series.coordinateToPrice(t.point.y);
    e !== null && this._previewLine && this._previewLine.updateEndPoint({
      time: t.time,
      price: e
    });
  }
  _onDblClick(t) {
    if (this._drawing) return;
    const e = t.hoveredObjectId;
    if (!e) return;
    const i = this._lines.findIndex((o) => o._id === e);
    if (i !== -1) {
      const o = this._lines[i];
      this._removeLine(o), this._lines.splice(i, 1);
    }
  }
  _addPoint(t) {
    this._points.push(t), this._points.length >= 2 && (this._addNewLine(this._points[0], this._points[1]), this.stopDrawing(), this._onDrawingCompleteCallback && this._onDrawingCompleteCallback()), this._points.length === 1 && this._addPreviewLine(this._points[0]);
  }
  _addNewLine(t, e) {
    const i = new R(t, e, { ...this._defaultOptions });
    this._lines.push(i), a(this._series).attachPrimitive(i);
  }
  _removeLine(t) {
    a(this._series).detachPrimitive(t);
  }
  _addPreviewLine(t) {
    this._previewLine = new j(t, t, {
      ...this._defaultOptions
    }), a(this._series).attachPrimitive(this._previewLine);
  }
  _removePreviewLine() {
    this._previewLine && (a(this._series).detachPrimitive(this._previewLine), this._previewLine = void 0);
  }
}
const g = class g {
  static getNextId() {
    return `${g._nextId++}`;
  }
};
s(g, "_nextId", 0);
let w = g;
class Z {
  constructor(t, e, i, o = {}, r = {}) {
    s(this, "_rectangleTool");
    s(this, "_lineTool");
    s(this, "_currentTool", null);
    s(this, "_drawingsToolbarContainer");
    s(this, "_rectangleButton");
    s(this, "_lineButton");
    s(this, "_activeButtonColor", "#000000");
    s(this, "_inactiveColor", "rgb(100, 100, 100)");
    s(this, "_selectedBaseColor", "#000000");
    s(this, "_currentOpacity", 0.35);
    this._drawingsToolbarContainer = i, this._rectangleTool = new N(
      t,
      e,
      o,
      this.stopDrawing.bind(this)
    ), this._lineTool = new X(
      t,
      e,
      r,
      this.stopDrawing.bind(this)
    ), this._selectedBaseColor = "#000000", this._currentOpacity = 0.35, this._activeButtonColor = this._selectedBaseColor, this._createToolbar(), this._updateDrawingToolColorsAndOpacity();
  }
  _createToolbar() {
    const t = document.createElement("div");
    t.style.width = "24px", t.style.height = "24px", t.style.cursor = "pointer", t.style.fill = this._inactiveColor, t.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.71,3.29a1,1,0,0,0-1.42,0L3.29,20.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0L21.71,4.71A1,1,0,0,0,21.71,3.29Z"/></svg>', t.addEventListener("click", () => this.selectLineTool()), this._drawingsToolbarContainer.appendChild(t), this._lineButton = t;
    const e = document.createElement("div");
    e.style.width = "24px", e.style.height = "24px", e.style.cursor = "pointer", e.style.fill = this._inactiveColor, e.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 2v20h20V2H2zm18 18H4V4h16v16z"/></svg>', e.addEventListener("click", () => this.selectRectangleTool()), this._drawingsToolbarContainer.appendChild(e), this._rectangleButton = e;
    const i = document.createElement("input");
    i.type = "color", i.value = this._selectedBaseColor, i.style.width = "24px", i.style.height = "24px", i.style.border = "none", i.style.padding = "0px", i.style.cursor = "pointer", i.style.backgroundColor = "transparent", i.addEventListener("input", () => {
      this._selectedBaseColor = i.value, this._activeButtonColor = this._selectedBaseColor, this._updateDrawingToolColorsAndOpacity(), this._updateButtonStyles();
    }), this._drawingsToolbarContainer.appendChild(i);
    const o = document.createElement("input");
    o.type = "range", o.min = "0", o.max = "1", o.step = "0.01", o.value = this._currentOpacity.toString(), o.style.width = "80px", o.addEventListener("input", () => {
      this._currentOpacity = parseFloat(o.value), this._updateDrawingToolColorsAndOpacity();
    }), this._drawingsToolbarContainer.appendChild(o);
  }
  _hexToRgba(t, e) {
    const i = parseInt(t.slice(1, 3), 16), o = parseInt(t.slice(3, 5), 16), r = parseInt(t.slice(5, 7), 16);
    return `rgba(${i}, ${o}, ${r}, ${e})`;
  }
  _updateDrawingToolColorsAndOpacity() {
    this._lineTool.options.lineColor = this._hexToRgba(this._selectedBaseColor, this._currentOpacity), this._lineTool.options.previewLineColor = this._hexToRgba(this._selectedBaseColor, this._currentOpacity * 0.5), this._lineTool.options.labelColor = this._selectedBaseColor, this._rectangleTool.options.fillColor = this._hexToRgba(this._selectedBaseColor, this._currentOpacity), this._rectangleTool.options.previewFillColor = this._hexToRgba(this._selectedBaseColor, this._currentOpacity * 0.5), this._rectangleTool.options.labelColor = this._selectedBaseColor;
  }
  selectRectangleTool() {
    if (this._currentTool === "rectangle") {
      this.stopDrawing();
      return;
    }
    this._stopAllDrawing(), this._currentTool = "rectangle", this._rectangleTool.startDrawing(), this._updateButtonStyles();
  }
  selectLineTool() {
    if (this._currentTool === "line") {
      this.stopDrawing();
      return;
    }
    this._stopAllDrawing(), this._currentTool = "line", this._lineTool.startDrawing(), this._updateButtonStyles();
  }
  stopDrawing() {
    this._stopAllDrawing(), this._currentTool = null, this._updateButtonStyles();
  }
  _stopAllDrawing() {
    this._rectangleTool.stopDrawing(), this._lineTool.stopDrawing();
  }
  _updateButtonStyles() {
    this._rectangleButton && (this._rectangleButton.style.fill = this._currentTool === "rectangle" ? this._activeButtonColor : this._inactiveColor), this._lineButton && (this._lineButton.style.fill = this._currentTool === "line" ? this._activeButtonColor : this._inactiveColor);
  }
  getCurrentTool() {
    return this._currentTool;
  }
  remove() {
    this.stopDrawing(), this._rectangleTool.remove(), this._lineTool.remove(), this._drawingsToolbarContainer.innerHTML = "";
  }
}
export {
  Z as DrawingTools,
  w as ShapeIdGenerator
};
