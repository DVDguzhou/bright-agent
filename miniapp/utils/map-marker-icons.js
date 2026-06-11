const OXBLOOD = "#7a1f1f";
const {
  resolveLifeAgentCoverDisplayUrl,
  isDefaultCoverUrl,
} = require("./covers");
const {
  SPIDERFY_MIN_SCALE,
  MAX_MAP_SCALE,
  spiderfyPositions,
  buildSpiderPolylines,
} = require("./map-spiderfy");

const CANVAS_EXPORT_DELAY_MS = 16;
const PROGRESS_EVERY = 4;

const iconCache = {};
const imageInfoCache = {};
let drawQueue = Promise.resolve();

function enqueueDraw(task) {
  drawQueue = drawQueue.then(task).catch(function () {});
  return drawQueue;
}

function canvasToFile(page, width, height) {
  return new Promise(function (resolve) {
    wx.canvasToTempFilePath(
      {
        canvasId: "mapIconCanvas",
        x: 0,
        y: 0,
        width: width,
        height: height,
        destWidth: width * 2,
        destHeight: height * 2,
        success: function (res) {
          resolve(res.tempFilePath || "");
        },
        fail: function () {
          resolve("");
        },
      },
      page
    );
  });
}

function resolveMapPinCoverUrl(agent) {
  const url = resolveLifeAgentCoverDisplayUrl(
    agent.coverUrl,
    agent.coverImageUrl,
    agent.coverPresetKey
  );
  if (!url || isDefaultCoverUrl(url) || url.indexOf(".svg") >= 0) {
    return "";
  }
  return url;
}

function loadImageInfo(url) {
  if (!url) return Promise.resolve(null);
  if (imageInfoCache[url]) return Promise.resolve(imageInfoCache[url]);
  return new Promise(function (resolve) {
    wx.getImageInfo({
      src: url,
      success: function (res) {
        imageInfoCache[url] = res;
        resolve(res);
      },
      fail: function () {
        resolve(null);
      },
    });
  });
}

function warmPinCoverCache(pins, limit) {
  if (!pins || pins.length === 0) return;
  const seen = {};
  const max = limit || 120;
  for (let i = 0; i < pins.length && i < max; i++) {
    const url = resolveMapPinCoverUrl(pins[i]);
    if (url && !seen[url]) {
      seen[url] = true;
      loadImageInfo(url);
    }
  }
}

function drawClusterIcon(page, count) {
  const label = count > 99 ? "99+" : String(count);
  const cacheKey = "cluster-" + label;
  if (iconCache[cacheKey]) {
    return Promise.resolve(iconCache[cacheKey]);
  }

  return enqueueDraw(function () {
    return new Promise(function (resolve) {
      const dia = 36;
      const tip = 10;
      const w = dia;
      const h = dia + tip;
      const ctx = wx.createCanvasContext("mapIconCanvas", page);
      ctx.clearRect(0, 0, w, h);

      ctx.setFillStyle(OXBLOOD);
      ctx.beginPath();
      ctx.arc(dia / 2, dia / 2, dia / 2, 0, 2 * Math.PI);
      ctx.fill();

      ctx.setFillStyle("rgba(255,255,255,0.94)");
      ctx.beginPath();
      ctx.arc(dia / 2, dia / 2, (dia - 8) / 2, 0, 2 * Math.PI);
      ctx.fill();

      ctx.setFillStyle(OXBLOOD);
      ctx.setFontSize(count > 99 ? 11 : count > 9 ? 13 : 14);
      ctx.setTextAlign("center");
      ctx.setTextBaseline("middle");
      ctx.fillText(label, dia / 2, dia / 2 + 1);

      ctx.beginPath();
      ctx.moveTo(dia / 2 - tip * 0.55, dia);
      ctx.lineTo(dia / 2 + tip * 0.55, dia);
      ctx.lineTo(dia / 2, h);
      ctx.closePath();
      ctx.fill();

      ctx.draw(false, function () {
        setTimeout(function () {
          canvasToFile(page, w, h).then(function (path) {
            if (path) iconCache[cacheKey] = path;
            resolve(path);
          });
        }, CANVAS_EXPORT_DELAY_MS);
      });
    });
  });
}

function drawAvatarFallback(ctx, agent, dia, ring, color) {
  const initial = (agent.displayName || "A").charAt(0);
  ctx.setFillStyle("#ffffff");
  ctx.beginPath();
  ctx.arc(dia / 2, dia / 2, dia / 2 - ring / 2, 0, 2 * Math.PI);
  ctx.fill();

  ctx.setStrokeStyle(color);
  ctx.setLineWidth(ring);
  ctx.beginPath();
  ctx.arc(dia / 2, dia / 2, dia / 2 - ring, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.setFillStyle(color);
  ctx.beginPath();
  ctx.arc(dia / 2, dia / 2, dia / 2 - ring - 3, 0, 2 * Math.PI);
  ctx.fill();

  ctx.setFillStyle("#f4efe6");
  ctx.setFontSize(dia >= 38 ? 16 : 13);
  ctx.setTextAlign("center");
  ctx.setTextBaseline("middle");
  ctx.fillText(initial, dia / 2, dia / 2 + 1);
}

function drawAvatarPinIcon(page, agent, highlight, preloadedInfo) {
  const color = (agent && agent.catColor) || OXBLOOD;
  const coverUrl = resolveMapPinCoverUrl(agent);
  const cacheKey =
    "avatar-" +
    agent.id +
    (highlight ? "-hi" : "") +
    "-" +
    (coverUrl ? coverUrl.slice(-24) : "fallback");
  if (iconCache[cacheKey]) {
    return Promise.resolve(iconCache[cacheKey]);
  }

  const ring = highlight ? 3 : 2.5;
  const dia = highlight ? 38 : 30;
  const tip = highlight ? 10 : 8;
  const w = dia;
  const h = dia + tip;

  const infoPromise =
    preloadedInfo !== undefined
      ? Promise.resolve(preloadedInfo)
      : loadImageInfo(coverUrl);

  return infoPromise.then(function (info) {
    return enqueueDraw(function () {
      return new Promise(function (resolve) {
        const ctx = wx.createCanvasContext("mapIconCanvas", page);
        ctx.clearRect(0, 0, w, h);

        if (!info || !info.path) {
          drawAvatarFallback(ctx, agent, dia, ring, color);
        } else {
          ctx.setFillStyle("#ffffff");
          ctx.beginPath();
          ctx.arc(dia / 2, dia / 2, dia / 2 - ring / 2, 0, 2 * Math.PI);
          ctx.fill();

          ctx.save();
          ctx.beginPath();
          ctx.arc(dia / 2, dia / 2, dia / 2 - ring - 1, 0, 2 * Math.PI);
          ctx.clip();
          ctx.drawImage(
            info.path,
            ring + 1,
            ring + 1,
            dia - (ring + 1) * 2,
            dia - (ring + 1) * 2
          );
          ctx.restore();

          ctx.setStrokeStyle(color);
          ctx.setLineWidth(ring);
          ctx.beginPath();
          ctx.arc(dia / 2, dia / 2, dia / 2 - ring, 0, 2 * Math.PI);
          ctx.stroke();
        }

        ctx.setFillStyle(color);
        ctx.beginPath();
        ctx.moveTo(dia / 2 - tip * 0.6, dia - ring / 2);
        ctx.lineTo(dia / 2 + tip * 0.6, dia - ring / 2);
        ctx.lineTo(dia / 2, h);
        ctx.closePath();
        ctx.fill();

        ctx.draw(false, function () {
          setTimeout(function () {
            canvasToFile(page, w, h).then(function (path) {
              if (path) iconCache[cacheKey] = path;
              resolve(path);
            });
          }, CANVAS_EXPORT_DELAY_MS);
        });
      });
    });
  });
}

function clusterRadiusDegrees(scale, lat) {
  const s = Number(scale) || 5;
  const latRad = ((lat !== undefined ? lat : 35) * Math.PI) / 180;
  const metersPerPixel =
    (156543.03392 * Math.cos(latRad)) / Math.pow(2, s);
  return Math.max((45 * metersPerPixel) / 111320, 0.00012);
}

function distDeg(a, b) {
  const cosLat = Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180)) || 1;
  const dLat = a.lat - b.lat;
  const dLng = (a.lng - b.lng) * cosLat;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

function clusterWithCell(agents, cell) {
  const buckets = {};
  agents.forEach(function (a) {
    const key = Math.floor(a.lat / cell) + ":" + Math.floor(a.lng / cell);
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(a);
  });

  const groups = [];
  Object.keys(buckets).forEach(function (key) {
    const list = buckets[key];
    if (list.length === 1) {
      groups.push({
        kind: "single",
        agent: list[0],
        lat: list[0].lat,
        lng: list[0].lng,
        agents: list,
        count: 1,
      });
      return;
    }
    let latSum = 0;
    let lngSum = 0;
    list.forEach(function (a) {
      latSum += a.lat;
      lngSum += a.lng;
    });
    groups.push({
      kind: "cluster",
      agent: null,
      count: list.length,
      agents: list,
      lat: latSum / list.length,
      lng: lngSum / list.length,
    });
  });
  return groups;
}

function clusterByGrid(agents, scale, maxGroups) {
  if (!agents || agents.length === 0) return [];
  const limit = maxGroups || 100;
  let cell = clusterRadiusDegrees(
    scale,
    agents.reduce(function (s, a) {
      return s + a.lat;
    }, 0) / agents.length
  );
  let groups = clusterWithCell(agents, cell);
  let guard = 0;
  while (groups.length > limit && guard < 12) {
    cell *= 1.45;
    groups = clusterWithCell(agents, cell);
    guard++;
  }
  if (groups.length > limit) {
    groups.sort(function (a, b) {
      return (b.count || 1) - (a.count || 1);
    });
    groups = groups.slice(0, limit);
  }
  return groups;
}

function clusterByPixelRadius(agents, scale, maxGroups) {
  if (!agents || agents.length === 0) return [];
  const limit = maxGroups || 100;
  const avgLat =
    agents.reduce(function (sum, a) {
      return sum + a.lat;
    }, 0) / agents.length;
  const radius = clusterRadiusDegrees(scale, avgLat);
  const remaining = agents.slice();
  const groups = [];

  while (remaining.length > 0 && groups.length < limit) {
    const seed = remaining.shift();
    const members = [seed];
    let latSum = seed.lat;
    let lngSum = seed.lng;
    let i = 0;
    while (i < remaining.length) {
      const cLat = latSum / members.length;
      const cLng = lngSum / members.length;
      if (distDeg(remaining[i], { lat: cLat, lng: cLng }) <= radius) {
        const picked = remaining.splice(i, 1)[0];
        members.push(picked);
        latSum += picked.lat;
        lngSum += picked.lng;
      } else {
        i++;
      }
    }
    if (members.length === 1) {
      groups.push({
        kind: "single",
        agent: members[0],
        agents: members,
        count: 1,
        lat: members[0].lat,
        lng: members[0].lng,
      });
    } else {
      groups.push({
        kind: "cluster",
        agent: null,
        agents: members,
        count: members.length,
        lat: latSum / members.length,
        lng: lngSum / members.length,
      });
    }
  }

  if (remaining.length > 0) {
    groups.sort(function (a, b) {
      return (b.count || 1) - (a.count || 1);
    });
    while (remaining.length > 0 && groups.length >= limit) {
      groups.pop();
    }
    while (remaining.length > 0 && groups.length < limit) {
      const seed = remaining.shift();
      groups.push({
        kind: "single",
        agent: seed,
        agents: [seed],
        count: 1,
        lat: seed.lat,
        lng: seed.lng,
      });
    }
  }

  return groups;
}

function clusterAgents(agents, scale, maxGroups) {
  if (!agents || agents.length === 0) return [];
  if (agents.length >= 120) {
    return clusterByGrid(agents, scale, maxGroups);
  }
  return clusterByPixelRadius(agents, scale, maxGroups);
}

function shouldSpiderfy(scale) {
  return (Number(scale) || 0) >= SPIDERFY_MIN_SCALE;
}

function makeMarker(id, lat, lng, iconPath, highlighted, zIndex) {
  const w = highlighted ? 38 : 30;
  const h = highlighted ? 48 : 38;
  const marker = {
    id: id,
    latitude: lat,
    longitude: lng,
    width: w,
    height: h,
    anchor: { x: 0.5, y: 1 },
    zIndex: zIndex != null ? zIndex : highlighted ? 9999 : 1,
  };
  if (iconPath) marker.iconPath = iconPath;
  return marker;
}

function buildMapMarkers(page, agents, highlightId, scale, maxGroups, options) {
  options = options || {};
  const onProgress = options.onProgress;
  const groups = clusterAgents(agents, scale, maxGroups);
  const spiderfy = shouldSpiderfy(scale);
  const markerGroups = [];
  const spiderLines = [];
  const drawJobs = [];
  let markerId = 0;
  let lineId = 0;

  groups.forEach(function (group) {
    if (spiderfy && group.count > 1) {
      const positions = spiderfyPositions(
        group.lat,
        group.lng,
        group.agents,
        scale
      );
      const lines = buildSpiderPolylines(
        group.lat,
        group.lng,
        positions,
        lineId
      );
      lineId += lines.length;
      spiderLines.push.apply(spiderLines, lines);

      positions.forEach(function (pos) {
        const idx = markerId++;
        markerGroups[idx] = {
          kind: "single",
          agent: pos.agent,
          agents: [pos.agent],
          count: 1,
        };
        drawJobs.push({
          kind: "avatar",
          idx: idx,
          agent: pos.agent,
          lat: pos.lat,
          lng: pos.lng,
          highlighted: Boolean(
            highlightId && pos.agent && pos.agent.id === highlightId
          ),
        });
      });
      return;
    }

    if (group.kind === "cluster") {
      const idx = markerId++;
      markerGroups[idx] = {
        kind: "cluster",
        agents: group.agents,
        count: group.count,
        lat: group.lat,
        lng: group.lng,
      };
      drawJobs.push({
        kind: "cluster",
        idx: idx,
        count: group.count,
        lat: group.lat,
        lng: group.lng,
      });
      return;
    }

    const agent = group.agent;
    const idx = markerId++;
    markerGroups[idx] = {
      kind: "single",
      agent: agent,
      agents: group.agents,
      count: 1,
    };
    drawJobs.push({
      kind: "avatar",
      idx: idx,
      agent: agent,
      lat: group.lat,
      lng: group.lng,
      highlighted: Boolean(highlightId && agent && agent.id === highlightId),
    });
  });

  const markers = new Array(markerId);
  let doneCount = 0;

  function emitProgress(force) {
    if (!onProgress) return;
    if (!force && doneCount % PROGRESS_EVERY !== 0) return;
    onProgress({
      markers: markers.filter(function (m) {
        return m != null;
      }),
      markerGroups: markerGroups,
      spiderLines: spiderLines,
    });
  }

  function resultPayload() {
    return {
      markers: markers.filter(function (m) {
        return m != null;
      }),
      markerGroups: markerGroups,
      spiderLines: spiderLines,
    };
  }

  if (drawJobs.length === 0) {
    return Promise.resolve(resultPayload());
  }

  const avatarJobs = drawJobs.filter(function (j) {
    return j.kind === "avatar";
  });
  const preloadUrls = {};
  avatarJobs.forEach(function (job) {
    const url = resolveMapPinCoverUrl(job.agent);
    if (url) preloadUrls[url] = true;
  });

  return Promise.all(
    Object.keys(preloadUrls).map(function (url) {
      return loadImageInfo(url).then(function (info) {
        return { url: url, info: info };
      });
    })
  )
    .then(function (loaded) {
      const infoByUrl = {};
      loaded.forEach(function (item) {
        infoByUrl[item.url] = item.info;
      });

      let chain = Promise.resolve();
      drawJobs.forEach(function (job) {
        chain = chain.then(function () {
          if (job.kind === "cluster") {
            return drawClusterIcon(page, job.count).then(function (iconPath) {
              markers[job.idx] = {
                id: job.idx,
                latitude: job.lat,
                longitude: job.lng,
                width: 36,
                height: 46,
                anchor: { x: 0.5, y: 1 },
                zIndex: job.count,
                iconPath: iconPath || "",
              };
            });
          }

          const coverUrl = resolveMapPinCoverUrl(job.agent);
          return drawAvatarPinIcon(
            page,
            job.agent,
            job.highlighted,
            infoByUrl[coverUrl]
          ).then(function (iconPath) {
            markers[job.idx] = makeMarker(
              job.idx,
              job.lat,
              job.lng,
              iconPath,
              job.highlighted,
              job.highlighted ? 9999 : 1
            );
          });
        }).then(function () {
          doneCount++;
          emitProgress(false);
        });
      });

      return chain.then(function () {
        emitProgress(true);
        return resultPayload();
      });
    });
}

module.exports = {
  SPIDERFY_MIN_SCALE,
  MAX_MAP_SCALE,
  clusterAgents,
  buildMapMarkers,
  shouldSpiderfy,
  warmPinCoverCache,
};
