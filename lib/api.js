export async function api(path, options={}) {
  const response=await fetch(`/api/${path}`,{credentials:'same-origin',...options,headers:{...(options.body && !(options.body instanceof FormData)?{'Content-Type':'application/json'}:{}),...options.headers}});
  const result=response.headers.get('content-type')?.includes('application/json')?await response.json():{error:'요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'};
  if(!response.ok)throw new Error(result.error||'요청을 처리하지 못했습니다.');
  return result;
}
