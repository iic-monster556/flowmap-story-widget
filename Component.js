// Component.js
class FlowMapStory extends HTMLElement {
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._div = document.createElement("div");
    this._div.style.width = "100%";
    this._div.style.height = "100%";
    this._root.appendChild(this._div);
    this._amroot = null;
  }

  disconnectedCallback() {
    if (this._amroot) this._amroot.dispose();
  }

  async onCustomWidgetAfterUpdate() {
    const ds = this.dataBindings?.getDataSource?.("flows");
    if (!ds) return this._renderMessage("Bind flows: source / target / value.");

    const table = await ds.getData(); // [{source, target, value}, ...] 형태로 들어온다고 가정
    const rows = table.data.map(r => ({
      s: (r.source || "").toString().trim(),
      t: (r.target || "").toString().trim(),
      v: Number(r.value || 0)
    })).filter(r => r.s && r.t && r.v > 0);

    if (!rows.length) return this._renderMessage("No data.");

    // ISO-3 -> ISO-2 간단 변환 (필요한 일부만 예시)
    const iso3to2 = { KOR:"KR", USA:"US", DEU:"DE", CHN:"CN", JPN:"JP", GBR:"GB", FRA:"FR" };
    rows.forEach(r => {
      if (r.s.length === 3) r.s = iso3to2[r.s] || r.s;
      if (r.t.length === 3) r.t = iso3to2[r.t] || r.t;
    });

    this._renderFlow(rows);
  }

  _renderMessage(msg) {
    this._root.innerHTML = `<div style="padding:8px;color:#666;font:12px sans-serif">${msg}</div>`;
  }

  _renderFlow(rows) {
    // amCharts v5
    const am5 = window.am5, am5map = window.am5map, am5geodata_worldLow = window.am5geodata_worldLow;
    if (!am5 || !am5map || !am5geodata_worldLow) return this._renderMessage("amCharts libs not found.");

    if (this._amroot) this._amroot.dispose();
    const root = this._amroot = am5.Root.new(this._div);

    const chart = root.container.children.push(am5map.MapChart.new(root, {
      panX: "none", panY: "none", wheelX: "none", wheelY: "none",
      projection: am5map.geoMercator()
    }));

    // 배경 국가
    const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow
    }));

    // 국가 중심 좌표 캐시
    const centroidByIso2 = {};
    const getCentroid = (iso2) => {
      if (centroidByIso2[iso2]) return centroidByIso2[iso2];
      const p = polygonSeries.getPolygonById?.(iso2);
      if (!p) return null;
      const c = p.geoCentroid();
      centroidByIso2[iso2] = c;
      return c;
    };

    // value 스케일
    const minV = Math.min(...rows.map(r => r.v));
    const maxV = Math.max(...rows.map(r => r.v));
    const scale = (v, a=1, b=5) => {
      if (maxV === minV) return (a+b)/2;
      return a + (b - a) * (v - minV) / (maxV - minV);
    };

    // 라인 시리즈
    const lineSeries = chart.series.push(am5map.MapLineSeries.new(root, {}));

    // 불릿(움직이는 점)
    const bulletSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));

    // 데이터 주입
    rows.forEach(r => {
      const c1 = getCentroid(r.s), c2 = getCentroid(r.t);
      if (!c1 || !c2) return;

      // 라인
      const line = lineSeries.pushDataItem({
        geometry: { type: "LineString", coordinates: [c1, c2] }
      });
      line.get("mapLine").setAll({
        strokeOpacity: 0.7,
        strokeWidth: scale(r.v, 1, 6)
      });

      // 이동하는 점 (라인을 따라 왕복)
      const pItem = bulletSeries.pushDataItem({ geometry: { type: "Point", coordinates: c1 } });
      const circle = am5.Circle.new(root, { radius: scale(r.v, 2, 6) });
      pItem.set("polygonTemplate", circle);

      const anim = () => {
        pItem.animate({
          key: "geometry",
          to: { type: "Point", coordinates: c2 },
          duration: 2000,
          loops: 0
        }).events.on("stopped", () => {
          pItem.animate({
            key: "geometry",
            to: { type: "Point", coordinates: c1 },
            duration: 2000,
            loops: 0
          }).events.on("stopped", anim);
        });
      };
      anim();
    });
  }
}

customElements.define("com-iic-flowmap-story", FlowMapStory);
