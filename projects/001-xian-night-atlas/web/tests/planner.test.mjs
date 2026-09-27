import test from 'node:test';
import assert from 'node:assert/strict';
import {stations,stationByName,lineById} from '../src/data.js';
import {findJourney,journeysFrom,lastDeparture} from '../src/engine.js';
import {planReturn,reachability,compareReachability,readSavedPlan,places} from '../src/planner.js';

const id=name=>stationByName.get(name).id;
const base={origin:id('钟楼'),destination:id('西安北站'),time:1350,walk:8,stay:0,day:'weekday',budget:45};

test('one-to-many search matches point-to-point arrivals, including late transfers',()=>{
  for(const [origin,start] of [[id('钟楼'),1358],[id('大雁塔'),1400],[id('科技路'),1445]]){
    const all=journeysFrom(origin,start);
    for(const station of stations){
      const single=findJourney(origin,station.id,start);
      assert.equal(all.get(station.id)?.arrival??null,single?.arrival??null,`${station.name} at ${start}`);
    }
  }
});

test('return plan counts staying and walking once, with a separate ten-minute buffer',()=>{
  const now=planReturn(base),later=planReturn({...base,stay:30});
  assert.equal(now.latest,1398);assert.equal(now.recommended,1388);assert.equal(now.spare,38);
  assert.equal(now.journey.arrival,1387);assert.equal(now.journey.duration+base.walk,37);
  assert.equal(later.departure,1380);assert.equal(later.latest,now.latest);
  assert.equal(later.journey.arrival,findJourney(base.origin,base.destination,1388).arrival);
  assert.ok(planReturn({...base,stay:48}).journey);
  assert.equal(planReturn({...base,stay:49}).journey,null);
  assert.equal(planReturn({...base,day:'weekend'}).recommended,now.recommended+12);
});

test('reachability budgets include the walk and exclude the starting station',()=>{
  const thirty=reachability({...base,budget:30}),fortyFive=reachability(base);
  assert.equal(thirty.destinations.has(base.origin),false);
  assert.equal(thirty.destinations.has(base.destination),false);
  assert.equal(fortyFive.destinations.get(base.destination).duration,37);
  assert.ok([...thirty.destinations.keys()].every(id=>fortyFive.destinations.has(id)));
  for(const j of fortyFive.list){assert.ok(j.duration<=45);assert.equal(j.duration,j.arrival-1350);}
  for(let i=1;i<fortyFive.list.length;i++)assert.ok(fortyFive.list[i-1].duration<=fortyFive.list[i].duration);
});

test('map edges only contain actual directed legs of eligible journeys',()=>{
  const result=reachability(base);
  for(const key of result.edges){
    const [lineId,from,to]=key.split('|'),line=lineById.get(lineId);
    assert.equal(Math.abs(line.stops.indexOf(from)-line.stops.indexOf(to)),1);
    assert.ok(result.list.some(j=>j.legs.some(leg=>leg.lineId===lineId&&leg.stationIds.some((s,i)=>i>0&&s===to&&leg.stationIds[i-1]===from))));
  }
  for(const j of result.list)for(const leg of j.legs){
    assert.ok(leg.departure<=lastDeparture(lineById.get(leg.lineId),lineById.get(leg.lineId).stops.indexOf(leg.from),leg.direction));
  }
});

test('later comparison handles both lost and newly fitting destinations',()=>{
  const now=reachability(base),later=reachability({...base,stay:30}),diff=compareReachability(now,later);
  assert.ok(diff.lost.size>0);
  assert.equal(later.destinations.size,now.destinations.size-diff.lost.size+diff.gained.size);
  for(const key of diff.lost){assert.ok(now.destinations.has(key));assert.equal(later.destinations.has(key),false);}
  for(const key of diff.gained){assert.ok(later.destinations.has(key));assert.equal(now.destinations.has(key),false);}
  const artificial=compareReachability({destinations:new Map([['a',{}],['b',{}]])},{destinations:new Map([['b',{}],['c',{}]])});
  assert.deepEqual([...artificial.lost],['a']);assert.deepEqual([...artificial.gained],['c']);
});

test('midnight and exhausted services produce an empty destination set',()=>{
  const result=reachability({...base,time:1505,budget:90});
  assert.equal(result.destinations.size,0);assert.equal(result.edges.size,0);
  assert.equal(planReturn({...base,origin:base.destination}).recommended,null);
  assert.equal(journeysFrom('unknown',1350).size,0);
});

test('saved plans are allowlisted and damaged or out-of-range data is ignored',()=>{
  const valid={...base,version:1,place:'bell',mode:'reach',unexpected:'<script>'};
  const restored=readSavedPlan(JSON.stringify(valid));
  assert.equal(restored.mode,'reach');assert.equal(restored.place,'bell');assert.equal(restored.unexpected,undefined);
  for(const raw of ['broken',null,'null',JSON.stringify({...valid,time:2000}),JSON.stringify({...valid,stay:-1}),JSON.stringify({...valid,walk:8.5}),JSON.stringify({...valid,origin:'missing'}),JSON.stringify({...valid,budget:0})])assert.equal(readSavedPlan(raw),null);
  assert.equal(readSavedPlan(JSON.stringify({...valid,place:'pagoda'})).place,'custom');
});

test('every preset maps to an existing sample station with an adjustable walking estimate',()=>{
  assert.equal(new Set(places.map(p=>p.id)).size,places.length);
  for(const p of places){assert.equal(stationByName.get(p.station).id,p.stationId);assert.ok(p.walk>0&&p.walk<=30);}
});
