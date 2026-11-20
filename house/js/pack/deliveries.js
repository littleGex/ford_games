// House pack: where post and parcels come and go at the Ford house (systems/deliveries.js runs the drivers).
//
// Like the elf's evening spots (elfspots.js): the engine asks "where does the van park, where's the post put?"
// and the pack answers. Plain data, no three.js, so Node tests can load it. Ground floor and the street:
// plan coordinates [x, z]; world positions and places where a thing goes [x, y, z].
import { FOOD_DELIVERY } from '../config.js';   // (the shopping's front-door spot: FOOD_DELIVERY.door)

const FOOD_VAN = [-3.4, 15.0];
export const DELIVERY = {
  vanSpot: [4.6, 0, 13.3],              // where the parcel driver gets out of the van
  vanPark: [6.6, 0, 15.0],              // the parcel van, parked in the street
  doorSpot: [3.92, 0, 9.85],            // the driver on our front step
  hallShelf: [3.7, 4.6],                // where the neighbours' parcel waits (ours goes by the stairs)
  streetZ: 12.1,                        // the neighbours walk round by the pavement
  neighbourParcelZ: 9.8,                // a parcel left on a neighbour's step
  foodVan: FOOD_VAN,                    // the food van parks up the street, past our car
  foodVanDriver: [FOOD_VAN[0] + 1.4, 13.6],                                     // where its driver gets out
  foodWalk: [[-2.0, 13.3], [3.7, 13.0], [3.7, 12.3], FOOD_DELIVERY.door],      // and walks up to the door
  courierWalk: [[3.7, 12.3], FOOD_DELIVERY.door],      // a courier with something we ordered, van to door
  post: { at: [1.75, 7.6], place: [1.65, 0.76, 7.6] },               // the post on the dining table
  parcel: { at: [3.75, 5.9], place: [3.75, 0, 5.9] },                 // our parcel, by the stairs in the hall
  card: { at: [1.75, 7.85], place: [1.6, 0.76, 7.9] },                // a missed-delivery card on the table
};
