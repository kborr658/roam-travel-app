const $ = id => document.getElementById(id);
let town = 'Bath', lat = 51.3811, lon = -2.359, filter = 'all', mode = 'driving';
let generation = 0, article = 'Bath, Somerset', placesLoading = false, placesFailed = false;
let articleRequest = 0;
const articleCache = new Map();
const photo = (id, w = 650) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let saved = [];
try { const value = JSON.parse(localStorage.getItem('roam.saved') || '[]'); if (Array.isArray(value)) saved = value; } catch {}
let places = [
  {id:'bath-roman',name:'The Roman Baths',category:'sights',type:'History & heritage',description:'Step into 2,000 years of history.',image:photo('photo-1571844307880-751c6d86f3f3'),query:'The Roman Baths Bath',wikiTitle:'Roman Baths (Bath)'},
  {id:'bath-sally',name:'Sally Lunn’s Historic Eating House',category:'food',type:'Food & drink',description:'A little taste of Bath’s history.',image:photo('photo-1555396273-367ea4eb4db5'),query:'Sally Lunns Bath'},
  {id:'bath-park',name:'Royal Victoria Park',category:'outdoors',type:'Parks & gardens',description:'Find a quiet moment in the green.',image:photo('photo-1441974231531-c6227db76b6e'),query:'Royal Victoria Park Bath',wikiTitle:'Royal Victoria Park, Bath'}
];
function mapUrl(p) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.query || p.name + ' ' + town); }
function renderCards(target, list) {
  $(target).innerHTML = list.map(p => `<article class="card"><div class="photo"><img src="${escape(p.image)}" alt="${escape(p.category === 'food' ? 'Restaurant atmosphere' : p.category === 'outdoors' ? 'Green landscape' : 'Travel inspiration')}" loading="lazy"><button class="save" data-id="${escape(p.id)}" aria-label="${saved.some(s=>s.id===p.id)?'Unsave':'Save'} ${escape(p.name)}" aria-pressed="${saved.some(s=>s.id===p.id)}">${saved.some(s=>s.id===p.id)?'♥':'♡'}</button></div><div class="card-body"><div class="category">${escape(p.type)}</div><h3><a href="${escape(mapUrl(p))}" target="_blank" rel="noopener">${escape(p.name)}</a></h3><p>${escape(p.description)}</p>${p.wikiTitle ? `<button class="place-story text-link" data-article="${escape(p.wikiTitle)}">Read on Wikipedia</button>` : ''}<div class="card-footer"><span>${escape(p.distance || 'Explore at your own pace')}</span><a href="${escape(mapUrl(p))}" target="_blank" rel="noopener">View place ↗</a></div></div></article>`).join('');
}
function nearbyQuery() {
  const category = {all:'things to do',food:'restaurants and cafes',sights:'tourist attractions and museums',outdoors:'parks and gardens'}[filter];
  return category + ' near ' + lat + ',' + lon;
}
function renderNearby() {
  const visible = places.filter(p => filter === 'all' || p.category === filter);
  renderCards('cards', visible);
  const fallback = $('nearbyFallback');
  fallback.classList.toggle('hidden', visible.length > 0);
  if (!visible.length) {
    const query = nearbyQuery();
    const url = 'https://maps.google.com/maps?q=' + encodeURIComponent(query) + '&z=13&output=embed';
    const frame = $('nearbyMap');
    if (frame.getAttribute('src') !== url) frame.src = url;
    $('nearbyMapTitle').textContent = {all:'Discover nearby places',food:'Restaurants & cafés nearby',sights:'Things to do nearby',outdoors:'Parks & gardens nearby'}[filter];
    $('nearbyMapLink').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
    $('nearbyExplanation').textContent = placesLoading
      ? 'Loading place cards. You can explore nearby results on the map now.'
      : placesFailed ? 'The place-list service is unavailable. Explore this category on the map, or retry the list.'
      : 'No named places were returned for this category. Explore nearby results on the map.';
  }
  $('placesStatus').textContent = placesLoading ? 'Finding nearby restaurants, sights and green spaces…'
    : placesFailed ? 'Map discovery remains available. You can retry the place list below.'
    : 'Places from OpenStreetMap · Photos are illustrative · Check current opening hours in Maps.';
  $('retryPlaces').classList.toggle('hidden', !placesFailed);
}
function render() {
  renderNearby();
  renderCards('savedCards', saved);
  $('savedEmpty').classList.toggle('hidden', saved.length > 0);
  $('savedCount').textContent = saved.length ? `(${saved.length})` : '';
}
document.addEventListener('click', e => {
  const story = e.target.closest('[data-article]');
  if (story) { openArticle(story.dataset.article); return; }
  const b = e.target.closest('.save');
  if (!b) return;
  const p = places.find(p=>p.id===b.dataset.id) || saved.find(p=>p.id===b.dataset.id);
  if (!p) return;
  saved = saved.some(s=>s.id===p.id) ? saved.filter(s=>s.id!==p.id) : [...saved,p];
  try { localStorage.setItem('roam.saved', JSON.stringify(saved)); } catch {}
  render();
});
document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => {
  filter = b.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(x => x.classList.toggle('active',x===b));
  renderNearby();
});
document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => {
  mode = b.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('selected',x===b));
});
function view(name) {
  document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('active',b.dataset.nav===name));
  $('exploreContent').classList.toggle('hidden',name==='saved');
  $('savedContent').classList.toggle('hidden',name!=='saved');
  $('layout').classList.toggle('route-view',name==='route');
  if (name==='route') { $('routeForm').scrollIntoView({behavior:'smooth',block:'center'}); $('destination').focus(); }
}
document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => view(b.dataset.nav));
$('routeForm').onsubmit = e => {
  e.preventDefault();
  const start=$('origin').value.trim(), end=$('destination').value.trim();
  if (!start || !end) return;
  const url='https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(start)+'&destination='+encodeURIComponent(end)+'&travelmode='+mode;
  window.open(url,'_blank','noopener');
  const a=document.createElement('a'); a.href=url; a.target='_blank'; a.rel='noopener'; a.textContent='Open directions: '+start+' → '+end+' ↗';
  $('routeResult').replaceChildren(a);
};
async function json(url, options={}, timeout=12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try { const r=await fetch(url,{...options,signal:controller.signal}); if (!r.ok) throw Error('Service unavailable'); return await r.json(); }
  finally { clearTimeout(timer); }
}
const wiki = params => json('https://en.wikipedia.org/w/api.php?origin=*&format=json&'+new URLSearchParams(params));
async function loadTown(name, fromLocation=false) {
  const g=++generation;
  $('notice').textContent='Finding a little local knowledge…';
  try {
    const r=await wiki({action:'query',generator:'search',gsrsearch:name,gsrlimit:5,prop:'extracts|coordinates|pageimages',explaintext:1,exintro:1,piprop:'original',colimit:1});
    const page=Object.values(r.query?.pages || {}).sort((a,b)=>(a.index||0)-(b.index||0)).find(p=>p.coordinates?.length);
    if (!page) throw Error('No town found');
    if (g!==generation) return;
    applyTown(page,fromLocation);
    await loadPlaces(g);
  } catch { if(g===generation) $('notice').textContent='Could not load that town. Check your connection or try the town and country.'; }
}
function cacheKey() { return 'roam.places.v2.'+lat.toFixed(3)+','+lon.toFixed(3); }
function readPlaceCache() {
  try { const data=JSON.parse(localStorage.getItem(cacheKey())); return data && Array.isArray(data.places) && Date.now()-data.time<86400000 ? data.places : null; } catch { return null; }
}
function applyTown(page, located) {
  town=page.title.replace(/,.*$/,''); article=page.title;
  lat=page.coordinates[0].lat; lon=page.coordinates[0].lon;
  $('townTitle').textContent=page.title; $('wikiTown').textContent=town;
  $('townSubtitle').textContent='A new place. A thousand little discoveries.';
  const intro=page.extract || '';
  $('wikiExcerpt').textContent=intro ? intro.slice(0,380)+(intro.length>380?'…':'') : 'Explore the town’s history on Wikipedia.';
  $('coords').textContent=`${Math.abs(lat).toFixed(4)}° ${lat>=0?'N':'S'}   ${Math.abs(lon).toFixed(4)}° ${lon>=0?'E':'W'}`;
  $('heroImage').src=page.original?.source || photo('photo-1449158743715-0a90ebb6d2d8',1400);
  $('heroImage').alt=page.original?.source ? page.title+' — image from Wikipedia' : 'Travel inspiration';
  $('locationBadge').textContent=located?'YOU ARE HERE':'EXPLORING';
  $('origin').value=page.title;
  $('mapLink').href='https://www.google.com/maps/search/things+to+do+in+'+encodeURIComponent(page.title);
  $('notice').textContent=located?'Your local guide, based on your approximate location.':'Exploring '+page.title+'. Use the location button for your current town.';
  // Never leave a blank section while a remote provider is slow or unavailable.
  places=readPlaceCache() || [];
  placesLoading=true; placesFailed=false;
  render(); view('explore');
}
function distanceKm(a,b) {
  return 6371*2*Math.asin(Math.min(1,Math.sqrt(Math.sin((a-lat)*Math.PI/360)**2+Math.cos(lat*Math.PI/180)*Math.cos(a*Math.PI/180)*Math.sin((b-lon)*Math.PI/360)**2)));
}
function normalizePlaces(elements) {
  const seen=new Set();
  return elements.filter(p=>{
    if(!p.tags?.name || seen.has(p.tags.name)) return false;
    seen.add(p.tags.name); return true;
  }).map(p=>{
    const tags=p.tags;
    const category=tags.amenity?'food':tags.leisure || tags.landuse==='forest' || tags.natural?'outdoors':'sights';
    const a=p.lat??p.center?.lat, b=p.lon??p.center?.lon;
    const km=Number.isFinite(a)&&Number.isFinite(b)?distanceKm(a,b):null;
    const title=tags.wikipedia?.startsWith('en:')?tags.wikipedia.slice(3):null;
    return {id:'osm-'+p.type+p.id,name:tags.name,category,type:category==='food'?'Food & drink':category==='outdoors'?'Parks & gardens':'Things to do',description:tags.cuisine?tags.cuisine.replace(/[_;]/g,' '):'Discover something local in '+town+'.',image:photo(category==='food'?'photo-1555396273-367ea4eb4db5':category==='outdoors'?'photo-1441974231531-c6227db76b6e':'photo-1473448912268-2022ce9509d8'),distance:km!==null?km.toFixed(1)+' km from town centre':'',km:km??Infinity,query:Number.isFinite(a)&&Number.isFinite(b)?`${tags.name} ${a},${b}`:tags.name+' '+town,wikiTitle:title};
  }).sort((a,b)=>a.km-b.km);
}
async function loadPlaces(g=generation) {
  if(g!==generation) return;
  placesLoading=true; placesFailed=false; renderNearby();
  // Separate category outputs prevent a busy restaurant category from crowding out parks and sights.
  const query=`[out:json][timeout:8];nwr(around:5000,${lat},${lon})[name][amenity~"^(restaurant|cafe|pub|bar|fast_food|food_court|ice_cream)$"];out center tags 24;nwr(around:5000,${lat},${lon})[name][tourism~"^(museum|attraction|gallery|viewpoint|artwork|zoo|theme_park)$"];out center tags 24;nwr(around:5000,${lat},${lon})[name][leisure~"^(park|garden|nature_reserve|recreation_ground)$"];out center tags 24;`;
  let succeeded=false;
  for (const endpoint of ['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter','https://overpass.kumi.systems/api/interpreter']) {
    if(g!==generation) return;
    try {
      const data=await json(endpoint+'?'+new URLSearchParams({data:query}),{},10000);
      if(g!==generation) return;
      if(!Array.isArray(data.elements) || data.remark) throw Error('Incomplete place data');
      const found=normalizePlaces(data.elements);
      if(found.length) {
        places=found;
        try {localStorage.setItem(cacheKey(),JSON.stringify({time:Date.now(),places}));} catch {}
        succeeded=true; break;
      }
      // An empty response may be a sparse area; the embedded category map remains available.
      succeeded=true; break;
    } catch { /* Try another public replica without discarding cached places. */ }
  }
  if(g!==generation) return;
  placesLoading=false; placesFailed=!succeeded;
  render();
}
$('retryPlaces').onclick=()=>loadPlaces();
function formatArticle(text) {
  const fragment=document.createDocumentFragment();
  let paragraph=[];
  function flush() {
    if(!paragraph.length)return;
    const p=document.createElement('p');p.textContent=paragraph.join('\n');fragment.append(p);paragraph=[];
  }
  for(const line of text.split('\n')) {
    const heading=line.trim().match(/^(={2,6})\s*(.*?)\s*\1$/);
    if(heading){flush();const h=document.createElement('h'+Math.min(heading[1].length+1,6));h.textContent=heading[2];fragment.append(h)}
    else if(line.trim())paragraph.push(line.trim());
    else flush();
  }
  flush();$('articleText').replaceChildren(fragment);
}
async function openArticle(title=article) {
  const request=++articleRequest;
  $('articleTitle').textContent=title;
  $('articleText').textContent='Loading the full Wikipedia article…';
  $('articleError').classList.add('hidden');
  $('articleRetry').onclick=()=>openArticle(title);
  $('wikiExternal').href='https://en.wikipedia.org/wiki/'+encodeURIComponent(title.replace(/ /g,'_'));
  if(!$('articleDialog').open) $('articleDialog').showModal();
  $('articleDialog').scrollTop=0;
  try {
    let page=articleCache.get(title);
    if(!page) {
      // No exintro flag: fetch the entire article, rather than only its opening summary.
      const data=await wiki({action:'query',titles:title,redirects:1,prop:'extracts',explaintext:1,exsectionformat:'wiki'});
      page=Object.values(data.query?.pages || {})[0];
      if(!page?.extract || 'missing' in page) throw Error('Article unavailable');
      articleCache.set(title,page);
    }
    if(request!==articleRequest) return;
    $('articleTitle').textContent=page.title;
    $('wikiExternal').href='https://en.wikipedia.org/wiki/'+encodeURIComponent(page.title.replace(/ /g,'_'));
    formatArticle(page.extract);
  } catch {
    if(request!==articleRequest) return;
    $('articleText').textContent='The article could not be loaded. Check your connection and try again.';
    $('articleError').classList.remove('hidden');
  }
}
$('readArticle').onclick=()=>openArticle();
document.querySelector('.close').onclick=()=>{$('articleDialog').close();articleRequest++};
$('articleDialog').onclick=e=>{if(e.target===$('articleDialog')){$('articleDialog').close();articleRequest++}};
$('articleDialog').addEventListener('cancel',()=>articleRequest++);
$('townForm').onsubmit=e=>{e.preventDefault();const name=$('townInput').value.trim();if(name)loadTown(name)};
function locate() {
  if(!navigator.geolocation){$('notice').textContent='Location is unavailable. Search for your town above.';return}
  $('notice').textContent='Finding your town…';
  const initial=generation;
  navigator.geolocation.getCurrentPosition(async pos=>{
    if(initial!==generation)return;
    const g=++generation;
    try {
      const result=await json(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=10`);
      if(g!==generation)return;
      const a=result.address || {}, name=a.city||a.town||a.village||a.municipality||a.county;
      if(!name)throw Error('No town');
      await loadTown(name+', '+(a.country||''),true);
    } catch {if(g===generation)$('notice').textContent='Could not identify your town. Search for your town above.';}
  },()=>{if(initial===generation)$('notice').textContent='Location access is unavailable. Search for your town above, or keep exploring Bath.';},{timeout:12000,maximumAge:300000});
}
$('locate').onclick=locate;
render();
if(navigator.geolocation)locate();
