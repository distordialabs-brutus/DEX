const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const target = path.resolve(__dirname, '../../src/swap/persistence.js');
const implementation = fs.existsSync(target) ? require(target) : {};

test('module journal waits for acknowledged persistence and survives hydration', async () => {
  assert.equal(typeof implementation.createModulePersistence, 'function');
  let disk;
  const service = implementation.createModulePersistence(async data => { disk = JSON.parse(JSON.stringify(data)); });
  service.hydrate({settings: {timeSpan: '1h'}, custom: 'preserved'});
  await service.writeJournal({version: 1, jobs: [{id: 'job-1'}]});
  assert.equal(disk.custom, 'preserved');
  assert.equal(disk.settings.timeSpan, '1h');
  const reopened = implementation.createModulePersistence(async () => {});
  reopened.hydrate(disk);
  assert.equal(reopened.readJournal().jobs[0].id, 'job-1');
});


test('legacy settings save before a journal fault but cannot bypass the resulting storage hold', async () => {
 const writes=[];
 const p=implementation.createModulePersistence(undefined,{writeSettings:value=>{writes.push(value);}});
 p.hydrate({settings:{timespan:1},swapJournal:{version:1,jobs:[]}});
 await p.saveSettings({timespan:2});
 await assert.rejects(()=>p.writeJournal({version:1,jobs:[]}),/acknowledge|capability/i);
 await assert.rejects(()=>p.saveSettings({timespan:3}),/writes blocked.*recovery/i);
 assert.equal(writes.length,1); assert.equal(writes[0].settings.timespan,2);
 assert.deepEqual(writes[0].swapJournal,{version:1,jobs:[]});
 assert.deepEqual(p.readJournal(),{version:1,jobs:[]});
});
