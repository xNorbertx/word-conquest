import {normalizeJoker} from '../server/languages.mjs';

// Mobile keyboards can keep even one letter in composition until focus changes.
// Publish the letter immediately, but leave the composing field untouched so an
// IME can finish a replacement or a decomposed Swedish character (a + ring).
export function bindJokerInput(input,config,onLetter){
  let composing=false;
  input.type='text';input.inputMode='text';input.lang=config.language||'en';
  input.autocomplete='off';input.autocapitalize='characters';input.spellcheck=false;
  input.setAttribute('autocorrect','off');input.enterKeyHint='done';
  // Enforce one letter in the model, not maxlength's UTF-16 units mid-composition.
  const update=commit=>{
    const letter=normalizeJoker(input.value,config);
    if(commit&&input.value!==letter)input.value=letter;
    onLetter(letter);
  };
  input.oncompositionstart=()=>{composing=true;};
  input.oninput=e=>update(!composing&&!e.isComposing);
  input.oncompositionend=()=>{composing=false;update(true);};
  input.onchange=()=>update(!composing);
  input.onblur=()=>{composing=false;update(true);};
}
