// reembedTransportation.js
import { bulkStoreEmbeddings } from './utils/embeddings.js';
import { knowledgeBase } from './knowledgeBase.js';
import dotenv from 'dotenv';
dotenv.config();

async function reembedTransportation() {
  try {
    console.log('Starting re-embedding of transportation information...');
    
    // Extract transportation data from knowledgeBase
    const transportData = knowledgeBase.transportation || {};
    
    // Create chunks specifically for BSI information with varied contexts
    const transportationChunks = [
      // General BSI information
      {
        content: `Bus Terminal Information: The BSÍ bus terminal is the main departure point for shuttle services to Sky Lagoon. Reykjavík Excursions operates a direct shuttle service from BSÍ to Sky Lagoon. Bus departs BSÍ on the hour of your booking. Return buses depart Sky Lagoon at: 14:30, 15:30, 16:30, 17:30, 18:30, 19:30, 20:30, and 21:30.`,
        metadata: {
          language: 'en',
          type: 'transportation',
          section: 'bsi_service',
          priority: 'high',
          keywords: 'bus terminal, BSI, BSÍ, shuttle, transportation, Reykjavík Excursions'
        }
      },
      
      // How to get to Sky Lagoon from bus terminal
      {
        content: `How to get to Sky Lagoon from bus terminal: The best way to get to Sky Lagoon from the main bus terminal (BSÍ) is using the Reykjavík Excursions shuttle service. Buses depart BSÍ bus terminal on the hour of your booking and take you directly to Sky Lagoon. Return buses depart Sky Lagoon at: 14:30, 15:30, 16:30, 17:30, 18:30, 19:30, 20:30, and 21:30.`,
        metadata: {
          language: 'en',
          type: 'transportation',
          section: 'getting_there',
          priority: 'high',
          keywords: 'bus terminal, get there, how to reach, transport, BSI, shuttle service'
        }
      },
      
      // Shuttle service details
      {
        content: `Shuttle Service to Sky Lagoon: Reykjavík Excursions operates a direct shuttle service from BSÍ bus terminal to Sky Lagoon. Departures from BSÍ are at 13:00, 15:00, 17:00, and 19:00. Return buses depart Sky Lagoon at: 14:30, 15:30, 16:30, 17:30, 18:30, 19:30, 20:30, and 21:30. You can book transportation when purchasing your Sky Lagoon tickets or book separately through www.re.is.`,
        metadata: {
          language: 'en',
          type: 'transportation',
          section: 'shuttle_service',
          priority: 'high',
          keywords: 'shuttle, bus, transport, BSI, terminal, Reykjavík Excursions'
        }
      },
      
      // Transfer options
      {
        content: `Transfer Options to Sky Lagoon: The main transfer option to Sky Lagoon is the Reykjavík Excursions shuttle service from BSÍ bus terminal. The bus departs BSÍ on the hour of your booking. Hotel pickup is available starting 30 minutes before your selected time. Return buses depart Sky Lagoon at regular intervals throughout the day. You can book transfers when purchasing Sky Lagoon tickets or separately through www.re.is.`,
        metadata: {
          language: 'en',
          type: 'transportation',
          section: 'transfer_options',
          priority: 'high',
          keywords: 'transfer, transportation, bus terminal, BSI, shuttle, getting there'
        }
      }
    ];
    
    // Add any additional transportation information from the knowledgeBase
    if (transportData.shuttle_service) {
      transportationChunks.push({
        content: `Sky Lagoon Shuttle Service Details: The shuttle service is operated by Reykjavík Excursions. Buses depart from BSÍ bus terminal at: ${transportData.shuttle_service.bsi_service?.departure_times?.join(', ') || '13:00, 15:00, 17:00, 19:00'}. ${transportData.shuttle_service.bsi_service?.timing || 'Bus departs BSÍ on the hour of your booking'}. Return buses depart from Sky Lagoon at: ${transportData.shuttle_service.return_service?.departure_times?.join(', ') || '14:30, 15:30, 16:30, 17:30, 18:30, 19:30, 20:30, 21:30'}.`,
        metadata: {
          language: 'en',
          type: 'transportation',
          section: 'shuttle_details',
          priority: 'high',
          keywords: 'shuttle service, bus schedule, BSI, bus terminal, departure times'
        }
      });
    }
    
    console.log(`Created ${transportationChunks.length} transportation chunks for re-embedding`);
    
    // Store the chunks in the vector database
    await bulkStoreEmbeddings(transportationChunks, 'en');
    
    console.log('Successfully re-embedded transportation information!');
  } catch (error) {
    console.error('Error re-embedding transportation information:', error);
  }
}

// Run the re-embedding process
reembedTransportation();
