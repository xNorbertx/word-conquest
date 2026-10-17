export const THEME_KEY='wc-theme';
export const THEME_COLOURS={light:'#f6f3eb',dark:'#191d18'};

// A device preference, deliberately independent of sign-in and saved game data.
export function createTheme({root,button,meta,storage=()=>localStorage,events=window,onChange=()=>{}}){
  let theme=root.dataset.theme==='dark'?'dark':'light',queue=Promise.resolve();
  const normalise=value=>value==='dark'?'dark':'light';
  function apply(value,persist=false){
    theme=normalise(value);root.dataset.theme=theme;
    button.setAttribute('aria-checked',String(theme==='dark'));
    meta?.setAttribute('content',THEME_COLOURS[theme]);
    if(persist)try{storage().setItem(THEME_KEY,theme);}catch{}
    // Keep asynchronous native chrome updates ordered even during quick toggles.
    const chosen=theme;queue=queue.then(()=>onChange(chosen)).catch(()=>{});
  }
  function restore(){let saved=theme;try{saved=storage().getItem(THEME_KEY);}catch{}apply(saved);}
  restore();button.onclick=()=>apply(theme==='dark'?'light':'dark',true);
  events.addEventListener('storage',event=>{
    if(event.key!==THEME_KEY&&event.key!==null)return;
    try{if(event.storageArea&&event.storageArea!==storage())return;}catch{return;}
    restore();
  });
  events.addEventListener('pageshow',event=>{if(event.persisted)restore();});
  return {get theme(){return theme;},settled:()=>queue};
}
