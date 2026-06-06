const { ratingStars } = require("../../utils/format");

Component({
  properties: {
    score: { type: Number, value: 0 },
    size: { type: String, value: "md" },
  },
  observers: {
    score: function (s) {
      this.setData({ starsText: ratingStars(s) });
    },
  },
  data: { starsText: "☆☆☆☆☆" },
  lifetimes: {
    attached() {
      this.setData({ starsText: ratingStars(this.properties.score) });
    },
  },
});
