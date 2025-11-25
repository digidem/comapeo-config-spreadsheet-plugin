import fs from "node:fs";

function isoVersion(): string {
  const d = new Date();
  return d.toISOString().slice(2, 10).replace(/-/g, '.'); // yy.MM.dd
}

const version = isoVersion();

const payload = {
  metadata: {
    name: "Sample Config",
    version,
    description: "Fixture for API smoke tests",
    builderName: "comapeo-config-spreadsheet-plugin",
    builderVersion: "2.0.0"
  },
  locales: ["en"],
  categories: [
    {
      id: "animal",
      name: "Animal",
      appliesTo: ["observation"],
      color: "#6BCB77",
      defaultFieldIds: ["animal-type"],
      iconId: "animal-icon"
    },
    {
      id: "building",
      name: "Building",
      appliesTo: ["track"],
      color: "#4D96FF",
      defaultFieldIds: ["building-type"],
      iconId: "building-icon"
    }
  ],
  fields: [
    {
      id: "animal-type",
      tagKey: "animal-type",
      name: "Animal type",
      type: "selectOne",
      appliesTo: ["observation"],
      options: ["Mammal", "Bird", "Reptile", "Other"].map((v) => ({
        value: v.toLowerCase(),
        label: v
      }))
    },
    {
      id: "building-type",
      tagKey: "building-type",
      name: "Building type",
      type: "selectMultiple",
      appliesTo: ["track"],
      options: ["School", "Hospital", "Homestead", "Church", "Shop", "Other"].map((v) => ({
        value: v.toLowerCase(),
        label: v
      }))
    }
  ],
  icons: [
    {
      id: "animal-icon",
      svgData: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#6BCB77"/><circle cx="24" cy="28" r="4" fill="#fff"/><circle cx="40" cy="28" r="4" fill="#fff"/><path d="M20 42c4 4 20 4 24 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>'
    },
    {
      id: "building-icon",
      svgData: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="14" y="18" width="36" height="32" rx="4" fill="#4D96FF"/><path d="M22 30h4v6h-4zm8 0h4v6h-4zm8 0h4v6h-4zM22 40h20v6H22z" fill="#fff"/></svg>'
    }
  ]
};

fs.writeFileSync("fixture.json", JSON.stringify(payload, null, 2));
console.log("Wrote fixture.json with version", version);
