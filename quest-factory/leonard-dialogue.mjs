// Approved dialogue. Presentation data only: never grants items or advances a run.
// Artwork keys are semantic references, not yet verified runtime asset paths.
export const LEONARD_DIALOGUE = [
  { id: 'introduction', trigger: 'quest-introduction', speaker: 'Bingles', artwork: 'bingles-pop-in',
    text: 'Hey, you! Could you lend a friend a hand—or a wing?\n\nMy mate Leonard has lost six eggs near the old church. He’s beside himself!\n\nA scarecrow helping a bird… don’t tell the others. I’ve got a reputation to protect!',
    buttons: [{ label: 'Let’s find Leonard!', action: 'show-leonard' }] },
  { id: 'meet-leonard', trigger: 'meet-leonard', speaker: 'Leonard', artwork: 'leonard-worried',
    text: 'Oh, thank goodness Bingles sent you! My six eggs have gone missing near the old church.\n\nI can’t leave without them. Could you please find all six and bring them back to me? I’ll wait right here.',
    buttons: [{ label: 'I’ll find your eggs!', action: 'confirm-talk' }] },
  { id: 'return-eggs', trigger: 'return-eggs-reward-confirmed', speaker: 'Leonard', artwork: 'leonard-happy',
    text: 'You found them—all six! Thank you for bringing them home safely.\n\nYou’ve been such a good friend. I’d like you to care for one of these eggs. There’s a little travelling companion inside, just waiting to meet you!\n\nFirst, we’ll need somewhere warm and cosy for it. Let’s get you a nest.',
    buttons: [{ label: 'What do I need?', action: 'show-materials' }] },
  { id: 'nest-materials', trigger: 'nest-materials', speaker: 'Leonard', artwork: 'leonard-happy',
    text: 'We’ll need six sticks for a sturdy nest and six pieces of cotton to make it cosy.\n\nLook for the sticks near the park I’ve marked on your map. Mr. Van Zant at the shop can sell you the cotton—all six pieces for 300 coins.\n\nYou can collect them in either order. Come back when you’ve got everything, and I’ll give you my nest recipe!',
    buttons: [{ label: 'I’m on it!', action: 'close' }] },
  { id: 'cotton-offer', trigger: 'cotton-seller-talk', speaker: 'Mr. Van Zant', artwork: 'mr-van-zant',
    text: 'Leonard sent you? Hardest-working bird I know. Up before sunrise, feathers rolled up—a real working-class man. Well… dove!\n\nCotton for a nest, eh? I’ve got just the thing—soft enough to keep a little egg snug.\n\nSix pieces will cost you 300 coins. Shall I wrap them up?',
    buttons: [{ label: 'Buy cotton · 300 coins', action: 'request-cotton-purchase' }, { label: 'Maybe later', action: 'close' }] },
  { id: 'cotton-purchased', trigger: 'cotton-purchase-confirmed', speaker: 'Mr. Van Zant', artwork: 'mr-van-zant',
    text: 'There you go—six pieces of my softest cotton. That little one will sleep better than I do!\n\nGive Leonard my regards. Tell him to put his feet up once in a while—even a working-class dove deserves a day off.',
    buttons: [{ label: 'Thanks, Mr. Van Zant!', action: 'close' }] },
  { id: 'nest-recipe', trigger: 'nest-recipe-reward-confirmed', speaker: 'Leonard', artwork: 'leonard-happy',
    text: 'Six sticks and six pieces of cotton—perfect! That little one’s going to have a lovely first home.\n\nHere’s my nest recipe. No fancy tools needed, just a little patience. Mind you, it’s easier when you’ve got hands instead of wings!\n\nYou’ll find it in your Crafting menu. Make the nest, then use it from your inventory to tuck the egg inside.',
    buttons: [{ label: 'Let’s build a nest!', action: 'open-crafting' }] },
  { id: 'incubate', trigger: 'nest-use-confirmed', speaker: 'Bingles', artwork: 'bingles-pop-in',
    text: 'Now that’s a cosy little nest! Almost makes me wish I wasn’t stuffed with straw.\n\nYour egg is tucked in snugly. It’ll take 24 hours to hatch, so go enjoy an adventure—I promise you don’t have to sit on it!\n\nYou can check its progress in your inventory, even after closing the game.',
    buttons: [{ label: 'Can’t wait to meet you!', action: 'close' }] },
  { id: 'hatched', trigger: 'bird-award-confirmed', speaker: 'Bingles', artwork: 'bingles-pop-in',
    text: 'Well, would you look at that! A little bundle of feathers—and already eyeing off my straw. That’s my stuffing, mate, not nesting material!\n\nYou’ve brought your first dove into the world. You’ll find your new companion in Collections → Birdhouse.\n\nLet’s go say hello!',
    buttons: [{ label: 'Open Birdhouse', action: 'open-birdhouse' }] }
];

export function getLeonardDialogue(trigger) {
  const entry = LEONARD_DIALOGUE.find(dialogue => dialogue.trigger === trigger);
  return entry ? structuredClone(entry) : null;
}
