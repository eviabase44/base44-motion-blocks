/** Bind any host app source without coupling the animation to its API or auth. */
export async function connectAppSource(player,{getSnapshot,subscribe,onError=()=>{}}) {
  let active=true,receivedEvent=false;
  const apply=async payload=>{if(!active)return;try{await player.update(payload);}catch(e){if(active)onError(e);}};
  // Subscribe first; an event arriving during the initial fetch wins over that fetch.
  const unsubscribe=subscribe?.(payload=>{receivedEvent=true;void apply(payload);})??(()=>{});
  try{const initial=await getSnapshot();if(active&&!receivedEvent)await apply(initial);}
  catch(e){if(active)onError(e);}
  return ()=>{active=false;unsubscribe();};
}
