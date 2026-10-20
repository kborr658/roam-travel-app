# Roam

A mobile-friendly travel companion with town discovery, Wikipedia articles, nearby restaurants and activities, saved places, and route directions through Google Maps.

## Use the app

Open https://kborr658.github.io/roam-travel-app/ on your phone or computer. Allow location access to discover your town, or use the town search. Save places with the heart buttons. Enter a starting point and destination to open driving, walking, or cycling directions in Google Maps.

Wikipedia and OpenStreetMap provide live town and place data. Nearby places depend on third-party service availability. Card images illustrate categories rather than individual venues. Saved places stay in your browser's local storage. Coordinates are sent to OpenStreetMap to identify the town and find nearby places; routes open in Google Maps.

## Run locally

With Python 3 installed, run `python3 -m http.server 8080` from this directory, then open http://localhost:8080. Production geolocation requires HTTPS.

This is a static web app; no API keys or build dependencies are needed. GitHub Pages serves the root of the main branch.
