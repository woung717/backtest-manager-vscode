var p = Object.defineProperty;
var v = (s, t, i) => t in s ? p(s, t, { enumerable: !0, configurable: !0, writable: !0, value: i }) : s[t] = i;
var r = (s, t, i) => v(s, typeof t != "symbol" ? t + "" : t, i);
import { CrosshairMode as f, LineStyle as b } from "lightweight-charts";
function _(s) {
  if (s === void 0)
    throw new Error("Value is undefined");
  return s;
}
class P {
  constructor() {
    r(this, "_chart");
    r(this, "_series");
    r(this, "_requestUpdate");
    // This method is a class property to maintain the
    // lexical 'this' scope (due to the use of the arrow function)
    // and to ensure its reference stays the same, so we can unsubscribe later.
    r(this, "_fireDataUpdated", (t) => {
      this.dataUpdated && this.dataUpdated(t);
    });
  }
  requestUpdate() {
    this._requestUpdate && this._requestUpdate();
  }
  attached({ chart: t, series: i, requestUpdate: e }) {
    this._chart = t, this._series = i, this._series.subscribeDataChanged(this._fireDataUpdated), this._requestUpdate = e, this.requestUpdate();
  }
  detached() {
    var t;
    (t = this._series) == null || t.unsubscribeDataChanged(this._fireDataUpdated), this._chart = void 0, this._series = void 0, this._requestUpdate = void 0;
  }
  get chart() {
    return _(this._chart);
  }
  get series() {
    return _(this._series);
  }
}
function C(s) {
  return Math.floor(s * 0.5);
}
function m(s, t, i = 1, e) {
  const o = Math.round(t * s), n = Math.round(i * t), a = C(n);
  return { position: o - a, length: n };
}
function g(s, t, i) {
  const e = Math.round(i * s), o = Math.round(i * t);
  return {
    position: Math.min(e, o),
    length: Math.abs(o - e) + 1
  };
}
const l = 21, w = "M7.5,7.5 m -7,0 a 7,7 0 1,0 14,0 a 7,7 0 1,0 -14,0 M4 7.5H11 M7.5 4V11", M = new Path2D(w), L = 15;
class U {
  constructor(t) {
    r(this, "_y", 0);
    r(this, "_data");
    this._data = t;
  }
  update(t, i) {
    if (this._data = t, !this._data.price) {
      this._y = -1e4;
      return;
    }
    this._y = i.priceToCoordinate(this._data.price) ?? -1e4;
  }
}
class x {
  constructor(t) {
    r(this, "_data");
    this._data = t;
  }
  draw(t) {
    this._data.visible && t.useBitmapCoordinateSpace((i) => {
      const e = i.context, o = l, n = o + 1, a = g(this._data.rightX - n, this._data.rightX - 1, i.horizontalPixelRatio), h = m(this._data.y, i.verticalPixelRatio, o);
      e.fillStyle = this._data.color;
      const c = [5, 0, 0, 5].map((u) => u * i.horizontalPixelRatio);
      e.beginPath(), e.roundRect(a.position, h.position, a.length, h.length, c), e.fill(), this._data.hovered && (e.fillStyle = this._data.hoverColor, e.beginPath(), e.roundRect(a.position, h.position, a.length, h.length, c), e.fill()), e.translate(a.position + 3 * i.horizontalPixelRatio, h.position + 3 * i.verticalPixelRatio), e.scale(i.horizontalPixelRatio, i.verticalPixelRatio);
      const d = 15 / L;
      e.scale(d, d), e.strokeStyle = this._data.textColor, e.lineWidth = 1, e.stroke(M);
    });
  }
}
class S extends U {
  renderer() {
    const t = this._data.crosshairColor;
    return new x({
      visible: this._data.visible,
      y: this._y,
      color: t,
      textColor: this._data.crosshairLabelColor,
      rightX: this._data.timeScaleWidth,
      hoverColor: this._data.hoverColor,
      hovered: this._data.hovered ?? !1
    });
  }
  zOrder() {
    return "top";
  }
}
class B extends P {
  constructor(i) {
    super();
    r(this, "_paneViews");
    r(this, "_data", {
      visible: !1,
      hovered: !1,
      timeScaleWidth: 0,
      crosshairLabelColor: "#000000",
      crosshairColor: "#ffffff",
      lineColor: "#000000",
      hoverColor: "#777777"
    });
    r(this, "_source");
    this._paneViews = [new S(this._data)], this._source = i;
  }
  updateAllViews() {
    this._paneViews.forEach((i) => i.update(this._data, this.series));
  }
  priceAxisViews() {
    return [];
  }
  paneViews() {
    return this._paneViews;
  }
  showAddLabel(i, e) {
    const o = this.chart.options().crosshair.horzLine.labelBackgroundColor;
    this._data = {
      visible: !0,
      price: i,
      hovered: e,
      timeScaleWidth: this.chart.timeScale().width(),
      crosshairColor: o,
      crosshairLabelColor: "#FFFFFF",
      lineColor: this._source.currentLineColor(),
      hoverColor: this._source.currentHoverColor()
    }, this.updateAllViews(), this.requestUpdate();
  }
  hideAddLabel() {
    this._data.visible = !1, this.updateAllViews(), this.requestUpdate();
  }
}
const y = {
  color: "#000000",
  hoverColor: "#777777",
  limitToOne: !0
};
class H {
  constructor(t, i, e) {
    r(this, "_chart");
    r(this, "_series");
    r(this, "_options");
    r(this, "_labelButtonPrimitive");
    r(this, "_clickHandler", (t) => this._onClick(t));
    r(this, "_moveHandler", (t) => this._onMouseMove(t));
    this._chart = t, this._series = i, this._options = {
      ...y,
      ...e
    }, this._chart.subscribeClick(this._clickHandler), this._chart.subscribeCrosshairMove(this._moveHandler), this._labelButtonPrimitive = new B(this), i.attachPrimitive(this._labelButtonPrimitive), this._setCrosshairMode();
  }
  currentLineColor() {
    return this._options.color;
  }
  currentHoverColor() {
    return this._options.hoverColor;
  }
  // We need to disable magnet mode for this to work nicely
  _setCrosshairMode() {
    if (!this._chart)
      throw new Error(
        "Unable to change crosshair mode because the chart instance is undefined"
      );
    this._chart.applyOptions({
      crosshair: {
        mode: f.Normal
      }
    });
  }
  remove() {
    this._chart && (this._chart.unsubscribeClick(this._clickHandler), this._chart.unsubscribeCrosshairMove(this._moveHandler)), this._series && this._labelButtonPrimitive && this._series.detachPrimitive(this._labelButtonPrimitive), this._chart = void 0, this._series = void 0;
  }
  _onClick(t) {
    const i = this._getMousePrice(t), e = this._distanceFromRightScale(t);
    i === null || e === null || e > l || !this._series || this._series.createPriceLine({
      price: i,
      color: this._options.color,
      lineStyle: b.Dashed
    });
  }
  _onMouseMove(t) {
    const i = this._getMousePrice(t), e = this._distanceFromRightScale(t);
    if (i === null || e === null || e > l * 2) {
      this._labelButtonPrimitive.hideAddLabel();
      return;
    }
    this._labelButtonPrimitive.showAddLabel(i, e < l);
  }
  _getMousePrice(t) {
    return !t.point || !this._series ? null : this._series.coordinateToPrice(t.point.y);
  }
  _distanceFromRightScale(t) {
    if (!t.point || !this._chart) return null;
    const i = this._chart.timeScale().width();
    return Math.abs(i - t.point.x);
  }
}
export {
  H as UserPriceLines
};
