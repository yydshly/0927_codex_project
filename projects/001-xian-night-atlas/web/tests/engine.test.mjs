import test from 'node:test';
import assert from 'node:assert/strict';
import {stations,lines,lineById,stationByName as names} from '../src/data.js';
import {formatTime,lastDeparture,findJourney,latestStart,departuresFrom,TRANSFER_MINUTES,HEADWAY} from '../src/engine.js';
const id=name=>names.get(name).id;
test('sample network has unique stations and a duration for every edge',()=>{
  assert.equal(new Set(stations.map(s=>s.name)).size,stations.length);
  for(const line of lines){assert.equal(line.times.length,line.stops.length-1);assert.ok(line.times.every(t=>t>0));assert.ok(line.stops.every(s=>stations.some(x=>x.id===s)));}
});
test('service-day formatting handles midnight without resetting the schedule',()=>{
  assert.equal(formatTime(1439),'23:59');assert.equal(formatTime(1440),'00:00');assert.equal(formatTime(1505),'01:05');
  assert.equal(findJourney(id('钟楼'),id('西安北站'),1505),null);
});
test('direct journey stays on one train without extra waits at each stop',()=>{
  const result=findJourney(id('钟楼'),id('西安北站'),1358);
  assert.equal(result.arrival,1387);assert.equal(result.duration,29);assert.equal(result.transfers,0);assert.equal(result.legs.length,1);
  assert.equal(result.legs[0].departure,1358);
});
test('multi-line journey reserves time for transfers and boards scheduled trains',()=>{
  const start=1365,result=findJourney(id('大雁塔'),id('后卫寨'),start);
  assert.ok(result);assert.ok(result.transfers>=1);
  let ready=start;
  for(const [i,leg] of result.legs.entries()){
    const line=lineById.get(leg.lineId),index=line.stops.indexOf(leg.from);
    const last=lastDeparture(line,index,leg.direction);
    if(i)ready+=TRANSFER_MINUTES;
    assert.ok(leg.departure>=ready);assert.ok(leg.departure<=last);
    assert.equal((last-leg.departure)%HEADWAY,0);
    const indexes=leg.stationIds.map(s=>line.stops.indexOf(s));
    const ride=line.times.slice(Math.min(...indexes),Math.max(...indexes)).reduce((a,b)=>a+b,0);
    assert.equal(leg.arrival-leg.departure,ride);ready=leg.arrival;
  }
});
test('latest departure includes walking and fails immediately after the cutoff',()=>{
  for(const [a,b,walk] of [['钟楼','西安北站',8],['大雁塔','后卫寨',15],['科技路','纺织城',10]]){
    const latest=latestStart(id(a),id(b),'weekday',walk);
    assert.ok(latest!==null);assert.ok(findJourney(id(a),id(b),latest+walk));
    assert.equal(findJourney(id(a),id(b),latest+walk+1),null);
    assert.equal(latestStart(id(a),id(b),'weekday',walk+5),latest-5);
  }
});
test('weekend scenario moves every last departure and journey cutoff by 12 minutes',()=>{
  const a=id('钟楼'),b=id('西安北站');
  const weekday=departuresFrom(a),weekend=departuresFrom(a,'weekend');
  weekday.forEach((d,i)=>assert.equal(weekend[i].last-d.last,12));
  assert.equal(latestStart(a,b,'weekend',8)-latestStart(a,b,'weekday',8),12);
});
test('same station is a zero-ride journey; unknown stations are rejected',()=>{
  assert.equal(findJourney(id('钟楼'),id('钟楼'),1400).duration,0);
  assert.equal(findJourney('missing',id('钟楼'),1400),null);
  assert.equal(findJourney(id('钟楼'),'missing',1400),null);
});
