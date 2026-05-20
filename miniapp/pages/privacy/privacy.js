const privacy = require("../../utils/privacy-content");

Page({
  data: {
    effectiveDate: privacy.effectiveDate,
    siteUrl: privacy.siteUrl,
    sections: privacy.sections,
  },
});
