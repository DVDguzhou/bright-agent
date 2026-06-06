Component({
  properties: {
    value: { type: Number, value: 0 },
    size: { type: String, value: "sm" },
    prefix: { type: String, value: "心智" },
  },
  observers: {
    "value, prefix": function () {
      this.updateLabel();
    },
  },
  data: { label: "" },
  lifetimes: {
    attached() {
      this.updateLabel();
    },
  },
  methods: {
    updateLabel() {
      const v = this.properties.value || 0;
      const prefix = this.properties.prefix;
      const formatted = v.toLocaleString ? v.toLocaleString("zh-CN") : String(v);
      this.setData({ label: prefix ? `${prefix} ${formatted}` : formatted });
    },
  },
});
