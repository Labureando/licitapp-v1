import { Injectable } from '@nestjs/common';

@Injectable()
export class ScrapingService {
  // Las operaciones reales están en PlaceScraperService y PlaceHistoricalService
  // Este service se puede usar más adelante como fachada para múltiples scrapers (BOE, TED, etc.)
}