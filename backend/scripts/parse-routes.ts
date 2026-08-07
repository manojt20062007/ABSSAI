import fs from 'fs';
import path from 'path';

const rawText = fs.readFileSync(path.join(__dirname, 'raw-routes.txt'), 'utf-8');

const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

interface Stop {
  name: string;
  road: string;
  pickupTime: string;
  dropTime?: string;
}

interface Route {
  routeNumber: string;
  name: string;
  stops: Stop[];
}

const routes: Route[] = [];
let currentRoute: Route | null = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.startsWith('ROUTE NO ')) {
    const routeNumber = line.replace('ROUTE NO ', '').trim();
    // The next line usually contains the route name and number again, e.g. KOTTIVAKKAM V1
    let name = '';
    if (i + 1 < lines.length && !lines[i + 1].startsWith('Pickup')) {
      const nextLine = lines[i + 1];
      const parts = nextLine.split(/\s+/);
      // Remove the last part if it matches the route number
      if (parts[parts.length - 1] === routeNumber || parts[parts.length - 1].startsWith('V') || parts[parts.length - 1].startsWith('VH')) {
        parts.pop();
      }
      name = parts.join(' ');
      i++; // Skip the name line
    }
    
    // Skip the header line if present
    if (i + 1 < lines.length && lines[i + 1].startsWith('Pickup Point')) {
      i++;
    }

    currentRoute = {
      routeNumber,
      name: name || `Route ${routeNumber}`,
      stops: []
    };
    routes.push(currentRoute);
    continue;
  }

  // Parse stops for the current route
  if (currentRoute && !line.startsWith('Pickup Point')) {
    // A stop line looks like:
    // Kottivakkam East Cost Road R3 5.45 5.45 PM
    // OR
    // Srinivasa Nagar East Cost Road R3 5.50
    // We can split by regex R[1-3] or just by finding the time parts.
    
    // Usually it has a format: [Pickup Point] [Road] [Route/R-num] [Morning Pickup] [Evening Drop]
    // The Route column is R1, R2, or R3.
    const match = line.match(/(.+?)\s+R[1-3]\s+([0-9\.]+(?:\s*[aApP][mM])?)(?:\s+([0-9\.]+(?:\s*[aApP][mM])?))?$/i);
    if (match) {
      const pointAndRoad = match[1].trim();
      // Split point and road... it's hard because there's no fixed delimiter.
      // We will just store the whole string in "name" for now, or split by 2+ spaces if any.
      // Wait, the raw OCR has single spaces. So we can't reliably split Point and Road.
      // We will just store the whole `pointAndRoad` as the stop name and leave road empty.
      
      const pickupTime = match[2].trim();
      const dropTime = match[3] ? match[3].trim() : undefined;

      currentRoute.stops.push({
        name: pointAndRoad,
        road: '',
        pickupTime,
        dropTime
      });
    } else {
      // Fallback if R1/R2/R3 is missing
      const fallbackMatch = line.match(/(.+?)\s+([0-9\.]+(?:\s*[aApP][mM])?)$/i);
      if (fallbackMatch) {
         currentRoute.stops.push({
            name: fallbackMatch[1].trim(),
            road: '',
            pickupTime: fallbackMatch[2].trim()
         });
      }
    }
  }
}

fs.writeFileSync(path.join(__dirname, 'pdf-routes-data.json'), JSON.stringify(routes, null, 2));
console.log(`Parsed ${routes.length} routes.`);
