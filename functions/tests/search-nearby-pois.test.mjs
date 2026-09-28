import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadPoiSearchModule() {
  return import(path.join(repoRoot, "functions/lib/api/searchNearbyPois.js"));
}

test('post office discovery supports OSM nodes/ways but not mailboxes or closed branches', async()=>{
 const {extractNearbyPoiPins,buildPostOfficeQuery,postOfficeSearchCell}=await loadPoiSearchModule();
 const pois=extractNearbyPoiPins({elements:[
 {id:91,type:'node',lat:-38.45,lon:145.24,tags:{amenity:'post_office',name:'Post Office'}},
 {id:92,type:'way',center:{lat:-38.45,lon:145.24},tags:{amenity:'post_office',name:'Postal branch'}},
 {id:93,type:'node',lat:-38.45,lon:145.24,tags:{amenity:'post_box'}},
 {id:94,type:'node',lat:-38.45,lon:145.24,tags:{amenity:'post_office',disused:'yes'}}]});
 assert.equal(pois.length,2);assert.ok(pois.every(p=>p.subcategory==='Post Office'&&p.icon==='landmark'));
 assert.match(buildPostOfficeQuery(-38.45,145.24),/amenity"="post_office/);
 assert.deepEqual(postOfficeSearchCell(-38.451,145.241),postOfficeSearchCell(-38.452,145.242));
 assert.throws(()=>postOfficeSearchCell(NaN,0));
});

test("nearby POI search returns only supported, stable POI records", async () => {
  const { extractNearbyPoiPins } = await loadPoiSearchModule();
  const pois = extractNearbyPoiPins({
    elements: [
      {
        type: "way",
        id: 300,
        center: { lat: -38.45, lon: 145.24 },
        tags: { leisure: "park", name: "Cowes Park" }
      },
      {
        type: "node",
        id: 200,
        lat: -38.451,
        lon: 145.241,
        tags: { amenity: "place_of_worship", "name:en": "St Peter's" }
      },
      {
        type: "node",
        id: 0,
        lat: -38.452,
        lon: 145.242,
        tags: { leisure: "park" }
      },
      {
        type: "node",
        id: 400,
        lat: -38.453,
        lon: 145.243,
        tags: { amenity: "cafe" }
      }
    ]
  });

  assert.deepEqual(pois, [
    {
      id: "poi:osm:node:200",
      type: "poi",
      name: "St Peter's",
      category: "Places",
      subcategory: "Church",
      rarity: "normal",
      icon: "church",
      lat: -38.451,
      lng: 145.241,
      description: "Church from OpenStreetMap.",
      poiName: "St Peter's",
      poiCategory: "Church"
    },
    {
      id: "poi:osm:way:300",
      type: "poi",
      name: "Cowes Park",
      category: "Places",
      subcategory: "Park",
      rarity: "normal",
      icon: "park",
      lat: -38.45,
      lng: 145.24,
      description: "Park from OpenStreetMap.",
      poiName: "Cowes Park",
      poiCategory: "Park"
    }
  ]);
});

test("tourism POIs use the dedicated tourist pin artwork key", async () => {
  const { extractNearbyPoiPins } = await loadPoiSearchModule();
  const [poi] = extractNearbyPoiPins({
    elements: [
      {
        type: "node",
        id: 901,
        lat: -38.45,
        lon: 145.24,
        tags: { tourism: "viewpoint", name: "Cowes Lookout" }
      }
    ]
  });

  assert.equal(poi.category, "Tourist Attractions");
  assert.equal(poi.subcategory, "Local POI");
  assert.equal(poi.icon, "tourist");
});

test("historic POIs use the dedicated historic pin artwork key", async () => {
  const { extractNearbyPoiPins } = await loadPoiSearchModule();
  const [poi] = extractNearbyPoiPins({
    elements: [
      {
        type: "node",
        id: 902,
        lat: -38.451,
        lon: 145.241,
        tags: { historic: "tower", name: "Cowes Clock Tower" }
      }
    ]
  });

  assert.equal(poi.category, "Tourist Attractions");
  assert.equal(poi.subcategory, "Historic");
  assert.equal(poi.icon, "historic");
});

test("movie theaters are Land of Oz card-reward POIs", async () => {
  const { buildNearbyPoiQuery, extractNearbyPoiPins } = await loadPoiSearchModule();
  const query = buildNearbyPoiQuery(-38.45, 145.24);
  assert.match(query, /nwr\["amenity"="cinema"\]/);
  assert.match(query, /nwr\["building"="cinema"\]/);
  const pois = extractNearbyPoiPins({
    elements: [
      { type: "node", id: 9901, lat: -38.45, lon: 145.24, tags: { amenity: "cinema", name: "Island Cinema" } },
      { type: "way", id: 9902, center: { lat: -38.451, lon: 145.241 }, tags: { building: "cinema", name: "Town Picture Theatre" } }
    ]
  });
  assert.equal(pois.length, 2);
  assert.ok(pois.every((poi) => poi.subcategory === "Movie Theater" && poi.icon === "tourist"));
  assert.ok(pois.every((poi) => poi.cardRewardSetId === "land-of-oz"));
});

test("a city receives at most two major museum Special POIs with dinosaur card rewards", async () => {
  const { extractNearbyPoiPins } = await loadPoiSearchModule();
  const pois = extractNearbyPoiPins({
    elements: [
      {
        type: "node",
        id: 1001,
        lat: -38.15,
        lon: 145.12,
        tags: { tourism: "museum", name: "Phillip Island Museum", website: "https://example.test" }
      },
      {
        type: "node",
        id: 1002,
        lat: -38.151,
        lon: 145.121,
        tags: { tourism: "museum", name: "National Dinosaur Museum", wikidata: "Q123" }
      },
      {
        type: "node",
        id: 1003,
        lat: -38.152,
        lon: 145.122,
        tags: { tourism: "museum", name: "Local Gallery Museum" }
      }
    ]
  });

  const majorMuseums = pois.filter((poi) => poi.subcategory === "Major Museum");
  assert.equal(majorMuseums.length, 2);
  majorMuseums.forEach((poi) => {
    assert.equal(poi.category, "Special POIs");
    assert.equal(poi.rarity, "special");
    assert.equal(poi.icon, "museum");
    assert.equal(poi.cardRewardSetId, "dinosaur-discoveries");
  });
  assert.equal(pois.find((poi) => poi.id === "poi:osm:node:1003")?.subcategory, "Local POI");
});
