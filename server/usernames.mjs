// Small curated vocabularies keep suggestions readable and suitable for display.
const adjectives=['Autumn','Amber','Quiet','Happy','Gentle','Misty','Golden','Clever','Silver','Sunny','Merry','Cosy','Brave','Little','Wandering','Lucky'];
const nouns=['Otter','Owl','Finch','Fox','Maple','Robin','Badger','Birch','Willow','Wren','Sparrow','Meadow','Acorn','Clover','Fern','Hare'];
const randomInt=max=>crypto.getRandomValues(new Uint32Array(1))[0]%max;
export function randomUsername(pick=randomInt){return adjectives[pick(adjectives.length)]+nouns[pick(nouns.length)]+String(pick(10000)).padStart(4,'0');}
export async function suggestUsername(available,pick){for(let attempt=0;attempt<8;attempt++){const name=randomUsername(pick);if(await available(name))return name;}throw new Error('username_suggestion_busy');}
