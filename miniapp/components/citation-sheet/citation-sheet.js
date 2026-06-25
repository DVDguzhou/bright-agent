const { sourceTypeLabel } = require("../../utils/citations");

Component({
  properties: {
    open: { type: Boolean, value: false },
    references: { type: Array, value: [] },
    activeCiteIndex: { type: Number, value: 0 },
  },
  data: {
    primary: null,
    others: [],
  },
  observers: {
    "references, activeCiteIndex": function () {
      this.syncRefs();
    },
  },
  methods: {
    syncRefs() {
      const refs = (this.properties.references || []).slice().sort(function (a, b) {
        return (parseInt(a.citeIndex, 10) || 999) - (parseInt(b.citeIndex, 10) || 999);
      });
      if (!refs.length) {
        this.setData({ primary: null, others: [] });
        return;
      }
      const active = refs.find(function (r) {
        return parseInt(r.citeIndex, 10) === parseInt(this.properties.activeCiteIndex, 10);
      }, this) || refs[0];
      const others = refs.filter(function (r) {
        return r.id !== active.id;
      }).map(function (r) {
        return Object.assign({}, r, {
          typeLabel: sourceTypeLabel(r.sourceType, r.sourceTypeLabel),
        });
      });
      this.setData({
        primary: Object.assign({}, active, {
          typeLabel: sourceTypeLabel(active.sourceType, active.sourceTypeLabel),
        }),
        others,
      });
    },
    close() {
      this.triggerEvent("close");
    },
    noop() {},
  },
});
