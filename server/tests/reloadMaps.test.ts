import assert from "node:assert/strict";
import test from "node:test";

const vars = require("../src/vars");
const LoadMaps = require("../src/loadMaps");
const { reloadMapsDiff } = require("../src/gameDataSync");

test("LoadMaps.reloadMap reloads an existing map and preserves character and NPC runtime IDs", async () => {
    const loader = new LoadMaps();
    const testMapId = 1; // Map 1 exists in mapas_source

    // Setup simulated runtime state before reload
    vars.personajes = {
        "100": {
            id: 100,
            map: testMapId,
            pos: { x: 50, y: 50 },
            nameCharacter: "Hero",
        },
    };

    vars.npcs = {
        "200": {
            id: 200,
            map: testMapId,
            pos: { x: 50, y: 51 },
            nameCharacter: "Merchant",
        },
    };

    const result = await loader.reloadMap(testMapId);

    assert.equal(result.reloaded, true);
    assert.equal(result.mapNum, testMapId);
    assert.equal(result.charactersPreserved, 1);
    assert.equal(result.npcsPreserved, 1);

    // Verify map structures are populated
    assert.ok(vars.mapa[testMapId]);
    assert.ok(vars.mapData[testMapId]);
    assert.equal(typeof vars.mapData[testMapId].name, "string");

    // Verify entity IDs were correctly restored into vars.mapData
    assert.equal(vars.mapData[testMapId][50][50].id, 100);
    assert.equal(vars.mapData[testMapId][51][50].id, 200);
});

test("LoadMaps.reloadMap returns reloaded: false for non-existent maps", async () => {
    const loader = new LoadMaps();
    const nonExistentMapId = 99999;

    const result = await loader.reloadMap(nonExistentMapId);

    assert.equal(result.reloaded, false);
    assert.equal(result.mapNum, nonExistentMapId);
    assert.equal(result.charactersPreserved, 0);
    assert.equal(result.npcsPreserved, 0);
});

test("reloadMapsDiff reloads specific map via gameDataSync bridge", async () => {
    const testMapId = 1;
    const result = await reloadMapsDiff(testMapId);

    assert.ok(Array.isArray(result.reloadedMaps));
    assert.equal(result.reloadedMaps.length, 1);
    assert.equal(result.reloadedMaps[0], testMapId);
    assert.equal(typeof result.charactersPreserved, "number");
    assert.equal(typeof result.npcsPreserved, "number");
});

test("reloadMapsDiff handles invalid map IDs safely without crashing", async () => {
    const result = await reloadMapsDiff(88888);

    assert.deepEqual(result.reloadedMaps, []);
    assert.equal(result.charactersPreserved, 0);
    assert.equal(result.npcsPreserved, 0);
});
