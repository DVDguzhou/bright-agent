Component({
  properties: {
    open: { type: Boolean, value: false },
  },
  methods: {
    onDismiss() {
      this.triggerEvent("dismiss");
    },
    noop() {},
  },
});
