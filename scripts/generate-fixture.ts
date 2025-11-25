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
      defaultFieldIds: ["animal-type"]
    },
    {
      id: "building",
      name: "Building",
      appliesTo: ["track"],
      color: "#4D96FF",
      defaultFieldIds: ["building-type"]
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
  ]
};

fs.writeFileSync("fixture.json", JSON.stringify(payload, null, 2));
console.log("Wrote fixture.json with version", version);

