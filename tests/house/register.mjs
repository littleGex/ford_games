// Lets Node load the game's modules: the bare import 'three' is pointed at a small stand-in.
import { register } from 'node:module';
register('./three-loader.mjs', import.meta.url);
