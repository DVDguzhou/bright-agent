const { buildAreaLabel, formatYuan } = require("../../utils/format");
const { lifeAgentShowsPurchaseUi } = require("../../utils/commerce");
const { cleanLifeAgentIntroText } = require("../../utils/intro-clean");
const {
  resolveLifeAgentCoverDisplayUrl,
  nextCoverFallback,
} = require("../../utils/covers");

function normalizeClaim(agent) {
  const claim = (agent && agent.claim) || {};
  const status = claim.status === "claimed" ? "claimed" : "unclaimed";
  return {
    claimStatus: status,
    claimLabel: claim.label || (status === "claimed" ? "已认领" : "未认领"),
    isClaimed: status === "claimed",
  };
}

Component({
  properties: {
    agent: { type: Object, value: {} },
    showPulse: { type: Boolean, value: false },
  },
  observers: {
    agent: function (agent) {
      if (!agent || !agent.id) return;
      const ratings = agent.ratings || {};
      const ratingScore =
        ratings.raters > 0 ? Number(ratings.averageScore).toFixed(1) : null;
      const area = buildAreaLabel(agent.city, agent.province);
      const creator = (agent.creator && agent.creator.name) || "佚";
      let metaText = [area || null, creator].filter(Boolean).join(" · ") || "佚";
      if (ratingScore) metaText += ` · ${ratingScore}★`;

      const displayName = agent.displayName || "";
      const headline = cleanLifeAgentIntroText(
        agent.headline || agent.shortBio || "",
        displayName
      );

      const sampleQuestions = (agent.sampleQuestions || [])
        .map((q) => cleanLifeAgentIntroText(String(q), displayName))
        .filter(Boolean)
        .slice(0, 2);

      const coverFull =
        agent.coverFull ||
        resolveLifeAgentCoverDisplayUrl(
          agent.coverUrl,
          agent.coverImageUrl,
          agent.coverPresetKey
        );
      const claim = normalizeClaim(agent);

      this.setData({
        id: agent.id,
        displayName,
        headline,
        coverFull,
        claimStatus: claim.claimStatus,
        claimLabel: claim.claimLabel,
        isClaimed: claim.isClaimed,
        verified: agent.verificationStatus === "verified",
        mindScore: typeof agent.mindScore === "number" ? agent.mindScore : null,
        sampleQuestions,
        metaText,
        showPrice: lifeAgentShowsPurchaseUi(),
        priceYuan: formatYuan(agent.pricePerQuestion),
      });
    },
  },
  data: {
    id: "",
    displayName: "",
    headline: "",
    coverFull: "",
    claimStatus: "unclaimed",
    claimLabel: "未认领",
    isClaimed: false,
    verified: false,
    mindScore: null,
    sampleQuestions: [],
    metaText: "",
    showPrice: false,
    priceYuan: "0",
  },
  methods: {
    onTap() {
      const id = this.data.id || (this.properties.agent && this.properties.agent.id);
      if (id) this.triggerEvent("tapcard", { id });
    },
    onCoverError() {
      const next = nextCoverFallback(this.data.coverFull);
      if (next !== this.data.coverFull) {
        this.setData({ coverFull: next });
      }
    },
  },
});
