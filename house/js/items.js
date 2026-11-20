// Engine behaviour for the items the player carries: putting them back at their home spot.
// What is in the house (every item's model, start position and level) lives in pack/items.js.

/** Put one item back at its home spot (as it was when the game loaded). */
export function sendHome(item) {
  const h = item.userData.home;
  if (item.parent !== h.parent) h.parent.attach(item);
  item.position.fromArray(h.pos);
  item.rotation.set(...h.rot);
  item.userData.level = h.level;
}

/** Start-of-day reset: every item back home, shown or hidden as at load, contents refilled. */
export function resetItems(items) {
  Object.values(items).forEach(item => {
    sendHome(item);
    item.visible = item.userData.home.visible;
    item.traverse(o => { if (o !== item && o.isGroup) o.visible = true; });   // food in the bag, laundry in the basket
  });
}
