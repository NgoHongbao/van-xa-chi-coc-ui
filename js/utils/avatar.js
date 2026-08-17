import { escapeHtml, initials } from './text.js';

const MEMBER_AVATARS = Object.freeze(Object.fromEntries(Object.entries({
  kimyumi: 'assets/avatars/kimyumi.png',
  'pánh gấu': 'assets/avatars/panh-gau.png',
  will: 'assets/avatars/will.png',
  'gz wakaba': 'assets/avatars/gz-wakaba.png',
  gzwakaba: 'assets/avatars/gz-wakaba.png',
  'gz_wakabayashi': 'assets/avatars/gz-wakaba.png',
  'gz wakabayashi': 'assets/avatars/gz-wakaba.png',
  'cừu bông': 'assets/avatars/cuu-bong.png',
  'cửu bồng': 'assets/avatars/cuu-bong.png',
  tomkaka: 'assets/avatars/tomkaka.png',
  'xàranahae': 'assets/avatars/xaranahae.png',
  'xàranghae': 'assets/avatars/xaranahae.png',
  'lệ hoa trì': 'assets/avatars/le-hoa-tri.png',
  'thích ăn phở': 'assets/avatars/thich-an-pho.png',
  'đời tệ với nó': 'assets/avatars/doi-te-voi-no.png',
  'tang trĩ': 'assets/avatars/tang-tri.png',
  'ngọc tú': 'assets/avatars/ngoc-tu.png',
  'tử nguyệt dao': 'assets/avatars/tu-nguyet-dao.png',
  'liên mị': 'assets/avatars/lien-mi.png',
  'chàng yêu yêu': 'assets/avatars/chang-yeu-yeu.png',
  'chang yêu yêu': 'assets/avatars/chang-yeu-yeu.png',
  'chang yeu yeu': 'assets/avatars/chang-yeu-yeu.png',
  '夕阳西下': 'assets/avatars/xi-yang-xi-xia.png',
  'gừng': 'assets/avatars/gung.png',
  'cửunguyệt': 'assets/avatars/cuu-nguyet.png',
  'tử tịch': 'assets/avatars/tu-tich.png',
  'huyết như ...': 'assets/avatars/huyet-nhu.png',
  hera: 'assets/avatars/hera.png',
  'dungcúc': 'assets/avatars/dung-cuc.png',
  lilianna: 'assets/avatars/lilianna.png',
  shirouz: 'assets/avatars/shirouz.png',
  'hổ chu kính': 'assets/avatars/ho-chu-kinh.png',
  'bấtquy': 'assets/avatars/bat-quy.png',
  'kiến quỷ': 'assets/avatars/kien-quy.png',
  'chu quân': 'assets/avatars/chu-quan.png',
  'thiênvân': 'assets/avatars/thien-van.png',
  cither: 'assets/avatars/cither.png',
  shirunuki: 'assets/avatars/shirunuki.png',
  'di phương': 'assets/avatars/di-phuong.png'
}).map(([name, src]) => [name, src.replace(/\.png$/i, '.webp')])));

export function memberAvatarSrc(member) {
  const name = String(member?.name || '');
  const key = name.trim().toLowerCase();
  const compactKey = key.replace(/[^a-z0-9]+/g, '');
  const src = MEMBER_AVATARS[key]
    || (compactKey === 'dungcc' ? 'assets/avatars/dung-cuc.png' : null)
    || (compactKey.includes('wakaba') ? 'assets/avatars/gz-wakaba.png' : null)
    || (key.startsWith('tử nguyệt d') ? 'assets/avatars/tu-nguyet-dao.png' : null)
    || (key.startsWith('chang yêu') ? 'assets/avatars/chang-yeu-yeu.png' : null)
    || (key.startsWith('huyết như') ? 'assets/avatars/huyet-nhu.png' : null);
  return src ? src.replace(/\.png$/i, '.webp') : null;
}

export function avatarContent(member) {
  const name = String(member?.name || '');
  const src = memberAvatarSrc(member);
  if (!src) return escapeHtml(initials(name));
  return `<img src="${src}" alt="Ảnh đại diện ${escapeHtml(name)}" loading="lazy" draggable="false">`;
}
