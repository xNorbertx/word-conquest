export const normalizeUsername=value=>typeof value==='string'?value.normalize('NFKC').trim():'';
export const usernameHint='1–40 characters. Letters, numbers and simple punctuation.';
export function validUsername(value){return typeof value==='string'&&value===normalizeUsername(value)&&[...value].length>=1&&[...value].length<=40&&/^[\p{L}\p{N}_.() '\-]+$/u.test(value)&&/[\p{L}\p{N}]/u.test(value);}
export function requireUsername(value){const name=normalizeUsername(value);if(!validUsername(name))throw Object.assign(new Error(usernameHint),{code:'invalid_username'});return name;}
export async function signUpWithUsername(db,{username,email,password,redirectTo}){
  const name=requireUsername(username);
  const available=async()=>{const {data,error}=await db.rpc('wc_username_available',{p_username:name});if(error)throw Error('We could not check that username. Please try again.');return data;};
  const taken=()=>Object.assign(new Error('That username is already taken. Try another.'),{code:'username_taken'});
  if(!await available())throw taken();
  const result=await db.auth.signUp({email,password,options:{emailRedirectTo:redirectTo,data:{username:name}}});
  if(result.error){
    // Auth hides database exception details. Resolve a lost reservation race
    // without masking unrelated delivery, rate-limit or connection errors.
    let free=true;try{free=await available();}catch{/* Preserve the original Auth error. */}
    if(!free)throw taken();throw result.error;
  }
  return result;
}
