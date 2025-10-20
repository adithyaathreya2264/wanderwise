const form = document.getElementById('planForm');
const destinationInput = document.getElementById('destination');
const transportSelect = document.getElementById('transport');
const listEl = document.getElementById('list');
const mapEl = document.getElementById('map');
const aiBtn = document.getElementById('aiItin');
const aiOutput = document.getElementById('aiOutput');

let map, directionsService, directionsRenderer;
function initMap() {
  map = new google.maps.Map(mapEl, { center: { lat:20, lng:77 }, zoom:6 });
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });
}

if (window.google && google.maps) initMap();

async function getOrigin() {
  // Try browser geolocation; fallback to a simple default (you can prompt user)
  try {
    const pos = await new Promise((resolve, reject) => 
      navigator.geolocation.getCurrentPosition(p => resolve(p), e => reject(e), {timeout:7000})
    );
    return `${pos.coords.latitude},${pos.coords.longitude}`;
  } catch (e) {
    // fallback - user can type origin instead if needed
    return 'Current Location';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  listEl.innerHTML = '';
  aiOutput.textContent = '';
  const destination = destinationInput.value.trim();
  const transportMode = transportSelect.value;
  const origin = await getOrigin();

  if (transportMode === 'own') {
    // show map and render driving directions
    mapEl.style.display = 'block';
    listEl.innerHTML = '';
    const requestBody = { origin, destination, transportMode: 'own' };
    const resp = await fetch('http://localhost:5000/api/plan', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(requestBody)
    });
    const json = await resp.json();
    if (json?.data?.routes?.length) {
      const route = json.data.routes[0];
      // use DirectionsRenderer on client via DirectionsService for better UX
      directionsService.route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === 'OK') directionsRenderer.setDirections(result);
      });
    } else {
      listEl.innerHTML = `<div class="result-card">No driving route found</div>`;
    }
  } else if (transportMode === 'public') {
    mapEl.style.display = 'none';
    const resp = await fetch('http://localhost:5000/api/plan', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ origin, destination, transportMode:'public' })
    });
    const json = await resp.json();
    // parse transit legs and show unique lines
    const routes = json?.data?.routes || [];
    const transitInfo = [];
    routes.forEach(route => {
      route.legs?.forEach(leg => {
        leg.steps?.forEach(step => {
          if (step.travel_mode === 'TRANSIT' && step.transit_details) {
            const td = step.transit_details;
            transitInfo.push({
              line: td.line?.short_name || td.line?.name || 'Unnamed',
              vehicle: td.line?.vehicle?.type,
              agency: (td.agencies || td.line?.agencies || []).map(a=>a.name).join(', ')
            });
          }
        });
      });
    });
    if (transitInfo.length === 0) listEl.innerHTML = `<div class="result-card">No transit options found.</div>`;
    else listEl.innerHTML = `<div class="result-card"><strong>Transit options:</strong><ul>${transitInfo.map(t=>`<li>${t.line} — ${t.vehicle} (${t.agency})</li>`).join('')}</ul></div>`;
  } else {
    // travel agency
    mapEl.style.display = 'none';
    const resp = await fetch('http://localhost:5000/api/plan', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ origin, destination, transportMode:'agency' })
    });
    const json = await resp.json();
    const agencies = json?.data || [];
    if (!agencies.length) listEl.innerHTML = `<div class="result-card">No agencies found.</div>`;
    else listEl.innerHTML = `<div class="card"><strong>Agencies:</strong><ul>${agencies.map(a=>`<li><strong>${a.name}</strong><br/>${a.address} ${a.rating?`— ${a.rating}★`:''}</li>`).join('')}</ul></div>`;
  }
});

// Quick AI itinerary button
aiBtn.addEventListener('click', async () => {
  aiOutput.textContent = 'Loading…';
  const destination = destinationInput.value.trim();
  const tripType = document.querySelector('input[name=tripType]:checked').value;
  const resp = await fetch('http://localhost:5000/api/ai', {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ destination, tripType, days:2 })
  });
  const json = await resp.json();
  aiOutput.textContent = json?.itinerary || 'No itinerary';
});
