import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CitiesService {
  async getCitySuggestions(query: string): Promise<any[]> {
    try {
      const response = await axios.get(
        'https://nominatim.openstreetmap.org/search',
        {
          params: {
            q: `${query}, India`,
            format: 'json',
            limit: 10,
            addressdetails: 1,
            featuretype: 'city',
            countrycodes: 'in',
          },
          headers: {
            'User-Agent': 'CarRentalsApp/1.0', // Required by Nominatim's usage policy
          },
        },
      );
      console.log('response.data', response.data);

      // Filter for India, map to city objects, and remove duplicates by city name and state
      const seen = new Set();
      // Process in a single loop to avoid multiple passes over the data
      const results: any[] = [];
      for (const city of response.data) {
        if (city.address?.country !== 'India') continue;
        const name = city.display_name.split(',')[0].trim();
        const state = city.address?.state || '';
        const key = `${name.toLowerCase()}|${state.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({
          name,
          state,
          country: city.address?.country || '',
          latitude: parseFloat(city.lat),
          longitude: parseFloat(city.lon),
          population: 0, // Nominatim doesn't provide population data
        });
      }
      return results;
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
      return [];
    }
  }
}
