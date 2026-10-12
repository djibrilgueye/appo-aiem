import L from "leaflet"

/** Presentation only: the existing African GeoJSON and business layers are retained. */
export const AFRICA_COLORS = {
  ocean: "#E3EDF2",
  countryDefault: "#557F98",
  countryMemberOff: "#B8CCD7",
  countryNonMember: "#F5F4EE",
  countryHover: "#386781",
  countrySelected: "#123E58",
  countrySelectedH: "#123E58",
  border: "#BFCFD5",
  borderInRegion: "#E5EEF1",
  borderHover: "#E4B45E",
}

export function addAfricaReference(map: L.Map, geo: GeoJSON.GeoJsonObject) {
  const gridPane = map.createPane("africa-grid")
  gridPane.style.zIndex = "180"
  gridPane.style.pointerEvents = "none"
  const coastPane = map.createPane("africa-coast")
  coastPane.style.zIndex = "350"
  coastPane.style.pointerEvents = "none"
  const reference = L.layerGroup().addTo(map)
  const gridStyle: L.PolylineOptions = {
    pane: "africa-grid", interactive: false, color: "#94B1C0",
    weight: 0.6, opacity: 0.25, dashArray: "2 6",
  }
  for (let lat = -50; lat <= 40; lat += 10) {
    L.polyline([[lat, -40], [lat, 80]], gridStyle).addTo(reference)
  }
  for (let lon = -40; lon <= 80; lon += 10) {
    L.polyline([[-55, lon], [45, lon]], gridStyle).addTo(reference)
  }
  // A coastal halo, following the real polygons; no simulated depth contours.
  L.geoJSON(geo, {
    pane: "africa-coast", interactive: false,
    style: { fill: false, color: "#FFFFFF", opacity: 0.65, weight: 6, lineJoin: "round" },
  }).addTo(reference)
  map.attributionControl.addAttribution("Contours : référentiel AIEM")
  return reference
}

export function addOceanLabels(map: L.Map, lang: string) {
  const names: Record<string, [string, string]> = {
    fr: ["Océan Atlantique", "Océan Indien"],
    en: ["Atlantic Ocean", "Indian Ocean"],
    es: ["Océano Atlántico", "Océano Índico"],
    pt: ["Oceano Atlântico", "Oceano Índico"],
    ar: ["المحيط الأطلسي", "المحيط الهندي"],
  }
  const labels = L.layerGroup().addTo(map)
  const positions: L.LatLngTuple[] = [[-15, -12], [-14, 63]]
  ;(names[lang] ?? names.fr).forEach((name, index) => {
    L.marker(positions[index], {
      pane: "africa-grid", interactive: false,
      icon: L.divIcon({ className: "aiem-ocean-name", html: `<span>${name}</span>`, iconSize: [156, 20], iconAnchor: [78, 10] }),
    }).addTo(labels)
  })
  return labels
}

export function installAfricaViewport(map: L.Map, bounds: L.LatLngBounds) {
  // Frame the mainland and Madagascar prominently. Outlying archipelagos and
  // southern islands remain in the map and within the permitted pan/zoom area.
  const overviewBounds = L.latLngBounds(
    [Math.max(bounds.getSouth(), -35.5), Math.max(bounds.getWest(), -18)],
    [Math.min(bounds.getNorth(), 37.6), Math.min(bounds.getEast(), 51.5)],
  )
  let overviewZoom = map.getZoom()
  let fullExtentZoom = 0
  let frame: number | null = null
  const fitOptions = () => ({
    paddingTopLeft: L.point(map.getSize().x < 600 ? 12 : 24, 18),
    paddingBottomRight: L.point(map.getSize().x < 600 ? 12 : 24, 78),
    animate: false,
  })
  const updateMinimum = () => {
    const { paddingTopLeft, paddingBottomRight } = fitOptions()
    // getBoundsZoom clamps to the existing minimum. Release that minimum first
    // so a smaller viewport can actually zoom out far enough to fit Africa.
    map.setMinZoom(0)
    const padding = paddingTopLeft.add(paddingBottomRight)
    fullExtentZoom = map.getBoundsZoom(bounds, false, padding)
    overviewZoom = map.getBoundsZoom(overviewBounds, false, padding)
    map.setMinZoom(fullExtentZoom)
  }
  const fit = () => {
    updateMinimum()
    map.fitBounds(overviewBounds, fitOptions())
  }
  // Every polygon remains accessible, including the southern islands of South Africa.
  map.setMaxBounds(bounds.pad(0.12))
  fit()

  const Recenter = L.Control.extend({
    options: { position: "topright" as L.ControlPosition },
    onAdd() {
      const box = L.DomUtil.create("div", "leaflet-bar aiem-africa-reset")
      const button = L.DomUtil.create("button", "", box)
      button.type = "button"
      button.title = "Recentrer sur l’Afrique"
      button.setAttribute("aria-label", "Recentrer sur l’Afrique")
      button.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="6"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>'
      L.DomEvent.disableClickPropagation(box)
      L.DomEvent.disableScrollPropagation(box)
      L.DomEvent.on(button, "click", fit)
      return box
    },
  })
  const recenter = new Recenter().addTo(map)
  const container = map.getContainer()
  const resize = () => {
    if (frame !== null) return
    frame = requestAnimationFrame(() => {
      frame = null
      const showingOverview = Math.abs(map.getZoom() - overviewZoom) < 0.11
      const showingFullExtent = !showingOverview && map.getZoom() <= fullExtentZoom + 0.01
      map.invalidateSize({ pan: false })
      updateMinimum()
      if (showingOverview) map.fitBounds(overviewBounds, fitOptions())
      else if (showingFullExtent) map.fitBounds(bounds, fitOptions())
      else map.panInsideBounds(bounds.pad(0.12), { animate: false })
    })
  }
  const observer = new ResizeObserver(resize)
  observer.observe(container)
  return () => {
    observer.disconnect()
    if (frame !== null) cancelAnimationFrame(frame)
    recenter.remove()
  }
}
