export const normalizeUsername=value=>typeof value==='string'?value.normalize('NFKC').trim():'';
export const usernameHint='Use 1–40 letters, numbers, spaces or . _ - ( ) \'.';
export function validUsername(value){return typeof value==='string'&&value===normalizeUsername(value)&&[...value].length>=1&&[...value].length<=40&&/^[\p{L}\p{N}_.() '\-]+$/u.test(value)&&/[\p{L}\p{N}]/u.test(value);}
export function requireUsername(value){const name=normalizeUsername(value);if(!validUsername(name))throw Object.assign(new Error(usernameHint),{code:'invalid_username'});return name;}
export async function signUpAccount(db,{email,password,redirectTo}){
  const result=await db.auth.signUp({email,password,options:{emailRedirectTo:redirectTo}});
  if(result.error)throw result.error;
  return result;
}
