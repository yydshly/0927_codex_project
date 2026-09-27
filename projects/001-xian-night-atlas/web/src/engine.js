import { lines, stations, stationById } from './data.js';

export const TRANSFER_MINUTES = 6;
export const HEADWAY = 8;
export const formatTime = minutes => {
  const m = Math.round(minutes);
  return `${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
};
export const dayOffset = day => day === 'weekend' ? 12 : 0;
export function lastDeparture(line,index,direction,day='weekday') {
  if (direction===1) return line.lastForward + dayOffset(day) + line.times.slice(0,index).reduce((a,b)=>a+b,0);
  return line.lastBackward + dayOffset(day) + line.times.slice(index).reduce((a,b)=>a+b,0);
}
export function lineLastDeparture(line,day='weekday') {
  return Math.max(lastDeparture(line,line.stops.length-2,1,day),lastDeparture(line,1,-1,day));
}
export function departuresFrom(stationId,day='weekday') {
  return lines.flatMap(line=>{
    const i=line.stops.indexOf(stationId);
    if(i<0) return [];
    const result=[];
    if(i<line.stops.length-1) result.push({line,direction:1,destination:line.to,last:lastDeparture(line,i,1,day)});
    if(i>0) result.push({line,direction:-1,destination:line.from,last:lastDeparture(line,i,-1,day)});
    return result;
  });
}
export function segmentState(line,index,time,day='weekday') {
  const forward=lastDeparture(line,index,1,day)>=time;
  const backward=lastDeparture(line,index+1,-1,day)>=time;
  return {forward,backward,active:forward||backward};
}

// Timetable-aware earliest arrival over (station, line, direction) states.
// Changing trains includes a six-minute transfer. Staying aboard does not add waiting.
function searchNetwork(origin,start,day,destination=null) {
  const journeys=new Map();
  if(!stationById.has(origin)||!Number.isFinite(start)) return journeys;
  const first={station:origin,line:null,direction:0,time:start,legs:[],key:`${origin}|start`};
  const queue=[first],best=new Map([[first.key,start]]);
  while(queue.length) {
    queue.sort((a,b)=>a.time-b.time);
    const state=queue.shift();
    if(state.time!==best.get(state.key)) continue;
    if(!journeys.has(state.station)) {
      const grouped=[];
      for(const edge of state.legs) {
        const prev=grouped.at(-1);
        if(prev&&prev.lineId===edge.lineId&&prev.direction===edge.direction) {
          prev.to=edge.to;prev.arrival=edge.arrival;prev.stationIds.push(edge.to);
        } else grouped.push({...edge,stationIds:[edge.from,edge.to]});
      }
      journeys.set(state.station,{arrival:state.time,duration:state.time-start,transfers:Math.max(0,grouped.length-1),legs:grouped,stationIds:[origin,...state.legs.map(e=>e.to)]});
      if(state.station===destination||journeys.size===stations.length)break;
    }
    for(const line of lines) {
      const index=line.stops.indexOf(state.station);
      if(index<0)continue;
      for(const direction of [-1,1]) {
        const nextIndex=index+direction;
        if(nextIndex<0||nextIndex>=line.stops.length)continue;
        const sameTrain=state.line===line.id&&state.direction===direction;
        const ready=state.time+(state.line&&!sameTrain?TRANSFER_MINUTES:0);
        const last=lastDeparture(line,index,direction,day);
        if(ready>last)continue;
        const departure=sameTrain?ready:last-Math.floor((last-ready)/HEADWAY)*HEADWAY;
        const arrival=departure+line.times[Math.min(index,nextIndex)];
        const to=line.stops[nextIndex],key=`${to}|${line.id}|${direction}`;
        if(arrival>=(best.get(key)??Infinity))continue;
        best.set(key,arrival);
        queue.push({station:to,line:line.id,direction,time:arrival,key,legs:[...state.legs,{lineId:line.id,direction,from:state.station,to,departure,arrival}]});
      }
    }
  }
  return journeys;
}

export function findJourney(origin,destination,start,day='weekday') {
  if(!stationById.has(destination))return null;
  return searchNetwork(origin,start,day,destination).get(destination)??null;
}

// One search produces all earliest arrivals for the interactive reachability map.
export function journeysFrom(origin,start,day='weekday') {
  return searchNetwork(origin,start,day);
}

export function latestStart(origin,destination,day='weekday',walk=0) {
  if(origin===destination)return null;
  let low=1200,high=1560,answer=null;
  while(low<=high) {
    const mid=Math.floor((low+high)/2);
    if(findJourney(origin,destination,mid+walk,day)) {answer=mid;low=mid+1;} else high=mid-1;
  }
  return answer;
}

export function reachableStations(origin,time,day='weekday') {
  return new Set(journeysFrom(origin,time,day).keys());
}
