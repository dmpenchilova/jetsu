const STUB='const h={get:(t,k)=>k==="__esModule"?false:(k==="then"?undefined:new Proxy(function(){},h)),apply:()=>new Proxy(function(){},h)};const p=new Proxy(function(){},h);export default p;';
const names=['scroll-lock','gsap','@gsap/react','gsap/ScrollTrigger','gsap/all','overlayscrollbars','swiper','swiper/react','swiper/modules'];
export async function resolve(spec, ctx, next){
  if (names.includes(spec) || spec.startsWith('gsap/') || spec.startsWith('swiper/')) return { url: 'stub:'+spec, shortCircuit:true };
  return next(spec, ctx);
}
export async function load(url, context, nextLoad) {
  if (url.startsWith('stub:')) {
    const n = url.slice(5);
    let named='';
    if (n==='scroll-lock') named='export const addScrollableSelector=p,disablePageScroll=p,enablePageScroll=p,removeScrollableSelector=p,clearQueueScrollLocks=p,getScrollState=p;';
    if (n.startsWith('gsap')||n==='@gsap/react') named='export const gsap=p,ScrollTrigger=p,useGSAP=p,Draggable=p,ScrollToPlugin=p,ScrollSmoother=p,SplitText=p,Observer=p;';
    if (n.startsWith('swiper')) named='export const Swiper=p,SwiperSlide=p,Navigation=p,Pagination=p,Autoplay=p,FreeMode=p,Mousewheel=p,Scrollbar=p,A11y=p,EffectFade=p,Grid=p,Controller=p,Thumbs=p,Keyboard=p,Parallax=p,Virtual=p,Zoom=p,EffectCreative=p;';
    if (n==='overlayscrollbars') named='export const OverlayScrollbars=p;';
    return { format:'module', source: STUB+named, shortCircuit:true };
  }
  if (/\.(s?css|svg|png|jpe?g|webp|gif|mp4|woff2?)(\?.*)?$/.test(url)) {
    return { format: 'module', source: 'const p=new Proxy({}, {get:(t,k)=>k==="__esModule"?false:String(k)}); export default p;', shortCircuit: true };
  }
  return nextLoad(url, context);
}
