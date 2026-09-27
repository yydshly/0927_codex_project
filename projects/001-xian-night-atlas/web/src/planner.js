import {stationById,stationByName} from './data.js';
import {journeysFrom,findJourney,latestStart} from './engine.js';

// Curated demonstration starting points, not surveyed entrances or walking routes.
export const places=[
  {id:'bell',name:'钟楼街区',en:'BELL TOWER',station:'钟楼',walk:8,description:'灯火之间，再留一点时间。',color:'#dfb986'},
  {id:'wall',name:'永宁门广场',en:'CITY WALL',station:'永宁门',walk:10,description:'城墙下的晚风，陪你走一程。',color:'#d99489'},
  {id:'pagoda',name:'大雁塔北广场',en:'WILD GOOSE PAGODA',station:'大雁塔',walk:15,description:'从雁塔的夜色，走向回家的光。',color:'#b5a4e2'},
  {id:'garden',name:'大唐芙蓉园周边',en:'TANG PARADISE',station:'大唐芙蓉园',walk:12,description:'把今晚的最后一程，也安排好。',color:'#8dc6be'},
].map(place=>({...place,stationId:stationByName.get(place.station).id}));
export const placeById=new Map(places.map(place=>[place.id,place]));
export const RETURN_BUFFER=10;

export function planReturn({origin,destination,time,stay=0,walk=0,day='weekday'},cutoff=latestStart(origin,destination,day,walk)) {
  const departure=Math.round(time)+stay;
  const journey=findJourney(origin,destination,departure+walk,day);
  const recommended=cutoff===null?null:cutoff-RETURN_BUFFER;
  return {journey,departure,latest:cutoff,recommended,
    spare:recommended===null?null:recommended-Math.round(time),
    margin:cutoff===null?null:cutoff-departure};
}

export function reachability({origin,time,walk=0,stay=0,day='weekday',budget=45}) {
  const departure=Math.round(time)+stay;
  const available=journeysFrom(origin,departure+walk,day),destinations=new Map(),edges=new Set();
  for(const [id,journey] of available){
    if(id===origin)continue;
    const duration=journey.arrival-departure;
    if(duration>budget)continue;
    destinations.set(id,{...journey,duration});
    for(const leg of journey.legs)for(let i=1;i<leg.stationIds.length;i++)edges.add(`${leg.lineId}|${leg.stationIds[i-1]}|${leg.stationIds[i]}`);
  }
  return {departure,destinations,edges,
    list:[...destinations].map(([id,journey])=>({id,...journey})).sort((a,b)=>a.duration-b.duration||stationById.get(a.id).name.localeCompare(stationById.get(b.id).name,'zh-CN')),
    within30:[...destinations.values()].filter(j=>j.duration<=30).length};
}

export function compareReachability(current,later){
  return {lost:new Set([...current.destinations.keys()].filter(id=>!later.destinations.has(id))),
    gained:new Set([...later.destinations.keys()].filter(id=>!current.destinations.has(id)))};
}

// Saved plans never supply HTML or arbitrary keys to the application state.
export function readSavedPlan(raw){
  try{
    const value=JSON.parse(raw);
    if(value?.version!==1||!stationById.has(value.origin)||!stationById.has(value.destination))return null;
    for(const [key,min,max] of [['time',1260,1530],['walk',0,30],['stay',0,90]])
      if(!Number.isInteger(value[key])||value[key]<min||value[key]>max)return null;
    if(!['weekday','weekend'].includes(value.day)||![30,45,60,90].includes(value.budget))return null;
    return {origin:value.origin,destination:value.destination,time:value.time,walk:value.walk,stay:value.stay,day:value.day,budget:value.budget,
      place:placeById.get(value.place)?.stationId===value.origin?value.place:'custom',mode:value.mode==='reach'?'reach':'journey'};
  }catch{return null;}
}
