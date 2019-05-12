export function changeToHTTPS(url: string) {
  return url.replace('http://assets.onova.co', 'https://assets.onova.co');
}

export function changeToThumb(url: string, higherRes = false) {
  if (higherRes) return url.replace('.jpg', '-thumb@2x.jpg');
  return url.replace('.jpg', '-thumb.jpg');
}

export function changeToGoogleApisThumb(url: string, higherRes = false) {
  let res = changeToHTTPS(url);
  res = changeToThumb(res, higherRes);
  return res;
}

export function truncate(str: string, length: number) {
  const regex = new RegExp(`(.{${length}}).+`);
  return str.replace(regex, '$1&hellip;');
}

export function formatCurrency(value: number, minDecimalPoints = 2) {
  if (!value) return 'n/a';

  return new Intl.NumberFormat('ua-UA', {
    minimumFractionDigits: minDecimalPoints,
    // tslint:disable-next-line: object-literal-sort-keys
    maximumFractionDigits: 2,
  }).format(value);
}

export function sleep(ms: number): Promise<any> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
