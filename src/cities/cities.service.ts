import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CitiesService {
  private readonly geonamesUsername = 'kuldip_trentiums';

  async getCitySuggestions(query: string): Promise<any[]> {
    try {
      const response = await axios.get('http://api.geonames.org/searchJSON', {
        params: {
          q: query,
          country: 'IN',
          featureClass: 'P',
          maxRows: 10,
          username: this.geonamesUsername,
          style: 'FULL',
          orderby: 'population',
        },
      });

      return response.data.geonames.map((city: any) => ({
        name: city.name,
        state: city.adminName1,
        population: city.population,
        latitude: city.lat,
        longitude: city.lng
      }));
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
      return [];
    }
  }
}
